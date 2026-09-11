# ISC — Supplier Intelligence Scope Expansion: Sourced Design Brief
**Status as of 11 Sep 2026, written into the real ISC handover folder so this is no longer
chat-only.** Items 1 (COPQ) and 2 (RACI) are already built and pushed to `main`. This file is
the sourced reference for Items 3-7 still ahead, plus the record of what was already decided
so it doesn't need to be re-litigated.

**Decisions already made (do not re-ask):**
- Persona/consultant-roles question (2.6) — resolved as **(b) the RACI approval/permission
  model**, built on the existing organizations/users/entitlements schema, not the AI Persona
  tone layer. This is Item 2, already shipped.
- Two-tier standing rule (2.8) — approved as a permanent design rule, not scope-specific.
- Build sequence — revised to: 1) COPQ (done), 2) RACI (done), 3) Pre-Qualification + ASL,
  4) Onboarding, 5) Periodic Evaluation, 6) Second-party Audits, 7) Blacklist/Offboarding
  (last, after #668 and the `checkLatestPeriodShock` decision settle).

---

## 1. Why this scope, and where it fits

All items are real, standard supplier-lifecycle-governance capabilities that sit *upstream
and around* what's already built (SI Modules 01-07, Scorecard, CAR). They complete the
supplier lifecycle ISC already models in pieces:

`Discovery/Qualification (Module 03) → Pre-Qualification/ASL (Item 3) → Onboarding (Item 4) →
Ongoing Scorecard + Periodic Evaluation (Item 5) → Audits (Item 6) → Recovery/Remediation
(Module 07, live) → Blacklist/Offboarding (Item 7, the exit path Module 07 has no downstream for)`

This closes a real, honest gap: today a supplier can escalate through Module 07's recovery
logic indefinitely — there is no built-in "this relationship ends here" mechanism, and no
formal "this supplier is allowed to start" gate before Module 03's discovery/qualification
work even begins scoring them.

## 2. Sourced frameworks per item

### 2.1 Pre-Qualification & Approved Supplier List (ASL) — Item 3, next up
- Standard practice: a pre-qualification questionnaire (financials, quality certifications,
  references) filters candidates before deeper evaluation; approval requires a documented
  reason (audit, qualification form, certification, engineering approval, performance record,
  or commercial agreement) — not an unstated judgment call.
- ASL is not a permanent status: review frequency should scale with supplier risk, spend,
  production impact, and performance history — the same tiering logic Module 02 (Kraljic)
  and Module 05 (concentration/dependency) already compute.
- Sources: [Approved Supplier List Best Practices](https://sourceday.com/blog/approved-supplier-list/), [ASL: How To Add Suppliers in 7 Steps](https://www.greenlight.guru/blog/approved-supplier-list), [Approved Supplier Lists: Complete Guide](https://lassosupplychain.com/resources/blog/approved-supplier-lists-selection-management-technology/), [CENIT Consulting — ASL](https://cenitconsulting.com/glossary/approved-supplier-list-asl/)

**Design implication:** ASL status should be a derived field, not a manual flag — computed
from Module 03's qualification/DD gate result + a documented approval reason (using the
RACI Accountable-role assignment from Item 2), and its review cadence should reuse the same
risk-tiering already in Module 02/05 rather than a new independent schedule.

**Two tiers for this item:** Advisory = a scored qualify/don't-qualify recommendation the
client acts on. Operational = ISC persists and maintains the actual ASL register, with the
documented approver drawn from Item 2's RACI assignments.

### 2.2 Periodic Evaluation (ISO 9001 Clause 8.4.1) — Item 5
- ISO 9001 explicitly requires "criteria for selection, evaluation, and re-evaluation" to be
  established and records maintained. Re-evaluation must be periodic and performance-based;
  the standard doesn't fix a frequency, but **annual is the accepted minimum**, with
  higher-risk or lower-performing suppliers reviewed more often.
- Minimum records required: an approved-supplier register, evaluation records per supplier
  (criteria + outcome), ongoing performance-monitoring records, and records of quality issues
  raised and how they were resolved.
- Sources: [ISO 9001 Clause 8.4](https://medium.com/o-digo-disse/iso-9001-clause-8-4-what-supplier-control-actually-requires-be05facedbb6), [Advisera — How to evaluate supplier performance](https://advisera.com/9001academy/blog/2015/10/27/how-to-evaluate-supplier-performance-according-to-iso-90012015/), [Encompass — Clause 8.4 Supplier Control](https://www.encompassconsultants.com/article-posts/clause-8-4-supplier-control), [Mireaux — Effective Evaluation & Reevaluation](https://mireauxms.com/blog/effective-evaluation-reevaluation-of-suppliers-part-1/)

**Design implication:** ISC already has the Scorecard's six weighted dimensions running
continuously — periodic evaluation should be a formal cadence wrapper on top of that existing
data (e.g., "annual formal re-evaluation record" auto-drafted from the trailing 12 months of
Scorecard + CAR history), not a parallel scoring system.

**Two tiers:** Advisory = an auto-drafted re-evaluation report the client files themselves.
Operational = ISC stores the re-evaluation record and fires the next-due reminder.

### 2.3 Blacklist / Disqualification / Offboarding — Item 7, last
- Blacklisting is a formal, evidenced process, not a unilateral flag: triggering event →
  internal review with evidence → supplier notified and given a chance to respond →
  documented determination → addition to a blacklist register → periodic reinstatement
  review. Common triggers: contract breach, fraud/corruption, legal/regulatory violation.
- Offboarding (distinct from blacklisting — a supplier can be offboarded without being
  blacklisted, e.g. business need ended) needs a standardized checklist spanning procurement,
  IT, legal, finance, and risk: exit terms from the original contract (data return/destruction,
  access revocation timelines, transition support, audit rights), documented and validated
  steps, creating a defensible record of proper risk closure.
- Sources: [Trustpair — What Is a Vendor Blacklist?](https://trustpair.com/blog/what-is-a-vendor-blacklist/), [KE Leaders — Blacklisting a Vendor](https://keleaders.com/blacklisting-a-vendor-is-a-serious-step-in-supply-chain-and-contract-management/), [Graphite Connect — Vendor Offboarding Guide](https://www.graphiteconnect.com/blog/guide-to-supplier-offboarding/), [Supplier Gateway — Offboarding Best Practices](https://www.suppliergateway.com/supplier-offboarding-best-practices/), [Mitratech — Vendor Offboarding Checklist](https://mitratech.com/resource-hub/blog/vendor-offboarding-checklist/)

**Design implication:** this is the natural downstream terminus for Module 07's escalation
path. A supplier that fails repeated 8D/SCAR remediation cycles should have a *documented,
evidenced* route into either "offboard (no fault)" or "blacklist (for-cause)."

**Two tiers:** Advisory = a documented recommendation with evidenced rationale the client
acts on internally. Operational = ISC maintains the actual blacklist/offboarding register
and reinstatement-review schedule.

### 2.4 Cost of Poor Quality (COPQ) — Item 1, shipped
- Standard model: the Prevention-Appraisal-Failure (PAF) framework (ASQ quality-cost
  standard, tracing to Juran) — four categories: **Prevention** (training, process
  engineering), **Appraisal** (inspection, testing, audits), **Internal Failure** (scrap,
  rework, re-inspection before shipment), **External Failure** (warranty claims, returns,
  customer penalties, lost sales after the defect reaches the customer).
- Strategic relationship: investment in prevention reduces internal- and external-failure
  cost by a larger margin than it costs — this is the standard business case for the whole
  quality-cost discipline.
- Sources: [Autodesk — Understanding COPQ in Manufacturing](https://www.autodesk.com/blogs/design-and-manufacturing/understanding-the-cost-of-poor-quality-copq-in-manufacturing/), [Six Sigma Study Guide — COPQ](https://sixsigmastudyguide.com/cost-of-poor-quality/), [SimplerQMS — Cost of Quality](https://simplerqms.com/cost-of-quality/), [The Lean Suite — COPQ Framework](https://www.theleansuite.com/blogs/cost-of-poor-quality-calculation-reduction-framework)
- Already built (`supplierCOPQ.ts`, both tiers, 29/29 tests) — see
  `SI_Supplier_Lifecycle_Governance_Item1_COPQ_Worked_Example.md` in this same folder.

### 2.5 Audit Types — Item 6
- Three recognized categories, defined by **who** audits and **why**: First-party
  (internal); Second-party (a customer auditing its own supplier against contractual
  requirements — remains relevant even for an already-ISO-certified supplier, because it
  checks contract-specific terms beyond the general standard); Third-party (an independent
  certification body verifying compliance with a standard like ISO 9001).
- Sources: [Smithers — First/Second/Third-Party Audits](https://www.smithers.com/resources/2024/june/first-party-second-party-third-party-audits), [TÜV SÜD — Difference Between Audit Types](https://www.tuvsud.com/en-gb/resource-centre/blogs/uk/auditing-and-systems-certification-blog/difference-between-first-second-third-party-audits), [Advisera — ISO 9001 Audit Types](https://advisera.com/9001academy/blog/2015/02/24/first-second-third-party-audits-differences/), [ZenGRC — Three Types of ISO Audits](https://www.zengrc.com/blog/what-are-the-three-types-of-iso-audits/)

**Design implication:** ISC's relevant audit type is squarely **second-party** (ISC's client
auditing its own supplier). Log a second-party audit result (scope, findings, corrective
actions required) and optionally record whether the supplier also holds third-party
certification (ISO 9001 etc.) as a separate, verifiable data point — never conflate the two.

**Two tiers:** Advisory = an audit-readiness checklist and findings-write-up template.
Operational = ISC persists the audit log and corrective-action linkage back to Module 07.

### 2.6 Persona / Consultant Roles — Item 2, shipped as RACI
Resolved as the RACI approval/permission model (see decisions block above), not the AI
Persona tone layer. Already built (`supplierRACI.ts`, both tiers, 38/38 tests) — see
`SI_Supplier_Lifecycle_Governance_Item2_RACI_Worked_Example.md` in this same folder.

### 2.7 Competitive benchmark
SAP Ariba, Coupa, and Jaggaer all ship supplier qualification/onboarding as part of their
broader Supplier Information & Risk Management modules, increasingly AI-assisted. None of the
public materials found describe a COPQ-style quality-cost rollup tied directly to
corrective-action data, or a second-party-audit-vs-third-party-certification distinction
surfaced as cleanly as the design above proposes — a plausible differentiation point, stated
with appropriate hedging (absence of evidence in public marketing material is not proof of
absence in the product), per Decision Record 8.7.
Source: [Procurement Platforms 2026 overview](https://procurementtactics.com/procurement-platforms/), [Suplari — Best SIM Software 2026](https://suplari.com/blog/supplier-information-management-software/), [Jaggaer — Best Procurement Software 2026](https://www.jaggaer.com/blog/best-procurement-software-for-enterprise-2026)

## 2.8 Standing design rule: two tiers per item, always (consultancy, not operations)

ISC's role is strategic/tactical consultancy — enhancing best practice, control, governance,
and compliance — not running a client's day-to-day supplier operations. Not every client
wants a full operational workflow engine; many want advisory output they act on themselves.
Every item ships in two selectable tiers, mirroring the existing LIGHT/HEAVY value-threshold
toggle (#27) and RFx Guided/Expert toggle (#396) patterns already proven in the platform.
This is a **general design rule going forward**, not scope-specific to these seven items:

- **Advisory tier (default, lighter):** ISC produces the assessment, the recommendation, the
  documented rationale, and a ready-to-use template/checklist — the client executes the
  action in their own systems. No client data is required to persist beyond what's already
  in the Scorecard/CAR/Module data.
- **Operational tier (opt-in, deeper):** ISC persists the workflow state itself (append-only
  ledger tables, never whole-state overwrite — see Items 1-2's `copq_ledger` and
  `raci_assignment_events` pattern) and tracks it over time, as the client's system of record.

Both tiers must share the same underlying computation/scoring logic, differing only in what
gets persisted and enforced — this is what lets the platform scale from a light SMB client to
a complex enterprise client under real concurrency and pressure without two separate
codebases.

## 3. Build sequence (confirmed)

1. ~~COPQ rollup on existing CAR data~~ — **done, pushed.**
2. ~~RACI approval/permission model~~ — **done, pushed. Invite/join-organization flow is a
   known, disclosed prerequisite before multi-person Consulted/Informed can be exercised —
   see registry #440.**
3. **Pre-Qualification + ASL** — next. Extends Module 03's existing qualification/DD gate;
   uses Item 2's RACI Accountable role for the documented approver.
4. Onboarding checklist — the natural next step after ASL approval.
5. Periodic Evaluation cadence wrapper.
6. Second-party Audit logging.
7. Blacklist/Offboarding — last, after #668 and the `checkLatestPeriodShock` decision settle.

## 4. Standing discipline for every remaining item
Sourced methodology only (citations above are the floor, extend as needed — never freehand).
Rawabi worked example per item, covering both tiers. Three-tier stress test (soft/hardest/
boundary). Bilingual EN/AR from the start, not a follow-on pass. QA 10/10 before calling
anything done. Honest disclosure of any gap found. Log every commit in the Site Map before
moving to the next item — do not let registry hygiene drift, per the reconciliation-audit
finding from tonight's CI-gate detour.
