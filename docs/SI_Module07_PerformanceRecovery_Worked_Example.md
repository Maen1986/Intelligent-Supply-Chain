# I Supply Chain — SI Module 07 (Performance, Development & Recovery)
## Independent Verification & Worked Example — 14 Sep 2026

## 0. Framing: what this document is and is not

Module 07 (`supplierPerformanceRecovery.ts`, plus its aggregation layer
`supplierRecoveryPortfolio.ts` and the `SupplierRecoveryPortfolio.tsx`
dashboard page) was first built and committed to `main` on 11 Sep 2026
(commits `31f4a83`, `bb06205`), well before the Item 1-7 Supplier Lifecycle
Governance sequence even began. It shipped with its own internal doc-comment
claim of having been typechecked and unit-tested in that original session.

That original build was never independently re-verified against this
platform's full standing bar: a real, freshly-executed test run (not a
trusted comment), the mandatory `isc-qa-customer-simulation` walkthrough, a
worked-example doc, and a registry/status update. This document is that
independent verification (assignment #700), done from a fresh clone against
the live `main` branch, not a continuation of the original build session's
own claims.

**This is a verification-and-fix pass, not a rewrite.** The 623-line core
engine (`supplierPerformanceRecovery.ts`) and the 545-line portfolio
aggregation layer were read in full and are sound: every threshold is
sourced and disclosed, every default is caller-overridable, INSUFFICIENT_DATA
is returned honestly rather than guessed. One real, disclosed gap was found
during the mandatory QA pass (Section 9) and fixed in this same pass, per
this platform's "fix, don't just log" standing rule.

## 1. Sourced methodology (as built, verified by reading the source)

- **Variability** — simplified Statistical Process Control / Western
  Electric zone-rule convention (Shewhart control charts; ASQ-published,
  public domain). Single-point rule only, disclosed as such in both the
  code's own rule-source string and the UI. Population standard deviation
  (divide by n) is used deliberately, not the sample estimator (n-1) — the
  supplier's own real history is the full reference set, not a sample of a
  larger unknown population; this is pinned by an exact-value test so a
  future edit that silently swaps the estimator fails loudly.
- **Trend** — OLS (ordinary least squares) slope with a standard-error-based
  stability band (`toleranceAbs = seMultiplier * SE(slope)`, seMultiplier
  defaults to 2, a disclosed approximation of a two-tailed ~95% threshold,
  not a proper Student's-t critical value). This replaced an earlier
  percent-of-stddev heuristic that was found, on independent review before
  this module ever shipped, to misclassify a clean 7+ period decline as
  "stable" because raw stdDev of a linear ramp grows with series length —
  a dimensionally invalid comparison. The regression test for this exact
  failure mode is still in the suite (Section 5).
- **Single-period shock** — sourced from this platform's own Module 06
  (`supplierCommercialIntelligence.ts`) `maxIntraPeriodSwingPct` convention,
  applied here to performance metrics instead of price: a >15%
  (caller-overridable) period-over-period swing, independent of the
  whole-series OLS trend read, which by design can absorb a single outlier
  period into a still-"stable" net slope until enough subsequent periods
  accumulate. **This is the real cross-engine link to Module 06** — see
  Section 9 for why it was not, until this pass, actually reachable from the
  live UI.
- **Recurrence / escalation** — 8D / Supplier Corrective Action Request
  (SCAR) convention, as documented in publicly-published automotive/
  industrial supplier-quality guidelines (Vestas, Oshkosh, MAHLE). A
  corrective action that fails against the same root cause a second time is
  treated as a systemic-capability signal, not a coincidence: 2nd occurrence
  escalates one ladder tier, 3rd+ forces at least DUAL_SOURCE regardless of
  dependency posture.

## 2. Design contract

- **Intervention ladder** (escalation-ordered, never skips or reverses):
  REPAIR → DEVELOP → COLLABORATE → REDESIGN → DUAL_SOURCE → MULTI_SOURCE →
  REPLACE → EXIT.
- **Combined-signal flag**: `high` variability co-occurring with any
  recurrence ≥ 1 is surfaced as "worth a question, not a verdict" toward
  REPLACE/EXIT — a named, disclosed heuristic, never an automatic verdict.
- **Standalone-first, verified**: zero runtime imports from any sibling SI
  module or from `SupplierScorecard.tsx` / the CAR system. Every cross-module
  fact (scorecard dimension, Module 05's dependency posture, a CAR id/
  category) is caller-supplied as plain data. Confirmed by reading every
  import statement in both lib files: `supplierPerformanceRecovery.ts` has
  zero sibling-module imports; `supplierRecoveryPortfolio.ts` imports only
  from `supplierPerformanceRecovery.ts` (its own core module, by design —
  the aggregation layer is explicitly a wrapper, not a peer) and
  `supplierCOPQ.ts` (Item 1) for the COPQ cross-reference, both of which are
  real, live, already-shipped modules.
- **Every heuristic default is disclosed via a `*Source`/`ruleSource` field
  and caller-overridable** — verified directly in the source: `sigmaOverride`,
  `seMultiplierOverride`/`toleranceAbsOverride`, `thresholdPctOverride`,
  `minSampleSize`, `escalationThresholdOverride` all exist and are exercised
  by tests.
- **Data-source tagging**: every `PerformanceRecordEntry` carries an
  `SIDataSource` tag (`manual | imported-file | erp | wms | scm | crm`) — the
  module's own header discloses this was missing on the first draft and
  added on review, matching this platform's standard practice of disclosing
  a fixed gap rather than presenting it as always having been correct.

## 3. What is genuinely NOT wired yet (disclosed, not fixed in this pass)

- **No API/database layer for the demo dataset itself — unchanged.** The
  16-supplier `DEMO_SUPPLIERS` worked-example dataset (Section 4) remains a
  constructed, clearly-labeled in-memory fixture; it is not, and was never
  intended to become, a live-editable database record. **Closed, 17 Sep
  2026, for user-owned data**: a real Drizzle table
  (`supplier_recovery_entries`), API route, and CRUD form now exist so a
  real user can persist their *own* `SupplierRecord[]` portfolio, separate
  from the demo dataset — see Section 13 for the full disclosure. This
  followed the owner's own explicit scoping decision to close the
  persistence gap without also closing the separate #668 cross-module
  spend-field gap described in the next bullet.
- **No real per-supplier absolute-currency field anywhere in the platform.**
  The SAR exposure KPI is built from an explicit, visibly-badged MOCK
  per-supplier spend dataset (`buildMockSupplierSpendDataset`), because
  Module 05 only carries a *relative* `capacityOrSpendSharePct` and Module
  02's real SAR figures live on category/item records, not supplier
  records. This is a real, logged cross-module gap (tracked against #668),
  not a bug in Module 07 itself — disclosed both in the code's own header
  comment and visibly on every mock-derived UI value via a "SIMULATED / MOCK
  DATA" badge and a footnote, never presented as if it were a real
  derivation.
- **ESG/sustainability is always an unscored dimension** — no sourced
  supplier-level methodology exists yet platform-wide; disclosed bilingually
  on every `SupplierPerformanceRecord`, cross-referenced to the Problem Map's
  own "Sustainability" focusArea rather than re-invented here.

## 4. Worked example: Al-Rawabi Manufacturing (continuing the platform's own running story)

Al-Rawabi Manufacturing (`SUP-001`) is the same supplier the platform's
Items 1-7 worked examples have followed throughout — here it appears in
Module 07's own demo portfolio (`DEMO_SUPPLIERS[0]`), independently
constructed in the original 11 Sep build, extended here as a live worked
example rather than a static narrative.

**Input** (real fields from the shipped demo data): a 12-month delivery
score history declining from 94 to 64, and three CARs against the same root
cause (`late-shipment-root-A`) — two closed (CAR-101, CAR-114), one still
open (CAR-131).

**Output, from a real, freshly-executed call to `detectSupplier()` in this
session** (not hand-computed, not copied from the module's own header
comment):

```
trend:                  declining
variability:             moderate
recurrenceCount:          1            (2nd occurrence of late-shipment-root-A)
recommendedIntervention: COLLABORATE   (escalated one tier from the DEVELOP base,
                                         per 8D/SCAR: the prior corrective action
                                         did not hold)
combinedSignalFlag:      false         (variability is "moderate", not "high" —
                                         the combined-signal threshold is not met)
shockFlag:               false         (latest single-period move: ~1.5%, well
                                         under the 15% Module-06-sourced threshold)
```

**Reading it as a consultant would**: Al-Rawabi's decline is real and
sustained (OLS-confirmed trend, not a single bad month), but it is a gradual
erosion, not a shock — the SPC read is "moderate" rather than "high", and
the most recent period alone shows no unusual swing. The repeat CAR against
the identical root cause is the signal that actually moves the
recommendation: a first-occurrence late shipment would stay at REPAIR/DEVELOP,
but a second failure against the same root cause is treated, per 8D/SCAR
doctrine, as evidence the corrective action didn't hold — hence COLLABORATE,
one tier up, with the open third CAR (CAR-131) as the live signal that a
third occurrence — which would force at least DUAL_SOURCE regardless of
Al-Rawabi's strategic-quadrant status — is a real near-term risk, not a
hypothetical one.

**Contrast case — Zamil Steel Co. (`SUP-002`)**: quality CARs (coating
defect) with one closed, one still open, and a score history that dips
84→79→74→70 then partially recovers to 73. Variability reads `high` given
the visible late-series volatility, and with `recurrenceCount = 1` (the
open CAR-158 recurring against the same coating-defect root cause), this is
exactly the case that trips `combinedSignalFlag = true` — high variability
co-occurring with recurrence — surfaced in the UI as "worth a question, not
a verdict" toward REPLACE/EXIT, never an automatic verdict.

## 5. Stress-test results (real, freshly executed this session — Rule 7)

Both suites run from a clean clone of `main` (commit `25a93e6`), full
workspace `pnpm install`, then `npx vitest run` on the two files directly.
Raw summary:

```
 Test Files  2 passed (2)
      Tests  66 passed (66)
```

(63 tests existed before this pass; 3 new tests were added for the Module 06
wiring fix in Section 9, all real and all passing — see below.)

Breakdown:
- `supplierPerformanceRecovery.test.ts` — 40 tests: `classifyVariability`
  (10, including a boundary at exactly 1σ/2σ and the zero-variance
  degenerate case), `computeTrend` (13, including the regression test for
  the exact stdDev-based bug this replaced, and the documented n=2
  low-confidence behavior), `checkLatestPeriodShock` (4: >15% flagged,
  small move not flagged, threshold override respected, <2 points returns
  false not INSUFFICIENT_DATA), `assessRecurrence` (2), `recommendEscalation`
  (9, including the boundary "already at/beyond the forced tier" cases),
  `INTERVENTION_LADDER` shape (1), `buildSupplierPerformanceRecord` (3).
- `supplierRecoveryPortfolio.test.ts` — 26 tests, including three explicit
  SOFT/HARDEST/BOUNDARY-labeled blocks (`computeRootCauseCOPQBreakdown`,
  `computeCOPQAttentionPriority`, and the new shock-wiring tests below) and
  a dedicated zero-suppliers edge-case block.

**Cross-engine chained scenario added in this pass** (Rule 7, the specific
gap this verification pass found and closed — Section 9 has the full
narrative):

- SOFT — a gradual decline with no single-period jump (the module-level
  `supplier` fixture, ending 60→58→55): `shockFlag=false`, change ≈5.2%.
- HARDEST — ten flat periods at 80 followed by one sharp drop to 64 (a 20%
  single-period move): `shockFlag=true`, change ≈20%, and the rule-source
  string is asserted to actually mention "Module 06" — proving the
  disclosure, not just the boolean, survived the wiring.
- BOUNDARY — an exact 15.0% drop (100→85): `shockFlag=false`, confirming
  `isShock` is strictly-greater-than, not greater-or-equal, matching the
  core module's own documented contract.

Positive control on the typecheck itself: a deliberate `const x: number =
'not a number'` was appended to the core module, `tsc` caught it
(`TS2322`), then it was removed — confirming the scoped typecheck below is
actually checking these files, not silently passing on an empty include set.

## 6. Typecheck (real, freshly executed)

A scoped `tsconfig.item700check.json` (extending the real project
tsconfig, `references: []`, explicit file list) was used because this
sandbox's total RAM (under 1GB) cannot complete a full 3-project `tsc -b`
without OOM — a disclosed, known environment limitation from earlier work
on this platform, not something being worked around silently here.

```
$ npx tsc -p tsconfig.item700check.json --noEmit
(exit 0, zero errors)
```

Files checked: `supplierPerformanceRecovery.ts`, `.test.ts`,
`supplierRecoveryPortfolio.ts`, `.test.ts`, `SupplierRecoveryPortfolio.tsx`,
plus their real transitive dependencies (`supplierCOPQ.ts`, `translations.ts`,
`storage.ts`, `LanguageContext.tsx`) — confirmed via `--listFilesOnly`, not
assumed. A full-suite CI run (`typecheck-and-test`, properly resourced, not
memory-constrained) is the authoritative full-monorepo confirmation; see
Section 8 for its real, fetched result on this pass's actual pushed commit.

## 7. Durable persistence

**Updated 17 Sep 2026 — closed for user-owned `SupplierRecord[]` data.** See
Section 13 for the full build disclosure (schema, API, CRUD form, test
counts, QA finding). Short version: this is no longer accurate as a blanket
"none yet" — a real persistence layer now exists for a signed-in user's own
supplier portfolio, entered through the page's new "My Portfolio" mode. The
Section 4 demo/worked-example dataset (`DEMO_SUPPLIERS`) is intentionally
untouched by this and still recomputes in-memory on every render, as a
worked example should. The mock category/spend reference data
(`DEMO_CATEGORY_ITEMS`, `DEMO_SHARES`) used to compute exposure-at-risk is
also unchanged and still shared by both modes — this is why a user-added
supplier in a category absent from that reference set honestly reports
`INSUFFICIENT_DATA` rather than a fabricated SAR figure (Section 13.5).

## 8. CI-gate evidence

Real, fetched directly from GitHub Actions for this pass's actual pushed
commit `4f63d5be74908f74ec4b69d747cf4b1e4324f2ac` — not summarized from
memory, not assumed from the local sandbox run:

- `render-build-parity` — **completed / success**
  (https://github.com/Maen1986/Intelligent-Supply-Chain/actions/runs/34816860129/job/103889245038)
- `typecheck-and-test` — **completed / success**
  (https://github.com/Maen1986/Intelligent-Supply-Chain/actions/runs/34816860129/job/103889244838)

Raw job-log summary lines for `typecheck-and-test`, quoted verbatim (proper
CI runner, not this sandbox's memory-constrained environment):

```
Test Files  216 passed (216)
     Tests  4311 passed (4311)
   Duration  169.65s

Test Files  57 passed (57)
     Tests  941 passed (941)
   Duration  10.37s
```

4311 is exactly 3 more than the 4308 confirmed at Item 7's own close-out
(commit `25a93e6`) — the 3 new SOFT/HARDEST/BOUNDARY shock-wiring tests
added in this pass (Section 5), and nothing else moved. api-server's 941
is unchanged, consistent with this pass touching no api-server code. Both
checks passed on the first attempt — no placeholder-content incident.

## 9. QA 10/10 customer-simulation pass — what it found and fixed

Simulated user: a GCC procurement director reviewing the Supplier Recovery
Portfolio dashboard ahead of a quarterly supplier review, then an Arabic-
reading colleague opening the same page.

1. **Real scenario walkthrough** — the KPI row, root-cause chart, CAR
   cohort chart, migration trails, watchlist, and COPQ attention priority
   panel all trace to real function calls over the demo portfolio; walked
   end to end, nothing renders a raw unexplained number (Section 8's
   Decision-Ready standard: every KPI has a label, a basis, and where
   relevant a visible mock-data badge).
2. **Discoverability** — real: route `/supplier-recovery-portfolio` and a
   bilingual nav entry (`🔄 Supplier Recovery Portfolio` /
   `🔄 محفظة تعافي الموردين`) both confirmed present in `App.tsx` and
   `Header.tsx` — not an orphaned page.
3. **Bilingual correctness** — both language paths read for sense, not just
   typechecked. Quadrant labels reuse Module 02's own real `QUADRANT_META`
   Arabic strings rather than a fresh translation, avoiding drift. Real
   Arabic sentences (not machine-garbled, not English reused) for every
   footnote and the SIMULATED/MOCK badge.
4. **Data safety** — the page has exactly one piece of interactive state
   (the empty-state toggle); switching it swaps between the demo dataset and
   an explicit empty array, nothing else is mutated. No form, no write path.
5. **Edge cases** — the empty-state toggle is a first-class, always-visible
   feature (not a hidden dev-only path), rendering an honest "no suppliers
   in recovery" message with zeroed KPIs and no NaN, and this exact path is
   covered by a dedicated `computePortfolioKPIs -- zero-suppliers edge case`
   test.
6. **Accessibility** — the only interactive control is a real `<button
   type="button">`, keyboard-reachable. The exposure-basis disclosure uses a
   `title` attribute (hover-only) on desktop, but — checked directly, not
   assumed — the same disclosure is *also* always visible as a footnote
   `<p>` beneath the table, so no information is hover-gated only; this
   matches this platform's own prior corrective standard (the "Pilot" badge
   incident) rather than repeating it.
7. **Cross-feature interaction — the one real defect this pass found and
   fixed.** `checkLatestPeriodShock` existed in the core module, was
   correctly sourced to Module 06's own `maxIntraPeriodSwingPct` convention,
   and had 4 passing unit tests — but a direct search
   (`grep -rn "checkLatestPeriodShock\|commercialIntelligence"` across both
   the portfolio lib and the page) found **zero call sites**. The function
   was built, documented, and tested in isolation, then never actually
   wired into the live dashboard — so the shipped page had no real
   cross-engine trace to Module 06 at all, only a citation of its
   methodology in a doc comment. Per this platform's "fix, don't just log"
   rule, this was fixed in this same pass, not deferred:
   - `checkLatestPeriodShock` is now called inside `detectSupplier()` in
     `supplierRecoveryPortfolio.ts`, and `SupplierDetection` now carries
     `shockFlag`, `shockChangePct`, and the bilingual rule-source strings
     through to callers.
   - The watchlist table on the live dashboard now shows a visible
     (non-hover-only) "SHOCK" / "صدمة فترة واحدة" badge with the real
     percentage change when a supplier's latest period is a genuine
     single-period shock, plus an always-visible footnote (shown only when
     at least one supplier has the flag, matching this page's existing
     conditional-footnote pattern) explaining the Module-06-sourced
     methodology.
   - Three new tests (SOFT/HARDEST/BOUNDARY, Section 5) prove the wiring
     end-to-end, including that the rule-source string genuinely mentions
     "Module 06" and not just a bare boolean.
   - None of the platform's 16 demo suppliers happen to trigger a real
     shock on their own constructed history (largest single-period move in
     the shipped dataset is well under 15%) — this is disclosed here rather
     than papered over by editing the demo narrative dataset to manufacture
     a visible example; the HARDEST stress test proves the feature works on
     a case designed to trigger it, which is the standard this platform
     already applies elsewhere (e.g. Item 6's blacklist finalize wizard
     stress tests use constructed adversarial cases, not a guarantee that
     the shipped demo data itself hits every path).
8. **Honesty (Decision Record 8.7)** — no fabricated data found; every mock/
   simulated value is visibly badged; the cross-module gaps (no live
   per-supplier spend field, no persistence layer) are disclosed in the
   code's own comments and repeated in this document rather than smoothed
   over.
9. **Visual/tonal consistency** — matches the platform's existing card/
   badge/chart conventions (`bg-white rounded-2xl border`, the same pill-
   badge pattern used for quadrant/intervention labels elsewhere); the new
   SHOCK badge reuses the existing pill-badge visual language (rounded-full,
   white text on a colored background) rather than introducing a new pattern.
10. **Fix, don't just log** — the one real defect found (Section 9.7) was
    fixed, re-typechecked, re-tested, and re-verified in this same pass, not
    deferred.

## 10. Competitive-moat benchmark

Named comparison: SAP Ariba Supplier Risk / Coupa Supplier Performance
Management surface a single composite risk or performance score per
supplier, typically opaque about its weighting. Module 07's differentiation,
verified against the actual shipped code rather than asserted: (a) every
recommendation traces to a disclosed, named, publicly-sourced convention
(SPC/Western Electric, OLS-slope-SE, 8D/SCAR) rather than a black-box
weighted score; (b) the escalation ladder is deterministic and inspectable
(8 named tiers, never skips), not a hidden risk-tier cutoff; (c) the
combined-signal flag is explicitly framed as "worth a question, not a
verdict" rather than an automated decision, matching this platform's
consistent primary-recommendation-plus-explicit-caveat discipline. Genuine
gap against best-in-class practice, stated plainly: neither the live
per-supplier spend join nor a persistence layer exists yet (Section 3/7) —
Ariba/Coupa's real production deployments do have that live data
connectivity, which this module does not yet match.

## 11. Disclosed open gaps

- **SI-00 Charter**: referenced repeatedly in this module's own source
  comments (e.g. "per SI-00 Charter core instruction") but, per an
  exhaustive repo search (`find . -iname "*SI-00*" -o -iname "*SI_00*" -o
  -iname "*charter*"`, whole repo, not just `docs/`), no such file exists
  anywhere in this git repository. This is the same finding already
  disclosed for the platform's "Site Map" during Item 7's close-out — it
  must live in an external system (Cowork-workspace docs, per that earlier
  disclosure), not this repo. This document itself is the closest thing to
  a Charter-status update this session can commit; the external Charter
  record should be updated separately.
- **No live per-supplier spend/currency field** (#668) — still open,
  real, disclosed, not fabricated around. This is a separate, cross-module
  gap (it would require touching Module 02's and Module 05's own schemas,
  not just Module 07's) and was explicitly kept out of scope by the
  platform owner's own scoping decision on 17 Sep 2026 when closing the
  persistence-layer gap below.
- ~~No persistence layer~~ — **closed, 17 Sep 2026**, for user-owned
  `SupplierRecord[]` data only (schema + API + real CRUD form; see Section
  13). The Section 4 demo dataset and the mock exposure reference data
  (`DEMO_CATEGORY_ITEMS`/`DEMO_SHARES`) remain intentionally unpersisted,
  as documented in Section 7's update.
- **New DB table not yet applied to any live database.** `drizzle-kit push`
  has not been run against production for `supplier_recovery_entries` — the
  table is defined in code (schema + provisioning-note disclosure in the
  file's own header comment) but whoever holds production DB access must
  run the existing `push` workflow (`lib/db/package.json`'s `push` script)
  separately. This matches the same honest disclosure already used for
  `localContentIcvEntries` (Module 08).
- **Demo dataset does not itself trigger the new shock badge** — disclosed
  in Section 9.7 rather than solved by editing the narrative dataset.

## 12. Files in this build

**14 Sep 2026 pass (independent verification):**
- `artifacts/i-supply-chain/src/lib/supplierPerformanceRecovery.ts` (623
  lines, unmodified that pass — verified only)
- `artifacts/i-supply-chain/src/lib/supplierPerformanceRecovery.test.ts`
  (423 lines, unmodified that pass — 40/40 verified passing)
- `artifacts/i-supply-chain/src/lib/supplierRecoveryPortfolio.ts` (563
  lines — modified: Module 06 shock wiring)
- `artifacts/i-supply-chain/src/lib/supplierRecoveryPortfolio.test.ts` (318
  lines — modified: 3 new SOFT/HARDEST/BOUNDARY tests)
- `artifacts/i-supply-chain/src/pages/SupplierRecoveryPortfolio.tsx` (574
  lines — modified: visible SHOCK badge + footnote)

**17 Sep 2026 pass (persistence layer — see Section 13), real counts:**
- `lib/db/src/schema/supplierRecoveryEntries.ts` (NEW, 92 lines / 5,480
  bytes) — Drizzle table + Zod insert schema + provisioning-note disclosure.
- `lib/db/src/schema/index.ts` (modified, 37 lines / 1,275 bytes) — barrel
  export added.
- `artifacts/api-server/src/routes/supplierRecoveryEntries.ts` (NEW, 129
  lines / 5,414 bytes) — GET/PUT whole-state-sync route, 50-row cap.
- `artifacts/api-server/src/routes/index.ts` (modified, 124 lines / 6,262
  bytes) — route mounted at `/supplier-recovery-entries`.
- `artifacts/api-server/tests/supplierRecoveryEntries.test.ts` (NEW, 221
  lines / 10,520 bytes) — 14/14 passing, no regression on the 14/14 sibling
  `supplierDependencyChecks.test.ts` (28/28 combined, freshly re-verified).
- `artifacts/i-supply-chain/src/pages/SupplierRecoveryPortfolio.tsx`
  (modified again this pass, now 1,190 lines / 69,424 bytes — grew from the
  574-line 14 Sep version via the new "My Portfolio" mode, management
  table, `SupplierEditorForm`, and full server-sync block; 574-line SHOCK-
  badge diff is retained, not reverted).
- `docs/SI_Module07_PerformanceRecovery_Worked_Example.md` (this document —
  Sections 3, 7, 11, 12 updated, Section 13 added)
## 13. Persistence-layer addendum — 17 Sep 2026 (EN / العربية)

### 13.1 Why this addendum exists / لماذا هذا الملحق

**EN.** The platform owner's instruction was: "finish and ship SI Module 07
first, then come back ... before deciding whether Module 08 gets a bounded
next batch ... or the team's time goes somewhere else entirely." Reading the
live repo first (Sections 0-12 above) showed Module 07 was already shipped,
independently verified, and CI-green, with exactly two honestly-disclosed
open gaps: no live per-supplier spend/currency field (#668) and no
persistence layer (Section 7, prior wording). Three scope questions were put
to the owner rather than guessed at, because a large architectural decision
should not be assumed on a live platform: (1) whether "finish and ship"
meant closing the persistence gap only or also #668, (2) after the owner
asked why persistence-only was recommended over both, a fuller explanation
of the reasoning (scope containment, module ownership, sequencing), and (3)
whether the persistence layer should ship with a real add/edit/delete form
or just serve a fixed dataset from a table. The owner chose, respectively:
persistence-only (#668 stays a separate, explicitly out-of-scope gap), and
the full real CRUD form. This addendum discloses exactly what was built
against that confirmed scope.

**AR.** كانت تعليمات المالك: إنهاء وإطلاق الوحدة 07 أولاً، ثم العودة قبل البت في ما إذا كانت الوحدة 08 ستحصل على دفعة تالية محدودة أم أن وقت الفريق سيُوجَّه إلى مكان آخر. أظهرت قراءة المستودع الحقيقي أولاً أن الوحدة 07 مبنية بالفعل ومتحقق منها بشكل مستقل، وتوجد فيها ثغرتان مفصح عنهما بأمانة: عدم وجود حقل مباشر لإنفاق/عملة المورد الفردي (#668)، وعدم وجود طبقة تخزين دائم. طُرِحت على المالك ثلاثة أسئلة تتعلق بالنطاق، بدلاً من التخمين، واختار إغلاق فجوة التخزين فقط مع إبقاء #668 خارج النطاق صراحةً، واختار نموذج إضافة/تعديل/حذف حقيقي كامل بدلاً من مجرد عرض بيانات ثابتة.

### 13.2 Architecture — what family this belongs to

**EN.** `supplier_recovery_entries` mirrors the platform's established
**whole-state JSONB sync** family (`supplierDependencyChecks`,
`localContentIcvEntries`, `rarAnalyses`, `tcoAnalyses`, `clmContracts`) —
appropriate because a `SupplierRecord[]` portfolio is a "current working
list the client is actively editing," not an append-only measurement
ledger (the `copqLedger` family). `localContentIcvEntries.ts` (16 Sep 2026,
the newest sibling) was used as the direct template for the schema, route,
and test file. One row per user holds their full portfolio as a `jsonb`
column; a PUT does delete-all-then-bulk-insert inside a transaction, capped
at 50 entries per sync.

**AR.** تُحاكي الجدولة `supplier_recovery_entries` النمط المعماري المعتمد في المنصة لمزامنة الحالة الكاملة بتنسيق JSONB، لأن محفظة موردي `SupplierRecord[]` هي "قائمة عمل حالية يُحررها العميل بشكل مستمر"، وليست سجلاً تراكمياً للقياسات. تم استخدام ملف `localContentIcvEntries.ts` كقالب مباشر. التحديث يقوم بحذف كل شيء ثم إدراج جماعي داخل معاملة، بحد أقصى 50 إدخالاً لكل مزامنة.

### 13.3 What is explicitly NOT included (the #668 boundary)

**EN.** This persistence layer stores a user's `SupplierRecord[]` (name,
category, quadrant, 12-month score history, CARs) — it deliberately does
**not** persist `KraljicItemLite[]` or `SupplierCategoryShare[]`, the
reference data `computeSupplierExposure()` needs to turn a category into a
real SAR figure. Adding that would require schema changes in Module 02/05's
own tables, which is exactly the #668 boundary the owner chose to keep
separate. This is stated explicitly in the schema file's own header comment
so a future session does not silently assume #668 is closed.

**AR.** تُخزِّن طبقة التخزين هذه موردي المستخدم الخاصين فقط (الاسم، الفئة، الربع، سجل الأداء لـ 12 شهراً، وطلبات التصحيح) — ولا تُخزِّن عمداً بيانات المرجع اللازمة لحساب التعرض المالي الحقيقي، لأن ذلك يتطلب تعديل جداول الوحدتين 02 و05 ذاتها، وهو ما قرر المالك إبقاءه خارج النطاق (#668).

### 13.4 Not yet applied to a live database

**EN.** `supplier_recovery_entries` is defined in code (Drizzle schema +
Zod insert schema) but no `drizzle-kit push` has been run against a live
database this session — this sandbox has no live Postgres connection, and
per the credential/repo-access standing rule this session never handles
production DB credentials. The schema file's header comment carries this
provisioning note explicitly, matching the precedent already set by
`localContentIcvEntries.ts`. Whoever holds production DB access runs the
existing `push` script (`lib/db/package.json`) separately; that is
considered the "migration diff" review step for this project, since it
uses schema-diffing rather than generated migration SQL files.

**AR.** جدول `supplier_recovery_entries` مُعرَّف في الكود فقط، ولم يُطبَّق بعد على أي قاعدة بيانات حية. تفتقر هذه البيئة المعزولة لاتصال مباشر بقاعدة Postgres حية، ولا يُفترض أن تتعامل هذه الجلسة مع بيانات اعتماد الإنتاج مباشرةً. من يملك صلاحية الوصول لقاعدة بيانات الإنتاج هو من يشغِّل أمر `push` بشكل منفصل.

### 13.5 The QA 10/10 pass — what it found and fixed

**EN.** Run per `isc-qa-customer-simulation` because this task ships a live
UI component, a form, and persisted data. Dimension 8 (Honesty, Decision
Record 8.7) surfaced one real, genuine defect and it was fixed in this same
pass, then re-verified: the portfolio's headline "SAR Exposure at Risk" KPI
card showed only a dollar total with a generic mock-data badge, with no
disclosure that suppliers whose category has no match in the mock
`DEMO_CATEGORY_ITEMS`/`DEMO_SHARES` reference set are silently excluded from
that total (the underlying engine already returns
`{exposureSAR: 0, exposureBasis: 'INSUFFICIENT_DATA'}` for those suppliers,
and the per-row watchlist already honestly labels them "insufficient data"
— but the aggregate KPI card did not). This becomes materially more likely
to mislead now that real users can add suppliers in arbitrary categories
(the curated 16-supplier demo dataset happens to match the reference set by
construction; a real user's category often will not). **Fix**: the
`PortfolioKPIs.exposureInsufficientDataCount` field the engine already
computed (but never rendered anywhere) is now surfaced on the KPI card's sub-label whenever it is nonzero, in both languages, stating explicitly that N
escalated suppliers were excluded from the total because their category has
no matching benchmark — not because their real exposure is zero. Re-verified after the fix: scoped `tsc --noEmit` clean (0 errors), 66/66
frontend engine tests unchanged, no double-backslash-quote defect (checked).
No other dimension (discoverability, bilingual correctness, data safety,
edge cases, accessibility, cross-feature interaction, visual/tonal
consistency) surfaced a real defect — the mode-tab UI sits directly in the
page's primary content area (discoverable), both EN/AR strings were read
for sense, the delete action matches the platform's own established
no-confirm-dialog convention (`SupplierDependencyCheck.tsx`'s `onRemove`),
the empty-portfolio and disabled-save-button states are handled with real
messages, and every new interactive element is a real `<button>`/`<table>`
with `aria-label`s and `aria-hidden` icons, keyboard-reachable, no
hover-only affordance.

**AR.** نُفِّذت مراجعة الجودة الإلزامية لأن المهمة تُطلق واجهة مستخدم حية ونموذجاً وبيانات محفوظة. وجد الفحص ثغرة حقيقية واحدة في بعد الصدق (البعد 8): بطاقة مؤشر "التعرُّض المالي للخطر" لم تكن تفصح عن استبعاد موردين ببيانات غير كافية من الإجمالي بصمت. تم الإصلاح في نفس الجولة: أصبحت البطاقة تعرض الآن عدد الموردين المستبعدين بوضوح بكلتا اللغتين، مع توضيح أن السبب هو عدم تطابق الفئة مع البيانات المرجعية، وليس لأن التعرُّض الفعلي صفر. أُعيد التحقق بعد الإصلاح: فحص الأنواع نظيف (0 أخطاء)، وجميع اختبارات المحرك 66/66 بدون تغيير.

### 13.6 Verification summary (real, freshly executed — not estimated)

**EN.**
- Frontend: scoped `tsc --noEmit` clean (0 errors, positive control
  confirmed earlier in the session); 66/66 engine tests unchanged
  (`supplierPerformanceRecovery.test.ts` 40/40,
  `supplierRecoveryPortfolio.test.ts` 26/26).
- API server: full unscoped `tsc --noEmit -p tsconfig.json` (not a scoped
  include — validated against the real, fully-built project-reference
  graph) came back clean, 0 errors, after building `lib/db`,
  `lib/api-zod`, and `lib/integrations-openai-ai-server` with
  `tsc --build` first. `supplierRecoveryEntries.test.ts`: 14/14 passing,
  freshly re-run alongside the 14/14 sibling `supplierDependencyChecks.test.ts`
  (28/28 combined). The full api-server suite was verified earlier this
  session at 953/955 passing, with 2 pre-existing, unrelated failures in
  `tests/pgRateLimitStore.test.ts` ("counts hits within a window" and
  "persists counts across store instances") — confirmed via `git status`/
  `git log` to be untouched by this build and almost certainly caused by
  this sandbox having no live Postgres connection for that store's real
  DB-backed rate limiter. Disclosed honestly rather than omitted.
- `pnpm-lock.yaml` drift from the bootstrap install is reverted
  (`git checkout -- pnpm-lock.yaml`) before the final push, per the
  established, disclosed environment-quirk handling for this repo.

**AR.** الواجهة الأمامية: فحص أنواع نظيف بدون أخطاء، 66/66 اختبارات محرك دون تغيير. خادم API: فحص أنواع كامل غير محدود بدون أخطاء، 14/14 لملف الاختبار الجديد (28/28 مع الملف المشابه)، والمجموعة الكاملة 953/955 مع فشلين موجودين مسبقًا غير مرتبطين بهذا البناء والمفصح عنهما بصراحة.
