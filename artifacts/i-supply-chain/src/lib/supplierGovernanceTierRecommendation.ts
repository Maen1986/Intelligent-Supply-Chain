/**
 * supplierGovernanceTierRecommendation.ts
 *
 * Module: Supplier Governance-Tier Recommendation Engine
 * Standing item: built as "step zero" of Item 4 (Supplier Onboarding) per an
 * explicit platform-owner correction, and designed for reuse, unmodified, by
 * Items 5-7 (Periodic Evaluation, Second-Party Audits, Blacklist/Offboarding)
 * -- any ISC module that needs to recommend Advisory-vs-Operational
 * governance intensity for a given supplier should import this module rather
 * than re-deriving the logic.
 *
 * ============================================================================
 * SOURCING DISCLOSURE (read before trusting or extending this module)
 * ============================================================================
 *
 * WHAT IS SOURCED (a named, external, citable framework):
 *
 * 1. Kraljic-quadrant-differentiated engagement depth is a REAL, established
 *    SRM concept -- not an ISC invention. Kraljic's original 1983 purchasing-
 *    portfolio model, as summarized in CIPS's own published guidance
 *    (cips.org, "Kraljic Matrix" and "Supplier Preferencing Matrix" pages,
 *    fetched 2026-09-12), prescribes materially different relationship
 *    approaches per quadrant:
 *      - Strategic:      "balancing power between purchasers and suppliers
 *                          based on performance-based partnerships" -- close,
 *                          collaborative, high-touch engagement.
 *      - Bottleneck:      "securing long- and short-term supply and seeking
 *                          alternative suppliers is a priority" -- proactive,
 *                          relationship-heavy risk mitigation.
 *      - Leverage:        exploit "full purchasing power ... tendering,
 *                          target pricing and product substitution" --
 *                          competitive, transactional, lower relationship
 *                          depth.
 *      - Non-critical/
 *        Routine:         "systems contracting and e-procurement solutions"
 *                          focused on "efficient processing, product
 *                          standardisation" -- automated, low-touch.
 *    CIPS does not use the words "governance intensity" or "Advisory vs.
 *    Operational tracking" -- that specific vocabulary is ISC's own (see
 *    "WHAT IS ISC'S OWN SYNTHESIS" below) -- but the underlying claim this
 *    module rests on (Strategic/Bottleneck warrant closer, more hands-on
 *    engagement than Leverage/Routine) is directly and correctly attributable
 *    to Kraljic/CIPS, not invented.
 *
 * 2. Regulated industries warranting deeper, more closely-monitored
 *    third-party oversight is likewise a REAL, named regulatory pattern: the
 *    2023 Interagency Guidance on Third-Party Risk Management (OCC, Federal
 *    Reserve, FDIC) directs US financial institutions to scale the intensity
 *    of ongoing third-party monitoring to the criticality/risk of the
 *    relationship -- a widely-cited baseline in third-party risk management
 *    (TPRM) practice more broadly. This module's use of that pattern is an
 *    ANALOGY, not a literal citation of US banking law: ISC is not a US bank
 *    regulator and this guidance does not itself apply to Saudi/GCC
 *    healthcare, energy, or government procurement. The analogy -- that
 *    regulated sectors generally warrant tighter third-party governance -- is
 *    a defensible extension of a real, named regulatory pattern, disclosed
 *    honestly as an extension rather than presented as a direct requirement.
 *
 * WHAT IS ISC'S OWN SYNTHESIS (disclosed, not hidden):
 *
 * 3. The specific COMBINATION RULE below (Operational recommended when
 *    EITHER the Kraljic signal OR the industry signal indicates elevated
 *    risk; Advisory only when neither does) is ISC's own operationalization.
 *    Neither Kraljic/CIPS nor the Interagency Guidance prescribes this exact
 *    two-input decision table -- ISC designed it by applying both sourced
 *    concepts together. It is a reasonable, defensible synthesis (either
 *    elevated supply risk or elevated regulatory exposure alone is enough to
 *    justify closer tracking) but it is ISC's construction, not a named
 *    external standard's literal prescription.
 *
 * 4. The classification of which of the platform's 8 declared-industry
 *    values (see IndustryKeyLike below, mirrored from kpiBenchmarksByIndustry
 *    .ts's IndustryKey) counts as "regulated" for this module -- currently
 *    'healthcare-pharma', 'oil-gas', and 'government' -- is ISC's own
 *    judgment call, not an externally sourced list. Food-beverage and
 *    construction also carry real regulatory regimes (food safety, building
 *    codes) in most markets; they are classified as "not regulated" here
 *    only in the narrower sense of "not carrying the kind of systemic
 *    financial/health/public-accountability oversight this module's
 *    industry signal is trying to capture," not because they are
 *    unregulated in fact. This is disclosed via `industryClassificationNote`
 *    on every result rather than presented as a settled external fact.
 *
 * ============================================================================
 * DESIGN CONTRACT (per the platform owner's explicit, corrected spec)
 * ============================================================================
 *
 * - RECOMMEND, NEVER ENFORCE: this module returns a recommendation with a
 *   `preSelectTier` value; callers pre-select the UI toggle to that value
 *   but the client can always override it. This module never blocks, never
 *   writes, never gates -- it has zero persistence and zero side effects.
 * - MISSING DATA DEFAULTS TO ADVISORY, NEVER GUESSED TOWARD OPERATIONAL: if
 *   EITHER the Kraljic quadrant OR the declared industry is missing, invalid,
 *   or malformed, the recommendation is unconditionally Advisory -- the
 *   lighter, lower-commitment tier -- regardless of what the other signal
 *   says. A real recommendation combining both signals is only computed when
 *   BOTH are present and valid.
 * - OVERRIDE PERSISTS AGAINST A LATER RECOMMENDATION CHANGE: this module
 *   exposes `resolveEffectiveGovernanceTier()` so that once a caller has
 *   recorded a client override, that override always wins over a freshly
 *   recomputed recommendation until the client explicitly changes it again.
 *   This module does not persist the override itself (Standalone-First
 *   Architecture, Rule 3) -- the caller (e.g. the onboarding route/page)
 *   is responsible for storing the override event and re-supplying it on
 *   every call.
 *
 * ============================================================================
 * STANDALONE-FIRST ARCHITECTURE (Rule 3) DISCLOSURE
 * ============================================================================
 * This module has zero runtime imports from sibling engine modules. The two
 * input shapes below (`KraljicQuadrantLike`, `IndustryKeyLike`) are
 * MANUALLY-SYNCED MIRRORS of shapes defined elsewhere in the codebase:
 *   - KraljicQuadrantLike mirrors the lowercase `KraljicQuadrant` union used
 *     by kraljicScoring.ts, supplierPreQualification.ts, and
 *     supplierRecoveryPortfolio.ts ('strategic' | 'leverage' | 'bottleneck' |
 *     'non-critical'). Note: supplierIntelligenceCaseStudy.ts defines a
 *     differently-CASED version of the same four values
 *     ('Strategic' | 'Leverage' | 'Bottleneck' | 'Non-critical') -- a real,
 *     pre-existing inconsistency in the codebase that this module does not
 *     attempt to fix. Callers passing data sourced from that file must
 *     lowercase it first; `normalizeKraljicQuadrant()` below does this
 *     defensively.
 *   - IndustryKeyLike mirrors `IndustryKey` from kpiBenchmarksByIndustry.ts
 *     (the platform's one existing "declared industry" vocabulary used for
 *     benchmarking depth), reused here rather than inventing a parallel
 *     industry taxonomy.
 * If either source type changes, this mirror must be updated by hand.
 */

// ----------------------------------------------------------------------------
// Mirrored input types (see Standalone-First disclosure above)
// ----------------------------------------------------------------------------

/** Manually-synced mirror of kraljicScoring.ts's KraljicQuadrant (lowercase form). */
export type KraljicQuadrantLike =
  | 'strategic'
  | 'leverage'
  | 'bottleneck'
  | 'non-critical';

/** Manually-synced mirror of kpiBenchmarksByIndustry.ts's IndustryKey. */
export type IndustryKeyLike =
  | 'retail-fmcg'
  | 'manufacturing'
  | 'healthcare-pharma'
  | 'oil-gas'
  | 'government'
  | 'logistics'
  | 'food-beverage'
  | 'construction';

const VALID_KRALJIC_QUADRANTS: ReadonlySet<string> = new Set([
  'strategic',
  'leverage',
  'bottleneck',
  'non-critical',
]);

const VALID_INDUSTRY_KEYS: ReadonlySet<string> = new Set([
  'retail-fmcg',
  'manufacturing',
  'healthcare-pharma',
  'oil-gas',
  'government',
  'logistics',
  'food-beverage',
  'construction',
]);

/**
 * ISC's own classification (disclosed, not externally sourced -- see point 4
 * of the sourcing disclosure above) of which declared industries this module
 * treats as carrying elevated, systemic third-party-oversight exposure.
 */
const REGULATED_INDUSTRIES: ReadonlySet<IndustryKeyLike> = new Set([
  'healthcare-pharma',
  'oil-gas',
  'government',
]);

/**
 * ISC's own classification of which Kraljic quadrants signal elevated supply
 * risk / dependency, per the sourced Kraljic/CIPS engagement-depth pattern
 * (see point 1 of the sourcing disclosure above): Strategic and Bottleneck
 * both call for closer, more hands-on relationship management than Leverage
 * or Non-critical/Routine.
 */
const HIGH_TOUCH_QUADRANTS: ReadonlySet<KraljicQuadrantLike> = new Set([
  'strategic',
  'bottleneck',
]);

export type GovernanceTier = 'advisory' | 'operational';

/** Defensively lowercases/trims a possibly differently-cased or malformed Kraljic value. */
export function normalizeKraljicQuadrant(
  value: string | null | undefined,
): KraljicQuadrantLike | null {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  return VALID_KRALJIC_QUADRANTS.has(lowered) ? (lowered as KraljicQuadrantLike) : null;
}

/** Defensively validates a possibly malformed declared-industry value. */
export function normalizeIndustryKey(
  value: string | null | undefined,
): IndustryKeyLike | null {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  return VALID_INDUSTRY_KEYS.has(lowered) ? (lowered as IndustryKeyLike) : null;
}

export interface GovernanceTierRecommendationInput {
  /** Module 02's Kraljic quadrant for this supplier, if scored yet. Accepts malformed/differently-cased input defensively. */
  kraljicQuadrant?: string | null;
  /** The client's declared industry, if captured yet. Accepts malformed input defensively. */
  declaredIndustry?: string | null;
}

export type DataCompleteness =
  | 'both-present'
  | 'kraljic-only'
  | 'industry-only'
  | 'neither-present';

export interface GovernanceTierRecommendation {
  /** The tier this module recommends. Callers pre-select the UI toggle to this value but must let the client override it. */
  recommendedTier: GovernanceTier;
  /** Convenience alias of recommendedTier, named for the UI wiring contract ("pre-select the toggle to this value"). */
  preSelectTier: GovernanceTier;
  rationaleEn: string;
  rationaleAr: string;
  dataCompleteness: DataCompleteness;
  kraljicSignal: 'high-touch' | 'low-touch' | 'missing';
  industrySignal: 'regulated' | 'not-regulated' | 'missing';
  /** Normalized inputs actually used to compute this recommendation (post-defensive-parsing). */
  resolvedInputs: {
    kraljicQuadrant: KraljicQuadrantLike | null;
    declaredIndustry: IndustryKeyLike | null;
  };
  /** Disclosed per point 4 of the sourcing note: which industries are treated as "regulated" here is ISC's own judgment call, not an external fact. */
  industryClassificationNoteEn: string;
  industryClassificationNoteAr: string;
}

/**
 * Computes a recommended governance tier for a supplier's onboarding (and, by
 * design, any later lifecycle stage in Items 5-7) from the supplier's Kraljic
 * quadrant and the client's declared industry.
 *
 * Contract: recommend, never enforce; default to Advisory whenever either
 * input is missing or malformed; never guess toward Operational on
 * incomplete data. See the module header for the full sourcing disclosure.
 */
export function computeRecommendedGovernanceTier(
  input: GovernanceTierRecommendationInput,
): GovernanceTierRecommendation {
  const kraljicQuadrant = normalizeKraljicQuadrant(input.kraljicQuadrant ?? null);
  const declaredIndustry = normalizeIndustryKey(input.declaredIndustry ?? null);

  const industryClassificationNoteEn =
    'ISC classifies healthcare-pharma, oil-gas, and government as "regulated" for this ' +
    'recommendation based on the general, named regulatory pattern that scales third-party ' +
    'oversight to criticality (e.g. the 2023 US Interagency Guidance on Third-Party Risk ' +
    'Management). This specific 3-industry list is ISC’s own judgment call, not an ' +
    'externally sourced list -- other industries (e.g. food-beverage, construction) also ' +
    'carry real regulatory regimes not captured by this signal.';
  const industryClassificationNoteAr =
    'تُصنِّف آي إس سي قطاعات الرعاية الصحية/الأدوية والنفط والغاز والقطاع الحكومي بأنها ' +
    '"منظَّمة" لغرض هذه التوصية، استناداً إلى نمط تنظيمي معروف يربط شدة إشراف الطرف الثالث ' +
    'بدرجة الأهمية (مثل التوجيه المشترك الأمريكي بشأن إدارة مخاطر الأطراف الثالثة لعام ' +
    '2023). هذه القائمة المحددة من ثلاثة قطاعات هي تقدير خاص بآي إس سي، وليست قائمة ' +
    'مستمدة من مصدر خارجي -- فقطاعات أخرى (مثل الأغذية والمشروبات والإنشاءات) تخضع ' +
    'بدورها لأنظمة تنظيمية حقيقية لا يلتقطها هذا المؤشر.';

  if (kraljicQuadrant === null || declaredIndustry === null) {
    const missingParts: string[] = [];
    if (kraljicQuadrant === null) missingParts.push('Kraljic quadrant');
    if (declaredIndustry === null) missingParts.push('declared industry');
    const missingPartsAr: string[] = [];
    if (kraljicQuadrant === null) missingPartsAr.push('ربع مصفوفة كرالييك');
    if (declaredIndustry === null) missingPartsAr.push('القطاع الصناعي المُعلَن');

    const dataCompleteness: DataCompleteness =
      kraljicQuadrant === null && declaredIndustry === null
        ? 'neither-present'
        : kraljicQuadrant !== null
          ? 'kraljic-only'
          : 'industry-only';

    return {
      recommendedTier: 'advisory',
      preSelectTier: 'advisory',
      rationaleEn:
        `Defaulting to Advisory: ${missingParts.join(' and ')} not yet available. ` +
        'This module never recommends Operational on incomplete data -- once both signals ' +
        'are captured, re-run the recommendation.',
      rationaleAr:
        `الافتراض هو الطبقة الاستشارية: ${missingPartsAr.join(' و')} غير متوفر بعد. ` +
        'لا توصي هذه الوحدة أبداً بالطبقة التشغيلية عند نقص البيانات -- بمجرد توفر ' +
        'كلا المؤشرين، أعد تشغيل التوصية.',
      dataCompleteness,
      kraljicSignal: kraljicQuadrant === null ? 'missing' : (HIGH_TOUCH_QUADRANTS.has(kraljicQuadrant) ? 'high-touch' : 'low-touch'),
      industrySignal: declaredIndustry === null ? 'missing' : (REGULATED_INDUSTRIES.has(declaredIndustry) ? 'regulated' : 'not-regulated'),
      resolvedInputs: { kraljicQuadrant, declaredIndustry },
      industryClassificationNoteEn,
      industryClassificationNoteAr,
    };
  }

  const kraljicSignal: 'high-touch' | 'low-touch' = HIGH_TOUCH_QUADRANTS.has(kraljicQuadrant)
    ? 'high-touch'
    : 'low-touch';
  const industrySignal: 'regulated' | 'not-regulated' = REGULATED_INDUSTRIES.has(declaredIndustry)
    ? 'regulated'
    : 'not-regulated';

  const recommendOperational = kraljicSignal === 'high-touch' || industrySignal === 'regulated';

  let rationaleEn: string;
  let rationaleAr: string;

  if (recommendOperational) {
    const reasons: string[] = [];
    const reasonsAr: string[] = [];
    if (kraljicSignal === 'high-touch') {
      reasons.push(`${kraljicQuadrant} supplier (Kraljic: closer relationship management warranted)`);
      reasonsAr.push(`مورّد ${kraljicQuadrant === 'strategic' ? 'استراتيجي' : 'من فئة عنق الزجاجة'} (كرالييك: يستلزم إدارة علاقة أوثق)`);
    }
    if (industrySignal === 'regulated') {
      reasons.push(`${declaredIndustry} is a regulated-industry client (deeper third-party oversight warranted)`);
      reasonsAr.push(`العميل من قطاع ${declaredIndustry} المنظَّم (يستلزم إشرافاً أعمق على الأطراف الثالثة)`);
    }
    rationaleEn =
      `Operational recommended, because ${reasons.join(' and ')}. ` +
      'ISC tracks per-step onboarding completion and alerts on stalled progress for this tier.';
    rationaleAr =
      `يُوصى بالطبقة التشغيلية لأن ${reasonsAr.join(' و')}. ` +
      'تتابع آي إس سي إتمام كل خطوة من خطوات التهيئة وتُنبِّه عند تعثّر التقدّم في هذه الطبقة.';
  } else {
    rationaleEn =
      `Advisory recommended: ${kraljicQuadrant} supplier and ${declaredIndustry} client ` +
      'client neither signal elevated supply risk nor regulatory exposure. ISC provides the ' +
      'checklist and template for the client to execute independently.';
    rationaleAr =
      `يُوصى بالطبقة الاستشارية: مورّد من فئة ${kraljicQuadrant} وعميل من قطاع ${declaredIndustry} ` +
      '-- لا يشير أي من المؤشرين إلى مخاطر توريد مرتفعة أو تعرّض تنظيمي مرتفع. تقدّم آي إس سي ' +
      'قائمة التحقق والنموذج ليُنفّذهما العميل بشكل مستقل.';
  }

  return {
    recommendedTier: recommendOperational ? 'operational' : 'advisory',
    preSelectTier: recommendOperational ? 'operational' : 'advisory',
    rationaleEn,
    rationaleAr,
    dataCompleteness: 'both-present',
    kraljicSignal,
    industrySignal,
    resolvedInputs: { kraljicQuadrant, declaredIndustry },
    industryClassificationNoteEn,
    industryClassificationNoteAr,
  };
}

// ----------------------------------------------------------------------------
// Override persistence contract (caller stores the event; this module is
// still zero-persistence -- it only resolves precedence given both inputs)
// ----------------------------------------------------------------------------

export interface GovernanceTierOverrideLike {
  tier: GovernanceTier;
  /** ISO 8601 timestamp of when the client set this override. */
  overriddenAt: string;
  overriddenBy?: string;
}

export interface EffectiveGovernanceTier {
  tier: GovernanceTier;
  source: 'recommendation' | 'client-override';
  recommendation: GovernanceTierRecommendation;
  override: GovernanceTierOverrideLike | null;
}

/**
 * Resolves the tier that should actually govern onboarding: a client override,
 * once set, ALWAYS wins over a freshly recomputed recommendation -- even if
 * the recommendation later changes (e.g. because the Kraljic quadrant was
 * re-scored) -- until the client explicitly changes the override again. This
 * module never auto-clears or auto-reapplies a stale override; that decision
 * belongs to the client, not to this module.
 */
export function resolveEffectiveGovernanceTier(
  recommendation: GovernanceTierRecommendation,
  override: GovernanceTierOverrideLike | null | undefined,
): EffectiveGovernanceTier {
  if (override) {
    return {
      tier: override.tier,
      source: 'client-override',
      recommendation,
      override,
    };
  }
  return {
    tier: recommendation.recommendedTier,
    source: 'recommendation',
    recommendation,
    override: null,
  };
}
