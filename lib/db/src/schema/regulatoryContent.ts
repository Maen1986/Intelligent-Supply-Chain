import { pgTable, text, serial, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";

/**
 * Country × industry regulatory coverage registry (#118 v2, #33, #147).
 *
 * Replaces the static `regions.ts` frontend registry with a DB-backed model
 * so new countries/regulators can be added without a code deploy, and so
 * coverage can vary by INDUSTRY within a country — not just by country.
 * Example: SFDA only applies to food/pharma/healthcare; Customs/ZATCA
 * matters most for logistics/import-export-heavy sectors; a ministry-level
 * requirement may be industry-specific while Nitaqat/PDPL-equivalents are
 * universal. `regulatory_frameworks.applies_to_industries` carries that.
 *
 * `regulatory_countries.region` is a free-text field on purpose — it is not
 * hardcoded to GCC. Any world region (levant, mena, southeast_asia, europe,
 * africa, ...) is just a data row away; the architecture does not limit
 * coverage to a fixed list of regions or countries.
 *
 * Content trust model (per the accuracy discussion in #118 v2): every
 * framework row carries `status` (verified | pending_review | roadmap),
 * `source_url` (citation), and `last_verified_at` / `verified_by` so the UI
 * can show real provenance instead of an undifferentiated "Full" badge.
 * Nothing here should render as "Verified" without a human reviewer behind
 * it — draft/researched entries stay `pending_review` until then.
 */

export const regulatoryCountriesTable = pgTable("regulatory_countries", {
  id:             text("id").primaryKey(),          // 'ksa' | 'uae' | 'qat' | 'omn' | 'bhr' | 'jor' | ...
  name:           text("name").notNull(),
  nameAr:         text("name_ar").notNull(),
  isoCode:        text("iso_code"),                  // 'SA' | 'AE' | 'QA' | 'OM' | 'BH' | 'JO'
  region:         text("region").notNull(),          // 'gcc' | 'levant' | 'mena' | 'southeast_asia' | 'europe' | 'africa' | ...
  coverageLevel:  text("coverage_level").notNull(),  // 'full' | 'partial' | 'roadmap'
  isDefault:      boolean("is_default").notNull().default(false),
  sourceUrl:      text("source_url"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  verifiedBy:     text("verified_by"),
  notes:          text("notes"),
  notesAr:        text("notes_ar"),
  sortOrder:      integer("sort_order").notNull().default(0),
});

export const regulatoryFrameworksTable = pgTable("regulatory_frameworks", {
  id:                   serial("id").primaryKey(),
  countryId:            text("country_id").notNull().references(() => regulatoryCountriesTable.id),
  code:                 text("code").notNull(),         // short slug e.g. 'nitaqat', 'sfda', 'icv_uae'
  name:                 text("name").notNull(),
  nameAr:               text("name_ar").notNull(),
  regulatorBody:        text("regulator_body"),
  regulatorBodyAr:      text("regulator_body_ar"),
  appliesToIndustries:  jsonb("applies_to_industries").notNull().default(["*"]), // ["*"] = universal, else industry ids
  description:          text("description"),
  descriptionAr:        text("description_ar"),
  sourceUrl:            text("source_url"),
  status:               text("status").notNull().default("roadmap"), // 'verified' | 'pending_review' | 'roadmap'
  lastVerifiedAt:       timestamp("last_verified_at", { withTimezone: true }),
  sortOrder:            integer("sort_order").notNull().default(0),
});

export type RegulatoryCountry        = typeof regulatoryCountriesTable.$inferSelect;
export type InsertRegulatoryCountry  = typeof regulatoryCountriesTable.$inferInsert;
export type RegulatoryFramework       = typeof regulatoryFrameworksTable.$inferSelect;
export type InsertRegulatoryFramework = typeof regulatoryFrameworksTable.$inferInsert;
