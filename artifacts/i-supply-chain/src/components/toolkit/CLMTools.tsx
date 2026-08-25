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
import { GOVERNING_LAW_TRACKS, governingLawTrackLabel, checkGoverningLawMismatch, type GoverningLawTrack } from '@/lib/clmLegalTrack';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractStatus = 'active' | 'expiring-soon' | 'expired' | 'draft' | 'under-negotiation' | 'renewed';
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
  /** Government or private counterparty -- determines the Tier 0 Saudi
   *  anchor (GTPL vs CTL). Optional, manual input. Module 01, #386. */
  counterpartyType?: 'government' | 'private';
  /** Governing-law track named by the contract itself, if any. Optional,
   *  manual input -- never inferred. Module 01, #386. */
  governingLawClause?: GoverningLawTrack;
  /** Free-text jurisdiction where the counterparty is domiciled. Optional,
   *  manual input. Module 01, #386. */
  counterpartyJurisdiction?: string;
  /** Free-text location where the contract is actually performed/delivered.
   *  Optional, manual input. Module 01, #386. */
  performanceLocation?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Template generators ──────────────────────────────────────────────────────

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

const CONTRACT_CSV_TEMPLATE =
  'Contract Name,Supplier,Category,UNSPSC Segment Code (optional),Type,Annual Value (SAR),Total Value (SAR),Start Date,End Date,Notice Period (days),Auto-Renewal (Yes/No),Status,Performance Score (0-100),Compliance Score (0-100),Owner,Notes\n' +
  'IT Infrastructure Support,Saudi IT Solutions,IT,81,services,480000,1440000,2024-01-01,2026-12-31,90,No,active,85,90,IT Director,3-year support agreement\n' +
  'Packaging Materials Framework,Gulf Pack Co,Packaging,,framework,1200000,2400000,2024-07-01,2026-06-30,60,Yes,active,78,95,Procurement Manager,Annual volume commitment\n' +
  'Office Lease — Riyadh HQ,Al Akaria,Real Estate,,lease,360000,1800000,2022-01-01,2026-12-31,180,No,expiring-soon,100,100,Admin Director,Renewal under review\n';

const CONTRACT_TERMS_TEMPLATE = `================================================================================
STANDARD CONTRACT TERMS CHECKLIST — SUPPLY CHAIN
I Supply Chain | Contract Lifecycle Management Toolkit
================================================================================

Use this checklist when reviewing, drafting, or negotiating a supply contract.
Each item should be explicitly addressed in the contract or negotiation.

────────────────────────────────────────────────────────────────────────────────
SECTION 1 — PARTIES & DEFINITIONS
────────────────────────────────────────────────────────────────────────────────
☐ Full legal name and CR number of both parties
☐ Authorised signatories clearly named
☐ Definitions section covers all key terms used in the contract
☐ Governing law and jurisdiction stated (Saudi Law recommended for KSA contracts)
☐ Language of the contract and which version prevails (Arabic / English)

────────────────────────────────────────────────────────────────────────────────
SECTION 2 — SCOPE OF SUPPLY / SERVICES
────────────────────────────────────────────────────────────────────────────────
☐ Detailed specification or Statement of Work (SOW) attached
☐ Quantities / volumes stated (or formula for call-off volumes)
☐ Delivery locations specified
☐ Service levels / SLAs defined with measurable KPIs
☐ Exclusions from scope clearly listed
☐ Change control process defined (how scope changes are agreed and priced)

────────────────────────────────────────────────────────────────────────────────
SECTION 3 — PRICING & PAYMENT
────────────────────────────────────────────────────────────────────────────────
☐ Unit prices / rate card attached
☐ Pricing validity period stated
☐ Price review mechanism (annual, index-linked, or mutual agreement)
☐ VAT treatment stated (15% KSA VAT, who is responsible)
☐ Invoicing requirements (PO reference, delivery note, inspection sign-off)
☐ Payment terms stated (standard: Net 30 from invoice)
☐ Late payment interest clause (if applicable)
☐ Volume rebate / discount structure defined
☐ Currency and FX risk allocation stated

────────────────────────────────────────────────────────────────────────────────
SECTION 4 — DELIVERY & PERFORMANCE
────────────────────────────────────────────────────────────────────────────────
☐ Delivery terms (Incoterms if goods: DAP / DDP)
☐ Lead times defined and binding
☐ OTIF (on-time in-full) target stated
☐ Acceptance criteria and inspection process defined
☐ Warranty period and remedy process
☐ Performance review cadence (monthly/quarterly scorecard)

────────────────────────────────────────────────────────────────────────────────
SECTION 5 — LIABILITY & INDEMNITY
────────────────────────────────────────────────────────────────────────────────
☐ Limitation of liability cap stated (typically 12 months' contract value)
☐ Consequential / indirect loss exclusion clause
☐ Indemnity obligations defined (who indemnifies whom for what)
☐ Product liability / professional indemnity insurance requirements
☐ Third-party claims procedure

────────────────────────────────────────────────────────────────────────────────
SECTION 6 — TERM, TERMINATION & EXIT
────────────────────────────────────────────────────────────────────────────────
☐ Contract start and end dates stated
☐ Auto-renewal clause (include: opt-out notice period, maximum auto-renewals)
☐ Termination for convenience clause (notice period: typically 30–90 days)
☐ Termination for cause (material breach, insolvency, change of control)
☐ Exit obligations (data return, handover period, IP transfer)
☐ Survival clause (which terms survive termination)

────────────────────────────────────────────────────────────────────────────────
SECTION 7 — COMPLIANCE & RISK
────────────────────────────────────────────────────────────────────────────────
☐ Iktva / local content obligations stated (if applicable to supplier)
☐ ZATCA / VAT registration confirmation required
☐ Anti-bribery and anti-corruption clause
☐ Modern Slavery / ethical sourcing compliance
☐ Data protection obligations (PDPL compliance for KSA)
☐ Confidentiality clause with survival period
☐ Insurance requirements (minimum cover levels specified)
☐ Business continuity / disaster recovery requirements
☐ Audit rights clause

────────────────────────────────────────────────────────────────────────────────
SECTION 8 — DISPUTE RESOLUTION
────────────────────────────────────────────────────────────────────────────────
☐ Escalation process before formal dispute
☐ Mediation / arbitration clause (SCCA recommended for KSA)
☐ Expert determination for technical disputes
☐ Notice requirements for disputes

================================================================================
END OF CONTRACT TERMS CHECKLIST
================================================================================`;

const RENEWAL_PLAYBOOK = `================================================================================
CONTRACT RENEWAL PLAYBOOK — STEP-BY-STEP GUIDE
I Supply Chain | Contract Lifecycle Management Toolkit
================================================================================

USE THIS PLAYBOOK to structure every contract renewal. Start 6–12 months before
expiry for strategic contracts, 3–6 months for standard contracts.

────────────────────────────────────────────────────────────────────────────────
STAGE 1 — CONTRACT REVIEW (6–12 months before expiry)
────────────────────────────────────────────────────────────────────────────────
☐ Pull full contract register — confirm exact expiry date and notice period
☐ Retrieve supplier performance scorecard (OTIF, quality, complaints, savings)
☐ Review spend vs. contracted value — was the contract fully utilised?
☐ Identify any compliance gaps or legal clause issues to correct
☐ Assess business need: Is this still the right scope / volume?

Decision gate: Renew / Renegotiate / Retender / Terminate?

────────────────────────────────────────────────────────────────────────────────
STAGE 2 — MARKET CHECK (5–10 months before expiry)
────────────────────────────────────────────────────────────────────────────────
☐ Run a market scan — are there new or alternative suppliers worth testing?
☐ Obtain 2–3 informal market quotes (even if renewing, use as benchmark)
☐ Check commodity price indices for price movement vs. current contract rates
☐ Review Kraljic position — has the strategic importance of this contract changed?
☐ Check local content / Iktva requirements (may have changed)

────────────────────────────────────────────────────────────────────────────────
STAGE 3 — NEGOTIATION PREPARATION (3–6 months before expiry)
────────────────────────────────────────────────────────────────────────────────
☐ Build negotiation file:
    - Should-cost analysis (what should this cost based on market data?)
    - BATNA (Best Alternative to Negotiated Agreement): what if talks break down?
    - Concession plan: what will you give, in what order, and for what return?
    - Walk-away price: the absolute limit
☐ Prepare negotiation agenda: price, scope, SLAs, payment terms, duration
☐ Brief internal stakeholders (operations, finance, legal) on negotiation position
☐ Check: Does the supplier have leverage? (sole source, long qualification, IP lock-in)

────────────────────────────────────────────────────────────────────────────────
STAGE 4 — NEGOTIATION (2–4 months before expiry)
────────────────────────────────────────────────────────────────────────────────
☐ Open with data: share performance scorecard, compliment strengths first
☐ Anchor on your target: state your desired outcome early
☐ Trade concessions — link any give to a corresponding get
☐ Agree all commercial and legal changes before drafting amendments
☐ Document agreed positions in a Term Sheet or MOU before legal drafting
☐ Escalate to executive level if commercial terms are not moving

Key leverage levers:
  Volume commitment  |  Payment terms improvement  |  Longer term (multi-year)
  Reference / case study  |  Early signature  |  Reduced spec / simplified service

────────────────────────────────────────────────────────────────────────────────
STAGE 5 — EXECUTION & HANDOVER (0–2 months before expiry)
────────────────────────────────────────────────────────────────────────────────
☐ Legal review of amended contract terms
☐ Internal approval per Delegation of Authority (DoA)
☐ Signed contract executed by both parties before current contract expires
☐ Update contract register with new dates, values, and owner
☐ Brief operations team on any scope or SLA changes
☐ Set system alerts for next renewal cycle (start 9 months before new expiry)
☐ File signed contract in central contract repository

================================================================================
SAVINGS BENCHMARKS (TARGET THESE IN NEGOTIATION):
  Standard renewal (same supplier, no leverage): 0–3% cost saving
  Renewal with competitive tension (market check used): 3–7% saving
  Full retender: 5–15% saving depending on market conditions
  Specification optimisation: 2–10% saving (independent of supplier)
================================================================================`;

const CLM_TEMPLATES = [
  { id: 'register',  icon: '📋', label: 'Contract Register CSV',      labelAr: 'سجل العقود CSV',           desc: 'Pre-formatted CSV for uploading contracts into this tool.',                                          descAr: 'نموذج CSV لرفع العقود إلى هذه الأداة.',                                    fn: () => downloadCsv('contract-register-template.csv', CONTRACT_CSV_TEMPLATE) },
  { id: 'terms',     icon: '✅', label: 'Contract Terms Checklist',   labelAr: 'قائمة بنود العقد',         desc: 'Comprehensive 8-section checklist for reviewing or drafting supply contracts under Saudi law.',     descAr: 'قائمة مرجعية شاملة لمراجعة أو صياغة عقود التوريد وفق القانون السعودي.',   fn: () => downloadText('contract-terms-checklist.txt', CONTRACT_TERMS_TEMPLATE) },
  { id: 'playbook',  icon: '🎯', label: 'Renewal Playbook',          labelAr: 'دليل تجديد العقود',         desc: '5-stage contract renewal playbook with negotiation preparation, concession plan, and savings benchmarks.', descAr: 'دليل تجديد العقود من 5 مراحل مع التحضير للتفاوض وخطة التنازلات ومعايير الوفورات.', fn: () => downloadText('contract-renewal-playbook.txt', RENEWAL_PLAYBOOK) },
  { id: 'kpis',      icon: '📊', label: 'Contract KPI Scorecard',    labelAr: 'بطاقة أداء العقد',          desc: 'Monthly supplier performance scorecard aligned to contract SLAs — quality, OTIF, responsiveness, compliance.', descAr: 'بطاقة أداء شهرية للمورد متوافقة مع مستويات الخدمة المتعاقد عليها.', fn: () => downloadCsv('contract-kpi-scorecard.csv', 'Month,Supplier,Contract Ref,KPI: OTIF %,Target,RAG,KPI: Defect Rate %,Target,RAG,KPI: Invoice Accuracy %,Target,RAG,KPI: Responsiveness (hrs),Target,RAG,Overall Score /100,Score vs Last Month,Notes\nJan 2025,Supplier A,REF-001,94%,95%,Amber,0.3%,<0.5%,Green,98%,>95%,Green,4,<8,Green,87,,\nFeb 2025,Supplier A,REF-001,97%,95%,Green,0.1%,<0.5%,Green,99%,>95%,Green,3,<8,Green,93,+6,Improved significantly\n') },
];

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'inventory' | 'pipeline' | 'health' | 'templates' | 'ai';

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContractHealthChecker({ isAr }: CLMToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [contracts, setContracts] = useState<Contract[]>(() => loadJson(SK_CONTRACTS, []));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [renewalFilter, setRenewalFilter] = useState<number>(180); // show renewals due in N days

  // ── Server-sync (backend persistence, #179 Contract Value Tracker,
  //    2026-08-24) ── Whole-list sync against /api/clm-contracts, mirroring
  //    the debounced-PUT / bootstrap-merge pattern already proven in
  //    ProcurementTools.tsx for the TCO Engine (tco_analyses) and Spend
  //    Variance Finder (spend_variance_analyses), adapted for CLM's flat
  //    contract list (no "named analysis" / activeId concept here -- the
  //    whole `contracts` array IS the synced state). Each Contract's own
  //    client-generated `id` (via nid()) IS the value sent to/received from
  //    the server as `clientKey` -- the server's own serial row id is
  //    internal bookkeeping only, never surfaced to the frontend, so there
  //    is no ID-reconciliation step needed after a sync. Logged-out users
  //    keep working entirely off localStorage, exactly as before; nothing
  //    here changes guest behaviour.
  const { user } = useAuth();
  const [clmSyncStatus, setClmSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const clmServerLoadedForUserId = useRef<number | null>(null);
  const clmBootstrapSettled = useRef(false);
  const clmLocalWinsDuringBootstrap = useRef(false);
  const clmSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contractsRef = useRef<Contract[]>(contracts);
  contractsRef.current = contracts;

  interface ServerClmRow { id: number; clientKey: string; name: string; data: Contract; updatedAt: string; }
  function serverRowToContract(row: ServerClmRow): Contract {
    // Prefer clientKey/name (the server's canonical indexing columns) over
    // whatever may be embedded in `data`, in case they ever drift.
    return { ...row.data, id: row.clientKey, name: row.name };
  }
  function contractToPayload(c: Contract) {
    return { clientKey: c.id, name: c.name, data: c };
  }

  const syncClmToServerImmediate = (list: Contract[]) => {
    if (!user) return;
    setClmSyncStatus('saving');
    if (clmSyncTimerRef.current) clearTimeout(clmSyncTimerRef.current);
    clmSyncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/clm-contracts`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contracts: list.map(contractToPayload) }),
        });
        setClmSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setClmSyncStatus('idle'), 2500);
      } catch {
        setClmSyncStatus('error');
      }
    }, 400);
  };
  const syncClmToServer = (list: Contract[]) => {
    if (!user) return;
    if (!clmBootstrapSettled.current) {
      // Bootstrap GET hasn't resolved yet -- don't race it with a PUT.
      clmLocalWinsDuringBootstrap.current = true;
      return;
    }
    syncClmToServerImmediate(list);
  };

  const saveContracts = (c: Contract[]) => {
    setContracts(c);
    safeSetItem(SK_CONTRACTS, JSON.stringify(c));
    syncClmToServer(c);
  };
  const updateContract = (id: string, field: keyof Contract, value: string | number | boolean | undefined) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, [field]: value } : c));

  /* Bootstrap: on login (or account switch), pull the server's saved
   * contracts. Server-has-data wins over localStorage UNLESS the user has
   * already edited something in this session while the GET was in flight.
   * Server-empty means "first time syncing this account" -- upload whatever
   * is currently in localStorage instead of discarding it. A failed fetch
   * (offline, server down) leaves localStorage as the sole source of truth
   * and never breaks the UI. */
  useEffect(() => {
    if (!user) {
      if (clmServerLoadedForUserId.current !== null) {
        clmServerLoadedForUserId.current = null;
        clmBootstrapSettled.current = false;
        clmLocalWinsDuringBootstrap.current = false;
        setClmSyncStatus('idle');
      }
      return;
    }
    if (clmServerLoadedForUserId.current === user.id) return;
    clmServerLoadedForUserId.current = user.id;
    clmBootstrapSettled.current = false;
    clmLocalWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/clm-contracts`, { credentials: 'include' });
        if (clmServerLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; contracts: ServerClmRow[] };
          if (data.ok && Array.isArray(data.contracts) && data.contracts.length > 0) {
            if (!clmLocalWinsDuringBootstrap.current) {
              const converted = data.contracts.map(serverRowToContract);
              setContracts(converted);
              safeSetItem(SK_CONTRACTS, JSON.stringify(converted));
            }
          } else if (!clmLocalWinsDuringBootstrap.current) {
            // Server has nothing yet for this account -- upload local state
            // as the initial sync rather than leaving the server empty.
            const current = contractsRef.current;
            if (current && current.length > 0) syncClmToServerImmediate(current);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      clmBootstrapSettled.current = true;
      if (clmLocalWinsDuringBootstrap.current) {
        const current = contractsRef.current;
        if (current) syncClmToServerImmediate(current);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const addContract = () => saveContracts([...contracts, defaultContract()]);
  const removeContract = (id: string) => saveContracts(contracts.filter(c => c.id !== id));
  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  // Derived metrics
  const totalAnnualValue = useMemo(() => contracts.reduce((s, c) => s + (c.annualValue || 0), 0), [contracts]);
  const activeContracts  = useMemo(() => contracts.filter(c => c.status === 'active' || c.status === 'expiring-soon'), [contracts]);
  const criticalHealth   = useMemo(() => contracts.filter(c => healthRating(c) === 'critical'), [contracts]);
  const atRiskHealth     = useMemo(() => contracts.filter(c => healthRating(c) === 'at-risk'), [contracts]);
  const upcomingRenewals = useMemo(() =>
    contracts
      .filter(c => { const d = daysUntil(c.endDate); return d >= 0 && d <= renewalFilter; })
      .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate)),
    [contracts, renewalFilter]);
  const expiredContracts = useMemo(() => contracts.filter(c => daysUntil(c.endDate) < 0 && c.status !== 'renewed'), [contracts]);
  const totalSavings     = useMemo(() => contracts.reduce((s, c) => s + (c.savingsRealized || 0), 0), [contracts]);
  const claimableRebateContracts = useMemo(() => contracts.filter(claimableRebate), [contracts]);

  // Health bar chart data
  const healthData = useMemo(() => [
    { label: isAr ? 'ممتاز' : 'Excellent', count: contracts.filter(c => healthRating(c) === 'excellent').length, color: '#10b981' },
    { label: isAr ? 'جيد' : 'Good',        count: contracts.filter(c => healthRating(c) === 'good').length,      color: '#3b82f6' },
    { label: isAr ? 'في خطر' : 'At Risk',  count: contracts.filter(c => healthRating(c) === 'at-risk').length,  color: '#d97706' },
    { label: isAr ? 'حرج' : 'Critical',    count: contracts.filter(c => healthRating(c) === 'critical').length, color: '#ef4444' },
  ], [contracts, isAr]);

  // AI prompt
  const buildPrompt = useCallback(() => {
    const summary = contracts.map(c => {
      const days = daysUntil(c.endDate);
      const h = healthRating(c);
      return `${c.name} | ${c.supplier} | SAR ${c.annualValue.toLocaleString()}/yr | Expires ${c.endDate} (${days} days) | Perf: ${c.performanceScore}% | Health: ${h} | Decision: ${c.renewalDecision}`;
    }).join('\n');
    return [
      '## Contract Portfolio Analysis',
      `Total contracts: ${contracts.length} | Active: ${activeContracts.length} | Total annual value: SAR ${totalAnnualValue.toLocaleString()}`,
      `Critical health: ${criticalHealth.length} | At-risk: ${atRiskHealth.length} | Expiring within 90 days: ${contracts.filter(c => daysUntil(c.endDate) >= 0 && daysUntil(c.endDate) <= 90).length}`,
      `Total savings realised: SAR ${totalSavings.toLocaleString()}`,
      '',
      '## Contract Register Summary',
      summary || '(No contracts entered)',
      '',
      '## Your Task',
      'Generate a 4–5 paragraph executive CLM portfolio report:',
      '1. Portfolio overview: size, value concentration, and overall contract health',
      '2. Renewal urgency analysis: which contracts need immediate action and why',
      '3. Performance insights: which supplier relationships are healthy vs. at risk',
      '4. Value leakage risks: contracts without performance tracking, expired with no action, auto-renewals not reviewed',
      '5. 90-day action plan for contract renewals and performance interventions [URGENT] / [HIGH] / [MEDIUM]',
    ].join('\n');
  }, [contracts, activeContracts, criticalHealth, atRiskHealth, totalAnnualValue, totalSavings]);

  const aiPlan = useAIPlan(buildPrompt, isAr, 'clm-portfolio', contracts.length > 0);

  const tabs: { id: Tab; icon: string; label: string; labelAr: string }[] = [
    { id: 'inventory',  icon: '📋', label: 'Contract Inventory',  labelAr: 'مخزون العقود'       },
    { id: 'pipeline',   icon: '⏰', label: 'Renewal Pipeline',    labelAr: 'مسار التجديد'        },
    { id: 'health',     icon: '💚', label: 'Portfolio Health',    labelAr: 'صحة المحفظة'         },
    { id: 'templates',  icon: '📥', label: 'Templates & Tools',   labelAr: 'القوالب والأدوات'    },
    { id: 'ai',         icon: '✨', label: 'AI Portfolio Brief',  labelAr: 'تقرير المحفظة AI'    },
  ];

  const tabListRef = useRef<HTMLDivElement>(null);
  const handleTabKey = useCallback((e: React.KeyboardEvent, idx: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') {
      next = (idx + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      next = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(tabs[next].id);
    (tabListRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  }, [tabs]);

  return (
    <div className="print-zone-clm space-y-4">
      {/* Print-only header */}
      <div className="hidden">
        {isAr ? 'فاحص صحة العقود' : 'Contract Health Checker'}
      </div>
      <div className="hidden">
        {isAr ? `تاريخ التصدير: ${new Date().toLocaleDateString()}` : `Exported: ${new Date().toLocaleDateString()}`}
      </div>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{isAr ? 'إدارة دورة حياة العقود' : 'Contract Lifecycle Management'}</p>
        <button
          onClick={() => { document.body.setAttribute('data-print', 'clm'); window.addEventListener('afterprint', () => document.body.removeAttribute('data-print'), { once: true }); window.print(); }}
          className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold text-white bg-[#082C6B] hover:opacity-90 transition-colors">
          {isAr ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>
      {/* Tab bar */}
      <div role="tablist" ref={tabListRef} className="flex gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 overflow-x-auto">
        {tabs.map((t, idx) => (
          <button key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            tabIndex={activeTab === t.id ? 0 : -1}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKey(e, idx)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#082C6B] text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
            <span>{t.icon}</span><span className="hidden sm:inline">{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: Contract Inventory ── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Summary cards */}
          {contracts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: isAr ? 'إجمالي العقود' : 'Total Contracts',     value: contracts.length,                       color: '#082C6B' },
                { label: isAr ? 'القيمة السنوية' : 'Annual Value',         value: `SAR ${(totalAnnualValue/1000000).toFixed(1)}M`, color: '#4f46e5' },
                { label: isAr ? 'وفورات محقّقة' : 'Savings Realised',     value: `SAR ${(totalSavings/1000).toFixed(0)}K`,      color: '#059669' },
                { label: isAr ? 'تنتهي خلال 90 يوم' : 'Expiring ≤90d',    value: contracts.filter(c => { const d = daysUntil(c.endDate); return d >= 0 && d <= 90; }).length, color: '#d97706' },
                { label: isAr ? 'خصومات مستحقة للمطالبة' : 'Claimable Rebates', value: claimableRebateContracts.length, color: '#059669' },
              ].map(c => (
                <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-[11px] text-slate-500 font-medium">{c.label}</p>
                  <p className="text-xl font-black mt-1" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {contracts.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">{isAr ? 'أضف عقداً باستخدام الزر أدناه، أو حمّل نموذج CSV من تبويب القوالب.' : 'Add a contract using the button below, or download the CSV template from the Templates tab.'}</p>
            </div>
          )}

          {/* Contract cards */}
          <div className="space-y-2">
            {contracts.map(c => {
              const days = daysUntil(c.endDate);
              const urgency = urgencyLabel(days, isAr);
              const h = healthRating(c);
              const hm = HEALTH_META[h];
              const isOpen = expandedIds.has(c.id);
              const statusMeta = STATUS_META[c.status];
              return (
                <div key={c.id} className="bg-white border-2 rounded-2xl shadow-sm overflow-hidden" style={{ borderColor: hm.border }}>
                  <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={() => toggleExpand(c.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.badge}`}>{isAr ? statusMeta.labelAr : statusMeta.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: hm.bg, color: hm.color }}>{isAr ? hm.labelAr : hm.label}</span>
                        {expiredContracts.includes(c) && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{isAr ? 'تحتاج إجراء عاجل' : 'ACTION NEEDED'}</span>}
                        {claimableRebate(c) && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{isAr ? 'خصم مستحق للمطالبة' : 'CLAIMABLE REBATE'}</span>}
                        {checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).flagged && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full" title={isAr ? checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).reasonAr : checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).reasonEn}>{isAr ? 'قانون حاكم غير متطابق' : 'GOVERNING-LAW MISMATCH'}</span>}
                      </div>
                      <p className="font-bold text-sm text-slate-800 mt-1">{c.name || (isAr ? '(اسم العقد)' : '(Contract name)')}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.supplier} {c.category ? `· ${c.category}` : ''} {c.unspscSegmentCode && c.unspscSegmentCode !== 'other' ? `· UNSPSC ${c.unspscSegmentCode} (${unspscSegmentLabel(c.unspscSegmentCode, isAr)})` : ''} {c.unspscSegmentCode === 'other' && c.unspscSegmentOther ? `· UNSPSC: ${c.unspscSegmentOther} (${isAr ? 'غير مصنّف بعد' : 'not yet classified'})` : ''} {c.annualValue ? `· SAR ${c.annualValue.toLocaleString()}/yr` : ''}</p>
                    </div>
                    <div className="shrink-0 text-right flex items-center gap-3">
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-400">{isAr ? 'ينتهي' : 'Expires'}</p>
                        <p className="text-xs font-bold" style={{ color: urgency.color }}>{urgency.text}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeContract(c.id); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: isAr ? 'اسم العقد' : 'Contract Name',           field: 'name',              type: 'text',   placeholder: isAr ? 'اسم العقد' : 'Contract name' },
                        { label: isAr ? 'المورد' : 'Supplier',                    field: 'supplier',          type: 'text',   placeholder: isAr ? 'اسم المورد' : 'Supplier name' },
                        { label: isAr ? 'الفئة' : 'Category',                    field: 'category',          type: 'text',   placeholder: isAr ? 'الفئة' : 'e.g. IT, Logistics' },
                        { label: isAr ? 'المسؤول' : 'Owner',                     field: 'owner',             type: 'text',   placeholder: isAr ? 'اسم المسؤول' : 'Contract owner' },
                        { label: isAr ? 'القيمة السنوية (ر.س)' : 'Annual Value (SAR)', field: 'annualValue',  type: 'number', placeholder: '0' },
                        { label: isAr ? 'القيمة الإجمالية (ر.س)' : 'Total Value (SAR)', field: 'totalValue', type: 'number', placeholder: '0' },
                        { label: isAr ? 'الوفورات المحقّقة (ر.س)' : 'Savings Realised (SAR)', field: 'savingsRealized', type: 'number', placeholder: '0' },
                        { label: isAr ? 'فترة الإشعار (أيام)' : 'Notice Period (days)', field: 'noticePeriodDays', type: 'number', placeholder: '90' },
                        { label: isAr ? 'حد استحقاق الخصم (حجم الشراء)' : 'Rebate Threshold (Purchase Volume)', field: 'rebateThreshold', type: 'number', placeholder: isAr ? 'اتركه فارغاً إن لم ينطبق' : 'Leave blank if N/A', optional: true },
                        { label: isAr ? 'حجم الشراء حتى الآن' : 'Purchase Volume To Date', field: 'purchaseVolume', type: 'number', placeholder: isAr ? 'اتركه فارغاً إن لم ينطبق' : 'Leave blank if N/A', optional: true },
                      ].map(f => (
                        <div key={f.field} className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{f.label}</label>
                          <input type={f.type} value={((c as unknown as Record<string, string | number | boolean | undefined>)[f.field] ?? '') as string | number}
                            onChange={e => {
                              const raw = e.target.value;
                              let value: string | number | undefined;
                              if (f.type === 'number') {
                                if (f.optional && raw === '') { value = undefined; }
                                else { const parsed = parseFloat(raw); value = f.optional ? (isNaN(parsed) ? undefined : parsed) : (parsed || 0); }
                              } else { value = raw; }
                              updateContract(c.id, f.field as keyof Contract, value);
                            }}
                            placeholder={f.placeholder}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'تاريخ البداية' : 'Start Date'}</label>
                        <input type="date" value={c.startDate} onChange={e => updateContract(c.id, 'startDate', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'تاريخ الانتهاء' : 'End Date'}</label>
                        <input type="date" value={c.endDate} onChange={e => updateContract(c.id, 'endDate', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'نوع العقد' : 'Contract Type'}</label>
                        <select value={c.type} onChange={e => updateContract(c.id, 'type', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          {CONTRACT_TYPES.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`unspsc-${c.id}`} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'قطاع UNSPSC (اختياري)' : 'UNSPSC Segment (optional)'}</label>
                        <select id={`unspsc-${c.id}`} value={c.unspscSegmentCode ?? ''} onChange={e => updateContract(c.id, 'unspscSegmentCode', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {UNSPSC_SERVICES_SEGMENTS.map(s => <option key={s.code} value={s.code}>{s.code} -- {isAr ? s.labelAr : s.label}</option>)}
                          <option value="other">{isAr ? 'أخرى / غير مدرجة بعد...' : 'Other / not listed yet...'}</option>
                        </select>
                        {c.unspscSegmentCode === 'other' ? (
                          <input type="text" value={c.unspscSegmentOther ?? ''} onChange={e => updateContract(c.id, 'unspscSegmentOther', e.target.value || undefined)}
                            placeholder={isAr ? 'ما الفئة التي كنت تبحث عنها؟' : 'What category were you looking for?'}
                            aria-label={isAr ? 'قطاع UNSPSC آخر -- ما الفئة التي كنت تبحث عنها؟' : 'Other UNSPSC segment -- what category were you looking for?'}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                        ) : null}
                        <p className="text-[10px] text-slate-400">{isAr ? 'تصنيف خدمات UNSPSC الرسمي (16 قطاعاً مصدره حتى الآن) -- إضافي إلى حقل الفئة الحر. اختر "أخرى" إذا لم تجد ما تبحث عنه' : 'Real UNSPSC services classification (16 sourced segments so far) -- additive to the free-text Category field above. Pick "Other" if what you need isn\'t listed yet'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'نوع الطرف المقابل (اختياري)' : 'Counterparty Type (optional)'}</label>
                        <select value={c.counterpartyType ?? ''} onChange={e => updateContract(c.id, 'counterpartyType', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          <option value="government">{isAr ? 'جهة حكومية' : 'Government'}</option>
                          <option value="private">{isAr ? 'طرف خاص' : 'Private'}</option>
                        </select>
                        <p className="text-[10px] text-slate-400">{isAr ? 'يحدد المرساة السعودية: حكومي = نظام المنافسات والمشتريات الحكومية، خاص = نظام المعاملات المدنية' : 'Determines the Saudi anchor: government = GTPL/MOF-Etimad, private = Civil Transactions Law (CTL)'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'القانون الحاكم (اختياري)' : 'Governing Law (optional)'}</label>
                        <select value={c.governingLawClause ?? ''} onChange={e => updateContract(c.id, 'governingLawClause', (e.target.value || undefined) as Contract['governingLawClause'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {GOVERNING_LAW_TRACKS.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'ولاية الطرف المقابل (اختياري)' : "Counterparty Jurisdiction (optional)"}</label>
                        <input type="text" value={c.counterpartyJurisdiction ?? ''} onChange={e => updateContract(c.id, 'counterpartyJurisdiction', e.target.value || undefined)}
                          placeholder={isAr ? 'مثال: السعودية، الإمارات، ألمانيا' : 'e.g. Saudi Arabia, UAE, Germany'}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'موقع التنفيذ (اختياري)' : 'Performance Location (optional)'}</label>
                        <input type="text" value={c.performanceLocation ?? ''} onChange={e => updateContract(c.id, 'performanceLocation', e.target.value || undefined)}
                          placeholder={isAr ? 'مثال: الرياض، السعودية' : 'e.g. Riyadh, Saudi Arabia'}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                        <p className="text-[10px] text-slate-400">{isAr ? 'يُستخدم نوع الطرف المقابل والقانون الحاكم والولايتان أعلاه لتوليد تنبيه مراجعة اتجاهي عند عدم التطابق -- ليس حكماً قانونياً قطعياً' : 'Counterparty type, governing law, and the two jurisdiction fields above drive a directional review flag on mismatch -- not a definitive legal verdict'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</label>
                        <select value={c.status} onChange={e => updateContract(c.id, 'status', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{isAr ? v.labelAr : v.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'درجة الأداء (0–100)' : 'Performance Score (0–100)'}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={0} max={100} value={c.performanceScore} onChange={e => updateContract(c.id, 'performanceScore', parseInt(e.target.value))} className="flex-1" style={{ accentColor: c.performanceScore >= 80 ? '#10b981' : c.performanceScore >= 60 ? '#d97706' : '#ef4444' }} />
                          <span className="font-black text-base w-8 text-right" style={{ color: c.performanceScore >= 80 ? '#10b981' : c.performanceScore >= 60 ? '#d97706' : '#ef4444' }}>{c.performanceScore}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'درجة الامتثال (0–100)' : 'Compliance Score (0–100)'}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={0} max={100} value={c.complianceScore} onChange={e => updateContract(c.id, 'complianceScore', parseInt(e.target.value))} className="flex-1" style={{ accentColor: c.complianceScore >= 80 ? '#10b981' : c.complianceScore >= 60 ? '#d97706' : '#ef4444' }} />
                          <span className="font-black text-base w-8 text-right" style={{ color: c.complianceScore >= 80 ? '#10b981' : c.complianceScore >= 60 ? '#d97706' : '#ef4444' }}>{c.complianceScore}</span>
                        </div>
                      </div>
                      <div className="col-span-full space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'قرار التجديد' : 'Renewal Decision'}</label>
                        <div className="flex gap-2 flex-wrap">
                          {(['renew','renegotiate','retender','terminate','undecided'] as const).map(d => (
                            <button key={d} onClick={() => updateContract(c.id, 'renewalDecision', d)}
                              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${c.renewalDecision === d ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                              {d === 'undecided' ? (isAr ? 'غير محدد' : 'Undecided') : d === 'renew' ? (isAr ? 'تجديد' : 'Renew') : d === 'renegotiate' ? (isAr ? 'إعادة تفاوض' : 'Renegotiate') : d === 'retender' ? (isAr ? 'إعادة طرح' : 'Retender') : (isAr ? 'إنهاء' : 'Terminate')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-full space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'ملاحظات / بنود رئيسية' : 'Notes / Key Terms'}</label>
                        <textarea value={c.notes} onChange={e => updateContract(c.id, 'notes', e.target.value)} rows={2} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#082C6B]" placeholder={isAr ? 'ملاحظات إضافية أو بنود حرجة' : 'Additional notes or critical terms'} />
                      </div>
                      <div className="col-span-full flex items-center gap-2">
                        <input type="checkbox" id={`auto-${c.id}`} checked={c.autoRenewal} onChange={e => updateContract(c.id, 'autoRenewal', e.target.checked)} className="w-4 h-4 accent-[#082C6B]" />
                        <label htmlFor={`auto-${c.id}`} className="text-xs text-slate-600 font-medium">{isAr ? 'تجديد تلقائي (يتطلب مراجعة استباقية!)' : 'Auto-renewal (requires proactive opt-out review!)'}</label>
                        {c.autoRenewal && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{isAr ? 'تنبيه: راجع قبل تاريخ الإشعار' : 'Alert: Review before notice date'}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <button onClick={addContract} className="flex items-center gap-2 text-sm text-[#082C6B] font-semibold border border-[#082C6B] rounded-xl px-4 py-2 hover:bg-[#082C6B]/5 transition-colors">
              <Plus className="w-4 h-4" />{isAr ? 'إضافة عقد' : 'Add Contract'}
            </button>
            <p className="text-[10px] text-slate-400">
              {user
                ? (clmSyncStatus === 'saving' ? (isAr ? 'جارٍ المزامنة مع الخادم…' : 'Syncing to server…')
                  : clmSyncStatus === 'saved' ? (isAr ? 'تمت المزامنة مع الخادم ✓' : 'Synced to server ✓')
                  : clmSyncStatus === 'error' ? (isAr ? 'تعذّرت المزامنة — تم الحفظ محلياً' : 'Sync failed — saved locally')
                  : (isAr ? 'محفوظ في حسابك' : 'Saved to your account'))
                : (isAr ? 'يُحفَظ تلقائياً في هذا المتصفح (سجّل الدخول للحفظ في حسابك)' : 'Auto-saved in this browser (sign in to save to your account)')}
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 2: Renewal Pipeline ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-semibold text-slate-600">{isAr ? 'عرض العقود التي تنتهي خلال:' : 'Show contracts expiring within:'}</p>
            {[30, 60, 90, 180, 365].map(d => (
              <button key={d} onClick={() => setRenewalFilter(d)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${renewalFilter === d ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                {d}{isAr ? ' يوم' : 'd'}
              </button>
            ))}
          </div>

          {expiredContracts.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-bold text-red-800">{isAr ? `${expiredContracts.length} عقد منتهٍ — يتطلب إجراءً فورياً` : `${expiredContracts.length} Expired Contract${expiredContracts.length > 1 ? 's' : ''} — Immediate Action Required`}</p>
              </div>
              {expiredContracts.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-3 mb-2 last:mb-0 border border-red-200">
                  <p className="text-sm font-bold text-slate-800">{c.name || '(unnamed)'}</p>
                  <p className="text-xs text-red-600 font-semibold mt-0.5">{c.supplier} · {isAr ? 'انتهى منذ' : 'Expired'} {Math.abs(daysUntil(c.endDate))} {isAr ? 'يوم' : 'days ago'}</p>
                </div>
              ))}
            </div>
          )}

          {upcomingRenewals.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700">{isAr ? `لا توجد عقود تنتهي خلال ${renewalFilter} يوم` : `No contracts expiring within ${renewalFilter} days`}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.map(c => {
                const days = daysUntil(c.endDate);
                const urgency = urgencyLabel(days, isAr);
                const noticeDue = daysUntil(new Date(new Date(c.endDate).getTime() - c.noticePeriodDays * 86400000).toISOString().slice(0, 10));
                const actionRequired = noticeDue <= 30;
                return (
                  <div key={c.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${days <= 14 ? 'border-red-400' : days <= 30 ? 'border-amber-400' : days <= 90 ? 'border-yellow-300' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">{c.name || '(unnamed)'}</span>
                          {c.autoRenewal && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">AUTO-RENEWAL</span>}
                          {actionRequired && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{isAr ? 'أشعر المورد الآن' : 'NOTIFY NOW'}</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{c.supplier} {c.annualValue ? `· SAR ${c.annualValue.toLocaleString()}/yr` : ''}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span><span className="font-semibold text-slate-600">{isAr ? 'ينتهي:' : 'Expires:'}</span> <span style={{ color: urgency.color, fontWeight: 700 }}>{c.endDate} ({urgency.text})</span></span>
                          <span><span className="font-semibold text-slate-600">{isAr ? 'فترة الإشعار:' : 'Notice:'}</span> {c.noticePeriodDays} {isAr ? 'يوم' : 'd'} {noticeDue > 0 ? `(${isAr ? 'يُشعَر في' : 'due in'} ${noticeDue}${isAr ? ' يوم' : 'd'})` : `(${isAr ? 'متأخر!' : 'OVERDUE!'})`}</span>
                        </div>
                        {c.renewalDecision !== 'undecided' && (
                          <div className="mt-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.renewalDecision === 'renew' ? 'bg-emerald-100 text-emerald-700' : c.renewalDecision === 'terminate' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isAr ? 'القرار:' : 'Decision:'} {c.renewalDecision === 'renew' ? (isAr ? 'تجديد' : 'Renew') : c.renewalDecision === 'renegotiate' ? (isAr ? 'إعادة تفاوض' : 'Renegotiate') : c.renewalDecision === 'retender' ? (isAr ? 'إعادة طرح' : 'Retender') : (isAr ? 'إنهاء' : 'Terminate')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-slate-400 mb-1">{isAr ? 'الأداء' : 'Performance'}</p>
                        <p className="text-xl font-black" style={{ color: c.performanceScore >= 80 ? '#10b981' : c.performanceScore >= 60 ? '#d97706' : '#ef4444' }}>{c.performanceScore}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Portfolio Health ── */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {contracts.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">{isAr ? 'أضف عقوداً في تبويب المخزون أولاً' : 'Add contracts in the Inventory tab first'}</p>
            </div>
          ) : (
            <>
              {/* Health distribution chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-3">{isAr ? 'توزيع صحة المحفظة' : 'Portfolio Health Distribution'}</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={healthData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, isAr ? 'عقود' : 'Contracts']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {healthData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Per-contract health table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700">{isAr ? 'صحة كل عقد' : 'Contract-Level Health'}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {contracts.sort((a, b) => {
                    const order = { critical: 0, 'at-risk': 1, good: 2, excellent: 3 };
                    return order[healthRating(a)] - order[healthRating(b)];
                  }).map(c => {
                    const h = healthRating(c); const hm = HEALTH_META[h];
                    const days = daysUntil(c.endDate);
                    return (
                      <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.name || '(unnamed)'}{claimableRebate(c) && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full align-middle">{isAr ? 'خصم مستحق' : 'REBATE'}</span>}</p>
                          <p className="text-[11px] text-slate-400">{c.supplier}</p>
                        </div>
                        <div className="hidden sm:flex gap-6 text-center shrink-0">
                          <div>
                            <p className="text-[10px] text-slate-400">{isAr ? 'الأداء' : 'Perf'}</p>
                            <p className="text-sm font-bold" style={{ color: c.performanceScore >= 80 ? '#10b981' : c.performanceScore >= 60 ? '#d97706' : '#ef4444' }}>{c.performanceScore}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">{isAr ? 'الامتثال' : 'Compl'}</p>
                            <p className="text-sm font-bold" style={{ color: c.complianceScore >= 80 ? '#10b981' : c.complianceScore >= 60 ? '#d97706' : '#ef4444' }}>{c.complianceScore}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">{isAr ? 'يتبقى' : 'Expires'}</p>
                            <p className="text-sm font-bold" style={{ color: days <= 30 ? '#dc2626' : days <= 90 ? '#d97706' : '#059669' }}>{days < 0 ? (isAr ? 'منتهٍ' : 'Expired') : `${days}d`}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: hm.bg, color: hm.color }}>{isAr ? hm.labelAr : hm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 4: Templates ── */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'قوالب عقود مُصمَّمة وفق القانون السعودي وأفضل الممارسات الدولية في إدارة دورة حياة العقود.' : 'Contract templates designed for Saudi law and international CLM best practice.'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLM_TEMPLATES.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{isAr ? t.labelAr : t.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? t.descAr : t.desc}</p>
                  <button onClick={() => { t.fn(); toast.success(isAr ? 'جاري التحميل…' : 'Downloading…'); }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                    <FileDown className="w-3.5 h-3.5" />{isAr ? 'تحميل' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: AI Portfolio Brief ── */}
      {activeTab === 'ai' && (
        <AIPlanPanel
          loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error}
          onGenerate={aiPlan.generate} onReset={aiPlan.reset}
          savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
          rateLimited={aiPlan.rateLimited}
          retryAfterSeconds={aiPlan.retryAfterSeconds}
          saveError={aiPlan.saveError}
          onDismissSaveError={aiPlan.dismissSaveError}
          buttonLabel={isAr ? 'توليد تقرير المحفظة ✨' : 'Generate Portfolio Brief ✨'}
          isAr={isAr} toolKey="clm-portfolio"
          disabled={contracts.length === 0}
        />
      )}
    </div>
  );
}
