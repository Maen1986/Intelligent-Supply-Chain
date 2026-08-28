/**
 * maturitySubSegData1to5.ts
 *
 * BARREL FILE (split 28 Aug 2026, #386): this used to be a single
 * 7,366-line file holding all five CORE_SEGMENTS 0-4 sub-segment arrays
 * (Strategy, Procurement, CLM, SRM, Risk). The content now lives in one
 * file per segment -- maturitySubSegStrategy.ts, maturitySubSegProcurement.ts,
 * maturitySubSegClm.ts, maturitySubSegSrm.ts, maturitySubSegRisk.ts -- plus
 * a shared maturitySubSegTypes.ts for the SubSegmentData type and doc
 * header. This file re-exports everything from those files unchanged, so
 * every existing `from './maturitySubSegData1to5'` import across the
 * codebase (maturityData.tsx, maturityRegulatoryJordan/Qatar/Bahrain/
 * Oman/Uae.ts, clmComplianceItem42.ts, maturitySubSegData6to11.ts, and
 * their tests) continues to work with zero changes.
 *
 * Same reasoning as maturitySubSegData6to11.ts's own header for CORE_SEGMENTS
 * 5-10: keep authored content easy to review/diff/hand off per segment,
 * without forcing every consumer to know or care about the split.
 */
export type { SubSegmentData } from './maturitySubSegTypes';
export { STRATEGY_SUB_SEGMENTS } from './maturitySubSegStrategy';
export { PROCUREMENT_SUB_SEGMENTS } from './maturitySubSegProcurement';
export { CLM_SUB_SEGMENTS } from './maturitySubSegClm';
export { SRM_SUB_SEGMENTS } from './maturitySubSegSrm';
export { RISK_SUB_SEGMENTS } from './maturitySubSegRisk';
