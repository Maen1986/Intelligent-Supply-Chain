/**
 * Supplier Lifecycle Governance RACI — Item 2 of the Supplier Lifecycle
 * Governance two-tier build (11 Sep 2026).
 *
 * ============================================================================
 * SOURCED METHODOLOGY (Decision Record 8.7, Rule 2 — never an invented rule
 * dressed up as a standard)
 * ============================================================================
 * Standard model: RACI (Responsible / Accountable / Consulted / Informed), a
 * Responsibility Assignment Matrix documented in the Project Management
 * Institute's PMBOK Guide and widely used in procurement/SRM governance
 * practice (CIPS). Historical lineage: the "Linear Responsibility Chart"
 * tradition — see the Wikipedia entry "Responsibility assignment matrix"
 * (https://en.wikipedia.org/wiki/Responsibility_assignment_matrix) for the
 * consolidated definitional/historical overview this module leans on.
 * Discipline enforced here, per the standard's own core rule (not a platform
 * invention): exactly ONE Accountable and, in practice, one Responsible
 * owner per activity at any time — diffused accountability is RACI's
 * best-known anti-pattern. Consulted and Informed are genuinely
 * multi-person by the standard's own design (two-way vs. one-way
 * communication with stakeholders who are not the owner).
 *
 * ============================================================================
 * WHAT THIS MODULE ASSIGNS ROLES TO
 * ============================================================================
 * A fixed set of 7 named activities, one per governance decision point in
 * the Supplier Lifecycle Governance build (client-confirmed 11 Sep 2026):
 * COPQ Review (Item 1), Pre-Qualification/ASL Approval (Item 3), Onboarding
 * Sign-off (Item 4), Periodic Evaluation (Item 5), Second-party Audit
 * (Item 6), Blacklist Decision and Offboarding Decision (Item 7 — kept as
 * two distinct activities per the standing rule that blacklist, for-cause,
 * is architecturally distinct from offboarding, no-fault). This is what
 * makes Item 2 "foundational for Items 3 and 7": Item 3's ASL approver is
 * whoever this module says is Accountable for 'prequalification_approval';
 * Item 7's blacklist/offboarding approvers are read the same way.
 *
 * ============================================================================
 * TWO-TIER STANDING RULE, APPLIED TO RACI SPECIFICALLY (client-confirmed
 * 11 Sep 2026)
 * ============================================================================
 *   - Advisory tier: RACI_TEMPLATE below — a sourced, generic recommendation
 *     of which ROLE ARCHETYPE (e.g. "Quality Director", "Category Manager")
 *     typically owns each activity, per standard procurement/SRM governance
 *     practice (CIPS supplier relationship management guidance; ISO 9001
 *     Clause 8.4, "Control of externally provided processes, products and
 *     services", which assigns evaluation/approval responsibility to the
 *     client organization). NO real names, NO persistence — a template the
 *     client maps onto their own org chart themselves.
 *   - Operational tier: the client's own org admin assigns REAL named users
 *     (from their own organization) to each role for each activity. Persisted
 *     as an append-only event log (see raciAssignments.ts's schema header for
 *     why) — every assignment/unassignment is a new row, so who was
 *     Accountable for Blacklist Decisions on any past date is always
 *     reconstructable, not just the current holder.
 * Both tiers are informed by the SAME activity list and role discipline
 * below. The Advisory tier's template rows are never silently presented as
 * if they were the client's actual assignment.
 *
 * ============================================================================
 * STANDALONE-FIRST (Rule 3)
 * ============================================================================
 * This file has no runtime import from the DB schema, Express, or any
 * sibling module. It operates purely on caller-supplied plain data: a list
 * of assignment EVENTS (assign/unassign) and, where relevant, a list of org
 * members supplied by the caller. Every fact about who is currently
 * Accountable for what is DERIVED here by replaying events — never stored
 * as a separately-maintained "current state" that could drift from the
 * event log itself.
 */

// ---------------------------------------------------------------------------
// Section 0 — the 7 fixed activities
// ---------------------------------------------------------------------------

export type RaciRole = 'R' | 'A' | 'C' | 'I';

export const RACI_ROLES: RaciRole[] = ['R', 'A', 'C', 'I'];

/** R and A are single-owner by RACI's own discipline; C and I are
 * multi-assignee by the standard's own design (client-confirmed 11 Sep 2026,
 * matching the standard's own rule rather than a platform simplification). */
export function isSingleOwnerRole(role: RaciRole): boolean {
  return role === 'R' || role === 'A';
}

export type RaciActivityKey =
  | 'copq_review'
  | 'prequalification_approval'
  | 'onboarding_signoff'
  | 'periodic_evaluation'
  | 'second_party_audit'
  | 'blacklist_decision'
  | 'offboarding_decision';

export const RACI_ACTIVITY_KEYS: RaciActivityKey[] = [
  'copq_review',
  'prequalification_approval',
  'onboarding_signoff',
  'periodic_evaluation',
  'second_party_audit',
  'blacklist_decision',
  'offboarding_decision',
];

export interface RaciActivityMeta {
  key: RaciActivityKey;
  labelEn: string;
  labelAr: string;
  governanceItemEn: string;
  governanceItemAr: string;
}

export const RACI_ACTIVITIES: RaciActivityMeta[] = [
  { key: 'copq_review', labelEn: 'COPQ Review', labelAr: 'مراجعة تكلفة الجودة الرديئة (COPQ)', governanceItemEn: 'Item 1 — Cost of Poor Quality', governanceItemAr: 'البند 1 — تكلفة الجودة الرديئة' },
  { key: 'prequalification_approval', labelEn: 'Pre-Qualification / ASL Approval', labelAr: 'اعتماد التأهيل المسبق / القائمة المعتمدة', governanceItemEn: 'Item 3 — Pre-Qualification & ASL', governanceItemAr: 'البند 3 — التأهيل المسبق والقائمة المعتمدة' },
  { key: 'onboarding_signoff', labelEn: 'Onboarding Sign-off', labelAr: 'اعتماد التهيئة والإدماج', governanceItemEn: 'Item 4 — Onboarding', governanceItemAr: 'البند 4 — التهيئة والإدماج' },
  { key: 'periodic_evaluation', labelEn: 'Periodic Evaluation', labelAr: 'التقييم الدوري', governanceItemEn: 'Item 5 — Periodic Evaluation', governanceItemAr: 'البند 5 — التقييم الدوري' },
  { key: 'second_party_audit', labelEn: 'Second-party Audit', labelAr: 'تدقيق الطرف الثاني', governanceItemEn: 'Item 6 — Second-party Audit', governanceItemAr: 'البند 6 — تدقيق الطرف الثاني' },
  { key: 'blacklist_decision', labelEn: 'Blacklist Decision (for-cause)', labelAr: 'قرار الإدراج بالقائمة السوداء (لسبب موجب)', governanceItemEn: 'Item 7a — Blacklist', governanceItemAr: 'البند 7أ — القائمة السوداء' },
  { key: 'offboarding_decision', labelEn: 'Offboarding Decision (no-fault)', labelAr: 'قرار إنهاء التعامل (بلا مخالفة)', governanceItemEn: 'Item 7b — Offboarding', governanceItemAr: 'البند 7ب — إنهاء التعامل' },
];

// ---------------------------------------------------------------------------
// Section 1 — Advisory tier: sourced role-archetype template (no real names)
// ---------------------------------------------------------------------------

export interface RaciTemplateRow {
  activityKey: RaciActivityKey;
  accountableArchetypeEn: string;
  accountableArchetypeAr: string;
  responsibleArchetypeEn: string;
  responsibleArchetypeAr: string;
  consultedArchetypesEn: string[];
  consultedArchetypesAr: string[];
  informedArchetypesEn: string[];
  informedArchetypesAr: string[];
}

/**
 * Generic role-archetype recommendations, not client-specific data — every
 * row is caller-overridable and none of it is presented as the client's
 * actual assignment (Decision Record 8.7). Grounded in standard procurement/
 * SRM organizational practice (CIPS supplier relationship management
 * guidance; ISO 9001 Clause 8.4 assigning evaluation/approval responsibility
 * to the client organization) rather than invented role names.
 */
export const RACI_TEMPLATE: RaciTemplateRow[] = [
  {
    activityKey: 'copq_review',
    accountableArchetypeEn: 'Quality Director / Quality Manager',
    accountableArchetypeAr: 'مدير الجودة',
    responsibleArchetypeEn: 'Supplier Quality Engineer',
    responsibleArchetypeAr: 'مهندس جودة الموردين',
    consultedArchetypesEn: ['Finance (cost data)', 'Category Manager'],
    consultedArchetypesAr: ['المالية (بيانات التكلفة)', 'مدير الفئة الشرائية'],
    informedArchetypesEn: ['Executive Leadership'],
    informedArchetypesAr: ['الإدارة التنفيذية'],
  },
  {
    activityKey: 'prequalification_approval',
    accountableArchetypeEn: 'Procurement Director / CPO',
    accountableArchetypeAr: 'مدير المشتريات / كبير مسؤولي المشتريات',
    responsibleArchetypeEn: 'Category Manager / Sourcing Lead',
    responsibleArchetypeAr: 'مدير الفئة الشرائية / قائد التوريد',
    consultedArchetypesEn: ['Quality', 'Legal / Compliance', 'Finance'],
    consultedArchetypesAr: ['الجودة', 'الشؤون القانونية / الامتثال', 'المالية'],
    informedArchetypesEn: ['Requesting business unit'],
    informedArchetypesAr: ['وحدة الأعمال الطالبة'],
  },
  {
    activityKey: 'onboarding_signoff',
    accountableArchetypeEn: 'Supplier Relationship Manager',
    accountableArchetypeAr: 'مدير علاقات الموردين',
    responsibleArchetypeEn: 'Supplier Onboarding Coordinator',
    responsibleArchetypeAr: 'منسّق تهيئة الموردين',
    consultedArchetypesEn: ['Quality', 'IT / Master Data', 'Finance (payment terms)'],
    consultedArchetypesAr: ['الجودة', 'تقنية المعلومات / البيانات الرئيسية', 'المالية (شروط الدفع)'],
    informedArchetypesEn: ['Category Manager'],
    informedArchetypesAr: ['مدير الفئة الشرائية'],
  },
  {
    activityKey: 'periodic_evaluation',
    accountableArchetypeEn: 'Supplier Relationship Manager / Category Manager',
    accountableArchetypeAr: 'مدير علاقات الموردين / مدير الفئة الشرائية',
    responsibleArchetypeEn: 'Supplier Performance Analyst',
    responsibleArchetypeAr: 'محلل أداء الموردين',
    consultedArchetypesEn: ['Operations', 'Finance'],
    consultedArchetypesAr: ['العمليات', 'المالية'],
    informedArchetypesEn: ['Executive Leadership', 'The supplier itself'],
    informedArchetypesAr: ['الإدارة التنفيذية', 'المورد نفسه'],
  },
  {
    activityKey: 'second_party_audit',
    accountableArchetypeEn: 'Quality Director',
    accountableArchetypeAr: 'مدير الجودة',
    responsibleArchetypeEn: 'Lead Auditor (internal or contracted)',
    responsibleArchetypeAr: 'رئيس فريق التدقيق (داخلي أو متعاقد)',
    consultedArchetypesEn: ['Legal / Compliance', 'Category Manager'],
    consultedArchetypesAr: ['الشؤون القانونية / الامتثال', 'مدير الفئة الشرائية'],
    informedArchetypesEn: ['Executive Leadership', 'The supplier itself'],
    informedArchetypesAr: ['الإدارة التنفيذية', 'المورد نفسه'],
  },
  {
    activityKey: 'blacklist_decision',
    accountableArchetypeEn: 'Procurement Director / CPO (or Executive Committee for high-risk cases)',
    accountableArchetypeAr: 'مدير المشتريات / كبير مسؤولي المشتريات (أو اللجنة التنفيذية للحالات عالية الخطورة)',
    responsibleArchetypeEn: 'Category Manager / Supplier Risk Lead',
    responsibleArchetypeAr: 'مدير الفئة الشرائية / قائد مخاطر الموردين',
    consultedArchetypesEn: ['Legal / Compliance', 'Quality'],
    consultedArchetypesAr: ['الشؤون القانونية / الامتثال', 'الجودة'],
    informedArchetypesEn: ['Finance (accounts payable)', 'Affected business units'],
    informedArchetypesAr: ['المالية (الذمم الدائنة)', 'وحدات الأعمال المتأثرة'],
  },
  {
    activityKey: 'offboarding_decision',
    accountableArchetypeEn: 'Procurement Director / Category Manager',
    accountableArchetypeAr: 'مدير المشتريات / مدير الفئة الشرائية',
    responsibleArchetypeEn: 'Supplier Relationship Manager',
    responsibleArchetypeAr: 'مدير علاقات الموردين',
    consultedArchetypesEn: ['Finance (final settlement)', 'Legal (contract closeout)', 'Quality'],
    consultedArchetypesAr: ['المالية (التسوية النهائية)', 'الشؤون القانونية (إغلاق العقد)', 'الجودة'],
    informedArchetypesEn: ['Operations', 'Affected business units'],
    informedArchetypesAr: ['العمليات', 'وحدات الأعمال المتأثرة'],
  },
];

export function getTemplateRow(activityKey: RaciActivityKey): RaciTemplateRow {
  const row = RACI_TEMPLATE.find((r) => r.activityKey === activityKey);
  if (!row) throw new Error(`No RACI template row for activity ${activityKey}`);
  return row;
}

// ---------------------------------------------------------------------------
// Section 2 — Operational tier: append-only event replay (real named users)
// ---------------------------------------------------------------------------

export type RaciEventAction = 'assigned' | 'unassigned';

export interface RaciAssignmentEvent {
  id: number | string;
  activityKey: RaciActivityKey;
  role: RaciRole;
  userId: number;
  action: RaciEventAction;
  assignedByUserId: number;
  createdAt: string; // ISO 8601
}

export interface RaciCurrentAssignment {
  activityKey: RaciActivityKey;
  role: RaciRole;
  userIds: number[]; // 0 or 1 for R/A; 0..n for C/I
}

function sortEventsChronologically(events: RaciAssignmentEvent[]): RaciAssignmentEvent[] {
  // Stable sort by createdAt, then by id as a deterministic tiebreak for two
  // events sharing the exact same timestamp (real possibility with
  // millisecond-coarse clocks under concurrent writes) — never relies on
  // input array order alone.
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Replays the full event log into current-state assignments. Never trusts
 * a separately-stored "current" flag — the event log IS the source of
 * truth, by design (append-only, per raciAssignments.ts's schema header).
 *
 * R/A discipline: an 'assigned' event for a single-owner role REPLACES
 * whoever held it before (RACI's own single-owner rule, not a platform
 * invention) — this is a real supersession, not a merge. An 'unassigned'
 * event only has effect if it targets the CURRENT holder; a stale
 * unassign for someone already superseded is a documented no-op, not an
 * error (guards against a race between two admins acting concurrently).
 *
 * C/I discipline: 'assigned' adds to a set; 'unassigned' removes from it.
 * Multiple simultaneous holders are valid and expected.
 */
export function computeCurrentRaci(events: RaciAssignmentEvent[]): RaciCurrentAssignment[] {
  const ordered = sortEventsChronologically(events);
  const state = new Map<string, number[]>(); // key: `${activityKey}::${role}` -> ordered userIds

  for (const ev of ordered) {
    const key = `${ev.activityKey}::${ev.role}`;
    const current = state.get(key) ?? [];

    if (isSingleOwnerRole(ev.role)) {
      if (ev.action === 'assigned') {
        state.set(key, [ev.userId]); // supersedes
      } else {
        // unassign is a no-op unless it targets the current sole holder
        if (current[0] === ev.userId) state.set(key, []);
      }
    } else {
      if (ev.action === 'assigned') {
        if (!current.includes(ev.userId)) state.set(key, [...current, ev.userId]);
      } else {
        state.set(key, current.filter((u) => u !== ev.userId));
      }
    }
  }

  const results: RaciCurrentAssignment[] = [];
  for (const activityKey of RACI_ACTIVITY_KEYS) {
    for (const role of RACI_ROLES) {
      const key = `${activityKey}::${role}`;
      results.push({ activityKey, role, userIds: state.get(key) ?? [] });
    }
  }
  return results;
}

/** Full audit trail for one activity+role, oldest first — the "who held
 * Accountable for Blacklist Decisions, and when" reconstruction Items 3/7
 * and any future dispute/audit need, not just the current holder. */
export function computeRoleHistory(
  events: RaciAssignmentEvent[],
  activityKey: RaciActivityKey,
  role: RaciRole
): RaciAssignmentEvent[] {
  return sortEventsChronologically(events).filter((e) => e.activityKey === activityKey && e.role === role);
}

/** True if there is no Accountable owner currently assigned for this
 * activity — a real governance gap Items 3/7 must handle explicitly
 * (never silently fall back to "ISC decides" or a guessed owner). */
export function hasAccountabilityGap(current: RaciCurrentAssignment[], activityKey: RaciActivityKey): boolean {
  const row = current.find((c) => c.activityKey === activityKey && c.role === 'A');
  return !row || row.userIds.length === 0;
}

export interface RaciCompleteness {
  activityKey: RaciActivityKey;
  hasAccountable: boolean;
  hasResponsible: boolean;
  consultedCount: number;
  informedCount: number;
}

export function computeCompleteness(current: RaciCurrentAssignment[]): RaciCompleteness[] {
  return RACI_ACTIVITY_KEYS.map((activityKey) => {
    const rows = current.filter((c) => c.activityKey === activityKey);
    const a = rows.find((r) => r.role === 'A');
    const r = rows.find((r) => r.role === 'R');
    const c = rows.find((r) => r.role === 'C');
    const i = rows.find((r) => r.role === 'I');
    return {
      activityKey,
      hasAccountable: !!a && a.userIds.length > 0,
      hasResponsible: !!r && r.userIds.length > 0,
      consultedCount: c?.userIds.length ?? 0,
      informedCount: i?.userIds.length ?? 0,
    };
  });
}
