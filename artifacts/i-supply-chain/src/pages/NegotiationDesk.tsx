// src/pages/NegotiationDesk.tsx
//
// Negotiation Desk v1 (E3 Negotiation Intelligence, built 5 Nov 2026 on the owner's instruction).
// A guided six-step preparation flow that surfaces logic which already existed and was tested but had no page:
//   supplierCommercialIntelligence.ts  -> leverage reading, price trend, tit-for-tat next move
//   negotiationTactics.ts              -> tactics to use, tactics to watch for, team, stages
// Standalone-first: manual input only. Saved in this browser only (localStorage), a disclosed
// prototype-stage limit; a server-saved case record is the next step in the E3 spec.
// Nothing here is shared with the supplier. Every rule and threshold is disclosed on screen.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Handshake, Plus, Trash2, Printer, Info, ShieldAlert, Check, ChevronRight, ChevronLeft,
  Gauge, TrendingUp, Swords, Users, Repeat, FileText, Sparkles, RotateCcw, Lock,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { safeSetItem } from '@/lib/storage';
import type { KraljicQuadrant } from '@/lib/kraljicScoring';
import {
  assessNegotiationLeverage, computePriceTrajectory, recommendNextMove,
  type PricePoint, type NegotiationRound, type OurMove, type CounterpartMove, type LeverageLevel,
} from '@/lib/supplierCommercialIntelligence';
import {
  recommendClientTactics, recommendWatchForTactics, buildNegotiationTeam, recommendNegotiationLevels,
} from '@/lib/negotiationTactics';

const KEY = 'isc-negotiation-desk-v1';
type Survive = 'yes' | 'no' | 'unknown';
interface DeskState {
  supplier: string;
  quadrant: KraljicQuadrant;
  lockIn: string;
  survivable: Survive;
  points: PricePoint[];
  rounds: NegotiationRound[];
}
const EMPTY: DeskState = { supplier: '', quadrant: 'leverage', lockIn: '', survivable: 'unknown', points: [], rounds: [] };
// Illustrative example only. Not client data, not a benchmark.
const EXAMPLE: DeskState = {
  supplier: 'Example Packaging Co. (illustrative)',
  quadrant: 'leverage',
  lockIn: '1.5',
  survivable: 'yes',
  points: [
    { periodLabel: 'Q1', price: 100, sortKey: '2026-01-15' },
    { periodLabel: 'Q2', price: 104, sortKey: '2026-04-15' },
    { periodLabel: 'Q3', price: 109, sortKey: '2026-07-15' },
    { periodLabel: 'Q4', price: 115, sortKey: '2026-10-15' },
  ],
  rounds: [],
};

function load(): DeskState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<DeskState>) };
  } catch { /* fall through */ }
  return EMPTY;
}

const QUADRANTS: { id: KraljicQuadrant; en: string; ar: string; hintEn: string; hintAr: string }[] = [
  { id: 'leverage', en: 'Leverage', ar: 'النفوذ', hintEn: 'Many suppliers, easy to switch', hintAr: 'موردون كثر، التبديل سهل' },
  { id: 'strategic', en: 'Strategic', ar: 'استراتيجي', hintEn: 'High value, high risk', hintAr: 'قيمة ومخاطر عالية' },
  { id: 'bottleneck', en: 'Bottleneck', ar: 'الاختناق', hintEn: 'Few suppliers, hard to replace', hintAr: 'موردون قليلون، يصعب استبدالهم' },
  { id: 'non-critical', en: 'Routine', ar: 'روتيني', hintEn: 'Low value, low risk', hintAr: 'قيمة ومخاطر منخفضة' },
];
const LEVEL_TONE: Record<LeverageLevel, { box: string; dot: string; en: string; ar: string }> = {
  STRONG: { box: 'bg-emerald-50 border-emerald-200 text-emerald-900', dot: 'bg-emerald-500', en: 'Strong position', ar: 'موقف قوي' },
  MODERATE: { box: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-500', en: 'Moderate position', ar: 'موقف متوسط' },
  WEAK: { box: 'bg-red-50 border-red-200 text-red-900', dot: 'bg-red-500', en: 'Weak position', ar: 'موقف ضعيف' },
  INSUFFICIENT_DATA: { box: 'bg-slate-50 border-slate-200 text-slate-700', dot: 'bg-slate-400', en: 'Not enough data', ar: 'بيانات غير كافية' },
};
const DIR: Record<string, { en: string; ar: string }> = {
  up: { en: 'Price rising', ar: 'السعر في ارتفاع' },
  down: { en: 'Price falling', ar: 'السعر في انخفاض' },
  flat: { en: 'Price flat', ar: 'السعر مستقر' },
  INSUFFICIENT_DATA: { en: 'Add 3 price points', ar: 'أضف 3 نقاط سعرية' },
};

// ISC guidance per position: a main option and a close second, with the trade-off (never a single path).
// This is ISC judgement derived from the disclosed rule above, not a sourced benchmark.
const APPROACH: Record<LeverageLevel, { pEn: string; pAr: string; aEn: string; aAr: string; tEn: string; tAr: string }> = {
  STRONG: {
    pEn: 'Negotiate on evidence: show your real alternative and ask for a price rollback or a freeze.',
    pAr: 'فاوض بالأدلة: أظهر بديلك الحقيقي واطلب إعادة السعر أو تثبيته.',
    aEn: 'Offer a longer or larger commitment in return for a lower price.',
    aAr: 'اعرض التزاماً أطول أو أكبر مقابل سعر أقل.',
    tEn: 'The first keeps you free to switch; the second buys a better price but reduces that freedom.',
    tAr: 'الأول يبقيك حراً في التبديل؛ والثاني يشتري سعراً أفضل لكنه يقلل هذه الحرية.',
  },
  MODERATE: {
    pEn: 'Trade, do not demand: link any price movement to volume, payment terms or contract length.',
    pAr: 'تبادل ولا تطالب: اربط أي تغيير في السعر بالكمية أو شروط الدفع أو مدة العقد.',
    aEn: 'Run a quick market check on one or two alternatives to strengthen your hand before you meet.',
    aAr: 'أجرِ فحصاً سريعاً للسوق لبديل أو اثنين لتقوية موقفك قبل اللقاء.',
    tEn: 'Trading is faster; the market check takes time but can lift you to a strong position.',
    tAr: 'التبادل أسرع؛ وفحص السوق يستغرق وقتاً لكنه قد يرفعك إلى موقف قوي.',
  },
  WEAK: {
    pEn: 'Protect rather than push: accept a limited rise only with a cap, a review date and an index clause.',
    pAr: 'احمِ ولا تضغط: اقبل زيادة محدودة فقط مع سقف وتاريخ مراجعة وبند مؤشر.',
    aEn: 'Start reducing lock-in now (qualify a second source) and keep this deal short.',
    aAr: 'ابدأ بتقليل التقييد الآن (تأهيل مصدر ثانٍ) وأبقِ هذه الصفقة قصيرة.',
    tEn: 'Protection limits damage today; reducing lock-in costs effort now but restores leverage later.',
    tAr: 'الحماية تحدّ من الضرر اليوم؛ وتقليل التقييد يكلّف جهداً الآن لكنه يعيد القوة التفاوضية لاحقاً.',
  },
  INSUFFICIENT_DATA: {
    pEn: 'Complete step 2 first. A recommendation without your lock-in and switching answers would be a guess.',
    pAr: 'أكمل الخطوة 2 أولاً. توصية دون إجابتي التقييد والتبديل ستكون تخميناً.',
    aEn: 'If you are short of time, prepare the questions you would ask the supplier to learn their position.',
    aAr: 'إذا ضاق الوقت، حضّر الأسئلة التي ستطرحها على المورّد لمعرفة موقفه.',
    tEn: 'Neither is a substitute for the data; both only prepare you.',
    tAr: 'لا أحدهما بديل عن البيانات؛ كلاهما يحضّرك فقط.',
  },
};

const STEPS = [
  { id: 'setup', icon: Handshake, en: 'Setup', ar: 'الإعداد' },
  { id: 'position', icon: Gauge, en: 'Position', ar: 'الموقف' },
  { id: 'price', icon: TrendingUp, en: 'Price', ar: 'السعر' },
  { id: 'tactics', icon: Swords, en: 'Tactics', ar: 'التكتيكات' },
  { id: 'rounds', icon: Repeat, en: 'Rounds', ar: 'الجولات' },
  { id: 'brief', icon: FileText, en: 'Brief', ar: 'الملخص' },
] as const;

const inputCls = 'w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 focus:border-[#082C6B]';

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-[11px] text-slate-500 leading-relaxed mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span>{children}</span>
    </p>
  );
}

function PowerMeter({ value, isAr }: { value: number | null; isAr: boolean }) {
  const pct = value === null ? null : Math.min(100, Math.max(0, (value / 5) * 100));
  return (
    <div className="mt-3" aria-hidden="true">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        <div className="bg-emerald-400" style={{ width: '40%' }} />
        <div className="bg-amber-400" style={{ width: '40%' }} />
        <div className="bg-red-400" style={{ width: '20%' }} />
        {pct !== null && <div className="absolute top-[-3px] w-1.5 h-[18px] bg-[#082C6B] rounded border border-white" style={{ [isAr ? 'right' : 'left']: `calc(${isAr ? 100 - pct : pct}% - 3px)` }} />}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>0</span><span>2</span><span>4</span><span>5</span></div>
    </div>
  );
}

function Spark({ points }: { points: PricePoint[] }) {
  const pts = [...points].filter(p => p.price > 0).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  if (pts.length < 2) return null;
  const w = 320, h = 80, pad = 8;
  const min = Math.min(...pts.map(p => p.price)), max = Math.max(...pts.map(p => p.price));
  const span = max - min || 1;
  const xy = pts.map((p, i) => [pad + (i * (w - 2 * pad)) / (pts.length - 1), h - pad - ((p.price - min) / span) * (h - 2 * pad)] as const);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm h-20 mt-3" role="img" aria-label="Price trend chart">
      <polyline fill="none" stroke="#082C6B" strokeWidth="2.5" strokeLinejoin="round" points={xy.map(([x, y]) => `${x},${y}`).join(' ')} />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#C9A84C" stroke="#fff" strokeWidth="1.5" />)}
    </svg>
  );
}

export function NegotiationDesk() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [s, setS] = useState<DeskState>(load);
  const [step, setStep] = useState(0);
  useEffect(() => { safeSetItem(KEY, JSON.stringify(s)); }, [s]);
  const set = <K extends keyof DeskState>(k: K, v: DeskState[K]) => setS(prev => ({ ...prev, [k]: v }));

  const lockInNum = s.lockIn.trim() === '' ? null : Number(s.lockIn);
  const lockInClean = lockInNum !== null && Number.isFinite(lockInNum) ? Math.min(5, Math.max(0, lockInNum)) : null;
  const leverage = useMemo(
    () => assessNegotiationLeverage({ lockInIndex: lockInClean, isSurvivable: s.survivable === 'unknown' ? null : s.survivable === 'yes' }, s.quadrant),
    [lockInClean, s.survivable, s.quadrant],
  );
  const trend = useMemo(() => computePriceTrajectory(s.points, { quadrant: s.quadrant, basis: 'observed' }), [s.points, s.quadrant]);
  const next = useMemo(() => recommendNextMove(s.rounds), [s.rounds]);
  const useTactics = recommendClientTactics(s.quadrant);
  const watchTactics = recommendWatchForTactics(s.quadrant);
  const team = buildNegotiationTeam(s.quadrant);
  const levels = recommendNegotiationLevels(s.quadrant);
  const tone = LEVEL_TONE[leverage.level];
  const approach = APPROACH[leverage.level];
  const quad = QUADRANTS.find(q => q.id === s.quadrant)!;

  const checks = [
    { ok: s.supplier.trim().length > 0, en: 'Supplier named', ar: 'تمت تسمية المورّد' },
    { ok: lockInClean !== null, en: 'Lock-in index entered', ar: 'تم إدخال مؤشر التقييد' },
    { ok: s.survivable !== 'unknown', en: 'Switching question answered', ar: 'تمت الإجابة عن سؤال التبديل' },
    { ok: trend.direction !== 'INSUFFICIENT_DATA', en: 'At least 3 price points', ar: '3 نقاط سعرية على الأقل' },
    { ok: s.points.length >= 3 && s.points.every(p => p.price > 0), en: 'All prices filled in', ar: 'جميع الأسعار مكتملة' },
  ];
  const done = checks.filter(c => c.ok).length;

  const addPoint = () => setS(p => ({ ...p, points: [...p.points, { periodLabel: '', price: 0, sortKey: new Date().toISOString().slice(0, 10) }] }));
  const updPoint = (i: number, patch: Partial<PricePoint>) => setS(p => ({ ...p, points: p.points.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const addRound = () => setS(p => ({ ...p, rounds: [...p.rounds, { date: new Date().toISOString().slice(0, 10), ourMove: 'cooperated', counterpartMove: 'unclear', note: '' }] }));
  const updRound = (i: number, patch: Partial<NegotiationRound>) => setS(p => ({ ...p, rounds: p.rounds.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const Arrow = isAr ? ChevronLeft : ChevronRight;
  const Back = isAr ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20"><Handshake className="w-8 h-8 text-[#C9A84C]" /></div>
            <div className="flex-1">
              <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-widest mb-1">{t('Negotiation Intelligence', 'ذكاء التفاوض')}</p>
              <h1 className="text-3xl font-black leading-tight">{t('Negotiation Desk', 'مكتب التفاوض')}</h1>
              <p className="text-white/75 mt-2 max-w-xl leading-relaxed text-sm">
                {t('Walk into the meeting prepared in six short steps: where you stand, what the price says, what to use, what to watch for, and your next move.',
                   'ادخل الاجتماع مستعداً في ست خطوات قصيرة: أين تقف، ماذا يقول السعر، ما تستخدمه، ما تحذر منه، وخطوتك التالية.')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5 text-[11px] text-white/80">
            <span className="px-3 py-1 rounded-full border border-white/20 bg-white/5 flex items-center gap-1"><Lock className="w-3 h-3" />{t('Private to your team', 'خاص بفريقك')}</span>
            <span className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t('Rules shown on screen', 'القواعد معروضة على الشاشة')}</span>
            <span className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t('Arabic / English', 'عربي / إنجليزي')}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-5 pb-12">
        {/* At-a-glance bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sticky top-2 z-10" aria-label={t('Your negotiation at a glance', 'تفاوضك في لمحة')}>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{t('Position', 'الموقف')}</p>
            <p className="text-sm font-bold flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${tone.dot}`} />{isAr ? tone.ar : tone.en}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{t('Price', 'السعر')}</p>
            <p className="text-sm font-bold">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%`}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{t('Ready', 'الجاهزية')}</p>
            <p className="text-sm font-bold">{done}/{checks.length}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{t('Next move', 'الخطوة التالية')}</p>
            <p className="text-sm font-bold">{next.move === 'cooperate' ? t('Cooperate', 'تعاون') : t('Match, then reset', 'مجاراة ثم عودة')}</p></div>
        </div>

        {/* Stepper */}
        <nav aria-label={t('Steps', 'الخطوات')} className="no-print flex gap-1 mt-5 overflow-x-auto pb-1">
          {STEPS.map((st, i) => {
            const Icon = st.icon;
            const active = i === step;
            return (
              <button key={st.id} onClick={() => setStep(i)} aria-current={active ? 'step' : undefined}
                className={`flex-1 min-w-[84px] flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold border transition ${active ? 'bg-[#082C6B] text-white border-[#082C6B] shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-[#082C6B]/40'}`}>
                <Icon className="w-4 h-4" /> {i + 1}. {isAr ? st.ar : st.en}
              </button>
            );
          })}
        </nav>

        {/* Step body */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-4">
          {step === 0 && (
            <div>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div><h2 className="text-lg font-bold text-[#082C6B]">{t('Who are you negotiating with?', 'مع من تتفاوض؟')}</h2>
                  <p className="text-sm text-slate-500">{t('Two answers shape everything that follows.', 'إجابتان تحددان كل ما يلي.')}</p></div>
                <div className="no-print flex gap-2">
                  <button onClick={() => { setS(EXAMPLE); }} className="flex items-center gap-1.5 text-xs font-bold text-[#082C6B] border border-[#082C6B]/30 rounded-lg px-3 py-2 hover:bg-slate-50"><Sparkles className="w-3.5 h-3.5" />{t('Try an example', 'جرّب مثالاً')}</button>
                  <button onClick={() => { setS(EMPTY); setStep(0); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" />{t('Clear', 'مسح')}</button>
                </div>
              </div>
              <label className="block text-xs font-semibold text-slate-600 mt-5">{t('Supplier or category', 'المورّد أو الفئة')}
                <input className={`${inputCls} mt-1`} value={s.supplier} onChange={e => set('supplier', e.target.value)} placeholder={t('e.g. Packaging supplier', 'مثال: مورّد التغليف')} /></label>
              <fieldset className="mt-5">
                <legend className="text-xs font-semibold text-slate-600 mb-2">{t('What kind of purchase is it?', 'ما نوع هذه المشتريات؟')}</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUADRANTS.map(q => (
                    <button key={q.id} type="button" onClick={() => set('quadrant', q.id)} aria-pressed={s.quadrant === q.id}
                      className={`text-start rounded-xl border p-3 transition ${s.quadrant === q.id ? 'border-[#082C6B] bg-[#082C6B]/5 ring-2 ring-[#082C6B]/20' : 'border-slate-200 hover:border-[#082C6B]/40'}`}>
                      <span className="block text-sm font-bold text-[#082C6B]">{isAr ? q.ar : q.en}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{isAr ? q.hintAr : q.hintEn}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <Note>{t('The purchase type follows the Kraljic matrix (Harvard Business Review, 1983). It sets which tactics and team size fit. Not sure? Choose the closest and continue; you can change it any time.',
                       'نوع المشتريات يتبع مصفوفة كرالييك (هارفارد بيزنس ريفيو، 1983). وهو يحدد التكتيكات وحجم الفريق المناسبين. غير متأكد؟ اختر الأقرب وتابع؛ يمكنك تغييره في أي وقت.')}</Note>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('Where do you stand?', 'أين تقف؟')}</h2>
              <p className="text-sm text-slate-500">{t('How easily could you walk away from this supplier?', 'ما مدى سهولة انسحابك من هذا المورّد؟')}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="text-xs font-semibold text-slate-600">{t('Lock-in index (0 = free to leave, 5 = trapped)', 'مؤشر التقييد (0 = حر في المغادرة، 5 = مقيَّد)')}
                  <input className={`${inputCls} mt-1`} type="number" min={0} max={5} step={0.1} value={s.lockIn} onChange={e => set('lockIn', e.target.value)} />
                  <PowerMeter value={lockInClean} isAr={isAr} /></label>
                <label className="text-xs font-semibold text-slate-600">{t('Could you survive switching supplier?', 'هل تستطيع الصمود عند تغيير المورّد؟')}
                  <select className={`${inputCls} mt-1`} value={s.survivable} onChange={e => set('survivable', e.target.value as Survive)}>
                    <option value="unknown">{t('Not sure', 'غير متأكد')}</option>
                    <option value="yes">{t('Yes', 'نعم')}</option>
                    <option value="no">{t('No', 'لا')}</option>
                  </select></label>
              </div>
              <div className={`mt-5 border rounded-xl p-4 ${tone.box}`} role="status">
                <p className="font-bold text-sm mb-1 flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${tone.dot}`} />{isAr ? tone.ar : tone.en}</p>
                <p className="text-sm leading-relaxed">{isAr ? leverage.framingAr : leverage.framingEn}</p>
                {leverage.quadrantConsistencyNote && <p className="text-xs mt-2 flex gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{isAr ? leverage.quadrantConsistencyNoteAr : leverage.quadrantConsistencyNote}</p>}
              </div>
              <Note>{t('Rule: strong if lock-in is 2 or below and you could survive a switch; weak if lock-in is 4 or above or you could not survive. The cut-offs 2 and 4 are ISC planning assumptions, not an industry standard. This reads your dependence on the supplier only, not theirs on you.',
                       'القاعدة: قوي إذا كان التقييد 2 أو أقل وتستطيع الصمود عند التغيير؛ ضعيف إذا كان 4 أو أكثر أو لا تستطيع الصمود. الحدّان 2 و4 افتراضات تخطيط من ISC وليسا معياراً صناعياً. يقيس هذا اعتمادك على المورّد فقط، لا اعتماده عليك.')}</Note>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('What is the price doing?', 'ماذا يفعل السعر؟')}</h2>
              <p className="text-sm text-slate-500">{t('Enter what you actually paid in at least three periods.', 'أدخل ما دفعته فعلاً في ثلاث فترات على الأقل.')}</p>
              <div className="mt-4 space-y-2">
                {s.points.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <label className="text-[11px] text-slate-500">{t('Period', 'الفترة')}<input className={`${inputCls} mt-1`} value={p.periodLabel} onChange={e => updPoint(i, { periodLabel: e.target.value })} /></label>
                    <label className="text-[11px] text-slate-500">{t('Unit price', 'سعر الوحدة')}<input className={`${inputCls} mt-1`} type="number" min={0} value={p.price || ''} onChange={e => updPoint(i, { price: Number(e.target.value) })} /></label>
                    <label className="text-[11px] text-slate-500">{t('Date', 'التاريخ')}<input className={`${inputCls} mt-1`} type="date" value={p.sortKey} onChange={e => updPoint(i, { sortKey: e.target.value })} /></label>
                    <button aria-label={t('Remove price point', 'حذف نقطة السعر')} onClick={() => set('points', s.points.filter((_, j) => j !== i))} className="p-2.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addPoint} className="no-print mt-3 flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2"><Plus className="w-3.5 h-3.5" />{t('Add a price point', 'إضافة نقطة سعرية')}</button>
              <div className="mt-5 border border-slate-200 rounded-xl p-4 bg-slate-50" role="status">
                <p className="font-bold text-sm">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` (${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%)`}</p>
                <Spark points={s.points} />
                {trend.hasIntermediateVolatility && <p className="text-xs text-amber-700 mt-2">{t('There was a larger swing inside the period than the start-to-end change shows.', 'حدث تذبذب داخل الفترة أكبر مما يظهره التغيير بين البداية والنهاية.')}</p>}
                {trend.flatBandPctApplied !== undefined && <p className="text-xs text-slate-500 mt-2">{t(`Counted as flat within ±${trend.flatBandPctApplied}% (`, `يُعدّ مستقراً ضمن ±${trend.flatBandPctApplied}% (`)}{trend.flatBandSource === 'quadrant-informed-default' ? t('ISC assumption set by purchase type', 'افتراض من ISC حسب نوع المشتريات') : t('general default', 'افتراض عام')})</p>}
              </div>
              <Note>{t('Based only on the prices you enter, not on market data. Check the market separately before you rely on it.', 'يعتمد فقط على الأسعار التي تدخلها وليس على بيانات السوق. تحقق من السوق بشكل منفصل قبل الاعتماد عليه.')}</Note>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('Tactics for a', 'تكتيكات لمشتريات')} {isAr ? quad.ar : quad.en}{isAr ? '' : ' purchase'}</h2>
              <h3 className="text-sm font-bold text-emerald-800 mt-4 mb-2">{t('You can use', 'يمكنك استخدامها')}</h3>
              {useTactics.length === 0 && <p className="text-sm text-slate-500">{t('No tactic in the library fits this purchase type with low ethical risk.', 'لا يوجد تكتيك في المكتبة يناسب هذا النوع بمخاطر أخلاقية منخفضة.')}</p>}
              {useTactics.map(x => (
                <details key={x.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-3 mb-2">
                  <summary className="cursor-pointer text-sm font-semibold">{isAr ? x.name.ar : x.name.en}</summary>
                  <div className="text-sm text-slate-700 space-y-1.5 mt-2">
                    <p>{isAr ? x.whatItIs.ar : x.whatItIs.en}</p>
                    <p><b>{t('How: ', 'كيف: ')}</b>{isAr ? x.how.ar : x.how.en}</p>
                    <p><b>{t('Follow up: ', 'المتابعة: ')}</b>{isAr ? x.followUp.ar : x.followUp.en}</p>
                    <p className="text-xs text-slate-500">{isAr ? x.ethicalNote.ar : x.ethicalNote.en} — {x.source}</p>
                  </div>
                </details>
              ))}
              <h3 className="text-sm font-bold text-red-800 mt-5 mb-2">{t('Watch for these from the supplier', 'احذر منها من جانب المورّد')}</h3>
              {watchTactics.map(x => (
                <details key={x.id} className="border border-red-100 bg-red-50/40 rounded-xl p-3 mb-2">
                  <summary className="cursor-pointer text-sm font-semibold">{isAr ? x.name.ar : x.name.en}</summary>
                  <div className="text-sm text-slate-700 space-y-1.5 mt-2">
                    <p>{isAr ? x.whatItIs.ar : x.whatItIs.en}</p>
                    <p><b>{t('How to respond: ', 'كيف تردّ: ')}</b>{isAr ? x.counterTactic.ar : x.counterTactic.en}</p>
                    <p className="text-xs text-slate-500">{isAr ? x.ethicalNote.ar : x.ethicalNote.en} — {x.source}</p>
                  </div>
                </details>
              ))}
              <h3 className="text-sm font-bold text-[#082C6B] mt-5 mb-2 flex items-center gap-2"><Users className="w-4 h-4" />{t('Your team and the stages', 'فريقك والمراحل')}</h3>
              <ul className="text-sm space-y-1.5 mb-3">{team.map(r => <li key={r.role.en}><b>{isAr ? r.role.ar : r.role.en}</b>: {isAr ? r.responsibility.ar : r.responsibility.en}</li>)}</ul>
              <ol className="text-sm space-y-1.5">{levels.map(l => <li key={l.level}><b>{isAr ? l.name.ar : l.name.en}</b>: {isAr ? l.purpose.ar : l.purpose.en}</li>)}</ol>
              <Note>{t('Tactics are shown so you can recognise and answer them. ISC does not recommend deceiving a supplier. Some sources are secondary and are named on each card.', 'تُعرض التكتيكات لتتعرف عليها وترد عليها. لا توصي ISC بخداع المورّد. بعض المصادر ثانوية وتُذكر على كل بطاقة.')}</Note>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('Rounds so far and the next move', 'الجولات السابقة والخطوة التالية')}</h2>
              <p className="text-sm text-slate-500">{t('Skip this if you have not met yet.', 'تجاوز هذه الخطوة إن لم تلتقِ بعد.')}</p>
              <div className="mt-4 space-y-2">
                {s.rounds.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3 grid sm:grid-cols-4 gap-2 items-end">
                    <label className="text-[11px] text-slate-500">{t('Date', 'التاريخ')}<input className={`${inputCls} mt-1`} type="date" value={r.date} onChange={e => updRound(i, { date: e.target.value })} /></label>
                    <label className="text-[11px] text-slate-500">{t('Our move', 'خطوتنا')}
                      <select className={`${inputCls} mt-1`} value={r.ourMove} onChange={e => updRound(i, { ourMove: e.target.value as OurMove })}>
                        <option value="cooperated">{t('Cooperated', 'تعاونّا')}</option><option value="defected">{t('Pushed hard', 'ضغطنا')}</option></select></label>
                    <label className="text-[11px] text-slate-500">{t('Their move', 'خطوتهم')}
                      <select className={`${inputCls} mt-1`} value={r.counterpartMove} onChange={e => updRound(i, { counterpartMove: e.target.value as CounterpartMove })}>
                        <option value="cooperated">{t('Cooperated', 'تعاونوا')}</option><option value="defected">{t('Pushed hard', 'ضغطوا')}</option><option value="unclear">{t('Unclear', 'غير واضح')}</option></select></label>
                    <button aria-label={t('Remove round', 'حذف الجولة')} onClick={() => set('rounds', s.rounds.filter((_, j) => j !== i))} className="p-2.5 text-slate-400 hover:text-red-600 justify-self-end"><Trash2 className="w-4 h-4" /></button>
                    <label className="text-[11px] text-slate-500 sm:col-span-4">{t('Why did you label it this way? (write the evidence)', 'لماذا صنّفتها هكذا؟ (اكتب الدليل)')}
                      <input className={`${inputCls} mt-1`} value={r.note} onChange={e => updRound(i, { note: e.target.value })} /></label>
                  </div>
                ))}
              </div>
              <button onClick={addRound} className="no-print mt-3 flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2"><Plus className="w-3.5 h-3.5" />{t('Log a round', 'تسجيل جولة')}</button>
              <div className="mt-5 border border-slate-200 rounded-xl p-4 bg-slate-50" role="status">
                <p className="font-bold text-sm mb-1">{next.move === 'cooperate' ? t('Next move: cooperate', 'الخطوة التالية: التعاون') : t('Next move: answer their pressure once, then return to cooperation', 'الخطوة التالية: الرد على ضغطهم مرة واحدة ثم العودة للتعاون')}</p>
                <p className="text-sm">{isAr ? next.rationaleAr : next.rationaleEn}</p>
              </div>
              <Note>{t('Rule: tit-for-tat (Axelrod, Rapoport) looking at the most recent rounds. A wrong label gives wrong advice, so write the evidence for each label. "Pushed hard" should mean something you can point to, such as a new demand or a withdrawn concession.', 'القاعدة: المثل بالمثل (أكسلرود، رابوبورت) بالنظر إلى أحدث الجولات. التصنيف الخاطئ يعطي نصيحة خاطئة، لذا اكتب الدليل لكل تصنيف. «الضغط» يجب أن يعني شيئاً يمكنك الإشارة إليه، كطلب جديد أو تراجع عن تنازل.')}</Note>
            </div>
          )}

          {step === 5 && (
            <div data-testid="brief">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div><h2 className="text-lg font-bold text-[#082C6B]">{t('Your preparation brief', 'ملخص تحضيرك')}</h2>
                  <p className="text-sm text-slate-500">{s.supplier.trim() || t('Unnamed negotiation', 'تفاوض بلا اسم')} · {isAr ? quad.ar : quad.en}</p></div>
                <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2"><Printer className="w-3.5 h-3.5" />{t('Print / save as PDF', 'طباعة / حفظ PDF')}</button>
              </div>
              <div className={`mt-4 border rounded-xl p-4 ${tone.box}`}>
                <p className="font-bold text-sm">{isAr ? tone.ar : tone.en}</p>
                <p className="text-sm mt-1">{isAr ? leverage.framingAr : leverage.framingEn}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="border-2 border-[#082C6B] rounded-xl p-4 bg-[#082C6B]/5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#082C6B]">{t('Recommended', 'الموصى به')}</p>
                  <p className="text-sm mt-1">{isAr ? approach.pAr : approach.pEn}</p>
                </div>
                <div className="border border-slate-300 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('Strong alternative', 'بديل قوي')}</p>
                  <p className="text-sm mt-1">{isAr ? approach.aAr : approach.aEn}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2"><b>{t('Trade-off: ', 'المفاضلة: ')}</b>{isAr ? approach.tAr : approach.tEn}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 mb-1">{t('Price', 'السعر')}</p>
                  <p className="text-sm font-semibold">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` (${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%)`}</p>
                  <Spark points={s.points} />
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">{t('Readiness', 'الجاهزية')} {done}/{checks.length}</p>
                  <ul className="text-sm space-y-1">{checks.map(c => (
                    <li key={c.en} className={`flex items-center gap-2 ${c.ok ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {c.ok ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300 inline-block" />}{isAr ? c.ar : c.en}</li>))}</ul>
                </div>
              </div>
              <div className="border border-red-100 bg-red-50/40 rounded-xl p-4 mt-3">
                <p className="text-xs font-bold text-red-800 mb-1">{t('Watch for', 'احذر من')}</p>
                <ul className="text-sm list-disc ps-5 space-y-0.5">{watchTactics.slice(0, 3).map(x => <li key={x.id}>{isAr ? x.name.ar : x.name.en}</li>)}</ul>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 mt-3">
                <p className="text-xs font-bold text-slate-500 mb-1">{t('Next move', 'الخطوة التالية')}</p>
                <p className="text-sm">{isAr ? next.rationaleAr : next.rationaleEn}</p>
              </div>
              <Note>{t('Internal. Not for the supplier. Not legal advice. The recommendation is ISC guidance derived from the rule on step 2, not a sourced benchmark. Saved in this browser only.', 'داخلي. ليس للمورّد. ليس استشارة قانونية. التوصية إرشاد من ISC مشتق من القاعدة في الخطوة 2، وليست معياراً موثّقاً. يُحفظ في هذا المتصفح فقط.')}</Note>
            </div>
          )}
        </div>

        {/* Step navigation */}
        <div className="no-print flex justify-between mt-4">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex items-center gap-1 text-sm font-semibold text-slate-600 border border-slate-200 bg-white rounded-xl px-4 py-2.5 disabled:opacity-40"><Back className="w-4 h-4" />{t('Back', 'السابق')}</button>
          <button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1} className="flex items-center gap-1 text-sm font-bold text-white bg-[#082C6B] rounded-xl px-5 py-2.5 disabled:opacity-40">{t('Next', 'التالي')}<Arrow className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

export default NegotiationDesk;
