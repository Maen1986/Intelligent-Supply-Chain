/**
 * SI Module 02 extension -- Kraljic sub-type view (Round B4).
 * Shows, per supplier: the sub-type, why, what to do (primary + alternative +
 * trade-off), the real-world situations it raises, migration alerts, and links
 * to the other modules. Facts are entered here (stored in the browser) because
 * the sub-type is decided by facts, and a missing fact is shown as
 * 'Unclassified' -- never guessed. Every sub-type states whether it is sourced
 * or an ISC convention.
 */
import { useMemo, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { buildDecisions } from '@/lib/supplierDecisionView';
import {
  assess, summarisePortfolio, REVIEW_INTERVAL_NOTE, SUBTYPES,
  type SubtypeFacts, type SubtypeSupplierInput, type FactKey, type ConstraintCause, type Quadrant, type SubtypeKey, type Bilingual,
} from '@/lib/supplierKraljicSubtypes';
import {
  outgoing, incoming, routeFor, crossesQuadrant, buildKraljicReport, reportToCsv, QUADRANT_IDEAS, QUADRANT_LABEL, type CsvExtra,
} from '@/lib/supplierKraljicNetwork';
import type { SupplierRecord, KraljicItemLite, SupplierCategoryShare } from '@/lib/supplierRecoveryPortfolio';
import { safeSetItem } from '@/lib/storage';
import { CONSTRUCTS } from '@/lib/supplierKraljicConstructs';
import { CIPS_QUADRANT_LABEL, CIPS_ONE_LINE, WORDING_NOTE, ARABIC_DISCLOSURE } from '@/lib/kraljicCipsWording';
import type { ReviewPoint } from '@/lib/kraljicRepositioning';
import { KraljicScorer } from './KraljicScorer';
import { KraljicPositionCheck } from './KraljicPositionCheck';
import { FlowSteps, MatrixIllustration, type Mode } from './KraljicFlow';
import { Link } from 'wouter';
import { KraljicPlaybookPanel, BasisBadge } from './KraljicPlaybookPanel';
import { KraljicSupplierExtras, emptyExtras, type SupplierExtras } from './KraljicSupplierExtras';
import { KraljicEvidencePanel } from './KraljicEvidencePanel';
import { KraljicReportPack } from './KraljicReportPack';
import { playbookFor, nextDdDate } from '@/lib/kraljicPlaybook';
import { gccAdjustment } from '@/lib/kraljicGccModifiers';
import { dueDiligenceHandoff, negotiationHandoff } from '@/lib/kraljicModuleLinks';
import { KRALJIC_GLOSSARY } from '@/lib/kraljicGlossary';
import { useAuth } from '@/lib/AuthContext';
import { useKraljicWorkspaceSync } from '@/lib/kraljicWorkspaceSync';
import type { LedgerEntry } from '@/lib/kraljicLedger';

const FACTS_KEY = 'isc-m02-subtype-facts-v1';
const REVIEWS_KEY = 'isc-m02-review-log-v1';
type ReviewMap = Record<string, ReviewPoint[]>;
function loadReviews(): ReviewMap {
  try { const r = localStorage.getItem(REVIEWS_KEY); return r ? (JSON.parse(r) as ReviewMap) : {}; } catch { return {}; }
}
type FactsMap = Record<string, SubtypeFacts>;
const EXTRAS_KEY = 'isc-m02-extras-v1';
const LEDGER_KEY = 'isc-m02-ledger-v1';
type ExtrasMap = Record<string, SupplierExtras>;
function loadExtras(): ExtrasMap {
  try { const r = localStorage.getItem(EXTRAS_KEY); return r ? (JSON.parse(r) as ExtrasMap) : {}; } catch { return {}; }
}
function loadLedger(): LedgerEntry[] {
  try { const r = localStorage.getItem(LEDGER_KEY); const v = r ? JSON.parse(r) : []; return Array.isArray(v) ? (v as LedgerEntry[]) : []; } catch { return []; }
}

function loadFacts(): FactsMap {
  try { const r = localStorage.getItem(FACTS_KEY); return r ? (JSON.parse(r) as FactsMap) : {}; } catch { return {}; }
}

const QUAD: Record<Quadrant, { en: string; ar: string }> = CIPS_QUADRANT_LABEL;
/** Highest-stakes quadrants first: that is where missing facts hurt most. */
const QUAD_ORDER: Record<Quadrant, number> = { bottleneck: 0, strategic: 1, leverage: 2, 'non-critical': 3 };
const SEV_STYLE = { high: 'bg-red-50 border-red-200 text-red-900', medium: 'bg-amber-50 border-amber-200 text-amber-900', low: 'bg-slate-50 border-slate-200 text-slate-700' } as const;
const SEV_LABEL = { high: { en: 'High', ar: 'مرتفع' }, medium: { en: 'Medium', ar: 'متوسط' }, low: { en: 'Low', ar: 'منخفض' } } as const;
const CAUSES: Array<{ v: ConstraintCause; en: string; ar: string }> = [
  { v: 'regulated-licensed', en: 'Regulated / licensed', ar: 'منظَّم / مرخَّص' },
  { v: 'proprietary-ip', en: 'Proprietary / IP', ar: 'ملكية فكرية' },
  { v: 'scarce-resource', en: 'Scarce resource', ar: 'مورد نادر' },
  { v: 'geographic-political', en: 'Geographic / political', ar: 'جغرافي / سياسي' },
  { v: 'small-volume-deprioritised', en: 'Small volume, deprioritised', ar: 'كمية صغيرة لا تحظى بأولوية' },
  { v: 'specification-driven', en: 'Specification-driven', ar: 'مفروض بالمواصفة' },
  { v: 'temporary-shortage', en: 'Temporary shortage', ar: 'نقص مؤقت' },
  { v: 'none', en: 'None', ar: 'لا يوجد' },
];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '—';
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A Mandatory-List item shrinks the eligible supplier base: use the reduced count as the supply-risk input (ISC inference, shown to the user). */
function withGcc(f: SubtypeFacts, e: SupplierExtras | undefined): SubtypeFacts {
  if (!e) return f;
  const adj = gccAdjustment(f.qualifiedAlternatives ?? null, e.gcc);
  return adj.reducedBy > 0 && adj.effectiveAlternatives !== null ? { ...f, qualifiedAlternatives: adj.effectiveAlternatives } : f;
}

export function SupplierSubtypePanel({
  isAr, suppliers, asOfIso, categoryItems, shares,
}: {
  isAr: boolean; suppliers: SupplierRecord[]; asOfIso: string; categoryItems: KraljicItemLite[]; shares: SupplierCategoryShare[];
}) {
  const [facts, setFacts] = useState<FactsMap>(loadFacts);
  const [mode, setMode] = useState<Mode>('suppliers');
  const [extras, setExtras] = useState<ExtrasMap>(loadExtras);
  const [ledger, setLedger] = useState<LedgerEntry[]>(loadLedger);
  const [reviews, setReviews] = useState<ReviewMap>(loadReviews);
  const [selected, setSelected] = useState<SubtypeKey | null>(null);
  const { user } = useAuth();
  const syncStatus = useKraljicWorkspaceSync(
    user, { facts, reviews, extras, ledger },
    (w) => {
      setFacts(w.facts as FactsMap); setReviews(w.reviews as ReviewMap); setExtras(w.extras as ExtrasMap); setLedger(w.ledger as LedgerEntry[]);
      safeSetItem(FACTS_KEY, JSON.stringify(w.facts)); safeSetItem(REVIEWS_KEY, JSON.stringify(w.reviews));
      safeSetItem(EXTRAS_KEY, JSON.stringify(w.extras)); safeSetItem(LEDGER_KEY, JSON.stringify(w.ledger));
    },
  );
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const decisions = useMemo(() => buildDecisions(suppliers, { asOfIso, categoryItems, shares }), [suppliers, asOfIso, categoryItems, shares]);

  const inputs: SubtypeSupplierInput[] = useMemo(() => decisions.map((d) => ({
    supplierId: d.supplier.supplierId, name: d.supplier.name, quadrant: d.supplier.quadrant,
    quadrantPriorQuarter: d.supplier.quadrantPriorQuarter, annualSpendSAR: d.supplier.annualSpendSAR ?? null,
    facts: withGcc(facts[d.supplier.supplierId] ?? {}, extras[d.supplier.supplierId]), recurrenceCount: d.detection.recurrenceCount, hhiBand: d.concentration.band,
  })), [decisions, facts, extras]);
  const summary = useMemo(() => summarisePortfolio(inputs), [inputs]);
  const report = useMemo(() => buildKraljicReport(inputs, asOfIso), [inputs, asOfIso]);

  function setFact<K extends FactKey>(id: string, k: K, v: SubtypeFacts[K]) {
    const next = { ...facts, [id]: { ...(facts[id] ?? {}), [k]: v } };
    setFacts(next);
    safeSetItem(FACTS_KEY, JSON.stringify(next));
  }

  function setExtra(id: string, next: SupplierExtras) {
    const all = { ...extras, [id]: next };
    setExtras(all);
    safeSetItem(EXTRAS_KEY, JSON.stringify(all));
  }
  function addLedger(e: LedgerEntry) {
    const next = [...ledger, e].slice(-500);
    setLedger(next);
    safeSetItem(LEDGER_KEY, JSON.stringify(next));
  }
  function removeLedger(id: string) {
    const next = ledger.filter((x) => x.id !== id);
    setLedger(next);
    safeSetItem(LEDGER_KEY, JSON.stringify(next));
  }

  function recordReview(id: string, p: { quadrant: Quadrant; riskPct: number; profitPct: number }) {
    const point: ReviewPoint = { dateIso: asOfIso, quadrant: p.quadrant, riskPct: p.riskPct, profitPct: p.profitPct };
    const prev = reviews[id] ?? [];
    const next = { ...reviews, [id]: [...prev.filter((x) => x.dateIso !== asOfIso), point].slice(-12) };
    setReviews(next);
    safeSetItem(REVIEWS_KEY, JSON.stringify(next));
  }

  const T = {
    title: isAr ? 'أنواع كرالجيك الفرعية: ماذا نفعل بكل مورد' : 'Kraljic sub-types: what to do with each supplier',
    intro: isAr ? 'كل نوع فرعي يغيّر الإجراء. النوع تحدده حقائق عن المورد؛ وحيث تنقص حقيقة حاسمة نسألك عنها ولا نفترض.' : 'Each sub-type changes the action. It is decided by facts about the supplier; where a decisive fact is missing we ask for it rather than assume.',
    kLocked: isAr ? 'مقيَّد بلا خطة طوارئ' : 'Locked, no contingency plan', kMovable: isAr ? 'اختناق يمكن تجاوزه' : 'Movable bottlenecks',
    kPool: isAr ? 'إنفاق قابل للتجميع' : 'Poolable spend', kMig: isAr ? 'تنبيهات انتقال' : 'Migration alerts', kUn: isAr ? 'جاهز للتصنيف' : 'Ready to classify',
    of: isAr ? 'من' : 'of', withSpend: isAr ? 'لها إنفاق' : 'with spend',
    unknown: isAr ? 'غير معروف' : 'Unknown', yes: isAr ? 'نعم' : 'Yes', no: isAr ? 'لا' : 'No',
    primary: isAr ? 'الموصى به' : 'Recommended', alt: isAr ? 'البديل القوي' : 'Strong alternative', trade: isAr ? 'المقايضة' : 'Trade-off',
    why: isAr ? 'لماذا هذا النوع' : 'Why this sub-type', review: isAr ? 'المراجعة القادمة' : 'Next review',
    sourced: isAr ? 'أساس أكاديمي (Kraljic)' : 'Kraljic / academic foundation', conv: isAr ? 'منهجية آي سبلاي تشين' : 'ISC method',
    facts: isAr ? 'الحقائق المحدِّدة' : 'Deciding facts', missing: isAr ? 'حقائق مطلوبة' : 'Missing facts',
    sit: isAr ? 'مواقف ومشكلات مرصودة' : 'Situations and problems found', mig: isAr ? 'تنبيهات الانتقال' : 'Migration alerts',
    dont: isAr ? 'تنبيه: لا تفعل' : 'Careful', links: isAr ? 'اربط بـ' : 'Link to', notBuilt: isAr ? 'غير مبني بعد' : 'not built yet',
    reviewAs: isAr ? 'راجعه كـ' : 'Review as', empty: isAr ? 'لا يوجد موردون بعد.' : 'No suppliers yet.',
    alts: isAr ? 'عدد البدائل المؤهَّلة' : 'Qualified alternatives', spec: isAr ? 'يمكن تخفيف المواصفة؟' : 'Can the specification loosen?',
    temp: isAr ? 'نقص مؤقت؟' : 'Temporary shortage?', cause: isAr ? 'سبب القيد' : 'Cause of the constraint', cont: isAr ? 'خطة طوارئ موثّقة؟' : 'Contingency plan on record?',
    vol: isAr ? 'تقلب سوق التوريد' : 'Supply-market volatility', stable: isAr ? 'مستقر' : 'Stable', volatile: isAr ? 'متقلب' : 'Volatile',
    pool: isAr ? 'يمكن تجميع الطلب؟' : 'Can demand be combined?', power: isAr ? 'من يملك القوة؟' : 'Who holds the power?',
    buyer: isAr ? 'المشتري' : 'Buyer', balanced: isAr ? 'متوازن' : 'Balanced', supplier: isAr ? 'المورد' : 'Supplier',
    area: isAr ? 'خريطة المشكلات' : 'Problem Map',
    oneQuick: isAr ? 'جواب سريع واحد' : 'one quick answer',
    methTitle: isAr ? 'منهجية ISC: كيف يعمل هذا ولماذا يمكنك الوثوق به' : 'The ISC method: how this works and why you can rely on it',
    meth1: isAr ? 'الأساس: نموذج Kraljic (1983) واستراتيجيات «الإبقاء أو الانتقال» لدى Gelderman & van Weele (2003) وهما المرجعان الأكثر اعتمادًا في إدارة محافظ الشراء.' : 'Foundation: Kraljic (1983) and the hold-or-move strategies of Gelderman & van Weele (2003), the most widely used references in purchasing-portfolio management.',
    meth2: isAr ? 'الامتداد: تضيف آي سبلاي تشين أنواعًا فرعية تغيّر الإجراء فعلًا، وشبكة تنقل بين الأنواع داخل الأرباع وعبرها، وتنبيهات انتقال، ومسارات خطوة بخطوة. لا يوجد معيار منشور يفعل ذلك، ولهذا بنته آي سبلاي تشين.' : 'Extension: ISC adds sub-types that change the action, a network of moves between sub-types inside and across quadrants, migration alerts, and step-by-step routes. No published standard does this, which is why ISC built it.',
    meth3: isAr ? 'الضمانات: لا تخمّن آي سبلاي تشين أبدًا (تسأل عن الحقيقة الناقصة)، وتعرض كل قاعدة كاملة، وتقدّم بديلًا قويًا ومقايضة لكل توصية، وكل العتبات قابلة للمعايرة لتناسب عملك.' : 'Safeguards: ISC never guesses (it asks for the missing fact), shows every rule in full, gives a strong alternative and a trade-off for each recommendation, and every threshold can be calibrated to your business.',
    meth4: isAr ? 'التحقق: النموذج مختبَر بحالات حدّية وسيناريوهات متسلسلة عبر الوحدات. القرار النهائي دائمًا لفريقك.' : 'Verification: the model is tested with boundary cases and chained cross-module scenarios. The final decision always stays with your team.',
    tabScore: isAr ? 'قيّم بطريقة CIPS' : 'Score (CIPS method)', constructLbl: isAr ? 'ما الذي يحدد هذا النوع الفرعي' : 'What decides this sub-type', whyQ: isAr ? 'أسئلة المراجعة' : 'Questions to ask', ground: isAr ? 'الأساس' : 'Grounding', lockIn: isAr ? 'الاعتماد مفروض (براءة/احتكار/تكلفة تحويل)؟' : 'Is the dependence forced (patent / monopoly / switching cost)?', stopRisk: isAr ? 'هل يوقف الانقطاع التشغيل؟' : 'Would a stoppage halt operations?', cipsStrat: isAr ? 'استراتيجية CIPS' : 'CIPS strategy', synth: isAr ? 'تركيب من آي سبلاي تشين' : 'ISC synthesis',
    tabSuppliers: isAr ? 'الموردون' : 'Suppliers', tabNetwork: isAr ? 'الشبكة: كيف تتحرك الأنواع' : 'Network: how sub-types connect', tabReport: isAr ? 'تقرير الإدارة' : 'Management report', tabPlaybook: isAr ? 'دليل العمل' : 'Playbook', tabEvidence: isAr ? 'الأدلة والقياس' : 'Evidence',
    m02: isAr ? 'افتح مصفوفة كرالجيك (الوحدة 02) لتجربة الطريقة على بنودك' : 'Open the Kraljic matrix (Module 02) to try the method on your items', lastRev: isAr ? 'آخر مراجعة مقيَّمة' : 'Last scored review', nextDd: isAr ? 'العناية الواجبة القادمة' : 'Next due diligence', atRenewal: isAr ? 'عند التجديد أو وقوع حادثة' : 'at renewal or incident', noneYet: isAr ? 'لا يوجد' : 'none',
    axesNote: isAr ? 'الصفوف: أثر الإنفاق (الأعلى أكبر). الأعمدة: خطر الإمداد (منخفض ثم مرتفع).' : 'Rows: spend impact (top is higher). Columns: supply risk (low, then high).',
    pickOne: isAr ? 'اختر نوعًا فرعيًا لترى إلى أين يمكن أن ينتقل ومن أين يأتي.' : 'Pick a sub-type to see where it can go and where it comes from.',
    goesTo: isAr ? 'إلى أين يمكن أن ينتقل' : 'Where it can go', comesFrom: isAr ? 'من أين يأتي' : 'Where it comes from', hereNow: isAr ? 'الموردون فيه الآن' : 'Suppliers here now',
    trigger: isAr ? 'المحفِّز' : 'Trigger', steps: isAr ? 'الخطوات' : 'Steps', payoff: isAr ? 'العائد' : 'What it buys', none: isAr ? 'لا أحد' : 'None',
    crosses: isAr ? 'يعبر الأرباع' : 'Crosses quadrants', inside: isAr ? 'داخل الربع' : 'Inside the quadrant', effort: isAr ? 'الجهد' : 'Effort',
    route: isAr ? 'المسار المقترح' : 'Suggested route', idea: isAr ? 'الفكرة الكبرى' : 'The big idea', q1: isAr ? 'السؤال الأول' : 'First question', measure: isAr ? 'المقياس' : 'How to measure it',
    priority: isAr ? 'التحركات ذات الأولوية' : 'Priority moves', migr: isAr ? 'تنبيهات الانتقال بين الأرباع' : 'Quadrant migration alerts', gaps: isAr ? 'فجوات البيانات' : 'Data gaps',
    noMoves: isAr ? 'لا توجد تحركات بعد. أكمل الحقائق الناقصة أولًا.' : 'No moves yet. Complete the missing facts first.',
    repTitle: isAr ? 'تقرير أنواع كرالجيك' : 'Kraljic sub-type report', asOf: isAr ? 'بتاريخ' : 'As of', print: isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF', csv: isAr ? 'تنزيل CSV' : 'Download CSV',
    classified: isAr ? 'مصنّف' : 'classified', spendNote: isAr ? 'الإنفاق المعروف' : 'Known spend', suppliersWord: isAr ? 'موردًا' : 'suppliers', moves: isAr ? 'خطوات' : 'moves',
  };

  const sel = 'w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white min-h-[36px]';
  const tri = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : '');
  const untri = (s: string): boolean | null => (s === 'yes' ? true : s === 'no' ? false : null);

  function TriSelect({ id, k, label, value }: { id: string; k: 'specLoosenable' | 'temporaryShortage' | 'contingencyInPlace' | 'poolableAcrossSites' | 'lockIn' | 'operationalStopRisk'; label: string; value: boolean | null | undefined }) {
    return (
      <label className="block text-[11px] text-slate-600">{label}
        <select className={sel} value={tri(value)} onChange={(e) => setFact(id, k, untri(e.target.value))}>
          <option value="">{T.unknown}</option><option value="yes">{T.yes}</option><option value="no">{T.no}</option>
        </select>
      </label>
    );
  }

  const AXIS: Record<string, Bilingual> = { risk: { en: 'Supply risk', ar: 'خطر الإمداد' }, impact: { en: 'Spend impact', ar: 'أثر الإنفاق' }, power: { en: 'Power balance', ar: 'توازن القوى' }, market: { en: 'Market', ar: 'السوق' } };
  const DIR: Record<string, Bilingual> = { 'de-risk': { en: 'Lowers risk', ar: 'يخفض المخاطر' }, 'raise-risk': { en: 'Raises risk', ar: 'يرفع المخاطر' }, lateral: { en: 'Sideways', ar: 'جانبي' } };
  const DIR_STYLE: Record<string, string> = { 'de-risk': 'bg-emerald-50 text-emerald-800 border-emerald-200', 'raise-risk': 'bg-red-50 text-red-800 border-red-200', lateral: 'bg-slate-50 text-slate-700 border-slate-200' };
  const EFF: Record<string, Bilingual> = { low: { en: 'Low', ar: 'منخفض' }, medium: { en: 'Medium', ar: 'متوسط' }, high: { en: 'High', ar: 'مرتفع' } };
  const namesIn = (k: SubtypeKey) => inputs.filter((i) => assess(i).result.subtype === k).map((i) => i.name);

  function RouteChips({ from }: { from: SubtypeKey }) {
    const r = routeFor(from);
    if (r.steps.length === 0) return <p className="text-[11px] text-slate-500 mt-1">{L(r.note)}</p>;
    return (
      <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
        <p className="text-[10px] font-bold uppercase text-indigo-800">{T.route} · {L(r.note)} · {T.effort}: {L(EFF[r.totalEffort ?? 'low'])}</p>
        <ol className="mt-1 space-y-1">
          {r.steps.map((t) => (
            <li key={t.id} className="text-[11px] text-indigo-950">
              <b>{L(SUBTYPES[t.from].label)} → {L(SUBTYPES[t.to].label)}</b>: {L(t.trigger)}
              <ul className="list-disc ms-4 text-indigo-900">{t.steps.map((s) => <li key={s.en}>{L(s)}</li>)}</ul>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  function NetworkView() {
    const GRID: Quadrant[] = ['leverage', 'strategic', 'non-critical', 'bottleneck'];
    const sel = selected ? SUBTYPES[selected] : null;
    return (
      <div className="space-y-3">
        <MatrixIllustration isAr={isAr} />
        <p className="text-[11px] text-slate-500">{T.axesNote}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
          {GRID.map((q) => (
            <div key={q} dir={isAr ? 'rtl' : 'ltr'} className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-bold text-slate-800">{L(QUADRANT_LABEL[q])}</h3>
              <p className="text-[11px] font-semibold text-slate-700 mt-1">{L(QUADRANT_IDEAS[q].headline)}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(Object.values(SUBTYPES)).filter((d) => d.quadrant === q).map((d) => (
                  <button key={d.key} type="button" aria-pressed={selected === d.key} onClick={() => setSelected(d.key)}
                    className={`text-[11px] px-2 py-1.5 rounded-lg border min-h-[36px] ${selected === d.key ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                    {L(d.label)} <span dir="ltr">({summary.bySubtype[d.key]})</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {!sel && <p className="text-xs text-slate-600">{T.pickOne}</p>}
        {sel && selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{L(sel.label)}</h3>
              <p className="text-[11px] text-slate-600">{L(sel.meaning)}</p>
              <p className="text-[11px] text-slate-700 mt-1"><b>{T.hereNow}: </b>{namesIn(selected).length ? namesIn(selected).join(isAr ? '، ' : ', ') : T.none}</p>
              {(() => {
                const dd = dueDiligenceHandoff({ subtype: selected });
                const ng = negotiationHandoff({ subtype: selected });
                const ddLabel = dd.tier === 'ENHANCED' ? (isAr ? 'معززة' : 'Enhanced') : (isAr ? 'قياسية' : 'Standard');
                return (
                  <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-700 space-y-1" data-testid="kraljic-module-links">
                    <p><b>{isAr ? 'العناية الواجبة (الوحدة 4): ' : 'Due diligence (Module 04): '}</b>{ddLabel}. {L(dd.reason)}</p>
                    <p><b>{isAr ? 'موقف التفاوض (الوحدة 6): ' : 'Negotiation stance (Module 06): '}</b>{L(ng.stanceNote)} <span className="text-slate-500">({isAr ? 'منهجية آي سبلاي تشين' : 'ISC method'})</span></p>
                  </div>
                );
              })()}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{T.goesTo}</p>
              <ul className="space-y-2">
                {outgoing(selected).map((t) => (
                  <li key={t.id} className="rounded-lg border border-slate-200 p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => setSelected(t.to)} className="text-[11px] font-bold text-[#082C6B] underline min-h-[32px]">→ {L(SUBTYPES[t.to].label)}</button>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${DIR_STYLE[t.direction]}`}>{L(DIR[t.direction])}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">{L(AXIS[t.axis])}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">{crossesQuadrant(t) ? T.crosses : T.inside}</span>
                      <span className="text-[10px] text-slate-500">{T.effort}: {L(EFF[t.effort])}</span>
                      <span className="text-[10px] text-slate-500">{t.basis === 'sourced' ? (isAr ? 'أساس أكاديمي (Kraljic)' : 'Kraljic / academic foundation') : (isAr ? 'منهجية آي سبلاي تشين' : 'ISC method')}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1"><b>{T.trigger}: </b>{L(t.trigger)}</p>
                    <ul className="list-disc ms-4 text-[11px] text-slate-700 mt-0.5">{t.steps.map((s) => <li key={s.en}>{L(s)}</li>)}</ul>
                    <p className="text-[11px] text-slate-700 mt-0.5"><b>{T.payoff}: </b>{L(t.payoff)}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{T.comesFrom}</p>
              <ul className="space-y-1">
                {incoming(selected).map((t) => (
                  <li key={t.id} className="text-[11px] text-slate-700">
                    <button type="button" onClick={() => setSelected(t.from)} className="font-bold text-[#082C6B] underline min-h-[32px]">{L(SUBTYPES[t.from].label)} →</button> {L(t.trigger)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  const csvExtras: Record<string, CsvExtra> = {};
  for (const q of report.quadrants) for (const row of q.rows) {
    const pb = playbookFor(row.subtype, q.quadrant);
    csvExtras[row.supplierId] = { lastReview: (reviews[row.supplierId] ?? []).slice(-1)[0]?.dateIso ?? '', nextDueDiligence: nextDdDate(q.quadrant, asOfIso) ?? T.atRenewal, playbookBasis: pb.objective[0]?.basis ?? '' };
  }
  const bubbleItems = report.quadrants.flatMap((q) => q.rows.map((row) => {
    const last = (reviews[row.supplierId] ?? []).slice(-1)[0];
    return { supplierId: row.supplierId, name: row.name, quadrant: q.quadrant, spendSAR: row.spendSAR, latest: last && last.riskPct != null && last.profitPct != null ? { riskPct: last.riskPct, profitPct: last.profitPct } : null };
  }));

  function downloadReportCsv() {
    const blob = new Blob([reportToCsv(report, isAr ? 'ar' : 'en', csvExtras)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `isc-kraljic-subtype-report-${asOfIso}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function printReport() {
    document.body.setAttribute('data-print', 'supplier-recovery');
    const cleanup = () => { document.body.removeAttribute('data-print'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  function ReportView() {
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-3 print:hidden">
          <button type="button" onClick={printReport} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#0a3a8c] inline-flex items-center gap-1.5 min-h-[36px]"><Printer className="w-3.5 h-3.5" aria-hidden="true" />{T.print}</button>
          <button type="button" onClick={downloadReportCsv} className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 min-h-[36px]"><Download className="w-3.5 h-3.5" aria-hidden="true" />{T.csv}</button>
        </div>
        <div className="print-zone-supplier-recovery bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">{T.repTitle}</h2>
            <p className="text-[11px] text-slate-500">{T.asOf} <span dir="ltr">{asOfIso}</span> · {report.classified}/{report.total} {T.classified}</p>
          </div>
          {report.quadrants.map((q) => (
            <section key={q.quadrant} className="border border-slate-200 rounded-xl p-3 break-inside-avoid">
              <h3 className="text-sm font-bold text-slate-800">{L(q.label)} <span className="text-[11px] font-normal text-slate-500">({q.count} {T.suppliersWord})</span></h3>
              <p className="text-[12px] font-semibold text-[#082C6B] mt-1">{L(q.idea.headline)}</p>
              <p className="text-[11px] text-slate-700 mt-1">{L(q.idea.idea)}</p>
              <p className="text-[11px] text-slate-700 mt-1"><b>{T.cipsStrat}: </b>{L(CIPS_ONE_LINE[q.quadrant].strategy)}</p>
              <p className="text-[11px] text-slate-700 mt-1"><b>{T.q1}: </b>{L(q.idea.firstQuestion)}</p>
              <p className="text-[11px] text-slate-700"><b>{T.measure}: </b>{L(q.idea.measure)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'رؤية آي سبلاي تشين' : 'ISC insight'}</p>
              {q.count > 0 && (
                <>
                  <p className="text-[11px] text-slate-600 mt-2">{q.bySubtype.map((s) => `${L(s.label)}: ${s.count}`).join(' · ')} · {T.spendNote}: <span dir="ltr">SAR {Math.round(q.spendSAR).toLocaleString('en-US')}</span> ({q.spendKnownCount}/{q.count})</p>
                  <ul className="mt-2 space-y-1.5">
                    {q.rows.map((row) => (
                      <li key={row.supplierId} className="rounded-lg border border-slate-200 p-2">
                        <p className="text-[12px] font-bold text-slate-800"><bdi>{row.name}</bdi> <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{L(row.subtypeLabel)}</span></p>
                        <p className="text-[11px] text-slate-700">{L(row.action)}</p>
                        {row.topSituation && <p className="text-[11px] text-red-800">{L(row.topSituation)}</p>}
                        <p className="text-[10px] text-slate-500">{T.route}: {row.route.steps.length > 0 ? `${row.route.steps.length} ${T.moves}` : L(row.route.note)} · {isAr ? 'المراجعة' : 'Review'} <span dir="ltr">{row.review}</span></p>
                        <p className="text-[10px] text-slate-500">{T.lastRev}: <span dir="ltr">{(reviews[row.supplierId] ?? []).slice(-1)[0]?.dateIso ?? T.noneYet}</span> · {T.nextDd}: <span dir="ltr">{nextDdDate(q.quadrant, asOfIso) ?? T.atRenewal}</span> <BasisBadge isAr={isAr} basis={playbookFor(row.subtype, q.quadrant).objective[0]?.basis ?? 'isc-design'} /></p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
          <KraljicReportPack isAr={isAr} items={bubbleItems} entries={ledger} nameOf={(id) => inputs.find((i) => i.supplierId === id)?.name ?? id} />
          <section>
            <h3 className="text-sm font-bold text-slate-800">{T.priority}</h3>
            {report.priorityMoves.length === 0 ? <p className="text-[11px] text-slate-500">{T.noMoves}</p> : (
              <ol className="list-decimal ms-5 text-[11px] text-slate-700 space-y-0.5">
                {report.priorityMoves.slice(0, 10).map((m) => <li key={m.supplierId}><bdi>{m.name}</bdi>: {m.route.steps.map((t) => L(SUBTYPES[t.to].label)).join(' → ')}</li>)}
              </ol>
            )}
          </section>
          {report.migrations.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-800">{T.migr}</h3>
              <ul className="list-disc ms-5 text-[11px] text-slate-700">{report.migrations.map((m) => <li key={m.supplierId + m.reviewAs}><bdi>{m.name}</bdi> → {L(QUADRANT_LABEL[m.reviewAs])}: {L(m.why)}</li>)}</ul>
            </section>
          )}
          {report.dataGaps.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-800">{T.gaps}</h3>
              <p className="text-[11px] text-slate-700">{report.dataGaps.map((g) => g.name).join(isAr ? '، ' : ', ')}</p>
            </section>
          )}
          <p className="text-[10px] text-slate-500">{L(report.honesty)}</p>
          <p className="text-[10px] text-slate-500">{L(ARABIC_DISCLOSURE)}</p>
        </div>
      </div>
    );
  }

  if (suppliers.length === 0) return <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500 mb-6">{T.empty}</div>;

  return (
    <div className="space-y-4 mb-6">
      <div>
        <h2 className="text-base font-bold text-slate-800">{T.title}</h2>
        <p className="text-xs text-slate-600 mt-1">{T.intro}</p>
        <Link href="/kraljic" className="inline-flex items-center min-h-[36px] mt-1 text-xs font-semibold text-[#082C6B] underline">{T.m02}</Link>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-3 print:hidden">
        <summary className="text-xs font-bold text-[#082C6B] cursor-pointer min-h-[32px]">{T.methTitle}</summary>
        <div className="mt-2 space-y-1.5 text-[11px] text-slate-700">
          <p>{T.meth1}</p><p>{T.meth2}</p><p>{T.meth3}</p><p>{T.meth4}</p><p>{L(WORDING_NOTE)}</p>
        </div>
      </details>
      {user && syncStatus !== 'idle' && (
        <p role="status" data-testid="kraljic-sync-status" className={`text-[11px] print:hidden ${syncStatus === 'error' ? 'text-red-700' : 'text-slate-500'}`}>
          {syncStatus === 'saving' ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
            : syncStatus === 'saved' ? (isAr ? 'تم الحفظ' : 'Saved')
            : (isAr ? 'تعذّر الحفظ على الخادم؛ بياناتك محفوظة على هذا الجهاز' : 'Could not save to the server; your data is kept on this device')}
        </p>
      )}
      <details className="rounded-xl border border-slate-200 bg-white p-3 print:hidden" data-testid="kraljic-glossary">
        <summary className="text-xs font-bold text-[#082C6B] cursor-pointer min-h-[32px]">{isAr ? 'الاختصارات المستخدمة' : 'Abbreviations used'}</summary>
        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
          {KRALJIC_GLOSSARY.map((e) => (
            <div key={e.abbr} className="flex gap-2"><dt className="font-bold text-[#082C6B] min-w-[3.5rem]" dir="ltr">{e.abbr}</dt><dd><span className="font-semibold">{isAr ? e.ar : e.en}.</span> {isAr ? e.plainAr : e.plainEn}</dd></div>
          ))}
        </dl>
      </details>
      <FlowSteps isAr={isAr} mode={mode} onGo={setMode} />
      <div className="flex flex-wrap gap-1.5 print:hidden" role="group" aria-label={isAr ? 'عرض أنواع كرالجيك' : 'Kraljic sub-type views'}>
        {([['suppliers', T.tabSuppliers], ['score', T.tabScore], ['network', T.tabNetwork], ['playbook', T.tabPlaybook], ['report', T.tabReport], ['evidence', T.tabEvidence]] as const).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border min-h-[36px] ${mode === m ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>
      {mode === 'score' && <KraljicScorer isAr={isAr} suppliers={inputs.map((i) => ({ supplierId: i.supplierId, name: i.name }))} onRecord={recordReview} />}
      {mode === 'network' && NetworkView()}
      {mode === 'playbook' && <KraljicPlaybookPanel isAr={isAr} />}
      {mode === 'report' && ReportView()}
      {mode === 'evidence' && <KraljicEvidencePanel isAr={isAr} suppliers={inputs.map((i) => ({ supplierId: i.supplierId, name: i.name, quadrant: i.quadrant, subtype: assess(i).result.subtype }))} entries={ledger} asOfIso={asOfIso} onAdd={addLedger} onRemove={removeLedger} />}
      {mode === 'suppliers' && (<>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {([
          [T.kLocked, String(summary.lockedWithoutContingency), summary.lockedWithoutContingency > 0],
          [T.kMovable, String(summary.movableBottlenecks), false],
          [T.kPool, summary.poolable.withSpend > 0 ? `SAR ${Math.round(summary.poolable.spendSAR).toLocaleString('en-US')}` : '—', false],
          [T.kMig, String(summary.migrations), summary.migrations > 0],
          [T.kUn, `${summary.unclassified} ${T.of} ${summary.total}`, false],
        ] as const).map(([label, value, hot]) => (
          <div key={label} className={`rounded-xl border p-3 ${hot ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-[10px] font-semibold uppercase text-slate-500 leading-tight">{label}</p>
            <p className="text-lg font-bold text-slate-800 mt-1" dir={value.includes(T.of) ? undefined : 'ltr'}>{value}</p>
          </div>
        ))}
      </div>
      {summary.poolable.suppliers > 0 && (
        <p className="text-[11px] text-slate-500">{T.kPool}: {summary.poolable.withSpend} {T.of} {summary.poolable.suppliers} {T.withSpend}.</p>
      )}

      <ul className="space-y-3">
        {[...inputs].sort((x, y) => (QUAD_ORDER[x.quadrant] - QUAD_ORDER[y.quadrant])).map((inp) => {
          const a = assess(inp);
          const r = a.result;
          const f = inp.facts ?? {};
          const miss = new Set<FactKey>(r.missingFacts);
          const ring = (k: FactKey) => (miss.has(k) ? 'ring-2 ring-amber-400 rounded-md' : '');
          return (
            <li key={inp.supplierId} className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800"><bdi>{inp.name}</bdi></h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{L(QUAD[inp.quadrant])}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.subtype === 'unclassified' ? 'bg-amber-100 text-amber-900' : 'bg-[#082C6B] text-white'}`}>{L(r.def.label)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-600">{r.def.basis === 'sourced' ? T.sourced : T.conv}</span>
              </div>
              <p className="text-[11px] text-slate-600">{L(r.def.meaning)}</p>
              <p className="text-[11px] text-slate-700 mt-1"><span className="font-semibold">{T.why}: </span>{isAr ? r.whyAr : r.whyEn}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{L(r.def.source)}</p>
              <p className="text-[11px] text-slate-700 mt-1"><span className="font-semibold">{T.cipsStrat}: </span>{L(CIPS_ONE_LINE[inp.quadrant].strategy)}</p>
              <details className="mt-1">
                <summary className="text-[11px] font-semibold text-[#082C6B] cursor-pointer min-h-[32px] flex items-center">{T.constructLbl}</summary>
                <div className="text-[11px] text-slate-700 space-y-1 mt-1">
                  <p>{L(CONSTRUCTS[r.subtype].construct)}</p>
                  <p className="font-semibold">{T.whyQ}:</p>
                  <ul className="list-disc ms-4">{CONSTRUCTS[r.subtype].whyHere.map((q) => <li key={q.en}>{L(q)}</li>)}</ul>
                  <p><span className="font-semibold">{T.ground}: </span>{L(CONSTRUCTS[r.subtype].grounding)}{CONSTRUCTS[r.subtype].origin === 'isc-synthesis' ? ` (${T.synth})` : ''}</p>
                </div>
              </details>

              <details open={miss.size > 0} className="mt-2 border border-slate-200 rounded-lg p-2">
                <summary className="text-[11px] font-semibold uppercase text-slate-600 cursor-pointer min-h-[32px] flex items-center">{miss.size > 0 ? `${T.facts} · ${T.oneQuick}` : T.facts}</summary>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {inp.quadrant === 'bottleneck' && (<>
                    <label className={`block text-[11px] text-slate-600 ${ring('qualifiedAlternatives')}`}>{T.alts}
                      <input type="number" min={0} inputMode="numeric" className={sel} dir="ltr"
                        value={f.qualifiedAlternatives ?? ''} onChange={(e) => setFact(inp.supplierId, 'qualifiedAlternatives', e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))))} />
                    </label>
                    <div className={ring('specLoosenable')}><TriSelect id={inp.supplierId} k="specLoosenable" label={T.spec} value={f.specLoosenable} /></div>
                    <TriSelect id={inp.supplierId} k="temporaryShortage" label={T.temp} value={f.temporaryShortage} />
                    <label className="block text-[11px] text-slate-600">{T.cause}
                      <select className={sel} value={f.constraintCause ?? ''} onChange={(e) => setFact(inp.supplierId, 'constraintCause', (e.target.value || null) as ConstraintCause | null)}>
                        <option value="">{T.unknown}</option>
                        {CAUSES.map((c) => <option key={c.v} value={c.v}>{isAr ? c.ar : c.en}</option>)}
                      </select>
                    </label>
                    <TriSelect id={inp.supplierId} k="contingencyInPlace" label={T.cont} value={f.contingencyInPlace} />
                  </>)}
                  {inp.quadrant === 'leverage' && (
                    <label className={`block text-[11px] text-slate-600 ${ring('marketVolatility')}`}>{T.vol}
                      <select className={sel} value={f.marketVolatility ?? ''} onChange={(e) => setFact(inp.supplierId, 'marketVolatility', (e.target.value || null) as 'stable' | 'volatile' | null)}>
                        <option value="">{T.unknown}</option><option value="stable">{T.stable}</option><option value="volatile">{T.volatile}</option>
                      </select>
                    </label>
                  )}
                  {inp.quadrant === 'non-critical' && (
                    <>
                      <div className={ring('poolableAcrossSites')}><TriSelect id={inp.supplierId} k="poolableAcrossSites" label={T.pool} value={f.poolableAcrossSites} /></div>
                      <TriSelect id={inp.supplierId} k="operationalStopRisk" label={T.stopRisk} value={f.operationalStopRisk} />
                    </>
                  )}
                  {inp.quadrant === 'strategic' && (
                    <>
                    <label className={`block text-[11px] text-slate-600 ${ring('powerBalance')}`}>{T.power}
                      <select className={sel} value={f.powerBalance ?? ''} onChange={(e) => setFact(inp.supplierId, 'powerBalance', (e.target.value || null) as 'buyer' | 'balanced' | 'supplier' | null)}>
                        <option value="">{T.unknown}</option><option value="buyer">{T.buyer}</option><option value="balanced">{T.balanced}</option><option value="supplier">{T.supplier}</option>
                      </select>
                    </label>
                    <TriSelect id={inp.supplierId} k="lockIn" label={T.lockIn} value={f.lockIn} />
                    </>
                  )}
                </div>
              </details>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">{T.primary}</p>
                  <p className="text-[11px] text-slate-800 mt-0.5">{L(r.def.primary)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                  <p className="text-[10px] font-bold uppercase text-slate-600">{T.alt}</p>
                  <p className="text-[11px] text-slate-800 mt-0.5">{L(r.def.alternative)}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-700 mt-1"><span className="font-semibold">{T.trade}: </span>{L(r.def.tradeoff)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{T.review}: <span dir="ltr">{addDays(asOfIso, r.reviewDays)}</span> ({r.reviewDays} {isAr ? 'يوم' : 'days'})</p>
              {RouteChips({ from: r.subtype })}
              <KraljicPositionCheck isAr={isAr} quadrant={inp.quadrant} reviews={reviews[inp.supplierId] ?? []} asOfIso={asOfIso} />
              <KraljicSupplierExtras isAr={isAr} quadrant={inp.quadrant} qualifiedAlternatives={facts[inp.supplierId]?.qualifiedAlternatives ?? null} extras={extras[inp.supplierId] ?? emptyExtras()} onChange={(n) => setExtra(inp.supplierId, n)} />

              {a.situations.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{T.sit}</p>
                  <ul className="space-y-1.5">
                    {a.situations.map((s) => (
                      <li key={s.key + s.problem.en} className={`rounded-lg border p-2 ${SEV_STYLE[s.severity]}`}>
                        <p className="text-[11px] font-semibold">{L(SEV_LABEL[s.severity])} · {L(s.problem)}</p>
                        <p className="text-[11px] mt-0.5">{L(s.action)}</p>
                        {s.caution && <p className="text-[11px] mt-0.5 font-semibold">{T.dont}: <span className="font-normal">{L(s.caution)}</span></p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-current/20">{T.area}: {s.problemMapArea}</span>
                          {s.links.map((lk) => (
                            <span key={lk.module + lk.purposeEn} title={L({ en: lk.purposeEn, ar: lk.purposeAr })} className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-current/20">
                              {T.links} {lk.module}{lk.built ? '' : ` (${T.notBuilt})`}: {L({ en: lk.purposeEn, ar: lk.purposeAr })}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {a.migrations.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{T.mig}</p>
                  <ul className="space-y-1">
                    {a.migrations.map((m) => (
                      <li key={m.trigger} className="text-[11px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 p-2">
                        {T.reviewAs} <b>{L(QUAD[m.reviewAs])}</b>: {isAr ? m.whyAr : m.whyEn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      </>)}
      <p className="text-[10px] text-slate-500">{L(REVIEW_INTERVAL_NOTE)} {Object.keys(SUBTYPES).length - 1} {isAr ? 'نوعًا فرعيًا.' : 'sub-types.'}</p>
    </div>
  );
}
