// Saudization (Nitaqat-adjacent) job-group targets published by the Ministry of Human Resources & Social Development (HRSD).
// Sources: HRSD procedural guides (read in full by ISC, 25 Oct 2026):
//  - Telecom & IT occupations localization guide: 25% across three job groups; a group is bound only if it has at least 5 workers; effective 17/11/1442H.
//  - Consulting-services localization guide (Ministerial Decision 46968, 15/3/1444H): 35% from 15/9/1444H, 40% from 15/9/1445H, applies to government consulting contracts.
//  - Technical engineering occupations guide (updated 26 Jan 2025): 30% of workers in the targeted occupations.
// Rule: required Saudis = round-half-up(total workers x %) - existing Saudis, never below 0, evaluated per job group (not per occupation).
// Penalties are under HRSD Decision 178743 (27/9/1440H); ISC does not compute amounts (schedule not reproduced here).
export type SaudizationProgramId = 'ict' | 'consulting-p1' | 'consulting-p2' | 'engineering';
export interface SaudizationProgram { id: SaudizationProgramId; pct: number; minGroupSize: number; en: string; ar: string; source: { en: string; ar: string } }

export const SAUDIZATION_PROGRAMS: SaudizationProgram[] = [
  { id: 'ict', pct: 0.25, minGroupSize: 5, en: 'Telecom & IT occupations (25%)', ar: 'مهن الاتصالات وتقنية المعلومات (٢٥٪)',
    source: { en: 'HRSD procedural guide, telecom & IT localization; groups of 4 or fewer are exempt.', ar: 'الدليل الإجرائي لتوطين مهن الاتصالات وتقنية المعلومات؛ تُستثنى المجموعات التي لا تزيد على ٤ عاملين.' } },
  { id: 'consulting-p1', pct: 0.35, minGroupSize: 1, en: 'Consulting services, phase 1 (35%, from 15/9/1444H)', ar: 'الخدمات الاستشارية، المرحلة الأولى (٣٥٪، من 15/9/1444هـ)',
    source: { en: 'HRSD guide, Ministerial Decision 46968 (15/3/1444H); applies to government consulting contracts and targeted occupations.', ar: 'دليل وزارة الموارد البشرية، القرار الوزاري 46968 (15/3/1444هـ)؛ على العقود الاستشارية الحكومية والمهن المستهدفة.' } },
  { id: 'consulting-p2', pct: 0.40, minGroupSize: 1, en: 'Consulting services, phase 2 (40%, from 15/9/1445H)', ar: 'الخدمات الاستشارية، المرحلة الثانية (٤٠٪، من 15/9/1445هـ)',
    source: { en: 'Same decision; phase 2 applies to contracts concluded after it takes effect.', ar: 'القرار نفسه؛ تسري المرحلة الثانية على العقود المبرمة بعد نفاذها.' } },
  { id: 'engineering', pct: 0.30, minGroupSize: 1, en: 'Technical engineering occupations (30%)', ar: 'المهن الفنية الهندسية (٣٠٪)',
    source: { en: 'HRSD guide for technical engineering occupations, updated 26 Jan 2025. Any group-size exemption is not carried here: check the guide.', ar: 'دليل وزارة الموارد البشرية للمهن الفنية الهندسية (تحديث 26 يناير 2025). لم يُدرج أي استثناء لحجم المجموعة؛ راجع الدليل.' } },
];

export interface SaudizationResult { required: number; target: number; bound: boolean; compliant: boolean }

export function saudizationShortfall(programId: SaudizationProgramId, totalWorkers: number, saudis: number): SaudizationResult {
  const p = SAUDIZATION_PROGRAMS.find(x => x.id === programId)!;
  const total = Math.max(0, Math.floor(totalWorkers));
  const have = Math.min(total, Math.max(0, Math.floor(saudis)));
  // ICT guide: groups of 4 or fewer are exempt (bound from 5).
  const bound = total >= p.minGroupSize;
  const target = Math.floor(total * p.pct + 0.5 + 1e-9);
  const required = bound ? Math.max(0, target - have) : 0;
  return { required, target, bound, compliant: required === 0 };
}
