/**
 * ConfidenceTierBadge — displays the confidence tier for a segment's evidence.
 *
 * Tiers:
 *   self_reported       — grey  "Self-reported" / "مُبلَّغ ذاتياً"
 *   ai_evaluated        — blue  "AI-evaluated" / "مُقيَّم بالذكاء الاصطناعي"
 *   consultant_validated— gold  "Consultant-validated" / "مُعتمَد من الاستشاري"
 *
 * A segment's effective tier is the *best* tier across all its sub-segments
 * that have confirmed evidence. An amber ⚠ overlays if any sub-segment has
 * a flagged evaluation.
 */
import React from 'react';
import type { EvidenceRecord } from './EvidenceUploadZone';

interface ConfidenceTierBadgeProps {
  lang:       'en' | 'ar';
  evidence:   EvidenceRecord[];
  className?: string;
  /** When true, renders as a pill; when false, renders as an inline span */
  asPill?:    boolean;
}

export type ConfidenceTier = 'self_reported' | 'ai_evaluated' | 'consultant_validated';

export function getSegmentTier(evidence: EvidenceRecord[]): ConfidenceTier {
  if (evidence.some(e => e.confidenceTier === 'consultant_validated')) return 'consultant_validated';
  if (evidence.some(e => e.confidenceTier === 'ai_evaluated' && e.aiEvaluation?.plausible_support)) return 'ai_evaluated';
  return 'self_reported';
}

export function hasFlag(evidence: EvidenceRecord[]): boolean {
  return evidence.some(e => e.aiEvaluation && !e.aiEvaluation.plausible_support);
}

const TIER_CONFIG: Record<ConfidenceTier, {
  bg:     string;
  text:   string;
  border: string;
  labelEn: string;
  labelAr: string;
}> = {
  self_reported: {
    bg:      'bg-slate-100',
    text:    'text-slate-600',
    border:  'border-slate-200',
    labelEn: 'Self-reported',
    labelAr: 'مُبلَّغ ذاتياً',
  },
  ai_evaluated: {
    bg:      'bg-blue-100',
    text:    'text-blue-800',
    border:  'border-blue-200',
    labelEn: 'AI-evaluated',
    labelAr: 'مُقيَّم بالذكاء الاصطناعي',
  },
  consultant_validated: {
    bg:      'bg-amber-100',
    text:    'text-amber-800',
    border:  'border-amber-300',
    labelEn: 'Consultant-validated',
    labelAr: 'مُعتمَد من الاستشاري',
  },
};

export function ConfidenceTierBadge({ lang, evidence, className = '', asPill = true }: ConfidenceTierBadgeProps) {
  const ar    = lang === 'ar';
  const tier  = getSegmentTier(evidence);
  const flagged = hasFlag(evidence);
  const cfg   = TIER_CONFIG[tier];

  if (!asPill) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cfg.text} ${className}`}>
        {flagged && <span title={ar ? 'دليل مُحدَّد يتطلب مراجعة' : 'Flagged evidence — review recommended'}>⚠</span>}
        {ar ? cfg.labelAr : cfg.labelEn}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
      title={flagged
        ? (ar ? 'دليل مُحدَّد يتطلب مراجعة' : 'Flagged evidence — review recommended')
        : undefined}
    >
      {flagged && <span aria-hidden>⚠</span>}
      {ar ? cfg.labelAr : cfg.labelEn}
    </span>
  );
}
