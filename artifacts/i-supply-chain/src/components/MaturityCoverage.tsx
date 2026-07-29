/**
 * MaturityCoverage — compact bilingual coverage indicator.
 *
 * Shows how many segments and sub-segments have been assessed and what
 * fraction of the full maturity model that represents.  When fewer than
 * 40 % of sub-segments are covered a yellow caution badge is shown so
 * partial assessments are never presented with misleading implied confidence.
 */
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface MaturityCoverageProps {
  /** Number of segments where all flat questions have been answered. */
  assessedSegments: number;
  /** Total number of active segments in this assessment session. */
  totalSegments: number;
  /** Number of sub-segments that belong to assessed segments. */
  coveredSubSegments: number;
  /** Total number of sub-segments across all active segments. */
  totalSubSegments: number;
  /** Optional: the industry identifier currently selected. */
  industryId?: string;
  /** Optional: human-readable industry label (already localised by caller). */
  industryLabel?: string;
}

export function MaturityCoverage({
  assessedSegments,
  totalSegments,
  coveredSubSegments,
  totalSubSegments,
  industryId: _industryId,
  industryLabel: _industryLabel,
}: MaturityCoverageProps) {
  const { lang } = useLanguage();
  const ar       = lang === 'ar';

  const pct       = totalSubSegments > 0
    ? Math.round((coveredSubSegments / totalSubSegments) * 100)
    : 0;
  const isPartial = pct < 40;

  return (
    <div
      data-testid="maturity-coverage"
      className={[
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-sm',
        isPartial
          ? 'border-amber-200 bg-amber-50/60'
          : 'border-border bg-white',
      ].join(' ')}
      dir={ar ? 'rtl' : 'ltr'}
    >
      {/* Info icon */}
      <Info className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />

      {/* Segments assessed */}
      <span className="text-muted-foreground">
        <span
          data-testid="coverage-segments"
          className="font-semibold text-foreground"
        >
          {ar
            ? `${assessedSegments} من أصل ${totalSegments} مجالاً`
            : `${assessedSegments} of ${totalSegments} segments`}
        </span>
        {' '}{ar ? 'مُقيَّمة' : 'assessed'}
      </span>

      <span className="text-muted-foreground select-none">·</span>

      {/* Sub-segments covered */}
      <span
        data-testid="coverage-subsegments"
        className="font-semibold text-foreground"
      >
        {ar
          ? `${coveredSubSegments} من أصل ${totalSubSegments} مجالاً فرعياً`
          : `${coveredSubSegments} of ${totalSubSegments} sub-segments`}
      </span>

      <span className="text-muted-foreground select-none">·</span>

      {/* Percentage */}
      <span
        data-testid="coverage-pct"
        className="font-semibold text-foreground"
      >
        {pct}%{' '}
        {ar ? 'من النموذج الكامل' : 'of full model'}
      </span>

      {/* Caution badge — shown when < 40 % covered */}
      {isPartial && (
        <span
          data-testid="coverage-caution"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-amber-800 text-xs font-semibold"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {ar
            ? 'تقييم جزئي — النتائج استرشادية فقط'
            : 'Partial assessment — results are indicative only'}
        </span>
      )}
    </div>
  );
}
