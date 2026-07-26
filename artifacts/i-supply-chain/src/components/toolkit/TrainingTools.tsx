/**
 * Training Needs Assessment Tool
 * Matrix: team members × 8 supply chain domains, competency 1–5
 * Output: heatmap, gap clusters, CIPS/ISC learning path recommendations
 */
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';

interface TrainingToolsProps { isAr: boolean; }

const DOMAINS = [
  { id: 'strategy', label: 'Strategy & Planning', labelAr: 'الاستراتيجية والتخطيط', cips: 'CIPS L4 – Procurement & Supply Operations' },
  { id: 'procurement', label: 'Procurement & Sourcing', labelAr: 'المشتريات والتوريد', cips: 'CIPS L5 – Advanced Diploma in Procurement' },
  { id: 'logistics', label: 'Logistics & Distribution', labelAr: 'الخدمات اللوجستية والتوزيع', cips: 'CIPS L4 – Logistics & Operations' },
  { id: 'risk', label: 'Risk Management', labelAr: 'إدارة المخاطر', cips: 'CIPS L5 – Risk in Supply Chains' },
  { id: 'compliance', label: 'Governance & Compliance', labelAr: 'الحوكمة والامتثال', cips: 'CIPS L6 – Governance in Procurement' },
  { id: 'digital', label: 'Digital & Technology', labelAr: 'الرقمي والتكنولوجيا', cips: 'CIPS L4 – Procurement Technology' },
  { id: 'sustainability', label: 'Sustainability & ESG', labelAr: 'الاستدامة وESG', cips: 'CIPS L6 – Sustainable Procurement' },
  { id: 'analytics', label: 'Data & Analytics', labelAr: 'البيانات والتحليلات', cips: 'ISC Data-Driven Procurement Module' },
];

const LEVEL_LABELS: Record<number, { en: string; ar: string; color: string }> = {
  0: { en: 'Not assessed', ar: 'غير مقيَّم', color: '#e2e8f0' },
  1: { en: 'Beginner', ar: 'مبتدئ', color: '#fca5a5' },
  2: { en: 'Developing', ar: 'ناشئ', color: '#fcd34d' },
  3: { en: 'Competent', ar: 'مؤهَّل', color: '#6ee7b7' },
  4: { en: 'Advanced', ar: 'متقدّم', color: '#34d399' },
  5: { en: 'Expert', ar: 'خبير', color: '#059669' },
};

export function TrainingNeedsAssessment({ isAr }: TrainingToolsProps) {
  const SK_MEMBERS = 'isc-tool-training-members';
  const SK_SCORES = 'isc-tool-training-scores';

  const [members, setMembers] = useState<string[]>(() => {
    try { const s = localStorage.getItem(SK_MEMBERS); return s ? JSON.parse(s) : ['Team Member 1']; } catch { return ['Team Member 1']; }
  });
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(() => {
    try { const s = localStorage.getItem(SK_SCORES); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const persistMembers = (m: string[]) => { safeSetItem(SK_MEMBERS, JSON.stringify(m)); };
  const persistScores = (s: Record<string, Record<string, number>>) => { safeSetItem(SK_SCORES, JSON.stringify(s)); };

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

  // Domain averages
  const domainAvgs = DOMAINS.map(d => {
    const vals = members.map(m => scores[m]?.[d.id] ?? 0).filter(v => v > 0);
    return { domain: d, avg: vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0 };
  });
  const gaps = domainAvgs.filter(({ avg }) => avg > 0 && avg < 3);

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-rose-50">
        <p className="text-sm font-bold text-primary">{isAr ? '📊 تقييم الاحتياجات التدريبية' : '📊 Training Needs Assessment'}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم كفاءة كل عضو في الفريق (1=مبتدئ، 5=خبير)' : 'Rate each team member competency (1=Beginner, 5=Expert)'}</p>
      </div>
      <div className="p-5 space-y-5">
        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(l => (
            <span key={l} className="text-xs px-2 py-1 rounded-full font-bold text-gray-800" style={{ background: LEVEL_LABELS[l].color }}>
              {l} — {isAr ? LEVEL_LABELS[l].ar : LEVEL_LABELS[l].en}
            </span>
          ))}
        </div>

        {/* Member management */}
        <div className="flex items-center gap-2 flex-wrap">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
              <input className="text-xs border-0 bg-transparent w-28 focus:outline-none" value={m} onChange={e => updateMember(i, e.target.value)} />
              {members.length > 1 && <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
            </div>
          ))}
          {members.length < 8 && (
            <button onClick={addMember} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-dashed border-primary/40 text-primary rounded-lg hover:bg-primary/5">
              <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة عضو' : 'Add Member'}
            </button>
          )}
        </div>

        {/* Heatmap matrix */}
        <div className="overflow-x-auto">
          <table className="text-xs min-w-[400px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-bold text-primary min-w-[130px]">{isAr ? 'المجال' : 'Domain'}</th>
                {members.map(m => <th key={m} className="text-center py-2 px-2 font-bold text-primary min-w-[80px] truncate max-w-[80px]" title={m}>{m.substring(0, 8)}{m.length > 8 ? '…' : ''}</th>)}
                <th className="text-center py-2 px-2 font-bold text-primary">{isAr ? 'المتوسط' : 'Avg'}</th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map(d => {
                const da = domainAvgs.find(x => x.domain.id === d.id)!;
                return (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-semibold text-primary">{isAr ? d.labelAr : d.label}</td>
                    {members.map(m => {
                      const val = scores[m]?.[d.id] ?? 0;
                      return (
                        <td key={m} className="py-2 px-2 text-center">
                          <select
                            value={val}
                            onChange={e => setScore(m, d.id, parseInt(e.target.value))}
                            className="w-12 text-center text-xs rounded border border-border py-0.5 focus:outline-none"
                            style={{ background: LEVEL_LABELS[val]?.color ?? '#e2e8f0', color: val >= 4 ? '#fff' : '#1e293b' }}>
                            <option value={0}>—</option>
                            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center">
                      {da.avg > 0 && (
                        <span className="font-bold text-xs px-1.5 py-0.5 rounded-full" style={{ background: LEVEL_LABELS[Math.round(da.avg)]?.color, color: Math.round(da.avg) >= 4 ? '#fff' : '#1e293b' }}>
                          {da.avg.toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gap analysis */}
        {gaps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">{isAr ? 'مجموعات الفجوات — مسارات التعلّم الموصى بها' : 'Gap Clusters — Recommended Learning Paths'}</p>
            <div className="space-y-3">
              {gaps.map(({ domain, avg }) => (
                <div key={domain.id} className="flex items-start gap-3 bg-white border border-amber-200 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-800">{isAr ? domain.labelAr : domain.label} — {isAr ? 'متوسط ' : 'Avg '}
                      <span className="font-extrabold" style={{ color: LEVEL_LABELS[Math.round(avg)]?.color }}>{avg.toFixed(1)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">📚 {domain.cips}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold shrink-0">{isAr ? 'أولوية' : 'Priority'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {gaps.length === 0 && domainAvgs.some(d => d.avg > 0) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-800">{isAr ? '✓ لا توجد فجوات حرجة — جميع المجالات التي قُيِّمت فوق المستوى 3' : '✓ No critical gaps — all assessed domains above Level 3'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
