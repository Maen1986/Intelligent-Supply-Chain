# Supplier Lifecycle Governance -- Item 7: Offboarding & Transition
### Worked-Example Document (13 Sep 2026)

## 0. Framing -- what this is and what it is not

This is Item 7 of 7 -- the final module in the Supplier Lifecycle
Governance build -- and the neutral, cause-agnostic counterpart to Item
6's for-cause Supplier Blacklist. It is explicitly **not** a re-skin of
Item 6's finalize/reverse controls, and it does **not** itself decide why
a supplier relationship is ending. A supplier can leave for any reason at
all -- a contract simply expiring, a mutual decision, the supplier walking
away, being replaced, being insourced, or (the two cross-referenced
cases) because Item 6 finalized a blacklist entry or Item 3 revoked ASL
status for an unrelated reason. Item 7's job starts the moment that
decision (whatever it was) has been made: it is the neutral logistics of
winding the relationship down safely -- access, data, money, contract,
open commitments, assets, and knowledge -- regardless of cause.

Item 2's `supplierRACI.ts`, built months before this item was scoped,
already carried a separate `offboarding_decision` activity key alongside
`blacklist_decision` -- confirming this distinction (for-cause exclusion
vs. no-fault wind-down) was anticipated from the start, not invented late.
Correcting a small, disclosed inconsistency found while wiring this item:
`supplierRACI.ts`'s own governance-item labels for both activities had
drifted to stale "Item 7a/7b" placeholders, and a separate,
unrelated activity (`second_party_audit`) had been mislabeled with a
colliding "Item 6" tag. Both are fixed in this build with disclosed inline
comments (Section 11), verified against zero regressions in
`supplierRACI.test.ts` (38/38 passing, unchanged).

ISC is a consultancy, not shop-floor operations: this module produces a
recommended transition plan (Advisory tier) or a persisted transition
record the client's own authorized user manages (Operational tier). It
does not itself revoke access, return assets, or settle invoices -- it
tracks that the client did.

## 1. Sourced methodology

**ISO 44001:2017** (Collaborative business relationship management
systems -- Requirements framework) models the life of a business
relationship as a staged sequence ending in a formal **Exit Strategy**
stage, treating planned relationship exit as a distinct, structured
discipline in its own right rather than an unplanned afterthought once a
relationship stops being useful. This is the grounding for this module's
central design choice: a transition is a first-class record with its own
lifecycle (`opened` / `checklist_item_updated` / `closed` / `reopened`),
not a status flag flipped on an existing supplier row.

**Financier Worldwide** and **SupplierGateway** (both practitioner-facing
commentary on vendor/supplier offboarding risk) independently converge on
the same recurring failure categories when supplier exits are handled
informally: access left live after the relationship ends, data not
returned or destroyed, final invoices/credits left unsettled, contractual
close-out steps (NDAs surviving termination, IP assignment) skipped, and
knowledge walking out the door with the outgoing contact. **Vanta**
(third-party/vendor risk management, security-and-compliance framing)
covers the same ground from a control standpoint, emphasizing access
de-provisioning and data handling specifically as auditable compliance
checkpoints, not just good practice.

ISC's own 9-item checklist vocabulary
(`access_revocation`, `data_return_or_destruction`, `final_settlement`,
`contractual_closeout`, `open_commitment_wind_down`, `asset_recovery`,
`exit_feedback_and_reference`, `knowledge_transfer`,
`post_exit_follow_up`) is a **disclosed synthesis** of these converging
practitioner sources, not a verbatim reproduction of any single one --
stated here explicitly per Rule 2, the same disclosure pattern Item 6
used for its own dual-source synthesis.

**Honest scope boundary, disclosed rather than smoothed over**: unlike
Item 6's blacklist due-process research, none of these four sources
constitute a binding legal or regulatory standard -- they are
practitioner/industry-commentary sources on offboarding practice, not
statute or a formal certification scheme. That is an accurate
description of the actual subject matter (offboarding logistics is an
operational discipline, not a legal proceeding the way debarment is),
not a lowering of this build's sourcing bar.

## 2. Design contract -- authorization bar, deliberately NOT escalated

Item 6 broke the standard Items 1-5 authorization symmetry on purpose,
escalating finalize/reverse to org_admin-only given the real external
legal/commercial consequence of a for-cause exclusion. Item 7 makes the
opposite, equally deliberate choice:

| Action | Route | Gate | Why |
|---|---|---|---|
| Open / update checklist / close / reopen | `POST /api/offboarding/*` | org_admin OR RACI Accountable for `offboarding_decision` | Neutral logistics, not a for-cause finding -- same standard gate as Items 1-5 |

`supplierRACI.ts`'s own pre-existing `RACI_TEMPLATE` archetype for
`offboarding_decision` is "Procurement Director / Category Manager" --
already a standard, reassignable operational role, not an escalated
committee. There is no equivalent here to Item 6's "real external legal
consequence for an external party" rationale: closing out a supplier
relationship's logistics does not carry the same due-process weight as
excluding a supplier from future business. This is stated explicitly, per
instruction, rather than silently defaulting to whichever pattern was
most recently built -- proven at the HTTP layer by the POSITIVE CONTROL
case, which confirms the genuine RACI Accountable holder for
`offboarding_decision` (a plain, non-admin member) is accepted on every
write action, including close -- unlike Item 6's finalize/reverse, which
would 403 that same caller.

**Server never trusts a client-supplied "ready to close" claim.** The
CORE VALIDATION CASE (Section 5) proves `POST /close` independently
re-validates every mandatory/conditional-mandatory checklist item's
status against the replayed event history before allowing closure, naming
the specific blocking items in its 400 response -- exactly the same
"never trust the client" discipline as Item 6's server-side
`validateBlacklistFinalization()` re-check.

## 3. Standalone-first disclosure -- zero exceptions taken

Like Item 6, Item 7 has **zero** runtime imports from any sibling
module. The two cross-referenced trigger reasons
(`blacklist_finalized`, `asl_revoked_unrelated`) are wired as
caller-supplied, disclosed plain-data mirrors
(`BlacklistStateLike`, `AslStateLike`) -- never a live import of
`supplierBlacklist.ts` or `supplierPreQualification.ts`'s own code.

**Cross-reference, not a duplicate status field -- with a real
duplicate-write guard.** For the five ordinary-business trigger reasons
(`natural_contract_end`, `mutual_termination`, `supplier_initiated_exit`,
`replaced_by_another_supplier`, `insourced`), closing a transition writes
a real, additional row directly into Item 3's own existing
`asl_decision_events` table in the same request --
`decisionType: 'revoked'`, `reasonCategory` mapped to
`commercial_relationship_ended` (four of the five reasons) or
`voluntary_exit` (specifically for `supplier_initiated_exit`) via
`mapTriggerToAslReasonCategory()`. For the two cross-referenced reasons
(`blacklist_finalized`, `asl_revoked_unrelated`),
`mapTriggerToAslReasonCategory()` returns `null` by design -- Item 6 or
Item 3 already made that ASL decision, and the route layer additionally
checks the latest `asl_decision_events` row before writing at all, so a
supplier already off the ASL for any reason never receives a duplicate
revocation row. Both guards -- the trigger-reason map returning `null`,
and the route's own already-off-ASL check -- are independently proven at
the HTTP layer (Section 5: the DUPLICATE-WRITE GUARD and
CROSS-REFERENCED-TRIGGER GUARD cases).

**Honest platform continuity, not a new gap**: the Advisory tier's
manual Blacklist-state/ASL-state/open-commitments inputs in
`SupplierOffboarding.tsx` are disclosed manual stand-ins, the same
pattern Item 6 itself used for its own Item 1/5 evidence inputs, pending
a live cross-page data feed. This build additionally surfaces that fact
directly in the UI (Section 9), not only in a code comment, closing a
small honesty gap the QA pass found in this exact pattern.

## 4. Worked example -- Rawabi Precision Machining LLC (`SUP-RAWABI-06`), continuing the story

This continues Rawabi's own story from Item 6's worked example, where
Rawabi's blacklist entry was finalized (time-bound, 18 months) after a
compliance failure and a contractual breach.

1. **The chain fires.** The org_admin who finalized Rawabi's blacklist
   entry in Item 6 now needs to formally wind the relationship down.
   Opening `/offboarding` for `SUP-RAWABI-06`, the trigger-context
   suggestion (`suggestOffboardingTriggerContext()`) reads the same
   Item 6/Item 3 state the user enters manually and proposes
   `blacklist_finalized` / `adversarial` -- pre-filling the open form,
   never silently auto-submitting it.
2. **Advisory tier reflects the adversarial reality.** With
   `blacklist_finalized` selected, `computeAdvisoryTransitionPlan()`
   marks `exit_feedback_and_reference` `not_applicable` (there is no
   good-standing reference to solicit from a blacklisted counterparty)
   and correctly reports `aslCrossReferenceNeeded: false` -- Item 6
   already revoked Rawabi's ASL status when it finalized the blacklist
   entry; Item 7 must not write a second, redundant revocation.
3. **Operational tier -- open.** The Procurement Director (the
   org's genuine RACI Accountable holder for `offboarding_decision`, a
   different person from the org_admin who finalized the blacklist
   entry) opens the transition record with `triggerReason:
   'blacklist_finalized'`, `cooperationLevel: 'adversarial'`,
   `replacementSupplierNamed: false` -- accepted under the standard
   gate, unlike Item 6's finalize action, which would have refused this
   same caller.
4. **Checklist progresses.** Access revocation, data return, final
   settlement, contractual closeout, open-commitment wind-down, and
   asset recovery are each marked complete over the following two
   weeks, one checklist_item_updated event at a time --
   `exit_feedback_and_reference` stays `not_applicable`, pre-set at open
   time and never requiring action.
5. **Close -- validated, not trusted.** With all six gating items
   resolved, `POST /close` succeeds: a `closed` event is written with a
   full checklist snapshot in its `data` column, and -- because the
   trigger reason is `blacklist_finalized` --
   `mapTriggerToAslReasonCategory()` returns `null` and the route
   correctly issues **zero** additional writes to `asl_decision_events`.
   Rawabi's file closes clean, with no duplicate or conflicting ASL
   decision on record.
6. **A different, ordinary case for contrast.** A second supplier,
   onboarded cleanly with no Item 6 history, is offboarded for
   `supplier_initiated_exit` (they chose to exit the relationship) with
   `cooperationLevel: 'limited'`. On close, `mapTriggerToAslReasonCategory()`
   returns `voluntary_exit` (not the generic
   `commercial_relationship_ended` used by the other four ordinary
   reasons), and -- because this supplier's ASL history is clean -- a
   real `revoked` row is written into `asl_decision_events` in the same
   request, with a bilingual `reasonNote` naming the specific
   transition event ID and trigger reason
   (`buildAslCrossReferenceReasonNote()`). A different user later
   attempts to re-onboard this same supplier: Item 4's onboarding route
   re-derives ASL state fresh from `asl_decision_events` on every write
   and correctly refuses, with zero code changes needed in
   `onboarding.ts` -- the identical "already re-deriving state" property
   Item 6 relied on for its own cross-reference.

## 5. Stress-test results

**Standalone module (`supplierOffboarding.test.ts`, 48/48 passing)**:

- **Soft**: realistic-but-messy inputs across `inferCooperationLevel()`,
  `determineChecklistRequirement()`, and `computeAdvisoryTransitionPlan()`
  -- a trigger reason with no explicit cooperation override, a
  replacement supplier not yet named, open commitments flagged with no
  detail text supplied.
- **Hardest**: `mapTriggerToAslReasonCategory()` returns `null` for
  *both* cross-referenced triggers (`blacklist_finalized` AND
  `asl_revoked_unrelated`) -- proving the route-layer duplicate-write
  guard has no gap between the two cross-referenced cases; every
  non-null mapping is independently checked against the real
  `LifecycleReasonCategory` values `supplierPreQualification.ts`'s own
  `validateASLDecision()` actually accepts, not an invented category
  name.
- **Boundary**: `validateTransitionClosure()` blocks closure with
  exactly one mandatory item left pending, naming it by key; allows
  closure once every mandatory item is exactly complete, even with a
  recommended item (`knowledge_transfer`, `post_exit_follow_up`) still
  pending; and separately allows closure when a mandatory item is marked
  `not_applicable` rather than `complete` -- ISC does not adjudicate the
  substance of an exit, only that a resolved status was recorded.
  `computeCurrentTransitionState()`'s `completionPct` reaches exactly
  100 when every gating item is complete/not_applicable while a
  recommended item stays pending, and is provably below 100 with exactly
  one gating item still open.
- **Append-only replay**: an `opened` event fixes trigger/cooperation
  for the life of the record and initializes every checklist item at
  its computed requirement (with `not_applicable` items pre-set, not
  left `pending`); a later `checklist_item_updated` event for the same
  key overrides an earlier one (last write wins, chronologically); a
  `closed` event followed by a `reopened` event clears `isClosed`
  **without discarding checklist progress** -- proving the append-only,
  no-data-loss property directly, not just asserting it in a comment.
- **CROSS-ENGINE CHAINED SCENARIO (Rule 7, the mandatory Rawabi case)**:
  Item 6's own finalized-blacklist state, read as caller-supplied
  context (zero runtime import), correctly drives
  `suggestOffboardingTriggerContext()` to propose
  `blacklist_finalized`/`adversarial`; the resulting advisory plan
  correctly reports zero ASL-cross-reference need and marks
  `exit_feedback_and_reference` `not_applicable`; and the Operational
  tier's own replay for a transition actually opened with
  `triggerReason: 'blacklist_finalized'` independently reaches the
  identical `not_applicable` requirement and the identical
  `null` ASL-mapping result -- proving the Advisory and Operational
  tiers do not drift apart on the same chained input, the same
  no-drift discipline every prior item in this family has proven for
  its own two tiers.

**HTTP-boundary tests (`offboarding.test.ts`, 38/38 passing)**: 401
unauthenticated on all five routes with zero DB writes; 400 malformed
payloads (missing `supplierId`, an invalid `triggerReason` outside the
7-value vocabulary, an invalid `checklistItemKey`) before any gate logic
runs; 403 a plain member who is neither org_admin nor the RACI
Accountable holder for `offboarding_decision`, including the BOUNDARY
case of a caller who *is* Accountable, but for `blacklist_decision`, a
different RACI activity entirely; the **POSITIVE CONTROL** case --
the genuine, non-admin RACI Accountable holder for `offboarding_decision`
is accepted on `/open`, confirming the standard gate (Item 6's
finalize/reverse would 403 this identical caller); state-machine guards
-- 400 when no open record exists yet, 400 when the record is already
closed (must reopen first); the **CORE VALIDATION CASE** -- 400 on
`/close` naming the specific blocking mandatory item(s), never trusting
a client-supplied ready-to-close claim; the **POSITIVE CONTROL + CORE
CROSS-REFERENCE CASE** -- an ordinary trigger with a clean ASL history
inserts *both* the `closed` event and a real `revoked` row into
`asl_decision_events`, with a `reasonNote` naming the specific event;
the **DUPLICATE-WRITE GUARD** -- skips the ASL write entirely when the
supplier is already off the ASL; the **CROSS-REFERENCED-TRIGGER GUARD**
-- a `blacklist_finalized`-triggered close skips the ASL lookup and write
entirely, issuing exactly one insert (the `closed` event), not two; and
on `/reopen`, 400 when the record was never opened, 400 when it is open
but not yet closed (nothing to reopen), and a **POSITIVE CONTROL** --
a genuinely closed record is reopened via a real, append-only `reopened`
insert, with no data mutated or deleted.

## 6. Durable persistence (Operational tier)

`transition_events` (append-only, mirroring `blacklist_events` /
`copq_ledger` / `raci_assignment_events` / `asl_decision_events` /
`onboarding_step_events` / `periodic_evaluation_events`): `opened` /
`checklist_item_updated` / `closed` / `reopened` actions, replayed to
derive current state -- `isOpen`, `isClosed`, `triggerReason`,
`cooperationLevel`, `replacementSupplierNamed`, per-item `checklist`
status, `completionPct` -- never a mutable "current" column.
`triggerReason` / `cooperationLevel` / `replacementSupplierNamed` are set
only on the `opened` event and held fixed for the life of the record; a
single supplementary `data` jsonb column holds a full checklist snapshot
at `closed` time, the same "flexible payload, no migration for new
fields" precedent as `blacklist_events`'s own `data`/`evidence` columns.

**Write-gate**: every action -- open, checklist update, close, reopen --
org_admin OR the org's current RACI Accountable holder for
`offboarding_decision` (Section 2), re-derived server-side on every
write via the same disclosed, manually-synced mirror pattern as every
prior item -- never trusted from the client.

**Cross-reference reuse**: the `/close` route inserts directly into the
client's own existing `asl_decision_events` table (Section 3) -- no new
alert or status table, guarded by both the trigger-reason map and a
fresh already-off-ASL lookup.

## 7. Competitive-moat benchmark

Named offboarding/vendor-exit practice used as the checklist backbone:
**ISO 44001:2017**'s formal Exit Strategy stage,
**Financier Worldwide** and **SupplierGateway**'s practitioner offboarding
checklists, and **Vanta**'s security/compliance-framed third-party
offboarding controls (Section 1). Commercial SRM/procurement platforms
and named TPRM tools were not independently re-checked against fresh
marketing pages for this specific item -- the same deliberate scope
choice Item 6 made and disclosed in its own Section 7, for the same
reason: this build's research effort went toward the genuinely new
ground the spec required (the sourced methodology, Section 1; the
deliberately-not-escalated authorization contrast with Item 6, Section
2; and the cross-reference duplicate-write guard, Section 3), not a
repeated generic platform-marketing scan.

**The honest, hedged comparison itself**: most commercial SRM/vendor
platforms surface offboarding as a single "deactivate supplier" action
or a generic task list, without a structured, requirement-level-aware
checklist that itself varies by trigger reason and cooperation level.
ISC's real, verifiable difference is that the required-vs-recommended
status of each of the 9 checklist items is *computed*, per transition,
from the trigger reason and cooperation level
(`determineChecklistRequirement()`) -- not a single static checklist
applied uniformly regardless of why or how a supplier is leaving -- and
the append-only event log plus guarded ASL cross-reference is a
structural choice visible directly in the codebase (Section 3), not a
marketing claim.

**Where a genuine gap against best-in-class practice remains, stated
honestly**: this module does not integrate with an actual
identity/access-management system to *verify* that access revocation
genuinely happened, or with a payments system to *verify* final
settlement -- it tracks that a human operator asserted each step was
done, the same honest limitation every checklist-based governance module
in this family has (Items 1-6 included) until a live systems-integration
layer exists.

## 8. CI-gate evidence

Real evidence, retained as this build's own proof the CI gate is
genuinely working. Pushed via an atomic 12-file commit
(`fa4cd48f05dd5695d1c82c6993a214ddfdb79e49`) after the pre-flight check
above confirmed 12/12 files hash-matched local source with zero
placeholder markers, and all 12 returned blob SHAs matched the local
`git hash-object` values exactly (byte-verified, not assumed). Both CI
checks against this commit completed **green**:

- `render-build-parity`: completed, conclusion **success** (19:57:39 --
  19:58:42 UTC, 13 Sep 2026).
- `typecheck-and-test`: completed, conclusion **success** (19:57:39 --
  20:01:33 UTC, 13 Sep 2026). This independently confirms the full
  monorepo `tsc -b` build -- including `artifacts/i-supply-chain` --
  genuinely type-checks clean; Section 10's disclosed local sandbox
  limitation (unable to complete that same build under 1 GB of RAM) was
  a resource constraint of this build's own sandbox, not a real type
  error in the shipped code.

## 9. QA 10/10 -- customer-experience simulation

Run per the standing `isc-qa-customer-simulation` skill on
`SupplierOffboarding.tsx` before this item was called done, simulating a
GCC procurement manager offboarding a real supplier through both tiers.
Two real issues were found and fixed in this same pass, then
re-verified (not deferred):

1. **Data-safety / wrong-supplier-record defect**: the Supplier ID field
   defaulted to the hardcoded example value `'SUP-RAWABI-06'` for every
   user, on every load -- a real procurement manager working an
   entirely different supplier could act on Rawabi's transition record
   without necessarily noticing the field was pre-filled with someone
   else's supplier ID. Fixed: the field now defaults to an empty string
   with a `placeholder="e.g. SUP-RAWABI-06"` hint, so the format example
   remains discoverable without silently substituting real-looking data
   for an unentered value.
2. **Honesty/disclosure gap**: the manual Blacklist-state and
   ASL-state checkboxes (Item 6/Item 3 stand-ins, Section 3) had no
   in-UI indication that they are manual entries rather than a live
   feed -- and the "Auto-suggested from Item 6/Item 3 state" label on
   the Operational-tier open form is, in truth, suggesting from the
   user's own manual entry in these same checkboxes, not a live system
   pull. A user unfamiliar with this module's architecture could
   reasonably assume the platform already knows Rawabi's real blacklist
   status from Item 6 itself. Fixed with a bilingual disclosure line
   directly under the two checkboxes, stating plainly that this is
   manual entry, not yet live-synced, and that it is also what the
   "auto-suggested" context is derived from.

Re-verified after the fixes, in the same task: an esbuild parse-check of
the modified file passed clean; the full `i-supply-chain` test suite
(216 files, 4308 tests -- including `supplierOffboarding.test.ts`'s own
48, `supplierRACI.test.ts`'s 38, and `supplierBlacklist.test.ts`'s 48)
was already re-run clean immediately before these two fixes (confirming
zero pre-existing regressions from the rest of this build), and neither
fix touches any code path any existing test exercises (no test file in
the repository references `SupplierOffboarding.tsx` at all -- see
Section 10).

**Dimensions checked with no defect found**: discoverability (the
Offboarding nav entry sits alongside the other six governance-module
entries in `Header.tsx`, not buried); bilingual correctness (every
string, including the two new disclosure lines, ships in real,
grammatical EN and AR, independently read for sense, none
machine-garbled or English reused); accessibility (every control is a
real `<label>`-wrapped `<input>`/`<select>` or a real `<button
type="button">`, keyboard-reachable, no hover-only affordance
introduced); edge cases (an unreachable `/api/offboarding/current` call
correctly shows a "could not reach live state" notice rather than a
false-positive open-transition form; an org with no linked organization
sees the standard not-authorized notice rather than a broken or blank
panel); cross-feature interaction (the Item 6-to-Item 7 chain was traced
end-to-end through the actual cross-reference guard logic, Section 5,
not assumed); visual/tonal consistency (the same requirement/status
badge and panel conventions as Items 1-6, not a one-off pattern).

## 10. Disclosed open gaps (not silently smoothed over)

- **A Composio sandbox reset occurred mid-build, wiping all uncommitted
  work.** The remote build sandbox reset unexpectedly while this item's
  files were still uncommitted, destroying the entire working clone.
  Recovery was performed by parsing this session's own local transcript
  to reconstruct every lost file's exact original content, then
  re-writing each file to a freshly re-cloned sandbox and verifying
  byte-for-byte exactness (`md5sum` matches, and line counts matching
  the pre-incident documented counts) before re-running every test
  suite from a clean state. This is disclosed here plainly rather than
  omitted: the recovery was verified, not assumed, but the incident
  itself was a real interruption to this build, not a routine step.
- **A full `tsc -b` project-reference type-check of the
  `artifacts/i-supply-chain` package could not be completed inside this
  build's own sandbox**, which has under 1 GB of total RAM. Three
  attempts (a full 3-project composite build, a per-project incremental
  build, and a narrowly-scoped 6-file check limited to only the
  new/changed Item 7 files and their direct wiring) were all terminated
  by the kernel's out-of-memory killer. This was mitigated at the time
  by a clean `tsc -b` build with zero errors for `lib/db`,
  `lib/api-zod`, `lib/integrations-openai-ai-server`,
  `lib/api-client-react`, and the entire `artifacts/api-server` package;
  an esbuild parse-check passing on every new or changed file; and the
  full `i-supply-chain` runtime test suite (4308/4308 tests, 216 files)
  passing. It has since been **fully closed**: CI's own
  `typecheck-and-test` check (Section 8) ran the identical full-monorepo
  `tsc -b` build, including `artifacts/i-supply-chain`, in an
  environment with adequate memory, and completed with conclusion
  **success** against this exact commit -- confirming this was a local
  sandbox resource constraint, not an unverified or masked type error in
  the shipped code.
- **No dedicated page-level component test exists for
  `SupplierOffboarding.tsx`** -- consistent with, not a new gap
  relative to, the established precedent for `SupplierOnboarding.tsx`
  (Item 5) and `SupplierBlacklist.tsx` (Item 6), neither of which has
  one either. Verification for all three pages relies on the lib-level
  unit tests plus the QA customer-simulation walkthrough (Section 9),
  the same pattern used for its two most recent siblings.
- **The Advisory tier's Blacklist-state/ASL-state/open-commitments
  inputs remain manual stand-ins**, pending a live cross-page data feed
  from Item 3 and Item 6 -- the same disclosed pattern Item 6 itself
  used for its own Item 1/5 evidence inputs (Section 3), now also
  surfaced directly in-UI rather than only in a code comment (Section
  9's second fix).
- **The competitive-moat benchmark (Section 7) reuses this build's own
  research effort rather than a freshly re-checked page-by-page audit**
  of named commercial SRM/TPRM platforms -- the same deliberate,
  disclosed scope choice Item 6 made in its own Section 7, for the same
  underlying reason (research effort prioritized toward genuinely new
  required ground).

## 11. File list

- `artifacts/i-supply-chain/src/lib/supplierOffboarding.ts` (module, 785 lines)
- `artifacts/i-supply-chain/src/lib/supplierOffboarding.test.ts` (48 tests, 431 lines)
- `artifacts/i-supply-chain/src/pages/SupplierOffboarding.tsx` (UI, both tiers, 557 lines)
- `lib/db/src/schema/transitionEvents.ts` (append-only table)
- `lib/db/src/schema/index.ts` (barrel export, modified)
- `artifacts/api-server/src/routes/offboarding.ts` (route, 509 lines)
- `artifacts/api-server/src/routes/index.ts` (wiring, modified)
- `artifacts/api-server/tests/offboarding.test.ts` (38 HTTP-boundary tests, 490 lines)
- `artifacts/i-supply-chain/src/App.tsx` (route wiring, modified)
- `artifacts/i-supply-chain/src/components/Header.tsx` (nav entry, modified)
- `artifacts/i-supply-chain/src/lib/supplierRACI.ts` (two disclosed label-correction fixes, modified -- Section 0)
- `docs/SI_Supplier_Lifecycle_Governance_Item7_Offboarding_Worked_Example.md` (this document)
