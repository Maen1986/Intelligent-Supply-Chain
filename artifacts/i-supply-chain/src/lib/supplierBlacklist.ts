/**
 * SI Supplier Lifecycle Governance -- Item 6 of 7: Supplier Blacklist
 * (the negative, for-cause counterpart to Item 3's ASL) (12 Sep 2026).
 *
 * ============================================================================
 * SOURCED METHODOLOGY (Decision Record 8.7, Rule 2) -- checked, not assumed
 * ============================================================================
 * Debarment/blacklisting due-process structure is grounded in two real,
 * named, publicly-documented frameworks, fetched 12 Sep 2026:
 *   1. The World Bank Group Sanctions System (Office of Suspension and
 *      Debarment) -- a real, mature due-process regime: the Evaluation and
 *      Suspension Officer must find "sufficient evidence" before a Notice of
 *      Sanctions Proceedings issues; the accused party (Respondent) gets a
 *      structured two-tier right of response (an Explanation to the EO, then
 *      a de novo Response to the Sanctions Board); and debarment duration is
 *      explicitly NOT one-size-fits-all -- "Debarment for a Fixed Term",
 *      conditional release on compliance, or permanent debarment reserved
 *      for cases with "no realistic prospect of rehabilitation", with even
 *      long (10+ year) debarments carrying a petition-for-reduction path.
 *   2. The UK Procurement Act 2023's supplier exclusion/debarment list --
 *      a real, current (as of this fetch) public-procurement law distinguishing
 *      MANDATORY exclusion grounds (automatic, for specified periods) from
 *      DISCRETIONARY grounds (the authority "exercis[es] discretion"), giving
 *      excluded suppliers an 8-working-day standstill period plus a 30-day
 *      appeal window, and allowing a supplier to apply for removal on "a
 *      material change of circumstances" (self-cleaning) -- exclusions run
 *      for "a specified period of time", not by default forever.
 * ISC's own due-process vocabulary below (evidenceThreshold, rightToRespond,
 * durationType) is a deliberate synthesis of these two real regimes, not an
 * invented standard -- disclosed as a synthesis, not attributed word-for-word
 * to either source alone.
 *
 * HONEST GCC-SPECIFIC DISCLOSURE (checked directly, not assumed): a
 * GCC-specific mechanism WAS found -- Saudi Arabia's Government Tenders and
 * Procurement Law (GTPL) gives the Ministry of Finance the role of
 * "maintaining a list of boycotts" (a real, named, government-operated
 * supplier exclusion register). However, the secondary legal-commentary
 * sources available to this research (Al Tamimi & Co., Reed Smith) do not
 * publish the Implementing Regulations' procedural detail -- grounds,
 * appeal rights, duration -- for that specific list; those sources
 * themselves say the finer detail sits in Implementing Regulations "referred
 * to... over 60 times" that were not available to fetch here. This module
 * therefore cites the GTPL boycott-list mechanism as real evidence that a
 * GCC-specific precedent exists, WITHOUT fabricating its procedural detail --
 * the World Bank / UK Procurement Act frameworks above supply the actual
 * due-process shape used below. Separately, Nazaha (Saudi Arabia's Oversight
 * and Anti-Corruption Authority) was checked directly and found to be a
 * general anti-corruption investigation/referral body, NOT a supplier
 * blacklist operator -- correcting what could otherwise have been an
 * assumed premise. CIPS's own public materials on ethical procurement were
 * also checked and found to be preventative (what suppliers should do), not
 * remedial (what a buyer does when a supplier fails) -- so CIPS is not cited
 * as a source for the due-process mechanics below, unlike Items 1-5 where
 * CIPS materials directly supported the built logic.
 *
 * ============================================================================
 * WHAT THIS IS, AND WHAT IT IS DELIBERATELY NOT
 * ============================================================================
 * This is NOT simply "lapsing off the ASL." Item 3's supplierPreQualification.ts
 * already has 'suspended' / 'revoked' ASL decision types for administrative,
 * often no-fault or routine reasons (failed re-review, certification lapsed,
 * commercial relationship ended). Blacklist is a distinct, more severe
 * governance action: an affirmative, for-cause finding that a supplier
 * engaged in conduct serious enough to warrant active exclusion, carrying
 * real due-process implications for a real, external commercial counterparty
 * -- an evidence threshold, a right to respond, and an explicit,
 * non-default-permanent duration decision. supplierRACI.ts's own Item 2
 * design already anticipated this distinction: 'blacklist_decision' (for-
 * cause) and 'offboarding_decision' (no-fault, Item 7) are two separate RACI
 * activity keys, not one.
 *
 * ============================================================================
 * THIS IS NOT A ONE-CLICK BAN (deliberate UI-resistance design contract)
 * ============================================================================
 * Given the real commercial and legal stakes for an actual company, nothing
 * in this module or its UI treats finalizing a blacklist entry as casual or
 * reversible-by-accident. Concretely: computeAdvisoryBlacklistRecommendation()
 * only ever RECOMMENDS a review, never a finalized action; validateBlacklistFinalization()
 * refuses to validate a finalize attempt unless evidenceThreshold is met AND
 * rightToRespondConfirmed is true AND a durationType decision was made
 * explicitly (never defaulted); and the calling UI (SupplierBlacklist.tsx)
 * is required to walk a multi-step confirm flow before finalize is ever
 * called, per the platform's own UI/UX-is-not-optional rule (Rule 9) applied
 * here with unusual weight.
 *
 * ============================================================================
 * TWO TIERS, NEITHER UNDERSIZED
 * ============================================================================
 *   - Advisory (default): computeAdvisoryBlacklistRecommendation() -- a
 *     flagged recommendation with rationale and supporting evidence links
 *     (Item 5's periodic-evaluation outcome, Item 1's severe COPQ figures,
 *     and/or manually-documented evidence), zero persistence. The CLIENT
 *     makes the actual blacklist call; this tier never asserts one.
 *   - Operational (opt-in): ISC persists the formal blacklist record via the
 *     append-only blacklist_events table (lib/db/src/schema/blacklistEvents.ts),
 *     with explicit effective dates, and a real cross-reference into Item
 *     3's own asl_decision_events table (see Section 5) rather than a
 *     duplicate parallel status field.
 *
 * ============================================================================
 * AUTHORIZATION BAR -- STRICTER THAN ITEMS 1-5, A DISCLOSED DESIGN DECISION
 * ============================================================================
 * Every write-gate through Item 5 accepted org_admin OR the org's current
 * RACI Accountable holder for the relevant activity, treated as equally
 * valid. For Item 6, that symmetry is deliberately broken:
 *   - A DRAFT blacklist recommendation (evidence-gathering, non-binding, the
 *     Operational-tier mirror of the Advisory tier's own recommendation) may
 *     be created/updated by org_admin OR the RACI Accountable holder for
 *     'blacklist_decision' -- same pattern as Items 1-5, because a draft has
 *     no real-world consequence yet.
 *   - FINALIZING a blacklist entry (the action with real commercial/legal
 *     consequence for the supplier) requires org_admin SPECIFICALLY. The
 *     RACI Accountable archetype for this activity is itself already
 *     "Procurement Director / CPO (or Executive Committee for high-risk
 *     cases)" (supplierRACI.ts's own RACI_TEMPLATE) -- a senior role, but one
 *     that any org_admin could in principle reassign to someone more junior
 *     via ordinary RACI reassignment. Given the due-process weight found in
 *     research above (a real external party's standing, with an evidence
 *     threshold and a right to respond that this platform is asserting on
 *     the client's behalf), finalize is gated to the org's own verified
 *     senior authority (org_admin) rather than a role that could be
 *     delegated arbitrarily. REVERSING a finalized entry (an appeal/
 *     correction) is equally consequential and gated identically to
 *     org_admin only. This is a genuine escalation over the Items 2-5
 *     pattern, not a copy-paste of the lighter gate -- stated here
 *     explicitly, per instruction, rather than silently reused.
 *
 * ============================================================================
 * REUSE, DON'T REINVENT -- EVIDENCE INPUTS, NOT AUTOMATIC TRIGGERS
 * ============================================================================
 * Item 5's poor periodic-evaluation outcomes and Item 1's severe COPQ
 * figures are natural SUGGESTED evidence, wired here as caller-supplied,
 * disclosed plain-data mirrors (PeriodicEvaluationOutcomeLike,
 * COPQSeverityLike below) -- never as automatic triggers. Nothing in this
 * module reads Item 1 or Item 5's live data or calls into their code; the
 * calling page supplies these facts, exactly the same "engines stay pure,
 * the UI composes them" pattern as every other module in this build. Unlike
 * Item 5 (which took one explicit, disclosed Standalone-First exception to
 * reuse the governance-tier module's cadence function directly), this
 * module has ZERO runtime imports from any sibling module -- there is no
 * comparable case here for a live cross-module call, so the normal rule
 * applies without exception.
 *
 * ============================================================================
 * CROSS-REFERENCE, NOT A DUPLICATE STATUS FIELD
 * ============================================================================
 * A finalized blacklist decision must flag the supplier's Item 3 ASL entry
 * as inactive. This module does NOT introduce a second "is blacklisted"
 * flag for other code to check. Instead (enforced in the route layer, see
 * artifacts/api-server/src/routes/blacklist.ts), finalizing a blacklist
 * event writes a REAL new row into the EXISTING asl_decision_events table
 * (decisionType: 'revoked', reasonCategory: 'compliance_violation') --
 * the same table and the same derivation logic Item 3 already owns. A
 * genuine, verified consequence of this design (confirmed by reading
 * artifacts/api-server/src/routes/onboarding.ts's own gate directly, not
 * assumed): Item 4's onboarding route already re-derives onASL fresh from
 * that same table on every write and refuses onboarding when a supplier is
 * not onASL -- so a finalized blacklist decision blocks future onboarding
 * attempts automatically, with ZERO changes needed to onboarding.ts. This
 * is the concrete cross-reference the spec asked for, not a forward-looking
 * promise.
 *
 * HONEST GAP, DISCLOSED RATHER THAN PAPERED OVER: the platform does not yet
 * have a purchase-order or commercial-transaction engine anywhere for a
 * blacklist check to block. computeBlacklistBlockSignal() below is exported
 * as the documented contract a future PO/contracting module should call
 * (same shape as the onboarding gate's own check) -- but nothing on the
 * platform calls it yet for POs, because there is no PO module yet to call
 * it. Stated here as a real, current limitation, not built around by
 * inventing a PO system that was not asked for.
 *
 * ============================================================================
 * FORWARD HOOK TO ITEM 7 (Offboarding/Transition) -- FLAGGED, NOT BUILT
 * ============================================================================
 * A finalized blacklist decision is a natural trigger into Item 7's
 * no-fault offboarding/transition workflow (e.g. winding down open POs,
 * transition planning) -- flagged here as a documented seam (see
 * ITEM7_FORWARD_HOOK_NOTE_EN/AR below) for Item 7 to wire when it is built,
 * not wired prematurely by this module. Item 7 does not exist yet; nothing
 * here calls it or assumes its shape.
 *
 * ============================================================================
 * CONSULTANCY FRAMING (Rule -- consistent with every prior item)
 * ============================================================================
 * ISC is not shop-floor operations and does not adjudicate disputes. This
 * module produces a recommendation, an evidence record, and (Operational
 * tier) a persisted decision the CLIENT'S OWN authorized user made -- it
 * does not itself investigate, contact the supplier, or make the
 * determination on the client's behalf.
 */

// ---------------------------------------------------------------------------
// Section 0 -- Caller-supplied evidence mirrors (Standalone-First, plain
// data only -- disclosed manually-synced mirrors of Item 1 / Item 5 output
// shapes, never a runtime import)
// ---------------------------------------------------------------------------

/** Mirrors supplierPeriodicEvaluation.ts's OverallRecommendation. */
export type PeriodicEvaluationOutcomeLike = {
  overallRecommendation: 'continue_standard_cadence' | 'monitor_closely' | 'escalate_consider';
  /** Mirrors CategoryScoreResult's rating for the single worst-rated category, if any. */
  worstCategoryRating?: 'strong' | 'acceptable' | 'watch' | 'at_risk';
  worstCategoryName?: string;
  evaluatedAtIso: string;
};

/** Mirrors supplierCOPQ.ts's COPQRollup -- only the fields this module's
 * evidence-sufficiency logic actually needs, not the full rollup detail. */
export type COPQSeverityLike = {
  periodLabel: string;
  totalCostedUSD: number | null;
  /** External Failure's share of total costed COPQ, 0-1 -- mirrors the same
   * "rising external-failure share is the leading severity signal" logic
   * documented in supplierCOPQ.ts's detectCOPQAlert(). */
  externalFailureShare: number | null;
};

/** Disclosed, manually-synced mirror of the 3 Module 07 fields
 * supplierPeriodicEvaluation.ts's own Module07EscalationSnapshotLike already
 * defines -- reused here at one further remove (Item 6 evidence, not Item 5's
 * own tension check) for the same reason: no live import, caller-supplied. */
export type Module07EscalationSnapshotLike = {
  recommendedIntervention: string;
  escalated: boolean;
  combinedSignalFlag: boolean;
};

// ---------------------------------------------------------------------------
// Section 1 -- Evidence vocabulary and due-process types
// ---------------------------------------------------------------------------

export type BlacklistEvidenceCategory =
  | 'periodic_evaluation_failure'
  | 'severe_copq'
  | 'performance_recovery_escalation'
  | 'compliance_violation'
  | 'contractual_breach'
  | 'other_documented_evidence';

export const BLACKLIST_EVIDENCE_CATEGORIES: BlacklistEvidenceCategory[] = [
  'periodic_evaluation_failure',
  'severe_copq',
  'performance_recovery_escalation',
  'compliance_violation',
  'contractual_breach',
  'other_documented_evidence',
];

export const BLACKLIST_EVIDENCE_LABELS: Record<BlacklistEvidenceCategory, { en: string; ar: string }> = {
  periodic_evaluation_failure: { en: 'Periodic evaluation failure (Item 5)', ar: 'إخفاق في التقييم الدوري (البند 5)' },
  severe_copq: { en: 'Severe cost of poor quality (Item 1)', ar: 'تكلفة جودة رديئة شديدة (البند 1)' },
  performance_recovery_escalation: { en: 'Active performance-recovery escalation (Module 07)', ar: 'تصعيد نشط لتعافي الأداء (الوحدة 07)' },
  compliance_violation: { en: 'Compliance / regulatory / ethical violation', ar: 'مخالفة امتثال / تنظيمية / أخلاقية' },
  contractual_breach: { en: 'Material contractual breach', ar: 'إخلال جوهري بالعقد' },
  other_documented_evidence: { en: 'Other documented evidence', ar: 'أدلة موثقة أخرى' },
};

export interface BlacklistEvidenceItem {
  category: BlacklistEvidenceCategory;
  detailEn: string;
  detailAr?: string;
  /** True for evidence categories with a documented, sourced basis (World
   * Bank / UK Procurement Act framing: some grounds are severe enough alone
   * to independently support action). ISC's own synthesis, disclosed, not a
   * claimed legal standard. */
  independentlySufficient: boolean;
}

/**
 * Which evidence categories, ISC's own synthesis (disclosed, not a claimed
 * legal standard), are treated as potentially sufficient on their own --
 * mirroring the World Bank's and UK Procurement Act's own pattern of naming
 * some grounds (e.g. a confirmed compliance violation, a material contractual
 * breach) as independently serious, versus others (e.g. a single 'watch'-
 * level periodic-evaluation category) that should accumulate with other
 * evidence rather than stand alone.
 */
export function isIndependentlySufficientCategory(category: BlacklistEvidenceCategory): boolean {
  return category === 'compliance_violation' || category === 'contractual_breach' || category === 'severe_copq';
}

export type DurationType = 'time_bound' | 'indefinite_pending_review' | 'permanent';

export const DURATION_TYPE_LABELS: Record<DurationType, { en: string; ar: string }> = {
  time_bound: { en: 'Time-bound (fixed term, with an end/review date)', ar: 'محدد المدة (مدة ثابتة، مع تاريخ انتهاء/مراجعة)' },
  indefinite_pending_review: { en: 'Indefinite, pending a defined future review', ar: 'غير محدد المدة، ريثما تتم مراجعة مستقبلية محددة' },
  permanent: { en: 'Permanent (reserved for the most severe, non-rehabilitable cases)', ar: 'دائم (مخصص لأشد الحالات خطورة وغير القابلة للتصحيح)' },
};

export const DURATION_TYPE_SOURCE_EN =
  'Explicit duration typing, rather than a single undifferentiated "blacklisted" flag, mirrors both the World Bank Sanctions System (which offers Debarment for a Fixed Term, conditional release, or permanent debarment "where there is no realistic prospect that the Respondent can be rehabilitated") and the UK Procurement Act 2023 debarment list (exclusions run for "a specified period of time", with a path to apply for removal on a material change of circumstances) -- never defaulting to permanent.';
export const DURATION_TYPE_SOURCE_AR =
  'تصنيف المدة الصريح، بدلاً من علم واحد غير مميَّز لـ"القائمة السوداء"، يعكس كلاً من نظام عقوبات البنك الدولي (الذي يتيح استبعاداً لمدة محددة، إفراجاً مشروطاً، أو استبعاداً دائماً "عند عدم وجود احتمال واقعي لإعادة التأهيل") وقائمة استبعاد قانون المشتريات البريطاني لعام 2023 (التي تُطبَّق لمدة محددة، مع مسار لطلب الإزالة عند حدوث تغيير جوهري في الظروف) -- دون اللجوء افتراضياً إلى الدوام.';

// ---------------------------------------------------------------------------
// Section 2 -- Advisory tier: flagged recommendation, never a finalized
// action, zero persistence
// ---------------------------------------------------------------------------

export type BlacklistRecommendation =
  | 'RECOMMEND_FORMAL_REVIEW'
  | 'RECOMMEND_HOLD_AT_ASL_SUSPENSION'
  | 'RECOMMEND_INSUFFICIENT_EVIDENCE';

export interface BlacklistAdvisoryInput {
  evidence: BlacklistEvidenceItem[];
  periodicEvaluation?: PeriodicEvaluationOutcomeLike | null;
  copqSeverity?: COPQSeverityLike | null;
  activeRecoveryEscalation?: Module07EscalationSnapshotLike | null;
}

export interface BlacklistAdvisoryAssessment {
  recommendation: BlacklistRecommendation;
  primaryEn: string;
  primaryAr: string;
  /** Rule 8 -- a genuine second option, never a single false-certainty path. */
  alternativeEn: string;
  alternativeAr: string;
  evidenceSufficient: boolean;
  suggestedEvidenceLinks: BlacklistEvidenceItem[];
  noteEn: string;
  noteAr: string;
}

/**
 * Builds the SUGGESTED evidence list from Item 5 / Item 1 signals --
 * suggestions only, never automatic triggers. The client's own manually-
 * entered `evidence` items in BlacklistAdvisoryInput are always included
 * as-is; this function additionally surfaces what Item 5/Item 1 data (if
 * supplied) would independently suggest, so nothing the client already
 * knows about is silently left off the evidence list.
 */
export function buildSuggestedEvidenceLinks(input: BlacklistAdvisoryInput): BlacklistEvidenceItem[] {
  const suggested: BlacklistEvidenceItem[] = [];
  if (input.periodicEvaluation?.overallRecommendation === 'escalate_consider') {
    suggested.push({
      category: 'periodic_evaluation_failure',
      detailEn: `Item 5 periodic evaluation (${input.periodicEvaluation.evaluatedAtIso}) recommended escalate_consider${input.periodicEvaluation.worstCategoryName ? `, weakest category: ${input.periodicEvaluation.worstCategoryName} (${input.periodicEvaluation.worstCategoryRating})` : ''}.`,
      independentlySufficient: false,
    });
  }
  if (input.copqSeverity && input.copqSeverity.totalCostedUSD !== null && input.copqSeverity.externalFailureShare !== null && input.copqSeverity.externalFailureShare >= 0.5) {
    suggested.push({
      category: 'severe_copq',
      detailEn: `Item 1 COPQ for ${input.copqSeverity.periodLabel}: total costed USD ${input.copqSeverity.totalCostedUSD.toLocaleString()}, with External Failure at ${(input.copqSeverity.externalFailureShare * 100).toFixed(0)}% of costed COPQ -- the same rising-external-failure-share signal Item 1's own detectCOPQAlert() treats as its leading severity indicator.`,
      independentlySufficient: true,
    });
  }
  if (input.activeRecoveryEscalation && (input.activeRecoveryEscalation.escalated || input.activeRecoveryEscalation.combinedSignalFlag)) {
    suggested.push({
      category: 'performance_recovery_escalation',
      detailEn: `Module 07 shows an active performance-recovery escalation: ${input.activeRecoveryEscalation.recommendedIntervention}.`,
      independentlySufficient: false,
    });
  }
  return suggested;
}

/**
 * Advisory tier: a flagged RECOMMENDATION with rationale and evidence links.
 * The client makes the actual blacklist call -- this function never asserts
 * one. Evidence sufficiency (ISC's own disclosed synthesis, Section 1) gates
 * whether a formal-review recommendation is even offered, never fabricating
 * confidence the evidence does not support (Decision Record 8.7).
 */
export function computeAdvisoryBlacklistRecommendation(input: BlacklistAdvisoryInput): BlacklistAdvisoryAssessment {
  const suggested = buildSuggestedEvidenceLinks(input);
  const allEvidence = [...input.evidence, ...suggested];

  const hasIndependentlySufficient = allEvidence.some((e) => e.independentlySufficient);
  const accumulatingCount = allEvidence.filter((e) => !e.independentlySufficient).length;
  const evidenceSufficient = hasIndependentlySufficient || accumulatingCount >= 2;

  if (allEvidence.length === 0) {
    return {
      recommendation: 'RECOMMEND_INSUFFICIENT_EVIDENCE',
      primaryEn: 'No evidence has been documented yet. Do not proceed toward a blacklist review without at least one documented, sourced evidence item -- an unstated judgment call is never sufficient grounds (Decision Record 8.7).',
      primaryAr: 'لم يتم توثيق أي أدلة بعد. لا تشرع في مراجعة القائمة السوداء دون عنصر أدلة موثق ومصدره محدد على الأقل -- فالحكم التقديري غير الموثق لا يُعد أبداً سبباً كافياً.',
      alternativeEn: 'N/A -- the only responsible path is to document real evidence first.',
      alternativeAr: 'لا ينطبق -- المسار المسؤول الوحيد هو توثيق أدلة حقيقية أولاً.',
      evidenceSufficient: false,
      suggestedEvidenceLinks: suggested,
      noteEn: 'INSUFFICIENT_EVIDENCE: zero evidence items supplied or suggested.',
      noteAr: 'أدلة غير كافية: لم تُقدَّم أو تُقترح أي عناصر أدلة.',
    };
  }

  if (!evidenceSufficient) {
    return {
      recommendation: 'RECOMMEND_HOLD_AT_ASL_SUSPENSION',
      primaryEn: 'Evidence is real but not yet sufficient for a blacklist recommendation (ISC\'s own threshold: at least one independently-sufficient category, e.g. a confirmed compliance violation or severe COPQ, OR two or more accumulating items). Recommend an ASL suspension (Item 3) instead -- reversible, administrative, and proportionate to the evidence currently on hand.',
      primaryAr: 'الأدلة حقيقية لكنها غير كافية بعد للتوصية بالإدراج في القائمة السوداء (وفق الحد الأدنى الخاص بـ آي إس سي: فئة واحدة كافية بذاتها على الأقل، كمخالفة امتثال مؤكدة أو تكلفة جودة رديئة شديدة، أو عنصرين متراكمين أو أكثر). يوصى بدلاً من ذلك بإيقاف مؤقت في القائمة المعتمدة (البند 3) -- إجراء قابل للعكس وإداري ومتناسب مع الأدلة المتوفرة حالياً.',
      alternativeEn: 'Strong alternative: continue gathering evidence over one more cycle (e.g. the next periodic evaluation or COPQ period) before any formal review, rather than either dropping the concern or escalating prematurely.',
      alternativeAr: 'بديل قوي: الاستمرار في جمع الأدلة خلال دورة إضافية واحدة (كالتقييم الدوري القادم أو فترة تكلفة الجودة الرديئة القادمة) قبل أي مراجعة رسمية، بدلاً من إسقاط المخاوف أو التصعيد المبكر.',
      evidenceSufficient: false,
      suggestedEvidenceLinks: suggested,
      noteEn: `${allEvidence.length} evidence item(s), none independently sufficient and fewer than 2 accumulating items.`,
      noteAr: `${allEvidence.length} عنصر (عناصر) أدلة، دون أي منها كافٍ بذاته وأقل من عنصرين متراكمين.`,
    };
  }

  return {
    recommendation: 'RECOMMEND_FORMAL_REVIEW',
    primaryEn: `Evidence meets ISC's disclosed sufficiency threshold for a formal blacklist review (${allEvidence.length} item(s), ${hasIndependentlySufficient ? 'including at least one independently-sufficient category' : 'accumulating across categories'}). This is a recommendation for YOUR organization's own formal review process -- confirm the supplier has been given a right to respond before any finalization, and decide the duration type (time-bound, indefinite-pending-review, or permanent) deliberately, never by default.`,
    primaryAr: 'تستوفي الأدلة حد الكفاية المُفصح عنه من آي إس سي لإجراء مراجعة رسمية للقائمة السوداء. هذه توصية لعملية المراجعة الرسمية الخاصة بمؤسستكم -- تأكدوا من منح المورد حق الرد قبل أي إنهاء، وحدِّدوا نوع المدة (محددة، غير محددة ريثما تُراجع، أو دائمة) بشكل متعمد، لا بشكل افتراضي.',
    alternativeEn: 'Strong alternative: a time-bound suspension from new commercial commitments (stopping short of a full blacklist) while the formal review runs, rather than either taking no interim action or finalizing a blacklist before due process (right to respond) has actually happened.',
    alternativeAr: 'بديل قوي: إيقاف مؤقت محدد المدة عن أي التزامات تجارية جديدة (دون الوصول إلى إدراج كامل في القائمة السوداء) أثناء إجراء المراجعة الرسمية، بدلاً من عدم اتخاذ أي إجراء مؤقت أو إنهاء الإدراج في القائمة السوداء قبل استيفاء الإجراءات الواجبة (حق الرد) فعلياً.',
    evidenceSufficient: true,
    suggestedEvidenceLinks: suggested,
    noteEn: `${allEvidence.length} evidence item(s); sufficiency met via ${hasIndependentlySufficient ? 'an independently-sufficient category' : 'accumulation (2+ items)'}.`,
    noteAr: 'استوفيت الأدلة حد الكفاية.',
  };
}

// ---------------------------------------------------------------------------
// Section 3 -- Operational tier: finalize/reverse validation (due-process
// enforcement) -- write-GATING (who is allowed to write) stays entirely in
// the route layer (artifacts/api-server/src/routes/blacklist.ts), same
// separation every prior item's lib file keeps.
// ---------------------------------------------------------------------------

export interface BlacklistFinalizationInput {
  evidence: BlacklistEvidenceItem[];
  rightToRespondConfirmed: boolean;
  durationType: DurationType | null;
  /** Required when durationType === 'time_bound'. ISO date string. */
  effectiveUntilIso: string | null;
}

export interface BlacklistFinalizationValidation {
  valid: boolean;
  errorsEn: string[];
  errorsAr: string[];
}

/**
 * The core due-process enforcement point, mirroring supplierPreQualification.ts's
 * validateASLDecision() technique: a finalize attempt this function rejects
 * must be rejected by the route layer too, never silently accepted because a
 * UI happened to allow the click.
 */
export function validateBlacklistFinalization(input: BlacklistFinalizationInput): BlacklistFinalizationValidation {
  const errorsEn: string[] = [];
  const errorsAr: string[] = [];

  const hasIndependentlySufficient = input.evidence.some((e) => e.independentlySufficient);
  const accumulatingCount = input.evidence.filter((e) => !e.independentlySufficient).length;
  if (!hasIndependentlySufficient && accumulatingCount < 2) {
    errorsEn.push('Evidence threshold not met -- at least one independently-sufficient evidence category, or two or more accumulating items, is required before finalization.');
    errorsAr.push('لم يُستوفَ حد الأدلة -- يلزم فئة أدلة واحدة كافية بذاتها على الأقل، أو عنصران متراكمان أو أكثر، قبل الإنهاء.');
  }

  if (!input.rightToRespondConfirmed) {
    errorsEn.push('Cannot finalize -- the right-to-respond step has not been confirmed. The supplier must be given an opportunity to respond before a blacklist entry is finalized (World Bank Sanctions System / UK Procurement Act 2023 due-process precedent).');
    errorsAr.push('لا يمكن الإنهاء -- لم يتم تأكيد خطوة حق الرد. يجب منح المورد فرصة للرد قبل إنهاء الإدراج في القائمة السوداء.');
  }

  if (!input.durationType) {
    errorsEn.push('A duration type (time-bound, indefinite-pending-review, or permanent) must be explicitly chosen -- never defaulted.');
    errorsAr.push('يجب اختيار نوع المدة (محددة، غير محددة ريثما تُراجع، أو دائمة) بشكل صريح -- دون اعتماد قيمة افتراضية.');
  } else if (input.durationType === 'time_bound' && !input.effectiveUntilIso) {
    errorsEn.push("A time-bound duration requires an explicit end/review date (effectiveUntilIso).");
    errorsAr.push('تتطلب المدة المحددة تاريخ انتهاء/مراجعة صريحاً.');
  }

  return { valid: errorsEn.length === 0, errorsEn, errorsAr };
}

/**
 * Minimum length (characters, after trimming) for a reversal justification.
 * A low bar deliberately: ISC does not adjudicate whether a stated reason is
 * GOOD (consultancy framing, Section 8 below) -- only that a real one was
 * actually typed, not left blank or filled with a single throwaway
 * character to get past a required-field check.
 */
export const MIN_REVERSAL_JUSTIFICATION_LENGTH = 15;

export interface BlacklistReversalInput {
  /**
   * Required, non-empty justification for reversing a finalized blacklist
   * entry. Sourced standard, matching the due-process rigor
   * validateBlacklistFinalization() already enforces for finalization: the
   * World Bank Sanctions System's own petition-for-reduction path and the
   * UK Procurement Act 2023's "material change of circumstances"
   * self-cleaning standard (Section 1) both require the party seeking
   * removal to STATE why circumstances have changed -- reversal is not a
   * bare, unexplained undo click. Gap identified and closed after the
   * initial build shipped /reverse with only an optional `notes` field.
   */
  justificationNote: string;
}

export interface BlacklistReversalValidation {
  valid: boolean;
  errorsEn: string[];
  errorsAr: string[];
}

/**
 * The reversal-side due-process enforcement point, mirroring
 * validateBlacklistFinalization()'s own discipline: a reversal this
 * function rejects must be rejected by the route layer too, never silently
 * accepted because a UI happened to allow the click.
 */
export function validateBlacklistReversal(input: BlacklistReversalInput): BlacklistReversalValidation {
  const errorsEn: string[] = [];
  const errorsAr: string[] = [];

  const trimmed = (input.justificationNote ?? '').trim();
  if (trimmed.length < MIN_REVERSAL_JUSTIFICATION_LENGTH) {
    errorsEn.push(`A justification is required to reverse a finalized blacklist entry (at least ${MIN_REVERSAL_JUSTIFICATION_LENGTH} characters) -- mirroring the same due-process standard already applied to finalization (World Bank petition-for-reduction path / UK Procurement Act 2023 "material change of circumstances"). A reversal cannot be a bare, unexplained undo.`);
    errorsAr.push(`يلزم تقديم تبرير لعكس إدراج نهائي في القائمة السوداء (${MIN_REVERSAL_JUSTIFICATION_LENGTH} حرفاً على الأقل) -- بما يعكس معيار الإجراءات الواجبة ذاته المطبَّق على الإنهاء (مسار طلب التخفيف لدى البنك الدولي / معيار "تغيّر جوهري في الظروف" في قانون المشتريات البريطاني لعام 2023). لا يجوز أن يكون العكس إجراء غير مبرر بلا تفسير.`);
  }

  return { valid: errorsEn.length === 0, errorsEn, errorsAr };
}

export interface BlacklistReversalSuggestion {
  suggestionEn: string;
  suggestionAr: string;
}

/**
 * Returned alongside every successful reversal -- extends the same "never
 * leave the client with silence" discipline computeAdvisoryBlacklistRecommendation()
 * already applies to RECOMMEND_HOLD_AT_ASL_SUSPENSION (Section 2) to the
 * reversal action. Gap identified and closed after the initial build:
 * reversing a blacklist entry lifts the exclusion itself, but the Section 5
 * cross-reference design only runs in the FINALIZE direction (writing a
 * 'revoked' row into asl_decision_events) -- it does not run in reverse, so
 * a reversal does not, and should not, silently restore the supplier's
 * Item 3 ASL status. Left unstated, an organization could easily assume
 * reversal alone re-qualifies the supplier; this function surfaces the
 * actual next step instead of leaving that gap implicit.
 */
export function buildReversalAslRequalificationSuggestion(supplierId: string): BlacklistReversalSuggestion {
  return {
    suggestionEn: `Reversing this blacklist entry lifts the exclusion itself, but does not automatically restore ${supplierId}'s Approved Supplier List (Item 3) status. If this supplier should now be reconsidered for the ASL, record a new, explicit Item 3 re-qualification decision -- a separate, deliberate step, not an automatic consequence of this reversal.`,
    suggestionAr: `يرفع عكس هذا الإدراج الاستبعاد نفسه، لكنه لا يُعيد تلقائياً حالة المورد ${supplierId} في القائمة المعتمدة (البند 3). إذا كان ينبغي إعادة النظر في تأهيل هذا المورد للقائمة المعتمدة، فسجِّلوا قرار إعادة تأهيل جديداً وصريحاً ضمن البند 3 -- فهذه خطوة منفصلة ومتعمدة، وليست نتيجة تلقائية لهذا العكس.`,
  };
}

// ---------------------------------------------------------------------------
// Section 4 -- Current-state derivation from append-only events (replay) --
// mirrors computeCurrentASLState() in supplierPreQualification.ts exactly.
// ---------------------------------------------------------------------------

export type BlacklistEventAction = 'draft_set' | 'draft_clear' | 'finalized' | 'reversed';

export interface BlacklistEventLike {
  id: number | string;
  supplierId: string;
  action: BlacklistEventAction;
  durationType: DurationType | null;
  effectiveUntilIso: string | null;
  createdAt: string;
}

export interface BlacklistCurrentState {
  supplierId: string;
  isBlacklisted: boolean;
  /** True when isBlacklisted was true via a time-bound entry whose
   * effectiveUntilIso has now passed -- a derived, honest expiry, never a
   * silently-extended default. */
  isExpired: boolean;
  hasOpenDraft: boolean;
  latestEvent: BlacklistEventLike | null;
}

function sortEventsChronologically(events: BlacklistEventLike[]): BlacklistEventLike[] {
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Replays one supplier's full append-only event history into its current
 * blacklist state. A 'finalized' event is authoritative until superseded by
 * a later 'reversed' event, OR until its own effectiveUntilIso passes (for
 * time_bound entries) -- expiry is a derived read-time fact, never a second
 * mutable column that could drift from the event log.
 */
export function computeCurrentBlacklistState(supplierId: string, events: BlacklistEventLike[], asOf: Date = new Date()): BlacklistCurrentState {
  const own = sortEventsChronologically(events.filter((e) => e.supplierId === supplierId));
  if (own.length === 0) {
    return { supplierId, isBlacklisted: false, isExpired: false, hasOpenDraft: false, latestEvent: null };
  }

  let isBlacklisted = false;
  let activeEntry: BlacklistEventLike | null = null;
  let hasOpenDraft = false;

  for (const ev of own) {
    if (ev.action === 'draft_set') hasOpenDraft = true;
    if (ev.action === 'draft_clear') hasOpenDraft = false;
    if (ev.action === 'finalized') {
      isBlacklisted = true;
      activeEntry = ev;
    }
    if (ev.action === 'reversed') {
      isBlacklisted = false;
      activeEntry = null;
    }
  }

  const isExpired = isBlacklisted && !!activeEntry && activeEntry.durationType === 'time_bound' && !!activeEntry.effectiveUntilIso && new Date(activeEntry.effectiveUntilIso).getTime() < asOf.getTime();

  return {
    supplierId,
    isBlacklisted: isBlacklisted && !isExpired,
    isExpired,
    hasOpenDraft,
    latestEvent: own[own.length - 1],
  };
}

// ---------------------------------------------------------------------------
// Section 5 -- ASL cross-reference note (the route layer performs the
// actual write into asl_decision_events; this is the disclosed, shared
// reason-text builder so both the route and any UI preview show identical
// wording -- never independently re-worded in two places)
// ---------------------------------------------------------------------------

export function buildAslCrossReferenceReasonNote(blacklistEventId: number | string): { en: string; ar: string } {
  return {
    en: `Automatically revoked from the Approved Supplier List as a direct consequence of blacklist event #${blacklistEventId} (Item 6). This is a real cross-reference, not an independent decision -- see that event's own evidence record for the underlying reason.`,
    ar: `تم إلغاء الإدراج تلقائياً من القائمة المعتمدة كنتيجة مباشرة لحدث القائمة السوداء رقم ${blacklistEventId} (البند 6). هذا إسناد مرجعي حقيقي، وليس قراراً مستقلاً -- راجع سجل الأدلة الخاص بذلك الحدث لمعرفة السبب الكامن.`,
  };
}

// ---------------------------------------------------------------------------
// Section 6 -- Forward-looking contract for a future PO/commercial-
// transaction engine (honest gap: no such engine exists on the platform
// yet, so nothing calls this today -- documented here so a future module
// has the exact shape to call, mirroring onboarding.ts's own gate check)
// ---------------------------------------------------------------------------

export interface BlacklistBlockSignal {
  blocked: boolean;
  reasonEn: string;
  reasonAr: string;
}

/** Documented contract only -- see Section header above. Not called by any
 * existing module today (no PO/commercial-transaction engine exists yet). */
export function computeBlacklistBlockSignal(state: BlacklistCurrentState): BlacklistBlockSignal {
  if (!state.isBlacklisted) {
    return { blocked: false, reasonEn: '', reasonAr: '' };
  }
  return {
    blocked: true,
    reasonEn: 'This supplier is currently blacklisted (Item 6). New commercial commitments should not proceed without an explicit, documented exception from an org_admin.',
    reasonAr: 'هذا المورد مُدرج حالياً في القائمة السوداء (البند 6). لا ينبغي المضي في التزامات تجارية جديدة دون استثناء صريح وموثق من مسؤول إدارة المؤسسة.',
  };
}

// ---------------------------------------------------------------------------
// Section 7 -- Forward hook to Item 7 (flagged, not built)
// ---------------------------------------------------------------------------

export const ITEM7_FORWARD_HOOK_NOTE_EN =
  'A finalized blacklist decision is a natural trigger into Item 7\'s no-fault offboarding/transition workflow (winding down open commitments, transition planning) -- flagged here as a documented seam for Item 7 to wire when it is built, not wired prematurely by this module.';
export const ITEM7_FORWARD_HOOK_NOTE_AR =
  'يُعد قرار الإدراج النهائي في القائمة السوداء مُحفِّزاً طبيعياً نحو مسار إنهاء التعامل/الانتقال بلا مخالفة الخاص بالبند 7 (تصفية الالتزامات المفتوحة، التخطيط للانتقال) -- تتم الإشارة إلى هذا الموضع هنا ليقوم البند 7 بربطه عند بنائه، دون ربطه مبكراً من هذه الوحدة.';

// ---------------------------------------------------------------------------
// Section 8 -- Consultancy framing (disclosed copy, reused by UI)
// ---------------------------------------------------------------------------

export const CONSULTANCY_FRAMING_NOTE_EN =
  'ISC is not shop-floor operations and does not adjudicate disputes: this module produces a recommendation, an evidence record, and (Operational tier) a persisted record of a decision YOUR organization\'s own authorized user made. It does not investigate, contact the supplier, or make the determination on your behalf.';
export const CONSULTANCY_FRAMING_NOTE_AR =
  'آي إس سي ليست جهة تشغيل ميداني ولا تفصل في النزاعات: تنتج هذه الوحدة توصية وسجل أدلة، و(في المستوى التشغيلي) سجلاً محفوظاً لقرار اتخذه مستخدم مخوَّل من مؤسستكم. لا تحقق آي إس سي ولا تتواصل مع المورد ولا تتخذ القرار نيابة عنكم.';
