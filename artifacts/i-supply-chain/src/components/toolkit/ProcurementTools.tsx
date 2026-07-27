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
import React, { useState, useCallback, useMemo, useRef, KeyboardEvent } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Upload, Download, Plus, Trash2, ChevronDown, ChevronUp,
  BarChart3, Globe, Target, FileDown, Sparkles, TrendingUp,
  AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
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
    desc: 'Monthly savings pipeline tracker aligned to CIPS savings categories (hard, soft, cost avoidance).', descAr: 'متتبّع مسار الوفورات الشهري متوافق مع تصنيفات CIPS (حقيقية، ناعمة، تجنّب التكاليف).',
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
CIPS-Aligned | Version 1.0
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

const SCORECARD_CSV = `Supplier Evaluation Scorecard — CIPS Aligned
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

const TCO_CSV = `Total Cost of Ownership (TCO) Calculator
Compare up to 3 suppliers — fill in yellow cells
,,,,
COST ELEMENT,UNIT,Supplier A (SAR),Supplier B (SAR),Supplier C (SAR)
,,,,
DIRECT COSTS,,,,
Unit purchase price,,,,
Quantity (annual),,,,
"Total purchase cost (price × qty)",,=FORMULA,=FORMULA,=FORMULA
VAT (15%),,,,
Import duties / customs fees,,,,
,,,,
LOGISTICS & DELIVERY COSTS,,,,
Freight / shipping cost,,,,
Insurance in transit,,,,
Port handling fees,,,,
Last-mile delivery,,,,
,,,,
INVENTORY CARRYING COSTS,,,,
Safety stock days required,,,,
"Carrying cost rate (% of stock value, typically 20-30%)",,,,
Annual inventory carrying cost,,,,
,,,,
QUALITY & RISK COSTS,,,,
"Incoming inspection cost / sample testing",,,,
Expected defect rate (PPM),,,,
"Rework / return / scrap cost (annual est.)",,,,
Supplier audit / visit cost (annual),,,,
,,,,
TRANSACTION COSTS,,,,
"PO processing cost (# POs × SAR per PO)",,,,
"Invoice processing / reconciliation cost",,,,
,,,,
TOTAL TCO (ANNUAL SAR),,=SUM,=SUM,=SUM
TCO per unit,,=FORMULA,=FORMULA,=FORMULA
TCO vs. lowest (%),,BASE,=FORMULA,=FORMULA`;

const SAVINGS_CSV = `Procurement Savings Tracker — CIPS Categories
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

const SK_SPEND    = 'isc-tool-catmgmt-spend-v2';
const SK_PORTER   = 'isc-tool-catmgmt-porter-v2';
const SK_STRATEGY = 'isc-tool-catmgmt-strategy-v2';

function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'spend' | 'market' | 'strategy' | 'templates' | 'ai';

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProcurementToolsSection({ isAr }: ProcurementToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('spend');

  // Spend data
  const [rows, setRows] = useState<SpendRow[]>(() => loadJson(SK_SPEND, [defaultRow()]));
  const saveRows = (r: SpendRow[]) => { setRows(r); safeSetItem(SK_SPEND, JSON.stringify(r)); };
  const updateRow = (id: string, field: keyof SpendRow, value: string | number | boolean) =>
    saveRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRow = () => saveRows([...rows, defaultRow()]);
  const removeRow = (id: string) => saveRows(rows.filter(r => r.id !== id));

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

  const tabs: { id: Tab; icon: string; label: string; labelAr: string }[] = [
    { id: 'spend',     icon: '📊', label: 'Spend Analysis',      labelAr: 'تحليل الإنفاق'      },
    { id: 'market',    icon: '🌍', label: 'Market Intelligence',  labelAr: 'استخبارات السوق'    },
    { id: 'strategy',  icon: '🎯', label: 'Sourcing Strategy',    labelAr: 'استراتيجية التوريد' },
    { id: 'templates', icon: '📥', label: 'Templates & Tools',    labelAr: 'القوالب والأدوات'   },
    { id: 'ai',        icon: '✨', label: 'AI Strategy Brief',    labelAr: 'تقرير الاستراتيجية' },
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
            role="tab"
            aria-selected={activeTab === t.id}
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
        <div className="space-y-4">
          {/* Summary cards */}
          {validRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: isAr ? 'إجمالي الإنفاق' : 'Total Spend', value: `SAR ${(totalSpend/1000).toFixed(0)}K`, color: '#082C6B' },
                { label: isAr ? 'عدد الموردين' : 'Suppliers', value: validRows.length.toString(), color: '#4f46e5' },
                { label: isAr ? 'الإنفاق المتعاقد' : 'Contracted', value: `${contractedPct}%`, color: contractedPct >= 70 ? '#059669' : contractedPct >= 40 ? '#d97706' : '#dc2626' },
                { label: isAr ? 'تركّز أعلى 3 موردين' : 'Top-3 Concentration', value: `${top3Pct}%`, color: top3Pct > 70 ? '#dc2626' : top3Pct > 50 ? '#d97706' : '#059669' },
              ].map(c => (
                <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-[11px] text-slate-500 font-medium">{c.label}</p>
                  <p className="text-xl font-black mt-1" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
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
              <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مورد' : 'Add row'}
              </button>
              {validRows.length > 0 && (
                <button onClick={() => setActiveTab('market')} className="text-xs bg-[#082C6B] text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90">
                  {isAr ? 'التالي: استخبارات السوق →' : 'Next: Market Intelligence →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Market Intelligence ── */}
      {activeTab === 'market' && (
        <div className="space-y-4">
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
        <div className="space-y-4">
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
        <div className="space-y-3">
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

      {/* ── TAB 5: AI Strategy Brief ── */}
      {activeTab === 'ai' && (
        <AIPlanPanel
          loading={aiPlan.loading} result={aiPlan.result} error={aiPlan.error}
          onGenerate={aiPlan.generate} onReset={aiPlan.reset}
          savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
          rateLimited={aiPlan.rateLimited}
          saveError={aiPlan.saveError}
          onDismissSaveError={aiPlan.dismissSaveError}
          buttonLabel={isAr ? 'توليد استراتيجية الفئة ✨' : 'Generate Category Strategy ✨'}
          isAr={isAr} toolKey="procurement-catmgmt"
          disabled={validRows.length < 2}
        />
      )}
    </div>
  );
}
