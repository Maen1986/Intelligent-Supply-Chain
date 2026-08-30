/**
 * Sector-Aware Reorder-Point Adjustment for Ramadan (#377, Tier B), 30 Aug
 * 2026 -- a deeper layer on top of the Seasonal Calendar (#376, Tier A),
 * deliberately kept as a separate module rather than folded into it (per
 * the original 22 Aug scoping note: "deliberately not bundled with it").
 *
 * Scope discipline, per Decision Record 8.7: the classic reorder-point
 * formula is `reorder point = average daily usage x lead time`. Ramadan
 * can shift BOTH sides of that formula -- but only one side has a real,
 * citable, computable basis:
 *
 *  - Lead-time side (computed here, not invented): a supplier's effective
 *    capacity during Ramadan is grounded in the same real, sourced
 *    statutory working-hours data as #376 (e.g. Saudi/Qatar/Bahrain
 *    private sector drops to 6h from a standard 8h day -- a real,
 *    verifiable 0.75x capacity ratio; Jordan has no mandated reduction,
 *    so its ratio is 1.0). On top of that, any Eid al-Fitr/Eid al-Adha
 *    closure days (also real, sourced, from gccSeasonalCalendar.ts) that
 *    fall inside the order's lead-time window are added as full closed
 *    days. Both of these are real, disclosed, and traceable to the same
 *    citations as #376 -- not estimates.
 *
 *  - Demand side (NOT computed here, NOT invented): how much a specific
 *    product's DAILY USAGE shifts during Ramadan varies enormously by
 *    category -- food/FMCG demand often rises sharply ahead of Ramadan
 *    and around Eid, while industrial/construction/services activity
 *    often falls. No single sourced multiplier exists (or could exist)
 *    that is honest across "any GCC country x any industry x any SKU."
 *    Building one would mean fabricating a number per Decision Record
 *    8.7. Instead, the seasonal demand multiplier is a REQUIRED CLIENT
 *    INPUT (defaulting to 1.0 = no assumed change), with a comment field
 *    for the client to record where that number came from (their own
 *    POS/ERP history is the recommended source, stated in the UI).
 *
 * This keeps the tool's real contribution -- correctly quantifying the
 * lead-time-side impact from real Ramadan-hours law and the real Eid
 * closure calendar -- honest and separate from the demand-side number,
 * which only the client can responsibly supply.
 */

import { GCC_SEASONAL_DATA, type GccCountry, getYearData } from './gccSeasonalCalendar';

export interface ReorderPointInputs {
  country: GccCountry;
  /** Units/day, the client's own baseline (non-Ramadan) average daily usage. */
  avgDailyUsage: number | null;
  /** Days, the supplier's normal (non-Ramadan) quoted lead time. */
  baseLeadTimeDays: number | null;
  /** ISO date the order would be placed -- used to check Eid-window overlap. Defaults to today if omitted by the caller. */
  orderDate: string;
  /**
   * Client-supplied seasonal demand multiplier for THIS product during
   * Ramadan/Eid (1.0 = no assumed change, >1 = demand rises, <1 = demand
   * falls). Required as an explicit input, never defaulted to anything
   * but 1.0, and never inferred -- see file header.
   */
  seasonalDemandMultiplier: number;
  /** Optional free-text client note on where seasonalDemandMultiplier came from (POS history, ERP trend, judgment call, etc.) -- surfaced back in the result for auditability. */
  demandMultiplierSource: string;
}

export function defaultReorderPointInputs(): ReorderPointInputs {
  return {
    country: 'saudi',
    avgDailyUsage: null,
    baseLeadTimeDays: null,
    orderDate: new Date().toISOString().slice(0, 10),
    seasonalDemandMultiplier: 1.0,
    demandMultiplierSource: '',
  };
}

/**
 * Real, disclosed capacity ratio from #376's sourced Ramadan-hours data --
 * NOT a measured throughput study, just the statutory hours ratio vs an
 * 8h standard day. 1.0 for a country with no mandated reduction (Jordan).
 */
export function getCapacityFactor(country: GccCountry): number {
  const h = GCC_SEASONAL_DATA[country].ramadanHours;
  if (!h.mandated || h.privateSectorHoursPerDay === null) return 1.0;
  return h.privateSectorHoursPerDay / 8;
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00Z').getTime();
  const b = new Date(bIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  const days = daysBetween(start, end) + 1;
  return days > 0 ? days : 0;
}

/**
 * Real, sourced Eid closure days (2026 only -- see #376's date-reality
 * note) that fall inside [orderDate, orderDate + baseLeadTimeDays]. Zero
 * for any window outside 2026 or outside a sourced closure range -- this
 * does not guess at unsourced years.
 */
export function getEidClosureOverlapDays(country: GccCountry, orderDate: string, baseLeadTimeDays: number): number {
  const windowEnd = addDaysIso(orderDate, baseLeadTimeDays);
  const yd = getYearData(country, 2026);
  if (!yd) return 0;
  const fitr = overlapDays(orderDate, windowEnd, yd.eidAlFitr.startDate, yd.eidAlFitr.endDate);
  const adha = overlapDays(orderDate, windowEnd, yd.eidAlAdha.startDate, yd.eidAlAdha.endDate);
  return fitr + adha;
}

export interface ReorderPointResult {
  hasEnoughInputs: boolean;
  capacityFactor: number;
  eidClosureOverlapDays: number;
  effectiveLeadTimeDays: number | null;
  baselineReorderPoint: number | null;
  adjustedReorderPoint: number | null;
  /** adjustedReorderPoint - baselineReorderPoint, the extra stock this recommends carrying (or less, if negative). */
  deltaUnits: number | null;
}

export function computeReorderPoint(inputs: ReorderPointInputs): ReorderPointResult {
  const capacityFactor = getCapacityFactor(inputs.country);
  const hasEnoughInputs = inputs.avgDailyUsage !== null && inputs.avgDailyUsage > 0
    && inputs.baseLeadTimeDays !== null && inputs.baseLeadTimeDays > 0;

  const eidClosureOverlapDays = hasEnoughInputs
    ? getEidClosureOverlapDays(inputs.country, inputs.orderDate, inputs.baseLeadTimeDays!)
    : 0;

  if (!hasEnoughInputs) {
    return {
      hasEnoughInputs, capacityFactor, eidClosureOverlapDays,
      effectiveLeadTimeDays: null, baselineReorderPoint: null, adjustedReorderPoint: null, deltaUnits: null,
    };
  }

  const baseLeadTimeDays = inputs.baseLeadTimeDays!;
  const avgDailyUsage = inputs.avgDailyUsage!;

  const effectiveLeadTimeDays = (baseLeadTimeDays / capacityFactor) + eidClosureOverlapDays;
  const baselineReorderPoint = avgDailyUsage * baseLeadTimeDays;
  const adjustedReorderPoint = avgDailyUsage * inputs.seasonalDemandMultiplier * effectiveLeadTimeDays;

  return {
    hasEnoughInputs,
    capacityFactor,
    eidClosureOverlapDays,
    effectiveLeadTimeDays,
    baselineReorderPoint,
    adjustedReorderPoint,
    deltaUnits: adjustedReorderPoint - baselineReorderPoint,
  };
}

export function buildReorderPointPrompt(inputs: ReorderPointInputs, result: ReorderPointResult, isAr: boolean): string {
  const data = GCC_SEASONAL_DATA[inputs.country];
  const lines = [
    isAr ? '## تعديل نقطة إعادة الطلب لرمضان' : '## Ramadan Reorder-Point Adjustment',
    '',
    isAr ? `الدولة: ${data.labelAr}` : `Country: ${data.labelEn}`,
    isAr ? `عامل السعة (من ساعات رمضان القانونية): ${result.capacityFactor}` : `Capacity factor (from statutory Ramadan hours): ${result.capacityFactor}`,
    isAr ? `أيام إغلاق العيد المتداخلة: ${result.eidClosureOverlapDays}` : `Overlapping Eid closure days: ${result.eidClosureOverlapDays}`,
    result.baselineReorderPoint !== null
      ? (isAr ? `نقطة إعادة الطلب الأساسية: ${result.baselineReorderPoint.toLocaleString()} وحدة` : `Baseline reorder point: ${result.baselineReorderPoint.toLocaleString()} units`)
      : '',
    result.adjustedReorderPoint !== null
      ? (isAr ? `نقطة إعادة الطلب المعدّلة: ${result.adjustedReorderPoint.toLocaleString()} وحدة` : `Adjusted reorder point: ${result.adjustedReorderPoint.toLocaleString()} units`)
      : '',
    isAr
      ? `مضاعف الطلب الموسمي المُدخل من العميل: ${inputs.seasonalDemandMultiplier} (المصدر: ${inputs.demandMultiplierSource || 'غير محدد'})`
      : `Client-entered seasonal demand multiplier: ${inputs.seasonalDemandMultiplier} (source: ${inputs.demandMultiplierSource || 'not specified'})`,
    '',
    isAr
      ? 'اقترح خطوات عملية للمخزون استناداً فقط إلى الأرقام أعلاه -- وضّح أن مضاعف الطلب مُدخل من العميل وليس تقديراً من المنصة.'
      : 'Suggest practical inventory-planning steps grounded only in the figures above -- note that the demand multiplier is client-supplied, not a platform estimate.',
  ].filter(Boolean);
  return lines.join('\n');
}
