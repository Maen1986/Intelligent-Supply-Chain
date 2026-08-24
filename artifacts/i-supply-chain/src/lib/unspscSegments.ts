/**
 * UNSPSC Services Segments — Reference (Phase 1, ISC Services Classification
 * Book v1)
 *
 * The real, sourced top level ("Segment", 2-digit code) of the United
 * Nations Standard Products and Services Code for services. UNSPSC is the
 * same classification standard used by major CLM/procurement platforms
 * (SAP Ariba, Coupa, and most enterprise e-procurement systems) to
 * categorize spend. Sourced 24 Aug 2026 (commerce.gov, oprtt.org,
 * wikipedia.org, wisepim.com) -- see isc-services-classification-book-v1.md
 * for full provenance and the Family-level detail already sourced for
 * Segments 72, 80, and 81.
 *
 * Scope note: this is the Segment (grand) level only -- 16 real services
 * segments, not fabricated. Family/Class/Commodity (parent/lowest) level is
 * a separate, larger data-import project, not built here. Goods segments
 * (10-56 range) are not covered by this file; existing free-text `category`
 * fields remain the entry point for goods until that work is scoped.
 *
 * This field is additive on Contract (CLMTools.tsx) and SpendRow
 * (ProcurementTools.tsx) -- it does not replace the existing free-text
 * `category` field, and it is intentionally NOT wired into the TCO Engine's
 * `skuClass` taxonomy (kpiBenchmarksBySkuClass.ts), which answers a
 * different question (inventory behavior, not "what was bought").
 */

export interface UnspscSegment {
  code: string;   // 2-digit UNSPSC segment code, as a string e.g. '72'
  label: string;
  labelAr: string;
}

export const UNSPSC_SERVICES_SEGMENTS: UnspscSegment[] = [
  { code: '70', label: 'Farming, Fishing, Forestry and Wildlife Contracting Services', labelAr: 'خدمات مقاولات الزراعة والصيد والغابات والحياة البرية' },
  { code: '71', label: 'Mining, Oil and Gas Drilling Services',                        labelAr: 'خدمات التعدين وحفر النفط والغاز' },
  { code: '72', label: 'Building, Construction and Maintenance Services',              labelAr: 'خدمات البناء والتشييد والصيانة' },
  { code: '73', label: 'Industrial Production and Manufacturing Services',             labelAr: 'خدمات الإنتاج الصناعي والتصنيع' },
  { code: '76', label: 'Industrial Cleaning Services',                                 labelAr: 'خدمات التنظيف الصناعي' },
  { code: '77', label: 'Environmental Services',                                       labelAr: 'الخدمات البيئية' },
  { code: '78', label: 'Transportation, Storage and Mail Services',                    labelAr: 'خدمات النقل والتخزين والبريد' },
  { code: '80', label: 'Management, Business Professionals and Administrative Services', labelAr: 'خدمات الإدارة والمهنيين التجاريين والإداريين' },
  { code: '81', label: 'Engineering, Research and Technology Based Services',          labelAr: 'الخدمات الهندسية والبحثية والتقنية' },
  { code: '82', label: 'Editorial, Design, Graphic and Fine Art Services',             labelAr: 'خدمات التحرير والتصميم والرسوم والفنون الجميلة' },
  { code: '83', label: 'Public Utilities and Public Sector Related Services',          labelAr: 'المرافق العامة والخدمات المتعلقة بالقطاع العام' },
  { code: '84', label: 'Financial and Insurance Services',                             labelAr: 'الخدمات المالية والتأمينية' },
  { code: '90', label: 'Travel, Food, Lodging and Entertainment Services',             labelAr: 'خدمات السفر والطعام والإقامة والترفيه' },
  { code: '91', label: 'Personal and Domestic Services',                               labelAr: 'الخدمات الشخصية والمنزلية' },
  { code: '92', label: 'National Defense, Public Order, Security and Safety Services', labelAr: 'خدمات الدفاع الوطني والنظام العام والأمن والسلامة' },
  { code: '93', label: 'Politics and Civic Affairs Services',                          labelAr: 'خدمات السياسة والشؤون المدنية' },
];

export function unspscSegmentLabel(code: string | undefined, isAr: boolean): string {
  if (!code) return '';
  const seg = UNSPSC_SERVICES_SEGMENTS.find(s => s.code === code);
  if (!seg) return '';
  return isAr ? seg.labelAr : seg.label;
}
