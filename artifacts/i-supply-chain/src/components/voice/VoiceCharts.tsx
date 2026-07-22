import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line,
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import type { FeedbackAnalytics } from '@/hooks/useFeedback';

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0B3D91'];

export function VoiceCharts({ data }: { data: FeedbackAnalytics }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const toolLabel = (tool: string) => {
    const map: Record<string, [string, string]> = {
      diagnostic: ['Diagnostic', 'التشخيص'],
      maturity: ['Maturity', 'النضج'],
    };
    const m = map[tool];
    return m ? (isAr ? m[1] : m[0]) : tool;
  };

  const ratingData = data.ratingDistribution.map((d) => ({ name: `${d.rating}★`, count: d.count, rating: d.rating }));
  const toolData = data.byTool.map((d) => ({ ...d, name: toolLabel(d.tool) }));
  const weekData = data.weeklyTrend.map((d) => ({ ...d, label: d.weekStart.slice(5) }));

  const panel = 'bg-white rounded-2xl border border-border shadow-sm p-5';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="voice-charts">
      {/* Rating distribution */}
      <div className={panel}>
        <h3 className="font-bold text-sm mb-4">{t('voice.ratingDist')}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ratingData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {ratingData.map((d, i) => <Cell key={i} fill={RATING_COLORS[d.rating - 1]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly volume sparkline */}
      <div className={panel}>
        <h3 className="font-bold text-sm mb-4">{t('voice.weeklyVolume')}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0B3D91" strokeWidth={2.5} dot={{ r: 3, fill: '#C9A84C', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-tool breakdown */}
      <div className={panel}>
        <h3 className="font-bold text-sm mb-4">{t('voice.byTool')}</h3>
        {toolData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('voice.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toolData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#082C6B" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
