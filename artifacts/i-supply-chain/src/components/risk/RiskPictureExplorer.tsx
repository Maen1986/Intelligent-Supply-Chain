import { useState } from 'react';
import { SAMPLE_RISKS, SECTORS, SOURCE_KIND_LABEL, EVIDENCE_STATUS_LABEL, bandView } from '@/lib/riskPageData';
import type { BandView, EvidenceStatus } from '@/lib/riskPageData';
import { SECTOR_RISKS, EVIDENCE_KIND_LABEL, SOURCE_TYPE_LABEL } from '@/lib/sectorSpecificRisks';

/** The 20 common risks plus the sector-specific ones, so every sector's picks can be looked up. */
const POOL = [...SAMPLE_RISKS, ...SECTOR_RISKS];
const PLOTTED = POOL.filter(r => SECTORS.some(s => s.picks.includes(r.id)));
const isSpecific = (id: string) => !/^R\d+$/.test(id);
const dotLabel = (id: string) => (isSpecific(id) ? id : id.slice(1));

interface Category { response: string; responseAr: string }
interface Props {
  isAr: boolean;
  categories: Category[];
  onOpenToolkit: () => void;
}

const tr = (isAr: boolean, en: string, ar: string) => (isAr ? ar : en);

const STATUS_CLS: Record<EvidenceStatus, string> = {
  sourced: 'bg-green-100 text-green-900',
  partly: 'bg-yellow-100 text-yellow-900',
  judgement: 'bg-gray-200 text-gray-900',
};

/** Marker offset (px from the cell centre) so one to four markers sit neatly inside a cell. */
function offset(n: number, slot: number): [number, number] {
  if (n <= 1) return [-12, -12];
  if (n === 2) return [-24 + slot * 24, -12];
  return [-24 + (slot % 2) * 24, -24 + Math.floor(slot / 2) * 24];
}

/**
 * Overview "first impression": pick a sector and see its ten most relevant sample risks glide onto the
 * 5x5 grid, ranked, with the sources behind the sector and a board-page preview.
 */
export function RiskPictureExplorer({ isAr, categories, onOpenToolkit }: Props) {
  const [sectorId, setSectorId] = useState('general');
  const [pinned, setPinned] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const sector = SECTORS.find(s => s.id === sectorId) ?? SECTORS[0];
  const risks = sector.picks
    .map(id => POOL.find(r => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => b.l * b.i - a.l * a.i);
  const total = risks.length;
  const activeIds = new Set(risks.map(r => r.id));
  const cellCount: Record<string, number> = {};
  const slotOf: Record<string, number> = {};
  risks.forEach(r => {
    const k = `${r.l}-${r.i}`;
    slotOf[r.id] = cellCount[k] ?? 0;
    cellCount[k] = (cellCount[k] ?? 0) + 1;
  });
  const bands: Partial<Record<BandView['key'], { n: number; v: BandView }>> = {};
  risks.forEach(r => {
    const v = bandView(r.l * r.i);
    bands[v.key] = { n: (bands[v.key]?.n ?? 0) + 1, v };
  });
  const actNow = (bands.critical?.n ?? 0) + (bands.high?.n ?? 0);
  const first = risks[0];
  const firstCat = first ? categories[first.cat] : undefined;
  const sel = risks.find(r => r.id === pinned) ?? null;
  const selCat = sel ? categories[sel.cat] : undefined;
  const highlight = hover ?? sel?.id ?? null;
  const ev = sector.evidence;
  const sectorName = isAr ? sector.ar : sector.en;

  return (
    <section aria-labelledby="rp-title" data-testid="risk-picture" className="space-y-5">
      <div>
        <h2 id="rp-title" className="text-2xl font-bold text-primary">{tr(isAr, 'See your risk picture in 10 seconds', 'شاهد صورة مخاطرك في 10 ثوانٍ')}</h2>
        <p className="text-muted-foreground mt-1">{tr(isAr, 'Pick your sector. ISC shows the ten sample risks most likely to matter, seven specific to the sector and three common, on the same 5×5 grid the toolkit uses.', 'اختر قطاعك. تعرض آي سبلاي تشين عشرة مخاطر نموذجية الأرجح أهميتها، سبعة خاصة بالقطاع وثلاثة مشتركة، على الشبكة 5×5 نفسها التي تستخدمها الأدوات.')}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={tr(isAr, 'Sector', 'القطاع')}>
        {SECTORS.map(s => (
          <button key={s.id} type="button" aria-pressed={sectorId === s.id} onClick={() => { setSectorId(s.id); setPinned(null); }}
            className={`min-h-[44px] px-4 rounded-full border text-sm font-medium transition-colors ${sectorId === s.id ? 'bg-primary text-white border-primary' : 'bg-white text-foreground border-border hover:bg-muted'}`}>
            {isAr ? s.ar : s.en}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-primary mb-3">{tr(isAr, 'Where your top ten sit', 'أين تقع أهم مخاطرك العشرة')}</p>
          <div dir="ltr" className="relative ps-9 pt-6 max-w-sm" role="img"
            aria-label={tr(isAr, `Ten risks plotted on a 5 by 5 likelihood and impact grid for ${sector.en}`, `عشرة مخاطر على شبكة احتمال وأثر 5×5 لقطاع ${sector.ar}`)}>
            <div className="absolute top-0 start-9 end-0 grid grid-cols-5 text-center text-[11px] text-muted-foreground">
              {[1, 2, 3, 4, 5].map(i => <span key={i}>{tr(isAr, 'I', 'أثر ')}{i}</span>)}
            </div>
            <div className="absolute top-6 bottom-0 start-0 w-9 grid grid-rows-5 text-[11px] text-muted-foreground">
              {[5, 4, 3, 2, 1].map(l => <span key={l} className="flex items-center">{tr(isAr, 'L', 'احتمال ')}{l}</span>)}
            </div>
            <div className="relative">
              <div className="grid grid-cols-5 grid-rows-5 aspect-square">
                {[5, 4, 3, 2, 1].flatMap(l => [1, 2, 3, 4, 5].map(i => (
                  <div key={`${l}-${i}`} className={`relative border border-white rounded-sm opacity-90 ${bandView(l * i).cls}`}>
                    <span className="absolute bottom-0.5 end-1 text-[10px] opacity-70">{l * i}</span>
                  </div>
                )))}
              </div>
              {PLOTTED.map(r => {
                const on = activeIds.has(r.id);
                const [dx, dy] = offset(cellCount[`${r.l}-${r.i}`] ?? 1, slotOf[r.id] ?? 0);
                return (
                  <span key={r.id} data-testid="risk-dot" data-active={on} aria-hidden="true"
                    style={{ left: `calc(${(r.i - 1) * 20 + 10}% + ${dx}px)`, top: `calc(${(5 - r.l) * 20 + 10}% + ${dy}px)` }}
                    className={`absolute w-6 h-6 rounded-full border-2 border-white shadow text-[9px] font-bold flex items-center justify-center transition-[left,top,opacity,transform] duration-700 ease-out motion-reduce:transition-none ${on ? 'opacity-100' : 'opacity-0 scale-50 pointer-events-none'} ${highlight === r.id ? 'bg-accent text-foreground scale-125 z-10' : 'bg-primary text-white'}`}>
                    {dotLabel(r.id)}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{tr(isAr, 'Bands: Low 1–4, Watch 5–9, Act 10–14, Urgent 15–25.', 'النطاقات: منخفض 1–4، مراقبة 5–9، تحرّك 10–14، عاجل 15–25.')}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-primary mb-2">{tr(isAr, 'Your top ten, ranked', 'أهم مخاطرك العشرة مرتّبة')}</p>
          <ol data-testid="rank-list" className="space-y-0.5">
            {risks.map((r, n) => {
              const score = r.l * r.i;
              const b = bandView(score);
              return (
                <li key={r.id}>
                  <button type="button" data-testid="rank-row" aria-pressed={pinned === r.id}
                    onClick={() => setPinned(p => (p === r.id ? null : r.id))}
                    onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(r.id)} onBlur={() => setHover(null)}
                    className={`w-full grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 min-h-[44px] px-2 py-1.5 rounded-lg text-start text-sm transition-colors hover:bg-muted aria-pressed:bg-muted ${highlight === r.id ? 'bg-muted' : ''}`}>
                    <span className="text-muted-foreground tabular-nums">{n + 1}</span>
                    <span>{isAr ? r.nameAr : r.name}{' '}<span data-testid="scope-tag" className="inline-block align-middle px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{isSpecific(r.id) ? tr(isAr, 'Sector-specific', 'خاص بالقطاع') : tr(isAr, 'Common', 'مشترك')}</span></span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${b.cls}`}>{isAr ? b.ar : b.en} {score}</span>
                    <span className="col-start-2 col-span-2 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                      <span className={`block h-full rounded-full ${b.cls.split(' ')[0]}`} style={{ width: `${(score / 25) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div data-testid="risk-detail" className="mt-3 rounded-xl bg-muted/60 p-3 text-sm min-h-[3.5rem]">
            {sel ? (
              <>
                <p className="font-semibold">{isAr ? sel.nameAr : sel.name}</p>
                <p className="text-muted-foreground">{tr(isAr, `Likelihood ${sel.l} × impact ${sel.i} = ${sel.l * sel.i} (${bandView(sel.l * sel.i).en})`, `الاحتمال ${sel.l} × الأثر ${sel.i} = ${sel.l * sel.i} (${bandView(sel.l * sel.i).ar})`)}</p>
                {'evidenceKind' in sel && (
                  <p data-testid="risk-evidence" className="mt-1 text-xs text-muted-foreground">
                    <b>{tr(isAr, 'Evidence: ', 'الدليل: ')}</b>{isAr ? SOURCE_TYPE_LABEL[sel.sourceType].ar : SOURCE_TYPE_LABEL[sel.sourceType].en}, {isAr ? EVIDENCE_KIND_LABEL[sel.evidenceKind].name.ar : EVIDENCE_KIND_LABEL[sel.evidenceKind].name.en} ({isAr ? EVIDENCE_KIND_LABEL[sel.evidenceKind].use.ar : EVIDENCE_KIND_LABEL[sel.evidenceKind].use.en}). {tr(isAr, 'Likelihood and impact are ISC sample values.', 'الاحتمال والأثر قيم نموذجية من آي سبلاي تشين.')}
                  </p>
                )}
                {selCat && <p className="mt-1"><b>{tr(isAr, 'Usual response: ', 'الاستجابة المعتادة: ')}</b>{isAr ? selCat.responseAr : selCat.response}</p>}
              </>
            ) : (
              <p className="text-muted-foreground">{tr(isAr, 'Select a risk to see its score and the usual response.', 'اختر خطرا لترى درجته والاستجابة المعتادة.')}</p>
            )}
          </div>
        </div>
      </div>
      <div data-testid="sector-evidence" className="rounded-2xl border border-border bg-white p-5 text-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-primary">{tr(isAr, 'What backs this sector', 'ما الذي يدعم هذا القطاع')}</span>
          <span data-testid="evidence-status" className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_CLS[ev.status]}`}>{isAr ? EVIDENCE_STATUS_LABEL[ev.status].ar : EVIDENCE_STATUS_LABEL[ev.status].en}</span>
        </div>
        <p>{isAr ? ev.note.ar : ev.note.en}</p>
        <ul className="space-y-1">
          {ev.sources.map(s => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-primary break-words"><bdi dir="ltr">{s.name}</bdi></a>
              <span className="text-xs text-muted-foreground"> ({isAr ? SOURCE_KIND_LABEL[s.kind].ar : SOURCE_KIND_LABEL[s.kind].en})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{tr(isAr, 'The sources support the themes. The order is ISC practitioner judgement, not a statistic and not your data.', 'المصادر تدعم المواضيع. أما الترتيب فتقدير ممارسي آي سبلاي تشين، لا إحصائية ولا بياناتك.')}</p>
      </div>
      <div className="border-2 border-primary rounded-2xl bg-white p-5" data-testid="board-preview">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="font-bold text-primary">{tr(isAr, 'Your first board page (preview)', 'صفحة مجلس الإدارة الأولى (معاينة)')}</p>
          <span className="text-xs text-muted-foreground">{tr(isAr, 'Sector: ', 'القطاع: ')}{sectorName}</span>
        </div>
        <p className="mt-3"><span className="text-4xl font-extrabold text-primary align-middle" data-testid="act-now-count">{actNow}</span> <span className="align-middle">{tr(isAr, `of ${total} risks need action now (Act or Urgent).`, `من ${total} مخاطر تحتاج إجراء الآن (تحرّك أو عاجل).`)}</span></p>
        <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-px" data-testid="band-strip" role="img"
          aria-label={tr(isAr, 'Split of the ten risks by band', 'توزيع المخاطر العشرة حسب النطاق')}>
          {(['critical', 'high', 'medium', 'low'] as const).map(k => bands[k] && (
            <span key={k} data-testid={`band-${k}`} data-count={bands[k]!.n} style={{ flexGrow: bands[k]!.n }} className={bands[k]!.v.cls.split(' ')[0]} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {(['critical', 'high', 'medium', 'low'] as const).filter(k => bands[k]).map(k => `${isAr ? bands[k]!.v.ar : bands[k]!.v.en} ${bands[k]!.n}`).join(' · ')}
        </p>
        {first && firstCat && (
          <p className="mt-2 text-sm"><b>{tr(isAr, 'Start with: ', 'ابدأ بـ: ')}</b>{isAr ? first.nameAr : first.name} — {isAr ? firstCat.responseAr : firstCat.response}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{tr(isAr, 'Indicative picks over sample risks, not your data. Build the real one in the toolkit.', 'اختيارات استرشادية على مخاطر نموذجية، لا من بياناتك. ابنِ الصفحة الحقيقية في الأدوات.')}</p>
        <button type="button" onClick={onOpenToolkit} className="mt-3 min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">{tr(isAr, 'Build mine in the toolkit', 'ابنِ صفحتي في الأدوات')}</button>
      </div>
    </section>
  );
}
