// MOF-approved model contracts for Saudi government procurement.
// Source (names): Ministerial Decision No. 1118 of 1447H (effective 19/12/1447H = 5 Jun 2026, for tenders created from that date),
// clause "Second" (contract models) and clause "Third" (framework-agreement models); published via qanoniah.com, last checked 25 Oct 2026.
// Legal basis: Art. 13(2) of the Government Tenders and Procurement Law (Royal Decree M/128, 13/11/1440H) -- the Minister approves model contracts.
// The MOF page itself (mof.gov.sa Contracts & Projects) returned 404 on 25 Oct 2026, so the model PDFs were not opened by ISC.
// The `lcgpaClass` column is ISC's own mapping to the supply / services-works / mixed split used by the LCGPA mechanism finder.
// It is NOT stated by MOF or LCGPA; the tender documents decide.
import type { SaContractType } from './lcgpaMechanismFinder';

export interface MofContractModel { id: string; ar: string; en: string; lcgpaClass: SaContractType; framework?: boolean }

export const MOF_DECISION_1118_SOURCE = {
  en: 'MOF Ministerial Decision 1118 (1447H), in force for tenders created from 19/12/1447H (5 Jun 2026). Class mapping is ISC\'s own; the tender documents decide.',
  ar: 'قرار وزير المالية رقم (1118) لعام 1447هـ، ساري على المنافسات المنشأة من 19/12/1447هـ (5 يونيو 2026). تصنيف النوع اجتهاد من المنصة؛ وتحسم وثائق المنافسة.',
};

export const MOF_CONTRACT_MODELS: MofContractModel[] = [
  { id: 'general-supply', ar: 'توريد عام', en: 'General supply', lcgpaClass: 'supply' },
  { id: 'medical-supplies', ar: 'توريد المستلزمات الطبية', en: 'Medical supplies', lcgpaClass: 'supply' },
  { id: 'medicines', ar: 'توريد الأدوية', en: 'Medicines', lcgpaClass: 'supply' },
  { id: 'military-supply', ar: 'التوريد العسكري', en: 'Military supply', lcgpaClass: 'supply' },
  { id: 'general-construction', ar: 'إنشاءات عامة', en: 'General construction', lcgpaClass: 'services-works' },
  { id: 'road-construction', ar: 'إنشاء الطرق', en: 'Road construction', lcgpaClass: 'services-works' },
  { id: 'road-om', ar: 'تشغيل وصيانة الطرق', en: 'Road operation & maintenance', lcgpaClass: 'services-works' },
  { id: 'om', ar: 'التشغيل والصيانة', en: 'Operation & maintenance', lcgpaClass: 'services-works' },
  { id: 'om-admin-buildings-pbc', ar: 'التشغيل والصيانة للمباني الإدارية (التعاقد القائم على الأداء)', en: 'O&M of administrative buildings (performance-based)', lcgpaClass: 'services-works' },
  { id: 'city-cleaning', ar: 'نظافة المدن', en: 'City cleaning', lcgpaClass: 'services-works' },
  { id: 'general-services', ar: 'خدمات عام', en: 'General services', lcgpaClass: 'services-works' },
  { id: 'consulting', ar: 'خدمات استشارية', en: 'Consulting services', lcgpaClass: 'services-works' },
  { id: 'consulting-pmo', ar: 'خدمات استشارية: تفعيل مكتب إدارة المشاريع ودراسة السعة والطلب', en: 'Consulting: PMO activation and capacity & demand study', lcgpaClass: 'services-works' },
  { id: 'consulting-capacity', ar: 'خدمات استشارية: دراسة السعة والطلب', en: 'Consulting: capacity & demand study', lcgpaClass: 'services-works' },
  { id: 'engineering-design', ar: 'الخدمات الهندسية: تصميم', en: 'Engineering services: design', lcgpaClass: 'services-works' },
  { id: 'engineering-supervision', ar: 'الخدمات الهندسية: إشراف', en: 'Engineering services: supervision', lcgpaClass: 'services-works' },
  { id: 'revenue-sharing', ar: 'المشاركة في الدخل', en: 'Revenue sharing', lcgpaClass: 'services-works' },
  { id: 'it', ar: 'تقنية المعلومات', en: 'Information technology', lcgpaClass: 'mixed' },
  { id: 'catering', ar: 'إعاشة', en: 'Catering (food supply + service)', lcgpaClass: 'mixed' },
  { id: 'fa-supply', ar: 'اتفاقية إطارية: توريد عام', en: 'Framework agreement: general supply', lcgpaClass: 'supply', framework: true },
  { id: 'fa-services', ar: 'اتفاقية إطارية: خدمات', en: 'Framework agreement: services', lcgpaClass: 'services-works', framework: true },
  { id: 'fa-consulting', ar: 'اتفاقية إطارية: خدمات استشارية', en: 'Framework agreement: consulting services', lcgpaClass: 'services-works', framework: true },
];

export const classForModel = (id: string): SaContractType | undefined => MOF_CONTRACT_MODELS.find(m => m.id === id)?.lcgpaClass;
