/**
 * Supplier Dependency Surfacing (#378, 25 Aug 2026) — no-ERP, conversational
 * single-source-risk check.
 *
 * Design note (corrects the original scoping draft): the original design
 * assumed each supplier/category question set would be applied to "whichever
 * categories the client's own Diagnostic already named." Checked against the
 * live Problem DNA schema (DiagnosticInput in diagnostic.ts) before building
 * this -- there is no per-client top-cost-category or spend-by-category field
 * anywhere in the platform; the closest fields are a single fixed focusArea
 * and a symptoms[] tag array, neither of which names supplier/spend
 * categories. So this tool is self-scoped: the client names the
 * supplier/category they're worried about directly, rather than the design
 * pretending to inherit a data point that doesn't exist yet.
 *
 * Same pattern as decisionLab.ts: pure functions, no side effects, no
 * network calls -- the page component owns state/persistence/AI-plan wiring.
 * No new backend route -- the optional "Get a remedy" narrative reuses the
 * existing generic /api/ai/plan endpoint via useAIPlan, same as Decision Lab.
 *
 * Severity is derived by a fixed, disclosed rule from self-reported answers
 * -- never an AI-invented score (Decision Record 8.7: no fabricated
 * numbers/scores that could mislead a client on a real risk decision).
 */

export type ContractType = 'written' | 'relationship' | '';

export interface SupplierCheck {
  id: string;
  /** Free text -- the supplier name or spend category the client is checking. */
  name: string;
  /** Q1 — Named-alternative test. */
  hasNamedAlternative: boolean | null;
  /** Q2 — Contract-vs-relationship test. */
  contractType: ContractType;
  /** Q3 — Switching-cost tell. Free text, not scored, feeds the narrative only. */
  switchingCostNote: string;
  /** Q4 — Volume-concentration self-check. 0-100, self-reported estimate, or null if skipped. */
  volumeConcentrationPct: number | null;
  /** Q5 — Recency-of-stress test. */
  hasRecentStressSignal: boolean | null;
  /** Free text detail for Q5, optional. */
  recentStressNote: string;
}

export type SeverityLevel = 'Critical' | 'Moderate' | 'Low' | 'Incomplete';

export interface SeverityResult {
  level: SeverityLevel;
  /** Which of the 4 underlying risk signals fired, for transparency. */
  signalsFired: string[];
  /** Human-readable one-line reason, English. */
  reasonEn: string;
  reasonAr: string;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function newSupplierCheck(name = ''): SupplierCheck {
  return {
    id: nextId('sdep'),
    name,
    hasNamedAlternative: null,
    contractType: '',
    switchingCostNote: '',
    volumeConcentrationPct: null,
    hasRecentStressSignal: null,
    recentStressNote: '',
  };
}

/** True once the 3 required signals (Q1, Q2, Q5) have been answered. Q3 (free text) and Q4 (% estimate) are optional context. */
export function isCheckComplete(check: SupplierCheck): boolean {
  return check.hasNamedAlternative !== null && check.contractType !== '' && check.hasRecentStressSignal !== null;
}

/**
 * Deterministic, disclosed severity rule (first-pass judgment call per the
 * original scoping draft, not sourced from a named framework -- flagged for
 * owner correction same as the question wording itself):
 *
 *   Critical = no named alternative AND relationship-based (not a written
 *              contract) AND a recent stress signal, together.
 *   Moderate = any 2 of the 4 underlying risk signals present
 *              (no alternative / relationship-based / recent stress /
 *              volume concentration ≥50%), short of the full Critical combo.
 *   Low      = fewer than 2 signals present.
 *   Incomplete = the 3 required questions haven't all been answered yet.
 */
export function deriveSeverity(check: SupplierCheck, isAr: boolean): SeverityResult {
  if (!isCheckComplete(check)) {
    return {
      level: 'Incomplete',
      signalsFired: [],
      reasonEn: 'Answer the required questions below to see a severity read.',
      reasonAr: 'أجب عن الأسئلة المطلوبة أدناه لعرض تقييم الخطورة.',
    };
  }

  const noAlternative = check.hasNamedAlternative === false;
  const isRelationship = check.contractType === 'relationship';
  const recentStress = check.hasRecentStressSignal === true;
  const highConcentration = check.volumeConcentrationPct !== null && check.volumeConcentrationPct >= 50;

  const signals: { key: string; fired: boolean; en: string; ar: string }[] = [
    { key: 'noAlternative',    fired: noAlternative,     en: 'No named backup supplier',          ar: 'لا يوجد مورّد بديل محدد' },
    { key: 'relationship',     fired: isRelationship,    en: 'Relationship-based, not contracted', ar: 'قائم على العلاقة وليس بعقد' },
    { key: 'recentStress',     fired: recentStress,      en: 'Recent stress signal reported',      ar: 'تم الإبلاغ عن إشارة ضغط حديثة' },
    { key: 'highConcentration',fired: highConcentration, en: 'High spend concentration (≥50%)',    ar: 'تركّز إنفاق مرتفع (٥٠٪ فأكثر)' },
  ];
  const fired = signals.filter(s => s.fired);
  const signalsFired = fired.map(s => s.key);

  if (noAlternative && isRelationship && recentStress) {
    return {
      level: 'Critical',
      signalsFired,
      reasonEn: 'No named alternative, an informal relationship rather than a written contract, and a recent stress signal -- together this is the highest-risk combination this check flags.',
      reasonAr: 'لا يوجد بديل محدد، والعلاقة غير موثقة بعقد، مع إشارة ضغط حديثة -- هذا هو أعلى مستوى خطورة يرصده هذا الفحص.',
    };
  }

  if (fired.length >= 2) {
    return {
      level: 'Moderate',
      signalsFired,
      reasonEn: `${fired.length} of 4 risk signals present: ${fired.map(s => s.en).join('; ')}.`,
      reasonAr: `${fired.length} من ٤ إشارات خطورة موجودة: ${fired.map(s => s.ar).join('؛ ')}.`,
    };
  }

  return {
    level: 'Low',
    signalsFired,
    reasonEn: fired.length === 0
      ? 'No risk signals present -- a named alternative exists and nothing flagged as a recent concern.'
      : `Only ${fired.length} risk signal present: ${fired.map(s => s.en).join('; ')}.`,
    reasonAr: fired.length === 0
      ? 'لا توجد إشارات خطورة -- يوجد بديل محدد ولم يُذكر أي قلق حديث.'
      : `إشارة خطورة واحدة فقط: ${fired.map(s => s.ar).join('؛ ')}.`,
  };
}

export function buildSupplierDependencyPrompt(check: SupplierCheck, severity: SeverityResult, isAr: boolean): string {
  const header = isAr
    ? `## فحص اعتمادية المورّد: ${check.name || 'غير مسمّى'}`
    : `## Supplier Dependency Check: ${check.name || 'Unnamed'}`;

  const lines = [
    header,
    '',
    isAr ? `مستوى الخطورة: ${severity.level}` : `Severity: ${severity.level}`,
    isAr ? severity.reasonAr : severity.reasonEn,
    '',
    isAr ? '## الإجابات' : '## Answers',
    isAr
      ? `- بديل محدد؟ ${check.hasNamedAlternative ? 'نعم' : 'لا'}`
      : `- Named alternative? ${check.hasNamedAlternative ? 'Yes' : 'No'}`,
    isAr
      ? `- نوع العلاقة: ${check.contractType === 'written' ? 'عقد موثّق' : 'علاقة غير موثقة'}`
      : `- Relationship type: ${check.contractType === 'written' ? 'Written contract' : 'Informal relationship'}`,
    check.switchingCostNote ? (isAr ? `- أول ما قد يتأثر عند التبديل: ${check.switchingCostNote}` : `- First thing that would break on switching: ${check.switchingCostNote}`) : '',
    check.volumeConcentrationPct !== null ? (isAr ? `- تركّز الإنفاق التقديري: ${check.volumeConcentrationPct}%` : `- Estimated spend concentration: ${check.volumeConcentrationPct}%`) : '',
    isAr
      ? `- إشارة ضغط حديثة؟ ${check.hasRecentStressSignal ? 'نعم' : 'لا'}${check.recentStressNote ? ` — ${check.recentStressNote}` : ''}`
      : `- Recent stress signal? ${check.hasRecentStressSignal ? 'Yes' : 'No'}${check.recentStressNote ? ` -- ${check.recentStressNote}` : ''}`,
    '',
    isAr
      ? 'اقترح إجراءً عملياً محدداً لمعالجة هذا الاعتماد، متناسباً مع مستوى الخطورة أعلاه -- لا تُعِد صياغة الإجابات فقط.'
      : 'Recommend a specific, practical action to address this dependency, scaled to the severity above -- do not just restate the answers back.',
  ].filter(Boolean);

  return lines.join('\n');
}
