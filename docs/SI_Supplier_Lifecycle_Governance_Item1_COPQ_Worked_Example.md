# Supplier Lifecycle Governance — Item 1: Cost of Poor Quality (COPQ)
## Worked Example, Stress Test, and QA Record — Rawabi Manufacturing

**Build date:** 11 Sep 2026
**Status:** Advisory + Operational tiers complete, tested, QA'd, and PUSHED —
all 9 files landed on `main` in 4 commits (plus one immediate self-caught
fix commit; see the closure report for commit links). VERIFIED post-push by
re-fetching `supplierCOPQ.ts`'s raw content from the live repo and
confirming it matches the intended 474-line file exactly.
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

## 7. Competitive Moat (Rule 10)

A generic COPQ calculator (spreadsheet template, or a bolt-on quality-costing
module in a generic QMS tool) asks the client to build and maintain a
separate cost-tracking process from scratch. This module's actual edge:
COPQ here is a *reframing* of data the client is already required to keep
(CARs, already tracked in Module 07/the Scorecard) — there is no new data
entry burden for the Advisory tier at all beyond linking an existing figure.
The genuine gap against a mature enterprise quality-costing suite remains
honest: those tools can ingest real ERP-sourced Appraisal/Prevention ledger
data directly; this platform's Appraisal/Prevention buckets stay
`INSUFFICIENT_DATA`/effort-proxy until a client supplies that data by hand.
That gap is stated here, not hidden.

---

## 8. Files in This Build

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

**A note on this doc's own location:** a repo-wide search found no existing
worked-example or Site Map/registry `.md` files committed anywhere in
`Maen1986/Intelligent-Supply-Chain` — these consulting deliverables appear to
live outside the code repo by convention on this project, not inside it. To
avoid inventing an unprecedented path (Rule 1, Never Fabricate, applied to
process as much as data), this document is delivered directly to you rather
than committed. If you'd like it (and future worked-example docs) committed
into the repo going forward, tell me the path/folder and I'll do that from
Item 2 onward.
