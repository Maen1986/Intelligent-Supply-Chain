# SI Module 08 — Local Content / ICV Eligibility
### Worked Example, Sourced Methodology, and Stress-Test Record — Rawabi Advanced Industries

*Registry: SI-08 (draft, pending #436/#441 formal registry entry). Date: 15 Sep 2026.*
*Engine file: `src/lib/supplierLocalContentEligibility.ts` (570 lines). Test file: `src/lib/supplierLocalContentEligibility.test.ts` (33 tests, soft/hardest/boundary tiers).*
*Status: library-complete, unit-tested, cross-engine chain-tested. No live UI yet (see "What Is Not Yet Done" below) — this doc is written and pushed ahead of the UI decision so the engine itself is reviewable first.*

---

## 1. Why This Module Exists, and Why It Is Not One Formula

Module 07 (`lcgpaLocalContent.ts`, #373/#374) already gives a Saudi-only, client-own-spend
self-check against LCGPA. Rawabi Advanced Industries — like most ISC clients with real GCC
exposure — sources raw materials from suppliers across Saudi Arabia, the UAE, China, Turkey, and
Egypt, and bids into tenders in more than one country. A single "Local Content score" cannot
honestly represent that reality, because **local content is not one regional concept with country
variants — it is several genuinely different regulatory mechanisms**, administered by different
bodies, with different legal scope. A 15 September 2026 sourcing pass (real web research, not
training-data recall) found:

| Country | Program | Mechanism type | Administering body | Sourced scope |
|---|---|---|---|---|
| Saudi Arabia | LCGPA Local Content | Certified **% score** (eligible spend ÷ total spend, 4 pillars) | Local Content & Government Procurement Authority | Government directly; extended June 2022 to entities ≥50% state-owned |
| UAE | National In-Country Value (ICV) | Certified **weighted multi-pillar score**, MoIAT-audited | Ministry of Industry & Advanced Technology (unified with ADNOC's original ICV) | Public spending / "Program Partner" (government/semi-government) tenders |
| Jordan | National Industry Price Preference | **Bid-evaluation price-preference margin** (20%), not a company score | Cabinet decision, Ministry of Industry, Trade & Supply | Public tenders only |
| Oman | (own separate ICV program, oil & gas/JV-anchored) | not-yet-sourced | — | not-yet-sourced |
| Qatar | National Local Content Strategy (recently Cabinet-approved) | not-yet-sourced | — | not-yet-sourced |
| Bahrain | — | not-yet-sourced | — | not-yet-sourced |
| Kuwait | — | not-yet-sourced | — | not-yet-sourced |

None of the three sourced frameworks (SA/AE/JO) has sourced evidence of applying to pure
private-to-private commercial procurement — all three are anchored in government or
semi-government/SOE-linked procurement. This is why `assessSupplierLocalContent()` takes a
`procurementContext` argument (`government` / `semi-government-soe` / `private-commercial`) and
returns an explicit `not-applicable` state — never a fabricated zero — when the sourced regime does
not reach the buyer type being asked about.

**Two disclosed sourcing caveats** (Decision Record 8.7 — never smooth over a real limitation):
1. The UAE ICV pillar figures below were reconstructed from an AI-summarized read of MoIAT's own
   published supplier certification guidelines PDF, not a byte-verified manual transcription. Treat
   this module's UAE output as directional, best-available-public-sourcing reconstruction — verify
   against the primary MoIAT document before using it for an actual certification-adjacent decision.
2. Jordan's exact governing bylaw/regulation number was not identified in available sourcing (only
   the Cabinet decision and the 20% figure, reported by Petra, Jordan's official state news agency).
   The mechanism and the 20% figure are real and sourced; the precise legal citation is not.

## 2. Supplier-Level and Portfolio-Level, Together ("why not both")

Every prior SI module that produces a supplier-level fact (02 Kraljic, 04 Qualification, 05
Concentration) also supports a portfolio rollup. Module 08 follows the same pattern:
`assessSupplierLocalContent()` produces one supplier's fact; `rollUpPortfolioLocalContent()`
aggregates a set of those facts into a client-level, tender-eligibility view — spend-weighted,
grouped by `country + procurementContext` (never averaged across incompatible mechanism types,
per Core Instruction #7 / Decision Record 8.7: never collapse a multi-dimensional assessment into
one fabricated composite).

## 3. Standalone-First Architecture

`supplierLocalContentEligibility.ts` has no runtime import from `lcgpaLocalContent.ts` or any
other SI module. The Saudi LCGPA formula is independently re-implemented here (same real Guide G1
structure, expressed for supplier-level facts rather than client-own-spend) — the two files are
separately-tested siblings, not a caller/callee pair, matching Module 07's own precedent of local
types over sibling imports. `lcgpaLocalContent.ts` and its routed page (`LCGPAReadinessCheck.tsx`)
remain live and completely unchanged by this work.

---

## 4. Stress-Test Record (33 tests, all passing; three tiers per mechanism)

### 4.1 Saudi Arabia — LCGPA eligible-spend-ratio

| Tier | Scenario | Result |
|---|---|---|
| Soft | Realistic supplier, depreciation fields left null | Ratio computed correctly over the 3 populated pillars, null fields treated as 0/0 (excluded, not penalized) |
| Hardest | Expat-labor-only supplier (isolates the 0.37 eligibility factor) | Score = exactly 37.000000% |
| Hardest | Negative/garbage inputs (`-500,000`, `NaN`) | Clamped to 0 by `n()`; no negative or `NaN` score ever produced |
| Boundary | Every pillar exactly zero | `scorePct: null` (honest "no data," never a fabricated 0 or 100) |
| Boundary | 100% locally-eligible across all 4 pillars | Score = exactly 100.000000% |
| Applicability | `private-commercial` context | `not-applicable`, `computation: null` — honest non-zero disclosure, not a misleading zero |

### 4.2 UAE — ICV weighted-pillar-score

| Tier | Scenario | Result |
|---|---|---|
| Soft | Realistic mid-size, mainland-registered supplier | 5 pillars computed, mainland uplift (×1.10) applied, score strictly above the un-lifted base |
| Hardest | Every pillar maxed simultaneously + mainland uplift | Capped at **exactly 100**, never overshoots |
| Hardest | 100% local investment, zero everything else | Score = 10.0% (ratio component only; investment progressive component correctly stays 0 below the AED 5M floor) |
| Boundary | Investment NBV at exactly AED 5M (progressive floor) | Investment pillar = 0.5 (ratio component only) |
| Boundary | Investment NBV at exactly AED 150M, fully local | Investment pillar = 25 (pillar cap) |
| Boundary | Emiratisation spend at exactly AED 200K / AED 20M | Pillar = 2% / 15% exactly (band edges) |
| Boundary | Expatriate headcount at 5/6, 50/51, 200/201 | Pillar = 2/5, 5/8, 8/10 (every band edge exact) |
| Applicability | `private-commercial` context | `not-applicable` |

**Real defect found and fixed in this stress pass:** `computeIcvAe()`'s "were any inputs
supplied" guard originally used truthy `||` checks (`ae.manufacturingOrThirdPartySpendTotalAED || ae.investmentNBVTotalAED || ...`).
A genuinely real UAE supplier profile with **every field explicitly supplied as literal 0** (a
company legitimately reporting zero UAE spend, zero investment, zero Emiratisation, zero expatriate
headcount — as opposed to a caller who supplied nothing at all) was silently forced to
`scorePct: null` ("insufficient data") instead of its honest computed answer. Fixed by replacing the
truthy guard with an explicit `!== null && !== undefined` check per field, so the module now
correctly distinguishes "no inputs supplied" (genuinely `null`) from "inputs supplied, value happens
to be zero" (a real, computed score — which, per the sourced guideline's own band structure, is not
literally 0 but 2, because the Emiratisation pillar's band floors at 2% even at AED 0 annual spend;
the guideline defines bands from 2%–15%, with no 0% band). This is disclosed here rather than
silently patched, per Decision Record 8.7 and the standing stress-test rule (any real defect found
gets fixed and re-verified in the same task).

### 4.3 Jordan — price-preference-margin

| Tier | Scenario | Result |
|---|---|---|
| Soft | 40% locally-manufactured bid content | Effective bid discount = exactly 8.0 points (20% × 40%) |
| Hardest | 0% and 100% locally-manufactured (both extremes) | Discount = 0 and 20 exactly |
| Boundary | Exactly 100% local share | `recommendLocalContentAction()` returns `null` — nothing left to improve |
| Applicability | `private-commercial` and `semi-government-soe` | Both `not-applicable` — Jordan's sourced mechanism is public-tenders-only, narrower than SA/AE's government+SOE scope |

### 4.4 Not-yet-sourced countries (Oman, Qatar, Bahrain, Kuwait)

All four always return `applicability: 'insufficient-data'` and
`computation: { mechanismType: 'not-yet-sourced' }`, regardless of procurement context —
verified for all four countries. `recommendLocalContentAction()` correctly returns `null` for an
`insufficient-data` assessment rather than fabricating a recommendation against an unsourced
formula.

### 4.5 Recommendation logic (`recommendLocalContentAction` — Rule 8, primary + alternative)

Verified: a below-threshold SA supplier gets both a primary recommendation ("close the gap by
raising spend in the lowest-eligible pillar") and a genuinely different alternative
("subcontract/retarget"); an at-or-above-threshold supplier gets `null` (no padded no-op message);
a `not-applicable` or `insufficient-data` assessment always returns `null` rather than a fabricated
recommendation.

### 4.6 Portfolio rollup (`rollUpPortfolioLocalContent`)

Verified: spend-weighted averaging within a `country + procurementContext` group (hand-computed
62% for a 70/30 split of 80%/20% suppliers, matched exactly); SA and AE suppliers never mixed into
one group; `not-applicable` suppliers are counted (`suppliersNotApplicable`) but excluded from the
weighted score rather than averaged in as a zero; an empty portfolio returns an empty list, not an
error.

---

## 5. Worked Example — Rawabi's Raw-Material Portfolio

Rawabi's real multi-country raw-material supplier base (per the SI-00 Charter) spans Saudi Arabia,
the UAE, China, Turkey, and Egypt. Only the Saudi and UAE suppliers fall inside Module 08's sourced
scope — China/Turkey/Egypt genuinely have no sourced GCC/Jordan-style local-content mechanism, so
Module 08 does not attempt to score them at all (a fourth honest state, distinct from
`not-yet-sourced`, since those countries were never claimed to have a GCC-style regime in the first
place).

**Portfolio (spend share):**

| Supplier | Country | Spend share |
|---|---|---|
| Rawabi Steel Partner Co. | Saudi Arabia | 32% |
| Rawabi Cement & Aggregates Co. | Saudi Arabia | 18% |
| Rawabi Aluminum Extrusion Partner Co. | UAE | 20% |
| Rawabi Fasteners Ltd. | China | 15% |
| Rawabi Coatings Supplier | Turkey | 10% |
| Rawabi Packaging Co. | Egypt | 5% |

### 5.1 Saudi steel supplier (LCGPA, government tender)

Inputs (SAR): local labor 4.2M / expat labor 3.1M; local goods & services 2.6M / foreign 5.4M;
capacity building 150K; local depreciation 900K / total depreciation 1.2M.

- Labor: eligible = 4.2M + (3.1M × 0.37) = **5,347,000** / total 7,300,000
- Goods & services: eligible **2,600,000** / total 8,000,000
- Capacity building: **150,000** / 150,000 (100% eligible)
- Depreciation: **900,000** / 1,200,000
- **Score: 54.0%** (8,997,000 / 16,650,000)

### 5.2 Saudi cement supplier (LCGPA, government tender)

Inputs (SAR): local labor 1.8M / expat 0.4M; local goods & services 3.0M / foreign 0.2M; capacity
building 80K; local depreciation 1.1M / total 1.1M.

- **Score: 93.1%** — this supplier is already strongly LCGPA-eligible.

### 5.3 UAE aluminum extrusion supplier (ICV, government tender, mainland-registered)

Inputs (AED): manufacturing/third-party spend local 6.5M / total 9.0M; investment NBV local 18M /
total 20M; Emiratisation annual spend 3.2M; expatriate headcount 65; export revenue 1.1M; Emirati
headcount growth 12%; investment growth 6%; mainland-registered.

| Pillar | Contribution |
|---|---|
| Manufacturing/Third-Party Spend | 72.22 |
| Investment | 10.34 |
| Emiratisation | 3.97 |
| Expatriate Contribution | 8.00 |
| Bonus (export/growth, capped) | 5.11 |
| **Base sum** | **99.64** |
| Mainland uplift (×1.10) | 109.6 → capped |
| **Final score** | **100.0%** (capped) |

### 5.4 Recommendations (primary + alternative, Rule 8)

- **Steel supplier vs. a 55% tender threshold:** primary = "close the ~1.0-point gap by raising
  spend in the lowest-eligible pillar (goods & services, at only 32.5% eligible, is the weakest
  pillar here)"; alternative = "subcontract the shortfall portion to an already-certified local
  entity, or target a tender whose threshold this supplier already clears." Two genuinely different
  paths, not one recommendation with a caveat bolted on.
- **Aluminum supplier vs. a 70% tender threshold:** already at 100% — `recommendLocalContentAction`
  correctly returns `null` (no recommendation needed, not a padded "you're doing great" message).

### 5.5 Portfolio rollup — client-level tender-eligibility view

| Group | Suppliers | Portfolio spend share | Weighted score |
|---|---|---|---|
| Saudi Arabia / government | 2 (steel + cement) | 50% | **68.1%** |
| UAE / government | 1 (aluminum) | 20% | **100.0%** (single supplier) |

The two groups are reported **separately, never averaged together** — a Saudi LCGPA percentage and
a UAE ICV percentage are structurally different scores from different certifying authorities;
collapsing them into one blended "local content number" would be exactly the kind of fabricated
composite Decision Record 8.7 / Core Instruction #7 prohibits, even though both happen to be
expressed as a percentage.

---

## 6. Cross-Engine Chain Test (registry #436 groundwork) — Module 08 × Module 05

The same six-supplier Rawabi portfolio was independently scored by **Module 05's concentration
engine** (`computeHHI()`, `supplierConcentration.ts`) using the full real spend shares
(32/18/20/15/10/5):

- **HHI = 2,098 → `moderatelyConcentrated`** (Module 05's own banding, unrelated to local content).

This is a genuine chain scenario, not a repeat of a prior run: the same portfolio now carries two
independent, honestly-separate dimensional facts — a concentration risk reading (Module 05) and a
government-tender local-content eligibility reading (Module 08) — and the two are never merged into
one number. A client reading both outputs together sees, correctly, that this raw-material
portfolio is moderately concentrated **and** that its Saudi/UAE government-tender eligibility is
currently split (68.1% Saudi-side, 100% UAE-side) — two different questions with two different,
separately-sourced answers, exactly as Core Instruction #7 requires.

---

## 7. What Is Not Yet Done (honest status, not silently deferred)

- **No live UI yet.** The existing `LCGPAReadinessCheck.tsx` page (`/lcgpa-readiness`, Saudi-only,
  client-own-spend) is the natural extension point for a country/mechanism selector, but building
  it is a distinct follow-up task, not yet started or scoped with the platform owner. Per the
  standing UI/UX rule, this module is not "done" in the full sense until that UI exists and is
  QA-10/10-walked-through — this doc records that gap explicitly rather than marking the module
  falsely complete.
- **Registry numbering (#436/#441)** is deferred until Modules 09/10/11 are also complete, per the
  already-approved build order.
- **UAE formula verification** against the primary MoIAT document (not just an AI-summarized
  extraction) remains an open item before this module's AE output should be used for an actual
  certification-adjacent decision.
- **Oman/Qatar/Bahrain/Kuwait** remain `not-yet-sourced` by design — a future research pass could
  source these, but they are not guessed here.

---

## الوحدة رقم 08 من محرك ذكاء الموردين — أهلية المحتوى المحلي / القيمة المحلية المضافة (ICV)
### مثال تطبيقي وتوثيق منهجي واختبار إجهاد — شركة روابي للصناعات المتقدمة

**لماذا هذه الوحدة متعددة الدول والآليات، وليست معادلة واحدة:** أظهر بحث ٱلمصادر بتاريخ ١٥ سبتمبر
٢٠٢٦ أن "المحتوى المحلي" ليس مفهوماً إقليمياً واحداً بمتغيرات قطرية، بل عدة آليات تنظيمية مختلفة
جوهرياً: **السعودية (LCGPA)** — درجة نسبة مئوية معتمدة (الإنفاق المؤهل محلياً ÷ إجمالي الإنفاق عبر
أربعة أركان)، تشمل المشتريات الحكومية مباشرة ووُسِّعت في يونيو ٢٠٢٢ لتغطي الجهات المملوكة للدولة
بنسبة ٥٠٪ فأكثر؛ **الإمارات (ICV)** — درجة مرجحة معتمدة متعددة الأركان تدققها جهة معتمدة من وزارة
الصناعة والتقنية المتقدمة، تتمحور حول الإنفاق العام ومناقصات "شركاء البرنامج"؛ **الأردن** — تفضيل
سعري بنسبة ٢٠٪ في المناقصات الحكومية فقط (وليس درجة محتوى محلي للشركة)، أقرّه مجلس الوزراء وأعلنه
وزير الصناعة والتجارة والتموين بحسب وكالة الأنباء الأردنية الرسمية "بترا". لا يوجد دليل موثّق على
سريان أي من هذه الآليات الثلاث على المشتريات التجارية بين القطاع الخاص فقط — ولذلك تُرجع الوحدة حالة
صريحة "لا ينطبق" بدلاً من درجة صفرية مضلِّلة عند تطبيقها خارج نطاقها الموثّق. أما عُمان وقطر والبحرين
والكويت فتُعامَل بصراحة كـ"غير موثّقة بعد" دون تخمين أي صيغة، التزاماً بالمبدأ الأساسي رقم ٨.٧: عدم
اختلاق البيانات مطلقاً.

**عيب حقيقي اكتُشف وأُصلح أثناء اختبار الإجهاد:** كانت دالة `computeIcvAe()` تتحقق من وجود أي مدخلات
باستخدام فحص منطقي بسيط (`||`) يُعامل القيمة صفر كأنها "لم تُدخل"، مما كان يُجبر مورّداً إماراتياً
حقيقياً أدخل جميع حقوله كصفر فعلي (شركة تقرّ فعلاً بعدم وجود إنفاق أو استثمار أو توطين أو عمالة وافدة
في الإمارات) على نتيجة "بيانات غير كافية" بدلاً من درجته الحقيقية المحسوبة. تم إصلاح ذلك بالتحقق من
عدم كون الحقل `null` أو غير معرّف صراحةً بدلاً من الاعتماد على القيمة المنطقية، مع الإفصاح الكامل عن
هذا الإصلاح هنا بدلاً من إخفائه، التزاماً بسجل القرار ٨.٧.

**المثال التطبيقي (محفظة روابي للمواد الخام):** مورّد الصلب السعودي حقق **٥٤.٠٪** وفق LCGPA، ومورّد
الإسمنت السعودي حقق **٩٣.١٪**، ومورّد الألمنيوم الإماراتي حقق **١٠٠٪** (بعد تطبيق حافز التسجيل في
البر الرئيسي). التجميع على مستوى المحفظة أظهر **٦٨.١٪** مرجحة للجهة السعودية (حكومي) و**١٠٠٪** للجهة
الإماراتية (حكومي) — مُقدَّمتان بشكل منفصل تماماً وليس كرقم واحد مدمج، لأنهما درجتان مختلفتان بنيوياً
من جهتين تصديق مختلفتين. اختبار السلسلة عبر المحركات مع الوحدة ٠٥ (تركّز الموردين) أظهر مؤشر HHI
يساوي **٢٠٩٨** (تركّز متوسط) على نفس المحفظة الكاملة بستة موردين — بُعدان مستقلان تماماً، لم يُدمَجا
في رقم واحد مطلقاً، تماشياً مع التعليمة الأساسية رقم ٧.

**الحالة الحالية بصراحة:** لا توجد واجهة مستخدم فعلية بعد لهذه الوحدة (الصفحة الحالية
`/lcgpa-readiness` تغطي السعودية فقط وهي نقطة التوسع الطبيعية المستقبلية)؛ رقم السجل (#436/#441)
مؤجل حتى اكتمال الوحدات ٠٩ و١٠ و١١ وفق خطة البناء المعتمدة؛ أرقام صيغة ICV الإماراتية تحتاج تحققاً
من الوثيقة الرسمية الأصلية قبل استخدامها في قرار تصديق فعلي؛ وعُمان وقطر والبحرين والكويت تبقى "غير
موثّقة" بتصميم متعمد، لا تخميناً.
