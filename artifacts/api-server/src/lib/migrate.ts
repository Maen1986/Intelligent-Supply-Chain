/**
 * Startup schema guard.
 *
 * Applies any `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` statements that must
 * be in place before the server starts accepting traffic.  Every statement is
 * idempotent (`IF NOT EXISTS`) so it is safe to run on every boot — it is a
 * no-op on databases that are already up to date.
 *
 * This file is the committed DDL source of truth for additive column changes.
 * New tables are handled by Drizzle schema + the Replit Publish flow; only
 * column additions to existing tables belong here.
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";

const MIGRATIONS: string[] = [
  // Task #306 — webhook delivery retry columns
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS attempts       INTEGER     NOT NULL DEFAULT 1`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS next_retry_at  TIMESTAMPTZ`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS payload        JSONB`,

  // gcc_benchmarks — admin-managed market benchmark dataset
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

  // #147/#149 — regulatory_countries + regulatory_frameworks (DB-backed
  // country×industry regulatory coverage; replaces the static regions.ts
  // registry). `region` is free text so any world region can be added later
  // without a schema change. Content trust: nothing here is `status =
  // 'verified'` unless a named human reviewer has signed off — see notes in
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
     ('ksa', 'Saudi Arabia', 'المملكة العربية السعودية', 'SA', 'gcc', 'full', TRUE,
      'https://www.sfda.gov.sa/en/regulations', NOW(), 'ISC content team',
      'Full-depth regulatory module — 7 sub-segments, 70 questions, 5-level bilingual maturity scale. Live in the Maturity Assessment today.',
      'وحدة تنظيمية كاملة العمق — 7 وحدات فرعية، 70 سؤالاً، ومقياس نضج ثنائي اللغة بخمسة مستويات.', 1),
     ('uae', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'AE', 'gcc', 'roadmap', FALSE,
      'https://moiat.gov.ae/en/programs/icv', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'تم تحديد الجهات التنظيمية وتغذيتها؛ لم تتم بعد صياغة أسئلة مقياس النضج أو مراجعتها.', 2),
     ('qat', 'Qatar', 'قطر', 'QA', 'gcc', 'roadmap', FALSE,
      'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'تم تحديد الجهات التنظيمية وتغذيتها؛ لم تتم بعد صياغة أسئلة مقياس النضج أو مراجعتها.', 3),
     ('omn', 'Oman', 'عُمان', 'OM', 'gcc', 'roadmap', FALSE,
      'https://gov.om/en/general-secretariat-of-the-tender-board', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'تم تحديد الجهات التنظيمية وتغذيتها؛ لم تتم بعد صياغة أسئلة مقياس النضج أو مراجعتها.', 4),
     ('bhr', 'Bahrain', 'البحرين', 'BH', 'gcc', 'roadmap', FALSE,
      'https://www.pdp.gov.bh/en/index.html', NULL, NULL,
      'Regulator/framework list researched and seeded; maturity-scale question content not yet authored or reviewed.',
      'تم تحديد الجهات التنظيمية وتغذيتها؛ لم تتم بعد صياغة أسئلة مقياس النضج أو مراجعتها.', 5),
     ('jor', 'Jordan', 'الأردن', 'JO', 'levant', 'roadmap', FALSE,
      'https://www.dlapiperdataprotection.com/guide.pdf?c=JO', NULL, NULL,
      'Not a GCC Customs Union member — separate customs/trade regime. Regulator list partially researched (PDPL confirmed; procurement law needs direct verification); question content not yet authored.',
      'ليست عضوًا في الاتحاد الجمركي الخليجي — نظام جمركي/تجاري منفصل. تم بحث جزئي للجهات التنظيمية؛ لم تتم بعد صياغة الأسئلة.', 6)
   ) AS v(id, name, name_ar, iso_code, region, coverage_level, is_default, source_url, last_verified_at, verified_by, notes, notes_ar, sort_order)
   WHERE NOT EXISTS (SELECT 1 FROM regulatory_countries LIMIT 1)`,

  // Seed frameworks only when the table is empty
  `INSERT INTO regulatory_frameworks
     (country_id, code, name, name_ar, regulator_body, regulator_body_ar, applies_to_industries, description, source_url, status, sort_order)
   SELECT v.country_id, v.code, v.name, v.name_ar, v.regulator_body, v.regulator_body_ar, v.applies_to_industries::jsonb, v.description, v.source_url, v.status, v.sort_order
   FROM (VALUES
     -- Saudi Arabia — matches the 7 sub-segments already live in maturityData.tsx
     ('ksa', 'nitaqat', 'Nitaqat / Saudization', 'نطاقات / التوطين', 'Ministry of Human Resources and Social Development', 'وزارة الموارد البشرية والتنمية الاجتماعية', '["*"]', 'Workforce localisation quota system.', 'https://www.hrsd.gov.sa/en', 'verified', 1),
     ('ksa', 'iktva', 'IKTVA & Local Content', 'إكتفاء والمحتوى المحلي', 'Ministry of Industry and Mineral Resources', 'وزارة الصناعة والثروة المعدنية', '["*"]', 'In-Kingdom Total Value Add local-content programme.', 'https://iktva.sa/', 'verified', 2),
     ('ksa', 'import_export', 'Import/Export Licensing', 'تراخيص الاستيراد والتصدير', 'Saudi Customs / ZATCA', 'الجمارك السعودية / هيئة الزكاة والضريبة والجمارك', '["*"]', 'Customs and cross-border trade licensing.', 'https://zatca.gov.sa/', 'verified', 3),
     ('ksa', 'sfda', 'Product Regulatory Compliance', 'الامتثال التنظيمي للمنتجات', 'Saudi Food & Drug Authority (SFDA)', 'الهيئة العامة للغذاء والدواء', '["fmcg","pharma","retail"]', 'Product registration and compliance for food, drug, cosmetic and medical device products.', 'https://www.sfda.gov.sa/en/regulations', 'verified', 4),
     ('ksa', 'gtpl', 'GTPL (Government Procurement)', 'نظام المنافسات والمشتريات الحكومية', 'National Competitiveness Authority / Monafasat', 'الهيئة الوطنية للمنافسة / منافسات', '["government"]', 'Government Tendering and Procurement Law — applies to entities selling into government procurement.', 'https://monafasat.etimad.sa/', 'verified', 5),
     ('ksa', 'halal', 'Halal & Islamic Commerce Standards', 'معايير الحلال والتجارة الإسلامية', 'Saudi Food & Drug Authority (SFDA)', 'الهيئة العامة للغذاء والدواء', '["fmcg","pharma","retail"]', 'Halal certification and Islamic commerce compliance.', 'https://www.sfda.gov.sa/en/regulations', 'verified', 6),
     ('ksa', 'pdpl', 'PDPL Data Privacy & Protection', 'نظام حماية البيانات الشخصية', 'Saudi Data & AI Authority (SDAIA)', 'الهيئة السعودية للبيانات والذكاء الاصطناعي', '["*"]', 'Personal Data Protection Law.', 'https://sdaia.gov.sa/', 'verified', 7),

     -- UAE — researched, not yet authored as maturity-scale questions
     ('uae', 'icv_uae', 'National In-Country Value (ICV) Program', 'برنامج القيمة المضافة المحلية', 'Ministry of Industry and Advanced Technology (MoIAT)', 'وزارة الصناعة والتكنولوجيا المتقدمة', '["*"]', 'Local-content and Emiratisation scoring used in government/major-company tender awards; NAFIS registration is a prerequisite.', 'https://moiat.gov.ae/en/programs/icv', 'pending_review', 1),
     ('uae', 'pdpl_uae', 'UAE PDPL (Federal Decree-Law No. 45 of 2021)', 'قانون حماية البيانات الشخصية الاتحادي', 'UAE Data Office', 'مكتب البيانات الإماراتي', '["*"]', 'Federal personal data protection law.', 'https://u.ae/', 'pending_review', 2),
     ('uae', 'customs_uae', 'Federal Customs Authority / GCC Customs Union', 'الهيئة الاتحادية للجمارك / الاتحاد الجمركي الخليجي', 'Federal Customs Authority', 'الهيئة الاتحادية للجمارك', '["*"]', 'Cross-border trade and customs tariffs.', 'https://www.fca.gov.ae/', 'pending_review', 3),

     -- Qatar
     ('qat', 'ppl_qat', 'Public Procurement Law No. 24/2015', 'قانون المناقصات والمزايدات', 'Ministry of Finance', 'وزارة المالية', '["government"]', 'Government tendering law; local SME preference on lower-value tenders.', 'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', 'pending_review', 1),
     ('qat', 'tawteen', 'Tawteen In-Country Value Program', 'برنامج توطين', 'QatarEnergy', 'قطر للطاقة', '["oil_gas","manufacturing","construction"]', 'ICV scoring for energy-sector and major suppliers.', 'https://www.state.gov/reports/2025-investment-climate-statements/qatar/', 'pending_review', 2),
     ('qat', 'pdpl_qat', 'Qatar Data Protection Law No. 13 of 2016', 'قانون حماية البيانات الشخصية', 'Communications Regulatory Authority (CRA)', 'هيئة تنظيم الاتصالات', '["*"]', 'Personal data protection law.', 'https://www.dlapiperdataprotection.com/countries/qatar/law.html', 'pending_review', 3),

     -- Oman
     ('omn', 'tender_law_omn', 'Tender Law / Esnad e-Tendering', 'قانون المناقصات / نظام إسناد', 'Tender Board (Sultanate of Oman)', 'مجلس المناقصات', '["government"]', 'Government tendering law and e-tendering platform.', 'https://gov.om/en/general-secretariat-of-the-tender-board', 'pending_review', 1),
     ('omn', 'omanisation', 'Omanisation / In-Country Value', 'التعمين / القيمة المضافة المحلية', 'Ministry of Labour', 'وزارة العمل', '["*"]', 'Workforce localisation quotas verified via Esnad; ICV requires min. 10% of tender value to local SMEs.', 'https://timesofoman.com/article/158836-oman-tender-board-mandates-omanisation-compliance-for-contracts', 'pending_review', 2),
     ('omn', 'pdpl_omn', 'Oman PDPL + Executive Regulations (2024)', 'قانون حماية البيانات الشخصية ولائحته التنفيذية', 'Ministry of Transport, Communications & IT', 'وزارة النقل والاتصالات وتقنية المعلومات', '["*"]', 'Personal data protection law and 2024 executive regulations.', 'https://www.clydeco.com/en/insights/2024/02/oman-issues-executive-regulations-to-pdpl', 'pending_review', 3),

     -- Bahrain
     ('bhr', 'tender_board_bhr', 'Tender Board Law', 'قانون مجلس المناقصات', 'Tender Board', 'مجلس المناقصات', '["government"]', 'Government procurement and tendering law.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 1),
     ('bhr', 'lmra', 'LMRA / Bahrainisation', 'هيئة تنظيم سوق العمل / البحرنة', 'Labour Market Regulatory Authority (LMRA)', 'هيئة تنظيم سوق العمل', '["*"]', 'Workforce localisation quotas.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 2),
     ('bhr', 'pdpl_bhr', 'PDPL (Law No. 30 of 2018)', 'قانون حماية البيانات الشخصية', 'Personal Data Protection Authority (PDPA)', 'هيئة حماية البيانات الشخصية', '["*"]', 'Personal data protection law, EU-inspired.', 'https://www.pdp.gov.bh/en/index.html', 'pending_review', 3),

     -- Jordan
     ('jor', 'pdpl_jor', 'Personal Data Protection Law No. 24 of 2023', 'قانون حماية البيانات الشخصية', 'Ministry of Digital Economy and Entrepreneurship', 'وزارة الاقتصاد الرقمي والريادة', '["*"]', 'Data protection law; national Data Protection Authority not yet fully established as of research date.', 'https://www.dlapiperdataprotection.com/guide.pdf?c=JO', 'pending_review', 1),
     ('jor', 'customs_jor', 'Jordan Customs Department', 'دائرة الجمارك الأردنية', 'Jordan Customs Department', 'دائرة الجمارك الأردنية', '["*"]', 'Not part of GCC Customs Union — separate regime with US-Jordan FTA and EU association agreement provisions.', 'https://jaradatlaw.com/doing-business-in-jordan-legal-framework-and-recent-developments/', 'pending_review', 2)
   ) AS v(country_id, code, name, name_ar, regulator_body, regulator_body_ar, applies_to_industries, description, source_url, status, sort_order)
   WHERE NOT EXISTS (SELECT 1 FROM regulatory_frameworks LIMIT 1)`,

  // #157 — UAE regulatory maturity-scale question content has now been
  // authored (7 sub-segments, 35 questions, 5-level bilingual maturity
  // scale — see maturityRegulatoryUae.ts on the frontend), so bump UAE's
  // coverage_level from 'roadmap' to 'partial'. Deliberately NOT 'full':
  // the content has not yet been signed off by a named human legal/expert
  // reviewer, unlike Saudi Arabia's reviewed content. This UPDATE is
  // idempotent and safe to run on every boot, including against a database
  // that was already seeded with the original 'roadmap' row.
  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Emiratisation/Nafis, ICV, customs, ESMA product conformity, government procurement, halal certification, PDPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: التوطين/نافس، القيمة المضافة المحلية، الجمارك، مطابقة المنتجات (الهيئة)، المشتريات الحكومية، شهادة الحلال، حماية البيانات). قيد المراجعة القانونية/الخبيرة المستقلة قبل اعتمادها بشكل كامل.'
   WHERE id = 'uae' AND coverage_level = 'roadmap'`,

  // #160 — Live primary-source check of the UAE regulatory content
  // (2026-08-13): every specific figure/threshold across all 7 sub-segments
  // was re-checked against current public regulator pages and law texts.
  // One correction was made (a fabricated "3 years' experience" tender
  // criterion was rewritten to reflect the actual prequalification criteria
  // in Cabinet Resolution No. 122/2024 Article 8 — financial solvency,
  // technical capability, track record). This is primary-source
  // verification, NOT a named human reviewer sign-off — coverage_level
  // stays 'partial', not 'full', and no verified_by value is set. Notes
  // are updated to disclose this distinction transparently. Idempotent:
  // guarded by a marker string so it only runs once even though it no
  // longer matches on the original 'roadmap' state.
  `UPDATE regulatory_countries
     SET notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Emiratisation/Nafis, ICV, customs, ESMA product conformity, government procurement, halal certification, PDPL data privacy). Primary-source-checked against current regulator pages/law texts on 2026-08-13 (one figure corrected). Still pending independent named human legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: التوطين/نافس، القيمة المضافة المحلية، الجمارك، مطابقة المنتجات (الهيئة)، المشتريات الحكومية، شهادة الحلال، حماية البيانات). جرى التحقق من المصادر الأولية مقابل صفحات الجهات التنظيمية الحالية بتاريخ 2026-08-13 (مع تصحيح رقم واحد). لا تزال قيد المراجعة القانونية/الخبيرة المستقلة من مراجع بشري مُسمّى قبل اعتمادها بشكل كامل.'
   WHERE id = 'uae' AND coverage_level = 'partial'
     AND notes NOT LIKE '%Primary-source-checked%'`,

  // #169 (2026-08-16) — Qatar/Jordan/Oman/Bahrain regulatory content was
  // authored and wired live (#161-#166) but these rows were still left at
  // coverage_level = 'roadmap' with the original "not yet authored" seed
  // notes, so the country picker kept showing "Coming soon" for content
  // that was in fact live — flagged as a documentation/trust gap in Site
  // Map v8 Section 3.2. These UPDATEs bring the DB label in line with
  // reality, matching the exact same 'partial' (not 'full') treatment UAE
  // already received: content is authored and live, but not yet signed off
  // by a named independent human legal/expert reviewer. Idempotent — each
  // is guarded by coverage_level = 'roadmap' so it only fires once.
  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Qatarization & Workforce Nationalization, Tawteen/ICV, customs & trade compliance, QS product conformity, government procurement, halal certification, PDPPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: القطرنة وتوطين القوى العاملة، التوطين/القيمة المضافة المحلية، الامتثال الجمركي والتجاري، مطابقة المنتجات والمواصفات، المشتريات الحكومية، شهادة الحلال، حماية البيانات الشخصية). قيد المراجعة القانونية/الخبيرة المستقلة قبل اعتمادها بشكل كامل.'
   WHERE id = 'qat' AND coverage_level = 'roadmap'`,

  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Jordanization & labor localization, QIZ local content & rules of origin, customs & trade compliance, JSMO product conformity, government procurement, halal certification, PDPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: الأردنة وتوطين العمالة، المحتوى المحلي وقواعد المنشأ، الامتثال الجمركي والتجاري، مطابقة المنتجات والمواصفات، المشتريات الحكومية، شهادة الحلال، قانون حماية البيانات الشخصية). قيد المراجعة القانونية/الخبيرة المستقلة قبل اعتمادها بشكل كامل.'
   WHERE id = 'jor' AND coverage_level = 'roadmap'`,

  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Omanisation & workforce nationalization, In-Country Value (ICV) programme, customs & trade compliance, DGSM product conformity, government procurement, halal certification, PDPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: التعمين وتوطين القوى العاملة، برنامج القيمة المضافة المحلية، الامتثال الجمركي والتجاري، مطابقة المنتجات والمواصفات، المشتريات الحكومية، شهادة الحلال، قانون حماية البيانات الشخصية). قيد المراجعة القانونية/الخبيرة المستقلة قبل اعتمادها بشكل كامل.'
   WHERE id = 'omn' AND coverage_level = 'roadmap'`,

  `UPDATE regulatory_countries
     SET coverage_level = 'partial',
         notes = 'Maturity-scale question content authored (7 sub-segments, 35 questions: Bahrainisation & workforce localization, local content & national preference, customs & trade compliance, BSMD product conformity, government procurement, halal certification, PDPL data privacy). Pending independent legal/expert review before being marked fully verified.',
         notes_ar = 'تمت صياغة أسئلة مقياس النضج (7 وحدات فرعية، 35 سؤالاً: البحرنة وتوطين القوى العاملة، المحتوى المحلي والأفضلية الوطنية، الامتثال الجمركي والتجاري، مطابقة المنتجات والمواصفات، المشتريات الحكومية، شهادة الحلال، قانون حماية البيانات الشخصية). قيد المراجعة القانونية/الخبيرة المستقلة قبل اعتمادها بشكل كامل.'
   WHERE id = 'bhr' AND coverage_level = 'roadmap'`,

  // Engine 1 (Platform Strategy Review v5, Task #204) -- organizations entity.
  // Foundation table: replaces the free-text users.company field as the real
  // account users can share. Deliberately minimal (name only) -- suppliers,
  // spend, and contracts get scoped against this once the shared data graph
  // (Engine 3) exists. Additive and idempotent; safe on every boot.
  `CREATE TABLE IF NOT EXISTS organizations (
     id          SERIAL PRIMARY KEY,
     name        TEXT        NOT NULL,
     created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
   )`,

  // Engine 1 -- link users to organizations. Nullable: existing users are
  // NOT backfilled with a personal org by this migration; Engine 4's
  // self-serve signup flow is responsible for creating an organization and
  // setting this on account creation going forward.
  `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)`,

  // Engine 2 (Platform Strategy Review v5, Task #205/#189) -- generalised
  // Findings & Actions table. Does NOT replace maturity_snapshots.remedy_actions
  // (ActionTracker.tsx keeps reading/writing that JSONB blob unchanged, zero
  // frontend risk) -- the two PATCH handlers that touch remedy_actions now also
  // mirror the same write here, so this table stays in sync as a byproduct and
  // becomes the single place automation and future engines (3, 4, 6) read from.
  // UNIQUE constraint makes the mirror writes safe to upsert (ON CONFLICT).
  `CREATE TABLE IF NOT EXISTS findings_actions (
     id                  SERIAL PRIMARY KEY,
     user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     organization_id     INTEGER REFERENCES organizations(id),
     source              TEXT NOT NULL,
     source_ref_id       INTEGER NOT NULL,
     item_key            TEXT NOT NULL,
     phase               TEXT,
     segment_title       TEXT,
     action              TEXT NOT NULL,
     framework           TEXT,
     measurable_target   TEXT,
     status              TEXT NOT NULL DEFAULT 'not_started',
     notes               TEXT,
     plan_started_at     TIMESTAMP,
     completed_at        TIMESTAMP,
     nudged_at           TIMESTAMP,
     start_nudged_at     TIMESTAMP,
     created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, source, source_ref_id, item_key)
   )`,

  // Engine 2 Part B -- claim-link mechanic. Lets a free, anonymous Diagnostic
  // run become a real, trackable account: a token is emailed on every
  // diagnostic submission, and claiming it finds-or-creates a passwordless
  // user (same pattern auth.ts already uses for "legacy profile-only
  // accounts") and converts that diagnostic's recommendations into
  // findings_actions rows owned by that account.
  `CREATE TABLE IF NOT EXISTS claim_tokens (
     id             SERIAL PRIMARY KEY,
     token          TEXT NOT NULL UNIQUE,
     email          TEXT NOT NULL,
     submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
     user_id        INTEGER REFERENCES users(id),
     expires_at     TIMESTAMP NOT NULL,
     claimed_at     TIMESTAMP,
     created_at     TIMESTAMP NOT NULL DEFAULT NOW()
   )`,

];

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of MIGRATIONS) {
      await client.query(sql);
    }
    logger.info({ count: MIGRATIONS.length }, "[migrate] Startup migrations applied");
  } catch (err) {
    logger.error({ err }, "[migrate] Startup migration failed");
    throw err; // abort startup — missing columns would cause runtime errors
  } finally {
    client.release();
  }
}
