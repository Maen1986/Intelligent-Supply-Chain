/**
 * Supplier Preferencing overlay and relationship lens (Round B5, items 6 and 15).
 *
 * Item 6  Two supplier-side inputs (account value, account attractiveness) with
 *         an evidence field give the supplier's view of us (Steele & Court's
 *         Core / Development / Exploitable / Nuisance, as CIPS presents them).
 *         Overlaid on the Kraljic quadrant this gives a 4 x 4 grid of 16 cues.
 *         SOURCING HONESTY: CIPS says the overlay yields "16 different
 *         scenarios" but lists none openly (member-only guide). The cue text
 *         below is an ISC synthesis of CIPS's two open statements (the buyer
 *         advice per preferencing quadrant and the Kraljic action). It is a cue
 *         for discussion, not CIPS content. The axis reading (value = size and
 *         profit of the account, attractiveness = how easy and appealing the
 *         account is) is ISC's reading and should be checked against the CIPS
 *         guide. Supplier perception is best captured by short surveys (CIPS
 *         L5M6 3.3.6; PwC perception surveys).
 * Item 15 Optional lens: supplier capabilities x willingness (Rezaei & Ortt).
 *         The concept is sourced; the four segment names and actions are ISC's.
 *         The Olsen & Ellram relationship grid is named for reference only: its
 *         source text was not opened, so it is not built.
 *
 * STANDALONE-FIRST: no runtime imports from other engines (wording only).
 */
import { PREFERENCING_LABEL, type PreferencingKey } from './kraljicCipsWording';

export type Bilingual = { en: string; ar: string };
export type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';
export type HighLow = 'high' | 'low';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

export interface SpInputs {
  accountValue: HighLow | null;
  attractiveness: HighLow | null;
  evidence: string;
}

export const SP_NOTE: Bilingual = b(
  'ISC synthesis of CIPS\'s two open statements (buyer advice per preferencing quadrant, and the Kraljic action). CIPS says the overlay gives 16 scenarios but publishes none openly. This is a cue for discussion, not CIPS content.',
  'تركيب من ISC لعبارتين منشورتين في CIPS (نصيحة المشتري لكل ربع تفضيل، وإجراء Kraljic). تذكر CIPS أن التراكب يعطي 16 سيناريو لكنها لا تنشر أيًّا منها علنًا. هذه إشارة للنقاش وليست محتوى من CIPS.',
);

export const SP_AXIS_NOTE: Bilingual = b(
  'Account value: how large and profitable we are to the supplier. Attractiveness: how easy and appealing we are to work with. This reading is ISC\'s: check it against the CIPS guide before external use.',
  'قيمة الحساب: مدى كبر حجمنا وربحيتنا بالنسبة إلى المورد. الجاذبية: مدى سهولتنا وجاذبيتنا في التعامل. هذه قراءة من ISC: تحقق منها مقابل دليل CIPS قبل أي استخدام خارجي.',
);

/** The supplier's view of us from the two inputs. null while either input is missing. */
export function spQuadrant(i: SpInputs): PreferencingKey | null {
  if (i.accountValue === null || i.attractiveness === null) return null;
  if (i.accountValue === 'high') return i.attractiveness === 'high' ? 'core' : 'exploitable';
  return i.attractiveness === 'high' ? 'development' : 'nuisance';
}

const GRID: Record<Quadrant, Record<PreferencingKey, Bilingual>> = {
  strategic: {
    core: b('Sustain the partnership through mutual value; keep a credible alternative.', 'حافظ على الشراكة بقيمة متبادلة، وأبقِ بديلًا موثوقًا.'),
    development: b('Partnership needed but the supplier sees growth only: discuss future value and build your own power base.', 'الشراكة ضرورية لكن المورد يرى فيك فرصة نمو فقط: ناقش القيمة المستقبلية وابنِ قاعدة قوتك.'),
    exploitable: b('Do not over-leverage; work on strategic alignment and plan to reduce dependence.', 'لا تفرط في استخدام قوتك؛ اعمل على التوافق الاستراتيجي وخطط لتقليل الاعتماد.'),
    nuisance: b('Highest exposure: raise attractiveness or open alternatives now.', 'أعلى انكشاف: ارفع جاذبية حسابك أو افتح بدائل الآن.'),
  },
  leverage: {
    core: b('Tender, but protect your Core standing; expect strong service.', 'اطرح مناقصة مع حماية مكانتك كعميل أساسي؛ وتوقّع خدمة قوية.'),
    development: b('Tender while sharing forecasts to keep the supplier\'s interest.', 'اطرح مناقصة مع مشاركة التوقعات للحفاظ على اهتمام المورد.'),
    exploitable: b('Tender with restraint; premium pricing is a risk.', 'اطرح مناقصة بتحفظ؛ فخطر التسعير المرتفع قائم.'),
    nuisance: b('Easiest to switch: tender freely and consider alternatives.', 'الأسهل تحويلًا: اطرح مناقصة بحرية وانظر في البدائل.'),
  },
  bottleneck: {
    core: b('Use priority status to secure supply for the medium term and de-risk the specification.', 'استفد من أولويتك لتأمين الإمداد على المدى المتوسط وخفّض مخاطر المواصفة.'),
    development: b('Use the growth story to win supply; qualify a second source.', 'استخدم قصة النمو لكسب الإمداد، وأهّل مصدرًا ثانيًا.'),
    exploitable: b('Expect price pressure; seek alternatives and relax the specification.', 'توقّع ضغطًا على السعر؛ ابحث عن بدائل وخفّف المواصفة.'),
    nuisance: b('The supplier may phase you out: re-specify or re-source urgently.', 'قد يتخلى عنك المورد تدريجيًا: أعد المواصفة أو أعد التوريد بصورة عاجلة.'),
  },
  'non-critical': {
    core: b('Do not spend relationship effort; simplify.', 'لا تبذل جهدًا في العلاقة؛ بسّط.'),
    development: b('Minimal effort; pooling may lift your attractiveness.', 'جهد أدنى؛ وقد يرفع التجميع جاذبية حسابك.'),
    exploitable: b('Standardise and pool.', 'وحّد المواصفات وجمّع الطلب.'),
    nuisance: b('Systems contracting; rationalise suppliers.', 'عقود نظامية وترشيد عدد الموردين.'),
  },
};

export interface SpCue {
  sp: PreferencingKey | null;
  spLabel: Bilingual | null;
  cue: Bilingual | null;
  /** True when the two inputs are set but no evidence was recorded. */
  noEvidence: boolean;
  ask: Bilingual | null;
}

export function spCue(quadrant: Quadrant, i: SpInputs): SpCue {
  const sp = spQuadrant(i);
  if (!sp) {
    return {
      sp: null, spLabel: null, cue: null, noEvidence: false,
      ask: b('Answer both questions about how the supplier sees us. ISC does not guess.', 'أجب عن السؤالين حول نظرة المورد إلينا. لا تخمّن ISC.'),
    };
  }
  return { sp, spLabel: PREFERENCING_LABEL[sp], cue: GRID[quadrant][sp], noEvidence: i.evidence.trim().length === 0, ask: null };
}

/** All 16 cells, for the reference grid and for tests. */
export function allSpCells(): Array<{ quadrant: Quadrant; sp: PreferencingKey; cue: Bilingual }> {
  const qs: Quadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
  const ps: PreferencingKey[] = ['core', 'development', 'exploitable', 'nuisance'];
  return qs.flatMap((quadrant) => ps.map((sp) => ({ quadrant, sp, cue: GRID[quadrant][sp] })));
}

// ---------------------------------------------------------------------------
// Item 15: capabilities x willingness lens (optional)
// ---------------------------------------------------------------------------

export type LensKey = 'invest' | 'build' | 'win' | 'simple';

export interface LensInputs { capability: HighLow | null; willingness: HighLow | null }

export interface LensResult { key: LensKey; label: Bilingual; action: Bilingual }

export const LENS_NOTE: Bilingual = b(
  'Optional lens for firms with many suppliers. The idea (supplier capabilities against willingness) is Rezaei & Ortt\'s. The segment names and actions are ISC\'s. The Olsen & Ellram grid is not built: its source text was not opened.',
  'عدسة اختيارية للشركات ذات القاعدة الكبيرة من الموردين. الفكرة (قدرات المورد مقابل استعداده) لـ Rezaei وOrtt. أما أسماء الشرائح والإجراءات فمن ISC. شبكة Olsen وEllram غير مبنية: لم يُفتح نصها المصدري.',
);

const LENS: Record<LensKey, LensResult> = {
  invest: { key: 'invest', label: b('Invest together', 'استثمرا معًا'), action: b('Joint development and longer commitment where the item is Critical; otherwise keep the relationship efficient.', 'تطوير مشترك والتزام أطول حيث يكون البند حرجًا؛ وإلا فأبقِ العلاقة فعّالة.') },
  build: { key: 'build', label: b('Build capability', 'ابنِ القدرة'), action: b('The supplier wants to serve us but lacks capability: give clear specifications, a development plan and support.', 'المورد راغب في خدمتنا لكنه يفتقر إلى القدرة: قدّم مواصفات واضحة وخطة تطوير ودعمًا.') },
  win: { key: 'win', label: b('Win commitment', 'اكسب الالتزام'), action: b('The supplier is capable but not committed: raise your attractiveness (forecasts, term, prompt payment) or accept a transactional relationship.', 'المورد قادر لكنه غير ملتزم: ارفع جاذبيتك (توقعات، مدة، سداد سريع) أو اقبل علاقة تعاملية.') },
  simple: { key: 'simple', label: b('Keep it simple or replace', 'أبقِ الأمر بسيطًا أو استبدل'), action: b('Keep the relationship transactional, or replace the supplier if the item matters.', 'أبقِ العلاقة تعاملية، أو استبدل المورد إن كان البند مهمًا.') },
};

export function lensSegment(i: LensInputs): LensResult | null {
  if (i.capability === null || i.willingness === null) return null;
  if (i.capability === 'high') return i.willingness === 'high' ? LENS.invest : LENS.win;
  return i.willingness === 'high' ? LENS.build : LENS.simple;
}
