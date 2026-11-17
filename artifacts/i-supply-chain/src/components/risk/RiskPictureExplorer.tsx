import { useState } from 'react';
import { HEAT_MAP_RISKS, SECTORS, bandView } from '@/lib/riskPageData';

interface Category { response: string; responseAr: string }
interface Props {
  isAr: boolean;
  categories: Category[];
  onOpenToolkit: () => void;
}

const tr = (isAr: boolean, en: string, ar: string) => (isAr ? ar : en);

/** Overview "first impression": pick a sector, see the top five sample risks on the 5x5 grid and a board-page preview. */
export function RiskPictureExplorer({ isAr, categories, onOpenToolkit }: Props) {
  const [sectorId, setSectorId] = useState('general');
  const sector = SECTORS.find(s => s.id === sectorId) ?? SECTORS[0];
  const risks = sector.picks
    .map(id => HEAT_MAP_RISKS.find(r => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => b.l * b.i - a.l * a.i);
  const actNow = risks.filter(r => r.l * r.i >= 10).length;
  const first = risks[0];
  const firstCat = first ? categories[first.cat] : undefined;

  return (
    <section aria-labelledby="rp-title" data-testid="risk-picture" className="space-y-5">
      <div>
        <h2 id="rp-title" className="text-2xl font-bold text-primary">{tr(isAr, 'See your risk picture in 10 seconds', 'شاهد صورة مخاطرك في 10 ثوانٍ')}</h2>
        <p className="text-muted-foreground mt-1">{tr(isAr, 'Pick your sector. ISC shows the five sample risks most likely to matter, on the same 5×5 grid the toolkit uses.', 'اختر قطاعك. تعرض آي سبلاي تشين خمسة مخاطر نموذجية الأرجح أهميتها، على الشبكة 5×5 نفسها التي تستخدمها الأدوات.')}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={tr(isAr, 'Sector', 'القطاع')}>
        {SECTORS.map(s => (
          <button key={s.id} type="button" aria-pressed={sectorId === s.id} onClick={() => setSectorId(s.id)}
            className={`min-h-[44px] px-4 rounded-full border text-sm font-medium transition-colors ${sectorId === s.id ? 'bg-primary text-white border-primary' : 'bg-white text-foreground border-border hover:bg-muted'}`}>
            {isAr ? s.ar : s.en}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-primary mb-3">{tr(isAr, 'Where your top five sit', 'أين تقع أهم مخاطرك الخمسة')}</p>
          <div className="grid grid-cols-6 gap-1 max-w-sm" role="img"
            aria-label={tr(isAr, `Five risks plotted on a 5 by 5 likelihood and impact grid for ${sector.en}`, `خمسة مخاطر على شبكة احتمال وأثر 5×5 لقطاع ${sector.ar}`)}>
            <span />
            {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-[11px] text-center text-muted-foreground">{tr(isAr, 'I', 'أثر')}{i}</span>)}
            {[5, 4, 3, 2, 1].map(l => (
              <div key={l} className="contents">
                <span className="text-[11px] flex items-center justify-center text-muted-foreground">{tr(isAr, 'L', 'احتمال')}{l}</span>
                {[1, 2, 3, 4, 5].map(i => {
                  const here = risks.filter(r => r.l === l && r.i === i);
                  return (
                    <div key={i} className={`aspect-square rounded-md flex flex-wrap items-center justify-center gap-0.5 text-[11px] ${bandView(l * i).cls}`}>
                      {here.length ? here.map(r => <span key={r.id} data-testid="risk-dot" className="w-5 h-5 rounded-full bg-white text-primary font-bold text-[10px] flex items-center justify-center shadow">{r.id.slice(1)}</span>) : l * i}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{tr(isAr, 'Bands: Low 1–4, Watch 5–9, Act 10–14, Urgent 15–25.', 'النطاقات: منخفض 1–4، مراقبة 5–9، تحرّك 10–14، عاجل 15–25.')}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-primary mb-3">{tr(isAr, 'Your top five, ranked', 'أهم مخاطرك الخمسة مرتّبة')}</p>
          <table className="w-full text-sm">
            <caption className="sr-only">{tr(isAr, 'Top five sample risks', 'أهم خمسة مخاطر نموذجية')}</caption>
            <tbody>
              {risks.map(r => {
                const b = bandView(r.l * r.i);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 pe-2 text-muted-foreground">{r.id.slice(1)}</td>
                    <td className="py-2 pe-2">{isAr ? r.nameAr : r.name}</td>
                    <td className="py-2 pe-2 tabular-nums">{r.l * r.i}</td>
                    <td className="py-2"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${b.cls}`}>{isAr ? b.ar : b.en}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="border-2 border-primary rounded-2xl bg-white p-5" data-testid="board-preview">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="font-bold text-primary">{tr(isAr, 'Your first board page (preview)', 'صفحة مجلس الإدارة الأولى (معاينة)')}</p>
          <span className="text-xs text-muted-foreground">{tr(isAr, 'Sector: ', 'القطاع: ')}{isAr ? sector.ar : sector.en}</span>
        </div>
        <p className="mt-3"><span className="text-4xl font-extrabold text-primary align-middle" data-testid="act-now-count">{actNow}</span> <span className="align-middle">{tr(isAr, 'of 5 risks need action now (Act or Urgent).', 'من 5 مخاطر تحتاج إجراء الآن (تحرّك أو عاجل).')}</span></p>
        {first && firstCat && (
          <p className="mt-2 text-sm"><b>{tr(isAr, 'Start with: ', 'ابدأ بـ: ')}</b>{isAr ? first.nameAr : first.name} — {isAr ? firstCat.responseAr : firstCat.response}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{tr(isAr, 'Indicative picks from ISC practitioner judgement over sample risks, not your data. Evidence: not checked. Build the real one in the toolkit.', 'اختيارات استرشادية من تقدير ممارسي آي سبلاي تشين على مخاطر نموذجية، لا من بياناتك. الدليل: لم يُفحص. ابنِ الصفحة الحقيقية في الأدوات.')}</p>
        <button type="button" onClick={onOpenToolkit} className="mt-3 min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">{tr(isAr, 'Build mine in the toolkit', 'ابنِ صفحتي في الأدوات')}</button>
      </div>
    </section>
  );
}
