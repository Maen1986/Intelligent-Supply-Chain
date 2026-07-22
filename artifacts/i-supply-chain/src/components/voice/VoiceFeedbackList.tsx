import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/LanguageContext';
import { useFeedbackList, type FeedbackListFilters } from '@/hooks/useFeedback';

const PER_PAGE = 20;

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${value >= s ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export function VoiceFeedbackList() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [tool, setTool] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minRating, setMinRating] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filters: FeedbackListFilters = {
    tool: tool === 'all' ? undefined : tool,
    from: from || undefined,
    to: to || undefined,
    minRating: minRating === 'all' ? undefined : Number(minRating),
    page,
    perPage: PER_PAGE,
  };
  const { data, isLoading } = useFeedbackList(filters);

  const rows = data?.feedback ?? [];
  const hasNext = rows.length === PER_PAGE;

  const toolLabel = (v: string) => {
    if (v === 'diagnostic') return isAr ? 'التشخيص' : 'Diagnostic';
    if (v === 'maturity') return isAr ? 'النضج' : 'Maturity';
    return v;
  };

  const resetPage = () => setPage(1);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5" data-testid="voice-feedback-list">
      <h3 className="font-bold text-sm mb-4">{t('voice.entries')}</h3>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('voice.filterTool')}</p>
          <Select value={tool} onValueChange={(v) => { setTool(v); resetPage(); }}>
            <SelectTrigger className="w-[150px] h-9" data-testid="select-filter-tool"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('voice.allTools')}</SelectItem>
              <SelectItem value="diagnostic">{toolLabel('diagnostic')}</SelectItem>
              <SelectItem value="maturity">{toolLabel('maturity')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('voice.from')}</p>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); resetPage(); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="input-filter-from" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('voice.to')}</p>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); resetPage(); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="input-filter-to" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('voice.minRating')}</p>
          <Select value={minRating} onValueChange={(v) => { setMinRating(v); resetPage(); }}>
            <SelectTrigger className="w-[110px] h-9" data-testid="select-filter-rating"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('voice.any')}</SelectItem>
              {[1, 2, 3, 4, 5].map((r) => <SelectItem key={r} value={String(r)}>{r}★+</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('voice.noData')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-start py-2 px-2">{t('voice.colDate')}</th>
                <th className="text-start py-2 px-2">{t('voice.colCompany')}</th>
                <th className="text-start py-2 px-2">{t('voice.colTool')}</th>
                <th className="text-start py-2 px-2">{t('voice.colRating')}</th>
                <th className="text-start py-2 px-2">NPS</th>
                <th className="text-start py-2 px-2">{t('voice.colComment')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = expanded === r.id;
                const snippet = r.comment && r.comment.length > 80 ? r.comment.slice(0, 80) + '…' : r.comment;
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`border-b border-border/60 ${r.comment ? 'cursor-pointer hover:bg-muted/40' : ''}`}
                      onClick={() => r.comment && setExpanded(isOpen ? null : r.id)}
                      data-testid={`row-feedback-${r.id}`}
                    >
                      <td className="py-2.5 px-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString(isAr ? 'ar' : 'en-GB')}</td>
                      <td className="py-2.5 px-2">{r.company ?? '—'}</td>
                      <td className="py-2.5 px-2">{toolLabel(r.tool)}</td>
                      <td className="py-2.5 px-2"><Stars value={r.rating} /></td>
                      <td className="py-2.5 px-2">{r.nps ?? '—'}</td>
                      <td className="py-2.5 px-2 max-w-[280px]">
                        <span className="flex items-center gap-1">
                          <span className="truncate">{snippet ?? '—'}</span>
                          {r.comment && (isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />)}
                        </span>
                      </td>
                    </tr>
                    {isOpen && r.comment && (
                      <tr className="border-b border-border/60 bg-muted/30">
                        <td colSpan={6} className="py-3 px-4 text-sm whitespace-pre-wrap" data-testid={`comment-full-${r.id}`}>{r.comment}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">{t('voice.page')} {page}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} data-testid="button-page-prev">
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t('voice.prev')}
          </Button>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)} data-testid="button-page-next">
            {t('voice.next')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
