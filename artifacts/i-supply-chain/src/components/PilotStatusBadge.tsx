/**
 * PilotStatusBadge
 *
 * Platform-wide "Pilot / Active Development" indicator, added 30 Aug 2026
 * per owner decision: label the platform's real, current build stage so
 * the team can keep iterating in front of real prospects without the
 * unfinished parts being mistaken for the finished product -- without
 * undermining the credibility of the real, sourced content already live
 * (GCC benchmark survey outreach, LCGPA/Tender tools, Contract
 * Intelligence, etc.).
 *
 * Deliberately NOT "Demo" -- that word implies the data itself is
 * illustrative/fake, which is false for most of the platform and would
 * work against the live outreach campaigns built on real, cited sources.
 * "Demo/Illustrative" labeling already exists narrowly where it's true
 * (see IndustryBenchmark.tsx's #398b preview mode) -- this badge is the
 * separate, honest, platform-wide signal that the BUILD, not the data,
 * is still actively evolving.
 *
 * Single insertion point (next to the Logo in Header.tsx) so it appears
 * on every page without per-page wiring or drift risk.
 */
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PilotStatusBadgeProps {
  /** Pass 'ar' when the UI is in Arabic mode */
  lang?: 'ar' | 'en';
  className?: string;
}

export function PilotStatusBadge({ lang, className }: PilotStatusBadgeProps) {
  const ar = lang === 'ar';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wide cursor-default select-none leading-tight whitespace-nowrap ${className ?? ''}`}
            data-testid="pilot-status-badge"
          >
            {ar ? 'تجريبي · قيد التطوير' : 'Pilot · Active Development'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            {ar
              ? 'المنصة قيد التطوير النشط -- الميزات والتصميم يتغيران باستمرار أثناء بنائنا واختبارنا معاً. البيانات المصدرية المعروضة (مثل معايير GCC والمراجع القانونية) حقيقية وموثقة؛ هذا الوسم يشير إلى مرحلة بناء المنصة نفسها، لا إلى مصداقية البيانات.'
              : 'The platform is under active development -- features and design change as we keep building and testing. Sourced data shown (e.g. GCC benchmarks, legal references) is real and cited; this tag reflects the build stage of the platform itself, not the credibility of the data.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PilotStatusBadge;
