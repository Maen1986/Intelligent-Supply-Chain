/**
 * Training Needs Assessment Tool
 * Matrix: team members × 8 supply chain domains
 * Columns: Self-rating + Manager-rating per domain
 * Output: skill-gap radar, priority development actions, IDP download, AI Learning Plan
 */
import React, { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { safeSetItem } from '@/lib/storage';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';

/** Stable server-side key for the Training AI plan slot. */
export const TRAINING_TOOL_KEY = 'training' as const;
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface TrainingToolsProps { isAr: boolean; }

const DOMAINS = [
  {
    id: 'strategy',      label: 'Strategy & Planning',        labelAr: 'الاستراتيجية والتخطيط',
    required: 4,
    cips: 'CIPS L4 – Procurement & Supply Operations',
    apics: 'APICS CPIM – Planning & Inventory Basics',
    internal: 'Internal: SC Strategy Workshop',
  },
  {
    id: 'procurement',   label: 'Procurement & Sourcing',      labelAr: 'المشتريات والتوريد',
    required: 4,
    cips: 'CIPS L5 – Advanced Diploma in Procurement',
    apics: 'APICS CSCP – Sourcing & Supplier Management',
    internal: 'Internal: Strategic Sourcing Bootcamp',
  },
  {
    id: 'logistics',     label: 'Logistics & Distribution',    labelAr: 'الخدمات اللوجستية والتوزيع',
    required: 3,
    cips: 'CIPS L4 – Logistics & Operations',
    apics: 'APICS CPIM – Execution & Control of Operations',
    internal: 'Internal: Warehouse & Distribution Fundamentals',
  },
  {
    id: 'risk',          label: 'Risk Management',             labelAr: 'إدارة المخاطر',
    required: 4,
    cips: 'CIPS L5 – Risk in Supply Chains',
    apics: 'APICS CSCP – Supply Chain Risk & Resilience',
    internal: 'Internal: Risk Register & BCP Training',
  },
  {
    id: 'compliance',    label: 'Governance & Compliance',     labelAr: 'الحوكمة والامتثال',
    required: 4,
    cips: 'CIPS L6 – Governance in Procurement',
    apics: 'APICS CSCP – Compliance & Regulatory Module',
    internal: 'Internal: DoA & Policy Awareness Session',
  },
  {
    id: 'digital',       label: 'Digital & Technology',        labelAr: 'الرقمي والتكنولوجيا',
    required: 3,
    cips: 'CIPS L4 – Procurement Technology',
    apics: 'APICS CPIM – ERP & Digital Execution',
    internal: 'Internal: ERP Power-User Programme',
  },
  {
    id: 'sustainability', label: 'Sustainability & ESG',       labelAr: 'الاستدامة وESG',
    required: 3,
    cips: 'CIPS L6 – Sustainable Procurement',
    apics: 'APICS CSCP – Sustainable Supply Chains',
    internal: 'Internal: ESG & Local Content Masterclass',
  },
  {
    id: 'analytics',     label: 'Data & Analytics',            labelAr: 'البيانات والتحليلات',
    required: 3,
    cips: 'ISC Data-Driven Procurement Module',
    apics: 'APICS CSCP – Analytics & Forecasting',
    internal: 'Internal: Power BI for Procurement Dashboard',
  },
];

const LEVEL_LABELS: Record<number, { en: string; ar: string; color: string }> = {
  0: { en: 'Not assessed', ar: 'غير مقيَّم', color: '#e2e8f0' },
  1: { en: 'Beginner',     ar: 'مبتدئ',     color: '#fca5a5' },
  2: { en: 'Developing',   ar: 'ناشئ',       color: '#fcd34d' },
  3: { en: 'Competent',    ar: 'مؤهَّل',    color: '#6ee7b7' },
  4: { en: 'Advanced',     ar: 'متقدّم',    color: '#34d399' },
  5: { en: 'Expert',       ar: 'خبير',       color: '#059669' },
};

/* ── IDP download ── */
function downloadText(filename: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildIDPText(
  members: string[],
  selfScores: Record<string, Record<string, number>>,
  mgrScores: Record<string, Record<string, number>>,
  isAr: boolean,
): string {
  const date = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
  const lines = [
    '═══════════════════════════════════════════════════════',
    isAr ? `   خطة التطوير الفردي (IDP) — ${date}` : `   Individual Development Plan (IDP) — ${date}`,
    '═══════════════════════════════════════════════════════',
    '',
  ];

  members.forEach(member => {
    lines.push(isAr ? `── العضو: ${member} ────────────────────────────` : `── Member: ${member} ────────────────────────────`);
    lines.push('');
    lines.push(isAr
      ? `${'المجال'.padEnd(28)}  ${'ذاتي'.padEnd(8)}  ${'المدير'.padEnd(8)}  ${'الفجوة'.padEnd(8)}  ${'الأولوية'}`
      : `${'Domain'.padEnd(28)}  ${'Self'.padEnd(8)}  ${'Manager'.padEnd(8)}  ${'Gap'.padEnd(8)}  Priority`);
    lines.push('─'.repeat(70));

    const priorityRows: { label: string; labelAr: string; gap: number; cips: string; apics: string; internal: string }[] = [];

    DOMAINS.forEach(d => {
      const self = selfScores[member]?.[d.id] ?? 0;
      const mgr  = mgrScores[member]?.[d.id] ?? 0;
      const effective = mgr > 0 ? Math.round((self + mgr) / 2) : self;
      const gap = effective > 0 ? Math.max(0, d.required - effective) : 0;
      const selfStr = self > 0 ? `${self}/5` : '—';
      const mgrStr  = mgr > 0  ? `${mgr}/5`  : '—';
      const gapStr  = effective > 0 ? (gap > 0 ? `▲ ${gap}` : '✓ Met') : '—';
      const priority = gap >= 2 ? (isAr ? 'عالية' : 'HIGH') : gap === 1 ? (isAr ? 'متوسطة' : 'MED') : (isAr ? 'منخفضة' : 'LOW');
      const domainLabel = isAr ? d.labelAr : d.label;
      lines.push(`  ${domainLabel.padEnd(26)}  ${selfStr.padEnd(8)}  ${mgrStr.padEnd(8)}  ${gapStr.padEnd(8)}  ${effective > 0 ? priority : '—'}`);
      if (gap > 0 && effective > 0) priorityRows.push({ label: d.label, labelAr: d.labelAr, gap, cips: d.cips, apics: d.apics, internal: d.internal });
    });

    if (priorityRows.length > 0) {
      priorityRows.sort((a, b) => b.gap - a.gap);
      lines.push('');
      lines.push(isAr ? '  مسارات التعلّم الموصى بها:' : '  Recommended Learning Paths:');
      priorityRows.forEach((r, i) => {
        lines.push('');
        lines.push(isAr ? `  ${i + 1}. ${r.labelAr}` : `  ${i + 1}. ${r.label}`);
        lines.push(`     CIPS:     ${r.cips}`);
        lines.push(`     APICS:    ${r.apics}`);
        lines.push(`     ${isAr ? 'داخلي:' : 'Internal:'} ${r.internal}`);
      });
    }
    lines.push('');
    lines.push('');
  });

  lines.push('═══════════════════════════════════════════════════════');
  lines.push(isAr ? 'تمت الطباعة بواسطة منظومة سلسلة الإمداد الذكية' : 'Generated by i-Supply Chain Platform');
  return lines.join('\n');
}

export function TrainingNeedsAssessment({ isAr }: TrainingToolsProps) {
  const SK_MEMBERS   = 'isc-tool-training-members';
  const SK_SCORES    = 'isc-tool-training-scores';
  const SK_MGR       = 'isc-tool-training-mgr-scores';

  const [members, setMembers] = useState<string[]>(() => {
    try { const s = localStorage.getItem(SK_MEMBERS); return s ? JSON.parse(s) : ['Team Member 1']; } catch { return ['Team Member 1']; }
  });
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(() => {
    try { const s = localStorage.getItem(SK_SCORES); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [mgrScores, setMgrScores] = useState<Record<string, Record<string, number>>>(() => {
    try { const s = localStorage.getItem(SK_MGR); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [importLog, setImportLog] = useState<string[] | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* ── Tab navigation ── */
  type TrainingTab = 'matrix' | 'radar' | 'actions' | 'ai';
  const TRAINING_TABS: { id: TrainingTab; icon: string; label: string; labelAr: string }[] = [
    { id: 'matrix',  icon: '📋', label: 'Assessment Matrix',      labelAr: 'مصفوفة التقييم'        },
    { id: 'radar',   icon: '📊', label: 'Skill-Gap Radar',        labelAr: 'رادار الكفاءات'         },
    { id: 'actions', icon: '🎯', label: 'Development Actions',    labelAr: 'إجراءات التطوير'        },
    { id: 'ai',      icon: '✨', label: 'AI Learning Plan',       labelAr: 'خطة التعلّم AI'         },
  ];
  const [activeTab, setActiveTab] = useState<TrainingTab>('matrix');
  const tabListRef = useRef<HTMLDivElement>(null);
  const handleTabKey = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % TRAINING_TABS.length
      : (idx - 1 + TRAINING_TABS.length) % TRAINING_TABS.length;
    setActiveTab(TRAINING_TABS[next].id);
    (tabListRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  }, []);

  const persistMembers = (m: string[]) => { safeSetItem(SK_MEMBERS, JSON.stringify(m)); };
  const persistScores  = (s: Record<string, Record<string, number>>) => { safeSetItem(SK_SCORES, JSON.stringify(s)); };
  const persistMgr     = (s: Record<string, Record<string, number>>) => { safeSetItem(SK_MGR, JSON.stringify(s)); };

  /* ── CSV template ── */
  const downloadTrainingTemplate = () => {
    const selfHeaders = DOMAINS.map(d => `Self: ${d.label}`);
    const mgrHeaders  = DOMAINS.map(d => `Manager: ${d.label}`);
    const headers = ['Member Name', ...selfHeaders, ...mgrHeaders];
    const example = ['Team Member 1', ...DOMAINS.map(() => '3'), ...DOMAINS.map(() => '3')];
    downloadCsv([headers, example], 'training-assessment-template.csv');
  };

  /* ── CSV import ── */
  const handleTrainingImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: csvRows, errors } = parseCsvFile(text, ['Member Name']);
      if (errors.length > 0 && csvRows.length === 0) { setImportLog(['Import failed:', ...errors]); return; }
      const log: string[] = [...errors];
      const nextMembers = [...members];
      const nextScores  = { ...scores };
      const nextMgr     = { ...mgrScores };
      const existingSet = new Set(members);
      const dupNames    = csvRows.map(r => r['Member Name']?.trim()).filter(n => n && existingSet.has(n));
      let overwrite = false;
      if (dupNames.length > 0) {
        overwrite = window.confirm(
          `${dupNames.length} member(s) already exist: ${dupNames.slice(0, 3).join(', ')}${dupNames.length > 3 ? '…' : ''}.\nOverwrite existing scores? OK = overwrite, Cancel = skip duplicates.`
        );
      }
      let count = 0;
      csvRows.forEach((row, i) => {
        const name = row['Member Name']?.trim();
        if (!name) { log.push(`Row ${i + 2}: Member Name is empty — skipped.`); return; }
        const domainSelf: Record<string, number> = {};
        const domainMgr:  Record<string, number> = {};
        DOMAINS.forEach(d => {
          const selfVal = row[`Self: ${d.label}`]?.trim() ?? row[d.label]?.trim();
          const mgrVal  = row[`Manager: ${d.label}`]?.trim();
          if (selfVal !== undefined && selfVal !== '') {
            const num = parseInt(selfVal, 10);
            if (num >= 1 && num <= 5) domainSelf[d.id] = num;
            else log.push(`Row ${i + 2}: "Self: ${d.label}" value "${selfVal}" must be 1–5 — ignored.`);
          }
          if (mgrVal !== undefined && mgrVal !== '') {
            const num = parseInt(mgrVal, 10);
            if (num >= 1 && num <= 5) domainMgr[d.id] = num;
            else log.push(`Row ${i + 2}: "Manager: ${d.label}" value "${mgrVal}" must be 1–5 — ignored.`);
          }
        });
        const existingIdx = nextMembers.indexOf(name);
        if (existingIdx >= 0) {
          if (overwrite) {
            nextScores[name] = { ...(nextScores[name] ?? {}), ...domainSelf };
            nextMgr[name]    = { ...(nextMgr[name]    ?? {}), ...domainMgr };
            count++;
          }
        } else {
          if (nextMembers.length < 8) {
            nextMembers.push(name);
            nextScores[name] = domainSelf;
            nextMgr[name]    = domainMgr;
            count++;
          } else {
            log.push(`Row ${i + 2}: "${name}" — max 8 members reached, skipped.`);
          }
        }
      });
      setMembers(nextMembers); persistMembers(nextMembers);
      setScores(nextScores);   persistScores(nextScores);
      setMgrScores(nextMgr);   persistMgr(nextMgr);
      log.unshift(`✓ Imported ${count} member(s).`);
      setImportLog(log);
    };
    reader.readAsText(file);
  };

  const addMember = () => {
    const next = [...members, `Member ${members.length + 1}`];
    setMembers(next); persistMembers(next);
  };
  const updateMember = (i: number, name: string) => {
    const next = members.map((m, mi) => mi === i ? name : m);
    setMembers(next); persistMembers(next);
  };
  const removeMember = (i: number) => {
    const next = members.filter((_, mi) => mi !== i);
    setMembers(next); persistMembers(next);
  };
  const setScore = (member: string, domain: string, val: number) => {
    setScores(prev => {
      const next = { ...prev, [member]: { ...(prev[member] ?? {}), [domain]: val } };
      persistScores(next); return next;
    });
  };
  const setMgrScore = (member: string, domain: string, val: number) => {
    setMgrScores(prev => {
      const next = { ...prev, [member]: { ...(prev[member] ?? {}), [domain]: val } };
      persistMgr(next); return next;
    });
  };

  /* ── Domain averages (self + manager combined) ── */
  const domainStats = DOMAINS.map(d => {
    const selfVals = members.map(m => scores[m]?.[d.id] ?? 0).filter(v => v > 0);
    const mgrVals  = members.map(m => mgrScores[m]?.[d.id] ?? 0).filter(v => v > 0);
    const selfAvg  = selfVals.length > 0 ? selfVals.reduce((s, v) => s + v, 0) / selfVals.length : 0;
    const mgrAvg   = mgrVals.length  > 0 ? mgrVals.reduce((s, v)  => s + v, 0) / mgrVals.length  : 0;
    const effectiveAvg = selfAvg > 0 && mgrAvg > 0 ? (selfAvg + mgrAvg) / 2 : (selfAvg || mgrAvg);
    return { domain: d, selfAvg, mgrAvg, effectiveAvg };
  });

  /* ── Priority gaps (effective avg < required level) ── */
  const priorityGaps = domainStats
    .filter(({ effectiveAvg, domain }) => effectiveAvg > 0 && effectiveAvg < domain.required)
    .sort((a, b) => (a.effectiveAvg - a.domain.required) - (b.effectiveAvg - b.domain.required));

  /* ── Radar data: self avg vs required ── */
  const radarData = DOMAINS.map(d => {
    const stat = domainStats.find(s => s.domain.id === d.id)!;
    return {
      dimension: isAr ? d.labelAr : d.label,
      [isAr ? 'التقييم الذاتي' : 'Self Rating']: stat.selfAvg > 0 ? parseFloat(stat.selfAvg.toFixed(1)) : undefined,
      [isAr ? 'تقييم المدير' : 'Manager Rating']: stat.mgrAvg > 0 ? parseFloat(stat.mgrAvg.toFixed(1)) : undefined,
      [isAr ? 'المطلوب' : 'Required']: d.required,
    };
  });

  const hasSelfScores = members.some(m => DOMAINS.some(d => (scores[m]?.[d.id] ?? 0) > 0));
  const hasAnyScores  = hasSelfScores || members.some(m => DOMAINS.some(d => (mgrScores[m]?.[d.id] ?? 0) > 0));

  /* ── AI Plan ── */
  const buildTrainingPrompt = useCallback((): string => {
    if (!hasAnyScores) return 'No scores have been entered yet. Please score the team first.';
    const domainLines = domainStats
      .filter(({ effectiveAvg }) => effectiveAvg > 0)
      .map(({ domain, selfAvg, mgrAvg, effectiveAvg }) => {
        const mgrNote = mgrAvg > 0 ? ` | Manager avg: ${mgrAvg.toFixed(1)}` : '';
        return `- **${domain.label}**: Self avg ${selfAvg.toFixed(1)}/5${mgrNote} | Effective: ${effectiveAvg.toFixed(1)} | Required: ${domain.required} | Course: ${domain.cips}`;
      }).join('\n');
    const memberLines = members.map(m => {
      const selfDomScores = DOMAINS.map(d => ({ domain: d, val: scores[m]?.[d.id] ?? 0 })).filter(x => x.val > 0);
      if (!selfDomScores.length) return `- ${m}: no scores entered`;
      const sorted = [...selfDomScores].sort((a, b) => a.val - b.val);
      const weakest = sorted[0];
      const allScores = selfDomScores.map(x => `${x.domain.label}: ${x.val}`).join(', ');
      return `- **${m}**: [${allScores}] → Biggest gap: ${weakest.domain.label} (${weakest.val}/5)`;
    }).join('\n');
    return [
      `## Team Training Assessment (${members.length} member${members.length !== 1 ? 's' : ''})`,
      '',
      '## Domain Averages (team-wide, self + manager)',
      domainLines || '(no scores entered)',
      '',
      '## Individual Profiles',
      memberLines,
      '',
      '## Your Task',
      'Generate a team learning roadmap:',
      '1. Group members by skill gap profile (e.g. "Technical group", "Strategic group")',
      '2. Recommend the top 3 training priorities for the team as a whole, with CIPS/APICS course recommendations and rationale',
      '3. Give each member a personalised development focus: their single biggest gap domain + one recommended course',
      'Label priorities [HIGH], [MEDIUM], or [LOW]. Use ## headings per section.',
    ].join('\n');
  }, [members, scores, mgrScores, domainStats, hasAnyScores]);

  const { loading: planLoading, result: planResult, evidenceSummary: planEvidenceSummary, error: planError, rateLimited: planRateLimited,
          retryAfterSeconds: planRetryAfterSeconds, generate: generatePlan, reset: resetPlan,
          savedPlan: planSavedPlan, viewSaved: viewSavedPlan, deleteSaved: deleteSavedPlan,
          saveError: planSaveError, dismissSaveError: dismissPlanSaveError } =
    useAIPlan(buildTrainingPrompt, isAr, TRAINING_TOOL_KEY, hasAnyScores);

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 border-b border-border bg-rose-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-primary">{isAr ? '📊 تقييم الاحتياجات التدريبية' : '📊 Training Needs Assessment'}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => downloadText('idp-template.txt', buildIDPText(members, scores, mgrScores, isAr))}
              disabled={!hasAnyScores}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-rose-200 text-rose-800 hover:bg-rose-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />{isAr ? 'تنزيل IDP' : 'Download IDP'}
            </button>
            <button onClick={downloadTrainingTemplate} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-rose-200 text-rose-800 hover:bg-rose-300 transition-colors">
              <Download className="w-3 h-3" />{isAr ? 'قالب CSV' : 'CSV Template'}
            </button>
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-rose-200 text-rose-800 hover:bg-rose-300 transition-colors">
              <Upload className="w-3 h-3" />{isAr ? 'استيراد CSV' : 'Import CSV'}
            </button>
            <input type="file" accept=".csv" className="hidden" ref={importInputRef}
              aria-label={isAr ? 'استيراد ملف CSV' : 'Import CSV file'}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleTrainingImport(f); e.target.value = ''; }} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isAr ? 'قيّم كفاءة كل عضو في الفريق — عمودان: التقييم الذاتي + تقييم المدير (1=مبتدئ، 5=خبير)' : 'Rate each team member — two columns: Self-rating + Manager-rating (1=Beginner, 5=Expert)'}
        </p>
        {importLog && (
          <div className={`mt-2 text-xs rounded-lg p-3 border ${importLog[0]?.startsWith('✓') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">{importLog.map((m, i) => <p key={i} className={i === 0 ? 'font-bold' : 'opacity-75'}>{m}</p>)}</div>
              <button onClick={() => setImportLog(null)} className="shrink-0 opacity-50 hover:opacity-100 font-bold">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div role="tablist" ref={tabListRef} className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {TRAINING_TABS.map((t, idx) => (
          <button key={t.id}
            id={`${t.id}-tab`}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`${t.id}-panel`}
            tabIndex={activeTab === t.id ? 0 : -1}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKey(e, idx)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <span>{t.icon}</span><span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* ── Tab: Matrix ── */}
        {activeTab === 'matrix' && <div role="tabpanel" id="matrix-panel" aria-labelledby="matrix-tab" className="space-y-5">

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(l => (
            <span key={l} className="text-xs px-2 py-1 rounded-full font-bold text-gray-800" style={{ background: LEVEL_LABELS[l].color }}>
              {l} — {isAr ? LEVEL_LABELS[l].ar : LEVEL_LABELS[l].en}
            </span>
          ))}
        </div>

        {/* ── Member management ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
              <input
                id={`training-member-${i}`}
                aria-label={isAr ? `اسم العضو ${i + 1}` : `Team member ${i + 1} name`}
                className="text-xs border-0 bg-transparent w-28 focus:outline-none"
                value={m}
                onChange={e => updateMember(i, e.target.value)}
              />
              {members.length > 1 && (
                <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {members.length < 8 && (
            <button onClick={addMember} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-dashed border-primary/40 text-primary rounded-lg hover:bg-primary/5">
              <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة عضو' : 'Add Member'}
            </button>
          )}
        </div>

        {/* ── Competency matrix: self + manager columns ── */}
        <div className="overflow-x-auto">
          <table className="text-xs min-w-[500px] w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-bold text-primary min-w-[130px]">
                  {isAr ? 'المجال' : 'Domain'}
                </th>
                {members.map(m => (
                  <th key={m} colSpan={2} className="text-center py-2 px-2 font-bold text-primary min-w-[130px] truncate max-w-[130px]" title={m}>
                    {m.substring(0, 10)}{m.length > 10 ? '…' : ''}
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-bold text-primary whitespace-nowrap">
                  {isAr ? 'متوسط الفريق' : 'Team Avg'}
                </th>
              </tr>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="py-1 px-2 font-normal text-muted-foreground text-[10px]"></th>
                {members.map(m => (
                  <React.Fragment key={m}>
                    <th className="py-1 px-1 font-bold text-[10px] text-blue-600 text-center">{isAr ? 'ذاتي' : 'Self'}</th>
                    <th className="py-1 px-1 font-bold text-[10px] text-violet-600 text-center">{isAr ? 'مدير' : 'Mgr'}</th>
                  </React.Fragment>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map(d => {
                const stat = domainStats.find(s => s.domain.id === d.id)!;
                return (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-2 px-2">
                      <p className="font-semibold text-primary">{isAr ? d.labelAr : d.label}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? `مطلوب: ${d.required}/5` : `Required: ${d.required}/5`}</p>
                    </td>
                    {members.map((m, mi) => {
                      const selfVal = scores[m]?.[d.id] ?? 0;
                      const mgrVal  = mgrScores[m]?.[d.id] ?? 0;
                      const memberLabel = m.trim() || (isAr ? `عضو ${mi + 1}` : `Member ${mi + 1}`);
                      return (
                        <React.Fragment key={mi}>
                          <td className="py-2 px-1 text-center">
                            <select
                              id={`training-score-${mi}-${d.id}`}
                              aria-label={isAr ? `${memberLabel} — ${d.labelAr} — ذاتي` : `${memberLabel} — ${d.label} — Self`}
                              value={selfVal}
                              onChange={e => setScore(m, d.id, parseInt(e.target.value))}
                              className="w-12 text-center text-xs rounded border border-border py-0.5 focus:outline-none"
                              style={{ background: LEVEL_LABELS[selfVal]?.color ?? '#e2e8f0', color: selfVal >= 4 ? '#fff' : '#1e293b' }}
                            >
                              <option value={0}>—</option>
                              {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </td>
                          <td className="py-2 px-1 text-center">
                            <select
                              id={`training-mgr-${mi}-${d.id}`}
                              aria-label={isAr ? `${memberLabel} — ${d.labelAr} — تقييم المدير` : `${memberLabel} — ${d.label} — Manager`}
                              value={mgrVal}
                              onChange={e => setMgrScore(m, d.id, parseInt(e.target.value))}
                              className="w-12 text-center text-xs rounded border border-border py-0.5 focus:outline-none"
                              style={{ background: LEVEL_LABELS[mgrVal]?.color ?? '#e2e8f0', color: mgrVal >= 4 ? '#fff' : '#1e293b', opacity: 0.85 }}
                            >
                              <option value={0}>—</option>
                              {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="py-2 px-2 text-center">
                      {stat.effectiveAvg > 0 && (
                        <span className="font-bold text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: LEVEL_LABELS[Math.round(stat.effectiveAvg)]?.color, color: Math.round(stat.effectiveAvg) >= 4 ? '#fff' : '#1e293b' }}>
                          {stat.effectiveAvg.toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        </div>} {/* end matrix tab */}

        {/* ── Tab: Radar ── */}
        {activeTab === 'radar' && <div role="tabpanel" id="radar-panel" aria-labelledby="radar-tab" className="space-y-5">
        {!hasSelfScores && (
          <p className="text-xs text-muted-foreground text-center py-8">
            {isAr ? 'أدخل التقييمات في علامة التبويب "مصفوفة التقييم" لعرض الرادار.' : 'Enter scores in the Assessment Matrix tab to display the radar.'}
          </p>
        )}
        {hasSelfScores && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">
              {isAr ? 'رادار الكفاءات — الحالي مقابل المطلوب' : 'Competency Radar — Current vs. Required'}
            </p>
            <ResponsiveContainer width="100%" height={290}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Radar
                  name={isAr ? 'المطلوب' : 'Required'}
                  dataKey={isAr ? 'المطلوب' : 'Required'}
                  stroke="#94a3b8"
                  fill="none"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                />
                <Radar
                  name={isAr ? 'التقييم الذاتي' : 'Self Rating'}
                  dataKey={isAr ? 'التقييم الذاتي' : 'Self Rating'}
                  stroke="#e11d48"
                  fill="#e11d48"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Radar
                  name={isAr ? 'تقييم المدير' : 'Manager Rating'}
                  dataKey={isAr ? 'تقييم المدير' : 'Manager Rating'}
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <Tooltip formatter={(v: number) => v !== undefined ? [`${v}/5`] : ['—']} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        </div>} {/* end radar tab */}

        {/* ── Tab: Development Actions ── */}
        {activeTab === 'actions' && <div role="tabpanel" id="actions-panel" aria-labelledby="actions-tab" className="space-y-5">
        {priorityGaps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">
              {isAr ? 'إجراءات التطوير ذات الأولوية — مرتَّبة حسب الفجوة' : 'Priority Development Actions — Ranked by Gap'}
            </p>
            <div className="space-y-3">
              {priorityGaps.map(({ domain, selfAvg, mgrAvg, effectiveAvg }, i) => {
                const gap = domain.required - effectiveAvg;
                const isCritical = gap >= 1.5;
                return (
                  <div key={domain.id} className="bg-white border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className={`shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-amber-900">{isAr ? domain.labelAr : domain.label}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isCritical ? (isAr ? 'عالية' : 'HIGH') : (isAr ? 'متوسطة' : 'MED')}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isAr
                            ? `متوسط فعّال: ${effectiveAvg.toFixed(1)}/5 | مطلوب: ${domain.required}/5 | فجوة: ${gap.toFixed(1)}`
                            : `Effective avg: ${effectiveAvg.toFixed(1)}/5 | Required: ${domain.required}/5 | Gap: ${gap.toFixed(1)}`}
                          {mgrAvg > 0 && selfAvg > 0 && (
                            <span className="ml-2 text-violet-600">
                              {isAr ? `(ذاتي ${selfAvg.toFixed(1)} | مدير ${mgrAvg.toFixed(1)})` : `(Self ${selfAvg.toFixed(1)} | Mgr ${mgrAvg.toFixed(1)})`}
                            </span>
                          )}
                        </p>
                        <div className="mt-2 space-y-1 text-[11px]">
                          <p className="text-blue-700 font-medium">📘 CIPS: {domain.cips}</p>
                          <p className="text-green-700 font-medium">📗 APICS: {domain.apics}</p>
                          <p className="text-slate-600">🏢 {domain.internal}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {priorityGaps.length === 0 && domainStats.some(d => d.effectiveAvg > 0) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-800">
              {isAr ? '✓ لا توجد فجوات حرجة — جميع المجالات المقيَّمة تلبّي المستوى المطلوب' : '✓ No critical gaps — all assessed domains meet or exceed the required level'}
            </p>
          </div>
        )}
        {!hasAnyScores && (
          <p className="text-xs text-muted-foreground text-center py-8">
            {isAr ? 'أدخل التقييمات في علامة التبويب "مصفوفة التقييم" لعرض الإجراءات.' : 'Enter scores in the Assessment Matrix tab to see development actions.'}
          </p>
        )}
        </div>} {/* end actions tab */}

        {/* ── Tab: AI Learning Plan ── */}
        {activeTab === 'ai' && (
          <div role="tabpanel" id="ai-panel" aria-labelledby="ai-tab">
          <AIPlanPanel
            loading={planLoading}
            result={planResult}
            evidenceSummary={planEvidenceSummary}
            error={planError}
            onGenerate={generatePlan}
            onReset={resetPlan}
            buttonLabel={isAr ? 'توليد خارطة التعلّم ✨' : 'Generate Learning Roadmap ✨'}
            isAr={isAr}
            disabled={!hasAnyScores}
            savedPlan={planSavedPlan}
            onViewSaved={viewSavedPlan}
            onDeleteSaved={deleteSavedPlan}
            rateLimited={planRateLimited}
            retryAfterSeconds={planRetryAfterSeconds}
            saveError={planSaveError}
            onDismissSaveError={dismissPlanSaveError}
            toolKey="training"
          />
          </div>
        )}

      </div>
    </div>
  );
}
