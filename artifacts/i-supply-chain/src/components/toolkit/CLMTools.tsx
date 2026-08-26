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
import { GOVERNING_LAW_TRACKS, governingLawTrackLabel, governingLawPracticeNote, checkGoverningLawMismatch, internationalContractingPracticeGuide, ARBITRATION_INSTITUTIONS, arbitrationInstitutionLabel, COMMON_CONTRACTING_COMBOS, checkArbitrationInstitutionFit, type GoverningLawTrack, type ArbitrationInstitution } from '@/lib/clmLegalTrack';
import { PRICING_TYPES, checkPricingMisuseFlag, type PricingType, type ScopeDefiniteness, type PricingPhase } from '@/lib/clmPricingTaxonomy';
import { INDUSTRY_BUCKETS, FIDIC_BOOKS, PROFESSIONAL_SERVICES_TRACKS, LOGISTICS_MODES, resolveApplicableStandard, type IndustryBucket, type FidicBook, type ProfessionalServicesTrack, type LogisticsMode } from '@/lib/clmIndustryStandards';
import { INCOTERMS_2020, PAYMENT_TERMS, ISO_4217_CURRENCIES, type Incoterm, type PaymentTermType } from '@/lib/clmTradeTerms';
import {
  resolveComplexityLevel, resolveReviewDepth, complexityLevelLabel, COMPLEXITY_LEVELS, type ComplexityLevel,
  RFX_TYPES, rfxTypeLabel, recommendRfxType, RFX_DEFAULT_SCORING_TEMPLATE, scoreRfxBidders,
  type RfxType, type RfxSelectionInputs, type RfxScoringCriterion, type RfxBidderScoreInput, type RfxBidderResult,
} from '@/lib/clmContractLifecycle';
import {
  resolveRfxScopeProfile, SPEC_TYPE_META,
  type RfxScopeProfile,
} from '@/lib/clmRfxScopeEngine';
import {
  reviewDraftRfx, reviewSupplierResponse, FIELD_COMPLETENESS_META, RESPONSE_STATUS_META,
  type FieldEntryState, type ResponseEntryState,
} from '@/lib/clmRfxReviewEngine';
import {
  CLAUSE_CATEGORIES, SUBCLAUSES_BY_CATEGORY, totalSubclauseCount, presentSubclauseCount, categoryCompleteness, overallClauseHealth,
  checkCommercialRibaFlag, checkPerformanceMeasurabilityFlag, checkRiskAllocationFidicMismatchFlag, checkForegroundIPGapFlag, checkGovernanceRibaArbitrationFlag,
  type ClauseCategory, type ClausesPresent, type ClauseCategoriesNotApplicable,
} from '@/lib/clmClauseTaxonomy';
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
import { ContractReviewReport } from '@/components/ContractReviewReport';
import { buildNdaSkeleton, buildMsaSkeleton, renderSkeletonAsText } from '@/lib/clmGenerationEngine';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';

interface CLMToolsProps { isAr: boolean; }

// --- Types ---

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
  /** ISO 4217 currency code. Optional -- defaults to 'USD' when a new
   *  contract is created, fully overridable via the full ~168-code real
   *  ISO 4217 list (never auto-inferred from jurisdiction/location fields,
   *  per Decision Record 8.7). */
  currency?: string;
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
  /** Named arbitration/dispute-resolution institution (NEW, 26 Aug 2026,
   *  owner: "once client pick any of what you mentioned we call for it and
   *  fill contract accordingly"). Distinct from clauseVariants['dispute-resolution']
   *  (the mechanism: litigation/arbitration/mediation) -- this is WHICH
   *  institution. Optional, manual input, or auto-filled by clicking a
   *  COMMON_CONTRACTING_COMBOS chip (still editable afterward). Module 01. */
  arbitrationInstitution?: ArbitrationInstitution;
  /** Free-text jurisdiction where the counterparty is domiciled. Optional,
   *  manual input. Module 01, #386. */
  counterpartyJurisdiction?: string;
  /** Free-text location where the contract is actually performed/delivered.
   *  Optional, manual input. Module 01, #386. */
  performanceLocation?: string;
  /** Primary pricing structure type. Optional, manual input. Module 04. */
  pricingPrimary?: PricingType;
  /** Secondary pricing type for hybrid structures (e.g. a provisional-sum
   *  component alongside a lump-sum primary). Optional. Module 04. */
  pricingSecondary?: PricingType;
  /** Phase-by-phase pricing breakdown (e.g. a Gold Book DBO contract's
   *  construct phase vs operate phase). Optional, manual input. Module 04. */
  pricingPhaseBreakdown?: PricingPhase[];
  /** Self-declared scope definiteness -- drives the pricing misuse
   *  ("worth a second look") flag. Never inferred. Module 04. */
  scopeDefiniteness?: ScopeDefiniteness;
  /** Whether the T&M pricing has a cap or milestones. Only meaningful when
   *  pricingPrimary === 'tm'. Optional, manual input. Module 04. */
  pricingHasCapOrMilestones?: boolean;
  /** Industry/SOW bucket -- selects which real, sourced body-of-knowledge
   *  applies via resolveApplicableStandard(). Optional, manual input.
   *  Module 05. */
  industryBucket?: IndustryBucket;
  /** FIDIC book, only meaningful when industryBucket === 'construction'.
   *  Optional, manual input. Module 05. */
  fidicBook?: FidicBook;
  /** Professional-services track, only meaningful when
   *  industryBucket === 'professional-services'. Optional, manual input.
   *  Module 05. */
  professionalServicesTrack?: ProfessionalServicesTrack;
  /** Transport mode, only meaningful when industryBucket === 'logistics'.
   *  Optional, manual input. Module 05. */
  logisticsMode?: LogisticsMode;
  /** ICC Incoterms (R) 2020 rule governing delivery/cost/risk transfer.
   *  Optional, manual input -- most relevant to Supply/Goods and Logistics
   *  contracts but not restricted to them. Module 05 extension, 25 Aug 2026. */
  incoterm?: Incoterm;
  /** Payment method/timing term (real trade-finance categories -- see
   *  clmTradeTerms.ts for sourcing). Optional, manual input. */
  paymentTerm?: PaymentTermType;
  /** Net-days figure, only meaningful when paymentTerm === 'open-account'
   *  (e.g. Net 30/60/90). Optional, manual input. */
  paymentTermNetDays?: number;
  /** Module 02 (Clause & Subclause Taxonomy, items 31-33) -- manual
   *  checklist of which subclause topics this contract addresses, per
   *  category. Optional, additive, never inferred from document text --
   *  same standing rule as every other Contract Intelligence module. */
  clausesPresent?: ClausesPresent;
  /** Categories explicitly marked as not relevant to this contract (e.g.
   *  Data/IP on a simple one-off goods purchase) -- an honest opt-out so a
   *  skipped category reads as "N/A" rather than a hidden gap. Module 02. */
  clauseCategoriesNotApplicable?: ClauseCategoriesNotApplicable;
  /** Free-text bespoke conditions per category that the fixed 56-subclause
   *  checklist doesn't cover (e.g. an unusual NDA carve-out, a client-
   *  specific exit condition) -- the taxonomy is a categorized framework,
   *  not an exhaustive drafting-ready clause bank (item 32), so real
   *  contracts routinely need this escape hatch. Optional, manual. Module 02. */
  clauseSpecialConditions?: Partial<Record<ClauseCategory, string>>;
  /** Selected variant/shape for subclauses whose real-world structure
   *  commonly differs (e.g. Limitation of Liability: uncapped vs capped at
   *  contract value vs capped at insurance proceeds). Keyed by subclause id
   *  -- ids are unique across the whole taxonomy. Optional, manual,
   *  additional to (never a substitute for) checking the subclause present.
   *  Module 02. */
  clauseVariants?: Record<string, string>;
  /** Module 09 item 50 (owner-confirmed 26 Aug 2026): optional client-named
   *  stakeholders beyond the standard 8-role involvement map the NDA
   *  Skeleton derives automatically -- for special-case relationships that
   *  need a named role the derived map doesn't cover (e.g. a specific
   *  regulator liaison, an outside sponsor). Free text, manual only, never
   *  mandatory, always suggested. */
  customStakeholders?: string[];
  /** Module 03 (Contract Lifecycle & RFx Operations), built 26 Aug 2026.
   *  Self-declared counterparty relationship history -- feeds
   *  resolveComplexityLevel(). Optional, manual, never inferred. */
  counterpartyHistory?: 'established' | 'new' | 'unvetted';
  /** Self-declared count of clauses that deviate from the standard/
   *  template language for this contract's base document. Optional,
   *  manual entry by default -- Module 03 Part A. May ALSO be populated
   *  via mockDocumentExtraction() in dev/demo contexts ONLY; never
   *  silently swapped for a real value in production. */
  clauseDeviationCount?: number;
  /** Client-configurable value threshold above which review defaults to
   *  HEAVY (Module 03 Part C). Deliberately NOT a hardcoded SAR figure --
   *  no real client figures have been supplied (open item 27, since v5) --
   *  so each client sets their own. Optional; falls back to complexity
   *  level alone when unset. */
  reviewHeavyThresholdValue?: number;
}

// --- Helpers ---

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
  renewed:              { label: 'Renewed',             labelAr: 'مُجدّد',           badge: 'bg-teal-100 text-teal-700' },
};

function defaultContract(): Contract {
  const today = new Date(); const end = new Date(today); end.setFullYear(end.getFullYear() + 1);
  return {
    id: nid(), name: '', supplier: '', category: '', type: 'services',
    annualValue: 0, totalValue: 0, currency: 'USD',
    startDate: today.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10),
    noticePeriodDays: 90, autoRenewal: false, status: 'active',
    performanceScore: 80, deliveredValue: 0, complianceScore: 90,
    savingsRealized: 0, owner: '', notes: '', keyTerms: '', renewalDecision: 'undecided',
  };
}

// --- Storage ---

const SK_CONTRACTS = 'isc-tool-clm-contracts-v2';
/** Module 03 Part D (RFx Builder), built 26 Aug 2026 -- closes registry #394.
 *  Client-side only, no backend sync (same T1 scope as the rest of Module
 *  03): a single owner's selection/criteria/bidder state, local to this
 *  browser. Consistent with the rest of this module being pure logic. */
const SK_RFX = 'isc-tool-clm-rfx-v1';
function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

// --- Template generators ---

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

================================================================================
SECTION 1 — PARTIES & DEFINITIONS
================================================================================
☐ Full legal name and CR number of both parties
☐ Authorised signatories clearly named
☐ Definitions section covers all key terms used in the contract
☐ Governing law and jurisdiction stated (Saudi Law recommended for KSA contracts)
☐ Language of the contract and which version prevails (Arabic / English)

================================================================================
SECTION 2 — SCOPE OF SUPPLY / SERVICES
================================================================================
☐ Detailed specification or Statement of Work (SOW) attached
☐ Quantities / volumes stated (or formula for call-off volumes)
☐ Delivery locations specified
☐ Service levels / SLAs defined with measurable KPIs
☐ Exclusions from scope clearly listed
☐ Change control process defined (how scope changes are agreed and priced)

================================================================================
SECTION 3 — PRICING & PAYMENT
================================================================================
☐ Unit prices / rate card attached
☐ Pricing validity period stated
☐ Price review mechanism (annual, index-linked, or mutual agreement)
☐ VAT treatment stated (15% KSA VAT, who is responsible)
☐ Invoicing requirements (PO reference, delivery note, inspection sign-off)
☐ Payment terms stated (standard: Net 30 from invoice)
☐ Late payment interest clause (if applicable)
☐ Volume rebate / discount structure defined
☐ Currency and FX risk allocation stated

================================================================================
SECTION 4 — DELIVERY & PERFORMANCE
================================================================================
☐ Delivery terms (Incoterms if goods: DAP / DDP)
☐ Lead times defined and binding
☐ OTIF (on-time in-full) target stated
☐ Acceptance criteria and inspection process defined
☐ Warranty period and remedy process
☐ Performance review cadence (monthly/quarterly scorecard)

================================================================================
SECTION 5 — LIABILITY & INDEMNITY
================================================================================
☐ Limitation of liability cap stated (typically 12 months' contract value)
☐ Consequential / indirect loss exclusion clause
☐ Indemnity obligations defined (who indemnifies whom for what)
☐ Product liability / professional indemnity insurance requirements
☐ Third-party claims procedure

================================================================================
SECTION 6 — TERM, TERMINATION & EXIT
================================================================================
☐ Contract start and end dates stated
☐ Auto-renewal clause (include: opt-out notice period, maximum auto-renewals)
☐ Termination for convenience clause (notice period: typically 30–90 days)
☐ Termination for cause (material breach, insolvency, change of control)
☐ Exit obligations (data return, handover period, IP transfer)
☐ Survival clause (which terms survive termination)

================================================================================
SECTION 7 — COMPLIANCE & RISK
================================================================================
☐ Iktva / local content obligations stated (if applicable to supplier)
☐ ZATCA / VAT registration confirmation required
☐ Anti-bribery and anti-corruption clause
☐ Modern Slavery / ethical sourcing compliance
☐ Data protection obligations (PDPL compliance for KSA)
☐ Confidentiality clause with survival period
☐ Insurance requirements (minimum cover levels specified)
☐ Business continuity / disaster recovery requirements
☐ Audit rights clause

================================================================================
SECTION 8 — DISPUTE RESOLUTION
================================================================================
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

================================================================================
STAGE 1 — CONTRACT REVIEW (6–12 months before expiry)
================================================================================
☐ Pull full contract register — confirm exact expiry date and notice period
☐ Retrieve supplier performance scorecard (OTIF, quality, complaints, savings)
☐ Review spend vs. contracted value — was the contract fully utilised?
☐ Identify any compliance gaps or legal clause issues to correct
☐ Assess business need: Is this still the right scope / volume?

Decision gate: Renew / Renegotiate / Retender / Terminate?

================================================================================
STAGE 2 — MARKET CHECK (5–10 months before expiry)
================================================================================
☐ Run a market scan — are there new or alternative suppliers worth testing?
☐ Obtain 2–3 informal market quotes (even if renewing, use as benchmark)
☐ Check commodity price indices for price movement vs. current contract rates
☐ Review Kraljic position — has the strategic importance of this contract changed?
☐ Check local content / Iktva requirements (may have changed)

================================================================================
STAGE 3 — NEGOTIATION PREPARATION (3–6 months before expiry)
================================================================================
☐ Build negotiation file:
    - Should-cost analysis (what should this cost based on market data?)
    - BATNA (Best Alternative to Negotiated Agreement): what if talks break down?
    - Concession plan: what will you give, in what order, and for what return?
    - Walk-away price: the absolute limit
☐ Prepare negotiation agenda: price, scope, SLAs, payment terms, duration
☐ Brief internal stakeholders (operations, finance, legal) on negotiation position
☐ Check: Does the supplier have leverage? (sole source, long qualification, IP lock-in)

================================================================================
STAGE 4 — NEGOTIATION (2–4 months before expiry)
================================================================================
☐ Open with data: share performance scorecard, compliment strengths first
☐ Anchor on your target: state your desired outcome early
☐ Trade concessions — link any give to a corresponding get
☐ Agree all commercial and legal changes before drafting amendments
☐ Document agreed positions in a Term Sheet or MOU before legal drafting
☐ Escalate to executive level if commercial terms are not moving

Key leverage levers:
  Volume commitment  |  Payment terms improvement  |  Longer term (multi-year)
  Reference / case study  |  Early signature  |  Reduced spec / simplified service

================================================================================
STAGE 5 — EXECUTION & HANDOVER (0–2 months before expiry)
================================================================================
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

// --- Tab type ---

type Tab = 'inventory' | 'pipeline' | 'health' | 'rfx' | 'templates' | 'ai';

// --- Main Component ---

export function ContractHealthChecker({ isAr }: CLMToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [contracts, setContracts] = useState<Contract[]>(() => loadJson(SK_CONTRACTS, []));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  /** Module 02 -- which per-contract clause-category accordions are open.
   *  Local display state only (key: `${contractId}:${category}`), not
   *  synced business data -- same pattern as expandedIds above. */
  const [expandedClauseCats, setExpandedClauseCats] = useState<Set<string>>(new Set());
  /** Module 09 -- which per-contract Contract Assurance Chain (Review v1)
   *  panels are open. Local display state only, same pattern as
   *  expandedClauseCats above. */
  const [expandedReview, setExpandedReview] = useState<Set<string>>(new Set());
  const [renewalFilter, setRenewalFilter] = useState<number>(180); // show renewals due in N days

  // -- Module 03 Part D (RFx Builder), built 26 Aug 2026, closes registry
  //    #394 -- the RFx logic (recommendRfxType, scoreRfxBidders) shipped
  //    25 Aug/T1 build with no screen; this wires it in. Client-side only,
  //    T1 scope (see SK_RFX comment above).
  const [rfxSelection, setRfxSelection] = useState<RfxSelectionInputs>(() => loadJson(SK_RFX + ':selection', {
    specificationsFixed: false, supplierCapabilityKnown: false, needsApproachComparison: false,
  }));
  const [rfxCriteria, setRfxCriteria] = useState<RfxScoringCriterion[]>(() => loadJson(SK_RFX + ':criteria', RFX_DEFAULT_SCORING_TEMPLATE));
  const [rfxBidders, setRfxBidders] = useState<RfxBidderScoreInput[]>(() => loadJson(SK_RFX + ':bidders', []));

  useEffect(() => { safeSetItem(SK_RFX + ':selection', JSON.stringify(rfxSelection)); }, [rfxSelection]);
  useEffect(() => { safeSetItem(SK_RFX + ':criteria', JSON.stringify(rfxCriteria)); }, [rfxCriteria]);
  useEffect(() => { safeSetItem(SK_RFX + ':bidders', JSON.stringify(rfxBidders)); }, [rfxBidders]);

  const rfxRecommendation = useMemo(() => recommendRfxType(rfxSelection), [rfxSelection]);

  // -- #395 (Priority 1, owner directive 26 Aug 2026): Category-Aware RFx
  //    Scope Build & Review Engine. Composes industryBucket + rfxType +
  //    complexityLevel into a derived, sourced scope profile (spec-type
  //    decision, WBS skeleton, elicitation guidance, mandatory field
  //    library -- clmRfxScopeEngine.ts) and reviews a draft RFx or a
  //    supplier's response against that SAME profile (clmRfxReviewEngine.ts).
  //    Client-side only, same T1 pattern as the rest of this tab.
  const [rfxScopeBucket, setRfxScopeBucket] = useState<IndustryBucket>(() => loadJson(SK_RFX + ':scopeBucket', '' as IndustryBucket));
  const [rfxScopeComplexity, setRfxScopeComplexity] = useState<ComplexityLevel>(() => loadJson(SK_RFX + ':scopeComplexity', 'level-2-standard' as ComplexityLevel));
  const [rfxFieldEntries, setRfxFieldEntries] = useState<Record<string, FieldEntryState>>(() => loadJson(SK_RFX + ':fieldEntries', {}));
  const [rfxWbsFilled, setRfxWbsFilled] = useState<Record<string, boolean>>(() => loadJson(SK_RFX + ':wbsFilled', {}));
  const [rfxResponseEntries, setRfxResponseEntries] = useState<Record<string, ResponseEntryState>>(() => loadJson(SK_RFX + ':responseEntries', {}));

  useEffect(() => { safeSetItem(SK_RFX + ':scopeBucket', JSON.stringify(rfxScopeBucket)); }, [rfxScopeBucket]);
  useEffect(() => { safeSetItem(SK_RFX + ':scopeComplexity', JSON.stringify(rfxScopeComplexity)); }, [rfxScopeComplexity]);
  useEffect(() => { safeSetItem(SK_RFX + ':fieldEntries', JSON.stringify(rfxFieldEntries)); }, [rfxFieldEntries]);
  useEffect(() => { safeSetItem(SK_RFX + ':wbsFilled', JSON.stringify(rfxWbsFilled)); }, [rfxWbsFilled]);
  useEffect(() => { safeSetItem(SK_RFX + ':responseEntries', JSON.stringify(rfxResponseEntries)); }, [rfxResponseEntries]);

  /** Complexity Level (Part A, 3 named tiers) -> the engine's simplified
   *  1/2/3 signal (only used to pick lighter vs heavier elicitation
   *  guidance, BABOK Section 4) -- keeps one authoritative tiering concept
   *  (COMPLEXITY_LEVELS) instead of a second parallel numbering scheme. */
  const rfxComplexityTier = useMemo((): 1 | 2 | 3 => {
    if (rfxScopeComplexity === 'level-1-low') return 1;
    if (rfxScopeComplexity === 'level-3-complex') return 3;
    return 2;
  }, [rfxScopeComplexity]);

  const rfxScopeProfile = useMemo(
    () => resolveRfxScopeProfile({ industryBucket: rfxScopeBucket, rfxType: rfxRecommendation.type, complexityTier: rfxComplexityTier }),
    [rfxScopeBucket, rfxRecommendation.type, rfxComplexityTier]
  );

  const rfxDraftReview = useMemo(
    () => reviewDraftRfx({ industryBucket: rfxScopeBucket, rfxType: rfxRecommendation.type, complexityTier: rfxComplexityTier, fieldEntries: rfxFieldEntries, wbsNodesFilled: rfxWbsFilled }),
    [rfxScopeBucket, rfxRecommendation.type, rfxComplexityTier, rfxFieldEntries, rfxWbsFilled]
  );

  const rfxResponseReview = useMemo(
    () => reviewSupplierResponse({ industryBucket: rfxScopeBucket, rfxType: rfxRecommendation.type, complexityTier: rfxComplexityTier, responseEntries: rfxResponseEntries }),
    [rfxScopeBucket, rfxRecommendation.type, rfxComplexityTier, rfxResponseEntries]
  );

  const toggleRfxFieldEntered = useCallback((fieldId: string) => {
    setRfxFieldEntries(prev => ({ ...prev, [fieldId]: { entered: !(prev[fieldId]?.entered), selfDeclaredMeasurable: prev[fieldId]?.selfDeclaredMeasurable } }));
  }, []);
  const toggleRfxFieldMeasurable = useCallback((fieldId: string) => {
    setRfxFieldEntries(prev => ({ ...prev, [fieldId]: { entered: prev[fieldId]?.entered ?? false, selfDeclaredMeasurable: !(prev[fieldId]?.selfDeclaredMeasurable) } }));
  }, []);
  const toggleRfxWbsNode = useCallback((nodeId: string) => {
    setRfxWbsFilled(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);
  const toggleRfxResponseAnswered = useCallback((fieldId: string) => {
    setRfxResponseEntries(prev => ({ ...prev, [fieldId]: { answered: !(prev[fieldId]?.answered), selfDeclaredSpecific: prev[fieldId]?.selfDeclaredSpecific } }));
  }, []);
  const toggleRfxResponseSpecific = useCallback((fieldId: string) => {
    setRfxResponseEntries(prev => ({ ...prev, [fieldId]: { answered: prev[fieldId]?.answered ?? false, selfDeclaredSpecific: !(prev[fieldId]?.selfDeclaredSpecific) } }));
  }, []);
  const rfxWeightSum = useMemo(
    () => rfxCriteria.filter(c => !c.isMandatoryGate).reduce((sum, c) => sum + (c.weight || 0), 0),
    [rfxCriteria]
  );
  const rfxResults = useMemo(() => scoreRfxBidders(rfxCriteria, rfxBidders), [rfxCriteria, rfxBidders]);
  const rfxResultsSorted = useMemo(() => {
    const byId = new Map(rfxBidders.map(b => [b.bidderId, b]));
    return [...rfxResults].sort((a, b) => {
      if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
      return (b.weightedTotal ?? 0) - (a.weightedTotal ?? 0);
    }).map(r => ({ ...r, input: byId.get(r.bidderId) }));
  }, [rfxResults, rfxBidders]);

  const addRfxBidder = useCallback(() => {
    setRfxBidders(prev => [...prev, { bidderId: nid(), bidderName: '', passedMandatoryGate: true, scores: {} }]);
  }, []);
  const removeRfxBidder = useCallback((id: string) => {
    setRfxBidders(prev => prev.filter(b => b.bidderId !== id));
  }, []);
  const updateRfxBidder = useCallback((id: string, patch: Partial<RfxBidderScoreInput>) => {
    setRfxBidders(prev => prev.map(b => (b.bidderId === id ? { ...b, ...patch } : b)));
  }, []);
  const updateRfxBidderScore = useCallback((id: string, criterionId: string, value: number) => {
    setRfxBidders(prev => prev.map(b => (b.bidderId === id ? { ...b, scores: { ...b.scores, [criterionId]: value } } : b)));
  }, []);
  const updateRfxCriterionWeight = useCallback((criterionId: string, weight: number) => {
    setRfxCriteria(prev => prev.map(c => (c.id === criterionId ? { ...c, weight } : c)));
  }, []);

  // -- Server-sync (backend persistence, #179 Contract Value Tracker,
  //    2026-08-24) -- Whole-list sync against /api/clm-contracts, mirroring
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
  /** Pricing phase-breakdown row helpers (Module 04) -- pricingPhaseBreakdown
   *  is an array of { phase, pricingType } and needs its own add/update/
   *  remove helpers since updateContract only replaces a whole field. */
  const addPricingPhase = (id: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, pricingPhaseBreakdown: [...(c.pricingPhaseBreakdown ?? []), { phase: '', pricingType: '' as PricingType }] } : c));
  const updatePricingPhase = (id: string, idx: number, field: keyof PricingPhase, value: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, pricingPhaseBreakdown: (c.pricingPhaseBreakdown ?? []).map((p, i) => i === idx ? { ...p, [field]: value } : p) } : c));
  const removePricingPhase = (id: string, idx: number) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, pricingPhaseBreakdown: (c.pricingPhaseBreakdown ?? []).filter((_, i) => i !== idx) } : c));
  /** Module 02 clause-taxonomy helpers -- clausesPresent/clauseCategoriesNotApplicable/
   *  clauseSpecialConditions are nested objects, so (like pricing phases
   *  above) they need dedicated helpers rather than the flat updateContract. */
  const toggleClauseSubclause = (id: string, category: ClauseCategory, subclauseId: string) =>
    saveContracts(contracts.map(c => {
      if (c.id !== id) return c;
      const current = c.clausesPresent?.[category] ?? [];
      const next = current.includes(subclauseId) ? current.filter(x => x !== subclauseId) : [...current, subclauseId];
      return { ...c, clausesPresent: { ...(c.clausesPresent ?? {}), [category]: next } };
    }));
  const toggleClauseCategoryNA = (id: string, category: ClauseCategory) =>
    saveContracts(contracts.map(c => {
      if (c.id !== id) return c;
      const current = c.clauseCategoriesNotApplicable ?? [];
      const next = current.includes(category) ? current.filter(x => x !== category) : [...current, category];
      return { ...c, clauseCategoriesNotApplicable: next };
    }));
  const updateClauseSpecialCondition = (id: string, category: ClauseCategory, text: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, clauseSpecialConditions: { ...(c.clauseSpecialConditions ?? {}), [category]: text } } : c));
  const updateClauseVariant = (id: string, subclauseId: string, variantId: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, clauseVariants: { ...(c.clauseVariants ?? {}), [subclauseId]: variantId } } : c));
  /** Module 01 (NEW, 26 Aug 2026) -- applies one of COMMON_CONTRACTING_COMBOS
   *  in a single atomic update: governing law, arbitration institution, and
   *  the dispute-resolution mechanism together. Entirely optional and
   *  reversible -- every field it touches remains independently editable
   *  afterward, same as if the client had set each one manually. */
  const applyContractingCombo = (id: string, combo: (typeof COMMON_CONTRACTING_COMBOS)[number]) =>
    saveContracts(contracts.map(c => c.id === id ? {
      ...c,
      governingLawClause: combo.governingLaw,
      arbitrationInstitution: combo.arbitrationInstitution,
      clauseVariants: { ...(c.clauseVariants ?? {}), 'dispute-resolution': combo.disputeResolutionVariant },
    } : c));
  /** Module 09 item 50 -- customStakeholders is an array of free-text
   *  strings, so (like pricingPhaseBreakdown above) it needs its own
   *  add/update/remove helpers rather than the flat updateContract. */
  const addCustomStakeholder = (id: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, customStakeholders: [...(c.customStakeholders ?? []), ''] } : c));
  const updateCustomStakeholder = (id: string, idx: number, value: string) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, customStakeholders: (c.customStakeholders ?? []).map((s, i) => i === idx ? value : s) } : c));
  const removeCustomStakeholder = (id: string, idx: number) =>
    saveContracts(contracts.map(c => c.id === id ? { ...c, customStakeholders: (c.customStakeholders ?? []).filter((_, i) => i !== idx) } : c));
  const toggleClauseCategoryExpand = (contractId: string, category: ClauseCategory) => setExpandedClauseCats(prev => {
    const key = `${contractId}:${category}`;
    const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s;
  });
  const toggleReviewExpand = (contractId: string) => setExpandedReview(prev => {
    const s = new Set(prev); s.has(contractId) ? s.delete(contractId) : s.add(contractId); return s;
  });

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
    { id: 'rfx',        icon: '📝', label: 'RFx Builder',         labelAr: 'أداة RFx'              },
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

      {/* -- TAB 1: Contract Inventory -- */}
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
                        {expiredContracts.includes(c) && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{isAr ? 'تحتاج إجراءً عاجلاً' : 'ACTION NEEDED'}</span>}
                        {claimableRebate(c) && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{isAr ? 'خصم مستحق للمطالبة' : 'CLAIMABLE REBATE'}</span>}
                        {checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).flagged && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full" title={isAr ? checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).reasonAr : checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).reasonEn}>{isAr ? 'قانون حاكم غير متطابق' : 'GOVERNING-LAW MISMATCH'}</span>}
                        {checkArbitrationInstitutionFit(c.governingLawClause, c.arbitrationInstitution, c.clauseVariants?.['dispute-resolution']).flagged && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full" title={isAr ? checkArbitrationInstitutionFit(c.governingLawClause, c.arbitrationInstitution, c.clauseVariants?.['dispute-resolution']).reasonAr : checkArbitrationInstitutionFit(c.governingLawClause, c.arbitrationInstitution, c.clauseVariants?.['dispute-resolution']).reasonEn}>{isAr ? 'جهة التحكيم تستحق التأكيد' : 'ARBITRATION INSTITUTION: WORTH CONFIRMING'}</span>}
                        {checkPricingMisuseFlag(c.pricingPrimary, c.scopeDefiniteness, c.pricingHasCapOrMilestones, c.startDate, c.endDate).flagged && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full" title={isAr ? checkPricingMisuseFlag(c.pricingPrimary, c.scopeDefiniteness, c.pricingHasCapOrMilestones, c.startDate, c.endDate).reasonAr : checkPricingMisuseFlag(c.pricingPrimary, c.scopeDefiniteness, c.pricingHasCapOrMilestones, c.startDate, c.endDate).reasonEn}>{isAr ? 'التسعير يستحق نظرة ثانية' : 'PRICING: WORTH A SECOND LOOK'}</span>}
                        {(() => {
                          const clauseFlagCount = [
                            checkCommercialRibaFlag(c.clausesPresent, c.counterpartyJurisdiction, c.performanceLocation, c.governingLawClause),
                            checkPerformanceMeasurabilityFlag(c.clausesPresent),
                            checkRiskAllocationFidicMismatchFlag(c.clausesPresent, c.fidicBook),
                            checkForegroundIPGapFlag(c.clausesPresent, c.industryBucket),
                            checkGovernanceRibaArbitrationFlag(c.clausesPresent, c.counterpartyJurisdiction, c.performanceLocation, c.governingLawClause),
                          ].filter(f => f.flagged).length;
                          return clauseFlagCount > 0 ? (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                              {isAr ? `${clauseFlagCount} من بنود العقد تستحق نظرة ثانية` : `${clauseFlagCount} CLAUSE FLAG${clauseFlagCount > 1 ? 'S' : ''}: WORTH A SECOND LOOK`}
                            </span>
                          ) : null;
                        })()}
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
                        {c.governingLawClause && governingLawPracticeNote(c.governingLawClause, isAr) && (
                          <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 mt-1">
                            <span className="font-semibold text-slate-600">{isAr ? 'الممارسة الموصى بها: ' : 'Recommended practice: '}</span>
                            {governingLawPracticeNote(c.governingLawClause, isAr)}
                          </p>
                        )}
                        <details className="mt-1 group">
                          <summary className="text-[10px] font-semibold text-[#082C6B] cursor-pointer select-none">{isAr ? 'ما القانون الحاكم الذي يختاره الآخرون عادة في العقود الدولية؟ (بيانات السوق)' : 'What governing law do others commonly choose internationally? (market data)'}</summary>
                          <p className="text-[10px] text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5 mt-1">
                            {internationalContractingPracticeGuide(isAr)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5">{isAr ? 'اختياري تماماً -- عند اختيار أي مما يلي، تملأ isc القانون الحاكم وجهة التحكيم وبند تسوية المنازعات معاً تلقائياً، وتبقى كل الحقول قابلة للتعديل بعد ذلك.' : 'Entirely optional -- picking any of the below has ISC fill in the governing law, arbitration institution, and dispute-resolution sub-clause together automatically. Every field stays editable afterward.'}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {COMMON_CONTRACTING_COMBOS.map(combo => (
                              <button key={combo.id} type="button" onClick={() => applyContractingCombo(c.id, combo)}
                                className="text-[10px] bg-white border border-blue-200 text-[#082C6B] rounded-full px-2 py-0.5 hover:bg-blue-100 transition-colors">
                                {isAr ? combo.labelAr : combo.labelEn}
                              </button>
                            ))}
                          </div>
                        </details>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'جهة التحكيم / تسوية المنازعات (اختياري)' : 'Arbitration / Dispute Institution (optional)'}</label>
                        <select value={c.arbitrationInstitution ?? ''} onChange={e => updateContract(c.id, 'arbitrationInstitution', (e.target.value || undefined) as Contract['arbitrationInstitution'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {ARBITRATION_INSTITUTIONS.map(i => <option key={i.id} value={i.id}>{isAr ? i.labelAr : i.label}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400">{isAr ? 'الجهة المحددة التي تدير التحكيم -- بخلاف حقل "تسوية المنازعات" أدناه في تبويب البنود، الذي يحدد الآلية فقط (تقاضٍ/تحكيم/وساطة)' : 'The specific body administering arbitration -- distinct from the Dispute Resolution sub-clause in the Clauses tab below, which sets only the mechanism (litigation/arbitration/mediation)'}</p>
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
                      <div className="space-y-1 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{isAr ? 'تعقيد العقد وعمق المراجعة (الوحدة 03)' : 'Contract Complexity & Review Depth (Module 03)'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'تاريخ العلاقة مع الطرف المقابل (اختياري)' : 'Counterparty History (optional)'}</label>
                            <select value={c.counterpartyHistory ?? ''} onChange={e => updateContract(c.id, 'counterpartyHistory', (e.target.value || undefined) as Contract['counterpartyHistory'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                              <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                              <option value="established">{isAr ? 'معروف' : 'Established'}</option>
                              <option value="new">{isAr ? 'جديد' : 'New'}</option>
                              <option value="unvetted">{isAr ? 'غير مدقق' : 'Unvetted'}</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'عدد انحرافات البنود عن القياسي (اختياري)' : 'Clause Deviations From Standard (optional)'}</label>
                            <input type="number" min={0} value={c.clauseDeviationCount ?? ''} onChange={e => updateContract(c.id, 'clauseDeviationCount', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                              placeholder={isAr ? '0' : '0'}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'حد قيمة المراجعة المعمّقة (اختياري، خاص بالعميل)' : 'Heavy-Review Value Threshold (optional, client-set)'}</label>
                            <input type="number" min={0} value={c.reviewHeavyThresholdValue ?? ''} onChange={e => updateContract(c.id, 'reviewHeavyThresholdValue', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              placeholder={isAr ? 'اتركه فارغاً لاعتماد التعقيد فقط' : 'Leave blank to use complexity alone'}
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                          </div>
                        </div>
                        {(() => {
                          const durationMonths = c.startDate && c.endDate
                            ? Math.max(0, Math.round((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                            : 0;
                          const crossBorder = Boolean(c.counterpartyJurisdiction && c.performanceLocation && c.counterpartyJurisdiction.trim().toLowerCase() !== c.performanceLocation.trim().toLowerCase());
                          const hasActiveMismatchFlag =
                            checkGoverningLawMismatch(c.governingLawClause, c.counterpartyJurisdiction, c.performanceLocation).flagged ||
                            checkArbitrationInstitutionFit(c.governingLawClause, c.arbitrationInstitution, c.clauseVariants?.['dispute-resolution']).flagged ||
                            checkPricingMisuseFlag(c.pricingPrimary, c.scopeDefiniteness, c.pricingHasCapOrMilestones, c.startDate, c.endDate).flagged;
                          const complexity = resolveComplexityLevel({
                            value: c.annualValue || c.totalValue || 0,
                            durationMonths,
                            counterpartyHistory: c.counterpartyHistory,
                            crossBorder,
                            hasActiveMismatchFlag,
                            clauseDeviationCount: c.clauseDeviationCount,
                          });
                          const review = resolveReviewDepth(complexity.level, c.annualValue || c.totalValue || 0, c.reviewHeavyThresholdValue);
                          return (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700">
                                {complexityLevelLabel(complexity.level, isAr)}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${review.depth === 'heavy' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {review.depth === 'heavy' ? (isAr ? 'مراجعة معمّقة' : 'HEAVY REVIEW') : (isAr ? 'مراجعة خفيفة' : 'LIGHT REVIEW')}
                              </span>
                              <p className="text-[10px] text-slate-400 basis-full">{isAr ? review.reasonAr : review.reasonEn}</p>
                            </div>
                          );
                        })()}
                        <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'حساب اتجاهي بحت من الحقول المُدخلة يدوياً أعلاه -- ليس تحققاً من نص العقد الفعلي' : 'Purely directional, computed from the manually-entered fields above -- not a check against the actual contract text'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'قطاع الصناعة / نطاق العمل (اختياري)' : 'Industry / SOW Bucket (optional)'}</label>
                        <select value={c.industryBucket ?? ''} onChange={e => updateContract(c.id, 'industryBucket', (e.target.value || undefined) as Contract['industryBucket'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {INDUSTRY_BUCKETS.map(b => <option key={b.id} value={b.id}>{isAr ? b.labelAr : b.label}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400">{isAr ? 'يحدد المعيار المرجعي الموضح أدناه -- معلومة مرجعية وليست تنبيهاً' : 'Drives the reference standard shown below -- informational, not a flag'}</p>
                      </div>
                      {c.industryBucket === 'construction' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'كتاب FIDIC (اختياري)' : 'FIDIC Book (optional)'}</label>
                          <select value={c.fidicBook ?? ''} onChange={e => updateContract(c.id, 'fidicBook', (e.target.value || undefined) as Contract['fidicBook'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                            <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                            {FIDIC_BOOKS.map(b => <option key={b.id} value={b.id}>{isAr ? b.labelAr : b.label}</option>)}
                          </select>
                        </div>
                      )}
                      {c.industryBucket === 'professional-services' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'مسار الخدمات المهنية (اختياري)' : 'Professional Services Track (optional)'}</label>
                          <select value={c.professionalServicesTrack ?? ''} onChange={e => updateContract(c.id, 'professionalServicesTrack', (e.target.value || undefined) as Contract['professionalServicesTrack'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                            <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                            {PROFESSIONAL_SERVICES_TRACKS.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                          </select>
                        </div>
                      )}
                      {c.industryBucket === 'logistics' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'وسيلة النقل (اختياري)' : 'Transport Mode (optional)'}</label>
                          <select value={c.logisticsMode ?? ''} onChange={e => updateContract(c.id, 'logisticsMode', (e.target.value || undefined) as Contract['logisticsMode'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                            <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                            {LOGISTICS_MODES.map(m => <option key={m.id} value={m.id}>{isAr ? m.labelAr : m.label}</option>)}
                          </select>
                        </div>
                      )}
                      {(() => {
                        const std = resolveApplicableStandard(c.counterpartyType, c.industryBucket, c.fidicBook, c.professionalServicesTrack, c.logisticsMode);
                        return std ? (
                          <div className="col-span-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 space-y-0.5">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'المعيار المرجعي المنطبق' : 'Applicable Reference Standard'}</p>
                            <p className="text-xs font-bold text-slate-700">{isAr ? std.standardAr : std.standardEn}</p>
                            {(isAr ? std.noteAr : std.noteEn) ? <p className="text-[10px] text-slate-500">{isAr ? std.noteAr : std.noteEn}</p> : null}
                          </div>
                        ) : null;
                      })()}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'شرط إنكوترمز (اختياري)' : 'Incoterm (optional)'}</label>
                        <select value={c.incoterm ?? ''} onChange={e => updateContract(c.id, 'incoterm', (e.target.value || undefined) as Contract['incoterm'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {INCOTERMS_2020.map(i => <option key={i.id} value={i.id}>{i.code} -- {isAr ? i.labelAr : i.label}</option>)}
                        </select>
                        {c.incoterm && (() => {
                          const it = INCOTERMS_2020.find(i => i.id === c.incoterm);
                          return it ? <p className="text-[10px] text-slate-400">{isAr ? it.noteAr : it.noteEn}</p> : null;
                        })()}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'العملة (اختياري، الافتراضي USD)' : 'Currency (optional, defaults to USD)'}</label>
                        <select value={c.currency ?? 'USD'} onChange={e => updateContract(c.id, 'currency', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          {ISO_4217_CURRENCIES.map(cur => <option key={cur.code} value={cur.code}>{cur.code} -- {isAr ? cur.labelAr : cur.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'شرط الدفع (اختياري)' : 'Payment Term (optional)'}</label>
                        <select value={c.paymentTerm ?? ''} onChange={e => updateContract(c.id, 'paymentTerm', (e.target.value || undefined) as Contract['paymentTerm'])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {PAYMENT_TERMS.map(p => <option key={p.id} value={p.id}>{isAr ? p.labelAr : p.label}</option>)}
                        </select>
                        {c.paymentTerm && (() => {
                          const pt = PAYMENT_TERMS.find(p => p.id === c.paymentTerm);
                          return pt ? <p className="text-[10px] text-slate-400">{isAr ? pt.riskNoteAr : pt.riskNoteEn}</p> : null;
                        })()}
                      </div>
                      {c.paymentTerm === 'open-account' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'عدد أيام الأجل (مثال: 30، 60، 90)' : 'Net Days (e.g. 30, 60, 90)'}</label>
                          <input type="number" value={c.paymentTermNetDays ?? ''} onChange={e => { const raw = e.target.value; updateContract(c.id, 'paymentTermNetDays', raw === '' ? undefined : parseInt(raw)); }}
                            placeholder="30" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'نوع التسعير الأساسي (اختياري)' : 'Primary Pricing Type (optional)'}</label>
                        <select value={c.pricingPrimary ?? ''} onChange={e => updateContract(c.id, 'pricingPrimary', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {PRICING_TYPES.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'نوع التسعير الثانوي (اختياري)' : 'Secondary Pricing Type (optional)'}</label>
                        <select value={c.pricingSecondary ?? ''} onChange={e => updateContract(c.id, 'pricingSecondary', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {PRICING_TYPES.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400">{isAr ? 'لهياكل التسعير المختلطة، مثل مبلغ إجمالي مع مبالغ احتياطية بسعر الوحدة' : 'For hybrid structures, e.g. a lump-sum primary with unit-price provisional sums'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'مدى وضوح النطاق (اختياري، تصريح ذاتي)' : 'Scope Definiteness (optional, self-declared)'}</label>
                        <select value={c.scopeDefiniteness ?? ''} onChange={e => updateContract(c.id, 'scopeDefiniteness', e.target.value || undefined)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          <option value="well-defined">{isAr ? 'محدد جيداً' : 'Well-defined'}</option>
                          <option value="evolving">{isAr ? 'متطور / قابل للتغيير' : 'Evolving'}</option>
                          <option value="uncertain">{isAr ? 'غير مؤكد إلى حد كبير' : 'Highly uncertain'}</option>
                        </select>
                        <p className="text-[10px] text-slate-400">{isAr ? 'يُستخدم مع نوع التسعير لتوليد تنبيه "يستحق نظرة ثانية" -- استناداً إلى ما تفيدون به فقط، وليس حكماً تحققنا منه' : 'Used with pricing type to drive a "worth a second look" flag -- based only on what you tell us, not a verified judgment'}</p>
                      </div>
                      {c.pricingPrimary === 'tm' && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`tmcap-${c.id}`} checked={c.pricingHasCapOrMilestones ?? false} onChange={e => updateContract(c.id, 'pricingHasCapOrMilestones', e.target.checked)} className="w-4 h-4 accent-[#082C6B]" />
                          <label htmlFor={`tmcap-${c.id}`} className="text-xs text-slate-600 font-medium">{isAr ? 'يوجد سقف مالي أو معالم واضحة لهذا العقد بالوقت والمواد' : 'This T&M contract has a cap or milestones'}</label>
                        </div>
                      )}
                      <div className="col-span-full space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'تفصيل التسعير حسب المرحلة (اختياري)' : 'Pricing Phase Breakdown (optional)'}</label>
                        {(c.pricingPhaseBreakdown ?? []).map((p, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input type="text" value={p.phase} onChange={e => updatePricingPhase(c.id, idx, 'phase', e.target.value)}
                              placeholder={isAr ? 'مثال: مرحلة الإنشاء' : 'e.g. Construct phase'}
                              className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                            <select value={p.pricingType} onChange={e => updatePricingPhase(c.id, idx, 'pricingType', e.target.value)} className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                              <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                              {PRICING_TYPES.map(t => <option key={t.id} value={t.id}>{isAr ? t.labelAr : t.label}</option>)}
                            </select>
                            <button onClick={() => removePricingPhase(c.id, idx)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addPricingPhase(c.id)} className="flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                          <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مرحلة' : 'Add Phase'}
                        </button>
                        <p className="text-[10px] text-slate-400">{isAr ? 'مثال: عقد Gold Book بمرحلة إنشاء بسعر GMP ومرحلة تشغيل بـ CPIF' : "e.g. a Gold Book contract's GMP construct phase and CPIF operate phase"}</p>
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
                      {/* -- Module 02: Clause Coverage (holistic, per-category
                           accordion with completion bars, a sensitivity-weighted
                           overall health score, consolidated cross-category risk
                           flags, per-category N/A opt-out, and a free-text special-
                           conditions escape hatch for bespoke clauses the fixed
                           56-subclause taxonomy doesn't cover) -- */}
                      <div className="col-span-full border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2.5 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{isAr ? 'تغطية بنود العقد' : 'Clause Coverage'}</p>
                            <p className="text-[10px] text-slate-400">{isAr ? `${presentSubclauseCount(c.clausesPresent)} من أصل ${totalSubclauseCount()} بنداً فرعياً تم تحديده` : `${presentSubclauseCount(c.clausesPresent)} of ${totalSubclauseCount()} subclauses checked`}</p>
                          </div>
                          {(() => {
                            const health = overallClauseHealth(c.clausesPresent, c.clauseCategoriesNotApplicable);
                            const color = health.weightedPercent >= 75 ? '#10b981' : health.weightedPercent >= 40 ? '#d97706' : health.weightedPercent > 0 ? '#ef4444' : '#94a3b8';
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${health.weightedPercent}%`, background: color }} />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color }}>{isAr ? health.labelAr : health.labelEn} ({health.weightedPercent}%)</span>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
                          <p className="text-[10px] text-blue-800 leading-relaxed">
                            {isAr
                              ? (c.governingLawClause
                                  ? `هذه قائمة تحقق ذاتية التصريح فقط، وليست استشارة قانونية -- isc لا تتحقق من نص العقد الفعلي في ضوء القانون المحدد، بل تتتبع وجود البنود وتُظهر تنبيهات نمطية معروفة وإرشادات ممارسة موثقة المصدر فقط. القانون الحاكم المحدد لهذا العقد هو ${governingLawTrackLabel(c.governingLawClause, true)}${c.arbitrationInstitution && c.arbitrationInstitution !== 'other' ? ` وجهة التحكيم المحددة هي ${arbitrationInstitutionLabel(c.arbitrationInstitution, true)}` : ''} -- يُنصح بمراجعة مستشار قانوني مؤهل لمراجعة نص العقد الفعلي في ضوء هذا القانون قبل التوقيع.`
                                  : 'هذه قائمة تحقق ذاتية التصريح فقط، وليست استشارة قانونية -- isc لا تتحقق من نص العقد الفعلي في ضوء أي قانون، بل تتتبع وجود البنود فقط. حدد القانون الحاكم أعلاه (الوحدة 01)، ويُنصح دوماً بمراجعة مستشار قانوني مؤهل لمراجعة نص العقد الفعلي قبل التوقيع.')
                              : (c.governingLawClause
                                  ? `This is a self-declared checklist, not legal advice -- ISC does not verify the actual contract text against the chosen law, it tracks clause presence and surfaces named risk patterns and sourced practice guidance only. This contract's governing law is set to ${governingLawTrackLabel(c.governingLawClause, false)}${c.arbitrationInstitution && c.arbitrationInstitution !== 'other' ? `, with ${arbitrationInstitutionLabel(c.arbitrationInstitution, false)} as the named arbitration institution` : ''} -- have qualified legal counsel review the actual contract text against that law before signing.`
                                  : 'This is a self-declared checklist, not legal advice -- ISC does not verify the actual contract text against any law, it tracks clause presence only. Set the governing law above (Module 01) -- and always have qualified legal counsel review the actual contract text before signing.')}
                          </p>
                        </div>

                        {(() => {
                          const flags = [
                            checkCommercialRibaFlag(c.clausesPresent, c.counterpartyJurisdiction, c.performanceLocation, c.governingLawClause),
                            checkPerformanceMeasurabilityFlag(c.clausesPresent),
                            checkRiskAllocationFidicMismatchFlag(c.clausesPresent, c.fidicBook),
                            checkForegroundIPGapFlag(c.clausesPresent, c.industryBucket),
                            checkGovernanceRibaArbitrationFlag(c.clausesPresent, c.counterpartyJurisdiction, c.performanceLocation, c.governingLawClause),
                          ].filter(f => f.flagged);
                          return flags.length > 0 ? (
                            <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 space-y-1">
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{isAr ? `${flags.length} نقطة تستحق نظرة ثانية عبر الفئات` : `${flags.length} Cross-Category Flag${flags.length > 1 ? 's' : ''}: Worth a Second Look`}</p>
                              {flags.map((f, i) => <p key={i} className="text-[10px] text-amber-800">{isAr ? f.reasonAr : f.reasonEn}</p>)}
                            </div>
                          ) : null;
                        })()}

                        <div className="divide-y divide-slate-100">
                          {CLAUSE_CATEGORIES.map(cat => {
                            const comp = categoryCompleteness(cat.id, c.clausesPresent, c.clauseCategoriesNotApplicable);
                            const catKey = `${c.id}:${cat.id}`;
                            const isCatOpen = expandedClauseCats.has(catKey);
                            const barColor = comp.status === 'complete' ? '#10b981' : comp.status === 'partial' ? '#d97706' : '#cbd5e1';
                            return (
                              <div key={cat.id}>
                                <button type="button" onClick={() => toggleClauseCategoryExpand(c.id, cat.id)} className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isCatOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                    <span className="text-xs font-semibold text-slate-700 truncate">{isAr ? cat.labelAr : cat.label}</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline-block" style={{ background: cat.sensitivity === 'low-moderate' ? '#f1f5f9' : '#fef3c7', color: cat.sensitivity === 'low-moderate' ? '#64748b' : '#92400e' }}>{isAr ? cat.sensitivityLabelAr : cat.sensitivityLabelEn}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {comp.status === 'not-applicable' ? (
                                      <span className="text-[10px] text-slate-400 italic">{isAr ? 'لا ينطبق' : 'N/A'}</span>
                                    ) : (
                                      <>
                                        <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${comp.percent}%`, background: barColor }} />
                                        </div>
                                        <span className="text-[10px] text-slate-400">{comp.present}/{comp.total}</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                                {isCatOpen && (
                                  <div className="px-3 pb-3 space-y-2">
                                    <p className="text-[10px] text-slate-400">{isAr ? cat.sensitivityNoteAr : cat.sensitivityNoteEn}</p>
                                    <label className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <input type="checkbox" checked={comp.status === 'not-applicable'} onChange={() => toggleClauseCategoryNA(c.id, cat.id)} className="w-3.5 h-3.5 accent-[#082C6B]" />
                                      {isAr ? 'هذه الفئة غير منطبقة على هذا العقد' : 'This category is not applicable to this contract'}
                                    </label>
                                    {comp.status !== 'not-applicable' && (
                                      <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                                          {SUBCLAUSES_BY_CATEGORY[cat.id].map(sc => {
                                            const checked = (c.clausesPresent?.[cat.id] ?? []).includes(sc.id);
                                            const help = isAr ? sc.helpAr : sc.helpEn;
                                            const isAtypical = !!(sc.typicalIndustryBuckets && c.industryBucket && !sc.typicalIndustryBuckets.includes(c.industryBucket));
                                            return (
                                              <div key={sc.id} className="space-y-1">
                                                <label className={`flex items-start gap-1.5 text-[11px] cursor-pointer ${isAtypical ? 'text-slate-400' : 'text-slate-600'}`} title={help}>
                                                  <input type="checkbox" checked={checked} onChange={() => toggleClauseSubclause(c.id, cat.id, sc.id)} className="w-3.5 h-3.5 mt-0.5 accent-[#082C6B] shrink-0" />
                                                  <span className="inline-flex items-center gap-1">{isAr ? sc.labelAr : sc.label}{help ? <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" aria-hidden="true" /> : null}{isAtypical ? <span className="italic">{isAr ? '(أقل شيوعاً لهذا القطاع)' : '(less common for this industry)'}</span> : null}</span>
                                                </label>
                                                {checked && sc.variants && (
                                                  <select value={c.clauseVariants?.[sc.id] ?? ''} onChange={e => updateClauseVariant(c.id, sc.id, e.target.value)}
                                                    className="w-full text-[10px] border border-slate-200 rounded-md px-1.5 py-1 ml-5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white text-slate-500" style={{ width: 'calc(100% - 1.25rem)' }}>
                                                    <option value="">{isAr ? 'أي شكل/نوع؟ (اختياري)' : 'Which shape/type? (optional)'}</option>
                                                    {sc.variants.map(v => <option key={v.id} value={v.id}>{isAr ? v.labelAr : v.label}</option>)}
                                                  </select>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <div className="space-y-1 pt-1">
                                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'شروط خاصة إضافية (نص حر، اختياري)' : 'Additional Special Conditions (free text, optional)'}</label>
                                          <textarea value={c.clauseSpecialConditions?.[cat.id] ?? ''} onChange={e => updateClauseSpecialCondition(c.id, cat.id, e.target.value)} rows={2}
                                            placeholder={isAr ? 'أي شرط خاص بهذا العقد لا تغطيه القائمة أعلاه (مثال: بند سرية غير معتاد، شرط خروج خاص بالعميل)' : 'Any bespoke condition specific to this contract not covered by the checklist above (e.g. an unusual NDA carve-out, a client-specific exit condition)'}
                                            className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* -- Module 09 Part B.6: The Contract Assurance Chain
                           (Review v1) -- cross-dimensional review reusing Modules
                           01/02/04/05's already-tested checks, assembled into
                           4 independently-colored dimension states (never one
                           composite score), per-finding causal chains, 3-tier
                           assurance badges, and real named options wherever a
                           sourced Module 02 variant list exists. Owner
                           instruction, 25 Aug 2026: review services must be
                           genuinely different in methodology, recommendation,
                           assurance, options, and causal logic -- not a cosmetic
                           reskin. -- */}
                      <div className="col-span-full border border-slate-200 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => toggleReviewExpand(c.id)} className="w-full bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            {expandedReview.has(c.id) ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <div>
                              <p className="text-xs font-bold text-slate-700">{isAr ? 'سلسلة ضمان العقد (المراجعة)' : 'The Contract Assurance Chain (Review)'}</p>
                              <p className="text-[10px] text-slate-400">{isAr ? 'مراجعة متعددة الأبعاد مبنية على ما تم تحديده أعلاه' : 'Cross-dimensional review built from what\'s entered above'}</p>
                            </div>
                          </div>
                        </button>
                        {expandedReview.has(c.id) && (
                          <div className="px-3 py-3 border-t border-slate-100">
                            <ContractReviewReport isAr={isAr} input={{
                              clausesPresent: c.clausesPresent,
                              clauseCategoriesNotApplicable: c.clauseCategoriesNotApplicable,
                              counterpartyType: c.counterpartyType,
                              governingLawClause: c.governingLawClause,
                              counterpartyJurisdiction: c.counterpartyJurisdiction,
                              performanceLocation: c.performanceLocation,
                              pricingPrimary: c.pricingPrimary,
                              scopeDefiniteness: c.scopeDefiniteness,
                              pricingHasCapOrMilestones: c.pricingHasCapOrMilestones,
                              startDate: c.startDate,
                              endDate: c.endDate,
                              industryBucket: c.industryBucket,
                              fidicBook: c.fidicBook,
                              professionalServicesTrack: c.professionalServicesTrack,
                              logisticsMode: c.logisticsMode,
                            }} />
                          </div>
                        )}
                      </div>
                      {/* -- Module 09 Part A, Option 1: Generation v1 skeleton
                           (NDA pilot, owner-approved recommendation 25 Aug
                           2026; MSA pilot added 26 Aug 2026, item 53 --
                           follow-on to item 46's resolution that MSA is the
                           next real-client pilot contract type). Real facts +
                           a classified clause outline with guidance notes --
                           no clause language is drafted (Decision Record 8.7:
                           Module 02 is a categorized framework, not a
                           drafting-ready clause bank). Gated on contract type
                           'nda' or 'msa' -- the two piloted types; not yet
                           generalized to every ContractType value. -- */}
                      {(c.type === 'nda' || c.type === 'msa') && (
                        <div className="col-span-full border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                {c.type === 'msa'
                                  ? (isAr ? 'هيكل الاتفاقية الإطارية (الإصدار 1)' : 'MSA Skeleton (v1)')
                                  : (isAr ? 'هيكل اتفاقية السرية (الإصدار 1)' : 'NDA Skeleton (v1)')}
                              </p>
                              <p className="text-[10px] text-slate-400">{isAr ? 'وقائع + مخطط بنود مصنّف -- بدون صياغة نصوص قانونية' : 'Facts + a classified clause outline -- no clause language drafted'}</p>
                            </div>
                            <button type="button" onClick={() => {
                              const genInput = {
                                parties: [{ name: c.name, role: isAr ? 'طرف' : 'Party' }, { name: c.supplier, role: isAr ? 'طرف' : 'Party' }],
                                effectiveDate: c.startDate,
                                termDuration: c.endDate ? `${c.startDate} - ${c.endDate}` : undefined,
                                governingLawClause: c.governingLawClause,
                                counterpartyJurisdiction: c.counterpartyJurisdiction,
                                performanceLocation: c.performanceLocation,
                                counterpartyType: c.counterpartyType,
                                industryBucket: c.industryBucket,
                                clausesPresent: c.clausesPresent,
                                disputeResolutionVariant: c.clauseVariants?.['dispute-resolution'],
                                customStakeholders: c.customStakeholders,
                              };
                              const skeleton = c.type === 'msa' ? buildMsaSkeleton(genInput) : buildNdaSkeleton(genInput);
                              downloadText(`${c.name || c.type}-skeleton-${isAr ? 'ar' : 'en'}.txt`, renderSkeletonAsText(skeleton, isAr));
                            }} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#082C6B] text-white hover:bg-[#082C6B]/90 transition-colors shrink-0">
                              {isAr ? 'تنزيل الهيكل' : 'Download Skeleton'}
                            </button>
                          </div>
                          {/* -- Item 50: the derived 8-role involvement map is
                               fixed and confirmed; this is the client's escape
                               hatch to name extra stakeholders for a
                               special-case relationship, never a substitute
                               for the derived roles. -- */}
                          <div className="px-3 py-2.5 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'أطراف إضافية مقترحة (اختياري)' : 'Additional Stakeholders (optional)'}</label>
                                <p className="text-[9px] text-slate-400 mt-0.5">{isAr ? 'لحالات خاصة تحتاج طرفاً لم تشمله خريطة الأدوار الثمانية المشتقة أعلاه' : 'For special cases needing a role the derived 8-role map above doesn\'t cover'}</p>
                              </div>
                              <button type="button" onClick={() => addCustomStakeholder(c.id)} className="flex items-center gap-1 text-[10px] font-semibold text-[#082C6B] hover:opacity-80 shrink-0">
                                <Plus className="w-3 h-3" />{isAr ? 'إضافة' : 'Add'}
                              </button>
                            </div>
                            {(c.customStakeholders ?? []).map((s, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input type="text" value={s} onChange={e => updateCustomStakeholder(c.id, idx, e.target.value)}
                                  placeholder={isAr ? 'مثال: منسق راعٍ خارجي' : 'e.g. External Sponsor Liaison'}
                                  className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                                <button type="button" onClick={() => removeCustomStakeholder(c.id, idx)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0" aria-label={isAr ? 'إزالة' : 'Remove'}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* -- TAB 2: Renewal Pipeline -- */}
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
                <p className="text-sm font-bold text-red-800">{isAr ? `${expiredContracts.length} عقد منتهٍ — يتطلب إجراءاً فورياً` : `${expiredContracts.length} Expired Contract${expiredContracts.length > 1 ? 's' : ''} — Immediate Action Required`}</p>
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
                          <span><span className="font-semibold text-slate-600">{isAr ? 'فترة الإشعار:' : 'Notice:'}</span> {c.noticePeriodDays} {isAr ? 'يوم' : 'd'} {noticeDue > 0 ? `(${isAr ? 'يُشعر في' : 'due in'} ${noticeDue}${isAr ? ' يوم' : 'd'})` : `(${isAr ? 'متأخر!' : 'OVERDUE!'})`}</span>
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

      {/* -- TAB 3: Portfolio Health -- */}
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

      {/* -- TAB: RFx Builder (Module 03 Part D, closes registry #394) -- */}
      {activeTab === 'rfx' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {isAr
                ? 'أداة اتجاهية بحتة -- ليست رأياً قانونياً أو استشارة مشتريات رسمية. تساعد على اختيار نوع الطلب (RFI/RFP/RFQ) وتقييم العروض عبر مصفوفة أوزان قابلة للتعديل.'
                : 'Purely directional, T1 pure-logic tool -- not legal or formal procurement advice. Helps select the right RFx type (RFI/RFP/RFQ) and evaluate bidder responses through an editable weighted-scoring matrix.'}
            </p>
          </div>

          {/* -- Selection helper -- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-800">{isAr ? 'أي نوع طلب تحتاج؟' : 'Which RFx type do you need?'}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={rfxSelection.specificationsFixed}
                  onChange={e => setRfxSelection(prev => ({ ...prev, specificationsFixed: e.target.checked }))} />
                {isAr ? 'المواصفات محددة وثابتة' : 'Specifications are fixed'}
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={rfxSelection.supplierCapabilityKnown}
                  onChange={e => setRfxSelection(prev => ({ ...prev, supplierCapabilityKnown: e.target.checked }))} />
                {isAr ? 'قدرات الموردين/السوق معروفة' : 'Supplier capability / market is known'}
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={rfxSelection.needsApproachComparison}
                  onChange={e => setRfxSelection(prev => ({ ...prev, needsApproachComparison: e.target.checked }))} />
                {isAr ? 'أحتاج مقارنة نُهج/حلول الموردين، لا السعر فقط' : 'I need to compare supplier approaches, not just price'}
              </label>
            </div>
            <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-3 flex items-start gap-3">
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#082C6B] text-white shrink-0">
                {rfxTypeLabel(rfxRecommendation.type, isAr)}
              </span>
              <p className="text-xs text-slate-600">{isAr ? rfxRecommendation.reasonAr : rfxRecommendation.reasonEn}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {RFX_TYPES.map(t => (
                <div key={t.id} className={`rounded-lg border px-3 py-2 ${rfxRecommendation.type === t.id ? 'border-[#082C6B] bg-[#082C6B]/5' : 'border-slate-200'}`}>
                  <p className="text-[11px] font-bold text-slate-700">{isAr ? t.labelAr : t.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? t.purposeAr : t.purposeEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* -- Weighted scoring matrix -- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-bold text-slate-800">{isAr ? 'مصفوفة تقييم العروض المرجّحة' : 'Weighted Bidder Scoring Matrix'}</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${rfxWeightSum === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isAr ? `إجمالي الأوزان: ${rfxWeightSum}%` : `Weights sum to ${rfxWeightSum}%`}{rfxWeightSum !== 100 ? (isAr ? ' (يجب أن يساوي 100%)' : ' (should equal 100%)') : ''}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr
                ? 'بوابة الامتثال الإلزامي تُفحص أولاً (نجاح/رسوب) قبل بدء التقييم المرجّح -- نمط من مرحلتين موثّق في الوحدة 03، الجزء D.'
                : 'The mandatory-compliance gate is checked first (pass/fail) before weighted scoring begins -- the two-stage pattern sourced in Module 03 Part D.'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-1.5 pr-2">{isAr ? 'مقدّم العرض' : 'Bidder'}</th>
                    <th className="py-1.5 px-2">{isAr ? 'اجتاز البوابة الإلزامية' : 'Passed Gate'}</th>
                    {rfxCriteria.filter(c => !c.isMandatoryGate).map(c => (
                      <th key={c.id} className="py-1.5 px-2">
                        <div className="space-y-0.5">
                          <p>{isAr ? c.labelAr : c.labelEn}</p>
                          <input type="number" min={0} max={100} value={c.weight}
                            onChange={e => updateRfxCriterionWeight(c.id, parseFloat(e.target.value) || 0)}
                            className="w-14 text-[10px] border border-slate-200 rounded px-1 py-0.5 font-bold" />
                          <span className="text-[9px] text-slate-400">%</span>
                        </div>
                      </th>
                    ))}
                    <th className="py-1.5 px-2">{isAr ? 'المجموع المرجّح' : 'Weighted Total'}</th>
                    <th className="py-1.5 pl-2" />
                  </tr>
                </thead>
                <tbody>
                  {rfxBidders.map(b => {
                    const result = rfxResults.find(r => r.bidderId === b.bidderId);
                    return (
                      <tr key={b.bidderId} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2">
                          <input value={b.bidderName} onChange={e => updateRfxBidder(b.bidderId, { bidderName: e.target.value })}
                            placeholder={isAr ? 'اسم المورد' : 'Bidder name'}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input type="checkbox" checked={b.passedMandatoryGate}
                            onChange={e => updateRfxBidder(b.bidderId, { passedMandatoryGate: e.target.checked })} />
                        </td>
                        {rfxCriteria.filter(c => !c.isMandatoryGate).map(c => (
                          <td key={c.id} className="py-1.5 px-2">
                            <input type="number" min={0} max={100} disabled={!b.passedMandatoryGate}
                              value={b.scores[c.id] ?? ''}
                              onChange={e => updateRfxBidderScore(b.bidderId, c.id, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-16 text-xs border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50 disabled:text-slate-300" />
                          </td>
                        ))}
                        <td className="py-1.5 px-2 font-bold">
                          {result?.disqualified ? (
                            <span className="text-[10px] text-red-600">{isAr ? 'مستبعد' : 'Disqualified'}</span>
                          ) : (
                            result?.weightedTotal ?? '--'
                          )}
                        </td>
                        <td className="py-1.5 pl-2">
                          <button onClick={() => removeRfxBidder(b.bidderId)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={addRfxBidder}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold text-[#082C6B] border border-[#082C6B]/30 hover:bg-[#082C6B]/5">
              <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مقدّم عرض' : 'Add Bidder'}
            </button>
          </div>

          {/* -- Ranked results -- */}
          {rfxBidders.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-sm font-bold text-slate-800">{isAr ? 'الترتيب النهائي' : 'Final Ranking'}</p>
              {rfxResultsSorted.map((r, idx) => (
                <div key={r.bidderId} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-[11px] font-bold text-slate-400 w-5">{r.disqualified ? '--' : `#${idx + 1}`}</span>
                  <span className="flex-1 text-xs font-semibold text-slate-700">{r.input?.bidderName || (isAr ? '(بدون اسم)' : '(unnamed)')}</span>
                  {r.disqualified ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                      <AlertTriangle className="w-3 h-3" />{isAr ? 'مستبعد -- لم يجتز البوابة الإلزامية' : 'Disqualified -- failed mandatory gate'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle className="w-3 h-3" />{r.weightedTotal}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* -- #395 (Priority 1): Category-Aware RFx Scope Build & Review Engine -- */}
          <div className="bg-white border-2 border-[#082C6B]/20 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800">{isAr ? 'أداة بناء نطاق العمل حسب الفئة (#395)' : 'Category-Aware Scope Builder (#395)'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'يُشتق نطاق العمل من الفئة الصناعية ونوع RFx ومستوى التعقيد -- وليس نموذجاً عاماً واحداً. مصادر حقيقية وموثقة، راجع القسم 8 من وثيقة الوحدة 03.' : 'The scope is derived from industry bucket + RFx type + complexity level -- not one generic form. Real, sourced methodology; see Module 03 doc Section 8.'}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">{isAr ? 'الفئة الصناعية' : 'Industry Bucket'}</label>
                <select value={rfxScopeBucket} onChange={e => setRfxScopeBucket(e.target.value as IndustryBucket)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                  <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
                  {INDUSTRY_BUCKETS.map(b => <option key={b.id} value={b.id}>{isAr ? b.labelAr : b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">{isAr ? 'مستوى التعقيد' : 'Complexity Level'}</label>
                <select value={rfxScopeComplexity} onChange={e => setRfxScopeComplexity(e.target.value as ComplexityLevel)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                  {COMPLEXITY_LEVELS.map(c => <option key={c.id} value={c.id}>{isAr ? c.labelAr : c.label}</option>)}
                </select>
              </div>
            </div>

            {rfxScopeProfile && (
              <>
                {/* Spec-type decision (CIPS) */}
                <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-[#082C6B]">{isAr ? SPEC_TYPE_META[rfxScopeProfile.specType.type].labelAr : SPEC_TYPE_META[rfxScopeProfile.specType.type].labelEn}</p>
                  <p className="text-xs text-slate-600 mt-1">{isAr ? rfxScopeProfile.specType.reasonAr : rfxScopeProfile.specType.reasonEn}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{isAr ? rfxScopeProfile.specType.sourceAr : rfxScopeProfile.specType.sourceEn}</p>
                </div>

                {/* Elicitation guidance (BABOK) */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-amber-800">{isAr ? 'كيفية جمع المتطلبات' : 'How to Gather These Requirements'}</p>
                  <p className="text-xs text-amber-900 mt-1">{isAr ? rfxScopeProfile.elicitation.techniqueAr : rfxScopeProfile.elicitation.techniqueEn}</p>
                  <p className="text-[11px] text-amber-700 mt-1">{isAr ? rfxScopeProfile.elicitation.reasonAr : rfxScopeProfile.elicitation.reasonEn}</p>
                </div>

                {/* WBS-anchored deliverable skeleton (PMI) */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1.5">{isAr ? 'هيكل تجزئة العمل (WBS)' : 'Work Breakdown Structure (WBS)'}</p>
                  <div className="space-y-1.5">
                    {rfxScopeProfile.wbsSkeleton.map(node => (
                      <label key={node.id} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                        <input type="checkbox" className="mt-0.5" checked={!!rfxWbsFilled[node.id]} onChange={() => toggleRfxWbsNode(node.id)} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{isAr ? node.labelAr : node.labelEn}</p>
                          <p className="text-[11px] text-slate-500">{isAr ? node.guidanceAr : node.guidanceEn}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mandatory field library, sourced per bucket/RFx-type */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1.5">{isAr ? 'الحقول الإلزامية لهذه الفئة' : 'Mandatory Fields for This Category'}</p>
                  <div className="space-y-1.5">
                    {rfxScopeProfile.mandatoryFields.map(field => {
                      const entry = rfxFieldEntries[field.id];
                      return (
                        <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <div className="flex items-start gap-2">
                            <input type="checkbox" className="mt-0.5" checked={!!entry?.entered} onChange={() => toggleRfxFieldEntered(field.id)} />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-700">{isAr ? field.labelAr : field.labelEn}</p>
                              <p className="text-[11px] text-slate-500">{isAr ? field.whyAr : field.whyEn}</p>
                            </div>
                          </div>
                          {field.mustBeMeasurable && (
                            <label className="flex items-center gap-1.5 mt-1.5 ml-6 cursor-pointer">
                              <input type="checkbox" checked={!!entry?.selfDeclaredMeasurable} onChange={() => toggleRfxFieldMeasurable(field.id)} />
                              <span className="text-[11px] text-slate-500">{isAr ? 'أؤكد أن هذا الحقل محدد/قابل للقياس' : 'I confirm this field is specific/measurable'}</span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Draft-RFx completeness summary -- real computed counts, never a fabricated single score */}
                {rfxDraftReview && (
                  <div className={`rounded-xl p-3 border ${rfxDraftReview.counts.missing === 0 && rfxDraftReview.counts.presentVague === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className={`text-[11px] font-bold ${rfxDraftReview.counts.missing === 0 && rfxDraftReview.counts.presentVague === 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                      {isAr ? `${rfxDraftReview.counts.presentMeasurable} من ${rfxDraftReview.counts.mandatoryFieldsTotal} حقلاً مكتمل ومحدد -- ${rfxDraftReview.counts.wbsNodesFilled} من ${rfxDraftReview.counts.wbsNodesTotal} من هيكل تجزئة العمل` : `${rfxDraftReview.counts.presentMeasurable} of ${rfxDraftReview.counts.mandatoryFieldsTotal} fields complete & measurable -- ${rfxDraftReview.counts.wbsNodesFilled} of ${rfxDraftReview.counts.wbsNodesTotal} WBS nodes filled`}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{isAr ? rfxDraftReview.summaryAr : rfxDraftReview.summaryEn}</p>
                  </div>
                )}

                {/* Supplier-response compliance matrix (requirements traceability) */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1.5">{isAr ? 'مراجعة استجابة المورد (مصفوفة تتبع المتطلبات)' : "Review a Supplier's Response (Requirements Traceability Matrix)"}</p>
                  <div className="space-y-1.5">
                    {rfxScopeProfile.mandatoryFields.map(field => {
                      const entry = rfxResponseEntries[field.id];
                      return (
                        <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={!!entry?.answered} onChange={() => toggleRfxResponseAnswered(field.id)} />
                            <span className="text-[11px] text-slate-500">{isAr ? 'أُجيب' : 'Answered'}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={!!entry?.selfDeclaredSpecific} onChange={() => toggleRfxResponseSpecific(field.id)} />
                            <span className="text-[11px] text-slate-500">{isAr ? 'محدد' : 'Specific'}</span>
                          </label>
                          <span className="flex-1 text-xs font-semibold text-slate-700">{isAr ? field.labelAr : field.labelEn}</span>
                        </div>
                      );
                    })}
                  </div>
                  {rfxResponseReview && (
                    <div className={`mt-2 rounded-xl p-3 border ${rfxResponseReview.counts.notAnswered === 0 && rfxResponseReview.counts.placeholderOrVague === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-xs text-slate-600">{isAr ? rfxResponseReview.summaryAr : rfxResponseReview.summaryEn}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* -- TAB 4: Templates -- */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'قوالب عقود مُصمّمة وفق القانون السعودي وأفضل الممارسات الدولية في إدارة دورة حياة العقود.' : 'Contract templates designed for Saudi law and international CLM best practice.'}</p>
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

      {/* -- TAB 5: AI Portfolio Brief -- */}
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
