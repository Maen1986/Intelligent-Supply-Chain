/**
 * Startup schema guard.
 *
 * Applies any `ALTER TABLE â€¦ ADD COLUMN IF NOT EXISTS â€¦` statements that must
 * be in place before the server starts accepting traffic.  Every statement is
 * idempotent (`IF NOT EXISTS`) so it is safe to run on every boot â€” it is a
 * no-op on databases that are already up to date.
 *
 * This file is the committed DDL source of truth for additive column changes.
 * New tables are handled by Drizzle schema + the Replit Publish flow; only
 * column additions to existing tables belong here.
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";

const MIGRATIONS: string[] = [
  // Task #306 â€” webhook delivery retry columns
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS attempts       INTEGER     NOT NULL DEFAULT 1`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS next_retry_at  TIMESTAMPTZ`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS payload        JSONB`,

  // gcc_benchmarks â€” admin-managed market benchmark dataset
  `CREATE TABLE IF NOT EXISTS gcc_benchmarks (
     id          SERIAL PRIMARY KEY,
     category    TEXT        NOT NULL,
     item_id     TEXT        NOT NULL,
     industry    TEXT,
     label       TEXT,
     data        JSONB       NOT NULL,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_by  TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS gcc_benchmarks_cat_item_ind
     ON gcc_benchmarks (category, item_id, industry)`,

  // Seed GCC-wide defaults only when the table is empty
  `INSERT INTO gcc_benchmarks (category, item_id, industry, label, data)
   SELECT v.category, v.item_id, NULL, v.label, v.data::jsonb
   FROM (VALUES
     ('kpi',   'otif',         'OTIF %',                          '{"median":88,"topQ":95}'),
     ('kpi',   'invTurns',     'Inventory Turns',                 '{"median":57,"topQ":100}'),
     ('kpi',   'procCycle',    'Procurement Cycle Time',          '{"median":61,"topQ":100}'),
     ('kpi',   'forecastAcc',  'Forecast Accuracy',               '{"median":73,"topQ":88}'),
     ('kpi',   'procCost',     'Procurement Cost % Revenue',      '{"median":56,"topQ":100}'),
     ('kpi',   'perfOrder',    'Perfect Order Rate',              '{"median":87,"topQ":96}'),
     ('lever', 'catMgmt',      'Strategic Category Management',   '{"maxPct":0.13}'),
     ('lever', 'suppCons',     'Supplier Consolidation',          '{"maxPct":0.09}'),
     ('lever', 'procAuto',     'Process & eProcurement Automation','{"maxPct":0.05}'),
     ('lever', 'invOpt',       'Inventory Optimisation',          '{"maxPct":0.07}'),
     ('lever', 'demand',       'Demand Forecasting Improvement',  '{"maxPct":0.04}'),
     ('risk',  'supply',       'Supply Risk',                     '{"gcMedian":45,"gcTopQ":22}'),
     ('risk',  'demand',       'Demand Risk',                     '{"gcMedian":40,"gcTopQ":20}'),
     ('risk',  'operational',  'Operational Risk',                '{"gcMedian":48,"gcTopQ":25}'),
     ('risk',  'financial',    'Financial Risk',                  '{"gcMedian":38,"gcTopQ":18}'),
     ('risk',  'geopolitical', 'Geopolitical / Regulatory Risk',  '{"gcMedian":42,"gcTopQ":20}'),
     ('risk',  'esg',          'ESG / Sustainability Risk',       '{"gcMedian":52,"gcTopQ":28}'),
     ('risk',  'cyber',        'Cyber / Technology Risk',         '{"gcMedian":55,"gcTopQ":25}'),
     ('risk',  'contract',     'Contract / Governance Risk',      '{"gcMedian":44,"gcTopQ":20}')
   ) AS v(category, item_id, label, data)
   WHERE NOT EXISTS (SELECT 1 FROM gcc_benchmarks LIMIT 1)`,

  // #147/#149 â€” regulatory_countries + regulatory_frameworks (DB-backed
  // countryÃ—industry regulatory coverage; replaces the static regions.ts
  // registry). `region` is free text so any world region can be added later
  // without a schema change. Content trust: nothing here is `status =
  // 'verified'` unless a named human reviewer has signed off â€” see notes in
  // regulatoryContent.ts.
  `CREATE TABLE IF NOT EXISTS regulatory_countries (
     id                TEXT PRIMARY KEY,
     name              TEXT        NOT NULL,
     name_ar           TEXT        NOT NULL,
     iso_code          TEXT,
     region            TEXT        NOT NULL,
     coverage_level    TEXT        NOT NULL,
     is_default        BOOLEAN     NOT NULL DEFAULT FALSE,
     source_url        TEXT,
     last_verified_at  TIMESTAMPTZ,
     verified_by       TEXT,
     notes             TEXT,
     notes_ar          TEXT,
     sort_order        INTEGER     NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS regulatory_frameworks (
     id                     SERIAL PRIMARY KEY,
     country_id             TEXT        NOT NULL REFERENCES regulatory_countries(id),
     code                   TEXT        NOT NULL,
     name                   TEXT        NOT NULL,
     name_ar                TEXT        NOT NULL,
     regulator_body         TEXT,
     regulator_body_ar      TEXT,
     applies_to_industries  JSONB       NOT NULL DEFAULT '["*"]',
     description            TEXT,
     description_ar         TEXT,
     source_url             TEXT,
     status                 TEXT        NOT NULL DEFAULT 'roadmap',
     last_verified_at       TIMESTAMPTZ,
     sort_order             INTEGER     NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS regulatory_frameworks_country
     ON regulatory_frameworks (country_id)`,

  // Seed countries only when the table is empty
  `INSERT INTO regulatory_countries
     (id, name, name_ar, iso_code, region, coverage_level, is_default, source_url, last_verified_at, verified_by, notes, notes_ar, sort_order)
   SELECT v.id, v.name, v.name_ar, v.iso_code, v.region, v.coverage_level, v.is_default, v.source_url, v.last_verified_at, v.verified_by, v.notes, v.notes_ar, v.sort_order
   FROM (VALUES
     ('ksa', 'Saudi Arabia', 'Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©', 'SA', 'gcc', 'full', TRUE,
      'https://www.sfda.gov.sa/en/regulations', NOW(), 'ISC content team',
      'Full-depth regulatory module â€” 7 sub-segments, 70 questions, 5-level bilingual maturity scale. Live in the Maturity Assessment today.',
      'ÙˆØ­Ø¯Ø© ØªÙ†Ø¸ÙŠÙ…ÙŠØ© ÙƒØ§Ù…Ù„Ø© Ø§Ù„Ø¹Ù…Ù‚ â€” 7 ÙˆØ­Ø¯Ø§Øª ÙØ±Ø¹ÙŠØ©ØŒ 70 Ø³Ø¤Ø§Ù„Ø§Ø»ØŒ ÙˆÙ…Ù‚ÙŠØ§Ø³ Ù†Ø¶Ø¬ Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ© Ø¨Ø®Ù…Ø³Ø© Ù…Ø³ØªÙˆÙŠØ§Øª.', 1),
     ('uae', 'United Arab Emirates', 'Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ù…ØªØ­Ø¯Ø©', 'AE', 'gcc', 'roadmap', FALSE,
      'https://moiat.gov.ae/en/programs/icv', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¬Ù‡Ø§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ© ÙˆØªØºØ°ÙŠØªÙ‡Ø§Ø› Ù„Ù… ØªØªÙ… Ø¨Ø¹Ø¯ ØµÙŠØ§ØºØ© Ø£Ø³Ø¦Ù„Ø© Ù…Ù‚ÙŠØ§Ø³ Ø§Ù„Ù†Ø¶Ø¬ Ø£Ùˆ Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§.', 2),
     ('qat', 'Qatar', 'Ù‚Ø·Ø±', 'QA', 'gcc', 'roadmap', FALSE,
      'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¬Ù‡Ø§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ© ÙˆØªØºØ°ÙŠØªÙ‡Ø§Ø› Ù„Ù… ØªØªÙ… Ø¨Ø¹Ø¯ ØµÙŠØ§ØºØ© Ø£Ø³Ø¦Ù„Ø© Ù…Ù‚ÙŠØ§Ø³ Ø§Ù„Ù†Ø¶Ø¬ Ø£Ùˆ Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§.', 3),
     ('omn', 'Oman', 'Ø¹ÙÙ…Ø§Ù†', 'OM', 'gcc', 'roadmap', FALSE,
      'https://gov.om/en/general-secretariat-of-the-tender-board', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¬Ù‡Ø§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ© ÙˆØªØºØ°ÙŠØªÙ‡Ø§Ø› Ù„Ù… ØªØªÙ… Ø¨Ø¹Ø¯ ØµÙŠØ§ØºØ© Ø£Ø³Ø¦Ù„Ø© Ù…Ù‚ÙŠØ§Ø³ Ø§Ù„Ù†Ø¶Ø¬ Ø£Ùˆ Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§.', 4),
     ('bhr', 'Bahrain', 'Ø§Ù„Ø¨Ø­Ø±ÙŠÙ†', 'BH', 'gcc', 'roadmap', FALSE,
      'https://www.pdp.gov.bh/en/index.html', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¬Ù‡Ø§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ© ÙˆØªØºØ°ÙŠØªÙ‡Ø§Ø› Ù„Ù… ØªØªÙ… Ø¨Ø¹Ø¯ ØµÙŠØ§ØºØ© Ø£Ø³Ø¦Ù„Ø© Ù…Ù‚ÙŠØ§Ø³ Ø§Ù„Ù†Ø¶Ø¬ Ø£Ùˆ Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§.', 5),
     ('jor', 'Jordan', 'Ø§Ù„Ø£Ø±Ø¯Ù†', 'JO', 'levant', 'roadmap', FALSE,
      'https://www.dlapiperdataprotection.com/guide.pdf?c=JO', NULL, NULL,
      'Not a GCC Customs Union member â€” separate customs/trade regime. Regulator list partially researched (PDPL confirmed; procurement law needs direct verification); question content not yet authored.',
      'Ù„ÙŠØ³Øª Ø¹Ø¶ÙˆÙ‹Ø§ ÙÙŠ Ø§Ù„Ø§ØªØ­Ø§Ø¯ Ø§Ù„Ø¬Ù…Ø±ÙƒÙŠ Ø§Ù„Ø®Ù„ÙŠØ¬ÙŠ â€” Ù†Ø¸Ø§Ù… Ø¬Ù…Ø±ÙƒÙŠ/ØªØ¬Ø§Ø±ÙŠ Ù…Ù†ÙØµÙ„. ØªÙ… Ø¨Ø­Ø« Ø¬Ø²Ø¦ÙŠ Ù„Ù„Ø¬Ù‡Ø§Øª Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ©Ø› Ù„Ù… ØªØªÙ… Ø¨Ø¹Ø¯ ØµÙŠØ§ØºØ© Ø§Ù„Ø£Ø³Ø¦Ù„Ø©.', 6)
   ) AS v(id, name, name_ar, iso_code, region, coverage_level, is_default, source_url, last_verified_at, verified_by, notes, notes_ar, sort_order)
   WHERE NOT EXISTS (SELECT 1 FROM regulatory_countries LIMIT 1)`,

  // Seed frameworks only when the table is empty
  `INSERT INTO regulatory_frameworks
     (country_id, code, name, name_ar, regulator_body, regulator_body_ar, applies_to_industries, description, source_url, status, sort_order)
   SELECT v.country_id, v.code, v.name, v.name_ar, v.regulator_body, v.regulator_body_ar, v.applies_to_industries::jsonb, v.description, v.source_url, v.status, v.sort_order
   FROM (VALUES
     -- Saudi Arabia â€” matches the 7 sub-segments already live in maturityData.tsx
     ('ksa', 'nitaqat', 'Nitaqat / Saudization', 'Ù†Ø·Ø§Ù‚Ø§Øª / Ø§Ù„ØªÙˆØ·ÙŠÙ†', 'Ministry of Human Resources and Social Development', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙˆØ§Ù„ØªÙ†Ù…ÙŠØ© Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ©', '["*"]', 'Workforce localisation quota system.', 'https://www.hrsd.gov.sa/en', 'verified', 1),
     ('ksa', 'iktva', 'IKTVA & Local Content', 'Ø¥ÙƒØªÙØ§Ø¡ ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù…Ø­Ù„ÙŠ', 'Ministry of Industry and Mineral Resources', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØµÙ†Ø§Ø¹Ø© ÙˆØ§Ù„Ø«Ø±ÙˆØ© Ø§Ù„Ù…Ø¹Ø¯Ù†ÙŠØ©', '["*"]', 'In-Kingdom Total Value Add local-content programme.', 'https://iktva.sa/', 'verified', 2),
     ('ksa', 'import_export', 'Import/Export Licensing', 'ØªØ±Ø§Ø®ÙŠØµ Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ ÙˆØ§Ù„ØªØµØ¯ÙŠØ±', 'Saudi Customs / ZATCA', 'Ø§Ù„Ø¬Ù…Ø§Ø±Ùƒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© / Ù‡ÙŠØ¦Ø© Ø§Ù„Ø²ÙƒØ§Ø© ÙˆØ§Ù„Ø¶Ø±ÙŠØ¨Ø© ÙˆØ§Ù„Ø¬Ù…Ø§Ø±Ùƒ', '["*"]', 'Customs and cross-border trade licensing.', 'https://zatca.gov.sa/', 'verified', 3),
     ('ksa', 'sfda', 'Product Regulatory Compliance', 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠ Ù„Ù„Ù…Ù†ØªØ¬Ø§Øª', 'Saudi Food & Drug Authority (SFDA)', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù„ØºØ°Ø§Ø¡ ÙˆØ§Ù„Ø¯ÙˆØ§Ø¡', '["fmcg","pharma","retail"]', 'Product registration and compliance for food, drug, cosmetic and medical device products.', 'https://www.sfda.gov.sa/en/regulations', 'verified', 4),
     ('ksa', 'gtpl', 'GTPL (Government Procurement)', 'Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª ÙˆØ§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©', 'National Competitiveness Authority / Monafasat', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„ÙˆØ·Ù†ÙŠØ© Ù„Ù„Ù…Ù†Ø§ÙØ³Ø© / Ù…Ù†Ø§ÙØ³Ø§Øª', '["government"]', 'Government Tendering and Procurement Law â€” applies to entities selling into government procurement.', 'https://monafasat.etimad.sa/', 'verified', 5),
     ('ksa', 'halal', 'Halal & Islamic Commerce Standards', 'Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø­Ù„Ø§Ù„ ÙˆØ§Ù„ØªØ¬Ø§Ø±Ø© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©', 'Saudi Food & Drug Authority (SFDA)', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù„ØºØ°Ø§Ø¡ ÙˆØ§Ù„Ø¯ÙˆØ§Ø¡', '["fmcg","pharma","retail"]', 'Halal certification and Islamic commerce compliance.', 'https://www.sfda.gov.sa/en/regulations', 'verified', 6),
     ('ksa', 'pdpl', 'PDPL Data Privacy & Protection', 'Ù†Ø¸Ø§Ù… Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©', 'Saudi Data & AI Authority (SDAIA)', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ù„Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ', '["*"]', 'Personal Data Protection Law.', 'https://sdaia.gov.sa/', 'verified', 7),

     -- UAE â€” researched, not yet authored as maturity-scale questions
     ('uae', 'icv_uae', 'National In-Country Value (ICV) Program', 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø­Ù„ÙŠØ©', 'Ministry of Industry and Advanced Technology (MoIAT)', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØµÙ†Ø§Ø¹Ø© ÙˆØ§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©', '["*"]', 'Local-content and Emiratisation scoring used in government/major-company tender awards; NAFIS registration is a prerequisite.', 'https://moiat.gov.ae/en/programs/icv', 'pending_review', 1),
     ('uae', 'pdpl_uae', 'UAE PDPL (Federal Decree-Law No. 45 of 2021)', 'Ù‚Ø§Ù†ÙˆÙ† Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ© Ø§Ù„Ø§ØªØ­Ø§Ø¯ÙŠ', 'UAE Data Office', 'Ù…ÙƒØªØ¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¥Ù…Ø§Ø±Ø§ØªÙŠ', '["*"]', 'Federal personal data protection law.', 'https://u.ae/', 'pending_review', 2),
     ('uae', 'customs_uae', 'Federal Customs Authority / GCC Customs Union', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø§ØªØ­Ø§Ø¯ÙŠØ© Ù„Ù„Ø¬Ù…Ø§Ø±Ùƒ / Ø§Ù„Ø§ØªØ­Ø§Ø¯ Ø§Ù„Ø¬Ù…Ø±ÙƒÙŠ Ø§Ù„Ø®Ù„ÙŠØ¬ÙŠ', 'Federal Customs Authority', 'Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø§ØªØ­Ø§Ø¯ÙŠØ© Ù„Ù„Ø¬Ù…Ø§Ø±Ùƒ', '["*"]', 'Cross-border trade and customs tariffs.', 'https://www.fca.gov.ae/', 'pending_review', 3),

     -- Qatar
     ('qat', 'ppl_qat', 'Public Procurement Law No. 24/2015', 'Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª ÙˆØ§Ù„Ù…Ø²Ø§ÙŠØ¯Ø§Øª', 'Ministry of Finance', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©', '["government"]', 'Government tendering law; local SME preference on lower-value tenders.', 'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', 'pending_review', 1),
     ('qat', 'tawteen', 'Tawteen In-Country Value Program', 'Ø¨Ø±Ù†Ø§Ù…Ø¬ ØªÙˆØ·ÙŠÙ†', 'QatarEnergy', 'Ù‚Ø·Ø± Ù„Ù„Ø·Ø§Ù‚Ø©', '["oil_gas","manufacturing","construction"]', 'ICV scoring for energy-sector and major suppliers.', 'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', 'pending_review', 2),
     ('qat', 'pdpl_qat', 'Qatar Data Protection Law No. 13 of 2016', 'Ù‚Ø§Ù†ÙˆÙ† Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©', 'Communications Regulatory Authority (CRA)', 'Ù‡ÙŠØ¦Ø© ØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ø§ØªØµØ§Ù„Ø§Øª', '["*"]', 'Personal data protection law.', 'https://www.dlapiperdataprotection.com/countries/qatar/law.html', 'pending_review', 3),

     -- Oman
     ('omn', 'tender_law_omn', 'Tender Law / Esnad e-Tendering', 'Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª / Ù†Ø¸Ø§Ù… Ø¥Ø³Ù†Ø§Ø¯', 'Tender Board (Sultanate of Oman)', 'Ù…Ø¬Ù„Ø³ Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª', '["government"]', 'Government tendering law and e-tendering platform.', 'https://gov.om/en/general-secretariat-of-the-tender-board', 'pending_review', 1),
     ('omn', 'omanisation', 'Omanisation / In-Country Value', 'Ø§Ù„ØªØ¹Ù…ÙŠÙ† / Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø­Ù„ÙŠØ©', 'Ministry of Labour', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø¹Ù…Ù„', '["*"]', 'Workforce localisation quotas verified via Esnad; ICV requires min. 10% of tender value to local SMEs.', 'https://timesofoman.com/article/158836-oman-tender-board-mandates-omanisation-compliance-for-contracts', 'pending_review', 2),
     ('omn', 'pdpl_omn', 'Oman PDPL + Executive Regulations (2024)', 'Ù‚Ø§Ù†ÙˆÙ† Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆÙ„Ø§Ø¦Ø­ØªÙ‡ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'Ministry of Transport, Communications & IT', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù†Ù‚Ù„ ÙˆØ§Ù„Ø§ØªØµØ§Ù„Ø§Øª ÙˆØªÙ‚Ù†ÙŠØ© Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', '["*"]', 'Personal data protection law and 2024 executive regulations.', 'https://www.clydeco.com/en/insights/2024/02/oman-issues-executive-regulations-to-pdpl', 'pending_review', 3),

     -- Bahrain
     ('bhr', 'tender_board_bhr', 'Tender Board Law', 'Ù‚Ø§Ù†ÙˆÙ† Ù…Ø¬Ù„Ø³ Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª', 'Tender Board', 'Ù…Ø¬Ù„Ø³ Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª', '["government"]', 'Government procurement and tendering law.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 1),
     ('bhr', 'lmra', 'LMRA / Bahrainisation', 'Ù‡ÙŠØ¦Ø© ØªÙ†Ø¸ÙŠÙ… Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ / Ø§Ù„Ø¨Ø­Ø±Ù†Ø©', 'Labour Market Regulatory Authority (LMRA)', 'Ù‡ÙŠØ¦Ø© ØªÙ†Ø¸ÙŠÙ… Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„', '["*"]', 'Workforce localisation quotas.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 2),
     ('bhr', 'pdpl_bhr', 'PDPL (Law No. 30 of 2018)', 'Ù‚Ø§Ù†ÙˆÙ† Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©', 'Personal Data Protection Authority (PDPA)', 'Ù‡ÙŠØ¦Ø© Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©', '["*"]', 'Personal data protection law, EU-inspired.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 3),

     -- Jordan
     ('jor', 'pdpl_jor', 'Personal Data Protection Law No. 24 of 2023', 'Ù‚Ø§Ù†ÙˆÙ† Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©', 'Ministry of Digital Economy and Entrepreneurship', 'ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯ Ø§Ù„Ø±Ù‚Ù…ÙŠ ÙˆØ§Ù„Ø±ÙŠØ§Ø¯Ø©', '["*"]', 'Data protection law; national Data Protection Authority not yet fully established as of research date.', 'https://www.dlapiperdataprotection.com/guide.pdf?c=JO', 'pending_review', 1),
     ('jor', 'customs_jor', 'Jordan Customs Department', 'Ø¯Ø§Ø¦Ø±Ø© Ø§Ù„Ø¬Ù…Ø§Ø±Ùƒ Ø§Ù„Ø£Ø±Ø¯Ù†ÙŠØ©', 'Jordan Customs Department', 'Ø¯Ø§Ø¦Ø±Ø© Ø§Ù„Ø¬Ù…Ø§Ø±Ùƒ Ø§Ù„Ø£Ø±Ø¯Ù†ÙŠØ©', '["*"]', 'Not part of GCC Customs Union â€” separate regime with US-Jordan FTA and EU association agreement provisions.', 'https://jaradatlaw.com/doing-business-in-jordan-legal-framework-and-recent-developments/', 'pending_review', 2)
   ) AS v(country_id, code, name, name_ar, regulator_body, regulator_body_ar, applies_to_industries, description, source_url, status, sort_order)
   WHERE NOT EXISTS (SELECT 1 FROM regulatory_frameworks LIMIT 1)`,

  // #157 â€” UAE regulatory maturity-scale question content has now been
  // authored (7 sub-segments, 35 questions, 5-level bilingual maturity
  // scale â€” see maturityRegulatoryUae.ts on the frontend), so bump UAE's
  // coverage_level from 'roadmap' to 'partial'. Deliberately NOT 'full':
  // the content has not yet been signed off by a named human legal/expert
  // reviewer, unlike Saudi Arabia's reviewed content. This UPDATE is
  // idempotent and safe to run on every boot, including against a database
  // that was already seeded with the original 'roadmap' row.
  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Emiratisation/Nafis, ICV, customs, ESMA product conformity, government procurement, halal certification, PDPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'ØªÙ…Øª ØµÙŠØ§ØºØ© Ø£Ø³Ø¦Ù„Ø© Ù…Ù‚ÙŠØ§Ø³ Ø§Ù„Ù†Ø¶Ø¬ (7 ÙˆØ­Ø¯Ø§Øª ÙØ±Ø¹ÙŠØ©ØŒ 35 Ø³Ø¤Ø§Ù„Ø§Ù‹: Ø§Ù„ØªÙˆØ·ÙŠÙ†/Ù†Ø§ÙØ³ØŒ Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø­Ù„ÙŠØ©ØŒ Ø§Ù„Ø¬Ù…Ø§Ø±ÙƒØŒ Ù…Ø·Ø§Ø¨Ù‚Ø© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª (Ø§Ù„Ù‡ÙŠØ¦Ø©)ØŒ Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©ØŒ Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø­Ù„Ø§Ù„ØŒ Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª)Ùˆ6a¶,öava¶bvbH6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	İXYIÈS‘Ûİ™\˜YÙWÛ]™[H	Ü›ØYX\	Ø‚ˆËÈÌMŒ8 %]™Hš[X\K\Ûİ\˜ÙHÚXÚÈÙˆHPQH™Yİ[]ÜHÛÛ[ˆËÈ
Œ‹LLLÊNˆ]™\HÜXÚYšXÈšYİ\™Kİ™\ÚÛXÜ›ÜÜÈ[ÈİX‹\ÙYÛY[ÂˆËÈØ\È™KXÚXÚÙYYØZ[œİİ\œ™[X›XÈ™Yİ[]ÜˆYÙ\È[™]È^Ë‚ˆËÈÛ™HÛÜœ™Xİ[ÛˆØ\ÈXYH
H˜XœšXØ]YŒÈYX\œÉÈ^\šY[˜ÙHˆ[™\‚ˆËÈÜš]\š[ÛˆØ\È™]Üš][ˆÈ™Y›XİHXİX[™\]X[YšXØ][ÛˆÜš]\šXBˆËÈ[ˆØXš[™]™\ÛÛ][Ûˆ›ËˆLŒ‹ÌŒ\XÛH8 %š[˜[˜ÚX[ÛÛ™[˜ŞKˆËÈXÚšXØ[Ø\Xš[]K˜XÚÈ™XÛÜ™
Kˆ\È\Èš[X\K\Ûİ\˜ÙBˆËÈ™\šYšXØ][Û‹“ÕH˜[YY[X[ˆ™]šY]Ù\ˆÚYÛ‹[Ù™ˆ8 %Ûİ™\˜YÙWÛ]™[ˆËÈİ^\È	Ü\X[	Ë›İ	Ù[	Ë[™›È™\šYšYYØH˜[YH\ÈÙ]ˆ›İ\ÂˆËÈ\™H\]YÈ\ØÛÜÙH\È\İ[˜İ[Ûˆ˜[œÜ\™[KˆY[\İ[‚ˆËÈİX\™YHHX\šÙ\ˆİš[™ÈÛÈ]Û›H[œÈÛ˜ÙH]™[ˆİYÚ]›ÂˆËÈÛ™Ù\ˆX]Ú\ÈÛˆHÜšYÚ[˜[	Ü›ØYX\	Èİ]K‚ˆTUH™Yİ[]ÜWØÛİ[šY\ÂˆÑU›İ\ÈH	ÓX]\š]K\ØØ[H]Y\İ[ÛˆÛÛ[]]Ü™Y
ÈİX‹\ÙYÛY[ËÍH]Y\İ[ÛœÎˆ[Z\˜]\Ø][Û‹Ó˜Yš\ËPÕ‹İ\İÛ\ËTÓPH›ÙXİÛÛ™›Ü›Z]KÛİ™\››Y[›Øİ\™[Y[[[Ù\YšXØ][Û‹]Hš]˜XŞJKˆš[X\K\Ûİ\˜ÙKXÚXÚÙYYØZ[œİİ\œ™[™Yİ[]ÜˆYÙ\ËÛ]È^ÈÛˆŒ‹LLLÈ
Û™HšYİ\™HÛÜœ™XİY
Kˆİ[[™[™È[™\[™[˜[YY[X[ˆYØ[Ù^\™]šY]È™Y›Ü™H™Z[™ÈX\šÙY[H™\šYšYY‰Ëˆ›İ\×Ø\ˆH	ö*¶av*ˆ6-vb¶)ö.¶*H6(ö,ö)¶a6*H6av`¶b¶)ö,È6)öa6a¶-¶+
È6b6+v+ö)ö*ˆ6`v,v.vb¶*v#ÍH6,ö)6)öa6)öbÎˆ6)öa6*¶b6-öb¶a‹öa¶)ö`v,ö#6)öa6`¶b¶av*H6)öa6av-¶)ö`v*H6)öa6av+va6b¶*v#6)öa6+6av)ö,v`ö#6av-ö)ö*6`¶*H6)öa6ava¶*¶+6)ö*ˆ
6)öa6aöb¶)¶*Jv#6)öa6av-6*¶,vb¶)ö*ˆ6)öa6+v`öb6avb¶*v#6-6aö)ö+ö*H6)öa6+va6)öa6#6+vav)öb¶*H6)öa6*6b¶)öa¶)ö*ˆ6)öa6-6+¶-vb¶*JKˆ6+6,vbH6)öa6*¶+v`¶`ˆ6avaˆ6)öa6av-v)ö+ö,H6)öa6(öb6a6b¶*H6av`¶)ö*6a6-v`v+v)ö*ˆ6)öa6+6aö)ö*ˆ6)öa6*¶a¶.6b¶avb¶*H6)öa6+v)öa6b¶*H6*6*¶)ö,vb¶+ˆŒ‹LLLÈ
6av.H6*¶-v+vb¶+H6,v`¶aH6b6)ö+v+ÊKˆ6a6)È6*¶,¶)öa6`¶b¶+È6)öa6av,v)ö+6.v*H6)öa6`¶)öa¶b6a¶b¶*Kö)öa6+¶*6b¶,v*H6)öa6av,ö*¶`¶a6*H6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	İXYIÈS‘Ûİ™\˜YÙWÛ]™[H	Ü\X[	ÂˆS‘›İ\È“ÕRÑH	ÉTš[X\K\Ûİ\˜ÙKXÚXÚÙY	IØ‚ˆËÈÌMH
Œ‹LLMŠH8 %X]\‹Ò›Ü™[‹ÓÛX[‹Ğ˜Z˜Z[ˆ™Yİ[]ÜHÛÛ[Ø\ÂˆËÈ]]Ü™Y[™Ú\™Y]™H
ÌMŒKHÌMŠH]\ÙH›İÜÈÙ\™Hİ[Y]ˆËÈÛİ™\˜YÙWÛ]™[H	Ü›ØYX\	ÈÚ]HÜšYÚ[˜[››İY]]]Ü™YˆÙYYˆËÈ›İ\ËÛÈHÛİ[HXÚÙ\ˆÙ\ÚİÚ[™ÈÛÛZ[™ÈÛÛÛˆˆ›ÜˆÛÛ[ˆËÈ]Ø\È[ˆ˜Xİ]™H8 %›YÙÙY\ÈHØİ[Y[][Û‹İ\İØ\[ˆÚ]BˆËÈX\ÙXİ[ÛˆËŒ‹ˆ\ÙHTU\Èœš[™ÈHˆX™[[ˆ[™HÚ]ˆËÈ™X[]KX]Ú[™ÈH^XİØ[YH	Ü\X[	È
›İ	Ù[	ÊH™X]Y[PQBˆËÈ[™XYH™XÙZ]™YˆÛÛ[\È]]Ü™Y[™]™K]›İY]ÚYÛ™YÙ™‚ˆËÈHH˜[YY[™\[™[[X[ˆYØ[Ù^\™]šY]Ù\‹ˆY[\İ[8 %XXÚˆËÈ\ÈİX\™YHÛİ™\˜YÙWÛ]™[H	Ü›ØYX\	ÈÛÈ]Û›Hš\™\ÈÛ˜ÙK‚ˆTUH™Yİ[]ÜWØÛİ[šY\ÂˆÑUÛİ™\˜YÙWÛ]™[H	Ü\X[	Ëˆ›İ\ÈH	ÓX]\š]K\ØØ[H]Y\İ[ÛˆÛÛ[]]Ü™Y
ÈİX‹\ÙYÛY[ËÍH]Y\İ[ÛœÎˆX]\š^˜][Ûˆ	ˆÛÜšÙ›Ü˜ÙH˜][Û˜[^˜][Û‹]İY[‹ÒPÕ‹İ\İÛ\È	ˆ˜YHÛÛ\X[˜ÙKTÈ›ÙXİÛÛ™›Ü›Z]KÛİ™\››Y[›Øİ\™[Y[[[Ù\YšXØ][Û‹]Hš]˜XŞJKˆ[™[™È[™\[™[YØ[Ù^\™]šY]È™Y›Ü™H™Z[™ÈX\šÙY[H™\šYšYY‰Ëˆ›İ\×Ø\ˆH	ö*¶av*ˆ6-vb¶)ö.¶*H6(ö,ö)¶a6*H6av`¶b¶)ö,È6)öa6a¶-¶+
È6b6+v+ö)ö*ˆ6`v,v.vb¶*v#ÍH6,ö)6)öa6)öbÎˆ6)öa6`¶-ö,va¶*H6b6*¶b6-öb¶aˆ6)öa6`¶b6bH6)öa6.v)öava6*v#6)öa6*¶b6-öb¶a‹ö)öa6`¶b¶av*H6)öa6av-¶)ö`v*H6)öa6av+va6b¶*v#6)öa6)öav*¶*ö)öa6)öa6+6av,v`öbˆ6b6)öa6*¶+6)ö,vb¶#6av-ö)ö*6`¶*H6)öa6ava¶*¶+6)ö*ˆ6b6)öa6avb6)ö-v`v)ö*¶#6)öa6av-6*¶,vb¶)ö*ˆ6)öa6+v`öb6avb¶*v#6-6aö)ö+ö*H6)öa6+va6)öa6#6`¶)öa¶b6aˆ6+vav)öb¶*H6)öa6*6b¶)öa¶)ö*ˆ6)öa6-6+¶-vb¶*JKˆ6`¶b¶+È6)öa6av,v)ö+6.v*H6)öa6`¶)öa¶b6a¶b¶*Kö)öa6+¶*6b¶,v*H6)öa6av,ö*¶`¶a6*H6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	ÜX]	ÈS‘Ûİ™\˜YÙWÛ]™[H	Ü›ØYX\	Ø‚ˆTUH™Yİ[]ÜWØÛİ[šY\ÂˆÑUÛİ™\˜YÙWÛ]™[H	Ü\X[	Ëˆ›İ\ÈH	ÓX]\š]K\ØØ[H]Y\İ[ÛˆÛÛ[]]Ü™Y
ÈİX‹\ÙYÛY[ËÍH]Y\İ[ÛœÎˆ›Ü™[š^˜][Ûˆ	ˆX›ÜˆØØ[^˜][Û‹RVˆØØ[ÛÛ[	ˆ[\ÈÙˆÜšYÚ[‹İ\İÛ\È	ˆ˜YHÛÛ\X[˜ÙK”ÓSÈ›ÙXİÛÛ™›Ü›Z]KÛİ™\››Y[›Øİ\™[Y[[[Ù\YšXØ][Û‹]Hš]˜XŞJKˆ[™[™È[™\[™[YØ[Ù^\™]šY]È™Y›Ü™H™Z[™ÈX\šÙY[H™\šYšYY‰Ëˆ›İ\×Ø\ˆH	ö*¶av*ˆ6-vb¶)ö.¶*H6(ö,ö)¶a6*H6av`¶b¶)ö,È6)öa6a¶-¶+
È6b6+v+ö)ö*ˆ6`v,v.vb¶*v#ÍH6,ö)6)öa6)öbÎˆ6)öa6(ö,v+öa¶*H6b6*¶b6-öb¶aˆ6)öa6`¶b6bH6)öa6.v)öava6*v#6`¶b¶,ˆ6)öa6av+v*¶l6bH6b6`¶b6)ö.v+È6)öa6ava¶-6(ö#6)öa6+6av)ö,v`È6b6)öa6*¶+6)ö,vb¶#6av-ö)ö*6`¶*H6)öa6ava¶*¶+6)ö*ˆ6b6)öa6avb6)ö-v`v)ö*¶#6)öa6av-6*¶,vb¶)ö*ˆ6)öa6+v`öb6avb¶*v#6-6aö)ö+ö*H6)öa6+va6)öa6#6`¶)öa¶b6aˆ6+vav)öb¶*H6)öa6*6b¶)öa¶)ö*ˆ6)öa6-6+¶-vb¶*JKˆ6`¶b¶+È6)öa6av,v)ö+6.v*H6)öa6`¶)öa¶b6a¶b¶*Kö)öa6+¶*6b¶,v*H6)öa6av,ö*¶`¶a6*H6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	Ú›Ü‰ÈS‘Ûİ™\˜YÙWÛ]™[H	Ü›ØYX\	Ø‚ˆTUH™Yİ[]ÜWØÛİ[šY\ÂˆÑUÛİ™\˜YÙWÛ]™[H	Ü\X[	Ëˆ›İ\ÈH	ÓX]\š]K\ØØ[H]Y\İ[ÛˆÛÛ[]]Ü™Y
ÈİX‹\ÙYÛY[ËÍH]Y\İ[ÛœÎˆÛX[š\Ø][Ûˆ	ˆÛÜšÙ›Ü˜ÙH˜][Û˜[^˜][Û‹[‹PÛİ[H˜[YH
PÕŠH›ÙÜ˜[[YKİ\İÛ\È	ˆ˜YHÛÛ\X[˜ÙKÔÓH›ÙXİÛÛ™›Ü›Z]KÛİ™\››Y[›Øİ\™[Y[[[Ù\YšXØ][Û‹]Hš]˜XŞJKˆ[™[™È[™\[™[YØ[Ù^\™]šY]È™Y›Ü™H™Z[™ÈX\šÙY[H™\šYšYY‰Ëˆ›İ\×Ø\ˆH	ö*¶av*ˆ6-vb¶)ö.¶*H6(ö,ö)¶a6*H6av`¶b¶)ö,È6)öa6a¶-¶+6`vb¶aö(6)ö,ö.v`H
È6b6+v+ö)ö*ˆ6`v,v.vb¶*v#ÍH6,ö)6)öa6)öbÎˆ6)öa6*¶.vavb¶aˆ6b6*¶b6-öb¶aˆ6)öa6`¶b6bH6)öa6.v)öava6*v#œ›§®jöb¶`H6)öa6`¶b¶av*H6)öa6av-¶)ö`v*H6)öa6av+va6b¶*v#6)öa6)öav*¶*ö)öa6)öa6+6av,v`öbˆ6b6)öa6*¶+6)ö,vb¶#6av-ö)ö*6`¶*H6)öa6ava¶*¶+6)ö*ˆ6b6)öa6avb6)ö-v`v)ö*¶#6)öa6av-6*¶,vb¶)ö*ˆ6)öa6+v`öb6avb¶*v#6-6aö)ö+ö*H6)öa6+va6)öa6#6`¶)öa¶b6aˆ6+vav)öb¶*H6)öa6*6b¶)öa¶)ö*ˆ6)öa6-6+¶-vb¶*JKˆ6`¶b¶+È6)öa6av,v)ö+6.v*H6)öa6`¶)öa¶b6a¶b¶*Kö)öa6+¶*6b¶,v*H6)öa6av,ö*¶`¶a6*H6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	ÛÛ[‰ÈS‘Ûİ™\˜YÙWÛ]™[H	Ü›ØYX\	Ø‚ˆTUH™Yİ[]ÜWØÛİ[šY\ÂˆÑUÛİ™\˜YÙWÛ]™[H	Ü\X[	Ëˆ›İ\ÈH	ÓX]\š]K\ØØ[H]Y\İ[ÛˆÛÛ[]]Ü™Y
ÈİX‹\ÙYÛY[ËÍH]Y\İ[ÛœÎˆ˜Z˜Z[š\Ø][Ûˆ	ˆÛÜšÙ›Ü˜ÙHØØ[^˜][Û‹ØØ[ÛÛ[	ˆ˜][Û˜[™Y™\™[˜ÙKİ\İÛ\È	ˆ˜YHÛÛ\X[˜ÙK”ÓQ›ÙXİÛÛ™›Ü›Z]KÛİ™\››Y[›Øİ\™[Y[[[Ù\YšXØ][Û‹]Hš]˜XŞJKˆ[™[™È[™\[™[YØ[Ù^\™]šY]È™Y›Ü™H™Z[™ÈX\šÙY[H™\šYšYY‰Ëˆ›İ\×Ø\ˆH	ö*¶av*ˆ6-vb¶)ö.¶*H6(ö,ö)¶a6*H6av`¶b¶)ö,È6)öa6a¶-¶+Ø¶`öaH
È6b6+v+ö)ö*ˆ6`v,v.vb¶*v#ÍH6,ö)6)öa6)öbÎˆ6)öa6*6+v,va¶*H6b6*¶b6-öb¶aˆ6)öa6`¶b6bH6)öa6.v)öava6*v#6)öa6av+v*¶b6bH6)öa6av+va6bˆ6b6)öa6(ö`v-¶a6b¶*H6)öa6b6-öa¶b¶*v#6)öa6)öav*¶*ö)öa6)öa6+6av,v`öbˆ6b6)öa6*¶+6)ö,vb¶#6av-ö)ö*6`¶*H6)öa6ava¶*¶+6)ö*ˆ6b6)öa6avb6)ö-v`v)ö*¶#6)öa6av-6*¶,vb¶)ö*ˆ6)öa6+v`öb6avb¶*v#6-6aö)ö+ö*H6)öa6+va6)öa6#6`¶)öa¶b6aˆ6+vav)öb¶*H6)öa6*6b¶)öa¶)ö*ˆ6)öa6-6+¶-vb¶*JKˆ6`¶b¶+È6)öa6av,v)ö+6.v*H6)öa6`¶)öa¶b6a¶b¶*Kö)öa6+¶*6b¶,v*H6)öa6av,ö*¶`¶a6*H6`¶*6a6)ö.v*¶av)ö+öaö)È6*6-6`öa6`ö)öava‰ÂˆÒT‘HYH	Øš‰ÈS‘Ûİ™\˜YÙWÛ]™[H	Ü›ØYX\	Ø‚ˆËÈ[™Ú[™HH
]›Ü›Hİ˜]YŞH™]šY]ÈK\ÚÈÌŒ
HKHÜ™Ø[š^˜][ÛœÈ[]K‚ˆËÈ›İ[™][ÛˆX›Nˆ™\XÙ\ÈHœ™YK]^\Ù\œË˜ÛÛ\[HšY[\ÈH™X[ˆËÈXØÛİ[\Ù\œÈØ[ˆÚ\™Kˆ[X™\˜][HZ[š[X[
˜[YHÛ›JHKHİ\Y\œËˆËÈÜ[™[™ÛÛ˜XİÈÙ]ØÛÜYYØZ[œİ\ÈÛ˜ÙHHÚ\™Y]HÜ˜\ˆËÈ
[™Ú[™HÊH^\İËˆY]]™H[™Y[\İ[ÈØY™HÛˆ]™\H›Ûİ‚ˆÔ‘PUHP“HQˆ“ÕVTÕÈÜ™Ø[š^˜][ÛœÈ
ˆYÑT’PS’SPT–HÑVKˆ˜[YHV“Õ•SˆÜ™X]YØ]SQTÕST“Õ•SQUS“ÕÊ
Bˆ
X‚ˆËÈ[™Ú[™HHKH[šÈ\Ù\œÈÈÜ™Ø[š^˜][ÛœËˆ[X›Nˆ^\İ[™È\Ù\œÈ\™BˆËÈ“Õ˜XÚÙš[YÚ]H\œÛÛ˜[Ü™ÈH\ÈZYÜ˜][ÛÈ[™Ú[™H	ÜÂˆËÈÙ[‹\Ù\™HÚYÛ\›İÈ\È™\ÜÛœÚX›H›ÜˆÜ™X][™È[ˆÜ™Ø[š^˜][Ûˆ[™ˆËÈÙ][™È\ÈÛˆXØÛİ[Ü™X][ÛˆÛÚ[™È›ÜØ\™‚ˆSTˆP“H\Ù\œÂˆQÓÓSSˆQˆ“ÕVTÕÈÜ™Ø[š^˜][Û—ÚYS•QÑTˆ‘Q‘T‘SÑTÈÜ™Ø[š^˜][ÛœÊY
X‚ˆËÈ[™Ú[™Hˆ
]›Ü›Hİ˜]YŞH™]šY]ÈK\ÚÈÌŒKÈÌNJHKHÙ[™\˜[\ÙYˆËÈš[™[™ÜÈ	ˆXİ[ÛœÈX›KˆÙ\È“Õ™\XÙHX]\š]WÜÛ˜\ÚİËœ™[YYWØXİ[ÛœÂˆËÈ
Xİ[Û•˜XÚÙ\‹ŞÙY\È™XY[™ËİÜš][™È]”ÓÓˆ›Øˆ[˜Ú[™ÙY™\›ÂˆËÈœ›Û[™š\ÚÊHKHHÛÈUÒ[™\œÈ]İXÚ™[YYWØXİ[ÛœÈ›İÈ[ÛÂˆËÈZ\œ›ÜˆHØ[YHÜš]H\™KÛÈ\ÈX›Hİ^\È[ˆŞ[˜È\ÈH\›ÙXİ[™ˆËÈ™XÛÛY\ÈHÚ[™ÛHXÙH]]ÛX][Ûˆ[™]\™H[™Ú[™\È
ËŠH™XYœ›ÛK‚ˆËÈS’TUQHÛÛœİ˜Z[XZÙ\ÈHZ\œ›ÜˆÜš]\ÈØY™HÈ\Ù\
ÓˆÓÓ‘“PÕ
K‚ˆÔ‘PUHP“HQˆ“ÕVTÕÈš[™[™Ü×ØXİ[ÛœÈ
ˆYÑT’PS’SPT–HÑVKˆ\Ù\—ÚYS•QÑTˆ“Õ•S‘Q‘T‘SÑTÈ\Ù\œÊY
HÓˆSUHĞTĞĞQKˆÜ™Ø[š^˜][Û—ÚYS•QÑTˆ‘Q‘T‘SÑTÈÜ™Ø[š^˜][ÛœÊY
KˆÛİ\˜ÙHV“Õ•SˆÛİ\˜ÙWÜ™Y—ÚYS•QÑTˆ“Õ•Sˆ][WÚÙ^HV“Õ•Sˆ\ÙHVˆÙYÛY[İ]HVˆXİ[ÛˆV“Õ•Sˆœ˜[Y]ÛÜšÈVˆYX\İ\˜X›Wİ\™Ù]Vˆİ]\ÈV“Õ•SQUS	Û›İÜİ\Y	Ëˆ›İ\ÈVˆ[—Üİ\YØ]SQTÕSTˆÛÛ\]YØ]SQTÕSTˆYÙYØ]SQTÕSTˆİ\ÛYÙYØ]SQTÕSTˆÜ™X]YØ]SQTÕST“Õ•SQUS“ÕÊ
Kˆ\]YØ]SQTÕST“Õ•SQUS“ÕÊ
KˆS’TUQH
\Ù\—ÚYÛİ\˜ÙKÛİ\˜ÙWÜ™Y—ÚY][WÚÙ^JBˆ
X‚ˆËÈ[™Ú[™Hˆ\ˆKHÛZ[K[[šÈYXÚ[šXËˆ]ÈHœ™YK[›Û[[İ\ÈXYÛ›ÜİXÂˆËÈ[ˆ™XÛÛYHH™X[˜XÚØX›HXØÛİ[ˆHÚÙ[ˆ\È[XZ[YÛˆ]™\BˆËÈXYÛ›ÜİXÈİX›Z\ÜÚ[Û‹[™ÛZ[Z[™È]š[™Ë[Ü‹XÜ™X]\ÈH\ÜİÛÜ™\ÜÂˆËÈ\Ù\ˆ
Ø[YH]\›ˆ]]È[™XYH\Ù\È›Üˆ›YØXŞH›Ùš[K[Û›BˆËÈXØÛİ[ÈŠH[™ÛÛ™\È]XYÛ›ÜİXÉÜÈ™XÛÛ[Y[™][ÛœÈ[ÂˆËÈš[™[™Ü×ØXİ[ÛœÈ›İÜÈİÛ™YH]XØÛİ[‚ˆÔ‘PUHP“HQˆ“ÕVTÕÈÛZ[WİÚÙ[œÈ
ˆYÑT’PS’SPT–HÑVKˆÚÙ[ˆV“Õ•SS’TUQKˆ[XZ[V“Õ•SˆİX›Z\ÜÚ[Û—ÚYS•QÑTˆ“Õ•S‘Q‘T‘SÑTÈİX›Z\ÜÚ[ÛœÊY
HÓˆSUHĞTĞĞQKˆ\Ù\—ÚYS•QÑTˆ‘Q‘T‘SÑTÈ\Ù\œÊY
Kˆ^\™\×Ø]SQTÕST“Õ•SˆÛZ[YYØ]SQTÕSTˆÜ™X]YØ]SQTÕST“Õ•SQUS“ÕÊ
Bˆ
X‚—NÂ‚™^Ü\Ş[˜È[˜İ[Ûˆ[”İ\\ZYÜ˜][ÛœÊ
Nˆ›ÛZ\ÙO›ÚYˆÂˆÛÛœİÛY[H]ØZ]ÛÛ˜ÛÛ›™Xİ

NÂˆHÂˆ›Üˆ
ÛÛœİÜ[ÙˆRQÔUSÓ”ÊHÂˆ]ØZ]ÛY[œ]Y\JÜ[
NÂˆBˆÙÙÙ\‹š[™›ÊÈÛİ[ˆRQÔUSÓ”Ë›[™İK–ÛZYÜ˜]WHİ\\ZYÜ˜][ÛœÈ\YYŠNÂˆHØ]Ú
\œŠHÂˆÙÙÙ\‹™\œ›ÜŠÈ\œˆK–ÛZYÜ˜]WHİ\\ZYÜ˜][Ûˆ˜Z[YŠNÂˆ›İÈ\œÈËÈX›Üİ\\8 %Z\ÜÚ[™ÈÛÛ[[œÈÛİ[Ø]\ÙH[[YH\œ›ÜœÂˆHš[˜[HÂˆÛY[œ™[X\ÙJ
NÂˆBŸB