/**
 * clmReviewExtraction.ts
 *
 * Module 09 Part B.3 -- Review v2 (document upload/extraction, T2),
 * frontend pure-logic layer. This file stays pure/no-AI itself, exactly
 * the same discipline clmGenerationEngine.ts follows for Generation v1.5:
 * it only shapes the request body sent to the backend
 * (/api/clm-review-extraction/extract) and merges the AI's sanitized
 * response back into a Contract-shaped object. The actual document
 * parsing (pdf-parse/mammoth) and AI extraction call happen server-side
 * in clmReviewExtraction.ts (api-server package) -- there is no shared-
 * library import path between the two packages (separate pnpm workspace
 * packages), so this file re-declares only the request/response shapes it
 * needs, matching the backend's own Zod schema field-for-field.
 *
 * Client-computes-taxonomy-menus/server-forwards pattern, same as
 * maturityHint (#141) and Generation v1.5's groundingNotes: the growing,
 * sourced taxonomies (governing-law tracks, arbitration institutions,
 * pricing types, industry buckets, FIDIC books, the 56-subclause
 * taxonomy) live here in the frontend only. buildTaxonomyMenus() reads
 * them from the already-imported, already-tested constant arrays
 * (GOVERNING_LAW_TRACKS, ARBITRATION_INSTITUTIONS, PRICING_TYPES,
 * INDUSTRY_BUCKETS, FIDIC_BOOKS, SUBCLAUSES_BY_CATEGORY, all imported by
 * CLMTools.tsx already) and sends the current id/label menus to the
 * backend -- the backend never hardcodes or duplicates this content.
 *
 * mergeExtractedFieldsIntoContract() never overwrites a field the user
 * has already filled in with a non-empty/non-default value -- extraction
 * only fills gaps in a fresh, empty draft contract, consistent with this
 * feature's framing as a first-draft assistant, not an override tool.
 */

export interface TaxonomyOption {
  id: string;
  label: string;
}

export interface SubclauseOption {
  id: string;
  label: string;
}

export interface CategoryMenu {
  categoryLabel: string;
  subclauses: SubclauseOption[];
}

export interface TaxonomyMenus {
  governingLawTracks: TaxonomyOption[];
  arbitrationInstitutions: TaxonomyOption[];
  pricingTypes: TaxonomyOption[];
  industryBuckets: TaxonomyOption[];
  fidicBooks: TaxonomyOption[];
  subclausesByCategory: Record<string, CategoryMenu>;
}

/** Builds the taxonomy-menus payload from already-imported, already-tested
 *  frontend constant arrays -- never re-derives or invents taxonomy
 *  content, only re-shapes it into the id/label pairs the backend prompt
 *  needs. Excludes the 'other'/'' placeholder entries every taxonomy
 *  array carries, since those are UI-only fallbacks, not real extraction
 *  targets. */
export function buildTaxonomyMenus(
  governingLawTracks: { id: string; label: string }[],
  arbitrationInstitutions: { id: string; label: string }[],
  pricingTypes: { id: string; label: string }[],
  industryBuckets: { id: string; label: string }[],
  fidicBooks: { id: string; label: string }[],
  clauseCategories: { id: string; label: string }[],
  subclausesByCategory: Record<string, { id: string; label: string }[]>,
): TaxonomyMenus {
  const dropPlaceholders = (opts: { id: string; label: string }[]) =>
    opts.filter(o => o.id !== '' && o.id !== 'other').map(o => ({ id: o.id, label: o.label }));

  const subclausesMenu: Record<string, CategoryMenu> = {};
  for (const cat of clauseCategories) {
    const subs = subclausesByCategory[cat.id] ?? [];
    subclausesMenu[cat.id] = {
      categoryLabel: cat.label,
      subclauses: subs.map(s => ({ id: s.id, label: s.label })),
    };
  }

  return {
    governingLawTracks: dropPlaceholders(governingLawTracks),
    arbitrationInstitutions: dropPlaceholders(arbitrationInstitutions),
    pricingTypes: dropPlaceholders(pricingTypes),
    industryBuckets: dropPlaceholders(industryBuckets),
    fidicBooks: dropPlaceholders(fidicBooks),
    subclausesByCategory: subclausesMenu,
  };
}

export interface ExtractDocumentRequestBody {
  filename: string;
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  fileBase64: string;
  taxonomyMenus: TaxonomyMenus;
}

/** Mirrors the backend's sanitizeExtractedFields() output shape exactly --
 *  every field optional, since the backend omits (never guesses) any
 *  field it could not find. */
export interface ExtractedContractFields {
  name?: string;
  supplier?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  counterpartyType?: 'government' | 'private';
  governingLawClause?: string;
  arbitrationInstitution?: string;
  counterpartyJurisdiction?: string;
  performanceLocation?: string;
  pricingPrimary?: string;
  scopeDefiniteness?: string;
  pricingHasCapOrMilestones?: boolean;
  industryBucket?: string;
  fidicBook?: string;
  professionalServicesTrack?: string;
  logisticsMode?: string;
  clausesPresent?: Record<string, string[]>;
  clauseCategoriesNotApplicable?: string[];
  extractionNotesEn?: string;
  extractionNotesAr?: string;
}

export interface ExtractDocumentResponse {
  ok: boolean;
  extractedFields?: ExtractedContractFields;
  disclaimerEn?: string;
  disclaimerAr?: string;
  truncated?: boolean;
  extractedCharCount?: number;
  error?: string;
}

/**
 * Merges extracted fields onto a base Contract-shaped object (typically a
 * freshly-created draft from defaultContract()). Only fills fields that
 * are currently empty/unset on the base object -- never overwrites a
 * value the user already entered, and never touches fields the backend
 * did not return (which are already `undefined`/absent, so simple
 * conditional assignment is sufficient; no separate "was this field
 * touched" tracking is needed).
 *
 * Generic over the base object's shape so it works directly with
 * CLMTools.tsx's own `Contract` interface without this pure-logic file
 * needing to import (and thus duplicate) that interface.
 */
export function mergeExtractedFieldsIntoContract<
  T extends {
    name: string; supplier: string;
    type?: string; startDate?: string; endDate?: string;
    counterpartyType?: string; governingLawClause?: string; arbitrationInstitution?: string;
    counterpartyJurisdiction?: string; performanceLocation?: string;
    pricingPrimary?: string; scopeDefiniteness?: string; pricingHasCapOrMilestones?: boolean;
    industryBucket?: string; fidicBook?: string; professionalServicesTrack?: string; logisticsMode?: string;
    clausesPresent?: Record<string, string[]>; clauseCategoriesNotApplicable?: string[];
  }
>(base: T, extracted: ExtractedContractFields): T {
  const merged: T = { ...base };

  if (!merged.name && extracted.name) merged.name = extracted.name;
  if (!merged.supplier && extracted.supplier) merged.supplier = extracted.supplier;
  if (extracted.type) (merged as Record<string, unknown>).type = extracted.type;
  if (extracted.startDate) merged.startDate = extracted.startDate;
  if (extracted.endDate) merged.endDate = extracted.endDate;
  if (!merged.counterpartyType && extracted.counterpartyType) (merged as Record<string, unknown>).counterpartyType = extracted.counterpartyType;
  if (!merged.governingLawClause && extracted.governingLawClause) (merged as Record<string, unknown>).governingLawClause = extracted.governingLawClause;
  if (!merged.arbitrationInstitution && extracted.arbitrationInstitution) (merged as Record<string, unknown>).arbitrationInstitution = extracted.arbitrationInstitution;
  if (!merged.counterpartyJurisdiction && extracted.counterpartyJurisdiction) merged.counterpartyJurisdiction = extracted.counterpartyJurisdiction;
  if (!merged.performanceLocation && extracted.performanceLocation) merged.performanceLocation = extracted.performanceLocation;
  if (!merged.pricingPrimary && extracted.pricingPrimary) (merged as Record<string, unknown>).pricingPrimary = extracted.pricingPrimary;
  if (!merged.scopeDefiniteness && extracted.scopeDefiniteness) (merged as Record<string, unknown>).scopeDefiniteness = extracted.scopeDefiniteness;
  if (merged.pricingHasCapOrMilestones === undefined && extracted.pricingHasCapOrMilestones !== undefined) merged.pricingHasCapOrMilestones = extracted.pricingHasCapOrMilestones;
  if (!merged.industryBucket && extracted.industryBucket) (merged as Record<string, unknown>).industryBucket = extracted.industryBucket;
  if (!merged.fidicBook && extracted.fidicBook) (merged as Record<string, unknown>).fidicBook = extracted.fidicBook;
  if (!merged.professionalServicesTrack && extracted.professionalServicesTrack) (merged as Record<string, unknown>).professionalServicesTrack = extracted.professionalServicesTrack;
  if (!merged.logisticsMode && extracted.logisticsMode) (merged as Record<string, unknown>).logisticsMode = extracted.logisticsMode;
  if ((!merged.clausesPresent || Object.keys(merged.clausesPresent).length === 0) && extracted.clausesPresent) {
    merged.clausesPresent = extracted.clausesPresent;
  }
  if ((!merged.clauseCategoriesNotApplicable || merged.clauseCategoriesNotApplicable.length === 0) && extracted.clauseCategoriesNotApplicable) {
    merged.clauseCategoriesNotApplicable = extracted.clauseCategoriesNotApplicable;
  }

  return merged;
}

/** Reads a browser File as a base64 string (no data-URL prefix), for
 *  embedding directly in the extraction request body. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const EXTRACTION_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
export const EXTRACTION_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, matches backend cap
