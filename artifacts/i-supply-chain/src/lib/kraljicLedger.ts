/**
 * Evidence and measurement ledger (Round B5, enrichment items 10 and 11 part).
 *
 * SOURCE LEDGER: every claim the module makes carries a status tag (verified
 * and opened, secondary, snippet only, member-only, unconfirmed, ISC synthesis),
 * the source and when it was opened. A badge appears wherever the claim is used.
 *
 * MEASUREMENT LEDGER: for each classified item ISC stores the scores, scoring
 * mode, reviewer, date and version; the movement trigger, persistence-test
 * result and hysteresis count; and outcome fields that follow the CIPS savings
 * rules (declared baseline, in-year and full-year, cost avoidance separate,
 * quality unchanged). It also derives portfolio-quality KPIs. Those KPIs
 * (classification stability, update frequency) are vendor-style suggestions:
 * labelled so. The aim is for ISC to build its own, honestly caveated,
 * evidence. ASSOCIATION IS NOT PROOF OF BENEFIT.
 *
 * STANDALONE-FIRST: no runtime imports.
 */

export type Bilingual = { en: string; ar: string };
type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';
const b = (en: string, ar: string): Bilingual => ({ en, ar });

export type EvidenceStatus = 'verified' | 'secondary' | 'snippet' | 'member-only' | 'unconfirmed' | 'isc-synthesis';

export const EVIDENCE_LABEL: Record<EvidenceStatus, Bilingual> = {
  verified: b('Verified: source opened', 'موثّق: فُتح المصدر'),
  secondary: b('Secondary source', 'مصدر ثانوي'),
  snippet: b('Snippet only', 'مقتطف فقط'),
  'member-only': b('Member-only: not read', 'للأعضاء فقط: لم يُقرأ'),
  unconfirmed: b('Not confirmed: not stated', 'غير مؤكد: لا يُذكر'),
  'isc-synthesis': b('ISC synthesis', 'تركيب من ISC'),
};

export interface SourceEntry {
  id: string;
  claim: Bilingual;
  status: EvidenceStatus;
  source: string;
  url?: string;
  /** When the source was opened. The plan records Oct to Nov 2026; no finer date was kept. */
  opened: string;
  lastChecked: string;
  limit: Bilingual;
}

const OPENED = 'Oct-Nov 2026';

export const SOURCE_LEDGER: SourceEntry[] = [
  { id: 'cips-names', claim: b('Quadrant names Critical, Leverage, Bottleneck, Routine (with Strategic and Non-critical as aliases) and the axes Risk impact and Cost impact.', 'أسماء الأرباع: حرج ونفوذ واختناق وروتيني (مع استراتيجي وغير حرج كمرادفين) والمحوران أثر المخاطر وأثر التكلفة.'), status: 'verified', source: 'CIPS Intelligence Hub, Kraljic matrix page', url: 'https://www.cips.org/intelligence-hub/supplier-relationship-management/kraljic-matrix', opened: OPENED, lastChecked: OPENED, limit: b('The diagram text did not extract cleanly.', 'لم يُستخرج نص المخطط بوضوح.') },
  { id: 'cips-seven-step', claim: b('Seven-step weighted scoring with risk and profit-potential factor lists.', 'تقييم مرجّح بسبع خطوات مع قوائم عوامل الخطر والربحية المحتملة.'), status: 'verified', source: 'CIPS, How to optimise purchasing costs with the Kraljic matrix', url: 'https://www.cips.org/intelligence-hub/supplier-relationship-management/kraljic-matrix-optimise-purchasing-costs', opened: OPENED, lastChecked: OPENED, limit: b('CIPS publishes no weights, cadence or triggers.', 'لا تنشر CIPS أوزانًا ولا فترات ولا محفّزات.') },
  { id: 'cips-sp', claim: b('Supplier Preferencing quadrants Core, Development, Exploitable, Nuisance, and the statement that the overlay gives 16 scenarios.', 'أرباع تفضيل المورد: أساسي وتطويري وقابل للاستغلال ومُزعج، والعبارة بأن التراكب يعطي 16 سيناريو.'), status: 'verified', source: 'CIPS Supplier Preferencing page', url: 'https://www.cips.org/intelligence-hub/supplier-relationship-management/supplier-preferencing', opened: OPENED, lastChecked: OPENED, limit: b('The 16 scenarios are not listed openly.', 'السيناريوهات الستة عشر غير مدرجة علنًا.') },
  { id: 'cips-savings', claim: b('Saving is measured against a baseline; cost avoidance is not a saving but is reported.', 'يُقاس الوفر مقابل سعر أساس؛ وتجنّب التكلفة ليس وفرًا لكنه يُعرض.'), status: 'verified', source: 'CIPS Position on Practice: Savings (2013)', opened: OPENED, lastChecked: OPENED, limit: b('No quadrant KPI mapping.', 'لا ربط بمؤشرات حسب الربع.') },
  { id: 'cips-gs64', claim: b('Required knowledge: portfolio analysis and supplier preferencing.', 'المعرفة المطلوبة: تحليل المحفظة وتفضيل الموردين.'), status: 'verified', source: 'CIPS Global Standard segment 6.4', url: 'https://globalstandard.cips.org/segments/segment-6.4-sourcing-processes-and-systems-in-procurement-and-supply/', opened: OPENED, lastChecked: OPENED, limit: b('Contract forms are not tied to quadrants.', 'أشكال العقود غير مرتبطة بالأرباع.') },
  { id: 'gvw', claim: b('Hold-or-move strategies per quadrant.', 'استراتيجيات «الإبقاء أو الانتقال» لكل ربع.'), status: 'verified', source: 'Gelderman & Van Weele (2003), full text', opened: OPENED, lastChecked: OPENED, limit: b('One note could not read the PDF; two did.', 'تعذّرت قراءة الملف في إحدى الملاحظات وقُرئ في اثنتين.') },
  { id: 'cips-member', claim: b('Per-quadrant contract types, negotiation styles, KPIs and the 16 scenarios.', 'أنواع العقود وأساليب التفاوض والمؤشرات لكل ربع والسيناريوهات الستة عشر.'), status: 'member-only', source: 'CIPS member guides', opened: OPENED, lastChecked: OPENED, limit: b('Titles and blurbs only. ISC claims none of this content.', 'عناوين ونبذ فقط. لا تدّعي ISC أيًّا من هذا المحتوى.') },
  { id: 'ppsd', claim: b('Analysis and due-diligence effort scale with supply positioning.', 'يتناسب جهد التحليل والعناية الواجبة مع موقع التوريد.'), status: 'verified', source: 'World Bank PPSD guidance (Aug 2024)', opened: OPENED, lastChecked: OPENED, limit: b('The Bank states no Kraljic mapping. The quadrant-to-tier map is ISC\'s.', 'لا يذكر البنك ربطًا بنموذج Kraljic. ربط الربع بالمستوى من ISC.') },
  { id: 'isc-movement', claim: b('Sub-types, persistence test, hysteresis, trigger rules and review intervals.', 'الأنواع الفرعية واختبار الاستمرارية والتثبيت وقواعد المحفّزات وفترات المراجعة.'), status: 'isc-synthesis', source: 'ISC method', opened: OPENED, lastChecked: OPENED, limit: b('No published source states these rules. Numbers are configurable defaults pending pilot data.', 'لا يذكر أي مصدر منشور هذه القواعد. الأرقام قيم افتراضية قابلة للتغيير بانتظار بيانات تجريبية.') },
  { id: 'sa-law', claim: b('Details of the new Saudi Government Tenders and Procurement Law (articles, ceilings, guarantees).', 'تفاصيل نظام المنافسات والمشتريات الحكومية السعودي الجديد (المواد والسقوف والضمانات).'), status: 'secondary', source: 'CMS, 20 Oct 2026', url: 'https://cms.law/en/sau/legal-updates/a-new-chapter-in-saudi-government-procurement-key-features-of-the-new-government-tenders-and-procurement-law', opened: OPENED, lastChecked: OPENED, limit: b('Law-firm summary, not the law text. In-force status not confirmed.', 'ملخص مكتب محاماة لا نص النظام. حالة النفاذ غير مؤكدة.') },
  { id: 'lcgpa', claim: b('Mandatory List of National Products and the 10% price preference.', 'قائمة المنتجات الوطنية الإلزامية وأفضلية السعر 10%.'), status: 'secondary', source: 'Argaam; Global Trade Alert; Ajel', opened: OPENED, lastChecked: OPENED, limit: b('Minimum local-content percentages not confirmed.', 'نسب الحد الأدنى للمحتوى المحلي غير مؤكدة.') },
  { id: 'qa-15', claim: b('A Qatar 15% domestic preference.', 'أفضلية محلية قطرية 15%.'), status: 'unconfirmed', source: 'Searched; no opened source states it', opened: OPENED, lastChecked: OPENED, limit: b('Do not state.', 'لا تذكره.') },
  { id: 'ar-terms', claim: b('Standard Arabic quadrant terms.', 'مصطلحات عربية معيارية للأرباع.'), status: 'isc-synthesis', source: 'No published standard found; ISC editorial wording', opened: OPENED, lastChecked: OPENED, limit: b('Practice mostly keeps the English names. Native-speaker review pending.', 'الممارسة تُبقي الأسماء الإنجليزية غالبًا. مراجعة متحدث أصلي معلّقة.') },
  { id: 'outcomes', claim: b('That segmenting suppliers improves cost, risk or performance.', 'أن تقسيم الموردين يحسّن التكلفة أو المخاطر أو الأداء.'), status: 'unconfirmed', source: 'No study found', opened: OPENED, lastChecked: OPENED, limit: b('ISC builds its own evidence through the measurement ledger.', 'تبني ISC أدلتها عبر سجل القياس.') },
];

export function evidenceFor(id: string): SourceEntry | undefined { return SOURCE_LEDGER.find((e) => e.id === id); }

// ---------------------------------------------------------------------------
// Measurement ledger
// ---------------------------------------------------------------------------

export interface Outcome {
  /** Declared baseline unit price. Without it no saving is counted. */
  baselinePrice: number | null;
  inYearSaving: number | null;
  fullYearSaving: number | null;
  /** Reported separately. Never added to savings. */
  costAvoidance: number | null;
  qualityUnchanged: boolean | null;
}

export interface LedgerEntry {
  id: string;
  supplierId: string;
  dateIso: string;
  quadrant: Quadrant;
  subtype: string | null;
  riskPct: number | null;
  profitPct: number | null;
  mode: 'cips-weighted' | 'manual';
  reviewer: string;
  version: string;
  trigger: 'calendar' | 'event' | null;
  persistence: 'short-shock' | 'structural' | null;
  hysteresisCount: number | null;
  outcome: Outcome;
  /** Optional pre/post comparison of any metric the user chooses, so ISC can build its own evidence. */
  metricName: string;
  pre: number | null;
  post: number | null;
  note: string;
}

export function emptyOutcome(): Outcome {
  return { baselinePrice: null, inYearSaving: null, fullYearSaving: null, costAvoidance: null, qualityUnchanged: null };
}

export const LEDGER_NOTE: Bilingual = b(
  'These measures build ISC\'s own evidence for your business. Stability and update-frequency KPIs are vendor-style suggestions, not standards. Association is not proof of benefit.',
  'تبني هذه المقاييس أدلة ISC الخاصة بعملك. مؤشرا الاستقرار وتكرار التحديث مقترحان بأسلوب الموردين وليسا معيارين. الارتباط ليس دليلًا على الفائدة.',
);

export interface LedgerKpis {
  entries: number;
  suppliers: number;
  /** Share of consecutive review pairs with the same quadrant. null until a supplier has two reviews. */
  classificationStability: number | null;
  /** Mean days between consecutive reviews of the same supplier. null until a supplier has two reviews. */
  meanDaysBetweenReviews: number | null;
  /** Suppliers whose first recorded quadrant was Bottleneck and latest is not. */
  movedOutOfBottleneck: number;
  savings: { inYear: number; fullYear: number; counted: number; skippedNoBaseline: number };
  costAvoidance: number;
  prePost: { n: number; meanChange: number | null };
}

function dayDiff(a: string, c: string): number {
  return Math.round((Date.parse(`${c}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function ledgerKpis(entries: LedgerEntry[]): LedgerKpis {
  const bySup = new Map<string, LedgerEntry[]>();
  for (const e of entries) bySup.set(e.supplierId, [...(bySup.get(e.supplierId) ?? []), e]);
  let same = 0, pairs = 0, gapSum = 0, moved = 0;
  for (const list of bySup.values()) {
    const s = [...list].sort((x, y) => x.dateIso.localeCompare(y.dateIso));
    for (let i = 1; i < s.length; i++) {
      pairs++; if (s[i].quadrant === s[i - 1].quadrant) same++;
      const d = dayDiff(s[i - 1].dateIso, s[i].dateIso); if (Number.isFinite(d)) gapSum += d;
    }
    if (s.length >= 2 && s[0].quadrant === 'bottleneck' && s[s.length - 1].quadrant !== 'bottleneck') moved++;
  }
  let inYear = 0, fullYear = 0, counted = 0, skipped = 0, avoid = 0;
  for (const e of entries) {
    const o = e.outcome;
    if (o.costAvoidance !== null && o.costAvoidance > 0) avoid += o.costAvoidance;
    const hasSaving = o.inYearSaving !== null || o.fullYearSaving !== null;
    if (!hasSaving) continue;
    if (o.baselinePrice === null || o.qualityUnchanged === false) { skipped++; continue; }
    counted++; inYear += o.inYearSaving ?? 0; fullYear += o.fullYearSaving ?? 0;
  }
  const pp = entries.filter((e) => e.pre !== null && e.post !== null);
  return {
    entries: entries.length, suppliers: bySup.size,
    classificationStability: pairs > 0 ? same / pairs : null,
    meanDaysBetweenReviews: pairs > 0 ? Math.round(gapSum / pairs) : null,
    movedOutOfBottleneck: moved,
    savings: { inYear: Math.round(inYear * 100) / 100, fullYear: Math.round(fullYear * 100) / 100, counted, skippedNoBaseline: skipped },
    costAvoidance: Math.round(avoid * 100) / 100,
    prePost: { n: pp.length, meanChange: pp.length ? Math.round((pp.reduce((t, e) => t + ((e.post as number) - (e.pre as number)), 0) / pp.length) * 100) / 100 : null },
  };
}

/** Movement log: every change of quadrant between consecutive reviews of the same supplier, with the recorded trigger. */
export interface MovementRow { supplierId: string; fromQuadrant: Quadrant; toQuadrant: Quadrant; dateIso: string; trigger: 'calendar' | 'event' | null; persistence: 'short-shock' | 'structural' | null; hysteresisCount: number | null }

export function movementLog(entries: LedgerEntry[]): MovementRow[] {
  const bySup = new Map<string, LedgerEntry[]>();
  for (const e of entries) bySup.set(e.supplierId, [...(bySup.get(e.supplierId) ?? []), e]);
  const rows: MovementRow[] = [];
  for (const [supplierId, list] of bySup) {
    const s = [...list].sort((x, y) => x.dateIso.localeCompare(y.dateIso));
    for (let i = 1; i < s.length; i++) {
      if (s[i].quadrant !== s[i - 1].quadrant) rows.push({ supplierId, fromQuadrant: s[i - 1].quadrant, toQuadrant: s[i].quadrant, dateIso: s[i].dateIso, trigger: s[i].trigger, persistence: s[i].persistence, hysteresisCount: s[i].hysteresisCount });
    }
  }
  return rows.sort((x, y) => y.dateIso.localeCompare(x.dateIso));
}
