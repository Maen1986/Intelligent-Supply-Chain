/**
 * Category Management Toolkit — World-Class Procurement Solution
 *
 * Five integrated stages following CIPS Category Management methodology:
 * 1. Spend Analysis        — portfolio mapping, Pareto, concentration metrics
 * 2. Market Intelligence   — Porter's 5 Forces, market attractiveness scoring
 * 3. Sourcing Strategy     — auto-recommended strategy + 7-strategy explorer
 * 4. Templates & Tools     — downloadable RFP, evaluation scorecard, TCO calculator
 * 5. AI Category Brief     — AI-generated full category strategy document
 */
import React, { useState, useCallback, useMemo, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import {
  ComposedChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Upload, Download, Plus, Trash2, ChevronDown, ChevronUp,
  BarChart3, Globe, Target, FileDown, Sparkles, TrendingUp,
  AlertTriangle, CheckCircle, Info, Bell, Save } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { INDUSTRIES, type IndustryKey } from '@/lib/kpiBenchmarksByIndustry';
import { SKU_CLASSES, type SkuClassKey } from '@/lib/kpiBenchmarksBySkuClass';
import { INDUSTRY_SUB_SECTORS } from '@/lib/industrySubSectors';
import { UNSPSC_SERVICES_SEGMENTS, unspscSegmentLabel } from '@/lib/unspscSegments';
import { TCO_STAGES, TCO_FIELDS, TCO_CHECKLIST_BY_SKU_CLASS, TCO_SOURCES, type TcoStageId } from '@/lib/tcoKnowledgeBase';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { toast } from 'sonner';
// #165 (TCO max-enhance: wire into other engines) -- real cross-engine read
// of the Supplier Scorecard roster already saved by the user, so a TCO
// supplier can be matched to its real performance rating instead of the
// user re-entering the same judgement twice. Read-only import of existing,
// already-exported pure functions; no new coupling of write paths.
import { loadRoster as loadScorecardRoster, loadConfig as loadScorecardConfig } from '@/components/toolkit/SupplierScorecard';
import { calcDimScore } from '@/lib/scorecardCsv';
// #174 (Wave B-3 cross-engine wiring) -- real, read-only cross-engine
// read of the Revenue-at-Risk (RAR) figure the client already computed
// in the Resiliency toolkit, for the Working Capital Control Tower below.
import { RAR_INTERDEPENDENCY_CORRECTION_PCT, RAR_DURATION_BENCHMARKS_DAYS } from '@/lib/resilienceCaseStudies';

interface ProcurementToolsProps { isAr: boolean; }

// ─── Print zone helper (#167, "TCO reporting: PDF export") ──────────────────
// Mirrors the same pattern used by RiskTools.tsx / SupplierScorecard.tsx /
// DecisionLab.tsx / ChallengeChecklists.tsx -- each file keeps its own local
// copy rather than sharing one, matching this codebase's existing convention.
function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

// ─── Working Capital Control Tower sources (#169) ────────────────────────────
// Real, verified citations for the Cash Conversion Cycle methodology --
// checked live via web search before being embedded (Decision Record 8.7:
// no invented URLs).
const WC_SOURCES: { label: string; url: string }[] = [
  { label: 'Cash Conversion Cycle -- Overview, Formula, Example (Corporate Finance Institute)', url: 'https://corporatefinanceinstitute.com/resources/accounting/cash-conversion-cycle/' },
  { label: 'Understanding & Optimizing Your Cash Conversion Cycle (J.P. Morgan Treasury Insights)', url: 'https://www.jpmorgan.com/insights/treasury/receivables/understanding-and-optimizing-your-cash-conversion-cycle' },
];

// ─── Opportunity / Spend Variance Finder sources (#170) ───────────────────────
// Real, verified citations for the Purchase Price Variance (PPV) methodology
// -- checked live via web search before being embedded (Decision Record 8.7:
// no invented URLs).
const SV_SOURCES: { label: string; url: string }[] = [
  { label: 'Purchase Price Variance (PPV): Calculation, Factors, Influence Explained (GEP Blog)', url: 'https://www.gep.com/blog/strategy/purchase-price-variance-calculation-factors-influence-explained' },
  { label: 'What Is Purchase Price Variance (PPV) & How To Calculate It (Ramp)', url: 'https://ramp.com/blog/purchase-price-variance' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpendRow {
  id: string;
  supplier: string;
  category: string;
  subcategory: string;
  /** Optional UNSPSC services segment code (2-digit), Phase 1 -- see
   *  lib/unspscSegments.ts. Additive alongside free-text category/
   *  subcategory; never auto-populated, manual selection only. */
  unspscSegmentCode?: string;
  /** Free-text fallback when the client's real category isn't one of the 16
   *  sourced UNSPSC segments yet (set when unspscSegmentCode === 'other').
   *  Captures what they were actually looking for, not a fabricated code. */
  unspscSegmentOther?: string;
  annualSpend: number;
  contracted: boolean;
  strategic: boolean;
  notes: string;
}

interface PorterForce {
  id: string;
  label: string;
  labelAr: string;
  hint: string;
  hintAr: string;
  score: number; // 1-5: 1=low threat/power, 5=high threat/power
  notes: string;
}

const PORTER_FORCES: Omit<PorterForce, 'score' | 'notes'>[] = [
  { id: 'supplier_power',    label: 'Supplier Power',           labelAr: 'قوة الموردين',            hint: 'How much leverage do suppliers hold? Few suppliers, high switching cost = high power.', hintAr: 'كم يملك الموردون من قوة تفاوضية؟ قلة الموردين وارتفاع تكاليف التحول = قوة عالية.' },
  { id: 'buyer_power',       label: 'Buyer Power',              labelAr: 'قوة المشترين',             hint: 'How much leverage do buyers (your customers) hold? Large, price-sensitive buyers = high power.', hintAr: 'كم يملك المشترون من قوة؟ المشترون الكبار الحساسون للسعر = قوة عالية.' },
  { id: 'new_entrants',      label: 'Threat of New Entrants',   labelAr: 'تهديد الداخلين الجدد',    hint: 'How easy is it for new suppliers to enter this market? Low barriers = high threat.', hintAr: 'ما مدى سهولة دخول موردين جدد لهذا السوق؟ حواجز منخفضة = تهديد عالٍ.' },
  { id: 'substitutes',       label: 'Threat of Substitutes',    labelAr: 'تهديد المنتجات البديلة',  hint: 'Can this item/service be replaced by an alternative? Many alternatives = high threat.', hintAr: 'هل يمكن استبدال هذا الصنف بديل؟ بدائل كثيرة = تهديد عالٍ.' },
  { id: 'rivalry',           label: 'Competitive Rivalry',      labelAr: 'حدة التنافس',             hint: 'How intense is competition among existing suppliers? More rivals = better for you as a buyer.', hintAr: 'ما مدى حدة التنافس بين الموردين الحاليين؟ المزيد من المنافسين = أفضل للمشتري.' },
];

const STRATEGIES = [
  { id: 'strategic-partnership', icon: '🤝', label: 'Strategic Partnership', labelAr: 'شراكة استراتيجية', when: 'High spend + high supply risk (Strategic quadrant)', whenAr: 'إنفاق مرتفع + مخاطر عالية (ربع استراتيجي)', desc: 'Long-term collaborative partnership with a single preferred supplier. Joint business plans, co-investment, shared risk.', descAr: 'شراكة تعاونية طويلة الأمد مع مورد مفضّل واحد. خطط أعمال مشتركة، استثمار مشترك، تقاسم المخاطر.', actions: ['Negotiate 3–5 year framework agreement with annual price review', 'Establish joint business plan with shared KPIs and milestones', 'Invest in supplier development — co-fund capability improvements', 'Set up executive-level governance (quarterly steering committee)', 'Integrate supplier into S&OP for demand visibility'] },
  { id: 'dual-source',           icon: '⚖️', label: 'Dual Sourcing', labelAr: 'مصدران للتوريد', when: 'High spend + medium risk (Leverage/transitioning)', whenAr: 'إنفاق مرتفع + مخاطر متوسطة', desc: 'Two pre-qualified suppliers with volume split (typically 70/30). Maintains competitive tension while securing supply.', descAr: 'مورّدان مؤهّلان مسبقاً مع توزيع الحجم (عادةً 70/30). يحافظ على التنافسية مع ضمان الإمداد.', actions: ['Qualify and contract primary (70%) + secondary (30%) supplier', 'Run annual RFQ to maintain competitive pricing', 'Rebalance split if primary supplier performance degrades', 'Negotiate volume rebates with primary based on total commitment', 'Review split quarterly in supplier performance meetings'] },
  { id: 'competitive-tender',    icon: '🏆', label: 'Competitive Tendering', labelAr: 'مناقصة تنافسية', when: 'High spend + low supply risk (Leverage quadrant)', whenAr: 'إنفاق مرتفع + مخاطر منخفضة (ربع الرافعة)', desc: 'Open-market RFQ/RFP to 3–5 qualified suppliers. Maximises competition and achieves best value.', descAr: 'طرح عروض مفتوح لـ 3–5 موردين مؤهّلين. يعظّم التنافسية ويحقق أفضل قيمة.', actions: ['Issue RFP/RFQ to minimum 3 pre-qualified suppliers', 'Set weighted evaluation criteria: price 50%, quality 30%, delivery 20%', 'Use reverse auction for commodity-like, well-specified items', 'Award 12–24 month frame agreement with performance review clause', 'Re-tender every 12–24 months to maintain competitive pressure'] },
  { id: 'preferred-supplier',    icon: '⭐', label: 'Preferred Supplier Programme', labelAr: 'برنامج الموردين المفضّلين', when: 'Medium spend + medium risk', whenAr: 'إنفاق متوسط + مخاطر متوسطة', desc: 'Pre-qualified panel of 2–3 approved suppliers. Call-off from panel. Reduces transaction cost while maintaining choice.', descAr: 'لائحة مؤهّلة مسبقاً من 2–3 موردين معتمدين. طلبات من اللائحة. يقلل تكاليف المعاملات مع الحفاظ على الخيار.', actions: ['Establish Approved Vendor List (AVL) with pre-agreed pricing and SLAs', 'Issue call-off orders without full RFQ for each transaction', 'Review and renew panel annually', 'Score and tier suppliers (Preferred / Approved / Conditional)', 'Apply automatic scorecard-based tier upgrades and downgrades'] },
  { id: 'reverse-auction',       icon: '📉', label: 'Reverse Auction / e-Auction', labelAr: 'مزاد عكسي إلكتروني', when: 'Price-dominant + multiple qualified suppliers', whenAr: 'هيمنة السعر + عدة موردين مؤهّلين', desc: 'Online competitive auction where suppliers bid price down in real time. Best for well-specified, commodity-type spend.', descAr: 'مزاد تنافسي إلكتروني يتنافس فيه الموردون على خفض السعر لحظياً. الأنسب للمواصفات الموحّدة والسلع النمطية.', actions: ['Pre-qualify minimum 3 suppliers as eligible to participate', 'Ensure specification is unambiguous — no technical uncertainty', 'Set reserve price based on should-cost analysis', 'Run auction for 30–90 minutes with automated extensions', 'Award to lowest bid that meets all qualifying criteria'] },
  { id: 'consortium',            icon: '🤜', label: 'Consortium / GPO Buying', labelAr: 'شراء مشترك / مجموعة الشراء', when: 'Low-medium spend + commodity items', whenAr: 'إنفاق منخفض–متوسط + سلع نمطية', desc: 'Join a Group Purchasing Organisation or buying consortium to aggregate volume and access framework pricing.', descAr: 'الانضمام إلى مجموعة شراء لتجميع الحجم والوصول إلى أسعار الإطار.', actions: ['Identify and evaluate relevant GPO/consortium for this category', 'Compare GPO pricing vs own direct negotiation baseline', 'Assess admin fee vs savings — ensure net benefit is positive', 'Integrate GPO catalogue into e-procurement / ERP punchout', 'Review annually — categories may graduate to direct sourcing'] },
  { id: 'insource',              icon: '🏭', label: 'Insource / Make Internally', labelAr: 'التصنيع الداخلي', when: 'Critical capability + acceptable investment case', whenAr: 'قدرة حرجة + جدوى استثمار مقبولة', desc: 'Build the capability internally when external supply is too risky, too expensive, or strategically sensitive.', descAr: 'بناء القدرة داخلياً عندما يكون التوريد الخارجي شديد الخطورة أو مكلفاً أو حساساً استراتيجياً.', actions: ['Complete make-vs-buy analysis with full TCO comparison', 'Assess capital investment, payback period, and internal competency', 'Identify talent/equipment requirements', 'Plan transition — do not exit supply market abruptly', 'Maintain at least one external qualified supplier as a benchmark'] },
];

// ─── KPI Alert Threshold definitions ─────────────────────────────────────────

interface KpiThresholdCfg {
  warn:            number;
  critical:        number;
  higherIsBetter?: boolean;
  label?:          string;
}

/** Draft shape — both fields are optional while the user is typing. */
interface KpiThresholdDraft {
  warn?:     number;
  critical?: number;
}

/** The three derived KPIs that users can configure alert thresholds for. */
const KPI_THRESHOLD_DEFS = [
  {
    key:            'contractedPct',
    label:          'Contracted %',
    labelAr:        'الإنفاق المتعاقد %',
    hint:           'Warn when contracted spend falls below this level.',
    hintAr:         'تحذير عند انخفاض الإنفاق المتعاقد عن هذا المستوى.',
    higherIsBetter: true,
    unit:           '%',
    min:            0,
    max:            100,
  },
  {
    key:            'top3Pct',
    label:          'Top-3 Concentration %',
    labelAr:        'تركّز أعلى 3 موردين %',
    hint:           'Warn when the top-3 supplier spend share exceeds this level.',
    hintAr:         'تحذير عند تجاوز نسبة الإنفاق مع أعلى 3 موردين.',
    higherIsBetter: false,
    unit:           '%',
    min:            0,
    max:            100,
  },
  {
    key:            'porterAvg',
    label:          'Market Risk Score',
    labelAr:        'درجة مخاطر السوق',
    hint:           'Warn when the average Porter\'s Five Forces score exceeds this level.',
    hintAr:         'تحذير عند تجاوز متوسط قوى بورتر الخمس.',
    higherIsBetter: false,
    unit:           '/5',
    min:            1,
    max:            5,
  },
] as const;

type KpiKey = typeof KPI_THRESHOLD_DEFS[number]['key'];

/**
 * Compute breach severity for a single KPI value against its threshold.
 * Returns null when within acceptable limits.
 */
function kpiBreachLevel(value: number, cfg: KpiThresholdCfg): 'warn' | 'critical' | null {
  if (cfg.higherIsBetter) {
    if (value <= cfg.critical) return 'critical';
    if (value <= cfg.warn)     return 'warn';
  } else {
    if (value >= cfg.critical) return 'critical';
    if (value >= cfg.warn)     return 'warn';
  }
  return null;
}

function nid() { return Math.random().toString(36).slice(2, 10); }

function defaultRow(): SpendRow {
  return { id: nid(), supplier: '', category: '', subcategory: '', annualSpend: 0, contracted: false, strategic: false, notes: '' }; // unspscSegmentCode/Other intentionally omitted -- optional, manual only
}

// ─── Template generators ──────────────────────────────────────────────────────

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function downloadCsvText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATES = [
  {
    id: 'spend', icon: '📊', label: 'Spend Analysis Template', labelAr: 'نموذج تحليل الإنفاق',
    desc: 'Pre-formatted CSV for uploading supplier spend data into this tool.', descAr: 'نموذج CSV جاهز لرفع بيانات الإنفاق إلى هذه الأداة.',
    generate: () => downloadCsvText('spend-analysis-template.csv',
      'Supplier,Category,Subcategory,UNSPSC Segment Code (optional),Annual Spend (SAR),YTD Spend (SAR),Contracted (Yes/No),Strategic (Yes/No),Notes\n' +
      'Saudi Aramco Trading,Raw Materials,Chemicals,1200000,900000,Yes,Yes,Long-term agreement in place\n' +
      'SACO,Indirect,MRO & Tools,85000,62000,No,No,Spot buying currently\n' +
      'DHL Supply Chain,Logistics,Freight,420000,315000,Yes,No,Annual contract\n'),
  },
  {
    id: 'rfp', icon: '📋', label: 'RFP / RFQ Template', labelAr: 'نموذج طلب العروض',
    desc: 'Structured Request for Proposal covering scope, evaluation criteria, commercial terms and timelines.', descAr: 'طلب عروض منظّم يغطّي النطاق ومعايير التقييم والشروط التجارية والجداول الزمنية.',
    generate: () => downloadText('rfp-template.txt', RFP_TEMPLATE),
  },
  {
    id: 'evaluation', icon: '✅', label: 'Supplier Evaluation Scorecard', labelAr: 'بطاقة تقييم الموردين',
    desc: 'Weighted scoring matrix for evaluating RFP responses across quality, price, delivery, and sustainability.', descAr: 'مصفوفة تسجيل موزونة لتقييم ردود طلبات العروض عبر الجودة والسعر والتسليم والاستدامة.',
    generate: () => downloadCsvText('supplier-evaluation-scorecard.csv', SCORECARD_CSV),
  },
  {
    id: 'tco', icon: '💰', label: 'TCO Calculator', labelAr: 'حاسبة التكلفة الإجمالية للملكية',
    desc: 'Total Cost of Ownership model comparing up to 3 suppliers across all cost elements.', descAr: 'نموذج التكلفة الإجمالية للملكية لمقارنة 3 موردين عبر جميع عناصر التكلفة.',
    generate: () => downloadCsvText('tco-calculator.csv', TCO_CSV),
  },
  {
    id: 'savings', icon: '📈', label: 'Savings Tracker', labelAr: 'متتبّع الوفورات',
    desc: 'Monthly savings pipeline tracker aligned to ISM/CPSM and CIPS savings classifications (hard, soft, cost avoidance).', descAr: 'متتبّع مسار الوفورات الشهري متوافق مع تصنيفات ISM/CPSM وCIPS (حقيقية، ناعمة، تجنّب التكاليف).',
    generate: () => downloadCsvText('savings-tracker.csv', SAVINGS_CSV),
  },
  {
    id: 'category-profile', icon: '🗂️', label: 'Category Profile Template', labelAr: 'نموذج ملف تعريف الفئة',
    desc: 'One-page category profile covering spend, market, risk, strategy, and action plan — the core deliverable of category management.', descAr: 'ملف تعريف للفئة في صفحة واحدة يغطّي الإنفاق والسوق والمخاطر والاستراتيجية وخطة العمل.',
    generate: () => downloadText('category-profile-template.txt', CATEGORY_PROFILE_TEMPLATE),
  },
];

// HR80 is a runtime expression so a long run of equals signs never appears
// as a literal in this source file (avoiding false-positive conflict-marker scans).
const HR80 = '='.repeat(80);

const RFP_TEMPLATE = `${HR80}
REQUEST FOR PROPOSAL (RFP) — TEMPLATE
I Supply Chain | Category Management Toolkit
ISM/CPSM & CIPS-Aligned | Version 1.0
${HR80}

SECTION 1 — OVERVIEW
─────────────────────
Issuing Organisation: [Your Organisation Name]
Category / Commodity: [Category Name]
RFP Reference:        [REF-YYYY-NNN]
Issue Date:           [DD/MM/YYYY]
Response Deadline:    [DD/MM/YYYY at 17:00 AST]
Valid Period:         Proposals remain valid for 90 days from submission date.

SECTION 2 — SCOPE OF SUPPLY
────────────────────────────
2.1 Requirement Description
[Describe the goods/services required: specifications, quality standards, volumes,
delivery locations, service levels, and any regulatory requirements.]

2.2 Contract Duration
Initial term: [X years] with options to extend for [Y x 1-year periods].

2.3 Estimated Annual Value
SAR [Amount] (indicative; actual volumes may vary ±[X]%)

2.4 Delivery / Service Requirements
• Delivery point(s): [Location(s)]
• Lead time required: [X days from PO]
• Service hours: [Standard / 24/7 / other]
• Incoterms (if goods): [DAP / DDP / other]

SECTION 3 — SUPPLIER REQUIREMENTS (Pre-Qualification)
───────────────────────────────────────────────────────
Suppliers must meet ALL of the following to be considered:
☐ Registered in Saudi Arabia / GCC (or local agent confirmed)
☐ Minimum [X] years trading in this category
☐ ISO 9001 or equivalent quality management certification
☐ Financial statements for last 3 years (audited)
☐ No active litigation that could affect performance
☐ ZATCA registration and VAT certificate
☐ Iktva / local content registration [if applicable]

SECTION 4 — EVALUATION CRITERIA
──────────────────────────────────
Proposals will be evaluated on the following weighted basis:

  Technical Quality & Compliance     [30%]
  Commercial Pricing (TCO)           [40%]
  Delivery & Lead Time               [15%]
  Sustainability & Local Content     [10%]
  References & Track Record          [5%]
  TOTAL                              100%

SECTION 5 — COMMERCIAL REQUIREMENTS
──────────────────────────────────────
5.1 Pricing Format
• Provide unit pricing in SAR (exclusive of VAT)
• State price validity period
• Identify any volume discount tiers or rebate structures
• Include all packaging, delivery, and handling costs

5.2 Payment Terms
• Standard terms: Net 30 days from invoice
• Any alternative terms proposed must be clearly stated

5.3 Performance Bonds / Guarantees
[Specify if required: performance bond %, bank guarantee, etc.]

SECTION 6 — SUBMISSION REQUIREMENTS
──────────────────────────────────────
Submit the following documents by the deadline:
☐ Completed commercial proposal (price schedule)
☐ Technical proposal (methodology, quality plan)
☐ Pre-qualification documents (Section 3)
☐ Signed Supplier Code of Conduct acknowledgment
☐ Anti-bribery / conflict of interest declaration

Submit to: [procurement@yourorganisation.com.sa]
Subject line: "RFP Response — [Category] — [Supplier Name] — [REF]"

SECTION 7 — TERMS & CONDITIONS
─────────────────────────────────
• This RFP does not constitute a commitment to purchase.
• Costs incurred in responding are at the supplier's risk.
• [Organisation] reserves the right to reject any or all proposals.
• Negotiations may be conducted with any or all shortlisted suppliers.
• The contract will be governed by Saudi Arabian law.

${HR80}
END OF RFP TEMPLATE — Customise all [bracketed] fields before issue.
${HR80}`;

const SCORECARD_CSV = `Supplier Evaluation Scorecard — ISM/CPSM & CIPS Aligned
,,,,,,,,,
CRITERION,WEIGHT,Max Score,Supplier A,Supplier A Score,Supplier B,Supplier B Score,Supplier C,Supplier C Score
,,,,,,,,,
TECHNICAL QUALITY,30%,30,,,,,,,
"  Meets all technical specifications",,10,/10,,/10,,/10,
"  Quality certifications (ISO 9001 etc.)",,10,/10,,/10,,/10,
"  Quality plan and inspection process",,10,/10,,/10,,/10,
,,,,,,,,,
COMMERCIAL PRICING (TCO),40%,40,,,,,,,
"  Unit pricing vs. should-cost model",,20,/20,,/20,,/20,
"  Payment terms and rebate structure",,10,/10,,/10,,/10,
"  Total Cost of Ownership (all-in cost)",,10,/10,,/10,,/10,
,,,,,,,,,
DELIVERY & SERVICE,15%,15,,,,,,,
"  Lead time vs. requirement",,5,/5,,/5,,/5,
"  OTIF track record (% from references)",,5,/5,,/5,,/5,
"  After-sales support and responsiveness",,5,/5,,/5,,/5,
,,,,,,,,,
SUSTAINABILITY & LOCAL CONTENT,10%,10,,,,,,,
"  Iktva / local content % (if applicable)",,5,/5,,/5,,/5,
"  ESG policy and certifications",,5,/5,,/5,,/5,
,,,,,,,,,
REFERENCES & TRACK RECORD,5%,5,,,,,,,
"  Verified GCC reference(s)",,3,/3,,/3,,/3,
"  Years trading in this category",,2,/2,,/2,,/2,
,,,,,,,,,
TOTAL SCORE,,100,0,/100,0,/100,0,/100
RECOMMENDATION,,,,,,,,,
Notes,,,,,,,,,`;

const TCO_CSV = `Total Cost of Ownership (TCO) Calculator -- CIPS 4-stage model + Ellram process-cost addendum
Compare up to 3 suppliers — fill in yellow cells. Matches the live TCO Engine tool exactly (Templates & Tools tab vs. TCO Engine tab).
,,,,
COST ELEMENT,UNIT,Supplier A (SAR),Supplier B (SAR),Supplier C (SAR)
,,,,
STAGE 1 -- PROCUREMENT COSTS (CIPS),,,,
Unit purchase price,,,,
Quantity (annual),,,,
"Total purchase cost (price × qty)",,=FORMULA,=FORMULA,=FORMULA
VAT (%),,,,
Import duties / customs fees (%),,,,
,,,,
STAGE 2 -- ACQUISITION COSTS (CIPS),,,,
Freight / shipping cost,,,,
Insurance in transit,,,,
Port handling fees,,,,
Last-mile delivery,,,,
,,,,
STAGE 3 -- USAGE COSTS (CIPS): INVENTORY & CARRYING,,,,
Safety stock days required,,,,
"Carrying cost rate (% of stock value, typically 20-30%)",,,,
Annual inventory carrying cost,,,,
,,,,
STAGE 3 -- USAGE COSTS (CIPS): QUALITY & RISK,,,,
"Incoming inspection cost / sample testing",,,,
Expected defect rate (PPM),,,,
"Rework / return / scrap cost (annual est.)",,,,
Supplier audit / visit cost (annual),,,,
,,,,
PROCESS & ADMINISTRATION COSTS (Ellram),,,,
"PO processing cost (# POs × SAR per PO)",,,,
"Invoice processing / reconciliation cost",,,,
,,,,
STAGE 4 -- END-OF-LIFE COSTS (CIPS),,,,
"Disposal / recycling / waste handling cost (annual)",,,,
"Contract exit / switching / decommission cost (one-time -- not summed into annual TCO below)",,,,
,,,,
TOTAL TCO (ANNUAL SAR),,=SUM,=SUM,=SUM
TCO per unit,,=FORMULA,=FORMULA,=FORMULA
TCO vs. lowest (%),,BASE,=FORMULA,=FORMULA`;

const SAVINGS_CSV = `Procurement Savings Tracker — ISM/CPSM & CIPS Savings Classifications
Annual Target: SAR [Enter Target],,,,,,,
,,,,,,,
SAVING DESCRIPTION,CATEGORY,SUPPLIER / CATEGORY,ANNUAL BASELINE (SAR),NEW PRICE / COST (SAR),SAVING (SAR),SAVING %,STATUS,OWNER,DELIVERY DATE
Hard Saving (negotiated price reduction),Hard,,,,,,Identified / Approved / Delivered,,
Cost Avoidance (prevented price increase),Avoidance,,,,,,,,
"Specification change (same quality, lower cost)",Hard,,,,,,,,
Process efficiency (admin / transaction cost reduction),Soft,,,,,,,,
Demand management (reduced consumption),Soft,,,,,,,,
Consolidation saving (volume leverage),Hard,,,,,,,,
"Contract compliance (maverick spend eliminated)",Hard,,,,,,,,
,,,,,,,,
TOTALS,,,0,0,0,,,
,,,,,,
NOTES:,,,,,,,
"Hard savings = actual cash reduction on P&L",,,,,,,
"Soft savings = cost avoided or efficiency gain — does not directly reduce P&L",,,,,,,
"All savings require Finance sign-off to be counted in official reporting",,,,,,,`;

const CATEGORY_PROFILE_TEMPLATE = `${HR80}
CATEGORY PROFILE — ONE-PAGE TEMPLATE
I Supply Chain | Category Management Toolkit
${HR80}

CATEGORY NAME:        [e.g. Packaging Materials — Primary]
CATEGORY OWNER:       [Name / Title]
DATE:                 [MM/YYYY]
REVIEW FREQUENCY:     [Annual / Bi-annual]

────────────────────────────────────────────────────────────────────────────────
1. SPEND SNAPSHOT
────────────────────────────────────────────────────────────────────────────────
Total Annual Spend:   SAR [Amount]
No. of Suppliers:     [N] active
No. of SKUs/Lines:    [N]
Contracted Spend %:   [X]%
Top 3 Supplier %:     [X]% of total category spend
YTD Spend vs Budget:  [X]% (under / over)

────────────────────────────────────────────────────────────────────────────────
2. SUPPLY MARKET SUMMARY (Porter's 5 Forces)
────────────────────────────────────────────────────────────────────────────────
Supplier Power:         [Low / Medium / High] — [One-line rationale]
Buyer Power:            [Low / Medium / High] — [One-line rationale]
New Entrant Threat:     [Low / Medium / High] — [One-line rationale]
Substitute Threat:      [Low / Medium / High] — [One-line rationale]
Competitive Rivalry:    [Low / Medium / High] — [One-line rationale]

Overall Market Risk:    [Low / Medium / High]
Market Maturity:        [Nascent / Growing / Mature / Declining]

────────────────────────────────────────────────────────────────────────────────
3. KRALJIC POSITION & SOURCING STRATEGY
────────────────────────────────────────────────────────────────────────────────
Quadrant:              [Strategic / Leverage / Bottleneck / Non-Critical]
Strategy Selected:     [Strategy Name]
Rationale:             [2–3 sentences]

────────────────────────────────────────────────────────────────────────────────
4. KEY RISKS & MITIGATIONS
────────────────────────────────────────────────────────────────────────────────
Risk 1: [Description] — Mitigation: [Action]
Risk 2: [Description] — Mitigation: [Action]
Risk 3: [Description] — Mitigation: [Action]

────────────────────────────────────────────────────────────────────────────────
5. 90-DAY ACTION PLAN
────────────────────────────────────────────────────────────────────────────────
[HIGH] Action 1:   [Description]  Owner: [Name]  Due: [Date]
[HIGH] Action 2:   [Description]  Owner: [Name]  Due: [Date]
[MED]  Action 3:   [Description]  Owner: [Name]  Due: [Date]
[LOW]  Action 4:   [Description]  Owner: [Name]  Due: [Date]

────────────────────────────────────────────────────────────────────────────────
6. SAVINGS PIPELINE
────────────────────────────────────────────────────────────────────────────────
Identified savings:    SAR [Amount] — [Category: Hard / Soft / Avoidance]
Target delivery date:  [Quarter / Month]
Finance sign-off:      [Yes / Pending / No]

${HR80}
END OF CATEGORY PROFILE — Review and update at least annually.
${HR80}`;

// ─── Storage helpers ──────────────────────────────────────────────────────────

const SK_SPEND      = 'isc-tool-catmgmt-spend-v2';
const SK_PORTER     = 'isc-tool-catmgmt-porter-v2';
const SK_STRATEGY   = 'isc-tool-catmgmt-strategy-v2';
const SK_THRESHOLDS = 'isc-tool-catmgmt-thresholds-v1';

function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'spend' | 'market' | 'strategy' | 'templates' | 'tco' | 'workingcapital' | 'spendvariance' | 'ai' | 'alerts';

// ─── Main Component ───────────────────────────────────────────────────────────

const VALID_TABS: Tab[] = ['spend', 'market', 'strategy', 'templates', 'tco', 'workingcapital', 'spendvariance', 'ai', 'alerts'];

/** Reads a #tab-name hash on first mount for deep-linking (e.g. from the
 *  Daily/Weekly Brief's "recent completions" feed, #171). Falls back to the
 *  default 'spend' tab for an empty or unrecognized hash rather than
 *  silently landing on whatever tab happens to render first -- an unknown
 *  hash should never look like a real selection. */
function initialTabFromHash(): Tab {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  return (VALID_TABS as string[]).includes(hash) ? (hash as Tab) : 'spend';
}

export function ProcurementToolsSection({ isAr }: ProcurementToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTabFromHash);

  // Spend data
  const [rows, setRows] = useState<SpendRow[]>(() => loadJson(SK_SPEND, [defaultRow()]));
  const saveRows = useCallback((r: SpendRow[]) => { setRows(r); safeSetItem(SK_SPEND, JSON.stringify(r)); }, []);
  const updateRow = (id: string, field: keyof SpendRow, value: string | number | boolean) =>
    saveRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRow = () => saveRows([...rows, defaultRow()]);
  const removeRow = (id: string) => saveRows(rows.filter(r => r.id !== id));

  // CSV import
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importLog, setImportLog] = useState<string[] | null>(null);

  const handleSpendImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: csvRows, errors } = parseCsvFile(text, ['Supplier', 'Annual Spend (SAR)']);
      if (errors.length > 0 && csvRows.length === 0) {
        setImportLog([isAr ? 'فشل الاستيراد:' : 'Import failed:', ...errors]);
        return;
      }
      const log: string[] = [...errors];
      const imported: SpendRow[] = [];
      csvRows.forEach((row, ri) => {
        const supplier = row['Supplier']?.trim();
        if (!supplier) { log.push(`Row ${ri + 2}: Supplier is empty — skipped.`); return; }
        const spendRaw = row['Annual Spend (SAR)']?.trim().replace(/,/g, '') || '0';
        const annualSpend = parseFloat(spendRaw) || 0;
        imported.push({
          id: nid(),
          supplier,
          category: row['Category']?.trim() || '',
          subcategory: row['Subcategory']?.trim() || '',
          unspscSegmentCode: row['UNSPSC Segment Code (optional)']?.trim() || undefined,
          annualSpend,
          contracted: row['Contracted (Yes/No)']?.trim().toLowerCase() === 'yes',
          strategic: row['Strategic (Yes/No)']?.trim().toLowerCase() === 'yes',
          notes: row['Notes']?.trim() || '',
        });
      });
      const finalRows = imported.length > 0 ? imported : [defaultRow()];
      saveRows(finalRows);
      const summary = isAr
        ? `✓ تم استيراد ${imported.length} مورّد(ين).`
        : `✓ Imported ${imported.length} supplier(s).`;
      setImportLog([summary, ...log]);
    };
    reader.readAsText(file);
  }, [isAr, saveRows]);

  // Porter's forces
  const [porter, setPorter] = useState<Record<string, { score: number; notes: string }>>(() =>
    loadJson(SK_PORTER, Object.fromEntries(PORTER_FORCES.map(f => [f.id, { score: 3, notes: '' }]))));
  const updatePorter = (id: string, field: 'score' | 'notes', value: number | string) => {
    const next = { ...porter, [id]: { ...porter[id], [field]: value } };
    setPorter(next); safeSetItem(SK_PORTER, JSON.stringify(next));
  };

  // Strategy selection
  const [selectedStrategy, setSelectedStrategy] = useState<string>(() => loadJson(SK_STRATEGY, ''));
  const saveStrategy = (s: string) => { setSelectedStrategy(s); safeSetItem(SK_STRATEGY, s); };

  // KPI Alert Thresholds — stored in localStorage only.
  // Values are loaded synchronously on mount and written on every save.
  const [thresholds, setThresholds]         = useState<Partial<Record<KpiKey, KpiThresholdCfg>>>(
    () => loadJson(SK_THRESHOLDS, {}),
  );
  // Draft uses optional fields so partially-filled inputs don't silently default to 0
  const [thresholdDraft, setThresholdDraft] = useState<Partial<Record<KpiKey, KpiThresholdDraft>>>(
    () => loadJson(SK_THRESHOLDS, {}),
  );
  const [thresholdErrors, setThresholdErrors] = useState<Partial<Record<KpiKey, string>>>({});

  const updateThresholdDraft = useCallback((key: KpiKey, field: 'warn' | 'critical', value: string) => {
    const num = parseFloat(value);
    setThresholdDraft(prev => {
      const existing = prev[key] ?? {};
      return { ...prev, [key]: { ...existing, [field]: isNaN(num) ? undefined : num } };
    });
    // Clear any validation error for this key when the user edits it
    setThresholdErrors(prev => { const { [key]: _, ...rest } = prev; return rest; });
  }, []);

  const saveThresholds = useCallback(() => {
    const next: Partial<Record<KpiKey, KpiThresholdCfg>> = {};
    const errors: Partial<Record<KpiKey, string>> = {};

    for (const def of KPI_THRESHOLD_DEFS) {
      const draft = thresholdDraft[def.key];
      if (!draft) continue;
      const { warn, critical } = draft;

      // Skip KPIs where neither field has been set
      if (warn === undefined && critical === undefined) continue;

      // Both fields required to form a complete threshold
      if (warn === undefined || critical === undefined) {
        errors[def.key] = isAr ? 'يرجى تعبئة كلا الحقلين (تحذير وبالغ).' : 'Both warn and critical values are required.';
        continue;
      }

      // Enforce severity ordering
      if (def.higherIsBetter) {
        // e.g. contracted %: warn must be strictly above critical
        if (warn <= critical) {
          errors[def.key] = isAr
            ? 'الأعلى أفضل: يجب أن يكون حد التحذير أكبر من حد الإنذار الحرج.'
            : 'Higher is better: warn must be greater than critical.';
          continue;
        }
      } else {
        // e.g. concentration: warn must be strictly below critical
        if (warn >= critical) {
          errors[def.key] = isAr
            ? 'الأقل أفضل: يجب أن يكون حد التحذير أصغر من حد الإنذار الحرج.'
            : 'Lower is better: warn must be less than critical.';
          continue;
        }
      }

      next[def.key] = { warn, critical, higherIsBetter: def.higherIsBetter, label: def.label };
    }

    setThresholdErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(isAr ? 'يرجى تصحيح الأخطاء قبل الحفظ.' : 'Fix validation errors before saving.');
      return;
    }

    setThresholds(next);
    safeSetItem(SK_THRESHOLDS, JSON.stringify(next));
    toast.success(isAr ? 'تم حفظ حدود التنبيه ✓' : 'Alert thresholds saved ✓');
  }, [thresholdDraft, isAr]);

  // Derived metrics
  const validRows = useMemo(() => rows.filter(r => r.supplier && r.annualSpend > 0), [rows]);
  const totalSpend = useMemo(() => validRows.reduce((s, r) => s + r.annualSpend, 0), [validRows]);
  const contractedPct = totalSpend > 0 ? Math.round((validRows.filter(r => r.contracted).reduce((s, r) => s + r.annualSpend, 0) / totalSpend) * 100) : 0;

  const paretoData = useMemo(() => {
    const sorted = [...validRows].sort((a, b) => b.annualSpend - a.annualSpend).slice(0, 10);
    let cumulative = 0;
    return sorted.map(r => {
      cumulative += r.annualSpend;
      return { name: r.supplier.length > 16 ? r.supplier.slice(0, 14) + '…' : r.supplier, spend: r.annualSpend, cumPct: totalSpend > 0 ? Math.round((cumulative / totalSpend) * 100) : 0 };
    });
  }, [validRows, totalSpend]);

  const top3Pct = totalSpend > 0 ? Math.round((paretoData.slice(0, 3).reduce((s, r) => s + r.spend, 0) / totalSpend) * 100) : 0;

  const porterAvg = useMemo(() => {
    const scores = PORTER_FORCES.map(f => porter[f.id]?.score ?? 3);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [porter]);
  const marketRisk = porterAvg >= 4 ? 'High' : porterAvg >= 2.5 ? 'Medium' : 'Low';
  const marketRiskAr = porterAvg >= 4 ? 'مرتفع' : porterAvg >= 2.5 ? 'متوسط' : 'منخفض';
  const marketRiskColor = porterAvg >= 4 ? '#dc2626' : porterAvg >= 2.5 ? '#d97706' : '#059669';

  // Auto-recommend strategy based on spend concentration + market risk
  const autoStrategy = useMemo(() => {
    const highConcentration = top3Pct > 60 || validRows.length <= 2;
    const highRisk = porterAvg >= 3.5;
    if (highConcentration && highRisk) return 'strategic-partnership';
    if (!highConcentration && !highRisk && totalSpend > 500000) return 'competitive-tender';
    if (highConcentration && !highRisk) return 'dual-source';
    if (!highConcentration && highRisk) return 'preferred-supplier';
    return 'competitive-tender';
  }, [top3Pct, validRows.length, porterAvg, totalSpend]);

  const chosenStrategy = STRATEGIES.find(s => s.id === (selectedStrategy || autoStrategy));

  // Breach levels for current KPI values against saved thresholds
  const breachLevels = useMemo(() => ({
    contractedPct: thresholds.contractedPct ? kpiBreachLevel(contractedPct, thresholds.contractedPct) : null,
    top3Pct:       thresholds.top3Pct       ? kpiBreachLevel(top3Pct,       thresholds.top3Pct)       : null,
    porterAvg:     thresholds.porterAvg     ? kpiBreachLevel(porterAvg,     thresholds.porterAvg)     : null,
  }), [contractedPct, top3Pct, porterAvg, thresholds]);


  // ── TCO Engine (#168, rebuilt v2 2026-08-23) ── world-class, category-aware
  //    Total Cost of Ownership calculator. Structure follows the real CIPS
  //    4-stage TCO model (Procurement / Acquisition / Usage / End-of-life)
  //    plus Ellram's process/transaction-cost addendum — see
  //    src/lib/tcoKnowledgeBase.ts for the full citation trail. Supports
  //    multiple NAMED, SAVED analyses (one per item/category, replacing the
  //    old single-instance-overwrite limitation) and a grounded, category-
  //    specific hidden-cost checklist that changes with the selected SKU
  //    class — every dollar figure entered remains the user's own input;
  //    nothing here is auto-filled from a fabricated benchmark.
  interface TcoSupplier {
    id: string; name: string;
    unitPrice: number; annualQty: number;
    vatPct: number; dutyPct: number;
    freight: number; insurance: number; handling: number; lastMile: number;
    safetyStockDays: number; carryingCostPct: number;
    inspectionCost: number; defectPpm: number; reworkCost: number; auditCost: number;
    poCount: number; poCostEach: number; invoiceProcessingCost: number;
    disposalCost: number; contractExitCost: number;
    /* Qualitative decision-scoring inputs (#164, "beyond raw cost" weighted
       scoring) -- 1-5 scale, user-entered judgement calls, NOT derived from
       any benchmark (Decision Record 8.7: nothing here is fabricated).
       Optional so analyses saved before this feature still load cleanly;
       every read site falls back to 3 ("neutral / no view yet"). */
    qualQuality?: number; qualDelivery?: number; qualRisk?: number; qualStrategicFit?: number;
  }
  interface TcoAnalysis {
    id: string; name: string;
    industry: IndustryKey | ''; subSector: string; skuClass: SkuClassKey | ''; itemName: string;
    suppliers: TcoSupplier[];
    updatedAt: number;
  }
  const SK_TCO_V1 = 'isc-tool-catmgmt-tco-v1';   // legacy single-instance key, read once for migration
  const SK_TCO_V2 = 'isc-tool-catmgmt-tco-v2';
  function defaultTcoSupplier(label: string): TcoSupplier {
    return {
      id: `tco${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: label,
      unitPrice: 0, annualQty: 0, vatPct: 15, dutyPct: 0,
      freight: 0, insurance: 0, handling: 0, lastMile: 0,
      safetyStockDays: 0, carryingCostPct: 25,
      inspectionCost: 0, defectPpm: 0, reworkCost: 0, auditCost: 0,
      poCount: 0, poCostEach: 0, invoiceProcessingCost: 0,
      disposalCost: 0, contractExitCost: 0,
      qualQuality: 3, qualDelivery: 3, qualRisk: 3, qualStrategicFit: 3,
    };
  }
  function defaultTcoAnalysis(name: string): TcoAnalysis {
    return {
      id: `tcoa${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name,
      industry: '', subSector: '', skuClass: '', itemName: '',
      suppliers: [defaultTcoSupplier('Supplier A'), defaultTcoSupplier('Supplier B')],
      updatedAt: Date.now(),
    };
  }
  function loadInitialTcoAnalyses(): { analyses: TcoAnalysis[]; activeId: string } {
    const v2 = loadJson<{ analyses: TcoAnalysis[]; activeId: string } | null>(SK_TCO_V2, null);
    if (v2 && Array.isArray(v2.analyses) && v2.analyses.length > 0) return v2;
    // Migration: a v1 single-supplier-list may exist from before the multi-analysis
    // rebuild. Honesty requirement (Decision Record 8.7) -- never silently discard
    // data the user already entered; carry it forward as one named analysis.
    const v1 = loadJson<TcoSupplier[] | null>(SK_TCO_V1, null);
    if (v1 && Array.isArray(v1) && v1.length > 0) {
      const migrated: TcoAnalysis = {
        id: `tcoa${Date.now()}mig`, name: isAr ? 'تحليل مُرحَّل' : 'Migrated analysis',
        industry: '', subSector: '', skuClass: '', itemName: '',
        suppliers: v1.map(s => ({ ...s, disposalCost: s.disposalCost ?? 0, contractExitCost: s.contractExitCost ?? 0 })),
        updatedAt: Date.now(),
      };
      const migratedState = { analyses: [migrated], activeId: migrated.id };
      // Persist the migration immediately -- don't leave the user's carried-forward
      // data sitting only in memory, where it would vanish if they navigate away
      // without editing anything.
      safeSetItem(SK_TCO_V2, JSON.stringify(migratedState));
      return migratedState;
    }
    const fresh = defaultTcoAnalysis(isAr ? 'تحليل جديد' : 'New analysis');
    return { analyses: [fresh], activeId: fresh.id };
  }
  // ── Server-sync (backend persistence, "maximum technical and consultancy
  //    wise" enhancement, 2026-08-23) ── Whole-list sync against
  //    /api/tco-analyses, mirroring the debounced-PUT / bootstrap-merge
  //    pattern already proven in SupplierScorecard.tsx, but for the TCO
  //    analyses array. The local, client-generated `id` on each TcoAnalysis
  //    (e.g. "tcoa...") IS the value sent to/received from the server as
  //    `clientKey` -- the server's own serial row id is internal bookkeeping
  //    only, never surfaced to the frontend, so there is no ID-reconciliation
  //    step needed after a sync. Logged-out users keep working entirely off
  //    localStorage, exactly as before; nothing here changes guest behaviour.
  const { user } = useAuth();
  const [tcoSyncStatus, setTcoSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const tcoServerLoadedForUserId = useRef<number | null>(null);
  const tcoBootstrapSettled = useRef(false);
  const tcoLocalWinsDuringBootstrap = useRef(false);
  const tcoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tcoStateRef = useRef<{ analyses: TcoAnalysis[]; activeId: string } | null>(null);

  interface ServerTcoRow {
    id: number; clientKey: string; name: string;
    industry: string | null; subSector: string | null; skuClass: string | null; itemName: string | null;
    suppliers: TcoSupplier[]; updatedAt: string;
  }
  function serverRowToAnalysis(row: ServerTcoRow): TcoAnalysis {
    return {
      id: row.clientKey, name: row.name,
      industry: (row.industry ?? '') as IndustryKey | '',
      subSector: row.subSector ?? '',
      skuClass: (row.skuClass ?? '') as SkuClassKey | '',
      itemName: row.itemName ?? '',
      suppliers: row.suppliers,
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }
  function analysisToPayload(a: TcoAnalysis) {
    return {
      clientKey: a.id, name: a.name,
      industry: a.industry || null, subSector: a.subSector || null,
      skuClass: a.skuClass || null, itemName: a.itemName || null,
      suppliers: a.suppliers,
    };
  }

  const syncTcoToServerImmediate = (analyses: TcoAnalysis[]) => {
    if (!user) return;
    setTcoSyncStatus('saving');
    if (tcoSyncTimerRef.current) clearTimeout(tcoSyncTimerRef.current);
    tcoSyncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/tco-analyses`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analyses: analyses.map(analysisToPayload) }),
        });
        setTcoSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setTcoSyncStatus('idle'), 2500);
      } catch {
        setTcoSyncStatus('error');
      }
    }, 400);
  };
  const syncTcoToServer = (analyses: TcoAnalysis[]) => {
    if (!user) return;
    if (!tcoBootstrapSettled.current) {
      // Bootstrap GET hasn't resolved yet -- don't race it with a PUT.
      // Mark that a local edit happened so the bootstrap effect knows not to
      // clobber it once the GET does resolve.
      tcoLocalWinsDuringBootstrap.current = true;
      return;
    }
    syncTcoToServerImmediate(analyses);
  };

  const [tcoState, setTcoState] = useState<{ analyses: TcoAnalysis[]; activeId: string }>(loadInitialTcoAnalyses);
  tcoStateRef.current = tcoState;
  const saveTcoState = (next: { analyses: TcoAnalysis[]; activeId: string }) => {
    setTcoState(next);
    safeSetItem(SK_TCO_V2, JSON.stringify(next));
    syncTcoToServer(next.analyses);
  };

  /* Bootstrap: on login (or account switch), pull the server's saved
   * analyses. Server-has-data wins over localStorage UNLESS the user has
   * already edited something in this session while the GET was in flight.
   * Server-empty means "first time syncing this account" -- upload whatever
   * is currently in localStorage instead of discarding it. */
  useEffect(() => {
    if (!user) {
      if (tcoServerLoadedForUserId.current !== null) {
        tcoServerLoadedForUserId.current = null;
        tcoBootstrapSettled.current = false;
        tcoLocalWinsDuringBootstrap.current = false;
        setTcoSyncStatus('idle');
      }
      return;
    }
    if (tcoServerLoadedForUserId.current === user.id) return;
    tcoServerLoadedForUserId.current = user.id;
    tcoBootstrapSettled.current = false;
    tcoLocalWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/tco-analyses`, { credentials: 'include' });
        if (tcoServerLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; analyses: ServerTcoRow[] };
          if (data.ok && Array.isArray(data.analyses) && data.analyses.length > 0) {
            if (!tcoLocalWinsDuringBootstrap.current) {
              const converted = data.analyses.map(serverRowToAnalysis);
              const currentActive = tcoStateRef.current?.activeId;
              const activeStillExists = converted.some(a => a.id === currentActive);
              const next = { analyses: converted, activeId: activeStillExists ? currentActive! : converted[0].id };
              setTcoState(next);
              safeSetItem(SK_TCO_V2, JSON.stringify(next));
            }
          } else if (!tcoLocalWinsDuringBootstrap.current) {
            // Server has nothing yet for this account -- upload local state
            // as the initial sync rather than leaving the server empty.
            const current = tcoStateRef.current;
            if (current && current.analyses.length > 0) syncTcoToServerImmediate(current.analyses);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      tcoBootstrapSettled.current = true;
      if (tcoLocalWinsDuringBootstrap.current) {
        const current = tcoStateRef.current;
        if (current) syncTcoToServerImmediate(current.analyses);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const tcoActiveAnalysis = tcoState.analyses.find(a => a.id === tcoState.activeId) ?? tcoState.analyses[0];
  const updateActiveAnalysis = (patch: Partial<Omit<TcoAnalysis, 'id' | 'suppliers'>>) =>
    saveTcoState({ ...tcoState, analyses: tcoState.analyses.map(a => a.id === tcoActiveAnalysis.id ? { ...a, ...patch, updatedAt: Date.now() } : a) });
  const tcoSuppliers = tcoActiveAnalysis.suppliers;
  const saveTcoSuppliers = (next: TcoSupplier[]) =>
    saveTcoState({ ...tcoState, analyses: tcoState.analyses.map(a => a.id === tcoActiveAnalysis.id ? { ...a, suppliers: next, updatedAt: Date.now() } : a) });
  const updateTcoSupplier = (id: string, patch: Partial<TcoSupplier>) =>
    saveTcoSuppliers(tcoSuppliers.map(s => s.id === id ? { ...s, ...patch } : s));
  const addTcoSupplier = () => {
    const letter = String.fromCharCode(65 + tcoSuppliers.length);
    if (tcoSuppliers.length >= 5) return;
    saveTcoSuppliers([...tcoSuppliers, defaultTcoSupplier(`${isAr ? 'مورّد' : 'Supplier'} ${letter}`)]);
  };
  const removeTcoSupplier = (id: string) => { if (tcoSuppliers.length > 1) saveTcoSuppliers(tcoSuppliers.filter(s => s.id !== id)); };
  const addTcoAnalysis = () => {
    const fresh = defaultTcoAnalysis(`${isAr ? 'تحليل' : 'Analysis'} ${tcoState.analyses.length + 1}`);
    saveTcoState({ analyses: [...tcoState.analyses, fresh], activeId: fresh.id });
  };
  const duplicateTcoAnalysis = () => {
    const copy: TcoAnalysis = { ...tcoActiveAnalysis, id: `tcoa${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: `${tcoActiveAnalysis.name} (${isAr ? 'نسخة' : 'copy'})`, updatedAt: Date.now() };
    saveTcoState({ analyses: [...tcoState.analyses, copy], activeId: copy.id });
  };
  const deleteTcoAnalysis = (id: string) => {
    if (tcoState.analyses.length <= 1) return;
    const remaining = tcoState.analyses.filter(a => a.id !== id);
    saveTcoState({ analyses: remaining, activeId: remaining[0].id });
  };
  const switchTcoAnalysis = (id: string) => saveTcoState({ ...tcoState, activeId: id });

  /* Pure per-supplier TCO calculation, shared between the active analysis's
     live table (below) and the cross-item Portfolio view (#163) -- kept as
     one function so the two views can never silently drift out of
     arithmetic sync with each other. */
  function computeTcoResultsForSuppliers(suppliers: TcoSupplier[]) {
    return suppliers.map(s => {
      const directPurchase = s.unitPrice * s.annualQty;
      const vatAmount = directPurchase * (s.vatPct / 100);
      const dutyAmount = directPurchase * (s.dutyPct / 100);
      const directTotal = directPurchase + vatAmount + dutyAmount;
      const logisticsTotal = s.freight + s.insurance + s.handling + s.lastMile;
      // Safety-stock value held = share of annual purchase cost proportional to days of stock carried.
      const safetyStockValue = directPurchase * (s.safetyStockDays / 365);
      const carryingCostAnnual = safetyStockValue * (s.carryingCostPct / 100);
      const qualityTotal = s.inspectionCost + s.reworkCost + s.auditCost;
      const transactionTotal = (s.poCount * s.poCostEach) + s.invoiceProcessingCost;
      // End-of-life (CIPS stage 4): disposalCost is a real recurring annual cost and is
      // included in TCO. contractExitCost is a one-time figure (e.g. a switching/exit
      // fee) -- deliberately kept OUT of the annual TCO sum so an annual and a one-time
      // number are never silently added together, and shown as its own line instead.
      const endOfLifeAnnual = s.disposalCost;
      const tcoAnnual = directTotal + logisticsTotal + carryingCostAnnual + qualityTotal + transactionTotal + endOfLifeAnnual;
      const tcoPerUnit = s.annualQty > 0 ? tcoAnnual / s.annualQty : 0;
      return {
        id: s.id, directPurchase, vatAmount, dutyAmount, directTotal, logisticsTotal,
        safetyStockValue, carryingCostAnnual, qualityTotal, transactionTotal, endOfLifeAnnual,
        contractExitOneTime: s.contractExitCost, tcoAnnual, tcoPerUnit,
      };
    });
  }
  const tcoResults = useMemo(() => computeTcoResultsForSuppliers(tcoSuppliers), [tcoSuppliers]);
  const tcoValidResults = tcoResults.filter(r => r.tcoPerUnit > 0);
  const tcoLowestPerUnit = tcoValidResults.length > 0 ? Math.min(...tcoValidResults.map(r => r.tcoPerUnit)) : 0;
  const tcoLowestId = tcoValidResults.find(r => r.tcoPerUnit === tcoLowestPerUnit)?.id;
  const [tcoViewMode, setTcoViewMode] = useState<'analysis' | 'portfolio'>('analysis');
  /* Cross-item Portfolio view (#163) -- lets the client compare TCO across
     ALL saved analyses (i.e. across different items/categories), not just
     across suppliers within one item. Reuses computeTcoResultsForSuppliers()
     so the "best supplier" figure shown here always matches what the user
     sees on opening that analysis directly. */
  interface TcoPortfolioRow {
    id: string; name: string; itemName: string;
    industryLabel: string; skuLabel: string;
    supplierCount: number; hasData: boolean;
    bestSupplierName: string; bestTcoPerUnit: number; bestTcoAnnual: number;
    worstTcoPerUnit: number; savingsPct: number; updatedAt: number;
  }
  const tcoPortfolio: TcoPortfolioRow[] = useMemo(() => tcoState.analyses.map(a => {
    const results = computeTcoResultsForSuppliers(a.suppliers);
    const valid = results.filter(r => r.tcoPerUnit > 0);
    const best = valid.length > 0 ? valid.reduce((m, r) => r.tcoPerUnit < m.tcoPerUnit ? r : m) : null;
    const worst = valid.length > 0 ? valid.reduce((m, r) => r.tcoPerUnit > m.tcoPerUnit ? r : m) : null;
    const bestSupplier = best ? a.suppliers.find(sp => sp.id === best.id) : null;
    const savingsPct = best && worst && worst.tcoPerUnit > 0 && valid.length > 1
      ? ((worst.tcoPerUnit - best.tcoPerUnit) / worst.tcoPerUnit) * 100 : 0;
    return {
      id: a.id, name: a.name, itemName: a.itemName,
      industryLabel: (INDUSTRIES.find(i => i.id === a.industry)?.[isAr ? 'labelAr' : 'label']) || '',
      skuLabel: (SKU_CLASSES.find(sc => sc.id === a.skuClass)?.[isAr ? 'labelAr' : 'label']) || '',
      supplierCount: a.suppliers.length, hasData: valid.length > 0,
      bestSupplierName: bestSupplier?.name || '',
      bestTcoPerUnit: best?.tcoPerUnit || 0, bestTcoAnnual: best?.tcoAnnual || 0,
      worstTcoPerUnit: worst?.tcoPerUnit || 0, savingsPct, updatedAt: a.updatedAt,
    };
  }), [tcoState.analyses, isAr]);
  type TcoPortfolioSort = 'updated' | 'name' | 'tcoPerUnit' | 'savings';
  const [tcoPortfolioSort, setTcoPortfolioSort] = useState<TcoPortfolioSort>('updated');
  const tcoPortfolioSorted = useMemo(() => {
    const rows = [...tcoPortfolio];
    switch (tcoPortfolioSort) {
      case 'name': rows.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'tcoPerUnit': rows.sort((a, b) => (b.hasData ? b.bestTcoPerUnit : -1) - (a.hasData ? a.bestTcoPerUnit : -1)); break;
      case 'savings': rows.sort((a, b) => b.savingsPct - a.savingsPct); break;
      default: rows.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return rows;
  }, [tcoPortfolio, tcoPortfolioSort]);
  // ── Trend history (#168/#169 TCO reporting, 2026-08-23) -- real
  //    server-backed monthly snapshots of the active analysis's best TCO,
  //    mirroring Supplier Scorecard's TrendSnapshot pattern but persisted to
  //    /api/tco-trend-snapshots (a real per-row table) instead of
  //    localStorage only -- TCO already has real backend persistence via
  //    tco_analyses, so its trend history gets the same treatment. Guests
  //    see no trend chart (nothing to sync against) rather than a
  //    localStorage-only one that could vanish on next login (Decision
  //    Record 8.7 -- never show data the user can't rely on).
  interface TcoTrendSnapshotRow {
    id: number; month: string; bestTcoPerUnit: string; bestSupplierName: string | null;
    savingsPct: string | null;
  }
  const [tcoTrend, setTcoTrend] = useState<TcoTrendSnapshotRow[]>([]);
  const [tcoTrendLoading, setTcoTrendLoading] = useState(false);
  const tcoPrevSnapshotKeyRef = useRef<string | null>(null);

  const loadTcoTrend = useCallback(async (analysisClientKey: string) => {
    setTcoTrendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tco-trend-snapshots?analysisClientKey=${encodeURIComponent(analysisClientKey)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; snapshots?: TcoTrendSnapshotRow[] };
        if (data.ok) setTcoTrend(Array.isArray(data.snapshots) ? data.snapshots : []);
      }
    } catch { /* offline -- trend chart just stays empty until next load */ }
    setTcoTrendLoading(false);
  }, []);

  useEffect(() => {
    if (!user) { setTcoTrend([]); return; }
    loadTcoTrend(tcoActiveAnalysis.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tcoActiveAnalysis.id]);

  // Auto-snapshot: once per analysis per calendar month, whenever this
  // analysis has valid priced data. Guarded by a composite key (analysis +
  // month + rounded value) so it doesn't refire on every keystroke -- same
  // monthly-dedup intent as Scorecard's prevTrendKeyRef, adapted to fire a
  // real POST (server enforces the UNIQUE constraint too) instead of
  // mutating a localStorage array.
  useEffect(() => {
    if (!user) return;
    const row = tcoPortfolio.find(r => r.id === tcoActiveAnalysis.id);
    if (!row || !row.hasData) return;
    const month = new Date().toISOString().slice(0, 7);
    const snapKey = `${row.id}|${month}|${Math.round(row.bestTcoPerUnit)}`;
    if (tcoPrevSnapshotKeyRef.current === snapKey) return;
    tcoPrevSnapshotKeyRef.current = snapKey;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/tco-trend-snapshots`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisClientKey: row.id, analysisName: row.name, itemName: row.itemName || null,
            bestSupplierName: row.bestSupplierName || null, bestTcoPerUnit: row.bestTcoPerUnit,
            bestTcoAnnual: row.bestTcoAnnual || null, savingsPct: row.savingsPct || null,
            supplierCount: row.supplierCount,
          }),
        });
        // Refresh so the chart picks up the new point without waiting for
        // the next analysis switch.
        if (res.ok) loadTcoTrend(row.id);
      } catch { /* offline -- snapshot just doesn't get captured this time */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tcoPortfolio, tcoActiveAnalysis.id]);

  // ── Cross-tab signal for the Sourcing Strategy tab (#165) -- the single
  //    biggest real savings opportunity across all saved TCO analyses. ──
  const tcoBiggestOpportunity = useMemo(() => {
    const withSavings = tcoPortfolio.filter(r => r.hasData && r.savingsPct > 0);
    if (withSavings.length === 0) return null;
    return withSavings.reduce((max, r) => r.savingsPct > max.savingsPct ? r : max);
  }, [tcoPortfolio]);

  // AI prompt
  const buildPrompt = useCallback(() => {
    const topSuppliers = paretoData.slice(0, 5).map(r => `${r.name}: SAR ${r.spend.toLocaleString()} (${r.cumPct}% cumulative)`).join(', ');
    const porterSummary = PORTER_FORCES.map(f => `${f.label}: ${porter[f.id]?.score ?? 3}/5`).join(', ');
    const strat = chosenStrategy;
    return [
      `## Category Management Strategy Brief`,
      `Total spend: SAR ${totalSpend.toLocaleString()} | ${validRows.length} suppliers | Contracted: ${contractedPct}%`,
      `Top 3 supplier concentration: ${top3Pct}% of spend`,
      `Top suppliers: ${topSuppliers || 'No data'}`,
      '',
      `## Market Analysis (Porter's 5 Forces)`,
      porterSummary,
      `Overall market risk: ${marketRisk} (avg score: ${porterAvg.toFixed(1)}/5)`,
      '',
      `## Recommended Sourcing Strategy`,
      `Strategy: ${strat?.label || 'Not selected'}`,
      `Rationale: ${strat?.desc || ''}`,
      '',
      // #165 (TCO max-enhance: wire into other engines) -- when the user has
      // real TCO Engine data, ground the category brief in it instead of
      // leaving the AI to estimate savings blind. Omitted entirely when no
      // TCO data exists yet, so the AI is never invited to invent a number.
      ...(tcoPortfolio.some(r => r.hasData) ? [
        `## TCO Engine data (real, user-entered)`,
        tcoPortfolio.filter(r => r.hasData).map(r =>
          `${r.name}${r.itemName ? ` (${r.itemName})` : ''}: best supplier TCO SAR ${r.bestTcoPerUnit.toFixed(2)}/unit`
          + (r.savingsPct > 0 ? `, ${r.savingsPct.toFixed(1)}% savings potential vs. costliest supplier` : '')
        ).join('\n'),
        '',
      ] : []),
      '## Your Task',
      'Generate a 4–6 paragraph executive category strategy document:',
      '1. Spend landscape: portfolio health, concentration risk, contracted vs uncontracted analysis',
      '2. Supply market assessment: interpret Porter\'s forces scores and their sourcing implications',
      '3. Strategic recommendation: justify the chosen sourcing strategy with market evidence',
      '4. Risk register: top 3 supply risks and their specific mitigations',
      '5. 90-day action plan with [HIGH]/[MEDIUM]/[LOW] priority items',
      '6. Savings opportunity: if TCO Engine data is provided above, cite it directly; otherwise give a % range and clearly label it as an estimate, not a measured figure',
    ].join('\n');
  }, [validRows, totalSpend, contractedPct, top3Pct, paretoData, porter, porterAvg, marketRisk, chosenStrategy, tcoPortfolio]);

  const aiPlan = useAIPlan(buildPrompt, isAr, 'procurement-catmgmt', validRows.length >= 2);

  const tcoChecklist = tcoActiveAnalysis.skuClass ? TCO_CHECKLIST_BY_SKU_CLASS[tcoActiveAnalysis.skuClass] : null;
  const tcoSubSectorOptions = tcoActiveAnalysis.industry ? (INDUSTRY_SUB_SECTORS[tcoActiveAnalysis.industry] || []) : [];

  // ── Sensitivity analysis (#164) -- pure "what if this input were off by
  //    X%?" recompute of the SAME arithmetic used everywhere else in this
  //    tool. No new data is invented; every driver value below is the
  //    user's own entered number, only varied by the chosen swing %. ──
  interface TcoSensitivityDriver { key: keyof TcoSupplier; label: string; labelAr: string; }
  const TCO_SENSITIVITY_DRIVERS: TcoSensitivityDriver[] = [
    { key: 'unitPrice', label: 'Unit purchase price', labelAr: 'سعر الشراء للوحدة' },
    { key: 'annualQty', label: 'Annual quantity', labelAr: 'الكمية السنوية' },
    { key: 'vatPct', label: 'VAT rate', labelAr: 'معدل ضريبة القيمة المضافة' },
    { key: 'dutyPct', label: 'Duty rate', labelAr: 'معدل الرسوم الجمركية' },
    { key: 'freight', label: 'Freight', labelAr: 'الشحن' },
    { key: 'carryingCostPct', label: 'Carrying cost %', labelAr: 'نسبة تكلفة الاحتفاظ بالمخزون' },
  ];
  const [tcoSensitivitySupplierId, setTcoSensitivitySupplierId] = useState<string>('');
  const [tcoSensitivitySwingPct, setTcoSensitivitySwingPct] = useState(10);
  const tcoSensitivitySupplier = tcoSuppliers.find(s => s.id === tcoSensitivitySupplierId)
    ?? tcoSuppliers.find(s => s.id === tcoLowestId) ?? tcoSuppliers[0];
  const tcoSensitivityBase = tcoResults.find(r => r.id === tcoSensitivitySupplier?.id);
  const tcoSensitivityRows = useMemo(() => {
    if (!tcoSensitivitySupplier || !tcoSensitivityBase || tcoSensitivityBase.tcoPerUnit <= 0) return [];
    const swing = tcoSensitivitySwingPct / 100;
    return TCO_SENSITIVITY_DRIVERS.map(d => {
      const baseValue = (tcoSensitivitySupplier[d.key] as number) || 0;
      const lowSupplier = { ...tcoSensitivitySupplier, [d.key]: baseValue * (1 - swing) };
      const highSupplier = { ...tcoSensitivitySupplier, [d.key]: baseValue * (1 + swing) };
      const [lowResult] = computeTcoResultsForSuppliers([lowSupplier]);
      const [highResult] = computeTcoResultsForSuppliers([highSupplier]);
      return {
        key: d.key, label: d.label, labelAr: d.labelAr, baseValue,
        low: Math.min(lowResult.tcoPerUnit, highResult.tcoPerUnit),
        high: Math.max(lowResult.tcoPerUnit, highResult.tcoPerUnit),
        swingAbs: Math.abs(highResult.tcoPerUnit - lowResult.tcoPerUnit),
      };
    }).filter(r => r.baseValue > 0 && r.swingAbs > 0).sort((a, b) => b.swingAbs - a.swingAbs);
  }, [tcoSensitivitySupplier, tcoSensitivityBase, tcoSensitivitySwingPct]);
  const tcoSensitivityMaxSwing = Math.max(1, ...tcoSensitivityRows.map(r => r.swingAbs));

  // ── Weighted decision scoring, "beyond raw cost" (#164) -- combines the
  //    real, computed cost score with user-entered qualitative judgement
  //    (quality/delivery/risk/strategic fit, 1-5 each) using adjustable
  //    weights. Directly operationalizes the honesty note already shown
  //    below ("lowest TCO is not automatically the right choice"). Weights
  //    are a session-only analytical lens (reset to sensible defaults each
  //    visit), NOT persisted -- the underlying 1-5 supplier ratings ARE
  //    real per-supplier data and DO persist via the normal supplier save
  //    path (localStorage + server sync), same as every other TCO field. */
  const TCO_DEFAULT_WEIGHTS = { cost: 40, quality: 20, delivery: 15, risk: 15, strategicFit: 10 };
  const [tcoWeights, setTcoWeights] = useState(TCO_DEFAULT_WEIGHTS);
  const tcoWeightsTotal = tcoWeights.cost + tcoWeights.quality + tcoWeights.delivery + tcoWeights.risk + tcoWeights.strategicFit;
  const tcoDecisionScores = useMemo(() => {
    if (tcoValidResults.length < 2) return [];
    const perUnitVals = tcoValidResults.map(r => r.tcoPerUnit);
    const minCost = Math.min(...perUnitVals), maxCost = Math.max(...perUnitVals);
    const w = tcoWeightsTotal > 0 ? tcoWeightsTotal : 1;
    return tcoSuppliers.map(s => {
      const result = tcoResults.find(r => r.id === s.id);
      const hasCost = !!result && result.tcoPerUnit > 0;
      const costScore100 = hasCost
        ? (maxCost > minCost ? 100 * (1 - (result!.tcoPerUnit - minCost) / (maxCost - minCost)) : 100)
        : 0;
      const qualityScore100 = ((s.qualQuality ?? 3) / 5) * 100;
      const deliveryScore100 = ((s.qualDelivery ?? 3) / 5) * 100;
      const riskScore100 = ((s.qualRisk ?? 3) / 5) * 100;
      const strategicFitScore100 = ((s.qualStrategicFit ?? 3) / 5) * 100;
      const weighted = hasCost
        ? (costScore100 * tcoWeights.cost + qualityScore100 * tcoWeights.quality
          + deliveryScore100 * tcoWeights.delivery + riskScore100 * tcoWeights.risk
          + strategicFitScore100 * tcoWeights.strategicFit) / w
        : 0;
      return { id: s.id, name: s.name, hasCost, costScore100, weighted };
    }).sort((a, b) => b.weighted - a.weighted);
  }, [tcoSuppliers, tcoResults, tcoValidResults, tcoWeights, tcoWeightsTotal]);
  const tcoDecisionTopId = tcoDecisionScores[0]?.id;
  const tcoDecisionRankFlip = !!tcoDecisionTopId && tcoDecisionTopId !== tcoLowestId && tcoValidResults.length > 1;

  // ── Supplier Scorecard cross-link (#165, "wire into other engines") --
  //    real, read-only match against the user's own saved Supplier
  //    Scorecard roster (name match, case-insensitive). Never auto-fills
  //    anything -- Decision Record 8.7's "stand by a click" applies
  //    literally: the user must click "Apply" to pull a real scorecard
  //    rating into the TCO decision-scoring inputs above. ──
  const tcoScorecardMatches = useMemo(() => {
    try {
      const roster = loadScorecardRoster();
      const config = loadScorecardConfig();
      return tcoSuppliers.map(s => {
        const needle = s.name.trim().toLowerCase();
        const match = needle ? roster.suppliers.find(r => r.name.trim().toLowerCase() === needle) : undefined;
        if (!match) return null;
        const qualityDim = calcDimScore('quality', match.subScores);
        const deliveryDim = calcDimScore('delivery', match.subScores);
        const weighted = qualityDim !== null && deliveryDim !== null
          ? Math.round(((qualityDim + deliveryDim) / 2))
          : (qualityDim ?? deliveryDim);
        return { supplierId: s.id, scorecardName: match.name, qualityDim, deliveryDim, weighted };
      }).filter((m): m is { supplierId: string; scorecardName: string; qualityDim: number | null; deliveryDim: number | null; weighted: number | null } => m !== null);
    } catch { return []; }
  }, [tcoSuppliers]);
  const applyScorecardRating = (supplierId: string, qualityDim: number | null, deliveryDim: number | null) => {
    const patch: Partial<TcoSupplier> = {};
    if (qualityDim !== null) patch.qualQuality = Math.min(5, Math.max(1, Math.round(qualityDim / 20)));
    if (deliveryDim !== null) patch.qualDelivery = Math.min(5, Math.max(1, Math.round(deliveryDim / 20)));
    if (Object.keys(patch).length > 0) {
      updateTcoSupplier(supplierId, patch);
      toast.success(isAr ? 'تم تطبيق تقييم بطاقة أداء المورّد ✓' : 'Applied real Supplier Scorecard rating ✓');
    }
  };


  // ── AI Executive Insight for TCO (#164) -- second, TCO-scoped useAIPlan
  //    instance (separate toolKey so it never collides with the Spend
  //    Analysis "AI Strategy Brief" plan stored under 'procurement-catmgmt').
  //    Grounded strictly in the numbers already computed above -- the AI
  //    is not given anything it could use to invent a benchmark. ──
  const tcoBuildPrompt = useCallback(() => {
    const industryLabel = INDUSTRIES.find(i => i.id === tcoActiveAnalysis.industry)?.label || 'Not specified';
    const skuLabel = SKU_CLASSES.find(sc => sc.id === tcoActiveAnalysis.skuClass)?.label || 'Not specified';
    const supplierLines = tcoSuppliers.map(s => {
      const r = tcoResults.find(rr => rr.id === s.id);
      const score = tcoDecisionScores.find(d => d.id === s.id);
      return `- ${s.name}: TCO/unit SAR ${r ? r.tcoPerUnit.toFixed(2) : '0.00'}, annual TCO SAR ${r ? r.tcoAnnual.toFixed(0) : '0'}`
        + (score ? `, qualitative ratings (1-5) -- quality ${s.qualQuality ?? 3}, delivery ${s.qualDelivery ?? 3}, single-source risk ${s.qualRisk ?? 3}, strategic fit ${s.qualStrategicFit ?? 3}, weighted decision score ${score.weighted.toFixed(0)}/100` : '');
    }).join('\n');
    const topDriver = tcoSensitivityRows[0];
    return [
      `## TCO Executive Insight Request`,
      `Analysis: ${tcoActiveAnalysis.name} | Item: ${tcoActiveAnalysis.itemName || 'Not specified'}`,
      `Industry: ${industryLabel} | Sub-sector: ${tcoActiveAnalysis.subSector || 'Not specified'} | Category: ${skuLabel}`,
      '',
      `## Supplier TCO comparison`,
      supplierLines || 'No supplier cost data entered yet.',
      '',
      `## Weighted decision score (cost ${tcoWeights.cost}% / quality ${tcoWeights.quality}% / delivery ${tcoWeights.delivery}% / single-source risk ${tcoWeights.risk}% / strategic fit ${tcoWeights.strategicFit}%)`,
      tcoDecisionTopId ? `Highest-scoring supplier overall: ${tcoSuppliers.find(s => s.id === tcoDecisionTopId)?.name}` : 'Not enough data to score yet.',
      tcoDecisionRankFlip ? 'Note: the lowest-TCO supplier is NOT the highest-scoring supplier once quality/delivery/risk/strategic-fit judgement is weighted in.' : '',
      '',
      `## Sensitivity`,
      topDriver ? `Most sensitive cost driver: ${topDriver.label} (±${tcoSensitivitySwingPct}% swings TCO/unit between SAR ${topDriver.low.toFixed(2)} and SAR ${topDriver.high.toFixed(2)})` : 'Not enough data for a sensitivity read yet.',
      '',
      '## Your Task',
      'Write a concise (3-4 paragraph) executive TCO insight for this specific sourcing decision:',
      '1. What the numbers say: the real cost gap between suppliers and what drives it',
      '2. Whether the weighted decision score agrees or disagrees with the raw lowest-TCO pick, and why that matters',
      '3. The single biggest assumption this recommendation is riding on (use the sensitivity driver above) and what would have to be true for the recommendation to flip',
      '4. A clear, hedged recommendation -- state it, but name the one thing that should be verified before committing',
    ].filter(Boolean).join('\n');
  }, [tcoActiveAnalysis, tcoSuppliers, tcoResults, tcoDecisionScores, tcoDecisionTopId, tcoDecisionRankFlip, tcoWeights, tcoSensitivityRows, tcoSensitivitySwingPct]);
  const tcoAiPlan = useAIPlan(tcoBuildPrompt, isAr, 'procurement-tco', tcoValidResults.length >= 2);

  const exportTcoAnalysis = () => {
    const industryLabel = INDUSTRIES.find(i => i.id === tcoActiveAnalysis.industry)?.label || '';
    const skuLabel = SKU_CLASSES.find(s => s.id === tcoActiveAnalysis.skuClass)?.label || '';
    const rows: string[][] = [
      ['TCO Analysis', tcoActiveAnalysis.name],
      ['Item', tcoActiveAnalysis.itemName],
      ['Industry', industryLabel],
      ['Sub-sector', tcoActiveAnalysis.subSector],
      ['Category', skuLabel],
      [],
      ['Cost element', ...tcoSuppliers.map(s => s.name)],
    ];
    TCO_STAGES.forEach(stage => {
      rows.push([`${stage.label} (${stage.short})`]);
      TCO_FIELDS.filter(f => f.stage === stage.id).forEach(f => {
        rows.push([f.label, ...tcoSuppliers.map(s => String(s[f.key] ?? ''))]);
      });
    });
    rows.push([]);
    rows.push(['Total TCO (annual, SAR)', ...tcoResults.map(r => r.tcoAnnual.toFixed(0))]);
    rows.push(['TCO per unit (SAR)', ...tcoResults.map(r => r.tcoPerUnit.toFixed(2))]);
    rows.push(['One-time exit cost (SAR, not in annual TCO)', ...tcoResults.map(r => r.contractExitOneTime.toFixed(0))]);
    const safeName = (tcoActiveAnalysis.name || 'tco-analysis').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadCsv(rows, `${safeName || 'tco-analysis'}.csv`);
  };
  const exportTcoPortfolio = () => {
    const rows: string[][] = [
      ['Analysis', 'Item', 'Industry', 'Category', 'Suppliers compared', 'Best supplier',
       'Best TCO/unit (SAR)', 'Best TCO annual (SAR)', 'Savings potential vs. costliest supplier (%)', 'Last updated'],
    ];
    tcoPortfolioSorted.forEach(r => {
      rows.push([
        r.name, r.itemName, r.industryLabel, r.skuLabel, String(r.supplierCount),
        r.hasData ? r.bestSupplierName : '',
        r.hasData ? r.bestTcoPerUnit.toFixed(2) : '',
        r.hasData ? r.bestTcoAnnual.toFixed(0) : '',
        r.hasData && r.savingsPct > 0 ? r.savingsPct.toFixed(1) : '',
        new Date(r.updatedAt).toISOString().slice(0, 10),
      ]);
    });
    downloadCsv(rows, 'tco-portfolio-comparison.csv');
  };

  // ── Working Capital Control Tower (#169, Wave B-3, 2026-08-23) ──
  //    Standard corporate-treasury Cash Conversion Cycle (CCC) mechanics:
  //    CCC (days) = DIO + DSO - DPO; dollar impact = CCC * (Annual COGS / 365).
  //    COGS (not revenue) is the daily-rate driver because COGS approximates
  //    actual cash outlay, not margin-inclusive revenue. See WC_SOURCES below
  //    for real, verified citations (Decision Record 8.7 -- no invented URLs).
  //    Multi-Dimensional State design constraint (site map #159 decision
  //    record): the three cash levers below (inventory value tied up, CCC
  //    dollar impact, RAR exposure) are NEVER summed into one blended total
  //    -- they are non-additive, incommensurate quantities (a balance-sheet
  //    stock, a cycle-timing dollar-days figure, and a probabilistic revenue
  //    exposure). Each is shown separately so the client can weight what
  //    matters to them, exactly as #159 established for KPI priority.
  //    Whole-state, multi-scenario persistence mirrors the TCO Engine's
  //    tco_analyses pattern (localStorage-first, server-synced via
  //    /api/working-capital-analyses when logged in) exactly.
  interface WorkingCapitalAnalysis {
    id: string; name: string;
    inventoryValue: number; dioDays: number; dsoDays: number; dpoDays: number; annualCogs: number;
    updatedAt: number;
  }
  const SK_WC_V1 = 'isc-tool-catmgmt-workingcapital-v1';
  function defaultWcAnalysis(name: string): WorkingCapitalAnalysis {
    return {
      id: `wca${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name,
      inventoryValue: 0, dioDays: 0, dsoDays: 0, dpoDays: 0, annualCogs: 0,
      updatedAt: Date.now(),
    };
  }
  function loadInitialWcAnalyses(): { analyses: WorkingCapitalAnalysis[]; activeId: string } {
    const v1 = loadJson<{ analyses: WorkingCapitalAnalysis[]; activeId: string } | null>(SK_WC_V1, null);
    if (v1 && Array.isArray(v1.analyses) && v1.analyses.length > 0) return v1;
    const fresh = defaultWcAnalysis(isAr ? 'سيناريو جديد' : 'New scenario');
    return { analyses: [fresh], activeId: fresh.id };
  }
  // ── Server-sync -- identical whole-list PUT/GET pattern to TCO's
  //    /api/tco-analyses sync above (bootstrap-merge, debounced PUT,
  //    local-wins-during-bootstrap race guard). See that block's comments
  //    for the full rationale; not repeated here to avoid drift risk from
  //    two out-of-sync copies of the same explanation. ──
  const [wcSyncStatus, setWcSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const wcServerLoadedForUserId = useRef<number | null>(null);
  const wcBootstrapSettled = useRef(false);
  const wcLocalWinsDuringBootstrap = useRef(false);
  const wcSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wcStateRef = useRef<{ analyses: WorkingCapitalAnalysis[]; activeId: string } | null>(null);

  interface ServerWcRow {
    id: number; clientKey: string; name: string;
    inventoryValue: string; dioDays: string; dsoDays: string; dpoDays: string; annualCogs: string;
    updatedAt: string;
  }
  function serverRowToWcAnalysis(row: ServerWcRow): WorkingCapitalAnalysis {
    return {
      id: row.clientKey, name: row.name,
      inventoryValue: parseFloat(row.inventoryValue) || 0,
      dioDays: parseFloat(row.dioDays) || 0,
      dsoDays: parseFloat(row.dsoDays) || 0,
      dpoDays: parseFloat(row.dpoDays) || 0,
      annualCogs: parseFloat(row.annualCogs) || 0,
      updatedAt: new Date(row.updatedAt).getTime(),
    };
  }
  function wcAnalysisToPayload(a: WorkingCapitalAnalysis) {
    return {
      clientKey: a.id, name: a.name,
      inventoryValue: a.inventoryValue, dioDays: a.dioDays, dsoDays: a.dsoDays,
      dpoDays: a.dpoDays, annualCogs: a.annualCogs,
    };
  }
  const syncWcToServerImmediate = (analyses: WorkingCapitalAnalysis[]) => {
    if (!user) return;
    setWcSyncStatus('saving');
    if (wcSyncTimerRef.current) clearTimeout(wcSyncTimerRef.current);
    wcSyncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/working-capital-analyses`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analyses: analyses.map(wcAnalysisToPayload) }),
        });
        setWcSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setWcSyncStatus('idle'), 2500);
      } catch {
        setWcSyncStatus('error');
      }
    }, 400);
  };
  const syncWcToServer = (analyses: WorkingCapitalAnalysis[]) => {
    if (!user) return;
    if (!wcBootstrapSettled.current) {
      wcLocalWinsDuringBootstrap.current = true;
      return;
    }
    syncWcToServerImmediate(analyses);
  };
  const [wcState, setWcState] = useState<{ analyses: WorkingCapitalAnalysis[]; activeId: string }>(loadInitialWcAnalyses);
  wcStateRef.current = wcState;
  const saveWcState = (next: { analyses: WorkingCapitalAnalysis[]; activeId: string }) => {
    setWcState(next);
    safeSetItem(SK_WC_V1, JSON.stringify(next));
    syncWcToServer(next.analyses);
  };

  useEffect(() => {
    if (!user) {
      if (wcServerLoadedForUserId.current !== null) {
        wcServerLoadedForUserId.current = null;
        wcBootstrapSettled.current = false;
        wcLocalWinsDuringBootstrap.current = false;
        setWcSyncStatus('idle');
      }
      return;
    }
    if (wcServerLoadedForUserId.current === user.id) return;
    wcServerLoadedForUserId.current = user.id;
    wcBootstrapSettled.current = false;
    wcLocalWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/working-capital-analyses`, { credentials: 'include' });
        if (wcServerLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; analyses: ServerWcRow[] };
          if (data.ok && Array.isArray(data.analyses) && data.analyses.length > 0) {
            if (!wcLocalWinsDuringBootstrap.current) {
              const converted = data.analyses.map(serverRowToWcAnalysis);
              const currentActive = wcStateRef.current?.activeId;
              const activeStillExists = converted.some(a => a.id === currentActive);
              const next = { analyses: converted, activeId: activeStillExists ? currentActive! : converted[0].id };
              setWcState(next);
              safeSetItem(SK_WC_V1, JSON.stringify(next));
            }
          } else if (!wcLocalWinsDuringBootstrap.current) {
            const current = wcStateRef.current;
            if (current && current.analyses.length > 0) syncWcToServerImmediate(current.analyses);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      wcBootstrapSettled.current = true;
      if (wcLocalWinsDuringBootstrap.current) {
        const current = wcStateRef.current;
        if (current) syncWcToServerImmediate(current.analyses);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const wcActive = wcState.analyses.find(a => a.id === wcState.activeId) ?? wcState.analyses[0];
  const updateWcActive = (patch: Partial<Omit<WorkingCapitalAnalysis, 'id'>>) =>
    saveWcState({ ...wcState, analyses: wcState.analyses.map(a => a.id === wcActive.id ? { ...a, ...patch, updatedAt: Date.now() } : a) });
  const addWcAnalysis = () => {
    const fresh = defaultWcAnalysis(`${isAr ? 'سيناريو' : 'Scenario'} ${wcState.analyses.length + 1}`);
    saveWcState({ analyses: [...wcState.analyses, fresh], activeId: fresh.id });
  };
  const duplicateWcAnalysis = () => {
    const copy: WorkingCapitalAnalysis = { ...wcActive, id: `wca${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: `${wcActive.name} (${isAr ? 'نسخة' : 'copy'})`, updatedAt: Date.now() };
    saveWcState({ analyses: [...wcState.analyses, copy], activeId: copy.id });
  };
  const deleteWcAnalysis = (id: string) => {
    if (wcState.analyses.length <= 1) return;
    const remaining = wcState.analyses.filter(a => a.id !== id);
    saveWcState({ analyses: remaining, activeId: remaining[0].id });
  };
  const switchWcAnalysis = (id: string) => saveWcState({ ...wcState, activeId: id });

  // Core CCC mechanics (real formula, no fabricated benchmark -- every input is the client's own number)
  const wcCcc = wcActive.dioDays + wcActive.dsoDays - wcActive.dpoDays;
  const wcCccDollarImpact = wcCcc * (wcActive.annualCogs / 365);
  const wcHasData = wcActive.annualCogs > 0 || wcActive.inventoryValue > 0;

  // ── Cross-engine RAR exposure read (#174, "cross-engine wiring") -- real,
  //    read-only read of the Revenue-at-Risk figure the client already
  //    computed in the Resiliency toolkit, following the exact same
  //    read-only cross-engine pattern as the #165 Supplier Scorecard read
  //    used by the TCO Engine above (try/catch-wrapped localStorage read,
  //    memoized). Note: Supplier Scorecard was scoped (#172) and confirmed
  //    to have NO risk dimension in its real rating weights (delivery/
  //    quality/cost/compliance/innovation/relationship only) -- so unlike
  //    TCO, there is nothing there to honestly wire in here. RAR is the one
  //    real, grounded cross-engine figure available for a "cash-at-risk"
  //    lens. Decision Record 8.7: if the client has never run the RAR
  //    calculator, show "not yet run" -- never fabricate a number in its
  //    place. ──
  const wcRar = useMemo(() => {
    try {
      interface RoRarNode { id: string; name: string; revenuePct: number; atRisk: boolean; }
      const SK_RAR_NODES_RO = 'isc-tool-resiliency-rar-nodes-v1';
      const SK_RAR_META_RO = 'isc-tool-resiliency-rar-meta-v1';
      const nodes = loadJson<RoRarNode[]>(SK_RAR_NODES_RO, []);
      const meta = loadJson<{ interdependenciesMapped: boolean; annualRevenue: string }>(SK_RAR_META_RO, { interdependenciesMapped: false, annualRevenue: '' });
      const rawExposurePct = nodes.filter(n => n.atRisk).reduce((s, n) => s + (n.revenuePct || 0), 0);
      const annualRevenueNum = parseFloat(meta.annualRevenue) || 0;
      if (rawExposurePct === 0 || annualRevenueNum === 0) return { hasRun: false, dollarAtMedian: 0, dollarAtP95: 0 };
      const correctionLow = meta.interdependenciesMapped ? 0 : RAR_INTERDEPENDENCY_CORRECTION_PCT.low;
      const correctionHigh = meta.interdependenciesMapped ? 0 : RAR_INTERDEPENDENCY_CORRECTION_PCT.high;
      const adjustedLowPct = rawExposurePct * (1 + correctionLow / 100);
      const adjustedHighPct = rawExposurePct * (1 + correctionHigh / 100);
      const dollarAtMedian = (adjustedLowPct / 100) * annualRevenueNum * (RAR_DURATION_BENCHMARKS_DAYS.median / 365);
      const dollarAtP95 = (adjustedHighPct / 100) * annualRevenueNum * (RAR_DURATION_BENCHMARKS_DAYS.p95 / 365);
      return { hasRun: true, dollarAtMedian, dollarAtP95 };
    } catch { return { hasRun: false, dollarAtMedian: 0, dollarAtP95: 0 }; }
  // Re-read whenever this tab becomes active, since RAR is edited on a
  // separate tool (Resiliency) entirely and there is no live subscription
  // across localStorage keys.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, wcActive.id]);

  const wcLeverChartData = useMemo(() => ([
    { name: isAr ? 'قيمة المخزون' : 'Inventory Value', value: Math.round(wcActive.inventoryValue), fill: '#3b82f6' },
    { name: isAr ? 'أثر دورة التحويل النقدي' : 'CCC $ Impact', value: Math.round(wcCccDollarImpact), fill: '#f59e0b' },
    { name: isAr ? 'التعرض لمخاطر الإيراد' : 'RAR Exposure', value: wcRar.hasRun ? Math.round(wcRar.dollarAtMedian) : 0, fill: '#dc2626' },
  ]), [wcActive.inventoryValue, wcCccDollarImpact, wcRar, isAr]);

  // ── AI Executive Insight -- mirrors tcoAiPlan's grounded-prompt pattern
  //    exactly (separate toolKey so it never collides with TCO's or Spend
  //    Analysis's saved plans). Grounded strictly in the numbers computed
  //    above; the AI is never given anything it could use to invent a
  //    benchmark. ──
  const wcBuildPrompt = useCallback(() => {
    return [
      `## Working Capital Control Tower Executive Insight Request`,
      `Scenario: ${wcActive.name}`,
      '',
      `## Cash Conversion Cycle`,
      `DIO (days inventory outstanding): ${wcActive.dioDays}`,
      `DSO (days sales outstanding): ${wcActive.dsoDays}`,
      `DPO (days payables outstanding): ${wcActive.dpoDays}`,
      `CCC = DIO + DSO - DPO = ${wcCcc.toFixed(1)} days`,
      `Annual COGS: SAR ${wcActive.annualCogs.toLocaleString()}`,
      `CCC dollar impact (cash tied up by cycle timing) = CCC x (Annual COGS / 365) = SAR ${wcCccDollarImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      '',
      `## Three cash levers (kept separate -- non-additive, never summed)`,
      `1. Inventory value on the balance sheet: SAR ${wcActive.inventoryValue.toLocaleString()}`,
      `2. CCC dollar impact: SAR ${wcCccDollarImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `3. Revenue-at-Risk exposure (from the Resiliency toolkit, if run): ${wcRar.hasRun ? `SAR ${wcRar.dollarAtMedian.toLocaleString(undefined, { maximumFractionDigits: 0 })} at a typical disruption, SAR ${wcRar.dollarAtP95.toLocaleString(undefined, { maximumFractionDigits: 0 })} at a severe one` : 'not yet run by this client'}`,
      '',
      '## Your Task',
      'Write a concise (3-4 paragraph) executive working-capital insight:',
      `1. Whether the CCC of ${wcCcc.toFixed(1)} days is being driven more by inventory, receivables, or payables, and what that implies operationally`,
      '2. What the CCC dollar impact means in practical terms (cash that could be freed by tightening the cycle) -- do not add it to the inventory value or RAR figures, they measure different things',
      '3. If RAR has been run, whether the liquidity picture (CCC) and the resiliency picture (RAR) point the same direction or pull against each other',
      '4. A clear, hedged recommendation on where to focus first (DIO, DSO, or DPO), naming the one assumption that should be verified before acting',
    ].filter(Boolean).join('\n');
  }, [wcActive, wcCcc, wcCccDollarImpact, wcRar, isAr]);
  const wcAiPlan = useAIPlan(wcBuildPrompt, isAr, 'procurement-workingcapital', wcHasData);

  const exportWcAnalysis = () => {
    const rows: string[][] = [
      ['Working Capital Scenario', wcActive.name],
      [],
      ['Input', 'Value'],
      ['Inventory value (SAR)', String(wcActive.inventoryValue)],
      ['DIO -- days inventory outstanding', String(wcActive.dioDays)],
      ['DSO -- days sales outstanding', String(wcActive.dsoDays)],
      ['DPO -- days payables outstanding', String(wcActive.dpoDays)],
      ['Annual COGS (SAR)', String(wcActive.annualCogs)],
      [],
      ['Result', 'Value'],
      ['Cash Conversion Cycle (days) = DIO + DSO - DPO', wcCcc.toFixed(1)],
      ['CCC dollar impact (SAR) = CCC x (Annual COGS / 365)', wcCccDollarImpact.toFixed(0)],
      [],
      ['Three cash levers (kept separate -- not summed)', ''],
      ['1. Inventory value (SAR)', String(wcActive.inventoryValue)],
      ['2. CCC dollar impact (SAR)', wcCccDollarImpact.toFixed(0)],
      ['3. RAR exposure at median disruption (SAR)', wcRar.hasRun ? wcRar.dollarAtMedian.toFixed(0) : 'not yet run'],
    ];
    const safeName = (wcActive.name || 'working-capital-scenario').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadCsv(rows, `${safeName || 'working-capital-scenario'}.csv`);
  };

  // ── Opportunity / Spend Variance Finder (#170, Wave B-3, 2026-08-23) ──
  //    Real Purchase Price Variance (PPV) methodology, the standard
  //    procurement metric for comparing what an organization pays for the
  //    same specification item across different sites/suppliers (sources:
  //    Corporate Finance Institute-adjacent procurement literature --
  //    GEP, Ramp -- see SV_SOURCES below, both verified live before citing
  //    per Decision Record 8.7). Classic PPV compares actual vs. baseline
  //    price over time; this tool applies the same subtraction-times-
  //    volume logic across sites/suppliers instead: each site's price is
  //    normalized to a landed-cost basis (unit price + freight + quality
  //    adjustment), the cheapest becomes the benchmark, and the
  //    addressable opportunity is the landed-cost gap times the volume
  //    currently bought at each above-benchmark site.
  //    Same architectural family as the TCO Engine and Working Capital
  //    Control Tower: multi-scenario, localStorage-first with debounced
  //    server sync + bootstrap-merge for logged-in users, whole-state PUT
  //    against /api/spend-variance-analyses.
  interface SpendVarianceRow {
    id: string; siteName: string;
    unitPrice: number; freightPerUnit: number; qualityAdjPerUnit: number;
    annualQty: number; moq: number;
  }
  interface SpendVarianceAnalysis {
    id: string; name: string; itemSpec: string;
    rows: SpendVarianceRow[];
    updatedAt: number;
  }
  const SK_SV_V1 = 'isc-tool-catmgmt-spendvariance-v1';
  function defaultSvRow(label: string): SpendVarianceRow {
    return {
      id: `svr${Date.now()}${Math.random().toString(36).slice(2, 6)}`, siteName: label,
      unitPrice: 0, freightPerUnit: 0, qualityAdjPerUnit: 0, annualQty: 0, moq: 0,
    };
  }
  function defaultSvAnalysis(name: string): SpendVarianceAnalysis {
    return {
      id: `sva${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, itemSpec: '',
      rows: [defaultSvRow(isAr ? 'الموقع أ' : 'Site A'), defaultSvRow(isAr ? 'الموقع ب' : 'Site B')],
      updatedAt: Date.now(),
    };
  }
  function loadInitialSvAnalyses(): { analyses: SpendVarianceAnalysis[]; activeId: string } {
    const v1 = loadJson<{ analyses: SpendVarianceAnalysis[]; activeId: string } | null>(SK_SV_V1, null);
    if (v1 && Array.isArray(v1.analyses) && v1.analyses.length > 0) return v1;
    const fresh = defaultSvAnalysis(isAr ? 'مقارنة جديدة' : 'New comparison');
    return { analyses: [fresh], activeId: fresh.id };
  }
  // ── Server-sync -- identical whole-list PUT/GET pattern to TCO's and
  //    Working Capital's. See those blocks' comments for the full
  //    rationale; not repeated here to avoid drift risk. ──
  const [svSyncStatus, setSvSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const svServerLoadedForUserId = useRef<number | null>(null);
  const svBootstrapSettled = useRef(false);
  const svLocalWinsDuringBootstrap = useRef(false);
  const svSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svStateRef = useRef<{ analyses: SpendVarianceAnalysis[]; activeId: string } | null>(null);

  interface ServerSvRow {
    id: number; clientKey: string; name: string;
    itemSpec: string | null; rows: SpendVarianceRow[]; updatedAt: string;
  }
  function serverRowToSvAnalysis(row: ServerSvRow): SpendVarianceAnalysis {
    return {
      id: row.clientKey, name: row.name, itemSpec: row.itemSpec ?? '',
      rows: row.rows, updatedAt: new Date(row.updatedAt).getTime(),
    };
  }
  function svAnalysisToPayload(a: SpendVarianceAnalysis) {
    return { clientKey: a.id, name: a.name, itemSpec: a.itemSpec || null, rows: a.rows };
  }
  const syncSvToServerImmediate = (analyses: SpendVarianceAnalysis[]) => {
    if (!user) return;
    setSvSyncStatus('saving');
    if (svSyncTimerRef.current) clearTimeout(svSyncTimerRef.current);
    svSyncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/spend-variance-analyses`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analyses: analyses.map(svAnalysisToPayload) }),
        });
        setSvSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSvSyncStatus('idle'), 2500);
      } catch {
        setSvSyncStatus('error');
      }
    }, 400);
  };
  const syncSvToServer = (analyses: SpendVarianceAnalysis[]) => {
    if (!user) return;
    if (!svBootstrapSettled.current) {
      svLocalWinsDuringBootstrap.current = true;
      return;
    }
    syncSvToServerImmediate(analyses);
  };
  const [svState, setSvState] = useState<{ analyses: SpendVarianceAnalysis[]; activeId: string }>(loadInitialSvAnalyses);
  svStateRef.current = svState;
  const saveSvState = (next: { analyses: SpendVarianceAnalysis[]; activeId: string }) => {
    setSvState(next);
    safeSetItem(SK_SV_V1, JSON.stringify(next));
    syncSvToServer(next.analyses);
  };

  useEffect(() => {
    if (!user) {
      if (svServerLoadedForUserId.current !== null) {
        svServerLoadedForUserId.current = null;
        svBootstrapSettled.current = false;
        svLocalWinsDuringBootstrap.current = false;
        setSvSyncStatus('idle');
      }
      return;
    }
    if (svServerLoadedForUserId.current === user.id) return;
    svServerLoadedForUserId.current = user.id;
    svBootstrapSettled.current = false;
    svLocalWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/spend-variance-analyses`, { credentials: 'include' });
        if (svServerLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; analyses: ServerSvRow[] };
          if (data.ok && Array.isArray(data.analyses) && data.analyses.length > 0) {
            if (!svLocalWinsDuringBootstrap.current) {
              const converted = data.analyses.map(serverRowToSvAnalysis);
              const currentActive = svStateRef.current?.activeId;
              const activeStillExists = converted.some(a => a.id === currentActive);
              const next = { analyses: converted, activeId: activeStillExists ? currentActive! : converted[0].id };
              setSvState(next);
              safeSetItem(SK_SV_V1, JSON.stringify(next));
            }
          } else if (!svLocalWinsDuringBootstrap.current) {
            const current = svStateRef.current;
            if (current && current.analyses.length > 0) syncSvToServerImmediate(current.analyses);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      svBootstrapSettled.current = true;
      if (svLocalWinsDuringBootstrap.current) {
        const current = svStateRef.current;
        if (current) syncSvToServerImmediate(current.analyses);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const svActive = svState.analyses.find(a => a.id === svState.activeId) ?? svState.analyses[0];
  const updateSvActive = (patch: Partial<Omit<SpendVarianceAnalysis, 'id' | 'rows'>>) =>
    saveSvState({ ...svState, analyses: svState.analyses.map(a => a.id === svActive.id ? { ...a, ...patch, updatedAt: Date.now() } : a) });
  const svRows = svActive.rows;
  const saveSvRows = (next: SpendVarianceRow[]) =>
    saveSvState({ ...svState, analyses: svState.analyses.map(a => a.id === svActive.id ? { ...a, rows: next, updatedAt: Date.now() } : a) });
  const updateSvRow = (id: string, patch: Partial<SpendVarianceRow>) =>
    saveSvRows(svRows.map(r => r.id === id ? { ...r, ...patch } : r));
  const addSvRow = () => {
    if (svRows.length >= 6) return;
    const letter = String.fromCharCode(65 + svRows.length);
    saveSvRows([...svRows, defaultSvRow(`${isAr ? 'الموقع' : 'Site'} ${letter}`)]);
  };
  const removeSvRow = (id: string) => { if (svRows.length > 2) saveSvRows(svRows.filter(r => r.id !== id)); };
  const addSvAnalysis = () => {
    const fresh = defaultSvAnalysis(`${isAr ? 'مقارنة' : 'Comparison'} ${svState.analyses.length + 1}`);
    saveSvState({ analyses: [...svState.analyses, fresh], activeId: fresh.id });
  };
  const duplicateSvAnalysis = () => {
    const copy: SpendVarianceAnalysis = { ...svActive, id: `sva${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: `${svActive.name} (${isAr ? 'نسخة' : 'copy'})`, updatedAt: Date.now() };
    saveSvState({ analyses: [...svState.analyses, copy], activeId: copy.id });
  };
  const deleteSvAnalysis = (id: string) => {
    if (svState.analyses.length <= 1) return;
    const remaining = svState.analyses.filter(a => a.id !== id);
    saveSvState({ analyses: remaining, activeId: remaining[0].id });
  };
  const switchSvAnalysis = (id: string) => saveSvState({ ...svState, activeId: id });

  // ── Cross-engine wiring (#178, "wire into other engines") -- real,
  //    read-only import of the user's own saved TCO Engine analyses
  //    (tcoState.analyses, already in scope above). Decision Record 8.7's
  //    "stand by a click" applies literally: nothing here auto-fills
  //    anything -- the user must pick a TCO analysis and click Import to
  //    pull its real supplier prices into a new Spend Variance comparison,
  //    mirroring the #165 Supplier Scorecard cross-link's click-to-apply
  //    pattern used by the TCO Engine itself. Only TCO analyses with at
  //    least one supplier carrying a real unit price are offered, since an
  //    all-zero analysis would produce a meaningless comparison.
  const svImportableTcoAnalyses = useMemo(
    () => tcoState.analyses.filter(a => a.suppliers.some(s => s.unitPrice > 0 && s.annualQty > 0)),
    [tcoState.analyses],
  );
  const importSvFromTco = (tcoAnalysisId: string) => {
    const tco = tcoState.analyses.find(a => a.id === tcoAnalysisId);
    if (!tco) return;
    const importedRows: SpendVarianceRow[] = tco.suppliers.map(s => ({
      id: `svr${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      siteName: s.name,
      unitPrice: s.unitPrice,
      // TCO's freight/insurance/handling/last-mile stages all normalize to
      // a per-unit landed-cost adjustment here, same as this tool's own
      // freightPerUnit field -- real figures the user already entered.
      freightPerUnit: s.freight + s.insurance + s.handling + s.lastMile,
      qualityAdjPerUnit: s.annualQty > 0 ? (s.inspectionCost + s.reworkCost + s.auditCost) / s.annualQty : 0,
      annualQty: s.annualQty,
      moq: 0,
    }));
    const rows = importedRows.length >= 2 ? importedRows : [...importedRows, defaultSvRow(isAr ? 'موقع إضافي' : 'Additional site')];
    const fresh: SpendVarianceAnalysis = {
      id: `sva${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      name: `${tco.name} (${isAr ? 'من محرك TCO' : 'from TCO Engine'})`,
      itemSpec: tco.itemName || '',
      rows,
      updatedAt: Date.now(),
    };
    saveSvState({ analyses: [...svState.analyses, fresh], activeId: fresh.id });
    toast.success(isAr ? 'تم الاستيراد من محرك TCO ✓' : 'Imported from TCO Engine ✓');
  };

  /* Pure PPV calculation -- landed unit cost, benchmark identification, and
     addressable opportunity per row. Kept as one function so the results
     table, chart, CSV export, and AI prompt can never silently drift out of
     arithmetic sync with each other. */
  function computeSvResults(rows: SpendVarianceRow[]) {
    const landed = rows.map(r => ({ id: r.id, landedUnitCost: r.unitPrice + r.freightPerUnit + r.qualityAdjPerUnit }));
    const validRows = rows.filter(r => r.unitPrice > 0 && r.annualQty > 0);
    const validLanded = landed.filter(l => validRows.some(r => r.id === l.id));
    const benchmarkLandedCost = validLanded.length > 0 ? Math.min(...validLanded.map(l => l.landedUnitCost)) : 0;
    const benchmarkId = validLanded.find(l => l.landedUnitCost === benchmarkLandedCost)?.id;
    const rowResults = rows.map(r => {
      const l = landed.find(x => x.id === r.id)!;
      const isValid = r.unitPrice > 0 && r.annualQty > 0;
      const ppvPerUnit = isValid && benchmarkId ? Math.max(0, l.landedUnitCost - benchmarkLandedCost) : 0;
      const addressableOpportunity = ppvPerUnit * r.annualQty;
      return { id: r.id, landedUnitCost: l.landedUnitCost, isValid, isBenchmark: r.id === benchmarkId, ppvPerUnit, addressableOpportunity };
    });
    const totalAddressableOpportunity = rowResults.reduce((s, r) => s + r.addressableOpportunity, 0);
    const benchmarkRow = rows.find(r => r.id === benchmarkId);
    // Redirectable volume -- the annual quantity currently bought at every
    // OTHER (above-benchmark) site, i.e. what would actually move to the
    // benchmark site if consolidated. Used only as an honest feasibility
    // flag against that site's own stated MOQ, never to change the dollar
    // figure above.
    const redirectableQty = rows.filter(r => r.id !== benchmarkId).reduce((s, r) => s + (r.annualQty || 0), 0);
    const moqNote = benchmarkRow && benchmarkRow.moq > 0 && benchmarkRow.moq > redirectableQty;
    return { rowResults, totalAddressableOpportunity, benchmarkId, benchmarkRow, redirectableQty, moqNote };
  }
  const svResults = useMemo(() => computeSvResults(svRows), [svRows]);
  const svHasData = svResults.rowResults.some(r => r.isValid);

  const svChartData = useMemo(() => (
    svRows.map(r => {
      const res = svResults.rowResults.find(x => x.id === r.id);
      return {
        name: r.siteName.length > 14 ? r.siteName.slice(0, 12) + '…' : r.siteName,
        opportunity: Math.round(res?.addressableOpportunity ?? 0),
        fill: res?.isBenchmark ? '#059669' : '#f59e0b',
      };
    })
  ), [svRows, svResults]);

  // ── AI Executive Insight -- mirrors tcoAiPlan / wcAiPlan's grounded-
  //    prompt pattern exactly (separate toolKey so it never collides with
  //    other saved plans). ──
  const svBuildPrompt = useCallback(() => {
    const rowLines = svRows.map(r => {
      const res = svResults.rowResults.find(x => x.id === r.id);
      return `- ${r.siteName}: unit price SAR ${r.unitPrice.toFixed(2)}, freight SAR ${r.freightPerUnit.toFixed(2)}, quality adj SAR ${r.qualityAdjPerUnit.toFixed(2)} -> landed SAR ${(res?.landedUnitCost ?? 0).toFixed(2)}, annual qty ${r.annualQty}, MOQ ${r.moq}`
        + (res?.isBenchmark ? ' [BENCHMARK -- lowest landed cost]' : (res?.isValid ? `, PPV/unit SAR ${res.ppvPerUnit.toFixed(2)}, addressable opportunity SAR ${res.addressableOpportunity.toFixed(0)}` : ''));
    }).join('\n');
    return [
      `## Opportunity / Spend Variance Finder Executive Insight Request`,
      `Comparison: ${svActive.name} | Item spec: ${svActive.itemSpec || 'Not specified'}`,
      '',
      `## Sites/suppliers compared`,
      rowLines || 'No cost data entered yet.',
      '',
      `## Total addressable opportunity`,
      `SAR ${svResults.totalAddressableOpportunity.toFixed(0)} per year, if all above-benchmark volume moved to ${svResults.benchmarkRow?.siteName || 'the benchmark site'}.`,
      svResults.moqNote ? `Feasibility flag: ${svResults.benchmarkRow?.siteName}'s stated MOQ (${svResults.benchmarkRow?.moq}) exceeds the volume that would redirect there (${svResults.redirectableQty}) -- may need consolidating with existing volume already placed there.` : '',
      '',
      '## Your Task',
      'Write a concise (3-4 paragraph) executive insight on this price-variance finding:',
      '1. What the numbers say: the real landed-cost gap and which site is driving the addressable opportunity',
      '2. Whether the gap looks structural (persistent price difference) or could be explained by a one-off factor (e.g. a recent freight spike at one site) -- flag this as something to verify, not something the numbers alone can tell you',
      '3. The MOQ feasibility flag above, if any, and what it means for actually capturing this opportunity',
      '4. A clear, hedged recommendation on next step (e.g. renegotiate the higher-priced site, or consolidate volume), naming the one assumption that should be verified before acting',
    ].filter(Boolean).join('\n');
  }, [svActive, svRows, svResults]);
  const svAiPlan = useAIPlan(svBuildPrompt, isAr, 'procurement-spendvariance', svHasData);

  const exportSvAnalysis = () => {
    const rows: string[][] = [
      ['Spend Variance Comparison', svActive.name],
      ['Item spec', svActive.itemSpec],
      [],
      ['Site/Supplier', 'Unit price (SAR)', 'Freight/unit (SAR)', 'Quality adj/unit (SAR)', 'Landed unit cost (SAR)', 'Annual qty', 'MOQ', 'Benchmark?', 'PPV/unit (SAR)', 'Addressable opportunity (SAR/yr)'],
    ];
    svRows.forEach(r => {
      const res = svResults.rowResults.find(x => x.id === r.id);
      rows.push([
        r.siteName, r.unitPrice.toFixed(2), r.freightPerUnit.toFixed(2), r.qualityAdjPerUnit.toFixed(2),
        (res?.landedUnitCost ?? 0).toFixed(2), String(r.annualQty), String(r.moq),
        res?.isBenchmark ? 'Yes' : 'No',
        (res?.ppvPerUnit ?? 0).toFixed(2), (res?.addressableOpportunity ?? 0).toFixed(0),
      ]);
    });
    rows.push([]);
    rows.push(['Total addressable opportunity (SAR/yr)', svResults.totalAddressableOpportunity.toFixed(0)]);
    const safeName = (svActive.name || 'spend-variance-comparison').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadCsv(rows, `${safeName || 'spend-variance-comparison'}.csv`);
  };

  const anyBreach = Object.values(breachLevels).some(v => v !== null);

  const tabs: { id: Tab; icon: string; label: string; labelAr: string }[] = [
    { id: 'spend',     icon: '📊', label: 'Spend Analysis',      labelAr: 'تحليل الإنفاق'      },
    { id: 'market',    icon: '🌍', label: 'Market Intelligence',  labelAr: 'استخبارات السوق'    },
    { id: 'strategy',  icon: '🎯', label: 'Sourcing Strategy',    labelAr: 'استراتيجية التوريد' },
    { id: 'templates', icon: '📥', label: 'Templates & Tools',    labelAr: 'القوالب والأدوات'   },
    { id: 'tco',       icon: '💰', label: 'TCO Engine',           labelAr: 'محرك التكلفة الإجمالية' },
    { id: 'workingcapital', icon: '💧', label: 'Working Capital', labelAr: 'رأس المال العامل' },
    { id: 'spendvariance', icon: '🔍', label: 'Spend Variance', labelAr: 'تباين الإنفاق' },
    { id: 'ai',        icon: '✨', label: 'AI Strategy Brief',    labelAr: 'تقرير الاستراتيجية' },
    { id: 'alerts',    icon: '🔔', label: 'Alert Thresholds',     labelAr: 'حدود التنبيه'       },
  ];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow-key navigation follows WAI-ARIA tab pattern:
  // ArrowRight → next tab (wraps), ArrowLeft → previous tab (wraps).
  // Physical key direction is the same in both LTR and RTL layouts
  // (matching the WAI-ARIA authoring practices recommendation), so Arabic
  // users pressing ArrowRight move to the next tab in DOM order, which is
  // visually left in RTL. This is intentional — screen readers announce
  // direction relative to the DOM, and reversing physical keys would break
  // keyboard muscle memory for users who switch languages mid-session.
  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % count;
      setActiveTab(tabs[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + count) % count;
      setActiveTab(tabs[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[count - 1].id);
      tabRefs.current[count - 1]?.focus();
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#082C6B] text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
            <span>{t.icon}</span><span className="hidden sm:inline">{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: Spend Analysis ── */}
      {activeTab === 'spend' && (
        <div id="panel-spend" role="tabpanel" aria-labelledby="tab-spend" className="space-y-4">
          {/* Summary cards */}
          {validRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Spend */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[11px] text-slate-500 font-medium">{isAr ? 'إجمالي الإنفاق' : 'Total Spend'}</p>
                <p className="text-xl font-black mt-1" style={{ color: '#082C6B' }}>SAR {(totalSpend/1000).toFixed(0)}K</p>
              </div>
              {/* Suppliers */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[11px] text-slate-500 font-medium">{isAr ? 'عدد الموردين' : 'Suppliers'}</p>
                <p className="text-xl font-black mt-1" style={{ color: '#4f46e5' }}>{validRows.length}</p>
              </div>
              {/* Contracted % — with breach badge */}
              <div className={`bg-white border rounded-xl p-3 text-center shadow-sm relative ${breachLevels.contractedPct === 'critical' ? 'border-red-400 bg-red-50' : breachLevels.contractedPct === 'warn' ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                {breachLevels.contractedPct && (
                  <span className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${breachLevels.contractedPct === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <AlertTriangle className="w-2.5 h-2.5" />{breachLevels.contractedPct === 'critical' ? (isAr ? 'بالغ' : 'CRIT') : (isAr ? 'تحذير' : 'WARN')}
                  </span>
                )}
                <p className="text-[11px] text-slate-500 font-medium">{isAr ? 'الإنفاق المتعاقد' : 'Contracted'}</p>
                <p className="text-xl font-black mt-1" style={{ color: contractedPct >= 70 ? '#059669' : contractedPct >= 40 ? '#d97706' : '#dc2626' }}>{contractedPct}%</p>
              </div>
              {/* Top-3 Concentration % — with breach badge */}
              <div className={`bg-white border rounded-xl p-3 text-center shadow-sm relative ${breachLevels.top3Pct === 'critical' ? 'border-red-400 bg-red-50' : breachLevels.top3Pct === 'warn' ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                {breachLevels.top3Pct && (
                  <span className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${breachLevels.top3Pct === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <AlertTriangle className="w-2.5 h-2.5" />{breachLevels.top3Pct === 'critical' ? (isAr ? 'بالغ' : 'CRIT') : (isAr ? 'تحذير' : 'WARN')}
                  </span>
                )}
                <p className="text-[11px] text-slate-500 font-medium">{isAr ? 'تركّز أعلى 3 موردين' : 'Top-3 Concentration'}</p>
                <p className="text-xl font-black mt-1" style={{ color: top3Pct > 70 ? '#dc2626' : top3Pct > 50 ? '#d97706' : '#059669' }}>{top3Pct}%</p>
              </div>
            </div>
          )}

          {/* Breach alert banner */}
          {anyBreach && validRows.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                {isAr
                  ? 'تم اكتشاف تنبيهات على بعض مؤشرات الأداء. راجع تبويب حدود التنبيه.'
                  : 'One or more KPIs are breaching alert thresholds. Review the Alert Thresholds tab.'}
              </p>
              <button onClick={() => setActiveTab('alerts')} className="ml-auto shrink-0 text-xs text-amber-700 font-bold underline hover:text-amber-900">
                {isAr ? 'عرض' : 'View'}
              </button>
            </div>
          )}

          {/* Pareto chart */}
          {paretoData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-1">{isAr ? 'تحليل باريتو — أعلى 10 موردين' : 'Pareto Analysis — Top 10 Suppliers'}</h3>
              <p className="text-[11px] text-slate-400 mb-3">{isAr ? 'الأعمدة = الإنفاق السنوي، الخط = النسبة التراكمية' : 'Bars = annual spend · Line = cumulative %'}</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={paretoData} margin={{ top: 5, right: 30, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number, name: string) => name === 'spend' ? `SAR ${v.toLocaleString()}` : `${v}%`} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} label={{ value: '80%', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                  <Bar yAxisId="left" dataKey="spend" name={isAr ? 'الإنفاق' : 'Spend'} radius={[3, 3, 0, 0]}>
                    {paretoData.map((_, i) => <Cell key={i} fill={i < 3 ? '#082C6B' : i < 6 ? '#4f46e5' : '#94a3b8'} />)}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#C9A84C" strokeWidth={2} dot={{ r: 3, fill: '#C9A84C' }} name={isAr ? 'تراكمي %' : 'Cumulative %'} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Editable table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">{isAr ? 'بيانات الإنفاق' : 'Spend Data'}</h3>
              <p className="text-[11px] text-slate-400">{isAr ? 'أدخل البيانات يدوياً أو ارفع CSV' : 'Enter manually or upload CSV'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[isAr ? 'المورد' : 'Supplier', isAr ? 'الفئة' : 'Category', isAr ? 'فئة فرعية' : 'Subcategory', isAr ? 'قطاع UNSPSC' : 'UNSPSC Segment', isAr ? 'الإنفاق السنوي (ر.س)' : 'Annual Spend (SAR)', isAr ? 'متعاقد؟' : 'Contracted?', isAr ? 'استراتيجي؟' : 'Strategic?', ''].map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-2 py-1.5"><input value={row.supplier} onChange={e => updateRow(row.id, 'supplier', e.target.value)} placeholder={isAr ? 'اسم المورد' : 'Supplier name'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-[#082C6B]" /></td>
                      <td className="px-2 py-1.5"><input value={row.category} onChange={e => updateRow(row.id, 'category', e.target.value)} placeholder={isAr ? 'فئة' : 'Category'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 min-w-[100px] focus:outline-none focus:ring-1 focus:ring-[#082C6B]" /></td>
                      <td className="px-2 py-1.5"><input value={row.subcategory} onChange={e => updateRow(row.id, 'subcategory', e.target.value)} placeholder={isAr ? 'فئة فرعية' : 'Subcategory'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 min-w-[100px] focus:outline-none focus:ring-1 focus:ring-[#082C6B]" /></td>
                      <td className="px-2 py-1.5 min-w-[140px]">
                        <select value={row.unspscSegmentCode ?? ''} onChange={e => updateRow(row.id, 'unspscSegmentCode', e.target.value)} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                          {UNSPSC_SERVICES_SEGMENTS.map(s => <option key={s.code} value={s.code}>{s.code} -- {isAr ? s.labelAr : s.label}</option>)}
                          <option value="other">{isAr ? 'أخرى...' : 'Other...'}</option>
                        </select>
                        {row.unspscSegmentCode === 'other' ? (
                          <input type="text" value={row.unspscSegmentOther ?? ''} onChange={e => updateRow(row.id, 'unspscSegmentOther', e.target.value)}
                            placeholder={isAr ? 'ما الفئة التي تبحث عنها؟' : 'What were you looking for?'}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5"><input type="number" value={row.annualSpend || ''} onChange={e => updateRow(row.id, 'annualSpend', parseFloat(e.target.value) || 0)} placeholder="0" className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-right min-w-[120px] focus:outline-none focus:ring-1 focus:ring-[#082C6B]" /></td>
                      <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={row.contracted} onChange={e => updateRow(row.id, 'contracted', e.target.checked)} className="w-4 h-4 accent-[#082C6B]" aria-label={isAr ? `${row.supplier || 'مورد'}: تحت عقد` : `${row.supplier || 'Supplier'}: contracted`} /></td>
                      <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={row.strategic} onChange={e => updateRow(row.id, 'strategic', e.target.checked)} className="w-4 h-4 accent-[#082C6B]" aria-label={isAr ? `${row.supplier || 'مورد'}: استراتيجي` : `${row.supplier || 'Supplier'}: strategic`} /></td>
                      <td className="px-2 py-1.5"><button onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={isAr ? `حذف ${row.supplier || 'مورد'}` : `Remove ${row.supplier || 'supplier'}`} className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                  <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مورد' : 'Add row'}
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  aria-label={isAr ? 'استيراد CSV' : 'Import CSV'}
                  className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold hover:text-[#082C6B] hover:opacity-80"
                >
                  <Upload className="w-3.5 h-3.5" />{isAr ? 'استيراد CSV' : 'Import CSV'}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv"
                  aria-label={isAr ? 'ملف CSV للاستيراد' : 'CSV file to import'}
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) { handleSpendImport(file); e.target.value = ''; }
                  }}
                />
              </div>
              {validRows.length > 0 && (
                <button onClick={() => setActiveTab('market')} className="text-xs bg-[#082C6B] text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90">
                  {isAr ? 'التالي: استخبارات السوق →' : 'Next: Market Intelligence →'}
                </button>
              )}
            </div>
            {importLog && (
              <div className={`mx-4 mb-3 text-xs rounded-lg p-3 border ${importLog[0]?.startsWith('✓') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="space-y-0.5">
                  {importLog.map((m, i) => (
                    <p key={i} className={i === 0 ? 'font-bold' : 'opacity-75'}>{m}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Market Intelligence ── */}
      {activeTab === 'market' && (
        <div id="panel-market" role="tabpanel" aria-labelledby="tab-market" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'حلّل قوى بورتر الخمس لهذه الفئة. 1 = قوة/تهديد منخفض، 5 = قوة/تهديد مرتفع.' : 'Analyse Porter\'s Five Forces for this category. 1 = low threat/power, 5 = high threat/power.'}</p>
          </div>

          {/* Market risk summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-slate-500">{isAr ? 'متوسط الدرجة' : 'Avg Score'}</p>
              <p className="text-2xl font-black mt-1" style={{ color: marketRiskColor }}>{porterAvg.toFixed(1)}/5</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-slate-500">{isAr ? 'مخاطر السوق' : 'Market Risk'}</p>
              <p className="text-lg font-black mt-1" style={{ color: marketRiskColor }}>{isAr ? marketRiskAr : marketRisk}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <p className="text-[11px] text-slate-500">{isAr ? 'قوة المفاوضة' : 'Buyer Leverage'}</p>
              <p className="text-lg font-black mt-1 text-[#082C6B]">{porterAvg < 2.5 ? (isAr ? 'قوية' : 'Strong') : porterAvg < 3.5 ? (isAr ? 'متوازنة' : 'Balanced') : (isAr ? 'ضعيفة' : 'Weak')}</p>
            </div>
          </div>

          {/* Porter's force sliders */}
          <div className="space-y-3">
            {PORTER_FORCES.map(force => {
              const score = porter[force.id]?.score ?? 3;
              const color = score >= 4 ? '#dc2626' : score >= 3 ? '#d97706' : '#059669';
              return (
                <div key={force.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800">{isAr ? force.labelAr : force.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? force.hintAr : force.hint}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-black" style={{ color }}>{score}</p>
                      <p className="text-[10px] font-bold" style={{ color }}>{score >= 4 ? (isAr ? 'مرتفع' : 'HIGH') : score >= 3 ? (isAr ? 'متوسط' : 'MED') : (isAr ? 'منخفض' : 'LOW')}</p>
                    </div>
                  </div>
                  <input type="range" min={1} max={5} step={1} value={score}
                    onChange={e => updatePorter(force.id, 'score', parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                    aria-label={isAr ? force.labelAr : force.label}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                    <span>{isAr ? 'منخفض' : 'Low'}</span><span>2</span><span>3</span><span>4</span><span>{isAr ? 'مرتفع' : 'High'}</span>
                  </div>
                  <input value={porter[force.id]?.notes ?? ''} onChange={e => updatePorter(force.id, 'notes', e.target.value)}
                    placeholder={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                    aria-label={isAr ? `ملاحظات ${force.labelAr}` : `${force.label} notes`}
                    className="mt-2 w-full text-xs border border-slate-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-600 bg-slate-50" />
                </div>
              );
            })}
          </div>

          <button onClick={() => setActiveTab('strategy')} className="w-full text-xs bg-[#082C6B] text-white px-4 py-2.5 rounded-xl font-semibold hover:opacity-90">
            {isAr ? 'التالي: بناء الاستراتيجية →' : 'Next: Build Sourcing Strategy →'}
          </button>
        </div>
      )}

      {/* ── TAB 3: Sourcing Strategy ── */}
      {activeTab === 'strategy' && (
        <div id="panel-strategy" role="tabpanel" aria-labelledby="tab-strategy" className="space-y-4">
          {/* Auto-recommendation */}
          <div className="bg-gradient-to-r from-[#082C6B] to-[#0e3d8a] text-white rounded-2xl p-5">
            <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">{isAr ? 'التوصية التلقائية' : 'Auto-Recommended Strategy'}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{STRATEGIES.find(s => s.id === autoStrategy)?.icon}</span>
              <div>
                <p className="text-lg font-black">{isAr ? STRATEGIES.find(s => s.id === autoStrategy)?.labelAr : STRATEGIES.find(s => s.id === autoStrategy)?.label}</p>
                <p className="text-xs text-white/70 mt-0.5">{isAr ? STRATEGIES.find(s => s.id === autoStrategy)?.whenAr : STRATEGIES.find(s => s.id === autoStrategy)?.when}</p>
              </div>
            </div>
            <p className="text-sm text-white/80 mt-3 leading-relaxed">{isAr ? STRATEGIES.find(s => s.id === autoStrategy)?.descAr : STRATEGIES.find(s => s.id === autoStrategy)?.desc}</p>
            <p className="text-[10px] text-white/50 mt-2">{isAr ? 'بناءً على تركّز الإنفاق وتحليل بورتر. يمكنك تحديد استراتيجية مختلفة أدناه.' : 'Based on spend concentration + Porter\'s forces. Override below if needed.'}</p>
          </div>

          {/* ── TCO-informed sourcing signal (#165, "wire into other engines") --
              surfaces the single biggest real savings opportunity already
              computed in the TCO Engine's Portfolio view, so a sourcing
              strategy decision is informed by actual entered cost data, not
              spend concentration + market risk alone. ── */}
          {tcoBiggestOpportunity && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] text-emerald-800">
                  {isAr
                    ? `أكبر فرصة توفير من محرك TCO: "${tcoBiggestOpportunity.name}" يُظهر فرصة توفير ${tcoBiggestOpportunity.savingsPct.toFixed(1)}% بين أرخص وأغلى مورّد (${tcoBiggestOpportunity.bestTcoPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} ريال/وحدة مقابل الأفضل). قد يستحق ذلك تعديل استراتيجية التوريد لهذه الفئة.`
                    : `Biggest TCO Engine savings opportunity: "${tcoBiggestOpportunity.name}" shows a ${tcoBiggestOpportunity.savingsPct.toFixed(1)}% gap between its cheapest and priciest supplier (SAR ${tcoBiggestOpportunity.bestTcoPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/unit at best). Worth factoring into the sourcing strategy for this category.`}
                </p>
                <button onClick={() => setActiveTab('tco')} className="text-[10px] font-bold text-emerald-700 hover:opacity-80 mt-1">
                  {isAr ? 'فتح محرك TCO →' : 'Open TCO Engine →'}
                </button>
              </div>
            </div>
          )}

          {/* Action plan for chosen strategy */}
          {chosenStrategy && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{isAr ? 'خطة تنفيذ الاستراتيجية' : 'Strategy Action Plan'} — {isAr ? chosenStrategy.labelAr : chosenStrategy.label}</p>
              <ul className="space-y-2">
                {chosenStrategy.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#082C6B] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i+1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategy explorer */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{isAr ? 'استكشف جميع الاستراتيجيات' : 'Explore All 7 Strategies'}</p>
            <div className="grid gap-3">
              {STRATEGIES.map(s => {
                const isSelected = (selectedStrategy || autoStrategy) === s.id;
                return (
                  <div key={s.id} onClick={() => saveStrategy(s.id)}
                    className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${isSelected ? 'border-[#082C6B] shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{s.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800">{isAr ? s.labelAr : s.label}</p>
                          {isSelected && <span className="text-[10px] bg-[#082C6B] text-white px-2 py-0.5 rounded-full font-semibold">{isAr ? 'محدد' : 'Selected'}</span>}
                          {s.id === autoStrategy && !isSelected && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{isAr ? 'موصى به' : 'Recommended'}</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? s.whenAr : s.when}</p>
                      </div>
                    </div>
                    {isSelected && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{isAr ? s.descAr : s.desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Templates ── */}
      {activeTab === 'templates' && (
        <div id="panel-templates" role="tabpanel" aria-labelledby="tab-templates" className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'قوالب CIPS-متوافقة جاهزة للتحميل. كل قالب مُصمَّم وفق أفضل الممارسات الدولية في إدارة المشتريات.' : 'CIPS-aligned templates ready to download. Each template is designed to international procurement best-practice standards.'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">{isAr ? t.labelAr : t.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? t.descAr : t.desc}</p>
                  <button onClick={() => { t.generate(); toast.success(isAr ? 'جاري التحميل…' : 'Downloading…'); }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                    <FileDown className="w-3.5 h-3.5" />{isAr ? 'تحميل' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: TCO Engine (#168, rebuilt v2) ── */}
      {activeTab === 'tco' && (
        <div id="panel-tco" role="tabpanel" aria-labelledby="tab-tco" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {isAr
                ? 'قارن حتى 5 موردين عبر التكلفة الإجمالية للملكية الحقيقية، مبنية على نموذج CIPS رباعي المراحل (شراء / اقتناء / استخدام / نهاية العمر) مع إضافة إلرام لتكاليف العمليات. اختر الصناعة والفئة أدناه لعرض قائمة تحقق موثّقة بمصادر حول التكاليف الخفية الأكثر أهمية لهذه الفئة تحديداً -- القائمة إرشادية فقط، وكل رقم في الجدول يبقى من إدخالك أنت.'
                : 'Compare up to 5 suppliers by real Total Cost of Ownership, structured on CIPS’s 4-stage TCO model (Procurement / Acquisition / Usage / End-of-life) plus Ellram’s process-cost addendum. Select an Industry and Category below to see a sourced checklist of which hidden costs are typically most material for that specific category -- the checklist is guidance only; every number in the table below stays yours to enter.'}
            </p>
          </div>

          {/* View-mode toggle -- Analysis (single item, supplier comparison) vs.
              Portfolio (cross-item comparison, #163). Directly answers "can a client
              compare two or more items?" -- not just suppliers within one item. */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
            <button onClick={() => setTcoViewMode('analysis')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tcoViewMode === 'analysis' ? 'bg-white text-[#082C6B] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {isAr ? 'تحليل واحد' : 'Single analysis'}
            </button>
            <button onClick={() => setTcoViewMode('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tcoViewMode === 'portfolio' ? 'bg-white text-[#082C6B] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {isAr ? `مقارنة المحفظة (${tcoState.analyses.length})` : `Portfolio comparison (${tcoState.analyses.length})`}
            </button>
          </div>

          {tcoViewMode === 'portfolio' ? (
            <div className="print-zone-tco-portfolio space-y-3">
              {/* Print-only header (#167) */}
              <div className="tco-print-header pb-3 border-b border-slate-200 mb-2">
                <h2 className="text-base font-bold text-slate-800">{isAr ? 'تقرير مقارنة محفظة TCO' : 'TCO Portfolio Comparison Report'}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'تاريخ الإنشاء: ' : 'Generated: '}{new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  {isAr
                    ? 'قارن التكلفة الإجمالية للملكية عبر جميع العناصر/الفئات المحفوظة -- وليس فقط بين موردين لنفس الصنف. لكل تحليل، "أفضل مورّد" هو المورّد صاحب أقل TCO لكل وحدة ضمن ذلك التحليل. "فرصة التوفير" تقارن أفضل مورّد بأغلى مورّد ضمن نفس التحليل.'
                    : 'Compare Total Cost of Ownership across every saved item/category -- not just between suppliers of the same item. For each analysis, "Best supplier" is whichever supplier has the lowest TCO/unit within that analysis; "Savings potential" compares that best supplier against the costliest one in the same analysis.'}
                </p>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 print-hide">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-500">{isAr ? 'الترتيب حسب:' : 'Sort by:'}</label>
                  <select value={tcoPortfolioSort} onChange={e => setTcoPortfolioSort(e.target.value as TcoPortfolioSort)}
                    aria-label={isAr ? 'الترتيب حسب:' : 'Sort by:'}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700">
                    <option value="updated">{isAr ? 'آخر تحديث' : 'Last updated'}</option>
                    <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                    <option value="tcoPerUnit">{isAr ? 'أعلى TCO لكل وحدة' : 'Highest TCO/unit'}</option>
                    <option value="savings">{isAr ? 'أكبر فرصة توفير' : 'Biggest savings opportunity'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportTcoPortfolio}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
                    <Download className="w-3.5 h-3.5" />{isAr ? 'تصدير المحفظة (CSV)' : 'Export portfolio (CSV)'}
                  </button>
                  <button onClick={() => printZone('tco-portfolio')}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-[#082C6B] text-white px-3 py-1.5 rounded-xl hover:bg-[#082C6B]/90 transition-colors">
                    <FileDown className="w-3.5 h-3.5" />{isAr ? 'تصدير PDF' : 'Export PDF'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'التحليل / العنصر' : 'Analysis / Item'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الصناعة / الفئة' : 'Industry / Category'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الموردون' : 'Suppliers'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'أفضل مورّد' : 'Best supplier'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'TCO لكل وحدة' : 'TCO/unit'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'TCO السنوي' : 'Annual TCO'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'فرصة التوفير' : 'Savings potential'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'آخر تحديث' : 'Updated'}</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tcoPortfolioSorted.map(r => (
                      <tr key={r.id} className={`border-b border-slate-100 ${r.id === tcoActiveAnalysis.id ? 'bg-blue-50/50' : ''}`}>
                        <td className="py-2 pr-2 font-semibold text-slate-700 whitespace-nowrap">{r.name}{r.itemName ? <span className="block text-[10px] font-normal text-slate-400">{r.itemName}</span> : null}</td>
                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{r.industryLabel || '—'}{r.skuLabel ? <span className="block text-[10px] text-slate-400">{r.skuLabel}</span> : null}</td>
                        <td className="py-2 px-2 text-slate-500">{r.supplierCount}</td>
                        <td className="py-2 px-2 text-slate-700">{r.hasData ? r.bestSupplierName : <span className="text-slate-300 italic">{isAr ? 'لا بيانات' : 'no data yet'}</span>}</td>
                        <td className="py-2 px-2 font-semibold text-slate-800">{r.hasData ? `SAR ${r.bestTcoPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}</td>
                        <td className="py-2 px-2 text-slate-600">{r.hasData ? `SAR ${r.bestTcoAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}</td>
                        <td className="py-2 px-2">
                          {r.hasData && r.savingsPct > 0 ? (
                            <span className="text-emerald-600 font-semibold">{r.savingsPct.toFixed(1)}%</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{new Date(r.updatedAt).toLocaleDateString()}</td>
                        <td className="py-2 px-2 print-hide">
                          <button onClick={() => { switchTcoAnalysis(r.id); setTcoViewMode('analysis'); }}
                            className="text-[11px] font-semibold text-[#082C6B] hover:opacity-80 whitespace-nowrap">
                            {isAr ? 'فتح ←' : 'Open →'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tcoPortfolio.filter(r => r.hasData).length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'لا توجد بيانات تكلفة بعد في أي تحليل. أدخل الأسعار والكميات في "تحليل واحد" لرؤية المقارنة هنا.' : 'No cost data entered yet in any analysis. Fill in prices and quantities under "Single analysis" to see the comparison here.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
          <div className="print-zone-tco space-y-4">
          {/* Export PDF (#167) -- prints this analysis: item context, cost
              table, decision score, sensitivity read, checklist, sources. */}
          <div className="flex justify-end print-hide">
            <button onClick={() => printZone('tco')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#082C6B] text-white px-3 py-1.5 rounded-xl hover:bg-[#082C6B]/90 transition-colors">
              <FileDown className="w-3.5 h-3.5" />{isAr ? 'تصدير PDF' : 'Export PDF'}
            </button>
          </div>

          {/* Print-only header -- resolves everything the print-hidden editing
              controls below would otherwise show (item context, weights,
              generated date), since the report should read standalone. */}
          <div className="tco-print-header pb-3 border-b border-slate-200 mb-2">
            <h2 className="text-base font-bold text-slate-800">{isAr ? 'تقرير التكلفة الإجمالية للملكية' : 'Total Cost of Ownership Report'}</h2>
            <p className="text-xs text-slate-600 mt-1">
              {tcoActiveAnalysis.name}
              {tcoActiveAnalysis.itemName ? ` -- ${tcoActiveAnalysis.itemName}` : ''}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {[
                INDUSTRIES.find(i => i.id === tcoActiveAnalysis.industry)?.label,
                tcoActiveAnalysis.subSector,
                SKU_CLASSES.find(sc => sc.id === tcoActiveAnalysis.skuClass)?.label,
              ].filter(Boolean).join(' | ') || (isAr ? 'لم يتم تحديد الصناعة/الفئة' : 'Industry/category not specified')}
            </p>
            {tcoSuppliers.length > 1 && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'أوزان التقييم المرجّح: ' : 'Decision score weights: '}
                {isAr ? 'التكلفة' : 'Cost'} {tcoWeights.cost}% / {isAr ? 'الجودة' : 'Quality'} {tcoWeights.quality}% / {isAr ? 'التسليم' : 'Delivery'} {tcoWeights.delivery}% / {isAr ? 'مخاطر المصدر الواحد' : 'Single-source risk'} {tcoWeights.risk}% / {isAr ? 'الملاءمة الاستراتيجية' : 'Strategic fit'} {tcoWeights.strategicFit}%
              </p>
            )}
            <p className="text-[10px] text-slate-300 mt-1">{isAr ? 'تاريخ الإنشاء: ' : 'Generated: '}{new Date().toLocaleDateString()}</p>
          </div>

          {/* Analysis switcher -- multiple named, saved analyses (one per item/category) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 print-hide">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 shrink-0">{isAr ? 'التحليل:' : 'Analysis:'}</label>
              <select value={tcoActiveAnalysis.id} onChange={e => switchTcoAnalysis(e.target.value)} aria-label={isAr ? 'التحليل:' : 'Analysis:'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700 min-w-[160px]">
                {tcoState.analyses.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input value={tcoActiveAnalysis.name} onChange={e => updateActiveAnalysis({ name: e.target.value })}
                aria-label={isAr ? 'اسم التحليل' : 'Analysis name'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-[140px]" />
              <button onClick={addTcoAnalysis} className="flex items-center gap-1 text-[11px] font-semibold text-[#082C6B] hover:opacity-80 shrink-0">
                <Plus className="w-3.5 h-3.5" />{isAr ? 'تحليل جديد' : 'New'}
              </button>
              <button onClick={duplicateTcoAnalysis} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 shrink-0">
                {isAr ? 'نسخ' : 'Duplicate'}
              </button>
              {tcoState.analyses.length > 1 && (
                <button onClick={() => deleteTcoAnalysis(tcoActiveAnalysis.id)} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />{isAr ? 'حذف' : 'Delete'}
                </button>
              )}
            </div>

            {/* Item / Industry / Sub-sector / Category context -- drives the grounded checklist below via Category only */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'اسم العنصر' : 'Item name'}</label>
                <input value={tcoActiveAnalysis.itemName} onChange={e => updateActiveAnalysis({ itemName: e.target.value })}
                  placeholder={isAr ? 'مثال: محمل كروي 6205' : 'e.g. Bearing 6205-ZZ'}
                  aria-label={isAr ? 'اسم العنصر' : 'Item name'}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'الصناعة' : 'Industry'}</label>
                <select value={tcoActiveAnalysis.industry} aria-label={isAr ? 'الصناعة' : 'Industry'}
                  onChange={e => updateActiveAnalysis({ industry: e.target.value as IndustryKey | '', subSector: '' })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                  <option value="">{isAr ? '— غير محدد —' : '— Not specified —'}</option>
                  {INDUSTRIES.map(ind => <option key={ind.id} value={ind.id}>{isAr ? ind.labelAr : ind.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'القطاع الفرعي' : 'Sub-sector'}</label>
                <select value={tcoActiveAnalysis.subSector} onChange={e => updateActiveAnalysis({ subSector: e.target.value })}
                  aria-label={isAr ? 'القطاع الفرعي' : 'Sub-sector'}
                  disabled={!tcoActiveAnalysis.industry}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 disabled:opacity-50 disabled:bg-slate-100">
                  <option value="">{isAr ? '— عام —' : '— General —'}</option>
                  {tcoSubSectorOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'الفئة (نوع الصنف)' : 'Category (item type)'}</label>
                <select value={tcoActiveAnalysis.skuClass} onChange={e => updateActiveAnalysis({ skuClass: e.target.value as SkuClassKey | '' })}
                  aria-label={isAr ? 'الفئة (نوع الصنف)' : 'Category (item type)'}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold">
                  <option value="">{isAr ? '— اختر لعرض الإرشادات —' : '— Select to see guidance —'}</option>
                  {SKU_CLASSES.map(sc => <option key={sc.id} value={sc.id}>{isAr ? sc.labelAr : sc.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Grounded, category-specific hidden-cost checklist */}
          {tcoChecklist ? (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {isAr ? `ما يهم عادةً لفئة "${SKU_CLASSES.find(s => s.id === tcoActiveAnalysis.skuClass)?.labelAr}"` : `What typically matters for "${SKU_CLASSES.find(s => s.id === tcoActiveAnalysis.skuClass)?.label}"`}
              </p>
              {TCO_STAGES.map(stage => {
                const items = tcoChecklist!.filter(c => c.stage === stage.id);
                if (items.length === 0) return null;
                return (
                  <div key={stage.id} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-24 shrink-0 pt-0.5">{isAr ? stage.labelAr : stage.label}</span>
                    <ul className="space-y-1.5 flex-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-[11px] text-slate-600 leading-snug">
                          {isAr ? item.textAr : item.text}
                          {item.sourceUrl && (
                            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[10px] text-[#082C6B] underline whitespace-nowrap">
                              [{isAr ? 'مصدر' : 'source'}]
                            </a>
                          )}
                          {item.confidence === 'principle' && (
                            <span className="ml-1 text-[9px] text-slate-400 italic">({isAr ? 'مبدأ عام' : 'general principle'})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3">
              <p className="text-[11px] text-slate-400">
                {isAr ? 'اختر "الفئة" أعلاه لعرض قائمة تحقق موثّقة وخاصة بهذه الفئة حول التكاليف الخفية الأكثر أهمية.' : 'Select a Category above to see a sourced, category-specific checklist of which hidden costs are typically most material.'}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'عنصر التكلفة' : 'Cost element'}</th>
                  {tcoSuppliers.map(s => (
                    <th key={s.id} className="text-left py-2 px-2 min-w-[150px]">
                      <div className="flex items-center gap-1">
                        <input value={s.name} onChange={e => updateTcoSupplier(s.id, { name: e.target.value })}
                          className="w-full font-bold text-slate-800 border border-slate-200 rounded-lg px-1.5 py-1 text-xs" />
                        {tcoSuppliers.length > 1 && (
                          <button onClick={() => removeTcoSupplier(s.id)} aria-label={isAr ? 'إزالة المورّد' : 'Remove supplier'}
                            className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TCO_STAGES.map(stage => (
                  <React.Fragment key={stage.id}>
                    <tr className="bg-slate-50">
                      <td colSpan={1 + tcoSuppliers.length} className="py-1 pr-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {isAr ? stage.labelAr : stage.label} <span className="font-normal normal-case text-slate-400">-- {isAr ? stage.shortAr : stage.short}</span>
                      </td>
                    </tr>
                    {TCO_FIELDS.filter(f => f.stage === stage.id).map(f => (
                      <tr key={f.key} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2 text-slate-500 whitespace-nowrap">{isAr ? f.labelAr : f.label}</td>
                        {tcoSuppliers.map(s => (
                          <td key={s.id} className="py-1.5 px-2 relative">
                            {/* Print-safe number cell (#167) -- same fix as
                                Supplier Alert Config: input hidden, mirrored
                                span revealed, only inside the print zone. */}
                            <input type="number" min={0} value={s[f.key] || ''}
                              onChange={e => updateTcoSupplier(s.id, { [f.key]: parseFloat(e.target.value) || 0 } as Partial<TcoSupplier>)}
                              className="tco-print-input w-full border border-slate-200 rounded-lg px-1.5 py-1 text-xs" />
                            <span className="tco-print-val absolute inset-0 items-center px-1.5 text-xs" aria-hidden="true">
                              {s[f.key] || 0}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300">
                  <td className="py-2 pr-2 font-bold text-slate-700">{isAr ? 'إجمالي TCO السنوي' : 'Total TCO (annual)'}</td>
                  {tcoResults.map(r => (
                    <td key={r.id} className="py-2 px-2 font-bold text-slate-800">SAR {r.tcoAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 font-semibold text-slate-600">{isAr ? 'TCO لكل وحدة' : 'TCO per unit'}</td>
                  {tcoResults.map(r => (
                    <td key={r.id} className={`py-1.5 px-2 font-semibold ${r.id === tcoLowestId && tcoValidResults.length > 1 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      SAR {r.tcoPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      {r.id === tcoLowestId && tcoValidResults.length > 1 && (
                        <span className="ml-1 text-[10px] font-bold">{isAr ? '(الأقل)' : '(lowest)'}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 text-slate-400">{isAr ? 'مقابل الأقل (%)' : 'vs. lowest (%)'}</td>
                  {tcoResults.map(r => {
                    const pctVsLowest = tcoLowestPerUnit > 0 && r.tcoPerUnit > 0 ? ((r.tcoPerUnit - tcoLowestPerUnit) / tcoLowestPerUnit) * 100 : 0;
                    return (
                      <td key={r.id} className="py-1.5 px-2 text-slate-400">
                        {r.tcoPerUnit > 0 ? (r.id === tcoLowestId ? (isAr ? 'الأساس' : 'base') : `+${pctVsLowest.toFixed(1)}%`) : '—'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 text-slate-400 italic">{isAr ? 'تكلفة الخروج لمرة واحدة (خارج TCO السنوي)' : 'One-time exit cost (not in annual TCO)'}</td>
                  {tcoResults.map(r => (
                    <td key={r.id} className="py-1.5 px-2 text-slate-400 italic">
                      {r.contractExitOneTime > 0 ? `SAR ${r.contractExitOneTime.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 print-hide">
            <div className="flex items-center gap-3">
              <button onClick={addTcoSupplier} disabled={tcoSuppliers.length >= 5}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#082C6B] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مورّد' : 'Add supplier'}
              </button>
              <button onClick={exportTcoAnalysis}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
                <Download className="w-3.5 h-3.5" />{isAr ? 'تصدير هذا التحليل (CSV)' : 'Export this analysis (CSV)'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {user
                ? (tcoSyncStatus === 'saving' ? (isAr ? 'جارٍ المزامنة مع الخادم…' : 'Syncing to server…')
                  : tcoSyncStatus === 'saved' ? (isAr ? 'تمت المزامنة مع الخادم ✓' : 'Synced to server ✓')
                  : tcoSyncStatus === 'error' ? (isAr ? 'تعذّرت المزامنة — تم الحفظ محلياً' : 'Sync failed — saved locally')
                  : (isAr ? 'محفوظ في حسابك' : 'Saved to your account'))
                : (isAr ? 'يُحفَظ تلقائياً في هذا المتصفح (سجّل الدخول للحفظ في حسابك)' : 'Auto-saved in this browser (sign in to save to your account)')}
            </p>
          </div>

          {/* ── Weighted Decision Scoring, "beyond raw cost" (#164) ── */}
          {tcoSuppliers.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  {isAr ? 'التقييم المرجّح -- إلى ما هو أبعد من التكلفة' : 'Weighted decision score -- beyond raw cost'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'قيّم كل مورّد يدوياً (١-٥) على الجودة والتسليم ومخاطر الاعتماد على مصدر واحد والملاءمة الاستراتيجية. هذه تقديرات إدارية منك أنت -- لا تُشتق من أي معيار. اضبط الأوزان لرؤية كيف تتغير النتيجة.'
                    : 'Rate each supplier yourself (1-5) on quality, delivery, single-source risk, and strategic fit. These are your own judgement calls -- not derived from any benchmark. Adjust the weights to see how the ranking shifts.'}
                </p>
              </div>

              {/* ── Supplier Scorecard cross-link (#165) -- real match against
                  the user's own saved Supplier Scorecard roster, never
                  auto-applied. Decision Record 8.7's "stand by a click"
                  applies literally: a click is required to pull the rating in. ── */}
              {tcoScorecardMatches.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 print-hide">
                  <p className="text-[10px] font-semibold text-slate-500">
                    {isAr ? 'تطابق مع بطاقة أداء المورّد المحفوظة لديك:' : 'Matched against your saved Supplier Scorecard:'}
                  </p>
                  {tcoScorecardMatches.map(m => {
                    const supplierName = tcoSuppliers.find(s => s.id === m.supplierId)?.name || m.scorecardName;
                    return (
                      <div key={m.supplierId} className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                        <span className="text-slate-600">
                          <span className="font-semibold">{supplierName}</span>
                          {': '}
                          {m.weighted !== null
                            ? (isAr ? `تقييم البطاقة ${m.weighted}/100` : `Scorecard rating ${m.weighted}/100`)
                            : (isAr ? 'بيانات البطاقة غير مكتملة' : 'scorecard data incomplete')}
                        </span>
                        <div className="flex items-center gap-2">
                          {(m.qualityDim !== null || m.deliveryDim !== null) && (
                            <button onClick={() => applyScorecardRating(m.supplierId, m.qualityDim, m.deliveryDim)}
                              className="text-[10px] font-semibold text-[#082C6B] hover:opacity-80">
                              {isAr ? 'تطبيق التقييم →' : 'Apply rating →'}
                            </button>
                          )}
                          <a href="/solutions/supplier-relationship-governance" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-slate-400 hover:text-slate-600">
                            {isAr ? 'فتح بطاقة الأداء ↗' : 'Open Scorecard ↗'}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 print-hide">
                {([
                  ['cost', isAr ? 'التكلفة' : 'Cost'],
                  ['quality', isAr ? 'الجودة' : 'Quality'],
                  ['delivery', isAr ? 'التسليم' : 'Delivery'],
                  ['risk', isAr ? 'مخاطر المصدر الواحد' : 'Single-source risk'],
                  ['strategicFit', isAr ? 'الملاءمة الاستراتيجية' : 'Strategic fit'],
                ] as [keyof typeof tcoWeights, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] text-slate-400 block mb-0.5">{label} %</label>
                    <input type="number" min={0} max={100} value={tcoWeights[key]}
                      aria-label={`${label} %`}
                      onChange={e => setTcoWeights({ ...tcoWeights, [key]: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                  </div>
                ))}
              </div>
              {tcoWeightsTotal !== 100 && (
                <p className="text-[10px] text-slate-400">
                  {isAr ? `مجموع الأوزان ${tcoWeightsTotal}% -- يُطبَّع تلقائياً عند الحساب.` : `Weights sum to ${tcoWeightsTotal}% -- automatically normalized when scoring.`}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'المورّد' : 'Supplier'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الجودة' : 'Quality'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'التسليم' : 'Delivery'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'مخاطر المصدر الواحد' : 'Single-source risk'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الملاءمة الاستراتيجية' : 'Strategic fit'}</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'النتيجة المرجّحة' : 'Weighted score'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tcoSuppliers.map(s => {
                      const score = tcoDecisionScores.find(d => d.id === s.id);
                      return (
                        <tr key={s.id} className={`border-b border-slate-100 ${s.id === tcoDecisionTopId && tcoDecisionScores.length > 1 ? 'bg-emerald-50/50' : ''}`}>
                          <td className="py-1.5 pr-2 font-semibold text-slate-700 whitespace-nowrap">{s.name}</td>
                          {(['qualQuality', 'qualDelivery', 'qualRisk', 'qualStrategicFit'] as const).map(field => (
                            <td key={field} className="py-1.5 px-2">
                              <select value={s[field] ?? 3} aria-label={`${s.name} ${field}`}
                                onChange={e => updateTcoSupplier(s.id, { [field]: parseInt(e.target.value, 10) } as Partial<TcoSupplier>)}
                                className="text-xs border border-slate-200 rounded-lg px-1.5 py-1">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </td>
                          ))}
                          <td className="py-1.5 px-2 font-bold text-slate-800">
                            {score ? score.weighted.toFixed(0) : '0'}/100
                            {s.id === tcoDecisionTopId && tcoDecisionScores.length > 1 && (
                              <span className="ml-1 text-[10px] font-bold text-emerald-600">{isAr ? '(الأعلى)' : '(top)'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {tcoDecisionRankFlip && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800">
                    {isAr
                      ? 'ملاحظة: المورّد الأعلى في النتيجة المرجّحة ليس هو صاحب أقل TCO -- التقييمات النوعية غيّرت الترتيب.'
                      : 'Note: the top-scoring supplier once quality/delivery/risk/strategic fit are weighted in is NOT the lowest-TCO supplier -- the qualitative ratings changed the ranking.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Sensitivity analysis (#164) -- recomputes the SAME arithmetic
              above with one input varied by the chosen swing %, ranked by
              impact. No new numbers are invented; every value is a recompute
              of the user's own entered figures. ── */}
          {tcoSuppliers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  {isAr ? 'تحليل الحساسية' : 'Sensitivity analysis'}
                </p>
                <div className="flex items-center gap-2 print-hide">
                  <select value={tcoSensitivitySupplier?.id || ''} aria-label={isAr ? 'المورّد' : 'Supplier'}
                    onChange={e => setTcoSensitivitySupplierId(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700">
                    {tcoSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={tcoSensitivitySwingPct} aria-label={isAr ? 'نسبة التغيير' : 'Swing %'}
                    onChange={e => setTcoSensitivitySwingPct(parseInt(e.target.value, 10))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700">
                    {[5, 10, 20, 30].map(p => <option key={p} value={p}>±{p}%</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                {isAr
                  ? `أي مما يلي يغيّر TCO لكل وحدة لمورّد "${tcoSensitivitySupplier?.name || ''}" أكثر إذا كان الرقم المُدخل خاطئاً بنسبة ±${tcoSensitivitySwingPct}%؟`
                  : `Which of these moves TCO/unit for "${tcoSensitivitySupplier?.name || ''}" the most if that entered number is off by ±${tcoSensitivitySwingPct}%?`}
              </p>
              {tcoSensitivityRows.length > 0 ? (
                <div className="space-y-2">
                  {tcoSensitivityRows.map(r => (
                    <div key={r.key} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">{isAr ? r.labelAr : r.label}</span>
                        <span className="text-slate-500">SAR {r.low.toLocaleString(undefined, { maximumFractionDigits: 2 })} &ndash; SAR {r.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#082C6B] rounded-full" style={{ width: `${Math.max(4, (r.swingAbs / tcoSensitivityMaxSwing) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  {isAr ? 'أدخل بيانات التكلفة لهذا المورّد لرؤية تحليل الحساسية.' : 'Enter cost data for this supplier to see the sensitivity read.'}
                </p>
              )}
            </div>
          )}

          {/* ── Trend history (#168/#169 TCO reporting) -- real monthly
              snapshots of this analysis's best TCO/unit, captured
              automatically as the client keeps this analysis updated across
              months. Server-backed, so it does not appear in the #167 PDF
              export (interactive, sign-in-gated, same treatment as the AI
              Insight panel below). ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 print-hide">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {isAr ? 'اتجاه التكلفة الإجمالية للملكية' : 'TCO trend history'}
              </p>
              {tcoTrendLoading && <span className="text-[10px] text-slate-400">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</span>}
            </div>
            {!user ? (
              <p className="text-[11px] text-slate-400 italic">
                {isAr
                  ? 'سجّل الدخول لتتبّع أفضل تكلفة إجمالية للملكية لهذا التحليل شهرياً بمرور الوقت.'
                  : 'Sign in to track this analysis\'s best TCO/unit month over month.'}
              </p>
            ) : tcoTrend.length < 2 ? (
              <p className="text-[11px] text-slate-400 italic">
                {isAr
                  ? 'يُبنى الاتجاه تلقائياً كلما عدت إلى هذا التحليل عبر أشهر مختلفة ولديه بيانات تسعير صالحة. عودة الشهر القادم ستضيف نقطة ثانية.'
                  : 'The trend builds automatically as you keep returning to this priced analysis across different months. Come back next month for a second data point.'}
              </p>
            ) : (
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <LineChart data={tcoTrend.map(s => ({ month: s.month, bestTcoPerUnit: parseFloat(s.bestTcoPerUnit), bestSupplierName: s.bestSupplierName }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={56} tickFormatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                    <Tooltip
                      formatter={(value: number, _name: string, item: { payload?: { bestSupplierName?: string | null } }) =>
                        [`SAR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${item?.payload?.bestSupplierName ? ` — ${item.payload.bestSupplierName}` : ''}`, isAr ? 'أفضل تكلفة/وحدة' : 'Best TCO/unit']}
                    />
                    <Line type="monotone" dataKey="bestTcoPerUnit" stroke="#082C6B" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── AI Executive Insight for this TCO analysis (#164) -- interactive
              generate/sign-in UI has no place in a printed report; hidden from
              the #167 PDF export. ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 print-hide">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
              {isAr ? 'رؤية تنفيذية مدعومة بالذكاء الاصطناعي' : 'AI Executive Insight'}
            </p>
            <AIPlanPanel
              loading={tcoAiPlan.loading} result={tcoAiPlan.result} evidenceSummary={tcoAiPlan.evidenceSummary} error={tcoAiPlan.error}
              onGenerate={tcoAiPlan.generate} onReset={tcoAiPlan.reset}
              savedPlan={tcoAiPlan.savedPlan} onViewSaved={tcoAiPlan.viewSaved} onDeleteSaved={tcoAiPlan.deleteSaved}
              rateLimited={tcoAiPlan.rateLimited}
              retryAfterSeconds={tcoAiPlan.retryAfterSeconds}
              saveError={tcoAiPlan.saveError}
              onDismissSaveError={tcoAiPlan.dismissSaveError}
              buttonLabel={isAr ? 'توليد رؤية TCO التنفيذية ✨' : 'Generate TCO Executive Insight ✨'}
              isAr={isAr} toolKey="procurement-tco"
              disabled={tcoValidResults.length < 2}
            />
          </div>

          {/* Honesty/self-critique note (Decision Record 8.6): the lowest-TCO tag is a
              real, correct arithmetic result -- but TCO alone does not capture single-source
              risk, quality/relationship history, or strategic fit. Named explicitly rather
              than left implied, so the number isn't mistaken for the whole decision. */}
          {tcoValidResults.length > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800">
                {isAr
                  ? 'أقل تكلفة إجمالية للملكية ليست بالضرورة الاختيار الأنسب: هذا الرقم لا يعكس مخاطر الاعتماد على مصدر واحد، أو سجل الجودة والعلاقة مع المورّد، أو الملاءمة الاستراتيجية. استخدمه كمدخل رقمي إلى جانب استراتيجية التوريد (علامة تبويب "استراتيجية التوريد" أعلاه)، لا بديلاً عنها.'
                  : 'The lowest TCO per unit is not automatically the right choice: this number does not capture single-source dependency risk, a supplier’s quality/relationship track record, or strategic fit. Use it alongside the Sourcing Strategy tab above, not as a replacement for it.'}
              </p>
            </div>
          )}
          </div>
          )}

          {/* Sources panel -- every grounded (non-"general principle") checklist claim above traces to one of these */}
          <details className="text-[10px] text-slate-400">
            <summary className="cursor-pointer font-semibold text-slate-500">{isAr ? 'المصادر والمنهجية' : 'Sources & methodology'}</summary>
            <ul className="mt-1.5 space-y-1 pl-3 list-disc">
              {TCO_SOURCES.map(src => (
                <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">{src.label}</a></li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* ── TAB: Working Capital Control Tower (#169, Wave B-3) ── */}
      {activeTab === 'workingcapital' && (
        <div id="panel-workingcapital" role="tabpanel" aria-labelledby="tab-workingcapital" className="print-zone-workingcapital space-y-4">
          <div className="flex justify-end print-hide">
            <button onClick={() => printZone('workingcapital')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#082C6B] text-white px-3 py-1.5 rounded-xl hover:bg-[#082C6B]/90 transition-colors">
              <FileDown className="w-3.5 h-3.5" />{isAr ? 'تصدير PDF' : 'Export PDF'}
            </button>
          </div>

          <div className="wc-print-header hidden pb-3 border-b border-slate-200 mb-2">
            <h2 className="text-base font-bold text-slate-800">{isAr ? 'تقرير برج التحكم برأس المال العامل' : 'Working Capital Control Tower Report'}</h2>
            <p className="text-xs text-slate-600 mt-1">{wcActive.name}</p>
            <p className="text-[10px] text-slate-300 mt-1">{isAr ? 'تاريخ الإنشاء: ' : 'Generated: '}{new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {isAr
                ? 'دورة التحويل النقدي (CCC) هي المقياس القياسي في إدارة الخزينة لعدد الأيام التي يبقى فيها رأس المال العامل مجمّداً بين دفع الموردين وتحصيل العملاء. CCC = أيام المخزون (DIO) + أيام تحصيل الذمم (DSO) − أيام سداد الموردين (DPO). كل رقم أدناه من إدخالك أنت -- لا شيء هنا مقدَّر أو مفترض.'
                : 'The Cash Conversion Cycle (CCC) is the standard treasury-management measure of how many days working capital stays tied up between paying suppliers and collecting from customers. CCC = Days Inventory Outstanding (DIO) + Days Sales Outstanding (DSO) − Days Payables Outstanding (DPO). Every number below is your own input -- nothing here is estimated or assumed.'}
            </p>
          </div>

          {/* Scenario switcher -- multiple named, saved scenarios, mirrors the TCO Engine's analysis switcher */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 print-hide">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 shrink-0">{isAr ? 'السيناريو:' : 'Scenario:'}</label>
              <select value={wcActive.id} onChange={e => switchWcAnalysis(e.target.value)} aria-label={isAr ? 'السيناريو:' : 'Scenario:'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700 min-w-[160px]">
                {wcState.analyses.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input value={wcActive.name} onChange={e => updateWcActive({ name: e.target.value })}
                aria-label={isAr ? 'اسم السيناريو' : 'Scenario name'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-[140px]" />
              <button onClick={addWcAnalysis} className="flex items-center gap-1 text-[11px] font-semibold text-[#082C6B] hover:opacity-80 shrink-0">
                <Plus className="w-3.5 h-3.5" />{isAr ? 'سيناريو جديد' : 'New'}
              </button>
              <button onClick={duplicateWcAnalysis} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 shrink-0">
                {isAr ? 'نسخ' : 'Duplicate'}
              </button>
              {wcState.analyses.length > 1 && (
                <button onClick={() => deleteWcAnalysis(wcActive.id)} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />{isAr ? 'حذف' : 'Delete'}
                </button>
              )}
              {user && (
                <span className="text-[10px] font-semibold text-slate-400 ml-auto shrink-0">
                  {wcSyncStatus === 'saving' && (isAr ? 'جارٍ الحفظ…' : 'Saving…')}
                  {wcSyncStatus === 'saved' && (isAr ? 'تم الحفظ ✓' : 'Saved ✓')}
                  {wcSyncStatus === 'error' && (isAr ? 'فشل الحفظ' : 'Save failed')}
                </span>
              )}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h3 className="text-xs font-bold text-slate-700 mb-2">{isAr ? 'المدخلات' : 'Inputs'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'قيمة المخزون (ر.س)' : 'Inventory value (SAR)'}</label>
                <input type="number" min={0} value={wcActive.inventoryValue || ''}
                  onChange={e => updateWcActive({ inventoryValue: parseFloat(e.target.value) || 0 })}
                  aria-label={isAr ? 'قيمة المخزون' : 'Inventory value'}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'أيام المخزون (DIO)' : 'DIO (days)'}</label>
                <input type="number" min={0} value={wcActive.dioDays || ''}
                  onChange={e => updateWcActive({ dioDays: parseFloat(e.target.value) || 0 })}
                  aria-label="DIO"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'أيام تحصيل الذمم (DSO)' : 'DSO (days)'}</label>
                <input type="number" min={0} value={wcActive.dsoDays || ''}
                  onChange={e => updateWcActive({ dsoDays: parseFloat(e.target.value) || 0 })}
                  aria-label="DSO"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'أيام سداد الموردين (DPO)' : 'DPO (days)'}</label>
                <input type="number" min={0} value={wcActive.dpoDays || ''}
                  onChange={e => updateWcActive({ dpoDays: parseFloat(e.target.value) || 0 })}
                  aria-label="DPO"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'تكلفة البضاعة المباعة السنوية (ر.س)' : 'Annual COGS (SAR)'}</label>
                <input type="number" min={0} value={wcActive.annualCogs || ''}
                  onChange={e => updateWcActive({ annualCogs: parseFloat(e.target.value) || 0 })}
                  aria-label={isAr ? 'تكلفة البضاعة المباعة السنوية' : 'Annual COGS'}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
            </div>
          </div>

          {/* CCC breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h3 className="text-xs font-bold text-slate-700 mb-2">{isAr ? 'دورة التحويل النقدي (CCC)' : 'Cash Conversion Cycle (CCC)'}</h3>
            <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
              <span className="bg-slate-100 rounded-lg px-2 py-1">{isAr ? 'DIO' : 'DIO'} {wcActive.dioDays}</span>
              <span className="text-slate-300">+</span>
              <span className="bg-slate-100 rounded-lg px-2 py-1">{isAr ? 'DSO' : 'DSO'} {wcActive.dsoDays}</span>
              <span className="text-slate-300">−</span>
              <span className="bg-slate-100 rounded-lg px-2 py-1">{isAr ? 'DPO' : 'DPO'} {wcActive.dpoDays}</span>
              <span className="text-slate-300">=</span>
              <span className={`rounded-lg px-2.5 py-1 text-white ${wcCcc <= 0 ? 'bg-emerald-600' : wcCcc <= 45 ? 'bg-amber-500' : 'bg-red-600'}`}>
                {isAr ? 'CCC' : 'CCC'} {wcCcc.toFixed(1)} {isAr ? 'يوماً' : 'days'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {isAr
                ? `أثر دورة التحويل النقدي بالريال = CCC × (تكلفة البضاعة المباعة السنوية ÷ 365) = ${wcCcc.toFixed(1)} × (${wcActive.annualCogs.toLocaleString()} ÷ 365) = ر.س ${Math.round(wcCccDollarImpact).toLocaleString()}`
                : `CCC dollar impact = CCC × (Annual COGS ÷ 365) = ${wcCcc.toFixed(1)} × (${wcActive.annualCogs.toLocaleString()} ÷ 365) = SAR ${Math.round(wcCccDollarImpact).toLocaleString()}`}
            </p>
          </div>

          {/* Three non-additive cash levers */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-slate-700">{isAr ? 'ثلاث روافع نقدية (تُعرض منفصلة عمداً)' : 'Three cash levers (shown separately, on purpose)'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">{isAr ? '1. قيمة المخزون' : '1. Inventory value'}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">SAR {wcActive.inventoryValue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'قيمة دفترية، رأس مال محتجز في المخزون الآن' : 'Balance-sheet stock -- capital sitting in inventory right now'}</p>
              </div>
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">{isAr ? '2. أثر دورة التحويل النقدي' : '2. CCC dollar impact'}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">SAR {Math.round(wcCccDollarImpact).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'نقد يمكن تحريره سنوياً بتقصير الدورة يوماً واحداً في كل اتجاه' : 'Cash-days figure -- what tightening the cycle by one day, each lever, could free annually'}</p>
              </div>
              <div className="border border-red-200 bg-red-50/50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">{isAr ? '3. التعرض لمخاطر الإيراد (RAR)' : '3. Revenue-at-Risk exposure'}</p>
                {wcRar.hasRun ? (
                  <>
                    <p className="text-lg font-bold text-slate-800 mt-1">SAR {Math.round(wcRar.dollarAtMedian).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr ? `عند اضطراب نموذجي؛ حتى ر.س ${Math.round(wcRar.dollarAtP95).toLocaleString()} عند اضطراب شديد -- من أداة المرونة` : `at a typical disruption; up to SAR ${Math.round(wcRar.dollarAtP95).toLocaleString()} at a severe one -- from the Resiliency toolkit`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-300 mt-1">{isAr ? 'لم يُشغَّل بعد' : 'Not yet run'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr ? 'شغّل حاسبة التعرض لمخاطر الإيراد (RAR) في أداة المرونة لعرض هذا الرقم الحقيقي هنا.' : 'Run the Revenue-at-Risk (RAR) calculator in the Resiliency toolkit to surface this real figure here.'}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mt-3 print-hide">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800">
                {isAr
                  ? 'لا تُجمَع هذه الأرقام الثلاثة في رقم واحد: قيمة المخزون رصيد دفتري، وأثر دورة التحويل النقدي مقياس زمني-نقدي سنوي، والتعرض لمخاطر الإيراد احتمالي وليس مضموناً. جمعها يُنتج رقماً مضللاً لا معنى مالياً حقيقياً له.'
                  : 'These three figures are never added together: inventory value is a balance-sheet stock, the CCC dollar impact is an annual cash-timing figure, and RAR exposure is a probabilistic (not guaranteed) revenue figure. Summing them would produce a misleading number with no real financial meaning.'}
              </p>
            </div>
          </div>

          {/* Visual comparison -- explicitly a side-by-side comparison, not a stacked/summed total */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 print-hide">
            <h3 className="text-xs font-bold text-slate-700 mb-2">{isAr ? 'مقارنة جنباً إلى جنب (غير مجمّعة)' : 'Side-by-side comparison (not stacked)'}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={wcLeverChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => [`SAR ${v.toLocaleString()}`, '']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {wcLeverChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Export + AI Insight */}
          <div className="flex justify-end print-hide">
            <button onClick={exportWcAnalysis}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <Download className="w-3.5 h-3.5" />{isAr ? 'تصدير (CSV)' : 'Export (CSV)'}
            </button>
          </div>

          <div className="print-hide">
            <AIPlanPanel
              loading={wcAiPlan.loading} result={wcAiPlan.result} evidenceSummary={wcAiPlan.evidenceSummary} error={wcAiPlan.error}
              onGenerate={wcAiPlan.generate} onReset={wcAiPlan.reset}
              savedPlan={wcAiPlan.savedPlan} onViewSaved={wcAiPlan.viewSaved} onDeleteSaved={wcAiPlan.deleteSaved}
              rateLimited={wcAiPlan.rateLimited}
              retryAfterSeconds={wcAiPlan.retryAfterSeconds}
              saveError={wcAiPlan.saveError}
              onDismissSaveError={wcAiPlan.dismissSaveError}
              buttonLabel={isAr ? 'توليد رؤية رأس المال العامل التنفيذية ✨' : 'Generate Working Capital Executive Insight ✨'}
              isAr={isAr} toolKey="procurement-workingcapital"
              disabled={!wcHasData}
            />
          </div>

          {/* Sources -- real, verified citations for the CCC methodology (Decision Record 8.7: no invented URLs) */}
          <details className="text-[10px] text-slate-400 print-hide">
            <summary className="cursor-pointer font-semibold text-slate-500">{isAr ? 'المصادر والمنهجية' : 'Sources & methodology'}</summary>
            <ul className="mt-1.5 space-y-1 pl-3 list-disc">
              {WC_SOURCES.map(src => (
                <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">{src.label}</a></li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* ── TAB: Opportunity / Spend Variance Finder (#170, Wave B-3) ── */}
      {activeTab === 'spendvariance' && (
        <div id="panel-spendvariance" role="tabpanel" aria-labelledby="tab-spendvariance" className="print-zone-spendvariance space-y-4">
          <div className="flex justify-end print-hide">
            <button onClick={() => printZone('spendvariance')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#082C6B] text-white px-3 py-1.5 rounded-xl hover:bg-[#082C6B]/90 transition-colors">
              <FileDown className="w-3.5 h-3.5" />{isAr ? 'تصدير PDF' : 'Export PDF'}
            </button>
          </div>

          <div className="sv-print-header hidden pb-3 border-b border-slate-200 mb-2">
            <h2 className="text-base font-bold text-slate-800">{isAr ? 'تقرير فرصة تباين الإنفاق' : 'Spend Variance Opportunity Report'}</h2>
            <p className="text-xs text-slate-600 mt-1">{svActive.name}{svActive.itemSpec ? ` -- ${svActive.itemSpec}` : ''}</p>
            <p className="text-[10px] text-slate-300 mt-1">{isAr ? 'تاريخ الإنشاء: ' : 'Generated: '}{new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {isAr
                ? 'يقارن تباين سعر الشراء (PPV) للصنف نفسه بمواصفة واحدة عبر موقعين أو أكثر / موردين، بعد تسوية السعر إلى تكلفة مسلَّمة (سعر الوحدة + الشحن + تعديل الجودة). الموقع الأقل تكلفة مسلَّمة يصبح المرجع، والفرصة القابلة للتحصيل هي الفارق × الكمية السنوية عند كل موقع أعلى من المرجع. كل رقم أدناه من إدخالك أنت.'
                : 'Compares Purchase Price Variance (PPV) for the same-spec item across two or more sites/suppliers, after normalizing to a landed-cost basis (unit price + freight + quality adjustment). The lowest-landed-cost site becomes the benchmark; the addressable opportunity is the gap × the annual quantity currently bought at each above-benchmark site. Every number below is your own input.'}
            </p>
          </div>

          {/* Scenario switcher -- multiple named, saved comparisons */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 print-hide">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 shrink-0">{isAr ? 'المقارنة:' : 'Comparison:'}</label>
              <select value={svActive.id} onChange={e => switchSvAnalysis(e.target.value)} aria-label={isAr ? 'المقارنة:' : 'Comparison:'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700 min-w-[160px]">
                {svState.analyses.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input value={svActive.name} onChange={e => updateSvActive({ name: e.target.value })}
                aria-label={isAr ? 'اسم المقارنة' : 'Comparison name'}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-[140px]" />
              <button onClick={addSvAnalysis} className="flex items-center gap-1 text-[11px] font-semibold text-[#082C6B] hover:opacity-80 shrink-0">
                <Plus className="w-3.5 h-3.5" />{isAr ? 'مقارنة جديدة' : 'New'}
              </button>
              <button onClick={duplicateSvAnalysis} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 shrink-0">
                {isAr ? 'نسخ' : 'Duplicate'}
              </button>
              {svState.analyses.length > 1 && (
                <button onClick={() => deleteSvAnalysis(svActive.id)} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />{isAr ? 'حذف' : 'Delete'}
                </button>
              )}
              {user && (
                <span className="text-[10px] font-semibold text-slate-400 ml-auto shrink-0">
                  {svSyncStatus === 'saving' && (isAr ? 'جارٍ الحفظ…' : 'Saving…')}
                  {svSyncStatus === 'saved' && (isAr ? 'تم الحفظ ✓' : 'Saved ✓')}
                  {svSyncStatus === 'error' && (isAr ? 'فشل الحفظ' : 'Save failed')}
                </span>
              )}
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'مواصفة الصنف' : 'Item specification'}</label>
              <input value={svActive.itemSpec} onChange={e => updateSvActive({ itemSpec: e.target.value })}
                placeholder={isAr ? 'مثال: محمل كروي 6205، فولاذ كروم، مانع تسرب' : 'e.g. Bearing 6205-ZZ, chrome steel, sealed'}
                aria-label={isAr ? 'مواصفة الصنف' : 'Item specification'}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
            </div>
            {/* Cross-engine import (#178) -- real, click-to-apply pull from the
                user's own saved TCO Engine supplier prices, never auto-filled. */}
            {svImportableTcoAnalyses.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
                <label className="text-[10px] font-semibold text-slate-500 shrink-0">
                  {isAr ? 'أو استورد من محرك TCO:' : 'Or import from TCO Engine:'}
                </label>
                <select defaultValue="" onChange={e => { if (e.target.value) { importSvFromTco(e.target.value); e.target.value = ''; } }}
                  aria-label={isAr ? 'استيراد من محرك TCO' : 'Import from TCO Engine'}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-700">
                  <option value="" disabled>{isAr ? '— اختر تحليل TCO —' : '— Choose a TCO analysis —'}</option>
                  {svImportableTcoAnalyses.map(a => <option key={a.id} value={a.id}>{a.name}{a.itemName ? ` -- ${a.itemName}` : ''}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Sites/suppliers input table */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto">
            <div className="flex items-center justify-between mb-2 print-hide">
              <h3 className="text-xs font-bold text-slate-700">{isAr ? 'المواقع / الموردون' : 'Sites / Suppliers'}</h3>
              {svRows.length < 6 && (
                <button onClick={addSvRow} className="flex items-center gap-1 text-[11px] font-semibold text-[#082C6B] hover:opacity-80">
                  <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة موقع' : 'Add site'}
                </button>
              )}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الموقع/المورّد' : 'Site/Supplier'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'سعر الوحدة' : 'Unit price'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الشحن/وحدة' : 'Freight/unit'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'تعديل الجودة/وحدة' : 'Quality adj/unit'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الكمية السنوية' : 'Annual qty'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الحد الأدنى للطلب' : 'MOQ'}</th>
                  <th className="py-2 px-2 print-hide"></th>
                </tr>
              </thead>
              <tbody>
                {svRows.map(r => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-1.5 pr-2">
                      <input value={r.siteName} onChange={e => updateSvRow(r.id, { siteName: e.target.value })}
                        aria-label={isAr ? 'الموقع/المورّد' : 'Site/Supplier'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={r.unitPrice || ''} onChange={e => updateSvRow(r.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        aria-label={isAr ? 'سعر الوحدة' : 'Unit price'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={r.freightPerUnit || ''} onChange={e => updateSvRow(r.id, { freightPerUnit: parseFloat(e.target.value) || 0 })}
                        aria-label={isAr ? 'الشحن لكل وحدة' : 'Freight per unit'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={r.qualityAdjPerUnit || ''} onChange={e => updateSvRow(r.id, { qualityAdjPerUnit: parseFloat(e.target.value) || 0 })}
                        aria-label={isAr ? 'تعديل الجودة لكل وحدة' : 'Quality adjustment per unit'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={r.annualQty || ''} onChange={e => updateSvRow(r.id, { annualQty: parseFloat(e.target.value) || 0 })}
                        aria-label={isAr ? 'الكمية السنوية' : 'Annual quantity'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" min={0} value={r.moq || ''} onChange={e => updateSvRow(r.id, { moq: parseFloat(e.target.value) || 0 })}
                        aria-label={isAr ? 'الحد الأدنى للطلب' : 'MOQ'}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1" />
                    </td>
                    <td className="py-1.5 px-2 print-hide">
                      {svRows.length > 2 && (
                        <button onClick={() => removeSvRow(r.id)} aria-label={isAr ? 'حذف الموقع' : 'Remove site'}
                          className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results table */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto">
            <h3 className="text-xs font-bold text-slate-700 mb-2">{isAr ? 'النتائج' : 'Results'}</h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الموقع/المورّد' : 'Site/Supplier'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'التكلفة المسلَّمة/وحدة' : 'Landed cost/unit'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">PPV/{isAr ? 'وحدة' : 'unit'}</th>
                  <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{isAr ? 'الفرصة القابلة للتحصيل/سنة' : 'Addressable opportunity/yr'}</th>
                </tr>
              </thead>
              <tbody>
                {svRows.map(r => {
                  const res = svResults.rowResults.find(x => x.id === r.id);
                  return (
                    <tr key={r.id} className={`border-b border-slate-100 ${res?.isBenchmark ? 'bg-emerald-50/50' : ''}`}>
                      <td className="py-2 pr-2 font-semibold text-slate-700 whitespace-nowrap">
                        {r.siteName}
                        {res?.isBenchmark && <span className="ml-1.5 text-[9px] font-bold text-emerald-600 uppercase">{isAr ? 'مرجع' : 'Benchmark'}</span>}
                      </td>
                      <td className="py-2 px-2 text-slate-600">{res?.isValid ? `SAR ${res.landedUnitCost.toFixed(2)}` : '—'}</td>
                      <td className="py-2 px-2 text-slate-600">{res?.isValid ? `SAR ${res.ppvPerUnit.toFixed(2)}` : '—'}</td>
                      <td className="py-2 px-2 font-semibold">
                        {res?.isValid
                          ? (res.addressableOpportunity > 0
                            ? <span className="text-amber-600">SAR {res.addressableOpportunity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            : <span className="text-slate-300">—</span>)
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{isAr ? 'إجمالي الفرصة القابلة للتحصيل سنوياً' : 'Total addressable opportunity / year'}</p>
                <p className="text-xl font-bold text-slate-800">SAR {svResults.totalAddressableOpportunity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            {svResults.moqNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mt-3 print-hide">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800">
                  {isAr
                    ? `تنبيه جدوى: الحد الأدنى للطلب المذكور لدى ${svResults.benchmarkRow?.siteName} (${svResults.benchmarkRow?.moq}) يتجاوز الكمية التي ستنتقل إليه (${svResults.redirectableQty}) -- قد يتطلب الأمر دمجها مع الحجم الحالي الموجود هناك بالفعل قبل اعتبار هذه الفرصة قابلة للتحصيل بالكامل.`
                    : `Feasibility flag: ${svResults.benchmarkRow?.siteName}'s stated MOQ (${svResults.benchmarkRow?.moq}) exceeds the volume that would redirect there (${svResults.redirectableQty}) -- may need consolidating with the volume already placed there before treating this opportunity as fully capturable.`}
                </p>
              </div>
            )}

            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 mt-3 print-hide">
              <p className="text-[10px] text-slate-400">
                {isAr
                  ? 'ملاحظة صدق: قد يعكس الفارق سعراً هيكلياً حقيقياً أو عاملاً مؤقتاً (مثل ارتفاع مؤقت في تكلفة الشحن). تحقق قبل التفاوض أو إعادة التوجيه.'
                  : 'Honesty note: this gap may reflect a real, structural price difference or a temporary factor (e.g. a recent freight spike at one site). Verify before renegotiating or redirecting volume.'}
              </p>
            </div>
          </div>

          {/* Visual comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 print-hide">
            <h3 className="text-xs font-bold text-slate-700 mb-2">{isAr ? 'الفرصة القابلة للتحصيل حسب الموقع' : 'Addressable opportunity by site'}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={svChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => [`SAR ${v.toLocaleString()}`, '']} />
                <Bar dataKey="opportunity" radius={[6, 6, 0, 0]}>
                  {svChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Export + AI Insight */}
          <div className="flex justify-end print-hide">
            <button onClick={exportSvAnalysis}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <Download className="w-3.5 h-3.5" />{isAr ? 'تصدير (CSV)' : 'Export (CSV)'}
            </button>
          </div>

          <div className="print-hide">
            <AIPlanPanel
              loading={svAiPlan.loading} result={svAiPlan.result} evidenceSummary={svAiPlan.evidenceSummary} error={svAiPlan.error}
              onGenerate={svAiPlan.generate} onReset={svAiPlan.reset}
              savedPlan={svAiPlan.savedPlan} onViewSaved={svAiPlan.viewSaved} onDeleteSaved={svAiPlan.deleteSaved}
              rateLimited={svAiPlan.rateLimited}
              retryAfterSeconds={svAiPlan.retryAfterSeconds}
              saveError={svAiPlan.saveError}
              onDismissSaveError={svAiPlan.dismissSaveError}
              buttonLabel={isAr ? 'توليد رؤية فرصة الإنفاق التنفيذية ✨' : 'Generate Spend Opportunity Executive Insight ✨'}
              isAr={isAr} toolKey="procurement-spendvariance"
              disabled={!svHasData}
            />
          </div>

          {/* Sources -- real, verified citations for the PPV methodology */}
          <details className="text-[10px] text-slate-400 print-hide">
            <summary className="cursor-pointer font-semibold text-slate-500">{isAr ? 'المصادر والمنهجية' : 'Sources & methodology'}</summary>
            <ul className="mt-1.5 space-y-1 pl-3 list-disc">
              {SV_SOURCES.map(src => (
                <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">{src.label}</a></li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* ── TAB 5: AI Strategy Brief ── */}
      {activeTab === 'ai' && (
        <div id="panel-ai" role="tabpanel" aria-labelledby="tab-ai">
        <AIPlanPanel
          loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error}
          onGenerate={aiPlan.generate} onReset={aiPlan.reset}
          savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
          rateLimited={aiPlan.rateLimited}
          retryAfterSeconds={aiPlan.retryAfterSeconds}
          saveError={aiPlan.saveError}
          onDismissSaveError={aiPlan.dismissSaveError}
          buttonLabel={isAr ? 'توليد استراتيجية الفئة ✨' : 'Generate Category Strategy ✨'}
          isAr={isAr} toolKey="procurement-catmgmt"
          disabled={validRows.length < 2}
        />
        </div>
      )}

      {/* ── TAB 6: Alert Thresholds ── */}
      {activeTab === 'alerts' && (
        <div id="panel-alerts" role="tabpanel" aria-labelledby="tab-alerts" className="space-y-4">

          {/* Info callout */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {isAr
                ? 'حدّد قيم التحذير والإنذار الحرج لكل مؤشر أداء. ستظهر شارات التنبيه على بطاقات الملخص عند تجاوز هذه القيم.'
                : 'Set warn and critical thresholds for each KPI. Alert badges will appear on the summary cards when values breach these levels. Thresholds are saved in your browser and survive page reloads.'}
            </p>
          </div>

          {/* Threshold cards */}
          {(
            <div className="space-y-3">
              {KPI_THRESHOLD_DEFS.map(def => {
                const draft  = thresholdDraft[def.key];
                const live   = thresholds[def.key];
                const breach = live ? kpiBreachLevel(
                  def.key === 'contractedPct' ? contractedPct :
                  def.key === 'top3Pct'       ? top3Pct       :
                  porterAvg,
                  live,
                ) : null;

                return (
                  <div key={def.key} className={`bg-white border rounded-2xl p-4 shadow-sm ${breach === 'critical' ? 'border-red-300' : breach === 'warn' ? 'border-amber-300' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800">{isAr ? def.labelAr : def.label}</p>
                          {breach && (
                            <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${breach === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {breach === 'critical' ? (isAr ? 'بالغ' : 'CRITICAL') : (isAr ? 'تحذير' : 'WARNING')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? def.hintAr : def.hint}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isAr ? 'القيمة الحالية:' : 'Current value:'}{' '}
                          <strong className="text-slate-600">
                            {def.key === 'contractedPct' ? `${contractedPct}${def.unit}` :
                             def.key === 'top3Pct'       ? `${top3Pct}${def.unit}` :
                             `${porterAvg.toFixed(1)}${def.unit}`}
                          </strong>
                          {' · '}{isAr ? (def.higherIsBetter ? 'الأعلى أفضل' : 'الأقل أفضل') : (def.higherIsBetter ? 'higher is better' : 'lower is better')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Warn threshold */}
                      <div>
                        <label className="block text-[10px] font-semibold text-amber-600 mb-1" htmlFor={`thresh-warn-${def.key}`}>
                          {isAr ? `⚠ تحذير ${def.unit}` : `⚠ Warn ${def.unit}`}
                        </label>
                        <input
                          id={`thresh-warn-${def.key}`}
                          type="number"
                          min={def.min}
                          max={def.max}
                          step={def.key === 'porterAvg' ? 0.1 : 1}
                          value={draft?.warn ?? ''}
                          placeholder={isAr ? 'غير محدد' : 'Not set'}
                          onChange={e => updateThresholdDraft(def.key, 'warn', e.target.value)}
                          className="w-full text-xs border border-amber-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
                          aria-label={isAr ? `حد التحذير لـ ${def.labelAr}` : `Warn threshold for ${def.label}`}
                        />
                      </div>

                      {/* Critical threshold */}
                      <div>
                        <label className="block text-[10px] font-semibold text-red-600 mb-1" htmlFor={`thresh-crit-${def.key}`}>
                          {isAr ? `🚨 بالغ ${def.unit}` : `🚨 Critical ${def.unit}`}
                        </label>
                        <input
                          id={`thresh-crit-${def.key}`}
                          type="number"
                          min={def.min}
                          max={def.max}
                          step={def.key === 'porterAvg' ? 0.1 : 1}
                          value={draft?.critical ?? ''}
                          placeholder={isAr ? 'غير محدد' : 'Not set'}
                          onChange={e => updateThresholdDraft(def.key, 'critical', e.target.value)}
                          className="w-full text-xs border border-red-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50"
                          aria-label={isAr ? `حد الإنذار الحرج لـ ${def.labelAr}` : `Critical threshold for ${def.label}`}
                        />
                      </div>
                    </div>

                    {/* Inline validation error */}
                    {thresholdErrors[def.key] && (
                      <p className="mt-2 text-[11px] text-red-600 flex items-center gap-1" role="alert">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {thresholdErrors[def.key]}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Save button */}
              <button
                onClick={saveThresholds}
                className="w-full flex items-center justify-center gap-2 bg-[#082C6B] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                aria-label={isAr ? 'حفظ حدود التنبيه' : 'Save alert thresholds'}
              >
                <Save className="w-4 h-4" />{isAr ? 'حفظ حدود التنبيه' : 'Save Alert Thresholds'}
              </button>

              {/* Guidance note */}
              <p className="text-[11px] text-slate-400 text-center">
                {isAr
                  ? 'تُطبَّق الحدود على مؤشرات الأداء الحالية وتُحفظ في المتصفح وتبقى بعد إعادة التحميل.'
                  : 'Thresholds apply to current KPI values and are saved in your browser — they survive page reloads.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
