// Module 08 -- penalty exposure under the Local Content Preference Regulation (Cabinet Decision 245 of 29/3/1441H), Part 3 (Arts 28-34)
// and the debarment / rating-cut referral triggers (Arts 37-38).
// SOURCE: Arabic regulation text read in full by ISC on 25 Oct 2026 (laws.boe.gov.sa and the LCGPA/Argaam marked-up amendments PDF).
// HONESTY RULES (Decision Record 8.7):
//  * These are CEILINGS ("not exceeding"). The actual rate and method are set in each tender's documents (Arts 29-32 say "as detailed in the tender documents").
//  * Art. 33: the Minister may raise the rates, disclosed to bidders before they bid. Art. 34: the Minister may raise the 20% cap.
//  * Art. 32(1) (periodic-report fine up to 5%) and the framework-agreement fines (Art. 29(3)-(4)) appear in the marked-up amendments text; ISC could not confirm
//    the adoption date, so they carry `amendedText: true` and the UI says so.
//  * Arts 37(2) and 38(2) print TWO figures in the extracted text (15 / 10 and 10 / 5 respectively) because the source mixes struck and inserted numbers.
//    ISC does not pick one: the check reports against BOTH and says which figure was crossed.
export type PenaltyArticle = 'art29-2' | 'art30' | 'art31' | 'art32-1' | 'art32-2';

export interface PenaltyRule {
  id: PenaltyArticle; article: string; ceilingPct: number; base: 'contract' | 'item'; amendedText?: boolean;
  trigger: { en: string; ar: string };
}
export const PENALTY_RULES: PenaltyRule[] = [
  { id: 'art29-2', article: 'Art. 29(2)', ceilingPct: 0.10, base: 'contract',
    trigger: { en: 'Supply contract: delivered a lower national-product share than the one bid (ceiling is 10% of the supply contract, or of the defaulting item where the contract has supply items; or a fine equal to the extra price preference where it applied).',
               ar: 'عقد توريد: عدم الالتزام بتسليم حصة المنتجات الوطنية المتعهد بها (بحد أقصى ١٠٪ من قيمة عقد التوريد أو من قيمة البند المقصّر، أو غرامة تعادل نسبة التفضيل السعري الإضافي حيثما انطبق).' } },
  { id: 'art30', article: 'Art. 30', ceilingPct: 0.10, base: 'item',
    trigger: { en: 'The contractor did not give preference to national products when buying materials for the contract (Art. 12); ceiling 10% of the defaulting item.',
               ar: 'عدم إعطاء المتعاقد الأفضلية للمنتجات الوطنية عند شراء مواد العقد (المادة ١٢)؛ بحد أقصى ١٠٪ من قيمة البند المقصّر.' } },
  { id: 'art31', article: 'Art. 31', ceilingPct: 0.10, base: 'contract',
    trigger: { en: 'Local-content weight or minimum-content mechanism: achieved local content at contract end is more than 5 percentage points below the target.',
               ar: 'آلية وزن المحتوى المحلي أو الحد الأدنى: الفارق بين النسبة المستهدفة والمحققة عند نهاية العقد أكثر من ٥ نقاط مئوية.' } },
  { id: 'art32-1', article: 'Art. 32(1)', ceilingPct: 0.05, base: 'contract', amendedText: true,
    trigger: { en: 'A required periodic report was not delivered on time (ceiling 5% of contract value).',
               ar: 'عدم تسليم أي تقرير دوري مطلوب في موعده (بحد أقصى ٥٪ من قيمة العقد).' } },
  { id: 'art32-2', article: 'Art. 32(2)', ceilingPct: 0.10, base: 'contract',
    trigger: { en: 'The final report was not delivered on time (ceiling 10% of contract value).',
               ar: 'عدم تسليم التقرير النهائي في موعده (بحد أقصى ١٠٪ من قيمة العقد).' } },
];

/** Art. 34: total fines (under the Law, its Implementing Regulation and this Regulation) may not exceed 20% of contract value.
 *  The cap does NOT cover Art. 29(1) (deduction of violating items) and Art. 29(2) (national-share fine). */
export const TOTAL_CAP_PCT = 0.20;
export const CAP_EXCLUDED: PenaltyArticle[] = ['art29-2'];

export interface PenaltyInput {
  contractValue: number;
  /** Value of the defaulting items for the item-based rules (Art. 29(2) on item basis, Art. 30). */
  itemValue?: number;
  breaches: PenaltyArticle[];
  /** Optional: rates the tender documents actually state (as fractions of their base), capped at the ceiling for display. */
  statedRates?: Partial<Record<PenaltyArticle, number>>;
  /** Fines already imposed under the Law / Implementing Regulation (count toward the 20% cap). */
  otherFinesUnderLaw?: number;
}
export interface PenaltyLine { id: PenaltyArticle; article: string; base: number; ceiling: number; usedRate: number; amount: number; cappedBy34: boolean; amendedText: boolean }
export interface PenaltyResult { lines: PenaltyLine[]; theoreticalMax: number; underCap: number; cap: number; capBinds: boolean; total: number }

const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function penaltyExposure(inp: PenaltyInput): PenaltyResult {
  const cv = clamp(inp.contractValue);
  const iv = clamp(inp.itemValue ?? 0);
  const uniq = Array.from(new Set(inp.breaches));
  const lines: PenaltyLine[] = uniq.map(id => {
    const r = PENALTY_RULES.find(x => x.id === id)!;
    const base = r.base === 'item' ? iv : (id === 'art29-2' && iv > 0 ? iv : cv);
    const stated = inp.statedRates?.[id];
    const used = stated !== undefined ? Math.min(Math.max(stated, 0), r.ceilingPct) : r.ceilingPct;
    return { id, article: r.article, base, ceiling: base * r.ceilingPct, usedRate: used, amount: base * used, cappedBy34: false, amendedText: !!r.amendedText };
  });
  const theoreticalMax = lines.reduce((s, l) => s + l.amount, 0);
  const excluded = lines.filter(l => CAP_EXCLUDED.includes(l.id)).reduce((s, l) => s + l.amount, 0);
  const capped = lines.filter(l => !CAP_EXCLUDED.includes(l.id));
  const underCap = capped.reduce((s, l) => s + l.amount, 0);
  const room = Math.max(0, cv * TOTAL_CAP_PCT - clamp(inp.otherFinesUnderLaw ?? 0));
  const capBinds = underCap > room;
  if (capBinds) capped.forEach(l => { l.cappedBy34 = true; });
  const total = excluded + Math.min(underCap, room);
  return { lines, theoreticalMax, underCap, cap: cv * TOTAL_CAP_PCT, capBinds, total };
}

/* ---- Debarment / rating-cut referral (Arts 37-38). Gaps are percentage points (local content) or percentage points of share (national products). ---- */
export interface ReferralInput {
  supplyShareGapPts?: number;        // bid national-product share minus actual share, in points
  localContentGapPts?: number;       // target minus achieved local content, in points
  finalReportMissing?: boolean;
  /** Art. 38: number of contracts in 3 consecutive years that each crossed the repeat thresholds (0-3+). */
  repeatSupplyContracts?: number;    // each with supply-share gap > 25 points
  repeatLcContracts?: number;        // each with local-content gap > 10 (or > 5) points
  repeatMissingFinalReports?: number;
}
export interface ReferralFlag { article: string; level: 'crossed' | 'ambiguous' | 'clear'; en: string; ar: string }

export function referralCheck(i: ReferralInput): ReferralFlag[] {
  const out: ReferralFlag[] = [];
  const sg = i.supplyShareGapPts, lg = i.localContentGapPts;
  if (sg !== undefined) out.push(sg > 50
    ? { article: 'Art. 37(1)', level: 'crossed', en: 'Supply share gap above 50 points: the authority can refer you to the committee for a ban or a rating cut.', ar: 'فارق حصة المنتجات الوطنية يتجاوز ٥٠ نقطة: يجوز للجهة رفع المخالفة إلى اللجنة للنظر في المنع أو تخفيض التصنيف.' }
    : { article: 'Art. 37(1)', level: 'clear', en: 'Supply share gap is within the 50-point trigger.', ar: 'فارق الحصة ضمن حد ٥٠ نقطة.' });
  if (lg !== undefined) {
    const lvl: ReferralFlag['level'] = lg > 15 ? 'crossed' : lg > 10 ? 'ambiguous' : 'clear';
    out.push({ article: 'Art. 37(2)', level: lvl,
      en: lvl === 'crossed' ? 'Local-content gap above 15 points: above both figures the text prints (15 and 10). Referral trigger crossed.'
        : lvl === 'ambiguous' ? 'Gap is between 10 and 15 points. The source text prints both figures, so ISC cannot say whether the trigger applies. Check the current official text.'
        : 'Local-content gap is at or below the lower printed figure (10 points).',
      ar: lvl === 'crossed' ? 'فارق المحتوى المحلي يتجاوز ١٥ نقطة: أعلى من الرقمين الواردين في النص (١٥ و١٠). تحقق شرط الرفع.'
        : lvl === 'ambiguous' ? 'الفارق بين ١٠ و١٥ نقطة. يطبع النص الرقمين معاً فلا تستطيع المنصة الجزم بسريان الشرط؛ راجع النص الرسمي الحالي.'
        : 'فارق المحتوى المحلي عند أو دون الرقم الأدنى الوارد (١٠ نقاط).' });
  }
  if (i.finalReportMissing !== undefined) out.push(i.finalReportMissing
    ? { article: 'Art. 37(3)', level: 'crossed', en: 'Final report not delivered in the period set by the tender documents: referral trigger.', ar: 'عدم تسليم التقرير النهائي خلال المدة المحددة في وثائق المنافسة: شرط للرفع.' }
    : { article: 'Art. 37(3)', level: 'clear', en: 'Final report delivered.', ar: 'تم تسليم التقرير النهائي.' });
  if (i.repeatSupplyContracts !== undefined) out.push(i.repeatSupplyContracts >= 3
    ? { article: 'Art. 38(1)', level: 'crossed', en: 'Three supply contracts in three consecutive years, each with a share gap above 25 points: LCGPA can refer you to the committee.', ar: 'ثلاثة عقود توريد خلال ثلاث سنوات متتالية بفارق حصة يزيد على ٢٥ نقطة في كل عقد: يجوز للهيئة الرفع إلى اللجنة.' }
    : { article: 'Art. 38(1)', level: 'clear', en: `${i.repeatSupplyContracts} of 3 repeat contracts counted.`, ar: `${i.repeatSupplyContracts} من ٣ عقود متكررة.` });
  if (i.repeatLcContracts !== undefined) out.push(i.repeatLcContracts >= 3
    ? { article: 'Art. 38(2)', level: 'ambiguous', en: 'Three contracts in three consecutive years missed the local-content target by more than the threshold. The text prints 10 and 5 points; check which applies.', ar: 'ثلاثة عقود خلال ثلاث سنوات متتالية لم يتحقق فيها المستهدف بأكثر من الحد. يطبع النص ١٠ و٥ نقاط؛ راجع الرقم المعتمد.' }
    : { article: 'Art. 38(2)', level: 'clear', en: `${i.repeatLcContracts} of 3 repeat contracts counted.`, ar: `${i.repeatLcContracts} من ٣ عقود متكررة.` });
  if (i.repeatMissingFinalReports !== undefined) out.push(i.repeatMissingFinalReports >= 3
    ? { article: 'Art. 38(3)', level: 'crossed', en: 'Final report missed on three contracts in three consecutive years: LCGPA referral trigger.', ar: 'عدم تسليم التقرير النهائي في ثلاثة عقود خلال ثلاث سنوات متتالية: شرط لرفع الهيئة.' }
    : { article: 'Art. 38(3)', level: 'clear', en: `${i.repeatMissingFinalReports} of 3 repeat contracts counted.`, ar: `${i.repeatMissingFinalReports} من ٣ عقود متكررة.` });
  return out;
}

export const PENALTY_SOURCE = {
  en: 'Local Content Preference Regulation (Cabinet Decision 245, 29/3/1441H), Arts 28-34 and 37-38, read by ISC on 25 Oct 2026. Ceilings only: the tender documents set the actual rate; the Minister may raise rates (Arts 33-34). Art. 32(1) and the framework-agreement fines come from the marked-up amendments text, adoption date not confirmed. Not legal advice.',
  ar: 'لائحة تفضيل المحتوى المحلي (قرار مجلس الوزراء 245 في 29/3/1441هـ)، المواد 28-34 و37-38، اطلعت عليها المنصة في 25 أكتوبر 2026. حدود قصوى فقط: وثائق المنافسة تحدد النسبة الفعلية، وللوزير رفع النسب (المادتان 33 و34). المادة 32(1) وغرامات الاتفاقيات الإطارية من نص التعديلات المعلَّم دون تأكيد تاريخ النفاذ. ليس استشارة قانونية.',
};
