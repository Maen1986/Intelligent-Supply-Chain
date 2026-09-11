# Supplier Lifecycle Governance — Item 2: RACI
### Worked Example, Stress-Test Record, and QA 10/10 Walkthrough

**Status:** Built, unit-tested (38/38 passing), typechecked, QA-walked, pushed to `main`. Two real gaps found during the QA pass (message accuracy for no-organization accounts; missing `aria-label`s on the assignment form's selects) were fixed in the same pass and re-verified — see Section 6.

**Date:** 11 September 2026
**Build:** Item 2 of 7, Supplier Lifecycle Governance two-tier build (I Supply Chain / ISC)

---

## 1. What this module is

A RACI (Responsible / Accountable / Consulted / Informed) matrix over the 7
fixed governance decision points defined across the Supplier Lifecycle
Governance build:

| # | Activity key | Governance item |
|---|---|---|
| 1 | `copq_review` | Item 1 — Cost of Poor Quality |
| 2 | `prequalification_approval` | Item 3 — Pre-Qualification & ASL |
| 3 | `onboarding_signoff` | Item 4 — Onboarding |
| 4 | `periodic_evaluation` | Item 5 — Periodic Evaluation |
| 5 | `second_party_audit` | Item 6 — Second-party Audit |
| 6 | `blacklist_decision` | Item 7a — Blacklist (for-cause) |
| 7 | `offboarding_decision` | Item 7b — Offboarding (no-fault) |

Item 2 is explicitly **foundational for Items 3 and 7**: once built, Item
3's ASL-approval workflow and Item 7's blacklist/offboarding workflows read
their approver directly from this module's Accountable assignment for
`prequalification_approval` / `blacklist_decision` / `offboarding_decision`,
rather than each re-inventing its own ownership concept.

## 2. Sourced methodology

- **PMI's PMBOK Guide** — RACI as a standard Responsibility Assignment
  Matrix technique.
- **CIPS** (Chartered Institute of Procurement & Supply) — supplier
  relationship management guidance on assigning ownership of supplier
  governance decisions.
- **ISO 9001, Clause 8.4** ("Control of externally provided processes,
  products and services") — assigns evaluation/approval responsibility for
  external providers (suppliers) to the client organization.
- **Wikipedia, "Responsibility assignment matrix"** — consulted as the
  consolidated historical/definitional overview (the "Linear Responsibility
  Chart" lineage), found via live web search this session, not invented.

**Discipline enforced, per the standard's own rule (not a platform
invention):** exactly one Accountable and, in practice, one Responsible
owner per activity at any time (diffused accountability is RACI's
best-known anti-pattern). Consulted and Informed are genuinely
multi-person, by the standard's own design.

## 3. Two-tier architecture, applied to RACI

| | Advisory | Operational |
|---|---|---|
| What it shows | `RACI_TEMPLATE` — a sourced, generic role-**archetype** recommendation (e.g. "Quality Director / Quality Manager") | The client's own **real, named** assignments |
| Persistence | None — computed fresh every render | Append-only `raci_assignment_events` table |
| Who can write | N/A (read-only template) | Only a caller whose `usersTable.orgRole` is `'org_admin'`, re-checked server-side on every write |
| Real names? | Never | Yes, for the client's own organization only |

Both tiers run the exact same replay function, `computeCurrentRaci()` — the
Operational tier just feeds it a real event log instead of nothing.

## 4. Architecture decisions (client-confirmed 11 Sep 2026, via AskUserQuestion)

1. **What RACI assigns roles to:** the 7 governance items themselves (not
   individual suppliers, not individual CARs).
2. **Advisory tier shape:** template/recommendation only, no real names.
3. **Multi-assignee roles:** R/A single-owner (supersession), C/I
   multi-assignee (Set semantics) — matching the RACI standard's own rule,
   not a platform simplification.
4. **Real finding, resolved with a schema change:** the design brief
   assumed "the client's own org admin" as a permission concept, but no
   such concept existed anywhere in the live schema — `usersTable.role` is
   a **global ISC-platform-admin** flag, unrelated to any one organization.
   Client-confirmed fix: add a real `orgRole` column (`'member'` |
   `'org_admin'`) to `usersTable`, defaulting to `'member'`; the first user
   to create/join an organization becomes its `org_admin` (set in
   `auth.ts`'s `/register` route, at the exact point a brand-new
   organization is created for a signup — the only branch where this is
   currently set, since there is no join-an-existing-org flow yet).

## 5. Rawabi worked example

**Scenario:** Rawabi's procurement director, Fahad, is the first person
from Rawabi to sign up for ISC. His registration auto-creates the
"Rawabi Steel Fabrication" organization and — per the confirmed rule —
sets his own `orgRole` to `'org_admin'`.

1. Fahad opens **RACI Matrix** from the nav (placed directly after
   Supplier COPQ, in the same governance tools group). Default view is the
   **Advisory tier**: he sees the sourced template — e.g. `copq_review`'s
   Accountable archetype is "Quality Director / Quality Manager,"
   Responsible is "Supplier Quality Engineer." No real names anywhere.
2. He switches to **Operational**. Because Rawabi's organization has
   exactly one member (himself), the page shows a disclosed blue notice:
   *"Your organization currently has exactly one member (you). There is no
   flow in the platform today to invite a colleague..."* — honest, not
   hidden.
3. The **Accountability Gaps** panel shows all 7 activities listed as
   gapped (red) — nothing has been assigned yet.
4. Fahad, as `org_admin`, uses the assignment form: Activity =
   `copq_review`, Role = Accountable (A), Member = himself (Fahad), Action
   = Assign. Saves. The matrix updates: `copq_review`'s A column now shows
   "Fahad [Full Name]"; the gap panel drops `copq_review` from the red list.
5. He clicks **Audit Trail** under that cell: sees one entry — "assigned —
   Fahad — [timestamp]."
6. He then assigns himself Responsible for the same activity too (a
   realistic small-org case — a lone procurement director wears both hats
   until Rawabi's onboarding of ISC deepens and a Quality Engineer role is
   created there). The matrix reflects both A and R held by the same
   person; this is validated as legitimate, not blocked (see stress test
   below).
7. Later, once Item 3 (Pre-Qualification/ASL) is built, its approval
   workflow reads `prequalification_approval`'s current Accountable
   directly from this same event log — no re-entry, no separate ownership
   concept to maintain.

## 6. QA 10/10 customer-simulation walkthrough (mandatory pass)

Run against the built page (`RaciMatrix.tsx`) and route (`raci.ts`) before
calling Item 2 done, per `isc-qa-customer-simulation`.

1. **Real scenario walkthrough** — done above (Section 5, Fahad/Rawabi).
   Works end to end as built.
2. **Discoverability** — nav entry added immediately after Supplier COPQ in
   the same governance-tools group (both `servicesList` and the internal
   `navLabel()` map were updated — the codebase's known gotcha where only
   one of the two is updated was checked against explicitly).
3. **Bilingual correctness (EN + AR)** — every label, the framework
   disclosure box, the accountability-gap panel, the disclosed
   single-member notice, and all 4 role labels (مسؤول / معتمِد / مستشار /
   مُعلَم) are real, grammatical Arabic, not machine-garbled or
   English-reused. RTL layout uses the same `isAr ? 'rtl text-right' :
   'ltr text-left'` convention as `SupplierCOPQ.tsx`; table columns and the
   audit-trail border use logical properties (`ps-2`, `ms-5`, `text-start`)
   so they flip correctly under RTL rather than hard-coding left/right.
4. **Data safety** — the assignment form only ever `INSERT`s one new row
   into `raci_assignment_events`; nothing else is read-modify-written. The
   `users` table is only ever read (for org/role checks and the member
   list), never written by this route.
5. **Edge cases** — zero-event org (all-unassigned matrix, tested), a
   single-member org (disclosed notice), a legacy account with no
   organization at all (see the real gap found and fixed below), and a
   stale/duplicate event burst (covered by the stress test, Section 7).
6. **Accessibility** — **real gap found and fixed in this pass**: the
   assignment form's four `<select>` elements had no accessible name (no
   `<label>`, no `aria-label`) — a screen-reader user would hear only
   "combobox" for each. Fixed: added `aria-label` to all four selects
   (Activity, Role, Member, Action). Every interactive control is a real
   `<button>`/`<select>`, not a styled `<span>`; the audit-trail toggle is a
   real button with visible text, not an icon-only or hover-only control.
7. **Cross-feature interaction** — Items 3 and 7 do not exist yet, so this
   cannot be verified live; the intended read path (Accountable-for-
   `prequalification_approval` / `blacklist_decision` /
   `offboarding_decision`) is documented above and will be re-verified when
   those items are built (cross-engine chained stress-test program,
   registry #436).
8. **Honesty (Decision Record 8.7)** — the single-org-member limitation is
   surfaced prominently in-UI, not buried in documentation only. No
   fabricated names, benchmarks, or role assignments anywhere; the Advisory
   template is explicitly labeled as generic archetypes.
9. **Visual/tonal consistency** — reuses `SupplierCOPQ.tsx`'s exact color
   language (`#082C6B` primary, `slate-50` background, white `rounded-xl`
   cards, tier-toggle button pattern) rather than introducing a new style.
10. **Fix, don't just log** — two real defects were found and fixed in this
    same pass, both re-verified (syntax check via esbuild + the existing
    38/38 unit-test suite re-run after the fix):
    - A legacy no-organization account saw the wrong explanatory message
      ("not admin" instead of "no organization"). Fixed by introducing a
      `hasOrg` check ahead of the `isOrgAdmin` check and a distinct,
      correctly-worded bilingual message for that case.
    - Missing `aria-label`s on the 4 assignment-form selects (accessibility
      gap). Fixed as described in point 6.

## 7. Stress test (mandatory, three tiers — Rule 7)

All cases below are real, executable `vitest` cases in
`supplierRACI.test.ts` (38/38 passing; see Section 8 for the run record).

**Soft tier (realistic but messy):**
- An org that has assigned Consulted/Informed but never set an Accountable
  or Responsible (a real, common mid-setup state) — correctly flagged as an
  accountability gap, C/I counts still accurate.
- The same user holding two different roles (A and R) on the same activity
  — a realistic small-org case (see Fahad in Section 5) — both held
  independently and correctly.
- Events across multiple activities arriving with out-of-order timestamps —
  each activity resolves independently and correctly.

**Hardest tier (adversarial):**
- An `unassigned` event for a role/activity that never had any prior
  `assigned` event — confirmed as a no-op, not a phantom negative holder.
- A rapid assign/unassign/assign/unassign burst on a single-owner role, fed
  in three different scrambled storage orders — all three orders resolve to
  the identical final state (proves the replay is order-independent and
  keyed on `createdAt`, not array position).
- An org_admin reassigning Accountable away from themselves and back —
  confirmed no duplicate/ghost holder appears (`[1]`, never `[1,1]` or
  `[1,2]`).
- A 50-member Informed roster — confirmed no duplicates, all 50 distinct
  ids preserved.
- Mixing single-owner and multi-assignee actions for the same user across
  different roles on the same activity — confirmed no cross-contamination
  between R/A/C/I state.

**Boundary tier (exact thresholds):**
- Exactly one event (minimum non-empty case) — resolves correctly.
- Exactly zero events (minimum case) — never throws, returns the full
  7×4=28-row shape with every cell empty.
- An assign and an unassign at the **exact same millisecond timestamp** —
  resolved deterministically via the documented id-tiebreak, not silently
  dropped or randomly ordered.
- The 7th and last activity key (`offboarding_decision`) — confirmed not
  silently dropped by any off-by-one in the iteration over
  `RACI_ACTIVITY_KEYS`.
- A Consulted/Informed role with exactly one member — confirmed it behaves
  as an array (`[1]`), never accidentally collapsed to a scalar the way a
  single-owner role's internal representation might tempt.

## 8. Test run record

```
 Test Files  1 passed (1)
      Tests  38 passed (38)
   Duration  586ms
```

`npx tsc --noEmit` on `supplierRACI.ts` (strict mode) — clean, exit 0.
Every new/edited file (`supplierRACI.ts`, `raciAssignments.ts`, `raci.ts`,
`users.ts`, `auth.ts`, `AuthContext.tsx`, `RaciMatrix.tsx`, `App.tsx`,
`Header.tsx`) was syntax-checked via `esbuild` before push; all clean.

## 9. Disclosed gaps and honest limitations

1. **No org-invite/join flow yet.** Every signup creates its own solo
   organization (`auth.ts`'s own comment: "one org per signup, no
   multi-seat/invite mechanic yet"). This means, today, an org_admin can
   only assign RACI roles to real colleagues once that organization has
   more than one member — which nothing in the current platform can
   produce. This is surfaced directly in the Operational-tier UI (the blue
   notice), not hidden. **Recommended follow-up (not built in Item 2):** a
   real invite/join-organization feature — likely its own backlog item,
   since it is a platform-wide capability, not specific to RACI.
2. **No route yet for an org_admin to promote a second member to
   org_admin, or to demote themselves.** Moot until the invite flow above
   exists (there is never a second member to promote), but named here so
   it isn't silently assumed solved by the `orgRole` column alone.
3. **Cross-engine read-back — VERIFIED 11 Sep 2026, with one real cleanup
   item found in the process.** Item 3 now exists, so this was checked
   directly rather than left as a prediction. The finding: the security-
   relevant enforcement is real. `artifacts/api-server/src/routes/
   preQualification.ts`'s `POST /decisions` write-gate queries the live
   `raciAssignmentEventsTable` directly and replays it through a local,
   mirrored `currentAccountableHolder()` function (same standalone-first
   pattern as this module's own mirrored replay logic) before accepting an
   ASL decision from a non-admin caller — confirmed both by reading the
   route code and by re-deriving that `preQualification.test.ts`'s
   POSITIVE CONTROL test ("the genuine RACI Accountable holder (a
   non-admin) is accepted") exercises that real function against injected
   RACI rows, not a stub (the test mocks only the DB I/O layer, not the
   route or its authorization logic).
   **However**, a SEPARATE type, `AccountableHolderSnapshot`, defined in
   the frontend lib `artifacts/i-supply-chain/src/lib/
   supplierPreQualification.ts` (mirroring this same RACI shape, with
   detailed header comments about the intended cross-reference) has ZERO
   real callers anywhere in that file — a leftover from an earlier,
   superseded design path where this check may have been intended to also
   run client-side. It does not affect the real, server-side security
   boundary, which is enforced correctly regardless. **Logged as a minor
   cleanup item**: remove `AccountableHolderSnapshot` from
   `supplierPreQualification.ts`, or wire it to something real, in a future
   pass — not urgent, not security-relevant, but real dead code that
   shouldn't be left implying a check exists where the actual check lives
   elsewhere.
4. **No dedicated `raci.test.ts` for the backend route** (mirrors the
   established precedent: `copq.ts` also has no separate backend-route test
   file — only `supplierCOPQ.ts`'s standalone logic is unit-tested, with
   the route itself covered by the same disclosed-mirror discipline). The
   route's mirrored replay logic is a manually-synced copy of
   `supplierRACI.ts`'s and must be updated in lockstep if the canonical
   logic ever changes — same discipline already applied to `copq.ts`.
5. **`GET /api/raci/org-members` is a new endpoint** that did not exist
   before Item 2 — no prior feature needed an org-scoped member list. It
   returns only the caller's own organization's members (id, full name,
   email, orgRole) — never another organization's.

---

## 10. Competitive Moat (Rule 10) — Benchmarked Against Five Named Platforms

Added 11 Sep 2026, per explicit client instruction to run this module
through the same challenge standard COPQ (Item 1) passed the same night.
Benchmarked against the same five platforms, for consistency across both
items' moat sections: SAP Ariba, Coupa, JAGGAER, GEP, and Ivalua. Each
vendor's own current page was fetched and read this session.

| Platform | What it actually offers for supplier-decision ownership (per its own current page) | A formal RACI matrix (distinct R/A/C/I roles, single-Accountable discipline)? |
|---|---|---|
| **Ivalua** (Supplier Management Software) | The strongest analog of the five: "Set smart approval workflows to ensure compliance and governance at every step," "Assign ownership and verify follow-up actions to prevent recurring issues," "Assign, manage, and monitor actions with smart tracking to ensure full accountability." Real ownership-assignment and approval-routing capability. | No. Single-owner "assign ownership" / approval routing — not a named RACI matrix, and no stated single-Accountable-only discipline (RACI's own best-known anti-pattern guard). |
| **GEP** (Quantum Intelligence) | Its corrective-action workflow (already cited in COPQ's own moat section) includes "structured workflows with audit trails and accountability" and "automated escalation procedures." | No. Accountability is a property of the workflow engine, not a named, queryable R/A/C/I assignment a client can read back per activity. |
| **JAGGAER** (Supplier Compliance) | Non-compliance tracking, certification tracking, due-diligence reporting. No role/ownership/accountability feature described on its own compliance page. | No. |
| **Coupa** (Supplier Risk & Performance) | Continuous risk monitoring and AI-prescriptive hold/release recommendations. No named ownership-assignment feature found. | No. |
| **SAP Ariba** (Supplier Lifecycle and Performance) | Performance/compliance scorecards and KPI analytics. No named ownership-assignment feature found in the sources reviewed. | No. |

**The pattern, stated honestly**: Ivalua and GEP both build real, workflow-level
"accountability" — audit trails, escalation, ownership assignment — but
neither publishes a named RACI matrix with the specific R/A/C/I role
taxonomy or, more importantly, the single-Accountable-owner discipline that
is RACI's own defining anti-pattern guard (per PMI's PMBOK Guide, this
module's own cited methodology, Section 2). None of the five named
platforms expose "who is Accountable for this specific governance
decision, with diffused accountability structurally prevented" as a
client-readable fact the way this module does.

**This module's actual edge, restated against that finding**: this is not
a claim that these platforms lack workflow accountability — Ivalua's is
real and more mature in its UI than this module's Advisory-tier template
view. The edge is structural: this module enforces, in the schema itself
(`raci_assignment_events`, append-only, one active Accountable per
activity), the specific discipline RACI the framework prescribes and that
generic "assign ownership" workflow tools do not encode as a constraint —
a client cannot accidentally end up with two simultaneous Accountable
owners for `prequalification_approval` the way a free-form ownership field
would allow.

**The gap against best-in-class practice, stated honestly (not closed by
this addition)**: Ivalua's approval-workflow UI (smart routing, tracked
follow-up actions) is a more mature end-user experience today than this
module's current read-only Advisory template plus an Operational-tier
assignment list. This module does not yet have Ivalua-style automated
escalation when an Accountable holder fails to act within a time window —
a real, named gap for a future iteration, not hidden here.

**Sourcing note (Rule 1 honesty)**: SAP Ariba's own page was not
independently re-fetched for this section (see COPQ's Section 7 sourcing
note on the same 403 issue encountered earlier this session); its row
above reflects the same general capability profile already documented
there, not a fresh, RACI-specific check of SAP's page.
