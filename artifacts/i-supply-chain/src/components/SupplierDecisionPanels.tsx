/**
 * SI Module 07 -- Decision views (Rounds B2 + B3). One data model, three
 * audiences:
 *   'actions' -> category manager: this week's action list + per-supplier
 *                decision cards (primary + alternative + trade-off).
 *   'summary' -> procurement head: portfolio picture with data confidence.
 *   'pack'    -> consultant: client-ready, printable pack + CSV.
 * Every number comes from supplierDecisionView / supplierPortfolioSummary,
 * so the three views cannot disagree.
 */
import { useMemo, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import {
  buildDecisions, buildWeeklyActions, DUE_CADENCE_NOTE, DEFAULT_OWNER, DEFAULT_OWNER_AR,
  type SupplierDecision, type Tier, type CauseKey,
} from '@/lib/supplierDecisionView';
import { buildPortfolioSummary, buildClientPackCsv } from '@/lib/supplierPortfolioSummary';
import { assessESG, ESG_THEME_LABEL, ESG_LEVEL_LABEL, ESG_METHOD_NOTE } from '@/lib/supplierESG';
import type { SupplierRecord, KraljicItemLite, SupplierCategoryShare } from '@/lib/supplierRecoveryPortfolio';
import { safeSetItem } from '@/lib/storage';

export type DecisionView = 'actions' | 'summary' | 'pack';
const OWNERS_KEY = 'isc-m07-action-owners-v1';

const TIER_STYLE: Record<Tier, string> = {
  critical: 'bg-red-700 text-white', high: 'bg-orange-600 text-white', medium: 'bg-amber-500 text-white', low: 'bg-slate-500 text-white',
};
const TIER_LABEL: Record<Tier, { en: string; ar: string }> = {
  critical: { en: 'Critical', ar: 'حرج' }, high: { en: 'High', ar: 'مرتفع' }, medium: { en: 'Medium', ar: 'متوسط' }, low: { en: 'Low', ar: 'منخفض' },
};
const CAUSE_LABEL: Record<CauseKey, { en: string; ar: string }> = {
  supplier: { en: 'Supplier', ar: 'المورد' }, client: { en: 'Our side', ar: 'جانبنا' }, shared: { en: 'Shared', ar: 'مشترك' },
  external: { en: 'External', ar: 'خارجي' }, measurement: { en: 'Measurement', ar: 'القياس' }, unassessed: { en: 'Not assessed', ar: 'غير مقيّم' },
};
const RECOVERY_LABEL: Record<string, { en: string; ar: string }> = {
  VERIFIED_RECOVERED: { en: 'Recovery verified', ar: 'التعافي مُتحقَّق منه' },
  CLOSED_NOT_RECOVERED: { en: 'Corrective action request (CAR) closed, score did NOT recover', ar: 'أُغلق طلب الإجراء التصحيحي (CAR) ولم تتعافَ الدرجة' },
  NOT_ENOUGH_POST_CLOSURE_DATA: { en: 'Too early to verify (need 2 periods after closure)', ar: 'مبكر للتحقق (يلزم فترتان بعد الإغلاق)' },
  NO_CLOSED_CAR: { en: 'No closed corrective action request (CAR) yet', ar: 'لا يوجد طلب إجراء تصحيحي (CAR) مغلق بعد' },
  NO_PERIOD_LABELS: { en: 'Cannot verify: score periods not dated', ar: 'تعذّر التحقق: فترات الدرجات غير مؤرخة' },
};
const fmtUSD = (n: number | null) => (n === null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
const fmtSAR = (n: number, isAr: boolean) => (isAr ? `${Math.round(n).toLocaleString('en-US')} ر.س` : `SAR ${Math.round(n).toLocaleString('en-US')}`);
const pctOrDash = (n: number | null) => (n === null ? '—' : `${n}%`);

function loadOwners(): Record<string, string> {
  try { const r = localStorage.getItem(OWNERS_KEY); return r ? (JSON.parse(r) as Record<string, string>) : {}; } catch { return {}; }
}

export function SupplierDecisionPanels({
  isAr, view, suppliers, asOfIso, categoryItems, shares, sourceLabel,
}: {
  isAr: boolean;
  view: DecisionView;
  suppliers: SupplierRecord[];
  asOfIso: string;
  categoryItems: KraljicItemLite[];
  shares: SupplierCategoryShare[];
  /** Shown in the pack header so a printed page states its own data origin. */
  sourceLabel: string;
}) {
  const [owners, setOwners] = useState<Record<string, string>>(loadOwners);
  const decisions = useMemo(() => buildDecisions(suppliers, { asOfIso, categoryItems, shares }), [suppliers, asOfIso, categoryItems, shares]);
  const actions = useMemo(() => buildWeeklyActions(decisions, asOfIso, owners, isAr ? DEFAULT_OWNER_AR : DEFAULT_OWNER), [decisions, asOfIso, owners, isAr]);
  const summary = useMemo(() => buildPortfolioSummary(decisions, asOfIso), [decisions, asOfIso]);
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);

  function setOwner(supplierId: string, name: string) {
    const next = { ...owners, [supplierId]: name };
    setOwners(next);
    safeSetItem(OWNERS_KEY, JSON.stringify(next));
  }

  const T = {
    empty: isAr ? 'لا يوجد موردون بعد. أضف موردين أو استورد ملف CSV.' : 'No suppliers yet. Add suppliers or import a CSV.',
    actionsTitle: isAr ? 'إجراءات هذا الأسبوع' : 'This week\'s actions',
    nothing: isAr ? 'لا توجد إجراءات مطلوبة هذا الأسبوع.' : 'Nothing needs action this week.',
    supplier: isAr ? 'المورد' : 'Supplier', tier: isAr ? 'الأولوية' : 'Priority', action: isAr ? 'الإجراء' : 'Action',
    owner: isAr ? 'المسؤول' : 'Owner', due: isAr ? 'الاستحقاق' : 'Due', dataGap: isAr ? 'فجوة بيانات' : 'Data gap',
    decisionTitle: isAr ? 'قرار لكل مورد' : 'Decision per supplier',
    primary: isAr ? 'الموصى به' : 'Recommended', alt: isAr ? 'البديل القوي' : 'Strong alternative', tradeoff: isAr ? 'المقايضة' : 'Trade-off',
    why: isAr ? 'لماذا' : 'Why', cause: isAr ? 'صاحب المشكلة (مزيج الأسباب)' : 'Whose problem (cause mix)',
    recovery: isAr ? 'هل نجح آخر إصلاح؟' : 'Did the last fix work?', cost: isAr ? 'تكلفة سوء الجودة' : 'Cost of poor quality',
    exposure: isAr ? 'الإنفاق السنوي' : 'Annual spend', conc: isAr ? 'تركّز الفئة (HHI)' : 'Category concentration (HHI)',
    spendUnknown: isAr ? 'بيانات غير كافية' : 'insufficient data', spendMock: isAr ? 'مشتق من بيانات تجريبية' : 'derived from demo data',
    rule: isAr ? 'القاعدة' : 'Rule', handoff: isAr ? 'تسليم الأدلة إلى' : 'Evidence hand-off to',
    m06: isAr ? 'الوحدة 06 (التفاوض)' : 'Module 06 (negotiation)', m03: isAr ? 'الوحدة 03 (العقود)' : 'Module 03 (contracts)',
    quadActs: isAr ? 'إجراءات ربع كرالجيك (الوحدة 02)' : 'Kraljic-quadrant actions (Module 02)',
    // summary
    sumTitle: isAr ? 'ملخص المحفظة' : 'Portfolio summary', conf: isAr ? 'ثقة البيانات' : 'Data confidence',
    confNote: isAr ? 'نسبة المحفظة التي ترتكز عليها الأرقام أعلاه. كل نسبة منفصلة، ولا توجد درجة مركّبة.' : 'How much of the portfolio the numbers above rest on. Each is shown separately; there is no composite score.',
    costByCause: isAr ? 'التكلفة حسب صاحب المشكلة' : 'Cost by whose problem', cars: isAr ? 'طلبات الإجراء التصحيحي (CAR)' : 'Corrective action requests (CARs)',
    recTitle: isAr ? 'التحقق من التعافي' : 'Recovery verification', concTitle: isAr ? 'تركّز الفئات (الوحدة 05)' : 'Category concentration (Module 05)',
    esgTitle: isAr ? 'الاستدامة (ESG) — أدلة لا درجات' : 'ESG — evidence, not a score',
    esgSummary: (a: number, b: number, c: number) => isAr ? `${a} غير مقيّم · ${b} جزئي · ${c} كامل` : `${a} not assessed · ${b} partial · ${c} full`,
    // pack
    print: isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF', csv: isAr ? 'تنزيل CSV' : 'Download CSV',
    packTitle: isAr ? 'حزمة مراجعة الموردين' : 'Supplier Review Pack', asOf: isAr ? 'بتاريخ' : 'As of', source: isAr ? 'مصدر البيانات' : 'Data source',
    packNote: isAr ? 'مخرجات دعم قرار بقواعد معلنة، وليست حكماً نهائياً. تُراجع من مختص قبل أي إجراء تعاقدي.' : 'Decision-support output with disclosed rules, not a final verdict. Review with a professional before any contractual step.',
  };

  if (suppliers.length === 0) {
    return <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500 mb-6">{T.empty}</div>;
  }

  function DecisionCard({ d }: { d: SupplierDecision }) {
    const rec = d.recommendation;
    const total = d.mix.total;
    return (
      <div className="border border-slate-200 rounded-xl p-3 bg-white break-inside-avoid">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="text-sm font-bold text-slate-800">{d.supplier.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIER_STYLE[d.tier]}`}>{L(TIER_LABEL[d.tier])}</span>
          <span className="text-[10px] text-slate-500">{d.supplier.category || '—'}</span>
        </div>
        {d.signals.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {d.signals.map((s) => <span key={s.key} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">{L(s.label)}</span>)}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
            <p className="text-[10px] font-bold uppercase text-emerald-800">{T.primary}</p>
            <p className="text-xs font-semibold text-slate-800">{L(rec.primary.title)}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">{L(rec.primary.whatToDo)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="text-[10px] font-bold uppercase text-slate-600">{T.alt}</p>
            <p className="text-xs font-semibold text-slate-800">{L(rec.alternative.title)}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">{L(rec.alternative.whatToDo)}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-700"><span className="font-semibold">{T.why}: </span>{L(rec.why)}</p>
        <p className="text-[11px] text-slate-700 mt-1"><span className="font-semibold">{T.tradeoff}: </span>{L(rec.tradeoff)}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px]">
          <div><dt className="inline font-semibold text-slate-600">{T.cause}: </dt>
            <dd className="inline text-slate-700">{total === 0 ? '—' : (Object.keys(CAUSE_LABEL) as CauseKey[]).filter((k) => d.mix.counts[k] > 0).map((k) => `${L(CAUSE_LABEL[k])} ${d.mix.counts[k]}`).join(' · ')}</dd></div>
          <div><dt className="inline font-semibold text-slate-600">{T.recovery}: </dt><dd className="inline text-slate-700">{L(RECOVERY_LABEL[d.recovery.status]!)}</dd></div>
          <div><dt className="inline font-semibold text-slate-600">{T.cost}: </dt><dd className="inline text-slate-700">{fmtUSD(d.copq.totalUSD)} ({d.copq.costedCars}/{total} {T.cars})</dd></div>
          <div><dt className="inline font-semibold text-slate-600">{T.exposure}: </dt>
            <dd className="inline text-slate-700">{d.exposure.exposureBasis === 'INSUFFICIENT_DATA' ? T.spendUnknown : `${fmtSAR(d.exposure.exposureSAR, isAr)}${d.exposure.exposureBasis === 'mock-simulated-per-supplier-spend' ? ` (${T.spendMock})` : ''}`}</dd></div>
          <div><dt className="inline font-semibold text-slate-600">{T.conc}: </dt>
            <dd className="inline text-slate-700">{d.concentration.hhi === null ? T.spendUnknown : `${d.concentration.hhi} (${d.concentration.supplierSharePct}%)`}</dd></div>
        </dl>
        <details className="mt-2 text-[11px] text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">{T.quadActs}</summary>
          <ul className="list-disc ms-5 mt-1">{rec.quadrantActions.map((a) => <li key={a.action}>{a.action} <span className="text-slate-400">({a.timeframe}, {a.effort})</span></li>)}</ul>
          <p className="mt-1 text-slate-500">{T.rule}: {L(rec.ruleSource)}</p>
          <p className="mt-1 text-slate-500">{T.handoff}: {L({ en: `${T.m06}: ${d.evidence.handoffTo[0]!.purposeEn} | ${T.m03}: ${d.evidence.handoffTo[1]!.purposeEn}`, ar: `${T.m06}: ${d.evidence.handoffTo[0]!.purposeAr} | ${T.m03}: ${d.evidence.handoffTo[1]!.purposeAr}` })}</p>
        </details>
      </div>
    );
  }

  function ActionsTable() {
    return (
      <ul className="space-y-2">
        {actions.map((a) => (
          <li key={a.id} className="rounded-lg border border-slate-200 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{a.supplierName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIER_STYLE[a.tier]}`}>{L(TIER_LABEL[a.tier])}</span>
              {a.kind === 'data-gap' && <span className="text-[9px] font-bold uppercase text-blue-700">{T.dataGap}</span>}
            </div>
            <p className="mt-1 font-semibold text-slate-800">{L(a.title)}</p>
            <p className="text-[11px] text-slate-500">{L(a.detail)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <label className="flex items-center gap-1.5">
                <span className="text-slate-500">{T.owner}</span>
                <input
                  type="text" value={owners[a.supplierId] ?? (isAr ? DEFAULT_OWNER_AR : DEFAULT_OWNER)}
                  onChange={(e) => setOwner(a.supplierId, e.target.value)}
                  aria-label={`${T.owner}: ${a.supplierName}`}
                  className="w-36 text-[11px] border border-slate-200 rounded px-1.5 py-1"
                />
              </label>
              <span className="text-slate-500">{T.due}: <span className="font-medium text-slate-800" dir="ltr">{a.dueDate}</span></span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  function downloadCsv() {
    const blob = new Blob(['﻿' + buildClientPackCsv(decisions, actions)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `isc-supplier-review-pack-${asOfIso}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  function printPack() {
    document.body.setAttribute('data-print', 'supplier-recovery');
    const cleanup = () => { document.body.removeAttribute('data-print'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  const escalated = decisions.filter((d) => d.tier !== 'low' || d.recommendation.primary.key !== 'MONITOR')
    .sort((a, b) => ['critical', 'high', 'medium', 'low'].indexOf(a.tier) - ['critical', 'high', 'medium', 'low'].indexOf(b.tier));

  if (view === 'actions') {
    return (
      <div className="space-y-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800 mb-3">{T.actionsTitle} ({actions.length})</h2>
          {actions.length === 0 ? <p className="text-xs text-slate-500">{T.nothing}</p> : ActionsTable()}
          <p className="text-[10px] text-slate-400 mt-3">{L(DUE_CADENCE_NOTE)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800 mb-3">{T.decisionTitle} ({escalated.length})</h2>
          {escalated.length === 0 ? <p className="text-xs text-slate-500">{T.nothing}</p> : <div className="space-y-3">{escalated.map((d) => <DecisionCard key={d.supplier.supplierId} d={d} />)}</div>}
        </div>
      </div>
    );
  }

  const confRows: Array<[string, number | null]> = [
    [isAr ? 'موردون بـ 4 فترات أو أكثر' : 'Suppliers with 4+ periods', summary.confidence.pctSuppliersWith4PlusPeriods],
    [isAr ? 'موردون بفترات مؤرخة' : 'Suppliers with dated periods', summary.confidence.pctSuppliersWithPeriodLabels],
    [isAr ? 'موردون بإنفاق سنوي' : 'Suppliers with annual spend', summary.confidence.pctSuppliersWithSpend],
    [isAr ? 'طلبات إجراء تصحيحي بسبب مقيَّم' : 'Corrective action requests (CARs) with an assessed cause', summary.confidence.pctCarsWithCause],
    [isAr ? 'طلبات إجراء تصحيحي بتكلفة' : 'Corrective action requests (CARs) with a cost', summary.confidence.pctCarsCosted],
  ];

  function SummaryBody() {
    return (
      <>
        <p className="text-sm font-semibold text-slate-800 mb-3">{L(summary.headline)}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {(['critical', 'high', 'medium', 'low'] as Tier[]).map((t) => (
            <div key={t} className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">{L(TIER_LABEL[t])}</p>
              <p className="text-2xl font-extrabold text-[#082C6B]">{summary.tierCounts[t]}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-1">{T.costByCause}</h3>
            <table className="w-full text-xs"><tbody>
              {(Object.keys(CAUSE_LABEL) as CauseKey[]).map((k) => (
                <tr key={k} className="border-b border-slate-100"><td className="py-1">{L(CAUSE_LABEL[k])}</td><td className="py-1">{summary.costByCause[k].cars} {T.cars}</td><td className="py-1 text-end">{fmtUSD(summary.costByCause[k].costUSD)}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-1">{T.recTitle}</h3>
            <table className="w-full text-xs"><tbody>
              {Object.entries(summary.recovery).map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100"><td className="py-1">{L(RECOVERY_LABEL[k]!)}</td><td className="py-1 text-end">{v}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-1">{T.concTitle}</h3>
            {summary.concentration.length === 0 ? <p className="text-xs text-slate-500">{T.spendUnknown}</p> : (
              <table className="w-full text-xs"><tbody>
                {summary.concentration.map((c) => (
                  <tr key={c.category} className="border-b border-slate-100"><td className="py-1">{c.category}</td>
                    <td className="py-1 text-end">{c.hhi === null ? T.spendUnknown : `${c.hhi} · ${c.band}`}</td></tr>
                ))}
              </tbody></table>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-1">{T.esgTitle}</h3>
            <p className="text-xs text-slate-700">{T.esgSummary(summary.esg.notAssessed, summary.esg.partial, summary.esg.full)}</p>
            <p className="text-[10px] text-slate-400 mt-1">{L(ESG_METHOD_NOTE)}</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xs font-bold text-slate-700 mb-1">{T.conf}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {confRows.map(([label, v]) => (
              <div key={label} className="flex justify-between text-xs border-b border-slate-100 py-1"><span>{label}</span><span className="font-semibold">{pctOrDash(v)}</span></div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{T.confNote}</p>
        </div>
      </>
    );
  }

  if (view === 'summary') {
    return <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6"><h2 className="text-sm font-bold text-slate-800 mb-3">{T.sumTitle}</h2>{SummaryBody()}</div>;
  }

  // pack
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-3 print:hidden">
        <button type="button" onClick={printPack} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#0a3a8c] inline-flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" aria-hidden="true" />{T.print}</button>
        <button type="button" onClick={downloadCsv} className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" aria-hidden="true" />{T.csv}</button>
      </div>
      <div className="print-zone-supplier-recovery bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#082C6B]">{T.packTitle}</h2>
          <p className="text-[11px] text-slate-500">{T.asOf}: {asOfIso} · {T.source}: {sourceLabel}</p>
        </div>
        {SummaryBody()}
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2">{T.decisionTitle}</h3>
          <div className="space-y-3">{escalated.map((d) => <DecisionCard key={d.supplier.supplierId} d={d} />)}</div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2">{T.actionsTitle}</h3>
          {ActionsTable()}
          <p className="text-[10px] text-slate-400 mt-2">{L(DUE_CADENCE_NOTE)}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2">{T.esgTitle}</h3>
          <ul className="text-[11px] text-slate-700 space-y-1">
            {decisions.map((d) => {
              const a = assessESG(d.supplier.esg, asOfIso);
              return <li key={d.supplier.supplierId}><span className="font-semibold">{d.supplier.name}: </span>{a.coverage === 'NOT_ASSESSED' ? (isAr ? 'غير مقيّم' : 'not assessed') : a.themes.filter((t) => t.level !== 'none').map((t) => `${L(ESG_THEME_LABEL[t.theme])} — ${L(ESG_LEVEL_LABEL[t.level])}${t.status === 'stale' ? (isAr ? ' (قديم)' : ' (stale)') : ''}`).join('; ')}</li>;
            })}
          </ul>
        </div>
        <p className="text-[10px] text-slate-400">{T.packNote}</p>
      </div>
    </div>
  );
}
