/**
 * Scoped Command Bar (#180, Wave B-6, 24 Aug 2026, Decision Record 8.10)
 *
 * "Search/ask bar limited to a client's own existing ISC data" -- the
 * backlog item's own three literal examples are "find my last diagnosis,"
 * "show my open actions," "compare my Q1 vs Q2 scores." Decision Record
 * 8.10 (verify against real code before scoping) confirmed, by reading the
 * actual files, that:
 *
 *   1. src/components/ui/command.tsx (Command/CommandDialog/CommandInput/
 *      CommandList/CommandEmpty/CommandGroup/CommandItem, a standard
 *      shadcn cmdk wrapper) existed already but had ZERO importers anywhere
 *      in src -- this is its first real use.
 *   2. There is no natural-language intent parser anywhere in this
 *      codebase. Building one would be real AI/NLU scope creep beyond what
 *      #180 asked for. This is a v1 FIXED keyword/pattern router --
 *      matchIntent() below -- covering exactly the three example intents
 *      the backlog item itself names. Anything else honestly falls
 *      through to a "not sure what you're asking" empty state (never a
 *      silent no-op, never a guess -- Decision Record 8.7).
 *   3. All three intents are answered by REUSING two already-shipped GETs
 *      -- GET /api/workbench/summary (#172/#178) and GET /api/maturity/
 *      snapshots -- with ZERO new backend routes. Both are fetched once
 *      per dialog session and the "compare Q1 vs Q2" quarter-matching +
 *      per-segment delta math happens entirely client-side in this file,
 *      reusing the SAME delta-computation shape (title-matched,
 *      non-zero-only, sorted by |delta| descending) that brief.ts's
 *      "changed" bucket already established -- not an invented one.
 *
 * One deliberate deviation from the obvious "just use <CommandDialog>"
 * path: CommandDialog (ui/command.tsx) hard-codes an uncontrolled cmdk
 * <Command> with no way to pass `shouldFilter`. cmdk's default behaviour
 * fuzzy-filters CommandItem children against the raw search text -- which
 * would silently hide this bar's intent-computed results (e.g. a segment
 * titled "Procurement" almost never fuzzy-matches the literal query
 * "compare my Q1 vs Q2 scores") the moment a real sentence is typed. This
 * file composes Dialog + DialogContent + the exported `Command` primitive
 * directly with shouldFilter={false} instead, so cmdk never re-filters
 * results this component already computed itself. Still the same
 * ui/command.tsx primitives, just assembled one level down from
 * CommandDialog to fix a real functional bug rather than ship it.
 *
 * Sign-in gating matches MyWorkbench.tsx's own convention (a personal-data
 * feature is meaningless for anonymous visitors): the whole component
 * renders null when signed out, so neither the trigger nor the Cmd/Ctrl+K
 * listener exists for a logged-out visitor.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import {
  Search, ArrowUp, ArrowDown, Minus, Clock3, ListChecks, FileSearch, ArrowRight,
} from 'lucide-react';

/* ── Response shapes (mirror workbench.ts / maturitySnapshots.ts -- see those files' headers) ── */
interface ActionItem {
  id: number; source: string; phase: string | null; segmentTitle: string | null;
  action: string; status: string; createdAt: string; completedAt: string | null;
  dueAt: string | null; isOverdue: boolean; daysOverdue: number | null;
}
interface Investigation {
  id: number; tool: string; industry: string | null; subIndustry: string | null; challenge: string | null;
  problemCount: number | null; createdAt: string;
}
interface WorkbenchSummary {
  ok: boolean; hasData: boolean;
  actions: { total: number; notStarted: number; inProgress: number; done: number; items: ActionItem[] };
  investigations: Investigation[];
}
interface SegScore { id: string; title: string; titleAr?: string; score?: number; level?: string; locked?: boolean }
interface SnapshotRecord { id: number; takenAt: string; segmentScores: SegScore[] }
interface SnapshotsResponse { ok: boolean; snapshots?: SnapshotRecord[] }

/* ── Fixed-intent router (v1, no AI/NLU -- see header) ── */
type Intent =
  | { type: 'lastDiagnosis' }
  | { type: 'openActions' }
  | { type: 'compareQuarters'; qa: { q: number; year: number }; qb: { q: number; year: number } };

const QUARTER_RE = /\bq\s*([1-4])\b(?:\s+(\d{4}))?/gi;

export function matchIntent(raw: string): Intent | null {
  const text = raw.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  const quarters: Array<{ q: number; year: number }> = [];
  const currentYear = new Date().getFullYear();
  QUARTER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = QUARTER_RE.exec(lower))) {
    quarters.push({ q: Number(m[1]), year: m[2] ? Number(m[2]) : currentYear });
  }
  if (quarters.length >= 2 && /(vs\.?|versus|compare)/.test(lower)) {
    return { type: 'compareQuarters', qa: quarters[0], qb: quarters[1] };
  }
  if (/diagnos|investigation/.test(lower)) return { type: 'lastDiagnosis' };
  if (/\bactions?\b/.test(lower)) return { type: 'openActions' };
  return null;
}

function quarterLabel(q: { q: number; year: number }) { return `Q${q.q} ${q.year}`; }

function quarterRange(q: number, year: number) {
  const startMonth = (q - 1) * 3;
  return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 1) };
}

function findSnapshotInQuarter(snapshots: SnapshotRecord[], q: { q: number; year: number }): SnapshotRecord | null {
  const { start, end } = quarterRange(q.q, q.year);
  // snapshots arrive ASC by takenAt (GET /api/maturity/snapshots' own ORDER BY) -- last match is the most recent within the quarter.
  const matches = snapshots.filter(s => {
    const t = new Date(s.takenAt).getTime();
    return t >= start.getTime() && t < end.getTime();
  });
  return matches.length ? matches[matches.length - 1] : null;
}

export interface SegmentDelta { title: string; scorePrevious: number; scoreLatest: number; delta: number }

// Same delta-computation approach as brief.ts's "changed" bucket: title-matched, non-zero deltas
// only, sorted by |delta| descending. Never fabricates a comparison from a missing/locked score.
export function computeSegmentDeltas(earlier: SnapshotRecord, later: SnapshotRecord): SegmentDelta[] {
  const prevByTitle = new Map(
    earlier.segmentScores.filter(s => typeof s.score === 'number').map(s => [s.title, s.score as number]),
  );
  return later.segmentScores
    .filter(s => typeof s.score === 'number' && prevByTitle.has(s.title))
    .map(s => {
      const scorePrevious = prevByTitle.get(s.title)!;
      const scoreLatest = s.score as number;
      return { title: s.title, scorePrevious, scoreLatest, delta: Math.round((scoreLatest - scorePrevious) * 100) / 100 };
    })
    .filter(s => s.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EXAMPLES = ['my last diagnosis', 'my open actions', 'compare Q1 vs Q2 scores'];

export function ScopedCommandBar() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [workbench, setWorkbench] = useState<WorkbenchSummary | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotRecord[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(false);

  // Cmd/Ctrl+K opens the bar -- same metaKey/ctrlKey convention as ui/sidebar.tsx's own
  // keyboard-shortcut listener. Gated on `user` at the effect level, not just the render:
  // a signed-out visitor never has this listener registered in the first place.
  useEffect(() => {
    if (!user) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Fetch both existing GETs once per dialog session -- no new backend route (Decision Record 8.10).
  useEffect(() => {
    if (!open || !user || workbench || snapshots) return;
    setDataLoading(true);
    setDataError(false);
    Promise.all([
      fetch(`${API_BASE}/workbench/summary`, { credentials: 'include' }).then(r => r.json()) as Promise<WorkbenchSummary>,
      fetch(`${API_BASE}/maturity/snapshots`, { credentials: 'include' }).then(r => r.json()) as Promise<SnapshotsResponse>,
    ])
      .then(([wb, snap]) => {
        setWorkbench(wb.ok ? wb : { ok: true, hasData: false, actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] }, investigations: [] });
        setSnapshots(snap.ok && snap.snapshots ? snap.snapshots : []);
      })
      .catch(() => setDataError(true))
      .finally(() => setDataLoading(false));
  }, [open, user, workbench, snapshots]);

  const closeAndGo = useCallback((href: string) => {
    setOpen(false);
    navigate(href);
  }, [navigate]);

  if (!user) return null; // personal-data feature, meaningless when signed out -- same gating as MyWorkbench.tsx

  const intent = matchIntent(query);

  function renderLastDiagnosis() {
    const inv = workbench?.investigations[0] ?? null;
    if (!inv) return <CommandEmpty>{ar ? 'لا يوجد تشخيص محفوظ بعد.' : 'No diagnosis on file yet.'}</CommandEmpty>;
    return (
      <CommandGroup heading={ar ? 'آخر تشخيص' : 'Last diagnosis'}>
        <CommandItem value="last-diagnosis" onSelect={() => closeAndGo('/command-center')}>
          <FileSearch className="opacity-60" />
          <div className="flex-1">
            <div>{inv.challenge ?? (ar ? 'تحقيق' : 'Investigation')}</div>
            <div className="text-[11px] text-muted-foreground">
              {inv.industry}{inv.subIndustry ? ` / ${inv.subIndustry}` : ''} — {formatDate(inv.createdAt, ar)}
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
        </CommandItem>
      </CommandGroup>
    );
  }

  function renderOpenActions() {
    const openItems = (workbench?.actions.items ?? []).filter(a => a.status !== 'done');
    if (openItems.length === 0) return <CommandEmpty>{ar ? 'لا توجد إجراءات مفتوحة — عمل رائع.' : 'No open actions -- nice work.'}</CommandEmpty>;
    return (
      <CommandGroup heading={ar ? `إجراءاتي المفتوحة (${openItems.length})` : `My open actions (${openItems.length})`}>
        {openItems.slice(0, 8).map(item => (
          <CommandItem key={item.id} value={`action-${item.id}`} onSelect={() => closeAndGo('/action-tracker')}>
            {item.isOverdue ? <Clock3 className="text-red-500" /> : <ListChecks className="opacity-60" />}
            <div className="flex-1">
              <div>{item.action}</div>
              {item.segmentTitle && <div className="text-[11px] text-muted-foreground">{item.segmentTitle}</div>}
            </div>
            {item.isOverdue ? (
              <span className="text-[11px] text-red-600 font-semibold">{ar ? `متأخر ${item.daysOverdue} يومًا` : `${item.daysOverdue}d overdue`}</span>
            ) : (
              <span className="text-[11px] text-muted-foreground capitalize">{item.status.replace('_', ' ')}</span>
            )}
          </CommandItem>
        ))}
        <CommandItem value="view-action-tracker" onSelect={() => closeAndGo('/action-tracker')}>
          <ArrowRight className="opacity-50" /> {ar ? 'عرض متتبّع الإجراءات الكامل' : 'View full Action Tracker'}
        </CommandItem>
      </CommandGroup>
    );
  }

  function renderCompareQuarters(iv: Extract<Intent, { type: 'compareQuarters' }>) {
    const snaps = snapshots ?? [];
    const snapA = findSnapshotInQuarter(snaps, iv.qa);
    const snapB = findSnapshotInQuarter(snaps, iv.qb);
    const labelA = quarterLabel(iv.qa);
    const labelB = quarterLabel(iv.qb);

    if (!snapA || !snapB) {
      const missing = [!snapA ? labelA : null, !snapB ? labelB : null].filter(Boolean).join(ar ? ' و' : ' and ');
      return (
        <CommandEmpty>
          {ar ? `لا توجد بيانات لـ ${missing}. لا يمكن إجراء مقارنة صادقة.` : `No data for ${missing}. Can't show an honest comparison.`}
        </CommandEmpty>
      );
    }

    const [earlier, later] = new Date(snapA.takenAt).getTime() <= new Date(snapB.takenAt).getTime() ? [snapA, snapB] : [snapB, snapA];
    const deltas = computeSegmentDeltas(earlier, later);

    if (deltas.length === 0) {
      return <CommandEmpty>{ar ? `لا تغييرات في الدرجات بين ${labelA} و${labelB}.` : `No score changes between ${labelA} and ${labelB}.`}</CommandEmpty>;
    }

    return (
      <CommandGroup heading={`${labelA} vs ${labelB}`}>
        {deltas.map(d => (
          <CommandItem key={d.title} value={`delta-${d.title}`} onSelect={() => closeAndGo('/maturity')}>
            {d.delta > 0 ? <ArrowUp className="text-emerald-600" /> : d.delta < 0 ? <ArrowDown className="text-red-500" /> : <Minus className="opacity-50" />}
            <div className="flex-1">{d.title}</div>
            <span className="text-[11px] text-muted-foreground">{d.scorePrevious.toFixed(1)} → {d.scoreLatest.toFixed(1)}</span>
            <span className={`text-[11px] font-semibold ${d.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  }

  let body: React.ReactNode;
  if (!query.trim()) {
    body = (
      <CommandGroup heading={ar ? 'جرّب' : 'Try asking'}>
        {EXAMPLES.map(ex => (
          <CommandItem key={ex} value={ex} onSelect={() => setQuery(ex)}>
            <Search className="opacity-50" /> {ex}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  } else if (dataLoading) {
    body = <CommandEmpty>{ar ? 'جارٍ تحميل بياناتك...' : 'Loading your data...'}</CommandEmpty>;
  } else if (dataError) {
    body = <CommandEmpty>{ar ? 'تعذّر تحميل بياناتك. حاول مرة أخرى.' : "Couldn't load your data. Try again."}</CommandEmpty>;
  } else if (!intent) {
    body = (
      <CommandEmpty>
        {ar
          ? 'لست متأكدًا مما تسأل عنه — جرّب "آخر تشخيص لي" أو "إجراءاتي المفتوحة" أو "قارن Q1 مقابل Q2"'
          : `Not sure what you're asking — try "my last diagnosis", "my open actions", or "compare Q1 vs Q2 scores".`}
      </CommandEmpty>
    );
  } else if (intent.type === 'lastDiagnosis') {
    body = renderLastDiagnosis();
  } else if (intent.type === 'openActions') {
    body = renderOpenActions();
  } else {
    body = renderCompareQuarters(intent);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors"
      >
        <Search className="w-3 h-3" /> {ar ? 'ابحث في بياناتي' : 'Ask your data'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={ar ? 'اسأل عن بياناتك... مثل "آخر تشخيص لي"' : 'Ask about your data... e.g. "my last diagnosis"'}
            />
            <CommandList>{body}</CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
