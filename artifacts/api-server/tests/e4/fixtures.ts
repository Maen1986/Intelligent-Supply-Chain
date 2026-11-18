/**
 * E4 conformance suite, round 1: injected clock and golden datasets.
 * Card RM-04 v7, decision D10 [C172]: the shared checks live in one E4 suite.
 * No wall-clock reads: every date below is fixed.
 */
export const ORG_A = 101;
export const ORG_B = 202;
export const USER_A = 11;
export const USER_B = 22;

/** A clock that only moves when the test moves it. */
export function fixedClock(startIso = '2026-11-18T09:00:00.000Z') {
  let t = new Date(startIso).getTime();
  const clock = () => new Date(t);
  return Object.assign(clock, {
    advanceHours(h: number) { t += h * 3_600_000; },
    set(iso: string) { t = new Date(iso).getTime(); },
  });
}

/** Deterministic golden dataset: n risks, same every run (G50 = 50). */
export function goldenRisks(n: number) {
  const events = [
    'Port congestion delays inbound containers', 'Single-source supplier fails an audit',
    'Currency move raises landed cost', 'Cyber incident at a logistics partner',
    'Key customer cancels a forecast', 'Cold-chain breach during transit',
  ];
  return Array.from({ length: n }, (_, i) => ({
    key: `golden-${n}-${i + 1}`,
    input: {
      event: `${events[i % events.length]} (${i + 1})`,
      cause: `Cause ${i + 1}`, consequence: `Consequence ${i + 1}`,
      lang: (i % 7 === 6 ? 'ar' : 'en') as 'en' | 'ar',
      ownerUserId: i % 5 === 0 ? null : USER_A,
      reviewDate: `2027-0${(i % 9) + 1}-15`,
    },
  }));
}

/** An Arabic fixture with Arabic-Indic digits and a bidi override that must survive storage byte for byte. */
export const ARABIC_FIXTURE = {
  event: 'تأخر وصول الشحنة R-0001 بمقدار ٣٠٠ حاوية و 300 حاوية',
  cause: 'ازدحام الميناء', consequence: 'ارتفاع التكلفة', lang: 'ar' as const,
};
