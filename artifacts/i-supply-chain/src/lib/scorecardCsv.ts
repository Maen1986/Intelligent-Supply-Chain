/**
 * scorecardCsv.ts — Pure data helpers for Supplier Scorecard CSV export/import.
 *
 * Extracted from SupplierScorecard.tsx so the round-trip tests can exercise the
 * real transformation logic instead of hand-rolled mirrors that risk drifting.
 *
 * No DOM / side-effect imports — safe to use in Node/jsdom test environments.
 */

/* ─── Types ─── */

export interface SubIndicator {
  id: string;
  label: string;
  labelAr: string;
  note?: string;
  noteAr?: string;
}

export interface Dimension {
  id: string;
  label: string;
  labelAr: string;
  weight: number;
}

export interface SupplierRecord {
  id: string;
  name: string;
  tier: string;
  subScores: Record<string, Record<string, string>>; // dimId → { subId → value }
}

export interface ScorecardConfig {
  weights: Record<string, number>; // dimId → weight (0–100)
  tiers: { strategic: number; preferred: number };
}

/* ─── Dimensions ─── */

export const DIMS: Dimension[] = [
  { id: 'delivery',     label: 'Delivery Performance',  labelAr: 'أداء التسليم',          weight: 25 },
  { id: 'quality',      label: 'Quality',               labelAr: 'الجودة',                weight: 25 },
  { id: 'cost',         label: 'Cost Competitiveness',  labelAr: 'التنافسية السعرية',     weight: 20 },
  { id: 'compliance',   label: 'Compliance',            labelAr: 'الامتثال',              weight: 15 },
  { id: 'innovation',   label: 'Innovation',            labelAr: 'الابتكار',              weight: 10 },
  { id: 'relationship', label: 'Relationship Quality',  labelAr: 'جودة العلاقة',          weight:  5 },
];

/* ─── Sub-indicators — all scored 0–100 (100 = best performance) ─── */

export const SUB_INDICATORS: Record<string, SubIndicator[]> = {
  delivery: [
    { id: 'otif',      label: 'OTIF %',                             labelAr: 'OTIF %' },
    { id: 'lead_time', label: 'Lead Time Adherence %',              labelAr: 'الالتزام بمهلة التسليم %' },
    { id: 'fill_rate', label: 'Fill Rate %',                        labelAr: 'معدّل التعبئة %' },
    { id: 'expedite',  label: 'Low Expedite Rate score',            labelAr: 'انخفاض معدّل الطلبات الاستعجالية',
      note: '100 = zero emergency orders; deduct points for each expedite event',
      noteAr: '100 = لا طلبات استعجالية؛ اطرح نقاطاً عن كل حدث طارئ' },
  ],
  quality: [
    { id: 'defect',   label: 'Low Defect / Rejection Rate score',  labelAr: 'انخفاض معدّل العيوب / الرفض',
      note: '100 = zero defects; reduce score proportionally to defect rate',
      noteAr: '100 = لا عيوب؛ قلّل الدرجة بحسب نسبة العيوب' },
    { id: 'ftr',      label: 'First-Time-Right %',                  labelAr: 'معدّل الصحة من أول مرة %' },
    { id: 'cert',     label: 'Quality Cert Compliance %',           labelAr: 'الامتثال لشهادات الجودة %' },
    { id: 'nonconf',  label: 'Low Non-conformances score',          labelAr: 'انخفاض ملاحظات التدقيق',
      note: '100 = zero audit findings; deduct ~10 points per finding',
      noteAr: '100 = لا ملاحظات تدقيق؛ اطرح ~10 نقاط لكل ملاحظة' },
  ],
  cost: [
    { id: 'savings',        label: 'Price vs Market Benchmark (savings score)',  labelAr: 'الوفورات مقابل المعيار السوقي',
      note: 'Score 0–100 reflecting % savings versus market price',
      noteAr: 'درجة 0–100 تعكس % الوفورات مقارنةً بالسعر السوقي' },
    { id: 'invoice',        label: 'Invoice Accuracy %',                         labelAr: 'دقّة الفواتير %' },
    { id: 'cost_reduction', label: 'Cost Reduction YoY score',                   labelAr: 'درجة خفض التكلفة السنوي',
      note: '100 = ≥10% YoY reduction; 50 = flat; 0 = cost increased',
      noteAr: '100 = خفض ≥10% سنوياً؛ 50 = مستقر؛ 0 = ارتفاع التكلفة' },
    { id: 'tco',            label: 'TCO Transparency Score',                      labelAr: 'درجة شفافية إجمالي تكلفة الملكية',
      note: 'Rate 0–100: how fully the supplier discloses total cost of ownership',
      noteAr: 'قيّم 0–100: مدى إفصاح المورّد الكامل عن إجمالي تكلفة الملكية' },
  ],
  compliance: [
    { id: 'regulatory', label: 'Regulatory Compliance %',       labelAr: 'الامتثال التنظيمي %' },
    { id: 'esg',        label: 'ESG Audit Score',                labelAr: 'درجة تدقيق ESG',
      note: 'Score 0–100 from most recent ESG / sustainability assessment',
      noteAr: 'درجة 0–100 من أحدث تقييم ESG / الاستدامة' },
    { id: 'docs',       label: 'Document Completeness %',       labelAr: 'اكتمال الوثائق %' },
    { id: 'ethics',     label: 'Ethical Trading Score',          labelAr: 'درجة التداول الأخلاقي',
      note: 'Rate 0–100: code of conduct, modern slavery, anti-bribery adherence',
      noteAr: 'قيّم 0–100: قواعد السلوك، مكافحة العمل القسري، مكافحة الرشوة' },
  ],
  innovation: [
    { id: 'ideas',       label: 'Ideas Submitted score',           labelAr: 'درجة الأفكار المقدّمة',
      note: '100 = ≥10 improvement ideas contributed per year',
      noteAr: '100 = ≥10 أفكار تحسين سنوياً' },
    { id: 'implemented', label: 'Implemented Suggestions %',       labelAr: 'نسبة الاقتراحات المطبَّقة %' },
    { id: 'tech',        label: 'Technology Readiness Score',      labelAr: 'درجة الجاهزية التكنولوجية',
      note: 'Rate 0–100: e-invoicing, EDI, data sharing, digital procurement capabilities',
      noteAr: 'قيّم 0–100: الفاتورة الإلكترونية، EDI، مشاركة البيانات، المشتريات الرقمية' },
  ],
  relationship: [
    { id: 'responsiveness', label: 'Responsiveness Score',          labelAr: 'درجة سرعة الاستجابة',
      note: '100 = responds within 2 hours; reduce for slower response',
      noteAr: '100 = استجابة خلال ساعتين؛ قلّل عن كل تأخير' },
    { id: 'resolution',     label: 'Issue Resolution Speed score',  labelAr: 'درجة سرعة حلّ المشكلات',
      note: '100 = resolves issues within 1 business day',
      noteAr: '100 = حلّ المشكلات خلال يوم عمل واحد' },
    { id: 'collaboration',  label: 'Collaboration Score',           labelAr: 'درجة التعاون',
      note: 'Rate 0–100: joint planning, JBP engagement, information transparency',
      noteAr: 'قيّم 0–100: التخطيط المشترك، خطة الأعمال المشتركة، شفافية المعلومات' },
  ],
};

/* ─── Score helpers ─── */

/** Average of all entered sub-indicator values for a dimension (0–100), or null if none. */
export function calcDimScore(
  dimId: string,
  subScores: Record<string, Record<string, string>>,
): number | null {
  const subs = SUB_INDICATORS[dimId] ?? [];
  const vals = subs
    .map(s => parseFloat(subScores[dimId]?.[s.id] ?? ''))
    .filter(v => !isNaN(v) && v >= 0);
  if (vals.length === 0) return null;
  return Math.min(100, Math.max(0, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)));
}

const TIERS = [
  { label: 'Strategic',     min: 75 },
  { label: 'Preferred',     min: 55 },
  { label: 'Transactional', min:  0 },
];

export function getTier(score: number, config: ScorecardConfig) {
  if (score >= config.tiers.strategic) return TIERS[0];
  if (score >= config.tiers.preferred) return TIERS[1];
  return TIERS[2];
}

export function calcWeightedScore(
  subScores: Record<string, Record<string, string>>,
  config: ScorecardConfig,
): number | null {
  const dimScores = DIMS.map(d => calcDimScore(d.id, subScores));
  if (dimScores.some(s => s === null)) return null;
  const totalWeight = DIMS.reduce((s, d) => s + (config.weights[d.id] ?? d.weight), 0);
  if (totalWeight === 0) return null;
  return Math.round(
    DIMS.reduce((sum, d, i) => sum + ((dimScores[i] as number) / 100) * (config.weights[d.id] ?? d.weight), 0) / totalWeight * 100,
  );
}

/* ─── Public pure functions ─── */

/**
 * Builds the raw CSV string for a list of supplier records.
 *
 * When `config` is provided the Weighted Score and Calculated Tier columns are
 * computed; when omitted they are left blank (useful in tests that only care
 * about the sub-indicator round-trip).
 *
 * Does NOT touch the DOM or trigger any download — all side-effects (Blob,
 * URL.createObjectURL, anchor click) live in the component's exportToCSV wrapper.
 */
export function buildScorecardCsvString(
  suppliers: SupplierRecord[],
  config?: ScorecardConfig,
): string {
  const dimHeaders = DIMS.map(d => `${d.label} Score (/100)`);
  const subHeaders: string[] = [];
  DIMS.forEach(d => {
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      subHeaders.push(`${d.label} — ${sub.label}`);
    });
  });
  const headers = [
    'Supplier Name', 'Current Tier',
    ...dimHeaders,
    ...subHeaders,
    'Weighted Score (/100)', 'Calculated Tier',
  ];

  const rows = suppliers.map(s => {
    const dimScores = DIMS.map(d => {
      const sc = calcDimScore(d.id, s.subScores);
      return sc !== null ? String(sc) : '';
    });
    const subVals: string[] = [];
    DIMS.forEach(d => {
      (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
        subVals.push(s.subScores[d.id]?.[sub.id] ?? '');
      });
    });
    let weightedCell = '';
    let tierCell = '';
    if (config) {
      const ws = calcWeightedScore(s.subScores, config);
      weightedCell = ws !== null ? String(ws) : '';
      tierCell     = ws !== null ? getTier(ws, config).label : '';
    }
    return [
      s.name || 'New Supplier',
      s.tier,
      ...dimScores,
      ...subVals,
      weightedCell,
      tierCell,
    ];
  });

  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
}

/**
 * Maps a single parsed CSV row (header → value) back to the nested sub-scores
 * structure `{ dimId → { subId → value } }`.
 *
 * Values outside [0, 100] are rejected and reported in `errors`.
 * Blank cells are silently skipped (treated as "not entered").
 */
export function parseSubScoresFromRow(row: Record<string, string>): {
  subScores: Record<string, Record<string, string>>;
  errors: string[];
} {
  const subColToIds: Record<string, { dimId: string; subId: string }> = {};
  const subHeaders: string[] = [];
  DIMS.forEach(d => {
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      const col = `${d.label} — ${sub.label}`;
      subHeaders.push(col);
      subColToIds[col] = { dimId: d.id, subId: sub.id };
    });
  });

  const subScores: Record<string, Record<string, string>> = {};
  const errors: string[] = [];

  subHeaders.forEach(col => {
    const val = row[col]?.trim();
    if (val !== undefined && val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        const { dimId, subId } = subColToIds[col];
        if (!subScores[dimId]) subScores[dimId] = {};
        subScores[dimId][subId] = val;
      } else {
        errors.push(`"${col}" value "${val}" must be 0–100 — ignored.`);
      }
    }
  });

  return { subScores, errors };
}
