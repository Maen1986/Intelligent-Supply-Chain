import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { rankWeakest } from '@/lib/weakestAreas';
import {
  MATURITY_LEVELS, getLevel,
  segScore as calcSegScore,
  overallScore as calcOverallScore,
  weightedOverallScore as calcWeightedOverallScore,
  weightedSegScore as calcWeightedSegScore,
  countCoveredSubSegments,
} from '@/lib/maturityScoring';
import { MaturityCoverage } from '@/components/MaturityCoverage';
import { MaturityTrend, type SnapshotRecord, type SegmentMeta } from '@/components/MaturityTrend';
import { EvidenceUploadZone, type EvidenceRecord } from '@/components/EvidenceUploadZone';
import { ConfidenceTierBadge, getSegmentTier } from '@/components/ConfidenceTierBadge';
import { FeedbackModal, shouldShowFeedback } from '@/components/FeedbackModal';
import { FrameworkBadge } from '@/components/FrameworkBadge';
import { API_BASE } from '@/lib/apiBase';
import { useAuth } from '@/lib/AuthContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Award,
  TrendingUp, RotateCcw, Pencil, Sparkles, Loader2,
  CheckCircle2, Clock, Target, AlertCircle, Building2, Users2,
  Download, FileText, Mail, ListChecks, Globe,
  Eye, ShieldCheck, Brain, Scale, Lock,
} from 'lucide-react';
import {
  CORE_SEGMENTS, INDUSTRY_MODULES, INTAKE_INDUSTRIES, INTAKE_SIZES,
  getActiveModules,
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

type Phase = 'intro' | 'intake' | 'picker' | 'questions' | 'results';

/**
 * localStorage key under which in-progress draft answers and phase are
 * persisted so returning users can resume where they left off.
 * v2 because the assessment now has 12 core segments (vs 8 in v1).
 */
export const MATURITY_DRAFT_KEY = 'maturity_draft_v2';
export const ISC_MATURITY_CONTEXT_KEY = 'isc_maturity_ctx_v1';

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

/**
 * Compute a stable string key representing a picker scope selection.
 * Two scopes that select the same segments and same questions produce
 * identical keys; any difference produces a different key.
 * Used to detect when re-confirming the picker after going back from
 * questions would misattribute existing answers.
 */
function computeScopeKey(segIds: string[], subSegIds: Record<string, number[]>, deepIds?: Set<string>): string {
  const sorted = [...segIds].sort();
  const parts  = sorted.map(id => `${id}:[${(subSegIds[id] ?? [0,1,2,3,4]).slice().sort((a,b)=>a-b).join(',')}]${deepIds?.has(id) ? ':deep' : ''}`);
  return parts.join('|');
}

/** Read a saved draft from localStorage (returns null if absent or invalid). */
function readDraft(): {
  phase: Phase;
  answers: Record<string, number>;
  intakeData: IntakeData;
  selectedSegmentIds?: string[];
  selectedSubSegIds?: Record<string, number[]>;
  committedScopeKey?: string;
  deepSegIds?: string[];
} | null {
  try {
    const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as {
      phase?: unknown; answers?: unknown; intakeData?: unknown;
      selectedSegmentIds?: unknown; selectedSubSegIds?: unknown;
      committedScopeKey?: unknown; deepSegIds?: unknown;
    };
    if (
      (saved.phase === 'intake' || saved.phase === 'picker' || saved.phase === 'questions' || saved.phase === 'results') &&
      saved.answers !== null &&
      typeof saved.answers === 'object' &&
      !Array.isArray(saved.answers)
    ) {
      return {
        phase: saved.phase as Phase,
        answers: saved.answers as Record<string, number>,
        intakeData: (saved.intakeData as IntakeData) ?? { industry: '', companySize: '', country: 'ksa' },
        selectedSegmentIds: Array.isArray(saved.selectedSegmentIds)
          ? (saved.selectedSegmentIds as string[])
          : undefined,
        selectedSubSegIds: (saved.selectedSubSegIds && typeof saved.selectedSubSegIds === 'object' && !Array.isArray(saved.selectedSubSegIds))
          ? (saved.selectedSubSegIds as Record<string, number[]>)
          : undefined,
        committedScopeKey: typeof saved.committedScopeKey === 'string'
          ? saved.committedScopeKey
          : undefined,
        deepSegIds: Array.isArray(saved.deepSegIds) ? (saved.deepSegIds as string[]) : undefined,
      };
    }
  } catch { /* corrupted — ignore */ }
  return null;
}

/* ── AI Remedies response type ─────────────────────────────────────────── */
interface RemedyItem {
  segmentTitle:      string;
  subQuestion?:      string;
  specificGap?:      string;
  action:            string;
  framework?:        string;
  measurableTarget?: string;
  effort?:           string;
}
interface RemediesResponse {
  executiveSummary: string;
  days30: RemedyItem[];
  days60: RemedyItem[];
  days90: RemedyItem[];
  estimatedImpact?: string;
}

/* ── Regulatory country registry (#150, DB-backed via /api/regulatory) ──── */
interface RegCountry {
  id: string;
  name: string;
  nameAr: string;
  isoCode: string;
  region: string;
  coverageLevel: 'full' | 'partial' | 'roadmap';
  isDefault: boolean;
  sourceUrl?: string | null;
  notes?: string | null;
  notesAr?: string | null;
  sortOrder: number;
}

/* ─────────────────────────────────────────────────────────────────────────── */

export function Maturity() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const { user } = useAuth();
  const searchString = useSearch();

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
    if (_testSeedActive) return _testSeed.intakeData ?? { industry: '', companySize: '', country: 'ksa' };
    return readDraft()?.intakeData ?? { industry: '', companySize: '', country: 'ksa' };
  });

  /** Picker: which segment IDs the user chose to include in this run. */
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>(() => {
    if (_testSeedActive) return [...CORE_SEGMENTS, ...INDUSTRY_MODULES].map(s => s.id);
    const draft = readDraft();
    if (draft?.selectedSegmentIds?.length) return draft.selectedSegmentIds;
    return [...CORE_SEGMENTS, ...INDUSTRY_MODULES].map(s => s.id);
  });

  /** Picker: per-segment map of original question indices (0–4) to include. */
  const [selectedSubSegIds, setSelectedSubSegIds] = useState<Record<string, number[]>>(() => {
    if (_testSeedActive) {
      const init: Record<string, number[]> = {};
      [...CORE_SEGMENTS, ...INDUSTRY_MODULES].forEach(s => { init[s.id] = [0, 1, 2, 3, 4]; });
      return init;
    }
    const draft = readDraft();
    if (draft?.selectedSubSegIds && Object.keys(draft.selectedSubSegIds).length > 0) return draft.selectedSubSegIds;
    const init: Record<string, number[]> = {};
    [...CORE_SEGMENTS, ...INDUSTRY_MODULES].forEach(s => { init[s.id] = [0, 1, 2, 3, 4]; });
    return init;
  });

  /**
   * The scope key that was in effect when the current `answers` were entered.
   * Persisted in draft so a page-refresh + resume doesn't falsely mark the
   * scope as "changed". Cleared when answers are wiped.
   */
  const [committedScopeKey, setCommittedScopeKey] = useState<string>(() => {
    if (_testSeedActive) return '';
    return readDraft()?.committedScopeKey ?? '';
  });

  /** Picker UI: which segment cards are expanded to show sub-question toggles. */
  const [expandedPickerSegs, setExpandedPickerSegs] = useState<Set<string>>(new Set());

  /**
   * Deep mode: per-segment opt-in. Segments in this set render their full
   * sub-segment question bank (6-8 subs, 60-80 Q) in the quiz instead of the
   * flat 5-question layer. Quick (not in this set) is the default for every
   * segment. Answers use 3-part keys "{segIdx}-{subIdx}-{qIdx}" for deep
   * segments vs the legacy 2-part "{segIdx}-{qIdx}" for quick ones — the
   * scoring engine (lib/maturityScoring.ts) already auto-detects and
   * weights whichever key format is present.
   */
  const [deepSegIds, setDeepSegIds] = useState<Set<string>>(() => {
    if (_testSeedActive) return new Set();
    const draft = readDraft();
    return draft?.deepSegIds?.length ? new Set(draft.deepSegIds) : new Set();
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

  // Guest result persistence state
  const [guestEmail,        setGuestEmail]        = useState('');
  const [guestSaveLoading,  setGuestSaveLoading]  = useState(false);
  const [guestSaveDone,     setGuestSaveDone]     = useState(false);
  const [guestSaveError,    setGuestSaveError]    = useState<string | null>(null);
  /** True when the current view was restored from a tokenised link */
  const [restoredFromToken, setRestoredFromToken] = useState(false);
  // #142: true when industry/size/country were pre-filled from a completed
  // Diagnostic report's handoff link, so the intake screen can say so.
  const [prefilledFromDiagnostic, setPrefilledFromDiagnostic] = useState(false);

  // Snapshot trend state
  const [snapshots,          setSnapshots]          = useState<SnapshotRecord[]>([]);
  const [currentSnapshotId,  setCurrentSnapshotId]  = useState<number | null>(null);
  /* The 'submissions' table row id for this results visit's lead-capture
     POST (see below). Captured so it can be linked to the richer
     maturity_snapshots row once that POST also resolves — the two rows
     live in independent tables with unrelated ID sequences, and without
     this link My Assessments has no way to find a submission's
     evidence/remedies data. */
  const [submissionRowId,    setSubmissionRowId]    = useState<number | null>(null);

  // Evidence: confidence tier & document upload state (results only)
  const [evidenceList,  setEvidenceList]  = useState<EvidenceRecord[]>([]);
  const [expandedEvSeg, setExpandedEvSeg] = useState<Set<string>>(new Set());

  // Regulatory country coverage (#150) — live from the DB-backed registry,
  // not a hardcoded list, so new countries appear here the moment they're
  // seeded server-side with no frontend redeploy needed for the data itself.
  const [regCountries, setRegCountries] = useState<RegCountry[]>([]);
  useEffect(() => {
    if (_testSeedActive) return;
    fetch(`${API_BASE}/regulatory/countries`)
      .then(r => r.json())
      .then((data: { ok: boolean; countries?: RegCountry[] }) => {
        if (data.ok && data.countries) setRegCountries(data.countries);
      })
      .catch(() => { /* best-effort — country selector falls back to KSA-only default */ });
  }, []);
  const selectedCountryId = intakeData.country || 'ksa';

  /* Active segments depend on the chosen industry AND country (#150) */
  const activeModules  = intakeData.industry ? getActiveModules(intakeData.industry, selectedCountryId) : [];
  let   activeSegments: Segment[] = [...CORE_SEGMENTS, ...activeModules];
  // Tests that don't provide intakeData were written against the 8-segment assessment;
  // cap to 8 so their answer maps, segment counts, and navigation assertions all stay valid.
  if (_testSeedActive && !_testSeed.intakeData) activeSegments = activeSegments.slice(0, 8);

  /**
   * The working set for questions/results — activeSegments filtered by the
   * user's picker selection. Defaults to all activeSegments until the user
   * has confirmed a custom scope.
   */
  const scopedSegments: Segment[] = selectedSegmentIds.length > 0
    ? activeSegments.filter(s => selectedSegmentIds.includes(s.id))
    : activeSegments;

  /** Helper: question indices selected for a given segment (default all 5). */
  const segQuestionIndices = (segId: string): number[] =>
    selectedSubSegIds[segId] ?? [0, 1, 2, 3, 4];

  /** Total question count for a segment, honouring its Quick/Deep mode. */
  const segQuestionCount = (seg: Segment): number =>
    (seg.subSegments && deepSegIds.has(seg.id))
      ? seg.subSegments.reduce((s, sub) => s + sub.questions.length, 0)
      : segQuestionIndices(seg.id).length;

  /** Answered-question count for a segment, honouring its Quick/Deep mode. */
  const segAnsweredCount = (seg: Segment, si: number): number =>
    (seg.subSegments && deepSegIds.has(seg.id))
      ? seg.subSegments.reduce((s, sub, subIdx) =>
          s + sub.questions.filter((_, qi) => answers[`${si}-${subIdx}-${qi}`]).length, 0)
      : segQuestionIndices(seg.id).filter(qi => answers[`${si}-${qi}`]).length;

  const totalQuestions = scopedSegments.reduce(
    (sum, seg) => sum + segQuestionCount(seg), 0,
  );
  const answeredCount = scopedSegments.reduce((sum, seg, si) =>
    sum + segAnsweredCount(seg, si), 0,
  );
  const progress       = totalQuestions > 0 ? answeredCount / totalQuestions : 0;

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
    const firstIncomplete = scopedSegments.findIndex((seg, i) =>
      calcSegScore(answers, i, segQuestionIndices(seg.id)) === null,
    );
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
      localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({
        phase, answers, intakeData, selectedSegmentIds, selectedSubSegIds, committedScopeKey,
        deepSegIds: Array.from(deepSegIds),
      }));
    } catch { /* quota — ignore */ }
  }, [phase, answers, intakeData, selectedSegmentIds, selectedSubSegIds, committedScopeKey, deepSegIds]);

  /* ── Token-based restore: load guest snapshot from API when ?token= present */
  const tokenRestoreAttempted = useRef(false);
  useEffect(() => {
    if (_testSeedActive) return;
    if (tokenRestoreAttempted.current) return;
    const params = new URLSearchParams(searchString);
    const token = params.get('token');
    if (!token) return;
    tokenRestoreAttempted.current = true;

    fetch(`${API_BASE}/maturity/guest-results/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((data: { ok: boolean; answers?: Record<string, number>; intakeData?: { industry: string; companySize: string }; lang?: string }) => {
        if (!data.ok || !data.answers || !data.intakeData) return;
        setAnswers(data.answers);
        setIntakeData(data.intakeData);
        setPhase('results');
        setRestoredFromToken(true);
      })
      .catch(() => { /* best-effort */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Diagnostic handoff: pre-fill intake from ?industry=&size=&country=
     (#142) — only on a genuinely fresh session (no draft, nothing answered
     yet), so this can never overwrite a returning user's in-progress work.
     Any field without a recognised value is simply left for the user to
     pick, same honesty rule as the mapping helpers that build this link. */
  const diagnosticPrefillAttempted = useRef(false);
  useEffect(() => {
    if (_testSeedActive) return;
    if (diagnosticPrefillAttempted.current) return;
    diagnosticPrefillAttempted.current = true;
    if (intakeData.industry !== '' || intakeData.companySize !== '') return;
    const params = new URLSearchParams(searchString);
    const industry = params.get('industry');
    const size     = params.get('size');
    const country  = params.get('country');
    if (!industry && !size && !country) return;
    setIntakeData(d => ({
      ...d,
      ...(industry ? { industry } : {}),
      ...(size     ? { companySize: size } : {}),
      ...(country  ? { country } : {}),
    }));
    setPrefilledFromDiagnostic(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Lead capture: record submission + notify admin on results ─────────── */
  const submissionFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== 'results') return;
    if (_testSeedActive) return;
    if (submissionFiredRef.current) return;
    submissionFiredRef.current = true;

    const score = calcOverallScore(answers, scopedSegments.length, scopedSegments.map(s => segQuestionIndices(s.id)));
    const level = getLevel(score);
    const segScoresSnap = scopedSegments.map((seg, i) => ({
      id:    seg.id,
      title: ar ? seg.titleAr : seg.title,
      score: +(segScore(i) ?? 0).toFixed(2),
      level: getLevel(segScore(i) ?? 0).label,
    }));

    // Always record the submission (best-effort). For logged-in users, also
    // capture the returned row id so it can be linked to the corresponding
    // maturity_snapshots row once that POST resolves (see the linking effect
    // below) — closes the gap where My Assessments couldn't find a
    // submission's evidence/remedies data.
    fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool:               'maturity',
        contactName:        user?.fullName        ?? null,
        contactEmail:       user?.email           ?? null,
        contactMobile:      (user as any)?.mobile ?? null,
        contactDesignation: (user as any)?.designation ?? null,
        contactCompany:     (user as any)?.company    ?? null,
        inputs:  { intakeData, segmentCount: scopedSegments.length },
        outputs: { overallScore: score.toFixed(2), overallLevel: level.label, segmentScores: segScoresSnap },
        language: ar ? 'ar' : 'en',
      }),
    })
    .then(r => r.json())
    .then((data: { ok: boolean; id?: number }) => {
      if (data.ok && data.id) setSubmissionRowId(data.id);
    })
    .catch(() => {/* best-effort */});

    // Notify admin with full breakdown (only when user session available)
    if (user?.email) {
      fetch(`${API_BASE}/notify/maturity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:     user.fullName,
          email:        user.email,
          mobile:       (user as any)?.mobile      ?? null,
          designation:  (user as any)?.designation ?? null,
          company:      (user as any)?.company     ?? null,
          overallLevel: level.label,
          scores:       segScoresSnap,
        }),
      }).catch(() => {/* best-effort */});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Load evidence when a snapshot is available (logged-in only) ─────────
     Fires whenever currentSnapshotId changes from null → a real ID.         */
  const fetchEvidence = () => {
    if (!user || !currentSnapshotId || _testSeedActive) return;
    fetch(`${API_BASE}/maturity/evidence?snapshot_id=${currentSnapshotId}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; evidence?: EvidenceRecord[] }) => {
        if (data.ok && data.evidence) setEvidenceList(data.evidence);
      })
      .catch(() => { /* best-effort */ });
  };

  useEffect(() => {
    if (currentSnapshotId) fetchEvidence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshotId]);

  /* ── Load existing snapshot history whenever results are shown ───────────
     Runs unconditionally on every results entry for authenticated users so
     that history is always visible — regardless of whether a new POST
     succeeds, is rate-limited, or fails.                                    */
  const fetchSnapshots = () => {
    if (!user || _testSeedActive) return;
    fetch(`${API_BASE}/maturity/snapshots`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; snapshots?: SnapshotRecord[] }) => {
        if (data.ok && data.snapshots) setSnapshots(data.snapshots);
      })
      .catch(() => { /* best-effort */ });
  };

  useEffect(() => {
    if (phase !== 'results') return;
    fetchSnapshots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, user]);

  /* ── Auto-save snapshot when phase → results (logged-in users only) ─────
     Fires at most once per results visit. On success, re-fetches the full
     list so the newly saved entry appears in the trend panel. On 429/error,
     the history fetch above already populated the trend from prior snapshots. */
  const snapshotFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== 'results' || !user || _testSeedActive) return;
    if (snapshotFiredRef.current) return;
    snapshotFiredRef.current = true;

    const segScores = scopedSegments.map((seg, i) => ({
      id:      seg.id,
      title:   seg.title,
      titleAr: seg.titleAr,
      score:   +(segScore(i) ?? 0).toFixed(2),
      level:   getLevel(segScore(i) ?? 0).label,
    }));
    const coveragePctVal = totalSubSegs > 0
      ? +(coveredSubSegs / totalSubSegs * 100).toFixed(2)
      : 0;

    fetch(`${API_BASE}/maturity/snapshots`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        answers,
        intakeData,
        numSegments:   scopedSegments.length,
        segmentScores: segScores,
        coveragePct:   coveragePctVal,
      }),
    })
    .then(r => r.json())
    .then((data: { ok: boolean; id?: number }) => {
      if (data.ok && data.id) {
        setCurrentSnapshotId(data.id);
        // Re-fetch so the trend panel includes the newly saved snapshot
        fetchSnapshots();
      }
      // 429 or validation error: history already loaded from the independent
      // fetch above — no action needed here (follow-up #726 will surface
      // user-facing feedback for the rate-limit case)
      return undefined;
    })
    .catch(() => { /* best-effort — history remains from independent fetch */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, user]);

  /* ── Link the lead-capture submission to its maturity_snapshots row ──────
     Fires once both independent POSTs above have resolved. Without this,
     My Assessments (which reads from the 'submissions' table) has no
     reliable way to find the matching maturity_snapshots row that evidence
     uploads and the Action Tracker are keyed to — best-effort, never
     blocks or surfaces an error to the user.                               */
  const linkFiredRef = useRef(false);
  useEffect(() => {
    if (linkFiredRef.current) return;
    if (!submissionRowId || !currentSnapshotId || !user) return;
    linkFiredRef.current = true;
    fetch(`${API_BASE}/submissions/${submissionRowId}/link-maturity-snapshot`, {
      method:      'PATCH',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ snapshotId: currentSnapshotId }),
    }).catch(() => {/* best-effort */});
  }, [submissionRowId, currentSnapshotId, user]);

  /* ── Patch snapshot with remedy actions once AI plan resolves ─────────── */
  useEffect(() => {
    if (!remediesData || !currentSnapshotId || !user || _testSeedActive) return;
    fetch(`${API_BASE}/maturity/snapshots/${currentSnapshotId}/remedies`, {
      method:      'PATCH',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ remedyActions: remediesData }),
    })
    .then(r => r.json())
    .then((data: { ok: boolean }) => {
      if (data.ok) {
        // Update local snapshot so the current run's remedies appear in correlation
        setSnapshots(prev => prev.map(s =>
          s.id === currentSnapshotId ? { ...s, remedyActions: remediesData as SnapshotRecord['remedyActions'] } : s,
        ));
      }
    })
    .catch(() => { /* best-effort */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remediesData, currentSnapshotId]);

  const scrollUp = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const setAnswer = (seg: number, q: number, val: number) =>
    setAnswers(prev => ({ ...prev, [`${seg}-${q}`]: val }));

  const segScore = (seg: number): number | null => {
    const s = scopedSegments[seg];
    if (!s) return null;
    if (s.subSegments && deepSegIds.has(s.id)) {
      return calcWeightedSegScore(answers, s, seg, intakeData.industry || 'other');
    }
    return calcSegScore(answers, seg, segQuestionIndices(s.id));
  };

  const currentSegComplete = () => {
    const seg = scopedSegments[segIdx];
    if (!seg) return false;
    if (seg.subSegments && deepSegIds.has(seg.id)) {
      return seg.subSegments.every((sub, si) =>
        sub.questions.every((_, qi) => answers[`${segIdx}-${si}-${qi}`]),
      );
    }
    return segQuestionIndices(seg.id).every(q => answers[`${segIdx}-${q}`]);
  };

  const handleNext = () => {
    if (segIdx < scopedSegments.length - 1) { setSegIdx(s => s + 1); scrollUp(); }
    else { setEditingFromResults(false); setPhase('results'); scrollUp(); }
  };
  const handleBack = () => {
    if (segIdx > 0) { setSegIdx(s => s - 1); scrollUp(); }
    else { setPhase('picker'); scrollUp(); }
  };

  /** Reset picker selections to the full current active-segment set. */
  const resetPickerSelections = (segs: Segment[]) => {
    setSelectedSegmentIds(segs.map(s => s.id));
    const subs: Record<string, number[]> = {};
    segs.forEach(s => { subs[s.id] = [0, 1, 2, 3, 4]; });
    setSelectedSubSegIds(subs);
    setExpandedPickerSegs(new Set());
  };

  const handleReset = () => {
    try { localStorage.removeItem(MATURITY_DRAFT_KEY); } catch { /* ignore */ }
    setAnswers({});
    setIntakeData({ industry: '', companySize: '', country: 'ksa' });
    setSegIdx(0);
    setPhase('intro');
    setIncompleteWarning(false);
    setEditingFromResults(false);
    setRemediesData(null);
    setRemediesError(null);
    setRemediesShown(false);
    // Reset snapshot tracking so the next results visit auto-saves fresh
    snapshotFiredRef.current = false;
    setCurrentSnapshotId(null);
    setSubmissionRowId(null);
    linkFiredRef.current = false;
    resetPickerSelections([...CORE_SEGMENTS, ...activeModules]);
    scrollUp();
  };
  const handleEditSegment = (i: number) => { setSegIdx(i); setEditingFromResults(true); setPhase('questions'); scrollUp(); };
  const handleBackToResults = () => { setEditingFromResults(false); setPhase('results'); scrollUp(); };
  /** "Deepen this segment": opt it into Deep mode and jump straight into its (now expanded) question set. */
  const handleDeepenSegment = (i: number) => {
    const seg = scopedSegments[i];
    if (!seg) return;
    setDeepSegIds(prev => new Set(prev).add(seg.id));
    setSegIdx(i);
    setEditingFromResults(true);
    setPhase('questions');
    scrollUp();
  };

  /** Write enriched maturity context to sessionStorage before navigating to /report-generator */
  const handleGoToReport = () => {
    try {
      const segScores = scopedSegments.map((seg, i) => ({
        id:       seg.id,
        title:    seg.title,
        titleAr:  seg.titleAr,
        score:    +(segScore(i) ?? 0).toFixed(2),
        level:    getLevel(segScore(i) ?? 0).label,
        levelAr:  getLevel(segScore(i) ?? 0).labelAr,
        gccAvg:   seg.benchmarks.gcc,
        bestClass:seg.benchmarks.best,
      }));
      const evidenceableSubs = scopedSegments.reduce(
        (sum, seg) => sum + (seg.subSegments ?? []).filter(ss => ss.evidence).length, 0,
      );
      const evidenceBackedCount = evidenceList.filter(
        e => (e.confidenceTier === 'ai_evaluated' || e.confidenceTier === 'consultant_validated')
          && e.aiEvaluation?.plausible_support,
      ).length;
      // Evidence Appendix (#39) — the tier-only evidenceTiers array below
      // only carries enough to render the inline "AI-evaluated" style
      // badges on segment score rows. A credibility-adding appendix needs
      // the actual document list: which file, for which sub-segment, at
      // what tier, with what AI assessment. Resolve each evidence item
      // against activeSegments (not scopedSegments — a client may have
      // uploaded evidence for a segment no longer in their current picker
      // scope) to attach bilingual segment/sub-segment titles at write
      // time, since the DB only stores the English subSegLabel.
      const evidenceAppendix = evidenceList.map(e => {
        const seg    = activeSegments.find(s => s.id === e.segId);
        const subSeg = seg?.subSegments?.find(ss => ss.id === e.subSegId);
        return {
          segId:            e.segId,
          segTitle:         seg?.title   ?? e.segId,
          segTitleAr:       seg?.titleAr ?? e.segId,
          subSegId:         e.subSegId,
          subSegLabel:      subSeg?.title   ?? e.subSegLabel,
          subSegLabelAr:    subSeg?.titleAr ?? e.subSegLabel,
          originalFilename: e.originalFilename,
          mimeType:         e.mimeType,
          confidenceTier:   e.confidenceTier,
          aiEvaluation:     e.aiEvaluation ?? null,
        };
      });

      sessionStorage.setItem(ISC_MATURITY_CONTEXT_KEY, JSON.stringify({
        overallScore:    +overallScore.toFixed(2),
        overallLevel:    overallLevel.label,
        overallLevelAr:  overallLevel.labelAr,
        segmentScores:   segScores,
        remedies:        remediesData ?? undefined,
        intakeData,
        coveragePct:     totalSubSegs > 0 ? +(coveredSubSegs / totalSubSegs * 100).toFixed(1) : undefined,
        lang:            ar ? 'ar' : 'en',
        evidencePct:     evidenceableSubs > 0 ? +(evidenceBackedCount / evidenceableSubs * 100).toFixed(1) : undefined,
        evidenceTiers:   evidenceList.map(e => ({ subSegId: e.subSegId, segId: e.segId, tier: e.confidenceTier })),
        evidenceAppendix,
      }));
    } catch { /* quota or SSR — navigation still proceeds */ }
  };

  /* ── Guest result-persistence: email the tokenised link ──────────────── */
  const handleGuestSave = async () => {
    if (!guestEmail.trim()) return;
    setGuestSaveLoading(true);
    setGuestSaveError(null);
    try {
      const resp = await fetch(`${API_BASE}/maturity/save-guest`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        guestEmail.trim(),
          answers,
          intakeData,
          lang:         ar ? 'ar' : 'en',
          overallScore,
          overallLevel: overallLevel.label,
        }),
      });
      const data = await resp.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Save failed');
      setGuestSaveDone(true);
    } catch (err) {
      setGuestSaveError(err instanceof Error ? err.message : 'Could not send email');
    } finally {
      setGuestSaveLoading(false);
    }
  };

  const L = {
    asIs:        ar ? 'نتيجتك (الوضع الراهن)' : 'Your Score (As-Is)',
    gccMedian:   ar ? 'وسيط الخليج'           : 'GCC Median',
    topQuartile: ar ? 'أفضل ربع (الهدف)'      : 'Top Quartile',
  };

  const radarData = scopedSegments.map((seg, i) => ({
    segment:          ar ? seg.shortTitleAr : seg.shortTitle,
    [L.asIs]:         +(segScore(i) ?? 0).toFixed(2),
    [L.gccMedian]:    seg.benchmarks.gcc,
    [L.topQuartile]:  seg.benchmarks.best,
  }));

  const avgGccMedian   = scopedSegments.length
    ? scopedSegments.reduce((s, seg) => s + seg.benchmarks.gcc,  0) / scopedSegments.length
    : 0;
  const avgTopQuartile = scopedSegments.length
    ? scopedSegments.reduce((s, seg) => s + seg.benchmarks.best, 0) / scopedSegments.length
    : 0;
  const gapData = [...radarData].sort(
    (a, b) => (a[L.asIs] as number) - (b[L.asIs] as number),
  );

  const _unweightedScore = calcOverallScore(
    answers, scopedSegments.length, scopedSegments.map(s => segQuestionIndices(s.id)),
  );
  const _weightedScore   = (!_testSeedActive && intakeData.industry)
    ? calcWeightedOverallScore(answers, scopedSegments, intakeData.industry)
    : 0;
  const isWeightedScore  = _weightedScore > 0;
  const overallScore     = isWeightedScore ? _weightedScore : _unweightedScore;
  const overallLevel     = getLevel(overallScore);

  /* ── Segment metadata list passed to MaturityTrend ──────────────────── */
  const segmentList: SegmentMeta[] = scopedSegments.map(seg => ({
    id:           seg.id,
    color:        seg.color,
    shortTitle:   seg.shortTitle,
    shortTitleAr: seg.shortTitleAr,
  }));

  /* ── Coverage stats (used by MaturityCoverage) ───────────────────────── */
  // segsAssessed: segments where all selected flat questions are answered
  const segsAssessed = scopedSegments.filter((seg, i) =>
    calcSegScore(answers, i, segQuestionIndices(seg.id)) !== null,
  ).length;
  // totalSubSegs: total answerable question slots across scoped segments,
  // honouring each segment's Quick/Deep mode via segQuestionCount.
  // coveredSubSegs: how many of those slots have a non-zero answer, via
  // segAnsweredCount — deep segments count against their full sub-segment
  // bank (3-part keys), quick segments against the flat 5 (2-part keys).
  const totalSubSegs   = scopedSegments.reduce(
    (s, seg) => s + segQuestionCount(seg), 0,
  );
  const coveredSubSegs = scopedSegments.reduce((sum, seg, si) =>
    sum + segAnsweredCount(seg, si), 0,
  );

  /* ── AI Remedies fetcher ──────────────────────────────────────────────── */
  const fetchRemedies = async () => {
    setRemediesLoading(true);
    setRemediesError(null);
    setRemediesShown(true);

    // Build weak sub-questions (score ≤ 3) with full context.
    //
    // Deep-mode gap fix: a segment answered in Deep mode (subSegments,
    // 3-part keys, up to 80 questions) previously fell through to the
    // flat-5 branch below regardless — meaning a client who did the extra
    // work of Deep mode got remedies based only on 5 generic questions,
    // identical to a Quick-mode client. We now read weak items from the
    // actual sub-segment answers for any segment in deepSegIds, prefixing
    // each question with its sub-segment title for AI context (e.g.
    // "CLM System & Automation: <question>"), and cap each deep segment
    // to its 10 weakest items via rankWeakest — an uncapped Deep segment
    // can carry up to 80 questions, and with 12 segments all in Deep mode
    // that's up to 960 potential weak items, which would blow up prompt
    // size/cost for no proportional gain in remedy quality. Sub-segment
    // questions aren't yet tagged with a Strategic/Tactical/Operational
    // layer (#38 only tagged the 75 flat questions), so layer is left
    // undefined here — the backend already treats that as "unclassified"
    // rather than an error.
    const weakItems = scopedSegments.flatMap((seg, si) => {
      const isDeep = !!(seg.subSegments && deepSegIds.has(seg.id));

      if (isDeep) {
        const deepWeak = seg.subSegments!.flatMap((sub, subIdx) =>
          sub.questions.flatMap((q, qi) => {
            const score = answers[`${si}-${subIdx}-${qi}`];
            if (!score || score > 3) return [];
            const subTitle = ar ? sub.titleAr : sub.title;
            return [{
              segmentTitle:     ar ? seg.titleAr : seg.title,
              segmentId:        seg.id,
              questionText:     `${subTitle}: ${ar ? q.qAr : q.q}`,
              score,
              levelDescription: ar ? q.levelsAr[score - 1] : q.levels[score - 1],
              layer:            undefined as ('strategic' | 'tactical' | 'operational' | undefined),
            }];
          })
        );
        return rankWeakest(deepWeak, item => item.score, 10);
      }

      return segQuestionIndices(seg.id).flatMap(qi => {
        const q     = seg.questions[qi];
        const score = answers[`${si}-${qi}`];
        if (!score || score > 3) return [];
        return [{
          segmentTitle:     ar ? seg.titleAr : seg.title,
          segmentId:        seg.id,
          questionText:     ar ? q.qAr : q.q,
          score,
          levelDescription: ar ? q.levelsAr[score - 1] : q.levels[score - 1],
          // Strategic/Tactical/Operational tag (#38) — lets the remedy AI
          // sequence a dependency-aware 30/60/90-day roadmap instead of
          // treating every weak item as equally "fixable now". Omitted
          // (undefined) for the rare flat question authored without one;
          // the backend treats missing layer as unclassified, not an error.
          layer:            q.layer,
        }];
      });
    });

    const segScores = scopedSegments.map((seg, i) => ({
      id:           seg.id,
      segmentTitle: ar ? seg.titleAr : seg.title,
      score:        +(segScore(i) ?? 0).toFixed(2),
      level:        getLevel(segScore(i) ?? 0).label,
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
              ? 'تشخيص منظم عبر 12 مجالاً محورياً. ابدأ بتقييم سريع (~20 دقيقة)، ثم تعمّق في أي مجال تختاره لتحليل أكثر تفصيلاً يصل إلى 80 سؤالاً — أنتم من يحدد العمق.'
              : 'A structured diagnostic across 12 core segments. Start Quick (~20 minutes), then go Deep on any segment you choose for a far more detailed read — up to 80 questions per segment. You control the depth.'}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(ar ? [
              { label: '12 مجالاً',            sub: 'نطاق سلسلة الإمداد الكامل' },
              { label: 'سريع أو معمّق',        sub: 'أنتم تختارون، لكل مجال' },
              { label: '5 أو حتى 80 سؤالاً',   sub: 'حسب العمق المختار لكل مجال' },
              { label: '~20 دقيقة',            sub: 'للتقييم السريع — المعمّق يستغرق وقتاً أطول' },
            ] : [
              { label: '12 Segments',       sub: 'Full supply chain scope' },
              { label: 'Quick or Deep',     sub: 'You choose, segment by segment' },
              { label: '5 or up to 80 Qs',  sub: 'Depending on depth per segment' },
              { label: '~20 Minutes',       sub: 'Quick mode — Deep takes longer' },
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
        <p className="text-muted-foreground text-sm text-center mb-6">{ar ? '12 مجالاً أساسياً يغطي كامل نطاق سلسلة الإمداد والمشتريات والجودة، بالإضافة إلى وحدة صناعية واحدة من أصل 3 وحدات متخصصة بحسب قطاعكم — أي 15 مجالاً متخصصاً على مستوى المنصة' : '12 core segments spanning the full supply chain, procurement, and quality landscape, plus one of 3 industry-specific modules based on your sector — 15 specialised domains across the platform'}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {CORE_SEGMENTS.map(seg => (
            <div key={seg.id} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-primary leading-tight">{ar ? seg.shortTitleAr : seg.shortTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {seg.questions.length} {ar ? 'أسئلة سريعة' : 'Quick questions'}
                  {seg.subSegments && seg.subSegments.length > 0 && (
                    <> · {ar
                      ? `أو تعميق إلى ${seg.subSegments.reduce((s, x) => s + x.questions.length, 0)} سؤالاً عبر ${seg.subSegments.length} أبعاد`
                      : `or go Deep: up to ${seg.subSegments.reduce((s, x) => s + x.questions.length, 0)} across ${seg.subSegments.length} sub-dimensions`}</>
                  )}
                </p>
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
          <Button size="lg"
            onClick={() => { _testSeedActive ? setPhase('questions') : setPhase('intake'); scrollUp(); }}
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
    const selectedModules = intakeData.industry ? getActiveModules(intakeData.industry, selectedCountryId) : [];
    const sortedCountries  = [...regCountries].sort((a, b) => a.sortOrder - b.sortOrder);
    const selectedCountryRecord = regCountries.find(c => c.id === selectedCountryId);
    // True when the chosen industry would normally trigger the Regulatory
    // module, but it's suppressed because full question content only exists
    // for Saudi Arabia today (#150/#151) — surface this honestly instead of
    // silently doing nothing.
    const regulatoryModuleDef = INDUSTRY_MODULES.find(m => m.id === 'regulatory');
    // True when the chosen industry would normally trigger the Regulatory
    // module, but only the generic international fallback applies because
    // no country-specific content has been authored yet (#151/#153) — i.e.
    // any country other than Saudi Arabia (has full content, #150) or UAE
    // (has authored, pending-review content, #157).
    const regulatorySuppressed = !!intakeData.industry
      && !!regulatoryModuleDef?.moduleFor?.includes(intakeData.industry)
      && selectedCountryId !== 'ksa'
      && selectedCountryId !== 'uae';
    // True when UAE is selected and the industry triggers the Regulatory
    // module — UAE now has its own authored module (#157), but it is
    // pending independent legal/expert review, so we surface that status
    // honestly rather than implying it carries the same sign-off as Saudi.
    const uaeRegulatoryPendingReview = !!intakeData.industry
      && !!regulatoryModuleDef?.moduleFor?.includes(intakeData.industry)
      && selectedCountryId === 'uae';

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
            {prefilledFromDiagnostic && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 mt-4">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-800 font-medium">
                  {ar
                    ? 'تم تعبئة بعض الحقول أدناه تلقائيًا من تشخيصكم المجاني — يمكنكم تعديلها بحرية.'
                    : "We've pre-filled some fields below from your free Diagnostic — feel free to change them."}
                </p>
              </div>
            )}
          </div>

          {/* Country selection (#150) — drives which regulatory content is personalised in below */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">{ar ? 'الدولة' : 'Country'}</h3>
            </div>
            {sortedCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ar ? 'جارٍ تحميل قائمة الدول...' : 'Loading countries...'}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sortedCountries.map(c => {
                  const selected = selectedCountryId === c.id;
                  return (
                    <button
                      key={c.id}
                      data-testid={`intake-country-${c.id}`}
                      onClick={() => setIntakeData(d => ({ ...d, country: c.id }))}
                      className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-150
                        ${selected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <p className={`font-semibold text-sm leading-tight ${selected ? 'text-primary' : 'text-foreground'}`}>
                        {ar ? c.nameAr : c.name}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${c.coverageLevel === 'full' ? 'text-accent' : c.coverageLevel === 'partial' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {c.coverageLevel === 'full'
                          ? (ar ? 'تغطية تنظيمية كاملة' : 'Full regulatory coverage')
                          : c.coverageLevel === 'partial'
                          ? (ar ? 'محتوى متاح — قيد المراجعة' : 'Live — pending review')
                          : (ar ? 'قريبًا' : 'Coming soon')}
                      </p>
                      {selected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {regulatorySuppressed && selectedCountryRecord && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-900">
                  <span className="font-bold">
                    {ar
                      ? 'تمت إضافة وحدة "الامتثال العامة (دولي)" — أسئلة عامة غير مرتبطة بقانون سعودي، وليست بديلاً عن الاستشارة القانونية المحلية. '
                      : 'A general "Compliance (International)" module has been added — country-agnostic questions, not Saudi rules, and not a substitute for local legal advice. '}
                  </span>
                  {ar ? (selectedCountryRecord.notesAr || selectedCountryRecord.notes) : (selectedCountryRecord.notes)}
                </p>
              </div>
            )}
            {uaeRegulatoryPendingReview && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-teal-700" />
                <p className="text-sm text-teal-900">
                  <span className="font-bold">
                    {ar
                      ? 'تمت إضافة وحدة امتثال خاصة بالإمارات (نفاس، القيمة المضافة المحلية، الجمارك، ESMA، المشتريات الحكومية، الحلال، حماية البيانات). '
                      : 'A UAE-specific compliance module has been added (Emiratisation/Nafis, ICV, customs, ESMA, government procurement, halal, data protection). '}
                  </span>
                  {ar
                    ? 'المحتوى مُعَدّ من مصادر رسمية للجهات التنظيمية لكنه قيد المراجعة القانونية/الخبيرة المستقلة، وليس بديلاً عن الاستشارة القانونية المحلية.'
                    : 'Content is drawn from official regulator sources but is pending independent legal/expert review, and is not a substitute for local legal advice.'}
                </p>
              </div>
            )}
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
                const modules  = getActiveModules(ind.id, selectedCountryId);
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
                    {modules.length > 0 && (
                      <p className="text-[10px] text-accent font-bold mt-1 flex items-center gap-1 flex-wrap">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        {modules.map((m, i) => (ar ? m.shortTitleAr : m.shortTitle)).join(' · ')}
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
            {selectedModules.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedModules.map(m => (
                  <div key={m.id} className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                    <m.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: m.color }} />
                    <p className="text-sm text-foreground">
                      <span className="font-bold text-accent">{ar ? `وحدة ${m.shortTitleAr}` : `${m.shortTitle} module`}</span>
                      {ar ? ' ستُضاف تلقائيًا إلى تقييمكم.' : ' will be automatically added to your assessment.'}
                    </p>
                  </div>
                ))}
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
              onClick={() => {
                // Preserve existing picker scope and answers — clearing happens only
                // in the picker confirm handler when the scope key actually changes.
                setPhase('picker');
                setSegIdx(0);
                scrollUp();
              }}
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
     PICKER — segment & sub-dimension scope selection
  ════════════════════════════════════════════════════════════════════════ */
  if (phase === 'picker') {
    const canConfirm = selectedSegmentIds.length > 0 &&
      selectedSegmentIds.every(id => (selectedSubSegIds[id]?.length ?? 0) > 0);

    const totalSelectedQuestions = activeSegments
      .filter(s => selectedSegmentIds.includes(s.id))
      .reduce((sum, s) => sum + (selectedSubSegIds[s.id]?.length ?? 5), 0);

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen" style={{ scrollMarginTop: 80 }}>
        <div className="container mx-auto px-4 py-10 max-w-3xl">

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-primary">
                  {ar ? 'نطاق التقييم' : 'Assessment Scope'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ar
                    ? 'اختر المجالات والأبعاد التي تريد تقييمها — يمكنك تقييم الكل أو التركيز على ما يهمّك.'
                    : 'Choose which segments and dimensions to include — assess all or focus on what matters most.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-primary">{selectedSegmentIds.filter(id => activeSegments.some(s => s.id === id)).length}</span>
                {' '}{ar ? 'من' : 'of'}{' '}
                <span className="font-bold">{activeSegments.length}</span>
                {' '}{ar ? 'مجالات' : 'segments'}{' · '}
                <span className="font-bold text-primary">{totalSelectedQuestions}</span>
                {' '}{ar ? 'سؤالاً' : 'questions'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSegmentIds(activeSegments.map(s => s.id));
                    setSelectedSubSegIds(prev => {
                      const next = { ...prev };
                      activeSegments.forEach(s => { next[s.id] = [0, 1, 2, 3, 4]; });
                      return next;
                    });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {ar ? 'تحديد الكل' : 'Select all'}
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  onClick={() => setSelectedSegmentIds([])}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  {ar ? 'إلغاء الكل' : 'Clear all'}
                </button>
              </div>
            </div>
          </div>

          {/* Segment cards */}
          <div className="space-y-2.5 mb-8">
            {activeSegments.map(seg => {
              const isSelected = selectedSegmentIds.includes(seg.id);
              const selQs      = selectedSubSegIds[seg.id] ?? [0, 1, 2, 3, 4];
              const isExpanded = expandedPickerSegs.has(seg.id);
              const isDeep      = deepSegIds.has(seg.id);
              const canGoDeep   = !!seg.subSegments && seg.subSegments.length > 0;
              const deepQTotal  = canGoDeep ? seg.subSegments!.reduce((s, sub) => s + sub.questions.length, 0) : 0;

              return (
                <div
                  key={seg.id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${isSelected ? 'border-primary/30' : 'border-border opacity-60'}`}
                >
                  {/* Segment row */}
                  <div className="flex items-center gap-3 px-4 py-3.5">

                    {/* Checkbox */}
                    <button
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSegmentIds(prev => prev.filter(id => id !== seg.id));
                        } else {
                          setSelectedSegmentIds(prev => [...prev, seg.id]);
                          setSelectedSubSegIds(prev => ({ ...prev, [seg.id]: [0, 1, 2, 3, 4] }));
                        }
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                      <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
                    </div>

                    {/* Title + sub-count */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm leading-snug ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {ar ? seg.titleAr : seg.title}
                      </p>
                      {isSelected && (
                        <p className="text-xs text-muted-foreground">
                          {isDeep
                            ? (ar
                                ? `تقييم معمّق · ${seg.subSegments!.length} أبعاد فرعية · ${deepQTotal} سؤالاً`
                                : `Deep · ${seg.subSegments!.length} sub-dimensions · ${deepQTotal} questions`)
                            : `${selQs.length}${' '}${ar ? 'من 5 أبعاد' : 'of 5 dimensions'}`}
                        </p>
                      )}
                    </div>

                    {/* Go deeper toggle */}
                    {isSelected && canGoDeep && (
                      <button
                        onClick={() => setDeepSegIds(prev => {
                          const next = new Set(prev);
                          if (next.has(seg.id)) next.delete(seg.id); else next.add(seg.id);
                          return next;
                        })}
                        title={ar
                          ? `${seg.subSegments!.length} أبعاد فرعية · ${deepQTotal} سؤالاً`
                          : `${seg.subSegments!.length} sub-dimensions · ${deepQTotal} questions`}
                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                          isDeep ? 'bg-accent text-white border-accent' : 'bg-white text-muted-foreground border-border hover:border-accent/50 hover:text-accent'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {isDeep ? (ar ? 'معمّق' : 'Deep') : (ar ? 'تعميق' : 'Go deeper')}
                      </button>
                    )}

                    {/* Expand toggle (flat-question subset — Quick mode only) */}
                    {isSelected && !isDeep && (
                      <button
                        onClick={() => setExpandedPickerSegs(prev => {
                          const next = new Set(prev);
                          if (next.has(seg.id)) next.delete(seg.id); else next.add(seg.id);
                          return next;
                        })}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                      >
                        {ar ? 'الأبعاد' : 'Dimensions'}
                        {isExpanded
                          ? <ChevronLeft className="w-3 h-3 rotate-90 rtl:rotate-90" />
                          : <ChevronRight className="w-3 h-3 rtl:-rotate-90" />}
                      </button>
                    )}
                  </div>

                  {/* Sub-question toggles (Quick mode only) */}
                  {isSelected && isExpanded && !isDeep && (
                    <div className="border-t border-border px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          {ar ? 'الأبعاد الفرعية' : 'Sub-dimensions'}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedSubSegIds(prev => ({ ...prev, [seg.id]: [0, 1, 2, 3, 4] }))}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >{ar ? 'الكل' : 'All'}</button>
                          <button
                            onClick={() => setSelectedSubSegIds(prev => ({ ...prev, [seg.id]: [] }))}
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                          >{ar ? 'لا شيء' : 'None'}</button>
                        </div>
                      </div>
                      {[0, 1, 2, 3, 4].map(qi => {
                        const subSeg   = seg.subSegments?.[qi];
                        const label    = subSeg ? (ar ? subSeg.titleAr : subSeg.title) : (ar ? `السؤال ${qi + 1}` : `Question ${qi + 1}`);
                        const qSelected = selQs.includes(qi);
                        return (
                          <button
                            key={qi}
                            onClick={() => {
                              setSelectedSubSegIds(prev => {
                                const cur  = prev[seg.id] ?? [0, 1, 2, 3, 4];
                                const next = qSelected
                                  ? cur.filter(q => q !== qi)
                                  : [...cur, qi].sort((a, b) => a - b);
                                return { ...prev, [seg.id]: next };
                              });
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${qSelected ? 'bg-primary/5 border border-primary/20' : 'bg-muted/40 border border-transparent hover:bg-muted'}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${qSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                              {qSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
                            </div>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ backgroundColor: seg.color + 'CC' }}>
                              {qi + 1}
                            </div>
                            <span className={`text-xs font-medium leading-tight flex-1 text-start ${qSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                      {selQs.length === 0 && (
                        <p className="text-xs text-amber-600 font-medium pt-1">
                          {ar ? '⚠ حدّد بُعداً واحداً على الأقل، أو أزل تحديد هذا المجال.' : '⚠ Select at least one dimension, or deselect this segment.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => { setPhase('intake'); scrollUp(); }} className="gap-2">
              {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {ar ? 'بيانات المؤسسة' : 'Organisation Info'}
            </Button>
            <div className="text-center">
              {selectedSegmentIds.length === 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  {ar ? 'حدد مجالاً واحداً على الأقل.' : 'Select at least one segment.'}
                </p>
              )}
              {selectedSegmentIds.length > 0 && !canConfirm && (
                <p className="text-xs text-amber-600 font-medium">
                  {ar ? 'كل مجال محدد يحتاج بُعداً واحداً على الأقل.' : 'Each selected segment needs at least one dimension.'}
                </p>
              )}
              {canConfirm && Object.keys(answers).length > 0 &&
               computeScopeKey(selectedSegmentIds, selectedSubSegIds, deepSegIds) !== committedScopeKey && (
                <p className="text-xs text-amber-600 font-medium" data-testid="picker-scope-change-warning">
                  {ar
                    ? '⚠ تغيير النطاق سيمسح إجاباتك الحالية.'
                    : '⚠ Changing scope will clear your current answers.'}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                const newKey = computeScopeKey(selectedSegmentIds, selectedSubSegIds, deepSegIds);
                if (newKey !== committedScopeKey && Object.keys(answers).length > 0) {
                  setAnswers({});
                }
                setCommittedScopeKey(newKey);
                setPhase('questions');
                setSegIdx(0);
                scrollUp();
              }}
              disabled={!canConfirm}
              data-testid="button-picker-confirm"
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
              {ar ? 'ابدأ التقييم' : 'Start Assessment'}
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
    const seg         = scopedSegments[segIdx];
    const segComplete = currentSegComplete();
    const isSegDeep    = !!seg?.subSegments && deepSegIds.has(seg.id);

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
                <p className="text-xs text-muted-foreground font-medium">{ar ? `المجال ${segIdx + 1} من ${scopedSegments.length}` : `Segment ${segIdx + 1} of ${scopedSegments.length}`}</p>
                <p className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">{answeredCount}</span>/{totalQuestions} {ar ? 'مُجاب عنها' : 'answered'}
            </div>
          </div>
          <div className="container mx-auto px-4 pb-2.5 flex gap-1.5">
            {scopedSegments.map((s, i) => {
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
          {seg.moduleFor && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs font-semibold text-accent">
                {ar
                  ? `وحدة ${seg.shortTitleAr} — مُضافة بناءً على قطاعكم`
                  : `${seg.shortTitle} Module — added based on your industry`}
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ar ? `المجال ${segIdx + 1}` : `Segment ${segIdx + 1}`}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${isSegDeep ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {isSegDeep ? (ar ? 'تقييم معمّق' : 'Deep') : (ar ? 'تقييم سريع' : 'Quick')}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-primary">{ar ? seg.titleAr : seg.title}</h2>
                </div>
              </div>

              {/* Regional coverage note — regulatory content is inherently country-specific (#118, #150).
                  Live from /api/regulatory/countries rather than a hardcoded list, so this reflects
                  the actual DB-backed Verified/Pending-Review/Roadmap status per country (#154). */}
              {(seg.id === 'regulatory' || seg.id === 'regulatory-uae' || seg.id === 'regulatory-general') && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
                    {ar ? 'تغطية الدول' : 'Country Coverage'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...regCountries].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => (
                      <span key={c.id}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.coverageLevel === 'full' ? 'bg-emerald-100 text-emerald-700' :
                          c.coverageLevel === 'partial' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 text-slate-600'
                        }`}
                        title={ar ? (c.notesAr || c.notes || '') : (c.notes || '')}>
                        {ar ? c.nameAr : c.name} — {c.coverageLevel === 'full' ? (ar ? 'كامل' : 'Full') : c.coverageLevel === 'partial' ? (ar ? 'جزئي' : 'Partial') : (ar ? 'قيد التطوير' : 'Roadmap')}
                      </span>
                    ))}
                  </div>
                  {seg.id === 'regulatory' ? (
                    <p className="text-xs text-blue-700/80 mt-2">
                      {ar
                        ? 'وحدة الامتثال التنظيمي هذه مبنية بعمق للسعودية اليوم؛ بقية الوحدات الـ14 تستخدم أطراً عالمية (ISO وSCOR وDMAIC وغيرها) وتنطبق عالميًا فعليًا.'
                        : "This regulatory module is built deep for Saudi Arabia today; the other 14 segments use globally portable frameworks (ISO, SCOR, DMAIC, and others) and already apply worldwide."}
                    </p>
                  ) : seg.id === 'regulatory-uae' ? (
                    <p className="text-xs text-blue-700/80 mt-2">
                      {ar
                        ? 'هذه وحدة امتثال خاصة بالإمارات (نفاس/التوطين، القيمة المضافة المحلية، الجمارك، ESMA، المشتريات الحكومية، الحلال، قانون حماية البيانات) مبنية من مصادر رسمية للجهات التنظيمية. تنبيه: المحتوى مُعَدّ حديثًا وقيد المراجعة القانونية/الخبيرة المستقلة — ولم يوقّع عليه بعد مراجع بشري مُسمّى، وليس بديلاً عن الاستشارة القانونية المحلية.'
                        : "This is a UAE-specific compliance module (Emiratisation/Nafis, ICV, customs, ESMA, government procurement, halal, PDPL) built from official regulator sources. Flag: this content was freshly authored and is pending independent legal/expert review — no named human reviewer has signed off yet, and it is not a substitute for local legal advice."}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-700/80 mt-2">
                      {ar
                        ? 'هذه وحدة امتثال عامة دولية — أسئلة غير مرتبطة بقانون أي دولة محددة، وليست بديلاً عن استشارة قانونية محلية. ستُستبدَل تدريجيًا بمحتوى مُعتمَد خاص بكل دولة (قطر والأردن وعُمان والبحرين تاليًا) مع اكتماله ومراجعته.'
                        : "This is a general international compliance module — country-agnostic questions, not tied to any specific nation's law, and not a substitute for local legal advice. It will be progressively replaced by reviewed, country-specific content (Qatar, Jordan, Oman, Bahrain next) as each is completed."}
                    </p>
                  )}
                </div>
              )}

              {/* Questions — Deep mode: grouped by sub-segment, 3-part answer keys */}
              {isSegDeep && seg.subSegments && seg.subSegments.map((sub, subIdx) => (
                <div key={sub.id} className="mb-7">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0" style={{ backgroundColor: seg.color + 'CC' }}>
                      {subIdx + 1}
                    </div>
                    <h3 className="font-bold text-primary text-sm">{ar ? sub.titleAr : sub.title}</h3>
                    <FrameworkBadge frameworks={sub.frameworks} lang={ar ? 'ar' : 'en'} />
                  </div>
                  {(sub.hint || sub.hintAr) && (
                    <p className="text-xs text-muted-foreground mb-3 px-1">{ar ? sub.hintAr : sub.hint}</p>
                  )}
                  {sub.questions.map((question, qi) => {
                    const val = answers[`${segIdx}-${subIdx}-${qi}`];
                    return (
                      <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
                        <div className="flex items-start gap-3 p-5 pb-4 border-b border-border">
                          <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{qi + 1}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm leading-relaxed">{ar ? question.qAr : question.q}</p>
                            <FrameworkBadge frameworks={question.frameworks ?? sub.frameworks} lang={ar ? 'ar' : 'en'} />
                          </div>
                        </div>

                        <div className="divide-y divide-border">
                          {SCALE_LABELS.map((s, li) => {
                            const selected = val === s.value;
                            return (
                              <button
                                key={s.value}
                                data-testid={`answer-${segIdx}-${subIdx}-${qi}-${s.value}`}
                                onClick={() => setAnswers(prev => ({ ...prev, [`${segIdx}-${subIdx}-${qi}`]: s.value }))}
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
                </div>
              ))}

              {/* Questions — Quick mode: flat 5-question layer, 2-part answer keys */}
              {!isSegDeep && segQuestionIndices(seg.id).map((qi, displayIdx) => {
                const question = seg.questions[qi];
                const val = answers[`${segIdx}-${qi}`];
                return (
                  <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
                    <div className="flex items-start gap-3 p-5 pb-4 border-b border-border">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{displayIdx + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm leading-relaxed">{ar ? question.qAr : question.q}</p>
                        <FrameworkBadge frameworks={seg.subSegments?.[qi]?.frameworks ?? question.frameworks ?? seg.frameworks} lang={ar ? 'ar' : 'en'} />
                      </div>
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
                  {segIdx === 0 ? (ar ? 'نطاق التقييم' : 'Assessment Scope') : (ar ? 'السابق' : 'Previous')}
                </Button>
                <div className="text-center">
                  {!segComplete && (
                    <p className="text-xs text-muted-foreground">{ar ? 'أجب عن جميع الأسئلة للمتابعة' : `Answer all ${segQuestionCount(seg)} questions to continue`}</p>
                  )}
                </div>
                <Button onClick={handleNext} disabled={!segComplete}
                  data-testid="button-maturity-next"
                  className={`gap-2 ${segIdx === scopedSegments.length - 1 ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-white font-bold`}>
                  {segIdx === scopedSegments.length - 1
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

      {/* ── Print-only page header (hidden on screen) ────────────────────── */}
      <div
        className="print-only"
        dir={ar ? 'rtl' : 'ltr'}
        style={{
          padding: '0 0 14px',
          borderBottom: '3px solid #082C6B',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: '18px', color: '#082C6B', letterSpacing: '-0.5px' }}>
            I Supply Chain · ISC
          </div>
          <div style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Ma'in Alhaqash MCIPS · CPSM · MSc · MIPP
          </div>
        </div>
        <div style={{ textAlign: ar ? 'left' : 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#C9A84C' }}>
            {ar ? 'سري — للاستخدام الداخلي فقط' : 'Confidential — Internal Use Only'}
          </div>
          <div style={{ fontSize: '10px', color: '#888' }}>
            {new Date().toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {selectedIndustryLabel ? ` · ${ar ? selectedIndustryLabel.labelAr : selectedIndustryLabel.label}` : null}
            {selectedSizeLabel ? ` · ${ar ? selectedSizeLabel.labelAr : selectedSizeLabel.label}` : null}
          </div>
        </div>
      </div>

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
              {activeModules.map(m => (
                <span key={m.id} className="inline-flex items-center gap-1.5 bg-accent/30 rounded-full px-3 py-1 text-xs font-semibold text-accent">
                  <Sparkles className="w-3 h-3" />
                  {ar ? `+ ${m.shortTitleAr}` : `+ ${m.shortTitle}`}
                </span>
              ))}
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

          {/* Weighted-score indicator — shown only when sub-segment answers drive the score */}
          {isWeightedScore && selectedIndustryLabel && (
            <p
              data-testid="weighted-score-badge"
              className="mt-3 text-white/55 text-xs flex items-center justify-center gap-1.5"
              title={ar
                ? `مُرجَّح لقطاع ${selectedIndustryLabel.labelAr} — المجالات الفرعية الأكثر أهمية لقطاعكم تحمل وزناً أعلى.`
                : `Weighted for ${selectedIndustryLabel.label} — sub-segments most relevant to your sector carry higher weight.`}
            >
              <span aria-hidden>⚖</span>
              {ar
                ? `مُرجَّح لقطاع ${selectedIndustryLabel.labelAr} — المجالات الفرعية الأكثر أهمية لقطاعكم تحمل وزناً أعلى.`
                : `Weighted for ${selectedIndustryLabel.label} — sub-segments most relevant to your sector carry higher weight.`}
            </p>
          )}

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

        {/* ── Platform Journey context (#165, 21 Aug 2026) ────────────────────
            Additive narrative layer only. Ties this Maturity Assessment to the
            Visibility -> Control -> Intelligence -> Decision -> Prediction
            platform-capability ladder introduced on the homepage (Home.tsx).
            This is a different axis from the Reactive->Optimised process-
            maturity score above (MATURITY_LEVELS in maturityScoring.ts) --
            that enum is reused elsewhere in the app and is untouched here.
            Prediction stays honestly marked as roadmap, not live, per the
            platform's standing "never fake it, stand ready" rule. ── */}
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] px-5 py-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/50 mb-4">
            {ar ? 'موقع هذا التقييم في مسار المنصة' : 'Where This Assessment Fits in Your Platform Journey'}
          </p>
          <div className="flex items-center flex-wrap gap-1 mb-4">
            {[
              { icon: Eye,         label: ar ? 'الرؤية' : 'Visibility',   state: 'past' as const,    href: '/diagnostic' },
              { icon: ShieldCheck, label: ar ? 'التحكّم' : 'Control',      state: 'current' as const, href: null },
              { icon: Brain,       label: ar ? 'الذكاء' : 'Intelligence', state: 'next' as const,    href: '/command-center' },
              { icon: Scale,       label: ar ? 'القرار' : 'Decision',     state: 'future' as const,  href: '/decision-lab' },
              { icon: Lock,        label: ar ? 'التنبؤ' : 'Prediction',   state: 'locked' as const,  href: null },
            ].map((s, i, arr) => {
              const Icon = s.icon;
              const chip = (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                  s.state === 'current' ? 'bg-primary text-white'
                  : s.state === 'past' ? 'bg-primary/10 text-primary'
                  : s.state === 'locked' ? 'bg-muted/50 text-muted-foreground/50 border border-dashed border-muted-foreground/25'
                  : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                  {s.state === 'current' && <span className="opacity-70 font-medium">{ar ? '(أنتم هنا)' : '(you are here)'}</span>}
                </span>
              );
              return (
                <span key={s.label} className="flex items-center gap-1">
                  {s.href ? <Link href={s.href}>{chip}</Link> : chip}
                  {i < arr.length - 1 && <span className="w-3 h-px bg-border" />}
                </span>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ar
              ? 'يمنحكم هذا التقييم مرحلة "التحكّم" — خط أساس منظم ومقارَن معيارياً. للمراقبة المستمرة والحيّة لنفس المؤشرات، المرحلة التالية هي "الذكاء" عبر برج التحكم.'
              : 'This assessment gives you Control — a structured, benchmarked baseline. For continuous, live monitoring of these same metrics, the next stage is Intelligence via the Control Tower.'}
            {' '}
            <Link href="/command-center" className="text-primary font-semibold hover:underline">
              {ar ? 'استكشفوا برج التحكم ←' : 'Explore the Control Tower →'}
            </Link>
          </p>
        </div>

        {/* ── Restored-from-link notice ─────────────────────────────────────── */}
        {restoredFromToken && (
          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">
              {ar
                ? 'تمت استعادة نتائجكم بنجاح عبر الرابط المرسل إلى بريدكم الإلكتروني.'
                : 'Your results have been restored from your saved link.'}
            </p>
          </div>
        )}

        {/* ── Guest email-my-results banner (unauthenticated users only) ──── */}
        {!user && !_testSeedActive && (
          <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-5">
            <div className="flex items-start gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary text-sm">
                  {ar ? 'احفظ نتائجكم — ستُفقد عند إغلاق المتصفح' : 'Save your results — they\'ll be lost when you close this tab'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ar
                    ? 'أدخل بريدكم الإلكتروني وسنرسل لكم رابطًا للوصول إلى النتائج لمدة 30 يومًا.'
                    : 'Enter your email and we\'ll send you a link to access your results for 30 days.'}
                </p>
              </div>
            </div>
            {guestSaveDone ? (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {ar
                  ? 'تم الإرسال! تحقق من بريدكم الإلكتروني للحصول على الرابط.'
                  : 'Sent! Check your inbox for your results link.'}
              </div>
            ) : (
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGuestSave(); }}
                  placeholder={ar ? 'بريدكم الإلكتروني' : 'your@email.com'}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  dir={ar ? 'rtl' : 'ltr'}
                />
                <Button
                  onClick={handleGuestSave}
                  disabled={guestSaveLoading || !guestEmail.trim()}
                  className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 shrink-0"
                >
                  {guestSaveLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Mail className="w-4 h-4" />}
                  {ar ? 'أرسل الرابط' : 'Email my results'}
                </Button>
              </div>
            )}
            {guestSaveError && (
              <p className="text-xs text-red-600 mt-2">
                {ar ? `خطأ: ${guestSaveError}` : `Error: ${guestSaveError}`}
              </p>
            )}
          </div>
        )}

        {/* ── Coverage indicator ────────────────────────────────────────── */}
        {totalSubSegs > 0 && (
          <MaturityCoverage
            assessedSegments={segsAssessed}
            totalSegments={scopedSegments.length}
            coveredSubSegments={coveredSubSegs}
            totalSubSegments={totalSubSegs}
            industryId={intakeData.industry || undefined}
            industryLabel={ar ? selectedIndustryLabel?.labelAr : selectedIndustryLabel?.label}
          />
        )}

        {/* ── Radar — Command Centre style ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 print-break-before">
          <h2 className="text-xl font-bold text-primary mb-1">
            {ar
              ? `رادار النضج — مقارنة معيارية عبر ${scopedSegments.length} مجالات`
              : `Maturity Radar — ${scopedSegments.length}-Segment Benchmark Comparison`}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {ar
              ? 'نتائجكم (الوضع الراهن) مقارنةً بوسيط الخليج وأفضل ربع — نفس الأسلوب البصري لمركز القيادة.'
              : 'Your scores (As-Is) vs GCC Median and Top Quartile — same visual treatment as the Control Tower.'}
          </p>
          {/* Weighted-score tooltip note — visible when sub-segment weights are active */}
          {isWeightedScore && selectedIndustryLabel && (
            <p
              data-testid="radar-weighted-note"
              className="text-xs text-primary/60 font-medium mb-3 flex items-center gap-1.5"
            >
              <span aria-hidden>⚖</span>
              {ar
                ? `مُرجَّح لقطاع ${selectedIndustryLabel.labelAr} — المجالات الفرعية الأكثر أهمية لقطاعكم تحمل وزناً أعلى.`
                : `Weighted for ${selectedIndustryLabel.label} — sub-segments most relevant to your sector carry higher weight.`}
            </p>
          )}
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="segment" tick={{ fontSize: 11, fontWeight: 600, fill: '#1E3A5F' }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickCount={6} />
              <Radar name={L.topQuartile} dataKey={L.topQuartile} stroke="#10b981" fill="none"    strokeDasharray="3 2" strokeWidth={1.2} />
              <Radar name={L.gccMedian}   dataKey={L.gccMedian}   stroke="#082C6B" fill="none"    strokeDasharray="6 3" strokeWidth={1.5} />
              <Radar name={L.asIs}        dataKey={L.asIs}        stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.4}  strokeWidth={2} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
            </RadarChart>
          </ResponsiveContainer>
          {/* 3-number score summary — mirrors Command Centre BenchmarkTab */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: ar ? 'نتيجتك (الوضع الراهن)' : 'Your Score (As-Is)', value: overallScore.toFixed(2), color: '#C9A84C' },
              { label: ar ? 'وسيط الخليج'            : 'GCC Median',         value: avgGccMedian.toFixed(2), color: '#082C6B' },
              { label: ar ? 'أفضل ربع (الهدف)'       : 'Top Quartile',       value: avgTopQuartile.toFixed(2), color: '#10b981' },
            ].map(c => (
              <div key={c.label} className="text-center rounded-xl border border-border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1 leading-tight">{c.label}</p>
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs text-muted-foreground">{ar ? '/ 5.0 درجة' : '/ 5.0 pts'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gap Analysis — horizontal, weakest-first ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 print-break-before">
          <h2 className="text-xl font-bold text-primary mb-1">
            {ar ? 'تحليل فجوة النضج — الأضعف أولاً' : 'Maturity Gap Analysis — Weakest First'}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {ar
              ? 'مرتّب من الأضعف إلى الأقوى. الوصول إلى وسيط الخليج هو الهدف الأول؛ أفضل ربع هو الهدف الطموح.'
              : 'Ordered weakest-to-strongest. GCC Median is the first improvement milestone; Top Quartile is the stretch target.'}
          </p>
          {/* Weighted-score tooltip note */}
          {isWeightedScore && selectedIndustryLabel && (
            <p
              data-testid="gap-weighted-note"
              className="text-xs text-primary/60 font-medium mb-3 flex items-center gap-1.5"
            >
              <span aria-hidden>⚖</span>
              {ar
                ? `مُرجَّح لقطاع ${selectedIndustryLabel.labelAr} — المجالات الفرعية الأكثر أهمية لقطاعكم تحمل وزناً أعلى.`
                : `Weighted for ${selectedIndustryLabel.label} — sub-segments most relevant to your sector carry higher weight.`}
            </p>
          )}
          <ResponsiveContainer width="100%" height={Math.max(280, scopedSegments.length * 50 + 50)}>
            <BarChart
              layout="vertical"
              data={gapData}
              margin={{ top: 5, right: 55, left: 8, bottom: 5 }}
              barCategoryGap="28%"
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis dataKey="segment" type="category" width={94} tick={{ fontSize: 10, fontWeight: 600, fill: '#1E3A5F' }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={L.topQuartile} fill="#10b981" radius={[0, 2, 2, 0]} barSize={5}  opacity={0.55} />
              <Bar dataKey={L.gccMedian}   fill="#082C6B" radius={[0, 2, 2, 0]} barSize={9}  opacity={0.55} />
              <Bar dataKey={L.asIs}        fill="#C9A84C" radius={[0, 3, 3, 0]} barSize={14}
                label={{ position: 'right', fontSize: 10, fill: '#475569',
                  formatter: (v: number) => (v > 0 ? v.toFixed(1) : '') }}>
                {gapData.map((entry, idx) => (
                  <Cell key={`gap-cell-${idx}`} fill={getLevel(entry[L.asIs] as number).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden print-break-before">
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
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'الثقة' : 'Confidence'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'تعديل' : 'Edit'}</th>
                </tr>
              </thead>
              <tbody>
                {scopedSegments.map((seg, i) => {
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
                        {evidenceList.some(e => e.segId === seg.id) ? (
                          <ConfidenceTierBadge
                            lang={lang}
                            evidence={evidenceList.filter(e => e.segId === seg.id)}
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
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
            {scopedSegments.map((seg, i) => {
              const score       = segScore(i) ?? 0;
              const level       = getLevel(score);
              const rec         = ar ? seg.recommendationsAr[level.label] : seg.recommendations[level.label];
              const gapToBest   = seg.benchmarks.best - score;
              const gapToGcc    = score - seg.benchmarks.gcc;
              const segEvidence = evidenceList.filter(e => e.segId === seg.id);
              return (
                <div key={seg.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${level.border}`}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                      <seg.icon className="w-5 h-5" style={{ color: seg.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap" data-testid={`score-row-${i}`}>
                        <span className="text-primary font-extrabold">{score.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">/5.0</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{ar ? level.labelAr : level.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${deepSegIds.has(seg.id) ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                          {deepSegIds.has(seg.id)
                            ? (ar ? 'معمّق · قابل للتوثيق' : 'Deep · evidence-eligible')
                            : (ar ? 'سريع · إرشادي' : 'Quick · directional')}
                        </span>
                        {segEvidence.length > 0 && (
                          <ConfidenceTierBadge lang={lang} evidence={segEvidence} asPill />
                        )}
                      </div>
                      {!deepSegIds.has(seg.id) && seg.subSegments && seg.subSegments.length > 0 && score > 0 && score < 3.5 && (
                        <button
                          onClick={() => handleDeepenSegment(i)}
                          data-testid={`button-deepen-segment-${i}`}
                          className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-accent hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          {ar ? 'تعميق هذا المجال — تحليل أدق لأولوياتكم' : 'Deepen this segment — sharper read on your priority area'}
                        </button>
                      )}
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
                        {gapToGcc >= 0 ? '↑' : '↓'} {Math.abs(gapToGcc).toFixed(1)} {ar ? 'مقابل وسيط الخليج' : 'vs GCC Median'}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">↑ {gapToBest.toFixed(1)} {ar ? 'للوصول إلى أفضل ربع' : 'to Top Quartile'}</span>
                    </div>
                    {/* ── Mini question/sub-dimension score bar chart ─────────────── */}
                    <div className="mb-3 bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {deepSegIds.has(seg.id)
                          ? (ar ? `أداء الأبعاد الفرعية (${seg.subSegments?.length ?? 0})` : `Sub-dimension scores (${seg.subSegments?.length ?? 0})`)
                          : (ar ? 'أداء الأسئلة الفرعية' : 'Sub-dimension scores')}
                      </p>
                      <ResponsiveContainer width="100%" height={64}>
                        <BarChart
                          data={
                            deepSegIds.has(seg.id) && seg.subSegments
                              ? seg.subSegments.map((sub, subIdx) => {
                                  const vals = sub.questions.map((_, qi) => answers[`${i}-${subIdx}-${qi}`] ?? 0).filter(v => v > 0);
                                  return {
                                    name: ar ? `ب${subIdx + 1}` : `S${subIdx + 1}`,
                                    score: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
                                  };
                                })
                              : segQuestionIndices(seg.id).map((q, di) => ({
                                  name: ar ? `س${di+1}` : `Q${di+1}`,
                                  score: answers[`${i}-${q}`] ?? 0,
                                }))
                          }
                          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                        >
                          <YAxis domain={[0, 5]} hide />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v: number) => [v.toFixed(1), ar ? 'المستوى' : 'Level']}
                            contentStyle={{ fontSize: 11 }}
                          />
                          <Bar dataKey="score" radius={[2, 2, 0, 0]} barSize={20}
                            label={{ position: 'top', fontSize: 8, fill: '#64748b',
                              formatter: (v: number) => (v > 0 ? v.toFixed(v % 1 === 0 ? 0 : 1) : '') }}>
                            {(deepSegIds.has(seg.id) && seg.subSegments ? seg.subSegments : segQuestionIndices(seg.id)).map((_, di) => {
                              const val = deepSegIds.has(seg.id) && seg.subSegments
                                ? (() => {
                                    const sub = seg.subSegments![di];
                                    const vals = sub.questions.map((__, qi) => answers[`${i}-${di}-${qi}`] ?? 0).filter(v => v > 0);
                                    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
                                  })()
                                : answers[`${i}-${segQuestionIndices(seg.id)[di]}`] ?? 1;
                              return <Cell key={`q-cell-${i}-${di}`} fill={getLevel(val).color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rec}</p>

                    {/* ── Evidence upload accordion ──────────────────────── */}
                    {user && currentSnapshotId && (() => {
                      const qualifyingSubs = (seg.subSegments ?? []).filter(ss => ss.evidence);
                      if (qualifyingSubs.length === 0) return null;
                      const isOpen = expandedEvSeg.has(seg.id);
                      const tier = segEvidence.length > 0 ? getSegmentTier(segEvidence) : null;
                      return (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedEvSeg(prev => {
                              const next = new Set(prev);
                              if (next.has(seg.id)) next.delete(seg.id); else next.add(seg.id);
                              return next;
                            })}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <span className="flex items-center gap-2">
                              {ar ? 'إضافة أدلة داعمة' : 'Add supporting evidence'}
                              <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground border border-border">
                                {qualifyingSubs.length}
                              </span>
                              {tier && tier !== 'self_reported' && (
                                <ConfidenceTierBadge lang={lang} evidence={segEvidence} asPill={false} />
                              )}
                            </span>
                            <span className="text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
                          </button>
                          {isOpen && (
                            <div className="mt-2 space-y-3 px-1">
                              {qualifyingSubs.map(ss => (
                                <EvidenceUploadZone
                                  key={ss.id}
                                  lang={lang}
                                  snapshotId={currentSnapshotId}
                                  segId={seg.id}
                                  subSegId={ss.id}
                                  subSegLabel={ss.title}
                                  subSegLabelAr={ss.titleAr}
                                  subSegHint={ss.evidence!.hint}
                                  subSegHintAr={ss.evidence!.hintAr}
                                  existing={evidenceList.find(e => e.subSegId === ss.id) ?? null}
                                  onChanged={fetchEvidence}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI Remedies Panel ───────────────────────────────────────────── */}
        <div className="rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 to-white overflow-hidden print-break-before">
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

              {/* ── 30/60/90 visual timeline ────────────────────────────────────── */}
              {(() => {
                const phases = [
                  { days: 30, items: remediesData.days30, label: ar ? '30 يومًا' : '30 Days', sublabel: ar ? 'الأسس السريعة' : 'Quick Foundations',    color: '#EF4444', bg: '#FEF2F2', border: '#FECACA',  icon: Target },
                  { days: 60, items: remediesData.days60, label: ar ? '60 يومًا' : '60 Days', sublabel: ar ? 'العمليات الرسمية' : 'Formalised Processes', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA',  icon: Clock },
                  { days: 90, items: remediesData.days90, label: ar ? '90 يومًا' : '90 Days', sublabel: ar ? 'التوسّع والقدرة' : 'Scaled Capability',     color: '#0B3D91', bg: '#EFF6FF', border: '#BFDBFE',  icon: CheckCircle2 },
                ];
                return (
                  <>
                    {/* Visual timeline connector */}
                    <div className="relative flex items-start justify-between mb-8 px-6">
                      {/* Gradient line */}
                      <div
                        className="absolute top-5 left-10 right-10 h-0.5"
                        style={{ background: 'linear-gradient(to right, #FECACA, #FED7AA, #BFDBFE)' }}
                      />
                      {phases.map(phase => (
                        <div key={phase.days} className="relative flex flex-col items-center gap-1.5 z-10 flex-1">
                          <div
                            className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white shadow-sm"
                            style={{ borderColor: phase.border, backgroundColor: phase.bg }}
                          >
                            <phase.icon className="w-4 h-4" style={{ color: phase.color }} />
                          </div>
                          <p className="text-sm font-extrabold" style={{ color: phase.color }}>{phase.label}</p>
                          <p className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{phase.sublabel}</p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: phase.color }}
                          >
                            {phase.items.length} {ar
                              ? (phase.items.length === 1 ? 'إجراء' : 'إجراءات')
                              : (phase.items.length === 1 ? 'action' : 'actions')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 3-column card grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {phases.map(col => (
                        <div key={col.days} className="space-y-3">
                          {col.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border p-4"
                              style={{ backgroundColor: col.bg + '99', borderColor: col.border }}
                            >
                              {/* Action title + step number */}
                              <div className="flex items-start gap-2 mb-2">
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                                  style={{ backgroundColor: col.color }}
                                >
                                  {idx + 1}
                                </span>
                                <p className="font-semibold text-foreground text-sm leading-snug flex-1">{item.action}</p>
                              </div>
                              {/* Badges */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {item.framework && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                    {item.framework}
                                  </span>
                                )}
                                {item.effort && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border" style={{ borderColor: col.border, color: col.color }}>
                                    {item.effort}
                                  </span>
                                )}
                              </div>
                              {/* Segment + measurable target */}
                              <div className="flex items-start gap-1.5 flex-wrap">
                                <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 bg-white rounded-full border border-border whitespace-nowrap">
                                  {item.segmentTitle}
                                </span>
                                {item.measurableTarget && (
                                  <span className="text-[10px] text-muted-foreground flex items-start gap-1">
                                    <Target className="w-2.5 h-2.5 text-accent shrink-0 mt-0.5" />
                                    <span>{item.measurableTarget}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {col.items.length === 0 && (
                            <div
                              className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground"
                              style={{ borderColor: col.border }}
                            >
                              {ar ? 'لا توجد إجراءات في هذه المرحلة' : 'No actions in this phase'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* Track roadmap + Regenerate — tracking only makes sense once the
                  plan is actually persisted server-side (logged-in user with a
                  saved snapshot); guests still get Regenerate. */}
              <div className="flex justify-center items-center gap-3 pt-2 flex-wrap">
                {user && currentSnapshotId && (
                  <Link href="/action-tracker">
                    <Button size="sm" className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-white">
                      <ListChecks className="w-3.5 h-3.5" />
                      {ar ? 'تتبّع خطة العمل هذه' : 'Track This Roadmap'}
                    </Button>
                  </Link>
                )}
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

        {/* ── Trend tracking panel (logged-in users with ≥1 snapshot) ── */}
        {user && snapshots.length > 0 && (
          <MaturityTrend
            snapshots={snapshots}
            segmentList={segmentList}
            ar={ar}
            onRetake={handleReset}
          />
        )}

        {/* Priority action plan */}
        <div className="bg-[#082C6B] rounded-3xl p-8 text-white print-break-before">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">{ar ? 'خطة العمل ذات الأولوية' : 'Priority Action Plan'}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {rankWeakest(
              scopedSegments.map((seg, i) => ({ seg, i, score: segScore(i) ?? 0 })),
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link href="/report-generator" onClick={handleGoToReport}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 gap-2">
                <FileText className="w-4 h-4" />
                {ar ? 'توليد تقرير الاستراتيجية' : 'Generate Strategy Report'}
              </Button>
            </Link>
            <Button size="lg" variant="outline"
              className="border-white/60 text-white hover:bg-white/10 font-bold px-6 gap-2"
              onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              {ar ? 'تحميل PDF' : 'Download PDF'}
            </Button>
            <Link href="/consultant">
              <Button size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10 font-bold px-6">
                {ar ? "ناقش النتائج مع مَعِين" : "Discuss Results"} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
            <Button size="lg" variant="outline"
              className="border-white/40 text-white/70 hover:bg-white/10 font-semibold px-6"
              onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" /> {ar ? 'إعادة التقييم' : 'Retake Assessment'}
            </Button>
          </div>
          <style>{`
            /* ── Print: hide screen-only chrome ── */
            @media print {
              header, nav, .no-print,
              [data-testid="feedback-modal"],
              [data-testid="button-generate-remedies"],
              [data-testid="button-maturity-next"],
              .maturity-intro, .maturity-questions { display: none !important; }

              /* Page geometry */
              @page { size: A4; margin: 14mm 18mm; }

              /* Colour fidelity — force backgrounds and colours to print */
              body, html {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              /* Kill all animations so SVGs render synchronously */
              *, *::before, *::after {
                animation-duration: 0.001s !important;
                animation-delay: 0s !important;
                transition-duration: 0.001s !important;
                transition-delay: 0s !important;
              }

              /* Recharts SVG fix — overflow: hidden clips at print boundaries */
              .recharts-wrapper,
              .recharts-surface { overflow: visible !important; }
              .recharts-responsive-container { width: 100% !important; }
              svg { overflow: visible !important; display: block !important; }

              /* Page breaks declared on major sections */
              .print-break-before {
                break-before: page !important;
                page-break-before: always !important;
              }

              /* Show print-only content, hide it on screen */
              .print-only { display: flex !important; }
            }

            /* Hide print-only elements on screen */
            @media screen { .print-only { display: none !important; } }
          `}</style>
        </div>

      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} tool="maturity" />
    </div>
  );
}
