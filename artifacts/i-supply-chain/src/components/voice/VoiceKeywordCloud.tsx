import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';

const SIZE_CLASSES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const COLOR_CLASSES = ['text-[#082C6B]', 'text-[#0B3D91]', 'text-[#C9A84C]', 'text-slate-600'];

export function VoiceKeywordCloud({ keywords }: { keywords: { word: string; count: number }[] }) {
  const { t } = useLanguage();

  const max = Math.max(1, ...keywords.map((k) => k.count));
  const min = Math.min(max, ...keywords.map((k) => k.count));
  const scale = (count: number) => {
    if (max === min) return 3;
    return Math.round(((count - min) / (max - min)) * (SIZE_CLASSES.length - 1));
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5" data-testid="voice-keyword-cloud">
      <h3 className="font-bold text-sm mb-4">{t('voice.keywords')}</h3>
      {keywords.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('voice.noData')}</p>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 leading-relaxed">
          {keywords.map((k, i) => (
            <span
              key={k.word}
              className={`${SIZE_CLASSES[scale(k.count)]} ${COLOR_CLASSES[i % COLOR_CLASSES.length]} font-semibold`}
              title={`${k.word} — ${k.count}`}
              data-testid={`keyword-${k.word}`}
            >
              {k.word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
