// src/pages/SupplierDependencyCheck.tsx
//
// Supplier Dependency Surfacing (#378, 25 Aug 2026) — no-ERP, conversational
// single-source-risk check. Self-scoped (client names the supplier/category
// directly -- see supplierDependency.ts header note for why). Manual input
// only, no live data required, same v1-scoping discipline as Decision Lab:
// no new backend route for the checks themselves at launch (the optional
// remedy narrative reuses the existing generic /api/ai/plan endpoint via
// useAIPlan), localStorage-only persistence.
//
// Backend-sync added 28 Aug 2026, with the owner's explicit go-ahead (see
// the #381 scoping pass, shared-case-data-layer-381-scoping-draft.md, which
// flagged this as a real product-shape decision, not a small implementation
// detail, and asked rather than assumed). Server-sync mirrors the RAR
// scenario / TCO analyses whole-list pattern exactly (see
// ResiliencyTools.tsx's rar-analyses sync block) -- localStorage remains
// the source of truth on fetch failure, never breaking the UI, and an
// unauthenticated visitor still gets the full local-only experience exactly
// as before this change.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link2, Plus, Trash2, Sparkles, Info, Printer, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import {
  type SupplierCheck, type SeverityResult, type ContractType,
  newSupplierCheck, isCheckComplete, deriveSeverity, buildSupplierDependencyPrompt,
} from '@/lib/supplierDependency';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'isc-supplier-dependency-v1';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function loadChecks(): SupplierCheck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupplierCheck[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fall through to default */ }
  return [newSupplierCheck()];
}

const severityStyles: Record<SeverityResult['level'], { badge: string; icon: React.ReactNode; barColor: string }> = {
  Critical:   { badge: 'bg-red-50 border-red-200 text-red-700',       icon: <ShieldAlert className="w-3.5 h-3.5" />,    barColor: 'bg-red-500' },
  Moderate:   { badge: 'bg-amber-50 border-amber-200 text-amber-700', icon: <ShieldAlert className="w-3.5 h-3.5" />,    barColor: 'bg-amber-500' },
  Low:        { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <ShieldCheck className="w-3.5 h-3.5" />, barColor: 'bg-emerald-500' },
  Incomplete: { badge: 'bg-slate-100 border-slate-200 text-slate-500', icon: <ShieldQuestion className="w-3.5 h-3.5" />, barColor: 'bg-slate-300' },
};

/* ── Per-check card (owns its own AI-plan hook instance) ───────────────── */

function SupplierCheckCard({
  check, isAr, onUpdate, onRemove, today,
}: {
  check: SupplierCheck;
  isAr: boolean;
  onUpdate: (id: string, patch: Partial<SupplierCheck>) => void;
  onRemove: (id: string) => void;
  today: string;
}) {
  const severity = deriveSeverity(check, isAr);
  const complete = isCheckComplete(check);
  const style = severityStyles[severity.level];

  const buildPrompt = useCallback(() => buildSupplierDependencyPrompt(check, severity, isAr), [check, severity, isAr]);
  const aiPlan = useAIPlan(buildPrompt, isAr, `supplierDependency:${check.id}`, complete);

  return (
    <div className={`print-zone-supplier-dependency bg-white rounded-2xl border shadow-sm p-4 space-y-4 ${complete ? 'border-slate-200' : 'border-slate-200'}`}>
      {/* Print-only header */}
      <div className="hidden print:block pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">
          {isAr ? '🔗 فحص اعتمادية المورّد' : '🔗 Supplier Dependency Check'}
        </p>
        <p className="text-sm font-semibold text-gray-700">{check.name || (isAr ? 'بدون اسم' : 'Unnamed')}</p>
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      <div className="flex items-start justify-between gap-3">
        <input
          type="text"
          value={check.name}
          onChange={e => onUpdate(check.id, { name: e.target.value })}
          placeholder={isAr ? 'اسم المورّد أو فئة الإنفاق' : 'Supplier name or spend category'}
          className="flex-1 text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
        <button onClick={() => onRemove(check.id)} className="no-print p-2 text-slate-300 hover:text-red-500 shrink-0" title={isAr ? 'إزالة' : 'Remove'}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Q1: named alternative */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {isAr ? 'هل لديك بديل محدد؟' : 'Named alternative?'}
          </label>
          <p className="text-[11px] text-muted-foreground mb-1.5">
            {isAr ? 'إن لم يستطع هذا المورّد التسليم الشهر القادم، هل لديك اسم محدد ستتصل به؟' : "If this supplier couldn't deliver next month, do you have a specific name you'd call?"}
          </p>
          <div className="flex gap-2">
            {[{ v: true, en: 'Yes', ar: 'نعم' }, { v: false, en: 'No', ar: 'لا' }].map(o => (
              <button
                key={String(o.v)}
                onClick={() => onUpdate(check.id, { hasNamedAlternative: o.v })}
                className={`no-print flex-1 text-xs font-bold rounded-lg px-3 py-1.5 border transition-colors ${
                  check.hasNamedAlternative === o.v ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isAr ? o.ar : o.en}
              </button>
            ))}
          </div>
        </div>

        {/* Q2: contract vs relationship */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {isAr ? 'عقد موثّق أم علاقة؟' : 'Contract or relationship?'}
          </label>
          <p className="text-[11px] text-muted-foreground mb-1.5">
            {isAr ? 'هل هذا اتفاق موثّق كتابياً، أم علاقة مبنية على الثقة بمرور الوقت؟' : 'Is this a written agreement, or mostly a relationship built over time?'}
          </p>
          <div className="flex gap-2">
            {([{ v: 'written', en: 'Written', ar: 'موثّق' }, { v: 'relationship', en: 'Relationship', ar: 'علاقة' }] as { v: ContractType; en: string; ar: string }[]).map(o => (
              <button
                key={o.v}
                onClick={() => onUpdate(check.id, { contractType: o.v })}
                className={`no-print flex-1 text-xs font-bold rounded-lg px-3 py-1.5 border transition-colors ${
                  check.contractType === o.v ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isAr ? o.ar : o.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Q3: switching-cost tell (free text) */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          {isAr ? 'ما أول ما قد يتأثر عند التبديل؟ (اختياري)' : "What would break first if you switched? (optional)"}
        </label>
        <input
          type="text"
          value={check.switchingCostNote}
          onChange={e => onUpdate(check.id, { switchingCostNote: e.target.value })}
          placeholder={isAr ? 'السعر، مدة التسليم، الجودة، شروط خاصة...' : 'Price, lead time, quality, custom terms...'}
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Q4: volume concentration */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {isAr ? 'نسبة تركّز الإنفاق (تقديري، اختياري)' : 'Spend concentration % (estimate, optional)'}
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={check.volumeConcentrationPct ?? ''}
            onChange={e => onUpdate(check.id, { volumeConcentrationPct: e.target.value === '' ? null : Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
            placeholder={isAr ? 'مثال: ٦٠' : 'e.g. 60'}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
          />
        </div>

        {/* Q5: recent stress signal */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {isAr ? 'إشارة ضغط حديثة؟' : 'Recent stress signal?'}
          </label>
          <div className="flex gap-2">
            {[{ v: true, en: 'Yes', ar: 'نعم' }, { v: false, en: 'No', ar: 'لا' }].map(o => (
              <button
                key={String(o.v)}
                onClick={() => onUpdate(check.id, { hasRecentStressSignal: o.v })}
                className={`no-print flex-1 text-xs font-bold rounded-lg px-3 py-1.5 border transition-colors ${
                  check.hasRecentStressSignal === o.v ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isAr ? o.ar : o.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {check.hasRecentStressSignal === true && (
        <input
          type="text"
          value={check.recentStressNote}
          onChange={e => onUpdate(check.id, { recentStressNote: e.target.value })}
          placeholder={isAr ? 'ما الذي حدث؟ (تسليم متأخر، ارتفاع سعر...)' : 'What happened? (late delivery, price jump...)'}
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
      )}

      {/* Severity result */}
      <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${style.badge}`}>
        {style.icon}
        <div>
          <p className="text-xs font-black uppercase tracking-wide">
            {isAr
              ? { Critical: 'حرج', Moderate: 'متوسط', Low: 'منخفض', Incomplete: 'غير مكتمل' }[severity.level]
              : severity.level}
          </p>
          <p className="text-[11px] mt-0.5">{isAr ? severity.reasonAr : severity.reasonEn}</p>
        </div>
      </div>

      {!complete && (
        <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          {isAr
            ? 'هذا التقييم هو حكم أولي مبني على قاعدة ثابتة ومُعلنة أعلاه -- ليس درجة معتمدة أو محسوبة بالذكاء الاصطناعي.'
            : 'This severity read follows the fixed, disclosed rule above -- it is not an AI-generated score.'}
        </p>
      )}

      {/* AI remedy (optional) */}
      {complete && (
        <div className="no-print pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#082C6B]" />
            {isAr ? 'اقتراح معالجة بالذكاء الاصطناعي' : 'AI Remedy Suggestion'}
          </h4>
          <AIPlanPanel
            loading={aiPlan.loading}
            result={aiPlan.result}
            evidenceSummary={aiPlan.evidenceSummary}
            error={aiPlan.error}
            onGenerate={aiPlan.generate}
            onReset={aiPlan.reset}
            buttonLabel={isAr ? 'توليد اقتراح ✨' : 'Generate Suggestion ✨'}
            isAr={isAr}
            disabled={!complete}
            savedPlan={aiPlan.savedPlan}
            onViewSaved={aiPlan.viewSaved}
            onDeleteSaved={aiPlan.deleteSaved}
            rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds}
            toolKey={`supplierDependency:${check.id}`}
            saveError={aiPlan.saveError}
            onDismissSaveError={aiPlan.dismissSaveError}
            onRetrySave={aiPlan.retrySave}
            deleteError={aiPlan.deleteError}
            onDismissDeleteError={aiPlan.dismissDeleteError}
          />
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────────────────────────────── */

export function SupplierDependencyCheck() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const [checks, setChecks] = useState<SupplierCheck[]>(loadChecks);

  // ── Server sync (added 28 Aug 2026, owner go-ahead -- see file header) ──
  // Mirrors ResiliencyTools.tsx's rar-analyses sync block exactly: whole-
  // list PUT, localStorage remains source of truth on fetch failure, an
  // unauthenticated visitor gets the unchanged local-only experience.
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const serverLoadedForUserId = useRef<number | null>(null);
  const bootstrapSettled = useRef(false);
  const localWinsDuringBootstrap = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checksRef = useRef<SupplierCheck[]>(checks);
  checksRef.current = checks;

  interface ServerCheckRow { id: number; clientKey: string; name: string; data: SupplierCheck; updatedAt: string; }
  function serverRowToCheck(row: ServerCheckRow): SupplierCheck {
    return { ...row.data, id: row.clientKey, name: row.name };
  }
  function checkToPayload(c: SupplierCheck) {
    return { clientKey: c.id, name: c.name, data: c };
  }

  const syncToServerImmediate = (list: SupplierCheck[]) => {
    if (!user) return;
    setSyncStatus('saving');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/supplier-dependency-checks`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checks: list.map(checkToPayload) }),
        });
        setSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSyncStatus('idle'), 2500);
      } catch {
        setSyncStatus('error');
      }
    }, 400);
  };
  const syncToServer = (list: SupplierCheck[]) => {
    if (!user) return;
    if (!bootstrapSettled.current) { localWinsDuringBootstrap.current = true; return; }
    syncToServerImmediate(list);
  };

  const persist = useCallback((next: SupplierCheck[]) => {
    setChecks(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
    syncToServer(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (serverLoadedForUserId.current !== null) {
        serverLoadedForUserId.current = null;
        bootstrapSettled.current = false;
        localWinsDuringBootstrap.current = false;
        setSyncStatus('idle');
      }
      return;
    }
    if (serverLoadedForUserId.current === user.id) return;
    serverLoadedForUserId.current = user.id;
    bootstrapSettled.current = false;
    localWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/supplier-dependency-checks`, { credentials: 'include' });
        if (serverLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; checks: ServerCheckRow[] };
          if (data.ok && Array.isArray(data.checks) && data.checks.length > 0) {
            if (!localWinsDuringBootstrap.current) {
              const converted = data.checks.map(serverRowToCheck);
              setChecks(converted);
              safeSetItem(STORAGE_KEY, JSON.stringify(converted));
            }
          } else if (!localWinsDuringBootstrap.current) {
            const current = checksRef.current;
            if (current && current.length > 0) syncToServerImmediate(current);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      bootstrapSettled.current = true;
      if (localWinsDuringBootstrap.current) {
        const current = checksRef.current;
        if (current) syncToServerImmediate(current);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addCheck = () => persist([...checks, newSupplierCheck()]);
  const removeCheck = (id: string) => persist(checks.length > 1 ? checks.filter(c => c.id !== id) : [newSupplierCheck()]);
  const updateCheck = (id: string, patch: Partial<SupplierCheck>) =>
    persist(checks.map(c => c.id === id ? { ...c, ...patch } : c));

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Link2 className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'فحص اعتمادية غير رسمي' : 'Informal Dependency Check'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'اعتمادية المورّد' : 'Supplier Dependency Check'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'سمِّ مورّداً أو فئة إنفاق تقلقك، أجب عن خمسة أسئلة سريعة، واحصل على تقييم خطورة مباشر وفق قاعدة ثابتة معلنة -- بدون الحاجة إلى بيانات ERP.'
              : "Name a supplier or spend category you're worried about, answer 5 quick questions, and get a plain-language severity read from a fixed, disclosed rule -- no ERP data required."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {(isAr
              ? ['إدخال يدوي', 'لا حاجة لبيانات حية', 'قاعدة معلنة وليست ذكاءً اصطناعياً', 'عربي / إنجليزي']
              : ['Manual Input', 'No Live Data Required', 'Disclosed Rule, Not AI-Scored', 'Arabic / English']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <div className="no-print flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={addCheck}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-4 py-2 hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة مورّد للفحص' : 'Add a supplier to check'}
            </button>
            {user && syncStatus !== 'idle' && (
              <span className="text-[11px] text-muted-foreground">
                {syncStatus === 'saving' ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
                  : syncStatus === 'saved' ? (isAr ? 'تم الحفظ' : 'Saved')
                  : (isAr ? 'تعذّر الحفظ (محفوظ محلياً)' : 'Save failed (kept locally)')}
              </span>
            )}
          </div>
          <button
            onClick={() => printZone('supplier-dependency')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        {checks.map(check => (
          <SupplierCheckCard key={check.id} check={check} isAr={isAr} onUpdate={updateCheck} onRemove={removeCheck} today={today} />
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {isAr
            ? 'هذا الفحص لا يحل محل سجل موردين رسمي أو تحليل إنفاق مدعوم بنظام ERP -- استخدمه كمؤشر توجيهي أولي.'
            : 'This check is not a substitute for a formal supplier register or ERP-backed spend analysis -- treat it as a directional first read.'}
        </p>
      </div>
    </div>
  );
}
