/**
 * Supplier Cost of Poor Quality (COPQ) — SI Engine, Item 1 of the Supplier
 * Lifecycle Governance two-tier build (11 Sep 2026).
 *
 * ============================================================================
 * SOURCED METHODOLOGY (Decision Record 8.7, Rule 2 — never an invented rule
 * dressed up as a standard)
 * ============================================================================
 * Standard model: the Prevention-Appraisal-Failure (PAF) framework — the ASQ
 * quality-cost standard, tracing to Juran. Four categories:
 *   - Prevention        — training, process engineering (proactive spend to
 *                          stop a defect happening at all).
 *   - Appraisal         — inspection, testing, audits (spend to catch a
 *                          defect that has already occurred, before it does
 *                          further damage).
 *   - Internal Failure  — scrap, rework, re-inspection, BEFORE the defect
 *                          reaches the customer.
 *   - External Failure  — warranty claims, returns, customer penalties, lost
 *                          sales, AFTER the defect reaches the customer.
 * Strategic relationship (the standard business case for the whole quality-
 * cost discipline): investment in Prevention reduces Internal- and External-
 * Failure cost by a larger margin than it costs.
 * Sources: Autodesk, "Understanding COPQ in Manufacturing"; Six Sigma Study
 * Guide, "Cost of Poor Quality"; SimplerQMS, "Cost of Quality"; The Lean
 * Suite, "COPQ Calculation and Reduction Framework."
 *
 * Design implication (per the above sources, applied to this platform's own
 * data): every CAR already tracked has a natural COPQ categorization — a CAR
 * driven by a quality escapement is an Internal- or External-Failure cost;
 * the corrective-action work itself (investigation, containment,
 * verification) is Appraisal-type effort. A COPQ rollup on existing CAR data
 * is close to free — reframing existing data, not new collection.
 *
 * ============================================================================
 * WHAT "CLOSE TO FREE" ACTUALLY MEANS HERE — AND WHERE IT STOPS (Rule 1,
 * Never Fabricate)
 * ============================================================================
 * The live CAR type (mirrored below from supplierRecoveryPortfolio.ts, which
 * itself mirrors the real Scorecard CAR: id/category/scorecardDimension/
 * rootCause/status/createdAt/closedAt) carries NO cost field and NO signal
 * for whether a given defect reached the customer. Decomposing one CAR into
 * four dollar-denominated PAF buckets from that shape alone would be
 * fabrication. So this module is deliberately honest about what each PAF
 * bucket can and cannot be computed from real data:
 *
 *   - Internal / External Failure $  — REAL, when the caller supplies a
 *     BusinessImpact linked to the CAR (Module 07's own existing type,
 *     already carrying estimatedCostUSD + a disclosed basis). Classification
 *     as Internal vs External defaults to Internal (a CAR is, by definition,
 *     a caught and managed issue — the conservative PAF reading) and is
 *     caller-overridable per CAR to External when the defect is known to
 *     have reached the customer. A CAR with no linked BusinessImpact
 *     contributes to COUNT metrics only — never a guessed dollar figure.
 *   - Appraisal effort              — REAL, from CAR volume and cycle time
 *     (count + median days-to-close) alone — no dollar fabrication. A REAL
 *     dollar figure is produced only if the caller supplies a per-CAR
 *     investigation cost rate (their own burdened cost data); otherwise the
 *     output stays an effort proxy, clearly labeled as such.
 *   - Prevention $                  — CARs are reactive by construction; no
 *     CAR-derived signal for proactive spend exists. This bucket is
 *     INSUFFICIENT_DATA unless the caller supplies a real known prevention/
 *     training-program spend figure for the period. This is a disclosed gap,
 *     never a fabricated zero.
 *
 * ============================================================================
 * TWO-TIER STANDING RULE (design doc section 2.8, as pasted by the client
 * 11 Sep 2026 — now a standing design rule for all 7 items in this build)
 * ============================================================================
 * ISC is strategic/tactical consultancy, not an operations vendor.
 *   - Advisory tier (default): this file's pure functions compute the
 *     rollup + narrative on demand. No persistence. The client acts on it in
 *     their own systems.
 *   - Operational tier (opt-in): a separate persistence layer (new DB table
 *     + API route, built on top of this same file's functions) stores the
 *     rollup as an append-only ledger entry and raises alerts as findings-
 *     actions rows. See copqLedger.ts (schema) and the copq API route.
 * Both tiers call the SAME functions below — they differ only in whether the
 * result gets written anywhere. This file has zero knowledge of persistence.
 *
 * ============================================================================
 * STANDALONE-FIRST (Rule 3)
 * ============================================================================
 * This file has no runtime import from Module 07, the Scorecard, or any
 * sibling module. CARRecord and BusinessImpact are mirrored here (same
 * technique supplierRecoveryPortfolio.ts already uses for CARRecord) so this
 * module works whether or not those modules are wired up. Every fact is
 * caller-supplied plain data.
 */

// ---------------------------------------------------------------------------
// Section 0 — mirrored real type contracts (see file header for provenance)
// ---------------------------------------------------------------------------

/** Mirrored from supplierRecoveryPortfolio.ts's real CARRecord (10-11 Sep
 * 2026 build) — kept in sync manually per standalone-first doctrine. */
export type CARCategory = 'quality' | 'delivery' | 'compliance' | 'safety' | 'documentation' | 'other';
export type CARStatus = 'open' | 'in-progress' | 'closed';

export interface CARRecord {
  id: string;
  supplierId: string;
  category: CARCategory;
  rootCause: string;
  status: CARStatus;
  createdAt: string; // ISO date
  closedAt: string | null;
}

/** Mirrored from supplierPerformanceRecovery.ts's real BusinessImpact type
 * and its BusinessImpactBasis union — the cost-disclosure shape this whole
 * module leans on to avoid fabricating dollar figures. */
export type BusinessImpactBasis = 'observed' | 'calculated' | 'estimated';

export interface CARBusinessImpact {
  carId: string; // join key back to CARRecord.id — mirrors linkedCarId convention
  description: string;
  estimatedCostUSD: number | null;
  basis: BusinessImpactBasis;
}

/** Caller-supplied override for the CAR's failure classification. Absent =
 * default-Internal (see file header rationale). Never inferred/guessed. */
export interface CARCustomerImpactOverride {
  carId: string;
  customerImpact: 'external';
}

// ---------------------------------------------------------------------------
// Section 1 — Internal / External Failure cost rollup
// ---------------------------------------------------------------------------

export type FailureCostBasis = 'derived-from-linked-business-impact' | 'INSUFFICIENT_DATA';

export interface FailureCostBucket {
  costUSD: number | null;
  carCount: number; // all CARs classified into this bucket, costed or not
  costedCarCount: number; // subset that actually carried a linked BusinessImpact
  basis: FailureCostBasis;
  noteEn: string;
  noteAr: string;
}

function classifyCustomerImpact(
  car: CARRecord,
  overrides: CARCustomerImpactOverride[]
): 'internal' | 'external' {
  return overrides.some((o) => o.carId === car.id && o.customerImpact === 'external')
    ? 'external'
    : 'internal';
}

function buildFailureBucket(
  cars: CARRecord[],
  impacts: CARBusinessImpact[],
  bucket: 'internal' | 'external'
): FailureCostBucket {
  const carCount = cars.length;
  const linked = cars
    .map((c) => impacts.find((i) => i.carId === c.id))
    .filter((i): i is CARBusinessImpact => i !== undefined && i.estimatedCostUSD !== null);
  const costedCarCount = linked.length;
  const costUSD = costedCarCount > 0 ? linked.reduce((sum, i) => sum + (i.estimatedCostUSD ?? 0), 0) : null;
  const uncosted = carCount - costedCarCount;
  const label = bucket === 'internal' ? 'Internal Failure' : 'External Failure';
  const labelAr = bucket === 'internal' ? 'فشل داخلي' : 'فشل خارجي';

  const noteEn = carCount === 0
    ? `No CARs classified as ${label} this period.`
    : uncosted === 0
      ? `${carCount} CAR(s) classified as ${label}, all with a linked cost figure.`
      : `${carCount} CAR(s) classified as ${label}; ${uncosted} of ${carCount} have no linked cost figure yet — the dollar total below reflects only the ${costedCarCount} costed CAR(s), not an estimate for the rest.`;
  const noteAr = carCount === 0
    ? `لا توجد طلبات إجراء تصحيحي مصنّفة كـ"${labelAr}" لهذه الفترة.`
    : uncosted === 0
      ? `تم تصنيف ${carCount} طلب إجراء تصحيحي كـ"${labelAr}"، وجميعها يحمل رقم تكلفة مرتبط.`
      : `تم تصنيف ${carCount} طلب إجراء تصحيحي كـ"${labelAr}"؛ ${uncosted} من أصل ${carCount} بلا رقم تكلفة مرتبط بعد — الإجمالي أدناه يعكس فقط ${costedCarCount} حالة مكلَّفة، وليس تقديرًا للبقية.`;

  return {
    costUSD,
    carCount,
    costedCarCount,
    basis: costedCarCount > 0 ? 'derived-from-linked-business-impact' : 'INSUFFICIENT_DATA',
    noteEn,
    noteAr,
  };
}

export interface FailureCostRollup {
  internalFailure: FailureCostBucket;
  externalFailure: FailureCostBucket;
  classificationRuleEn: string;
  classificationRuleAr: string;
}

export function computeFailureCostRollup(
  cars: CARRecord[],
  impacts: CARBusinessImpact[],
  overrides: CARCustomerImpactOverride[] = []
): FailureCostRollup {
  const internalCars = cars.filter((c) => classifyCustomerImpact(c, overrides) === 'internal');
  const externalCars = cars.filter((c) => classifyCustomerImpact(c, overrides) === 'external');
  return {
    internalFailure: buildFailureBucket(internalCars, impacts, 'internal'),
    externalFailure: buildFailureBucket(externalCars, impacts, 'external'),
    classificationRuleEn:
      'Default classification is Internal Failure for every CAR — a CAR is, by definition, a caught and managed issue (the conservative PAF reading). A CAR is classified External Failure only when explicitly flagged as having reached the customer (a return, warranty claim, penalty, or lost sale) — never inferred from category, rootCause text, or any other field.',
    classificationRuleAr:
      'التصنيف الافتراضي لكل طلب إجراء تصحيحي هو "فشل داخلي" — فطلب الإجراء التصحيحي بحكم تعريفه مشكلة مُكتشَفة وتحت المعالجة (القراءة المتحفظة لنموذج PAF). يُصنَّف الطلب كـ"فشل خارجي" فقط عند وجود إشارة صريحة بأن العيب وصل فعليًا إلى العميل (إرجاع، مطالبة ضمان، غرامة، أو خسارة مبيعات) — ولا يُستنتج أبدًا من الفئة أو نص السبب الجذري أو أي حقل آخر.',
  };
}

// ---------------------------------------------------------------------------
// Section 2 — Appraisal effort / cost proxy
// ---------------------------------------------------------------------------

export interface AppraisalRollup {
  carCount: number;
  medianDaysToClose: number | null;
  costUSD: number | null;
  costBasis: 'caller-supplied-rate' | 'effort-proxy-only';
  noteEn: string;
  noteAr: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/**
 * Appraisal = the cost of catching/investigating/verifying a defect (ASQ
 * PAF). Every CAR's own investigation-and-verification work is, by
 * definition, appraisal-type effort — this reframes existing CAR cycle-time
 * data (same computation supplierRecoveryPortfolio.ts's computeCarCohorts
 * already performs) rather than inventing anything new.
 *
 * `perCarCostRateUSD` is an explicit, caller-supplied, client-configurable
 * number (Decision Record 8.7 pattern already used for Module 03's
 * heavyThresholdValue) — never a hardcoded industry rate. Absent it, the
 * output is an honest effort proxy (count + cycle time), not a dollar guess.
 */
export function computeAppraisalRollup(
  cars: CARRecord[],
  asOfIso: string,
  perCarCostRateUSD?: number
): AppraisalRollup {
  const carCount = cars.length;
  const closedDurations = cars
    .filter((c) => c.closedAt)
    .map((c) => daysBetween(c.createdAt, c.closedAt!))
    .sort((a, b) => a - b);
  const medianDaysToClose = closedDurations.length
    ? closedDurations[Math.floor(closedDurations.length / 2)]!
    : null;

  if (perCarCostRateUSD !== undefined && perCarCostRateUSD > 0) {
    return {
      carCount,
      medianDaysToClose,
      costUSD: Math.round(carCount * perCarCostRateUSD),
      costBasis: 'caller-supplied-rate',
      noteEn: `${carCount} CAR(s) required investigation/verification this period, at a caller-supplied rate of $${perCarCostRateUSD.toLocaleString()} per CAR${medianDaysToClose !== null ? `; median ${medianDaysToClose} day(s) to close` : ''}.`,
      noteAr: `تطلّب ${carCount} طلب إجراء تصحيحي تحقيقًا/تحققًا خلال هذه الفترة، بمعدل تكلفة محدَّد من العميل قدره ${perCarCostRateUSD.toLocaleString()} دولار لكل طلب${medianDaysToClose !== null ? `؛ الوسيط الزمني للإغلاق ${medianDaysToClose} يوم` : ''}.`,
    };
  }

  return {
    carCount,
    medianDaysToClose,
    costUSD: null,
    costBasis: 'effort-proxy-only',
    noteEn: carCount === 0
      ? 'No CAR investigation/verification effort this period.'
      : `${carCount} CAR(s) required investigation/verification this period${medianDaysToClose !== null ? `, median ${medianDaysToClose} day(s) to close` : ''} — shown as effort (count + cycle time), not a dollar figure, since no per-CAR investigation cost rate was supplied.`,
    noteAr: carCount === 0
      ? 'لا يوجد جهد تحقيق/تحقق لطلبات إجراء تصحيحي خلال هذه الفترة.'
      : `تطلّب ${carCount} طلب إجراء تصحيحي جهد تحقيق/تحقق خلال هذه الفترة${medianDaysToClose !== null ? `، بوسيط زمني للإغلاق قدره ${medianDaysToClose} يوم` : ''} — معروض كجهد (عدد ومدة)، وليس كرقم مالي، لعدم توفر معدل تكلفة تحقيق لكل طلب.`,
  };
}

// ---------------------------------------------------------------------------
// Section 3 — Prevention (disclosed gap unless caller supplies real spend)
// ---------------------------------------------------------------------------

export interface PreventionRollup {
  costUSD: number | null;
  basis: 'caller-supplied' | 'INSUFFICIENT_DATA';
  noteEn: string;
  noteAr: string;
}

export function computePreventionRollup(preventionSpendUSD?: number): PreventionRollup {
  if (preventionSpendUSD !== undefined && preventionSpendUSD >= 0) {
    return {
      costUSD: preventionSpendUSD,
      basis: 'caller-supplied',
      noteEn: `Prevention spend of $${preventionSpendUSD.toLocaleString()} supplied for this period (training, process engineering, or equivalent proactive investment).`,
      noteAr: `تم تزويد إنفاق وقائي قدره ${preventionSpendUSD.toLocaleString()} دولار لهذه الفترة (تدريب، هندسة عمليات، أو استثمار استباقي مماثل).`,
    };
  }
  return {
    costUSD: null,
    basis: 'INSUFFICIENT_DATA',
    noteEn: 'CARs are reactive by construction — no CAR-derived signal exists for proactive Prevention spend. This is a disclosed gap, not a fabricated zero. Supply a real training/process-engineering spend figure to populate this bucket.',
    noteAr: 'طلبات الإجراء التصحيحي تفاعلية بطبيعتها — لا توجد إشارة مشتقة منها للإنفاق الوقائي الاستباقي. هذه فجوة معلنة، وليست صفرًا افتراضيًا. زوّد رقم إنفاق حقيقي للتدريب أو هندسة العمليات لملء هذه الفئة.',
  };
}

// ---------------------------------------------------------------------------
// Section 4 — Full PAF rollup + narrative (Advisory tier's whole output)
// ---------------------------------------------------------------------------

export interface COPQRollup {
  periodLabel: string;
  asOfIso: string;
  classificationRuleEn: string;
  classificationRuleAr: string;
  internalFailure: FailureCostBucket;
  externalFailure: FailureCostBucket;
  appraisal: AppraisalRollup;
  prevention: PreventionRollup;
  /** Sum of every bucket that actually has a real dollar figure (costUSD !==
   * null). Never includes a bucket whose basis is INSUFFICIENT_DATA or
   * effort-proxy-only, and the note says exactly which buckets were
   * excluded so the total is never mistaken for a complete COPQ figure. */
  totalCostedUSD: number | null;
  excludedBucketsEn: string[];
  excludedBucketsAr: string[];
  narrativeEn: string;
  narrativeAr: string;
  frameworkSourceEn: string;
  frameworkSourceAr: string;
}

const FRAMEWORK_SOURCE_EN =
  'Prevention-Appraisal-Failure (PAF) model — the ASQ quality-cost standard, tracing to Juran. Sources: Autodesk, "Understanding COPQ in Manufacturing"; Six Sigma Study Guide, "Cost of Poor Quality"; SimplerQMS, "Cost of Quality"; The Lean Suite, "COPQ Calculation and Reduction Framework."';
const FRAMEWORK_SOURCE_AR =
  'نموذج الوقاية-التقييم-الفشل (PAF) — معيار تكلفة الجودة المعتمد من ASQ، ويعود أصله إلى جوران. المصادر: Autodesk، "Understanding COPQ in Manufacturing"؛ Six Sigma Study Guide، "Cost of Poor Quality"؛ SimplerQMS، "Cost of Quality"؛ The Lean Suite، "COPQ Calculation and Reduction Framework".';

export function computeCOPQRollup(input: {
  periodLabel: string;
  asOfIso: string;
  cars: CARRecord[];
  impacts: CARBusinessImpact[];
  overrides?: CARCustomerImpactOverride[];
  perCarCostRateUSD?: number;
  preventionSpendUSD?: number;
}): COPQRollup {
  const failure = computeFailureCostRollup(input.cars, input.impacts, input.overrides ?? []);
  const appraisal = computeAppraisalRollup(input.cars, input.asOfIso, input.perCarCostRateUSD);
  const prevention = computePreventionRollup(input.preventionSpendUSD);

  const costedBuckets: Array<{ label: string; labelAr: string; costUSD: number | null }> = [
    { label: 'Internal Failure', labelAr: 'الفشل الداخلي', costUSD: failure.internalFailure.costUSD },
    { label: 'External Failure', labelAr: 'الفشل الخارجي', costUSD: failure.externalFailure.costUSD },
    { label: 'Appraisal', labelAr: 'التقييم', costUSD: appraisal.costUSD },
    { label: 'Prevention', labelAr: 'الوقاية', costUSD: prevention.costUSD },
  ];
  const included = costedBuckets.filter((b) => b.costUSD !== null);
  const excluded = costedBuckets.filter((b) => b.costUSD === null);
  const totalCostedUSD = included.length > 0 ? included.reduce((s, b) => s + (b.costUSD ?? 0), 0) : null;

  const totalCars = input.cars.length;
  const externalShare = failure.internalFailure.carCount + failure.externalFailure.carCount > 0
    ? Math.round((1000 * failure.externalFailure.carCount) / (failure.internalFailure.carCount + failure.externalFailure.carCount)) / 10
    : null;

  const narrativeEn = totalCars === 0
    ? `No CAR activity recorded for ${input.periodLabel} — no COPQ signal to report this period.`
    : `${input.periodLabel}: ${totalCars} CAR(s) reviewed under the PAF model. ${failure.externalFailure.carCount} classified External Failure (reached the customer) vs. ${failure.internalFailure.carCount} Internal Failure (caught internally)${externalShare !== null ? ` — External Failure is ${externalShare}% of classified CARs` : ''}. ${totalCostedUSD !== null ? `Costed total across ${included.length} of 4 PAF categories: $${totalCostedUSD.toLocaleString()}.` : 'No costed categories this period — supply linked business-impact figures to quantify.'} Per the standard PAF business case, sustained investment in Prevention is what drives Internal- and External-Failure cost down over time — ${prevention.basis === 'INSUFFICIENT_DATA' ? 'no Prevention spend figure is available yet to test that relationship for this client.' : `this period's Prevention spend ($${prevention.costUSD?.toLocaleString()}) is now part of that trend line once a second period exists to compare against.`}`;

  const narrativeAr = totalCars === 0
    ? `لا يوجد نشاط لطلبات إجراء تصحيحي لفترة ${input.periodLabel} — لا توجد إشارة تكلفة جودة رديئة (COPQ) لهذه الفترة.`
    : `${input.periodLabel}: تمت مراجعة ${totalCars} طلب إجراء تصحيحي وفق نموذج PAF. صُنِّف ${failure.externalFailure.carCount} كـ"فشل خارجي" (وصل إلى العميل) مقابل ${failure.internalFailure.carCount} كـ"فشل داخلي" (تم اكتشافه داخليًا)${externalShare !== null ? ` — يمثّل الفشل الخارجي ${externalShare}% من الطلبات المصنّفة` : ''}. ${totalCostedUSD !== null ? `الإجمالي المكلَّف عبر ${included.length} من أصل 4 فئات PAF: ${totalCostedUSD.toLocaleString()} دولار.` : 'لا توجد فئات مكلَّفة لهذه الفترة — زوّد أرقام الأثر المالي المرتبطة للتقييم الكمي.'} وفق نموذج الأعمال القياسي لـ PAF، فإن الاستثمار المستمر في الوقاية هو ما يخفّض تكلفة الفشل الداخلي والخارجي بمرور الوقت — ${prevention.basis === 'INSUFFICIENT_DATA' ? 'لا يتوفر بعد رقم إنفاق وقائي لاختبار هذه العلاقة لدى هذا العميل.' : `إنفاق الوقاية لهذه الفترة (${prevention.costUSD?.toLocaleString()} دولار) أصبح الآن جزءًا من هذا الاتجاه بمجرد توفر فترة ثانية للمقارنة.`}`;

  return {
    periodLabel: input.periodLabel,
    asOfIso: input.asOfIso,
    classificationRuleEn: failure.classificationRuleEn,
    classificationRuleAr: failure.classificationRuleAr,
    internalFailure: failure.internalFailure,
    externalFailure: failure.externalFailure,
    appraisal,
    prevention,
    totalCostedUSD,
    excludedBucketsEn: excluded.map((b) => b.label),
    excludedBucketsAr: excluded.map((b) => b.labelAr),
    narrativeEn,
    narrativeAr,
    frameworkSourceEn: FRAMEWORK_SOURCE_EN,
    frameworkSourceAr: FRAMEWORK_SOURCE_AR,
  };
}

// ---------------------------------------------------------------------------
// Section 5 — Trend / threshold-crossing alert (shared by both tiers; only
// the Operational tier persists the alert as a findings-action row)
// ---------------------------------------------------------------------------

export type COPQAlertReason =
  | 'external-failure-share-increased'
  | 'total-costed-copq-increased'
  | 'none';

export interface COPQAlert {
  triggered: boolean;
  reason: COPQAlertReason;
  messageEn: string;
  messageAr: string;
}

/**
 * A client-configurable threshold check across two consecutive rollups —
 * never a hardcoded magic percentage (Decision Record 8.7 pattern, same as
 * Module 03's client-configurable heavyThresholdValue). Two disclosed,
 * sourced signals, in order of severity:
 *   1. External Failure's share of classified CARs increased period over
 *      period — the PAF literature treats a rising external-failure share
 *      as the leading indicator that matters most, since external failure
 *      is the most damaging category (reputational + financial, beyond the
 *      supplier relationship itself).
 *   2. Total costed COPQ increased period over period by more than the
 *      caller's configured percentage threshold.
 * Both require an actual prior period to compare against — a single
 * period's rollup can never trigger an alert (nothing to compare it to).
 */
export function detectCOPQAlert(
  current: COPQRollup,
  prior: COPQRollup | null,
  increasePctThreshold: number = 15
): COPQAlert {
  if (!prior) {
    return {
      triggered: false,
      reason: 'none',
      messageEn: 'No prior period to compare against — alerting begins from the second recorded period onward.',
      messageAr: 'لا توجد فترة سابقة للمقارنة — يبدأ التنبيه اعتبارًا من الفترة الثانية المسجَّلة.',
    };
  }

  const currentTotalClassified = current.internalFailure.carCount + current.externalFailure.carCount;
  const priorTotalClassified = prior.internalFailure.carCount + prior.externalFailure.carCount;
  const currentExternalShare = currentTotalClassified > 0 ? current.externalFailure.carCount / currentTotalClassified : null;
  const priorExternalShare = priorTotalClassified > 0 ? prior.externalFailure.carCount / priorTotalClassified : null;

  if (currentExternalShare !== null && priorExternalShare !== null && currentExternalShare > priorExternalShare) {
    const curPct = Math.round(currentExternalShare * 1000) / 10;
    const priorPct = Math.round(priorExternalShare * 1000) / 10;
    return {
      triggered: true,
      reason: 'external-failure-share-increased',
      messageEn: `External Failure's share of classified CARs rose from ${priorPct}% (${prior.periodLabel}) to ${curPct}% (${current.periodLabel}) — per the PAF model, a rising external-failure share is the leading indicator that a quality issue is starting to reach customers more often, not less.`,
      messageAr: `ارتفعت حصة الفشل الخارجي من إجمالي الطلبات المصنّفة من ${priorPct}% (${prior.periodLabel}) إلى ${curPct}% (${current.periodLabel}) — وفق نموذج PAF، يُعدّ ارتفاع حصة الفشل الخارجي مؤشرًا رائدًا على أن مشكلة الجودة بدأت تصل إلى العملاء بشكل أكبر، لا أقل.`,
    };
  }

  if (current.totalCostedUSD !== null && prior.totalCostedUSD !== null && prior.totalCostedUSD > 0) {
    const pctChange = ((current.totalCostedUSD - prior.totalCostedUSD) / prior.totalCostedUSD) * 100;
    if (pctChange > increasePctThreshold) {
      return {
        triggered: true,
        reason: 'total-costed-copq-increased',
        messageEn: `Costed COPQ rose ${Math.round(pctChange * 10) / 10}% from ${prior.periodLabel} ($${prior.totalCostedUSD.toLocaleString()}) to ${current.periodLabel} ($${current.totalCostedUSD.toLocaleString()}) — above the configured ${increasePctThreshold}% threshold.`,
        messageAr: `ارتفعت تكلفة الجودة الرديئة المكلَّفة (COPQ) بنسبة ${Math.round(pctChange * 10) / 10}% من ${prior.periodLabel} (${prior.totalCostedUSD.toLocaleString()} دولار) إلى ${current.periodLabel} (${current.totalCostedUSD.toLocaleString()} دولار) — أعلى من الحد المعدّ مسبقًا وهو ${increasePctThreshold}%.`,
      };
    }
  }

  return {
    triggered: false,
    reason: 'none',
    messageEn: `No threshold-crossing signal between ${prior.periodLabel} and ${current.periodLabel}.`,
    messageAr: `لا توجد إشارة تجاوز حد بين ${prior.periodLabel} و${current.periodLabel}.`,
  };
}

// ---------------------------------------------------------------------------
// Section 6 — Month-over-month alert helper (11 Sep 2026 addition — real
// wiring for consumers with a plain CAR history and no explicit period
// boundaries of their own, e.g. the Supplier Scorecard tool's local CAR log,
// which tracks individual CARs with createdAt dates but has no concept of a
// COPQ "period" the way a dedicated COPQ reporting cadence would). Buckets
// CARs by calendar month (createdAt), takes the two most recent months at
// or before asOfIso that actually have CAR activity, and runs the existing,
// unmodified detectCOPQAlert across them. A caller that already has real
// defined reporting periods (e.g. a quarterly ops cadence) should call
// computeCOPQRollup + detectCOPQAlert directly instead of this convenience
// wrapper — this helper exists specifically for the "just a CAR log with
// dates" case.
// ---------------------------------------------------------------------------

export interface MonthOverMonthCOPQResult {
  currentPeriodLabel: string | null;
  priorPeriodLabel: string | null;
  current: COPQRollup | null;
  prior: COPQRollup | null;
  alert: COPQAlert;
}

function monthOf(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function computeMonthOverMonthCOPQAlert(
  cars: CARRecord[],
  impacts: CARBusinessImpact[],
  overrides: CARCustomerImpactOverride[],
  asOfIso: string,
  increasePctThreshold: number = 15
): MonthOverMonthCOPQResult {
  const asOfMonth = monthOf(asOfIso);
  const monthsPresent = Array.from(new Set(cars.map((c) => monthOf(c.createdAt))))
    .filter((m) => m <= asOfMonth)
    .sort();

  if (monthsPresent.length === 0) {
    return {
      currentPeriodLabel: null,
      priorPeriodLabel: null,
      current: null,
      prior: null,
      alert: {
        triggered: false,
        reason: 'none',
        messageEn: 'No CAR activity at or before the as-of date — nothing to evaluate yet.',
        messageAr: 'لا يوجد نشاط طلبات إجراء تصحيحي حتى تاريخ التقييم — لا يوجد ما يمكن تقييمه بعد.',
      },
    };
  }

  const currentMonth = monthsPresent[monthsPresent.length - 1]!;
  const priorMonth = monthsPresent.length >= 2 ? monthsPresent[monthsPresent.length - 2]! : null;

  const currentCars = cars.filter((c) => monthOf(c.createdAt) === currentMonth);
  const current = computeCOPQRollup({ periodLabel: currentMonth, asOfIso, cars: currentCars, impacts, overrides });

  let prior: COPQRollup | null = null;
  if (priorMonth) {
    const priorCars = cars.filter((c) => monthOf(c.createdAt) === priorMonth);
    prior = computeCOPQRollup({ periodLabel: priorMonth, asOfIso, cars: priorCars, impacts, overrides });
  }

  const alert = detectCOPQAlert(current, prior, increasePctThreshold);

  return { currentPeriodLabel: currentMonth, priorPeriodLabel: priorMonth, current, prior, alert };
}
