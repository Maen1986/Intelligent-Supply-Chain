/**
 * Country/region coverage registry (#118, #33).
 *
 * ISC's assessment content splits into two kinds:
 *  - Globally portable frameworks (ISO, APICS SCOR, DMAIC, GHG Protocol/SBTi,
 *    Kraljic, IACCM, CIPS, ISO 22301, ISO 31000, etc.) — these already apply
 *    worldwide without modification. 14 of the 15 Maturity Assessment segments
 *    (Strategy, Procurement, CLM, SRM, Risk, ESG, Digital, Demand, Inventory,
 *    Logistics, Org & Talent, Manufacturing, Fleet, Quality/CI) fall here.
 *  - Country-specific statutory/regulatory content, which by definition cannot
 *    be generic. Only Segment 14 ("Regulatory & Localisation Compliance") is
 *    country-specific today, and it is honestly scoped in its own title as
 *    Saudi Arabia-only.
 *
 * This registry is the single source of truth for that regulatory coverage
 * map. It's what "GCC & Worldwide" cashes out to in the product: worldwide
 * applicability by default (via portable frameworks), with an explicit,
 * expanding map of country-specific regulatory depth layered on top —
 * instead of silently hardcoding one country's assumptions into a "global"
 * label. New countries are added here first; UI reads from this file rather
 * than re-stating coverage claims inline.
 */

export type CoverageLevel = 'full' | 'partial' | 'roadmap';

export interface RegionCoverage {
  id: string;
  label: string;
  labelAr: string;
  coverage: CoverageLevel;
  frameworks: string[];
  note: string;
  noteAr: string;
}

export const REGULATORY_REGIONS: RegionCoverage[] = [
  {
    id: 'ksa',
    label: 'Saudi Arabia',
    labelAr: 'المملكة العربية السعودية',
    coverage: 'full',
    frameworks: [
      'Nitaqat / Saudization',
      'IKTVA & Local Content',
      'Import/Export Licensing',
      'Product Regulatory Compliance',
      'GTPL (Government Procurement)',
      'Halal & Islamic Commerce Standards',
      'PDPL Data Privacy & Protection',
    ],
    note: 'Full-depth regulatory module — 7 sub-segments, 70 questions, 5-level bilingual maturity scale.',
    noteAr: 'وحدة تنظيمية كاملة العمق — 7 وحدات فرعية، 70 سؤالاً، ومقياس نضج ثنائي اللغة بخمسة مستويات.',
  },
  {
    id: 'other-gcc',
    label: 'Other GCC — UAE, Qatar, Kuwait, Bahrain, Oman',
    labelAr: 'دول الخليج الأخرى — الإمارات، قطر، الكويت، البحرين، عُمان',
    coverage: 'partial',
    frameworks: ['GCC Customs Union', 'ICV / TAWTEEN local-content equivalents'],
    note: "Reflected today in the platform's comparative GCC benchmark data and Solution-page content; a dedicated country-specific regulatory question set is on the roadmap.",
    noteAr: 'مشمولة حاليًا في بيانات المقارنة المرجعية الخليجية للمنصة ومحتوى صفحات الحلول؛ مجموعة أسئلة تنظيمية مخصصة لكل دولة قيد التطوير.',
  },
  {
    id: 'global',
    label: 'International / Other Markets',
    labelAr: 'الأسواق الدولية الأخرى',
    coverage: 'roadmap',
    frameworks: [],
    note: 'The other 14 Maturity Assessment segments use globally portable frameworks and apply worldwide today. Country-specific regulatory content beyond the GCC is being built out on this same pattern — contact ISC to scope your market.',
    noteAr: 'الوحدات الـ14 الأخرى لتقييم النضج تستخدم أطراً عالمية قابلة للتطبيق وتنطبق عالميًا اليوم. المحتوى التنظيمي الخاص بدول أخرى غير الخليج قيد التطوير وفق النمط ذاته — تواصل مع ISC لتحديد نطاق سوقك.',
  },
];

export function getRegulatoryRegion(id: string): RegionCoverage | undefined {
  return REGULATORY_REGIONS.find((r) => r.id === id);
}
