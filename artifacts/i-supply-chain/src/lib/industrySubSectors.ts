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
