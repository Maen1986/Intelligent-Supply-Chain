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
