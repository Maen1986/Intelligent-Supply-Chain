/**
 * Kraljic -> Module 04 (qualification / due diligence) and Module 06
 * (commercial intelligence) hand-offs. Round B6, 2 Nov 2026.
 *
 * Plain-data functions only (SI-00 standalone-first): no runtime import from
 * M04 or M06. Each function returns exactly the inputs the other module
 * already takes, plus a bilingual reason, so a screen can pass them on.
 * The tier rule below deliberately repeats M04's published rule; a test checks
 * the two stay identical, so if M04's rule changes the test fails.
 *
 * Basis: the quadrant -> due-diligence rule is M04's (criticality tiering, as
 * in OECD / third-party-risk practice). The 'stance' wording is ISC CONVENTION
 * (Kraljic 1983 and Gelderman & van Weele 2003 give the quadrant strategies;
 * the per-sub-type stance is ISC's own reading) and is labelled as such.
 */
import { SUBTYPES, type Bilingual, type Quadrant, type SubtypeKey } from './supplierKraljicSubtypes';

export type DueDiligenceTierLink = 'STANDARD' | 'ENHANCED';

export interface DueDiligenceHandoff {
  module: 'M04';
  /** Pass as `kraljicQuadrant` to M04 determineDueDiligenceTier. Undefined = not classified. */
  kraljicQuadrant: Quadrant | undefined;
  /** Pass as `geographicRisk` (1-5) when known. */
  geographicRisk: number | undefined;
  tier: DueDiligenceTierLink;
  reason: Bilingual;
  basis: 'M04 rule (criticality tiering)';
}

export function quadrantOfSubtype(key: SubtypeKey): Quadrant | undefined {
  return SUBTYPES[key]?.quadrant ?? undefined;
}

export function dueDiligenceHandoff(input: {
  subtype: SubtypeKey;
  quadrant?: Quadrant | null;
  geographicRisk?: number | null;
}): DueDiligenceHandoff {
  const quadrant = input.quadrant ?? quadrantOfSubtype(input.subtype);
  const geo = typeof input.geographicRisk === 'number' && Number.isFinite(input.geographicRisk) ? input.geographicRisk : undefined;
  const critical = quadrant === 'strategic' || quadrant === 'bottleneck';
  const geoHigh = geo !== undefined && geo >= 4;
  const tier: DueDiligenceTierLink = critical || geoHigh ? 'ENHANCED' : 'STANDARD';
  let reason: Bilingual;
  if (!quadrant && geo === undefined) {
    reason = {
      en: 'Not classified and no geographic risk given, so the standard depth applies. Classify the supplier to check whether it needs more.',
      ar: 'المورد غير مصنَّف ولم تُدخل مخاطر جغرافية، لذا يُطبَّق العمق القياسي. صنّف المورد لتعرف إن كان يحتاج أكثر.',
    };
  } else if (critical && geoHigh) {
    reason = {
      en: 'Strategic or bottleneck supplier and high geographic risk: enhanced due diligence.',
      ar: 'مورد استراتيجي أو اختناق ومخاطر جغرافية عالية: عناية واجبة معززة.',
    };
  } else if (critical) {
    reason = {
      en: 'Strategic or bottleneck suppliers are hard to replace, so they get enhanced due diligence.',
      ar: 'من الصعب استبدال الموردين الاستراتيجيين وموردي الاختناق، لذا يخضعون لعناية واجبة معززة.',
    };
  } else if (geoHigh) {
    reason = {
      en: 'High geographic risk (4 or 5 of 5): enhanced due diligence.',
      ar: 'مخاطر جغرافية عالية (4 أو 5 من 5): عناية واجبة معززة.',
    };
  } else {
    reason = {
      en: 'Leverage or non-critical supplier with no high geographic risk: standard due diligence.',
      ar: 'مورد نفوذ أو غير حرج دون مخاطر جغرافية عالية: عناية واجبة قياسية.',
    };
  }
  return { module: 'M04', kraljicQuadrant: quadrant, geographicRisk: geo, tier, reason, basis: 'M04 rule (criticality tiering)' };
}

export type NegotiationStance = 'buyer-strong' | 'balanced' | 'supplier-strong' | 'not-classified';

export interface NegotiationHandoff {
  module: 'M06';
  /** Pass as `kraljicQuadrant` to M06 / recommendClientTactics. Undefined = not classified. */
  kraljicQuadrant: Quadrant | undefined;
  stance: NegotiationStance;
  stanceNote: Bilingual;
  basis: 'ISC convention';
}

const STANCE: Partial<Record<SubtypeKey, NegotiationStance>> = {
  'bottleneck-movable': 'balanced',
  'bottleneck-locked': 'supplier-strong',
  'bottleneck-situational': 'supplier-strong',
  'leverage-stable': 'buyer-strong',
  'leverage-volatile': 'buyer-strong',
  'noncritical-pool': 'buyer-strong',
  'noncritical-process': 'buyer-strong',
  'strategic-exploit': 'buyer-strong',
  'strategic-balance': 'balanced',
  'strategic-diversify': 'supplier-strong',
};

const NOTE: Record<NegotiationStance, Bilingual> = {
  'buyer-strong': {
    en: 'You hold the stronger position. Use competition and volume, but only threaten an exit you can carry out.',
    ar: 'موقفك هو الأقوى. استخدم المنافسة والحجم، ولا تهدد بخروج لا تستطيع تنفيذه.',
  },
  balanced: {
    en: 'Neither side can walk away easily. Negotiate for a joint gain and protect the relationship.',
    ar: 'لا يستطيع أي طرف الانسحاب بسهولة. تفاوض على مكسب مشترك واحمِ العلاقة.',
  },
  'supplier-strong': {
    en: 'The supplier holds the stronger position. Do not lead with price pressure; secure supply, build alternatives, and ask for terms that reduce your exposure.',
    ar: 'موقف المورد هو الأقوى. لا تبدأ بضغط السعر؛ أمّن التوريد وابنِ بدائل واطلب شروطًا تقلل انكشافك.',
  },
  'not-classified': {
    en: 'Not classified yet, so no negotiation stance is suggested. Fill in the missing supplier facts first.',
    ar: 'لم يُصنَّف بعد، لذا لا يُقترح موقف تفاوضي. أكمل بيانات المورد الناقصة أولًا.',
  },
};

export function negotiationHandoff(input: { subtype: SubtypeKey; quadrant?: Quadrant | null }): NegotiationHandoff {
  const quadrant = input.quadrant ?? quadrantOfSubtype(input.subtype);
  const stance = STANCE[input.subtype] ?? 'not-classified';
  return { module: 'M06', kraljicQuadrant: quadrant, stance, stanceNote: NOTE[stance], basis: 'ISC convention' };
}
