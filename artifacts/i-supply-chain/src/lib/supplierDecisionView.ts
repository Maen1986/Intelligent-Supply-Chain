/**
 * SI Module 07 -- Supplier Decision View + Weekly Action List (Round B2, Nov 2026).
 *
 * This is the layer that turns M07's detection into something a category
 * manager can act on on Monday morning, and that a procurement head or a
 * consultant can defend in a supplier review. It answers, per supplier:
 *   1. Whose problem is it? (cause mix -- supplier / client / shared /
 *      external / measurement / unassessed)
 *   2. What should we do? A PRIMARY recommendation AND a strong ALTERNATIVE,
 *      with the trade-off stated (ISC standing rule 8 -- never a single path).
 *   3. What does it cost, and what is the evidence? (COPQ, exposure, CARs)
 *   4. Did the last fix actually work? (recovery verification)
 *   5. What should happen this week, who owns it, and by when?
 *
 * Linked modules (real imports, not mirrored text):
 *   - M07 supplierPerformanceRecovery / supplierRecoveryPortfolio: detection,
 *     recurrence, shock, recovery verification.
 *   - M01 supplierCOPQ (via the portfolio layer): costed failure cost.
 *   - M02 supplierSourcingStrategy: quadrant-specific solution set and the
 *     ideal relationship posture.
 *   - M05 supplierConcentration: HHI band for the supplier's category, when
 *     the client supplied spend for every supplier in it.
 *   - M06 / M03: an evidence package is produced for the commercial
 *     (negotiation) and contract (remedy) conversations. This file does not
 *     run those engines; it hands them verified facts.
 *
 * Disclosed, caller-overridable defaults: the due-date cadence and the
 * "shared evidence" thresholds below are ISC defaults, not an external
 * standard, and are labelled as such in every output.
 */
import {
  detectSupplier,
  computeSupplierExposure,
  deriveImpactsFromCars,
  verifyRecovery,
  type SupplierRecord,
  type SupplierDetection,
  type ExposureResult,
  type RecoveryVerification,
  type KraljicItemLite,
  type SupplierCategoryShare,
} from './supplierRecoveryPortfolio';
import { computeCOPQRollup, type CARRecord as COPQCar } from './supplierCOPQ';
import { buildSolutionSet, IDEAL_POSTURE_BY_QUADRANT, type SolutionAction } from './supplierSourcingStrategy';
import { computeHHI, bandForHHI, type ConcentrationBand } from './supplierConcentration';
import type { InterventionType, PerformanceCause } from './supplierPerformanceRecovery';

export type Bilingual = { en: string; ar: string };

// ---------------------------------------------------------------------------
// 1. Cause mix -- "is it really the supplier's fault?"
// ---------------------------------------------------------------------------

export type CauseKey = PerformanceCause | 'unassessed';

export interface CauseMix {
  counts: Record<CauseKey, number>;
  total: number;
  assessed: number;
  /** Share of ASSESSED CARs that are supplier-caused; null when none assessed. */
  supplierCausedPctOfAssessed: number | null;
  /** Share of assessed CARs whose cause sits on our side or outside the supplier. */
  notSupplierCausedPctOfAssessed: number | null;
  dominant: CauseKey | null;
}

export function computeCauseMix(s: SupplierRecord): CauseMix {
  const counts: Record<CauseKey, number> = { supplier: 0, client: 0, shared: 0, external: 0, measurement: 0, unassessed: 0 };
  for (const c of s.cars) counts[c.cause ?? 'unassessed']++;
  const total = s.cars.length;
  const assessed = total - counts.unassessed;
  const sup = counts.supplier;
  const notSup = counts.client + counts.external + counts.measurement;
  let dominant: CauseKey | null = null;
  let max = 0;
  (Object.keys(counts) as CauseKey[]).forEach((k) => { if (counts[k] > max) { max = counts[k]; dominant = k; } });
  return {
    counts, total, assessed,
    supplierCausedPctOfAssessed: assessed ? Math.round((1000 * sup) / assessed) / 10 : null,
    notSupplierCausedPctOfAssessed: assessed ? Math.round((1000 * notSup) / assessed) / 10 : null,
    dominant,
  };
}

/** ISC default: when at least this share of ASSESSED CARs (and at least this
 * many assessed CARs) sit outside the supplier, "fix our side first" outranks
 * escalating the supplier. Caller-overridable. */
export const FIX_OUR_SIDE_MIN_PCT = 50;
export const FIX_OUR_SIDE_MIN_ASSESSED = 2;

// ---------------------------------------------------------------------------
// 2. Recommendation catalogue (primary + alternative, trade-off explicit)
// ---------------------------------------------------------------------------

export type ActionKey =
  | 'FIX_OUR_SIDE' | 'MONITOR' | 'CHECK_IN' | 'DEVELOPMENT_PLAN' | 'FORMAL_SCAR'
  | 'JOINT_REDESIGN' | 'QUALIFY_SECOND_SOURCE' | 'CONTRACT_REMEDY' | 'COMPETITIVE_RFP' | 'EXIT_PLAN';

export interface ActionOption {
  key: ActionKey;
  title: Bilingual;
  whatToDo: Bilingual;
  timeframe: 'same day' | 'this week' | '2-4 weeks' | 'quarter+';
  effort: 'Low' | 'Medium' | 'High';
}

export const ACTION_CATALOGUE: Record<ActionKey, ActionOption> = {
  FIX_OUR_SIDE: {
    key: 'FIX_OUR_SIDE', timeframe: 'this week', effort: 'Low',
    title: { en: 'Fix our side first', ar: 'ابدأ بإصلاح جانبنا' },
    whatToDo: { en: 'Review our own POs, forecasts, specifications and measurement method behind these CARs before asking the supplier to change anything.', ar: 'راجع أوامر الشراء والتوقعات والمواصفات وطريقة القياس لدينا خلف هذه الطلبات قبل أن تطلب من المورد تغيير أي شيء.' },
  },
  MONITOR: {
    key: 'MONITOR', timeframe: '2-4 weeks', effort: 'Low',
    title: { en: 'Monitor at standard cadence', ar: 'المتابعة بالوتيرة المعتادة' },
    whatToDo: { en: 'No intervention. Keep the normal review cycle and watch the next period.', ar: 'لا تدخّل. حافظ على دورة المراجعة المعتادة وراقب الفترة القادمة.' },
  },
  CHECK_IN: {
    key: 'CHECK_IN', timeframe: 'this week', effort: 'Low',
    title: { en: 'Pre-emptive check-in call', ar: 'مكالمة متابعة استباقية' },
    whatToDo: { en: 'Short call with the supplier account owner to share the data and ask what they see.', ar: 'مكالمة قصيرة مع مسؤول الحساب لدى المورد لمشاركة البيانات ومعرفة رؤيته.' },
  },
  DEVELOPMENT_PLAN: {
    key: 'DEVELOPMENT_PLAN', timeframe: '2-4 weeks', effort: 'Medium',
    title: { en: 'Joint development plan', ar: 'خطة تطوير مشتركة' },
    whatToDo: { en: 'Agree one capability gap, a target KPI, 2-3 milestones and who supports what; verify with the next periods\' scores.', ar: 'اتفق على فجوة قدرة واحدة ومؤشر مستهدف و2-3 مراحل ومن يدعم ماذا؛ وتحقق عبر درجات الفترات التالية.' },
  },
  FORMAL_SCAR: {
    key: 'FORMAL_SCAR', timeframe: 'this week', effort: 'Medium',
    title: { en: 'Formal SCAR with a dated deadline', ar: 'طلب إجراء تصحيحي رسمي بموعد محدد' },
    whatToDo: { en: 'Issue a formal Supplier Corrective Action Request (8D) with a root-cause deadline and a verification date.', ar: 'أصدر طلب إجراء تصحيحي رسمي للمورد (8D) بموعد لتحديد السبب الجذري وتاريخ للتحقق.' },
  },
  JOINT_REDESIGN: {
    key: 'JOINT_REDESIGN', timeframe: 'quarter+', effort: 'High',
    title: { en: 'Joint process redesign', ar: 'إعادة تصميم العملية بشكل مشترك' },
    whatToDo: { en: 'Map the failing process end to end with the supplier and redesign the step the root cause sits in.', ar: 'ارسم العملية المتعثرة من البداية للنهاية مع المورد وأعد تصميم الخطوة التي يقع فيها السبب الجذري.' },
  },
  QUALIFY_SECOND_SOURCE: {
    key: 'QUALIFY_SECOND_SOURCE', timeframe: 'quarter+', effort: 'High',
    title: { en: 'Qualify a second source', ar: 'تأهيل مصدر ثانٍ' },
    whatToDo: { en: 'Open a parallel qualification track now; keep the incumbent as primary until the second source is proven.', ar: 'افتح مسار تأهيل موازياً الآن؛ وأبقِ المورد الحالي أساسياً إلى أن يثبت المصدر الثاني.' },
  },
  CONTRACT_REMEDY: {
    key: 'CONTRACT_REMEDY', timeframe: '2-4 weeks', effort: 'Medium',
    title: { en: 'Enforce or add a contractual remedy', ar: 'تفعيل أو إضافة علاج تعاقدي' },
    whatToDo: { en: 'Use the evidence package to invoke the existing SLA/penalty clause, or negotiate service credits and a step-in right (see Modules 06 and 03).', ar: 'استخدم حزمة الأدلة لتفعيل بند اتفاقية الخدمة/الغرامة القائم، أو تفاوض على اعتمادات خدمة وحق التدخل (راجع الوحدتين 06 و03).' },
  },
  COMPETITIVE_RFP: {
    key: 'COMPETITIVE_RFP', timeframe: '2-4 weeks', effort: 'Medium',
    title: { en: 'Competitive RFP to replace', ar: 'طلب عروض تنافسي للاستبدال' },
    whatToDo: { en: 'Run a competitive RFP with at least 3 qualified alternatives; use the evidence package as the incumbent baseline.', ar: 'نفّذ طلب عروض تنافسياً مع 3 بدائل مؤهلة على الأقل؛ واستخدم حزمة الأدلة كخط أساس للمورد الحالي.' },
  },
  EXIT_PLAN: {
    key: 'EXIT_PLAN', timeframe: 'quarter+', effort: 'High',
    title: { en: 'Prepare a managed exit', ar: 'إعداد خروج منظّم' },
    whatToDo: { en: 'Plan the transition (alternative supplier, stock buffer, contract notice) before telling the supplier.', ar: 'خطّط للانتقال (مورد بديل، مخزون احتياطي، إشعار العقد) قبل إبلاغ المورد.' },
  },
};

export interface Recommendation {
  primary: ActionOption;
  alternative: ActionOption;
  /** Why the primary won. */
  why: Bilingual;
  /** What you give up by NOT taking the primary (i.e. what the alternative costs/risks). */
  tradeoff: Bilingual;
  /** The rule that produced this -- shown, never hidden. */
  ruleSource: Bilingual;
  /** Quadrant-specific M02 actions to attach (real, not paraphrased). */
  quadrantActions: SolutionAction[];
  idealPosture: string;
}

const RULE_SOURCE: Bilingual = {
  en: 'ISC decision rule: M07 escalation ladder (8D/SCAR) x cause mix x Kraljic replaceability (M02) x category concentration (M05, HHI). A decision aid with a disclosed rule, not an external standard.',
  ar: 'قاعدة قرار ISC: سلّم التصعيد في الوحدة 07 (8D/SCAR) × مزيج الأسباب × قابلية الاستبدال حسب كرالييك (الوحدة 02) × تركّز الفئة (الوحدة 05، HHI). أداة دعم قرار بقاعدة معلنة، وليست معياراً خارجياً.',
};

export function recommend(
  detection: SupplierDetection,
  mix: CauseMix,
  quadrant: SupplierRecord['quadrant'],
  recovery: RecoveryVerification,
  concentrationBand: ConcentrationBand | null,
): Recommendation {
  const A = ACTION_CATALOGUE;
  const rung: InterventionType = detection.recommendedIntervention;
  const hardToReplace = quadrant === 'strategic' || quadrant === 'bottleneck';
  const highConc = concentrationBand === 'highlyConcentrated';
  const base = { quadrantActions: buildSolutionSet(quadrant), idealPosture: IDEAL_POSTURE_BY_QUADRANT[quadrant], ruleSource: RULE_SOURCE };

  const notSupplierPct = mix.notSupplierCausedPctOfAssessed;
  const oursFirst = mix.assessed >= FIX_OUR_SIDE_MIN_ASSESSED && notSupplierPct !== null && notSupplierPct >= FIX_OUR_SIDE_MIN_PCT;

  if (oursFirst && rung !== 'REPAIR') {
    return {
      ...base, primary: A.FIX_OUR_SIDE, alternative: A.DEVELOPMENT_PLAN,
      why: { en: `${notSupplierPct}% of the assessed CARs are not supplier-caused (our side, external or measurement). Escalating the supplier would punish a problem it does not own.`, ar: `${notSupplierPct}% من الطلبات المقيَّمة ليست بسبب المورد (جانبنا أو خارجية أو قياس). تصعيد المورد سيعاقبه على مشكلة لا يملكها.` },
      tradeoff: { en: 'Alternative: a joint development plan now. Faster pressure on the supplier, but it risks souring the relationship and leaves our own root causes in place.', ar: 'البديل: خطة تطوير مشتركة الآن. ضغط أسرع على المورد، لكنه قد يضر العلاقة ويُبقي أسبابنا الجذرية قائمة.' },
    };
  }

  if (recovery.status === 'CLOSED_NOT_RECOVERED' && rung === 'REPAIR') {
    return {
      ...base, primary: A.FORMAL_SCAR, alternative: A.CHECK_IN,
      why: { en: 'The last CAR was closed but the score did not recover afterwards. A closed CAR is not a fixed problem.', ar: 'أُغلق آخر طلب لكن الدرجة لم تتعافَ بعده. إغلاق الطلب لا يعني حل المشكلة.' },
      tradeoff: { en: 'Alternative: a check-in call. Lighter and keeps goodwill, but gives no deadline and no formal record if it recurs.', ar: 'البديل: مكالمة متابعة. أخف وتحفظ حسن النية، لكنها بلا موعد نهائي وبلا سجل رسمي إن تكررت المشكلة.' },
    };
  }

  switch (rung) {
    case 'REPAIR':
      return {
        ...base, primary: detection.trend === 'declining' ? A.CHECK_IN : A.MONITOR, alternative: A.CHECK_IN,
        why: { en: 'No recurrence and no escalation signal. Standard cadence is proportionate.', ar: 'لا تكرار ولا إشارة تصعيد. الوتيرة المعتادة مناسبة.' },
        tradeoff: { en: 'Alternative: act earlier with a check-in. Costs little, but spends attention on a supplier that is not showing a problem yet.', ar: 'البديل: التحرك مبكراً بمكالمة. كلفتها قليلة لكنها تصرف الانتباه على مورد لم تظهر عنده مشكلة بعد.' },
      };
    case 'DEVELOP':
    case 'COLLABORATE':
      return {
        ...base, primary: A.DEVELOPMENT_PLAN, alternative: A.FORMAL_SCAR,
        why: { en: 'The score is declining but the root cause has not repeated. Building capability is cheaper than replacing it.', ar: 'الدرجة في تراجع لكن السبب الجذري لم يتكرر. بناء القدرة أرخص من الاستبدال.' },
        tradeoff: { en: 'Alternative: a formal SCAR. Creates a dated record and pressure sooner, but is adversarial and can slow cooperation from a supplier we may want to keep.', ar: 'البديل: طلب إجراء تصحيحي رسمي. يوفر سجلاً مؤرخاً وضغطاً أسرع، لكنه صدامي وقد يبطئ تعاون مورد قد نرغب في الإبقاء عليه.' },
      };
    case 'REDESIGN':
      return {
        ...base, primary: A.JOINT_REDESIGN, alternative: A.QUALIFY_SECOND_SOURCE,
        why: { en: 'The same root cause has recurred: the earlier fix did not hold, so the process itself needs changing.', ar: 'تكرر السبب الجذري نفسه: الإصلاح السابق لم يصمد، فالعملية نفسها تحتاج إلى تغيير.' },
        tradeoff: { en: 'Alternative: qualify a second source. Reduces dependency sooner, but is slow and costly and does not fix the incumbent.', ar: 'البديل: تأهيل مصدر ثانٍ. يقلل الاعتماد أسرع لكنه بطيء ومكلف ولا يصلح المورد الحالي.' },
      };
    default: {
      // DUAL_SOURCE, MULTI_SOURCE, REPLACE, EXIT
      if (hardToReplace || highConc) {
        return {
          ...base, primary: A.QUALIFY_SECOND_SOURCE, alternative: A.CONTRACT_REMEDY,
          why: { en: `The root cause has recurred ${detection.recurrenceCount}x. ${hardToReplace ? 'This is a hard-to-replace (strategic/bottleneck) supplier' : 'The category is highly concentrated'}, so exit is not a safe first move: build a second source while keeping the incumbent.`, ar: `تكرر السبب الجذري ${detection.recurrenceCount} مرات. ${hardToReplace ? 'هذا مورد يصعب استبداله (استراتيجي/اختناق)' : 'الفئة شديدة التركّز'}، فالخروج ليس خطوة أولى آمنة: ابنِ مصدراً ثانياً مع الإبقاء على المورد الحالي.` },
          tradeoff: { en: 'Alternative: enforce or strengthen the contractual remedy. Faster and cheaper, but leaves the single-source risk fully in place.', ar: 'البديل: تفعيل العلاج التعاقدي أو تقويته. أسرع وأرخص لكنه يُبقي مخاطر المصدر الواحد قائمة بالكامل.' },
        };
      }
      return {
        ...base, primary: A.COMPETITIVE_RFP, alternative: A.QUALIFY_SECOND_SOURCE,
        why: { en: `The root cause has recurred ${detection.recurrenceCount}x and the supplier is replaceable (${quadrant}). A competitive RFP resets price and performance.`, ar: `تكرر السبب الجذري ${detection.recurrenceCount} مرات والمورد قابل للاستبدال (${quadrant}). طلب العروض التنافسي يعيد ضبط السعر والأداء.` },
        tradeoff: { en: 'Alternative: qualify a second source and split volume. Lower disruption, but you keep paying an underperformer for part of the volume.', ar: 'البديل: تأهيل مصدر ثانٍ وتقسيم الكميات. اضطراب أقل، لكنك تستمر بالدفع لمورد ضعيف الأداء عن جزء من الكمية.' },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Per-supplier decision view
// ---------------------------------------------------------------------------

export interface PortfolioContext {
  asOfIso: string;
  categoryItems: KraljicItemLite[];
  shares: SupplierCategoryShare[];
  /** Everyone, so category concentration can be computed from real spend. */
  allSuppliers: SupplierRecord[];
  /** Round C #668 (scale): peers grouped by category, built once by buildDecisions. Optional -- computed on demand when absent. */
  peersByCategory?: Map<string, SupplierRecord[]>;
}

export interface CategoryConcentration {
  category: string;
  hhi: number | null;
  band: ConcentrationBand | null;
  supplierSharePct: number | null;
  basis: 'client-supplied-spend' | 'INSUFFICIENT_DATA';
}

/** HHI per category from REAL client spend (M05). Computed only when every
 * supplier in the category has a spend figure; otherwise INSUFFICIENT_DATA --
 * a partial set would understate concentration. */
export function groupPeersByCategory(all: SupplierRecord[]): Map<string, SupplierRecord[]> {
  const m = new Map<string, SupplierRecord[]>();
  for (const x of all) { if (!x.category) continue; const g = m.get(x.category); if (g) g.push(x); else m.set(x.category, [x]); }
  return m;
}

export function computeCategoryConcentration(all: SupplierRecord[], supplier: SupplierRecord, peersByCategory?: Map<string, SupplierRecord[]>): CategoryConcentration {
  const peers = peersByCategory
    ? (supplier.category ? peersByCategory.get(supplier.category) ?? [] : [])
    : all.filter((x) => x.category && x.category === supplier.category);
  const allHaveSpend = peers.length >= 2 && peers.every((p) => typeof p.annualSpendSAR === 'number' && p.annualSpendSAR! > 0);
  if (!allHaveSpend) return { category: supplier.category, hhi: null, band: null, supplierSharePct: null, basis: 'INSUFFICIENT_DATA' };
  const total = peers.reduce((a, p) => a + p.annualSpendSAR!, 0);
  const shares = peers.map((p) => (100 * p.annualSpendSAR!) / total);
  const hhi = Math.round(computeHHI(shares));
  return {
    category: supplier.category, hhi, band: bandForHHI(hhi),
    supplierSharePct: Math.round((1000 * supplier.annualSpendSAR!) / total) / 10, basis: 'client-supplied-spend',
  };
}

export interface EvidencePackage {
  supplierId: string;
  supplierName: string;
  asOfIso: string;
  causeCounts: Record<CauseKey, number>;
  recurrenceCount: number;
  costedCOPQUSD: number | null;
  costedCarCount: number;
  totalCarCount: number;
  openCarIds: string[];
  recoveryStatus: RecoveryVerification['status'];
  handoffTo: Array<{ module: 'M06' | 'M03'; purposeEn: string; purposeAr: string }>;
}

export interface SupplierDecision {
  supplier: SupplierRecord;
  detection: SupplierDetection;
  mix: CauseMix;
  recovery: RecoveryVerification;
  exposure: ExposureResult;
  copq: { totalUSD: number | null; externalSharePct: number | null; costedCars: number };
  concentration: CategoryConcentration;
  recommendation: Recommendation;
  signals: Signal[];
  tier: Tier;
  evidence: EvidencePackage;
}

export type Tier = 'critical' | 'high' | 'medium' | 'low';

export interface Signal {
  key: string;
  label: Bilingual;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** ISC default: a CAR open longer than this is overdue (matches the 90-day cohort standard used on the portfolio page). */
export const OVERDUE_CAR_DAYS = 90;

export function buildSupplierDecision(s: SupplierRecord, ctx: PortfolioContext): SupplierDecision {
  const detection = detectSupplier(s);
  const mix = computeCauseMix(s);
  const recovery = verifyRecovery(s);
  const exposure = computeSupplierExposure(s, ctx.categoryItems, ctx.shares);
  const concentration = computeCategoryConcentration(ctx.allSuppliers, s, ctx.peersByCategory);

  const { impacts, overrides } = deriveImpactsFromCars(s.cars);
  let copq: SupplierDecision['copq'] = { totalUSD: null, externalSharePct: null, costedCars: impacts.length };
  if (s.cars.length > 0 && impacts.length > 0) {
    const cars: COPQCar[] = s.cars.map((c) => ({ id: c.id, supplierId: c.supplierId, category: c.category, rootCause: c.rootCause, status: c.status, createdAt: c.createdAt, closedAt: c.closedAt }));
    const r = computeCOPQRollup({ periodLabel: 'supplier', asOfIso: ctx.asOfIso, cars, impacts, overrides });
    const classified = r.internalFailure.carCount + r.externalFailure.carCount;
    copq = { totalUSD: r.totalCostedUSD, externalSharePct: classified ? Math.round((1000 * r.externalFailure.carCount) / classified) / 10 : null, costedCars: impacts.length };
  }

  const recommendation = recommend(detection, mix, s.quadrant, recovery, concentration.band);

  const signals: Signal[] = [];
  const oldestOpen = s.cars.filter((c) => c.status !== 'closed').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const openDays = oldestOpen ? daysBetween(oldestOpen.createdAt, ctx.asOfIso) : null;
  if (openDays !== null && openDays > OVERDUE_CAR_DAYS) signals.push({ key: 'overdue-car', label: { en: `CAR open ${openDays} days (over ${OVERDUE_CAR_DAYS})`, ar: `طلب مفتوح منذ ${openDays} يوماً (أكثر من ${OVERDUE_CAR_DAYS})` } });
  if (detection.recurrenceCount >= 1) signals.push({ key: 'recurrence', label: { en: `Same root cause repeated ${detection.recurrenceCount}x`, ar: `تكرر السبب الجذري نفسه ${detection.recurrenceCount} مرات` } });
  if (detection.shockFlag) signals.push({ key: 'shock', label: { en: 'Sudden single-period drop', ar: 'هبوط مفاجئ في فترة واحدة' } });
  if (detection.trend === 'declining') signals.push({ key: 'declining', label: { en: 'Declining trend', ar: 'اتجاه متراجع' } });
  if (detection.combinedSignalFlag) signals.push({ key: 'combined', label: { en: 'High variability and recurrence together', ar: 'تذبذب مرتفع مع تكرار' } });
  if (recovery.status === 'CLOSED_NOT_RECOVERED') signals.push({ key: 'not-recovered', label: { en: 'CAR closed but score did not recover', ar: 'أُغلق الطلب لكن الدرجة لم تتعافَ' } });
  if ((copq.externalSharePct ?? 0) > 0) signals.push({ key: 'external-failure', label: { en: 'Failure reached the customer', ar: 'وصل الفشل إلى العميل' } });

  const tier = computeTier(detection, signals);
  const evidence: EvidencePackage = {
    supplierId: s.supplierId, supplierName: s.name, asOfIso: ctx.asOfIso,
    causeCounts: mix.counts, recurrenceCount: detection.recurrenceCount,
    costedCOPQUSD: copq.totalUSD, costedCarCount: copq.costedCars, totalCarCount: s.cars.length,
    openCarIds: s.cars.filter((c) => c.status !== 'closed').map((c) => c.id),
    recoveryStatus: recovery.status,
    handoffTo: [
      { module: 'M06', purposeEn: 'Negotiation leverage and service-credit discussion: use cause mix, recurrence and costed COPQ as facts.', purposeAr: 'نفوذ التفاوض ومناقشة اعتمادات الخدمة: استخدم مزيج الأسباب والتكرار وتكلفة COPQ كحقائق.' },
      { module: 'M03', purposeEn: 'Contract remedy check: confirm the SLA/penalty/step-in clauses this evidence can invoke.', purposeAr: 'فحص العلاج التعاقدي: تأكد من بنود اتفاقية الخدمة/الغرامة/التدخل التي يمكن لهذه الأدلة تفعيلها.' },
    ],
  };
  return { supplier: s, detection, mix, recovery, exposure, copq, concentration, recommendation, signals, tier, evidence };
}

/** Tier is an ordinal read of disclosed signals, NOT a composite score. */
export function computeTier(d: SupplierDetection, signals: Signal[]): Tier {
  const has = (k: string) => signals.some((x) => x.key === k);
  const rungIdx = ['REPAIR', 'DEVELOP', 'COLLABORATE', 'REDESIGN', 'DUAL_SOURCE', 'MULTI_SOURCE', 'REPLACE', 'EXIT'].indexOf(d.recommendedIntervention);
  if (rungIdx >= 4 || d.combinedSignalFlag || has('external-failure')) return 'critical';
  if (rungIdx >= 3 || has('overdue-car') || has('not-recovered') || has('shock')) return 'high';
  if (rungIdx >= 1 || signals.length > 0) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// 4. Weekly action list
// ---------------------------------------------------------------------------

export const DUE_DAYS_BY_TIER: Record<Tier, number> = { critical: 3, high: 7, medium: 14, low: 30 };
export const DUE_CADENCE_NOTE: Bilingual = {
  en: 'Due dates are an ISC default cadence (critical 3 days, high 7, medium 14, low 30) counted from the as-of date. Change them to match your own SLAs.',
  ar: 'مواعيد الاستحقاق وتيرة افتراضية من ISC (حرج 3 أيام، مرتفع 7، متوسط 14، منخفض 30) تُحسب من تاريخ الحساب. عدّلها لتناسب اتفاقياتك الداخلية.',
};

export type ActionKind = 'decision' | 'data-gap';

export interface WeeklyAction {
  id: string;
  kind: ActionKind;
  supplierId: string;
  supplierName: string;
  tier: Tier;
  title: Bilingual;
  detail: Bilingual;
  owner: string;
  dueDate: string;
  signals: Signal[];
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_OWNER = 'Category manager';
export const DEFAULT_OWNER_AR = 'مدير الفئة';
const TIER_RANK: Record<Tier, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function buildWeeklyActions(decisions: SupplierDecision[], asOfIso: string, owners: Record<string, string> = {}, defaultOwner: string = DEFAULT_OWNER): WeeklyAction[] {
  const out: WeeklyAction[] = [];
  for (const d of decisions) {
    const owner = owners[d.supplier.supplierId] ?? defaultOwner;
    if (d.tier !== 'low' || d.recommendation.primary.key !== 'MONITOR') {
      out.push({
        id: `${d.supplier.supplierId}:decision`, kind: 'decision', supplierId: d.supplier.supplierId, supplierName: d.supplier.name,
        tier: d.tier, title: d.recommendation.primary.title, detail: d.recommendation.why, owner,
        dueDate: addDays(asOfIso, DUE_DAYS_BY_TIER[d.tier]), signals: d.signals,
      });
    }
    // Data-gap actions: things that silently weaken every number above.
    const uncostedOpen = d.supplier.cars.filter((c) => c.status !== 'closed' && !(typeof c.estimatedCostUSD === 'number'));
    if (uncostedOpen.length > 0) {
      out.push({
        id: `${d.supplier.supplierId}:cost`, kind: 'data-gap', supplierId: d.supplier.supplierId, supplierName: d.supplier.name, tier: 'medium',
        title: { en: 'Put a cost on the open CARs', ar: 'حدّد تكلفة الطلبات المفتوحة' },
        detail: { en: `${uncostedOpen.length} open CAR(s) have no cost, so the cost of poor quality is understated or missing.`, ar: `${uncostedOpen.length} طلب مفتوح بلا تكلفة، لذا فإن كلفة سوء الجودة ناقصة أو غائبة.` },
        owner, dueDate: addDays(asOfIso, DUE_DAYS_BY_TIER.medium), signals: [],
      });
    }
    if (d.mix.counts.unassessed > 0) {
      out.push({
        id: `${d.supplier.supplierId}:cause`, kind: 'data-gap', supplierId: d.supplier.supplierId, supplierName: d.supplier.name, tier: 'medium',
        title: { en: 'Assess whose problem each CAR is', ar: 'حدّد صاحب المشكلة في كل طلب' },
        detail: { en: `${d.mix.counts.unassessed} CAR(s) have no cause (supplier, client, shared, external, measurement). Until assessed, the supplier is not blamed and not cleared.`, ar: `${d.mix.counts.unassessed} طلب بلا سبب (مورد، عميل، مشترك، خارجي، قياس). إلى أن يُقيَّم، لا يُلام المورد ولا يُبرَّأ.` },
        owner, dueDate: addDays(asOfIso, DUE_DAYS_BY_TIER.medium), signals: [],
      });
    }
    if (!d.supplier.category || !(typeof d.supplier.annualSpendSAR === 'number' && d.supplier.annualSpendSAR > 0) && d.detection.recommendedIntervention !== 'REPAIR') {
      out.push({
        id: `${d.supplier.supplierId}:spend`, kind: 'data-gap', supplierId: d.supplier.supplierId, supplierName: d.supplier.name, tier: 'low',
        title: { en: 'Add category and annual spend', ar: 'أضف الفئة والإنفاق السنوي' },
        detail: { en: 'Without annual spend the exposure and concentration figures for this escalated supplier cannot be calculated.', ar: 'بدون الإنفاق السنوي لا يمكن حساب التعرّض والتركّز لهذا المورد المُصعَّد.' },
        owner, dueDate: addDays(asOfIso, DUE_DAYS_BY_TIER.low), signals: [],
      });
    }
  }
  return out.sort((a, b) =>
    TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
    (a.kind === b.kind ? 0 : a.kind === 'decision' ? -1 : 1) ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.supplierName.localeCompare(b.supplierName));
}

export function buildDecisions(suppliers: SupplierRecord[], ctx: Omit<PortfolioContext, 'allSuppliers'>): SupplierDecision[] {
  const full: PortfolioContext = { ...ctx, allSuppliers: suppliers, peersByCategory: groupPeersByCategory(suppliers) };
  return suppliers.map((s) => buildSupplierDecision(s, full));
}
