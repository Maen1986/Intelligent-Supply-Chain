/**
 * maturitySubSegTypes.ts
 *
 * Shared type + doc header for the CORE_SEGMENTS 0-4 (Strategy, Procurement,
 * CLM, SRM, Risk) sub-segment content, split 28 Aug 2026 (#386) out of the
 * former single 7,366-line maturitySubSegData1to5.ts into one file per
 * segment (maturitySubSegStrategy.ts / ...Procurement.ts / ...Clm.ts /
 * ...Srm.ts / ...Risk.ts) plus this shared type file. maturitySubSegData1to5.ts
 * itself is now a thin backward-compatible barrel re-export -- every
 * existing import across the codebase (`from './maturitySubSegData1to5'`)
 * continues to work unchanged.
 *
 * Answer key convention (Option A — flat, 3-part):
 *   "{segIdx}-{subIdx}-{questionIdx}"
 *
 * These are distinct from the legacy 5 flat questions which use the
 * 2-part "{segIdx}-{questionIdx}" format and are read by segScore().
 * The two formats coexist with no key conflicts.
 *
 * All Arabic is independently authored formal Gulf professional register (فصحى),
 * appropriate for C-level GCC executives. Not machine-translated.
 *
 * Industry IDs (from INTAKE_INDUSTRIES):
 *   manufacturing | fmcg | pharma | retail | logistics | marine |
 *   construction  | oil_gas | government | technology | banking | other
 * Weights: 0.5 = low relevance · 1.0 = baseline · 1.5 = high relevance
 * Missing keys default to 1.0 in the scoring engine.
 */

// ── Local type (structurally compatible with SubSegment in maturityData.tsx) ─

export interface SubSegmentData {
  id: string;
  title: string;
  titleAr: string;
  hint?: string;
  hintAr?: string;
  /** 1–4 industry framework/standard abbreviations most relevant to this sub-segment */
  frameworks?: string[];
  questions: {
    q: string;
    qAr: string;
    levels:   [string, string, string, string, string];
    levelsAr: [string, string, string, string, string];
  }[];
  benchmarks: { gcc: number; topQuartile: number };
  industryWeights: Record<string, number>;
  evidence?: { label: string; labelAr: string; hint: string; hintAr: string };
}

