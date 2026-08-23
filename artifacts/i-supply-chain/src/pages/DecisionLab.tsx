// src/pages/DecisionLab.tsx
//
// Decision Lab (#166, 20 Aug 2026) — structured scenario comparison.
// Manual input only (question, options, weighted criteria) — no live data
// required. Formalizes what the Consultancy Engine already half-does
// (compare options in prose) into a dedicated screen. Concept sourced from
// ISC_UIUX_Vision_Synthesis_and_Scalability_Plan_v4.docx, Wave B-1.
//
// Deliberately v1-scoped: no Consultancy Engine cross-link/handoff yet
// (noted as a future extension), no backend changes (reuses the existing
// generic /api/ai/plan endpoint via useAIPlan), no server persistence of
// the scenario itself (localStorage only) -- only the optional AI
// rationale text persists server-side, via the same toolKey pattern every
// other toolkit tool uses.
import React, { useState, useMemo, useCallback } from 'react';
import { Scale, Plus, Trash2, Sparkles, ClipboardList, BarChart3, Trophy, Info, Printer, Target } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type DecisionCriterion, type DecisionOption, type DecisionScenario, type ScoredOption,
  newCriterion, newOption, scoreOptions, isScenarioScoreable, buildDecisionPrompt,
  mostDecisiveCriterion,
} from '@/lib/decisionLab';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'isc-decision-lab-v1';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function loadScenario(): DecisionScenario {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DecisionScenario;
      if (parsed && Array.isArray(parsed.criteria) && Array.isArray(parsed.options)) return parsed;
    }
  } catch { /* fall through to default */ }
  return {
    question: '',
    criteria: [newCriterion(''), newCriterion('')],
    options: [newOption(''), newOption('')],
  };
}

type Tab = 'setup' | 'results';

function NumberSelect({ value, onChange, max, min = 0 }: { value: number; onChange: (v: number) => void; max: number; min?: number }) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <select
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-white w-12 text-center focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
    >
      {options.map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

export function DecisionLab() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [scenario, setScenario] = useState<DecisionScenario>(loadScenario);
  const [activeTab, setActiveTab] = useState<Tab>('setup');

  const persist = useCallback((next: DecisionScenario) => {
    setScenario(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // ── Criteria ──────────────────────────────────────────────────────────────
  const addCriterion = () => persist({ ...scenario, criteria: [...scenario.criteria, newCriterion('')] });
  const removeCriterion = (id: string) => persist({ ...scenario, criteria: scenario.criteria.filter(c => c.id !== id) });
  const updateCriterion = (id: string, field: keyof DecisionCriterion, value: string | number) =>
    persist({ ...scenario, criteria: scenario.criteria.map(c => c.id === id ? { ...c, [field]: value } : c) });

  // ── Options ───────────────────────────────────────────────────────────────
  const addOption = () => persist({ ...scenario, options: [...scenario.options, newOption('')] });
  const removeOption = (id: string) => persist({ ...scenario, options: scenario.options.filter(o => o.id !== id) });
  const updateOptionName = (id: string, name: string) =>
    persist({ ...scenario, options: scenario.options.map(o => o.id === id ? { ...o, name } : o) });
  const updateOptionScore = (optionId: string, criterionId: string, score: number) =>
    persist({
      ...scenario,
      options: scenario.options.map(o => o.id === optionId ? { ...o, scores: { ...o.scores, [criterionId]: score } } : o),
    });

  // ── Scoring ───────────────────────────────────────────────────────────────
  const scored: ScoredOption[] = useMemo(() => scoreOptions(scenario), [scenario]);
  const scoreable = isScenarioScoreable(scenario);
  const maxScore = Math.max(1, ...scored.map(s => s.weightedScore));

  // Decision-readiness (#155): never leave the reader to translate a table of
  // numbers into a decision themselves -- state the recommendation plainly.
  // Honesty (#154 spirit): a razor-thin margin at the top should not read as
  // a decisive win, so a "close call" note is shown whenever the gap between
  // rank 1 and rank 2 is under 0.3 points on the 0-5 scale (~6% of the scale) --
  // small enough that re-weighting one criterion could flip the outcome.
  // Both are pure client-side derivations of the scores above -- no new AI call.
  const CLOSE_CALL_THRESHOLD = 0.3;
  const topTwoGap = scored.length >= 2 ? scored[0].weightedScore - scored[1].weightedScore : null;
  const isCloseCall = topTwoGap !== null && topTwoGap < CLOSE_CALL_THRESHOLD;
  // Which single criterion is actually carrying the top-two ranking -- lets the
  // reader scrutinize their own input on that specific rating/weight instead of
  // treating the whole ranking as an opaque black box (honesty/self-critique).
  const decisiveCriterion = useMemo(() => mostDecisiveCriterion(scored), [scored]);
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  // ── AI rationale ──────────────────────────────────────────────────────────
  const buildPrompt = useCallback(() => buildDecisionPrompt(scenario, scored, isAr), [scenario, scored, isAr]);
  const aiPlan = useAIPlan(buildPrompt, isAr, 'decisionLab', scoreable);

  const tabs: { id: Tab; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: 'setup',   label: 'Scenario Setup', labelAr: 'إعداد السيناريو', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'results', label: 'Results',        labelAr: 'النتائج',         icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Scale className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'أداة مقارنة الخيارات' : 'Structured Options Comparison'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'مختبر القرار' : 'Decision Lab'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'قارن بين خيارات قرارك بناءً على معايير مرجّحة تحددها أنت — بدون الحاجة إلى بيانات حية. أدخل الخيارات، رجّح المعايير، واحصل على ترتيب موزون بالإضافة إلى تبرير من الذكاء الاصطناعي.'
              : 'Compare your decision options against weighted criteria you define — no live data required. Enter options, weight the criteria that matter, and get a ranked, weighted score plus an optional AI rationale.'}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {['Manual Input', 'Weighted Scoring', 'No Live Data Required', 'Arabic / English'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* ── Question ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {isAr ? 'ما القرار الذي تحاول اتخاذه؟' : 'What decision are you trying to make?'}
          </label>
          <input
            type="text"
            value={scenario.question}
            onChange={e => persist({ ...scenario, question: e.target.value })}
            placeholder={isAr ? 'مثال: أي مورّد نختار للشحن الدولي؟' : 'e.g. Which supplier do we select for international freight?'}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 mb-6 border-b border-slate-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === t.id ? 'border-[#082C6B] text-[#082C6B]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.icon}
              {isAr ? t.labelAr : t.label}
            </button>
          ))}
        </div>

        {/* ── Setup tab ── */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Criteria */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {isAr ? 'المعايير والأوزان' : 'Criteria & Weights'}
                </h3>
                <button
                  onClick={addCriterion}
                  className="flex items-center gap-1 text-xs font-bold text-[#082C6B] hover:opacity-70"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة معيار' : 'Add Criterion'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                {isAr ? 'الوزن من 1 (أقل أهمية) إلى 10 (الأهم)' : 'Weight from 1 (least important) to 10 (most important)'}
              </p>
              <div className="space-y-2">
                {scenario.criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => updateCriterion(c.id, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم المعيار' : 'Criterion name'}
                      className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">{isAr ? 'الوزن' : 'Weight'}</span>
                    <NumberSelect value={c.weight} min={0} max={10} onChange={v => updateCriterion(c.id, 'weight', v)} />
                    <button onClick={() => removeCriterion(c.id)} className="p-1 text-slate-300 hover:text-red-500 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Options + scores */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {isAr ? 'الخيارات والتقييم' : 'Options & Ratings'}
                </h3>
                <button
                  onClick={addOption}
                  className="flex items-center gap-1 text-xs font-bold text-[#082C6B] hover:opacity-70"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة خيار' : 'Add Option'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                {isAr ? 'قيّم كل خيار مقابل كل معيار من 1 (ضعيف) إلى 5 (ممتاز)' : 'Rate each option against each criterion from 1 (poor) to 5 (excellent)'}
              </p>
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 pr-2 font-bold text-slate-500">{isAr ? 'الخيار' : 'Option'}</th>
                    {scenario.criteria.filter(c => c.name.trim()).map(c => (
                      <th key={c.id} className="text-center py-1.5 px-1 font-bold text-slate-500 whitespace-nowrap">{c.name}</th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {scenario.options.map(o => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-2">
                        <input
                          type="text"
                          value={o.name}
                          onChange={e => updateOptionName(o.id, e.target.value)}
                          placeholder={isAr ? 'اسم الخيار' : 'Option name'}
                          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
                        />
                      </td>
                      {scenario.criteria.filter(c => c.name.trim()).map(c => (
                        <td key={c.id} className="text-center py-1.5 px-1">
                          <NumberSelect value={o.scores[c.id] ?? 0} min={0} max={5} onChange={v => updateOptionScore(o.id, c.id, v)} />
                        </td>
                      ))}
                      <td className="text-center">
                        <button onClick={() => removeOption(o.id)} className="p-1 text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!scoreable && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  {isAr
                    ? 'أدخل خيارَين على الأقل ومعياراً واحداً على الأقل بوزن أكبر من صفر لعرض النتائج.'
                    : 'Enter at least 2 named options and 1 criterion with a weight above zero to see results.'}
                </p>
              )}
            </div>

            {scoreable && (
              <button
                onClick={() => setActiveTab('results')}
                className="text-sm font-bold text-white bg-[#082C6B] rounded-lg px-4 py-2 hover:opacity-90"
              >
                {isAr ? 'عرض النتائج ←' : 'View Results →'}
              </button>
            )}
          </div>
        )}

        {/* ── Results tab ── */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {!scoreable ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? 'أدخل الخيارات والمعايير أولاً في تبويب "إعداد السيناريو".'
                    : 'Enter options and criteria first in the Scenario Setup tab.'}
                </p>
              </div>
            ) : (
              <div className="print-zone-decision-lab space-y-6">
                {/* Print-only header */}
                <div className="hidden print:block pb-3 border-b border-gray-300">
                  <p className="text-lg font-extrabold text-gray-900">
                    {isAr ? '⚖️ ملخص مختبر القرار' : '⚖️ Decision Lab Summary'}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">{scenario.question || (isAr ? 'بدون عنوان' : 'Untitled decision')}</p>
                  <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
                </div>

                {/* Export bar (no-print) */}
                <div className="no-print flex justify-end">
                  <button
                    onClick={() => printZone('decision-lab')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-[#082C6B] text-white hover:opacity-90 transition-colors"
                    title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {isAr ? 'تصدير PDF' : 'Export PDF'}
                  </button>
                </div>

                {/* Recommendation banner (#155 decision-ready output) */}
                <div className="rounded-2xl border border-[#082C6B]/20 bg-[#082C6B]/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#082C6B]/70 mb-1">
                    {isAr ? 'التوصية' : 'Recommendation'}
                  </p>
                  <p className="text-sm font-bold text-[#082C6B]">
                    {isAr
                      ? `الأعلى تقييماً: ${scored[0].name} — بمعدل موزون ${scored[0].weightedScore.toFixed(2)} من 5 وفق معاييرك المرجّحة.`
                      : `Highest-scoring option: ${scored[0].name} -- weighted ${scored[0].weightedScore.toFixed(2)} / 5 against the criteria you weighted.`}
                  </p>
                  {isCloseCall && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                      {isAr
                        ? `تنبيه: هذا فرق ضئيل — يفصل بين أعلى خيارين ${topTwoGap?.toFixed(2)} نقطة فقط. راجع أوزان المعايير قبل اتخاذ القرار النهائي.`
                        : `Close call: the top two options are only ${topTwoGap?.toFixed(2)} points apart. Double-check your criteria weights before treating this as decisive.`}
                      {decisiveCriterion && (
                        <>
                          {' '}
                          {isAr
                            ? `المعيار الأكثر تأثيراً في هذا الفرق: "${decisiveCriterion.name}" — ابدأ المراجعة من هناك.`
                            : `Most influential criterion behind this gap: "${decisiveCriterion.name}" -- start your review there.`}
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#C9A84C]" />
                    {isAr ? 'الترتيب الموزون' : 'Weighted Ranking'}
                  </h3>
                  <div className="space-y-3">
                    {scored.map(s => (
                      <div key={s.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                              s.rank === 1 ? 'bg-[#C9A84C]' : 'bg-slate-300'
                            }`}>{s.rank}</span>
                            {s.name}
                          </span>
                          <span className="text-sm font-bold text-[#082C6B]">{s.weightedScore.toFixed(2)} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#082C6B] to-[#1a4a9e]"
                            style={{ width: `${Math.min(100, (s.weightedScore / maxScore) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-criterion breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    {isAr ? 'تفصيل حسب المعيار' : 'Breakdown by Criterion'}
                  </h3>
                  <table className="w-full text-xs min-w-[420px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1.5 pr-2 font-bold text-slate-500">{isAr ? 'الخيار' : 'Option'}</th>
                        {scored[0]?.breakdown.map(b => (
                          <th key={b.criterionId} className="text-center py-1.5 px-1 font-bold text-slate-500 whitespace-nowrap">{b.name}</th>
                        ))}
                        <th className="text-center py-1.5 px-1 font-bold text-[#082C6B] whitespace-nowrap">{isAr ? 'الإجمالي' : 'Weighted'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scored.map(s => (
                        <tr key={s.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-2 font-semibold text-slate-700">{s.name}</td>
                          {s.breakdown.map(b => (
                            <td key={b.criterionId} className="text-center py-1.5 px-1 text-slate-600">{b.rawScore || '—'}</td>
                          ))}
                          <td className="text-center py-1.5 px-1 font-bold text-[#082C6B]">{s.weightedScore.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground mt-3 flex items-start gap-1.5">
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    {isAr
                      ? 'هذه التقييمات هي أحكامك الشخصية التي أدخلتها يدوياً — وليست بيانات مُتحقَّق منها أو معيارية.'
                      : 'These ratings are your own judgment, entered manually -- not verified or benchmarked data.'}
                  </p>
                </div>

                {/* AI rationale */}
                <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#082C6B]" />
                    {isAr ? 'التبرير بالذكاء الاصطناعي' : 'AI Rationale'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    {isAr
                      ? 'يفسّر الذكاء الاصطناعي الترتيب أعلاه ويشير إلى أي مخاطر يجب مراعاتها — لا يغيّر الأوزان أو الدرجات التي أدخلتها. إن أضاف تحفظاً يخالف التوصية أعلاه، اعتبر ذلك سبباً إضافياً للمراجعة، لا تصحيحاً تلقائياً لها.'
                      : "The AI explains the ranking above and flags anything worth watching -- it does not change the weights or scores you entered. If it raises a caveat that cuts against the Recommendation above, treat that as a reason to look closer, not an automatic override."}
                  </p>
                  <AIPlanPanel
                    loading={aiPlan.loading}
                    result={aiPlan.result}
                    evidenceSummary={aiPlan.evidenceSummary}
                    error={aiPlan.error}
                    onGenerate={aiPlan.generate}
                    onReset={aiPlan.reset}
                    buttonLabel={isAr ? 'توليد التبرير ✨' : 'Generate Rationale ✨'}
                    isAr={isAr}
                    disabled={!scoreable}
                    savedPlan={aiPlan.savedPlan}
                    onViewSaved={aiPlan.viewSaved}
                    onDeleteSaved={aiPlan.deleteSaved}
                    rateLimited={aiPlan.rateLimited}
                    retryAfterSeconds={aiPlan.retryAfterSeconds}
                    toolKey="decisionLab"
                    saveError={aiPlan.saveError}
                    onDismissSaveError={aiPlan.dismissSaveError}
                    onRetrySave={aiPlan.retrySave}
                    deleteError={aiPlan.deleteError}
                    onDismissDeleteError={aiPlan.dismissDeleteError}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
