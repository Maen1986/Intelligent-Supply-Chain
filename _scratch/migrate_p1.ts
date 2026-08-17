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
