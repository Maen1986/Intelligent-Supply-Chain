# SI Supplier Lifecycle Governance — Governance-Tier Recommendation Module

*A standalone, cross-cutting module built alongside Item 4 (Supplier
Onboarding) on 12 September 2026, per an explicit platform-owner correction
that it be treated as "step zero" — built and stress-tested on its own
before being wired into any item's UI — and designed for reuse, unmodified,
by Items 5–7 (Periodic Evaluation, Second-Party Audits, Blacklist/
Offboarding). Amended 12 September 2026 (same day) after a QA review of the
Item 4 close-out surfaced one real defect (a component-state-only override)
and asked six specific verification questions; this document folds in the
fixes and answers rather than tracking them in a separate addendum.*

## 0. What this module is and is not

`supplierGovernanceTierRecommendation.ts` answers one question: for a given
supplier, should ISC's onboarding (and, by design, later lifecycle stages)
default to the Advisory tier or the Operational tier? It is a pure
recommendation engine — no persistence of its own, no enforcement, no
side effects. It is not itself one of the seven numbered Supplier Lifecycle
Governance items; it is infrastructure two of those items (so far: Item 4,
with Items 5–7 expected to follow) share.

## 1. Sourced methodology — what's real, what's ISC's own synthesis

This module rests on two claims. Each is checked against a named external
source rather than assumed, and where the module goes beyond what either
source actually says, that is disclosed as ISC's own synthesis, not
smoothed over.

**Claim 1 — Kraljic-quadrant-differentiated engagement depth is real.**
Kraljic's original 1983 purchasing-portfolio model, as summarized on CIPS's
own published pages (cips.org, "Kraljic Matrix" and "Supplier Preferencing
Matrix", fetched 12 September 2026), prescribes materially different
relationship approaches per quadrant: Strategic — "balancing power between
purchasers and suppliers based on performance-based partnerships" (close,
collaborative); Bottleneck — "securing long- and short-term supply and
seeking alternative suppliers is a priority" (proactive, relationship-heavy
risk mitigation); Leverage — exploit "full purchasing power ... tendering,
target pricing and product substitution" (competitive, transactional);
Non-critical/Routine — "systems contracting and e-procurement solutions"
(automated, low-touch). CIPS does not use ISC's words ("governance
intensity", "Advisory vs. Operational") — that vocabulary is ISC's own —
but the underlying claim this module rests on (Strategic/Bottleneck warrant
closer engagement than Leverage/Routine) is directly and correctly
attributable to Kraljic/CIPS.

**Claim 2 — regulated industries warrant deeper third-party oversight, by
analogy to a real regulatory pattern.** The 2023 Interagency Guidance on
Third-Party Risk Management (OCC, Federal Reserve, FDIC) directs US
financial institutions to scale the intensity of ongoing third-party
monitoring to the criticality/risk of the relationship — a widely-cited
baseline in third-party risk management (TPRM) practice. This module's use
of it is an explicit ANALOGY, not a literal citation: ISC is not a US
banking regulator, and this guidance does not itself bind Saudi/GCC
healthcare, energy, or government procurement. The analogy — regulated
sectors generally warrant tighter third-party governance — is a defensible
extension of a real, named regulatory pattern, disclosed as an extension
rather than presented as a direct requirement.

**What is ISC's own synthesis, disclosed in the module header AND in the
product itself (not just in code):**

1. The specific combination rule — Operational is recommended when EITHER
   the Kraljic signal OR the industry signal indicates elevated risk,
   Advisory only when neither does — is ISC's own operationalization of
   the two sourced concepts above. Neither Kraljic/CIPS nor the Interagency
   Guidance prescribes this exact two-input decision table.
2. The classification of which of the platform's 8 declared-industry
   values (`healthcare-pharma`, `oil-gas`, `government`) count as
   "regulated" for this module is ISC's own judgment call. Food-beverage
   and construction also carry real regulatory regimes in most markets;
   they are excluded here only in the narrower sense of not carrying the
   systemic financial/health/public-accountability oversight this specific
   signal targets — a genuinely debatable line, disclosed as one.

Both disclosures render live in the product as `industryClassificationNote`
next to every recommendation — a real user sees the honesty disclosure at
the moment of use, not only a reader of the source code.

## 2. Design contract

- **Recommend, never enforce.** The module returns a `preSelectTier` value
  that pre-selects the UI toggle; the client can always click the other
  tier. The module itself has zero persistence and zero side effects.
- **Missing data defaults to Advisory, never guessed toward Operational.**
  If either the Kraljic quadrant or the declared industry is missing,
  empty, or malformed, the recommendation is unconditionally Advisory,
  regardless of what the other signal says.
- **Override persists against a later recommendation change.**
  `resolveEffectiveGovernanceTier()` makes a client override always win
  over a freshly recomputed recommendation, until the client explicitly
  changes the override again.

## 3. Standalone-First disclosure

Zero runtime imports from sibling engine modules (Rule 3). Two input shapes
are manually-synced mirrors, disclosed in the module header:
`KraljicQuadrantLike` mirrors the lowercase `KraljicQuadrant` union used by
`kraljicScoring.ts` / `supplierPreQualification.ts` /
`supplierRecoveryPortfolio.ts` — noting, as a disclosed pre-existing
inconsistency this module does not silently paper over, that
`supplierIntelligenceCaseStudy.ts` defines a differently-CASED version of
the same four values; `normalizeKraljicQuadrant()` defensively lowercases
input so a value sourced from either file resolves correctly.

`IndustryKeyLike` mirrors `IndustryKey` from `kpiBenchmarksByIndustry.ts` —
the platform's canonical, 8-value "declared industry" vocabulary, already
used by the KPI Dashboard's industry selector and benchmark review-status
badges. **On the specific question of whether this duplicates
`industrySubSectors.ts`: it does not.** `industrySubSectors.ts` is not a
separate top-level industry taxonomy — it is a 60-name SUB-SECTOR grouping
keyed under the SAME 8-value `IndustryKey` this module already reuses (used
by the TCO Engine's sub-sector picker, `ProcurementTools.tsx`). Reused
directly here would have been the wrong choice in the other direction: a
governance-tier recommendation should key off the top-level industry class
where a "regulated" classification naturally lives, not fine-grained
sub-sector labels like "Grocery & Supermarkets" vs. "B2C E-Commerce
Platform." Checked directly, not assumed: Contract Intelligence
(`clmIndustryStandards.ts`) does not use `IndustryKey` or
`industrySubSectors.ts` at all — it uses its own, differently-scoped
`IndustryBucket` (`supply-goods` / `construction` / `om` /
`professional-services` / `logistics`), which classifies CONTRACT TYPE, not
client industry, a different axis entirely. Maturity Assessment
(`maturityScoring.ts`, `diagnosticEngine.ts`) uses a free-text
`industry: string` field with no shared enum at all. So there is, in fact,
no single taxonomy already used consistently across "Contract Intelligence
and Maturity" — `IndustryKey` (used here) is the closest thing the platform
has to one canonical top-level industry vocabulary, and no migration is
needed because no separate list was created.

## 4. Worked example — Rawabi Steel Fabrication LLC

Continuing the same running scenario as Item 4's own worked-example doc: a
mid-market GCC manufacturer is onboarding **Rawabi Steel Fabrication LLC**
(`SUP-RAWABI-01`) as a supplier of critical fabricated steel components.

**Step 1 — no data yet.** The onboarding page opens with the Kraljic
quadrant and declared-industry selects both blank. `dataCompleteness:
'neither-present'`. Recommendation: Advisory (`preSelectTier: 'advisory'`).
Rationale shown: "Defaulting to Advisory: Kraljic quadrant and declared
industry not yet available. This module never recommends Operational on
incomplete data." The tier toggle is pre-selected to Advisory with no click
needed.

**Step 2 — Module 02 scores the supplier.** The SRM lead enters Kraljic
quadrant = Bottleneck (few qualified fabrication shops locally, moderate
spend, genuine supply-continuity risk) and declared industry =
Manufacturing (the client's own industry — not on this module's 3-item
"regulated" list). `kraljicSignal: 'high-touch'`, `industrySignal:
'not-regulated'`. Because the OR-gate needs only one elevated signal, the
recommendation flips to Operational: "Operational recommended, because
bottleneck supplier (Kraljic: closer relationship management warranted).
ISC tracks per-step onboarding completion and alerts on stalled progress
for this tier." The toggle auto-pre-selects Operational; the badge reads
"Recommended," not "Manually overridden," because nothing has been
overridden yet.

**Step 3 — the SRM lead disagrees and overrides.** Despite the
recommendation, the lead judges this particular relationship low-risk in
practice (a long-standing, well-capitalized supplier) and clicks Advisory.
Because the account is an org_admin on a real organization, this is no
longer a local, throwaway choice: `POST /api/governance-tier/override`
records `{action: 'set', tier: 'advisory'}` as a new, durable
`governance_tier_override_events` row. The banner now reads "Manually
overridden," with a "Reset to recommendation" control.

**Step 4 — the page is reloaded (or reopened next week).** Before the
QA-driven fix documented in §7 below, the override would have silently
reverted to whatever the recommendation currently said — a real defect,
now fixed. `GET /api/governance-tier/current?supplierId=SUP-RAWABI-01`
replays the org's own override events and returns `{tier: 'advisory',
overriddenAt: ...}`; the page hydrates `tierOverride` from that durable
record, and the Advisory override still holds, exactly as it did before
the reload.

**Step 5 — Module 02 later re-scores the supplier as Strategic** (a
second, larger contract makes the relationship genuinely strategic).
`computeRecommendedGovernanceTier()` recomputes and would now say
Operational even more strongly (`kraljicSignal: 'high-touch'` for a
different reason). `resolveEffectiveGovernanceTier()` still reports
`{tier: 'advisory', source: 'client-override'}` — the lead's explicit
choice keeps winning until they change it themselves, exactly as
documented in §2's design contract, not merely as a claim untested by a
real durable-reload scenario.

**Step 6 — the lead changes their mind and clicks "Reset to
recommendation."** `POST /api/governance-tier/override` records a `{action:
'clear'}` event. The next `GET /current` replay sees the clear event as the
latest one and returns `override: null`; the page falls back to the live
recommendation (Operational, per Step 5's re-scoring).

## 5. Standalone stress test results (run before UI wiring, per "step zero")

22/22 tests passing (`supplierGovernanceTierRecommendation.test.ts`), by
category:

- **Missing-data (6 tests):** both signals missing; Kraljic-only (even for
  a Strategic supplier); industry-only (even for `government`); malformed
  Kraljic value; malformed industry value; empty-string/whitespace inputs
  — all correctly default to Advisory.
- **Both-signals-present combinations (7 tests), including the two named
  conflicting-signal cases:**
  - *"CONFLICTING SIGNALS: Strategic quadrant + unregulated industry --
    recommends Operational (supply risk alone is enough)"* —
    `{kraljicQuadrant: 'strategic', declaredIndustry: 'retail-fmcg'}` →
    `recommendedTier: 'operational'`.
  - *"CONFLICTING SIGNALS: Non-critical/routine quadrant + regulated
    industry -- recommends Operational (regulatory exposure alone is
    enough)"* — `{kraljicQuadrant: 'non-critical', declaredIndustry:
    'government'}` → `recommendedTier: 'operational'`.
  - Plus agreeing-signal cases (Strategic + healthcare-pharma → Operational;
    Leverage + retail-fmcg → Advisory; Bottleneck + logistics →
    Operational), and a boundary sweep of all 4 quadrants × 2 industry
    buckets without throwing.
- **Defensive parsing / hardest tier (3 tests):** differently-cased Kraljic
  input normalizes correctly (mirrors the `supplierIntelligenceCaseStudy.ts`
  casing inconsistency); non-string/object/array adversarial input returns
  `null` rather than throwing; incidental whitespace is trimmed.
- **Override precedence (6 tests):** including the two core cases the
  owner explicitly asked for — an Advisory→Operational override persisting
  even after a later Kraljic re-scoring flips the recommendation to
  Operational anyway (both agree, but the override, not the recomputed
  recommendation, is what the resolver reports as the effective source);
  and the reverse direction, an Operational→Advisory override persisting
  against an unchanged Operational recommendation.

Scoped `tsc --noEmit`: 0 errors, run together with `supplierOnboarding.ts`
and `SupplierOnboarding.tsx`.

**New, added during the QA-driven durable-persistence fix (§7):** 17
HTTP-boundary tests for `/api/governance-tier`
(`governanceTier.test.ts`), mirroring `onboarding.test.ts`'s exact
supertest/mocking pattern — unauthenticated (401), missing supplierId
(400), malformed payload / malformed tier value (400), non-authorized
caller (403, zero DB write), reassigned-Accountable-holder (403, zero DB
write, HARDEST tier), positive controls for org_admin and the genuine RACI
Accountable holder (200, event actually inserted), a `clear` action
positive control, a no-organization-on-account case (403), and a
CORE-CASE test proving a later `clear` event correctly supersedes an
earlier `set` event on replay, plus a BOUNDARY test proving the replay
filters by supplierId defensively even though the SQL WHERE clause already
does. 17/17 passing.

## 6. Durable override persistence (added after QA review — this was the
real gap)

**What existed at first close-out:** the override lived only in
`SupplierOnboarding.tsx`'s component state (`useState`). This directly
contradicted the module's own documented contract — "a client override,
once set, always wins ... until the client explicitly changes it again" —
because a page reload silently reverted to the recommendation. A reload is
not the client explicitly changing it. This was a real defect, not a
disclosed design choice, and it is fixed now, not merely noted.

**What it is now:** a new, append-only table,
`governance_tier_override_events` (`lib/db/src/schema/
governanceTierOverrideEvents.ts`), following the exact event-log-plus-
replay pattern already used by `copq_ledger`, `raci_assignment_events`,
`asl_decision_events` and `onboarding_step_events` — every override or
clear action is a new row; current state is always derived by replaying a
supplier's events to the latest one, never read from a separately-
maintained column. A new route, `/api/governance-tier`
(`artifacts/api-server/src/routes/governanceTier.ts`), exposes `GET
/current?supplierId=` and `POST /override`.

**Write-authorization rule:** identical to `/api/onboarding/events` — the
caller must be this org's `org_admin` OR the org's current RACI
Accountable holder for `'onboarding_signoff'`, replayed from that org's own
`raci_assignment_events` on every write. This reuses Item 4's existing
authorization rule rather than inventing a separate one, since setting the
governance tier is the same class of decision as onboarding sign-off
itself — deliberately not a new, bespoke gate for this one setting.

**HTTP-boundary tests:** 17 tests, matching Item 3/4's own pattern exactly
(see §5 above for the full breakdown) — unauthenticated, malformed-payload,
non-authorized-caller, reassigned-Accountable-holder rejections (all with
zero DB writes verified), and positive controls for both authorized paths
and both actions (`set` and `clear`).

**What still falls back to local-only state, honestly:** a signed-out or
no-organization visitor has no organization to durably scope an override
to — for that visitor, the override remains component-state-only for the
session, the same disclosed-fallback precedent already used for manual ASL
entry elsewhere on this page. This is stated in-code and is not a silent
gap.

**Write-gate now enforced in the UI, not just the API:** the tier toggle
previously updated local UI state optimistically before the server call
resolved, which — caught during this same review pass — meant a
non-authorized user's click would flash a false "Manually overridden"
badge for whatever the server then silently rejected. Fixed: the UI now
awaits the server's acceptance before updating the displayed tier when an
organization is present, and shows an explicit "you are not authorized to
change this" notice (proactively, and again on any failed attempt) for a
signed-in user who is neither the org_admin nor the Accountable holder —
matching the Operational tier's own existing `view-only` notice pattern
rather than introducing a new one.

## 7. Competitive-moat benchmark — explicitly NOT performed, and why

Unlike Items 1–4 (COPQ, RACI, Pre-Qualification/ASL, Onboarding), this
module did not receive a dedicated, named-competitor benchmark pass, and
that was not a deliberate scoping decision made at build time — it is
disclosed here plainly rather than retrofitted as if it had been intended.

The reasoning for treating this as defensible, offered for the owner's own
judgment rather than asserted as obviously correct: this module is an
internal recommendation/pre-selection utility feeding a single UI toggle,
not a whole client-facing product surface with its own market position —
closer in kind to the RACI Accountable-holder replay logic reused across
routes (which also never received its own standalone competitor benchmark)
than to a full engine like COPQ or Onboarding. Extending the Item 4
benchmark's findings to this module without a fresh, real check would
itself be a Rule 1 violation (asserting a competitive claim not actually
verified for this specific capability), so no such claim is made here.

If the owner wants one: a real pass would need to check whether SAP Ariba,
Coupa, JAGGAER, GEP, or Ivalua expose any automatic, disclosed,
segmentation-driven governance/monitoring-tier recommendation (as opposed
to a manually-configured risk tier with no stated sourcing) — genuinely
unverified in this build, not assumed either way.

## 8. Evidence the CI gate is working, not just that a fix landed fast

During this build, a push attempt (commit `f0c2751`) accidentally
committed placeholder text in place of `supplierGovernanceTierRecommendation
.ts`'s real content. This was caught immediately via this build's own
byte-for-byte git-blob-SHA verification and corrected in the very next
commit (`015d2eb`) before any further work proceeded. Checked directly
after a QA review asked for the actual evidence, not an assurance: GitHub
Actions DID run against the placeholder commit, and BOTH checks genuinely
FAILED --

- `render-build-parity` on `f0c2751`: `conclusion: "failure"`.
- `typecheck-and-test` on `f0c2751`: `conclusion: "failure"`, with real
  annotations — `"Type expected."` and `"File appears to be binary."` at
  the placeholder file's own path, i.e. the CI pipeline's own toolchain
  independently detected the corrupted content, not merely a coincidental
  failure.

Both checks are `conclusion: "success"` on the corrected commit `015d2eb`.
This is retained here as the actual evidence the CI gate caught a real
mistake, rather than a claim that "CI is green" without record of what it
caught along the way.

## 9. QA 10/10 — this module's own pass (wiring + durable-persistence fix)

Two real defects found and fixed in this module's own build, across two
passes:

1. **Bilingual correctness (first wiring pass):** "Bottleneck" was first
   translated as "عنق زجاجة (نادر التوفر)" — a non-standard, over-explained
   gloss — instead of the platform's own established term. `supplierPreQualification
   .ts` (Item 3) already uses "عنق الزجاجة" for the same Kraljic quadrant.
   Fixed in both the option label (`SupplierOnboarding.tsx`) and the
   rationale generator (`supplierGovernanceTierRecommendation.ts`).
2. **Data safety / honesty (this pass, the durable-persistence fix
   itself):** the override was silently non-durable, contradicting the
   module's own stated contract — described in full in §6. Fixed with a
   real table, route, write-gate, and 17 HTTP-boundary tests, not merely
   disclosed as a known gap.

Walked through discoverability (the banner sits directly under the tier
toggle, always visible, no ASL-gate dependency), accessibility (real
`<select>` and `<button>` elements throughout, keyboard-operable),
cross-feature isolation (no other feature reads this module's output yet),
and data safety for the new table (append-only, no UPDATE/DELETE path
exists in the route) — all found sound, reported honestly rather than
padded.

## 10. Disclosed open gaps

- The competitive-moat benchmark (§7) was not performed for this specific
  module; a real pass, if wanted, is scoped there rather than assumed.
- Items 5–7 are expected to reuse `governance_tier_override_events` and
  `/api/governance-tier` unmodified, but whether each item needs its own
  independent override point (vs. sharing this one keyed only by
  `supplierId`) is an open design question left for those items' own
  scoping, not decided here.
- The 3-industry "regulated" classification (§1) is ISC's own judgment
  call, not an externally sourced list, and is disclosed as such in the
  product itself (`industryClassificationNote`), not only in this doc.

## 11. Files in this build

- `artifacts/i-supply-chain/src/lib/supplierGovernanceTierRecommendation.ts`
  — the standalone recommendation engine.
- `artifacts/i-supply-chain/src/lib/supplierGovernanceTierRecommendation.test.ts`
  — 22 standalone soft/hardest/boundary/override-precedence tests.
- `artifacts/i-supply-chain/src/pages/SupplierOnboarding.tsx` — wiring: the
  Kraljic/industry selects, the recommendation banner, and the durable
  fetch/persist calls against `/api/governance-tier`.
- `lib/db/src/schema/governanceTierOverrideEvents.ts` — the append-only
  `governance_tier_override_events` table.
- `lib/db/src/schema/index.ts` — barrel export addition.
- `artifacts/api-server/src/routes/governanceTier.ts` — the write-gated
  `/api/governance-tier` route.
- `artifacts/api-server/src/routes/index.ts` — route registration.
- `artifacts/api-server/tests/governanceTier.test.ts` — 17 HTTP-boundary
  tests, 17/17 passing.
- `docs/SI_Supplier_Lifecycle_Governance_Item4_Onboarding_Worked_Example.md`
  — Item 4's own doc, §11, cross-references this module.
- `docs/SI_Supplier_Governance_Tier_Recommendation_Worked_Example.md` — this
  document.
