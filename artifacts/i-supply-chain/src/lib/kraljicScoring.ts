/**
 * Kraljic Procurement Portfolio Matrix — Scoring Engine
 *
 * Implements the classic Kraljic (1983) two-axis model:
 *   X-axis: Supply Risk / Complexity (0–100, higher = riskier)
 *   Y-axis: Profit Impact / Spend Impact (0–100, higher = more strategic)
 *
 * Industry thresholds shift the quadrant boundary so that the same raw
 * score lands in a different quadrant depending on sector context.
 *
 * Sources: Kraljic (1983 HBR), CIPS Category Management Toolkit,
 * ISM Practitioner Standards, ISC GCC practice data 2022–2025.
 */

function nid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type KraljicQuadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

export interface KraljicItem {
  id: string;
  category: string;
  subcategory: string;
  itemName: string;
  annualSpend: number;           // SAR
  annualQty: number;
  unit: string;
  supplierCount: number;         // actual count of qualified suppliers
  leadTimeDays: number;
  qualityImpact: number;         // 1–5 (5 = critical quality dependency)
  revenueImpact: number;         // 1–5 (5 = major revenue driver)
  marketCompetitiveness: number; // 1–5 (5 = many competing suppliers)
  geographicRisk: number;        // 1–5 (5 = extreme geo/political risk)
  substitutability: number;      // 1–5 (5 = very easy to substitute)
}

export interface KraljicScored extends KraljicItem {
  profitImpactScore: number;  // 0–100
  supplyRiskScore: number;    // 0–100
  quadrant: KraljicQuadrant;
  spendPct: number;           // % of total portfolio spend
}

export interface ActionPlan {
  planning: string[];
  sourcing: string[];
  negotiation: string[];
  supplierSelection: string[];
  srm: string[];
  // Arabic equivalents
  planningAr: string[];
  sourcingAr: string[];
  negotiationAr: string[];
  supplierSelectionAr: string[];
  srmAr: string[];
}

export interface IndustryThreshold {
  riskThreshold: number;    // score below = low risk
  impactThreshold: number;  // score below = low impact
}

// ─── Quadrant Metadata ────────────────────────────────────────────────────────

export const QUADRANT_META: Record<KraljicQuadrant, {
  label: string; labelAr: string;
  color: string; bg: string; border: string;
  tagline: string; taglineAr: string;
  icon: string;
}> = {
  strategic: {
    label: 'Strategic',         labelAr: 'استراتيجي',
    color: '#082C6B',           bg: '#EEF2FF',   border: '#6366f1',
    tagline: 'High impact · High risk — Manage with partnerships',
    taglineAr: 'تأثير مرتفع · خطر مرتفع — أدِر بشراكات طويلة الأمد',
    icon: '🏆',
  },
  leverage: {
    label: 'Leverage',          labelAr: 'نفوذ سوقي',
    color: '#065f46',           bg: '#ECFDF5',   border: '#059669',
    tagline: 'High impact · Low risk — Exploit competitive market',
    taglineAr: 'تأثير مرتفع · خطر منخفض — استغل التنافسية',
    icon: '💰',
  },
  bottleneck: {
    label: 'Bottleneck',        labelAr: 'نقطة اختناق',
    color: '#92400e',           bg: '#FFFBEB',   border: '#d97706',
    tagline: 'Low impact · High risk — Secure supply first',
    taglineAr: 'تأثير منخفض · خطر مرتفع — أمّن الإمداد أولاً',
    icon: '⚠️',
  },
  'non-critical': {
    label: 'Non-Critical',      labelAr: 'غير حرج',
    color: '#374151',           bg: '#F9FAFB',   border: '#9ca3af',
    tagline: 'Low impact · Low risk — Streamline & automate',
    taglineAr: 'تأثير منخفض · خطر منخفض — بسّط وأتمت',
    icon: '📋',
  },
};

// ─── Industry Thresholds ──────────────────────────────────────────────────────

export const INDUSTRY_THRESHOLDS: Record<string, IndustryThreshold> = {
  'retail-fmcg':       { riskThreshold: 55, impactThreshold: 45 },
  'manufacturing':     { riskThreshold: 45, impactThreshold: 48 },
  'healthcare-pharma': { riskThreshold: 43, impactThreshold: 45 },
  'oil-gas':           { riskThreshold: 40, impactThreshold: 50 },
  'government':        { riskThreshold: 50, impactThreshold: 55 },
  'logistics':         { riskThreshold: 48, impactThreshold: 50 },
  'food-beverage':     { riskThreshold: 50, impactThreshold: 45 },
  'construction':      { riskThreshold: 42, impactThreshold: 50 },
  default:             { riskThreshold: 50, impactThreshold: 50 },
};

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function supplierCountToRisk(count: number): number {
  if (count <= 1)  return 100;
  if (count === 2) return 82;
  if (count === 3) return 62;
  if (count <= 5)  return 40;
  if (count <= 10) return 22;
  return 10;
}

export function scoreItems(
  items: KraljicItem[],
  industryKey: string | null,
): KraljicScored[] {
  const totalSpend = items.reduce((s, i) => s + (i.annualSpend || 0), 0) || 1;
  const th = INDUSTRY_THRESHOLDS[industryKey ?? 'default'] ?? INDUSTRY_THRESHOLDS.default;

  return items.map(item => {
    const spendPct = (item.annualSpend / totalSpend) * 100;

    // ── Profit Impact ─────────────────────────────────────────────────────────
    // Log-scale spend so a 5% item scores ~55, a 25% item ~80, a 50%+ item ~95
    const spendScore = Math.min(100, (Math.log1p(spendPct) / Math.log1p(100)) * 160);
    const qualScore  = ((Math.max(1, item.qualityImpact)  - 1) / 4) * 100;
    const revScore   = ((Math.max(1, item.revenueImpact)  - 1) / 4) * 100;
    const profitImpactScore = Math.round(
      spendScore * 0.60 + qualScore * 0.20 + revScore * 0.20,
    );

    // ── Supply Risk ───────────────────────────────────────────────────────────
    const supplierRisk  = supplierCountToRisk(item.supplierCount || 1);
    const marketRisk    = ((5 - Math.max(1, item.marketCompetitiveness)) / 4) * 100;
    const geoRisk       = ((Math.max(1, item.geographicRisk)  - 1) / 4) * 100;
    const leadTimeRisk  = Math.min(100, ((item.leadTimeDays || 0) / 120) * 100);
    const subRisk       = ((5 - Math.max(1, item.substitutability)) / 4) * 100;
    const supplyRiskScore = Math.round(
      supplierRisk * 0.30 +
      marketRisk   * 0.20 +
      geoRisk      * 0.20 +
      leadTimeRisk * 0.15 +
      subRisk      * 0.15,
    );

    const quadrant: KraljicQuadrant =
      profitImpactScore >= th.impactThreshold && supplyRiskScore >= th.riskThreshold
        ? 'strategic'
      : profitImpactScore >= th.impactThreshold && supplyRiskScore < th.riskThreshold
        ? 'leverage'
      : profitImpactScore < th.impactThreshold && supplyRiskScore >= th.riskThreshold
        ? 'bottleneck'
        : 'non-critical';

    return { ...item, profitImpactScore, supplyRiskScore, quadrant, spendPct };
  });
}

// ─── Item Factory ─────────────────────────────────────────────────────────────

export function newItem(overrides: Partial<KraljicItem> = {}): KraljicItem {
  return {
    id: nid(),
    category: '',
    subcategory: '',
    itemName: '',
    annualSpend: 0,
    annualQty: 0,
    unit: 'EA',
    supplierCount: 3,
    leadTimeDays: 14,
    qualityImpact: 3,
    revenueImpact: 3,
    marketCompetitiveness: 3,
    geographicRisk: 2,
    substitutability: 3,
    ...overrides,
  };
}

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'Category', 'Subcategory', 'Item Name',
  'Annual Spend (SAR)', 'Annual Qty', 'Unit',
  'No. of Suppliers', 'Lead Time (days)',
  'Quality Impact (1-5)', 'Revenue Impact (1-5)',
  'Market Competitiveness (1-5)', 'Geographic Risk (1-5)',
  'Substitutability (1-5)',
];

export function generateCSVTemplate(): string {
  const examples = [
    ['IT Equipment', 'Hardware', 'Servers', '480000', '12', 'EA', '2', '60', '4', '4', '2', '3', '2'],
    ['Packaging', 'Primary', 'Carton Boxes', '95000', '50000', 'UNIT', '5', '7', '2', '3', '5', '1', '5'],
    ['MRO', 'Spare Parts', 'Pump Seals', '62000', '200', 'EA', '1', '90', '5', '3', '1', '4', '1'],
    ['Office Supplies', 'Consumables', 'Printer Cartridges', '18000', '500', 'EA', '8', '3', '1', '1', '5', '1', '5'],
    ['Raw Materials', 'Chemicals', 'Polymer Resin', '1200000', '800', 'TON', '3', '45', '5', '5', '2', '4', '2'],
  ];
  return [CSV_HEADERS, ...examples].map(row => row.join(',')).join('\n');
}

export function parseCSV(text: string): KraljicItem[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  // Skip header row
  const dataLines = lines[0].toLowerCase().includes('category') ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const n = (i: number, fallback = 0) => { const v = parseFloat(cols[i] ?? ''); return isNaN(v) ? fallback : v; };
    const s = (i: number, fallback = '') => cols[i] ?? fallback;
    return newItem({
      category:              s(0),
      subcategory:           s(1),
      itemName:              s(2),
      annualSpend:           n(3),
      annualQty:             n(4),
      unit:                  s(5, 'EA'),
      supplierCount:         Math.max(1, Math.round(n(6, 3))),
      leadTimeDays:          Math.max(0, Math.round(n(7, 14))),
      qualityImpact:         Math.min(5, Math.max(1, Math.round(n(8, 3)))),
      revenueImpact:         Math.min(5, Math.max(1, Math.round(n(9, 3)))),
      marketCompetitiveness: Math.min(5, Math.max(1, Math.round(n(10, 3)))),
      geographicRisk:        Math.min(5, Math.max(1, Math.round(n(11, 2)))),
      substitutability:      Math.min(5, Math.max(1, Math.round(n(12, 3)))),
    });
  }).filter(i => i.itemName || i.category);
}

// ─── Action Plans ─────────────────────────────────────────────────────────────

export const ACTION_PLANS: Record<KraljicQuadrant, ActionPlan> = {

  /* ── STRATEGIC ─────────────────────────────────────────────────────────── */
  strategic: {
    planning: [
      'Develop joint capacity and demand plans with strategic suppliers (S&OP integration)',
      'Align 3–5 year supply roadmaps with supplier investment and expansion plans',
      'Build a supply continuity plan: dual-source critical allocations + 60–90 day buffer',
      'Conduct annual Total Cost of Ownership (TCO) modelling — not just price tracking',
      'Include in business continuity plan (BCP) with tested recovery scenarios',
    ],
    sourcing: [
      'Negotiate long-term framework agreements (3–5 years) with annual price review windows',
      'Develop 1–2 strategic supplier partnerships with preferred status and access commitments',
      'Invest in supplier development: fund capability building, qualify alternatives',
      'Explore localisation or near-shoring to reduce geopolitical and logistics risk',
      'Evaluate make-vs-buy periodically — high spend may justify insourcing',
    ],
    negotiation: [
      'Lead with Total Cost of Ownership (TCO), not unit price — model all cost drivers',
      'Negotiate risk/reward sharing: indexation clauses, rebate triggers, price review bands',
      'Lock in capacity guarantees and priority scheduling during peak demand or shortage',
      'Include innovation commitments: supplier invests X% of contract value in joint R&D',
      'Build in performance improvement targets (price, quality, lead time) year-on-year',
    ],
    supplierSelection: [
      'Assess financial health and ownership structure (D&B or equivalent credit check)',
      'Evaluate innovation pipeline and R&D investment as % of revenue',
      'Conduct site visits, quality system audits (ISO, GMP), and BCP assessments',
      'Score on extended QCDRS framework: Quality, Cost, Delivery, Responsiveness, Sustainability',
      'Require ESG and Iktva compliance documentation as pre-qualification criteria',
    ],
    srm: [
      'Executive-to-executive governance meetings (quarterly minimum) with joint scorecards',
      'Joint Business Plans (JBPs): aligned KPIs, shared investment, mutual milestones',
      'Innovation forums and co-development workshops (at least annually)',
      'Dedicated relationship manager on both buyer and supplier sides',
      'Conduct annual 360° supplier satisfaction surveys — the relationship must be mutual',
    ],
    planningAr: [
      'تطوير خطط مشتركة للطاقة الإنتاجية مع الموردين الاستراتيجيين',
      'مواءمة خارطة طريق الإمداد (3–5 سنوات) مع خطط توسع الموردين',
      'بناء خطة استمرارية الإمداد: مصادر بديلة + مخزون احتياطي 60–90 يوماً',
      'إجراء نمذجة التكلفة الإجمالية للملكية (TCO) سنوياً',
      'إدراج هذه الفئة في خطة استمرارية الأعمال (BCP)',
    ],
    sourcingAr: [
      'التفاوض على اتفاقيات إطارية طويلة الأمد (3–5 سنوات)',
      'تطوير 1–2 شراكة استراتيجية مع موردين مفضلين',
      'الاستثمار في تطوير الموردين وبناء قدراتهم',
      'دراسة التوطين أو التصنيع القريب لتقليل المخاطر الجيوسياسية',
      'تقييم دوري لإمكانية التصنيع الداخلي (Make vs. Buy)',
    ],
    negotiationAr: [
      'قود المفاوضة بالتكلفة الإجمالية للملكية (TCO) لا بسعر الوحدة',
      'تفاوض على بنود تقاسم المخاطر والمكاسب (مؤشرات الأسعار، الخصومات)',
      'اضمن حجز الطاقة الإنتاجية وأولوية الجدولة في فترات الذروة',
      'أدرج التزامات الابتكار: استثمار بنسبة X% في التطوير المشترك',
      'حدد أهداف التحسين السنوية في الجودة والتوصيل والسعر',
    ],
    supplierSelectionAr: [
      'تقييم الملاءة المالية وهيكل الملكية',
      'تقييم خط الابتكار والاستثمار في البحث والتطوير',
      'زيارات ميدانية ومراجعات نظام الجودة وخطط الطوارئ',
      'التقييم بإطار QCDRS: الجودة، التكلفة، التوصيل، الاستجابة، الاستدامة',
      'اشتراط الامتثال لمعايير الاستدامة والمحتوى المحلي (إكتفاء)',
    ],
    srmAr: [
      'اجتماعات حوكمة تنفيذية ربع سنوية مع بطاقات أداء مشتركة',
      'خطط الأعمال المشتركة (JBP): مؤشرات أداء مشتركة وأهداف متوافقة',
      'منتديات الابتكار وورش التطوير المشترك (سنوياً على الأقل)',
      'مدير علاقات متخصص من الطرفين',
      'مسح رضا الموردين السنوي (360°) — العلاقة يجب أن تكون متبادلة',
    ],
  },

  /* ── LEVERAGE ──────────────────────────────────────────────────────────── */
  leverage: {
    planning: [
      'Consolidate volumes across BUs, sites, and geographies to maximise buying leverage',
      'Aggregate demand forecasts to deliver credible volume commitments that unlock pricing',
      'Run quarterly demand reviews with key suppliers to manage capacity expectations',
      'Standardise specifications to widen the pool of qualifying suppliers',
      'Bundle complementary categories for combined RFQ and better bundled savings',
    ],
    sourcing: [
      'Run competitive RFQ/RFP with 3–5 pre-qualified suppliers every 12–24 months',
      'Use e-auctions or reverse auctions for commodity-like, well-specified items',
      'Split volume 60/40 between 2–3 suppliers to maintain active competitive tension',
      'Set up multi-year framework agreements with call-off flexibility',
      'Consider GPO (Group Purchasing Organisation) membership for market pricing benchmarks',
    ],
    negotiation: [
      'Lead with price — use commodity indices, market reports, and competitor quotes as anchors',
      'Negotiate volume rebates, early-payment discounts (2/10 net 30), and bundled savings',
      'Use competitive bid data explicitly — let suppliers see they are in a real contest',
      'Target 5–15% savings vs. baseline in the first cycle; 3–7% in subsequent cycles',
      'Negotiate extended payment terms (DPO 60–90 days) alongside price',
    ],
    supplierSelection: [
      'Lead criteria: price competitiveness, on-time delivery (OTIF), and quality conformance (PPM)',
      'Qualify minimum 3 suppliers on an Approved Vendor List (AVL)',
      'Evaluate capacity, financial stability, and minimum order quantities',
      'Run periodic re-tendering every 12–24 months to prevent complacency',
      'Assess e-commerce and EDI capability — ease of ordering matters at scale',
    ],
    srm: [
      'Preferred supplier programme with clear performance tiers (Preferred / Approved / Conditional)',
      'Quarterly performance reviews: OTIF, quality PPM, invoice accuracy, responsiveness',
      'Supplier scorecards shared monthly — Red/Amber/Green traffic-light ratings published',
      'Automate transactional interactions (EDI, vendor portal, e-invoicing) to reduce cost-to-serve',
      'Annual contract renewal with benchmarked pricing — link renewal to performance tier',
    ],
    planningAr: [
      'توحيد الحجوم عبر وحدات الأعمال والمواقع لتعظيم قوة الشراء',
      'تجميع توقعات الطلب لتقديم التزامات موثوقة تفتح خيارات التسعير',
      'مراجعات الطلب ربع السنوية مع الموردين الرئيسيين',
      'توحيد المواصفات لتوسيع قاعدة الموردين المؤهلين',
      'تجميع الفئات المتكاملة في طلب عروض أسعار مدمج',
    ],
    sourcingAr: [
      'تنفيذ طلبات عروض تنافسية مع 3–5 موردين مؤهلين كل 12–24 شهراً',
      'استخدام المناقصات الإلكترونية العكسية للبنود الموحدة المواصفات',
      'توزيع الحجم 60/40 بين 2–3 موردين للحفاظ على التنافسية',
      'إطار اتفاقيات متعددة السنوات مع مرونة السحب',
      'دراسة العضوية في مجموعات الشراء (GPO) لمعايير السوق',
    ],
    negotiationAr: [
      'قود بالسعر — استخدم مؤشرات السلع وعروض المنافسين كمرجع',
      'تفاوض على خصومات الحجم والدفع المبكر وتوفيرات الحزم',
      'استخدم بيانات العروض التنافسية صراحةً كرافعة تفاوضية',
      'استهدف توفيرات 5–15% في الدورة الأولى، 3–7% في الدورات التالية',
      'تفاوض على شروط دفع ممتدة (DPO 60–90 يوماً)',
    ],
    supplierSelectionAr: [
      'المعايير الرئيسية: تنافسية السعر، OTIF، ومعدل العيوب (PPM)',
      'تأهيل 3 موردين على الأقل في قائمة الموردين المعتمدين',
      'تقييم الطاقة الإنتاجية والملاءة المالية والحد الأدنى للطلب',
      'إعادة الطرح دورياً كل 12–24 شهراً لمنع الركود',
      'تقييم قدرات التجارة الإلكترونية وتبادل البيانات (EDI)',
    ],
    srmAr: [
      'برنامج الموردين المفضلين مع مستويات أداء واضحة',
      'مراجعات أداء ربع سنوية: OTIF، PPM، دقة الفاتورة',
      'بطاقات أداء الموردين الشهرية — تقييمات ضوء المرور',
      'أتمتة التفاعلات المعاملاتية (EDI، بوابة الموردين، الفوترة الإلكترونية)',
      'تجديد العقد السنوي مع التسعير القياسي مرتبط بمستوى الأداء',
    ],
  },

  /* ── BOTTLENECK ────────────────────────────────────────────────────────── */
  bottleneck: {
    planning: [
      'Build strategic buffer stock: minimum 60–90 days cover for critical bottleneck items',
      'Develop contingency supply plans with pre-qualified backup suppliers on standby',
      'Include all bottleneck items in BCP with clear escalation and allocation protocols',
      'Implement VMI (Vendor-Managed Inventory) or consignment to reduce replenishment lead time',
      'Track supplier financial health and market signals proactively with early-warning alerts',
    ],
    sourcing: [
      'Dual-source immediately: qualify a second supplier even at a cost or quality premium',
      'Develop alternative suppliers or substitute specifications — treat as an urgent programme',
      'Qualify domestic or regional suppliers to reduce geopolitical and logistics exposure',
      'Conduct make-vs-buy analysis — high risk may justify insourcing or co-manufacturing',
      'Request Long-Term Agreements (LTA) with guaranteed allocation rights',
    ],
    negotiation: [
      'Prioritise supply assurance over price — accept reasonable premiums for reliability',
      'Negotiate guaranteed capacity allocations and priority scheduling in the agreement',
      'Include take-or-pay provisions: commit to minimum volume to secure allocation',
      'Include force majeure, allocation protocol, and alternative sourcing trigger clauses',
      'Avoid adversarial approaches — bottleneck suppliers hold the power; build goodwill',
    ],
    supplierSelection: [
      'Lead criterion: supply reliability and OTIF consistency — not price',
      'Assess financial health rigorously — a failing bottleneck supplier is a crisis',
      'Evaluate warehouse proximity, local stock levels, and safety stock policy',
      'Require Contingency Response Plans (CRP) and disaster recovery procedures',
      'Preference suppliers with ISO 22301 (Business Continuity) certification',
    ],
    srm: [
      'Monthly supply assurance reviews: track capacity, lead time, and risk signals',
      'Proactive market intelligence: monitor supplier financials, ownership changes, geopolitical events',
      'Invest in supplier development to grow capacity or reduce supply risks',
      'Build informal network contacts at operational level (production, logistics) for early signals',
      'Consider equity stake or off-take agreement if the item is truly irreplaceable',
    ],
    planningAr: [
      'بناء مخزون احتياطي استراتيجي: تغطية 60–90 يوماً للبنود الحرجة',
      'تطوير خطط إمداد احتياطية مع موردين بديلين مؤهلين مسبقاً',
      'إدراج جميع بنود الاختناق في خطة BCP مع بروتوكولات التصعيد',
      'تطبيق VMI أو المخزون التأميني لتقليل وقت تجديد المخزون',
      'رصد الملاءة المالية للموردين ومؤشرات السوق مع تنبيهات الإنذار المبكر',
    ],
    sourcingAr: [
      'التوريد المزدوج فوراً: تأهيل مورد ثانٍ حتى بتكلفة إضافية',
      'تطوير موردين بديلين أو مواصفات بديلة كبرنامج عاجل',
      'تأهيل موردين محليين أو إقليميين لتقليل المخاطر الجيوسياسية',
      'تحليل التصنيع مقابل الشراء — قد يبرر الخطر التصنيع الداخلي',
      'طلب اتفاقيات طويلة الأمد مع حقوق التخصيص المضمونة',
    ],
    negotiationAr: [
      'أعطِ الأولوية لضمان الإمداد على السعر — اقبل أقساطاً معقولة للموثوقية',
      'تفاوض على تخصيصات طاقة مضمونة وجدولة ذات أولوية',
      'أدرج بنود الالتزام بالحجم الأدنى (Take-or-Pay) لتأمين التخصيص',
      'أدرج بنوداً للقوة القاهرة وبروتوكول التخصيص ومصادر الطوارئ',
      'تجنب المقاربات العدائية — المورد الوحيد يمتلك قوة التفاوض',
    ],
    supplierSelectionAr: [
      'المعيار الرئيسي: موثوقية الإمداد واتساق OTIF — لا السعر',
      'تقييم صارم للملاءة المالية — إفلاس مورد الاختناق أزمة كاملة',
      'تقييم قرب المستودع ومستويات المخزون المحلي وسياسة المخزون الاحتياطي',
      'اشتراط خطط الاستجابة للطوارئ (CRP) وإجراءات الاسترداد',
      'تفضيل الموردين الحاصلين على ISO 22301 (استمرارية الأعمال)',
    ],
    srmAr: [
      'مراجعات ضمان الإمداد الشهرية: تتبع الطاقة وأوقات التسليم',
      'استخبارات السوق الاستباقية: مراقبة ماليات الموردين والأحداث الجيوسياسية',
      'الاستثمار في تطوير الموردين لتنمية قدراتهم وتقليل مخاطرهم',
      'بناء علاقات غير رسمية على المستوى التشغيلي للحصول على إشارات مبكرة',
      'دراسة حصص الملكية أو اتفاقيات الاستخراج المسبق للبنود التي لا يمكن تعويضها',
    ],
  },

  /* ── NON-CRITICAL ──────────────────────────────────────────────────────── */
  'non-critical': {
    planning: [
      'Automate replenishment: configure min-max reorder points and kanban triggers in ERP',
      'Reduce order frequency with blanket purchase orders or quarterly call-off schedules',
      'Review usage data annually — eliminate slow-moving, obsolete, and duplicate SKUs',
      'Delegate purchasing authority to end users via P-cards or self-service catalogues',
      'Consolidate and simplify the product range — rationalise to fewer, standardised items',
    ],
    sourcing: [
      'Use catalogue purchasing, punchout, or marketplace procurement (Amazon Business, Jarir)',
      'Leverage broad-line distributors: consolidate hundreds of SKUs with one supplier',
      'Run simplified RFQ every 2–3 years — price, lead time, and ease of ordering are the criteria',
      'Consider consignment stock for fast-moving consumables to reduce tied-up working capital',
      'Explore GPO membership or government framework contracts for pre-competed pricing',
    ],
    negotiation: [
      'Negotiate annual price lists or fixed-price catalogues — minimise individual negotiations',
      'Use volume thresholds for tiered discounts without complex agreement structures',
      'Focus on payment terms (DPO extension) rather than price — cash flow matters here',
      'Accept supplier standard terms for low-value transactions — negotiation cost exceeds savings',
      'Automate acceptance of pre-agreed catalogues and framework pricing via ERP',
    ],
    supplierSelection: [
      'Select on price, lead time, and ease of ordering — not strategic fit or innovation',
      'Limit the AVL to 1–2 suppliers per sub-category for operational efficiency',
      'Prefer distributors with e-catalogue and punchout integration (reduces transaction cost)',
      'Evaluate after-hours availability and delivery flexibility for operational continuity',
      'Use GPO / marketplace pricing as a benchmark — avoid bespoke contracts',
    ],
    srm: [
      'Fully transactional relationship — no dedicated relationship manager required',
      'Monitor via automated metrics: invoice matching rate, delivery OTIF, error rate',
      'Annual supplier review: price validation and re-tender if savings > 5% available',
      'Implement vendor portal and e-invoicing to eliminate manual processing cost',
      'Remove non-performing suppliers from AVL automatically based on scorecard thresholds',
    ],
    planningAr: [
      'أتمتة تجديد المخزون: ضبط نقاط إعادة الطلب وكانبان في نظام ERP',
      'تقليل تكرار الطلبات باستخدام أوامر الشراء الإجمالية',
      'مراجعة بيانات الاستخدام سنوياً والتخلص من الأصناف البطيئة والمتكررة',
      'تفويض صلاحية الشراء للمستخدمين النهائيين عبر بطاقات P-card',
      'توحيد مجموعة المنتجات وتبسيطها',
    ],
    sourcingAr: [
      'استخدام الشراء الكتالوجي أو أسواق الشراء الإلكتروني',
      'الاستعانة بموزعين شاملين لتوحيد مئات الأصناف مع مورد واحد',
      'طلبات عروض أسعار مبسطة كل 2–3 سنوات',
      'دراسة مخزون التأمين للمستهلكات سريعة الحركة',
      'استخدام مجموعات الشراء أو الاتفاقيات الحكومية',
    ],
    negotiationAr: [
      'تفاوض على قوائم أسعار سنوية أو كتالوجات أسعار ثابتة',
      'استخدام حدود الحجم للحصول على خصومات تدريجية',
      'ركز على شروط الدفع (تمديد DPO) بدلاً من السعر',
      'قبول الشروط الموحدة للمورد للمعاملات ذات القيمة المنخفضة',
      'أتمتة قبول الكتالوجات المتفق عليها مسبقاً عبر ERP',
    ],
    supplierSelectionAr: [
      'الاختيار بناءً على السعر ووقت التسليم وسهولة الطلب',
      'تحديد قائمة الموردين المعتمدين بـ 1–2 مورد لكل فئة فرعية',
      'تفضيل الموردين مع تكامل الكتالوج الإلكتروني',
      'تقييم توفر الخدمة خارج أوقات العمل ومرونة التسليم',
      'استخدام أسعار السوق كمعيار قياسي',
    ],
    srmAr: [
      'علاقة معاملاتية بالكامل — لا حاجة لمدير علاقات متخصص',
      'المتابعة عبر مقاييس آلية: معدل مطابقة الفاتورة، OTIF، معدل الخطأ',
      'مراجعة سنوية للمورد وإعادة الطرح إذا كانت المدخرات المتاحة > 5%',
      'تطبيق بوابة الموردين والفوترة الإلكترونية',
      'إزالة الموردين غير المؤهلين من القائمة تلقائياً',
    ],
  },
};

// ─── AI Brief Builder ─────────────────────────────────────────────────────────

export function buildKraljicPrompt(
  scored: KraljicScored[],
  industryLabel: string,
  isAr: boolean,
): string {
  const totalSpend = scored.reduce((s, i) => s + i.annualSpend, 0);
  const byQ = (q: KraljicQuadrant) => scored.filter(i => i.quadrant === q);
  const strategic   = byQ('strategic');
  const leverage    = byQ('leverage');
  const bottleneck  = byQ('bottleneck');
  const nonCritical = byQ('non-critical');

  const fmt = (items: KraljicScored[]) =>
    items.map(i => `  - ${i.itemName || i.category} (spend: SAR ${i.annualSpend.toLocaleString()}, risk: ${i.supplyRiskScore}, impact: ${i.profitImpactScore})`).join('\n');

  return [
    `## Kraljic Procurement Portfolio Analysis — ${industryLabel}`,
    `Total portfolio spend: SAR ${totalSpend.toLocaleString()} across ${scored.length} items/categories`,
    '',
    `## Portfolio Distribution`,
    `- Strategic: ${strategic.length} items (SAR ${strategic.reduce((s,i)=>s+i.annualSpend,0).toLocaleString()})`,
    `- Leverage: ${leverage.length} items (SAR ${leverage.reduce((s,i)=>s+i.annualSpend,0).toLocaleString()})`,
    `- Bottleneck: ${bottleneck.length} items (SAR ${bottleneck.reduce((s,i)=>s+i.annualSpend,0).toLocaleString()})`,
    `- Non-Critical: ${nonCritical.length} items (SAR ${nonCritical.reduce((s,i)=>s+i.annualSpend,0).toLocaleString()})`,
    '',
    strategic.length  ? `## Strategic Items\n${fmt(strategic)}`  : '',
    leverage.length   ? `## Leverage Items\n${fmt(leverage)}`    : '',
    bottleneck.length ? `## Bottleneck Items\n${fmt(bottleneck)}` : '',
    '',
    '## Your Task',
    `Generate a 4–6 paragraph executive procurement portfolio brief for a ${industryLabel} organisation:`,
    '1. Summarise the portfolio health: balance of quadrants, spend concentration risk, supply risk exposure',
    '2. For Strategic items: recommend partnership strategies, specific supplier relationship investments',
    '3. For Leverage items: identify the top savings opportunity and how to execute competitive pressure',
    '4. For Bottleneck items: call out the highest-risk items and immediate risk-mitigation actions',
    '5. Close with a 90-day priority action plan covering the most critical sourcing and risk decisions',
    '6. Where relevant, reference Saudi Vision 2030 / GCC supply chain priorities: Iktva, local content, digitisation',
  ].filter(Boolean).join('\n');
}
