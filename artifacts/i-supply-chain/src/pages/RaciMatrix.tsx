/**
 * Supplier Lifecycle Governance RACI Matrix -- Item 2 of 7 (11 Sep 2026).
 *
 * Two-tier, client-selectable (design doc section 2.8, client-confirmed for
 * RACI specifically 11 Sep 2026 via AskUserQuestion):
 *   - Advisory (default): renders @/lib/supplierRACI's RACI_TEMPLATE -- a
 *     sourced, generic role-ARCHETYPE recommendation (e.g. "Quality
 *     Director"), never a real name, with zero persistence.
 *   - Operational (opt-in): reads/writes the client's OWN organization's
 *     real named assignments via /api/raci/current, /api/raci/events, and
 *     /api/raci/org-members. Only a signed-in user whose own orgRole is
 *     'org_admin' sees the assignment controls -- re-enforced server-side
 *     on every write, never trusted from this component alone.
 *
 * Visual primitive: a Matrix (activities x roles) -- isc-ai-output-standards
 * principle 12 names Matrix explicitly for "prioritization"; a RACI chart is
 * the textbook example of the same idea (which of a fixed set of roles owns
 * which of a fixed set of activities), so a real grid/table is used here
 * rather than a generic card list. A Timeline (principle 12) is used for the
 * per-cell audit-trail drill-down, since that is investigation/decision
 * history, not a snapshot.
 *
 * Bilingual EN/AR from the start (Rule 5), following this app's own isAr-
 * ternary convention (see SupplierCOPQ.tsx / SupplierRecoveryPortfolio.tsx).
 *
 * DISCLOSED LIMITATION (see the Item 2 worked-example doc for the full
 * writeup): there is no invite/join-an-existing-organization flow anywhere
 * in this app yet (auth.ts's own comment on /register: "one org per
 * signup, no multi-seat/invite mechanic yet"). Today, every organization is
 * a single user by construction, so the Operational tier's "assign a
 * colleague" use case has nothing to assign to beyond the org_admin
 * themselves until that separate feature exists. This page surfaces that
 * honestly (see the OrgMembersNotice below) instead of hiding it.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  RACI_ROLES,
  RACI_ACTIVITIES,
  RACI_TEMPLATE,
  type RaciRole,
  type RaciActivityKey,
  type RaciAssignmentEvent,
  type RaciCurrentAssignment,
  computeCurrentRaci,
  computeRoleHistory,
  computeCompleteness,
  hasAccountabilityGap,
} from '@/lib/supplierRACI';

type Tier = 'advisory' | 'operational';

interface OrgMember {
  id: number;
  fullName: string;
  email: string;
  orgRole: string;
}

const ROLE_COLOR: Record<RaciRole, string> = {
  R: '#065f46',
  A: '#082C6B',
  C: '#92400e',
  I: '#374151',
};

function memberName(members: OrgMember[], userId: number, isAr: boolean): string {
  const m = members.find((x) => x.id === userId);
  if (m) return m.fullName;
  return isAr ? `مستخدم #${userId}` : `User #${userId}`;
}

export function RaciMatrix() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [tier, setTier] = useState<Tier>('advisory');
  const [events, setEvents] = useState<RaciAssignmentEvent[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');
  const [expandedCell, setExpandedCell] = useState<string | null>(null); // `${activityKey}::${role}`

  // Assignment form state (Operational tier, org_admin only)
  const [formActivity, setFormActivity] = useState<RaciActivityKey>('copq_review');
  const [formRole, setFormRole] = useState<RaciRole>('A');
  const [formUserId, setFormUserId] = useState<number | ''>('');
  const [formAction, setFormAction] = useState<'assigned' | 'unassigned'>('assigned');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (tier !== 'operational') return;
    let cancelled = false;
    setLoadState('loading');
    Promise.all([
      fetch('/api/raci/events', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch('/api/raci/org-members', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    ])
      .then(([eventsRes, membersRes]) => {
        if (cancelled) return;
        setEvents(eventsRes.ok ? eventsRes.events : []);
        setMembers(membersRes.ok ? membersRes.members : []);
        setLoadState('live');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState('unreachable');
      });
    return () => { cancelled = true; };
  }, [tier, saveStatus]);

  const current: RaciCurrentAssignment[] = useMemo(() => computeCurrentRaci(events), [events]);
  const completeness = useMemo(() => computeCompleteness(current), [current]);
  const gapKeys = useMemo(() => RACI_ACTIVITIES.map((a) => a.key).filter((k) => hasAccountabilityGap(current, k)), [current]);

  const t = {
    title: isAr ? 'مصفوفة المسؤوليات (RACI) لحوكمة دورة حياة المورد' : 'Supplier Lifecycle Governance RACI Matrix',
    subtitle: isAr
      ? 'من يُنجز، ومن يُعتمَد، ومن يُستشار، ومن يُعلَم — لكل قرار من قرارات حوكمة الموردين السبعة'
      : 'Who does it, who owns it, who is consulted, who is informed — for each of the 7 supplier-governance decision points',
    tierAdvisory: isAr ? 'المستوى الاستشاري' : 'Advisory Tier',
    tierOperational: isAr ? 'المستوى التشغيلي' : 'Operational Tier',
    tierAdvisoryDesc: isAr ? 'قالب أدوار عام — بلا أسماء حقيقية وبلا تخزين' : 'Generic role template — no real names, no persistence',
    tierOperationalDesc: isAr ? 'تحفظ ISC تعيينات فعلية بأسماء حقيقية كسجل مرجعي معتمَد للعميل' : "ISC persists real, named assignments as the client's system of record",
    frameworkLabel: isAr ? 'المنهجية المعتمدة' : 'Sourced Methodology',
    frameworkText: isAr
      ? 'مصفوفة RACI (المسؤول، المعتمِد، المستشار، المُعلَم) كما هي موثقة في دليل PMBOK الصادر عن معهد إدارة المشاريع (PMI)، وممارسات إدارة علاقات الموردين لدى CIPS، والبند 8.4 من المواصفة ISO 9001. راجع مقالة ويكيبيديا "Responsibility assignment matrix" للخلفية التاريخية الموحّدة.'
      : 'RACI (Responsible / Accountable / Consulted / Informed), documented in PMI\'s PMBOK Guide and CIPS supplier relationship management guidance, with ISO 9001 Clause 8.4 assigning evaluation/approval responsibility to the client organization. See Wikipedia\'s "Responsibility assignment matrix" for the consolidated historical/definitional overview.',
    roleLabels: {
      R: isAr ? 'مسؤول (R)' : 'Responsible (R)',
      A: isAr ? 'معتمِد (A)' : 'Accountable (A)',
      C: isAr ? 'مستشار (C)' : 'Consulted (C)',
      I: isAr ? 'مُعلَم (I)' : 'Informed (I)',
    } as Record<RaciRole, string>,
    activity: isAr ? 'النشاط' : 'Activity',
    gapsTitle: isAr ? 'فجوات المساءلة' : 'Accountability Gaps',
    gapsNone: isAr ? 'لا توجد فجوات — يوجد معتمِد واحد لكل نشاط' : 'No gaps — every activity has exactly one Accountable owner',
    gapsSome: isAr ? 'الأنشطة التالية بلا معتمِد (A) معيّن حالياً:' : 'The following activities currently have no Accountable (A) owner assigned:',
    assignTitle: isAr ? 'تعيين دور' : 'Assign a Role',
    assignNote: isAr ? 'مقصور على مسؤول المنظمة (org_admin) فقط — يُعاد التحقق من هذا الشرط من قِبل الخادم مع كل عملية حفظ.' : 'Restricted to your organization\'s admin (org_admin) — re-checked server-side on every save.',
    notAdminNote: isAr
      ? 'حسابك ليس "مسؤول المنظمة" لهذه المؤسسة، لذلك عناصر التعيين هنا للعرض فقط. اطلب من مسؤول مؤسستك تنفيذ التعيينات.'
      : 'Your account is not this organization\'s admin, so the assignment controls here are view-only. Ask your organization\'s admin to make assignments.',
    noOrgNote: isAr
      ? 'حسابك غير مرتبط حالياً بأي مؤسسة، لذلك لا يمكن تعيين أدوار RACI. هذا يحدث عادةً لحساب قديم لم يُكمل التسجيل الكامل.'
      : 'Your account is not currently linked to an organization, so RACI roles cannot be assigned. This usually happens on an older account that has not completed full registration.',
    memberField: isAr ? 'العضو' : 'Member',
    actionField: isAr ? 'الإجراء' : 'Action',
    actionAssign: isAr ? 'تعيين' : 'Assign',
    actionUnassign: isAr ? 'إلغاء التعيين' : 'Unassign',
    save: isAr ? 'حفظ' : 'Save',
    saved: isAr ? '✓ تم الحفظ' : '✓ Saved',
    unreachable: isAr ? 'تعذّر الوصول إلى الخادم — لا توجد جلسة حقيقية في هذه المعاينة' : 'Could not reach the server — no live session in this preview',
    unassigned: isAr ? '— غير معيّن —' : '— unassigned —',
    auditTitle: isAr ? 'سجل التدقيق' : 'Audit Trail',
    noHistory: isAr ? 'لا يوجد سجل بعد' : 'No history yet',
    orgMembersNoticeTitle: isAr ? 'ملاحظة معلنة: لا توجد آلية دعوة أعضاء بعد' : 'Disclosed note: no member-invite flow yet',
    orgMembersNotice: isAr
      ? 'مؤسستك تضم حالياً عضواً واحداً فقط (أنت). لا يوجد في المنصة اليوم مسار لدعوة زميل للانضمام إلى نفس المؤسسة — كل تسجيل جديد ينشئ مؤسسته الخاصة تلقائياً. لذلك تعيين "مسؤول" أو "مستشار" حقيقي غير أنت نفسك غير ممكن بعد حتى تُبنى ميزة الدعوة. هذا قيد معلَن، وليس خطأً.'
      : 'Your organization currently has exactly one member (you). There is no flow in the platform today to invite a colleague into the same organization — every new signup creates its own organization automatically. So assigning a real Responsible/Consulted/Informed person other than yourself is not yet possible until that separate invite feature is built. This is a disclosed limitation, not a bug.',
    consulted: isAr ? 'مستشار' : 'Consulted',
    informed: isAr ? 'مُعلَم' : 'Informed',
  };

  const groupSubmit = async () => {
    if (formUserId === '') return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/raci/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activityKey: formActivity, role: formRole, userId: formUserId, action: formAction }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveStatus('error');
        setSaveError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      setSaveError(isAr ? 'خطأ في الشبكة' : 'Network error');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex rounded-lg border border-[#082C6B]/20 overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setTier('advisory')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'advisory' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}
            >
              {t.tierAdvisory}
            </button>
            <button
              type="button"
              onClick={() => setTier('operational')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'operational' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}
            >
              {t.tierOperational}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">{tier === 'advisory' ? t.tierAdvisoryDesc : t.tierOperationalDesc}</p>

        {/* Framework source -- always visible, never buried (Rule 2 / isc-ai-output-standards #6) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <span className="font-semibold text-[#082C6B]">{t.frameworkLabel}: </span>
          {t.frameworkText}
        </div>

        {tier === 'advisory' ? (
          <AdvisoryMatrix isAr={isAr} t={t} />
        ) : (
          <>
            {loadState === 'unreachable' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 text-xs text-amber-800">
                {t.unreachable}
              </div>
            )}

            {members.length <= 1 && loadState === 'live' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-blue-900">{t.orgMembersNoticeTitle}</p>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">{t.orgMembersNotice}</p>
              </div>
            )}

            {/* Accountability gaps -- decision-ready framing, isc-ai-output-standards #3 */}
            <div className={`rounded-xl p-4 mb-6 border ${gapKeys.length > 0 ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
              <p className={`text-sm font-semibold ${gapKeys.length > 0 ? 'text-red-800' : 'text-emerald-800'}`}>{t.gapsTitle}</p>
              {gapKeys.length === 0 ? (
                <p className="text-xs text-emerald-700 mt-1">{t.gapsNone}</p>
              ) : (
                <>
                  <p className="text-xs text-red-700 mt-1">{t.gapsSome}</p>
                  <ul className="text-xs text-red-700 mt-1 list-disc ms-5">
                    {gapKeys.map((k) => (
                      <li key={k}>{isAr ? RACI_ACTIVITIES.find((a) => a.key === k)!.labelAr : RACI_ACTIVITIES.find((a) => a.key === k)!.labelEn}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <OperationalMatrix
              isAr={isAr}
              t={t}
              current={current}
              members={members}
              completeness={completeness}
              events={events}
              expandedCell={expandedCell}
              setExpandedCell={setExpandedCell}
            />

            {/* Assignment form -- view-only unless the signed-in user is this org's org_admin (server re-checks regardless) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mt-6">
              <p className="text-sm font-semibold text-[#082C6B]">{t.assignTitle}</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">{t.assignNote}</p>
              {!hasOrg && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{t.noOrgNote}</p>
              )}
              {hasOrg && !isOrgAdmin && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{t.notAdminNote}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <select
                  aria-label={t.activity}
                  disabled={!isOrgAdmin}
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value as RaciActivityKey)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                >
                  {RACI_ACTIVITIES.map((a) => (
                    <option key={a.key} value={a.key}>{isAr ? a.labelAr : a.labelEn}</option>
                  ))}
                </select>
                <select
                  aria-label={isAr ? 'الدور' : 'Role'}
                  disabled={!isOrgAdmin}
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as RaciRole)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                >
                  {RACI_ROLES.map((r) => (
                    <option key={r} value={r}>{t.roleLabels[r]}</option>
                  ))}
                </select>
                <select
                  aria-label={t.memberField}
                  disabled={!isOrgAdmin}
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value ? Number(e.target.value) : '')}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                >
                  <option value="">{t.memberField}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
                <select
                  aria-label={t.actionField}
                  disabled={!isOrgAdmin}
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value as 'assigned' | 'unassigned')}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                >
                  <option value="assigned">{t.actionAssign}</option>
                  <option value="unassigned">{t.actionUnassign}</option>
                </select>
                <button
                  type="button"
                  disabled={!isOrgAdmin || formUserId === ''}
                  onClick={groupSubmit}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white disabled:opacity-40 hover:bg-[#082C6B]/90 transition-colors"
                >
                  {t.save}
                </button>
              </div>
              {saveStatus === 'saved' && <p className="text-xs font-semibold text-emerald-700 mt-2">{t.saved}</p>}
              {saveStatus === 'error' && <p className="text-xs font-semibold text-red-700 mt-2">{saveError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Advisory tier: the sourced role-archetype template, no real names
// ---------------------------------------------------------------------------

function AdvisoryMatrix({ isAr, t }: { isAr: boolean; t: Record<string, any> }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-start px-3 py-2 font-semibold text-slate-600">{t.activity}</th>
            <th className="text-start px-3 py-2 font-semibold" style={{ color: ROLE_COLOR.A }}>{t.roleLabels.A}</th>
            <th className="text-start px-3 py-2 font-semibold" style={{ color: ROLE_COLOR.R }}>{t.roleLabels.R}</th>
            <th className="text-start px-3 py-2 font-semibold" style={{ color: ROLE_COLOR.C }}>{t.roleLabels.C}</th>
            <th className="text-start px-3 py-2 font-semibold" style={{ color: ROLE_COLOR.I }}>{t.roleLabels.I}</th>
          </tr>
        </thead>
        <tbody>
          {RACI_TEMPLATE.map((row) => {
            const meta = RACI_ACTIVITIES.find((a) => a.key === row.activityKey)!;
            return (
              <tr key={row.activityKey} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-800">{isAr ? meta.labelAr : meta.labelEn}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? meta.governanceItemAr : meta.governanceItemEn}</p>
                </td>
                <td className="px-3 py-3 text-slate-700">{isAr ? row.accountableArchetypeAr : row.accountableArchetypeEn}</td>
                <td className="px-3 py-3 text-slate-700">{isAr ? row.responsibleArchetypeAr : row.responsibleArchetypeEn}</td>
                <td className="px-3 py-3 text-slate-700">{(isAr ? row.consultedArchetypesAr : row.consultedArchetypesEn).join(isAr ? '، ' : ', ')}</td>
                <td className="px-3 py-3 text-slate-700">{(isAr ? row.informedArchetypesAr : row.informedArchetypesEn).join(isAr ? '، ' : ', ')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operational tier: real assignments, with a Timeline drill-down per cell
// ---------------------------------------------------------------------------

function OperationalMatrix({
  isAr, t, current, members, completeness, events, expandedCell, setExpandedCell,
}: {
  isAr: boolean;
  t: Record<string, any>;
  current: RaciCurrentAssignment[];
  members: OrgMember[];
  completeness: ReturnType<typeof computeCompleteness>;
  events: RaciAssignmentEvent[];
  expandedCell: string | null;
  setExpandedCell: (v: string | null) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-start px-3 py-2 font-semibold text-slate-600">{t.activity}</th>
            {RACI_ROLES.map((r) => (
              <th key={r} className="text-start px-3 py-2 font-semibold" style={{ color: ROLE_COLOR[r] }}>{t.roleLabels[r]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RACI_ACTIVITIES.map((meta) => {
            const rowCompleteness = completeness.find((c) => c.activityKey === meta.key)!;
            const gap = !rowCompleteness.hasAccountable;
            return (
              <tr key={meta.key} className={`border-b border-slate-100 last:border-0 align-top ${gap ? 'bg-red-50/40' : ''}`}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-800">{isAr ? meta.labelAr : meta.labelEn}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? meta.governanceItemAr : meta.governanceItemEn}</p>
                </td>
                {RACI_ROLES.map((role) => {
                  const cell = current.find((c) => c.activityKey === meta.key && c.role === role)!;
                  const cellKey = `${meta.key}::${role}`;
                  const isOpen = expandedCell === cellKey;
                  const history = computeRoleHistory(events, meta.key, role);
                  return (
                    <td key={role} className="px-3 py-3">
                      {cell.userIds.length === 0 ? (
                        <span className="text-slate-400 italic">{t.unassigned}</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {cell.userIds.map((uid) => (
                            <li key={uid} className="text-slate-700">{memberName(members, uid, isAr)}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedCell(isOpen ? null : cellKey)}
                        className="text-[10px] text-[#082C6B]/70 hover:text-[#082C6B] underline mt-1"
                      >
                        {t.auditTitle}
                      </button>
                      {isOpen && (
                        <div className="mt-2 border-s-2 border-slate-200 ps-2">
                          {history.length === 0 ? (
                            <p className="text-[10px] text-slate-400">{t.noHistory}</p>
                          ) : (
                            <ul className="space-y-1">
                              {history.map((h) => (
                                <li key={h.id} className="text-[10px] text-slate-500">
                                  <span className={h.action === 'assigned' ? 'text-emerald-700' : 'text-red-700'}>
                                    {h.action === 'assigned' ? (isAr ? 'تعيين' : 'assigned') : (isAr ? 'إلغاء' : 'unassigned')}
                                  </span>{' '}
                                  {memberName(members, h.userId, isAr)} — {new Date(h.createdAt).toLocaleString(isAr ? 'ar' : 'en-US')}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
