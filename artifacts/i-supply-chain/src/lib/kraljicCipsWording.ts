/**
 * Kraljic wording crosswalk (Round B4, item 1 of the enrichment plan).
 *
 * WHY: ISC users are often CIPS-trained. CIPS names the quadrants Critical,
 * Leverage, Bottleneck and Routine (with "strategic" and "non-critical" as
 * accepted aliases on the same page) and labels the axes "Risk impact" and
 * "Cost impact". Showing those names first makes the module instantly
 * recognisable. The engine keys (strategic, non-critical) are unchanged.
 *
 * SOURCES (opened and read, Oct-Nov 2026): CIPS Intelligence Hub, "Kraljic
 * matrix" and "How to optimise purchasing costs with the Kraljic matrix";
 * CIPS Supplier Preferencing page; CIPS Global Standard segment 6.4.
 * One-line strategies below are paraphrased, not quoted.
 * NOT SOURCED: contract type, negotiation style and KPIs per quadrant are
 * member-only at CIPS; nothing here claims them. Arabic labels are ISC
 * editorial wording: no published standard Arabic quadrant terms were found.
 *
 * STANDALONE-FIRST: no imports.
 */

export type Bilingual = { en: string; ar: string };
export type Q = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

/** Display label, CIPS name first, accepted alias second. */
export const CIPS_QUADRANT_LABEL: Record<Q, Bilingual> = {
  strategic: b('Critical (Strategic)', 'استراتيجي (حرج)'),
  leverage: b('Leverage', 'نفوذ شرائي'),
  bottleneck: b('Bottleneck (fragile supply)', 'نقطة اختناق (إمداد هش)'),
  'non-critical': b('Routine (Non-critical)', 'غير حرج (روتيني)'),
};

export const CIPS_AXIS_LABEL = {
  risk: b('Risk impact (supply risk)', 'أثر المخاطر (خطر الإمداد)'),
  cost: b('Cost impact (profit potential)', 'أثر التكلفة (الربحية المحتملة)'),
};

/** CIPS's own one-line strategy per quadrant, paraphrased. */
export const CIPS_ONE_LINE: Record<Q, { strategy: Bilingual; source: Bilingual }> = {
  strategic: {
    strategy: b('Balance power through performance-based partnerships.', 'وازن القوى عبر شراكات قائمة على الأداء.'),
    source: b('CIPS Intelligence Hub, Kraljic matrix page (2026).', 'CIPS Intelligence Hub، صفحة مصفوفة Kraljic (2026).'),
  },
  leverage: {
    strategy: b('Use competitive tendering, target pricing and substitution.', 'استخدم المناقصات التنافسية والسعر المستهدف والاستبدال.'),
    source: b('CIPS Intelligence Hub, Kraljic matrix page (2026).', 'CIPS Intelligence Hub، صفحة مصفوفة Kraljic (2026).'),
  },
  bottleneck: {
    strategy: b('Secure supply and look for alternative suppliers.', 'أمّن الإمداد وابحث عن موردين بدلاء.'),
    source: b('CIPS Intelligence Hub, Kraljic matrix page (2026).', 'CIPS Intelligence Hub، صفحة مصفوفة Kraljic (2026).'),
  },
  'non-critical': {
    strategy: b('Simplify: systems contracting, e-procurement and standardisation.', 'بسّط: عقود نظامية وشراء إلكتروني وتوحيد المواصفات.'),
    source: b('CIPS Intelligence Hub, Kraljic matrix page (2026).', 'CIPS Intelligence Hub، صفحة مصفوفة Kraljic (2026).'),
  },
};

/** Steele & Court Supplier Preferencing quadrants, as CIPS presents them. */
export type PreferencingKey = 'core' | 'development' | 'exploitable' | 'nuisance';
export const PREFERENCING_LABEL: Record<PreferencingKey, Bilingual> = {
  core: b('Core', 'أساسي'),
  development: b('Development', 'تطويري'),
  exploitable: b('Exploitable', 'قابل للاستغلال'),
  nuisance: b('Nuisance', 'مُزعج'),
};

/** Phrases other bodies use, so a CPSM or NIGP-trained user recognises the idea. */
export const CROSSWALK: Array<{ concept: Bilingual; cips: string; ism: string; nigp: string }> = [
  { concept: b('Positioning each item or supplier', 'تحديد موقع كل بند أو مورد'), cips: 'Procurement positioning; portfolio analysis', ism: 'Supplier strategy matrix; segment the supplier portfolio', nigp: 'Vendor tier; risk threshold' },
  { concept: b('Supplier view of the buyer', 'نظرة المورد إلى المشتري'), cips: 'Supplier preferencing', ism: 'Supplier conditioning (course vocabulary)', nigp: 'n/a' },
  { concept: b('Depth of control scales with risk and value', 'عمق الرقابة يتناسب مع الخطر والقيمة'), cips: 'Relationship type depends on criticality', ism: 'Risk and compliance', nigp: 'Four vendor tiers with set assessment and audit levels' },
];

/** Where this practice area sits in CIPS qualifications. Grounds the area only: none of these outcomes names Kraljic. */
export const CIPS_SYLLABUS_ANCHORS: string[] = [
  'L4M6 1.2', 'L4M5 1.3-1.4', 'L5M6 2.2 / 3.2.2 / 3.3.6', 'L5M7 1.4 / 3.4', 'L6M3 2.1', 'Global Standard 6.4',
];

export const WORDING_NOTE: Bilingual = {
  en: 'Quadrant names follow CIPS (Critical, Leverage, Bottleneck, Routine) with the Kraljic names alongside. Arabic labels are ISC wording: no standard Arabic terms are published.',
  ar: 'تتبع أسماء الأرباع CIPS (حرج، نفوذ، اختناق، روتيني) مع أسماء Kraljic بجانبها. التسميات العربية صياغة ISC: لا توجد مصطلحات عربية معيارية منشورة.',
};

// ---------------------------------------------------------------------------
// Round B5, item 11: EN/AR wording pack
// ---------------------------------------------------------------------------

/**
 * Arabic labels are shown as Arabic plus the English name in brackets, so a
 * reader who knows the CIPS name can match it. Practice in the region mostly
 * keeps the English names (practitioner kits add Arabic glosses), so this is
 * disclosed as ISC editorial wording, not a published standard.
 */
const EN_SHORT: Record<Q, string> = { strategic: 'Critical', leverage: 'Leverage', bottleneck: 'Bottleneck', 'non-critical': 'Routine' };
export function arabicWithEnglish(q: Q): string {
  return `${CIPS_QUADRANT_LABEL[q].ar} [${EN_SHORT[q]}]`;
}

/** Spellings of the model name found in Arabic sources. All must stay searchable. */
export const KRALJIC_SPELLINGS_AR: string[] = ['كرالجيك', 'كراجيك', 'كرلجيك'];
/** The spelling ISC shows. The forms كراليك and كراليتش were not found in any source. */
export const KRALJIC_PREFERRED_AR = 'كرالجيك';

export function matchesKraljicTerm(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return q.includes('kraljic') || KRALJIC_SPELLINGS_AR.some((s) => q.includes(s));
}

export const ARABIC_DISCLOSURE: Bilingual = {
  en: 'Arabic wording is ISC editorial, not a published standard. Review status: all Arabic texts (1,170 first review plus 121 re-checked lines) certified by a native Arabic reader (the ISC founder) on 2 Nov 2026, with his corrections applied.',
  ar: 'الصياغة العربية تحريرية من آي سبلاي تشين وليست معيارًا منشورًا. حالة المراجعة: اعتمد قارئ عربي أصلي (مؤسس آي سبلاي تشين) جميع النصوص العربية في 2 نوفمبر 2026 (1,170 نصًا في المراجعة الأولى و121 سطرًا في إعادة المراجعة)، وطُبّقت تصويباته.',
};
