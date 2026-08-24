/**
 * Contract Lifecycle Management (CLM) Toolkit — World-Class Solution
 *
 * Four integrated modules covering the complete contract lifecycle:
 * 1. Contract Inventory    — full contract register with status, value, and dates
 * 2. Renewal Pipeline      — upcoming renewals sorted by urgency with RAG alerts
 * 3. Value & Health        — per-contract health scoring, leakage, compliance
 * 4. Templates & Tools     — downloadable contract templates and checklists
 * 5. AI Contract Brief     — AI-generated portfolio analysis and renewal strategy
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { UNSPSC_SERVICES_SEGMENTS, unspscSegmentLabel } from '@/lib/unspscSegments';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Plus, Trash2, FileDown, Info, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, TrendingUp,
} from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';

interface CLMToolsProps { isAr: boolean; }

// ─── Types ────────────────────────────────────────────────────────────────────────────────
Type ContractStatus = 'active' | 'expiring-soon' | 'expired' | 'draft' | 'under-negotiation' | 'renewed';
type ContractType   = 'goods' | 'services' | 'framework' | 'msa' | 'nda' | 'lease' | 'it-saas' | 'logistics';
type HealthRating   = 'excellent' | 'good' | 'at-risk' | 'critical';

interface Contract {
  id: string;
  name: string;
  supplier: string;
  category: string;
  /** Optional UNSPSC services segment code (2-digit), Phase 1 -- see
   *  lib/unspscSegments.ts. Additive alongside free-text `category`; never
   *  auto-populated, manual selection only. */
  unspscSegmentCode?: string;
  /** Free-text fallback when the client's real category isn't one of the 16
   *  sourced UNSPSC segments yet (set when unspscSegmentCode === 'other').
   *  Captures what they were actually looking for -- a real signal for
   *  which segment/family to source and add next, not a fabricated code. */
  unspscSegmentOther?: string;
  type: ContractType;
  annualValue: number;
  totalValue: number;
  currency: 'SAR' | 'USD' | 'EUR' | 'AED';
  startDate: string;
  endDate: string;
  noticePeriodDays: number;
  autoRenewal: boolean;
  status: ContractStatus;
  performanceScore: number;  // 0–100
  deliveredValue: number;    // SAR - actual value delivered YTD vs contract value
  complianceScore: number;   // 0–100
  savingsRealized: number;   // SAR
  owner: string;
  notes: string;
  keyTerms: string;
  renewalDecision: 'renew' | 'renegotiate' | 'retender' | 'terminate' | 'undecided';
  /** Purchase volume (SAR) that must be reached to earn a negotiated rebate.
   *  Optional -- manual input, #179 Contract Value Tracker. Never fabricate a
   *  claimable status when this or purchaseVolume is missing (see
   *  claimableRebate() below). */
  rebateThreshold?: number;
  /** Actual purchase volume (SAR) recorded to date against this contract.
   *  Optional -- manual input, #179 Contract Value Tracker. */
  purchaseVolume?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────────
─

function nid() { return Math.random().toString(36).slice(2, 10); }

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function healthRating(c: Contract): HealthRating {
  const avg = (c.performanceScore + c.complianceScore) / 2;
  if (avg >= 80 && daysUntil(c.endDate) > 90) return 'excellent';
  if (avg >= 60) return 'good';
  if (avg >= 40 || daysUntil(c.endDate) <= 30) return 'at-risk';
  return 'critical';
}

/** Claimable-rebate flag -- #179 Contract Value Tracker.
 *  True only when BOTH rebateThreshold and purchaseVolume are present
 *  numbers, rebateThreshold > 0, and purchaseVolume has reached it.
 *  Never fabricate a claimable status from partial data: a missing field
 *  returns false so the UI shows no badge at all rather than a false
 *  negative or positive (Decision Record 8.7 honesty requirement). */
function claimableRebate(c: Contract): boolean {
  if (typeof c.rebateThreshold !== 'number' || typeof c.purchaseVolume !== 'number') return false;
  if (!(c.rebateThreshold > 0)) return false;
  return c.purchaseVolume >= c.rebateThreshold;
}

/** True when rebate tracking is even applicable to this contract (both
 *  fields entered), regardless of whether the threshold has been met yet --
 *  used to decide whether to show a "not yet reached" progress hint. */
function hasRebateTracking(c: Contract): boolean {
  return typeof c.rebateThreshold === 'number' && c.rebateThreshold > 0 && typeof c.purchaseVolume === 'number';
}

const HEALTH_META: Record<HealthRating, { label: string; labelAr: string; color: string; bg: string; border: string }> = {
  excellent: { label: 'Excellent', labelAr: 'ممتاز',  color: '#065f46', bg: '#d1fae5', border: '#10b981' },
  good:      { label: 'Good',      labelAr: 'جيد',    color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  'at-risk': { label: 'At Risk',   labelAr: 'في خطر', color: '#92400e', bg: '#fef3c7', border: '#d97706' },
  critical:  { label: 'Critical',  labelAr: 'حرج',    color: '#7f1d1d', bg: '#fee2e2', border: '#ef4444' },
};

function urgencyLabel(days: number, isAr: boolean): { text: string; color: string } {
  if (days < 0)   return { text: isAr ? 'منتهي' : 'Expired', color: '#6b7280' };
  if (days <= 14)  return { text: isAr ? `${days} يوم — عاجل جداً` : `${days}d — URGENT`, color: '#dc2626' };
  if (days <= 30)  return { text: isAr ? `${days} يوم — عاجل` : `${days}d — Urgent`, color: '#d97706' };
  if (days <= 90)  return { text: isAr ? `${days} يوم — قريباً` : `${days}d — Soon`, color: '#d97706' };
  return { text: isAr ? `${days} يوم` : `${days}d`, color: '#059669' };
}

const CONTRACT_TYPES: { id: ContractType; label: string; labelAr: string }[] = [
  { id: 'goods',              label: 'Supply of Goods',            labelAr: 'توريد بضائع'         },
  { id: 'services',           label: 'Services',                   labelAr: 'خدمات'               },
  { id: 'framework',          label: 'Framework Agreement',        labelAr: 'اتفاقية إطارية'       },
  { id: 'msa',                label: 'Master Service Agreement',   labelAr: 'اتفاقية خدمات رئيسية' },
  { id: 'nda',                label: 'Non-Disclosure Agreement',   labelAr: 'اتفاقية سرية'         },
  { id: 'lease',              label: 'Lease / Rental',             labelAr: 'إيجار / استئجار'      },
  { id: 'it-saas',            label: 'IT / SaaS Subscription',     labelAr: 'اشتراك برمجيات'       },
  { id: 'logistics',          label: 'Logistics / 3PL',            labelAr: 'لوجستيات / 3PL'      },
];

const STATUS_META: Record<ContractStatus, { label: string; labelAr: string; badge: string }> = {
  active:               { label: 'Active',              labelAr: 'نشط',              badge: 'bg-emerald-100 text-emerald-700' },
  'expiring-soon':      { label: 'Expiring Soon',       labelAr: 'ينتهي قريباً',     badge: 'bg-amber-100 text-amber-700' },
  expired:              { label: 'Expired',             labelAr: 'منتهٍ',            badge: 'bg-gray-100 text-gray-600' },
  draft:                { label: 'Draft',               labelAr: 'مسودة',            badge: 'bg-blue-100 text-blue-700' },
  'under-negotiation':  { label: 'Under Negotiation',   labelAr: 'قيد التفاوض',      badge: 'bg-purple-100 text-purple-700' },
  renewed:              { label: 'Renewed',             labelAr: 'مُجدَّد',           badge: 'bg-teal-100 text-teal-700' },
};

function defaultContract(): Contract {
  const today = new Date(); const end = new Date(today); end.setFullYear(end.getFullYear() + 1);
  return {
    id: nid(), name: '', supplier: '', category: '', type: 'services',
    annualValue: 0, totalValue: 0, currency: 'SAR',
    startDate: today.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10),
    noticePeriodDays: 90, autoRenewal: false, status: 'active',
    performanceScore: 80, deliveredValue: 0, complianceScore: 90,
    savingsRealized: 0, owner: '', notes: '', keyTerms: '', renewalDecision: 'undecided',
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const SK_CONTRACTS = 'isc-tool-clm-contracts-v2';
function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

// ─── Template generators ──────────────────────────────────────────────────────────
†

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;chl�20