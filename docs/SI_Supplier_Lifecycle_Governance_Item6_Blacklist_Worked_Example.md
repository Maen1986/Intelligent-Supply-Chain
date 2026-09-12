# Supplier Lifecycle Governance -- Item 6: Supplier Blacklist
### Worked-Example Document (12 Sep 2026)

## 0. Framing -- what this is and what it is not

This is Item 6 of 7 in the Supplier Lifecycle Governance build -- the
negative, for-cause counterpart to Item 3's Approved Supplier List (ASL).
It is explicitly **not** the same thing as a supplier simply lapsing off
the ASL. Item 3's `supplierPreQualification.ts` already has `suspended` /
`revoked` ASL decision types for administrative, often no-fault reasons (a
certification lapsed, a re-review wasn't completed, a commercial
relationship ended). Blacklisting is a distinct, more severe governance
action: an affirmative, for-cause finding that a supplier's conduct
warrants active exclusion, carrying real due-process implications for a
real external commercial counterparty -- an evidence threshold, a right to
respond, and an explicit (never defaulted) duration decision. Item 2's own
`supplierRACI.ts`, built months before this item was scoped, already
carries two separate RACI activity keys -- `blacklist_decision` (for-cause)
and `offboarding_decision` (no-fault, Item 7) -- confirming this distinction
was anticipated, not invented late.

ISC is a consultancy, not shop-floor operations or a tribunal: this module
produces a recommendation, an evidence record, and (Operational tier) a
persisted decision the client's own authorized user made. It does not
itself investigate, contact the supplier, or adjudicate the case.

## 1. Sourced methodology

**The World Bank Group Sanctions System** (Office of Suspension and
Debarment, fetched 12 Sep 2026) is a real, mature, currently-operating
due-process regime: an Evaluation and Suspension Officer must find
"sufficient evidence" before a Notice of Sanctions Proceedings issues; the
accused party gets a genuine two-tier right of response (an Explanation to
the EO, then a de novo Response to the Sanctions Board); and debarment is
explicitly not one-size-fits-all -- Fixed Term, conditional release on
compliance, or permanent debarment reserved for cases with "no realistic
prospect of rehabilitation," with even long debarments carrying a
petition-for-reduction path.

**The UK Procurement Act 2023's** supplier exclusion/debarment list (fetched
12 Sep 2026) is a real, current public-procurement law distinguishing
MANDATORY exclusion grounds (automatic, fixed periods) from DISCRETIONARY
grounds (the authority exercises judgment), giving excluded suppliers an
8-working-day standstill plus a 30-day appeal window, and allowing a
supplier to apply for removal on "a material change of circumstances"
(self-cleaning) -- exclusions run for a specified period, not forever by
default.

ISC's own `evidenceThreshold` / `rightToRespond` / `durationType`
vocabulary in `supplierBlacklist.ts` is a **disclosed synthesis** of these
two real regimes, not a verbatim copy of either one alone -- stated
explicitly in the module's own header, per Rule 2.

**Honest GCC-specific finding, disclosed rather than guessed.** A real
GCC-specific mechanism does exist: Saudi Arabia's Government Tenders and
Procurement Law (GTPL) gives the Ministry of Finance the role of
"maintaining a list of boycotts" -- a real, government-operated supplier
exclusion register. But the secondary legal-commentary sources available
for this research (Al Tamimi & Co., Reed Smith) do not publish that list's
Implementing-Regulation-level procedural detail -- those sources themselves
note the fine detail sits in Implementing Regulations referenced dozens of
times but not reproduced in the commentary. Rather than fabricate that
detail or drop the GCC-specific requirement silently, the module cites the
GTPL boycott-list as real evidence a GCC precedent exists, while sourcing
its actual due-process mechanics from the World Bank / UK Act frameworks
above. Two adjacent premises were separately checked and corrected rather
than assumed: **Nazaha** (Saudi Arabia's Oversight and Anti-Corruption
Authority) was confirmed to be a general investigation/referral body, not a
supplier-debarment operator -- so it is not cited as a due-process source
here. **CIPS's** public ethical-procurement materials were checked and
found to be preventative (what suppliers should do), not remedial (what a
buyer does when one fails) -- so, unlike Items 1-5, CIPS is named in the
competitive-benchmark section (Section 7) but not cited as a due-process
source.

## 2. Design contract -- authorization bar, a disclosed escalation

Every write-gate through Item 5 accepted **org_admin OR the org's current
RACI Accountable holder** for the relevant activity, treated as equally
valid. Item 6 breaks that symmetry on purpose:

| Action | Route | Gate | Why |
|---|---|---|---|
| Draft recommendation | `POST /api/blacklist/draft` | org_admin OR RACI Accountable for `blacklist_decision` | Non-binding, no real-world consequence yet -- same pattern as Items 1-5 |
| Finalize | `POST /api/blacklist/finalize` | **org_admin only** | Real commercial/legal consequence for an external party |
| Reverse/appeal | `POST /api/blacklist/reverse` | **org_admin only** | Equally consequential -- correcting a finalized, consequential action |

The RACI Accountable archetype for `blacklist_decision` is already
"Procurement Director / CPO (or Executive Committee for high-risk cases)"
(`supplierRACI.ts`'s own `RACI_TEMPLATE`) -- a senior role, but one any
org_admin could in principle reassign to someone more junior through
ordinary RACI reassignment. Given the due-process weight this module
asserts on the client's behalf (an evidence threshold and a right to
respond that matter to a real external party), finalize and reverse are
gated to the org's own verified senior authority rather than a reassignable
role. This is a genuine escalation over the Items 2-5 pattern, stated here
explicitly per instruction rather than silently reused, and proven at the
HTTP layer: the CORE AUTHORIZATION-BAR CASE constructs a genuine RACI
Accountable holder for `blacklist_decision` and confirms `/finalize` 403s
them -- accountable-alone is explicitly insufficient.

**Not a one-click ban.** `SupplierBlacklist.tsx` never lets finalize happen
in one click. Before `POST /finalize` ever fires, the Operational tier
walks a mandatory 4-step wizard, each step's "Next" gated on that step's
own validation: (1) Review -- evidence/rationale shown, Next disabled until
`validateBlacklistFinalization()`'s threshold check passes; (2) Due process
-- explicit confirmation the supplier's right to respond was given, never
assumed; (3) Duration -- an explicit choice among `time_bound` (requires an
effective-until date), `indefinite_pending_review`, or `permanent`, never
defaulted; (4) Confirm -- a red warning banner, and the admin must type the
exact supplier ID before finalize is enabled. Server-side,
`validateBlacklistFinalization()` re-checks all four gates independently of
whatever the UI showed -- proven by the HARDEST stress test in Section 5.

## 3. Standalone-first disclosure -- zero exceptions taken

Item 5's poor periodic-evaluation outcomes and Item 1's severe COPQ figures
are natural SUGGESTED evidence for a blacklist case. They are wired as
caller-supplied, disclosed plain-data mirrors
(`PeriodicEvaluationOutcomeLike`, `COPQSeverityLike`,
`Module07EscalationSnapshotLike`) -- never as automatic triggers, and never
as a runtime import from Item 1 or Item 5's own code. Unlike Item 5, which
took one explicit, disclosed Standalone-First exception (a direct call into
the governance-tier module's cadence function), Item 6 has **zero** runtime
imports from any sibling module -- there was no comparable case here for a
live cross-module call, so the normal rule applies without exception.

**Cross-reference, not a duplicate status field.** A finalized blacklist
decision must flag the supplier's Item 3 ASL entry as inactive. Rather than
add a second `isBlacklisted` column, `POST /api/blacklist/finalize` writes
a real, additional row directly into Item 3's own existing
`asl_decision_events` table in the same request:

```
decisionType: 'revoked'
reasonCategory: 'compliance_violation'
qualificationGateStatusAtDecision: 'INSUFFICIENT_EVIDENCE'  (disclosed honest default)
dueDiligenceTierAtDecision: 'STANDARD'                      (disclosed honest default)
```

This was verified as a genuine consequence, not just plausible-sounding
documentation: `artifacts/api-server/src/routes/onboarding.ts` was read
directly, and its ASL gate re-derives `onASL` fresh from
`asl_decision_events` on every single write, with no caching. A finalized
blacklist decision therefore blocks future onboarding attempts against that
supplier with **zero code changes to `onboarding.ts`** -- confirmed at the
HTTP layer by the POSITIVE CONTROL + CORE CROSS-REFERENCE CASE, which
asserts that finalizing inserts *both* rows in one request.

**Honest platform gap, disclosed rather than built around**: the platform
has no purchase-order or commercial-transaction engine yet for a blacklist
check to gate. `computeBlacklistBlockSignal()` is exported as a documented
forward contract, same shape as the onboarding gate's own check, for a
future PO/contracting module to call -- nothing calls it today, because
there is nothing to call it. Stated plainly, not built around.

## 4. Worked example -- Rawabi Precision Machining LLC (`SUP-RAWABI-06`)

Rawabi has been an approved, onboarded supplier for two years. A pattern of
concerns has been building.

1. **Advisory tier, first look.** The client opens `/blacklist`, enters
   `SUP-RAWABI-06`. Item 5's most recent periodic evaluation for Rawabi
   shows `overallRecommendation: escalate_consider`, worst category
   `compliance/ESG` rated `at_risk` (a failed environmental-permit
   surveillance audit). Item 1's COPQ rollup for the same supplier over the
   trailing quarter shows `totalCostedUSD: 8,400` with an
   `externalFailureShare` of `0.22` (22%) -- a genuinely good number, well
   under the 50% severity threshold `buildSuggestedEvidenceLinks()` uses to
   flag severe COPQ. No Module 07 escalation is active. Result: one
   accumulating evidence item (`periodic_evaluation_failure`), zero
   independently-sufficient items -> `RECOMMEND_HOLD_AT_ASL_SUSPENSION`,
   not formal review. The UI shows the rationale plainly: strong COPQ
   history, one serious but isolated compliance flag -- not yet enough on
   its own.
2. **A second signal arrives.** Three weeks later, the client logs a
   manually-documented `contractual_breach` (Rawabi shipped material without
   the contractually-required mill-test certificates on two consecutive
   POs) -- an independently-sufficient category on its own. Re-running the
   advisory check now returns `RECOMMEND_FORMAL_REVIEW`, citing both the
   periodic-evaluation flag and the contractual breach, with a "Consider
   also" alternative surfaced per Rule 8: hold at ASL suspension pending one
   more corrective-action cycle, rather than proceeding straight to formal
   review, given Rawabi's otherwise-strong COPQ history.
3. **Operational tier -- draft.** The org's RACI Accountable holder for
   `blacklist_decision` (the Procurement Director) creates a draft entry
   citing both evidence items. This succeeds under the lighter draft gate.
4. **Finalize -- the 4-step wizard.** The Procurement Director cannot
   finalize -- only org_admin can. The org_admin reviews the same evidence
   (Step 1, Next enabled once threshold met), confirms Rawabi was given a
   documented right to respond and did so in writing (Step 2), chooses
   `time_bound` with an 18-month `effectiveUntilIso` rather than permanent,
   citing Rawabi's otherwise-strong two-year track record as grounds for a
   fixed term rather than indefinite exclusion (Step 3), and types
   `SUP-RAWABI-06` exactly to confirm (Step 4). `POST /finalize` fires.
   Server-side: a `blacklist_events` row (`action: finalized`,
   `durationType: time_bound`) and, in the same request, a real `revoked`
   row into `asl_decision_events` for `SUP-RAWABI-06`.
5. **Immediate, verified consequence.** A different user attempts to
   re-onboard Rawabi under a new contract code. Item 4's onboarding route
   re-derives ASL state fresh from `asl_decision_events` and refuses --
   with zero code changes needed anywhere in `onboarding.ts` for this to
   work, because the gate was already re-deriving state on every write
   before Item 6 existed.
6. **Eight months later -- an appeal.** Rawabi provides evidence of a
   completed corrective-action plan and updated certifications. The
   org_admin reviews and reverses the entry (`action: reversed`) before the
   18-month term would have lapsed naturally. `computeCurrentBlacklistState()`
   immediately reflects "not blacklisted" -- the reversal is real, not
   cosmetic, and (per Section 3's cross-reference design) a client wishing
   to re-admit Rawabi to the ASL would separately record a new Item 3
   decision; Item 6 itself does not auto-restore ASL status, only removes
   the active exclusion.

## 5. Stress-test results

**Standalone module (`supplierBlacklist.test.ts`, 39/39 passing)**:

- **CORE CONFLICTING-INPUTS CASE** (the spec's own named case): great COPQ
  history (low external-failure share, does not independently trigger) +
  one severe periodic-evaluation failure (accumulating, not independently
  sufficient) -> holds at `RECOMMEND_HOLD_AT_ASL_SUSPENSION`, not formal
  review. The same scenario with a second accumulating signal (an active
  Module 07 escalation) added crosses the 2-item accumulation threshold ->
  `RECOMMEND_FORMAL_REVIEW`. Proves the model discriminates a single red
  flag from a genuine pattern, rather than either overreacting to one data
  point or requiring an independently-sufficient category every time.
- **CORE REVERSAL/APPEAL CASE** (the spec's own named case): a finalized
  entry followed by a `reversed` event lifts the blacklist entirely --
  `computeCurrentBlacklistState()` always replays to the latest event. A
  further case proves a reversed entry can be superseded by a *later*
  re-finalize (an appeal rejected on fresh review) -- the latest event
  always wins.
- **SUPPLIER ALREADY ASL-INACTIVE FOR UNRELATED REASONS** (the spec's own
  named case, and this module's honest scope boundary): confirmed directly
  that `computeCurrentBlacklistState()` has no opinion on, and never reads,
  ASL state at all -- a supplier off the ASL for an unrelated reason (e.g.
  Item 3's own `commercial_relationship_ended` revocation) is correctly NOT
  reported as blacklisted unless `blacklist_events` itself says so. The
  advisory recommendation likewise never infers blacklist-worthiness from
  ASL status -- ASL state is not one of this module's inputs at all, by
  design.
- **Boundary**: exactly two accumulating (non-independently-sufficient)
  evidence items meets the sufficiency threshold; exactly one does not. A
  single independently-sufficient item (e.g. a confirmed
  `compliance_violation`) reaches `RECOMMEND_FORMAL_REVIEW` alone, modeled
  after the World Bank / UK Act's own pattern of naming some grounds as
  independently serious rather than accumulative. A `time_bound` entry
  expires at the exact instant `effectiveUntilIso` is in the past --
  derived at read time on every call, never a stored/mutable flag -- while
  `indefinite_pending_review` never auto-expires by design. Zero evidence
  at all correctly returns `RECOMMEND_INSUFFICIENT_EVIDENCE` rather than
  guessing (Decision Record 8.7).
- **Hardest**: all four finalize gates (evidence threshold, right to
  respond, duration type, `time_bound` requiring an effective-until date)
  failing simultaneously -- the validator reports every violation, not just
  the first one hit.
- **Cross-supplier isolation**: events belonging to a different
  `supplierId` are correctly excluded from a given supplier's replay.
- **Rule 8 check**: every advisory recommendation names a genuine primary
  path and a strong named alternative, in both languages -- not a caveat
  bolted onto a single recommendation.

**HTTP-boundary tests (`blacklist.test.ts`, 26/26 passing)**: 401
unauthenticated on all three routes; 400 malformed payloads before any
gate/DB logic runs; 403 non-authorized callers, including the BOUNDARY case
of a caller who is Accountable for a *different* RACI activity
(`periodic_evaluation`, not `blacklist_decision`); positive controls for
the draft gate (both org_admin and the genuine Accountable holder
accepted); the **CORE AUTHORIZATION-BAR CASE** -- the genuine RACI
Accountable holder for `blacklist_decision` is 403'd on `/finalize`,
proving accountable-alone is explicitly not sufficient; 400s on `/finalize`
for insufficient evidence, unconfirmed right-to-respond, and a `time_bound`
duration missing its effective-until date, even for a genuine org_admin;
the **POSITIVE CONTROL + CORE CROSS-REFERENCE CASE** -- org_admin with a
fully valid finalize payload inserts both the blacklist event and a real
`revoked` row into `asl_decision_events`; on `/reverse`, a 403 for a plain
member (including the genuine RACI Accountable holder -- reversal is
equally consequential, org_admin only), a 400 when the supplier is not
currently, actively blacklisted (the route never trusts a client-supplied
claim), a 400 when a time-bound entry has already expired (not "actively"
blacklisted), and the **POSITIVE CONTROL + CORE APPEAL CASE** -- org_admin
reverses an actively-blacklisted supplier and a real `reversed` event is
inserted.

## 6. Durable persistence (Operational tier)

`blacklist_events` (append-only, mirroring `copq_ledger` /
`raci_assignment_events` / `asl_decision_events` / `onboarding_step_events`
/ `governance_tier_override_events` / `periodic_evaluation_events`):
`draft_set` / `draft_clear` / `finalized` / `reversed` actions, replayed to
derive current state -- `isBlacklisted`, `isExpired`, `hasOpenDraft`,
`latestEvent` -- never a mutable "current" column. Evidence (jsonb),
`rightToRespondConfirmed`, `durationType`, and `effectiveUntil` are stored
on the event row itself, the same precedent as `copq_ledger`'s own `data`
jsonb column.

**Write-gates**: draft -- org_admin OR the org's current RACI Accountable
holder for `blacklist_decision`; finalize and reverse -- **org_admin only**
(Section 2), re-derived server-side on every write via disclosed,
manually-synced mirrors of `currentAccountableHolder()` and
`currentBlacklistState()` -- never trusted from the client.

**Cross-reference reuse**: the `/finalize` route inserts directly into the
client's own existing `asl_decision_events` table (Section 3) -- no new
alert or status table, per instruction.

## 7. Competitive-moat benchmark

Named debarment/blacklist practice used as the due-process backbone: the
**World Bank Group Sanctions System**, the **UK Procurement Act 2023**
exclusion regime, and (disclosed as procedurally thin at the secondary-
source level) **Saudi Arabia's GTPL** Ministry of Finance boycott list
(Section 1). Named commercial SRM/procurement platforms -- **SAP Ariba,
Coupa, JAGGAER, GEP, and Ivalua** -- were not re-checked against fresh
marketing pages for this specific item (unlike Item 5's benchmark, which
did a fresh page-by-page check); this is disclosed as informed industry
positioning rather than a verified feature audit for this item. The honest,
hedged comparison: most commercial SRM suites treat a supplier exclusion as
a status field on a supplier record, updated in place. ISC's real,
verifiable difference here is the append-only `blacklist_events` log with
derived, read-time state (never a mutable flag) plus a genuine, live
cross-reference into the same ASL event log that gates onboarding -- a
structural choice visible directly in the codebase (Section 3), not a
marketing claim.

**Where a genuine gap against best-in-class practice remains, stated
honestly**: none of the named World Bank/UK regimes' full multi-stage
appeals infrastructure (a standing Sanctions Board, a formal
standstill-period clock, external counsel processes) is built here -- ISC's
4-step wizard and single reversal action is a proportionate synthesis for a
mid-market/enterprise GCC buyer, not a claim to replicate a sovereign or
multilateral tribunal's full apparatus.

## 8. CI-gate evidence

Real evidence, retained as this build's own proof the CI gate is genuinely
working. Pushed via an atomic 11-file commit
(`a422e399cb8dbf19fcc4dd3394e4f9f152cdf452`) after a pre-flight check
confirmed 11/11 files hash-matched local source with zero placeholder
markers, and the returned blob SHAs for all 11 files matched the local
`git hash-object` values exactly (byte-verified, not assumed). Both CI
checks against this commit completed **green** on the first attempt --
no placeholder-content incident this time, per the standing pre-flight
requirement adopted this segment:
- `render-build-parity`: completed, conclusion **success** (22:50:27 --
  22:51:31 UTC, 12 Sep 2026). One benign annotation: a platform-level
  Node.js 20 deprecation warning on GitHub-hosted runners, unrelated to
  this build's code.
- `typecheck-and-test`: completed, conclusion **success** (22:50:27 --
  22:55:38 UTC, 12 Sep 2026). Same benign Node.js 20 deprecation warning,
  no other annotations.

## 9. QA 10/10 -- customer-experience simulation

Run per the standing `isc-qa-customer-simulation` skill on
`SupplierBlacklist.tsx` before this item was called done. Three real
issues were found and fixed in this same pass, then re-verified (not
deferred):

1. **Data-safety defect**: the COPQ severity number inputs (`copqTotal`,
   `copqExternalShare`) had no guard against a non-numeric entry -- a
   momentarily-empty or malformed field could silently manufacture an
   "independently sufficient" fake severe-COPQ evidence item from `NaN`.
   Fixed with `Number.isFinite()` guards, plus a `0 <= v <= 1` range check
   on the share field.
2. **Dead-complexity defect**: `openFinalizeWizard()` had a redundant
   if/else where both branches did the same thing. Simplified to a single
   unconditional call, with a comment recording why the branch was removed.
3. **Race-condition-style display defect**: the finalize-vs-reverse panel
   choice ignored load state, so for an already-blacklisted supplier the
   "begin formal finalization" panel could flash briefly before the current
   state actually finished loading. Fixed with an explicit
   `stateLoadStatus === 'loading'` guard and a bilingual "Loading current
   state..." placeholder shown until the fetch resolves.

Re-verified after the fixes, in the same task: a scoped `tsc -b`
(`supplierBlacklist.ts`, `supplierBlacklist.test.ts`, `SupplierBlacklist.tsx`)
completed with **zero errors**; a full vitest re-run of the module's 39
tests plus all 31 pre-existing Header tests (nav-entry regression check)
completed **70/70 passing**.

**Dimensions checked with no defect found**: discoverability (the
Blacklist nav entry sits alongside the other governance-module entries,
not buried); bilingual correctness (every new string, including the
finalize wizard's warning copy, ships in real, grammatical EN and AR, none
machine-garbled or English reused); accessibility (every wizard step and
button is a real `<button>`, keyboard-reachable, no hover-only affordance
introduced); cross-feature interaction (the ASL cross-reference was traced
end-to-end through `onboarding.ts` directly, not assumed); honesty (the
PO-engine gap and the GCC-research limitation are both stated in the
module's own documentation, not smoothed over); visual/tonal consistency
(same badge/pill and warning-banner conventions as Items 1-5, not a one-off
pattern).

## 10. Disclosed open gaps (not silently smoothed over)

- **No PO/commercial-transaction engine exists yet**: `computeBlacklistBlockSignal()`
  is a documented forward contract for a future module to call -- nothing
  calls it today (Section 3).
- **Item 7 (Offboarding/Transition) is a flagged seam, not a build**:
  `ITEM7_FORWARD_HOOK_NOTE_EN/AR` documents that a finalized blacklist
  decision is a natural trigger into Item 7's no-fault offboarding
  workflow -- nothing in this module calls or assumes Item 7's shape, which
  does not exist yet.
- **The GTPL boycott-list's own procedural detail is not independently
  verifiable** from the secondary sources available for this research
  (Section 1) -- disclosed rather than fabricated.
- **The competitive-moat benchmark (Section 7) reuses informed positioning
  rather than a freshly re-checked page-by-page audit** of the five named
  commercial platforms for this specific item, unlike Item 5's benchmark --
  disclosed rather than presented as an equally fresh check.
- **Finalizing a blacklist entry does not itself restore or otherwise
  touch ASL status on reversal** -- reversing lifts the blacklist exclusion
  itself; a client wishing to re-admit the supplier to the ASL records that
  as a separate, deliberate Item 3 decision (Section 4, step 6). This is a
  deliberate design choice (blacklist and ASL are related but distinct
  ledgers), not an oversight, but is called out here so it is not mistaken
  for automatic re-qualification.

## 11. File list

- `artifacts/i-supply-chain/src/lib/supplierBlacklist.ts` (module)
- `artifacts/i-supply-chain/src/lib/supplierBlacklist.test.ts` (39 tests)
- `artifacts/i-supply-chain/src/pages/SupplierBlacklist.tsx` (UI, both tiers)
- `lib/db/src/schema/blacklistEvents.ts` (append-only table)
- `lib/db/src/schema/index.ts` (barrel export, modified)
- `artifacts/api-server/src/routes/blacklist.ts` (route)
- `artifacts/api-server/src/routes/index.ts` (wiring, modified)
- `artifacts/api-server/tests/blacklist.test.ts` (26 HTTP-boundary tests)
- `artifacts/i-supply-chain/src/App.tsx` (route wiring, modified)
- `artifacts/i-supply-chain/src/components/Header.tsx` (nav entry, modified)
- `docs/SI_Supplier_Lifecycle_Governance_Item6_Blacklist_Worked_Example.md` (this document)
