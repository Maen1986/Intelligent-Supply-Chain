/**
 * Industry -> Sub-sector grouping (#168 TCO Engine rebuild, v2)
 *
 * The platform's canonical sub-sector names (60 real names, used throughout
 * kpiBenchmarksBySkuClass.ts for GCC benchmark lookups) do not carry an
 * explicit "which of the 8 IndustryKey industries do I belong to" field in
 * that file -- they are only ever looked up directly by name, keyed under a
 * separate, older 12-label grouping (INDUSTRY_SKU_CLASSES) that predates
 * and does not match the 8-key IndustryKey taxonomy used everywhere else in
 * the product (KPI Dashboard's industry selector, benchmark review-status
 * badges, etc.).
 *
 * This file adds that missing mapping by hand-grouping the same 60 real
 * sub-sector names under the 8 canonical IndustryKey values, so the TCO
 * Engine's industry picker can pre-filter the sub-sector list. This is an
 * organizational grouping of names that already exist in the codebase, not
 * new data -- three sub-sectors from the old 12-label scheme that had no
 * clean home in the 8-key taxonomy (Software & SaaS, E-commerce variants,
 * Professional Services) were placed under the closest reasonable industry
 * for menu purposes; because sub-sector selection in the TCO Engine is
 * label-only (it organizes and names an analysis) and never drives which
 * hidden-cost checklist content is shown -- only the Category (SKU class)
 * selection does that, per the grounded-checklist design -- a debatable
 * placement here has no effect on any number or claim the tool makes.
 *
 * Follow-on note (24 Aug 2026, ISC Services Classification Book v1,
 * isc-services-classification-book-v1.md): checked whether that book's real,
 * sourced UNSPSC data could correct the 3 force-fit placements above.
 * Finding: it can explain WHY they don't fit, but it cannot relocate them,
 * because it classifies a different axis. UNSPSC Segment 80 (Management,
 * Business Professionals and Administrative Services -- Family 80100000
 * Management advisory services) and Segment 81 (Engineering, Research and
 * Technology Based Services -- Family 81110000 Computer services) classify
 * WHAT IS BEING PROCURED (a consulting engagement, a software service).
 * IndustryKey classifies WHAT INDUSTRY THE CLIENT OPERATES IN (a NAICS/
 * ISIC-adjacent axis). "Professional Services (Consulting, Legal, Audit)"
 * and "Software & SaaS" are real client industries in their own right --
 * UNSPSC 80/81 correctly names the service category a professional-services
 * or software firm itself SELLS, but that is not the same fact as which of
 * the 8 existing IndustryKey buckets such a firm's OWN industry belongs
 * under, and forcing that crosswalk would conflate the two axes the
 * classification book explicitly warns against conflating ("The other axis
 * this is NOT" section). Same reasoning applies to the 3 e-commerce
 * variants (B2C/B2B/Marketplace) -- UNSPSC Segment 80's marketing/
 * distribution families describe a service, not a client industry.
 *
 * Honest conclusion: there is no mis-mapping to correct here with the data
 * this book provides. The real gap is that the 8-key IndustryKey taxonomy
 * itself has no "Technology / Software" or "Professional & Business
 * Services" industry -- these 4 sub-sectors are placed under the nearest
 * existing bucket (retail-fmcg, government) as a documented, deliberate
 * compromise, not a silent one. A true fix would mean adding new IndustryKey
 * value(s) (e.g. 'technology-services', 'professional-services') and is a
 * larger, cross-cutting schema change (touches kpiBenchmarksByIndustry.ts,
 * the KPI Dashboard industry selector, and every other IndustryKey consumer)
 * -- out of scope for this pass, flagged as a real follow-on item requiring
 * its own scoping rather than forced through here.
 */
import type { IndustryKey } from './kpiBenchmarksByIndustry';

export const INDUSTRY_SUB_SECTORS: Record<IndustryKey, string[]> = {
  'retail-fmcg': [
    'Grocery & Supermarkets', 'Fashion & Apparel', 'Electronics & Technology Retail',
    'Health & Beauty', 'Wholesale & Distribution', 'Hypermarkets & Department Stores',
    'Software & SaaS', 'B2C E-Commerce Platform', 'B2B E-Commerce', 'Marketplace & Aggregators',
  ],
  'manufacturing': [
    'Automotive & Assembly', 'Aerospace & Defense', 'Electronics & Semiconductors',
    'FMCG Manufacturing', 'Heavy Industry & Steel', 'Chemicals & Petrochemicals',
    'Plastics & Composites', 'Textiles & Apparel', 'Furniture & Wood Products',
    'Medical Devices', 'Hardware & Electronics',
  ],
  'healthcare-pharma': [
    'Healthcare Authorities', 'Branded Pharmaceuticals', 'Generic Pharmaceuticals',
    'Medical Devices & Diagnostics', 'Biotechnology', 'Healthcare Distribution',
    'Hospitals & Medical Centers', 'Diagnostics & Laboratories', 'Medical & Surgical Supplies',
    'Home Healthcare',
  ],
  'oil-gas': [
    'Oil & Gas Upstream', 'Oil & Gas Midstream / Pipelines', 'Oil & Gas Downstream / Refining',
    'Petrochemicals', 'Renewable Energy (Solar/Wind)', 'Power Generation & Utilities',
    'Mining & Extractives', 'Oil & Gas EPC',
  ],
  'government': [
    'Defense & Security', 'Infrastructure & Transport', 'Facilities Management (FM)',
    'Professional Services (Consulting, Legal, Audit)',
  ],
  'logistics': [
    '3PL / 4PL Providers', 'Cold Chain Logistics', 'Warehousing & Distribution Centers',
    'Port & Customs Operations',
  ],
  'food-beverage': [
    'Food Processing & Manufacturing', 'Dairy Products', 'Bakery & Confectionery',
    'Beverages (Non-Alcoholic)', 'Halal Food Production', 'Agricultural Products & Trading',
    'QSR & Fast Food Chains', 'Catering & Food Services',
  ],
  'construction': [
    'Residential Construction', 'Commercial & Office Construction', 'Infrastructure & Mega Projects',
    'Industrial Facilities', 'Roads & Bridges',
  ],
};
