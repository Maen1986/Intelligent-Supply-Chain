/**
 * clmRfxReviewEngine.ts
 *
 * Module 03 / #395 -- Category-Aware RFx Review Engine (the "review" half
 * of the owner's directive, 26 Aug 2026: "for both build and review
 * options... beside research you must build something logical
 * personalized, that design or review the RFx in a very distinguished
 * level, no generic, no assumption, no AI can provide the same.")
 *
 * Two entry points, mirroring Module 09's Generation/Review split:
 *
 * 1. `reviewDraftRfx()` -- review a buyer's own drafted RFx BEFORE issuing
 *    it. Checks the buyer's self-declared field entries and WBS-skeleton
 *    fill state against the category-derived `RfxScopeProfile` from
 *    clmRfxScopeEngine.ts -- so a construction review and an IT/
 *    professional-services review check structurally DIFFERENT things,
 *    not the same generic checklist with different labels.
 *
 * 2. `reviewSupplierResponse()` -- review a supplier's response against an
 *    issued RFx, using a requirements-traceability / compliance-matrix
 *    technique: every scope requirement maps to a corresponding response
 *    status (answered / not-answered / placeholder-or-vague). Source:
 *    Responsive "Proposal Compliance Matrix Guide," TestRail "Requirements
 *    Traceability Matrix," HHS "Requirements Traceability Practices
 *    Guide" (Module 03 doc Section 8.2).
 *
 * Honesty discipline, carried unchanged from clmReviewEngine.ts:
 * - Every finding here is self-declared-input logic (checklist state the
 *   user entered), never independent document-text extraction -- the
 *   AssuranceTier type and ASSURANCE_META descriptions are reused from
 *   clmReviewEngine.ts (Module 09) rather than redefined, so the same
 *   honesty language appears everywhere on the platform.
 * - No single fabricated composite "RFx quality score." Completeness is
 *   reported as real computed counts (N of M mandatory fields complete),
 *   never blended into an invented confidence number (Decision Record
 *   8.7, isc-ai-output-standards Principle #7).
 */

import { type AssuranceTier, ASSURANCE_META } from './clmReviewEngine';
import {
  resolveRfxScopeProfile,
  type RfxScopeProfile, type RfxScopeProfileInputs,
} from './clmRfxScopeEngine';

// ---------------------------------------------------------------------------
// Draft-RFx completeness review (build-side self-check, before issuing)
// ---------------------------------------------------------------------------

export type FieldCompleteness = 'present-measurable' | 'present-vague' | 'missing';

export const FIELD_COMPLETENESS_META: Record<FieldCompleteness, { labelEn: string; labelAr: string }> = {
  'present-measurable': { labelEn: 'Present & Measurable', labelAr: 'موجود وقابل للقياس' },
  'present-vague': { labelEn: 'Present but Vague', labelAr: 'موجود لكنه غامض' },
  missing: { labelEn: 'Missing', labelAr: 'مفقود' },
};

export interface FieldEntryState {
  entered: boolean;
  /** Self-declared by the buyer -- mirrors the platform-wide honesty rule
   *  that this is checklist state, not verified document-text extraction. */
  selfDeclaredMeasurable?: boolean;
}

export interface DraftRfxReviewInput extends RfxScopeProfileInputs {
  fieldEntries: Record<string, FieldEntryState>;
  wbsNodesFilled: Record<string, boolean>;
}

export interface FieldReviewFinding {
  fieldId: string;
  labelEn: string;
  labelAr: string;
  completeness: FieldCompleteness;
  assuranceTier: AssuranceTier;
  noteEn: string;
  noteAr: string;
}

export interface WbsReviewFinding {
  nodeId: string;
  labelEn: string;
  labelAr: string;
  filled: boolean;
}

export interface RfxCompletenessReport {
  profile: RfxScopeProfile;
  fieldFindings: FieldReviewFinding[];
  wbsFindings: WbsReviewFinding[];
  /** Real computed counts, never a blended/fabricated single score. */
  counts: {
    mandatoryFieldsTotal: number;
    presentMeasurable: number;
    presentVague: number;
    missing: number;
    wbsNodesTotal: number;
    wbsNodesFilled: number;
  };
  summaryEn: string;
  summaryAr: string;
}

function classifyField(entry: FieldEntryState | undefined, mustBeMeasurable: boolean): { completeness: FieldCompleteness; assuranceTier: AssuranceTier; noteEn: string; noteAr: string } {
  if (!entry || !entry.entered) {
    return {
      completeness: 'missing',
      assuranceTier: 'self-declared-consistent',
      noteEn: 'Not yet entered -- a mandatory field for this category/RFx-type combination per the sourced scope profile.',
      noteAr: 'لم يُدخل بعد -- حقل إلزامي لهذا المزيج من الفئة/نوع طلب العرض وفق ملف النطاق الموثق.',
    };
  }
  if (mustBeMeasurable && !entry.selfDeclaredMeasurable) {
    return {
      completeness: 'present-vague',
      assuranceTier: 'self-declared-consistent',
      noteEn: 'Entered, but this field is flagged as requiring measurable/numeric content (CIPS/NIGP scope-creep-prevention convention) and you have not confirmed it meets that bar.',
      noteAr: 'تم إدخاله، لكن هذا الحقل مُعلَّم كحقل يتطلب محتوى قابلاً للقياس/رقمياً (اصطلاح CIPS/NIGP لمنع زحف النطاق) ولم تؤكدوا استيفاءه لذلك المعيار.',
    };
  }
  return {
    completeness: 'present-measurable',
    assuranceTier: 'self-declared-consistent',
    noteEn: 'Entered and self-declared as specific/measurable.',
    noteAr: 'تم إدخاله وتم الإقرار بأنه محدد/قابل للقياس.',
  };
}

/**
 * Reviews a buyer's own drafted RFx before it is issued -- checks
 * self-declared field entries and WBS-skeleton fill state against the
 * SAME category-derived profile the build side (clmRfxScopeEngine.ts)
 * produces, so build and review are always checking the same real,
 * sourced requirement set rather than two independently-invented lists.
 */
export function reviewDraftRfx(input: DraftRfxReviewInput): RfxCompletenessReport | undefined {
  const profile = resolveRfxScopeProfile(input);
  if (!profile) return undefined;

  const fieldFindings: FieldReviewFinding[] = profile.mandatoryFields.map((field) => {
    const cls = classifyField(input.fieldEntries[field.id], field.mustBeMeasurable);
    return {
      fieldId: field.id,
      labelEn: field.labelEn,
      labelAr: field.labelAr,
      completeness: cls.completeness,
      assuranceTier: cls.assuranceTier,
      noteEn: cls.noteEn,
      noteAr: cls.noteAr,
    };
  });

  const wbsFindings: WbsReviewFinding[] = profile.wbsSkeleton.map((node) => ({
    nodeId: node.id,
    labelEn: node.labelEn,
    labelAr: node.labelAr,
    filled: !!input.wbsNodesFilled[node.id],
  }));

  const presentMeasurable = fieldFindings.filter(f => f.completeness === 'present-measurable').length;
  const presentVague = fieldFindings.filter(f => f.completeness === 'present-vague').length;
  const missing = fieldFindings.filter(f => f.completeness === 'missing').length;
  const wbsNodesFilled = wbsFindings.filter(w => w.filled).length;

  const counts = {
    mandatoryFieldsTotal: fieldFindings.length,
    presentMeasurable,
    presentVague,
    missing,
    wbsNodesTotal: wbsFindings.length,
    wbsNodesFilled,
  };

  const summaryEn = missing === 0 && presentVague === 0
    ? `All ${counts.mandatoryFieldsTotal} mandatory fields for this ${profile.industryBucket} / ${profile.rfxType.toUpperCase()} scope are present and measurable. ${wbsNodesFilled} of ${counts.wbsNodesTotal} WBS deliverable nodes are filled. ${ASSURANCE_META['self-declared-consistent'].descEn}`
    : `${missing} of ${counts.mandatoryFieldsTotal} mandatory fields are missing and ${presentVague} are present but flagged as not yet measurable -- both are common, cited sources of scope-creep and post-award disputes for this category. ${wbsNodesFilled} of ${counts.wbsNodesTotal} WBS deliverable nodes are filled. ${ASSURANCE_META['self-declared-consistent'].descEn}`;

  const summaryAr = missing === 0 && presentVague === 0
    ? `جميع الحقول الإلزامية البالغ عددها ${counts.mandatoryFieldsTotal} لهذا النطاق (${profile.industryBucket} / ${profile.rfxType.toUpperCase()}) موجودة وقابلة للقياس. تم ملء ${wbsNodesFilled} من أصل ${counts.wbsNodesTotal} من عقد هيكل تجزئة العمل. ${ASSURANCE_META['self-declared-consistent'].descAr}`
    : `${missing} من أصل ${counts.mandatoryFieldsTotal} حقلاً إلزامياً مفقود، و${presentVague} موجود لكنه مُعلَّم كغير قابل للقياس بعد -- كلاهما مصدر شائع وموثق لزحف النطاق والنزاعات بعد الترسية لهذه الفئة. تم ملء ${wbsNodesFilled} من أصل ${counts.wbsNodesTotal} من عقد هيكل تجزئة العمل. ${ASSURANCE_META['self-declared-consistent'].descAr}`;

  return { profile, fieldFindings, wbsFindings, counts, summaryEn, summaryAr };
}

// ---------------------------------------------------------------------------
// Supplier-response requirements-traceability / compliance matrix
// ---------------------------------------------------------------------------

export type ResponseMatchStatus = 'answered' | 'not-answered' | 'placeholder-or-vague';

export const RESPONSE_STATUS_META: Record<ResponseMatchStatus, { labelEn: string; labelAr: string }> = {
  answered: { labelEn: 'Answered', labelAr: 'تمت الإجابة' },
  'not-answered': { labelEn: 'Not Answered', labelAr: 'لم تتم الإجابة' },
  'placeholder-or-vague': { labelEn: 'Placeholder / Vague', labelAr: 'نص بديل مؤقت / غامض' },
};

export interface ResponseEntryState {
  answered: boolean;
  /** Self-declared: does the response text actually contain specific,
   *  checkable content for this requirement, or is it boilerplate/
   *  placeholder text? Same self-declared-input honesty rule as the
   *  draft-review side above. */
  selfDeclaredSpecific?: boolean;
}

export interface SupplierResponseReviewInput extends RfxScopeProfileInputs {
  responseEntries: Record<string, ResponseEntryState>;
}

export interface ResponseMatrixRow {
  fieldId: string;
  labelEn: string;
  labelAr: string;
  status: ResponseMatchStatus;
  assuranceTier: AssuranceTier;
  noteEn: string;
  noteAr: string;
}

export interface SupplierResponseReviewReport {
  profile: RfxScopeProfile;
  matrix: ResponseMatrixRow[];
  counts: {
    requirementsTotal: number;
    answered: number;
    notAnswered: number;
    placeholderOrVague: number;
  };
  summaryEn: string;
  summaryAr: string;
}

function classifyResponse(entry: ResponseEntryState | undefined): { status: ResponseMatchStatus; noteEn: string; noteAr: string } {
  if (!entry || !entry.answered) {
    return {
      status: 'not-answered',
      noteEn: 'No response entry recorded for this requirement -- an unanswered mandatory item is a common disqualification trigger.',
      noteAr: 'لا يوجد إدخال استجابة مسجل لهذا المتطلب -- عدم الإجابة على بند إلزامي سبب شائع لاستبعاد العرض.',
    };
  }
  if (!entry.selfDeclaredSpecific) {
    return {
      status: 'placeholder-or-vague',
      noteEn: 'Answered, but flagged as not yet specific/checkable -- generic or boilerplate language against a requirement that needs a concrete, verifiable answer.',
      noteAr: 'تمت الإجابة، لكنها مُعلَّمة كغير محددة/غير قابلة للتحقق بعد -- صياغة عامة أو نمطية مقابل متطلب يحتاج إجابة ملموسة وقابلة للتحقق.',
    };
  }
  return {
    status: 'answered',
    noteEn: 'Answered with a specific, checkable response.',
    noteAr: 'تمت الإجابة بردٍ محدد وقابل للتحقق.',
  };
}

/**
 * Requirements-traceability / proposal-compliance-matrix technique
 * (Responsive, TestRail, HHS -- Module 03 doc Section 8.2): maps every
 * requirement in the SAME category-derived scope profile used to build
 * the RFx to a supplier response status, rather than a free-text read of
 * the proposal -- so a construction response and an IT response are
 * checked against structurally different requirement sets, matching what
 * was actually asked for that category.
 */
export function reviewSupplierResponse(input: SupplierResponseReviewInput): SupplierResponseReviewReport | undefined {
  const profile = resolveRfxScopeProfile(input);
  if (!profile) return undefined;

  const matrix: ResponseMatrixRow[] = profile.mandatoryFields.map((field) => {
    const cls = classifyResponse(input.responseEntries[field.id]);
    return {
      fieldId: field.id,
      labelEn: field.labelEn,
      labelAr: field.labelAr,
      status: cls.status,
      assuranceTier: 'self-declared-consistent',
      noteEn: cls.noteEn,
      noteAr: cls.noteAr,
    };
  });

  const answered = matrix.filter(r => r.status === 'answered').length;
  const notAnswered = matrix.filter(r => r.status === 'not-answered').length;
  const placeholderOrVague = matrix.filter(r => r.status === 'placeholder-or-vague').length;

  const counts = { requirementsTotal: matrix.length, answered, notAnswered, placeholderOrVague };

  const summaryEn = notAnswered === 0 && placeholderOrVague === 0
    ? `All ${counts.requirementsTotal} requirements for this ${profile.industryBucket} / ${profile.rfxType.toUpperCase()} scope are answered with specific, checkable content. ${ASSURANCE_META['self-declared-consistent'].descEn}`
    : `${notAnswered} of ${counts.requirementsTotal} requirements are unanswered and ${placeholderOrVague} are answered with placeholder/vague content -- per the requirements-traceability technique, every gap here is a named, checkable item, not a generic "incomplete" flag. ${ASSURANCE_META['self-declared-consistent'].descEn}`;

  const summaryAr = notAnswered === 0 && placeholderOrVague === 0
    ? `جميع المتطلبات البالغ عددها ${counts.requirementsTotal} لهذا النطاق (${profile.industryBucket} / ${profile.rfxType.toUpperCase()}) تمت الإجابة عليها بمحتوى محدد وقابل للتحقق. ${ASSURANCE_META['self-declared-consistent'].descAr}`
    : `${notAnswered} من أصل ${counts.requirementsTotal} متطلباً دون إجابة، و${placeholderOrVague} تمت الإجابة عليها بمحتوى نمطي/غامض -- وفق تقنية مصفوفة تتبع المتطلبات، كل فجوة هنا بند مسمى وقابل للتحقق، لا مجرد إشارة عامة إلى "نقص". ${ASSURANCE_META['self-declared-consistent'].descAr}`;

  return { profile, matrix, counts, summaryEn, summaryAr };
}
