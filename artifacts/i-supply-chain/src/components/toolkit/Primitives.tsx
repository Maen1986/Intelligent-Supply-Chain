/**
 * Shared toolkit primitives — ChecklistTool, ActionTracker, ScoringMatrix, ParamForm
 * All components: bilingual (isAr prop), localStorage-persisted, no external deps beyond React.
 */
import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Trash2, Clock, User } from 'lucide-react';

/* ─── ChecklistTool ─── */
export interface ChecklistItem { en: string; ar: string; }

export function ChecklistTool({
  storageKey, items, isAr, title = 'Action Checklist', titleAr = 'قائمة المهام',
}: {
  storageKey: string; items: ChecklistItem[]; isAr: boolean; title?: string; titleAr?: string;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      const arr = s ? JSON.parse(s) : [];
      return [...arr, ...new Array(Math.max(0, items.length - arr.length)).fill(false)].slice(0, items.length);
    } catch { return new Array(items.length).fill(false); }
  });

  const toggle = (i: number) => setChecked(prev => {
    const next = [...prev]; next[i] = !next[i];
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { }
    return next;
  });

  const done = checked.filter(Boolean).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">{isAr ? titleAr : title}</p>
        <span className="text-xs font-bold text-blue-700">{done}/{items.length}</span>
      </div>
      <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 cursor-pointer group" onClick={() => toggle(i)}>
            <div className={`w-4 h-4 rounded shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${checked[i] ? 'bg-blue-600 border-blue-600' : 'border-blue-400 group-hover:border-blue-600'}`}>
              {checked[i] && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs leading-relaxed select-none ${checked[i] ? 'line-through text-blue-400' : 'text-blue-900'}`}>
              {isAr ? item.ar : item.en}
            </span>
          </li>
        ))}
      </ul>
      {pct === 100 && (
        <div className="text-xs text-center font-bold text-emerald-700 bg-emerald-100 rounded-lg py-2">
          {isAr ? '✓ اكتملت جميع الخطوات!' : '✓ All steps complete!'}
        </div>
      )}
    </div>
  );
}

/* ─── ActionTracker ─── */
interface Action { id: string; issue: string; owner: string; dueDate: string; resolved: boolean; }

export function ActionTracker({ storageKey, isAr }: { storageKey: string; isAr: boolean; }) {
  const [actions, setActions] = useState<Action[]>(() => {
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [form, setForm] = useState({ issue: '', owner: '', dueDate: '' });
  const [showForm, setShowForm] = useState(false);

  const persist = (acts: Action[]) => { try { localStorage.setItem(storageKey, JSON.stringify(acts)); } catch { } };

  const add = () => {
    if (!form.issue.trim()) return;
    const next = [...actions, { id: Date.now().toString(), ...form, resolved: false }];
    setActions(next); persist(next);
    setForm({ issue: '', owner: '', dueDate: '' }); setShowForm(false);
  };
  const toggle = (id: string) => { const next = actions.map(a => a.id === id ? { ...a, resolved: !a.resolved } : a); setActions(next); persist(next); };
  const remove = (id: string) => { const next = actions.filter(a => a.id !== id); setActions(next); persist(next); };

  const open = actions.filter(a => !a.resolved).length;
  const resolved = actions.filter(a => a.resolved).length;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">{isAr ? 'تتبّع الإجراءات' : 'Action Tracker'}</p>
        <div className="flex gap-2 text-xs text-amber-700">
          <span>{isAr ? `${open} مفتوح` : `${open} open`}</span><span>·</span>
          <span>{isAr ? `${resolved} منجز` : `${resolved} resolved`}</span>
        </div>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {actions.map(a => (
          <div key={a.id} className={`flex items-start gap-2 p-2 rounded-lg ${a.resolved ? 'bg-emerald-50' : 'bg-white border border-amber-200'}`}>
            <button onClick={() => toggle(a.id)} className="shrink-0 mt-0.5">
              {a.resolved ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-amber-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${a.resolved ? 'line-through text-muted-foreground' : 'text-primary'}`}>{a.issue}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {a.owner && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{a.owner}</span>}
                {a.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{a.dueDate}</span>}
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="shrink-0 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {actions.length === 0 && <p className="text-xs text-center text-muted-foreground py-2">{isAr ? 'لا توجد إجراءات بعد' : 'No actions yet'}</p>}
      </div>
      {showForm ? (
        <div className="space-y-2 bg-white border border-amber-300 rounded-lg p-3">
          <input className="w-full text-xs border border-border rounded px-2 py-1.5" placeholder={isAr ? 'وصف الإجراء *' : 'Action description *'} value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} onKeyDown={e => e.key === 'Enter' && add()} />
          <div className="flex gap-2">
            <input className="flex-1 text-xs border border-border rounded px-2 py-1.5" placeholder={isAr ? 'المسؤول' : 'Owner'} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            <input type="date" className="flex-1 text-xs border border-border rounded px-2 py-1.5" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">{isAr ? 'إضافة' : 'Add'}</button>
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground">{isAr ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full text-xs py-2 border border-dashed border-amber-400 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة إجراء' : 'Add Action'}
        </button>
      )}
    </div>
  );
}

/* ─── ParamForm ─── */
export interface ParamField { id: string; label: string; labelAr: string; unit?: string; unitAr?: string; type?: 'number' | 'text' | 'select'; options?: string[]; optionsAr?: string[]; min?: number; max?: number; }
export type ComputeResult = { label: string; labelAr: string; value: string | number; color?: string; desc?: string; descAr?: string; }[];

export function ParamForm({
  storageKey, fields, compute, isAr, title = 'Calculator', titleAr = 'الحاسبة',
}: {
  storageKey: string; fields: ParamField[]; compute: (values: Record<string, string>) => ComputeResult;
  isAr: boolean; title?: string; titleAr?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (id: string, v: string) => setValues(prev => {
    const next = { ...prev, [id]: v };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { }
    return next;
  });
  const results = compute(values);
  const hasValues = Object.values(values).some(v => v !== '');

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-primary">{isAr ? titleAr : title}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(f => (
          <div key={f.id}>
            <label className="text-xs font-bold text-primary mb-1 block">{isAr ? f.labelAr : f.label}</label>
            {f.type === 'select' && f.options ? (
              <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" value={values[f.id] ?? ''} onChange={e => set(f.id, e.target.value)}>
                <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                {(f.options).map((o, i) => <option key={i} value={o}>{isAr && f.optionsAr ? f.optionsAr[i] : o}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-1">
                <input type={f.type ?? 'number'} min={f.min} max={f.max} value={values[f.id] ?? ''} onChange={e => set(f.id, e.target.value)} className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {(isAr ? f.unitAr : f.unit) && <span className="text-xs text-muted-foreground shrink-0">{isAr ? f.unitAr : f.unit}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      {hasValues && results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((r, i) => (
            <div key={i} className="rounded-xl p-4 border" style={{ borderColor: r.color ? r.color + '40' : '#e2e8f0', background: r.color ? r.color + '10' : '#f8fafc' }}>
              <p className="text-xs text-muted-foreground mb-1">{isAr ? r.labelAr : r.label}</p>
              <p className="text-lg font-extrabold" style={{ color: r.color ?? '#082C6B' }}>{r.value}</p>
              {(r.desc || r.descAr) && <p className="text-xs text-muted-foreground mt-1">{isAr ? (r.descAr ?? r.desc) : r.desc}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
