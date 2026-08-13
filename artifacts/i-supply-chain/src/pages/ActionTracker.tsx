/**
 * ActionTracker — client-facing follow-up page for the AI-generated
 * 30/60/90-day remedy roadmap (#19).
 *
 * Deliberately built WITHOUT a new database table. This repo's schema
 * changes require a manual `drizzle-kit push` against production that
 * isn't wired into the deploy pipeline (see maturitySnapshots.ts route
 * comment on the action-status endpoint) — a new table would ship as
 * dead code until someone ran that by hand. Instead, per-item status is
 * stored inside the existing `maturity_snapshots.remedy_actions` JSONB
 * column, under a new `actionStatus` map keyed by a deterministic
 * "{phase}-{index}" composite. This ships and works the moment the code
 * deploys.
 *
 * Closes the loop the "How ISC Compares" table on Command Centre already
 * promises: a diagnosis + roadmap is not the same as follow-through.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';
import {
  Loader2, CheckCircle2, Circle, Clock3, ListChecks, ArrowRight,
  Building2, Calendar, Sparkles, TrendingUp,
} from 'lucide-react';

/* ── Types (self-contained, mirrors the shape already used by Maturity.tsx
   / MaturityTrend.tsx / maturityRemedies.ts — see those files for the
   canonical definitions) ─────────────────────────────────────────────── */

interface RemedyItem {
  segmentTitle:      string;
  subQuestion?:      string;
  specificGap?:      string;
  action:            string;
  framework?:        string;
  measurableTarget?: string;
  effort?:           string;
}

type TrackerStatus = 'not_started' | 'in_progress' | 'done';

interface ActionStatusEntry {
  status:       TrackerStatus;
  notes?:       string | null;
  completedAt?: string | null;
  updatedAt?:   string;
}

interface RemediesData {
  executiveSummary?: string;
  days30?:           RemedyItem[];
  days60?:            RemedyItem[];
  days90?:            RemedyItem[];
  estimatedImpact?:  string;
  actionStatus?:      Record<string, ActionStatusEntry>;
}

interface SnapshotRecord {
  id:            number;
  takenAt:       string;
  industry:      string | null;
  companySize:   string | null;
  overallScore:  string | number;
  remedyActions: RemediesData | null;
}

type Phase = 'days30' | 'days60' | 'days90';
const PHASES: { key: Phase; labelEn: string; labelAr: string; sub: string; subAr: string }[] = [
  { key: 'days30', labelEn: '0–30 Days',  labelAr: '٠–٣٠ يومًا',   sub: 'Quick foundations',    subAr: 'أسس سريعة' },
  { key: 'days60', labelEn: '31–60 Days', labelAr: '٣١–٦٠ يومًا',  sub: 'Formalised processes', subAr: 'عمليات مُهيكلة' },
  { key: 'days90', labelEn: '61–90 Days', labelAr: '٦١–٩٠ يومًا',  sub: 'Scaled capability',    subAr: 'قدرات مُوسَّعة' },
];

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ── Status pill selector ─────────────────────────────────────────────── */

function StatusControl({ status, ar, saving, onChange }: {
  status: TrackerStatus; ar: boolean; saving: boolean; onChange: (s: TrackerStatus) => void;
}) {
  const options: { key: TrackerStatus; en: string; ar: string; icon: React.ReactNode; color: string }[] = [
    { key: 'not_started', en: 'Not Started', ar: 'لم تبدأ',   icon: <Circle className="w-3.5 h-3.5" />,       color: '#94a3b8' },
    { key: 'in_progress', en: 'In Progress', ar: 'قيد التنفيذ', icon: <Clock3 className="w-3.5 h-3.5" />,      color: '#C9A84C' },
    { key: 'done',        en: 'Done',        ar: 'مكتمل',      icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: '#16A34A' },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          disabled={saving}
          onClick={() => onChange(opt.key)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-50"
          style={status === opt.key
            ? { background: `${opt.color}15`, borderColor: opt.color, color: opt.color }
            : { background: 'transparent', borderColor: '#e2e8f0', color: '#94a3b8' }}
        >
          {opt.icon}
          {ar ? opt.ar : opt.en}
        </button>
      ))}
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */

export function ActionTracker() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [savingKey,  setSavingKey]  = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [openNotesKey, setOpenNotesKey] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API_BASE}/maturity/snapshots`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; snapshots?: SnapshotRecord[] }) => {
        if (data.ok && data.snapshots) {
          const withPlan = data.snapshots.filter(s =>
            s.remedyActions && (
              (s.remedyActions.days30?.length ?? 0) > 0 ||
              (s.remedyActions.days60?.length ?? 0) > 0 ||
              (s.remedyActions.days90?.length ?? 0) > 0
            ),
          );
          setSnapshots(withPlan);
          if (withPlan.length > 0) setSelectedId(withPlan[withPlan.length - 1].id);
        }
      })
      .catch(() => { /* leave empty state — handled below */ })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const selected = snapshots.find(s => s.id === selectedId) ?? null;
  const remedies = selected?.remedyActions ?? null;
  const actionStatus = remedies?.actionStatus ?? {};

  const allItems = useMemo(() => {
    if (!remedies) return [];
    const out: { key: string; phase: Phase; item: RemedyItem }[] = [];
    (['days30', 'days60', 'days90'] as Phase[]).forEach(phase => {
      (remedies[phase] ?? []).forEach((item, i) => out.push({ key: `${phase}-${i}`, phase, item }));
    });
    return out;
  }, [remedies]);

  const doneCount  = allItems.filter(({ key }) => actionStatus[key]?.status === 'done').length;
  const totalCount = allItems.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const updateStatus = async (key: string, status: TrackerStatus, notesOverride?: string) => {
    if (!selected) return;
    const notes = notesOverride ?? actionStatus[key]?.notes ?? null;
    setSavingKey(key);

    // Optimistic local update so the UI feels instant
    setSnapshots(prev => prev.map(s => {
      if (s.id !== selected.id || !s.remedyActions) return s;
      return {
        ...s,
        remedyActions: {
          ...s.remedyActions,
          actionStatus: {
            ...(s.remedyActions.actionStatus ?? {}),
            [key]: {
              status, notes,
              completedAt: status === 'done' ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    }));

    try {
      await fetch(`${API_BASE}/maturity/snapshots/${selected.id}/action-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemKey: key, status, notes }),
      });
    } catch { /* optimistic state stands; a refresh reconciles from the server */ }
    setSavingKey(null);
  };

  /* ── Not signed in ── */
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <ListChecks className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'متتبّع خطة العمل' : 'Action Tracker'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لمتابعة خطة العمل الخاصة بك من ٣٠/٦٠/٩٠ يومًا الناتجة عن تقييم النضج.'
            : 'Sign in to track your 30/60/90-day remedy roadmap from the Maturity Assessment.'}
        </p>
        <Link href="/login"><Button size="lg" className="bg-accent hover:bg-accent/90">{ar ? 'تسجيل الدخول' : 'Sign In'}</Button></Link>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── No roadmap yet ── */
  if (snapshots.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <ListChecks className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'متتبّع خطة العمل' : 'Action Tracker'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'لا توجد خطة عمل بعد. أكمل تقييم النضج واطلب خارطة الطريق المدعومة بالذكاء الاصطناعي لتتبّعها هنا.'
            : "No roadmap yet. Complete the Maturity Assessment and generate your AI roadmap, and it'll show up here to track."}
        </p>
        <Link href="/maturity"><Button size="lg" className="bg-accent hover:bg-accent/90 gap-2">
          {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'} <ArrowRight className="w-4 h-4" />
        </Button></Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 200 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-14 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <ListChecks className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'خطة العمل' : 'Action Tracker'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'من التشخيص إلى التنفيذ' : 'From Diagnosis to Follow-Through'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? 'تتبّع تقدّمك عبر خارطة طريق الـ ٣٠/٦٠/٩٠ يومًا الناتجة عن تقييم النضج.'
              : "Track your progress against the 30/60/90-day roadmap your Maturity Assessment generated."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* ── Snapshot picker (only shown when there's more than one) ── */}
        {snapshots.length > 1 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground">{ar ? 'التقييم:' : 'Assessment:'}</span>
            {snapshots.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedId === s.id ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {formatDate(s.takenAt, ar)}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {selected.industry ?? '—'}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(selected.takenAt, ar)}</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> {ar ? 'النتيجة الإجمالية' : 'Overall Score'}: {(+selected.overallScore).toFixed(2)}/5.0</span>
          </div>
        )}

        {/* ── Progress bar ── */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-primary">{ar ? 'التقدّم الإجمالي' : 'Overall Progress'}</span>
            <span className="text-sm font-bold text-primary">{doneCount}/{totalCount} {ar ? 'مكتمل' : 'complete'}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-[#16A34A] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* ── Executive summary ── */}
        {remedies?.executiveSummary && (
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{ar ? 'الملخص التنفيذي' : 'Executive Summary'}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{remedies.executiveSummary}</p>
          </div>
        )}

        {/* ── Three phase columns ── */}
        <div className="grid md:grid-cols-3 gap-6">
          {PHASES.map(phase => {
            const items = allItems.filter(i => i.phase === phase.key);
            const phaseDone = items.filter(i => actionStatus[i.key]?.status === 'done').length;
            return (
              <div key={phase.key}>
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-primary">{ar ? phase.labelAr : phase.labelEn}</h2>
                    <span className="text-xs text-muted-foreground font-semibold">{phaseDone}/{items.length}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{ar ? phase.subAr : phase.sub}</p>
                </div>
                <div className="space-y-3">
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">{ar ? 'لا توجد إجراءات لهذه المرحلة' : 'No actions for this phase'}</p>
                  )}
                  {items.map(({ key, item }) => {
                    const st = actionStatus[key]?.status ?? 'not_started';
                    const isDone = st === 'done';
                    return (
                      <div
                        key={key}
                        className="rounded-xl border p-4 transition-colors"
                        style={{ borderColor: isDone ? '#16A34A40' : '#e2e8f0', background: isDone ? '#16A34A08' : '#fff' }}
                      >
                        <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">{item.segmentTitle}</div>
                        <p className={`text-[13px] font-semibold mb-2 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.action}</p>
                        {item.measurableTarget && (
                          <p className="text-[11px] text-muted-foreground mb-2">🎯 {item.measurableTarget}</p>
                        )}
                        {item.framework && (
                          <div className="inline-block text-[10px] font-semibold text-primary/70 bg-primary/5 rounded px-1.5 py-0.5 mb-2">{item.framework}</div>
                        )}
                        <StatusControl
                          status={st}
                          ar={ar}
                          saving={savingKey === key}
                          onChange={s => updateStatus(key, s)}
                        />
                        <button
                          type="button"
                          className="text-[11px] text-muted-foreground hover:text-primary mt-2 underline"
                          onClick={() => setOpenNotesKey(openNotesKey === key ? null : key)}
                        >
                          {actionStatus[key]?.notes ? (ar ? 'عرض/تعديل الملاحظة' : 'View/edit note') : (ar ? '+ إضافة ملاحظة' : '+ Add note')}
                        </button>
                        {openNotesKey === key && (
                          <textarea
                            className="w-full mt-2 text-xs border border-border rounded-lg p-2 resize-none"
                            rows={2}
                            defaultValue={actionStatus[key]?.notes ?? ''}
                            placeholder={ar ? 'ملاحظات داخلية...' : 'Internal notes...'}
                            onBlur={e => updateStatus(key, st, e.target.value)}
                          />
                        )}
                        {isDone && actionStatus[key]?.completedAt && (
                          <p className="text-[10px] text-green-700 mt-2">
                            {ar ? 'أُنجز في' : 'Completed'} {formatDate(actionStatus[key]!.completedAt!, ar)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {remedies?.estimatedImpact && (
          <div className="mt-8 bg-[#082C6B] rounded-2xl p-6 text-white text-center">
            <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2">{ar ? 'الأثر المُقدَّر' : 'Estimated Impact'}</div>
            <p className="text-sm text-white/85">{remedies.estimatedImpact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
