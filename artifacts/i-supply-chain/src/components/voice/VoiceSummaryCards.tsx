import React from 'react';
import { Star, TrendingUp, TrendingDown, Minus, MessageSquare, Gauge } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { FeedbackAnalytics } from '@/hooks/useFeedback';

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${value >= s - 0.25 ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export function VoiceSummaryCards({ data }: { data: FeedbackAnalytics }) {
  const { t } = useLanguage();
  const { promoters, passives, detractors } = data.npsBreakdown;
  const npsTotal = promoters + passives + detractors;
  const npsScore = npsTotal ? Math.round(((promoters - detractors) / npsTotal) * 100) : null;

  // Week-over-week trend: last completed bucket vs the one before
  const trend = data.weeklyTrend;
  const thisWeek = trend[trend.length - 1]?.count ?? 0;
  const prevWeek = trend[trend.length - 2]?.count ?? 0;
  const delta = thisWeek - prevWeek;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-muted-foreground';

  const card = 'bg-white rounded-2xl border border-border shadow-sm p-5';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="voice-summary-cards">
      <div className={card}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('voice.avgRating')}</p>
        <p className="text-3xl font-black text-[#082C6B]" data-testid="text-avg-rating">
          {data.averageRating != null ? data.averageRating.toFixed(2) : '—'}
        </p>
        <div className="mt-2"><Stars value={data.averageRating ?? 0} /></div>
      </div>

      <div className={card}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('voice.nps')}</p>
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#C9A84C]" />
          <p className="text-3xl font-black text-[#082C6B]" data-testid="text-nps-score">{npsScore ?? '—'}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="text-green-600 font-bold">{promoters}</span> {t('voice.promoters')} ·{' '}
          <span className="text-amber-600 font-bold">{passives}</span> {t('voice.passives')} ·{' '}
          <span className="text-red-500 font-bold">{detractors}</span> {t('voice.detractors')}
        </p>
      </div>

      <div className={card}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('voice.totalResponses')}</p>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#C9A84C]" />
          <p className="text-3xl font-black text-[#082C6B]" data-testid="text-total-responses">{data.total}</p>
        </div>
      </div>

      <div className={card}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('voice.trend')}</p>
        <div className={`flex items-center gap-2 ${trendColor}`}>
          <TrendIcon className="w-6 h-6" />
          <p className="text-3xl font-black" data-testid="text-trend">{delta > 0 ? `+${delta}` : delta}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t('voice.trendVsPrev')}</p>
      </div>
    </div>
  );
}
