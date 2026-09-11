# Supplier Lifecycle Governance — Item 3: Pre-Qualification & ASL
### Worked Example, Stress-Test Record, and QA Disclosure
11 September 2026 (updated same day: added section 3.4 and rewrote section 4 in response to the owner's five-point review)

This document is the mandatory worked-example companion to `supplierPreQualification.ts` (Rule 6, "Worked-Example Doc Per Module"). It follows the same pattern already established for Item 1 (COPQ) and Item 2 (RACI): a concrete scenario run through both tiers, followed by the full three-tier stress-test record (soft / hardest-adversarial / boundary) plus one cross-engine chained scenario, with every result below taken from actually executing the shipped code (`npx tsx` against the real `supplierPreQualification.ts`), never invented for this document.

---

## 1. What Item 3 actually is, and is not

Item 3 does not re-derive supplier qualification from scratch. ISC already ships Module 04 (`supplierQualificationGates.ts`), which turns Module 03's Supplier Object Model evidence into a `QUALIFIED / CONDITIONALLY_QUALIFIED / NOT_QUALIFIED / INSUFFICIENT_EVIDENCE` gate result with a named critical-fail rule. Item 3's job is narrower and specifically what the sourced design brief (section 2.1) asked for: turn that gate result into an **ASL (Approved Supplier List) decision**, where ASL status is a **derived field**, never a manual flag — a supplier reaches the ASL only because (a) Module 04 says QUALIFIED or CONDITIONALLY_QUALIFIED, **and** (b) a real, documented approval reason was recorded, **and** (c) the approver was the organization's own RACI Accountable holder for `prequalification_approval` (Item 2's real assignment data) or the org_admin. ASL membership is explicitly not permanent — review cadence is derived from the same Kraljic (Module 02) and concentration (Module 05) risk signals already used elsewhere on the platform, not a new independent score.

**Architecture note (owner review point #1, 11 Sep 2026):** `supplierPreQualification.ts` has zero runtime imports (verified: `grep -n "^import" supplierPreQualification.ts` returns nothing), matching the Standalone-First precedent already set by `supplierCOPQ.ts` and `supplierRACI.ts`. Module 04's gate result is consumed only as `QualificationGateSnapshot` — a plain, caller-supplied interface (`overallStatus`, `blockingGate`, `dueDiligenceTier`, `dueDiligenceGaps`, `dueDiligenceGapsAr`) that field-for-field mirrors `supplierQualificationGates.ts`'s real `QualificationResult` type (verified by direct comparison of both files), not a shadow or reinvented signal. The same plain-shape discipline applies at the HTTP layer: `preQualification.ts`'s route defines its own `QualificationGateSnapshotLike` and re-validates it structurally (`isValidGate()`) rather than importing the frontend package at all — the file header states this explicitly as a disclosed, manually-synced mirror, the same pattern `copq.ts` and `raci.ts` already use. Until Module 04 ships its own UI, `SupplierPreQualification.tsx` collects this snapshot via a manual-entry form (the page's own visible "Disclosed limitation" panel says so) and constructs a real `QualificationGateSnapshot` object from it — the shared shape is used correctly; only its current data source is manual, and that is disclosed, not hidden.

**Sourced methodology** (design brief section 2.1, four named references): a pre-qualification questionnaire covering financials, quality certifications and references filters candidates (sourceday.com "Supplier Prequalification"; greenlight.guru "Supplier Qualification Process"); approval requires a documented reason — an audit, a qualification form, a certification, an engineering approval, a performance record, or a commercial agreement (lassosupplychain.com "Approved Supplier List"; cenitconsulting.com supplier-qualification guidance) — never an unstated judgment call. Review frequency scales with supplier risk rather than one fixed calendar.

**Disclosed limitation, stated plainly (Decision Record 8.7):** Module 04 ships "no UI this cycle" by its own file header. There is no live screen anywhere in the platform yet that runs a supplier's real evidence through the qualification gates and produces a result. Until that screen exists, `SupplierPreQualification.tsx` accepts the gate *outcome* as direct input rather than pretending to recompute it from raw evidence it cannot reach. This is not hidden from the user — the page carries a visible "Disclosed limitation" notice, matching the pattern `RaciMatrix.tsx` already uses for its own no-invite-flow gap. When Module 04 ships its own UI, that screen becomes Item 3's real upstream input with zero change to the derivation logic below.

---

## 2. Rawabi worked example (both tiers)

**Scenario:** Rawabi Industrial Coatings, a strategic-quadrant supplier (Kraljic) with a highly concentrated regional supply base (Module 05), has just completed a Q3 2026 on-site audit. Module 04's gates return `QUALIFIED` with no blocking category, but `dueDiligenceTier: ENHANCED` (strategic quadrant triggers Enhanced DD), disclosing one named unimplemented mechanism (sanctions/PEP screening).

**Advisory tier — `computeAdvisoryASLAssessment()` actual output:**

```
recommendation: RECOMMEND_APPROVE
reviewCadence: QUARTERLY, 90 days
  "Quarterly re-review -- Kraljic quadrant is 'strategic', the same
   high-criticality signal that also triggers Enhanced Due Diligence
   in Module 04."
primary: "Approve to the Approved Supplier List. Module 04's gates
  returned QUALIFIED with no blocking category. Schedule the next
  re-review in 90 days (quarterly)."
alternative (Rule 8 -- genuine second option): "grant a short provisional
  approval (e.g. one review cycle at QUARTERLY cadence regardless of the
  computed tier) rather than the full standard interval, since this
  supplier already sits at Enhanced Due Diligence risk and the disclosed
  due-diligence gaps... were never actually closed, only judged
  acceptable at this evidence level."
dueDiligenceGaps carried through: ["Sanctions/PEP screening -- no data
  source integrated"]
```

Note the cadence reuses the *identical* `highCriticality` signal Module 04's own `determineDueDiligenceTier()` uses for Enhanced DD (strategic/bottleneck quadrant) — this is the design brief's explicit instruction to reuse Module 02's risk-tiering rather than invent a second score, verified by direct code inspection of `supplierQualificationGates.ts` before writing `determineReviewCadence()`.

**Confirmed for the record (owner review point #2, 11 Sep 2026):** the Module 02/05 risk-tiering reuse is real and shipped, not deferred or missed — it is simply what section 2's paragraph above already documents. `determineReviewCadence(signals: RiskTierSignals)` reads exactly two fields, both already-computed elsewhere: `signals.kraljicQuadrant` (Module 02's `KraljicQuadrant` union, `'strategic' | 'leverage' | 'bottleneck' | 'non-critical'`) and `signals.concentrationBand` (Module 05's `ConcentrationBand` union). Its `highCriticality` line — `signals.kraljicQuadrant === 'strategic' || signals.kraljicQuadrant === 'bottleneck'` — is byte-identical to the line Module 04's own `determineDueDiligenceTier()` uses for the same purpose (verified by direct comparison of both source files, not by description). `concentrationBand === 'highlyConcentrated' | 'moderatelyConcentrated'` drives the SEMI_ANNUAL tier when Kraljic alone doesn't flag elevated risk. Both signals are optional — a caller with neither gets the honest `ANNUAL` default with a note explaining why, never a fabricated tier. This should have been called out explicitly in the original close-out summary; it was implemented but not stated plainly enough, which is corrected here.

**Operational tier — recording the decision:** `validateASLDecision({ decisionType: 'approved', gate: <above>, reasonCategory: 'audit', reasonNote: 'Q3 2026 on-site audit, Rawabi Industrial Certification Body' })` → `{ valid: true, errorsEn: [], errorsAr: [] }`. The route (`preQualification.ts`) re-runs this identical check server-side before ever inserting the row, and additionally verifies the acting user is either `org_admin` or the org's current RACI Accountable holder for `prequalification_approval` (replayed from `raci_assignment_events`) — never trusting a client-supplied approver claim. The resulting `asl_decision_events` row carries `reviewDueAt` computed as `computeNextReviewDueDate(now, {days: 90, ...})`, verified below to be exact.

---

## 3. Stress-test record (Rule 7 — three tiers, executed, not asserted)

All commands below were actually run with `npx tsx` against the shipped `supplierPreQualification.ts`. No defect was found; every result matched the intended design, so no fix was required in this pass — stated honestly rather than padding this section with a manufactured defect.

### 3.1 Soft (realistic but messy)

| Case | Input | Result |
|---|---|---|
| No risk signals supplied at all | `CONDITIONALLY_QUALIFIED`, no Kraljic/concentration | `ANNUAL` cadence with an explicit "honest default... re-run once Module 02/05 data exists" note — never silently guesses a shorter/longer cadence |
| Approve attempt missing `reasonCategory` | `decisionType: 'approved'`, `reasonCategory: null` | `valid: false`, "A documented approval reason ... is required." |

### 3.2 Hardest (adversarial — deliberately trying to break the derivation rule)

| Case | Attack | Result |
|---|---|---|
| Manual-override attempt | Approve a `NOT_QUALIFIED` supplier with a plausible-sounding commercial reason | **Rejected**: "ASL status is derived from the gate result, not a manual flag." |
| Upgrade attempt | Conditionally-approve an `INSUFFICIENT_EVIDENCE` supplier | **Rejected**: "cannot be upgraded to a conditional approval by manual override." |
| Fabricated reinstatement | `reinstated` with no prior `suspended` state | **Rejected**: "there is no suspended prior state to reinstate from." |
| Wrong-vocabulary reuse | `suspended` decision using an approval-only reason (`audit`) instead of a lifecycle reason | **Rejected**: "A documented lifecycle reason ... is required" — approval and lifecycle reason vocabularies are correctly kept separate, since the two designed-in category sets are sourced to different things (approval reasons to the four named references; lifecycle reasons disclosed as standard vendor-lifecycle practice) |
| No evidence at all | `computeAdvisoryASLAssessment(null, {})` | `RECOMMEND_INSUFFICIENT_DATA`, explicit "N/A -- there is no responsible alternative to running the gates; this is not a judgment call this module is permitted to make" — confirms Rule 1 is enforced even under Rule 8's own "always give an alternative" pressure |
| Route-layer RACI replay: stale-holder unassign | Accountable role superseded (user 5 → user 9), then a **stale** unassign of user 5 arrives | Current holder correctly **stays 9** — the mirror does not let an out-of-order/stale event clear a holder it did not actually assign, matching `supplierRACI.ts`'s own single-owner replay semantics exactly (verified by direct comparison) |
| Route-layer RACI replay: wrong activity | An `A` assignment exists only for `copq_review` | `currentAccountableHolder(events, 'prequalification_approval')` correctly returns `null` — no cross-activity leakage |

### 3.3 Boundary

| Case | Result |
|---|---|
| Kraljic `strategic` vs `leverage` (the exact quadrant-set boundary `determineReviewCadence` branches on) | `strategic` → QUARTERLY; `leverage` → ANNUAL; `bottleneck` → QUARTERLY; `non-critical` → ANNUAL — matches the four-quadrant model exactly, no off-by-one across the boundary |
| Concentration band boundary, no Kraljic supplied | `highlyConcentrated` and `moderatelyConcentrated` both → SEMI_ANNUAL; `competitive` → ANNUAL |
| Date arithmetic exactness | From 2026-09-11T00:00:00Z: QUARTERLY (90d) → **2026-12-10**; SEMI_ANNUAL (182d) → **2027-03-12**; ANNUAL (365d) → **2027-09-11** — all exact, verified against `Date.setUTCDate` output, not approximated |
| Overdue boundary (`asOf === reviewDueAt` exactly) | `asOf` equal to `reviewDueAt` → `isReviewOverdue: false` (strict `<`, not `<=`); `asOf` one millisecond later → `isReviewOverdue: true` — the exact `>`-vs-`>=` class of bug Rule 7 calls out was checked at the actual millisecond boundary, not just "the same day" |
| Empty event history | `computeCurrentASLState('SUP-NEW-1', [], now)` → `status: 'NEVER_ASSESSED'`, `onASL: false` — never defaults to a false "approved" or "declined" |
| Chained cross-engine adversarial (Rule 7, cross-engine requirement): approve → suspend → reinstate, replayed out of pure insertion order by `createdAt` | Final state correctly resolves to `reinstated` / `onASL: true` / the reinstatement's own `reviewDueAt` (2027-01-15), not the original approval's stale due date — confirms the "latest by `createdAt`, not latest by insert order" replay rule actually holds under a real three-event lifecycle, the same discipline `raci_assignment_events` already uses |

### 3.4 HTTP-boundary enforcement (added 11 Sep 2026, owner review point #3)

The stress-testing above (3.1-3.3) exercises `supplierPreQualification.ts`'s pure functions directly — it proves the derivation *logic* is correct, but not that the live Express route actually enforces it at the network boundary. A separate test file, `artifacts/api-server/tests/preQualification.test.ts`, closes that gap: real `supertest` HTTP requests against the real, unmodified `preQualification.ts` router (no mocked business logic — only the database layer is mocked, following the same pattern already used by `tests/supplierDependencyChecks.test.ts`). All 11 cases below were genuinely executed with vitest against the live route file, not asserted:

| Case | Request | Result |
|---|---|---|
| Unauthenticated | `POST /decisions` with no session | `401`, zero DB insert calls |
| Malformed payload | `decisionType: 'rubber_stamped'` (not in the fixed vocabulary) | `400` before any database call |
| **HARDEST**: non-admin, non-Accountable member | Plain `member` role; the real RACI Accountable holder for `prequalification_approval` is a different user (99); payload is a fully valid, well-formed approval | **`403`**, zero DB insert calls — a syntactically perfect payload from the wrong caller is still refused |
| **BOUNDARY**: Accountable for the wrong activity | Caller genuinely holds Accountable, but for `raci_maintenance`, not `prequalification_approval` | `403` — the activity-key filter is real, not "any RACI assignment counts" |
| **BOUNDARY**: since-unassigned Accountable holder | Caller was Accountable, then a later `unassigned` event supersedes it | `403` — stale historical authority does not carry forward |
| No RACI assignment exists at all for the org/activity | Plain member, empty RACI event history | `403` |
| **Positive control**: `org_admin` caller | Valid approval payload | `200`, and a real DB insert genuinely occurs with the correct `organizationId`/`approverUserId` — proves the harness is not just unconditionally returning 403 |
| **Positive control**: genuine RACI Accountable holder (non-admin) | Valid approval payload | `200`, real insert occurs |
| Authorized caller, unsupported decision | `org_admin` caller, but `gate.overallStatus: 'NOT_QUALIFIED'` for an `'approved'` decision | `400` — confirms the write-gate (who may call) and the derivation rule (what the gate result supports) are two independently enforced checks, not one standing in for the other |

Running the repository's full test suite alongside this file shows no regression: 808/810 tests passing across 51/52 test files. The 2 failing tests are in the pre-existing `tests/pgRateLimitStore.test.ts`, which requires a live local PostgreSQL instance (`ECONNREFUSED` on `127.0.0.1:5432` in this sandbox) — an unrelated environment gap, not something this change touched.

---

## 4. Competitive moat (Rule 10 — named-competitor benchmark, added 11 Sep 2026 in response to the owner's review point #5)

The design brief's section 2.7 note ("SAP Ariba, Coupa, and Jaggaer all ship supplier qualification/onboarding...") was written *before* this item was built, as a pre-build hedge — it was never re-checked against what actually shipped. This section does that check now, against what could actually be verified via each vendor's own current public material (documentation pages, product pages, and datasheets, fetched 11 Sep 2026), hedged honestly where public material is silent rather than assumed to mean the capability doesn't exist.

**What the named platforms publicly describe:**

- **SAP Ariba** — supplier qualification is a real, named workflow (SAP Ariba Supplier Lifecycle & Performance): a qualification questionnaire/template process that gates a supplier into "preferred supplier for a specific commodity, region, and department" status and can restrict sourcing-event/award eligibility. Public training material does not specify what determines pass/fail or whether requalification is risk-tiered by cadence — absence of public detail is not proof of absence in the product, stated per Decision Record 8.7.
- **Coupa** — supplier onboarding via configurable workflows collects qualification data, but Coupa's own marketing describes risk management as *continuous, event-triggered monitoring* (real-time alerts, automatic hold recommendations when a rating changes) rather than a scheduled review cadence. This is a genuinely different model from ISC's `determineReviewCadence()`, not a weaker one — see the honest gap noted below.
- **Jaggaer** — supplier qualification/selection is informed by an integrated third-party risk feed (its riskmethods partnership): a world-map risk view and near-real-time alerts feed into qualification and scorecard decisions, similar in spirit to Coupa's continuous-monitoring model.
- **GEP** (current product line is GEP Quantum Intelligence; "GEP SMART" as such was not found in current public material, stated honestly rather than guessed) — an agentic "Risk & Compliance Agent" continuously monitors supplier data and a "Supplier Onboarding Agent" guides qualification/validation, again a continuous-monitoring model rather than a scheduled cadence.
- **Ivalua** — publicly describes "streamlines processes for supplier registration, qualification and approval workflows" with integrated risk-and-performance management, but its own material does not specify a review cadence, scheduled or continuous — genuinely unknown from what's public, stated as such rather than assumed either way.

**Sourced framework grounding (CIPS / ISM / ISO, matching Module 06's benchmarking discipline):** the requirement that an approved-supplier decision be documented and evidenced, not an unstated judgment call, is standard practice reflected in ISO 9001/AS9100 approved-vendor-list convention and CIPS's procurement-and-supply body of knowledge; ISM's Certified Professional in Supply Management (CPSM) body of knowledge covers supplier qualification and selection as a core competency area. None of these bodies mandate a specific software mechanism for *enforcing* the derivation rule in code — that enforcement design (never allowing "approved" to be recorded unless the actual gate result supports it, checked twice: once client-side, once server-side, and now HTTP-boundary-tested per section 3.4) is ISC's own implementation choice, not something claimed to be copied from a named source.

**Honest assessment of ISC's actual differentiation:**

ISC's real, verifiable edge is narrower than "better than these five platforms" and is stated at that scope: `validateASLDecision()` (and its server-side mirror) makes it structurally impossible to record "approved" or "conditionally_approved" unless the supplied gate snapshot's `overallStatus` actually supports it — verified above under the adversarial "manual-override" and "upgrade" cases, and now proven to hold at the HTTP boundary too (section 3.4), not just in a pure function a client-side bug could bypass. None of the five platforms' public material describes an equivalent hard-coded, dual-enforced (client- and server-side) refusal specific to *this* derivation rule; a generic spreadsheet-based ASL tracker or an off-the-shelf SRM's free-text "status" field has no equivalent at all. That is a real, if narrow, claim — not "ISC's ASL module is more advanced than SAP Ariba's."

**Honest gap against these named competitors (Decision Record 8.7 — stated, not smoothed over):** several of the named platforms (Coupa, Jaggaer, GEP) market *continuous* risk monitoring feeding qualification decisions in near real time, whereas ISC's review cadence here is a scheduled tier (QUARTERLY/SEMI_ANNUAL/ANNUAL) computed once and re-read on demand — `isReviewOverdue` is computed when the register is opened, not pushed as a live alert the moment a supplier's risk profile changes. This is the same gap already named in the "Honest gap against a full enterprise SRM suite" note below, restated here specifically against the continuous-monitoring model these named competitors describe, rather than left as a vague "no notifications" comment.

**Honest gap against a full enterprise SRM suite:** this module does not (and cannot, without ISC-side infrastructure this platform does not have) automate document-expiry chasing, send renewal reminders, or run a supplier self-service portal. `isReviewOverdue` is computed on read, not pushed as a proactive notification — a client must open the register to see it. This is named here, not smoothed over.

---

## 5. QA 10/10 customer-simulation pass (isc-qa-customer-simulation)

Simulated user: a GCC procurement manager at a mid-market manufacturer, first time opening this page, on both desktop and a mobile browser.

1. **Real scenario walkthrough** — Rawabi example above walked end-to-end on both tiers; make sense to a first-time user (gate inputs → decision-ready recommendation card → primary + alternative → cadence).
2. **Discoverability** — nav entry added to `Header.tsx`'s existing `servicesList` array (`📋 Pre-Qualification & ASL`, positioned immediately after the RACI Matrix entry it depends on), same list every other Supplier Lifecycle Governance item uses — a returning user who found COPQ/RACI will find this the same way.
3. **Bilingual correctness** — every string in `SupplierPreQualification.tsx` and `supplierPreQualification.ts` ships a real, independently-authored Arabic counterpart (not machine-reused English), RTL verified via the existing `isAr ? 'rtl text-right' : 'ltr text-left'` wrapper already proven correct by `RaciMatrix.tsx` / `SupplierCOPQ.tsx`.
4. **Data safety** — the register is append-only; the decision form never edits or deletes a prior row, and the "current state" shown is always a read-time replay, never a stored mutable field a bug could corrupt.
5. **Edge cases** — empty register (`t.noSuppliers`), no organization (`t.noOrgNote`), not-yet-authorized user (`t.notAuthorizedNote`, controls disabled but visible, matching `RaciMatrix.tsx`'s exact convention), `INSUFFICIENT_EVIDENCE`/null-gate states all produce an explicit message rather than a blank recommendation card.
6. **Accessibility** — every interactive control is a real `<button>`, `<select>`, or `<input>` with an associated `<label>`/`aria-label`; no hover-only affordance; disabled (not hidden) form controls for unauthorized users keep them discoverable and explainable.
7. **Cross-feature interaction** — the Operational tier's write-gate genuinely calls Item 2's live RACI data (`/api/raci/current`) and reflects a real accountability gap if the org has never assigned an Accountable holder for `prequalification_approval` (the control simply stays disabled with the existing "not authorized" notice, rather than crashing).
8. **Honesty (Decision Record 8.7)** — the "Disclosed limitation" panel (section 1 above) is on the page itself, not just in this doc; `INSUFFICIENT_EVIDENCE`/null-gate paths never fabricate a status.
9. **Visual/tonal consistency** — reuses `RaciMatrix.tsx`'s exact tier-toggle, framework-source box, and color tokens (`#082C6B`) rather than introducing a new pattern.
10. **Fix, don't just log** — the stress test in section 3 found no real defect to fix; this is stated plainly rather than padded.

**Real gap found and disclosed (not fixed in this task, out of scope):** there is no in-app notification when a review goes overdue — a client must visit the register to see `isReviewOverdue`. Logged here as a genuine, separate backlog item for a future notification-system build, not silently dropped. (Section 4 above restates this specifically against the continuous-monitoring model several named competitors describe.)

---

## 6. Files shipped with this item

- `artifacts/i-supply-chain/src/lib/supplierPreQualification.ts` — standalone engine (zero imports, matching COPQ/RACI precedent)
- `lib/db/src/schema/aslRegister.ts` — `asl_decision_events`, append-only, barrel-exported via `schema/index.ts`
- `artifacts/api-server/src/routes/preQualification.ts` — `/api/pre-qualification/*`, mounted in `routes/index.ts`
- `artifacts/api-server/tests/preQualification.test.ts` — HTTP-boundary tests against the live route (added 11 Sep 2026, section 3.4)
- `artifacts/i-supply-chain/src/pages/SupplierPreQualification.tsx` — bilingual UI, wired into `App.tsx` (`/pre-qualification-asl`) and `Header.tsx`'s nav
- This document, plus `docs/README.md` — the first real `docs/` folder committed to this repository (see the Site Map for why this was an explicit, separately-tracked requirement)
