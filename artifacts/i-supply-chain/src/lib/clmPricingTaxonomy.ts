/**
 * clmPricingTaxonomy.ts
 *
 * Module 04 (Contract Intelligence v10, Pricing-Type Taxonomy, item 34) --
 * pricing-structure metadata and the self-declared misuse ("worth a second
 * look") flag for the CLM contract register.
 *
 * Three primary types (FFP, Cost-Plus, T&M) plus the extended CIPS/FAR-style
 * list (Unit Price through Target Cost/Gain-Share) -- the extended list is
 * carried as documented but not independently re-verified item-by-item
 * (Module 08 item 36, still open, low priority; does not block this build).
 *
 * Structural correction #1 (Module 04): pricing is not always one type per
 * contract -- `pricingPrimary`/`pricingSecondary`/`pricingPhaseBreakdown`
 * mirror the doc's corrected schema (a FIDIC Yellow Book contract is
 * commonly lump-sum for defined scope plus unit-price provisional sums; a
 * Gold Book DBO contract might use GMP for construction and CPIF for
 * operate).
 *
 * Structural correction #2 (Module 04): the misuse flag is self-declared-
 * input logic, not verified extraction -- same honesty distinction as
 * Module 01's governing-law mismatch flag. Client-facing framing is
 * "Worth a second look", never "misuse"/"error" (item 35).
 */

export type PricingType =
  | 'ffp' | 'cost-plus' | 'tm'
  | 'unit-price' | 'fp-epa' | 'cpff' | 'cpif' | 'cpaf' | 'gmp' | 'target-cost-gainshare'
  | 'other' | '';

export interface PricingTypeMeta {
  id: PricingType;
  label: string;
  labelAr: string;
}

export const PRICING_TYPES: PricingTypeMeta[] = [
  { id: 'ffp', label: 'Firm Fixed-Price (FFP)', labelAr: 'السعر الثابت الإجمالي (FFP)' },
  { id: 'cost-plus', label: 'Cost-Reimbursable / Cost-Plus', labelAr: 'التكلفة المستردة / التكلفة زائد أتعاب' },
  { id: 'tm', label: 'Time & Materials (T&M)', labelAr: 'الوقت والمواد (T&M)' },
  { id: 'unit-price', label: 'Unit Price', labelAr: 'سعر الوحدة' },
  { id: 'fp-epa', label: 'Fixed-Price with Economic Price Adjustment (FP-EPA)', labelAr: 'السعر الثابت مع تعديل اقتصادي للسعر (FP-EPA)' },
  { id: 'cpff', label: 'Cost-Plus-Fixed-Fee (CPFF)', labelAr: 'التكلفة زائد أتعاب ثابتة (CPFF)' },
  { id: 'cpif', label: 'Cost-Plus-Incentive-Fee (CPIF)', labelAr: 'التكلفة زائد أتعاب تحفيزية (CPIF)' },
  { id: 'cpaf', label: 'Cost-Plus-Award-Fee (CPAF)', labelAr: 'التكلفة زائد أتعاب تقديرية (CPAF)' },
  { id: 'gmp', label: 'Guaranteed Maximum Price (GMP)', labelAr: 'الحد الأقصى المضمون للسعر (GMP)' },
  { id: 'target-cost-gainshare', label: 'Target Cost / Gain-Share', labelAr: 'التكلفة المستهدفة مع تقاسم المكاسب' },
  { id: 'other', label: 'Other / not specified', labelAr: 'أخرى / غير محدد' },
];

export function pricingTypeLabel(type: PricingType | undefined, isAr: boolean): string {
  if (!type) return '';
  const meta = PRICING_TYPES.find((t) => t.id === type);
  if (!meta) return '';
  return isAr ? meta.labelAr : meta.label;
}

export type ScopeDefiniteness = 'well-defined' | 'evolving' | 'uncertain' | '';

export const SCOPE_DEFINITENESS_OPTIONS: { id: ScopeDefiniteness; label: string; labelAr: string }[] = [
  { id: 'well-defined', label: 'Well-defined', labelAr: 'محدد جيداً' },
  { id: 'evolving', label: 'Evolving', labelAr: 'متطور / قابل للتغيير' },
  { id: 'uncertain', label: 'Highly uncertain', labelAr: 'غير مؤكد إلى حد كبير' },
];

export interface PricingPhase {
  phase: string;
  pricingType: PricingType;
}

export interface PricingFlagCheck {
  flagged: boolean;
  reasonEn: string;
  reasonAr: string;
}

const notFlagged: PricingFlagCheck = { flagged: false, reasonEn: '', reasonAr: '' };

function durationDays(startDate: string | undefined, endDate: string | undefined): number | undefined {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end)) return undefined;
  return Math.round((end - start) / 86400000);
}

/**
 * Self-declared "worth a second look" flag (Module 04, items 34-35) -- never
 * a verified-misuse verdict. Three rules, each requiring a self-declared
 * field the client entered (never inferred):
 *  - FFP on a self-declared evolving/uncertain scope
 *  - Cost-Plus on a self-declared well-defined scope
 *  - T&M with no cap/milestones on a long-duration (>365 day) engagement
 */
export function checkPricingMisuseFlag(
  pricingPrimary: PricingType | undefined,
  scopeDefiniteness: ScopeDefiniteness | undefined,
  hasCapOrMilestones: boolean | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): PricingFlagCheck {
  if (!pricingPrimary || pricingPrimary === 'other') return notFlagged;

  if (pricingPrimary === 'ffp') {
    if (scopeDefiniteness === 'evolving' || scopeDefiniteness === 'uncertain') {
      return {
        flagged: true,
        reasonEn: 'Firm Fixed-Price is set, but the scope was self-declared as evolving/uncertain. FFP works best on well-defined, stable scope -- worth a second look, based on what you told us.',
        reasonAr: 'تم تحديد السعر الثابت الإجمالي، إلا أن نطاق العمل صُنّف ذاتياً على أنه متطور أو غير مؤكد. يعمل هذا النوع من التسعير بشكل أفضل مع نطاق محدد ومستقر -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
      };
    }
    return notFlagged;
  }

  if (pricingPrimary === 'cost-plus') {
    if (scopeDefiniteness === 'well-defined') {
      return {
        flagged: true,
        reasonEn: 'Cost-Reimbursable/Cost-Plus is set, but the scope was self-declared as well-defined. Cost-Plus fits genuinely uncertain or complex scope; a well-defined scope usually suits Fixed-Price better -- worth a second look, based on what you told us.',
        reasonAr: 'تم تحديد التكلفة زائد أتعاب، إلا أن نطاق العمل صُنّف ذاتياً على أنه محدد جيداً. يناسب هذا النوع النطاق غير المؤكد أو المعقد فعلياً؛ أما النطاق المحدد جيداً فيناسبه غالباً السعر الثابت -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
      };
    }
    return notFlagged;
  }

  if (pricingPrimary === 'tm') {
    if (hasCapOrMilestones === false) {
      const days = durationDays(startDate, endDate);
      if (typeof days === 'number' && days > 365) {
        return {
          flagged: true,
          reasonEn: 'Time & Materials is set with no cap or milestones on an engagement longer than a year. Uncapped T&M on long-duration work carries open-ended budget exposure -- worth a second look, based on what you told us.',
          reasonAr: 'تم تحديد الوقت والمواد دون سقف مالي أو معالم واضحة، على مدى التزام يتجاوز عاماً واحداً. قد يترتب على ذلك تعرّض غير محدود للميزانية -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
        };
      }
    }
    return notFlagged;
  }

  return notFlagged;
}

// ---------------------------------------------------------------------------
// Part E, rule 2 (Contract Intelligence v10 Module 03, cross-module wiring):
// industry SOW bucket (Module 05) and its commonly-paired pricing type.
// ---------------------------------------------------------------------------

/**
 * Commonly-paired pricing types per Module 05 industry bucket -- general
 * contract-pricing-type guidance (FAR Part 16's contract-type categories;
 * CIPS pricing-strategy guidance), the same generic sourcing register
 * already used elsewhere in this file ("the extended CIPS/FAR-style list").
 * This is a **typical pattern**, not a rule: a real contract can and does
 * legitimately deviate (e.g. a construction EPC using GMP is normal; a
 * professional-services retainer using FFP for a fixed monthly scope is
 * normal). It exists only to power an informational "worth confirming"
 * flag, never a blocking error -- same honesty register as
 * checkPricingMisuseFlag above (item 35's rule: "worth a second look",
 * never "misuse"/"error").
 */
export const TYPICAL_PRICING_BY_BUCKET: Record<string, PricingType[]> = {
  'supply-goods': ['ffp', 'unit-price'],
  'construction': ['ffp', 'gmp', 'unit-price'],
  'om': ['fp-epa', 'cpff'],
  'professional-services': ['tm', 'cpff', 'ffp'],
  'logistics': ['unit-price', 'fp-epa'],
};

/**
 * Part E, rule 2: flags when the contract's selected primary pricing type
 * (Module 04) is outside the commonly-paired set for its self-declared
 * industry bucket (Module 05) -- informational only, phrased as "worth
 * confirming", not a misuse verdict. Silent (not flagged) when either field
 * is unset, when the bucket has no documented typical set, or when
 * pricingPrimary is 'other'/blank -- consistent with checkPricingMisuseFlag
 * above never flagging on incomplete input.
 */
export function checkIndustryPricingPatternFlag(
  industryBucket: string | undefined,
  pricingPrimary: PricingType | undefined,
): PricingFlagCheck {
  if (!industryBucket || !pricingPrimary || pricingPrimary === 'other') return notFlagged;
  const typical = TYPICAL_PRICING_BY_BUCKET[industryBucket];
  if (!typical || typical.length === 0) return notFlagged;
  if (typical.includes(pricingPrimary)) return notFlagged;

  const typicalLabelsEn = typical.map((t) => pricingTypeLabel(t, false)).join(', ');
  const typicalLabelsAr = typical.map((t) => pricingTypeLabel(t, true)).join('، ');
  return {
    flagged: true,
    reasonEn: `${pricingTypeLabel(pricingPrimary, false)} is set, which is less commonly paired with this industry bucket -- ${typicalLabelsEn} are the more typical patterns here. Not an error; many contracts legitimately deviate -- worth confirming this was a deliberate choice.`,
    reasonAr: `تم تحديد ${pricingTypeLabel(pricingPrimary, true)}، وهو أقل شيوعاً مع قطاع الصناعة هذا -- الأنماط الأكثر شيوعاً هنا هي ${typicalLabelsAr}. هذا ليس خطأً؛ فكثير من العقود تنحرف عن ذلك بشكل مشروع -- يستحق التأكد من أن هذا كان اختياراً مقصوداً.`,
  };
}
