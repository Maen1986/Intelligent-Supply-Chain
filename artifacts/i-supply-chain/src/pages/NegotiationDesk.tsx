// src/pages/NegotiationDesk.tsx
//
// Negotiation Desk v1 (E3 Negotiation Intelligence, built 5 Nov 2026 on the owner's instruction).
// A guided six-step preparation flow that surfaces logic which already existed and was tested but had no page:
//   supplierCommercialIntelligence.ts  -> leverage reading, price trend, tit-for-tat next move
//   negotiationTactics.ts              -> tactics to use, tactics to watch for, team, stages
// Standalone-first: manual input only. Saved in this browser (localStorage); signed-in users also get one
// server-saved case (negotiation_cases). Several named cases per user is the next E3 step.
// Nothing here is shared with the supplier. Every rule and threshold is disclosed on screen.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Handshake, Plus, Trash2, Printer, Info, ShieldAlert, Check, ChevronRight, ChevronLeft,
  Gauge, TrendingUp, Swords, Users, Repeat, FileText, Sparkles, RotateCcw, Lock,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { safeSetItem } from '@/lib/storage';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import type { KraljicQuadrant } from '@/lib/kraljicScoring';
import { deriveSeverity, type SupplierCheck } from '@/lib/supplierDependency';
import {
  assessNegotiationLeverage, assessLeverageSensitivity, DEFAULT_LEVERAGE_THRESHOLDS, computePriceTrajectory, recommendNextMove,
  type PricePoint, type NegotiationRound, type OurMove, type CounterpartMove, type LeverageLevel,
} from '@/lib/supplierCommercialIntelligence';
import {
  recommendClientTactics, recommendWatchForTactics, buildNegotiationTeam, recommendNegotiationLevels,
} from '@/lib/negotiationTactics';
import { DESK_ROUTES, STEP_IDS, getRoute, stepNeed, buildSuggestions, matchSuggestion, parsePastedPrices, type RouteId, type Suggestion } from '@/lib/deskRoutes';
import { UNSPSC_SERVICES_SEGMENTS } from '@/lib/unspscSegments';
import { CloseOutPanel, PastExperience } from '@/components/DeskLessons';
import { capCases, eraseOrArchive, isArchived, type Lesson } from '@/lib/deskLessons';

const KEY = 'isc-negotiation-desk-v1';
type Survive = 'yes' | 'no' | 'unknown';
interface DeskState {
  supplier: string;
  quadrant: KraljicQuadrant;
  lockIn: string;
  survivable: Survive;
  points: PricePoint[];
  rounds: NegotiationRound[];
  /** Optional link to a saved Supplier Dependency Check (reference only, never converted to a score). */
  linkedCheckId?: string;
  /** Optional own cut-offs for the leverage rule (strings so an empty box means "use the ISC default"). */
  cutLow?: string;
  cutHigh?: string;
  /** Optional entry route chosen on the Start-here panel (a navigation aid only; it never changes any result). */
  route?: string;
  /** Lessons (registry #809, Phase 1): the lesson recorded when this negotiation was closed. Typed by the user; private to the account. */
  lesson?: Lesson;
  /** Set when a case that has a lesson is erased: it is archived (hidden, kept) so the lesson survives. */
  archivedAt?: string;
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

function loadChecks(): SupplierCheck[] {
  try {
    const raw = localStorage.getItem('isc-supplier-dependency-v1');
    const parsed = raw ? (JSON.parse(raw) as SupplierCheck[]) : [];
    return Array.isArray(parsed) ? parsed.filter(c => c && typeof c.name === 'string' && c.name.trim() !== '') : [];
  } catch { return []; }
}

interface SavedCase { clientKey: string; name: string; data: DeskState }
const OTHERS_KEY = 'isc-negotiation-desk-others-v1';
const MAX_CASES = 20;
const MAX_ARCHIVED = 80;
const capActive = <T extends { data: { archivedAt?: string } }>(l: T[]): T[] => capCases(l, MAX_CASES - 1, MAX_ARCHIVED);
const hasContent = (st: DeskState) => st.supplier.trim() !== '' || st.points.length > 0 || st.rounds.length > 0;
function loadOthers(): SavedCase[] {
  try {
    const raw = localStorage.getItem(OTHERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedCase[]) : [];
    return Array.isArray(parsed) ? capActive(parsed.filter(c => c && typeof c.clientKey === 'string' && c.data && typeof c.data.supplier === 'string').map(c => ({ ...c, data: { ...EMPTY, ...c.data } }))) : [];
  } catch { return []; }
}
function mergeOthers(prev: SavedCase[], incoming: SavedCase[]): SavedCase[] {
  const m = new Map<string, SavedCase>();
  for (const c of prev) m.set(c.clientKey, c);
  for (const c of incoming) m.set(c.clientKey, c);
  return capActive([...m.values()]);
}
/** Suppliers already recorded in the Supplier Recovery Portfolio (this browser). Read-only. */
function loadPortfolio(): { name?: string; category?: string; quadrant?: string }[] {
  try {
    const raw = localStorage.getItem('isc-supplier-recovery-portfolio-v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(p => p && typeof p.name === 'string') : [];
  } catch { return []; }
}
const addDays = (iso: string, d: number) => { const x = new Date(`${iso}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };

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
    aAr: 'أجرِ فحصاً سريعاً للسوق عن بديل أو اثنين لتقوية موقفك قبل اللقاء.',
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
    <p className="flex gap-2 text-[11px] text-slate-600 leading-relaxed mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3">
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
      <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>0</span><span>2</span><span>4</span><span>5</span></div>
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
  const depChecks = useMemo(loadChecks, []);
  const portfolio = useMemo(loadPortfolio, []);
  const [others, setOthers] = useState<SavedCase[]>(loadOthers);
  const othersRef = useRef(others);
  othersRef.current = others;
  const firstOthers = useRef(true);
  const [confirmKind, setConfirmKind] = useState<null | 'example' | 'clear' | 'new'>(null);
  const [delKey, setDelKey] = useState<string | null>(null);
  const [prefillNote, setPrefillNote] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteMsg, setPasteMsg] = useState('');
  const [pasteReplace, setPasteReplace] = useState(false);
  // Server save (E3 N0, 5 Nov 2026): signed-in users also get one saved case in their account
  // (table negotiation_cases). Same whole-state pattern as rar_analyses / supplier_dependency_checks.
  // localStorage stays the source of truth if the server is unreachable; signed-out users are unchanged.
  const { user } = useAuth();
  const [sync, setSync] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const bootDone = useRef(false);
  const localEdited = useRef(false);
  const skipNextPush = useRef(false);
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;
  const push = (st: DeskState) => {
    if (!user) return;
    setSync('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/negotiation-cases`, {
          method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cases: [{ clientKey: 'desk-current', name: (st.supplier.trim() || 'Negotiation').slice(0, 120), data: st }, ...othersRef.current.map(c => ({ clientKey: c.clientKey, name: (c.name.trim() || 'Negotiation').slice(0, 120), data: c.data }))].slice(0, MAX_CASES) }),
        });
        setSync(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSync('idle'), 2500);
      } catch { setSync('error'); }
    }, 500);
  };
  useEffect(() => {
    safeSetItem(KEY, JSON.stringify(s));
    if (firstRun.current) { firstRun.current = false; return; }
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    if (!bootDone.current) { localEdited.current = true; return; }
    push(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  useEffect(() => {
    if (!user) { bootDone.current = false; return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/negotiation-cases`, { credentials: 'include' });
        if (!cancelled && res.ok) {
          const data = await res.json() as { ok: boolean; cases: { clientKey?: string; name?: string; data: DeskState }[] };
          if (!cancelled && data.ok && Array.isArray(data.cases)) {
            const srv = data.cases.filter(c => c.clientKey && c.clientKey !== 'desk-current' && c.data && typeof c.data.supplier === 'string');
            if (srv.length > 0) setOthers(prev => mergeOthers(prev, srv.map(c => ({ clientKey: c.clientKey as string, name: c.name ?? c.data.supplier, data: { ...EMPTY, ...c.data } }))));
          }
          const curRow = data.ok && Array.isArray(data.cases) ? data.cases.find(c => c.clientKey === 'desk-current') : undefined;
          if (curRow && !localEdited.current) {
            skipNextPush.current = true;
            setS({ ...EMPTY, ...curRow.data });
          } else if (!cancelled && !curRow) {
            const cur = stateRef.current;
            if (cur.supplier || cur.points.length || cur.rounds.length) push(cur);
          }
        }
      } catch { /* offline: localStorage keeps working */ }
      if (!cancelled) bootDone.current = true;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const set = <K extends keyof DeskState>(k: K, v: DeskState[K]) => setS(prev => ({ ...prev, [k]: v }));
  useEffect(() => {
    safeSetItem(OTHERS_KEY, JSON.stringify(others));
    if (firstOthers.current) { firstOthers.current = false; return; }
    if (bootDone.current) push(stateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others]);

  const route = getRoute(s.route);
  const stepLabel = (id: string) => { const st = STEPS.find(x => x.id === id); return st ? (isAr ? st.ar : st.en) : id; };
  const pickRoute = (id: RouteId) => {
    if (s.route === id) { set('route', undefined); return; }
    const r = getRoute(id);
    set('route', id);
    if (r) setStep(Math.max(0, STEP_IDS.indexOf(r.landing)));
  };
  const suggestions: Suggestion[] = useMemo(() => buildSuggestions({
    cases: others.map(c => ({ name: c.name || c.data.supplier, quadrant: c.data.quadrant })),
    portfolio,
    checks: depChecks,
    categories: UNSPSC_SERVICES_SEGMENTS.map(g => ({ label: isAr ? g.labelAr : g.label })),
  }), [others, portfolio, depChecks, isAr]);
  const srcLabel = (x: Suggestion) =>
    x.source === 'case' ? t('Saved case', 'حالة محفوظة')
      : x.source === 'portfolio' ? `${t('Supplier portfolio', 'محفظة الموردين')}${x.detail ? ` · ${x.detail}` : ''}`
      : x.source === 'check' ? t('Dependency Check', 'فحص الاعتماد')
      : t('UNSPSC services category', 'فئة خدمات UNSPSC');
  const activeOthers = others.filter(c => !isArchived(c));
  const matchedCase = activeOthers.find(c => (c.name || c.data.supplier).trim().toLowerCase() === s.supplier.trim().toLowerCase() && s.supplier.trim() !== '');
  const onSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const ie = e.nativeEvent as InputEvent;
    const picked = !ie.inputType || ie.inputType === 'insertReplacementText';
    const m = picked ? matchSuggestion(suggestions, v) : undefined;
    if (m && (m.source === 'portfolio' || m.source === 'check')) {
      const q = QUADRANTS.find(x => x.id === m.quadrant);
      setS(prev => ({ ...prev, supplier: v, quadrant: q ? q.id : prev.quadrant, linkedCheckId: m.checkId ?? prev.linkedCheckId }));
      setPrefillNote(q
        ? t(`Filled the purchase type (${q.en}) from your ${m.source === 'portfolio' ? 'Supplier portfolio' : 'Dependency Check'}. Change it below if it is wrong.`,
            `تم تعبئة نوع الشراء (${q.ar}) من ${m.source === 'portfolio' ? 'محفظة الموردين' : 'فحص الاعتماد'}. غيّره أدناه إن كان خاطئا.`)
        : t('Linked to your saved check. Nothing else was changed.', 'تم الربط بفحصك المحفوظ. لم يتغير شيء آخر.'));
    } else {
      set('supplier', v);
      setPrefillNote('');
    }
  };
  const archiveCurrent = (list: SavedCase[]): SavedCase[] =>
    hasContent(s) ? [{ clientKey: `case-${Date.now()}`, name: s.supplier.trim() || 'Negotiation', data: s }, ...list] : list;
  const newCase = () => {
    setOthers(capActive(archiveCurrent(othersRef.current)));
    setS(EMPTY); setStep(0); setConfirmKind(null); setPrefillNote('');
  };
  const openCase = (key: string) => {
    const target = othersRef.current.find(c => c.clientKey === key);
    if (!target) return;
    const rest = othersRef.current.filter(c => c.clientKey !== key);
    setOthers(capActive(archiveCurrent(rest)));
    setS({ ...EMPTY, ...target.data, archivedAt: undefined }); setStep(0); setPrefillNote('');
  };
  const deleteCase = (key: string) => { setOthers(eraseOrArchive(othersRef.current, key, new Date().toISOString())); setDelKey(null); };
  const applyPaste = () => {
    const probe = parsePastedPrices(pasteText, new Date().toISOString().slice(0, 10));
    if (probe.points.length === 0) { setPasteMsg(t('No prices found. Put one price per line, for example "Q1 100".', 'لم يتم العثور على أسعار. ضع سعرا واحدا في كل سطر مثل "Q1 100".')); return; }
    const today = new Date().toISOString().slice(0, 10);
    const latest = !pasteReplace && s.points.length > 0 ? [...s.points].map(p => p.sortKey).sort().slice(-1)[0] : '';
    const base = latest ? addDays(latest, 30) : addDays(today, -30 * (probe.points.length - 1));
    const r = parsePastedPrices(pasteText, base);
    setS(prev => ({ ...prev, points: pasteReplace ? r.points : [...prev.points, ...r.points] }));
    setPasteText('');
    setPasteMsg(t(`Added ${r.points.length} price(s)${r.skipped ? `, skipped ${r.skipped} line(s) with no usable price` : ''}. Rows without a date were given dates 30 days apart in the order pasted; edit the dates if they are wrong.`,
      `تمت إضافة ${r.points.length} سعر${r.skipped ? `، وتم تخطي ${r.skipped} سطر بلا سعر صالح` : ''}. الصفوف بلا تاريخ أُعطيت تواريخ بفارق 30 يوما بترتيب اللصق؛ عدّل التواريخ إن كانت خاطئة.`));
  };

  const lockInNum = s.lockIn.trim() === '' ? null : Number(s.lockIn);
  const lockInClean = lockInNum !== null && Number.isFinite(lockInNum) ? Math.min(5, Math.max(0, lockInNum)) : null;
  const cutNum = (v: string | undefined) => (v === undefined || v.trim() === '' ? undefined : Number(v));
  const cutLowNum = cutNum(s.cutLow);
  const cutHighNum = cutNum(s.cutHigh);
  const leverageIn = { lockInIndex: lockInClean, isSurvivable: s.survivable === 'unknown' ? null : s.survivable === 'yes' };
  const leverageOpts = { thresholds: { low: cutLowNum, high: cutHighNum } };
  const leverage = useMemo(
    () => assessNegotiationLeverage(leverageIn, s.quadrant, leverageOpts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lockInClean, s.survivable, s.quadrant, cutLowNum, cutHighNum],
  );
  const sensitivity = useMemo(
    () => assessLeverageSensitivity(leverageIn, s.quadrant, leverageOpts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lockInClean, s.survivable, s.quadrant, cutLowNum, cutHighNum],
  );
  const cutsOverridden = leverage.thresholdSource === 'caller-override';
  const cutsTyped = (s.cutLow ?? '').trim() !== '' || (s.cutHigh ?? '').trim() !== '';
  const trend = useMemo(() => computePriceTrajectory(s.points, { quadrant: s.quadrant, basis: 'observed' }), [s.points, s.quadrant]);
  const next = useMemo(() => recommendNextMove(s.rounds), [s.rounds]);
  const useTactics = recommendClientTactics(s.quadrant);
  const watchTactics = recommendWatchForTactics(s.quadrant);
  const team = buildNegotiationTeam(s.quadrant);
  const levels = recommendNegotiationLevels(s.quadrant);
  const tone = LEVEL_TONE[leverage.level];
  const approach = APPROACH[leverage.level];
  const quad = QUADRANTS.find(q => q.id === s.quadrant)!;
  const linked = depChecks.find(c => c.id === s.linkedCheckId);
  const linkedSeverity = linked ? deriveSeverity(linked, isAr) : null;
  const shownName = isAr && s.supplier === EXAMPLE.supplier ? 'شركة تغليف نموذجية (توضيحي)' : s.supplier;

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
            <span className="px-3 py-1 rounded-full border border-white/20 bg-white/5" role="status">
              {!user ? t('Saved in this browser. Sign in to keep it across devices.', 'محفوظ في هذا المتصفح. سجّل الدخول للاحتفاظ به عبر الأجهزة.')
                : sync === 'saving' ? t('Saving to your account...', 'جارٍ الحفظ في حسابك...')
                : sync === 'error' ? t('Could not reach the server. Saved in this browser.', 'تعذّر الوصول إلى الخادم. تم الحفظ في هذا المتصفح.')
                : t('Saved to your account', 'محفوظ في حسابك')}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-5 pb-12">
        {/* At-a-glance bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sticky top-2 z-10" aria-label={t('Your negotiation at a glance', 'تفاوضك في لمحة')}>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-600">{t('Position', 'الموقف')}</p>
            <p className="text-sm font-bold flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${tone.dot}`} />{isAr ? tone.ar : tone.en}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-600">{t('Price', 'السعر')}</p>
            <p className="text-sm font-bold">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%`}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-600">{t('Ready', 'الجاهزية')}</p>
            <p className="text-sm font-bold">{done}/{checks.length}</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-slate-600">{t('Next move', 'الخطوة التالية')}</p>
            <p className="text-sm font-bold">{next.move === 'cooperate' ? t('Cooperate', 'تعاون') : t('Match, then reset', 'مجاراة ثم عودة')}</p></div>
        </div>

        {/* Start here: flexible entry routes + saved cases */}
        <section className="no-print bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mt-4" aria-label={t('Start here', 'ابدأ من هنا')}>
          <h2 className="text-sm font-bold text-[#082C6B]">{t('Start where you are', 'ابدأ من وضعك الحالي')}</h2>
          <p className="text-[11px] text-slate-600 mt-0.5">{t('Pick the situation closest to yours, or ignore this and use the steps below. Every step stays open, so you can jump anywhere.', 'اختر الحالة الأقرب لوضعك، أو تجاهل هذا واستخدم الخطوات أدناه. كل الخطوات تبقى مفتوحة ويمكنك الانتقال لأي منها.')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {DESK_ROUTES.map(r => (
              <button key={r.id} type="button" onClick={() => pickRoute(r.id)} aria-pressed={s.route === r.id}
                className={`text-xs font-bold rounded-full border px-3 py-2 transition ${s.route === r.id ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-[#082C6B] border-[#082C6B]/30 hover:bg-slate-50'}`}>
                {isAr ? r.ar : r.en}
              </button>
            ))}
          </div>
          {route && (
            <p className="text-[11px] text-slate-700 mt-2 leading-relaxed" role="status">
              {isAr ? route.whenAr : route.whenEn}{' '}
              <span className="font-semibold">{t('Steps for this route: ', 'خطوات هذا المسار: ')}{route.needs.map(stepLabel).join(isAr ? '، ' : ', ')}.</span>{' '}
              {t('The others are optional; open them any time for more depth.', 'الباقي اختياري؛ افتحه في أي وقت لمزيد من العمق.')}
            </p>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold text-slate-600">{t('Your negotiations', 'مفاوضاتك')} ({activeOthers.length + 1}/{MAX_CASES})</p>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <span className="text-xs font-bold rounded-lg border border-[#082C6B] bg-[#082C6B]/5 text-[#082C6B] px-3 py-1.5" aria-current="true">{shownName.trim() || t('Untitled (open now)', 'بلا عنوان (مفتوحة الآن)')}</span>
              {activeOthers.map(c => (
                <span key={c.clientKey} className="inline-flex items-center gap-1 text-xs rounded-lg border border-slate-200 bg-white px-2 py-1">
                  {delKey === c.clientKey ? (
                    <>
                      <span className="text-red-700 font-semibold">{c.data.lesson ? t('Archive this case? Its lesson is kept.', 'أرشفة هذه الحالة؟ يبقى درسها محفوظا.') : t('Erase this case?', 'حذف هذه الحالة؟')}</span>
                      <button type="button" onClick={() => deleteCase(c.clientKey)} className="font-bold text-red-700 underline px-1">{c.data.lesson ? t('Yes, archive this case', 'نعم، أرشف هذه الحالة') : t('Yes, erase this case', 'نعم، احذف هذه الحالة')}</button>
                      <button type="button" onClick={() => setDelKey(null)} className="font-semibold text-slate-600 underline px-1">{t('Keep', 'إبقاء')}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openCase(c.clientKey)} className="font-semibold text-[#082C6B] hover:underline px-1" aria-label={`${t('Open saved case', 'فتح حالة محفوظة')}: ${c.name || c.data.supplier}`}>{c.name || c.data.supplier || t('Untitled', 'بلا عنوان')}</button>
                      <button type="button" onClick={() => setDelKey(c.clientKey)} className="text-slate-500 hover:text-red-600 px-1" aria-label={`${t('Delete saved case', 'حذف حالة محفوظة')}: ${c.name || c.data.supplier}`}><Trash2 className="w-3 h-3" /></button>
                    </>
                  )}
                </span>
              ))}
              <button type="button" disabled={activeOthers.length >= MAX_CASES - 1} onClick={() => (hasContent(s) ? newCase() : undefined)}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-1.5 disabled:opacity-40"><Plus className="w-3 h-3" />{t('New negotiation', 'مفاوضة جديدة')}</button>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">{t('Starting a new one keeps the current case in this list. Saved in this browser; signed-in users also keep them in their account.', 'بدء مفاوضة جديدة يُبقي الحالية في هذه القائمة. تُحفظ في هذا المتصفح، والمستخدم المسجل يحفظها أيضا في حسابه.')}</p>
          </div>
        </section>

        {/* Stepper */}
        <nav aria-label={t('Steps', 'الخطوات')} className="no-print grid grid-cols-3 sm:grid-cols-6 gap-1 mt-5">
          {STEPS.map((st, i) => {
            const Icon = st.icon;
            const active = i === step;
            return (
              <button key={st.id} onClick={() => setStep(i)} aria-current={active ? 'step' : undefined}
                className={`min-w-0 flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold border transition ${active ? 'bg-[#082C6B] text-white border-[#082C6B] shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-[#082C6B]/40'}`}>
                <Icon className="w-4 h-4" /> {i + 1}. {isAr ? st.ar : st.en}{s.route && stepNeed(s.route, st.id) === 'optional' && <span aria-hidden="true" title={t('Optional for this route', 'اختياري لهذا المسار')} className="text-[9px] font-normal opacity-70">{t('optional', 'اختياري')}</span>}
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
                  <p className="text-sm text-slate-600">{t('Two answers shape everything that follows.', 'إجابتان تحددان كل ما يلي.')}</p></div>
                <div className="no-print flex gap-2">
                  <button onClick={() => { if (hasContent(s) && s.supplier !== EXAMPLE.supplier) setConfirmKind('example'); else setS(EXAMPLE); }} className="flex items-center gap-1.5 text-xs font-bold text-[#082C6B] border border-[#082C6B]/30 rounded-lg px-3 py-2 hover:bg-slate-50"><Sparkles className="w-3.5 h-3.5" />{t('Try an example', 'جرّب مثالاً')}</button>
                  <button onClick={() => { if (hasContent(s)) setConfirmKind('clear'); else { setS(EMPTY); setStep(0); } }} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" />{t('Clear', 'مسح')}</button>
                </div>
              </div>
              {confirmKind && confirmKind !== 'new' && (
                <div role="alertdialog" aria-label={t('Confirm', 'تأكيد')} className="no-print mt-3 border border-amber-300 bg-amber-50 text-amber-900 rounded-xl p-3 text-xs">
                  <p className="font-semibold">{confirmKind === 'example'
                    ? t('This replaces the case on screen with an illustrative example. Your current case can be kept in your list first.', 'هذا يستبدل الحالة المعروضة بمثال توضيحي. يمكن حفظ حالتك الحالية في قائمتك أولا.')
                    : t('This erases the case on screen. Your current case can be kept in your list first.', 'هذا يمسح الحالة المعروضة. يمكن حفظ حالتك الحالية في قائمتك أولا.')}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button type="button" onClick={() => { setOthers(capActive(archiveCurrent(othersRef.current))); if (confirmKind === 'example') setS(EXAMPLE); else { setS(EMPTY); setStep(0); } setConfirmKind(null); }} className="font-bold bg-[#082C6B] text-white rounded-lg px-3 py-1.5">{t('Keep mine in my list, then continue', 'احتفظ بحالتي في قائمتي ثم تابع')}</button>
                    <button type="button" onClick={() => { if (confirmKind === 'example') setS(EXAMPLE); else { setS(EMPTY); setStep(0); } setConfirmKind(null); }} className="font-bold border border-amber-400 rounded-lg px-3 py-1.5">{t('Replace without keeping', 'استبدل دون حفظ')}</button>
                    <button type="button" onClick={() => setConfirmKind(null)} className="font-semibold underline px-2">{t('Cancel', 'إلغاء')}</button>
                  </div>
                </div>
              )}
              <label className="block text-xs font-semibold text-slate-600 mt-5">{t('Supplier or category', 'المورّد أو الفئة')}
                <input className={`${inputCls} mt-1`} list="desk-suggest" autoComplete="off" value={s.supplier} onChange={onSupplierChange} placeholder={t('e.g. Packaging supplier', 'مثال: مورّد التغليف')} /></label>
              <datalist id="desk-suggest">{suggestions.map(x => <option key={`${x.source}-${x.name}`} value={x.name} label={srcLabel(x)} />)}</datalist>
              <p className="text-[11px] text-slate-600 mt-1">{t('Why we ask: the name labels the case, links your saved checks and appears on the brief. Type anything, or pick from the list (saved cases, your supplier portfolio, Dependency Checks, UNSPSC service categories).', 'لماذا نسأل: الاسم يميّز الحالة ويربطها بفحوصاتك المحفوظة ويظهر في الملخص. اكتب أي اسم أو اختر من القائمة (الحالات المحفوظة، محفظة الموردين، فحوص الاعتماد، فئات خدمات UNSPSC).')}</p>
              {prefillNote && <p role="status" className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-2">{prefillNote}</p>}
              {matchedCase && <p className="text-[11px] text-slate-700 mt-2">{t('You already have a saved case with this name. ', 'لديك حالة محفوظة بهذا الاسم. ')}<button type="button" onClick={() => openCase(matchedCase.clientKey)} className="font-bold text-[#082C6B] underline">{t('Open it', 'افتحها')}</button></p>}
              <PastExperience supplier={s.supplier} quadrant={s.quadrant} others={others} isAr={isAr} />
              {depChecks.length > 0 ? (
                <label className="block text-xs font-semibold text-slate-600 mt-4">{t('Or pick a supplier from your Dependency Check', 'أو اختر مورّداً من فحص الاعتماد لديك')}
                  <select className={`${inputCls} mt-1`} value={s.linkedCheckId ?? ''}
                    onChange={e => { const c = depChecks.find(x => x.id === e.target.value); setS(prev => ({ ...prev, linkedCheckId: c ? c.id : undefined, supplier: c ? c.name : prev.supplier })); }}>
                    <option value="">{t('Not linked', 'غير مرتبط')}</option>
                    {depChecks.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></label>
              ) : (
                <p className="text-[11px] text-slate-600 mt-3">{t('No saved Dependency Checks in this browser yet. ', 'لا توجد فحوصات اعتماد محفوظة في هذا المتصفح بعد. ')}<a className="underline text-[#082C6B] font-semibold" href="/supplier-dependency">{t('Run one', 'أجرِ فحصاً')}</a>{t(' to link it here.', ' لربطه هنا.')}</p>
              )}
              <fieldset className="mt-5">
                <legend className="text-xs font-semibold text-slate-600 mb-2">{t('What kind of purchase is it?', 'ما نوع هذه المشتريات؟')}</legend>
                <p className="text-[11px] text-slate-600 -mt-1 mb-2">{t('Why we ask: the purchase type sets which tactics fit and how the leverage rule reads your answers on the next step.', 'لماذا نسأل: نوع الشراء يحدد التكتيكات المناسبة وكيف تقرأ قاعدة النفوذ إجاباتك في الخطوة التالية.')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUADRANTS.map(q => (
                    <button key={q.id} type="button" onClick={() => set('quadrant', q.id)} aria-pressed={s.quadrant === q.id}
                      className={`text-start rounded-xl border p-3 transition ${s.quadrant === q.id ? 'border-[#082C6B] bg-[#082C6B]/5 ring-2 ring-[#082C6B]/20' : 'border-slate-200 hover:border-[#082C6B]/40'}`}>
                      <span className="block text-sm font-bold text-[#082C6B]">{isAr ? q.ar : q.en}</span>
                      <span className="block text-[11px] text-slate-600 mt-0.5">{isAr ? q.hintAr : q.hintEn}</span>
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
              <p className="text-sm text-slate-600">{t('How easily could you walk away from this supplier?', 'ما مدى سهولة انسحابك من هذا المورّد؟')}</p>
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
              {linked && linkedSeverity && (
                <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50 text-sm" role="note">
                  <p className="font-bold text-xs text-slate-600 mb-1">{t('From your Supplier Dependency Check', 'من فحص اعتماد المورّد لديك')}: {linked.name}</p>
                  <p><b>{linkedSeverity.level}</b> — {isAr ? linkedSeverity.reasonAr : linkedSeverity.reasonEn}</p>
                  <p className="text-[11px] text-slate-600 mt-2">{t('This is a different scale from the 0-5 lock-in index. ISC does not convert one into the other; use it as a guide when you answer the two questions above.', 'هذا مقياس مختلف عن مؤشر التقييد من 0 إلى 5. لا تحوّل ISC أحدهما إلى الآخر؛ استخدمه كدليل عند الإجابة عن السؤالين أعلاه.')}</p>
                </div>
              )}
              <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-white" data-testid="leverage-rule">
                <p className="font-bold text-sm text-[#082C6B] flex items-center gap-2"><Info className="w-4 h-4" />{t('How this reading is built', 'كيف تُبنى هذه القراءة')}</p>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">{t('Rule: strong if lock-in is at or below the strong cut-off and you could survive a switch; weak if lock-in is at or above the weak cut-off or you could not survive; otherwise moderate. This reads your dependence on the supplier only, not theirs on you.',
                       'القاعدة: قوي إذا كان التقييد يساوي حدّ القوي أو أقل وتستطيع الصمود عند التغيير؛ ضعيف إذا كان يساوي حدّ الضعيف أو أكثر أو لا تستطيع الصمود؛ وإلا فمتوسط. يقيس هذا اعتمادك على المورّد فقط، لا اعتماده عليك.')}</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <label className="text-xs font-semibold text-slate-600">{t('Strong if lock-in is at or below', 'قوي إذا كان التقييد يساوي أو أقل من')}
                    <input className={`${inputCls} mt-1`} type="number" min={0} max={5} step={0.1} placeholder={String(DEFAULT_LEVERAGE_THRESHOLDS.low)} value={s.cutLow ?? ''} onChange={e => set('cutLow', e.target.value)} /></label>
                  <label className="text-xs font-semibold text-slate-600">{t('Weak if lock-in is at or above', 'ضعيف إذا كان التقييد يساوي أو أكثر من')}
                    <input className={`${inputCls} mt-1`} type="number" min={0} max={5} step={0.1} placeholder={String(DEFAULT_LEVERAGE_THRESHOLDS.high)} value={s.cutHigh ?? ''} onChange={e => set('cutHigh', e.target.value)} /></label>
                </div>
                <p className="text-xs text-slate-700 mt-2" data-testid="cutoffs-used">
                  {isAr
                    ? `الحدّان المستخدمان: قوي ≤ ${leverage.thresholds.low}، ضعيف ≥ ${leverage.thresholds.high} (${cutsOverridden ? 'إعدادك' : 'افتراضي ISC'})`
                    : `Cut-offs used: strong ≤ ${leverage.thresholds.low}, weak ≥ ${leverage.thresholds.high} (${cutsOverridden ? 'your setting' : 'ISC default'})`}
                  {cutsTyped && (
                    <button type="button" onClick={() => setS(prev => ({ ...prev, cutLow: '', cutHigh: '' }))} className="no-print ms-2 underline text-[#082C6B] font-semibold">{t('Reset to ISC defaults (2 and 4)', 'إعادة الحدّين الافتراضيين (2 و4)')}</button>
                  )}
                </p>
                {leverage.thresholdOverrideRejected && (
                  <p className="text-xs text-amber-700 mt-1" role="alert">{t('Your cut-offs are not valid (strong must be below weak, both between 0 and 5), so the ISC defaults are used.',
                    'الحدّان اللذان أدخلتهما غير صالحين (يجب أن يكون حدّ القوي أقل من حدّ الضعيف، وكلاهما بين 0 و5)، لذلك استُخدم الحدّان الافتراضيان.')}</p>
                )}
                {leverage.level !== 'INSUFFICIENT_DATA' && (
                  <p className="text-xs text-slate-600 mt-1" data-testid="leverage-sensitivity">
                    {sensitivity.changes
                      ? (isAr
                        ? `لو كان الحدّان أكثر تحفظاً بمقدار ${sensitivity.step} لكانت القراءة «${LEVEL_TONE[sensitivity.moreCautious].ar}»؛ ولو كانا أقل تحفظاً بمقدار ${sensitivity.step} لكانت «${LEVEL_TONE[sensitivity.lessCautious].ar}».`
                        : `If the cut-offs were ${sensitivity.step} more cautious the reading would be "${LEVEL_TONE[sensitivity.moreCautious].en}"; ${sensitivity.step} less cautious, "${LEVEL_TONE[sensitivity.lessCautious].en}".`)
                      : t(`The reading does not change if the cut-offs move by ${sensitivity.step} either way.`, `لا تتغير القراءة إذا تحرك الحدّان بمقدار ${sensitivity.step} في أي اتجاه.`)}
                  </p>
                )}
                <p className="text-[11px] text-slate-600 leading-relaxed mt-3">{t('Sources for the idea that leverage follows each side\'s alternatives and dependence: ', 'مصادر فكرة أن القوة التفاوضية تتبع بدائل كل طرف واعتماده على الآخر: ')}<span dir="ltr">Fisher & Ury, Getting to Yes (1981), on the best alternative to a negotiated agreement (BATNA); Emerson, Power-Dependence Relations, American Sociological Review 27(1), 1962: dependence rests on how much one side values what the other provides and on how many alternatives it has; Caniëls & Gelderman, Industrial Marketing Management 36(2), 2007, who measured power and interdependence for each Kraljic quadrant in a survey of Dutch purchasing professionals. See also Cox, Journal of Supply Chain Management 37(2), 2001 (title only, not re-read).</span></p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{t('None of these sets numeric cut-offs on ISC\'s 0-5 lock-in index. The default cut-offs 2 and 4 are ISC\'s own calibration on its own scale, not an industry standard. Change them if your policy differs; the brief shows which cut-offs were used.',
                       'لا يحدد أي من هذه المصادر حدوداً رقمية على مؤشر التقييد من 0 إلى 5 لدى ISC. الحدّان الافتراضيان 2 و4 معايرة من ISC على مقياسها الخاص وليسا معياراً صناعياً. غيّرهما إذا كانت سياستك مختلفة؛ وسيُظهر الملخص الحدّين المستخدمين.')}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('What is the price doing?', 'ماذا يفعل السعر؟')}</h2>
              <p className="text-sm text-slate-600">{t('Enter what you actually paid in at least three periods.', 'أدخل ما دفعته فعلاً في ثلاث فترات على الأقل.')}</p>
              <div className="mt-4 space-y-2">
                {s.points.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <label className="text-[11px] text-slate-600">{t('Period', 'الفترة')}<input className={`${inputCls} mt-1`} value={p.periodLabel} onChange={e => updPoint(i, { periodLabel: e.target.value })} /></label>
                    <label className="text-[11px] text-slate-600">{t('Unit price', 'سعر الوحدة')}<input className={`${inputCls} mt-1`} type="number" min={0} value={p.price || ''} onChange={e => updPoint(i, { price: Number(e.target.value) })} /></label>
                    <label className="text-[11px] text-slate-600">{t('Date', 'التاريخ')}<input className={`${inputCls} mt-1`} type="date" value={p.sortKey} onChange={e => updPoint(i, { sortKey: e.target.value })} /></label>
                    <button aria-label={t('Remove price point', 'حذف نقطة السعر')} onClick={() => set('points', s.points.filter((_, j) => j !== i))} className="p-2.5 text-slate-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addPoint} className="no-print mt-3 flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2"><Plus className="w-3.5 h-3.5" />{t('Add a price point', 'إضافة نقطة سعرية')}</button>
              <details className="no-print mt-3 border border-slate-200 rounded-xl p-3 bg-white">
                <summary className="text-xs font-bold text-[#082C6B] cursor-pointer">{t('Paste prices from a spreadsheet or email', 'الصق الأسعار من جدول أو بريد')}</summary>
                <p className="text-[11px] text-slate-600 mt-2">{t('One price per line, for example "Q1 100" or "2026-03-01 98". Numbers with thousands commas are fine.', 'سعر واحد في كل سطر مثل "Q1 100" أو "2026-03-01 98". الأرقام بفواصل الآلاف مقبولة.')}</p>
                <textarea className={`${inputCls} mt-2`} rows={4} value={pasteText} onChange={e => setPasteText(e.target.value)} aria-label={t('Paste prices', 'الصق الأسعار')} />
                <label className="flex items-center gap-2 text-[11px] text-slate-700 mt-2"><input type="checkbox" checked={pasteReplace} onChange={e => setPasteReplace(e.target.checked)} />{t('Replace the prices already entered (otherwise these are added to them)', 'استبدل الأسعار المدخلة سابقا (وإلا تُضاف هذه إليها)')}</label>
                <button type="button" onClick={applyPaste} className="mt-2 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2">{t('Add these prices', 'أضف هذه الأسعار')}</button>
                {pasteMsg && <p role="status" className="text-[11px] text-slate-700 mt-2">{pasteMsg}</p>}
              </details>
              <div className="mt-5 border border-slate-200 rounded-xl p-4 bg-slate-50" role="status">
                <p className="font-bold text-sm">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` (${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%)`}</p>
                <Spark points={s.points} />
                {trend.hasIntermediateVolatility && <p className="text-xs text-amber-700 mt-2">{t('There was a larger swing inside the period than the start-to-end change shows.', 'حدث تذبذب داخل الفترة أكبر مما يظهره التغيير بين البداية والنهاية.')}</p>}
                {trend.flatBandPctApplied !== undefined && <p className="text-xs text-slate-600 mt-2">{t(`Counted as flat within ±${trend.flatBandPctApplied}% (`, `يُعدّ مستقراً ضمن ±${trend.flatBandPctApplied}% (`)}{trend.flatBandSource === 'quadrant-informed-default' ? t('ISC assumption set by purchase type', 'افتراض من ISC حسب نوع المشتريات') : t('general default', 'افتراض عام')})</p>}
              </div>
              <Note>{t('Based only on the prices you enter, not on market data. Check the market separately before you rely on it.', 'يعتمد فقط على الأسعار التي تدخلها وليس على بيانات السوق. تحقق من السوق بشكل منفصل قبل الاعتماد عليه.')}</Note>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-[#082C6B]">{t('Tactics for a', 'تكتيكات لمشتريات')} {isAr ? quad.ar : quad.en}{isAr ? '' : ' purchase'}</h2>
              <h3 className="text-sm font-bold text-emerald-800 mt-4 mb-2">{t('You can use', 'يمكنك استخدامها')}</h3>
              {useTactics.length === 0 && <p className="text-sm text-slate-600">{t('No tactic in the library fits this purchase type with low ethical risk.', 'لا يوجد تكتيك في المكتبة يناسب هذا النوع بمخاطر أخلاقية منخفضة.')}</p>}
              {useTactics.map(x => (
                <details key={x.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-3 mb-2">
                  <summary className="cursor-pointer text-sm font-semibold">{isAr ? x.name.ar : x.name.en}</summary>
                  <div className="text-sm text-slate-700 space-y-1.5 mt-2">
                    <p>{isAr ? x.whatItIs.ar : x.whatItIs.en}</p>
                    <p><b>{t('How: ', 'كيف: ')}</b>{isAr ? x.how.ar : x.how.en}</p>
                    <p><b>{t('Follow up: ', 'المتابعة: ')}</b>{isAr ? x.followUp.ar : x.followUp.en}</p>
                    <p className="text-xs text-slate-600">{isAr ? x.ethicalNote.ar : x.ethicalNote.en} — {x.source}</p>
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
                    <p className="text-xs text-slate-600">{isAr ? x.ethicalNote.ar : x.ethicalNote.en} — {x.source}</p>
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
              <p className="text-sm text-slate-600">{t('Skip this if you have not met yet.', 'تجاوز هذه الخطوة إن لم تلتقِ بعد.')}</p>
              <div className="mt-4 space-y-2">
                {s.rounds.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3 grid sm:grid-cols-4 gap-2 items-end">
                    <label className="text-[11px] text-slate-600">{t('Date', 'التاريخ')}<input className={`${inputCls} mt-1`} type="date" value={r.date} onChange={e => updRound(i, { date: e.target.value })} /></label>
                    <label className="text-[11px] text-slate-600">{t('Our move', 'خطوتنا')}
                      <select className={`${inputCls} mt-1`} value={r.ourMove} onChange={e => updRound(i, { ourMove: e.target.value as OurMove })}>
                        <option value="cooperated">{t('Cooperated', 'تعاونّا')}</option><option value="defected">{t('Pushed hard', 'ضغطنا')}</option></select></label>
                    <label className="text-[11px] text-slate-600">{t('Their move', 'خطوتهم')}
                      <select className={`${inputCls} mt-1`} value={r.counterpartMove} onChange={e => updRound(i, { counterpartMove: e.target.value as CounterpartMove })}>
                        <option value="cooperated">{t('Cooperated', 'تعاونوا')}</option><option value="defected">{t('Pushed hard', 'ضغطوا')}</option><option value="unclear">{t('Unclear', 'غير واضح')}</option></select></label>
                    <button aria-label={t('Remove round', 'حذف الجولة')} onClick={() => set('rounds', s.rounds.filter((_, j) => j !== i))} className="p-2.5 text-slate-600 hover:text-red-600 justify-self-end"><Trash2 className="w-4 h-4" /></button>
                    <label className="text-[11px] text-slate-600 sm:col-span-4">{t('Why did you label it this way? (write the evidence)', 'لماذا صنّفتها هكذا؟ (اكتب الدليل)')}
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
                  <p className="text-sm text-slate-600">{shownName.trim() || t('Unnamed negotiation', 'تفاوض بلا اسم')} · {isAr ? quad.ar : quad.en}</p></div>
                <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2"><Printer className="w-3.5 h-3.5" />{t('Print / save as PDF', 'طباعة / حفظ PDF')}</button>
              </div>
              <div className={`mt-4 border rounded-xl p-4 ${tone.box}`}>
                <p className="font-bold text-sm">{isAr ? tone.ar : tone.en}</p>
                <p className="text-sm mt-1">{isAr ? leverage.framingAr : leverage.framingEn}</p>
                <p className="text-[11px] mt-2 opacity-80" data-testid="brief-cutoffs">{isAr ? `قاعدة القراءة: قوي إذا كان التقييد ≤ ${leverage.thresholds.low} مع القدرة على الصمود؛ ضعيف إذا كان ≥ ${leverage.thresholds.high} أو بلا قدرة على الصمود (${cutsOverridden ? 'حدّان من إعدادك' : 'حدّان افتراضيان من ISC'}). الأساس: ⁦BATNA (Fisher & Ury, 1981)⁩ واعتماد القوة ⁦(Emerson, 1962)⁩.` : `Reading rule: strong if lock-in ≤ ${leverage.thresholds.low} and you could survive a switch; weak if ≥ ${leverage.thresholds.high} or you could not (${cutsOverridden ? 'your cut-offs' : 'ISC default cut-offs'}). Basis: BATNA (Fisher & Ury, 1981) and power-dependence (Emerson, 1962).`}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="border-2 border-[#082C6B] rounded-xl p-4 bg-[#082C6B]/5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#082C6B]">{t('Recommended', 'الموصى به')}</p>
                  <p className="text-sm mt-1">{isAr ? approach.pAr : approach.pEn}</p>
                </div>
                <div className="border border-slate-300 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{t('Strong alternative', 'بديل قوي')}</p>
                  <p className="text-sm mt-1">{isAr ? approach.aAr : approach.aEn}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2"><b>{t('Trade-off: ', 'المفاضلة: ')}</b>{isAr ? approach.tAr : approach.tEn}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-1">{t('Price', 'السعر')}</p>
                  <p className="text-sm font-semibold">{isAr ? DIR[trend.direction].ar : DIR[trend.direction].en}{trend.percentChange !== null && ` (${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%)`}</p>
                  <Spark points={s.points} />
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-2">{t('Readiness', 'الجاهزية')} {done}/{checks.length}</p>
                  <ul className="text-sm space-y-1">{checks.map(c => (
                    <li key={c.en} className={`flex items-center gap-2 ${c.ok ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {c.ok ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300 inline-block" />}{isAr ? c.ar : c.en}</li>))}</ul>
                </div>
              </div>
              <div className="border border-red-100 bg-red-50/40 rounded-xl p-4 mt-3">
                <p className="text-xs font-bold text-red-800 mb-1">{t('Watch for', 'احذر من')}</p>
                <ul className="text-sm list-disc ps-5 space-y-0.5">{watchTactics.slice(0, 3).map(x => <li key={x.id}>{isAr ? x.name.ar : x.name.en}</li>)}</ul>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 mt-3">
                <p className="text-xs font-bold text-slate-600 mb-1">{t('Next move', 'الخطوة التالية')}</p>
                <p className="text-sm">{isAr ? next.rationaleAr : next.rationaleEn}</p>
              </div>
              <CloseOutPanel key={`${s.supplier}|${s.lesson?.closedAt ?? 'new'}`} lesson={s.lesson} lastPrice={s.points.length ? String([...s.points].sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(-1)[0].price) : ''} isAr={isAr} onSave={l => set('lesson', l)} />
              <Note>{t('Internal. Not for the supplier. Not legal advice. The recommendation is ISC guidance derived from the rule on step 2, not a sourced benchmark. Saved in this browser, and in your account when you are signed in (one saved case).', 'داخلي. ليس للمورّد. ليس استشارة قانونية. التوصية إرشاد من ISC مشتق من القاعدة في الخطوة 2، وليست معياراً موثّقاً. يُحفظ في هذا المتصفح، وفي حسابك عند تسجيل الدخول (حالة محفوظة واحدة).')}</Note>
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
