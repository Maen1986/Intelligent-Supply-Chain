# SI Supplier Lifecycle Governance — Item 4 of 7: Onboarding
### Worked Example, Sourced Methodology, Stress Tests, and Competitive Moat
**Status: PENDING PUSH — commit not yet created at time of writing**
**Built: 12 September 2026**

---

## 0. Framing: ISC is a consultancy first, an operational system of record only by choice

I Supply Chain (ISC) exists to enhance a client's own best practice, governance, and
compliance discipline — not to become the shop-floor operator of their supplier
onboarding process. That is why this item ships **two permanent, equally
legitimate tiers**, not a full product and a stripped preview:

- **Advisory (default, consultancy-native).** A sourced, well-designed onboarding
  checklist and RACI sign-off *guidance* the client executes in their own systems.
  Zero required persistence. It has to be genuinely good enough to stand alone —
  a real prospect with no ISC account can open it and get real value immediately
  (see §3).
- **Operational (opt-in, deeper).** ISC persists and tracks the onboarding record
  as the client's system of record, with real stalled-onboarding alerting and a
  server-enforced RACI sign-off gate. This is the closest ISC comes to running a
  client's operational process — kept strictly opt-in and never the assumed
  default (see §4).

Both tiers share one identical checklist-generation and validation engine
(`artifacts/i-supply-chain/src/lib/supplierOnboarding.ts`) — they differ only in
what gets persisted and enforced. Every requirement below (sourcing, wiring,
stress testing, benchmarking, QA) was applied to both, in parallel, not to one
tier with the other treated as an afterthought.

---

## 1. Sourced methodology

The four-domain checklist structure and the specific steps in this module are
not invented from first principles. They are drawn from, and cited against:

- **apexanalytix**, *"12-Step Supplier Onboarding Checklist to Reduce Risk"*
  (2026) — the four-domain structure (compliance & risk screening, banking &
  financial controls, operational readiness, lifecycle management) and the
  explicit framing of banking data as *"the most sensitive data in the supplier
  record and the most frequently targeted by fraudsters."*
- **CIPS**, *"Navigating risk in third-party onboarding"* (with Dun & Bradstreet)
  — regulatory-compliance, ownership/political-affiliation scrutiny, and
  sanctions-watchlist screening as due-diligence categories.
- **Ivalua**, *"Supplier Onboarding 101: Essential Tips for a Smooth Process"* —
  the published 5-step process (risk assessment → compliance/documentation →
  evaluation/approval → contract finalization → system integration), which this
  module's legal/compliance and operational-readiness steps mirror.
- **FBI Internet Crime Complaint Center (IC3)** BEC-loss data, via
  adaptivesecurity.com's sourced BEC-controls writeup — $55.5B in cumulative
  reported BEC losses 2013–2023, $3.04B in 2025 alone — and its concrete,
  actionable control recommendation: **independently-sourced callback
  verification** (a phone number already on file, never one supplied with a
  change request) plus **holding the first payment** after any banking-detail
  change for manual review.

None of the four domains, or the banking-verification control specifically, was
invented for this build — see the module's own file header for the full citation
detail against each step.

---

## 2. The checklist catalog

Fourteen steps across four domains (`ONBOARDING_STEP_CATALOG` in
`supplierOnboarding.ts`), each bilingual (EN/AR), each carrying its own sourced
"why it matters" note and source citation:

| Domain | Steps | Required |
|---|---|---|
| Legal / Compliance | Contract executed, NDA signed, insurance certificate collected, code-of-conduct sign-off | all 4 required |
| Banking / Financial | Payment terms agreed, banking details submitted, **banking details independently verified**, tax registration captured | all 4 required |
| Operational Readiness | System access provisioned, ordering/EDI setup, escalation contacts confirmed | contacts + system access required; EDI optional |
| Risk / Compliance Screening | Sanctions screening cleared, conflict-of-interest declared, ESG questionnaire | sanctions + COI required; ESG only when the client organization flags it applicable — never assumed |

**Banking-detail verification is the one step this whole item exists to make
provably hard to skip.** It cannot be marked complete without (a) banking
details having been submitted first (an ordered dependency, enforced both in
the pure derivation logic and again server-side), (b) a named,
independently-sourced verification channel, and (c) an explicit acknowledgement
that the first payment after the change will be held for manual review. ISC
does **not** claim to automate the verification call itself — that would
fabricate a capability that is not real (Rule 1). See §7 for the honest
comparison against tools that do automate this via a partner integration.

---

## 3. Advisory tier

`generateOnboardingChecklist()` runs entirely client-side, gated on a
caller-supplied ASL state (`ASLGateSnapshotLike`, a disclosed mirror of Item
3's own `ASLCurrentState` shape — standalone-first, no runtime import). Given
an approved gate, it returns the full applicable checklist (ESG included only
when flagged), each step bilingual, plus:

- **A Module 03 contact-reuse prefill** — if the caller supplies a
  `Module03ContactHint` (name/email/phone already discovered in Module 03),
  the escalation-contacts step shows it as a *prefill*, tagged with its
  Module 03 evidence stage, but never auto-completes the step. A human must
  still confirm it. With no hint supplied, the step has no prefill at all —
  nothing is fabricated to look like reused data that was never actually
  supplied.
- **RACI sign-off guidance, not enforcement** — `ONBOARDING_SIGNOFF_RACI_GUIDANCE`
  names the recommended Accountable (Supplier Relationship Manager) and
  Responsible (Supplier Onboarding Coordinator) archetypes, the same sourced
  role-archetype template Item 2 (RACI) already defines for the
  `onboarding_signoff` activity key. On the Advisory tier this is guidance the
  client applies in their own sign-off process; nothing on this tier is
  blocked by who the client actually assigns.

A supplier with no organization on their account (a genuine prospect exploring
the tool) gets a manual ASL-status entry so the checklist still renders and
stands on its own — the tier does not require an ISC account or persistence to
demonstrate real value, which is the whole point of building it to completion
rather than as a stripped preview.

---

## 4. Operational tier

`/api/onboarding` (`artifacts/api-server/src/routes/onboarding.ts`) persists
step-completion events in a new append-only table,
`onboarding_step_events` (`lib/db/src/schema/onboardingEvents.ts`), mirroring
the exact event-log-plus-replay pattern already used by
`raci_assignment_events`, `asl_decision_events` and `copq_ledger`. Current
completion state for a supplier is always **derived** by replaying its events
(`computeCurrentOnboardingState()`) — there is no separately-maintained
"is this step done" column that could silently drift from the event log.

**Double server-side gate on every write**, mirroring Item 3's own
`preQualification.ts` route technique exactly:

1. **ASL gate.** The supplier's current ASL state is re-derived server-side
   from this org's own `asl_decision_events` (never trusted from the client).
   A supplier that is not currently `onASL` cannot have any onboarding event
   recorded for it — 403, zero DB write.
2. **RACI write-gate.** The caller must be this org's `org_admin` OR the
   org's current RACI Accountable holder for `onboarding_signoff` — Item 2's
   real, live assignment data, replayed here from `raci_assignment_events`,
   the same activity key Item 2 had already defined before this item began.

Both gates are independent of, and enforced in addition to, checklist
validation itself (no completion for a step that doesn't exist, no duplicate
completion, the banking-verification ordered dependency and its
independent-verification + first-payment-hold requirement) — see §6 for the
full HTTP-boundary proof.

**Stalled-onboarding alerting** (`detectStalledOnboarding()`) flags a record
that had some activity and then genuinely went quiet past a 14-day threshold,
naming both a primary recommendation (the RACI Accountable holder follows up
directly) and a strong alternative (reassign the Responsible coordinator) —
never false single-path certainty (Rule 8). See §8 for a real defect this
function had, and how it was fixed, during this item's own QA pass.

---

## 5. Cross-module wiring

1. **Trigger: Item 3's real ASL approval, not a standalone form.**
   `canStartOnboarding()` refuses to generate any checklist at all unless the
   supplied ASL state shows `onASL: true`. On the Operational tier this is
   re-derived server-side from `asl_decision_events` before any event is
   accepted, mirroring Item 3's own `computeCurrentASLState()` replay. Since
   Item 3 already ships a live endpoint (`/api/pre-qualification/current`),
   this page fetches the supplier's *real* ASL row directly rather than
   falling back to manual entry, for any caller who has an organization —
   manual entry is offered only as an honest fallback for a signed-out or
   no-org visitor, not the default path.
2. **Sign-off: enforced on Operational, named as guidance on Advisory.** See
   §3 and §4 above — this is the direct answer to the standing instruction
   that ISC enhances client governance rather than assuming operational
   control by default.
3. **Module 03 reuse.** `Module03ContactHint` lets the caller pass through
   already-discovered contact identity (name/email/phone, plus the Module 03
   evidence stage it came from) so the escalation-contacts step never asks a
   client to re-type data the platform already has — while still requiring an
   explicit human confirmation before it counts as done.
4. **Graduation to the Supplier Scorecard — disclosed, not fabricated.** The
   Scorecard's roster (`SupplierScorecard.tsx`) is a **per-user**,
   full-replace JSONB blob (`GET`/`PUT /api/scorecard-roster`), not an
   org-scoped, appendable table — and the person completing onboarding (an
   org_admin or RACI Accountable holder) is not necessarily the same person
   who owns that Scorecard roster. A silent, server-triggered write into a
   *different* user's personal roster would be exactly the kind of fabricated,
   data-unsafe cross-feature side effect Rules 1 and 3 exist to prevent. The
   honest, real, achievable implementation shipped here is a one-click
   **"Add to Scorecard"** action, in the same browser session as the person
   who just completed onboarding, that reads their own current roster and
   appends the new supplier — reusing the exact same endpoint
   `SupplierScorecard.tsx` itself already uses (`computeGraduationReadiness()`
   gates the button on every required step being complete). This is disclosed
   plainly in the page and here, not silently smoothed into looking like a
   fully automatic pipeline it is not.

---

## 6. Stress testing

### 6.1 Engine-level (both tiers share this logic) — `supplierOnboarding.test.ts`, 40/40 passing

**Soft** — a realistic messy onboarding: some steps done, some skipped; a
supplier re-entering onboarding after a prior failed attempt (`reopened` then
re-`completed`, full history preserved); a Module 03 contact hint with only a
partial field known; an empty-object contact hint behaving identically to no
hint at all.

**Hardest** — a step marked complete for a supplier never actually
ASL-approved (checklist gated=false, validation refuses); a completion event
for a step key that doesn't exist in the checklist definition (ignored in
replay, refused in validation); duplicate completion events for the same step
(idempotent replay, refused on explicit validation); an Accountable holder
reassigned mid-onboarding (replay only cares about step keys/actions, not who
acted — confirmed by a dedicated test); a malformed ASL status string
(`'not_a_real_decision_type_at_all'`) combined with `onASL: true` — the
checklist still gates through correctly, since `onASL` is the authoritative
boolean and `status` is informational only; an empty-string supplier ID on an
otherwise-approved gate does not crash generation.

**Boundary** — completing every required step except the last one leaves
`isComplete` false; the last one flips it true; same-day start-and-complete;
banking-verification exactly at its ordered dependency; the stalled-alert
threshold at exactly 14 days vs. 13 days.

**Advisory-tier adversarial degradation (explicitly requested, not skipped
because it persists nothing):** the checklist-generation function itself was
run through malformed ASL status strings, an empty supplier ID, and
partial/empty Module 03 hints — it degrades honestly in every case: either a
clear `gated: false` refusal with a bilingual reason, or a correctly-scoped
checklist with no fabricated prefill. A light tier still needs to fail safely.

### 6.2 HTTP boundary (Operational tier only) — `onboarding.test.ts`, 19/19 passing

Real `supertest` requests against the actual, unmodified `onboarding.ts`
route, DB mocked but route code executing for real, mirroring
`preQualification.test.ts`'s own proven pattern exactly:

- 401 unauthenticated, before any gate logic runs, zero DB writes.
- 400 on a structurally invalid payload, before touching the database.
- **HARDEST:** 403 — a step marked complete for a supplier that was never
  ASL-approved at all (no ASL events → `NEVER_ASSESSED` → refused before RACI
  is even checked); 403 — ASL state exists but is currently `suspended`.
- 403 — a plain member who is neither org_admin nor the RACI Accountable
  holder for `onboarding_signoff`, zero DB writes.
- **BOUNDARY:** 403 — Accountable for a *different* RACI activity.
- **HARDEST:** 403 — Accountable holder reassigned mid-onboarding (a real
  `unassigned` event since supersedes their `assigned` one) — zero DB writes.
- **POSITIVE CONTROLS:** org_admin caller accepted and the event actually
  inserted; the genuine RACI Accountable holder (non-admin) accepted —
  proving the harness is not just unconditionally rejecting.
- **HARDEST:** 400 — duplicate completion for an already-completed step, even
  from an authorized admin caller (write-gate and checklist validation are
  independent, both enforced); 400 — a completion event for a step key that
  doesn't exist.
- **BOUNDARY:** 400 — banking-verification attempted before its dependency is
  satisfied, enforced server-side too, not just in the pure function; 400 —
  dependency satisfied but no verification channel/hold acknowledgement; 200
  — all three conditions satisfied.
- 200/400 — a `reopened` event accepted for a genuinely-completed step, and
  refused for a step that was never completed.

---

## 7. Competitive moat — benchmarked against five named platforms, by tier

Freshly fetched (12 Sep 2026), not recalled from training data.

| Platform | Onboarding capability, as publicly described | Honest comparison |
|---|---|---|
| **SAP Ariba** (Supplier Lifecycle & Performance) | Streamlines onboarding cycle time via guided workflows in Ariba SLP (SAP's own community blog material; the vendor's own product-detail page returned a `robots.txt` block on direct fetch, same disclosed sourcing limitation COPQ's rework already logged for this vendor). | Ariba assumes full platform adoption — there is no lightweight, no-lock-in advisory mode; a client evaluating a supplier relationship informally has no equivalent to ISC's Advisory tier. |
| **Coupa** (Supplier & Risk Management) | Positioned as "the original entry point for engaging with a supplier," collecting/approving/monitoring supplier information as part of a broader Business Spend Management suite. Coupa's own documented integration with **Trustpair** exists specifically because Coupa's native platform "lacks automated, global bank account ownership verification" — this is Coupa's own disclosed gap, not ISC's assumption. | Confirms real-time bank-account-ownership verification is achievable in this market via a bolted-on partner, not a native feature — the same honest gap ISC discloses for its own banking-verification step (§2). Coupa's operational tier is deep; it has no lightweight advisory-only mode either. |
| **JAGGAER** (Supplier Management) | A guided self-service portal with "built-in compliance checks and configurable workflows"; financial-stability and geographic-risk models are named, but no specific banking-verification mechanism or accountability model (single-owner sign-off) is described in public material. | JAGGAER's compliance-check depth is real and not fully matched here; but nothing in its public material describes onboarding as hard-gated by an adversarially-stress-tested approval derivation the way Items 3+4 are wired together in this build. |
| **GEP SMART** (Quantum Intelligence) | A "Supplier Onboarding Agent" and a "Data Harmonization & Validation Agent" automate document extraction/validation and claim "full audit trail and accountability" — but banking verification is not addressed in the public material reviewed, and approval-routing specifics are not disclosed. | GEP's document-automation depth (certificate/ID extraction) is a real, named gap against this build, which requires manual document collection today. |
| **Ivalua** | Publishes its own 5-step onboarding process (risk assessment → compliance/documentation → evaluation/approval → contract → system integration) — the same structure this module's legal/compliance and operational-readiness steps mirror. Its guidance names "a dedicated point of contact" but not a single-Accountable-owner discipline; banking verification is only reached via Trustpair-style third-party integration, not natively. | Ivalua's own published process is the closest structural analog to this module — the real differentiator is that ISC's onboarding is hard-gated on an adversarially-tested ASL derivation (Items 3+4 wired together) and enforces a genuine single-Accountable sign-off server-side, neither of which Ivalua's material describes. |

**Advisory-tier positioning (the genuine differentiator):** none of the five
platforms above offer a genuinely standalone, no-lock-in, sourced onboarding
checklist a prospect can use before — or entirely instead of — adopting the
vendor's full operational platform. Each assumes the client is (or is about to
become) a full operational user of that vendor's system. ISC's Advisory tier
is built to be good enough to be the *only* tier a smaller or less
platform-committed client ever uses — a real, deliberate positioning choice,
not a limitation smoothed over.

**Operational-tier honest gap:** Coupa's and Ivalua's own reliance on a
Trustpair-style partner integration proves real-time automated bank-account-
ownership verification is achievable in this market. ISC does not ship that —
it ships the disclosed, sourced manual control (independent callback
verification + first-payment hold) instead. This is named as a real, open gap,
not hidden (see `BANKING_VERIFICATION_GUIDANCE`'s primary/alternative split in
the module itself).

---

## 8. QA 10/10 — two real scenarios, one real defect fixed per tier

Per the mandatory `isc-qa-customer-simulation` pass, run separately for each
tier (not one pass papering over both), with two real defects found and fixed
in this same task before it was called done.

### 8.1 Advisory-tier scenario

A procurement consultant at a mid-market GCC manufacturer — no ISC account yet,
just evaluating the tool — opens the onboarding page for a hypothetical
supplier ("Rawabi Steel Fabrication LLC," SUP-RAWABI-01) they are about to
approve. With no organization on the account, the page falls back to manual
ASL entry so the checklist still renders — confirming the tier stands alone,
per §0/§3. They toggle to Arabic and read every step's label, "why it matters"
note, and source citation — all genuine, sourced Arabic text, not
machine-garbled or a reused English string. They review the RACI guidance
panel (Accountable: Supplier Relationship Manager / مدير علاقات الموردين) and
correctly understand it as a recommendation, not a lock.

**Defect found and fixed (Advisory tier):** the manual ASL-entry checkbox was
labeled "Manual ASL entry (no organization on this account)" — describing the
*section*, not what the checkbox itself does. The checkbox directly sets
`onASL` true/false; a real user reading that label could not tell that
unchecking it means "declare this supplier NOT approved," a genuine
Decision-Ready-Output-Standard violation (isc-ai-output-standards #3 — never
leave a control's function for the reader to guess). Fixed: the label now
reads "This supplier is currently approved on the ASL (manual entry — no
organization linked to this account)" / the equivalent real Arabic, in both
languages, describing the control's actual effect.

### 8.2 Operational-tier scenario

An org_admin at the same organization, now with a live account, approves the
supplier onto the real ASL (Item 3), switches to the Operational tier, and
begins working through the checklist — completing legal/compliance steps one
by one, then hitting the banking-verification step (entering the independent
verification note and acknowledging the first-payment hold), watching the
persisted state refresh after each save. They reload the page days later to
check progress on a second, freshly-approved supplier that nobody has touched
yet.

**Defect found and fixed (Operational tier), #1 — false-positive stalled
alarm:** `detectStalledOnboarding()` returned `stalled: true` for ANY record
with zero activity, regardless of how long ago it became eligible — meaning a
supplier approved five minutes earlier showed the identical alarming banner as
one genuinely neglected for weeks. Root cause: this append-only event model
has no separate "onboarding opened" timestamp independent of step-completion
events, so zero events could not be distinguished from "just started" vs.
"neglected." Fixed: zero-activity records are now surfaced as an honest,
non-alarming `notStarted: true` state, never as `stalled`; `stalled` is
reserved for a record that had genuine activity and then went quiet past the
14-day threshold, which this model can measure correctly. The gap this
exposes — no independent "eligible since" timestamp — is disclosed in §9, not
smoothed over.

**Defect found and fixed (Operational tier), #2 — RTL alignment bug:** the
completed-step badge and its "reopen" control were hardcoded to
`text-right`, a physical (not logical) alignment. In Arabic/RTL mode this is
the wrong trailing edge for that column, an accessibility/visual-consistency
defect (isc-standing-rules #9's own RTL discipline) that would not have been
caught by typecheck or unit tests, only by the language-switch walkthrough
itself. Fixed to flip with `isAr`, matching this file's own established
bilingual-ternary convention throughout.

Both fixes were re-verified (targeted vitest + scoped `tsc`) in the same task,
before this build was called done — not deferred.

---

## 9. Disclosed gaps and honest limitations

1. **No independent "onboarding eligible since" timestamp.** As found during
   QA (§8.2), this model can only measure "stalled" relative to the last
   recorded event, not relative to when a supplier first became eligible. A
   future revision could capture that timestamp at the ASL-approval boundary
   itself (Item 3) if this proves insufficient in practice.
2. **No native, automated banking-detail verification.** ISC ships the
   sourced manual control (independent callback verification + first-payment
   hold) — a real, disclosed gap against Coupa's and Ivalua's Trustpair-style
   partner integrations (§7). Closing this would require a genuine
   third-party fraud-prevention API integration, not currently built.
3. **Scorecard graduation is a one-click action, not a silent automatic
   transition** (§5, point 4) — a deliberate, disclosed architectural choice
   given the Scorecard roster's per-user, full-replace persistence model, not
   a shortcut taken to save time.
4. **A full monorepo `tsc` could not complete in this session's
   memory-constrained sandbox** (same disclosed constraint as every prior
   item in this build); scoped `tsc` runs across every touched file caught
   and fixed one real type error (a `Set<OnboardingStepKey>` vs. `string`
   mismatch) before push, in addition to the two QA-caught defects in §8.
5. **The RACI guidance shown on the Advisory tier is a disclosed,
   manually-synced mirror** of `supplierRACI.ts`'s own `RACI_TEMPLATE` row for
   `onboarding_signoff` (standalone-first, Rule 3) — if that template
   changes, this mirror must be updated in the same change.

---

## 10. Files in this build

- `artifacts/i-supply-chain/src/lib/supplierOnboarding.ts` — the shared
  checklist-generation, gating, validation, stalled-alert and
  graduation-readiness engine (both tiers).
- `artifacts/i-supply-chain/src/lib/supplierOnboarding.test.ts` — 40 soft/
  hardest/boundary/adversarial-degradation tests, 40/40 passing.
- `lib/db/src/schema/onboardingEvents.ts` — the append-only
  `onboarding_step_events` table (Operational tier persistence).
- `lib/db/src/schema/index.ts` — barrel export addition.
- `artifacts/api-server/src/routes/onboarding.ts` — the double-gated
  (ASL + RACI) `/api/onboarding` route.
- `artifacts/api-server/src/routes/index.ts` — route registration.
- `artifacts/api-server/tests/onboarding.test.ts` — 19 HTTP-boundary tests,
  19/19 passing.
- `artifacts/i-supply-chain/src/pages/SupplierOnboarding.tsx` — the live,
  navigable, bilingual two-tier UI.
- `artifacts/i-supply-chain/src/App.tsx` — route registration
  (`/onboarding`).
- `artifacts/i-supply-chain/src/components/Header.tsx` — nav entry
  ("🚀 Supplier Onboarding" / "🚀 تهيئة الموردين"), so the new page is
  actually discoverable, not just reachable by typing a URL (Rule 9).
- `docs/SI_Supplier_Lifecycle_Governance_Item4_Onboarding_Worked_Example.md`
  — this document.
- `artifacts/i-supply-chain/src/lib/supplierGovernanceTierRecommendation.ts`
  — the standalone governance-tier-recommendation module (§11 addendum,
  12 Sep 2026), built as "step zero" and designed for reuse by Items 5-7.
- `artifacts/i-supply-chain/src/lib/supplierGovernanceTierRecommendation.test.ts`
  — 22 standalone soft/hardest/boundary/override-precedence tests, 22/22
  passing.

### 11.7 QA-review follow-up (same day) — see the module's own worked-example doc

A post-close-out QA review asked six verification questions about this
addendum. Answering them surfaced one real defect (the override above was
component-state-only, not durable) and one clarification (the industry
dropdown correctly reuses the platform's canonical `IndustryKey`, not a new
list -- `industrySubSectors.ts` is a sub-sector refinement of that same
type, not a separate taxonomy). Rather than duplicate the full writeup
here, the complete answers, the durable-persistence fix (a new
`governance_tier_override_events` table, `/api/governance-tier` route, and
17 HTTP-boundary tests), the CI-failure evidence for the placeholder
commit, and the explicit competitive-benchmark-not-performed disclosure are
all recorded in this module's own dedicated worked-example doc:
`docs/SI_Supplier_Governance_Tier_Recommendation_Worked_Example.md`.

## 11. Addendum (12 Sep 2026) — Governance-Tier Recommendation Module

Added as a follow-up commit to this same Item 4 build, per an explicit,
self-corrected platform-owner instruction: build a standalone module that
recommends Advisory vs. Operational tier from the supplier's Kraljic
quadrant (Module 02) and the client's declared industry, treat it as "step
zero" of the onboarding build (built and stress-tested on its own before
being wired into the tier toggle), and design it for reuse, unmodified, by
Items 5-7.

### 11.1 Sourcing — what's real, what's ISC's own synthesis

The owner's own self-critique, issued before this module was built, is
preserved verbatim in spirit here because it materially improved the
design:

1. **Differentiated engagement depth by Kraljic quadrant is a real, named
   SRM concept, not an ISC invention.** Kraljic's original 1983 purchasing-
   portfolio model, as summarized on CIPS's own pages (cips.org, "Kraljic
   Matrix" and "Supplier Preferencing Matrix", fetched 2026-09-12),
   prescribes materially different relationship approaches per quadrant:
   Strategic → "balancing power ... performance-based partnerships";
   Bottleneck → "securing long- and short-term supply ... seeking
   alternative suppliers"; Leverage → exploit "full purchasing power ...
   tendering, target pricing"; Non-critical/Routine → "systems contracting
   and e-procurement ... efficient processing." CIPS does not use ISC's
   words ("governance intensity", "Advisory vs. Operational") but the
   underlying claim — Strategic/Bottleneck warrant closer engagement than
   Leverage/Routine — is directly attributable to Kraljic/CIPS.
2. **Regulated industries warranting deeper third-party oversight is also a
   real, named regulatory pattern**: the 2023 Interagency Guidance on
   Third-Party Risk Management (OCC, Federal Reserve, FDIC) directs US
   financial institutions to scale monitoring intensity to a third party's
   criticality/risk — a widely-cited TPRM baseline. This module's use of it
   is an explicit ANALOGY (disclosed as such in the module header and in
   the UI copy itself): ISC is not a US banking regulator and this
   guidance does not literally bind Saudi/GCC healthcare, energy, or
   government procurement.
3. **What is ISC's own synthesis, disclosed, not hidden:** (a) the specific
   OR-gate combination rule — Operational is recommended when EITHER the
   Kraljic signal OR the industry signal indicates elevated risk, Advisory
   only when neither does — is ISC's own operationalization of the two
   sourced concepts above, not a named standard's literal prescription; (b)
   the classification of exactly which 3 of the platform's 8 declared-
   industry values (`healthcare-pharma`, `oil-gas`, `government`) count as
   "regulated" for this module is ISC's own judgment call — other
   industries (food-beverage, construction) carry real regulatory regimes
   too, just not the systemic financial/health/public-accountability
   oversight this specific signal targets. Both disclosures are shown to
   the user directly in the UI (`industryClassificationNote`), not just in
   code comments — Decision Record 8.7 in practice, not merely on paper.

### 11.2 Design contract (per the owner's corrected spec)

- **Recommend, never enforce**: the module returns a `preSelectTier` value
  that pre-selects the UI toggle; the client can always click the other
  tier. The module has zero persistence and zero side effects.
- **Missing data defaults to Advisory, never guessed toward Operational**:
  if either the Kraljic quadrant or the declared industry is missing,
  empty, or malformed, the recommendation is unconditionally Advisory —
  regardless of what the other signal says. A real combined recommendation
  is only computed when both signals are present and valid.
- **Override persists against a later recommendation change**:
  `resolveEffectiveGovernanceTier()` makes a client override always win
  over a freshly recomputed recommendation, until the client explicitly
  changes the override again. The module itself stores nothing — the
  caller is responsible for keeping the override and re-supplying it.
  **Correction (same day, QA review):** at first wiring, "the caller" meant
  only `SupplierOnboarding.tsx`'s local component state, which was silently
  lost on page reload -- a real defect, not a disclosed design choice. See
  the addendum note at the end of this section for the durable fix.

### 11.3 Standalone-First disclosure

Zero runtime imports from sibling modules (Rule 3). Two input shapes are
manually-synced mirrors, disclosed in the module header:
`KraljicQuadrantLike` mirrors the lowercase `KraljicQuadrant` union used by
`kraljicScoring.ts`/`supplierPreQualification.ts`/
`supplierRecoveryPortfolio.ts` — noting, as a disclosed pre-existing
inconsistency this module does not silently paper over, that
`supplierIntelligenceCaseStudy.ts` defines a differently-CASED version of
the same four values; `normalizeKraljicQuadrant()` defensively lowercases
input so a value sourced from either file resolves correctly.
`IndustryKeyLike` mirrors `IndustryKey` from `kpiBenchmarksByIndustry.ts` —
the platform's one existing "declared industry" vocabulary — reused rather
than inventing a parallel taxonomy, per Rule 3's no-duplicate-data-model
discipline.

### 11.4 Standalone stress test results (run before UI wiring, per "step zero")

22/22 tests passing (`supplierGovernanceTierRecommendation.test.ts`):

- **Missing-data (6 tests)**: both signals missing; Kraljic-only (even for
  a Strategic supplier); industry-only (even for `government`); malformed
  Kraljic value; malformed industry value; empty-string/whitespace inputs
  — all correctly default to Advisory.
- **Both-signals-present combinations (7 tests)**, including the two
  conflicting-signal cases the owner specifically named: Strategic quadrant
  + unregulated industry → Operational (supply risk alone is enough);
  Non-critical quadrant + regulated (`government`) industry → Operational
  (regulatory exposure alone is enough). A boundary test sweeps all 4
  quadrants × 2 industry buckets without throwing.
- **Defensive parsing / hardest tier (3 tests)**: differently-cased Kraljic
  input normalizes correctly; non-string/object/array adversarial input
  returns `null` rather than throwing; incidental whitespace is trimmed.
- **Override precedence (6 tests)**, including the two core stress cases
  the owner explicitly asked for: an Advisory→Operational override persists
  even after a later Kraljic re-scoring flips the recommendation to
  Operational anyway (both now agree, but the override, not the
  recomputed recommendation, is what the resolver reports as the
  effective source); and the reverse direction, an Operational→Advisory
  override persisting against an unchanged Operational recommendation.

Scoped `tsc --noEmit`: 0 errors, run together with
`supplierOnboarding.ts` and `SupplierOnboarding.tsx` to catch integration-
level type issues before wiring.

### 11.5 Wiring into `SupplierOnboarding.tsx`

Two new manual-entry selects (Kraljic quadrant, declared industry — the
same disclosed-fallback pattern already used for the Module 03 contact
hints, since neither Module 02 nor a client-profile screen feeds this page
directly yet) sit directly under the tier toggle, always visible
regardless of ASL gate state (Rule 9 discoverability). A recommendation
banner shows the live rationale (bilingual), a "Recommended" or "Manually
overridden" badge, the industry-classification honesty disclosure, and —
only when overridden — a "Reset to recommendation" button. The tier toggle
buttons now call `handleTierSelect()`, which records an explicit override;
the page's `tier` value itself is derived from
`resolveEffectiveGovernanceTier()`, so the toggle auto-pre-selects the
recommended tier whenever no override is set, and continues honoring a
standing override even as the Kraljic/industry inputs change.

### 11.6 QA 10/10 pass on this addition — one real defect found and fixed

Walked through the same scenario as an SRM lead scoring a Rawabi
counterparty as Strategic + Oil & Gas: recommendation correctly flips to
Operational and pre-selects the toggle with no click needed; manually
overriding to Advisory correctly shows the "Manually overridden" badge and
persists even after changing the Kraljic quadrant afterward; "Reset to
recommendation" correctly clears the override.

**Real defect found (bilingual correctness, dimension 3):** the first draft
translated "Bottleneck" as "عنق زجاجة (نادر التوفر)" — a non-standard,
overly-explained gloss — instead of the platform's own, already-established
term. `supplierPreQualification.ts` (Item 3, line 312) already uses "عنق
الزجاجة" for the same Kraljic quadrant in its own Arabic copy. Fixed both
occurrences (the option label in `SupplierOnboarding.tsx` and the rationale
string in `supplierGovernanceTierRecommendation.ts`) to match the
platform's existing, grammatically standard term, re-verified with the full
test suite and a scoped `tsc` run — both still clean.

No other real defects surfaced in this addition's walkthrough (discoverability, accessibility — real `<select>`/`<button>` elements, keyboard-operable — data safety, and cross-feature isolation were all checked and found sound); this is reported honestly rather than padded with dimensions manufactured to look thorough.
