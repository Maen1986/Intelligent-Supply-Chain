/**
 * Repositioning method (Round B4, item 4): when should a supplier or item
 * really move to another Kraljic quadrant?
 *
 * WHY: CIPS itself says Kraljic gives no guidance on movement within the
 * matrix. Published work describes moves (Gelderman & van Weele 2003; Faes &
 * Matthyssen via Bildsten 2016; Tip et al. on temporary bottlenecks) but no
 * rule says WHEN to confirm one. This module supplies that rule.
 *
 * THIS IS ISC SYNTHESIS. No source states these rules or numbers. Each part
 * rests on a cited idea and every number is a configurable default:
 *  - TRIGGERS: a calendar review (Kraljic asks for regular updating; CIPS
 *    reviews high-value partnering at least annually) or an event (supplier
 *    failure, market shock, specification change, price jump).
 *  - PERSISTENCE TEST (Tomlin 2006; Tip et al.): a shock shorter than the
 *    time we can survive without supply is handled as a situation (bridge it),
 *    not as a structural move. Both durations must be known; if not, 'watch'.
 *  - HYSTERESIS: confirm a move only after the item sits in the new quadrant
 *    on N consecutive reviews, or crosses the boundary by a margin. This
 *    stops one noisy score from flipping a contract strategy.
 *  - HANDOVER: until a move is confirmed keep the sending quadrant's exit and
 *    due-diligence controls; on confirmation apply the receiving quadrant's.
 *
 * STANDALONE-FIRST: no imports. Facts are caller-supplied.
 */

export type Bilingual = { en: string; ar: string };
export type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

export interface ReviewPoint {
  dateIso: string;
  quadrant: Quadrant;
  /** 0-100 axis scores, if known (from the CIPS scoring tool). */
  riskPct?: number | null;
  profitPct?: number | null;
}

export type EventType = 'supplier-failure' | 'market-shock' | 'spec-change' | 'price-jump' | 'none';

export interface RepositionInput {
  /** The quadrant the supplier is formally managed in today. */
  confirmedQuadrant: Quadrant;
  /** Reviews, oldest first, INCLUDING the latest one. */
  reviews: ReviewPoint[];
  asOfIso: string;
  event?: {
    type: EventType;
    /** Expected length of the disruption in days; null = unknown. */
    expectedDurationDays?: number | null;
    /** Days we can run without this supply; null = unknown. */
    timeToSurviveDays?: number | null;
  } | null;
  /** Calendar review interval in days. ISC default 365 (half-yearly optional). */
  reviewIntervalDays?: number;
  /** Consecutive reviews needed to confirm. ISC default 2. */
  confirmReviews?: number;
  /** Cross the boundary by this many points to confirm at once. ISC default 10. */
  confirmMargin?: number;
  boundaryPct?: number;
}

export const REPOSITION_DEFAULTS = { reviewIntervalDays: 365, confirmReviews: 2, confirmMargin: 10, boundaryPct: 50 } as const;

export type Decision = 'hold' | 'review-due' | 'watch' | 'situational' | 'confirm-move' | 'need-facts';

export interface RepositionResult {
  decision: Decision;
  candidate: Quadrant | null;
  consecutive: number;
  needed: number;
  reviewDue: boolean;
  headline: Bilingual;
  reasons: Bilingual[];
  handover: Bilingual[];
  missing: Bilingual[];
  basis: 'isc-synthesis';
}

const daysBetween = (a: string, z: string): number => {
  const x = Date.parse(`${a}T00:00:00Z`); const y = Date.parse(`${z}T00:00:00Z`);
  return Number.isNaN(x) || Number.isNaN(y) ? 0 : Math.round((y - x) / 86400000);
};

export const QUADRANT_NAME: Record<Quadrant, Bilingual> = {
  strategic: b('Critical (Strategic)', 'استراتيجي (حرج)'),
  leverage: b('Leverage', 'نفوذ شرائي'),
  bottleneck: b('Bottleneck', 'نقطة اختناق'),
  'non-critical': b('Routine (Non-critical)', 'غير حرج (روتيني)'),
};

export function evaluateReposition(inp: RepositionInput): RepositionResult {
  const needed = inp.confirmReviews ?? REPOSITION_DEFAULTS.confirmReviews;
  const margin = inp.confirmMargin ?? REPOSITION_DEFAULTS.confirmMargin;
  const boundary = inp.boundaryPct ?? REPOSITION_DEFAULTS.boundaryPct;
  const interval = inp.reviewIntervalDays ?? REPOSITION_DEFAULTS.reviewIntervalDays;
  const reviews = [...inp.reviews].sort((x, y) => x.dateIso.localeCompare(y.dateIso));
  const last = reviews[reviews.length - 1];
  const reviewDue = !last || daysBetween(last.dateIso, inp.asOfIso) >= interval;
  const base = { needed, reviewDue, basis: 'isc-synthesis' as const, handover: [] as Bilingual[], missing: [] as Bilingual[] };

  // 1. Event handling with the persistence test.
  const ev = inp.event && inp.event.type !== 'none' ? inp.event : null;
  if (ev && (ev.type === 'market-shock' || ev.type === 'supplier-failure')) {
    const dur = ev.expectedDurationDays; const surv = ev.timeToSurviveDays;
    if (dur == null || surv == null) {
      const missing: Bilingual[] = [];
      if (dur == null) missing.push(b('Expected length of the disruption', 'المدة المتوقعة للانقطاع'));
      if (surv == null) missing.push(b('How many days we can run without this supply', 'عدد الأيام التي نستطيع فيها العمل دون هذا الإمداد'));
      return { ...base, decision: 'need-facts', candidate: null, consecutive: 0, missing,
        headline: b('Two facts are needed before deciding if this is a short shock or a lasting change.', 'نحتاج حقيقتين قبل الحسم: هل هي صدمة قصيرة أم تغيّر دائم.'),
        reasons: [b('ISC does not guess: the persistence test compares the disruption length with the time we can survive.', 'لا تخمّن ISC: يقارن اختبار الاستمرارية مدة الانقطاع بمدة صمودنا.')] };
    }
    if (dur < surv) {
      return { ...base, decision: 'situational', candidate: null, consecutive: 0,
        headline: b('Short shock: bridge it, do not change the contract strategy.', 'صدمة قصيرة: غطِّها مؤقتًا ولا تغيّر استراتيجية العقد.'),
        reasons: [b(`Expected disruption (${dur} days) is shorter than the time we can survive (${surv} days).`, `الانقطاع المتوقع (${dur} يومًا) أقصر من مدة صمودنا (${surv} يومًا).`),
          b('Use stock, spot buys or a temporary source with an expiry date. Re-check at the next review.', 'استخدم المخزون أو الشراء الفوري أو مصدرًا مؤقتًا بتاريخ انتهاء. أعد الفحص في المراجعة القادمة.')],
        handover: [b('Keep the current quadrant controls unchanged.', 'أبقِ ضوابط الربع الحالي كما هي.')] };
    }
    // else long enough: falls through to a structural check below.
  }

  if (!last) {
    return { ...base, decision: 'review-due', candidate: null, consecutive: 0,
      headline: b('No review on record yet. Record the first review.', 'لا توجد مراجعة مسجّلة بعد. سجّل المراجعة الأولى.'),
      reasons: [b('A first review sets the baseline for later moves.', 'المراجعة الأولى تضع خط الأساس لأي انتقال لاحق.')] };
  }

  // 2. Hysteresis: how long has the item sat in a different quadrant?
  let consecutive = 0;
  for (let i = reviews.length - 1; i >= 0; i--) {
    if (reviews[i].quadrant === last.quadrant) consecutive += 1; else break;
  }
  if (last.quadrant === inp.confirmedQuadrant) {
    return { ...base, decision: reviewDue ? 'review-due' : 'hold', candidate: null, consecutive,
      headline: reviewDue
        ? b('Same quadrant, but the calendar review is due.', 'الربع نفسه، لكن موعد المراجعة الدورية حان.')
        : b('Hold: the position is stable.', 'أبقِ الوضع: الموقع مستقر.'),
      reasons: [b(`Latest review still places it in ${QUADRANT_NAME[last.quadrant].en}.`, `ما زالت آخر مراجعة تضعه في ${QUADRANT_NAME[last.quadrant].ar}.`)] };
  }

  const candidate = last.quadrant;
  const farEnough = (() => {
    const r = last.riskPct; const p = last.profitPct;
    if (r == null || p == null) return false;
    const dr = Math.abs(r - boundary); const dp = Math.abs(p - boundary);
    // Only axes that actually differ between the two quadrants must clear the margin.
    const riskChanged = (inp.confirmedQuadrant === 'strategic' || inp.confirmedQuadrant === 'bottleneck') !== (candidate === 'strategic' || candidate === 'bottleneck');
    const profitChanged = (inp.confirmedQuadrant === 'strategic' || inp.confirmedQuadrant === 'leverage') !== (candidate === 'strategic' || candidate === 'leverage');
    return (!riskChanged || dr >= margin) && (!profitChanged || dp >= margin);
  })();

  const from = QUADRANT_NAME[inp.confirmedQuadrant]; const to = QUADRANT_NAME[candidate];
  if (consecutive >= needed || farEnough) {
    return { ...base, decision: 'confirm-move', candidate, consecutive,
      headline: b(`Confirm the move from ${from.en} to ${to.en}.`, `أكّد الانتقال من ${from.ar} إلى ${to.ar}.`),
      reasons: [
        consecutive >= needed
          ? b(`${consecutive} consecutive reviews place it in ${to.en} (needed ${needed}).`, `${consecutive} مراجعات متتالية تضعه في ${to.ar} (المطلوب ${needed}).`)
          : b(`It sits at least ${margin} points beyond the boundary, so one review is enough.`, `يبعد ${margin} نقاط على الأقل عن الحد، فتكفي مراجعة واحدة.`),
      ],
      handover: [
        b(`Apply the ${to.en} playbook, contract and due-diligence depth.`, `طبّق دليل العمل والعقد وعمق العناية الواجبة الخاصة بـ ${to.ar}.`),
        b('Run a side-effect check: does the move expose a dependence or drop a control that still matters?', 'أجرِ فحص الآثار الجانبية: هل يكشف الانتقال اعتمادًا أو يُسقط ضابطًا ما زال مهمًا؟'),
        b('Log the trigger, the evidence and the date in the movement log.', 'سجّل المحفّز والدليل والتاريخ في سجل الانتقالات.'),
      ] };
  }
  return { ...base, decision: 'watch', candidate, consecutive,
    headline: b(`Watch: it looks like ${to.en}, but one review is not enough.`, `راقب: يبدو أنه ${to.ar}، لكن مراجعة واحدة لا تكفي.`),
    reasons: [b(`${consecutive} of ${needed} consecutive reviews. Keep the ${from.en} controls, especially exit and due diligence, until confirmed.`, `${consecutive} من ${needed} مراجعات متتالية. أبقِ ضوابط ${from.ar}، وخاصة الخروج والعناية الواجبة، حتى التأكيد.`)],
    handover: [b(`Keep the ${from.en} controls in place.`, `أبقِ ضوابط ${from.ar} قائمة.`), b('Re-score at the next review or sooner if a trigger event occurs.', 'أعد التقييم في المراجعة القادمة أو أبكر إذا وقع حدث محفِّز.')] };
}
