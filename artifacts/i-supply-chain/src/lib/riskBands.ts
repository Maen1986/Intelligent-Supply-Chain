/**
 * One risk band set for the whole platform (#863).
 * Score = likelihood (1-5) x impact (1-5) = 1-25.
 * ISC default / board appetite: Critical >= 15, High 10-14, Medium 5-9, Low 1-4.
 * A client's own RM-01 criteria override these in the engine; this file is the
 * default shared by the Heat Map tab and the toolkit. Change numbers here only.
 */
export type RiskBand = 'critical' | 'high' | 'medium' | 'low';

export const RISK_BAND_MIN = { critical: 15, high: 10, medium: 5 } as const;

export function riskBand(score: number): RiskBand {
  if (score >= RISK_BAND_MIN.critical) return 'critical';
  if (score >= RISK_BAND_MIN.high) return 'high';
  if (score >= RISK_BAND_MIN.medium) return 'medium';
  return 'low';
}
