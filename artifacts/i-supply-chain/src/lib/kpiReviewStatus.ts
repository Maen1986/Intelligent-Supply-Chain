/**
 * kpiReviewStatus.ts — #382 (2026-08-23): Coverage / Source-Quality Badge, Platform-Wide
 *
 * Surfaces, per displayed benchmark/target figure, whether that specific number has been
 * independently verified against a real external source, or is one of the two disclosed
 * lower-confidence tiers documented in ISC Benchmark Final v54.xlsx (Tab 10, Parts 3-4):
 *
 *  - 'estimated'         = "Analytically Derived — Practitioner Framework" (buf/turns only,
 *                            585 figures): a documented estimation framework built from real
 *                            anchors, explicitly disclosed as not independently externally
 *                            verified. See Tab 10 Part 4.
 *  - 'context-specific'  = "Uncertain — Flag for Discussion" (552 figures): figures the research
 *                            deliberately held back from a flat Verified/Needs-Correction call —
 *                            overwhelmingly Government/Public-Sector rows, where published
 *                            benchmarks for that specific figure don't exist or don't transfer
 *                            cleanly (see Tab 10 Part 3), plus a small number of KPIs (sld, rar)
 *                            that are deliberately excluded from flat benchmarking by design
 *                            (Tab 10 Part 5) because they're case-specific, not comparable
 *                            across companies.
 *  - undefined (no entry) = "Verified - Correct": checked against a real external source.
 *
 * Scope note (honesty, not laziness): this only covers the two lookup layers that resolve
 * 1:1 to a single tracked workbook row — Industry-level benchmarks (`2. Industry KPI`) and
 * all three Target layers (`5/6/7. Targets ...`). It deliberately does NOT cover the SKU-class
 * benchmark value, because that value currently always resolves through the '*' wildcard
 * synthesis in kpiBenchmarksBySkuClass.ts (KPIDashboard never passes a sub-sector), and the
 * workbook's Assessment tracking is per named sub-sector, not per wildcard — there is no single
 * row whose status honestly describes the wildcard figure. Attaching a status to it would be a
 * best-guess roll-up, not a fact, so per Decision Record 8.7 it's left unbadged rather than
 * guessed. Extending this to the SKU layer is real follow-on work once sub-sector selection is
 * exposed in the UI (tracked in the site map under #382's follow-ups), not a gap being hidden.
 *
 * Source: ISC Benchmark Final v54.xlsx, `Assessment` column, all 6 tabs, reconciled 23 Aug 2026.
 * Only non-"Verified - Correct" rows are listed below (1,137 of 4,773) — everything absent from
 * these tables is Verified - Correct. This keeps the file to what's actually exceptional instead
 * of re-encoding a ~4,800-row spreadsheet into the frontend bundle.
 */

export type ReviewStatus = 'estimated' | 'context-specific';

export interface ReviewStatusMeta {
  status: ReviewStatus;
  label: string;
  labelAr: string;
  note: string;
  noteAr: string;
}

const REVIEW_STATUS_META: Record<ReviewStatus, Omit<ReviewStatusMeta, 'status'>> = {
  estimated: {
    label: 'Estimated',
    labelAr: 'مُقدَّر',
    note: 'Derived from a documented practitioner framework built on real anchors — not independently verified against an external source yet. Use it to gauge direction, not as a precise target: cross-check against your own recent data before it feeds a board-level business case.',
    noteAr: 'مُشتق من إطار عملي موثّق مبني على مرجعيات حقيقية — لم يُتحقّق منه بعد بشكل مستقل من مصدر خارجي. استخدمه لتحديد الاتجاه العام لا كرقم دقيق: تحقّق من بياناتك الحديثة قبل اعتماده في عرض على مستوى مجلس الإدارة.',
  },
  'context-specific': {
    label: 'Context-specific',
    labelAr: 'خاص بالسياق',
    note: 'Held back from a flat verified/unverified call — mostly Government/Public-Sector figures without a directly transferable published benchmark, or KPIs that are inherently case-specific rather than cross-company comparable. Treat it as a starting reference, and confirm against a recent quote or your own historical figure before relying on it for a budget or planning decision.',
    noteAr: 'لم يُصنَّف كمُتحقَّق أو غير مُتحقَّق بشكل قاطع — غالبًا أرقام حكومية/قطاع عام بلا مرجع منشور قابل للنقل المباشر، أو مؤشرات خاصة بالحالة وليست قابلة للمقارنة بين الشركات. اعتبره مرجعًا أوليًا، وتحقّق من عرض سعر حديث أو رقمك التاريخي الخاص قبل الاعتماد عليه في قرار ميزانية أو تخطيط.',
  },
};

function meta(status: ReviewStatus | undefined): ReviewStatusMeta | null {
  if (!status) return null;
  return { status, ...REVIEW_STATUS_META[status] };
}

const INDUSTRY_REVIEW_EXCEPTIONS: Record<string, ReviewStatus> = {
  "asa|government": "context-specific",
  "aud|government": "context-specific",
  "auto|government": "context-specific",
  "c2c|government": "context-specific",
  "ccov|government": "context-specific",
  "cco|government": "context-specific",
  "copq|government": "context-specific",
  "da|government": "context-specific",
  "erpu|government": "context-specific",
  "fa|government": "context-specific",
  "ftr2|government": "context-specific",
  "ftr|government": "context-specific",
  "lc|government": "context-specific",
  "mav|government": "context-specific",
  "mttr|government": "context-specific",
  "otif|government": "context-specific",
  "pce2|government": "context-specific",
  "pce|government": "context-specific",
  "pcr2|government": "context-specific",
  "pcr|government": "context-specific",
  "pocomp|government": "context-specific",
  "pocycle|government": "context-specific",
  "por|government": "context-specific",
  "ppm|government": "context-specific",
  "rar|construction": "context-specific",
  "rar|food-beverage": "context-specific",
  "rar|government": "context-specific",
  "rar|healthcare-pharma": "context-specific",
  "rar|logistics": "context-specific",
  "rar|manufacturing": "context-specific",
  "rar|oil-gas": "context-specific",
  "rar|retail-fmcg": "context-specific",
  "savings|government": "context-specific",
  "sccost|government": "context-specific",
  "scv|government": "context-specific",
  "sigma|government": "context-specific",
  "sotif2|government": "context-specific",
  "sotif|government": "context-specific",
  "stp|government": "context-specific",
  "ttc|government": "context-specific",
  "turns|government": "context-specific",
  "ves|government": "context-specific",
};

const TARGETS_COMBINED_REVIEW_EXCEPTIONS: Record<string, ReviewStatus> = {
  "buf|construction|commodities": "estimated",
  "buf|construction|finished-goods": "estimated",
  "buf|construction|indirect-general": "estimated",
  "buf|construction|packaging": "estimated",
  "buf|construction|raw-materials": "estimated",
  "buf|construction|spare-parts-mro": "estimated",
  "buf|construction|work-in-progress": "estimated",
  "buf|food-beverage|commodities": "estimated",
  "buf|food-beverage|finished-goods": "estimated",
  "buf|food-beverage|indirect-general": "estimated",
  "buf|food-beverage|packaging": "estimated",
  "buf|food-beverage|raw-materials": "estimated",
  "buf|food-beverage|spare-parts-mro": "estimated",
  "buf|food-beverage|work-in-progress": "estimated",
  "buf|government|commodities": "context-specific",
  "buf|government|finished-goods": "context-specific",
  "buf|government|indirect-general": "context-specific",
  "buf|government|packaging": "context-specific",
  "buf|government|raw-materials": "context-specific",
  "buf|government|spare-parts-mro": "context-specific",
  "buf|government|work-in-progress": "context-specific",
  "buf|healthcare-pharma|commodities": "estimated",
  "buf|healthcare-pharma|finished-goods": "estimated",
  "buf|healthcare-pharma|indirect-general": "estimated",
  "buf|healthcare-pharma|packaging": "estimated",
  "buf|healthcare-pharma|raw-materials": "estimated",
  "buf|healthcare-pharma|spare-parts-mro": "estimated",
  "buf|healthcare-pharma|work-in-progress": "estimated",
  "buf|logistics|commodities": "estimated",
  "buf|logistics|finished-goods": "estimated",
  "buf|logistics|indirect-general": "estimated",
  "buf|logistics|packaging": "estimated",
  "buf|logistics|raw-materials": "estimated",
  "buf|logistics|spare-parts-mro": "estimated",
  "buf|logistics|work-in-progress": "estimated",
  "buf|manufacturing|commodities": "estimated",
  "buf|manufacturing|finished-goods": "estimated",
  "buf|manufacturing|indirect-general": "estimated",
  "buf|manufacturing|packaging": "estimated",
  "buf|manufacturing|raw-materials": "estimated",
  "buf|manufacturing|spare-parts-mro": "estimated",
  "buf|manufacturing|work-in-progress": "estimated",
  "buf|oil-gas|commodities": "estimated",
  "buf|oil-gas|finished-goods": "estimated",
  "buf|oil-gas|indirect-general": "estimated",
  "buf|oil-gas|packaging": "estimated",
  "buf|oil-gas|raw-materials": "estimated",
  "buf|oil-gas|spare-parts-mro": "estimated",
  "buf|oil-gas|work-in-progress": "estimated",
  "buf|retail-fmcg|commodities": "estimated",
  "buf|retail-fmcg|finished-goods": "estimated",
  "buf|retail-fmcg|indirect-general": "estimated",
  "buf|retail-fmcg|packaging": "estimated",
  "buf|retail-fmcg|raw-materials": "estimated",
  "buf|retail-fmcg|spare-parts-mro": "estimated",
  "buf|retail-fmcg|work-in-progress": "estimated",
  "fa|government|commodities": "context-specific",
  "fa|government|finished-goods": "context-specific",
  "fa|government|indirect-general": "context-specific",
  "fa|government|packaging": "context-specific",
  "fa|government|raw-materials": "context-specific",
  "fa|government|spare-parts-mro": "context-specific",
  "fa|government|work-in-progress": "context-specific",
  "mav|government|commodities": "context-specific",
  "mav|government|finished-goods": "context-specific",
  "mav|government|indirect-general": "context-specific",
  "mav|government|packaging": "context-specific",
  "mav|government|raw-materials": "context-specific",
  "mav|government|spare-parts-mro": "context-specific",
  "mav|government|work-in-progress": "context-specific",
  "pocycle|government|commodities": "context-specific",
  "pocycle|government|finished-goods": "context-specific",
  "pocycle|government|indirect-general": "context-specific",
  "pocycle|government|packaging": "context-specific",
  "pocycle|government|raw-materials": "context-specific",
  "pocycle|government|spare-parts-mro": "context-specific",
  "pocycle|government|work-in-progress": "context-specific",
  "ppm|government|commodities": "context-specific",
  "ppm|government|finished-goods": "context-specific",
  "ppm|government|indirect-general": "context-specific",
  "ppm|government|packaging": "context-specific",
  "ppm|government|raw-materials": "context-specific",
  "ppm|government|spare-parts-mro": "context-specific",
  "ppm|government|work-in-progress": "context-specific",
  "scv|government|commodities": "context-specific",
  "scv|government|finished-goods": "context-specific",
  "scv|government|indirect-general": "context-specific",
  "scv|government|packaging": "context-specific",
  "scv|government|raw-materials": "context-specific",
  "scv|government|spare-parts-mro": "context-specific",
  "scv|government|work-in-progress": "context-specific",
  "turns|construction|commodities": "estimated",
  "turns|construction|indirect-general": "estimated",
  "turns|construction|packaging": "estimated",
  "turns|construction|work-in-progress": "estimated",
  "turns|food-beverage|commodities": "estimated",
  "turns|food-beverage|indirect-general": "estimated",
  "turns|food-beverage|packaging": "estimated",
  "turns|food-beverage|work-in-progress": "estimated",
  "turns|government|commodities": "context-specific",
  "turns|government|finished-goods": "context-specific",
  "turns|government|indirect-general": "context-specific",
  "turns|government|packaging": "context-specific",
  "turns|government|raw-materials": "context-specific",
  "turns|government|spare-parts-mro": "context-specific",
  "turns|government|work-in-progress": "context-specific",
  "turns|healthcare-pharma|commodities": "estimated",
  "turns|healthcare-pharma|indirect-general": "estimated",
  "turns|healthcare-pharma|packaging": "estimated",
  "turns|healthcare-pharma|work-in-progress": "estimated",
  "turns|logistics|commodities": "estimated",
  "turns|logistics|indirect-general": "estimated",
  "turns|logistics|packaging": "estimated",
  "turns|logistics|work-in-progress": "estimated",
  "turns|manufacturing|commodities": "estimated",
  "turns|manufacturing|indirect-general": "estimated",
  "turns|manufacturing|packaging": "estimated",
  "turns|manufacturing|work-in-progress": "estimated",
  "turns|oil-gas|commodities": "estimated",
  "turns|oil-gas|indirect-general": "estimated",
  "turns|oil-gas|packaging": "estimated",
  "turns|oil-gas|work-in-progress": "estimated",
  "turns|retail-fmcg|commodities": "estimated",
  "turns|retail-fmcg|indirect-general": "estimated",
  "turns|retail-fmcg|packaging": "estimated",
  "turns|retail-fmcg|work-in-progress": "estimated",
};

const TARGETS_INDUSTRY_REVIEW_EXCEPTIONS: Record<string, ReviewStatus> = {
  "asa|government": "context-specific",
  "aud|government": "context-specific",
  "auto|government": "context-specific",
  "c2c|government": "context-specific",
  "ccov|government": "context-specific",
  "cco|government": "context-specific",
  "copq|government": "context-specific",
  "da|government": "context-specific",
  "erpu|government": "context-specific",
  "fa|government": "context-specific",
  "ftr2|government": "context-specific",
  "ftr|government": "context-specific",
  "lc|government": "context-specific",
  "mav|government": "context-specific",
  "otif|government": "context-specific",
  "pce2|government": "context-specific",
  "pce|government": "context-specific",
  "pcr2|government": "context-specific",
  "pcr|government": "context-specific",
  "pocomp|government": "context-specific",
  "pocycle|government": "context-specific",
  "por|government": "context-specific",
  "ppm|government": "context-specific",
  "rar|construction": "context-specific",
  "rar|food-beverage": "context-specific",
  "rar|government": "context-specific",
  "rar|healthcare-pharma": "context-specific",
  "rar|logistics": "context-specific",
  "rar|manufacturing": "context-specific",
  "rar|oil-gas": "context-specific",
  "rar|retail-fmcg": "context-specific",
  "savings|government": "context-specific",
  "sccost|government": "context-specific",
  "scv|government": "context-specific",
  "sigma|government": "context-specific",
  "sotif2|government": "context-specific",
  "sotif|government": "context-specific",
  "stp|government": "context-specific",
  "ttc|government": "context-specific",
  "turns|government": "context-specific",
  "ves|government": "context-specific",
};

const TARGETS_SKU_REVIEW_EXCEPTIONS: Record<string, ReviewStatus> = {
  "buf|commodities": "estimated",
  "buf|finished-goods": "estimated",
  "buf|indirect-general": "estimated",
  "buf|packaging": "estimated",
  "buf|raw-materials": "estimated",
  "buf|spare-parts-mro": "estimated",
  "buf|work-in-progress": "estimated",
  "turns|commodities": "estimated",
  "turns|indirect-general": "estimated",
  "turns|packaging": "estimated",
  "turns|work-in-progress": "estimated",
};
/** Review status of the Industry-level benchmark figure for a given KPI + industry. */
export function getIndustryBenchmarkReviewStatus(kpiId: string, industryKey: string | null): ReviewStatusMeta | null {
  if (!industryKey) return null;
  return meta(INDUSTRY_REVIEW_EXCEPTIONS[`${kpiId}|${industryKey}`]);
}

/**
 * Review status of the resolved target figure for a given KPI + industry + SKU class,
 * mirroring getContextualTarget()'s own resolution priority: combined > industry-only >
 * SKU-only. Whichever layer actually supplied the displayed target is the one whose status
 * is returned, so the badge always describes the number actually on screen.
 */
export function getTargetReviewStatus(
  kpiId: string,
  industryKey: string | null,
  skuClass: string | null,
): ReviewStatusMeta | null {
  if (industryKey && skuClass) {
    const combined = TARGETS_COMBINED_REVIEW_EXCEPTIONS[`${kpiId}|${industryKey}|${skuClass}`];
    if (combined) return meta(combined);
  }
  if (industryKey) {
    const ind = TARGETS_INDUSTRY_REVIEW_EXCEPTIONS[`${kpiId}|${industryKey}`];
    if (ind) return meta(ind);
  }
  if (skuClass) {
    const sku = TARGETS_SKU_REVIEW_EXCEPTIONS[`${kpiId}|${skuClass}`];
    if (sku) return meta(sku);
  }
  return null;
}
