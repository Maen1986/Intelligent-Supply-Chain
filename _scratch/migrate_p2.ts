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
