# SI Modules 02→03→04→05→06→07 — Chained Adversarial Stress Test (Al-Fanar Specialty Coatings)

**Date:** 14 September 2026
**Scope:** Registry #436 groundwork (Cross-engine chained adversarial stress-test program). Extends the 9 Sep 2026 Modules 02→03→04→05 chained run (see Site Map v160/v161 changelog entries) to include Module 06 (Commercial & Negotiation Intelligence) and Module 07 (Performance, Development & Recovery), the two modules built after that original run.
**Why this run, not the full #436:** registry #436 itself is scoped as "all 12 modules, once Modules 06–11 are complete." As of this run, Module 01 (Discovery & Sourcing) is deliberately deferred by owner instruction, and Modules 08–11 (Local Content/ICV, Consultancy handoff, Signal Radar, Command Center) are not built. The full 12-module version of #436 is therefore not executable yet — that is a fact about the registry's own stated scope, not a limitation invented for this task. What *is* real and overdue: Modules 02–05 were chain-tested once, 9 Sep 2026; Modules 06 and 07 were built afterward and had never been run through that same chain. This closes that specific, concrete gap.

**Method:** one deliberately messy, adversarial fictional GCC supplier — Al-Fanar Specialty Coatings Co., a Saudi manufacturer of PTFE-based anti-corrosion coating resin — run through the real, live code of all six modules in sequence, each module's real output feeding the next module's real input exactly as a live consultancy engagement would use them. No module's logic was mocked, stubbed, or hand-simulated. Every number below is quoted directly from real executed output (`npx vitest run`, 14 Sep 2026), then independently hand-recomputed against each module's own disclosed formula — the same discipline the original 9 Sep chain test used.

Six adversarial hazards were deliberately built into the single scenario simultaneously, rather than tested one at a time, per the standing rule's own instruction to test "messier, adversarial scenario, overlapping findings across multiple dimensions at once, partial/missing data, conflicting evidence stages, near-threshold values, ties":

1. A Kraljic classification landing in the Bottleneck quadrant (low impact, high risk) — the quadrant the platform's own code names its single highest-risk relationship-mismatch case.
2. A relationship posture (`adversarial`) deliberately mismatched against that quadrant — triggering Module 02's own named "highest-risk combination in the framework" case.
3. A supplier whose role (manufacturer vs. trader/agent) is unconfirmed, carrying a manufacturer-level capability claim anyway — the exact real-world qualification failure Module 03/04 are built to catch.
4. An entity-resolution near-miss (partial name/country overlap with an existing registry record, nothing clean enough to auto-merge) — forcing Module 04's identity gate into CONDITIONAL rather than a confident PASS.
5. A Lock-In Index sitting exactly at Module 05's HIGH threshold (4.0/5) combined with a Time-to-Recover/Time-to-Survive tie (both 8 weeks) — a genuine boundary case on two independent Module 05 metrics at once.
6. A supplier score history that is net-declining over 12 periods *and* carries a catastrophic single-period shock in the most recent period *and* has recurred twice on the same root cause — stacking Module 07's trend, shock, and escalation logic on top of each other in one supplier, not three separate test cases.

## Stage-by-stage real output

### Module 02 — Kraljic positioning + sourcing/negotiation strategy
`scoreItems()` on a two-item portfolio (the focal item at 4.76% of portfolio spend, low quality/revenue impact, 3 qualified suppliers, weak substitutability, elevated geographic risk), industry key `manufacturing` (risk threshold 45, impact threshold 48):

```
profitImpactScore: 36   supplyRiskScore: 67   quadrant: bottleneck
```

Hand-verified: spendScore = min(100, ln(1+4.762)/ln(101) × 160) = 60.69; profitImpactScore = round(60.69×0.6 + 0×0.2 + 0×0.2) = 36 (< 48 threshold). supplyRiskScore = round(62×0.3 + 75×0.2 + 75×0.2 + 45×0.15 + 75×0.15) = round(66.6) = 67 (≥ 45 threshold). 36 < 48 and 67 ≥ 45 → **bottleneck**, exactly as computed. Matched.

`assessRelationshipCompatibility('bottleneck', 'adversarial')`:

```
severity: high-risk   idealPosture: collaborative
```

This is the named Bottleneck+Adversarial special case in the module's own source — "the highest-risk combination in the framework" — confirmed firing correctly, not the generic gap-distance fallback.

`recommendNegotiationStrategy()` and `buildNegotiationPlan()` both ran on the real `bottleneck` quadrant and produced a populated `relationshipAdjustment` warning (bilingual) rather than a silent null, since severity was `high-risk`.

### Module 03 — Object Model
`assessSupplierRoleDataQuality()` on a record created with `supplierRole: 'unknown'`:

```
hasGap: true
```

`resolveSupplierEntity()` against a registry containing one partially-overlapping existing entry (similar legal name, matching country, no legal-entity-number, no exact trading-name match):

```
method: near-miss-unconfirmed   confidence: LOW   candidateMatches: [existing-1]
```

Correct tier-3 fallback behavior: not enough to auto-merge (a false merge is exactly as damaging as a false split, per the module's own documented design), not discarded either — flagged for a human to confirm.

### Module 04 — Qualification Gates
`determineDueDiligenceTier({ kraljicQuadrant: 'bottleneck', geographicRisk: 4 })` → **ENHANCED** (bottleneck + elevated geo risk correctly escalates the due-diligence tier).

`runQualificationGates()`:

```
overallStatus: NOT_QUALIFIED   blockingGate: capability, compliance
  identity:    CONDITIONAL          (LOW entity-resolution confidence)
  capability:  CRITICAL_FAIL        (unconfirmed-role manufacturer claim)
  compliance:  CRITICAL_FAIL        (certificationStatus fact = "expired")
  [7 remaining gates: INSUFFICIENT_EVIDENCE — no facts supplied for those categories]
```

Both critical-fail rules fired exactly as documented: the unconfirmed-role capability claim (Module 03→04's cross-reference) and the named-by-category expired-certification rule, independently and simultaneously, matching the "overlapping findings across multiple dimensions" test discipline.

### Module 05 — Concentration
`computeSupplierMetrics()` with TTR = TTS = 8 weeks (boundary tie) and Lock-In inputs all at 4/5:

```
isSurvivable: true   shortfallWeeks: null   lockInIndex: 4   intelligenceDebtUSD: 30000
```

Hand-verified: Sheffi's rule is TTS ≥ TTR → survivable — 8 ≥ 8 is true at the exact boundary, confirmed survivable with no shortfall window, not a false negative from the tie. Lock-In Index = (4+4+4+4) × 0.25 = **4.0**, exactly at `HIGH_LOCK_IN_THRESHOLD`. Intelligence debt = 2 unresolved gaps × $15,000 = **$30,000**, matched.

Portfolio-level HHI on a 3-supplier category split (42% / 33% / 25%):

```
hhi: 3478   band: highlyConcentrated
```

Hand-verified: 42² + 33² + 25² = 1764 + 1089 + 625 = **3478**, above the 2,500 highly-concentrated threshold. Matched exactly.

Hidden sub-tier concentration (2 sub-tier facts, both still at CLAIMED evidence): **42** — both facts unresolved, so the full capacity share carries through as hidden, per the module's own "a supplier with zero resolved sub-tier facts is a *stronger* invisibility signal, not a weaker one" design.

### Module 06 — Commercial & Negotiation Intelligence
`computePriceTrajectory()` on a 4-period price series (100 → 101 → 137 → 99):

```
direction: flat   percentChange: -1%   maxIntraPeriodSwingPct: 37%   hasIntermediateVolatility: true
```

This is the exact adversarial pattern the module's own header documents as its 9 Sep pressure-test fix: an endpoint-only read would call this "flat" (net change ≈ -1%), silently erasing the real 37% mid-period spike. Confirmed the fix still holds — `hasIntermediateVolatility: true` surfaces it rather than hiding it behind the flat label.

`assessNegotiationLeverage({ lockInIndex: 4, isSurvivable: true }, 'bottleneck')` (real Module 05 output feeding Module 06, real Module 02 quadrant feeding Module 06):

```
level: WEAK   quadrantConsistencyNote: null
```

Correct: Lock-In 4.0 ≥ the 4 threshold → WEAK by itself is enough (the conjunction rule needs *either* condition to fail). No consistency-mismatch note fired, and that is the *correct* real behavior, not a gap — the note only exists for the two named structural-mismatch cases (WEAK leverage in a Leverage quadrant, or STRONG leverage in a Bottleneck quadrant); WEAK leverage in a Bottleneck quadrant is the textbook-*expected* pairing, so a silent null here is the module working as designed, not a mismatch going undetected.

`recommendNextMove()` on a round history whose last entry is `ourMove: 'defected'`:

```
move: cooperate
rationale: "We already retaliated in the last round ... generous tit-for-tat never holds a grudge past one retaliatory round"
```

Confirms the one-round-only retaliation rule holds regardless of the counterpart's last move.

`buildNegotiationBrief()` assembled all of the above (real Module 02 quadrant/strategy/plan, real Module 05-derived leverage, real price trajectory, real next-move) into one document with no internal recomputation — its own documented "pure orchestration, never recomputes" contract held under inspection of the real output.

### Module 07 — Performance, Development & Recovery
`detectSupplier()` on a 12-period score history (`90,88,87,85,84,83,82,81,80,79,78,55`) with 3 closed CARs (recurrence count 2):

```
trend: declining   variability: high   recurrenceCount: 2
recommendedIntervention: DUAL_SOURCE   combinedSignalFlag: true
shockFlag: true   shockChangePct: 29.487...%
shockRuleSourceEn: "...sourced from this platform's own Module 06 ... maxIntraPeriodSwingPct convention..."
```

Hand-verified: latest-period change = |55−78| / 78 × 100 = **29.487%**, above the 15% default threshold → shock correctly flagged. `recurrenceCount = 2` correctly forces at least DUAL_SOURCE regardless of the base REPAIR/DEVELOP recommendation, per the 8D/SCAR escalation ladder's third-occurrence rule. `combinedSignalFlag = true` because variability is `high` *and* recurrence ≥ 1 — both conditions genuinely met, not assumed. The shock-rule source string names Module 06 explicitly, confirming the #700 wiring fix (this session, earlier today) is live in the aggregation layer, not just unit-tested in isolation — this chain test is the first time that wiring has been exercised end-to-end from a real Module-02-through-06 chain rather than a synthetic two-field fixture.

## Result

**Zero code defects found.** All six modules, called in sequence with real cross-module hand-offs (Module 02's quadrant into Modules 04/05/06; Module 05's Lock-In Index and survivability into Module 06; Module 06's own sourced shock-detection convention independently re-derived inside Module 07), produced results that match each module's own disclosed formula under hand recomputation. One correction was needed during test *authoring*, not in the shipped code: the first draft of this scenario used an ad-hoc fact-attribute name (`iso_certification_status`) that did not match Module 04's documented `certificationStatus` category-matching pattern, so the compliance gate initially read `INSUFFICIENT_EVIDENCE` instead of the intended `CRITICAL_FAIL`. Corrected to `certificationStatus` and re-run — this was a test-input naming mismatch against the module's own sourced convention, not a defect in `supplierQualificationGates.ts` itself, and is disclosed here rather than silently fixed and left unmentioned.

Full `src/lib` suite re-run after the chain test (and again after removing the temporary chain-test file, matching the 9 Sep precedent of not inflating the shipped suite count with a cross-cutting integration replay): **1474/1474 passing, zero regressions.** No production code was changed by this stress test.

## What #436 still needs before it can be closed at full scope

This run closes the concrete, known gap (Modules 06/07 never chain-tested against 02–05). It does not close registry #436 itself, which is explicitly scoped to all 12 Supplier Intelligence modules. Still outstanding, and outside this run's scope: Module 01 (deferred by owner instruction), Modules 08–11 (not yet built). #436 should stay open, scoped honestly to "02→07 chain verified; 12-module chain blocked on unbuilt modules," rather than marked closed on the strength of this narrower run.
