/**
 * SI Module 07 -- Reverse links (Round B follow-up, Nov 2026).
 *
 * Turns the M07 EvidencePackage (plain data) into inputs the other modules
 * can use WITHOUT those modules importing M07 (standalone-first doctrine):
 *   - M06 (commercial): negotiation FACTS, each tagged with its evidence
 *     basis, plus CAUTIONS that stop the facts being used unfairly.
 *   - M03 (contract): a REMEDY CHECK list -- which clause families the user
 *     should confirm in the contract, and why. A prompt to check, never
 *     legal advice and never a claim that a clause exists or is enforceable.
 *   - M10 / M11 (signal radar, command centre): a flat SIGNAL FEED of
 *     plain events (tier, signals, open CARs, recovery status).
 *   - M04 / M08: defined link contracts only (see LINK_REGISTRY). Not built.
 *
 * Honesty rules carried over from M07: an unassessed cause is never blame;
 * a missing cost is "not costed", never zero; "fix our side first" blocks
 * blame-based leverage. The clause-family triggers are ISC conventions
 * (disclosed in CONVENTION_NOTE), not an external standard.
 */
import type { EvidencePackage, SupplierDecision, Bilingual } from './supplierDecisionView';

export const CONVENTION_NOTE: Bilingual = {
  en: 'Which clause families to check, and the trigger conditions, are an ISC convention for prompting a contract review. They are not legal advice and do not mean any clause exists.',
  ar: 'تحديد عائلات البنود المطلوب فحصها وشروط التفعيل هو اصطلاح من ISC لتحفيز مراجعة العقد. ليس استشارة قانونية ولا يعني أن أي بند موجود.',
};

/** Share of assessed CARs not caused by the supplier at/above which blame-based leverage is blocked (mirrors M07 rule). */
export const FIX_OUR_SIDE_MIN_PCT = 50;

export type FactBasis = 'observed' | 'calculated' | 'not-available';

export interface NegotiationFact {
  key: string;
  basis: FactBasis;
  text: Bilingual;
}
export interface NegotiationCaution {
  key: string;
  text: Bilingual;
}
export interface M06Facts {
  supplierId: string;
  supplierName: string;
  asOfIso: string;
  /** False when the cause evidence says our side must be fixed first: facts may be shown but not used as blame. */
  blameUsable: boolean;
  facts: NegotiationFact[];
  cautions: NegotiationCaution[];
}

function pct(n: number, d: number): number | null {
  return d > 0 ? Math.round((100 * n) / d) : null;
}

export function toNegotiationFacts(e: EvidencePackage): M06Facts {
  const c = e.causeCounts;
  const assessed = c.supplier + c.client + c.shared + c.external + c.measurement;
  const notSupplierPct = pct(assessed - c.supplier, assessed);
  const blameUsable = !(notSupplierPct !== null && assessed >= 2 && notSupplierPct >= FIX_OUR_SIDE_MIN_PCT);
  const facts: NegotiationFact[] = [];
  const cautions: NegotiationCaution[] = [];

  facts.push({
    key: 'cars-total', basis: 'observed',
    text: { en: `${e.totalCarCount} CAR(s) on record, ${e.openCarIds.length} still open.`, ar: `${e.totalCarCount} طلب إجراء تصحيحي مسجَّل، ${e.openCarIds.length} منها ما زال مفتوحاً.` },
  });
  if (assessed > 0) {
    facts.push({
      key: 'cause-mix', basis: 'calculated',
      text: { en: `Of ${assessed} assessed CAR(s), ${c.supplier} were supplier-caused (${pct(c.supplier, assessed)}%).`, ar: `من ${assessed} طلباً مُقيَّماً، ${c.supplier} سببها المورد (${pct(c.supplier, assessed)}%).` },
    });
  }
  if (e.recurrenceCount > 0) {
    facts.push({
      key: 'recurrence', basis: 'calculated',
      text: { en: `The same root cause has recurred ${e.recurrenceCount} time(s).`, ar: `تكرر السبب الجذري نفسه ${e.recurrenceCount} مرة.` },
    });
  }
  if (e.costedCOPQUSD !== null && e.costedCarCount > 0) {
    facts.push({
      key: 'copq', basis: 'observed',
      text: { en: `Cost of poor quality recorded by you: USD ${Math.round(e.costedCOPQUSD).toLocaleString('en-US')} across ${e.costedCarCount} of ${e.totalCarCount} CAR(s).`, ar: `كلفة سوء الجودة التي سجّلتموها: ${Math.round(e.costedCOPQUSD).toLocaleString('en-US')} دولار عبر ${e.costedCarCount} من ${e.totalCarCount} طلباً.` },
    });
    if (e.costedCarCount < e.totalCarCount) {
      cautions.push({ key: 'copq-partial', text: { en: 'Only some CARs have a cost, so the figure is a floor, not the full cost.', ar: 'بعض الطلبات فقط لها كلفة، لذا الرقم حدّ أدنى وليس الكلفة الكاملة.' } });
    }
  } else {
    facts.push({
      key: 'copq', basis: 'not-available',
      text: { en: 'No cost recorded on any CAR: the cost of poor quality is not costed (not zero).', ar: 'لا كلفة مسجَّلة على أي طلب: كلفة سوء الجودة غير محتسبة (وليست صفراً).' },
    });
  }
  if (e.recoveryStatus === 'CLOSED_NOT_RECOVERED') {
    facts.push({ key: 'recovery', basis: 'calculated', text: { en: 'A CAR was closed but the score did not recover afterwards.', ar: 'أُغلق طلب لكن الدرجة لم تتعافَ بعده.' } });
  }

  if (c.unassessed > 0) {
    cautions.push({ key: 'unassessed', text: { en: `${c.unassessed} CAR(s) have no cause assigned. They are neither blamed on nor cleared for the supplier; do not cite them as supplier fault.`, ar: `${c.unassessed} طلب بلا سبب محدد. لا يُنسب إلى المورد ولا يُبرَّأ منه؛ لا تستشهد به كخطأ للمورد.` } });
  }
  if (!blameUsable) {
    cautions.push({ key: 'fix-our-side', text: { en: `${notSupplierPct}% of assessed CARs are not supplier-caused. Fix our side first; do not use these facts as blame in the negotiation.`, ar: `${notSupplierPct}% من الطلبات المُقيَّمة ليست من سبب المورد. أصلِحوا جانبنا أولاً؛ لا تستخدموا هذه الحقائق كلوم في التفاوض.` } });
  }
  if (c.measurement > 0) {
    cautions.push({ key: 'measurement', text: { en: `${c.measurement} CAR(s) are attributed to measurement. Confirm the measurement is sound before relying on the score trend.`, ar: `${c.measurement} طلب منسوب إلى القياس. تأكد من سلامة القياس قبل الاعتماد على اتجاه الدرجة.` } });
  }
  return { supplierId: e.supplierId, supplierName: e.supplierName, asOfIso: e.asOfIso, blameUsable, facts, cautions };
}

export type ClauseFamily = 'sla-kpi' | 'service-credits-penalties' | 'corrective-action-process' | 'step-in-termination-persistent-breach' | 'audit-and-inspection' | 'liability-cap-and-carve-outs';

export interface RemedyCheckItem {
  family: ClauseFamily;
  triggeredBy: string;
  text: Bilingual;
}
export interface M03RemedyCheck {
  supplierId: string;
  supplierName: string;
  items: RemedyCheckItem[];
  convention: Bilingual;
}

export function toRemedyCheck(e: EvidencePackage): M03RemedyCheck {
  const c = e.causeCounts;
  const items: RemedyCheckItem[] = [];
  const add = (family: ClauseFamily, triggeredBy: string, en: string, ar: string) => items.push({ family, triggeredBy, text: { en, ar } });

  if (e.totalCarCount > 0) {
    add('corrective-action-process', 'has-cars', 'Confirm the contract defines a corrective-action (CAR/8D) process with response and root-cause deadlines.', 'تأكد أن العقد يحدد عملية إجراءات تصحيحية (CAR/8D) بمواعيد للرد وللسبب الجذري.');
    add('sla-kpi', 'has-cars', 'Confirm which service levels or KPIs are measured and how failures are recorded.', 'تأكد من مستويات الخدمة أو المؤشرات المقاسة وكيفية تسجيل الإخفاقات.');
  }
  if (e.recurrenceCount >= 2) {
    add('service-credits-penalties', 'recurrence>=2', 'The same root cause has repeated: check whether service credits or penalties apply to repeat failure.', 'تكرر السبب الجذري: افحص هل تنطبق اعتمادات خدمة أو غرامات على الإخفاق المتكرر.');
    add('step-in-termination-persistent-breach', 'recurrence>=2', 'Check for a persistent-breach, step-in or termination-for-cause right and its notice and cure periods.', 'افحص حق الإخلال المستمر أو التدخل أو الإنهاء لسبب، ومدد الإخطار والمعالجة.');
  }
  if (e.recoveryStatus === 'CLOSED_NOT_RECOVERED') {
    add('step-in-termination-persistent-breach', 'closed-not-recovered', 'A fix was closed without recovery: check whether the contract lets you reopen it or escalate.', 'أُغلق إصلاح دون تعافٍ: افحص هل يسمح العقد بإعادة فتحه أو التصعيد.');
  }
  if (e.costedCOPQUSD !== null && e.costedCOPQUSD > 0) {
    add('liability-cap-and-carve-outs', 'costed-copq', 'You recorded a cost of poor quality: check the liability cap and what the supplier is liable for.', 'سجّلتم كلفة سوء جودة: افحص سقف المسؤولية وما يُسأل عنه المورد.');
  }
  if (c.supplier + c.shared > 0 && e.openCarIds.length > 0) {
    add('audit-and-inspection', 'open-supplier-or-shared-car', 'Open supplier-related CARs: check audit and inspection rights to verify the fix.', 'طلبات مفتوحة متعلقة بالمورد: افحص حقوق التدقيق والتفتيش للتحقق من الإصلاح.');
  }
  // de-duplicate by family+trigger
  const seen = new Set<string>();
  const uniq = items.filter((i) => { const k = i.family + '|' + i.triggeredBy; if (seen.has(k)) return false; seen.add(k); return true; });
  return { supplierId: e.supplierId, supplierName: e.supplierName, items: uniq, convention: CONVENTION_NOTE };
}

export interface SignalEvent {
  supplierId: string;
  supplierName: string;
  asOfIso: string;
  tier: SupplierDecision['tier'];
  signalKeys: string[];
  openCarCount: number;
  recoveryStatus: EvidencePackage['recoveryStatus'];
  source: 'M07';
}

/** Flat feed for the signal radar (M10) and command centre (M11). One event per supplier that needs attention. */
export function toSignalFeed(decisions: SupplierDecision[], asOfIso: string): SignalEvent[] {
  return decisions
    .filter((d) => d.tier !== 'low' || d.signals.length > 0)
    .map((d) => ({
      supplierId: d.supplier.supplierId, supplierName: d.supplier.name, asOfIso, tier: d.tier,
      signalKeys: d.signals.map((s) => s.key), openCarCount: d.evidence.openCarIds.length,
      recoveryStatus: d.evidence.recoveryStatus, source: 'M07' as const,
    }));
}

export interface LinkContract {
  module: 'M03' | 'M04' | 'M06' | 'M08' | 'M10' | 'M11';
  direction: 'M07->module' | 'module->M07';
  carries: Bilingual;
  status: 'built' | 'defined-not-built';
  via: string;
}

export const LINK_REGISTRY: LinkContract[] = [
  { module: 'M06', direction: 'M07->module', carries: { en: 'Negotiation facts with evidence basis and fairness cautions', ar: 'حقائق تفاوضية مع أساس الدليل وتحذيرات الإنصاف' }, status: 'built', via: 'toNegotiationFacts' },
  { module: 'M03', direction: 'M07->module', carries: { en: 'Contract remedy check list', ar: 'قائمة فحص العلاجات التعاقدية' }, status: 'built', via: 'toRemedyCheck' },
  { module: 'M10', direction: 'M07->module', carries: { en: 'Supplier signal events (tier, signals, open CARs)', ar: 'أحداث إشارات الموردين (الأولوية، الإشارات، الطلبات المفتوحة)' }, status: 'built', via: 'toSignalFeed' },
  { module: 'M11', direction: 'M07->module', carries: { en: 'Same signal feed, plus weekly actions', ar: 'تغذية الإشارات نفسها مع إجراءات الأسبوع' }, status: 'built', via: 'toSignalFeed' },
  { module: 'M04', direction: 'M07->module', carries: { en: 'Recovery evidence as a re-qualification input after a verified failure', ar: 'أدلة التعافي كمدخل لإعادة التأهيل بعد إخفاق مثبت' }, status: 'defined-not-built', via: 'EvidencePackage.recoveryStatus' },
  { module: 'M08', direction: 'M07->module', carries: { en: 'Performance evidence for local-content suppliers (no local-content rule is applied by M07)', ar: 'أدلة الأداء للموردين المحليين (لا تطبّق M07 أي قاعدة محتوى محلي)' }, status: 'defined-not-built', via: 'EvidencePackage' },
];
