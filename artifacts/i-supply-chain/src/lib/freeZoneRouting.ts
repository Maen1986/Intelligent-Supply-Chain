/**
 * GCC Free-Zone / Bonded-Warehouse Routing Decision Tool (#379), 28 Aug 2026
 * -- benchmark-grade, non-certified storage + duty cost comparison.
 *
 * Design note (per the unblocking research pass, free-zone-routing-379-
 * scoping-draft.md, 25 Aug 2026): the original scoping assumed the blocker
 * was a "re-export volume-threshold" figure for the Makasa mechanism. That
 * premise was wrong -- confirmed via Dubai Trade's own documentation, Makasa
 * is a per-declaration stamp mechanism (a Statistical Export Declaration
 * carrying a "Makasa Stamp," submitted digitally via the Dubai Trade Portal/
 * Mirsal 2 since Jan 2026), not a volume-gated rule. It applies per shipment
 * regardless of size, so there is no threshold to find. This file implements
 * the real, corrected decision: storage-cost differential + import-duty
 * deferral/avoidance, not a volume cutoff.
 *
 * Real, sourced published benchmark figures used as defaults (2026 market
 * ranges, NOT a specific client's negotiated rate -- same "benchmark, not
 * verified" honesty tier as the #382/#384 coverage-badge pattern elsewhere
 * on the platform):
 *   - JAFZA warehouse rental: AED 80-180/sqm/yr (freezonecompare.com, 2026)
 *   - KEZAD warehouse lease: AED 70-150/sqm/yr (uaefreezonefinder.com, 2026)
 *   - GCC Common External Tariff: flat 5% on CIF value for most goods
 *     (well-established, consistently confirmed across multiple 2026
 *     sources)
 *
 * No benchmark was found this pass for standard (non-free-zone / mainland)
 * warehousing rates -- that field is left blank by default and the client
 * must enter their own figure; this tool does not fabricate a mainland
 * storage rate to fill the gap (Decision Record 8.7).
 *
 * The "duty deferral" value shown for a mainland-sale routing choice is the
 * deferred amount itself, not a discounted net-present-value of the
 * deferral -- that would require a client-specific cost-of-capital
 * assumption this tool does not have and will not invent.
 */

export type FreeZone = 'jafza' | 'kezad' | 'custom';

export interface FreeZoneBenchmark {
  zone: FreeZone;
  labelEn: string;
  labelAr: string;
  /** Published annual rate range, AED/sqm/yr. Null for 'custom' (no benchmark, client enters their own). */
  rateRangeLowAedSqmYr: number | null;
  rateRangeHighAedSqmYr: number | null;
  sourceNoteEn: string;
  sourceNoteAr: string;
}

export const FREE_ZONE_BENCHMARKS: Record<FreeZone, FreeZoneBenchmark> = {
  jafza: {
    zone: 'jafza',
    labelEn: 'JAFZA (Jebel Ali Free Zone)',
    labelAr: 'المنطقة الحرة بجبل علي (JAFZA)',
    rateRangeLowAedSqmYr: 80,
    rateRangeHighAedSqmYr: 180,
    sourceNoteEn: 'Published range AED 80-180/sqm/yr, freezonecompare.com "JAFZA Warehouse & Setup Costs 2026" -- a market benchmark, not your negotiated rate.',
    sourceNoteAr: 'نطاق منشور ٨٠-١٨٠ درهم/م²/سنة، المصدر: freezonecompare.com "JAFZA Warehouse & Setup Costs 2026" -- معيار سوقي وليس سعرك التفاوضي الفعلي.',
  },
  kezad: {
    zone: 'kezad',
    labelEn: 'KEZAD (Khalifa Economic Zones Abu Dhabi)',
    labelAr: 'المناطق الاقتصادية بخليفة أبوظبي (KEZAD)',
    rateRangeLowAedSqmYr: 70,
    rateRangeHighAedSqmYr: 150,
    sourceNoteEn: 'Published range AED 70-150/sqm/yr, uaefreezonefinder.com "UAE Free Zone Warehouse & Logistics Guide 2026" -- a market benchmark, not your negotiated rate.',
    sourceNoteAr: 'نطاق منشور ٧٠-١٥٠ درهم/م²/سنة، المصدر: uaefreezonefinder.com "UAE Free Zone Warehouse & Logistics Guide 2026" -- معيار سوقي وليس سعرك التفاوضي الفعلي.',
  },
  custom: {
    zone: 'custom',
    labelEn: 'Other / Enter my own rate',
    labelAr: 'أخرى / إدخال سعري الخاص',
    rateRangeLowAedSqmYr: null,
    rateRangeHighAedSqmYr: null,
    sourceNoteEn: 'No published benchmark used -- enter your own quoted free-zone storage rate.',
    sourceNoteAr: 'لا يُستخدم معيار منشور -- أدخل سعر التخزين الفعلي الذي حصلت عليه في المنطقة الحرة.',
  },
};

/** GCC Common External Tariff -- flat 5% on CIF value for most goods, well-sourced and consistently confirmed. */
export const GCC_CET_RATE_PCT = 5;

export function defaultFreeZoneRate(zone: FreeZone): number | null {
  const b = FREE_ZONE_BENCHMARKS[zone];
  if (b.rateRangeLowAedSqmYr === null || b.rateRangeHighAedSqmYr === null) return null;
  return Math.round((b.rateRangeLowAedSqmYr + b.rateRangeHighAedSqmYr) / 2);
}

export type RoutingChoice = 'reExport' | 'mainlandSale';

export interface RoutingInputs {
  freeZone: FreeZone;
  /** AED/sqm/yr -- defaults from the selected zone's benchmark midpoint, editable. Null for 'custom' until entered. */
  freeZoneRateAedSqmYr: number | null;
  /** AED/sqm/yr -- no sourced benchmark; null until the client enters their own figure. */
  mainlandRateAedSqmYr: number | null;
  shipmentValueCifAed: number | null;
  storageDurationMonths: number | null;
  storageAreaSqm: number | null;
  routingChoice: RoutingChoice;
}

export function defaultRoutingInputs(): RoutingInputs {
  return {
    freeZone: 'jafza',
    freeZoneRateAedSqmYr: defaultFreeZoneRate('jafza'),
    mainlandRateAedSqmYr: null,
    shipmentValueCifAed: null,
    storageDurationMonths: null,
    storageAreaSqm: null,
    routingChoice: 'reExport',
  };
}

export interface RoutingResult {
  hasEnoughForDuty: boolean;
  hasEnoughForStorage: boolean;
  hasMainlandStorageRate: boolean;
  dutyAmountAed: number | null;
  /** Duty avoided in the UAE entirely (re-export via Makasa) or 0 (mainland sale -- duty is deferred, not avoided). */
  dutyAvoidedInUaeAed: number | null;
  /** Duty deferred until mainland sale -- same amount as dutyAmountAed, paid later rather than upfront. Null for re-export (nothing deferred, it's avoided). */
  dutyDeferredAed: number | null;
  freeZoneStorageCostAed: number | null;
  mainlandStorageCostAed: number | null;
  /** Free-zone path total = storage + (duty if mainlandSale routing) */
  freeZonePathTotalAed: number | null;
  /** Mainland path total = mainland storage (if entered) + duty paid upfront */
  mainlandPathTotalAed: number | null;
  savingsAed: number | null;
}

function n(v: number | null): number {
  return v === null || Number.isNaN(v) || v < 0 ? 0 : v;
}

export function computeRouting(inputs: RoutingInputs): RoutingResult {
  const hasEnoughForDuty = inputs.shipmentValueCifAed !== null && inputs.shipmentValueCifAed > 0;
  const hasEnoughForStorage =
    inputs.freeZoneRateAedSqmYr !== null &&
    inputs.storageDurationMonths !== null && inputs.storageDurationMonths > 0 &&
    inputs.storageAreaSqm !== null && inputs.storageAreaSqm > 0;
  const hasMainlandStorageRate = inputs.mainlandRateAedSqmYr !== null && inputs.mainlandRateAedSqmYr > 0;

  const dutyAmountAed = hasEnoughForDuty ? n(inputs.shipmentValueCifAed) * (GCC_CET_RATE_PCT / 100) : null;

  const dutyAvoidedInUaeAed = hasEnoughForDuty
    ? (inputs.routingChoice === 'reExport' ? dutyAmountAed : 0)
    : null;
  const dutyDeferredAed = hasEnoughForDuty && inputs.routingChoice === 'mainlandSale' ? dutyAmountAed : null;

  const freeZoneStorageCostAed = hasEnoughForStorage
    ? (n(inputs.freeZoneRateAedSqmYr) / 12) * n(inputs.storageDurationMonths) * n(inputs.storageAreaSqm)
    : null;

  const mainlandStorageCostAed = hasEnoughForStorage && hasMainlandStorageRate
    ? (n(inputs.mainlandRateAedSqmYr) / 12) * n(inputs.storageDurationMonths) * n(inputs.storageAreaSqm)
    : null;

  const freeZonePathTotalAed = freeZoneStorageCostAed !== null
    ? freeZoneStorageCostAed + (inputs.routingChoice === 'mainlandSale' && dutyAmountAed !== null ? dutyAmountAed : 0)
    : null;

  const mainlandPathTotalAed = mainlandStorageCostAed !== null && dutyAmountAed !== null
    ? mainlandStorageCostAed + dutyAmountAed
    : null;

  const savingsAed = freeZonePathTotalAed !== null && mainlandPathTotalAed !== null
    ? mainlandPathTotalAed - freeZonePathTotalAed
    : null;

  return {
    hasEnoughForDuty,
    hasEnoughForStorage,
    hasMainlandStorageRate,
    dutyAmountAed,
    dutyAvoidedInUaeAed,
    dutyDeferredAed,
    freeZoneStorageCostAed,
    mainlandStorageCostAed,
    freeZonePathTotalAed,
    mainlandPathTotalAed,
    savingsAed,
  };
}

export function buildFreeZoneRoutingPrompt(inputs: RoutingInputs, result: RoutingResult, isAr: boolean): string {
  const header = isAr ? '## أداة توجيه المنطقة الحرة / المستودع المؤمّن' : '## Free-Zone / Bonded-Warehouse Routing';
  const benchmark = FREE_ZONE_BENCHMARKS[inputs.freeZone];

  const lines = [
    header,
    '',
    isAr ? `المنطقة الحرة: ${isAr ? benchmark.labelAr : benchmark.labelEn}` : `Free zone: ${benchmark.labelEn}`,
    isAr ? `مسار التوجيه: ${inputs.routingChoice === 'reExport' ? 'إعادة تصدير عبر آلية مكاسة' : 'بيع في السوق المحلي'}` : `Routing: ${inputs.routingChoice === 'reExport' ? 'Re-export via Makasa' : 'Mainland sale'}`,
    result.dutyAmountAed !== null
      ? (isAr ? `الرسوم الجمركية (٥٪ من قيمة CIF): ${result.dutyAmountAed.toLocaleString()} درهم` : `Import duty (5% of CIF): AED ${result.dutyAmountAed.toLocaleString()}`)
      : '',
    result.freeZonePathTotalAed !== null
      ? (isAr ? `إجمالي مسار المنطقة الحرة: ${result.freeZonePathTotalAed.toLocaleString()} درهم` : `Free-zone path total: AED ${result.freeZonePathTotalAed.toLocaleString()}`)
      : '',
    result.mainlandPathTotalAed !== null
      ? (isAr ? `إجمالي المسار المحلي: ${result.mainlandPathTotalAed.toLocaleString()} درهم` : `Mainland path total: AED ${result.mainlandPathTotalAed.toLocaleString()}`)
      : '',
    result.savingsAed !== null
      ? (isAr ? `الوفورات التقديرية: ${result.savingsAed.toLocaleString()} درهم` : `Estimated savings: AED ${result.savingsAed.toLocaleString()}`)
      : '',
    '',
    isAr
      ? 'اقترح خطوات عملية محددة استناداً إلى الأرقام أعلاه فقط -- لا تفترض بيانات غير مُدخلة، ووضّح أن الأرقام معيارية وليست عرض أسعار فعلياً ما لم يُذكر خلاف ذلك.'
      : 'Suggest specific, practical next steps grounded only in the figures above -- do not assume data that was not entered, and note the figures are benchmark-based, not an actual quote, unless stated otherwise.',
  ].filter(Boolean);

  return lines.join('\n');
}
