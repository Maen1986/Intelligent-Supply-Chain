# SI Module 01 — Requirement Challenge & Capability Ontology — Worked Example, Stress Test, and Chain Extension (Rawabi Advanced Industries)

**Date:** 15 September 2026
**Scope:** Registry #436 groundwork, continued. Module 01 (`supplierRequirementChallenge.ts`, commit `789b0f3`, 16 existing unit tests) already shipped as tested code with real UNSPSC integration, but — per Core Instruction #12 of the SI-00 Charter — had never been run against a concrete worked example, never stress-tested at the soft/hardest/boundary tiers, and had never been chain-tested into Modules 02–07 the way Modules 02–07 were chain-tested against each other on 14 Sep 2026 (see `SI-Modules-02-07-Chained-Adversarial-Stress-Test-AlFanar.md`). This closes that gap and, in the process, surfaces and fixes one real code defect in Module 01 itself.

**Illustrative entity:** Rawabi Advanced Industries (Dammam-based manufacturer of industrial packaging and HVAC components, ~420 employees, GCC/Egypt export footprint) — the SI-00 Charter's own canonical demo company, used here (rather than Al-Fanar, reserved for the 14 Sep run) so Module 01's worked example shares one coherent story with the rest of the engine, per the Charter's explicit instruction.

**Method:** the real, live code of `supplierRequirementChallenge.ts` run through three deliberately distinct scenarios — a clean soft case, a genuine-no-match edge case, and a deliberately messy "hardest" case — then the hardest case's real output hand-carried (disclosed, caller-supplied — Module 02 never imports Module 01, per the standalone-first architecture rule) into a fresh run of Modules 02→03→04→05→06→07, exercising branches the 14 Sep Al-Fanar run did not: a Strategic-quadrant classification instead of Bottleneck, a Strategic+transactional relationship mismatch instead of Bottleneck+adversarial, a real (non-tie) TTR>TTS shortfall, and the tit-for-tat `match-defection` branch instead of the "cooperate after our own retaliation" branch. Every number below is quoted from real executed output (`npx vitest run`, 15 Sep 2026), independently hand-recomputed against each module's own disclosed formula where the inputs are on record in this document.

## Stage 1 — Soft case: freight requirement (clean real UNSPSC match)

`classifyRequirement('services', 'freight', '78')`:

```
{"covered":true,"segment":"78","segmentLabel":"Transportation, Storage and Mail Services",
 "family":"Material packing and handling","familyCode":"78120000",
 "class":"Material handling services","classCode":"78121600",
 "commodity":"Freight loading or unloading","commodityCode":"78121601",
 "note":"Matched at commodity level within segment 78 (Transportation, Storage and Mail Services)."}
```

With specification, capacity, and two answered challenge questions (`incumbent-bias`, `geography-constraint-real`) supplied, `assessRequirementConfidence()` returns **HIGH** — matching the documented rule exactly: classification resolved (`covered:true`) AND specification+capacity present AND ≥2 answered challenges. `buildRequirementBrief()` assembled the full brief with 7 challenge questions left genuinely unresolved and disclosed as such, not hidden.

## Stage 2 — Soft/edge case: tooling maintenance (a real segment, a genuine honest no-match)

`classifyRequirement('services', 'tooling maintenance', '72')`:

```
{"covered":false,"segment":"72","segmentLabel":"Building, Construction and Maintenance Services",
 "note":"No Family/Class/Commodity match found for \"tooling maintenance\" within segment 72
 (Building, Construction and Maintenance Services) -- tracked by free-text category until a
 match is confirmed."}
```

This is a distinct edge case from the module's own existing unit tests: a *valid* segment with *zero* Family/Class/Commodity match, honestly disclosed rather than force-matched to the nearest neighbor (e.g. it does not get silently mapped to the adjacent "Fire protection system... maintenance" commodity found under the same segment during requirement discovery). Decision Record 8.7 held under a real adversarial near-miss, not just a "no segment supplied" case.

## Stage 3 — Hardest case: aluminum extrusion (goods, unquestioned incumbent-bias spec, stale certification, zero challenges answered)

Six adversarial conditions were stacked into one scenario, not tested separately: (1) a goods requirement, which the module's own honest scope limit means can never resolve via UNSPSC; (2) a specification (`±0.05mm tolerance`) written, unexamined, around the incumbent supplier's own die; (3) a certification requirement (AS9100) traced to a client that no longer exists; (4) MOQ/lead-time/capacity figures carried forward from a stale quote, never re-tested; (5) zero challenge questions answered at first pass; (6) two boundary passes sitting exactly either side of the `>=2 answered challenges` HIGH threshold.

`classifyRequirement('goods', 'aluminum extrusion profile', undefined)`:

```
{"covered":false,"note":"UNSPSC goods classification (segments 10-56) is not yet covered by the
 platform's licensed Class/Commodity dataset -- this requirement is tracked by free-text
 category until that dataset is scoped and built."}
```

Four confidence passes on the same classification, real output:

| Pass | Answered challenges | `freeTextCategory` | Spec + capacity | `assessRequirementConfidence()` |
|---|---|---|---|---|
| 1 | 0 | absent | present | **LOW** |
| 2 | 1 (`incumbent-bias`) | absent | present | **LOW** (classification unresolved is a hard gate — one real answer does not compensate) |
| 3 (BOUNDARY) | 1 | `'Aluminum extrusion -- raw material'` | present | **MODERATE** |
| 4 (BOUNDARY) | 2 (adds `certification-driver`) | same | present | **HIGH** |

Hand-verified against the module's own documented rule: `classificationResolved = covered || (freeTextCategory non-empty)`. LOW whenever unresolved or zero answers; HIGH requires resolved AND spec AND capacity AND ≥2 answers; MODERATE otherwise. All four passes match exactly, including the two-sided boundary at the `>=2` threshold (1 answer → MODERATE, 2 answers → HIGH, no off-by-one).

### Real defect found and fixed: `buildRequirementBrief()` silently dropped `freeTextCategory`

Building the full `RequirementBrief` for Pass 4's inputs (two answered challenges, real specification, real capacity, `freeTextCategory: 'Aluminum extrusion -- raw material'`) initially returned `requirementConfidence: 'LOW'`, not the `HIGH` that the equivalent direct `assessRequirementConfidence()` call above produced from the identical inputs.

Root cause, found by reading the source rather than guessing: `buildRequirementBrief()`'s own input type had no `freeTextCategory` field at all, and its internal call to `assessRequirementConfidence()` never forwarded one. The consequence is structural, not cosmetic: **for any goods requirement — the majority of real ISC sourcing categories, since goods UNSPSC segments 10-56 are outside the licensed dataset — the assembled brief could never reach MODERATE or HIGH confidence, no matter how thoroughly a consultant documented the free-text category.** The brief is the module's own documented "real consumer is Module 02" output; silently dropping the one piece of categorization evidence a consultant supplied for the majority of real requirement types is a genuine gap in the module actually doing its job, not a hypothetical one. Notably, the module's own existing unit test at `supplierRequirementChallenge.test.ts:175` already encoded this gap as expected behavior (`// uncovered classification, no freeTextCategory passed through here`) — the gap was known-shaped but not yet closed.

**Fix applied to `supplierRequirementChallenge.ts`** (same task, same module, in scope): added `freeTextCategory?: string` to `buildRequirementBrief()`'s input type, forwarded it into the internal `assessRequirementConfidence()` call, and added the same field to the `RequirementBrief` output interface so a downstream reader (Module 02, or a human reviewer) can see what category a consultant actually assigned — not just infer it indirectly from a HIGH/MODERATE confidence score. Re-run after the fix: Pass 4's brief now correctly returns `requirementConfidence: "HIGH"` with `freeTextCategory: "Aluminum extrusion -- raw material"` carried through. The existing 16-test suite was re-run unchanged (it never supplies `freeTextCategory` to `buildRequirementBrief`, so the new optional field is fully backward-compatible) — all 16 still pass, confirming this was an additive fix, not a breaking change.

Real brief output after the fix:

```
{"requirementConfidence":"HIGH","freeTextCategory":"Aluminum extrusion -- raw material",
 "unresolvedCount":7,
 "assumptions":["MOQ and lead-time figures carried forward from the incumbent extruder's
 last quote, not independently re-tested this cycle."]}
```

## Chain continuation: Module 01's real brief feeds Modules 02→03→04→05→06→07

Disclosed, caller-supplied hand-off (standalone-first architecture — Module 02 never imports Module 01; a human consultant carries the brief's findings into the Kraljic item, exactly as the live platform would once a Supplier Intelligence UI exists): the certification finding raises `qualityImpact`, the "GCC-sourced only, unexamined" geography finding raises `geographicRisk`, and the assumptions/certification list is carried into the new item for a fictional supplier, "Rawabi Aluminum Extrusion Partner Co."

### Module 02 — Kraljic positioning + relationship compatibility

```
CHAIN_M02_KRALJIC {"profitImpactScore":90,"supplyRiskScore":67,"quadrant":"strategic"}
CHAIN_M02_RELCOMPAT {"severity":"high-risk","idealPosture":"partnership"}
```

Strategic quadrant (high impact + high risk) — a different quadrant from the Al-Fanar run's Bottleneck, exercising a different code path through `scoreItems()`'s threshold logic. `assessRelationshipCompatibility('strategic', 'transactional')` fired **high-risk** — Module 02's *other* named worst-case pairing (Strategic+adversarial or Strategic+transactional), distinct from the Bottleneck+adversarial case the Al-Fanar run exercised. `recommendNegotiationStrategy()` and `buildNegotiationPlan()` both produced a populated, non-null `relationshipAdjustment` warning as a result.

### Module 03 — Object Model, unconfirmed role + near-miss entity resolution

`assessSupplierRoleDataQuality()` on a `supplierRole: 'unknown'` record: `hasGap: true`.

`resolveSupplierEntity()` against a registry with one partial name/country overlap (no legal-entity-number, no exact trading-name match):

```
CHAIN_M03_RESOLUTION {"method":"near-miss-unconfirmed","confidence":"LOW",
 "candidateMatches":["existing-raep"]}
```

Correct tier-3 fallback — not auto-merged, not discarded, flagged for human confirmation, matching the module's documented "a false merge is as damaging as a false split" design.

### Module 04 — Qualification Gates

`determineDueDiligenceTier({kraljicQuadrant:'strategic', geographicRisk:4})` → **ENHANCED**.

```
CHAIN_M04_QUAL {"overallStatus":"NOT_QUALIFIED","blockingGate":"capability, compliance"}
```

Both critical-fail rules fired independently and simultaneously: `capability` — a manufacturer-level capability claim (`manufacturer_capability_claim`) attached to a supplier whose role is still unconfirmed (the exact real-world failure the module is built to catch); `compliance` — a `certificationStatus` fact reading `"AS9100 -- expired 2019, not renewed since"` matched the module's critical-fail keyword rule (`expired|revoked|suspended`).

**Disclosed, out-of-scope finding (not fixed in this task):** while authoring this scenario, an earlier draft used the phrasing `"AS9100 -- last audited 2019, not renewed"` for the same real-world condition (a lapsed, unrenewed certification). That phrasing does **not** match `hasExpiredCertification()`'s keyword set (`expired|revoked|suspended` only), so it silently fell through to the generic evidence-stage check and returned `CONDITIONAL` instead of `CRITICAL_FAIL` — a real, narrow gap: the rule does not recognize common real-world synonyms for "expired" such as "lapsed," "not renewed," or "past validity." This is genuine, verified behavior in already-shipped Module 04 (`supplierQualificationGates.ts`), not a Module 01 defect, and is disclosed here rather than silently worked around by picking friendlier wording — the test scenario itself was corrected to use language the documented rule actually catches, and this keyword-set narrowness is logged as a real backlog item for a future Module 04 revisit (expand the critical-fail keyword list to cover common lapsed-certification phrasing), not fixed inside this task, per the standing rule that genuinely out-of-scope defects get named and logged rather than folded into an unrelated module's task.

### Module 05 — Concentration

```
CHAIN_M05_METRICS {"timeToRecoverWeeks":14,"timeToSurviveWeeks":6,"shortfallWeeks":8,
 "isSurvivable":false,"lockInIndex":4.5,"intelligenceDebtUSD":44000,"hiddenConcentrationIndex":61}
CHAIN_M05_HHI {"hhi":4522,"band":"highlyConcentrated"}
```

Hand-verified: Sheffi's rule is TTS ≥ TTR → survivable. Here TTS (6 weeks) < TTR (14 weeks) → **not survivable**, shortfall = 14 − 6 = **8 weeks** — a real (non-tie) shortfall, distinct from the Al-Fanar run's exact-tie boundary case. Lock-In Index with inputs {5,5,4,4} at the default 0.25 weight each = (5+5+4+4) × 0.25 = **4.5**, above the 4.0 HIGH threshold. Portfolio HHI on a 3-supplier split (61% / 24% / 15%): 61² + 24² + 15² = 3721 + 576 + 225 = **4522**, above the 2,500 highly-concentrated threshold — matched exactly against real output. (An earlier hand-prediction of 4402 written before running the test was simple arithmetic error on this author's part, caught by the real test run itself and corrected here — disclosed per Decision Record 8.7 rather than quietly adjusted.)

### Module 06 — Commercial & Negotiation Intelligence

```
CHAIN_M06_PRICE {"direction":"up","percentChange":3.66,"maxIntraPeriodSwingPct":39.02,
 "hasIntermediateVolatility":true}
CHAIN_M06_LEVERAGE {"level":"WEAK","lockInIndex":4.5,"isSurvivable":false,
 "quadrantConsistencyNote":null}
CHAIN_M06_NEXTMOVE {"move":"match-defection"}
```

A price series with a real intra-period spike (tariff/energy-driven) again surfaced `hasIntermediateVolatility:true` under a near-flat net change — the module's own documented 9 Sep pressure-test fix holding under a fresh scenario. `assessNegotiationLeverage()` returned **WEAK** (Lock-In 4.5 ≥ 4 threshold alone is sufficient under the conjunction rule) with `quadrantConsistencyNote: null` — correctly null, because WEAK-in-Strategic is not one of the module's two named structural-mismatch cases (those are WEAK-in-Leverage and STRONG-in-Bottleneck); a silent null here is the module working as documented, not a gap. `recommendNextMove()` on a round history where the counterpart defected last exercised the **`match-defection`** tit-for-tat branch for the first time in this project's chain-testing history — the Al-Fanar run only exercised the "cooperate after our own retaliation" branch, so this is genuine new coverage of a previously-untested real branch.

### Module 07 — Performance, Development & Recovery

A fresh, deliberately different score history from the Al-Fanar run (12 periods: `85,83,82,80,79,78,77,76,74,73,72,50`), a quadrant migration (`quadrantPriorQuarter: 'leverage'` → now `strategic`), and 2 closed CARs:

```
{"trend":"declining","variability":"high","recurrenceCount":1,
 "recommendedIntervention":"COLLABORATE","combinedSignalFlag":true,
 "shockFlag":true,"shockChangePct":30.555555555555557}
```

Hand-verified: latest-period change = |50 − 72| / 72 × 100 = 22/72 × 100 = **30.56%**, above the 15% shock threshold → correctly flagged. `recurrenceCount = 1` (2 closed CARs, the latest excluded per the module's own "prior occurrences, not counting latest" rule). `combinedSignalFlag = true` because variability is `high` and recurrence ≥ 1, both genuinely met. This is real executed output from this project's own real `detectSupplier()` function, quoted directly rather than independently re-derived beyond the shock-percentage check shown above (the trend/variability/escalation classifications themselves depend on the full OLS/SPC-zone calculations already verified in Module 07's own unit suite and in the 14 Sep Al-Fanar chain run; re-deriving them by hand a second time here would not add real verification value beyond what is already on record).

## Result

**One real code defect found and fixed in Module 01** (`buildRequirementBrief()` never forwarding `freeTextCategory` into confidence assessment or the returned brief) — fixed in `supplierRequirementChallenge.ts`, re-verified against the full existing 16-test suite (unaffected, fully backward-compatible) and the new chain scenario (now correctly HIGH). **One real, narrow limitation found and disclosed in already-shipped Module 04** (the compliance critical-fail keyword list does not recognize common synonyms for "expired," such as "not renewed" or "lapsed") — not fixed in this task since it sits outside Module 01's scope, logged here as a genuine backlog item rather than silently worked around. **One arithmetic slip in this document's own draft hand-prediction** (HHI) — caught by the real test run and corrected, disclosed rather than quietly edited away.

Full `src/lib` suite: **1477/1477 passing** with the temporary chain-test file present (1474 existing + 3 new Module 01 stress-test cases), **1474/1474 passing** after its removal per standing practice (temporary chain-test files are deleted from the repo after their real output is hand-verified and written up here) — zero regressions either way. `tsc --noEmit` against the full project: zero errors.

### Bilingual correctness (EN/AR)

Module 01's `GENERIC_CHALLENGE_QUESTIONS` library ships real, grammatical Arabic for all 10 questions and rationales (not machine-garbled, not a placeholder, not the English string reused) — independently read for sense as part of this pass, e.g. `spec-vs-outcome`'s Arabic rationale renders as a genuine, idiomatic statement about specification creep excluding capable suppliers, matching its English counterpart's meaning rather than a literal transliteration. The new `freeTextCategory` disclosure this task added carries no new user-facing copy (it is a data field, not a label), so no new bilingual surface was introduced.

### QA 10/10 applicability

Module 01 has no UI/route — its own doc comment states plainly that its real consumer is Module 02, not an end user directly, and no Supplier Intelligence page exists yet to wire a UI into (same documented state as Module 07's first QA pass). Applicable dimensions: bilingual correctness (above, pass), honesty/Decision Record 8.7 (the goods-classification scope limit and the two disclosed findings above are the walkthrough's real output), edge cases (Stage 2's genuine no-match, Stage 3's two boundary passes), cross-feature interaction (the full 02→07 chain above is exactly this dimension, exercised end to end with real hand-offs). Discoverability, accessibility, and visual/tonal consistency are N/A — there is no screen yet for a user to discover, tab to, or view.

## What #436 still needs before it can be closed at full scope

Module 01 is now finished to the same bar as Modules 02–07: sourced methodology, bilingual, three-tier stress-tested, chain-tested into the full 02→07 sequence with genuinely new branch coverage, one real defect found and fixed, one real out-of-scope defect found and disclosed. Still outstanding before the full 12-module #436 chain can run: Modules 08 (Local Content/ICV), 09 (Consultancy Output & Cross-Engine Handoff), 10 (Supplier Signal Radar), and 11 (Supplier Command Center) — none yet built. Registry #436 stays open, now scoped honestly to "01→07 chain verified in full; 12-module chain blocked on four unbuilt modules."
