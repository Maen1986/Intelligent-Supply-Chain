/**
 * SI Module 07 -- Supplier-level ESG evidence (Round B3, Nov 2026).
 *
 * Gap closed: ESG/sustainability was unscored at supplier level (disclosed
 * gap, Problem Map "Sustainability" focus area). Building a numeric ESG score
 * would require weights and thresholds that ISC cannot source for a supplier
 * of arbitrary size and sector, so this module does NOT score. It records, per
 * theme, WHAT EVIDENCE exists and HOW STRONG it is, and reports gaps plainly.
 *
 * Themes follow the four themes EcoVadis publishes for its sustainability
 * rating (Environment; Labor & Human Rights; Ethics; Sustainable
 * Procurement) -- ecovadis.com methodology disclosure, checked 1 Nov 2026.
 * ISO 20400:2017 (sustainable procurement guidance, aligned with the ISO 26000
 * core subjects) is the reference for treating supplier selection/evaluation
 * as a sustainability matter. ISO 20400 is guidance, not a certifiable
 * standard; ISC does not claim any supplier is "ISO 20400 compliant".
 *
 * The evidence-strength ladder is an ISC convention (self-declared <
 * documented policy < third-party verified); it is not an external standard
 * and is labelled as such. Standalone: no runtime imports.
 */

export type ESGTheme = 'environment' | 'labor_human_rights' | 'ethics' | 'sustainable_procurement';
export const ESG_THEMES: ESGTheme[] = ['environment', 'labor_human_rights', 'ethics', 'sustainable_procurement'];

export const ESG_THEME_LABEL: Record<ESGTheme, { en: string; ar: string }> = {
  environment: { en: 'Environment', ar: 'البيئة' },
  labor_human_rights: { en: 'Labor & Human Rights', ar: 'العمل وحقوق الإنسان' },
  ethics: { en: 'Ethics', ar: 'الأخلاقيات' },
  sustainable_procurement: { en: 'Sustainable Procurement (supplier\'s own supply chain)', ar: 'المشتريات المستدامة (سلسلة توريد المورد نفسه)' },
};

/** Weakest to strongest. */
export type ESGEvidenceLevel = 'none' | 'self_declared' | 'documented_policy' | 'third_party_verified';
export const ESG_LEVEL_RANK: Record<ESGEvidenceLevel, number> = { none: 0, self_declared: 1, documented_policy: 2, third_party_verified: 3 };
export const ESG_LEVEL_LABEL: Record<ESGEvidenceLevel, { en: string; ar: string }> = {
  none: { en: 'No evidence', ar: 'لا يوجد دليل' },
  self_declared: { en: 'Self-declared only', ar: 'إقرار ذاتي فقط' },
  documented_policy: { en: 'Documented policy / records', ar: 'سياسة / سجلات موثقة' },
  third_party_verified: { en: 'Third-party verified (audit, certificate or rating)', ar: 'مُتحقَّق منه من طرف ثالث (تدقيق أو شهادة أو تصنيف)' },
};

export interface ESGEvidence {
  level: ESGEvidenceLevel;
  /** Free text: what the evidence actually is (e.g. "ISO 14001 certificate, expires 2027-03"). */
  note?: string;
  /** ISO date the evidence was last checked by the client. Absent = unknown age. */
  checkedOn?: string;
}
export type SupplierESG = Partial<Record<ESGTheme, ESGEvidence>>;

export const ESG_METHOD_NOTE: { en: string; ar: string } = {
  en: 'No ESG score is produced. Each theme shows the strongest evidence you recorded and its age. Themes follow EcoVadis\'s four published themes; the strength ladder is an ISC convention. A score would need sector- and size-specific weights that ISC cannot source, so it is deliberately not invented.',
  ar: 'لا تُنتَج درجة ESG. يعرض كل محور أقوى دليل سجّلته وعمره. المحاور مأخوذة من محاور EcoVadis الأربعة المنشورة؛ وسلّم القوة اصطلاح من ISC. الدرجة تحتاج أوزاناً خاصة بالقطاع والحجم لا تستطيع ISC توثيقها، لذلك لم تُختلق عمداً.',
};

/** ISC default: evidence older than this is flagged as stale. Caller-overridable. */
export const ESG_STALE_AFTER_DAYS = 365;

export type ESGThemeStatus = 'strong' | 'partial' | 'gap' | 'stale';

export interface ESGThemeAssessment {
  theme: ESGTheme;
  level: ESGEvidenceLevel;
  status: ESGThemeStatus;
  ageDays: number | null;
  note: string;
}

export interface ESGAssessment {
  themes: ESGThemeAssessment[];
  themesWithEvidence: number;
  themesThirdPartyVerified: number;
  gapThemes: ESGTheme[];
  /** 'NOT_ASSESSED' when the client recorded nothing for any theme. */
  coverage: 'NOT_ASSESSED' | 'PARTIAL' | 'FULL';
}

function ageInDays(checkedOn: string | undefined, asOfIso: string): number | null {
  if (!checkedOn) return null;
  const t = new Date(checkedOn).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((new Date(asOfIso).getTime() - t) / 86400000));
}

export function assessESG(esg: SupplierESG | undefined, asOfIso: string, staleAfterDays: number = ESG_STALE_AFTER_DAYS): ESGAssessment {
  const themes: ESGThemeAssessment[] = ESG_THEMES.map((theme) => {
    const ev = esg?.[theme];
    const level = ev?.level ?? 'none';
    const age = ageInDays(ev?.checkedOn, asOfIso);
    let status: ESGThemeStatus;
    if (level === 'none') status = 'gap';
    else if (age !== null && age > staleAfterDays) status = 'stale';
    else if (level === 'third_party_verified') status = 'strong';
    else status = 'partial';
    return { theme, level, status, ageDays: age, note: ev?.note ?? '' };
  });
  const withEv = themes.filter((t) => t.level !== 'none').length;
  return {
    themes,
    themesWithEvidence: withEv,
    themesThirdPartyVerified: themes.filter((t) => t.level === 'third_party_verified').length,
    gapThemes: themes.filter((t) => t.status === 'gap').map((t) => t.theme),
    coverage: withEv === 0 ? 'NOT_ASSESSED' : withEv === ESG_THEMES.length ? 'FULL' : 'PARTIAL',
  };
}
