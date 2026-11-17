import { useState } from 'react';
import { GOV_TIERS, tierState, type KpiState } from '@/lib/riskPageData';

interface Props { isAr: boolean; onRequestAssessment: () => void }

const STATE_LABEL: Record<KpiState, { en: string; ar: string; cls: string }> = {
  healthy: { en: 'Healthy', ar: 'سليم', cls: 'bg-green-500 text-white' },
  watch: { en: 'Watch', ar: 'مراقبة', cls: 'bg-yellow-400 text-gray-900' },
  attention: { en: 'High attention', ar: 'يحتاج انتباها عاليا', cls: 'bg-red-500 text-white' },
  none: { en: 'No value', ar: 'لا قيمة', cls: 'bg-muted text-muted-foreground' },
};

/** Tick the controls you already have; see each tier's state and your gaps as an action list. No single composite score. */
export function GovernanceSelfCheck({ isAr, onRequestAssessment }: Props) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const gaps: string[] = [];
  GOV_TIERS.forEach((t, ti) => t.items.forEach((it, ii) => { if (!ticked[`${ti}-${ii}`]) gaps.push(isAr ? it.ar : it.en); }));

  const copy = async () => {
    const text = gaps.map(g => `- ${g}`).join('\n');
    try { await navigator.clipboard?.writeText(text); } catch { /* clipboard blocked: the list stays visible on screen */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-labelledby="gv-title" data-testid="gov-selfcheck" className="space-y-4">
      <div>
        <h3 id="gv-title" className="text-xl font-bold text-primary">{isAr ? 'فحص ذاتي: أين أنت اليوم؟' : 'Self-check: where are you today?'}</h3>
        <p className="text-muted-foreground text-sm mt-1">{isAr ? 'حدّد الضوابط الموجودة لديك فعلا. يُعرض كل مستوى منفصلا، ولا توجد درجة واحدة مجمّعة.' : 'Tick the controls you already have. Each tier is shown on its own; there is no single combined score.'}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {GOV_TIERS.map((t, ti) => {
          const done = t.items.filter((_, ii) => ticked[`${ti}-${ii}`]).length;
          const state = tierState(done, t.items.length);
          const lab = STATE_LABEL[state];
          return (
            <fieldset key={t.en} className="bg-white border border-border rounded-2xl p-4 shadow-sm" data-testid={`gov-tier-${ti}`}>
              <legend className="sr-only">{isAr ? t.ar : t.en}</legend>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-bold text-primary">{isAr ? t.ar : t.en}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${lab.cls}`}>{isAr ? lab.ar : lab.en}</span>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden" aria-hidden="true"><div className={`h-full transition-all ${state === 'healthy' ? 'bg-green-500' : state === 'watch' ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${(done / t.items.length) * 100}%` }} /></div>
              <p className="text-xs text-muted-foreground mt-1 mb-2" data-testid={`gov-count-${ti}`}>{done} / {t.items.length} {isAr ? 'قائمة' : 'in place'}</p>
              {t.items.map((it, ii) => {
                const k = `${ti}-${ii}`;
                return (
                  <label key={k} className="flex items-start gap-3 min-h-[44px] py-1.5 cursor-pointer text-sm">
                    <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0" checked={Boolean(ticked[k])} onChange={e => setTicked(prev => ({ ...prev, [k]: e.target.checked }))} />
                    <span>{isAr ? it.ar : it.en}</span>
                  </label>
                );
              })}
            </fieldset>
          );
        })}
      </div>
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <p className="font-bold text-primary mb-2">{isAr ? 'فجواتك كقائمة إجراءات' : 'Your gaps, as an action list'}</p>
        {gaps.length === 0 ? (
          <p className="text-sm">{isAr ? 'كل الضوابط قائمة. راجعها كل ربع سنة.' : 'Every control is in place. Review each quarter.'}</p>
        ) : (
          <ol className="list-decimal ps-5 space-y-1 text-sm" data-testid="gov-gaps">
            {gaps.map(g => <li key={g}>{isAr ? 'ضع موضع التنفيذ: ' : 'Put in place: '}{g}</li>)}
          </ol>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" onClick={copy} className="min-h-[44px] px-4 rounded-lg border border-border text-primary text-sm font-semibold hover:bg-muted">{isAr ? 'انسخ القائمة' : 'Copy the list'}</button>
          <button type="button" onClick={onRequestAssessment} className="min-h-[44px] px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">{isAr ? 'اطلب تقييم مخاطر' : 'Request a risk assessment'}</button>
        </div>
        <p role="status" className="text-xs text-green-700 mt-2 min-h-[1rem]">{copied ? (isAr ? 'تم النسخ' : 'Copied') : ''}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قاعدة الحالة استرشادية من ISC: الكل قائم = سليم؛ النصف فأكثر = مراقبة؛ أقل من ذلك = يحتاج انتباها عاليا.' : 'The status rule is ISC indicative: all in place is Healthy, half or more is Watch, fewer is High attention.'}</p>
      </div>
    </section>
  );
}
