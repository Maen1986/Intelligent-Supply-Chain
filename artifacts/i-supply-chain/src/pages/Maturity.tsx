import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { rankWeakest } from '@/lib/weakestAreas';
import { MATURITY_LEVELS, getLevel, segScore as calcSegScore, overallScore as calcOverallScore } from '@/lib/maturityScoring';
import { FeedbackModal, shouldShowFeedback } from '@/components/FeedbackModal';
import { API_BASE } from '@/lib/apiBase';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Award,
  TrendingUp, RotateCcw, Pencil, Sparkles, Loader2,
  CheckCircle2, Clock, Target, AlertCircle, Building2, Users2,
} from 'lucide-react';
import {
  CORE_SEGMENTS, INDUSTRY_MODULES, INTAKE_INDUSTRIES, INTAKE_SIZES,
  getActiveModule,
  type Segment, type IntakeData,
} from './maturityData';

/* ═══════════════════════════════════════════════════════════════════════════
   SCALE LABELS  (shared display helper)
═══════════════════════════════════════════════════════════════════════════ */

const SCALE_LABELS = [
  { value: 1, short: 'Reactive',   shortAr: 'تفاعلي',   color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { value: 2, short: 'Aware',      shortAr: 'مُدرِك',    color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { value: 3, short: 'Defined',    shortAr: 'مُعرَّف',   color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A' },
  { value: 4, short: 'Managed',    shortAr: 'مُدار',     color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 5, short: 'Optimised',  shortAr: 'مُحسَّن',   color: '#0B3D91', bg: '#EFF6FF', border: '#BFDBFE' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

type Phase = 'intro' | 'intake' | 'questions' | 'results';

/**
 * localStorage key under which in-progress draft answers and phase are
 * persisted so returning users can resume where they left off.
 * v2 because the assessment now has 11 core segments (vs 8 in v1).
 */
export const MATURITY_DRAFT_KEY = 'maturity_draft_v2';

/**
 * @internal Test-only escape hatch.
 *
 * `_setMaturityTestSeed` — activate test mode and inject specific state.
 * `_clearMaturityTestSeed` — deactivate test mode so localStorage reads and
 *   writes resume.
 */
let _testSeedActive: boolean = import.meta.env.MODE === 'test';
let _testSeed: { phase?: Phase; answers?: Record<string, number>; intakeData?: IntakeData } = {};

export function _setMaturityTestSeed(seed: typeof _testSeed) {
  _testSeedActive = true;
  _testSeed = seed;
}

export function _clearMaturityTestSeed() {
  _testSeedActive = false;
  _testSeed = {};
}

/** Read a saved draft from localStorage (returns null if absent or invalid). */
function readDraft(): { phase: Phase; answers: Record<string, number>; intakeData: IntakeData } | null {
  try {
    const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { phase?: unknown; answers?: unknown; intakeData?: unknown };
    if (
      (saved.phase === 'intake' || saved.phase === 'questions' || saved.phase === 'results') &&
      saved.answers !== null &&
      typeof saved.answers === 'object' &&
      !Array.isArray(saved.answers)
    ) {
      return {
        phase: saved.phase as Phase,
        answers: saved.answers as Record<string, number>,
        intakeData: (saved.intakeData as IntakeData) ?? { industry: '', companySize: '' },
      };
    }
  } catch { /* corrupted — ignore */ }
  return null;
}

/* ── AI Remedies response type ─────────────────────────────────────────── */
interface RemedyItem {
  area: string;
  action: string;
  framework?: string;
  effort?: string;
  target?: string;
}
interface RemediesResponse {
  executiveSummary: string;
  days30: RemedyItem[];
  days60: RemedyItem[];
  days90: RemedyItem[];
  estimatedImpact?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */

export function Maturity() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [phase, setPhase] = useState<Phase>(() => {
    if (_testSeedActive) return _testSeed.phase ?? 'intro';
    return readDraft()?.phase ?? 'intro';
  });

  const [segIdx, setSegIdx] = useState(0);

  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    if (_testSeedActive) return _testSeed.answers ?? {};
    return readDraft()?.answers ?? {};
  });

  const [intakeData, setIntakeData] = useState<IntakeData>(() => {
    if (_testSeedActive) return _testSeed.intakeData ?? { industry: '', companySize: '' };
    return readDraft()?.intakeData ?? { industry: '', companySize: '' };
  });

  const topRef               = useRef<HTMLDivElement>(null);
  const [feedbackOpen,        setFeedbackOpen]        = useState(false);
  const [incompleteWarning,   setIncompleteWarning]   = useState(false);
  const [editingFromResults,  setEditingFromResults]  = useState(false);

  // AI remedies state
  const [remediesLoading,  setRemediesLoading]  = useState(false);
  const [remediesData,     setRemediesData]     = useState<RemediesResponse | null>(null);
  const [remediesError,    setRemediesError]    = useState<string | null>(null);
  const [remediesShown,    setRemediesShown]    = useState(false);

  /* Active segments depend on the chosen industry */
  const activeModule   = intakeData.industry ? getActiveModule(intakeData.industry) : null;
  const activeSegments: Segment[] = [...CORE_SEGMENTS, ...(activeModule ? [activeModule] : [])];

  const totalQuestions = activeSegments.length * 5;
  const answeredCount  = Object.keys(answers).length;
  const progress       = answeredCount / totalQuestions;

  /* ── Feedback modal after results ─────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'results') return;
    if (!shouldShowFeedback('maturity')) return;
    const id = setTimeout(() => setFeedbackOpen(true), 2500);
    return () => clearTimeout(id);
  }, [phase]);

  /* ── Guard: redirect to first incomplete segment before showing results ─ */
  useEffect(() => {
    if (phase !== 'results') return;
    if (_testSeedActive) return; // tests bypass incompleteness check
    const firstIncomplete = activeSegments.findIndex((_, i) => calcSegScore(answers, i) === null);
    if (firstIncomplete === -1) return;
    setSegIdx(firstIncomplete);
    setPhase('questions');
    setIncompleteWarning(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Persist draft ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase === 'intro') return;
    if (_testSeedActive) return;
    try {
      localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({ phase, answers, intakeData }));
    } catch { /* quota — ignore */ }
  }, [phase, answers, intakeData]);

  const scrollUp = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const setAnswer = (seg: number, q: number, val: number) =>
    setAnswers(prev => ({ ...prev, [`${seg}-${q}`]: val }));

  const segScore = (seg: number) => calcSegScore(answers, seg);

  const currentSegComplete = () => [0, 1, 2, 3, 4].every(q => answers[`${segIdx}-${q}`]);

  const handleNext = () => {
    if (segIdx < activeSegments.length - 1) { setSegIdx(s => s + 1); scrollUp(); }
    else { setEditingFromResults(false); setPhase('results'); scrollUp(); }
  };
  const handleBack = () => {
    if (segIdx > 0) { setSegIdx(s => s - 1); scrollUp(); }
    else { setPhase('intake'); scrollUp(); }
  };
  const handleReset = () => {
    try { localStorage.removeItem(MATURITY_DRAFT_KEY); } catch { /* ignore */ }
    setAnswers({});
    setIntakeData({ industry: '', companySize: '' });
    setSegIdx(0);
    setPhase('intro');
    setIncompleteWarning(false);
    setEditingFromResults(false);
    setRemediesData(null);
    setRemediesError(null);
    setRemediesShown(false);
    scrollUp();
  };
  const handleEditSegment = (i: number) => { setSegIdx(i); setEditingFromResults(true); setPhase('questions'); scrollUp(); };
  const handleBackToResults = () => { setEditingFromResults(false); setPhase('results'); scrollUp(); };

  const L = {
    yourScore: ar ? 'نتيجتك' : 'Your Score',
    gccAvg:    ar ? 'متوسط دول الخليج' : 'GCC Average',
    globalAvg: ar ? 'المتوسط العالمي' : 'Global Average',
    bestClass: ar ? 'الأفضل في فئته' : 'Best-in-Class',
  };

  const radarData = activeSegments.map((seg, i) => ({
    segment:        ar ? seg.shortTitleAr : seg.shortTitle,
    [L.yourScore]:  +(segScore(i) ?? 0).toFixed(2),
    [L.gccAvg]:     seg.benchmarks.gcc,
    [L.globalAvg]:  seg.benchmarks.global,
    [L.bestClass]:  seg.benchmarks.best,
  }));

  const overallScore = calcOverallScore(answers, activeSegments.length);
  const overallLevel = getLevel(overallScore);

  /* ── AI Remedies fetcher ──────────────────────────────────────────────── */
  const fetchRemedies = async () => {
    setRemediesLoading(true);
    setRemediesError(null);
    setRemediesShown(true);

    // Build weak sub-questions (score ≤ 3) with full context
    const weakItems = activeSegments.flatMap((seg, si) =>
      seg.questions.flatMap((q, qi) => {
        const score = answers[`${si}-${qi}`];
        if (!score || score > 3) return [];
        return [{
          segment:   ar ? seg.titleAr : seg.title,
          segmentId: seg.id,
          question:  ar ? q.qAr : q.q,
          score,
          levelText: ar ? q.levelsAr[score - 1] : q.levels[score - 1],
        }];
      })
    );

    const segScores = activeSegments.map((seg, i) => ({
      id:    seg.id,
      title: ar ? seg.titleAr : seg.title,
      score: +(segScore(i) ?? 0).toFixed(2),
      level: getLevel(segScore(i) ?? 0).label,
    }));

    try {
      const resp = await fetch(`${API_BASE}/maturity/remedies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language:     ar ? 'ar' : 'en',
          industry:     intakeData.industry || 'general',
          companySize:  intakeData.companySize || 'unknown',
          overallScore: overallScore.toFixed(2),
          overallLevel: overallLevel.label,
          segmentScores: segScores,
          weakSubQuestions: weakItems,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { ok: boolean; remedies?: RemediesResponse; error?: string };
      if (!data.ok || !data.remedies) throw new Error(data.error ?? 'No remedies returned');
      setRemediesData(data.remedies);
    } catch (err) {
      setRemediesError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRemediesLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     INTRO
  ════════════════════════════════════════════════════════════════════════ */
  if (phase === 'intro') return (
    <div ref={topRef} className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 280 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'نموذج تشخيص النضج' : 'Maturity Diagnostic Model'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {ar ? <>تقييم نضج سلسلة الإمداد<br />والمشتريات</> : <>Supply Chain &amp; Procurement<br />Maturity Assessment</>}
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">
            {ar
              ? 'تشخيص منظم عبر 11 مجالاً محورياً. يقدّم كل سؤال خمسة مستويات نضج موصوفة بوضوح — اختر المستوى الذي يصف مؤسستكم اليوم بأدق صورة.'
              : 'A structured diagnostic across 11 critical segments. Each question presents five clearly described maturity levels — select the one that most accurately describes your organisation today.'}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(ar ? [
              { label: '11 مجالاً',           sub: 'نطاق سلسلة الإمداد الكامل' },
              { label: '55 سؤالاً',            sub: '5 لكل مجال' },
              { label: '5 مستويات لكل سؤال',  sub: 'معايير صريحة لكل مستوى' },
              { label: '~20 دقيقة',            sub: 'لإكمال التقييم الكامل' },
            ] : [
              { label: '11 Segments',   sub: 'Full supply chain scope' },
              { label: '55 Questions',  sub: '5 per segment' },
              { label: '5 Levels Each', sub: 'Explicit criteria per level' },
              { label: '~20 Minutes',   sub: 'Complete assessment' },
            ]).map(item => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-muted">
                <p className="text-2xl font-extrabold text-primary">{item.label}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-xl font-bold text-primary mb-2 text-center">{ar ? 'ما الذي يغطيه هذا التقييم' : 'What This Assessment Covers'}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">{ar ? '11 مجالاً أساسياً + وحدات صناعية اختيارية بناءً على قطاعكم' : '11 core segments + optional industry module based on your sector'}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {CORE_SEGMENTS.map(seg => (
            <div key={seg.id} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-primary leading-tight">{ar ? seg.shortTitleAr : seg.shortTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{seg.questions.length} {ar ? 'أسئلة · 5 مستويات لكل سؤال' : 'questions · 5 levels each'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Industry modules teaser */}
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 mb-10">
          <p className="font-bold text-accent text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {ar ? 'وحدات صناعية مشروطة (+5 أسئلة لكل قطاع)' : 'Conditional Industry Modules (+5 questions each)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_MODULES.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-accent/30 bg-white">
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                {ar ? m.shortTitleAr : m.shortTitle}
              </div>
            ))}
          </div>
        </div>

        {/* Maturity scale */}
        <div className="bg-muted rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-primary mb-4 text-center text-sm uppercase tracking-widest">{ar ? 'مقياس النضج من 5 مستويات' : '5-Level Maturity Scale'}</h3>
          <div className="grid sm:grid-cols-5 gap-3">
            {SCALE_LABELS.map(s => (
              <div key={s.value} className="rounded-xl p-3 border text-center" style={{ backgroundColor: s.bg, borderColor: s.border }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-extrabold text-white text-sm" style={{ backgroundColor: s.color }}>{s.value}</div>
                <p className="font-bold text-sm" style={{ color: s.color }}>{ar ? s.shortAr : s.short}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => { setPhase('intake'); scrollUp(); }}
            data-testid="button-start-assessment"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-10 min-h-[52px] text-base shadow-lg">
            {ar ? 'ابدأ التقييم' : 'Start Assessment'} {ar ? <ChevronLeft className="w-5 h-5 mr-1" /> : <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
          <p className="text-muted-foreground text-sm mt-3">{ar ? 'لا يتطلب حسابًا · تُعرض النتائج فورًا · سرّي' : 'No account required · Results displayed instantly · Confidential'}</p>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     INTAKE
  ════════════════════════════════════════════════════════════════════════ */
  if (phase === 'intake') {
    const intakeComplete = intakeData.industry !== '' && intakeData.companySize !== '';
    const selectedModule = intakeData.industry ? getActiveModule(intakeData.industry) : null;

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ar ? 'الخطوة الأولى' : 'Step 1 of 2'}</p>
                <h2 className="text-xl font-extrabold text-primary">{ar ? 'معلومات عامة عن مؤسستكم' : 'Tell Us About Your Organisation'}</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {ar
                ? 'تُستخدم هذه المعلومات لتحديد الوحدة الصناعية المناسبة وتخصيص التوصيات حسب حجم المؤسسة.'
                : 'This information is used to select the relevant industry module and calibrate recommendations to your organisation size.'}
            </p>
          </div>

          {/* Industry selection */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">{ar ? 'القطاع الصناعي' : 'Industry Sector'}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INTAKE_INDUSTRIES.map(ind => {
                const selected = intakeData.industry === ind.id;
                const module   = getActiveModule(ind.id);
                return (
                  <button
                    key={ind.id}
                    data-testid={`intake-industry-${ind.id}`}
                    onClick={() => setIntakeData(d => ({ ...d, industry: ind.id }))}
                    className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-150
                      ${selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                  >
                    <p className={`font-semibold text-sm leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
                      {ar ? ind.labelAr : ind.label}
                    </p>
                    {module && (
                      <p className="text-[10px] text-accent font-bold mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {ar ? `+ ${module.shortTitleAr}` : `+ ${module.shortTitle}`}
                      </p>
                    )}
                    {selected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedModule && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                <selectedModule.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: selectedModule.color }} />
                <p className="text-sm text-foreground">
                  <span className="font-bold text-accent">{ar ? `وحدة ${selectedModule.shortTitleAr}` : `${selectedModule.shortTitle} module`}</span>
                  {ar ? ' ستُضاف تلقائيًا إلى تقييمكم.' : ' will be automatically added to your assessment.'}
                </p>
              </div>
            )}
          </div>

          {/* Company size selection */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users2 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">{ar ? 'حجم المؤسسة' : 'Organisation Size'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {INTAKE_SIZES.map(sz => {
                const selected = intakeData.companySize === sz.id;
                return (
                  <button
                    key={sz.id}
                    data-testid={`intake-size-${sz.id}`}
                    onClick={() => setIntakeData(d => ({ ...d, companySize: sz.id }))}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150
                      ${selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                  >
                    <p className={`font-bold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>{ar ? sz.labelAr : sz.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ar ? sz.subAr : sz.sub}</p>
                    {selected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setPhase('intro'); scrollUp(); }} className="gap-2">
              {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {ar ? 'العودة' : 'Back'}
            </Button>
            <Button
              onClick={() => { setPhase('questions'); setSegIdx(0); scrollUp(); }}
              disabled={!intakeComplete}
              data-testid="button-intake-continue"
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
              {ar ? 'ابدأ التقييم' : 'Begin Assessment'}
              {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     QUESTIONS
  ════════════════════════════════════════════════════════════════════════ */
  if (phase === 'questions') {
    const seg         = activeSegments[segIdx];
    const segComplete = currentSegComplete();

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen" style={{ scrollMarginTop: 80 }}>
        {/* Sticky progress header */}
        <div className="sticky top-20 z-30 bg-white border-b border-border shadow-sm">
          <div className="h-1.5 bg-muted">
            <motion.div className="h-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '20' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{ar ? `المجال ${segIdx + 1} من ${activeSegments.length}` : `Segment ${segIdx + 1} of ${activeSegments.length}`}</p>
                <p className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">{answeredCount}</span>/{totalQuestions} {ar ? 'مُجاب عنها' : 'answered'}
            </div>
          </div>
          <div className="container mx-auto px-4 pb-2.5 flex gap-1.5">
            {activeSegments.map((s, i) => {
              const done   = segScore(i) !== null;
              const active = i === segIdx;
              return (
                <div key={s.id} title={ar ? s.shortTitleAr : s.shortTitle}
                  className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-25'}`}
                  style={{ backgroundColor: active ? seg.color : done ? '#22C55E' : '#CBD5E1' }}
                  onClick={() => { setSegIdx(i); scrollUp(); }}
                />
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Incomplete-segment redirect warning */}
          {incompleteWarning && (
            <div
              data-testid="incomplete-warning"
              className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-medium"
            >
              <span className="mt-0.5 shrink-0 text-base">⚠️</span>
              <span>
                {ar
                  ? 'يرجى إكمال جميع أسئلة هذا المقطع قبل عرض النتائج. تم إعادة توجيهك إلى أول مقطع غير مكتمل.'
                  : 'Please complete all questions before viewing your results. You\'ve been redirected to the first incomplete segment.'}
              </span>
            </div>
          )}

          {/* Industry module badge */}
          {activeModule && segIdx === CORE_SEGMENTS.length && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs font-semibold text-accent">
                {ar
                  ? `وحدة ${activeModule.shortTitleAr} — مُضافة بناءً على قطاعكم`
                  : `${activeModule.shortTitle} Module — added based on your industry`}
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={segIdx}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

              {/* Segment header */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                  <seg.icon className="w-7 h-7" style={{ color: seg.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ar ? `المجال ${segIdx + 1}` : `Segment ${segIdx + 1}`}</p>
                  <h2 className="text-xl font-extrabold text-primary">{ar ? seg.titleAr : seg.title}</h2>
                </div>
              </div>

              {/* Questions */}
              {seg.questions.map((question, qi) => {
                const val = answers[`${segIdx}-${qi}`];
                return (
                  <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
                    <div className="flex items-start gap-3 p-5 pb-4 border-b border-border">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{qi + 1}</span>
                      <p className="font-semibold text-foreground text-sm leading-relaxed">{ar ? question.qAr : question.q}</p>
                    </div>

                    <div className="divide-y divide-border">
                      {SCALE_LABELS.map((s, li) => {
                        const selected = val === s.value;
                        return (
                          <button
                            key={s.value}
                            data-testid={`answer-${segIdx}-${qi}-${s.value}`}
                            onClick={() => setAnswer(segIdx, qi, s.value)}
                            className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-all duration-150 group
                              ${selected ? 'ring-2 ring-inset' : 'hover:bg-muted/60'}`}
                            style={selected ? { backgroundColor: s.bg, '--tw-ring-color': s.color } as React.CSSProperties : {}}
                          >
                            <div className="shrink-0 flex flex-col items-center gap-1 w-16">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-base transition-all
                                ${selected ? 'text-white scale-110 shadow-md' : 'text-white/80'}`}
                                style={{ backgroundColor: selected ? s.color : s.color + 'AA' }}>
                                {s.value}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight text-center transition-colors
                                ${selected ? '' : 'text-muted-foreground group-hover:text-foreground'}`}
                                style={selected ? { color: s.color } : {}}>
                                {ar ? s.shortAr : s.short}
                              </span>
                            </div>
                            <p className={`text-sm leading-relaxed pt-1 flex-1 transition-colors
                              ${selected ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {ar ? question.levelsAr[li] : question.levels[li]}
                            </p>
                            <div className={`shrink-0 mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                              ${selected ? 'border-current' : 'border-border group-hover:border-muted-foreground'}`}
                              style={selected ? { borderColor: s.color } : {}}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {val && (
                      <div className="px-5 py-2.5 flex items-center gap-2 border-t border-border" style={{ backgroundColor: SCALE_LABELS[val - 1].bg }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SCALE_LABELS[val - 1].color }} />
                        <p className="text-xs font-semibold" style={{ color: SCALE_LABELS[val - 1].color }}>
                          {ar ? `المختار: المستوى ${val} — ${SCALE_LABELS[val - 1].shortAr}` : `Selected: Level ${val} — ${SCALE_LABELS[val - 1].short}`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Navigation */}
              {editingFromResults && (
                <div className={`flex ${ar ? 'justify-start' : 'justify-end'} mt-4 mb-2`}>
                  <Button
                    variant="outline" size="sm"
                    onClick={handleBackToResults}
                    className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                    data-testid="button-back-to-results"
                  >
                    {ar ? <ChevronRight className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    {ar ? 'العودة إلى النتائج' : 'Back to Results'}
                    {ar ? <BarChart3 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between mt-6 gap-4">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {segIdx === 0 ? (ar ? 'بيانات المؤسسة' : 'Organisation Info') : (ar ? 'السابق' : 'Previous')}
                </Button>
                <div className="text-center">
                  {!segComplete && (
                    <p className="text-xs text-muted-foreground">{ar ? 'أجب عن جميع الأسئلة الخمسة للمتابعة' : 'Answer all 5 questions to continue'}</p>
                  )}
                </div>
                <Button onClick={handleNext} disabled={!segComplete}
                  data-testid="button-maturity-next"
                  className={`gap-2 ${segIdx === activeSegments.length - 1 ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-white font-bold`}>
                  {segIdx === activeSegments.length - 1
                    ? <><Award className="w-4 h-4" /> {ar ? 'عرض النتائج' : 'View Results'}</>
                    : <>{ar ? 'المجال التالي' : 'Next Segment'} {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</>}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESULTS
  ════════════════════════════════════════════════════════════════════════ */
  const selectedIndustryLabel = INTAKE_INDUSTRIES.find(i => i.id === intakeData.industry);
  const selectedSizeLabel     = INTAKE_SIZES.find(s => s.id === intakeData.companySize);

  return (
    <div ref={topRef} className="w-full" data-testid="maturity-results">
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'نتائج نضجكم' : 'Your Maturity Results'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{ar ? 'تقرير نضج سلسلة الإمداد والمشتريات' : <>Supply Chain &amp; Procurement Maturity Report</>}</h1>

          {/* Context pills */}
          {(selectedIndustryLabel || selectedSizeLabel) && (
            <div className="flex justify-center gap-3 mt-3 mb-1 flex-wrap">
              {selectedIndustryLabel && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold text-white/80">
                  <Building2 className="w-3 h-3" />
                  {ar ? selectedIndustryLabel.labelAr : selectedIndustryLabel.label}
                </span>
              )}
              {selectedSizeLabel && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold text-white/80">
                  <Users2 className="w-3 h-3" />
                  {ar ? selectedSizeLabel.labelAr : selectedSizeLabel.label}
                </span>
              )}
              {activeModule && (
                <span className="inline-flex items-center gap-1.5 bg-accent/30 rounded-full px-3 py-1 text-xs font-semibold text-accent">
                  <Sparkles className="w-3 h-3" />
                  {ar ? `+ ${activeModule.shortTitleAr}` : `+ ${activeModule.shortTitle}`}
                </span>
              )}
            </div>
          )}

          <p className="text-white/70 mt-2">{ar ? 'مقارَنة معياريًا بنظراء دول الخليج والمتوسطات العالمية والمؤسسات الأفضل في فئتها.' : 'Benchmarked against GCC peers, global averages, and best-in-class organisations.'}</p>

          <div className="mt-8 inline-flex items-center gap-6 bg-white/10 rounded-3xl px-8 py-5 border border-white/20">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{ar ? 'نتيجة النضج الإجمالية' : 'Overall Maturity Score'}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold text-white" data-testid="maturity-overall-score">{overallScore.toFixed(1)}</span>
                <span className="text-white/50 text-xl">/5.0</span>
              </div>
            </div>
            <div data-testid="maturity-overall-level" className={`px-5 py-2 rounded-full text-lg font-extrabold ${overallLevel.bg} ${overallLevel.text} border-2 ${overallLevel.border}`}>
              {ar ? overallLevel.labelAr : overallLevel.label}
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-6 flex-wrap text-sm">
            {[
              { label: ar ? 'مقابل متوسط الخليج' : 'vs GCC Average',    value: (overallScore - 2.3).toFixed(1), positive: overallScore >= 2.3 },
              { label: ar ? 'مقابل المتوسط العالمي' : 'vs Global Average', value: (overallScore - 2.8).toFixed(1), positive: overallScore >= 2.8 },
              { label: ar ? 'مقابل الأفضل في الفئة' : 'vs Best-in-Class',  value: (overallScore - 4.4).toFixed(1), positive: overallScore >= 4.4 },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span className="text-white/60">{b.label}</span>
                <span className={`font-bold ${b.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {b.positive ? '+' : ''}{b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">

        {/* Radar */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">
            {ar
              ? `رادار النضج — مقارنة معيارية عبر ${activeSegments.length} مجالات`
              : `Maturity Radar — ${activeSegments.length}-Segment Benchmark Comparison`}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? 'نتائجكم مرسومة مقابل متوسط الخليج والمتوسط العالمي ومعايير الأفضل في الفئة.' : 'Your scores plotted against GCC average, global average, and best-in-class benchmarks.'}</p>
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 11, fontWeight: 600, fill: '#1E3A5F' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickCount={6} />
                <Radar name={L.bestClass}  dataKey={L.bestClass}  stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
                <Radar name={L.globalAvg}  dataKey={L.globalAvg}  stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name={L.gccAvg}     dataKey={L.gccAvg}     stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name={L.yourScore}  dataKey={L.yourScore}  stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.2}  strokeWidth={2.5} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">{ar ? 'تفصيل نتائج المجالات' : 'Segment Score Breakdown'}</h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? 'نتيجتكم لكل مجال مقارنةً بمتوسط الخليج والمتوسط العالمي والأفضل في الفئة.' : 'Your score per segment compared to GCC average, global average, and best-in-class.'}</p>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="segment" tick={{ fontSize: 10, fontWeight: 600, fill: '#1E3A5F' }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={L.yourScore}  fill="#0B3D91" radius={[4,4,0,0]} />
                <Bar dataKey={L.gccAvg}     fill="#22C55E" radius={[4,4,0,0]} opacity={0.7} />
                <Bar dataKey={L.globalAvg}  fill="#94A3B8" radius={[4,4,0,0]} opacity={0.6} />
                <Bar dataKey={L.bestClass}  fill="#C9A84C" radius={[4,4,0,0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary">{ar ? 'المقارنة المعيارية الكاملة' : 'Full Benchmark Comparison'}</h2>
            <p className="text-muted-foreground text-sm mt-1">{ar ? 'مقارنة مجالاً بمجال عبر جميع النقاط المرجعية الأربع.' : 'Segment-by-segment comparison across all four reference points.'}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3 font-bold text-primary">{ar ? 'المجال' : 'Segment'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'نتيجتك' : 'Your Score'}</th>
                  <th className="px-4 py-3 font-bold text-center text-green-700">{ar ? 'متوسط الخليج' : 'GCC Avg'}</th>
                  <th className="px-4 py-3 font-bold text-center text-slate-600">{ar ? 'المتوسط العالمي' : 'Global Avg'}</th>
                  <th className="px-4 py-3 font-bold text-center" style={{ color: '#C9A84C' }}>{ar ? 'الأفضل في الفئة' : 'Best-in-Class'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'المستوى' : 'Level'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'تعديل' : 'Edit'}</th>
                </tr>
              </thead>
              <tbody>
                {activeSegments.map((seg, i) => {
                  const score  = segScore(i) ?? 0;
                  const level  = getLevel(score);
                  const vsGcc  = score - seg.benchmarks.gcc;
                  const vsBest = score - seg.benchmarks.best;
                  return (
                    <tr key={seg.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                            <seg.icon className="w-3.5 h-3.5" style={{ color: seg.color }} />
                          </div>
                          <span className="font-semibold text-foreground">{ar ? seg.shortTitleAr : seg.shortTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center"><span className="font-extrabold text-primary text-base">{score.toFixed(2)}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-muted-foreground">{seg.benchmarks.gcc}</span>
                        <span className={`ml-1.5 text-xs font-bold ${vsGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>{vsGcc >= 0 ? '+' : ''}{vsGcc.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground">{seg.benchmarks.global}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span style={{ color: '#C9A84C' }} className="font-medium">{seg.benchmarks.best}</span>
                        <span className="ml-1.5 text-xs font-bold text-muted-foreground">({vsBest.toFixed(1)})</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{ar ? level.labelAr : level.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleEditSegment(i)}
                          data-testid={`button-edit-segment-${i}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary border border-primary/25 hover:bg-primary/8 hover:border-primary/50 transition-colors"
                          title={ar ? `تعديل ${seg.shortTitleAr}` : `Edit ${seg.shortTitle}`}
                        >
                          <Pencil className="w-3 h-3" />
                          {ar ? 'تعديل' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td className="px-5 py-3.5 font-extrabold text-primary">{ar ? 'المتوسط الإجمالي' : 'Overall Average'}</td>
                  <td className="px-4 py-3.5 text-center font-extrabold text-primary text-base">{overallScore.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.30</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.84</td>
                  <td className="px-4 py-3.5 text-center font-semibold" style={{ color: '#C9A84C' }}>4.44</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${overallLevel.bg} ${overallLevel.text} border ${overallLevel.border}`}>{ar ? overallLevel.labelAr : overallLevel.label}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Per-segment recommendations */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-2">{ar ? 'توصيات على مستوى المجال' : 'Segment-Level Recommendations'}</h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? "إرشادات مصممة لكل مجال بناءً على مستوى نضجكم، من مَعِين الحقش MCIPS · CPSM." : "Tailored guidance for each segment based on your maturity level, from Ma'in Alhaqash MCIPS · CPSM."}</p>
          <div className="grid md:grid-cols-2 gap-5">
            {activeSegments.map((seg, i) => {
              const score     = segScore(i) ?? 0;
              const level     = getLevel(score);
              const rec       = ar ? seg.recommendationsAr[level.label] : seg.recommendations[level.label];
              const gapToBest = seg.benchmarks.best - score;
              const gapToGcc  = score - seg.benchmarks.gcc;
              return (
                <div key={seg.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${level.border}`}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                      <seg.icon className="w-5 h-5" style={{ color: seg.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-extrabold">{score.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">/5.0</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{ar ? level.labelAr : level.label}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-20">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: level.color }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>0</span><span>5</span></div>
                    </div>
                    <button
                      onClick={() => handleEditSegment(i)}
                      data-testid={`button-edit-segment-rec-${i}`}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/25 hover:bg-primary/8 hover:border-primary/50 transition-colors"
                      title={ar ? `تعديل ${seg.shortTitleAr}` : `Edit ${seg.shortTitle}`}
                    >
                      <Pencil className="w-3 h-3" />
                      {ar ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex gap-3 mb-3">
                      <span className={`text-xs font-bold ${gapToGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gapToGcc >= 0 ? '↑' : '↓'} {Math.abs(gapToGcc).toFixed(1)} {ar ? 'مقابل متوسط الخليج' : 'vs GCC avg'}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">↑ {gapToBest.toFixed(1)} {ar ? 'للوصول إلى الأفضل في الفئة' : 'to best-in-class'}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI Remedies Panel ───────────────────────────────────────────── */}
        <div className="rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 to-white overflow-hidden">
          <div className="p-6 border-b border-accent/20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-bold text-primary">{ar ? 'خارطة طريق العلاج بالذكاء الاصطناعي' : 'AI-Powered Remediation Roadmap'}</h2>
                </div>
                <p className="text-muted-foreground text-sm max-w-2xl">
                  {ar
                    ? 'يُحلّل الذكاء الاصطناعي إجاباتك الفعلية على الأسئلة الفرعية، ويحدد التبعيات بين المجالات، ويقترح خارطة طريق 30/60/90 يومًا بإجراءات محددة الأثر ومُعيّرة حسب حجم مؤسستكم.'
                    : "The AI analyses your actual sub-question answers, maps dependencies across segments, and generates a 30/60/90-day roadmap with measurable, size-calibrated actions."}
                </p>
              </div>
              {!remediesShown && (
                <Button
                  onClick={fetchRemedies}
                  data-testid="button-generate-remedies"
                  className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 shrink-0">
                  <Sparkles className="w-4 h-4" />
                  {ar ? 'إنشاء خارطة الطريق' : 'Generate Roadmap'}
                </Button>
              )}
            </div>
          </div>

          {/* Loading */}
          {remediesLoading && (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <div>
                <p className="font-bold text-primary">{ar ? 'يُحلّل الذكاء الاصطناعي نتائجكم…' : 'AI is analysing your results…'}</p>
                <p className="text-sm text-muted-foreground mt-1">{ar ? 'يُفكّر في تبعيات المجالات وفرص التحسين ذات الأولوية.' : 'Reasoning across segment dependencies and priority improvement opportunities.'}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {remediesError && !remediesLoading && (
            <div className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-700 text-sm">{ar ? 'تعذّر إنشاء خارطة الطريق.' : 'Could not generate the roadmap.'}</p>
                <p className="text-xs text-muted-foreground mt-1">{remediesError}</p>
                <Button size="sm" variant="outline" onClick={fetchRemedies} className="mt-3 gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50">
                  <RotateCcw className="w-3 h-3" /> {ar ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            </div>
          )}

          {/* Remedies content */}
          {remediesData && !remediesLoading && (
            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{ar ? 'الملخص التنفيذي' : 'Executive Summary'}</p>
                <p className="text-foreground text-sm leading-relaxed">{remediesData.executiveSummary}</p>
                {remediesData.estimatedImpact && (
                  <div className="mt-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-sm font-semibold text-accent">{remediesData.estimatedImpact}</p>
                  </div>
                )}
              </div>

              {/* 30/60/90 columns */}
              {[
                { days: 30,  items: remediesData.days30,  label: ar ? '30 يومًا' : '30 Days',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: Target },
                { days: 60,  items: remediesData.days60,  label: ar ? '60 يومًا' : '60 Days',  color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: Clock },
                { days: 90,  items: remediesData.days90,  label: ar ? '90 يومًا' : '90 Days',  color: '#0B3D91', bg: '#EFF6FF', border: '#BFDBFE', icon: CheckCircle2 },
              ].map(col => (
                <div key={col.days}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: col.bg, border: `2px solid ${col.border}` }}>
                      <col.icon className="w-4 h-4" style={{ color: col.color }} />
                    </div>
                    <h3 className="font-bold text-primary">{ar ? `إجراءات` : 'Actions for'} {col.label}</h3>
                  </div>
                  <div className="space-y-3">
                    {col.items.map((item, idx) => (
                      <div key={idx} className="rounded-xl border p-4" style={{ backgroundColor: col.bg + '80', borderColor: col.border }}>
                        <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                          <p className="font-semibold text-foreground text-sm flex-1">{item.action}</p>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {item.effort && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white border" style={{ borderColor: col.border, color: col.color }}>
                                {item.effort}
                              </span>
                            )}
                            {item.framework && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                {item.framework}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 bg-white rounded-full border border-border">{item.area}</span>
                          {item.target && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Target className="w-3 h-3 text-accent" />
                              {item.target}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Regenerate */}
              <div className="flex justify-center pt-2">
                <Button size="sm" variant="outline" onClick={fetchRemedies}
                  className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/5">
                  <RotateCcw className="w-3 h-3" />
                  {ar ? 'إعادة الإنشاء' : 'Regenerate'}
                </Button>
              </div>
            </div>
          )}

          {/* Not yet triggered placeholder */}
          {!remediesShown && !remediesLoading && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Sparkles className="w-8 h-8 text-accent/30 mx-auto mb-3" />
              <p>{ar ? 'اضغط "إنشاء خارطة الطريق" للحصول على توصيات مُخصَّصة مدفوعة بالذكاء الاصطناعي.' : 'Click "Generate Roadmap" to receive AI-powered, personalised remediation recommendations.'}</p>
            </div>
          )}
        </div>

        {/* Priority action plan */}
        <div className="bg-[#082C6B] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">{ar ? 'خطة العمل ذات الأولوية' : 'Priority Action Plan'}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {rankWeakest(
              activeSegments.map((seg, i) => ({ seg, i, score: segScore(i) ?? 0 })),
              item => item.score,
              3,
            ).map((item, rank) => (
              <div key={item.seg.id} className="bg-white/10 rounded-2xl p-5 border border-white/15">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">{rank + 1}</span>
                  <span className="text-xs font-bold text-accent uppercase tracking-widest">{ar ? `الأولوية ${rank + 1}` : `Priority ${rank + 1}`}</span>
                </div>
                <h3 className="font-bold text-white text-sm mb-1">{ar ? item.seg.titleAr : item.seg.title}</h3>
                <p className="text-white/60 text-xs">{ar ? 'النتيجة' : 'Score'}: {item.score.toFixed(2)} / 5.0 · {ar ? getLevel(item.score).labelAr : getLevel(item.score).label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                {ar ? "ناقش النتائج مع مَعِين" : "Discuss Results with Ma'in"} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
            <Button size="lg" variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary font-bold px-8"
              onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" /> {ar ? 'إعادة التقييم' : 'Retake Assessment'}
            </Button>
          </div>
        </div>

      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} tool="maturity" />
    </div>
  );
}
