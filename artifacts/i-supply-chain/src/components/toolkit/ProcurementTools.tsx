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
import React, { useState, useCallback, useMemo, useRef, KeyboardEvent, ChangeEvent } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Upload, Download, Plus, Trash2, ChevronDown, ChevronUp,
  BarChart3, Globe, Target, FileDown, Sparkles, TrendingUp,
  AlertTriangle, CheckCircle, Info, Bell, Save } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { INDUSTRIES, type IndustryKey } from '@/lib/kpiBenchmarksByIndustry';
import { SKU_CLASSES, type SkuClassKey } from '@/lib/kpiBenchmarksBySkuClass';
import { INDUSTRY_SUB_SECTORS } from '@/lib/industrySubSectors';
import { TCO_STAGES, TCO_FIELDS, TCO_CHECKLIST_BY_SKU_CLASS, TCO_SOURCES, type TcoStageId } from '@/lib/tcoKnowledgeBase';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { toast } from 'sonner';

interface ProcurementToolsProps { isAr: boolean; }

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpendRow {
  id: string;
  supplier: string;
  category: string;
  subcategory: string;
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
  return { id: nid(), supplier: '', category: '', subcategory: '', annualSpend: 0, contracted: false, strategic: false, notes: '' };
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
      'Supplier,Category,Subcategory,Annual Spend (SAR),YTD Spend (SAR),Contracted (Yes/No),Strategic (Yes/No),Notes\n' +
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

type Tab = 'spend' | 'market' | 'strategy' | 'templates' | 'tco' | 'ai' | 'alerts';

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProcurementToolsSection({ isAr }: ProcurementToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('spend');

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
      '## Your Task',
      'Generate a 4–6 paragraph executive category strategy document:',
      '1. Spend landscape: portfolio health, concentration risk, contracted vs uncontracted analysis',
      '2. Supply market assessment: interpret Porter\'s forces scores and their sourcing implications',
      '3. Strategic recommendation: justify the chosen sourcing strategy with market evidence',
      '4. Risk register: top 3 supply risks and their specific mitigations',
      '5. 90-day action plan with [HIGH]/[MEDIUM]/[LOW] priority items',
      '6. Savings opportunity: estimate potential savings from this strategy (provide a % range)',
    ].join('\n');
  }, [validRows, totalSpend, contractedPct, top3Pct, paretoData, porter, porterAvg, marketRisk, chosenStrategy]);

  const aiPlan = useAIPlan(buildPrompt, isAr, 'procurement-catmgmt', validRows.length >= 2);

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
  const [tcoState, setTcoState] = useState<{ analyses: TcoAnalysis[]; activeId: string }>(loadInitialTcoAnalyses);
  const saveTcoState = (next: { analyses: TcoAnalysis[]; activeId: string }) => {
    setTcoState(next); safeSetItem(SK_TCO_V2, JSON.stringify(next));
  };
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

  const tcoResults = useMemo(() => tcoSuppliers.map(s => {
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
  }), [tcoSuppliers]);
  const tcoValidResults = tcoResults.filter(r => r.tcoPerUnit > 0);
  const tcoLowestPerUnit = tcoValidResults.length > 0 ? Math.min(...tcoValidResults.map(r => r.tcoPerUnit)) : 0;
  const tcoLowestId = tcoValidResults.find(r => r.tcoPerUnit === tcoLowestPerUnit)?.id;
  const tcoChecklist = tcoActiveAnalysis.skuClass ? TCO_CHECKLIST_BY_SKU_CLASS[tcoActiveAnalysis.skuClass] : null;
  const tcoSubSectorOptions = tcoActiveAnalysis.industry ? (INDUSTRY_SUB_SECTORS[tcoActiveAnalysis.industry] || []) : [];
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

  const anyBreach = Object.values(breachLevels).some(v => v !== null);

  const tabs: { id: Tab; icon: string; label: string; labelAr: string }[] = [
    { id: 'spend',     icon: '📊', label: 'Spend Analysis',      labelAr: 'تحليل الإنفاق'      },
    { id: 'market',    icon: '🌍', label: 'Market Intelligence',  labelAr: 'استخبارات السوق'    },
    { id: 'strategy',  icon: '🎯', label: 'Sourcing Strategy',    labelAr: 'استراتيجية التوريد' },
    { id: 'templates', icon: '📥', label: 'Templates & Tools',    labelAr: 'القوالب والأدوات'   },
    { id: 'tco',       icon: '💰', label: 'TCO Engine',           labelAr: 'محرك التكلفة الإجمالية' },
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
                    {[isAr ? 'المورد' : 'Supplier', isAr ? 'الفئة' : 'Category', isAr ? 'فئة فرعية' : 'Subcategory', isAr ? 'الإنفاق السنوي (ر.س)' : 'Annual Spend (SAR)', isAr ? 'متعاقد؟' : 'Contracted?', isAr ? 'استراتيجي؟' : 'Strategic?', ''].map((h, i) => (
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

          {/* Analysis switcher -- multiple named, saved analyses (one per item/category) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
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
                          <td key={s.id} className="py-1.5 px-2">
                            <input type="number" min={0} value={s[f.key] || ''}
                              onChange={e => updateTcoSupplier(s.id, { [f.key]: parseFloat(e.target.value) || 0 } as Partial<TcoSupplier>)}
                              className="w-full border border-slate-200 rounded-lg px-1.5 py-1 text-xs" />
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

          <div className="flex items-center justify-between flex-wrap gap-2">
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
            <p className="text-[10px] text-slate-400">{isAr ? 'يُحفَظ تلقائياً في هذا المتصفح' : 'Auto-saved in this browser'}</p>
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
