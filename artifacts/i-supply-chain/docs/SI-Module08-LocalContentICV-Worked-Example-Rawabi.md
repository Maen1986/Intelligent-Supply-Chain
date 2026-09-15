# SI Module 08 — Local Content / ICV Eligibility
### Worked Example, Sourced Methodology, and Stress-Test Record — Rawabi Advanced Industries

*Registry: SI-08 (draft, pending #436/#441 formal registry entry). Date: 15 Sep 2026, updated 16 Sep 2026 (Saudi Arabia mechanism decomposition, Part 1 slice, section 8; UAE mechanism decomposition + program-architecture generalization, same day, section 9).*
*Engine file: `src/lib/supplierLocalContentEligibility.ts` (1076 lines, 13 programs across 7 countries via a generalized `LocalContentProgram` architecture — see section 9's own note on why the Saudi-only `SaudiProgram` pattern was generalized). Test file: `src/lib/supplierLocalContentEligibility.test.ts` (74 tests: 39 original + 23 Saudi-mechanism + 12 UAE-mechanism/architecture tests, soft/hardest/boundary tiers).*
*Status: library-complete, unit-tested, cross-engine chain-tested, live UI rebuilt as a multi-supplier list per an independent senior-QA review (`/local-content-icv`, QA-10/10-walked-through, 16 Sep 2026), extended this pass with Saudi Arabia's full mechanism decomposition (section 8) and then the UAE's (section 9: MoIAT ICV usage note + genuine incentive-not-gate negative finding, and the Tawazun defense-offset mechanism with a real sourced formula), plus a dual-sided buyer/supplier value-framing panel added to the live UI for every country including Saudi Arabia per the owner's explicit instruction — see "What Is Not Yet Done" below for what remains, including the backend table this pass added but has not provisioned, and Part 2 of the assignment (non-GCC coverage) and the rest of Part 1 (Jordan's second mechanism if any, Oman, Qatar, Bahrain, Kuwait) which are explicitly not started yet.*

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

## 4. Stress-Test Record (39 tests as of 15 Sep 2026, all passing; three tiers per mechanism — see section 8.8 for the 23 additional Saudi-mechanism tests (62 total) and section 9.5 for the 12 additional UAE-mechanism/architecture tests added 16 Sep 2026, 74 total)

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

- **Live UI shipped, then rebuilt (16 Sep 2026)** per an independent senior-QA review run
  against origin/main @ b9dab44 (33/33 engine tests re-verified, every worked-example number
  hand-recomputed and matched). Two real issues from that review are fixed in this pass:
  1. **A real bilingual-completeness bug in the engine itself** (not the UI): `assessSupplierLocalContent`'s
     `reasonAr` dropped the score/discount value entirely in the "applicable" branch, and spliced
     a raw English `ProcurementContext` enum literal into Arabic sentences in both the
     "applicable" and "not-applicable" branches — an Arabic-reading user got less information
     than an English-reading one. Fixed with a `PROCUREMENT_CONTEXT_LABEL_AR` map and a
     `scoreLineAr` built in parallel with the English `scoreLine`; 6 new regression tests assert
     on `reasonAr` content directly (none of the original 33 did).
  2. **The UI's architecture was wrong for the module's real differentiator.** v1 (15 Sep) shipped
     as a single-entity form with a separate "add to portfolio" step. Rebuilt around a
     supplier/entity LIST (`LocalContentEntryCard`, one row per entity, add/remove, mirroring
     `SupplierDependencyCheck.tsx`'s list pattern) so every entity IS a portfolio member from the
     moment it's added. Country + procurement context are now asked before any numeric input, so
     a private-commercial context resolves to "not applicable" immediately instead of showing a
     blank input form first. A supplier whose country isn't one of the 7 this module represents
     (e.g. China, Turkey, Egypt) gets its own explicit "not covered by this module" state — a
     third honest reason for "no number", distinct from "not-yet-sourced" and "not-applicable".
     A Module 05 HHI side-by-side concentration callout was added (page-level composition of two
     already-tested engines' outputs, gated at >=2 spend-bearing entries so a single-entity 100%
     reading is never shown as if it meant something) — labeled and rendered as a fully separate
     dimension, never blended into the local-content rollup (Rule 7). A persistent trust-signal
     line and a note pointing at LCGPA's own small sourced sector-threshold table were added. The
     page remains a standalone route/nav entry alongside the pre-existing Saudi-only
     `LCGPAReadinessCheck.tsx` (`/lcgpa-readiness`) — neither page rewrites nor shares state with
     the other. v1 deliberately still omits an AI-narrative panel — a disclosed scope decision.
  A fresh QA 10/10 customer-experience-simulation walkthrough of the rebuilt page found no new
  defects requiring a fix; one pre-existing, platform-wide gap (the shared `NumberField`
  component's `<label>` is not explicitly `htmlFor`/`id`-paired with its `<input>`, across many
  pages, not unique to this one) is logged rather than fixed here, as genuinely out of this
  single module's scope.
- **Backend persistence added but not provisioned.** Per the QA review's explicit instruction,
  this pass added `local_content_icv_entries` (a Drizzle schema table, `lib/db/src/schema/
  localContentIcvEntries.ts`) and `/api/local-content-icv-entries` (GET/PUT, `artifacts/api-server/
  src/routes/localContentIcvEntries.ts`), mirroring `supplier_dependency_checks`'/`/api/supplier-
  dependency-checks`' whole-state-sync pattern exactly, with the UI's own localStorage-fallback
  behavior unchanged. Per Decision Record 8.7 and the platform's credential boundary (this
  sandbox has no `DATABASE_URL` and no production DB credential, and none was sought): **the code
  is written but the table has not been created on any live database.** Whoever has production DB
  access must run the existing `drizzle-kit push` workflow before backend sync will actually work
  end-to-end — until then, every user gets the same localStorage-only experience v1 always had.
- **Registry numbering (#436/#441)** is deferred until Modules 09/10/11 are also complete, per the
  already-approved build order.
- **UAE formula verification** against the primary MoIAT document (not just an AI-summarized
  extraction) remains an open item before this module's AE output should be used for an actual
  certification-adjacent decision.
- **Oman/Qatar/Bahrain/Kuwait** remain `not-yet-sourced` by design — a future research pass could
  source these, but they are not guessed here.

## 8. Saudi Arabia Mechanism Decomposition (16 Sep 2026)

Assignment: `Module08-NextPass-Agent-Brief.md` — decompose all GCC + Jordan local-content
mechanisms using the six-type taxonomy in the brief's section 1.0, first slice: Saudi Arabia full
decomposition. This section documents what that produced: Saudi Arabia is no longer one program
(`lcgpa-general`) but six (`SaudiProgram`), each independently sourced, tested, and — per the
brief's "Design lens" — read from both a buyer's and a supplier's side. A fresh, dated research
pass against LCGPA's own official mechanisms page, Aramco's own official IKTVA guideline, and
GAMI's own official site substantially refined the brief's own section 1a findings; every
divergence from the brief is disclosed inline below, not silently corrected.

### 8.1 Six-type taxonomy → Saudi program mapping

| Type | Saudi program | `mechanismType` | Status |
|---|---|---|---|
| 1. Certification score | `lcgpa-general` | `eligible-spend-ratio` | Sourced (unchanged from the pre-existing mechanism) |
| 2. Anchor-buyer program | `iktva-aramco` | `anchor-buyer-score` | Sourced, real computable formula (Aramco's own guideline) |
| 3. Category eligibility gate | `mandatory-list` | `category-eligibility-gate` | Sourced, deliberately binary (no percentage found) |
| 4. Bid-evaluation weighting/preference | `price-preference` | `price-preference-margin` (reused from Jordan) | Sourced |
| 5. SME/local spend set-aside | *(not modeled)* | — | No sourced Saudi-specific set-aside distinct from the Mandatory List was found — not fabricated |
| 6. Offset/tech-transfer obligation | `gami-defense`, `likt` | `not-yet-sourced` (×2) | Real dated national context disclosed; no per-supplier formula found |

### 8.2 `lcgpa-general` — usage notes (not a new mechanism)

Per the brief's own UAE precedent ("individual participating entities apply the same ICV score
differently in their own evaluation weighting... this is a 'how the score gets used,' not a new
mechanism"), two real LCGPA evaluation-weighting facts are attached to the *existing* general score
as disclosure text (`usageNotesEn`/`usageNotesAr`), not modeled as separate mechanisms:

- LCGPA's own official mechanisms page: high-value government contracts (excluding sourcing
  contracts) weigh local content at **40%** against 60% price in technical/commercial evaluation,
  plus a bonus for Tadawul-listed companies.
- A separately-cited figure (attributed to SPA, Saudi Press Agency): a **~30%**, phased,
  consulting/IT-sector-specific weighting.
- **Disclosed open item:** whether these are the same rule described two different ways, or two
  genuinely different rules, could not be confirmed — `spa.gov.sa` returned HTTP 403 on every
  direct verification attempt in this research pass. Both figures are shown side by side in the
  UI's usage-notes panel with this ambiguity stated plainly, never merged into one assumed number.

### 8.3 `mandatory-list` — category-eligibility-gate, dual-sided reading

Source: LCGPA's official mechanisms page lists 233+ products/services where government entities
must procure from LCGPA-certified local sources — a pass/fail bidding gate, not a percentage.

- **Buyer's reading** (procurement/compliance lead): "Can I even accept a bid from this supplier
  for this line item, or is it legally restricted to certified local sources?" — a fast, binary
  compliance triage before any commercial evaluation starts.
- **Supplier's reading** (a genuinely different question over the same gate): "Is the single
  biggest blocker to winning this category a missing certification I could actually go get, or is
  this category simply closed to me?" — the gate result tells a supplier whether to invest in
  certification (worthwhile, addressable) or redirect sales effort elsewhere (the category is
  structurally closed without a JV/subcontract route).
- Worked mini-example: a Riyadh-based fire-safety equipment distributor bidding into a Mandatory
  List category, not yet certified → `eligibleToBid: false` → primary recommendation: pursue
  LCGPA certification for that specific category before the next bid cycle; alternative: bid
  jointly with, or subcontract to, an already-certified local entity for that portion of scope.

### 8.4 `price-preference` — reused `price-preference-margin` shape, dual-sided reading

Source: LCGPA's official mechanisms page states a 10% price preference added to foreign products
when compared against qualifying national products in government tenders — structurally identical
to Jordan's mechanism (same discriminated-union shape, `computePricePreferenceMargin(marginPct,
sharePct)` is now a single shared primitive used by both countries, direct validation of the
brief's "shared primitives" design intent).

- **Buyer's reading:** "How much of a price handicap does a foreign-heavy bid face against a
  local one at evaluation time?" — informs whether a foreign bidder's headline price is actually
  competitive after the 10-point adjustment.
- **Supplier's reading:** "How much of my bid's value would I need to re-source locally to move
  the needle on my effective discount?" — the `effectiveBidDiscountPct` output is the direct lever
  a supplier can act on before the tender closes, distinct from the gate above (this shifts
  ranking; it doesn't block a bid).

### 8.5 `iktva-aramco` — anchor-buyer-score, real formula, dual-sided reading

Source: Aramco's own official "2021 iktva Guideline v13" (`iktva.sa`): `iktva% = ((A+B+C+D+R)/E) +
I`, where A = local goods/services spend + local asset depreciation + Saudi-based expatriate
compensation, B = Saudi workforce compensation, C = training & development spend, D = supplier
development spend, R = local R&D spend, E = total costs (denominator), I = incentive bonuses
(export ratio, ESG/cybersecurity/regional-HQ bonuses in Aramco's own full formula). **Disclosed
simplification:** the I component is modeled here as a single optional 0–10 bonus-points input,
caller-supplied, rather than Aramco's full tiered export-ratio/ESG sub-formula — directional only,
never a substitute for Aramco's own certified iktva calculation. This program is scoped to
`semi-government-soe` context only, since it is Aramco's own program, not the general government
score (a supplier assessed under `government` context gets a correct `not-applicable`, never a
silent fallback to the general LCGPA score).

- **Buyer's reading** (Aramco category/vendor manager): "Across A–R, which component is this
  supplier's weakest contributor to their in-Kingdom value-add, and does that change my sourcing
  risk for this category?"
- **Supplier's reading:** "Of the five components (A–R), which one has the most room to move for
  the least new investment?" — the per-component breakdown (`components[]`, each disclosed in both
  languages) is built so a supplier can target the single highest-leverage gap first, exactly the
  same "which pillar is dragging the score down" framing the brief's Design lens calls for on
  certification-score-type mechanisms, carried over to this anchor-buyer program.
- Worked mini-example: an industrial valve manufacturer supplying Aramco directly, `totalCostsSAR:
  6,000,000`, no incentive bonus supplied → `iktva% ≈ (A+B+C+D+R)/6,000,000 × 100`; per-component
  breakdown shows Saudi workforce compensation (B) as the largest single line, R (local R&D) at
  zero — flagged as the highest-leverage, currently-untapped gap.

### 8.6 `gami-defense` and `likt` — both `not-yet-sourced`, both with real dated context

- **GAMI defense localization**: GAMI's own official site states national defense-sector
  localization reached **24.89%** as of end-2024, with a public target of **>50% by 2030**. No
  publicly disclosed per-supplier formula, JV-requirement structure, or offset-calculation
  methodology was found — this real, dated national figure is shown in the UI's applicability
  message instead of a fabricated per-supplier score.
- **LIKT (Localization of Industry & Knowledge Transfer)**: genuinely new to this research pass —
  named on LCGPA's own official mechanisms page, distinct from GAMI's defense-specific program,
  aimed at localizing targeted industries via collaboration with global investors and technology
  leaders. No per-supplier formula found; modeled as its own `not-yet-sourced` entry rather than
  folded into GAMI's, since the two are different programs run by different bodies.
- Both stay out of the "applicable" input-form flow entirely in the UI (the engine's existing
  `not-yet-sourced` short-circuit fires before any context check), so no supplier is ever shown a
  blank input form for a mechanism this platform cannot honestly score.

### 8.7 Explicitly not modeled, to avoid fabrication

- **LCGPA's "Minimum Local Content Threshold"** (technical-evaluation-stage, contract-completion-
  based) appears to overlap with the sibling Module 07 tool's `getSectorBenchmark` (the
  Matarat-style "Target Local Content Score" already used for the hardFM benchmark). Per
  standalone-first architecture this module does not import Module 07's logic, and duplicating an
  overlapping benchmark under a different name here would risk two modules quietly disagreeing
  about the same real threshold — deliberately not re-modeled as a seventh Saudi program.
- **A possible SME/factory-level certificate on-ramp**: a real MIM.gov.sa page ("Initiative of
  Encouraging Small and Medium Factories to Issue the Local Content Certificate") was found but its
  content could not be fetched (`ROBOTS_DISALLOWED`/timeout on both attempts). Whether this is a
  distinct mechanism or an on-ramp into the general LCGPA score is genuinely unresolved — logged
  here as an open research item, not guessed at.

### 8.8 Stress-test record — Saudi mechanisms (23 new tests, all passing; full suite 39 → 62 for this file)

| Mechanism | Soft | Hardest | Boundary |
|---|---|---|---|
| `mandatory-list` | not-in-list → gate doesn't apply | in-list + not certified → gated out | in-list + certification unknown → `null`, never guessed true/false |
| `price-preference` (SA) | partial local share → proportional discount at 10% (not Jordan's 20%) | private-commercial context → not-applicable, not a zero | 0% and 100% local share |
| `iktva-aramco` | realistic supplier, no bonus | incentive bonus supplied out-of-range (150) → clamped to the disclosed 0–10 cap | `totalCostsSAR = 0` → `null` score, not a divide-by-zero artifact |
| `gami-defense` / `likt` | — | — | real dated context present in both languages; never a fabricated score |
| Portfolio rollup | — | two different Saudi programs in the same government context land in two separate groups (never merged) | `gateEligibleSharePct` correctly spend-share-weights mixed eligible/gated suppliers |

Every new `reasonEn` above ships with a `reasonAr` asserted directly in the test suite for content
(not just presence) — continuing the discipline the 15 Sep 2026 bilingual-completeness fix
established for this module.

### 8.9 UI — Saudi program routing question (task #115, QA 10/10 pass)

A routing question ("Which Saudi program?") appears immediately below the country selector once
Saudi Arabia is chosen, before context selection — six buttons, one per `SaudiProgram`, with a
"not sourced" pill on `gami-defense`/`likt` matching the existing country-level pattern used for
Oman/Qatar/Bahrain/Kuwait. **A real gap the QA walkthrough caught and fixed in this same pass:**
switching to a single-context program (Aramco IKTVA, `semi-government-soe` only) while the entry
was still on its default `government` context silently produced a correct-but-unexplained
"not applicable" read the reader would have had to puzzle out. Fixed by auto-selecting the
program's one valid context when the program has exactly one (multi-context programs — the general
score, the Mandatory List, the price preference — are left exactly as the reader set them, since
there's no single correct default to pick for those). Keyboard/RTL check: all six program buttons
and both new Yes/No routing buttons (Mandatory List category / certification) use real `<button>`
elements with `aria-pressed`/`role="group"`/`aria-label`, the same pattern already audited for the
pre-existing country/context button rows — no hover-only affordance was introduced.

---

## 9. United Arab Emirates Mechanism Decomposition (16 Sep 2026)

Continuing Part 1 of `Module08-NextPass-Agent-Brief.md` after Saudi Arabia: the UAE is also not one
program but two (`ae-icv-general`, `ae-tawazun-offset`) — MoIAT's National ICV score and the
Tawazun Economic Council's defense-sector offset obligation, run by two different bodies for two
different buyers. This pass also generalized the engine's own program architecture: the
Saudi-specific `SaudiProgram`/`SAUDI_PROGRAMS` pattern introduced in section 8 does not scale to a
second multi-program country, so it is now a single flat `LocalContentProgram` union covering all
7 countries' programs (`PROGRAMS`, `PROGRAMS_BY_COUNTRY`, `DEFAULT_PROGRAM_BY_COUNTRY`) —
behavior-preserving for every existing caller (Saudi Arabia's own program keys were renamed with an
`sa-` prefix; every other country's default resolution is unchanged). Per the owner's explicit
instruction mid-build, this section — and this pass's re-check of section 8's own live UI — applies
the same rule: **every mechanism carries an explicit buyer-side and supplier-side value reading, not
just a compliance number**, for every country, not only new work.

### 9.1 Six-type taxonomy → UAE program mapping

| Type | UAE program | `mechanismType` | Status |
|---|---|---|---|
| 1. Certification score | `ae-icv-general` | `weighted-pillar-score` | Sourced (unchanged from the pre-existing mechanism; renamed from `ae` to `ae-icv-general` as part of the program generalization) |
| 6. Offset/tech-transfer obligation | `ae-tawazun-offset` | `offset-obligation-gate` (new mechanism type) | Sourced, real computable formula (Tawazun Economic Council's own 2019 policy guidelines) |
| 2–5 | *(not modeled)* | — | No further sourced UAE-specific anchor-buyer, category-gate, price-preference, or set-aside mechanism was found distinct from the two above — not fabricated |

### 9.2 `ae-icv-general` — usage notes and a genuine negative finding

- **Abu Dhabi ADLC usage note**: Abu Dhabi's own Department of Economic Development
  (`idb.added.gov.ae`) states the ICV factor accounts for **40%** of the financial evaluation in
  Abu Dhabi tenders, and a bidder without an ICV certificate scores zero on that 40% — the same
  "how the score gets used by one specific evaluating entity" disclosure pattern as Saudi Arabia's
  own 40%/LCGPA usage note in section 8.2, attached to the *existing* score, not modeled as a
  separate mechanism. Explicitly caveated as an Abu Dhabi emirate-level figure, not confirmed as
  the UAE-wide MoIAT figure (the national MoIAT page states no percentage of its own).
- **Genuine negative finding**: MoIAT's own official ICV program page confirms certification is an
  **incentive** — certified suppliers "gain advantages during the award of tenders and contracts
  based on their ICV score" — not a mandatory bidding gate like Saudi Arabia's Mandatory List. This
  research pass found no sourced evidence of a mandatory ICV-only bidding category, so none is
  modeled here. Stated plainly as a real finding, not an oversight — Decision Record 8.7 applies to
  absence of evidence exactly as it applies to a number.

### 9.3 `ae-tawazun-offset` — offset-obligation-gate, real formula, dual-sided reading, currency-peg resolution

Source: the Tawazun Economic Council's 2019 policy guidelines (cross-verified via afridi-angell.com,
mondaq.com, and the US government's own trade.gov UAE Defense Country Commercial Guide, none
flagging a more recent revision): offset obligations trigger on UAE Armed Forces / Abu Dhabi Police
defense contracts at or above **USD 10 million**. The brief itself flagged a "$10M vs AED10M"
currency ambiguity to be resolved in this non-Saudi pass — resolved here: the AED has been
fixed-pegged to the USD at exactly **3.6725** since 1997, and mondaq.com's own cited **AED 36.73
million** threshold divided by that peg is USD 10,001,361 — a match within the source citation's own
rounding (36.73M is itself rounded to 2 decimals; the peg-exact figure is AED 36.725M, ~0.014% off,
not a real source conflict, and this module's stress test checks that actual tolerance rather than
assuming byte-exactness). Required offset-credit target: **60%** of contract value. Shortfall
settlement: **8.5%** in cash or via bank guarantee, or rolling the remainder into a future project —
both disclosed program options, never modeled as a compliance failure.

- **Buyer's reading** (UAE Armed Forces / Abu Dhabi Police, via the Tawazun Economic Council):
  "Does this contract's value clear the threshold, and if a contractor falls short, does the
  program still capture real value (cash/guarantee) rather than losing it outright?" — the gate
  converts defense spend into either real in-country economic activity or a quantified settlement,
  never a silent write-off.
- **Supplier's reading:** "How much offset credit do I still need to bank before the performance
  period closes, and what does waiting cost me?" — `shortfallAED` and `shortfallPenaltyAED` are the
  two numbers a contractor needs to decide between investing in real offset activity now versus
  paying the 8.5% settlement later; the engine never collapses "credits unknown" into "credits
  zero" (a real honesty distinction — see the stress-test record below).
- Worked mini-example: a UAE-based systems integrator on a AED 50,000,000 Abu Dhabi Police contract
  with AED 10,000,000 of offset credit already banked → `triggersObligation: true`,
  `requiredOffsetCreditsAED: 30,000,000` (60% of 50M), `shortfallAED: 20,000,000`,
  `shortfallPenaltyAED: 1,700,000` (8.5% of the shortfall) → primary recommendation: bank real
  offset credits (local investment, JV, or technology-transfer activity Tawazun recognizes) before
  the period closes; alternative: settle in cash at 8.5% or negotiate rolling the remainder into a
  future project — both the program's own disclosed fallback options, not a compliance failure.

### 9.4 Explicitly not modeled, to avoid fabrication

- **A private-to-private UAE mandate**: no sourced evidence either `ae-icv-general` or
  `ae-tawazun-offset` applies to `private-commercial` procurement — both remain scoped to
  government/semi-government-soe (ICV) and government only (Tawazun), matching section 8's own
  discipline for Saudi Arabia's mechanisms.
- **A UAE-wide (not just Abu Dhabi) financial-evaluation-weight percentage** for ICV: the national
  MoIAT page does not itself state one; the sourced 40% figure is disclosed as Abu Dhabi
  emirate-level only, never generalized to the whole country (see 9.2).

### 9.5 Stress-test record — UAE Tawazun mechanism (12 new tests, all passing; full suite 62 → 74 for this file)

| Mechanism | Soft | Hardest | Boundary |
|---|---|---|---|
| `ae-tawazun-offset` | above-threshold contract with partial credits earned; contract value known but credits earned unknown (`shortfallAED` stays `null`, never a false zero) | far-below-threshold contract → no obligation, zero required credits, never a spurious penalty; earned credits exceed the requirement → shortfall floors at 0, never negative | contract value at exactly the AED 36.73M threshold triggers (`>=`, not `>`); the AED/USD peg-equivalence check itself, within the source citation's own rounding tolerance |
| Applicability | — | `semi-government-soe` and `private-commercial` both correctly `not-applicable` — Tawazun is government-only, narrower than ICV's government+SOE scope | — |
| Recommendation | genuine primary (bank real credits) + alternative (8.5% settlement / rollover), never a single path | returns `null` once there is no shortfall — nothing to recommend against a closed gap | — |
| Portfolio rollup | `totalShortfallPenaltyAED` is a plain SUM of real-money exposure across the group, never spend-share-weighted like a percentage (a different aggregation shape from every other mechanism type in this module, disclosed as such in the engine's own field comment) | — | — |

Also added: an architecture sanity test that every `DEFAULT_PROGRAM_BY_COUNTRY[country]` resolves to
a real `PROGRAMS` entry for its own country, and that `PROGRAMS_BY_COUNTRY` lists exactly the
countries known to run more than one program (SA: 6, AE: 2, all others: 1) — a direct test of the
generalization itself, not just the new UAE content. Every new `reasonEn` above ships with a
`reasonAr` asserted directly in the test suite for content (not just presence), continuing the same
bilingual-completeness discipline established 15 Sep 2026.

### 9.6 UI — UAE program routing question, and buyer/supplier value framing reinforced for every country including Saudi Arabia

The Saudi program-routing pattern from section 8.9 (task #115) is now generalized rather than
duplicated: any country whose `PROGRAMS_BY_COUNTRY` list has more than one program — today SA (6)
and AE (2) — shows the same routing-question button row, with the same auto-context-selection fix
for single-context programs (Tawazun, like Aramco IKTVA before it, is single-context and now
auto-selects `government` when picked). **A real defect this generalization pass avoided:**
switching a supplier's country without also resetting its selected program would otherwise leave the
displayed methodology and assessment reading a different country's framework than the one just
selected (e.g. still showing Aramco IKTVA's Saudi methodology immediately after switching to AE) —
fixed by resetting `program` to the new country's own default on every country-selector click. A
second real defect avoided: a returning user's already-saved entry (localStorage or server-synced)
could carry a pre-generalization Saudi program key (`lcgpa-general` rather than
`sa-lcgpa-general`) — fixed with an explicit, disclosed 1:1 migration map applied on load, not a
silent break on first use after this deploy.

Per the owner's explicit instruction mid-build ("every mechanism ... carries an explicit buyer-side
and supplier-side value reading, not just a compliance number" — "this to all including KSA"), this
pass also added a **dual-sided value-framing panel**, keyed by mechanism type (not by individual
program, so it is automatic for all 7 sourced mechanism shapes and any future one, not hand-added
per country), rendered directly under the Sourced Methodology accordion for every applicable
country — Saudi Arabia's own live UI included, not only new UAE screens or this document's own
buyer's-reading/supplier's-reading subsections. The panel states, in both languages, what the buyer
gets and what the supplier gets from the same mechanism, built entirely from facts already sourced
and disclosed elsewhere in the engine (never a new claim or statistic) — re-stating in the live
product the same reading this document has carried in prose since section 8.3.

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

**الحالة الحالية بصراحة:** أُطلقت واجهة مستخدم فعلية لهذه الوحدة، ثم **أُعيد بناؤها بتاريخ ١٦
سبتمبر ٢٠٢٦** بناءً على مراجعة جودة مستقلة (QA) شاملة أُجريت على نسخة origin/main عند b9dab44
(أُعيد التحقق من ٣٣/٣٣ اختباراً للمحرك، وأُعيد حساب كل رقم في المثال التطبيقي يدوياً وتطابق). أُصلحت
مشكلتان حقيقيتان من تلك المراجعة في هذه المرحلة:
١) **عيب حقيقي في اكتمال الازدواج اللغوي داخل المحرك نفسه** (وليس الواجهة فقط): كانت `reasonAr` في
`assessSupplierLocalContent` تُسقط قيمة الدرجة/الخصم تماماً في الحالة "قابل للتطبيق"، وتُقحم قيمة
تعداد `ProcurementContext` الإنجليزية الخام داخل جمل عربية في كلٍّ من حالتي "قابل للتطبيق" و"لا
ينطبق" — فكان القارئ بالعربية يحصل على معلومات أقل من القارئ بالإنجليزية. أُصلح ذلك بإضافة خريطة
`PROCUREMENT_CONTEXT_LABEL_AR` وبناء `scoreLineAr` موازٍ للنسخة الإنجليزية؛ وأُضيفت ٦ اختبارات
ارتداد جديدة تتحقق من محتوى `reasonAr` مباشرة (لم يكن أيٌّ من الاختبارات الأصلية الـ٣٣ يفعل ذلك).
٢) **كانت بنية الواجهة غير مناسبة لأهم ميزة تمايز في الوحدة.** أُطلق الإصدار الأول (١٥ سبتمبر) كنموذج
لجهة واحدة مع خطوة منفصلة لـ"الإضافة إلى المحفظة". أُعيد بناؤها حول **قائمة** موردين/جهات
(`LocalContentEntryCard`، صف واحد لكل جهة، إضافة/إزالة، على غرار نمط `SupplierDependencyCheck.tsx`)
بحيث تكون كل جهة عضواً في المحفظة من لحظة إضافتها. يُطلب الآن اختيار الدولة وسياق الشراء قبل أي إدخال
رقمي، بحيث يُحسم سياق "تجاري خاص" فوراً كـ"لا ينطبق" بدلاً من عرض نموذج إدخال فارغ أولاً. أي مورّد من
دولة غير مشمولة بالسبع دول التي تمثّلها هذه الوحدة (كالصين أو تركيا أو مصر) يحصل على حالة صريحة خاصة
به بعنوان "غير مغطاة بهذه الوحدة إطلاقاً" — سبب صادق ثالث لعدم وجود رقم، متمايز عن "غير موثّق" و"لا
ينطبق". أُضيف عرض جانبي لمؤشر HHI من الوحدة ٠٥ (تركيب على مستوى الواجهة لمخرجات محركين مُختبرين
مسبقاً، مشروط بوجود جهتين على الأقل بحصة إنفاق مُدخلة حتى لا تُعرض قراءة تركّز ١٠٠٪ لجهة واحدة وكأنها
ذات دلالة) — يُعرض دائماً كبُعد منفصل تماماً، ولا يُدمَج أبداً مع تجميع المحتوى المحلي (التعليمة رقم
٧). أُضيف أيضاً شريط ثقة دائم وملاحظة تُشير إلى جدول الحدود القطاعية الموثّق الصغير الخاص بـLCGPA.
تبقى الصفحة مساراً/عنصر تنقل مستقلاً إلى جانب `LCGPAReadinessCheck.tsx` (السعودية فقط،
`/lcgpa-readiness`) — لا تُعيد أيٌّ من الصفحتين كتابة الأخرى ولا تشترك معها في أي حالة. لا يزال
الإصدار الأول يستبعد عمداً لوحة السرد الذكي (AI narrative) — قرار نطاق مُعلَن. اجتاز فحص محاكاة
تجربة العميل (QA 10/10) الجديد للصفحة المُعاد بناؤها دون العثور على عيوب جديدة تستدعي إصلاحاً؛ فجوة
واحدة موجودة مسبقاً وعابرة للمنصة بأكملها (عنصر `<label>` في مكوّن `NumberField` المشترك غير مرتبط
صراحةً بـ`htmlFor`/`id` مع حقل `<input>` الخاص به، عبر صفحات عديدة، وليست خاصة بهذه الصفحة) تُسجَّل
كبند تراكمي منفصل بدلاً من إصلاحها هنا، لكونها خارج نطاق هذه الوحدة الواحدة فعلياً.

**إضافة تخزين خلفي (backend) دون تفعيله فعلياً على قاعدة بيانات حية.** بناءً على تعليمات مراجعة الجودة
الصريحة، أضافت هذه المرحلة جدول `local_content_icv_entries` (مخطط Drizzle، الملف
`lib/db/src/schema/localContentIcvEntries.ts`) ومسار `/api/local-content-icv-entries`
(GET/PUT، الملف `artifacts/api-server/src/routes/localContentIcvEntries.ts`)، على غرار نمط المزامنة
الكاملة لحالة `supplier_dependency_checks`/`/api/supplier-dependency-checks` تماماً، مع بقاء سلوك
التخزين المحلي الاحتياطي للواجهة كما هو دون تغيير. وفقاً للسجل القراري ٨.٧ وحدود بيانات الاعتماد
الخاصة بالمنصة (لا يوجد `DATABASE_URL` ولا بيانات اعتماد قاعدة بيانات إنتاجية في هذه البيئة المعزولة،
ولم تُطلب): **الكود مكتوب لكن الجدول لم يُنشأ على أي قاعدة بيانات حية بعد.** يجب على من يملك صلاحية
الوصول لقاعدة البيانات الإنتاجية تشغيل مسار العمل الحالي `drizzle-kit push` قبل أن تعمل المزامنة
الخلفية فعلياً من طرف إلى طرف — وحتى ذلك الحين، يحصل كل مستخدم على نفس تجربة التخزين المحلي فقط التي
كانت عليها منذ الإصدار الأول. رقم السجل (#436/#441) مؤجل حتى اكتمال الوحدات ٠٩ و١٠ و١١ وفق خطة البناء
المعتمدة؛ أرقام صيغة ICV الإماراتية تحتاج تحققاً من الوثيقة الرسمية الأصلية قبل استخدامها في قرار
تصديق فعلي؛ وعُمان وقطر والبحرين والكويت تبقى "غير موثّقة" بتصميم متعمد، لا تخميناً.

## 8. تفكيك آليات المملكة العربية السعودية (١٦ سبتمبر ٢٠٢٦)

المهمة: `Module08-NextPass-Agent-Brief.md` — تفكيك جميع آليات المحتوى المحلي لدول مجلس التعاون
والأردن باستخدام تصنيف الأنواع الستة في القسم ١.٠ من الموجز، بدءاً بالشريحة الأولى: التفكيك الكامل
للمملكة العربية السعودية. يوثّق هذا القسم ما نتج عن ذلك: لم تعد السعودية برنامجاً واحداً
(`lcgpa-general`) بل ستة برامج (`SaudiProgram`)، كل منها موثّق ومُختبر بشكل مستقل، ويُقرأ — وفق
"عدسة التصميم" في الموجز — من جانب المشتري وجانب المورّد معاً. أعاد بحث حديث ومؤرَّخ صياغة نتائج
القسم ١أ من الموجز نفسه بشكل جوهري، استناداً إلى الصفحة الرسمية لآليات هيئة المحتوى المحلي، ودليل
إكتفاء الرسمي الخاص بأرامكو، والموقع الرسمي للهيئة العامة للصناعات العسكرية (GAMI) — وكل اختلاف عن
الموجز مُفصَح عنه أدناه صراحة، لا مُصحَّحاً بصمت.

### ٨.١ تصنيف الأنواع الستة ← ربطها ببرامج السعودية

| النوع | برنامج السعودية | `mechanismType` | الحالة |
|---|---|---|---|
| ١. درجة اعتماد | `lcgpa-general` | `eligible-spend-ratio` | موثّقة (دون تغيير عن الآلية القائمة) |
| ٢. برنامج مشترٍ رئيسي | `iktva-aramco` | `anchor-buyer-score` | موثّقة، صيغة حقيقية قابلة للحساب (دليل أرامكو الرسمي) |
| ٣. بوابة أهلية فئة | `mandatory-list` | `category-eligibility-gate` | موثّقة، ثنائية عمداً (لم تُوجد نسبة مئوية موثّقة) |
| ٤. ترجيح تقييم العطاءات / تفضيل سعري | `price-preference` | `price-preference-margin` (مُعاد استخدامها من الأردن) | موثّقة |
| ٥. حصة إنفاق محجوزة للمنشآت الصغيرة/المحلية | *(غير مُمثَّلة)* | — | لم توجد آلية حجز حصة سعودية مستقلة عن القائمة الإلزامية موثّقة — ولم تُختلق |
| ٦. التزام مقاصة/نقل تقني | `gami-defense`، `likt` | `not-yet-sourced` (×٢) | سياق وطني حقيقي ومؤرَّخ مُفصَح عنه؛ لم تُوجد صيغة على مستوى المورّد |

### ٨.٢ `lcgpa-general` — ملاحظات الاستخدام (ليست آلية جديدة)

وفق سابقة الإمارات نفسها في الموجز ("الجهات المشاركة المختلفة تطبّق نفس درجة ICV بشكل مختلف ضمن
ترجيح التقييم الخاص بها... هذا 'كيفية استخدام الدرجة'، وليس آلية جديدة")، تُرفَق حقيقتان واقعيتان من
ترجيح تقييم هيئة المحتوى المحلي بالدرجة العامة *القائمة* كنص إفصاح (`usageNotesEn`/`usageNotesAr`)،
دون نمذجتهما كآليتين منفصلتين:

- الصفحة الرسمية لآليات الهيئة: تمنح العقود الحكومية عالية القيمة (باستثناء عقود التوريد) المحتوى
  المحلي وزناً **٤٠٪** مقابل ٦٠٪ للسعر في التقييم الفني/التجاري، إضافة إلى ميزة للشركات المدرجة في
  تداول.
- رقم منسوب إلى وكالة الأنباء السعودية (واس): ترجيح يقارب **٣٠٪**، متدرّج زمنياً، خاص بتقييم عطاءات
  قطاعي الاستشارات وتقنية المعلومات.
- **مسألة مفتوحة مُفصَح عنها:** لم يتأكد ما إذا كانا نفس القاعدة بصياغتين مختلفتين أم قاعدتين
  منفصلتين فعلاً — أعاد موقع `spa.gov.sa` خطأ ٤٠٣ في كل محاولة تحقق مباشرة في هذا البحث. يُعرض
  الرقمان جنباً إلى جنب في لوحة ملاحظات الاستخدام بالواجهة مع بيان هذا الغموض صراحة، دون دمجهما في
  رقم مُفترَض واحد.

### ٨.٣ `mandatory-list` — بوابة أهلية الفئة، قراءة ثنائية الجانب

المصدر: تُدرج الصفحة الرسمية لآليات الهيئة أكثر من ٢٣٣ منتجاً وخدمة يتوجب على الجهات الحكومية شراءها
من مصادر محلية معتمدة من الهيئة فقط — بوابة نجاح/فشل، وليست نسبة مئوية.

- **قراءة المشتري** (مسؤول المشتريات/الامتثال): "هل يمكنني أصلاً قبول عطاء من هذا المورّد لهذا البند،
  أم أن الأمر مقيّد قانونياً بمصادر محلية معتمدة؟" — فرز امتثال ثنائي وسريع قبل بدء أي تقييم تجاري.
- **قراءة المورّد** (سؤال مختلف جوهرياً حول نفس البوابة): "هل العائق الأكبر أمام الفوز بهذه الفئة هو
  اعتماد ناقص يمكنني فعلاً الحصول عليه، أم أن هذه الفئة مغلقة أمامي ببساطة؟" — تُخبر نتيجة البوابة
  المورّد ما إذا كان الاستثمار في الاعتماد مجدياً (قابل للمعالجة)، أو إعادة توجيه جهد المبيعات إلى
  مكان آخر (الفئة مغلقة هيكلياً دون مسار مشروع مشترك/مقاولة من الباطن).
- مثال تطبيقي مصغّر: موزّع معدات سلامة من الحريق مقره الرياض يقدّم عطاءً في فئة مدرجة بالقائمة
  الإلزامية، غير معتمد بعد ← `eligibleToBid: false` ← التوصية الأساسية: متابعة اعتماد الهيئة لهذه
  الفئة تحديداً قبل دورة العطاءات القادمة؛ البديل: تقديم عطاء مشترك مع جهة محلية معتمدة مسبقاً أو
  إسناد ذلك الجزء من النطاق لها كمقاول من الباطن.

### ٨.٤ `price-preference` — إعادة استخدام بنية `price-preference-margin`، قراءة ثنائية الجانب

المصدر: تنص الصفحة الرسمية لآليات الهيئة على إضافة تفضيل سعري بنسبة ١٠٪ للمنتجات الأجنبية عند
مقارنتها بالمنتجات الوطنية المؤهلة في المناقصات الحكومية — مطابقة من حيث البنية لآلية الأردن (نفس بنية
الاتحاد المُميَّز، وأصبحت الدالة `computePricePreferenceMargin(marginPct, sharePct)` أداة أولية
مشتركة واحدة تستخدمها الدولتان، تحقيقاً مباشراً لنية تصميم "الأدوات الأولية المشتركة" في الموجز).

- **قراءة المشتري:** "ما مقدار الإعاقة السعرية التي يواجهها عطاء ذو محتوى أجنبي مرتفع مقابل عطاء
  محلي عند التقييم؟" — يوضح ما إذا كان السعر المعلن لمورّد أجنبي تنافسياً فعلاً بعد تعديل الـ١٠ نقاط.
- **قراءة المورّد:** "ما مقدار قيمة عطائي الذي يلزم إعادة توريده محلياً لتحريك خصمي الفعلي؟" — مخرج
  `effectiveBidDiscountPct` هو الرافعة المباشرة التي يمكن للمورّد التصرف بناءً عليها قبل إغلاق
  المناقصة، بخلاف البوابة أعلاه (هذا يُزيح الترتيب فقط، ولا يمنع تقديم العطاء).

### ٨.٥ `iktva-aramco` — درجة المشتري الرئيسي، صيغة حقيقية، قراءة ثنائية الجانب

المصدر: دليل أرامكو الرسمي "iktva Guideline v13 لعام ٢٠٢١" (`iktva.sa`): نسبة إكتفاء =
((A+B+C+D+R)/E) + I، حيث A = إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة
الوافدة المقيمة في السعودية، B = تعويضات القوى العاملة السعودية، C = إنفاق التدريب والتطوير، D =
إنفاق تطوير الموردين، R = إنفاق البحث والتطوير المحلي، E = إجمالي التكاليف (المقام)، I = مكافآت
تحفيزية (نسبة التصدير، مكافآت الاستدامة/الأمن السيبراني/المقر الإقليمي في صيغة أرامكو الكاملة).
**تبسيط مُفصَح عنه:** يُمثَّل مكوّن I هنا كمُدخل نقاط مكافأة اختياري واحد (٠-١٠)، يُدخله المستخدم،
بدلاً من الصيغة الفرعية الكاملة المتدرجة لنسبة التصدير/الاستدامة — توجيهي فقط، وليس بديلاً عن حساب
إكتفاء المعتمد من أرامكو نفسها. يقتصر هذا البرنامج على سياق "شبه حكومي / مملوك للدولة" فقط، كونه
برنامج أرامكو الخاص، وليس الدرجة الحكومية العامة (يحصل المورّد الذي يُقيَّم ضمن سياق "حكومي" على
نتيجة "لا ينطبق" الصحيحة، ولا يرجع أبداً بصمت إلى درجة LCGPA العامة).

- **قراءة المشتري** (مدير فئة/موردين لدى أرامكو): "عبر المكوّنات A إلى R، أي مكوّن هو الأضعف مساهمة
  لهذا المورّد في القيمة المضافة داخل المملكة، وهل يغيّر ذلك مخاطر التوريد لديّ لهذه الفئة؟"
- **قراءة المورّد:** "من بين المكوّنات الخمسة (A إلى R)، أيها يملك أكبر هامش تحرّك بأقل استثمار
  جديد؟" — بُني تفصيل المكوّنات (`components[]`، كل منها مُفصَح عنه بكلا اللغتين) ليتمكن المورّد من
  استهداف أكبر فجوة ذات رافعة أولاً — نفس إطار "أي ركن يسحب الدرجة للأسفل" الذي تطلبه عدسة التصميم في
  الموجز لآليات نوع درجة الاعتماد، ممتداً إلى هذا البرنامج القائم على مشترٍ رئيسي.
- مثال تطبيقي مصغّر: مُصنِّع صمامات صناعية يورّد مباشرة لأرامكو، `totalCostsSAR: 6,000,000`، دون
  مكافأة تحفيزية مُدخلة ← نسبة إكتفاء ≈ (A+B+C+D+R)/٦,٠٠٠,٠٠٠ × ١٠٠؛ يُظهر تفصيل المكوّنات تعويضات
  القوى العاملة السعودية (B) كأكبر بند منفرد، وR (البحث والتطوير المحلي) عند الصفر — يُعلَّم كأكبر
  فجوة ذات رافعة لم تُستغَل بعد.

### ٨.٦ `gami-defense` و`likt` — كلاهما "غير موثّق" مع سياق وطني حقيقي ومؤرَّخ

- **التوطين الدفاعي (GAMI):** يذكر الموقع الرسمي للهيئة العامة للصناعات العسكرية أن نسبة التوطين في
  قطاع الصناعات الدفاعية الوطنية بلغت **٢٤.٨٩٪** حتى نهاية عام ٢٠٢٤، مع هدف معلن يتجاوز **٥٠٪ بحلول
  عام ٢٠٣٠**. لم يُعثر على صيغة على مستوى المورّد، أو هيكل اشتراط مشروع مشترك، أو منهجية حساب مقاصة
  علنية — يُعرض هذا الرقم الوطني الحقيقي والمؤرَّخ في رسالة الأهلية بالواجهة بدلاً من درجة مورّد
  مختلقة.
- **LIKT (توطين الصناعة ونقل المعرفة):** جديد فعلاً على هذا البحث — مُسمّى في الصفحة الرسمية لآليات
  الهيئة، ومختلف عن برنامج GAMI الخاص بالدفاع، ويهدف إلى توطين صناعات مستهدفة عبر التعاون مع مستثمرين
  عالميين وقادة تقنيين. لم توجد صيغة على مستوى المورّد؛ نُمذج كإدخال "غير موثّق" مستقل بدلاً من دمجه
  مع GAMI، كونهما برنامجين مختلفين تديرهما جهتان مختلفتان.
- يبقى كلاهما خارج تدفق نموذج الإدخال "قابل للتطبيق" في الواجهة تماماً (يُفعَّل مسار "غير موثّق"
  القائم في المحرك قبل أي فحص للسياق)، فلا يُعرض على أي مورّد نموذج إدخال فارغ لآلية لا يمكن لهذه
  المنصة تقييمها بصدق.

### ٨.٧ ما لم يُنمذَج عمداً، تجنباً للاختلاق

- **"الحد الأدنى للمحتوى المحلي" لدى الهيئة** (مرحلة التقييم الفني، مبني على إتمام العقد) يبدو متداخلاً
  مع أداة الوحدة ٠٧ الشقيقة `getSectorBenchmark` (على غرار "درجة المحتوى المحلي المستهدفة" لمطار
  الشبيهة المستخدمة فعلاً لمعيار hardFM). وفق معمارية الاستقلالية أولاً، لا تستورد هذه الوحدة منطق
  الوحدة ٠٧، وتكرار معيار متداخل باسم مختلف هنا قد يعرّض وحدتين لخطر التعارض الصامت حول نفس الحد
  الحقيقي — لذا لم يُعَد نمذجته كبرنامج سعودي سابع عمداً.
- **إمكانية وجود مسار دخول عبر شهادة على مستوى المنشآت الصغيرة/المصانع**: عُثر على صفحة حقيقية في
  MIM.gov.sa ("مبادرة تشجيع المصانع الصغيرة والمتوسطة على إصدار شهادة المحتوى المحلي") لكن تعذّر جلب
  محتواها (`ROBOTS_DISALLOWED`/انتهاء مهلة في كلتا المحاولتين). يبقى ما إذا كانت آلية مستقلة أم مسار
  دخول إلى درجة LCGPA العامة مسألة غير محسومة فعلاً — تُسجَّل هنا كبند بحثي مفتوح، دون تخمين.

### ٨.٨ سجل اختبار الإجهاد — آليات السعودية (٢٣ اختباراً جديداً، جميعها ناجحة؛ إجمالي هذا الملف من ٣٩ إلى ٦٢)

| الآلية | ناعم (Soft) | الأصعب (Hardest) | الحدّي (Boundary) |
|---|---|---|---|
| `mandatory-list` | غير مدرجة في القائمة ← البوابة لا تنطبق | مدرجة + غير معتمد ← مستبعد | مدرجة + حالة الاعتماد غير معروفة ← `null`، دون تخمين نعم/لا |
| `price-preference` (السعودية) | حصة محلية جزئية ← خصم تناسبي عند ١٠٪ (وليس ٢٠٪ الأردن) | سياق تجاري خاص ← لا ينطبق، وليس صفراً | حصة محلية ٠٪ و١٠٠٪ |
| `iktva-aramco` | مورّد واقعي، دون مكافأة | مكافأة تحفيزية خارج النطاق (١٥٠) ← محدودة بسقف ٠-١٠ المُفصَح عنه | `totalCostsSAR = 0` ← درجة `null`، وليست ناتج قسمة على صفر |
| `gami-defense` / `likt` | — | — | سياق وطني حقيقي ومؤرَّخ حاضر بكلا اللغتين؛ لا درجة مختلقة أبداً |
| تجميع المحفظة | — | برنامجان سعوديان مختلفان بنفس السياق الحكومي يقعان في مجموعتين منفصلتين (لا يُدمَجان أبداً) | `gateEligibleSharePct` يُرجِّح بحصة الإنفاق بشكل صحيح بين موردين مؤهلين ومستبعدين مختلطين |

كل `reasonEn` جديد أعلاه يُشحَن مع `reasonAr` يُتحقق من محتواه مباشرة في مجموعة الاختبارات (وليس
مجرد وجوده) — استمراراً لانضباط إصلاح اكتمال الازدواج اللغوي الذي أُرسي لهذه الوحدة في ١٥ سبتمبر
٢٠٢٦.

### ٨.٩ الواجهة — سؤال التوجيه لبرنامج السعودية (البند #١١٥، فحص QA 10/10)

يظهر سؤال توجيه ("أي برنامج سعودي؟") مباشرة أسفل مُحدِّد الدولة فور اختيار السعودية، قبل اختيار
السياق — ستة أزرار، واحد لكل `SaudiProgram`، مع شارة "غير موثّق" على `gami-defense`/`likt` مطابقة
للنمط القائم فعلاً على مستوى الدولة المستخدم لعُمان وقطر والبحرين والكويت. **فجوة حقيقية رصدها فحص
QA وأُصلحت ضمن هذه المرحلة نفسها:** كان التبديل إلى برنامج ذي سياق واحد (إكتفاء أرامكو، "شبه حكومي"
فقط) أثناء بقاء الجهة على سياقها الافتراضي "حكومي" يُنتج بصمت قراءة "لا ينطبق" صحيحة لكن غير مُفسَّرة
كان على القارئ البحث عن سببها. أُصلح ذلك باختيار السياق الوحيد الصالح للبرنامج تلقائياً عندما يملك
البرنامج سياقاً واحداً فقط (تبقى البرامج متعددة السياقات — الدرجة العامة، القائمة الإلزامية، تفضيل
السعر — كما حدّدها القارئ تماماً، إذ لا يوجد افتراضي صحيح واحد لاختياره لتلك البرامج). فحص لوحة
المفاتيح/الاتجاه من اليمين لليسار: تستخدم جميع أزرار البرامج الستة وزرّا التوجيه الجديدين (نعم/لا
لفئة القائمة الإلزامية / الاعتماد) عناصر `<button>` حقيقية مع `aria-pressed`/`role="group"`/
`aria-label`، وفق النمط ذاته المُدقَّق مسبقاً لصفوف أزرار الدولة/السياق القائمة — دون إدخال أي سلوك
يعتمد على التحويم فقط.

---

## 9. تفكيك آليات دولة الإمارات العربية المتحدة (١٦ سبتمبر ٢٠٢٦)

استكمالاً للجزء الأول من `Module08-NextPass-Agent-Brief.md` بعد السعودية: الإمارات أيضاً ليست
برنامجاً واحداً بل برنامجان (`ae-icv-general` و`ae-tawazun-offset`) — درجة ICV الوطنية التابعة
لوزارة الصناعة والتقنية المتقدمة، والتزام المقاصة الدفاعية التابع لمجلس توازن الاقتصادي، تديرهما
جهتان مختلفتان لمشترٍ مختلف في كل حالة. عُمِّمت في هذه المرحلة أيضاً بنية البرامج في المحرك نفسها:
نمط `SaudiProgram`/`SAUDI_PROGRAMS` الخاص بالسعودية والمُقدَّم في القسم ٨ لا يتّسع لدولة ثانية متعددة
البرامج، فأصبح الآن اتحاداً مسطّحاً واحداً `LocalContentProgram` يغطي برامج الدول السبع جميعها
(`PROGRAMS`، `PROGRAMS_BY_COUNTRY`، `DEFAULT_PROGRAM_BY_COUNTRY`) — حافظ على السلوك تماماً لكل
مستدعٍ قائم (أُعيدت تسمية مفاتيح برامج السعودية بإضافة بادئة `sa-`؛ ولم يتغيّر الحل الافتراضي لأي
دولة أخرى). وبناءً على تعليمة صاحب المنصة الصريحة أثناء البناء، يطبّق هذا القسم — وكذلك إعادة فحص
هذه المرحلة لواجهة القسم ٨ الحية نفسها — القاعدة ذاتها: **كل آلية تحمل قراءة صريحة للقيمة من جانب
المشتري وجانب المورّد معاً، وليس رقم امتثال فقط**، لكل الدول، وليس فقط للعمل الجديد.

### ٩.١ تصنيف الأنواع الستة ← ربطها ببرامج الإمارات

| النوع | برنامج الإمارات | `mechanismType` | الحالة |
|---|---|---|---|
| ١. درجة اعتماد | `ae-icv-general` | `weighted-pillar-score` | موثّقة (بلا تغيير عن الآلية القائمة؛ أُعيدت تسميتها من `ae` إلى `ae-icv-general` ضمن تعميم البرامج) |
| ٦. التزام مقاصة/نقل تقني | `ae-tawazun-offset` | `offset-obligation-gate` (نوع آلية جديد) | موثّقة، صيغة حقيقية قابلة للحساب (إرشادات سياسة مجلس توازن الاقتصادي لعام ٢٠١٩) |
| ٢–٥ | *(غير مُنمذَجة)* | — | لم يُعثر على آلية إماراتية أخرى موثّقة (مشترٍ رئيسي، بوابة فئة، تفضيل سعري، أو حصة مخصصة) منفصلة عن الآليتين أعلاه — لم تُختلق |

### ٩.٢ `ae-icv-general` — ملاحظات استخدام ونتيجة سلبية حقيقية

- **ملاحظة استخدام أبوظبي (ADLC)**: تذكر دائرة التنمية الاقتصادية في أبوظبي (`idb.added.gov.ae`)
  أن عامل ICV يمثّل **٤٠٪** من التقييم المالي في مناقصات أبوظبي، وأن مقدّم العطاء دون شهادة ICV
  يحصل على صفر نقاط من هذه الـ٤٠٪ — نفس نمط الإفصاح "كيف تُستخدم الدرجة من جهة تقييم واحدة محددة"
  المُستخدم في ملاحظة استخدام السعودية بنسبة ٤٠٪/هيئة المحتوى المحلي في القسم ٨.٢، مُرفَق بالدرجة
  *القائمة* نفسها، وليس آلية منفصلة. مُفصَح صراحة أنه رقم على مستوى إمارة أبوظبي، وليس مؤكداً كرقم
  وطني موحّد لدى الوزارة (الصفحة الوطنية للوزارة لا تذكر نسبة بعينها).
- **نتيجة سلبية حقيقية**: تؤكد الصفحة الرسمية لبرنامج ICV التابعة للوزارة أن الاعتماد **تحفيزي** —
  تحصل الشركات المعتمدة على "مزايا عند ترسية المناقصات والعقود بناءً على درجة ICV الخاصة بها" —
  وليس بوابة عطاءات إلزامية كالقائمة الإلزامية السعودية. لم يجد هذا البحث دليلاً موثّقاً على فئة
  مناقصات إلزامية تقتصر على شهادة ICV، لذا لم تُنمذَج هنا. تُذكر بوضوح كنتيجة بحثية حقيقية، وليست
  إغفالاً — سجل القرار ٨.٧ ينطبق على غياب الدليل تماماً كما ينطبق على رقم.

### ٩.٣ `ae-tawazun-offset` — بوابة التزام مقاصة، صيغة حقيقية، قراءة ثنائية الجانب، وحسم غموض سعر الصرف

المصدر: إرشادات سياسة مجلس توازن الاقتصادي لعام ٢٠١٩ (تحقّق متقاطع عبر afridi-angell.com
وmondaq.com ودليل الحكومة الأمريكية الرسمي لقطاع الدفاع الإماراتي على trade.gov، دون أن يشير أي
منها إلى تحديث أحدث): تُستحق التزامات المقاصة على عقود القوات المسلحة الإماراتية/شرطة أبوظبي
الدفاعية التي تبلغ قيمتها **١٠ ملايين دولار أمريكي** أو أكثر. أشار الموجز نفسه إلى غموض في العملة
("١٠ ملايين دولار" مقابل "١٠ ملايين درهم") يُحسم في هذه المرحلة غير السعودية — وقد حُسم هنا: الدرهم
الإماراتي مربوط بسعر صرف ثابت بالدولار الأمريكي عند **٣.٦٧٢٥** بالضبط منذ عام ١٩٩٧، وحدّ **٣٦.٧٣
مليون درهم** المذكور في mondaq.com عند قسمته على سعر الربط يساوي ١٠,٠٠١,٣٦١ دولاراً — تطابق ضمن
هامش تقريب الاستشهاد نفسه (فرقم ٣٦.٧٣ مليون مُقرَّب أصلاً إلى منزلتين عشريتين؛ الرقم المطابق تماماً
لسعر الربط هو ٣٦.٧٢٥ مليون درهم، بفارق ~٠.٠١٤٪ فقط، وليس تعارضاً حقيقياً في المصادر، ويتحقق اختبار
إجهاد هذه الوحدة من هذا الهامش الفعلي بدلاً من افتراض تطابق حرفي). هدف ائتمان المقاصة المطلوب:
**٦٠٪** من قيمة العقد. تسوية النقص: **٨.٥٪** نقداً أو عبر ضمان بنكي، أو ترحيل الباقي إلى مشروع
مستقبلي — كلاهما خياران مُفصَح عنهما رسمياً في البرنامج، ولم يُنمذَجا كإخفاق امتثال أبداً.

- **قراءة المشتري** (القوات المسلحة الإماراتية/شرطة أبوظبي، عبر مجلس توازن الاقتصادي): "هل تتجاوز
  قيمة هذا العقد العتبة، وإذا قصّر المقاول، هل يظل البرنامج يحصّل قيمة حقيقية (نقداً/ضماناً) بدلاً
  من خسارتها بالكامل؟" — تحوّل البوابة الإنفاق الدفاعي إما إلى نشاط اقتصادي محلي حقيقي أو تسوية
  محدَّدة القيمة، وليس شطباً صامتاً أبداً.
- **قراءة المورّد:** "كم ائتمان مقاصة ما زلت بحاجة لاكتسابه قبل إغلاق فترة الأداء، وما تكلفة
  الانتظار؟" — `shortfallAED` و`shortfallPenaltyAED` هما الرقمان اللذان يحتاجهما المقاول لاتخاذ
  قرار بين الاستثمار في نشاط مقاصة حقيقي الآن أو دفع تسوية ٨.٥٪ لاحقاً؛ لا يختزل المحرك أبداً
  "الائتمانات غير معروفة" إلى "الائتمانات صفر" (تمييز صادق حقيقي — انظر سجل اختبار الإجهاد أدناه).
- مثال تطبيقي مصغّر: شركة تكامل أنظمة مقرّها الإمارات على عقد بقيمة ٥٠,٠٠٠,٠٠٠ درهم مع شرطة أبوظبي،
  وقد اكتسبت بالفعل ١٠,٠٠٠,٠٠٠ درهم من ائتمانات المقاصة ← `triggersObligation: true`،
  `requiredOffsetCreditsAED: 30,000,000` (٦٠٪ من ٥٠ مليوناً)، `shortfallAED: 20,000,000`،
  `shortfallPenaltyAED: 1,700,000` (٨.٥٪ من النقص) ← التوصية الأساسية: اكتساب ائتمانات مقاصة حقيقية
  (استثمار محلي، مشروع مشترك، أو نشاط نقل تقني يعترف به توازن) قبل إغلاق الفترة؛ البديل: التسوية
  نقداً بنسبة ٨.٥٪ أو التفاوض على ترحيل الباقي إلى مشروع مستقبلي — كلاهما من بدائل البرنامج المُفصَح
  عنها رسمياً، وليس إخفاقاً في الامتثال.

### ٩.٤ ما لم يُنمذَج عمداً، تجنباً للاختلاق

- **إلزام إماراتي بين القطاع الخاص فقط**: لا يوجد دليل موثّق على انطباق `ae-icv-general` أو
  `ae-tawazun-offset` على مشتريات القطاع الخاص فقط — يبقى كلاهما محصوراً في الحكومي/شبه الحكومي
  (ICV) والحكومي فقط (توازن)، بما يطابق انضباط القسم ٨ ذاته لآليات السعودية.
- **نسبة ترجيح تقييم مالي على مستوى الإمارات كافة (وليس أبوظبي فقط)** لـICV: لا تذكر صفحة الوزارة
  الوطنية نسبة بعينها؛ نسبة الـ٤٠٪ الموثّقة مُفصَح عنها كرقم على مستوى إمارة أبوظبي فقط، ولم تُعمَّم
  على الدولة بأكملها (انظر ٩.٢).

### ٩.٥ سجل اختبار الإجهاد — آلية توازن الإماراتية (١٢ اختباراً جديداً، جميعها ناجحة؛ إجمالي هذا الملف من ٦٢ إلى ٧٤)

| الآلية | ناعم (Soft) | الأصعب (Hardest) | الحدّي (Boundary) |
|---|---|---|---|
| `ae-tawazun-offset` | عقد فوق العتبة مع ائتمانات مكتسبة جزئياً؛ قيمة عقد معروفة لكن الائتمانات المكتسبة غير معروفة (يبقى `shortfallAED` عند `null`، وليس صفراً زائفاً) | عقد أقل بكثير من العتبة ← لا التزام، ائتمانات مطلوبة صفر، دون غرامة زائفة؛ ائتمانات مكتسبة تفوق المطلوب ← النقص يستقر عند صفر، لا يصبح سالباً أبداً | قيمة العقد عند ٣٦.٧٣ مليون درهم بالضبط تُفعِّل الالتزام (`>=` وليس `>`)؛ فحص تطابق سعر الربط درهم/دولار نفسه، ضمن هامش تقريب الاستشهاد المصدري |
| الانطباق | — | كلاهما "شبه حكومي" و"تجاري خاص" يُصنَّفان بشكل صحيح "لا ينطبق" — توازن حكومي فقط، أضيق من نطاق ICV (حكومي + شبه حكومي) | — |
| التوصية | بديل أساسي حقيقي (اكتساب ائتمانات حقيقية) + بديل قوي (تسوية ٨.٥٪ / ترحيل)، وليس مساراً واحداً أبداً | تُرجِع `null` بمجرد انتفاء النقص — لا شيء يُوصى به مقابل فجوة مغلقة | — |
| تجميع المحفظة | `totalShortfallPenaltyAED` مجموع بسيط للتعرض المالي الحقيقي عبر المجموعة، وليس مرجَّحاً بحصة الإنفاق كالنسب المئوية (شكل تجميع مختلف عن كل نوع آلية آخر في هذه الوحدة، مُفصَح عنه كذلك في تعليق حقل المحرك نفسه) | — | — |

أُضيف أيضاً: اختبار سلامة معماري يتحقق من أن كل `DEFAULT_PROGRAM_BY_COUNTRY[country]` يُحلّ إلى مُدخل
حقيقي في `PROGRAMS` يخص دولته نفسها، وأن `PROGRAMS_BY_COUNTRY` يُدرج بدقة الدول المعروف أنها تدير
أكثر من برنامج واحد (السعودية: ٦، الإمارات: ٢، البقية: ١ لكل منها) — اختبار مباشر للتعميم نفسه، وليس
فقط للمحتوى الإماراتي الجديد. كل `reasonEn` جديد أعلاه يُشحَن مع `reasonAr` يُتحقق من محتواه مباشرة
في مجموعة الاختبارات (وليس مجرد وجوده)، استمراراً لانضباط اكتمال الازدواج اللغوي المُرسى في ١٥
سبتمبر ٢٠٢٦.

### ٩.٦ الواجهة — سؤال توجيه برنامج الإمارات، وتعزيز قراءة القيمة الثنائية لكل الدول بما فيها السعودية

عُمِّم نمط سؤال توجيه البرنامج السعودي من القسم ٨.٩ (البند #١١٥) بدلاً من تكراره: أي دولة تحتوي
قائمة `PROGRAMS_BY_COUNTRY` الخاصة بها أكثر من برنامج واحد — اليوم السعودية (٦) والإمارات (٢) —
تُظهر صف أزرار سؤال التوجيه نفسه، مع إصلاح الاختيار التلقائي للسياق نفسه للبرامج أحادية السياق
(توازن، مثل إكتفاء أرامكو من قبله، أحادي السياق ويختار "حكومي" تلقائياً عند اختياره). **فجوة حقيقية
تجنّبها هذا التعميم:** كان تبديل دولة المورّد دون إعادة ضبط البرنامج المُختار سيترك المنهجية
والتقييم المعروضَين يقرآن إطار عمل دولة مختلفة عن الدولة المُختارة للتو (مثل استمرار عرض منهجية
إكتفاء أرامكو السعودية فور التبديل إلى الإمارات) — أُصلح ذلك بإعادة ضبط `program` إلى الافتراضي
الخاص بالدولة الجديدة عند كل ضغطة على مُحدِّد الدولة. فجوة حقيقية ثانية تم تجنبها: كان يمكن لجهة
محفوظة مسبقاً لمستخدم عائد (في التخزين المحلي أو مزامَنة مع الخادم) أن تحمل مفتاح برنامج سعودي سابق
للتعميم (`lcgpa-general` بدلاً من `sa-lcgpa-general`) — أُصلح ذلك بخريطة ترحيل صريحة ومُفصَح عنها
١:١ تُطبَّق عند التحميل، دون كسر صامت عند أول استخدام بعد هذا النشر.

وبناءً على تعليمة صاحب المنصة الصريحة أثناء البناء ("كل آلية ... تحمل قراءة صريحة للقيمة من جانب
المشتري وجانب المورّد معاً، وليس رقم امتثال فقط" — "هذا يشمل الجميع بما في ذلك السعودية")، أضافت
هذه المرحلة أيضاً **لوحة قراءة قيمة ثنائية الجانب**، مُصنَّفة حسب نوع الآلية (وليس حسب البرنامج
الفردي، فتصبح تلقائية لكل أشكال الآليات السبعة الموثّقة وأي آلية مستقبلية، دون إضافة يدوية لكل
دولة)، تُعرَض مباشرة أسفل قائمة "المنهجية الموثّقة" لكل دولة تنطبق عليها — بما في ذلك واجهة السعودية
الحية نفسها، وليس فقط شاشات الإمارات الجديدة أو أقسام "قراءة المشتري"/"قراءة المورّد" في هذا
المستند. تذكر اللوحة، بكلا اللغتين، ما يحصل عليه المشتري وما يحصل عليه المورّد من الآلية نفسها،
مبنية بالكامل من حقائق موثّقة ومُفصَح عنها بالفعل في مكان آخر من المحرك (وليس ادعاءً أو رقماً
جديداً) — تعيد في المنتج الحي نفس القراءة التي يحملها هذا المستند نثراً منذ القسم ٨.٣.
