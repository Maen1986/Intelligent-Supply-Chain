# SI Module 08 — Local Content / ICV Eligibility
### Worked Example, Sourced Methodology, and Stress-Test Record — Rawabi Advanced Industries

*Registry: SI-08 (draft, pending #436/#441 formal registry entry). Date: 15 Sep 2026, updated 16 Sep 2026 (Saudi Arabia mechanism decomposition, Part 1 slice, section 8; UAE mechanism decomposition + program-architecture generalization, same day, section 9), updated again 17 Sep 2026 (Jordan's second mechanism, Oman, Qatar, Bahrain, Kuwait -- closing out the rest of Part 1, section 10), updated again 15 Sep 2026 (Egypt mechanism decomposition -- opening Part 2, non-GCC coverage, section 11), updated again 16 Sep 2026 (Turkey mechanism decomposition -- Part 2 continuation, section 12).*
*Engine file: `src/lib/supplierLocalContentEligibility.ts` (1,777 lines, 25 programs across all 9 countries via a generalized `LocalContentProgram` architecture — see section 9's own note on why the Saudi-only `SaudiProgram` pattern was generalized, section 10.1 for the 7 programs added 17 Sep 2026, section 11.1 for the 3 Egyptian programs added 15 Sep 2026, and section 12.1 for the 2 Turkish programs added 16 Sep 2026). Test file: `src/lib/supplierLocalContentEligibility.test.ts` (129 tests: 39 original + 23 Saudi-mechanism + 15 UAE-mechanism/architecture + 32 Jordan/Oman/Qatar/Bahrain/Kuwait-mechanism + 11 Egypt-mechanism + 9 Turkey-mechanism tests, soft/hardest/boundary tiers; the OM/QA/BH/KW not-yet-sourced block and the 9-country structural-sanity check each register more runtime tests than their single `it(` call-site, so this N is Vitest's executed count, not a literal-text `it(` search).*
*Status: library-complete, unit-tested, cross-engine chain-tested, live UI rebuilt as a multi-supplier list per an independent senior-QA review (`/local-content-icv`, QA-10/10-walked-through, 16 Sep 2026), extended with Saudi Arabia's full mechanism decomposition (section 8), the UAE's (section 9: MoIAT ICV usage note + genuine incentive-not-gate negative finding, and the Tawazun defense-offset mechanism with a real sourced formula), Jordan's second mechanism plus real sourced programs for Oman, Qatar, Bahrain, and Kuwait (section 10, 17 Sep 2026, completing Part 1 / GCC-Jordan coverage), Egypt's two sourced price-preference mechanisms plus one honest not-yet-sourced entry (section 11, 15 Sep 2026, opening Part 2 / non-GCC coverage), and now Turkey's one sourced price-preference mechanism plus one honest not-yet-sourced entry (section 12, 16 Sep 2026, continuing Part 2). A dual-sided buyer/supplier value-framing panel is live in the UI for every country and every sourced mechanism type. See "What Is Not Yet Done" below for what remains, including the backend table this pass added but has not provisioned, and the rest of Part 2 (UK, USA, China, per the platform owner's own stated order), which is not started yet.*

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

## 4. Stress-Test Record (39 tests as of 15 Sep 2026, all passing; three tiers per mechanism — see section 8.8 for the 23 additional Saudi-mechanism tests (62 total), section 9.5 for the 15 additional UAE-mechanism/architecture tests added 16 Sep 2026 (77 total), section 10.8 for the 32 additional Jordan/Oman/Qatar/Bahrain/Kuwait-mechanism tests added 17 Sep 2026 (109 total), section 11.5 for the 11 additional Egypt-mechanism tests added 15 Sep 2026 (120 total), and section 12.5 for the 9 additional Turkey-mechanism tests added 16 Sep 2026 (129 total))

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
the UAE, China, Turkey, and Egypt. At the time this worked example was first written (15 Sep 2026),
only the Saudi and UAE suppliers fell inside Module 08's sourced scope; the Egypt (section 11, 15 Sep
2026) and Turkey (section 12, 16 Sep 2026) Part 2 passes have since given both of those countries a
real, sourced mechanism too, so as of this update **only the Rawabi Fasteners Ltd. (China) supplier
remains genuinely out of scope** -- China has no sourced GCC/Jordan-style local-content mechanism, so
Module 08 does not attempt to score it at all (a fourth honest state, distinct from
`not-yet-sourced`, since China was never claimed to have a GCC-style regime in the first place). This
paragraph is corrected here rather than left describing a now-superseded scope -- the same
"a known-wrong disclosure must not be left uncorrected" discipline (Decision Record 8.7 / registry
rule 12) already applied elsewhere in this document; sections 11.2 and 12.2 carry Egypt's and
Turkey's own worked mini-examples (using illustrative suppliers, not a full recomputation of the
Rawabi Packaging Co. / Rawabi Coatings Supplier entries below, which is out of this pass's scope).

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
- **Oman/Qatar/Bahrain/Kuwait's GENERAL national local-content frameworks** (`om-icv`,
  `qa-national-strategy`, `bh-local-content`, `kw-local-content`) remain `not-yet-sourced` by
  design -- a future research pass could source these, but they are not guessed here. **Updated
  17 Sep 2026:** this no longer means these four countries have no real sourced program at all --
  section 10 sourced 5 genuinely different, narrower mechanisms alongside these four honest gaps
  (Oman's PTLC Mandatory List and OQ Group price preference; Qatar's Tawteen/ICV; Bahrain's SME
  price preference and spend set-aside; Kuwait's KPC spend target), each real and computable, each
  disclosed as narrower than the still-unsourced general program it sits beside.
- **Jordan's post-2022 contractor-quota escalator** (section 10.2/10.7) is not confirmed beyond the
  2018 Cabinet decision's own base 35% figure -- a future research pass could confirm whether the
  annual 5-point increase continued, plateaued, or was superseded, but the current-year figure is
  not guessed here.

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

### 9.5 Stress-test record — UAE Tawazun mechanism (12 new tests, all passing; full suite 62 → 77 for this file)

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

## 10. Jordan's Second Mechanism, Oman, Qatar, Bahrain, and Kuwait Mechanism Decomposition (17 Sep 2026)

Continuing Part 1 after Saudi Arabia (section 8) and the UAE (section 9): this pass closed every
remaining open research gap for the module's other five countries -- Jordan's second mechanism
beyond its existing 20% price preference, and real sourced mechanisms for Oman, Qatar, Bahrain, and
Kuwait, all four of which previously carried only a single `not-yet-sourced` placeholder program.
Two genuinely new mechanism types were added to the taxonomy this pass: `spend-set-aside-target`
(a sourced national/program target share plus the supplier's own binary qualification -- Jordan's
contractor quota, Bahrain's SME allocation, Kuwait's KPC spend target) and `modified-icv-score`
(an eligible-spend-ratio base score plus real, disclosed modifiers -- Qatar's Tawteen/ICV). Every
country's original `not-yet-sourced` or previously-sourced program remains untouched and un-defaulted
-- new programs are added alongside, never replacing, and `DEFAULT_PROGRAM_BY_COUNTRY` values are
unchanged, mirroring exactly how `sa-iktva-aramco` was added in section 8 without ever becoming
Saudi Arabia's default.

### 10.1 Six-type taxonomy → program mapping

| Country | Program | `mechanismType` | Status |
|---|---|---|---|
| Jordan | `jo-contractor-quota` (type 5) | `spend-set-aside-target` (new) | Sourced: 35% minimum Jordanian-contractor quota in international tenders, Cabinet decision reported by Jordan Times (7 May 2018 base figure; post-2022 continuation not confirmed -- see 10.7) |
| Oman | `om-mandatory-list` (type 3) | `category-eligibility-gate` (reuses the generalized primitive from section 8.3) | Sourced: PTLC's Mandatory List, structurally identical to Saudi's Mandatory List gate |
| Oman | `om-oq-price-preference` (type 4) | `price-preference-margin` | Sourced: OQ Group's own 10% preference for Omani-manufactured goods (company-specific, like Aramco IKTVA / QatarEnergy Tawteen) |
| Qatar | `qa-icv-tawteen` (type 1) | `modified-icv-score` (new) | Sourced: icv.qa's official 5-pillar ICV methodology with real ICV+/blanket-floor/bonus modifiers |
| Bahrain | `bh-sme-price-preference` (type 4) | `price-preference-margin` | Sourced: 10% SME bidding advantage, Ministerial Decision No. 23 of 2026 |
| Bahrain | `bh-sme-spend-setaside` (type 5) | `spend-set-aside-target` (new) | Sourced: 20% of government tender value reserved for SMEs, same Ministerial Decision |
| Kuwait | `kw-kpc-local-spend` (type 5) | `spend-set-aside-target` (new) | Sourced: KPC's own 30%-by-2040 Kuwaiti-supplier spend target, per trade.gov's Kuwait market guide |

### 10.2 Jordan `jo-contractor-quota` -- spend-set-aside-target, dual-sided reading

Source: Jordan's Council of Ministers approved (7 May 2018, per Jordan Times) a minimum 35% quota
for Jordanian contractors in international tenders for projects implemented in Jordan, spanning
ministries, public institutions, government-owned and government-shareholding companies, and
private-sector entities floating tenders to foreign contractors. The decision also required
Jordanian consultants for design/supervision work and set a separate 20-40% quota for six named
energy/environment projects, framed within the 2018-2022 Economic Growth Plan with a stated 5-point
annual escalator "during the time frame" of that plan.

- **Buyer's reading** (the tendering ministry, public institution, or government-shareholding
  company): a guaranteed floor of Jordanian-contractor participation in a tender pool that would
  otherwise default entirely to foreign bidders -- the target itself does the enforcement, no
  per-award negotiation required.
- **Supplier's reading:** a Jordanian contractor's own registration status is the entire lever --
  once qualified, it competes within a smaller, reserved 35% pool rather than the full open market
  against every foreign bidder.
- Worked mini-example: a Jordanian construction subcontractor bidding into an international tender
  for a government-funded infrastructure project, confirmed as a registered Jordanian contractor,
  in the `government` procurement context → `targetSharePct: 35`, `qualifiesForSetAside: true`,
  `eligibleForReservedShare: true` -- `recommendLocalContentAction` returns `null` (nothing to
  recommend; the supplier already clears the qualification bar). The same supplier, unregistered →
  `qualifiesForSetAside: false`, and the recommendation fires: pursue registration before the next
  bid cycle as the only way to compete within the reserved 35% pool itself, with the open
  (non-reserved) portion of spend as the honest fallback if registration cannot complete in time.

### 10.3 Oman `om-mandatory-list` -- category-eligibility-gate (the generalized primitive at work)

Source: Oman's tender authority, renamed under Royal Decree No. 57/2025 to the Projects, Tenders,
and Local Content Authority (PTLC, replacing the former Tender Board), maintains a Mandatory List
that reserves defined categories of goods and services for Omani SMEs and local suppliers (per
tendersarabia.com's 2026 Oman tender guide) -- structurally the exact same pass/fail bidding gate as
Saudi Arabia's LCGPA Mandatory List (section 8.3), which is why this program reuses the same
`computeCategoryEligibilityGate` primitive rather than a second, duplicated implementation. This
research pass did not find a published enumeration of which specific categories sit on Oman's
Mandatory List (unlike Saudi's sourced 233+-item count) -- the gate logic itself is real and
sourced, but the specific category coverage is not, and is disclosed as such rather than guessed.

- **Buyer's reading:** certainty of local sourcing by design for strategic Omani categories, with no
  reliance on a price preference being large enough to swing the award.
- **Supplier's reading:** certification for a gated category is a genuine moat -- uncertified
  competitors, Omani or foreign, cannot bid at all, not just at a price disadvantage.
- Same soft/hardest/boundary shape as Saudi's Mandatory List (section 8.8): in-list and certified →
  eligible; in-list and not certified → gated out (`false`, never a partial percentage); not in a
  Mandatory List category at all → the gate simply does not apply, eligible regardless of
  certification status.

### 10.4 Oman `om-oq-price-preference` -- price-preference-margin (a fourth company-specific program)

Source: OQ Group (Oman's state-owned integrated energy company, formerly Orpic/OOC) offers a 10%
price preference for Omani-manufactured goods in qualifying contract categories, per a 2026 Oman
tenders market guide. This is a company-specific buyer preference, scoped to `semi-government-soe`
procurement only (not government), joining Aramco IKTVA and QatarEnergy's Tawteen program as the
third real "anchor-buyer-specific" mechanism this module models, and reusing the same
`computePricePreferenceMargin` primitive already shared by Jordan, Saudi Arabia, and Bahrain (four
countries, one computation, four disclosed source-notes).

### 10.5 Qatar `qa-icv-tawteen` -- modified-icv-score, full formula walk-through, dual-sided reading

Source: Qatar's official In-Country Value Digital Portal (icv.qa, the national ICV certification
authority) publishes a real, computable methodology. Base score = eligible local spend (local
tangible goods/materials + local services [manpower, subcontractors, goods] + Qatari
national/resident training cost + supplier training/certification cost + depreciation of
Qatar-based company assets) divided by total Qatar revenue **excluding exports**. Three real,
sourced modifiers apply on top, per icv.qa's own FAQ and Enhanced Program pages: (1) "ICV+" gives
eligible manufacturers a 50% score increase (`QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER = 1.5`);
(2) a "blanket score" guarantees micro/small suppliers a minimum 30% ICV score
(`QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL = 30`) regardless of the base ratio; (3) suppliers can
claim up to 15 additional points through disclosed strategic behaviors (productivity, capability
building, investment growth, Qatarization, exports, R&D, sustainability) -- modeled as a capped,
self-reported input (`QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT = 15`), since icv.qa does not publish
the internal weighting of that bonus. icv.qa states ICV "will play a role in the evaluation of
commercial bids; premiums will be paid for higher ICV bids assuming the price is competitive" -- a
real, sourced commercial-advantage mechanism, though not a guaranteed win or an exact percentage
weighting, so it is disclosed here as context rather than modeled as a computed discount (the same
discipline already applied to Aramco IKTVA's own incentive-bonus simplification in section 8.5).

- **Buyer's reading** (any Qatari government or semi-government entity evaluating bids via icv.qa):
  a single official score usable directly in bid evaluation, with real disclosed modifiers that
  reward exactly the behaviors Qatar's strategy wants (local manufacturing, small-supplier
  inclusion, workforce development) without inventing a new scoring methodology of its own.
- **Supplier's reading:** multiple real, separately-improvable levers raise this score beyond raw
  spend alone -- eligible-manufacturer status alone is worth a 50% multiplier, and a genuinely
  small/micro supplier is guaranteed 30% regardless of its spend breakdown, both facts worth
  checking before assuming a scoring gap requires new spend.
- Worked mini-example: a Qatar-based industrial supplier with QAR 200,000 in local tangible
  goods/materials, QAR 100,000 in local services, QAR 50,000 in Qatari-national training cost, QAR
  50,000 in supplier training/certification cost, and QAR 100,000 in Qatar-based asset depreciation,
  against QAR 1,000,000 in total Qatar revenue excluding exports, confirmed as an eligible
  manufacturer with a disclosed 10-point strategic-behavior bonus → base ratio 50% (QAR 500,000 /
  QAR 1,000,000), ICV+ boost to 75% (x1.5), plus the 10-point bonus → **final score 85%**. The same
  supplier without the manufacturer boost → final score 60% (50% base + 10 bonus, no multiplier) --
  a concrete, honest illustration of what the ICV+ modifier is actually worth.

### 10.6 Bahrain `bh-sme-price-preference` and `bh-sme-spend-setaside` -- one qualifying fact, two mechanism reads

Source: Ministerial Decision No. 23 of 2026 (Bahrain's Minister of Industry and Commerce, Official
Gazette, effective 12 Jun 2026, repealing the 2017 SME-classification criteria) raised the SME
ceiling to up to 250 employees or up to BHD 20 million annual revenue (from the prior 100 employees
/ BHD 3 million), and grants qualifying SMEs both "a 10% advantage in bidding for government
tenders" and a "20% allocation of the value of government procurements and tenders to SMEs" (per
mondaq.com's legal summary) -- confirming the brief's own original taxonomy note that Bahrain
"reserves a share of tenders for SMEs plus a stacked price preference." Both mechanisms are driven
by the exact same underlying qualifying fact (`bhSme.qualifiesAsSme`), modeled once in the input
schema and read twice -- once through `computePricePreferenceMargin` (the SME's qualification acts
as a binary 100%/0% "locally-manufactured share" input to the shared price-preference primitive,
since the qualifying fact here is binary, not a spend percentage) and once through
`computeSpendSetAside`, the same primitive already shared by Jordan and Kuwait. A supplier is never
asked the same SME-qualification question twice across Bahrain's two programs.

### 10.7 Explicitly not modeled, to avoid fabrication

- **Jordan's post-2022 escalator**: the sourced 2018 Cabinet decision stated the 35% quota would
  rise 5 points annually "during the time frame" of the 2018-2022 Economic Growth Plan. No
  primary-source reconfirmation of the quota's value beyond that plan's own window was found -- this
  engine computes against the disclosed 2018 base of 35% only, never an extrapolated current-year
  figure.
- **Oman's general national ICV program** (`om-icv`, unchanged, still `not-yet-sourced`): Oman runs
  its own ICV program distinct from the UAE's, but no exact pillar formula or weighting for the
  GENERAL program was confirmed to the rigor applied to SA/AE/JO -- deliberately not guessed, left
  exactly as it was before this pass, alongside (not replaced by) the two narrower Oman mechanisms
  now sourced.
- **Qatar's National Local Content Strategy** (`qa-national-strategy`, unchanged, still
  `not-yet-sourced`): Qatar's Cabinet approved this strategy recently, too new for a public formula
  to exist yet -- left untouched alongside the genuinely different, longer-established, and
  fully-sourced Tawteen/ICV mechanism.
- **A general Bahrain or Kuwait national local-content framework** (`bh-local-content`,
  `kw-local-content`, both unchanged, still `not-yet-sourced`): no formalized, publicly-documented
  GENERAL scoring framework was found for either country to the rigor applied to SA/AE/JO -- both
  narrower, genuinely different, real mechanisms sourced this pass are modeled alongside, not as a
  replacement for the honest gap.
- **Oman's Mandatory List category enumeration** and **Kuwait's granular "Kuwaiti supplier"
  certification criteria** (beyond simple registration status): neither was found in this research
  pass -- both are disclosed as open gaps in the relevant program's own `sourceNoteEn`/`sourceNoteAr`,
  not silently assumed.

### 10.8 Stress-test record -- 5-country continuation (32 new tests, all passing; full suite 77 → 109 for this file)

| Mechanism | Soft | Hardest | Boundary |
|---|---|---|---|
| `jo-contractor-quota` | registered contractor -> qualifies, recommendation returns `null` | unregistered -> excluded, recommendation cites the real 35% target | no registration status supplied -> honest `null`, never a fabricated pass/fail |
| `om-mandatory-list` | in-list + certified -> eligible | in-list + not certified -> gated out (`false`) | not in a Mandatory List category at all -> gate does not apply regardless of certification |
| `om-oq-price-preference` | 25% Omani-manufactured -> proportional 2.5-point discount | 0% and 100% (adversarial extremes) -> 0 and 10-point discount | exactly 100% -> recommendation returns `null` |
| `qa-icv-tawteen` | realistic 5-pillar spend with manufacturer boost + disclosed bonus | manufacturer boost + an over-cap bonus stack together and the result is honestly capped at 100, never fabricated above it | zero Qatar revenue supplied: `null` score when not micro/small, but the blanket 30% floor still resolves when micro/small (a policy guarantee independent of spend data) |
| `bh-sme-price-preference` | qualifies as SME -> full 10-point margin via a 100% binary share | does not qualify -> zero discount, not a partial one | no qualification status supplied -> honest `null` share, never assumed disqualified |
| `bh-sme-spend-setaside` | qualifies as SME -> qualifies for the 20% allocation | does not qualify -> excluded, recommendation fires | the same `bhSme.qualifiesAsSme` fact drives both Bahrain programs correctly, without being asked twice |
| `kw-kpc-local-spend` | registered Kuwaiti supplier -> qualifies for the 30% target pool | not registered -> excluded | no registration status supplied -> honest `null` |
| Applicability | -- | every new program's out-of-scope procurement context correctly resolves `not-applicable` (e.g. Jordan's quota is public/SOE-only, OQ's preference is SOE-only, Bahrain's SME programs are government-tender-only, KPC's target is SOE-only) | -- |
| Portfolio rollup | `setAsideQualifyingSharePct` is spend-share-weighted across qualifying/non-qualifying suppliers, and never blended with `weightedScorePct` | `modified-icv-score` groups roll up `finalScorePct` spend-share-weighted, the same convention as every other score-based mechanism | -- |
| Structural | a new regression test asserts every one of the 7 countries now has 2 or more programs, and that every program in `PROGRAMS_BY_COUNTRY` resolves back to its own country in `PROGRAMS` -- catching a program listed under the wrong country before it reaches the UI | -- | -- |

The one pre-existing test this pass had to update, not just add to: `PROGRAMS_BY_COUNTRY` lists
exactly the countries known to run more than one program (section 9.5's own architecture sanity
test) previously asserted `JO: 1, OM: 1, QA: 1, BH: 1, KW: 1` -- now correctly `JO: 2, OM: 3, QA: 2,
BH: 3, KW: 2`, updated rather than left stale, since a passing-but-wrong assertion is itself a
Decision Record 8.7 violation once the underlying fact it asserts has changed.

### 10.9 UI -- routing questions generalized to every country, portfolio rollup extended

The program-routing button row (sections 8.9 and 9.6) already generalized to "any country whose
`PROGRAMS_BY_COUNTRY` list has more than one program" rather than a hardcoded SA/AE check -- so this
pass required **zero new routing logic**, only new program entries and new input-rendering branches
per program. Every one of the 7 new programs got its own input form (binary yes/no toggles for the
four set-aside-qualification programs and the two category-eligibility-gate inputs, a percentage
field for the two price-preference programs, and Qatar's full 5-field spend breakdown plus two
checkboxes for `qa-icv-tawteen`), its own result-rendering block (a new spend-set-aside-target
result card showing the target share and this supplier's qualification, and a new modified-icv-score
result card showing the final score, the 5-pillar breakdown, and a plain-language note on which
modifiers applied), and its own entry in the dual-sided `MECHANISM_VALUE_FRAMING` panel (section
9.6) for the 2 new mechanism types -- automatic for both new programs that use
`spend-set-aside-target` and the one that uses `modified-icv-score`, not hand-added three times.
The client-level portfolio table's "Weighted Result" column gained a `setAsideQualifyingSharePct`
branch so a spend-set-aside-target group renders its own qualifying-share reading rather than
falling through to an uninformative dash. The page's hero copy and footer disclaimer were also
updated to name all seven countries' authorities (PTLC, icv.qa, and Bahrain's/Kuwait's competent
authorities alongside LCGPA, MoIAT, and Jordan's ministry) rather than only the original three --
the same honesty discipline this document itself follows, applied to the page a real user reads
first.

## 11. Egypt Mechanism Decomposition — Part 2 Opening (15 Sep 2026)

Part 1 (GCC + Jordan, sections 8-10) closed out with all 7 original countries now carrying at
least one real sourced mechanism. Part 2 ("non-GCC coverage") was explicitly flagged as not started
in section 7 above. Per the platform owner's own direction ("go with egypt, then turkey, then UK,
then USA, then China"), this pass opened Part 2 with Egypt -- the first country added to
`LocalContentCountry` since the engine's original 7, and one of Rawabi's own named non-GCC supplier
countries (section 1's own scenario intro already lists Egypt as a real Rawabi sourcing country,
alongside China and Turkey).

**Coverage-scope decision, stated here rather than only in conversation:** this engine does not
attempt to pre-build a mechanism for every country in the world. Most countries run no GCC/
Jordan-style local-content or ICV regime at all, so forcing one would mean either fabricating a
formula (Decision Record 8.7) or filling the union with dozens of empty `not-yet-sourced` entries
that add no real decision-relevant value. Coverage grows on demand, prioritized by where ISC clients
have real supplier exposure -- the same demand-driven logic already used to decide which GCC country
got a second or third mechanism first (section 10's own five-country continuation). A country not
yet in `LocalContentCountry` resolves through the UI's pre-existing `'OTHER'` pseudo-value (section
9's own build) to an honest "not covered by this module" state, a third distinct reason for "no
number" alongside `not-yet-sourced` and `not-applicable` -- never a silent gap.

Two genuinely different, real, sourced Egyptian mechanisms were found this pass, plus one honest
`not-yet-sourced` entry. Both sourced mechanisms reuse the existing `price-preference-margin`
mechanism type and `computePricePreferenceMargin` primitive -- no new mechanism type or shared
computation was needed, unlike sections 8-10's `spend-set-aside-target` and `modified-icv-score`
additions.

### 11.1 Six-type taxonomy → Egyptian program mapping

| Program | `mechanismType` | Status |
|---|---|---|
| `eg-price-preference` (default program) | `price-preference-margin` | Sourced: Law No. 5 of 2015 (as amended by Law No. 90 of 2018) -- a 40%-local-content qualifying threshold, then a flat 15% price preference in government/public-company procurement evaluation |
| `eg-oil-gas-price-preference` | `price-preference-margin` | Sourced: Production Sharing Agreement (PSA) local-contractor priority -- a 10% price-band preference for qualifying local contractors, run by petroleum-sector operating companies under Ministry of Petroleum oversight |
| `eg-auto-local-content` | `not-yet-sourced` | Real, dated national target disclosed (60% local content, revamped AIDP), no published per-supplier formula found |

### 11.2 `eg-price-preference` -- price-preference-margin, threshold-gated (a genuinely different shape)

Source: Egypt's Law No. 5 of 2015 ("Preference of Egyptian Products in Governmental Contracts", as
amended by Law No. 90 of 2018) requires a bid's supplied goods/services to contain at least 40%
Egyptian-origin local content, by estimated project value, to qualify as an "Egyptian product";
qualifying Egyptian bidders then receive a flat 15% price preference against foreign bids in
evaluation (per the US government's own trade.gov "Egypt -- Selling to the Public Sector" guide).
This is a **threshold gate, not a continuous scale** -- a genuine departure from how the same
`price-preference-margin` mechanism type behaves for Jordan/Oman/Saudi (where the margin scales
proportionally with the locally-manufactured share all the way from 0% to 100%). This engine models
the distinction honestly rather than smoothing Egypt into the continuous-scaling assumption: the
qualifying threshold converts a supplier's declared Egyptian-content percentage into a binary
100%/0% share before the shared primitive ever runs, the same binary-to-share conversion already
used for Bahrain's SME price preference (section 10.6) -- three different real-world qualifying
rules (a spend percentage in Jordan/Oman, SME classification in Bahrain, a local-content threshold
in Egypt), one shared computation, disclosed per-program rather than assumed identical.

- **Buyer's reading** (the tendering government entity or public company/enterprise): a clear,
  binary qualifying bar -- either a bid genuinely meets the 40% Egyptian-content standard and earns
  the full 15-point advantage, or it does not and competes on price/technical merit alone. No
  partial-credit ambiguity for evaluators to adjudicate case by case.
- **Supplier's reading:** the entire lever is crossing the 40% line, not incremental improvement
  below it -- a supplier at 38% Egyptian content gets exactly the same zero preference as one at 5%,
  so the decision-relevant question is whether closing the specific gap to 40% is worth it for this
  tender, not whether to nudge the number up slightly.
- Worked mini-example: an Egyptian building-materials supplier bidding into a government
  infrastructure tender declares 55% Egyptian-origin local content (steel rebar and cement sourced
  domestically) → `egyptianContentSharePct: 55` → qualifies (>=40) → `locallyManufacturedSharePct:
  100`, `effectiveBidDiscountPct: 15` (the full margin) → `recommendLocalContentAction` returns
  `null` (already at the maximum available advantage, nothing left to recommend). The same supplier
  at 25% Egyptian content (importing more of the specification) → does not qualify →
  `locallyManufacturedSharePct: 0`, `effectiveBidDiscountPct: 0` → the recommendation fires: source
  enough additional Egyptian-origin content to cross the 40% threshold before this tender's deadline,
  or (the honest alternative) accept the bid competes on its own technical/commercial merits without
  any price cushion.

### 11.3 `eg-oil-gas-price-preference` -- a genuinely different buyer, legal basis, and margin

Source: Egypt's Production Sharing Agreement (PSA) model -- the standard contractual framework
governing oil & gas exploration/production, under the Mines and Quarries Law of 1953, the Investment
Guarantees and Incentives Act of 1997, and the Ministry of Petroleum's own PSA terms -- requires
operating (International Oil Company) contractors to give priority to local Egyptian contractors and
sub-contractors "when their performance is comparable to international performance, and the prices
of their services are not higher than other contractors by more than 10%". This is a real, sourced,
genuinely different mechanism from `eg-price-preference` above: a different buyer (petroleum-sector
operating companies under Ministry of Petroleum oversight, scoped to `semi-government-soe`
procurement only -- not general government procuring entities), a different legal basis (PSA
contractual terms, not Law 5/2015), and a different margin (10%, not 15%) -- the same "genuinely
distinct mechanism, not a variant" pattern already applied to UAE Tawazun vs. ICV (section 9) and
Oman's OQ Group vs. general ICV (section 10.4).

- **Buyer's reading** (the PSA operating company / International Oil Company): a disclosed,
  bounded price band (up to 10% above the lowest bid) within which local capacity is deliberately
  favored, keeping Egyptian oilfield-services capacity competitive without a hard local-content
  quota on the contract itself.
- **Supplier's reading:** for an Egyptian oilfield-services contractor whose performance is
  genuinely comparable to international competitors, the 10-point price band is a real, quantifiable
  cushion against being undercut purely on price by a foreign contractor -- the qualifying bar is
  contractor-class status and comparable performance, not a percentage of bid content.
- Worked mini-example: an Egyptian oilfield-services subcontractor bidding into a PSA-governed
  drilling-support contract, confirmed as a qualifying local contractor (comparable performance,
  price within the 10% band) in the `semi-government-soe` procurement context →
  `isLocalEgyptianContractor: true` → `locallyManufacturedSharePct: 100`, `effectiveBidDiscountPct:
  10` -- `recommendLocalContentAction` returns `null` (already qualifying, nothing to recommend). The
  same contractor without confirmed comparable-performance/price-band status →
  `isLocalEgyptianContractor: false` → `effectiveBidDiscountPct: 0`, and the recommendation fires:
  pursue the underlying qualifying facts (performance benchmarking, price positioning within the
  band) rather than assuming registration alone is sufficient. Applied to `government` procurement
  instead of `semi-government-soe` → `not-applicable` (this program is sourced as PSA-operating-
  company-specific, not general government procurement).

### 11.4 Explicitly not modeled, to avoid fabrication

- **The revamped automotive local-content target** (`eg-auto-local-content`, `not-yet-sourced`):
  Egypt's Ministry of Industry, Trade and Small Industries announced a revamped Automotive Industry
  Development Program (AIDP) targeting 60% local content and 100,000 vehicles/year (per EnterpriseAM's
  March 2026 reporting), replacing the earlier AIDP's 35%/10,000-vehicle target described in that same
  reporting as impractical. No published per-manufacturer or per-supplier computable formula for the
  revised target was found -- the incentive structure itself is reported as unpublished, pending
  official announcement. Disclosed as a real, dated national target rather than guessed, the same
  Decision Record 8.7 treatment already applied to Saudi GAMI/LIKT (section 8.6) and Oman/Qatar/
  Bahrain/Kuwait's general national programs (section 10.7).
- **The Law 89/1998 vs. Law 182/2018 citation discrepancy**: the US government's own trade.gov guide
  cites the older Tenders and Bids Law No. 89 of 1998 as governing Egypt's overall procurement
  procedure, while a separate legal summary (riad-riad.com) states Law No. 182 of 2018 replaced that
  1998 law. This pass discloses the discrepancy rather than resolving it by assumption -- the same
  treatment already applied to Jordan's own unconfirmed governing-bylaw citation (section 10.2's own
  source note).
- **No dedicated certifying/administering authority** for the 40% local-content determination under
  `eg-price-preference` was identified in this research pass's sourcing (unlike LCGPA, MoIAT, or
  icv.qa's named certifying bodies for other countries) -- disclosed as an open item, not assumed.
- **The defense/interior/military-production/intelligence exemption** from `eg-price-preference`
  (per trade.gov: these agencies' procurement is exempted from the Law 5/2015 preference) is
  disclosed in the program's own `sourceNoteEn`/`sourceNoteAr` but not separately modeled as a
  distinct procurement context -- no per-department procurement context is sourced anywhere else in
  this file either, so this is consistent with the engine's existing scope, not a new gap.
- **A confirmed administering department for the PSA local-contractor priority**: the source
  article's own recommendation that Egypt establish "a unique and specialized department in the
  Ministry of Petroleum to manage local content" implies no such department is confirmed to exist
  yet -- disclosed as an open item rather than assumed to exist.

### 11.5 Stress-test record -- Egypt opening (11 new tests, all passing; full suite 109 → 120 for this file)

| Mechanism | Soft | Hardest | Boundary |
|---|---|---|---|
| `eg-price-preference` | 45% Egyptian content (above the 40% threshold) -> full 15-point margin via a 100% binary share | 39.9% Egyptian content (just below the threshold) -> zero discount, not a partial one -- proves this is a gate, not a continuous scale | exactly 40.0% -> qualifies (`>=`, not `>`); no share supplied -> honest `null`, never assumed disqualified |
| `eg-oil-gas-price-preference` | qualifying local PSA contractor -> full 10-point margin via a 100% binary share | does not qualify -> zero discount, not a partial one | no contractor status supplied -> honest `null` share |
| `eg-auto-local-content` | -- | returns `insufficient-data` with the real 60%/AIDP context disclosed in both languages, never a fabricated per-supplier formula | -- |
| Applicability | -- | `eg-price-preference` correctly resolves `not-applicable` for `private-commercial` procurement; `eg-oil-gas-price-preference` correctly resolves `not-applicable` for `government` procurement (it is PSA-operating-company-specific, not general government) | -- |
| Default routing | `eg-price-preference` is confirmed as `DEFAULT_PROGRAM_BY_COUNTRY.EG`, the same "original/broadest program is the default" convention as every other country | -- | -- |
| Structural | the existing 8-country structural-sanity regression test (section 10.8's own test, now covering EG too) confirms `PROGRAMS_BY_COUNTRY.EG` has 3 programs and every one resolves back to `EG` in `PROGRAMS` | -- | -- |

### 11.6 UI -- Egypt slots into the existing generalized routing with zero new logic

The same "any country whose `PROGRAMS_BY_COUNTRY` list has more than one program gets the routing
question row" logic (sections 8.9, 9.6, 10.9) required **zero new routing logic** for Egypt --
`COUNTRY_ORDER` and `COUNTRY_FLAG` gained an `EG` entry, and `PROGRAM_LABELS`, `MECHANISM_VALUE_FRAMING`
(already generic per `mechanismType`, needing no change since both Egyptian mechanisms reuse
`price-preference-margin`), and `hasMeaningfulResult` (also already generic per `mechanismType`)
needed only the label additions, not new branches. Egypt got its own two input-rendering blocks: a
percentage field for `eg-price-preference` (with an inline hint disclosing the 40%-threshold/15%-flat-
margin shape, so a user isn't left to infer why a 39% entry shows a zero discount) and a yes/no
qualification toggle for `eg-oil-gas-price-preference`, matching the exact binary-toggle pattern
already used for Bahrain's SME status, Jordan's contractor registration, and Kuwait's supplier
registration. The stale "OTHER" pseudo-value comment that named Egypt as an example of a country
*not yet* representable by this engine (section 9's own original text) was corrected in the same
pass that made it representable -- the same "a known-wrong disclosure must not be left uncorrected"
discipline (Decision Record 8.7 / registry rule 12) already applied to this document's own test-count
arithmetic. The page's hero copy, the "not covered by this module" disclosure copy, and the footer
disclaimer were all updated to say "eight countries" and name Egypt's governing law/ministry
alongside the other seven authorities, rather than leaving Egypt described as an uncovered example
country in copy a real user reads first.

## 12. Turkey Mechanism Decomposition — Part 2 Continuation (16 Sep 2026)

Second stop on the platform owner's own explicit country order ("egypt, then turkey, then UK,
then USA, then China"). `TR` is the ninth `LocalContentCountry`, and the second of Rawabi's own
named non-GCC supplier countries (section 1's scenario intro) to get a real, sourced mechanism.

One real, sourced, computable mechanism was found this pass (`tr-price-preference`), plus one
honest `not-yet-sourced` entry with rich disclosed context (`tr-defense-offset`). A third real
Turkish scheme (YEKDEM solar domestic-content certification) was found and deliberately **not**
modeled as a program -- see 12.4. Both modeled Turkish programs reuse the existing
`price-preference-margin` mechanism type and `computePricePreferenceMargin` primitive -- no new
mechanism type or shared computation was needed, the same "reuse, don't reinvent" pattern already
true of every country in this file.

### 12.1 Six-type taxonomy → Turkish program mapping

| Program | `mechanismType` | Status |
|---|---|---|
| `tr-price-preference` (default program) | `price-preference-margin` | Sourced: Public Procurement Law No. 4734, Art. 63(c) -- up to 15% price preference for domestic-goods ("yerli mali") bidders, mandatory (not discretionary) for medium/high-technology listed goods |
| `tr-defense-offset` | `not-yet-sourced` | Real, dated national context disclosed (SSB's 2022 Offset Guideline), but two sources disagree on the headline "70%" figure and neither gives a confirmed contract-value trigger threshold or a per-supplier formula |

### 12.2 `tr-price-preference` -- price-preference-margin, continuously scaled (like Jordan/Oman, not Egypt's threshold gate)

Source: Turkey's Public Procurement Law No. 4734, Article 63(c), lets contracting authorities grant
bidders offering domestic goods a price advantage of up to 15% in goods-procurement tender
evaluation; for goods on the official list of medium/high-technology industrial products, this 15%
preference is mandatory rather than discretionary. The preference is applied by adding the
calculated advantage amount to competing non-domestic bidders' prices for evaluation purposes, not
by discounting the domestic bidder's own price (a KIK-decision summary, salimdemirel.com.tr);
domestic-goods status is certified per item via a "Yerli Mali Belgesi" (Domestic Goods Certificate,
issued by local Chambers of Commerce/Industry or TSE under the Ministry of Industry and Technology's
framework), and applied item-by-item in partial/multi-item tenders -- a **proportional, not
all-or-nothing, mechanism**, the opposite shape from Egypt's 40%-threshold gate (section 11.2). This
engine models Turkey the same way it already models Jordan and Oman: the domestic-certified share of
a bid's value scales the discount continuously from 0% to the full 15% ceiling, rather than
converting a percentage into a binary qualify/don't-qualify share the way Egypt's and Bahrain's
mechanisms do.

**A candidate alternate rate, run down and resolved, not left open:** one source title
(satinalmadergisi.com, "Yerli Mali Teklif Eden Isteklilere %7 Oraninda Fiyat Avantaji Uygulanmasi?")
suggested a possible 7% figure competing with the 15% ceiling. Fetching and reading that source
resolved the ambiguity: the article describes a **KIK ruling against a contracting authority that
had under-applied only 7% instead of the mandatory 15%** to high-tech medical equipment -- a
documented compliance violation, not a second live statutory rate. This is disclosed here as a
resolved discrepancy (the research found the answer), distinct from Turkey's own SSB offset
ambiguity below (section 12.3), which stays genuinely open because no source resolves it.

- **Buyer's reading** (the tendering government or state-economic-enterprise entity): a bounded,
  administratively-set price cushion (0-15%, or a mandatory 15% for medium/high-tech goods) that
  favors domestic-certified goods without excluding foreign bidders outright -- the exact ceiling for
  any given tender is set in that tender's own documents, not by this engine.
- **Supplier's reading:** the certified share of THIS bid's value that carries a valid Yerli Mali
  Belgesi is the entire lever, applied proportionally (not as a threshold) and item-by-item in
  multi-item tenders -- a supplier partially certified on some line items still gets a partial,
  real advantage on those items, unlike Egypt's all-or-nothing 40% gate.
- Worked mini-example: a Turkish machinery supplier bidding into a state-enterprise equipment tender
  holds Yerli Mali Belgesi certification covering 60% of the bid's value (imported electronic
  components make up the rest) → `bidValueDomesticCertifiedPct: 60` → `preferenceMarginPct: 15`,
  `locallyManufacturedSharePct: 60`, `effectiveBidDiscountPct: 9` (15% × 60%) -- competing
  non-domestic bids are evaluated as if 9 points more expensive. The same supplier with full
  domestic certification (100%) → `effectiveBidDiscountPct: 15`, the full ceiling --
  `recommendLocalContentAction` returns `null` (nothing left to improve). Applied to
  `private-commercial` procurement → `not-applicable` (Law 4734 is a public-procurement-law
  mechanism, sourced for government and state-economic-enterprise buyers only).

### 12.3 `tr-defense-offset` -- not-yet-sourced, with a genuinely open cross-source discrepancy

Source: Turkey's defense-sector offset regime is administered by the Presidency of Defence
Industries (SSB), which replaced the Undersecretariat for Defence Industries (SSM) under the 2018
executive-branch reorganization; a new Offset Guideline was issued in 2022, replacing a 2011-vintage
guideline. Two real, professionally-published sources disagree on the headline commitment:
mondaq.com states foreign contractors/subcontractors must commit to an "Offset Liability of at least
70% of the bid amount" (backed by a 6% guarantee of total offset liabilities); herdemlaw.com's more
granular 2011-vs-2022 comparison instead gives narrower sub-thresholds -- a minimum 21% of contract
value as local-content/SME work share (YS/SME), a requirement that 70% of EYDEP-accredited work
specifically (not 70% of the whole bid) be carried out by Turkish SMEs, a minimum 2% of bid value as
a technology-acquisition (TUK) liability, and a tiered shortfall penalty (6% of that period's
shortfall in the interim period, rising to +50% of outstanding liabilities in an extended period,
and a final 25% penalty on any liability still unrealized).

**This ambiguity is disclosed, not resolved by assumption** -- the same treatment already applied to
Egypt's Law 89/1998-vs-182/2018 citation conflict (section 11.4) and Jordan's unconfirmed bylaw
citation (section 10.2): it is not established from either source whether mondaq's "70% of bid
amount" and herdemlaw's "70% of EYDEP-accredited work" describe the same commitment under different
labels, or two genuinely distinct figures. Neither source states a confirmed contract-value trigger
threshold analogous to UAE Tawazun's clear AED 10M/\$10M line (section 9.3), and no per-supplier (as
opposed to prime-contractor-level) computable formula was found. Kept honestly as `not-yet-sourced`
-- Decision Record 8.7 -- with this real, dated context disclosed in both `reasonEn`/`reasonAr`
rather than a guessed formula or an assumed reconciliation.

### 12.4 Explicitly not modeled, to avoid a taxonomy-fit fabrication

- **YEKDEM's solar domestic-content scheme**: Turkey's Renewable Energy Resources Support Mechanism
  (YEKDEM) requires solar module manufacturers to reach >=55% domestic content (via a Ministry of
  Industry and Technology weighted-component framework across cells, glass, aluminum frames,
  junction boxes/diodes, encapsulant/backsheet materials, and local labor) to access premium
  feed-in tariffs, certified via the same Yerli Mali Belgesi. This is a real, sourced Turkish
  domestic-content scheme -- but it certifies a **manufacturer for subsidy/tariff access**, not a
  **supplier bidding into a specific buyer's tender**, so it does not fit this engine's buyer-side
  `ProcurementContext` taxonomy (`government` / `semi-government-soe` / `private-commercial`) the
  way every other modeled mechanism in this file does. Rather than force-fitting it into a
  `ProcurementContext` it doesn't genuinely have, or silently dropping it, this is disclosed here
  and in `tr-defense-offset`'s own `sourceNoteEn`/`sourceNoteAr` as an explicit scope decision --
  the same "disclosed, not silent" discipline used everywhere else in this file for what is
  deliberately left out.
- **The SSB offset guideline's cross-source "70%" discrepancy** (section 12.3) and its missing
  contract-value trigger threshold are disclosed rather than resolved by assumption.
- **No SME-specific rate distinct from the general 15% ceiling** was found for
  `tr-price-preference` in this research pass, unlike Bahrain's separate SME-specific preference --
  disclosed as an open item, not assumed to not exist.

### 12.5 Stress-test record -- Turkey continuation (9 new tests, all passing; full suite 120 → 129 for this file)

| Mechanism | Soft | Hardest | Boundary |
|---|---|---|---|
| `tr-price-preference` | 40% domestic-certified bid content -> proportional 6-point discount (15% x 40%) | 0% and 100% domestic-certified content -- the two adversarial extremes, 0 and the full 15-point ceiling | no share supplied -> honest `null`, never assumed zero; exactly 100% -> `recommendLocalContentAction` returns `null` (nothing left to improve) |
| Applicability | `tr-price-preference` correctly resolves `applicable` for `semi-government-soe` (Law 4734 Art. 2 covers state economic enterprises, unlike Jordan's government-only scope) | `tr-price-preference` correctly resolves `not-applicable` for `private-commercial` procurement | -- |
| `tr-defense-offset` | -- | returns `insufficient-data` with the disclosed 70%-figure discrepancy in both languages, never a guessed reconciliation; YEKDEM's explicit not-modeled disclosure confirmed present in both `sourceNoteEn`/`sourceNoteAr` | -- |
| Default routing | `tr-price-preference` is confirmed as `DEFAULT_PROGRAM_BY_COUNTRY.TR`, the same "original/broadest sourced program is the default" convention as every other country | -- | -- |
| Structural | the existing structural-sanity regression test (now covering all 9 countries) confirms `PROGRAMS_BY_COUNTRY.TR` has 2 programs and every one resolves back to `TR` in `PROGRAMS` | -- | -- |

### 12.6 UI -- Turkey slots into the existing generalized routing with zero new logic

The same "any country whose `PROGRAMS_BY_COUNTRY` list has more than one program gets the routing
question row" logic (sections 8.9, 9.6, 10.9, 11.6) required **zero new routing logic** for Turkey
-- `COUNTRY_ORDER` and `COUNTRY_FLAG` gained a `TR` entry, and `PROGRAM_LABELS` (already generic
per `mechanismType` via `MECHANISM_VALUE_FRAMING` and `hasMeaningfulResult`) needed only the label
additions, not new branches. Turkey got one new input-rendering block: a percentage field for
`tr-price-preference` (with an inline bilingual hint disclosing the up-to-15%/mandatory-for-
high-tech-goods shape, mirroring the pattern already used for Egypt's threshold field) --
`tr-defense-offset` needs no input block at all, since its `not-yet-sourced` `mechanismType` is
caught by `assessSupplierLocalContent`'s existing top-level check before any input is ever read,
the same zero-input pattern already true of `eg-auto-local-content`, `om-icv`, and every other
`not-yet-sourced` program in this file. The stale "OTHER" pseudo-value comment (naming Turkey
among example not-yet-representable countries) was corrected in the same pass that made it
representable -- the same "a known-wrong disclosure must not be left uncorrected" discipline
(Decision Record 8.7 / registry rule 12) already applied during the Egypt pass (section 11.6). The
page's hero copy, the "not covered by this module" disclosure copy, and the footer/body copy were
all updated to say "nine countries" and name Turkey's governing law/authority (KIK) alongside the
other eight, rather than leaving Turkey described as an uncovered example country in copy a real
user reads first.
---

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

### ٩.٥ سجل اختبار الإجهاد — آلية توازن الإماراتية (١٢ اختباراً جديداً، جميعها ناجحة؛ إجمالي هذا الملف من ٦٢ إلى ٧٧)

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


---

## 10. تفكيك آلية الأردن الثانية، وعُمان، وقطر، والبحرين، والكويت (١٧ سبتمبر ٢٠٢٦)

استكمالاً للجزء الأول بعد السعودية (القسم ٨) والإمارات (القسم ٩): أغلقت هذه المرحلة كل فجوة بحثية
متبقية للدول الخمس الأخرى في هذه الوحدة -- آلية الأردن الثانية إلى جانب تفضيله السعري القائم البالغ
٢٠٪، وآليات حقيقية موثّقة لعُمان وقطر والبحرين والكويت، وكانت هذه الدول الأربع الأخيرة تحمل سابقاً
برنامجاً واحداً فقط بحالة "غير موثّق". أُضيف نوعان جديدان فعلياً إلى تصنيف الآليات في هذه المرحلة:
`spend-set-aside-target` (حصة مستهدفة وطنية/برنامجية موثّقة إضافة إلى تأهل المورّد الثنائي الخاص به
-- حصة المقاولين الأردنيين، وتخصيص البحرين للمؤسسات الصغيرة والمتوسطة، وهدف إنفاق مؤسسة البترول
الكويتية) و`modified-icv-score` (درجة أساسية بنسبة الإنفاق المؤهل مضافاً إليها معدِّلات حقيقية
ومُفصَح عنها -- توطين/القيمة المحلية القطرية). يبقى برنامج كل دولة الأصلي "غير الموثّق" أو الموثّق
مسبقاً دون تغيير ودون أن يصبح افتراضياً -- تُضاف البرامج الجديدة إلى جانبه، لا بديلاً عنه، وتبقى قيم
`DEFAULT_PROGRAM_BY_COUNTRY` دون تغيير، على غرار ما جرى تماماً مع `sa-iktva-aramco` في القسم ٨ الذي
لم يصبح أبداً البرنامج الافتراضي للسعودية.

### ١٠.١ تصنيف الأنواع الستة ← ربطها بالبرامج الجديدة

| الدولة | البرنامج | `mechanismType` | الحالة |
|---|---|---|---|
| الأردن | `jo-contractor-quota` (النوع ٥) | `spend-set-aside-target` (جديد) | موثّق: حصة لا تقل عن ٣٥٪ للمقاولين الأردنيين في المناقصات الدولية، بقرار مجلس الوزراء بحسب جوردن تايمز (رقم أساسي لعام ٢٠١٨؛ استمرار ما بعد ٢٠٢٢ غير مؤكد -- انظر ١٠.٧) |
| عُمان | `om-mandatory-list` (النوع ٣) | `category-eligibility-gate` (إعادة استخدام الصيغة المعمَّمة من القسم ٨.٣) | موثّق: القائمة الإلزامية لهيئة PTLC، مطابقة من حيث البنية لبوابة القائمة الإلزامية السعودية |
| عُمان | `om-oq-price-preference` (النوع ٤) | `price-preference-margin` | موثّق: تفضيل مجموعة OQ الخاص بنسبة ١٠٪ للسلع المصنّعة عمانياً (خاص بالشركة، على غرار إكتفاء أرامكو/توطين قطر للطاقة) |
| قطر | `qa-icv-tawteen` (النوع ١) | `modified-icv-score` (جديد) | موثّق: منهجية icv.qa الرسمية للقيمة المحلية بخمسة أركان مع معدِّلات حقيقية (ICV+ / الحد الأدنى الشامل / المكافأة) |
| البحرين | `bh-sme-price-preference` (النوع ٤) | `price-preference-margin` | موثّق: ميزة سعرية ١٠٪ للمؤسسات الصغيرة والمتوسطة في العطاءات، القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ |
| البحرين | `bh-sme-spend-setaside` (النوع ٥) | `spend-set-aside-target` (جديد) | موثّق: تخصيص ٢٠٪ من قيمة المناقصات الحكومية للمؤسسات الصغيرة والمتوسطة، القرار الوزاري نفسه |
| الكويت | `kw-kpc-local-spend` (النوع ٥) | `spend-set-aside-target` (جديد) | موثّق: هدف مؤسسة البترول الكويتية الخاص بنسبة ٣٠٪ للموردين الكويتيين بحلول ٢٠٤٠، بحسب دليل trade.gov للسوق الكويتي |

### ١٠.٢ `jo-contractor-quota` الأردنية -- تخصيص حصة إنفاق، قراءة ثنائية الجانب

المصدر: وافق مجلس الوزراء الأردني (٧ مايو ٢٠١٨، بحسب جوردن تايمز) على حصة لا تقل عن ٣٥٪ للمقاولين
الأردنيين في المناقصات الدولية للمشاريع المنفَّذة داخل الأردن، وتشمل الوزارات والمؤسسات العامة
والشركات المملوكة للحكومة أو ذات المساهمة الحكومية، وكذلك القطاع الخاص عند طرح مناقصات على مقاولين
أجانب. كما اشترط القرار إسناد أعمال التصميم والإشراف إلى استشاريين أردنيين، وحدّد حصة منفصلة تتراوح
بين ٢٠٪ و٤٠٪ لستة مشاريع محددة في قطاعي الطاقة والبيئة، ضمن خطة النمو الاقتصادي ٢٠١٨-٢٠٢٢ مع زيادة
سنوية معلنة بمقدار ٥ نقاط "خلال الإطار الزمني" لتلك الخطة.

- **قراءة المشتري** (الوزارة أو المؤسسة العامة أو الشركة ذات المساهمة الحكومية الطارحة للمناقصة):
  حد أدنى مضمون لمشاركة المقاولين الأردنيين في مجموعة مناقصات كانت لتذهب بالكامل للمقاولين الأجانب
  لولا ذلك -- الحصة المستهدفة نفسها تفرض التنفيذ، دون الحاجة لتفاوض عند كل ترسية.
- **قراءة المورّد:** حالة تسجيل المقاول الأردني نفسها هي الرافعة الكاملة -- بعد التأهل، يتنافس ضمن
  مجموعة أصغر ومخصصة بنسبة ٣٥٪ بدلاً من السوق المفتوح بالكامل أمام كل مقاول أجنبي.
- مثال تطبيقي مصغّر: مقاول من الباطن أردني في قطاع الإنشاءات يقدّم عطاءً ضمن مناقصة دولية لمشروع
  بنية تحتية ممول حكومياً، مؤكَّد كمقاول أردني مسجَّل رسمياً، ضمن سياق شراء `government` →
  `targetSharePct: 35`، `qualifiesForSetAside: true`، `eligibleForReservedShare: true` -- تُعيد
  `recommendLocalContentAction` القيمة `null` (لا توصية مطلوبة؛ المورّد يستوفي شرط التأهل بالفعل).
  المورّد نفسه، غير مسجَّل → `qualifiesForSetAside: false`، وتظهر التوصية: متابعة التسجيل قبل دورة
  العطاءات القادمة بوصفه السبيل الوحيد للمنافسة ضمن الحصة المخصصة البالغة ٣٥٪ نفسها، مع بقاء الجزء
  المفتوح (غير المخصص) من الإنفاق كبديل صادق إن تعذّر إتمام التسجيل في الوقت المناسب.

### ١٠.٣ `om-mandatory-list` العُمانية -- بوابة أهلية الفئة (الصيغة المعمَّمة قيد العمل فعلياً)

المصدر: تُدير هيئة المناقصات العُمانية، التي أعاد المرسوم السلطاني رقم ٥٧/٢٠٢٥ تسميتها إلى "هيئة
المشاريع والمناقصات والمحتوى المحلي" (PTLC، خلفاً لمجلس المناقصات السابق)، قائمة إلزامية تُخصّص فئات
محددة من السلع والخدمات للمؤسسات الصغيرة والمتوسطة والموردين المحليين العُمانيين (بحسب دليل مناقصات
عُمان ٢٠٢٦ الصادر عن tendersarabia.com) -- وهي مطابقة تماماً من حيث البنية لبوابة نجاح/فشل القائمة
الإلزامية لهيئة المحتوى المحلي والمشتريات الحكومية السعودية (القسم ٨.٣)، ولذلك أعاد هذا البرنامج
استخدام صيغة `computeCategoryEligibilityGate` نفسها بدلاً من تطبيق مكرَّر منفصل. لم يعثر هذا البحث
على قائمة منشورة بالفئات المحددة المدرجة في القائمة الإلزامية العُمانية (بخلاف السعودية الموثّقة
بأكثر من ٢٣٣ بنداً) -- منطق البوابة نفسه حقيقي وموثّق، أما نطاق تغطية الفئات المحدد فغير موثّق،
ويُفصَح عن ذلك صراحة بدلاً من تخمينه.

- **قراءة المشتري:** يقين بالتوريد المحلي بالتصميم للفئات العُمانية الاستراتيجية، دون الاعتماد على
  أن يكون التفضيل السعري وحده كافياً لترجيح الترسية.
- **قراءة المورّد:** الاعتماد في فئة مشمولة بالبوابة يمثّل ميزة تنافسية حقيقية -- لا يمكن للمنافسين
  غير المعتمدين، عُمانيين كانوا أم أجانب، التقديم إطلاقاً، وليس فقط التنافس بوضع سعري أضعف.
- نفس شكل الاختبار الناعم/الأقسى/الحدّي المطبَّق على القائمة الإلزامية السعودية (القسم ٨.٨): مدرج
  ومعتمد → مؤهل؛ مدرج وغير معتمد → مستبعد (`false`، وليس نسبة جزئية أبداً)؛ غير مدرج في أي فئة
  إلزامية أصلاً → البوابة لا تنطبق ببساطة، والمورّد مؤهل بغض النظر عن حالة الاعتماد.

### ١٠.٤ `om-oq-price-preference` العُمانية -- تفضيل سعري (رابع برنامج خاص بشركة بعينها)

المصدر: تقدّم مجموعة OQ (شركة الطاقة المتكاملة المملوكة للدولة في عُمان، والمعروفة سابقاً بأوربيك/شركة
عُمان للنفط) تفضيلاً سعرياً بنسبة ١٠٪ للسلع المصنّعة عمانياً ضمن فئات عقود مؤهلة، بحسب دليل سوق
المناقصات العُمانية لعام ٢٠٢٦. هذا تفضيل خاص بمشتريات شركة بعينها، ومقصور على سياق `semi-government-soe`
فقط (وليس الحكومي)، لينضم إلى إكتفاء أرامكو وبرنامج توطين قطر للطاقة كثالث آلية حقيقية "خاصة بمشترٍ
رئيسي محدد" تُنمذجها هذه الوحدة، مُعيداً استخدام صيغة `computePricePreferenceMargin` نفسها التي
تتشاركها بالفعل الأردن والسعودية والبحرين (أربع دول، حساب واحد، أربع ملاحظات مصدرية مُفصَح عنها).

### ١٠.٥ `qa-icv-tawteen` القطرية -- درجة قيمة محلية معدَّلة، شرح الصيغة الكاملة، قراءة ثنائية الجانب

المصدر: تنشر البوابة الرقمية الرسمية للقيمة المحلية في قطر (icv.qa، الجهة الوطنية المعتمدة لشهادات
القيمة المحلية) منهجية حقيقية قابلة للحساب. الدرجة الأساسية = الإنفاق المحلي المؤهل (السلع والمواد
الملموسة المحلية + الخدمات المحلية [القوى العاملة والمقاولون من الباطن والسلع] + تكلفة تدريب
المواطنين/المقيمين القطريين + تكلفة تدريب/اعتماد الموردين + إهلاك أصول الشركة المقيمة في قطر) مقسومة
على إجمالي إيرادات قطر **باستثناء الصادرات**. تُضاف ثلاثة معدِّلات حقيقية وموثّقة فوق الدرجة
الأساسية، بحسب صفحتي الأسئلة الشائعة والبرنامج المعزَّز على icv.qa: (١) "ICV+" تمنح المصنّعين
المؤهلين زيادة ٥٠٪ على الدرجة (`QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER = 1.5`)؛ (٢) "الدرجة
الشاملة" تضمن للموردين متناهي الصغر والصغار حداً أدنى ٣٠٪
(`QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL = 30`) بغض النظر عن النسبة الأساسية؛ (٣) يمكن للموردين
المطالبة بحتى ١٥ نقطة إضافية عبر سلوكيات استراتيجية موثّقة (الإنتاجية، بناء القدرات، نمو الاستثمار،
القطرنة، التصدير، البحث والتطوير، الاستدامة) -- وتُنمذَج كمُدخل ذاتي التصريح بحدّ أقصى
(`QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT = 15`)، إذ لا تنشر icv.qa الترجيح الداخلي لهذه المكافأة.
تذكر icv.qa أن القيمة المحلية "ستؤدي دوراً في تقييم العروض التجارية؛ إذ تُمنح علاوات للعروض ذات
القيمة المحلية الأعلى بشرط أن يكون السعر تنافسياً" -- آلية ميزة تجارية حقيقية وموثّقة، إلا أنها لا
تضمن الفوز ولا تمثّل ترجيحاً بنسبة مئوية دقيقة، لذا تُفصَح هنا كسياق لا كخصم محسوب (نفس الانضباط
المُطبَّق على تبسيط المكافأة التحفيزية لإكتفاء أرامكو في القسم ٨.٥).

- **قراءة المشتري** (أي جهة حكومية أو شبه حكومية قطرية تُقيِّم العروض عبر icv.qa): درجة رسمية واحدة
  قابلة للاستخدام مباشرة في تقييم العطاءات، مع معدِّلات حقيقية ومُفصَح عنها تكافئ تحديداً السلوكيات
  التي تستهدفها استراتيجية قطر (التصنيع المحلي، إشراك الموردين الصغار، تطوير القوى العاملة) دون
  ابتكار منهجية تقييم جديدة خاصة بها.
- **قراءة المورّد:** توجد عدة روافع حقيقية وقابلة للتحسين كل على حدة لرفع هذه الدرجة إلى جانب
  الإنفاق وحده -- صفة "المصنّع المؤهل" وحدها تساوي مضاعِفاً بنسبة ٥٠٪، ويُضمَن للمورّد متناهي
  الصغر/الصغير فعلياً ٣٠٪ بغض النظر عن تفصيل إنفاقه، وكلاهما حقيقة تستحق التحقق منها قبل افتراض أن
  سد فجوة الدرجة يتطلب إنفاقاً جديداً.
- مثال تطبيقي مصغّر: مورّد صناعي مقيم في قطر بقيمة ٢٠٠,٠٠٠ ر.ق سلع ومواد ملموسة محلية، و١٠٠,٠٠٠ ر.ق
  خدمات محلية، و٥٠,٠٠٠ ر.ق تكلفة تدريب مواطنين قطريين، و٥٠,٠٠٠ ر.ق تكلفة تدريب/اعتماد موردين،
  و١٠٠,٠٠٠ ر.ق إهلاك أصول مقيمة في قطر، مقابل ١,٠٠٠,٠٠٠ ر.ق إجمالي إيرادات قطر باستثناء الصادرات،
  مؤكَّد كمصنّع مؤهل مع مكافأة سلوك استراتيجي مُفصَح عنها بـ١٠ نقاط → نسبة أساسية ٥٠٪ (٥٠٠,٠٠٠ ر.ق /
  ١,٠٠٠,٠٠٠ ر.ق)، ثم مكافأة ICV+ ترفعها إلى ٧٥٪ (×١.٥)، زائد مكافأة الـ١٠ نقاط → **الدرجة النهائية
  ٨٥٪**. المورّد نفسه دون مكافأة المصنّع → الدرجة النهائية ٦٠٪ (٥٠٪ أساسية + ١٠ مكافأة، دون مضاعِف)
  -- توضيح ملموس وصادق لقيمة معدِّل ICV+ فعلياً.

### ١٠.٦ `bh-sme-price-preference` و`bh-sme-spend-setaside` البحرينيتان -- حقيقة تأهل واحدة، قراءتا آلية

المصدر: القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ (وزير الصناعة والتجارة البحريني، الجريدة الرسمية، نافذ من
١٢ يونيو ٢٠٢٦، ألغى معايير تصنيف المؤسسات الصغيرة والمتوسطة لعام ٢٠١٧) رفع سقف التصنيف إلى حتى ٢٥٠
موظفاً أو حتى ٢٠ مليون دينار بحريني إيرادات سنوية (من السقف السابق ١٠٠ موظف / ٣ ملايين دينار)، ويمنح
المؤسسات المؤهلة كلاً من "ميزة بنسبة ١٠٪ في تقديم العطاءات للمناقصات الحكومية" و"تخصيص ٢٠٪ من قيمة
المشتريات والمناقصات الحكومية" لها (بحسب الملخص القانوني الصادر عن mondaq.com) -- وهو ما يؤكد ملاحظة
التصنيف الأصلية في الموجز بأن البحرين "تخصص حصة من المناقصات للمؤسسات الصغيرة والمتوسطة إضافة إلى
تفضيل سعري متراكب." تعتمد الآليتان كلتاهما على حقيقة التأهل الأساسية نفسها (`bhSme.qualifiesAsSme`)،
المُنمذَجة مرة واحدة في مخطط المُدخلات وتُقرأ مرتين -- مرة عبر `computePricePreferenceMargin` (يعمل
تأهل المؤسسة الصغيرة أو المتوسطة كحصة ثنائية ١٠٠٪/٠٪ "مصنَّعة محلياً" مُدخَلة إلى صيغة تفضيل السعر
المشتركة، لأن حقيقة التأهل هنا ثنائية وليست نسبة إنفاق) ومرة عبر `computeSpendSetAside`، الصيغة
نفسها التي يتشاركها بالفعل الأردن والكويت. لا يُسأل المورّد سؤال تأهل المؤسسة الصغيرة أو المتوسطة
مرتين عبر برنامجي البحرين.

### ١٠.٧ ما لم يُنمذَج عمداً، تجنباً للاختلاق

- **زيادة الأردن السنوية بعد ٢٠٢٢**: نصّ قرار مجلس الوزراء الموثّق لعام ٢٠١٨ على زيادة الحصة البالغة
  ٣٥٪ بمقدار ٥ نقاط سنوياً "خلال الإطار الزمني" لخطة النمو الاقتصادي ٢٠١٨-٢٠٢٢. لم يُعثر على مصدر
  أساسي يعيد تأكيد قيمة الحصة بعد نهاية إطار تلك الخطة -- يحسب هذا المحرك بناءً على الرقم الأساسي
  الموثّق لعام ٢٠١٨ (٣٥٪) فقط، دون أي تقدير مُسقَط للسنة الحالية.
- **برنامج القيمة المحلية الوطني العام في عُمان** (`om-icv`، دون تغيير، لا يزال "غير موثّق"): تدير
  عُمان برنامج قيمة محلية خاصاً بها مختلفاً عن برنامج الإمارات، لكن لم تُؤكَّد صيغة أركان دقيقة أو
  أوزان للبرنامج العام بنفس دقة السعودية والإمارات والأردن -- لم يتم تخمينها عمداً، وتُركت كما كانت
  قبل هذه المرحلة، إلى جانب (لا بديلاً عن) الآليتين العُمانيتين الأضيق نطاقاً الموثّقتين الآن.
- **الاستراتيجية الوطنية للمحتوى المحلي في قطر** (`qa-national-strategy`، دون تغيير، لا تزال "غير
  موثّقة"): أقرّها مجلس الوزراء القطري مؤخراً، ولا تزال حديثة العهد بحيث لم تُنشر صيغة حساب علنية
  بعد -- تُركت دون تغيير إلى جانب آلية توطين/القيمة المحلية المختلفة فعلياً والأطول عهداً والموثّقة
  بالكامل.
- **إطار وطني عام للمحتوى المحلي في البحرين أو الكويت** (`bh-local-content` و`kw-local-content`،
  كلاهما دون تغيير، لا يزالان "غير موثّقين"): لم يُعثر على إطار عام موثّق علنياً لأي من الدولتين بنفس
  دقة السعودية والإمارات والأردن -- تُنمذَج الآليتان الأضيق نطاقاً والمختلفتان فعلياً الموثّقتان في
  هذه المرحلة إلى جانب الفجوة الصادقة، لا بديلاً عنها.
- **تعداد فئات القائمة الإلزامية العُمانية** و**معايير التأهيل الأدق لصفة "المورّد الكويتي"** (بخلاف
  حالة التسجيل البسيطة): لم يُعثر على أي منهما في هذا البحث -- يُفصَح عن كليهما كفجوة مفتوحة ضمن
  `sourceNoteEn`/`sourceNoteAr` الخاصة بالبرنامج المعني، دون افتراض صامت.

### ١٠.٨ سجل اختبار الإجهاد -- استكمال الدول الخمس (٣٢ اختباراً جديداً، جميعها ناجحة؛ إجمالي هذا الملف من ٧٧ إلى ١٠٩)

| الآلية | ناعم | أقسى | حدّي |
|---|---|---|---|
| `jo-contractor-quota` | مقاول مسجَّل → مؤهل، والتوصية تُعيد `null` | غير مسجَّل → مستبعد، والتوصية تذكر الحصة الحقيقية ٣٥٪ | لا حالة تسجيل مُدخلة → `null` صادقة، وليس نجاحاً أو فشلاً ملفَّقاً |
| `om-mandatory-list` | مدرج + معتمد → مؤهل | مدرج + غير معتمد → مستبعد (`false`) | غير مدرج في أي فئة إلزامية أصلاً → البوابة لا تنطبق بغض النظر عن الاعتماد |
| `om-oq-price-preference` | ٢٥٪ تصنيع عماني → خصم تناسبي ٢.٥ نقطة | ٠٪ و١٠٠٪ (الحدّان المتطرفان) → خصم ٠ و١٠ نقاط | ١٠٠٪ بالضبط → التوصية تُعيد `null` |
| `qa-icv-tawteen` | تفصيل إنفاق واقعي بخمسة أركان مع مكافأة المصنّع والمكافأة المُفصَح عنها | تتراكم مكافأة المصنّع مع مكافأة تتجاوز الحد، والنتيجة تُقيَّد بصدق عند ١٠٠، دون اختلاق تجاوزها | لا إيرادات قطرية مُدخلة: درجة `null` إن لم يكن متناهي الصغر/صغيراً، لكن الحد الأدنى الشامل ٣٠٪ يظل يُحسَب إن كان كذلك (ضمانة سياسية مستقلة عن بيانات الإنفاق) |
| `bh-sme-price-preference` | مؤهل كمؤسسة صغيرة/متوسطة → هامش كامل ١٠ نقاط عبر حصة ثنائية ١٠٠٪ | غير مؤهل → خصم صفري، وليس جزئياً | لا حالة تأهل مُدخلة → حصة `null` صادقة، دون افتراض استبعاد |
| `bh-sme-spend-setaside` | مؤهل → مؤهل لتخصيص ٢٠٪ | غير مؤهل → مستبعد، والتوصية تظهر | حقيقة `bhSme.qualifiesAsSme` نفسها تقود برنامجي البحرين كليهما بشكل صحيح، دون سؤالها مرتين |
| `kw-kpc-local-spend` | مورّد كويتي مسجَّل → مؤهل لحصة هدف ٣٠٪ | غير مسجَّل → مستبعد | لا حالة تسجيل مُدخلة → `null` صادقة |
| الانطباق | -- | كل سياق شراء خارج نطاق كل برنامج جديد يُحسَم بشكل صحيح إلى "لا ينطبق" (حصة الأردن حكومية/شبه حكومية فقط، تفضيل OQ شبه حكومي فقط، برامج البحرين للمناقصات الحكومية فقط، هدف مؤسسة البترول الكويتية شبه حكومي فقط) | -- |
| تجميع المحفظة | `setAsideQualifyingSharePct` مرجَّحة بحصة الإنفاق بين الموردين المؤهلين وغير المؤهلين، ولا تُدمَج أبداً مع `weightedScorePct` | مجموعات `modified-icv-score` تُجمِّع `finalScorePct` مرجَّحة بحصة الإنفاق، بنفس اتفاقية كل آلية أخرى قائمة على درجة | -- |
| بنيوي | اختبار انحدار جديد يؤكد أن كل دولة من الدول السبع أصبحت تضم برنامجين أو أكثر الآن، وأن كل برنامج في `PROGRAMS_BY_COUNTRY` يعود إلى دولته الصحيحة في `PROGRAMS` -- ما يكشف برنامجاً مُدرَجاً تحت دولة خاطئة قبل وصوله إلى الواجهة | -- | -- |

الاختبار الوحيد المسبق الذي احتاجته هذه المرحلة للتحديث، لا مجرد الإضافة إليه: اختبار السلامة البنيوية
الخاص بالقسم ٩.٥ نفسه ("`PROGRAMS_BY_COUNTRY` يسرد بدقة الدول المعروف أنها تدير أكثر من برنامج واحد")
كان يفترض سابقاً `JO: 1, OM: 1, QA: 1, BH: 1, KW: 1` -- وأصبح الآن بشكل صحيح `JO: 2, OM: 3, QA: 2,
BH: 3, KW: 2`، وجرى تحديثه لا تركه راكداً، إذ إن تأكيداً ناجحاً لكنه خاطئ يمثّل هو نفسه مخالفة لسجل
القرار ٨.٧ بمجرد تغيّر الحقيقة التي يؤكدها.

### ١٠.٩ الواجهة -- تعميم أسئلة التوجيه على كل دولة، وتوسيع تجميع المحفظة

صف أزرار سؤال توجيه البرنامج (القسمان ٨.٩ و٩.٦) عُمِّم مسبقاً ليشمل "أي دولة تحتوي قائمة
`PROGRAMS_BY_COUNTRY` الخاصة بها أكثر من برنامج واحد" بدلاً من فحص مُشفَّر للسعودية والإمارات فقط --
لذا لم تحتج هذه المرحلة **أي منطق توجيه جديد إطلاقاً**، بل فقط مُدخلات برامج جديدة وفروع عرض مُدخلات
جديدة لكل برنامج. حصل كل برنامج من البرامج السبعة الجديدة على نموذج مُدخلات خاص به (مفاتيح تبديل
نعم/لا ثنائية للبرامج الأربعة القائمة على تأهل تخصيص الحصة، ومُدخلا بوابة أهلية الفئة، وحقل نسبة
مئوية للبرنامجين القائمين على تفضيل السعر، وتفصيل إنفاق قطري كامل بخمسة حقول زائد مربعي اختيار
لبرنامج `qa-icv-tawteen`)، وكتلة عرض نتيجة خاصة به (بطاقة نتيجة جديدة لـ`spend-set-aside-target`
تُظهر الحصة المستهدفة وتأهل هذا المورّد، وبطاقة نتيجة جديدة لـ`modified-icv-score` تُظهر الدرجة
النهائية وتفصيل الأركان الخمسة وملاحظة بلغة واضحة حول المعدِّلات المطبَّقة)، وإدخالاً خاصاً به في
لوحة `MECHANISM_VALUE_FRAMING` ثنائية الجانب (القسم ٩.٦) للنوعين الجديدين من الآليات -- تلقائياً
للبرنامجين الجديدين اللذين يستخدمان `spend-set-aside-target` والبرنامج الذي يستخدم
`modified-icv-score`، دون إضافة يدوية ثلاث مرات. اكتسب عمود "النتيجة المرجحة" في جدول المحفظة على
مستوى العميل فرعاً جديداً لـ`setAsideQualifyingSharePct`، بحيث تعرض مجموعة `spend-set-aside-target`
قراءة حصتها المؤهلة الخاصة بدلاً من الانتقال إلى شرطة غير مفيدة. حُدِّث أيضاً نص المقدمة الرئيسية
ونص إخلاء المسؤولية في تذييل الصفحة ليذكرا جهات الدول السبع كلها (PTLC، وicv.qa، والجهتين المختصتين
في البحرين والكويت، إلى جانب LCGPA وMoIAT ووزارة الأردن) بدلاً من الدول الثلاث الأصلية فقط -- نفس
انضباط الصدق الذي يتبعه هذا المستند نفسه، مُطبَّقاً على الصفحة التي يقرأها المستخدم الحقيقي أولاً.


## 11. تفكيك آلية مصر — افتتاح الجزء الثاني (١٥ سبتمبر ٢٠٢٦)

اختُتم الجزء الأول (دول الخليج والأردن، الأقسام ٨-١٠) بحصول كل الدول السبع الأصلية على آلية واحدة
موثّقة حقيقية على الأقل. أما الجزء الثاني ("التغطية خارج دول الخليج") فقد أُشير إليه صراحة في القسم ٧
أعلاه كغير مبدوء بعد. وبناءً على توجيه صاحب المنصة نفسه ("ابدأ بمصر، ثم تركيا، ثم المملكة المتحدة، ثم
الولايات المتحدة، ثم الصين")، افتتحت هذه المرحلة الجزء الثاني بمصر -- أول دولة تُضاف إلى نوع
`LocalContentCountry` منذ الدول السبع الأصلية للمحرك، وهي إحدى دول التوريد الحقيقية غير الخليجية
لشركة روابي نفسها (مقدمة سيناريو القسم ١ تذكر مصر بالفعل كدولة توريد حقيقية لروابي، إلى جانب الصين
وتركيا).

**قرار نطاق التغطية، مُدوَّن هنا لا في المحادثة فقط:** لا يسعى هذا المحرك إلى بناء آلية مسبقة لكل دولة
في العالم. فمعظم الدول لا تدير أي نظام محتوى محلي أو قيمة محلية مضافة على غرار دول الخليج والأردن على
الإطلاق، ما يعني أن فرض واحدة سيؤدي إما إلى اختلاق صيغة (سجل القرار ٨.٧) أو إلى ملء الاتحاد بعشرات
الإدخالات الفارغة "غير الموثّقة" التي لا تضيف قيمة حقيقية للقرار. تنمو التغطية عند الحاجة، وفق أولوية
الدول التي لعملاء ISC فيها تعرّض حقيقي للموردين -- وهو نفس المنطق القائم على الطلب المُستخدم بالفعل
لتحديد أي دولة خليجية حصلت على آلية ثانية أو ثالثة أولاً (استكمال الدول الخمس في القسم ١٠ نفسه). أي
دولة لم تُضَف بعد إلى `LocalContentCountry` تُحسَم عبر القيمة الوهمية المسبقة `'OTHER'` في الواجهة
(بناء القسم ٩ نفسه) إلى حالة صادقة "غير مشمولة بهذه الوحدة" -- سبب ثالث ومتمايز لعدم وجود رقم، إلى
جانب "غير موثّق" و"لا ينطبق"، وليس فجوة صامتة.

عُثر في هذه المرحلة على آليتين مصريتين حقيقيتين وموثّقتين ومختلفتين فعلياً، إضافة إلى إدخال واحد صادق
"غير موثّق بعد". تُعيد كلتا الآليتين الموثّقتين استخدام نوع الآلية القائم `price-preference-margin`
وصيغة الحساب المشتركة `computePricePreferenceMargin` -- لم تكن هناك حاجة لنوع آلية جديد أو صيغة حساب
مشتركة جديدة، بخلاف إضافتي `spend-set-aside-target` و`modified-icv-score` في الأقسام ٨-١٠.

### ١١.١ تصنيف الأنواع الستة ← ربطها بالبرامج المصرية

| البرنامج | `mechanismType` | الحالة |
|---|---|---|
| `eg-price-preference` (البرنامج الافتراضي) | `price-preference-margin` | موثّق: القانون رقم ٥ لسنة ٢٠١٥ (بصيغته المعدَّلة بالقانون رقم ٩٠ لسنة ٢٠١٨) -- بوابة حدّية عند ٤٠٪ محتوى محلي، ثم تفضيل سعري ثابت بنسبة ١٥٪ في تقييم مشتريات الجهات الحكومية والشركات العامة |
| `eg-oil-gas-price-preference` | `price-preference-margin` | موثّق: أولوية المقاول المحلي بموجب اتفاقيات تقاسم الإنتاج (PSA) -- تفضيل سعري بهامش ١٠٪ للمقاولين المحليين المؤهلين، تديره شركات التشغيل في قطاع البترول تحت إشراف وزارة البترول |
| `eg-auto-local-content` | `not-yet-sourced` | هدف وطني حقيقي ومؤرَّخ مُفصَح عنه (٦٠٪ محتوى محلي، نسخة مُجدَّدة من برنامج AIDP)، دون صيغة منشورة على مستوى المورّد |

### ١١.٢ `eg-price-preference` -- تفضيل سعري، بوابة حدّية (شكل مختلف فعلياً)

المصدر: يشترط القانون المصري رقم ٥ لسنة ٢٠١٥ ("في شأن تفضيل المنتجات المصرية في العقود الحكومية"،
بصيغته المعدَّلة بالقانون رقم ٩٠ لسنة ٢٠١٨) أن يحتوي العطاء على نسبة لا تقل عن ٤٠٪ من المحتوى المحلي
المصري المنشأ، من القيمة التقديرية للمشروع، ليُعتبر "منتجاً مصرياً"؛ وتحصل العطاءات المصرية المؤهلة
عندئذٍ على تفضيل سعري ثابت بنسبة ١٥٪ مقابل العطاءات الأجنبية عند التقييم (بحسب دليل الحكومة الأمريكية
الرسمي "مصر -- البيع للقطاع العام" على trade.gov). هذه **بوابة حدّية، وليست تدرجاً مستمراً** -- خروج
حقيقي عن سلوك نفس نوع الآلية `price-preference-margin` في الأردن وعُمان والسعودية (حيث يتدرّج الهامش
تناسبياً مع الحصة المصنّعة محلياً من ٠٪ إلى ١٠٠٪). يُنمذِج هذا المحرك الفارق بصدق بدلاً من دمج مصر ضمن
افتراض التدرّج المستمر: تُحوَّل نسبة المحتوى المصري المصرَّح بها إلى حصة ثنائية ١٠٠٪/٠٪ قبل تشغيل
الصيغة المشتركة، بنفس أسلوب التحويل الثنائي المُستخدم بالفعل لتفضيل سعر المنشآت الصغيرة والمتوسطة
البحرينية (القسم ١٠.٦) -- ثلاث قواعد تأهل واقعية مختلفة فعلياً (نسبة إنفاق في الأردن وعُمان، تصنيف
منشأة صغيرة/متوسطة في البحرين، وبوابة حدّية للمحتوى المحلي في مصر)، وصيغة حساب واحدة مشتركة، مُفصَح
عنها لكل برنامج على حدة وليست مفترَضة متطابقة.

- **قراءة المشتري** (الجهة الحكومية المناقِصة أو الشركة/المؤسسة العامة): حدّ تأهل واضح وثنائي -- إما
  أن يستوفي العطاء فعلياً معيار الـ٤٠٪ محتوى مصري ويحصل على كامل الميزة البالغة ١٥ نقطة، أو لا يستوفيه
  فيتنافس على أساس السعر/الجدارة الفنية وحدهما. لا غموض في احتساب "درجة جزئية" يحتاج المُقيِّم لحسمه
  حالة بحالة.
- **قراءة المورّد:** الرافعة الكاملة هي تجاوز خط الـ٤٠٪، لا التحسن التدريجي دونه -- مورّد عند ٣٨٪
  محتوى مصري يحصل على نفس التفضيل الصفري تماماً كمورّد عند ٥٪، فالسؤال ذو الدلالة للقرار هو ما إذا كان
  إغلاق فجوة محددة للوصول إلى ٤٠٪ يستحق العناء لهذه المناقصة تحديداً، لا مجرد رفع الرقم قليلاً.
- مثال تطبيقي مصغّر: مورّد مواد بناء مصري يقدّم عطاءً في مناقصة بنية تحتية حكومية ويصرّح بنسبة ٥٥٪
  محتوى مصري المنشأ (حديد تسليح وإسمنت مصدرهما محلي) → `egyptianContentSharePct: 55` → مؤهل (≥٤٠) →
  `locallyManufacturedSharePct: 100`، `effectiveBidDiscountPct: 15` (كامل الهامش) → تُرجع
  `recommendLocalContentAction` قيمة `null` (بلغ بالفعل أقصى ميزة متاحة، لا شيء لتوصيته). المورّد
  نفسه عند ٢٥٪ محتوى مصري (استيراد جزء أكبر من المواصفة) → غير مؤهل →
  `locallyManufacturedSharePct: 0`، `effectiveBidDiscountPct: 0` → تنطلق التوصية: توريد محتوى مصري
  إضافي كافٍ لتجاوز حاجز الـ٤٠٪ قبل موعد هذه المناقصة، أو (البديل الصادق) قبول أن يتنافس العطاء
  بمزاياه الفنية والتجارية وحدها دون أي وسادة سعرية.

### ١١.٣ `eg-oil-gas-price-preference` -- مشترٍ وأساس قانوني وهامش مختلفون فعلياً

المصدر: يشترط نموذج اتفاقية تقاسم الإنتاج (PSA) المصري -- الإطار التعاقدي المعياري الحاكم لاستكشاف
وإنتاج النفط والغاز، بموجب قانون المناجم والمحاجر لعام ١٩٥٣، وقانون ضمانات وحوافز الاستثمار لعام
١٩٩٧، وشروط اتفاقيات تقاسم الإنتاج الخاصة بوزارة البترول -- أن تمنح الشركات المشغِّلة (شركات النفط
الدولية) الأولوية للمقاولين والمقاولين من الباطن المصريين المحليين "عندما يكون أداؤهم مماثلاً للأداء
الدولي، ولا تتجاوز أسعار خدماتهم أسعار المقاولين الآخرين بأكثر من ١٠٪". هذه آلية حقيقية وموثّقة
ومختلفة فعلياً عن `eg-price-preference` أعلاه: مشترٍ مختلف (شركات التشغيل في قطاع البترول تحت إشراف
وزارة البترول، مقتصرة على مشتريات شبه حكومية/مملوكة للدولة فقط -- وليس جهات المشتريات الحكومية
العامة)، وأساس قانوني مختلف (شروط اتفاقية تقاسم الإنتاج، وليس القانون ٥ لسنة ٢٠١٥)، وهامش مختلف (١٠٪
وليس ١٥٪) -- نفس نمط "آلية مختلفة فعلاً، وليست نسخة" المُطبَّق سابقاً على توازن الإماراتية مقابل ICV
(القسم ٩) وتفضيل مجموعة OQ العُمانية مقابل ICV العام (القسم ١٠.٤).

- **قراءة المشتري** (شركة التشغيل بموجب اتفاقية تقاسم الإنتاج / شركة النفط الدولية): نطاق سعري
  مُفصَح عنه ومحدود (حتى ١٠٪ فوق أقل عطاء) يُفضَّل ضمنه القدرة المحلية عمداً، ما يحافظ على تنافسية
  قدرات خدمات حقول النفط المصرية دون فرض حصة إلزامية للمحتوى المحلي على العقد نفسه.
- **قراءة المورّد:** بالنسبة لمقاول خدمات حقول نفط مصري يتمتع بأداء مماثل فعلياً للمنافسين الدوليين،
  يمثّل النطاق السعري البالغ ١٠ نقاط وسادة حقيقية وقابلة للقياس ضد التعرّض لمنافس سعري أجنبي أرخص --
  حاجز التأهل هو صفة فئة المقاول والأداء المماثل، وليس نسبة من محتوى العطاء.
- مثال تطبيقي مصغّر: مقاول خدمات حقول نفط مصري يقدّم عطاءً في عقد دعم حفر بموجب اتفاقية تقاسم إنتاج،
  ومؤكَّد كمقاول محلي مؤهل (أداء مماثل، سعر ضمن نطاق الـ١٠٪) في سياق مشتريات شبه حكومي/مملوك للدولة →
  `isLocalEgyptianContractor: true` → `locallyManufacturedSharePct: 100`،
  `effectiveBidDiscountPct: 10` -- تُرجع `recommendLocalContentAction` قيمة `null` (مؤهل بالفعل، لا
  شيء لتوصيته). المقاول نفسه دون تأكيد صفة الأداء المماثل/النطاق السعري →
  `isLocalEgyptianContractor: false` → `effectiveBidDiscountPct: 0`، وتنطلق التوصية: السعي لإثبات
  الحقائق الأساسية للتأهل (قياس الأداء، الموقع السعري ضمن النطاق) بدلاً من افتراض كفاية التسجيل وحده.
  عند تطبيقه على مشتريات حكومية بدلاً من شبه حكومية/مملوكة للدولة → "لا ينطبق" (هذا البرنامج موثّق
  كخاص بشركات التشغيل بموجب اتفاقية تقاسم الإنتاج، لا المشتريات الحكومية العامة).

### ١١.٤ ما لم يُنمذَج عمداً، تجنباً للاختلاق

- **هدف المحتوى المحلي المُجدَّد لصناعة السيارات** (`eg-auto-local-content`، "غير موثّق"): أعلنت وزارة
  الصناعة والتجارة والصناعات الصغيرة المصرية عن نسخة مُجدَّدة من برنامج تطوير صناعة السيارات (AIDP)
  تستهدف ٦٠٪ محتوى محلي و١٠٠ ألف مركبة سنوياً (بحسب تقرير EnterpriseAM في مارس ٢٠٢٦)، لتحل محل هدف
  البرنامج السابق البالغ ٣٥٪/١٠ آلاف مركبة الذي وصفه التقرير نفسه بأنه غير عملي. لم يُعثر على صيغة
  حساب منشورة على مستوى المصنّع أو المورّد للهدف الجديد -- ويُذكر أن هيكل الحوافز نفسه غير منشور،
  وينتظر إعلاناً رسمياً. يُفصَح عنه كهدف وطني حقيقي ومؤرَّخ بدلاً من تخمينه، وهي نفس معالجة سجل القرار
  ٨.٧ المطبَّقة سابقاً على برنامجي GAMI وLIKT السعوديين (القسم ٨.٦) والبرامج الوطنية العامة لعُمان
  وقطر والبحرين والكويت (القسم ١٠.٧).
- **تعارض الاستشهاد بين القانون ٨٩ لسنة ١٩٩٨ والقانون ١٨٢ لسنة ٢٠١٨**: يستشهد دليل trade.gov الرسمي
  للحكومة الأمريكية بقانون المناقصات والمزايدات رقم ٨٩ لسنة ١٩٩٨ (القديم) كحاكم لإجراءات المشتريات
  المصرية العامة، في حين يذكر ملخص قانوني منفصل (riad-riad.com) أن القانون رقم ١٨٢ لسنة ٢٠١٨ حلّ محل
  ذلك القانون القديم. تُفصح هذه المرحلة عن هذا التعارض بدلاً من حسمه بافتراض -- وهي نفس المعالجة
  المطبَّقة سابقاً على استشهاد الأردن غير المؤكد بالنظام الحاكم (ملاحظة مصدر القسم ١٠.٢ نفسه).
- **عدم وجود جهة اعتماد/إدارة مخصصة** لتحديد نسبة الـ٤٠٪ للمحتوى المحلي ضمن `eg-price-preference` لم
  تُحدَّد في مصادر هذا البحث (بخلاف الجهات المعتمِدة المسمّاة لدى LCGPA وMoIAT وicv.qa في الدول
  الأخرى) -- يُفصَح عنها كمسألة مفتوحة، لا كافتراض.
- **استثناء وزارة الدفاع والداخلية والإنتاج الحربي والمخابرات العامة** من `eg-price-preference` (بحسب
  trade.gov: مشتريات هذه الجهات مستثناة من تفضيل القانون ٥ لسنة ٢٠١٥) مُفصَح عنه ضمن
  `sourceNoteEn`/`sourceNoteAr` الخاصة بالبرنامج نفسه، لكنه غير مُنمذَج بشكل منفصل كسياق مشتريات
  متمايز -- لا يوجد سياق مشتريات خاص بكل جهة موثّق في أي مكان آخر من هذا الملف أيضاً، فهذا متسق مع
  نطاق المحرك القائم، وليس فجوة جديدة.
- **جهة إدارة مؤكَّدة لأولوية المقاول المحلي بموجب اتفاقية تقاسم الإنتاج**: توصية المقال المصدر نفسه
  بأن تُنشئ مصر "إدارة متخصصة وفريدة في وزارة البترول لإدارة المحتوى المحلي" تعني ضمناً أن مثل هذه
  الإدارة غير مؤكد وجودها بعد -- يُفصَح عن ذلك كمسألة مفتوحة، لا كافتراض بوجودها.

### ١١.٥ سجل اختبار الإجهاد -- افتتاح مصر (١١ اختباراً جديداً، جميعها ناجحة؛ إجمالي هذا الملف من ١٠٩ إلى ١٢٠)

| الآلية | الاختبار السهل | الاختبار الأصعب | اختبار الحدّ |
|---|---|---|---|
| `eg-price-preference` | ٤٥٪ محتوى مصري (فوق حدّ الـ٤٠٪) → كامل الهامش ١٥ نقطة عبر حصة ثنائية ١٠٠٪ | ٣٩.٩٪ محتوى مصري (أقل قليلاً من الحدّ) → خصم صفري، وليس جزئياً -- يُثبت أن هذه بوابة، لا تدرّج مستمر | عند ٤٠.٠٪ تماماً → مؤهل (≥، وليس >)؛ دون حصة مُدخلة → `null` صادقة، دون افتراض عدم التأهل |
| `eg-oil-gas-price-preference` | مقاول محلي مؤهل بموجب اتفاقية تقاسم الإنتاج → كامل الهامش ١٠ نقاط عبر حصة ثنائية ١٠٠٪ | غير مؤهل → خصم صفري، وليس جزئياً | دون حالة مقاول مُدخلة → حصة `null` صادقة |
| `eg-auto-local-content` | -- | تُرجع "بيانات غير كافية" مع الإفصاح عن سياق ٦٠٪/AIDP الحقيقي بكلتا اللغتين، دون صيغة مورّد مختلقة | -- |
| الانطباق | -- | يُحسم `eg-price-preference` بشكل صحيح كـ"لا ينطبق" على المشتريات التجارية الخاصة؛ ويُحسم `eg-oil-gas-price-preference` بشكل صحيح كـ"لا ينطبق" على المشتريات الحكومية (خاص بشركات التشغيل بموجب اتفاقية تقاسم الإنتاج، لا المشتريات الحكومية العامة) | -- |
| التوجيه الافتراضي | يُؤكَّد أن `eg-price-preference` هو `DEFAULT_PROGRAM_BY_COUNTRY.EG`، بنفس اتفاقية "البرنامج الأصلي/الأوسع هو الافتراضي" المُطبَّقة على كل دولة أخرى | -- | -- |
| البنيوي | اختبار الفحص البنيوي القائم للدول الثماني (اختبار القسم ١٠.٨ نفسه، يشمل الآن EG أيضاً) يؤكد أن `PROGRAMS_BY_COUNTRY.EG` يضم ٣ برامج وأن كل واحد منها يعود إلى `EG` نفسها في `PROGRAMS` | -- | -- |

### ١١.٦ الواجهة -- مصر تندمج في التوجيه المعمَّم القائم دون أي منطق جديد

نفس منطق "أي دولة تضم قائمة `PROGRAMS_BY_COUNTRY` الخاصة بها أكثر من برنامج تحصل على صف سؤال التوجيه"
(الأقسام ٨.٩ و٩.٦ و١٠.٩) لم يتطلب **أي منطق توجيه جديد إطلاقاً** لمصر -- اكتسب `COUNTRY_ORDER`
و`COUNTRY_FLAG` إدخال `EG`، واحتاج `PROGRAM_LABELS` و`MECHANISM_VALUE_FRAMING` (معمَّم مسبقاً حسب
`mechanismType`، لا يحتاج تغييراً لأن كلتا الآليتين المصريتين تُعيدان استخدام `price-preference-
margin`) و`hasMeaningfulResult` (معمَّم مسبقاً أيضاً حسب `mechanismType`) إلى إضافات التسميات فقط، لا
فروعاً جديدة. حصلت مصر على كتلتي إدخال خاصتين بها: حقل نسبة مئوية لـ`eg-price-preference` (مع تلميح
مضمَّن يُفصح عن شكل بوابة الـ٤٠٪/الهامش الثابت ١٥٪، حتى لا يُترك المستخدم ليستنتج بنفسه سبب ظهور خصم
صفري عند إدخال ٣٩٪) ومفتاح تبديل نعم/لا للتأهل لـ`eg-oil-gas-price-preference`، بنفس نمط المفتاح
الثنائي المُستخدم بالفعل لصفة المنشأة الصغيرة والمتوسطة البحرينية وتسجيل المقاول الأردني وتسجيل
المورّد الكويتي. جرى تصحيح تعليق "OTHER" غير المحدَّث الذي كان يذكر مصر كمثال لدولة *لم تُمثَّل بعد*
في هذا المحرك (نص القسم ٩ الأصلي نفسه) في نفس المرحلة التي جعلتها قابلة للتمثيل -- نفس انضباط "لا يجوز
ترك إفصاح خاطئ معروف دون تصحيح" (سجل القرار ٨.٧ / قاعدة السجل رقم ١٢) المُطبَّق بالفعل على حساب عدد
اختبارات هذا المستند نفسه. حُدِّث أيضاً نص المقدمة الرئيسية، ونص الإفصاح عن "غير مشمولة بهذه الوحدة"،
ونص إخلاء المسؤولية في تذييل الصفحة، ليذكر الجميع "ثماني دول" ويُسمِّي قانون/وزارة مصر المختصة إلى
جانب الجهات السبع الأخرى، بدلاً من ترك مصر موصوفة كدولة غير مشمولة كمثال في نص يقرأه مستخدم حقيقي
أولاً.


## ١٢. تفكيك آلية تركيا — تكملة الجزء الثاني (١٦ سبتمبر ٢٠٢٦)

المحطة الثانية في ترتيب الدول الصريح الذي حدده مالك المنصة ("مصر، ثم تركيا، ثم المملكة المتحدة، ثم
الولايات المتحدة، ثم الصين"). `TR` هي الدولة التاسعة ضمن `LocalContentCountry`، والثانية من بين دول
التوريد غير الخليجية التي سمّتها روابي صراحةً (مقدمة السيناريو في القسم ١) لتحصل على آلية حقيقية
وموثّقة.

عُثر في هذه المرحلة على آلية تركية واحدة حقيقية وموثّقة وقابلة للحساب (`tr-price-preference`)، إلى
جانب إدخال واحد صادق "غير موثّق بعد" مع سياق غني مُفصَح عنه (`tr-defense-offset`). كما عُثر على نظام
تركي حقيقي ثالث (اعتماد المحتوى المحلي الشمسي ضمن YEKDEM) وتقرر عمداً **عدم** نمذجته كبرنامج -- انظر
١٢.٤. يُعيد كلا البرنامجين التركيين استخدام نوع الآلية القائم `price-preference-margin` والدالة
المشتركة `computePricePreferenceMargin` -- لم يتطلب الأمر نوع آلية جديداً أو حساباً مشتركاً جديداً،
بنفس نمط "إعادة الاستخدام لا إعادة الاختراع" المتّبع بالفعل مع كل دولة في هذا الملف.

### ١٢.١ تصنيف الأنواع الستة ← خريطة البرامج التركية

| البرنامج | `mechanismType` | الحالة |
|---|---|---|
| `tr-price-preference` (البرنامج الافتراضي) | `price-preference-margin` | موثّق: قانون المشتريات العامة رقم ٤٧٣٤، المادة ٦٣(ج) -- تفضيل سعري يصل إلى ١٥٪ لمزايدي السلع المحلية ("يرلي مالي")، إلزامي (وليس تقديرياً) للسلع متوسطة/عالية التقنية المدرجة |
| `tr-defense-offset` | `not-yet-sourced` | سياق وطني حقيقي ومؤرَّخ مُفصَح عنه (دليل تعويضات SSB لعام ٢٠٢٢)، لكن مصدرين يختلفان حول رقم "٧٠٪" الرئيسي ولا يذكر أي منهما عتبة تعاقدية مؤكدة أو صيغة على مستوى المورّد |

### ١٢.٢ `tr-price-preference` -- تفضيل سعري بتدرّج مستمر (كالأردن وعُمان، لا كبوابة مصر الحدّية)

المصدر: يتيح قانون المشتريات العامة التركي رقم ٤٧٣٤، المادة ٦٣(ج)، لجهات التعاقد منح مزايدين يعرضون
سلعاً محلية ميزة سعرية تصل إلى ١٥٪ في تقييم مناقصات توريد السلع؛ وبالنسبة للسلع المدرجة في القائمة
الرسمية للمنتجات الصناعية متوسطة أو عالية التقنية، يصبح هذا التفضيل إلزامياً وليس تقديرياً. يُطبَّق
التفضيل بإضافة مبلغ الميزة المحسوبة إلى أسعار المزايدين غير المحليين المنافسين لأغراض التقييم، وليس
بخصم من سعر المزايد المحلي نفسه (وفق ملخص قرار KİK، salimdemirel.com.tr)؛ وتُعتمد حالة السلعة
المحلية لكل بند عبر "وثيقة يرلي مالي" (تصدرها غرف التجارة/الصناعة المحلية أو معهد المواصفات التركي
ضمن إطار وزارة الصناعة والتقنية)، وتُطبَّق بنداً بنداً في المناقصات الجزئية/متعددة البنود -- **آلية
تناسبية، وليست كلاً أو لا شيء**، وهي الشكل المعاكس لبوابة مصر الحدّية عند ٤٠٪ (القسم ١١.٢). يُنمذَج
هذا المحرك تركيا بنفس أسلوبه القائم مع الأردن وعُمان: تُدرّج حصة السلع المحلية المعتمدة من قيمة العطاء
الخصم تدريجياً من ٠٪ حتى السقف الكامل ١٥٪، بدلاً من تحويل نسبة مئوية إلى حصة ثنائية تأهل/عدم تأهل كما
تفعل آليتا مصر والبحرين.

**رقم بديل محتمل، جرى تقصّيه وحسمه، لا تركه مفتوحاً:** أشار عنوان أحد المصادر (satinalmadergisi.com:
"هل تُطبَّق ميزة سعرية بنسبة ٧٪ على مقدمي السلع المحلية؟") إلى احتمال وجود رقم ٧٪ ينافس سقف الـ١٥٪.
وقد حسم الاطلاع على المصدر كاملاً هذا الالتباس: يصف المقال **قراراً لهيئة المشتريات العامة (KİK) ضد
جهة تعاقد طبّقت ٧٪ فقط بدلاً من ١٥٪ الإلزامية** على معدات طبية عالية التقنية -- وهي مخالفة امتثال
موثّقة، لا نسبة قانونية ثانية قائمة فعلاً. يُفصَح عن هذا هنا كتعارض تم حسمه (توصّل البحث إلى الإجابة)،
بخلاف التباس تعويضات SSB التركية أدناه (القسم ١٢.٣)، الذي يبقى مفتوحاً فعلاً لأن لا مصدر يحسمه.

- **قراءة المشتري** (الجهة الحكومية أو المنشأة الاقتصادية المملوكة للدولة المتعاقدة): هامش سعري محدد
  إدارياً (٠-١٥٪، أو ١٥٪ إلزامية للسلع متوسطة/عالية التقنية) يُفضِّل السلع المحلية المعتمدة دون استبعاد
  المزايدين الأجانب كلياً -- ويُحدَّد السقف الدقيق لكل مناقصة في وثائقها الخاصة، لا في هذا المحرك.
- **قراءة المورّد:** الحصة المعتمدة من قيمة هذا العطاء تحديداً هي الرافعة الكاملة، تُطبَّق تناسبياً
  (لا كبوابة حدّية) وبنداً بنداً في المناقصات متعددة البنود -- فمورّد معتمَد جزئياً في بعض البنود يحصل
  على ميزة جزئية حقيقية في تلك البنود، بخلاف بوابة مصر الحدّية عند ٤٠٪ الكلية.
- مثال تطبيقي مصغّر: مورّد آلات تركي يتقدّم بعطاء لمناقصة معدات لمنشأة اقتصادية مملوكة للدولة، حائز على
  اعتماد وثيقة يرلي مالي يغطي ٦٠٪ من قيمة العطاء (والباقي مكوّنات إلكترونية مستوردة) →
  `bidValueDomesticCertifiedPct: 60` → `preferenceMarginPct: 15`، `locallyManufacturedSharePct: 60`،
  `effectiveBidDiscountPct: 9` (١٥٪ × ٦٠٪) -- تُقيَّم العطاءات غير المحلية المنافسة كأنها أغلى بـ٩
  نقاط. المورّد نفسه بحيازة اعتماد محلي كامل (١٠٠٪) → `effectiveBidDiscountPct: 15`، السقف الكامل --
  وتُرجع `recommendLocalContentAction` قيمة `null` (لا شيء متبقٍ للتحسين). عند التطبيق على مشتريات
  `private-commercial` → "لا ينطبق" (القانون ٤٧٣٤ آلية مشتريات عامة، موثّقة للمشترين الحكوميين
  والمنشآت الاقتصادية المملوكة للدولة فقط).

### ١٢.٣ `tr-defense-offset` -- غير موثّق بعد، مع تعارض حقيقي مفتوح بين المصادر

المصدر: يُدار نظام التعويضات الدفاعية التركي عبر رئاسة الصناعات الدفاعية (SSB)، التي حلّت محل الأمانة
العامة للصناعات الدفاعية (SSM) ضمن إعادة الهيكلة التنفيذية لعام ٢٠١٨؛ وصدر دليل تعويضات جديد عام ٢٠٢٢
ليحل محل دليل سابق يعود لعام ٢٠١١. يختلف مصدران حقيقيان منشوران باحترافية حول الالتزام الرئيسي: يذكر
mondaq.com أن على المقاولين/المقاولين من الباطن الأجانب الالتزام بـ"مسؤولية تعويض لا تقل عن ٧٠٪ من
قيمة العرض" (مدعومة بضمان ٦٪ من إجمالي الالتزامات)؛ بينما تقدم مقارنة herdemlaw.com الأكثر تفصيلاً بين
دليلي ٢٠١١ و٢٠٢٢ عتبات فرعية أضيق -- حد أدنى ٢١٪ من قيمة العقد كحصة عمل محلي/منشآت صغيرة ومتوسطة، وشرط
أن يُنجَز ٧٠٪ من العمل المعتمد ضمن EYDEP تحديداً (وليس ٧٠٪ من العرض كاملاً) بواسطة منشآت تركية صغيرة
ومتوسطة، وحد أدنى ٢٪ من قيمة العرض كالتزام اكتساب تقنية، وعقوبة تدرجية عند التقصير (٦٪ من عجز الفترة
الانتقالية، ترتفع إلى +٥٠٪ من الالتزامات المتبقية في مرحلة ممتدة، وعقوبة نهائية ٢٥٪ على أي التزام لم
يُنجَز).

**يُفصَح عن هذا الالتباس دون حسمه بافتراض** -- بنفس المعالجة المطبَّقة سابقاً على تعارض استشهاد مصر
بين القانونين ٨٩/١٩٩٨ و١٨٢/٢٠١٨ (القسم ١١.٤) واستشهاد الأردن غير المؤكد بالنظام (القسم ١٠.٢): لا
يتضح من أي من المصدرين ما إذا كان رقم mondaq "٧٠٪ من قيمة العرض" ورقم herdemlaw "٧٠٪ من العمل المعتمد
ضمن EYDEP" يصفان الالتزام ذاته بتسميتين مختلفتين، أم رقمين منفصلين فعلاً. لا يذكر أي من المصدرين عتبة
تعاقدية مؤكدة مماثلة لعتبة توازن الإماراتية الواضحة (١٠ ملايين درهم/دولار، القسم ٩.٣)، ولم يُعثر على
صيغة حساب على مستوى المورّد (بخلاف التزام على مستوى المقاول الرئيسي). يُبقى هذا صادقاً كـ"غير موثّق
بعد" -- سجل القرار ٨.٧ -- مع الإفصاح عن هذا السياق الحقيقي والمؤرَّخ في `reasonEn`/`reasonAr` بدلاً من
صيغة مخمَّنة أو تسوية مفترَضة.

### ١٢.٤ ما لم يُنمذَج عمداً، تجنباً لاختلاق ملاءمة تصنيفية

- **نظام YEKDEM للمحتوى المحلي الشمسي**: يشترط برنامج دعم مصادر الطاقة المتجددة التركي (YEKDEM) على
  مصنّعي الألواح الشمسية بلوغ محتوى محلي ≥٥٥٪ (عبر إطار وزارة الصناعة والتقنية المرجَّح لكل مكوّن --
  الخلايا، الزجاج، الإطارات الألمنيومية، علب/صمامات التوصيل، مواد التغليف/الطبقة الخلفية، والعمالة
  المحلية) للوصول إلى تعرفات تغذية مميزة، معتمَد عبر وثيقة يرلي مالي نفسها. هذا نظام محتوى محلي تركي
  حقيقي وموثّق -- لكنه يعتمد **مصنّعاً للوصول إلى دعم/تعرفة**، وليس **مورّداً يتقدم بعطاء لمناقصة مشترٍ
  محدد**، وبالتالي لا يتناسب مع تصنيف ProcurementContext الخاص بالمشتري في هذا المحرك
  (`government`/`semi-government-soe`/`private-commercial`) كما تفعل كل آلية أخرى منمذجة في هذا
  الملف. بدلاً من إقحامه ضمن ProcurementContext لا ينطبق عليه فعلياً، أو إسقاطه صامتاً، يُفصَح عن هذا
  هنا وضمن `sourceNoteEn`/`sourceNoteAr` الخاصة بـ`tr-defense-offset` كقرار نطاق صريح -- بنفس انضباط
  "الإفصاح، لا الصمت" المُتّبع في كل مكان آخر من هذا الملف بشأن ما يُستبعد عمداً.
- **تعارض رقم "٧٠٪" بين مصدري دليل تعويضات SSB** (القسم ١٢.٣) وغياب عتبة تعاقدية مؤكدة له، يُفصَح
  عنهما دون حسمهما بافتراض.
- **لم يُعثر على نسبة خاصة بالمنشآت الصغيرة والمتوسطة تختلف عن السقف العام ١٥٪** ضمن `tr-price-
  preference` في هذه المرحلة البحثية، بخلاف تفضيل البحرين الخاص بالمنشآت الصغيرة والمتوسطة -- يُفصَح
  عن ذلك كمسألة مفتوحة، لا كافتراض بعدم وجودها.

### ١٢.٥ سجل اختبار الإجهاد -- تكملة تركيا (٩ اختبارات جديدة، جميعها ناجحة؛ إجمالي هذا الملف من ١٢٠ إلى ١٢٩)

| الآلية | الاختبار السهل | الاختبار الأصعب | اختبار الحدّ |
|---|---|---|---|
| `tr-price-preference` | ٤٠٪ محتوى معتمد محلياً → خصم تناسبي ٦ نقاط (١٥٪ × ٤٠٪) | ٠٪ و١٠٠٪ محتوى معتمد محلياً -- الحالتان الأصعب، صفر والسقف الكامل ١٥ نقطة | دون حصة مُدخلة → `null` صادقة، دون افتراض صفر؛ عند ١٠٠٪ تماماً → `recommendLocalContentAction` تُرجع `null` (لا شيء متبقٍ للتحسين) |
| الانطباق | يُحسم `tr-price-preference` بشكل صحيح كـ"ينطبق" على `semi-government-soe` (المادة ٢ من القانون ٤٧٣٤ تشمل المنشآت الاقتصادية المملوكة للدولة، بخلاف نطاق الأردن الحكومي فقط) | يُحسم `tr-price-preference` بشكل صحيح كـ"لا ينطبق" على المشتريات التجارية الخاصة | -- |
| `tr-defense-offset` | -- | تُرجع "بيانات غير كافية" مع الإفصاح عن تعارض رقم ٧٠٪ بكلتا اللغتين، دون تسوية مفترَضة؛ يُؤكَّد وجود إفصاح YEKDEM الصريح غير المُنمذَج في كلا `sourceNoteEn`/`sourceNoteAr` | -- |
| التوجيه الافتراضي | يُؤكَّد أن `tr-price-preference` هو `DEFAULT_PROGRAM_BY_COUNTRY.TR`، بنفس اتفاقية "البرنامج الأصلي/الأوسع الموثّق هو الافتراضي" المُطبَّقة على كل دولة أخرى | -- | -- |
| البنيوي | اختبار الفحص البنيوي القائم (يشمل الآن الدول التسع كلها) يؤكد أن `PROGRAMS_BY_COUNTRY.TR` يضم برنامجين وأن كل واحد منهما يعود إلى `TR` نفسها في `PROGRAMS` | -- | -- |

### ١٢.٦ الواجهة -- تركيا تندمج في التوجيه المعمَّم القائم دون أي منطق جديد

نفس منطق "أي دولة تضم قائمة `PROGRAMS_BY_COUNTRY` الخاصة بها أكثر من برنامج تحصل على صف سؤال التوجيه"
(الأقسام ٨.٩ و٩.٦ و١٠.٩ و١١.٦) لم يتطلب **أي منطق توجيه جديد إطلاقاً** لتركيا -- اكتسب `COUNTRY_ORDER`
و`COUNTRY_FLAG` إدخال `TR`، واحتاج `PROGRAM_LABELS` فقط (معمَّم مسبقاً حسب `mechanismType` عبر
`MECHANISM_VALUE_FRAMING` و`hasMeaningfulResult`) إلى إضافات التسميات، لا فروعاً جديدة. حصلت تركيا
على كتلة إدخال جديدة واحدة: حقل نسبة مئوية لـ`tr-price-preference` (مع تلميح مضمَّن ثنائي اللغة يُفصح
عن شكل "حتى ١٥٪/إلزامي للسلع عالية التقنية"، بنفس نمط حقل بوابة مصر) -- ولا يحتاج `tr-defense-offset`
إلى أي كتلة إدخال إطلاقاً، لأن `mechanismType` الخاص به `not-yet-sourced` تلتقطه دالة
`assessSupplierLocalContent` عبر فحصها الأعلى-مستوى القائم قبل قراءة أي مُدخل، بنفس نمط الصفر-مُدخلات
المُتّبع بالفعل مع `eg-auto-local-content` و`om-icv` وكل برنامج آخر "غير موثّق بعد" في هذا الملف. جرى
تصحيح تعليق "OTHER" غير المحدَّث (الذي كان يذكر تركيا كمثال لدولة غير قابلة للتمثيل بعد) في نفس المرحلة
التي جعلتها قابلة للتمثيل -- نفس انضباط "لا يجوز ترك إفصاح خاطئ معروف دون تصحيح" (سجل القرار ٨.٧ / قاعدة
السجل رقم ١٢) المُطبَّق بالفعل أثناء مرحلة مصر (القسم ١١.٦). حُدِّث أيضاً نص المقدمة الرئيسية، ونص
الإفصاح عن "غير مشمولة بهذه الوحدة"، ونص التذييل/المتن، ليذكر الجميع "تسع دول" ويُسمِّي قانون/هيئة
تركيا المختصة (KİK) إلى جانب الجهات الثماني الأخرى، بدلاً من ترك تركيا موصوفة كدولة غير مشمولة كمثال
في نص يقرأه مستخدم حقيقي أولاً.
