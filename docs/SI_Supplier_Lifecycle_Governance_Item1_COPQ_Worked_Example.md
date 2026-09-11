# Supplier Lifecycle Governance — Item 1: Cost of Poor Quality (COPQ)
## Worked Example, Stress Test, and QA Record — Rawabi Manufacturing

**Build date:** 11 Sep 2026 (initial build); reworked and extended 11 Sep
2026 (Sections 7-8: real named-competitor benchmark + three cross-module
COPQ wiring points, per explicit client instruction to run Item 1 through
the same challenge standard Item 3 passed).
**Status:** Advisory + Operational tiers complete, tested, QA'd, and PUSHED
for the original 9-file build (4 commits, plus one immediate self-caught fix
commit; see the closure report for commit links) — VERIFIED post-push at
that time. The 11 Sep 2026 rework (Sections 7-8, 6 files touched, 19 new
tests, 62/62 passing) is code-complete and scoped-type-checked clean (see
Section 8.4 for the full verification record and its disclosed sandbox
constraint) but **PENDING PUSH** as of this doc revision — do not treat
Sections 7-8 as VERIFIED-on-`main` until a follow-up revision of this doc
confirms the push and CI status explicitly.
**Design source:** `ISC_SI_Scope_Expansion_Sourced_Design.md` sections 2.4 (COPQ
sourcing) and 2.8 (two-tier standing rule) — pasted verbatim by the client
11 Sep 2026, since this file does not exist in the live repo.

---

## 1. Sourced Methodology

**Model:** Prevention-Appraisal-Failure (PAF) — the ASQ quality-cost standard,
tracing to Juran.

| Category | Definition | Sources |
|---|---|---|
| Prevention | Training, process engineering — proactive spend to stop a defect happening | Autodesk, "Understanding COPQ in Manufacturing"; Six Sigma Study Guide, "Cost of Poor Quality" |
| Appraisal | Inspection, testing, audits — spend to catch a defect already occurred | SimplerQMS, "Cost of Quality" |
| Internal Failure | Scrap, rework, re-inspection — before the defect reaches the customer | The Lean Suite, "COPQ Calculation and Reduction Framework" |
| External Failure | Warranty claims, returns, penalties, lost sales — after the defect reaches the customer | (all four sources above) |

**Strategic relationship** (the standard PAF business case): investment in
Prevention reduces Internal- and External-Failure cost by a larger margin
than it costs. This module's narrative output references this relationship
honestly — it does not fabricate a client-specific ROI number for it, since
no platform client has a multi-period Prevention spend history yet to prove
the relationship against.

**Design implication applied:** every CAR already tracked has a natural PAF
categorization — a CAR driven by a quality escapement is an Internal- or
External-Failure cost; the corrective-action work itself is Appraisal-type
effort. See section 2 below for exactly where this module draws the honest
line between "close to free" (real, from existing data) and "would be
fabrication" (disclosed as a gap instead).

---

## 2. What Each PAF Bucket Actually Computes From

The live `CARRecord` type (id/category/rootCause/status/createdAt/closedAt)
carries no cost field and no "reached the customer" flag. Rather than invent
either, this module is explicit about what's real and what's a disclosed gap:

- **Internal / External Failure $** — real, when the caller links a
  `CARBusinessImpact` (Module 07's own `estimatedCostUSD` + `basis` shape,
  extended from supplier-level to CAR-level by this module — a deliberate
  adaptation, not a literal reuse of Module 07's exact structure) to a CAR.
  Classification defaults to Internal (a CAR is, by definition, a caught and
  managed issue) and is caller-overridable per CAR to External only when the
  defect is known to have reached the customer. An uncosted CAR contributes
  to count metrics only — never a guessed dollar figure.
- **Appraisal** — real effort data (CAR count + median days-to-close) always;
  a real dollar figure only if the caller supplies a per-CAR investigation
  rate (their own burdened cost, never a hardcoded industry number — Decision
  Record 8.7, same pattern as Module 03's client-configurable
  `heavyThresholdValue`).
- **Prevention** — CARs are reactive by construction; there is no CAR-derived
  signal for proactive spend. `INSUFFICIENT_DATA` unless the caller supplies
  a real known training/process-engineering spend figure. This is a disclosed
  gap, never a fabricated zero.

---

## 3. Two-Tier Design (section 2.8, applied)

| | Advisory (default) | Operational (opt-in) |
|---|---|---|
| Computation | `computeCOPQRollup()` / `detectCOPQAlert()` — pure functions | **Same functions**, zero duplicated logic |
| Persistence | None | `copq_ledger` table (new, `lib/db/src/schema/copqLedger.ts`) — **append-only**, never overwritten (client-confirmed persistence model) |
| Alerting | Computed and shown, not stored | Computed **server-side** (never trusts a client-supplied alert flag) and, when triggered, written into the existing `findings_actions` table (`source: 'copq'`) — client-confirmed decision to use the cross-engine command-centre table rather than a parallel one |
| Who owns the record | Client, in their own systems | ISC, as the client's system of record |

Both tiers are one screen (`SupplierCOPQ.tsx`) with a tier toggle — not two
separate builds.

---

## 4. Rawabi Worked Example — Q2 → Q3 2026

**Client:** Al-Rawabi Manufacturing (Electro-mechanical category, this
platform's recurring worked-example client — same supplier used in Module
07's own worked example).

**Q2 2026 (prior period)** — 3 CARs, no External-Failure overrides:

| CAR | Root cause | Linked cost | Classification |
|---|---|---|---|
| CAR-101 | Late-shipment root A | $4,200 (expedite freight) | Internal (default) |
| CAR-140 | Coating defect | $6,800 (rework) | Internal (default) |
| CAR-120 | Packaging-spec drift | *(none linked)* | Internal (default) |

Q2 rollup: Internal Failure $11,000 (2 of 3 CARs costed), External Failure
$0/0 CARs, Appraisal effort-proxy only (no rate supplied), Prevention
`INSUFFICIENT_DATA`.

**Q3 2026 (current period)** — 4 CARs, one explicit External-Failure override:

| CAR | Root cause | Linked cost | Classification |
|---|---|---|---|
| CAR-131 | Late-shipment root A (recurrence) | $9,100 (air-freight expedite) | Internal (default) |
| CAR-158 | Coating defect (recurrence) | $14,500 (**warranty claim — reached the customer**) | **External (explicit override)** |
| CAR-171 | Material-thickness variance | $3,100 (scrap, caught at incoming inspection) | Internal (default) |
| CAR-133 | Route disruption | *(none linked yet)* | Internal (default) |

Q3 rollup: Internal Failure $12,200 (2 of 3 CARs costed, CAR-133 disclosed as
uncosted), External Failure $14,500 (1 of 1 costed), Appraisal effort-proxy
(4 CARs, median 41 days to close — no rate supplied by default), Prevention
`INSUFFICIENT_DATA`. **Total costed: $26,700 across 2 of 4 PAF categories**,
with Appraisal and Prevention explicitly named as excluded from that total.

**Alert (Operational tier, computed server-side):** External Failure's share
of classified CARs rose from 0% (Q2) to 25% (Q3) — `external-failure-share-
increased`, the higher-severity of the two signals. Per the PAF model, this
is the leading indicator that matters most: a quality issue is starting to
reach the customer, not just internal cost rising. This is a **true positive**
against the real construction of the dataset — CAR-158's coating defect
recurred from Q2 and this time surfaced as a warranty claim, which is exactly
the kind of trend a client needs surfaced, not buried in a total-dollar view.

**Advisory read (as rendered on screen, English):**
> 2026-Q3: 4 CAR(s) reviewed under the PAF model. 1 classified External
> Failure (reached the customer) vs. 3 Internal Failure (caught internally)
> — External Failure is 25% of classified CARs. Costed total across 2 of 4
> PAF categories: $26,700. Per the standard PAF business case, sustained
> investment in Prevention is what drives Internal- and External-Failure
> cost down over time — no Prevention spend figure is available yet to test
> that relationship for this client.

**If the client then supplies real inputs** (per-CAR investigation rate
$500, Prevention spend $8,000 for the quarter): Appraisal becomes a real
$2,000 (4 CARs × $500, `caller-supplied-rate`), Prevention becomes a real
$8,000 (`caller-supplied`), and the total costed COPQ becomes $36,700 across
all 4 categories — verified by `computeCOPQRollup`'s own test
("produces a fully costed total when caller supplies rate + prevention
spend + all CARs are impact-linked").

---

## 5. Stress Test (Rule 7 — soft / hardest / boundary, all in `supplierCOPQ.test.ts`, 29/29 passing)

**Soft tier** — a realistic messy period: some CARs costed, some not, one
override, one still-open CAR (no `closedAt`). Verified: classification and
costing both degrade honestly (uncosted CARs counted but not priced; a
still-open CAR doesn't crash the median-days calculation).

**Hardest tier:**
- An impact referencing a `carId` that isn't in the CAR set (`GHOST-CAR-DOES-
  NOT-EXIST`, $99,999) does **not** silently inflate the total — the real CAR
  it should have matched stays uncosted. Guards against a data-entry typo on
  the client's side turning into a fabricated number.
- Two impacts linked to the same `carId` — documented, deterministic
  behavior (`.find()` takes the first match) rather than an accidental one.
- A negative `estimatedCostUSD` (a credit/reversal) is treated as real data
  and summed as-is — the module never silently "fixes" caller-supplied data.
- 500-CAR volume test — no performance collapse, correct aggregation
  ($50,000 from 500 × $100).
- A single wildly-different period never fabricates a trend direction —
  `detectCOPQAlert` requires two real periods, full stop.

**Boundary tier:**
- Exactly-at-threshold increase (+15.0% against a 15% threshold) does **not**
  trigger — strict `>`, not `>=`. One cent over (+15.0009%) does. This is
  the classic off-by-one class of bug the standing rules call out by name,
  and it's covered.
- A CAR created and closed the same day yields **0** days-to-close (a real
  zero), not `null` — `null` is reserved for "no closed CARs at all."
- A zero prior-period costed total is treated as "no comparison base," never
  a division-by-zero crash or a fabricated infinite percentage increase.
- A single-CAR (odd-length) array yields a real, non-interpolated median.

---

## 6. QA 10/10 Customer-Simulation Pass

**Scenario:** a Rawabi quality manager, first time on the page, reviewing Q3
CAR activity to decide whether to escalate to leadership; checks both EN and
AR; later reopens the page on mobile.

**Real defects found and fixed in this same pass (not deferred):**

1. **Honesty wording bug** — the demo-ledger-history disclosure originally
   read "shown so the trend panel has something *real* to render," which
   contradicts its own point (the data is explicitly *not* real). Fixed in
   both EN and AR to read "something to render," full stop.
2. **Silent failure on Save** — clicking "Save to Ledger" against this
   preview's non-existent backend session failed with no visible feedback at
   all — a real user would not know whether it worked. Fixed: the button now
   shows a saving/saved/unreachable state with a plain-language message.
3. **Missing empty-state affordance** — the sibling page
   (`SupplierRecoveryPortfolio.tsx`) ships a zero-data edge-case toggle as a
   deliberate, visible proof that the module degrades safely; this page
   didn't have the equivalent. Added a matching "zero-CAR-activity" toggle
   for visual/tonal consistency (Rule 9) and so the empty-state code path
   (already covered by a unit test) is also visibly demonstrable, not just
   unit-tested.
4. **Arabic phrasing** — two tier-description strings were serviceable but
   imprecise ("يتصرف العميل بنفسه" reads as "the client acts by himself,"
   not "in their own systems"; "نظام السجلّ" was an awkward rendering of
   "system of record"). Tightened to
   "ينفّذ العميل الإجراء ضمن أنظمته الخاصة" and
   "النظام المرجعي الرسمي لدى العميل" respectively.

**Disclosed, accepted limitations (not fixed — stated openly, per Rule 1/11
rather than silently shipped):**

- **Arabic numeral-noun agreement** is simplified (singular noun form reused
  after any count, e.g. "٤ طلب إجراء تصحيحي" rather than full classical
  agreement). This is standard, intelligible practice in commercial Arabic
  business software across the region and is not a comprehension issue —
  named here so it is a disclosed choice, not an unnoticed gap.
- **Chart tooltips are hover-only** (recharts default) — the same class of
  gap the QA standard's own history flags as a real past incident. Checked
  specifically: unlike that incident, no data here is *only* reachable via
  hover — every PAF bucket's dollar figure, basis badge, and disclosure note
  is already static, always-visible text in the 4 detail cards below the
  chart. The hover tooltip is a redundant convenience, not the only path to
  the data. A fully keyboard/touch-accessible custom tooltip is a reasonable
  future polish item, not a blocking gap today.
- **Backend files** (`copqLedger.ts`, `copq.ts`) could not be type-checked
  against the real `@workspace/db` Drizzle schema or Express types from this
  session — there is no local copy of the live monorepo's installed
  dependencies. They were verified by (a) syntax/shape-checking against
  hand-written stub declarations matching the real signatures seen in
  `supplierDependencyChecks.ts` and `findingsActions.ts`, and (b) a
  field-by-field manual cross-check against those two live files' actual
  column names and types, fetched fresh from the repo this session. This is
  a real, disclosed verification gap, not a silent one — a genuine
  `tsc`/build run against the live monorepo (e.g. in CI, or by the platform
  owner) is the remaining step to fully close it.

**Data safety:** the per-CAR rate and Prevention-spend inputs are local
component state; entering a value only affects the *current* period's
recomputation (via `useMemo` dependency) and never retroactively touches the
prior period's already-rendered rollup — confirmed by reading the actual
`useMemo` dependency arrays, not assumed.

**Bilingual:** both EN and AR narrative strings were read for sense (not
just typechecked) — see section 4's worked example and the fixes in this
section.

**Cross-feature interaction:** `CARBusinessImpact` deliberately extends
Module 07's `BusinessImpact` field *shape* from supplier-level to CAR-level
— this is named explicitly in the module's own file header and in section 2
above, specifically so a reader comparing this module to Module 07 side by
side isn't misled into thinking the two are structurally identical.

---

## 7. Competitive Moat (Rule 10) — Benchmarked Against Five Named Platforms

Re-benchmarked 11 Sep 2026 against real, named, currently-marketed
supplier-management platforms — not the generic "spreadsheet vs. bolt-on
QMS" comparison this section carried before. Each vendor's own current
product/solution page was fetched and read this session; nothing below is
from training-data recall of these products' 2024/2025 feature sets.

| Platform | What it actually does for supplier quality (per its own current page) | Named cost-of-quality (PAF-style) engine? |
|---|---|---|
| **JAGGAER** (Quality Management solution) | The strongest process coverage of the five: APQP, PPAP, 8D reports, non-conformance/complaint tracking, corrective-action workflows, quality scorecards gating new orders from underperforming suppliers, supplier audit management. | No. Structured quality *process* management, not a Prevention/Appraisal/Internal-Failure/External-Failure cost rollup. |
| **Coupa** (Supplier Risk & Performance Management) | Continuous third-party risk monitoring (InfoSec/ABAC/GDPR), a consolidated risk-and-performance dashboard, AI-prescriptive hold/release recommendations, supplier-diversity analytics. | No. Its own product page frames this as risk/compliance monitoring — no named quality-cost or scorecard-metric feature is described at all. |
| **GEP** (Quantum Intelligence — Supplier Performance Management) | An agentic layer: a "Performance Monitor Agent" surfacing KPI/trend shifts, automated certificate/compliance extraction, collaborative corrective-action plans with audit trails and auto-escalation, qualitative/quantitative scorecards. | No. Real-time monitoring and scorecarding, but no PAF-style costed rollup of quality failures. |
| **Ivalua** (Supplier Performance Management guide) | Frames SPM around named metric categories — quality (defect rate, product conformity), delivery, cost (price/TCO), relationship — plus vendor scorecards and improvement-plan tracking. | No — and this one is explicit about the gap: Ivalua's own SPM guide never uses the terms "cost of quality" or "cost of poor quality" at all. |
| **SAP Ariba** (Supplier Lifecycle and Performance) | Supplier performance scorecards (delivery/quality/compliance), procurement/supplier/contract-compliance KPI analytics, supplier risk monitoring (financial stability, regulatory), ESG tracking. | No named costed-quality module found in the sources reviewed. |

**The pattern, stated honestly**: all five platforms independently converge
on the same two capabilities — a quality *scorecard* (a 0–100-style rating)
and a corrective-action *workflow* (JAGGAER's is the most mature: APQP/PPAP/
8D). None of the five, on the evidence gathered this session, expose a
named Prevention–Appraisal–Internal-Failure–External-Failure cost rollup as
a distinct, client-facing feature the way this module does. That is a real,
specific, checkable gap in the market as documented this session — not a
claim that these platforms lack quality management (JAGGAER's is genuinely
stronger process coverage than this module has today, and that gap is
stated plainly below, not hidden).

**This module's actual edge, restated against that finding**: COPQ here is
a *reframing* of data the client is already required to keep (CARs, already
tracked in Module 07 / the Scorecard) into the PAF model — codified in
ASQ's quality-cost framework and tracing to Juran's original work (already
this module's cited methodology, Section 1) — with zero new data-entry
burden for the Advisory tier. A client moving from a spreadsheet or a
JAGGAER-style process tool still has no *costed* Internal/External Failure
split without this module or an equivalent PAF build of their own.

**The gap against best-in-class practice, stated honestly (not closed by
this rewrite)**: JAGGAER's APQP/PPAP/8D process depth and its
order-blocking scorecard-gate are real, more mature quality-process
capabilities this module does not have. This module also still cannot
ingest a real ERP-sourced Appraisal/Prevention ledger the way a mature
enterprise quality-costing suite could — those buckets stay
`INSUFFICIENT_DATA`/effort-proxy until a client supplies that data by hand.
Both gaps are named here, not smoothed over.

**Sourcing note (Rule 1 honesty)**: SAP Ariba's own product page returned a
403 on direct fetch this session; its row above is sourced from a
secondary review site (research.com) rather than SAP's own page, and is
flagged as the weaker-sourced row of the five accordingly. CIPS's own
intelligence-hub page (fetched this session) describes its Relationship
Spectrum and references the Kraljic Matrix, but does not publish its own
named cost-of-quality standard — ASQ/Juran's PAF model remains the correct,
already-cited authority for that specific claim (Section 1), not CIPS.

---

## 8. Cross-Module Wiring (11 Sep 2026 addition)

Before this addition, COPQ's real, tested logic (Sections 1–7) was not
actually read by any other screen in the platform — a genuine gap, caught
and closed in this pass. Three wiring points, each following the same
standalone-first pattern this platform already established for Module 07
(`supplierRecoveryPortfolio.ts` imports `supplierPerformanceRecovery.ts`
directly — see that file's own header): the UI/aggregation layer imports
the engine directly; the engine (`supplierCOPQ.ts`) still has zero runtime
imports of its own.

### 8.1 Scorecard's Quality-dimension trend (`SupplierScorecard.tsx`)

- The Monthly Trend chart now plots a second line, `dimScores.quality`,
  alongside the existing Weighted Score line — data that was already being
  captured and persisted (`TrendSnapshot.dimScores`) but never rendered.
- A new checkbox on quality-category CARs ("Reached the customer / External
  Failure") is the only source for the Internal/External split — unset
  defaults to Internal, exactly mirroring `supplierCOPQ.ts`'s own
  `CARCustomerImpactOverride` contract (never guessed).
- `computeMonthOverMonthCOPQAlert()` — a new exported function in
  `supplierCOPQ.ts` itself (Section 6 of the module, not a Scorecard-side
  hack) — buckets a supplier's quality CARs by calendar month and runs the
  existing, unmodified `detectCOPQAlert()` across the two most recent
  months with activity. When it triggers, the same bilingual PAF-model
  message `detectCOPQAlert` already produces appears under the trend chart.
- **Honest scope limit, stated plainly**: the Scorecard's CAR log has no
  cost/business-impact field today, so `impacts` is genuinely empty here —
  the alert works entirely off CAR counts and the External Failure share,
  which is disclosed in `detectCOPQAlert`'s own design as the
  higher-severity, cost-independent leading indicator. No dollar figure is
  fabricated to make this wiring look more complete than it is.

### 8.2 Recovery Portfolio's root-cause breakdown chart (`SupplierRecoveryPortfolio.tsx`)

- `computeRootCauseByDimension()` (Upgrade 4, already live) only ever
  counted CARs per Scorecard dimension. A new function,
  `computeRootCauseCOPQBreakdown()` (Upgrade 5), adds a real costed $ split
  per dimension by calling `computeCOPQRollup()` per dimension's CAR
  subset.
- The chart now renders two grouped bars per dimension — CAR-count share
  (existing) and costed-COPQ share (new) — so a dimension with few CARs but
  high dollar cost (or the reverse) is visible, not hidden behind a
  count-only view.
- The demo portfolio's CARs did not previously carry business-impact cost
  data. A `DEMO_CAR_IMPACTS` dataset (14 entries) was added, following the
  exact same disclosure convention this file's header already established
  for its SAR exposure KPI: realistic, estimated dollar figures
  (`basis: 'estimated'`), explicitly labeled as a constructed demo, never
  presented as production data.

### 8.3 COPQ Attention Priority (`SupplierRecoveryPortfolio.tsx`, new panel)

- Answers the literal question asked: "which suppliers' COPQ deserves
  attention first." A new function, `computeCOPQAttentionPriority()`
  (Upgrade 6), combines three already-real, independently-visible signals —
  never a new fabricated composite score (isc-ai-output-standards #7 /
  Decision Record 8.7):
  1. Kraljic criticality — Module 02's real per-supplier quadrant, already
     on `SupplierRecord.quadrant`.
  2. Costed COPQ — Module 01's `computeCOPQRollup()`, caller-supplied
     impacts only.
  3. External Failure share — Module 01's own PAF-model leading indicator.
- The formula is disclosed in full on every result row
  (`PRIORITY_FORMULA_EN`/`AR`), not hidden behind a single number: `(costed
  COPQ in $000s) × Kraljic-quadrant weight (strategic 1.5 / bottleneck 1.3 /
  leverage 1.0 / non-critical 0.7) × (1 + External Failure share / 100)`. A
  supplier with no CARs scores exactly 0, never a hidden default.
- **Honest scope limit, stated plainly**: Module 05 (`supplierConcentration.ts`)
  has no live UI page anywhere in the platform yet (verified by a repo-wide
  grep this session — zero `.tsx` consumers) and carries no per-supplier
  absolute join back to a supplier record, only a relative
  `capacityOrSpendSharePct` keyed by category (the same cross-module gap
  this file's header already documents, #668). So Module 05's concentration
  signal is deliberately NOT part of this formula — adding it honestly
  requires that still-open join, not a guess. This is stated here, not
  silently dropped.

### 8.4 Stress test / verification record

- `computeMonthOverMonthCOPQAlert()`: 10 new tests added to
  `supplierCOPQ.test.ts` (soft/hardest/boundary per Rule 7) — empty-history
  honesty, single-month-no-prior-period honesty, External-Failure-share
  increase and decrease, future-dated-CAR exclusion at the `asOfIso`
  boundary, many-months-only-compares-the-two-most-recent, exact-threshold
  strict-`>` boundary, and a `increasePctThreshold: 0` boundary. File total:
  **39/39 passing** (29 pre-existing + 10 new).
- `computeRootCauseCOPQBreakdown()` / `computeCOPQAttentionPriority()`: 9
  new tests added to `supplierRecoveryPortfolio.test.ts` — zero-CAR-supplier
  honesty, a dimension with CARs but no matching impact staying
  `INSUFFICIENT_DATA` rather than a fabricated $0, empty-portfolio
  boundary, `pctOfCostedTotal` summing to ~100 across dimensions, strategic
  + externally-classified outranking non-critical + internal, and
  descending-sort correctness across a mixed three-supplier set. File
  total: **23/23 passing** (14 pre-existing + 9 new).
- Full `vitest run` of both files: **62/62 passing**.
- Real defect found and fixed during this pass (not logged as future
  work): the Recovery Portfolio page imported `CARBusinessImpact` /
  `CARCustomerImpactOverride` from `supplierRecoveryPortfolio.ts`, but that
  file only re-imported those types from `supplierCOPQ.ts` without
  re-exporting them — TS2459 on a scoped `tsc --noEmit` pass. Fixed with an
  explicit `export type { CARBusinessImpact, CARCustomerImpactOverride }`
  in `supplierRecoveryPortfolio.ts`; re-verified clean (0 errors) on a
  scoped type-check of all six touched files (the four source files above
  plus both test files) immediately after.
- **Disclosed tooling constraint**: a full-project `tsc --noEmit -p .`
  (the monorepo's whole dependency graph, including project references)
  could not complete in this session's sandbox (a ~1GB-RAM environment;
  the process was repeatedly killed at 96%+ memory use before finishing,
  never a type error). Verification instead used a scoped `tsc --noEmit`
  covering exactly the six files this build touched plus their real import
  graph (not a partial/loosened check) — this caught and the fix above
  resolved the one real type error that existed — combined with a full
  `vitest run` for runtime/logic correctness. CI's own `typecheck-and-test`
  check (unconstrained by this sandbox's memory) is the final, authoritative
  gate and is confirmed separately before this build is called closed.

---

## 9. Files in This Build

- `artifacts/i-supply-chain/src/lib/supplierCOPQ.ts` (new)
- `artifacts/i-supply-chain/src/lib/supplierCOPQ.test.ts` (new, 29 tests)
- `artifacts/i-supply-chain/src/pages/SupplierCOPQ.tsx` (new)
- `artifacts/i-supply-chain/src/App.tsx` (+2 lines: import + route)
- `artifacts/i-supply-chain/src/components/Header.tsx` (+2 lines: `servicesList`
  entry AND the matching `navLabel()` map entry — both required, see section 6
  QA finding on the nav-wiring gap)
- `lib/db/src/schema/copqLedger.ts` (new)
- `lib/db/src/schema/index.ts` (+1 line: barrel export)
- `artifacts/api-server/src/routes/copq.ts` (new)
- `artifacts/api-server/src/routes/index.ts` (+2 lines: import + mount)

**11 Sep 2026 wiring addition (Section 8) — files touched:**
- `artifacts/i-supply-chain/src/lib/supplierCOPQ.ts` (+ Section 6:
  `computeMonthOverMonthCOPQAlert`)
- `artifacts/i-supply-chain/src/lib/supplierCOPQ.test.ts` (+10 tests, 39
  total)
- `artifacts/i-supply-chain/src/lib/supplierRecoveryPortfolio.ts` (+ Upgrade
  5 `computeRootCauseCOPQBreakdown`, + Upgrade 6
  `computeCOPQAttentionPriority`, real import of `supplierCOPQ.ts`)
- `artifacts/i-supply-chain/src/lib/supplierRecoveryPortfolio.test.ts` (+9
  tests, 23 total)
- `artifacts/i-supply-chain/src/pages/SupplierRecoveryPortfolio.tsx`
  (cost-augmented root-cause chart, new COPQ Attention Priority panel,
  `DEMO_CAR_IMPACTS` synthetic dataset)
- `artifacts/i-supply-chain/src/components/toolkit/SupplierScorecard.tsx`
  (Quality-dimension trend line, External Failure checkbox, month-over-month
  COPQ alert badge)

**This doc's location:** committed at
`docs/SI_Supplier_Lifecycle_Governance_Item1_COPQ_Worked_Example.md` on
`main`, alongside the Item 2 (RACI) and Item 3 (Pre-Qualification & ASL)
worked-example docs, per the 10-11 Sep 2026 `docs/` backfill.
