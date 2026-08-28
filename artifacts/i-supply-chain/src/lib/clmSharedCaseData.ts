/**
 * clmSharedCaseData.ts
 *
 * #381 "Shared Client Case Data Layer" -- 2-source correlation, built 29
 * Aug 2026 per the owner's explicit go-ahead on the #381 scoping pass's
 * recommendation (shared-case-data-layer-381-scoping-draft.md).
 *
 * Honesty scope (carried forward from that scoping pass, unchanged here):
 * a genuine 4-source layer across Risk (#370), Contract Intelligence
 * (#371), Supplier Discovery (#372), and Supplier Dependency (#378) is
 * still blocked -- #370 and #372 remain owner-held backlog items with no
 * server-side per-client data to correlate. Only #371 (Contract
 * Intelligence, clm_contracts) and #378 (Supplier Dependency,
 * supplier_dependency_checks, backend-synced as of 28 Aug 2026) have real
 * per-client server data today. This file builds the 2-source version the
 * owner approved, not the full 4-source vision -- nothing here claims or
 * implies Risk/Supplier-Discovery coverage.
 *
 * No new schema, no new table, no new route. Both source datasets already
 * exist and are already fetched by their own pages (CLMTools.tsx,
 * SupplierDependencyCheck.tsx) -- this is a pure, client-side correlation
 * function over data the caller already has in hand, mirroring the
 * "T1: pure logic over fields the platform already self-declares
 * manually" pattern used throughout Module 03.
 *
 * The join key is a real, structural one, not invented: Contract.supplier
 * (free text, Module 03/CLM) and SupplierCheck.name (free text, #378) are
 * both self-declared supplier/vendor names entered by the same client for
 * the same account. Matching is deliberately simple and disclosed --
 * case-insensitive, whitespace-trimmed EXACT match only. No fuzzy/
 * substring matching is used, because a wrong fuzzy match here would
 * silently mislead a client about which contract governs which supplier
 * relationship -- a correctness risk this platform's standing discipline
 * (Decision Record 8.7) does not accept for the sake of catching more
 * matches. A client whose contract's "Supplier" field doesn't exactly
 * match their Supplier Dependency Check's "Name" field simply won't
 * correlate -- visibly incomplete rather than silently wrong.
 */

import { deriveSeverity, type SupplierCheck, type SeverityLevel } from './supplierDependency';

/** Minimal shape this module needs from a Contract -- kept narrow and
 *  duck-typed so this file has no import-time dependency on CLMTools.tsx's
 *  full Contract interface (avoids a circular import; CLMTools.tsx imports
 *  FROM this file, not the other way around). */
export interface CorrelationContractInput {
  id: string;
  name: string;
  supplier: string;
  endDate: string;
}

export interface SupplierContractCorrelation {
  supplierCheckId: string;
  supplierName: string;
  severity: SeverityLevel;
  matchedContractId: string;
  matchedContractName: string;
  daysUntilRenewal: number | undefined;
  /** True only when the correlation surfaces something worth a client's
   *  attention -- a matched pair with a Low/Incomplete severity and no
   *  near-term renewal is still returned (for completeness/testability)
   *  but not flagged. */
  flagged: boolean;
  narrativeEn: string;
  narrativeAr: string;
}

/** Same 90-day "renewal approaching" threshold CLMTools.tsx's own health
 *  rating already uses (see healthRating()'s daysUntil(c.endDate) > 90
 *  check) -- reused here for consistency, not reinvented. */
const RENEWAL_HORIZON_DAYS = 90;

function normalizeSupplierName(name: string): string {
  return name.trim().toLowerCase();
}

function daysUntil(dateStr: string): number | undefined {
  if (!dateStr) return undefined;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return undefined;
  return Math.round((t - Date.now()) / 86400000);
}

/**
 * Correlates #378 Supplier Dependency Checks against #371 Contract
 * Intelligence contracts for the same client account, via exact
 * (case-insensitive, trimmed) supplier-name match. Returns one entry per
 * matched pair -- a supplier check with no matching contract, or a
 * contract with no matching supplier check, produces no entry (there is
 * nothing to correlate). `isAr` only affects nothing here -- both
 * narrative languages are always built, same bilingual-always pattern
 * used by every other flag function in this codebase.
 */
export function correlateSupplierChecksWithContracts(
  supplierChecks: SupplierCheck[],
  contracts: CorrelationContractInput[],
): SupplierContractCorrelation[] {
  const contractsByNormalizedSupplier = new Map<string, CorrelationContractInput[]>();
  for (const c of contracts) {
    if (!c.supplier || !c.supplier.trim()) continue;
    const key = normalizeSupplierName(c.supplier);
    const list = contractsByNormalizedSupplier.get(key) ?? [];
    list.push(c);
    contractsByNormalizedSupplier.set(key, list);
  }

  const results: SupplierContractCorrelation[] = [];
  for (const check of supplierChecks) {
    if (!check.name || !check.name.trim()) continue;
    const key = normalizeSupplierName(check.name);
    const matches = contractsByNormalizedSupplier.get(key);
    if (!matches || matches.length === 0) continue;

    const severityResult = deriveSeverity(check, false);
    const severityAr = deriveSeverity(check, true);

    for (const contract of matches) {
      const remaining = daysUntil(contract.endDate);
      const renewalSoon = typeof remaining === 'number' && remaining <= RENEWAL_HORIZON_DAYS;
      const meaningfulSeverity = severityResult.level === 'Critical' || severityResult.level === 'Moderate';
      const flagged = meaningfulSeverity && renewalSoon;

      let narrativeEn: string;
      let narrativeAr: string;
      if (flagged) {
        narrativeEn = `${check.name} is flagged ${severityResult.level.toUpperCase()} on the Supplier Dependency Check (${severityResult.reasonEn}), and the matching contract "${contract.name}" is up for renewal in ${remaining} day${remaining === 1 ? '' : 's'}. Worth reviewing together before that renewal decision is made.`;
        narrativeAr = `تم تصنيف ${check.name} كخطر "${severityAr.level === 'Critical' ? 'حرج' : 'متوسط'}" في فحص اعتماد المورد (${severityAr.reasonAr})، والعقد المطابق "${contract.name}" على وشك التجديد خلال ${remaining} يوماً. يستحق المراجعة معاً قبل اتخاذ قرار التجديد.`;
      } else {
        narrativeEn = `${check.name} matches contract "${contract.name}" -- ${severityResult.level} dependency severity, ${typeof remaining === 'number' ? `${remaining} days to renewal` : 'no renewal date set'}. No combined action needed right now.`;
        narrativeAr = `${check.name} مطابق للعقد "${contract.name}" -- درجة الاعتماد ${severityAr.level === 'Critical' ? 'حرجة' : severityAr.level === 'Moderate' ? 'متوسطة' : severityAr.level === 'Low' ? 'منخفضة' : 'غير مكتملة'}، ${typeof remaining === 'number' ? `${remaining} يوماً حتى التجديد` : 'لا يوجد تاريخ تجديد محدد'}. لا حاجة لإجراء مشترك حالياً.`;
      }

      results.push({
        supplierCheckId: check.id,
        supplierName: check.name,
        severity: severityResult.level,
        matchedContractId: contract.id,
        matchedContractName: contract.name,
        daysUntilRenewal: remaining,
        flagged,
        narrativeEn,
        narrativeAr,
      });
    }
  }
  return results;
}
