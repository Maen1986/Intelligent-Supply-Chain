/**
 * SI Module 02 extension -- the Kraljic sub-type NETWORK, quadrant ideas and
 * the management report (Round B4, Nov 2026).
 *
 * THE STRUCTURE: Kraljic's matrix is a plane with two axes, profit impact
 * (spend) and supply risk. Every sub-type is a POSITION on that plane. Every
 * move between positions is a movement along one axis:
 *   - RISK axis   : alternatives qualified, specification loosened, failures
 *                   recur, a shortage persists.
 *   - IMPACT axis : spend grows or shrinks, demand is pooled.
 *   - POWER axis  : who holds the power inside Strategic (Kraljic's exploit /
 *                   balance / diversify).
 *   - MARKET axis : a Leverage market turns volatile or calms down.
 * So a move INSIDE a quadrant and a move ACROSS quadrants are the same kind of
 * thing, and the graph below links every sub-type to every other reachable one.
 *
 * Axis logic corrects a trap: a Bottleneck whose supply risk falls moves toward
 * NON-CRITICAL (low spend, low risk), not to Leverage. Leverage needs high
 * spend, so the only way into Leverage is for impact to rise (e.g. pooling).
 *
 * SOURCING: the hold-or-move logic and move directions come from Gelderman &
 * van Weele (2003) and exploit/balance/diversify from Kraljic (1983). Edges
 * marked 'isc-convention' are ISC's own structure; the quadrant "big ideas"
 * are ISC thinking and are labelled as such. Nothing here is a score.
 *
 * Standalone-first: plain data in, plain data out; the only import is this
 * module family's own sub-type engine.
 */
import {
  SUBTYPES, assess,
  type Bilingual, type Basis, type Quadrant, type SubtypeKey,
  type SubtypeSupplierInput, type SubtypeAssessment, type Severity,
} from './supplierKraljicSubtypes';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

// ---------------------------------------------------------------------------
// 1. The network: every move between sub-types
// ---------------------------------------------------------------------------

export type Axis = 'risk' | 'impact' | 'power' | 'market';
export type Direction = 'de-risk' | 'raise-risk' | 'lateral';
export type Effort = 'low' | 'medium' | 'high';

export interface Transition {
  id: string;
  from: SubtypeKey;
  to: SubtypeKey;
  axis: Axis;
  direction: Direction;
  effort: Effort;
  /** What has to become true for the supplier to be in the new position. */
  trigger: Bilingual;
  /** The playbook for making (or preventing) the move. */
  steps: Bilingual[];
  /** What the move buys (or costs) the client. */
  payoff: Bilingual;
  basis: Basis;
}

const GW = 'sourced' as const;
const IC = 'isc-convention' as const;

const T = (
  id: string, from: SubtypeKey, to: SubtypeKey, axis: Axis, direction: Direction, effort: Effort,
  trigger: Bilingual, steps: Bilingual[], payoff: Bilingual, basis: Basis,
): Transition => ({ id, from, to, axis, direction, effort, trigger, steps, payoff, basis });

const QUALIFY: Bilingual[] = [
  b('List who else could supply this and what would have to change for them to do it.', 'حدّد من يستطيع التوريد وما الذي يجب أن يتغير ليتمكن من ذلك.'),
  b('Run the best candidate through the qualification and due-diligence gates (M04).', 'مرّر أفضل مرشح عبر بوابات التأهيل والعناية الواجبة (M04).'),
  b('Place a small trial order and record the result.', 'ضع طلب تجربة صغيرًا وسجّل النتيجة.'),
  b('Update the supplier\'s facts so the sub-type re-classifies itself.', 'حدّث حقائق المورد ليُعاد تصنيف النوع الفرعي تلقائيًا.'),
];

export const TRANSITIONS: Transition[] = [
  // ---- Bottleneck: inside the quadrant -----------------------------------
  T('bn-locked-to-movable', 'bottleneck-locked', 'bottleneck-movable', 'risk', 'de-risk', 'high',
    b('A qualified alternative appears, or the specification can be loosened.', 'يظهر بديل مؤهَّل أو يصبح تخفيف المواصفة ممكنًا.'), QUALIFY,
    b('Ends the lock-in. The security premium and the contingency burden can start to come down.', 'ينهي القيد. يمكن أن تبدأ علاوة الأمان وعبء خطة الطوارئ بالانخفاض.'), GW),
  T('bn-situational-to-locked', 'bottleneck-situational', 'bottleneck-locked', 'risk', 'raise-risk', 'medium',
    b('The "temporary" shortage outlasts its review date and no alternative exists.', 'يتجاوز النقص «المؤقت» تاريخ مراجعته ولا يوجد بديل.'),
    [b('Reclassify as structural and write the contingency plan.', 'أعد التصنيف كقيد هيكلي واكتب خطة الطوارئ.'), b('Start the long-horizon search for a second source.', 'ابدأ البحث طويل الأمد عن مصدر ثانٍ.')],
    b('Stops a bridge from silently becoming a permanent dependence.', 'يمنع تحوّل الحل المؤقت بصمت إلى اعتماد دائم.'), IC),
  T('bn-situational-to-movable', 'bottleneck-situational', 'bottleneck-movable', 'risk', 'de-risk', 'medium',
    b('The shortage persists but a qualified alternative now exists.', 'يستمر النقص لكن أصبح هناك بديل مؤهَّل.'), QUALIFY,
    b('Turns a crisis response into a planned move.', 'يحوّل الاستجابة للأزمة إلى انتقال مخطَّط.'), IC),

  // ---- Bottleneck -> Non-critical (risk falls, spend stays low) -----------
  T('bn-movable-to-nc-pool', 'bottleneck-movable', 'noncritical-pool', 'risk', 'de-risk', 'medium',
    b('Two or more qualified alternatives and the demand can be combined.', 'بديلان مؤهَّلان أو أكثر ويمكن تجميع الطلب.'),
    [b('Retire the security terms (buffer stock, long lock-in).', 'ألغِ شروط الأمان (مخزون احتياطي وقيود طويلة).'), b('Put the item under a framework agreement.', 'ضع البند تحت اتفاقية إطارية.')],
    b('Lower cost and effort: the item leaves the high-risk box.', 'تكلفة وجهد أقل: يغادر البند الربع عالي المخاطر.'), GW),
  T('bn-movable-to-nc-process', 'bottleneck-movable', 'noncritical-process', 'risk', 'de-risk', 'low',
    b('Alternatives exist and the demand cannot be combined.', 'توجد بدائل ولا يمكن تجميع الطلب.'),
    [b('Retire the security terms.', 'ألغِ شروط الأمان.'), b('Move to a purchase card or catalogue.', 'انتقل إلى بطاقة شراء أو كتالوج.')],
    b('The team stops spending attention on a solved problem.', 'يتوقف الفريق عن صرف الانتباه على مشكلة حُلّت.'), GW),
  T('bn-situational-to-nc-process', 'bottleneck-situational', 'noncritical-process', 'risk', 'de-risk', 'low',
    b('The shortage ends and the market recovers.', 'ينتهي النقص ويتعافى السوق.'),
    [b('Close the bridge and release any temporary stock.', 'أنهِ الحل المؤقت وحرّر المخزون المؤقت.'), b('Return to normal ordering.', 'عُد إلى الطلب العادي.')],
    b('Releases cash and attention held by the emergency.', 'يحرّر النقد والانتباه المحتجزين بسبب الطارئ.'), IC),

  // ---- Bottleneck -> Strategic (impact rises) -----------------------------
  T('bn-locked-to-strategic', 'bottleneck-locked', 'strategic-diversify', 'impact', 'raise-risk', 'high',
    b('Spend with this supplier grows until it is material and the supplier still holds the power.', 'ينمو الإنفاق مع المورد حتى يصبح جوهريًا ويظل المورد صاحب القوة.'),
    [b('Open a joint plan and a power read at executive level.', 'افتح خطة مشتركة وقراءة للقوة على مستوى الإدارة العليا.'), b('Fund a second source or own capability.', 'موّل مصدرًا ثانيًا أو قدرة ذاتية.')],
    b('Catches the moment a small awkward item becomes a business risk.', 'يلتقط لحظة تحوّل بند صغير مزعج إلى مخاطرة على العمل.'), IC),

  // ---- Leverage -----------------------------------------------------------
  T('lv-stable-to-volatile', 'leverage-stable', 'leverage-volatile', 'market', 'lateral', 'low',
    b('Prices start to swing.', 'تبدأ الأسعار بالتقلب.'),
    [b('Replace the fixed price with an index-linked clause (M03).', 'استبدل السعر الثابت ببند مرتبط بمؤشر (M03).'), b('Shorten the price-validity window.', 'قصّر مدة صلاحية السعر.')],
    b('Shares the swing instead of letting one side absorb it.', 'يتقاسم التقلب بدل أن يتحمله طرف واحد.'), IC),
  T('lv-volatile-to-stable', 'leverage-volatile', 'leverage-stable', 'market', 'lateral', 'low',
    b('Prices settle.', 'تستقر الأسعار.'),
    [b('Tender on a fixed price for a longer period.', 'اطرح مناقصة على سعر ثابت لمدة أطول.')],
    b('Locks in a calm market at a good price.', 'يثبّت سوقًا هادئًا بسعر جيد.'), IC),
  T('lv-stable-to-strategic', 'leverage-stable', 'strategic-balance', 'risk', 'raise-risk', 'high',
    b('Failures recur or switching becomes costly, so the supplier is harder to replace than the position assumes.', 'تتكرر الإخفاقات أو يصبح التبديل مكلفًا فيصعب استبدال المورد أكثر مما يفترضه موقعه.'),
    [b('Check whose problem it is first (cause mix, M07).', 'افحص صاحب المشكلة أولًا (توزيع الأسباب، M07).'), b('Either re-tender, or move to a managed partnership with shared targets.', 'إما إعادة المناقصة أو الانتقال إلى شراكة مُدارة بأهداف مشتركة.')],
    b('Stops you running a risky supplier as if it were a commodity.', 'يمنع إدارة مورد خطِر كأنه سلعة.'), GW),
  T('lv-volatile-to-strategic', 'leverage-volatile', 'strategic-balance', 'risk', 'raise-risk', 'high',
    b('Failures recur or switching becomes costly in a volatile market.', 'تتكرر الإخفاقات أو يصبح التبديل مكلفًا في سوق متقلب.'),
    [b('Check the cause mix (M07).', 'افحص توزيع الأسباب (M07).'), b('Re-tender or build a managed partnership.', 'أعد المناقصة أو ابنِ شراكة مُدارة.')],
    b('As above, with price risk handled by an index clause.', 'كما سبق، مع معالجة مخاطر السعر ببند مؤشر.'), GW),
  T('lv-stable-to-bottleneck', 'leverage-stable', 'bottleneck-movable', 'impact', 'lateral', 'low',
    b('Spend falls so the item no longer matters financially, while the supplier base is thin.', 'ينخفض الإنفاق فلا يعود البند مؤثرًا ماليًا بينما قاعدة الموردين ضيقة.'),
    [b('Downgrade to Bottleneck handling and qualify one more source.', 'خفّضه إلى معالجة الاختناق وأهّل مصدرًا إضافيًا.')],
    b('Right-sizes attention to the new, smaller exposure.', 'يوجّه الانتباه إلى الانكشاف الجديد الأصغر.'), IC),
  T('lv-stable-to-nc-pool', 'leverage-stable', 'noncritical-pool', 'impact', 'lateral', 'low',
    b('Spend falls below what justifies a tender.', 'ينخفض الإنفاق دون ما يبرر المناقصة.'),
    [b('Move to a framework agreement and stop re-tendering.', 'انتقل إلى اتفاقية إطارية وتوقف عن إعادة المناقصة.')],
    b('Saves tender effort that no longer pays back.', 'يوفّر جهد مناقصات لم تعد تعود بالنفع.'), IC),

  // ---- Non-critical ------------------------------------------------------
  T('nc-process-to-pool', 'noncritical-process', 'noncritical-pool', 'impact', 'lateral', 'low',
    b('Demand across sites or categories can now be combined.', 'أصبح بالإمكان تجميع الطلب عبر المواقع أو الفئات.'),
    [b('Map the same item across sites and combine it under one agreement.', 'ارصد البند نفسه عبر المواقع وادمجه تحت اتفاقية واحدة.')],
    b('First step toward a price you can negotiate.', 'الخطوة الأولى نحو سعر يمكن التفاوض عليه.'), GW),
  T('nc-pool-to-leverage-stable', 'noncritical-pool', 'leverage-stable', 'impact', 'lateral', 'medium',
    b('Pooled spend becomes large enough to matter and the market is steady.', 'يصبح الإنفاق المجمّع كبيرًا بما يكفي ليؤثر والسوق مستقر.'),
    [b('Tender the pooled demand.', 'اطرح الطلب المجمّع في مناقصة.'), b('Set a target price from the pooled volume.', 'حدّد سعرًا مستهدفًا من الحجم المجمّع.')],
    b('Turns scattered small buys into negotiating power.', 'يحوّل مشتريات صغيرة متفرقة إلى قوة تفاوضية.'), GW),
  T('nc-pool-to-leverage-volatile', 'noncritical-pool', 'leverage-volatile', 'impact', 'lateral', 'medium',
    b('Pooled spend becomes material and prices swing.', 'يصبح الإنفاق المجمّع جوهريًا والأسعار متقلبة.'),
    [b('Tender the pooled demand on a margin over an index.', 'اطرح الطلب المجمّع في مناقصة بهامش فوق مؤشر.')],
    b('Negotiating power without absorbing price swings.', 'قوة تفاوضية دون تحمّل تقلبات الأسعار.'), GW),
  T('nc-process-to-situational', 'noncritical-process', 'bottleneck-situational', 'risk', 'raise-risk', 'medium',
    b('A normally easy item becomes temporarily scarce.', 'يصبح بند عادة ما يكون سهلًا شحيحًا بشكل مؤقت.'),
    [b('Bridge with spot buys and set an end date.', 'غطِّ الفجوة بمشتريات فورية وحدّد تاريخ انتهاء.')],
    b('Early warning before routine ordering fails.', 'إنذار مبكر قبل أن يفشل الطلب الروتيني.'), IC),
  T('nc-pool-to-situational', 'noncritical-pool', 'bottleneck-situational', 'risk', 'raise-risk', 'medium',
    b('A pooled item becomes temporarily scarce.', 'يصبح بند مجمّع شحيحًا بشكل مؤقت.'),
    [b('Bridge and notify all sites sharing the agreement.', 'غطِّ الفجوة وأبلغ جميع المواقع المشاركة في الاتفاقية.')],
    b('One shared response instead of many panicked ones.', 'استجابة مشتركة واحدة بدل ردود فعل متسرعة متعددة.'), IC),

  // ---- Strategic: the power axis -----------------------------------------
  T('st-diversify-to-balance', 'strategic-diversify', 'strategic-balance', 'power', 'de-risk', 'high',
    b('A second source or own capability reduces the supplier\'s power.', 'يقلّل مصدر ثانٍ أو قدرة ذاتية من قوة المورد.'),
    [b('Qualify the second source (M04).', 'أهّل المصدر الثاني (M04).'), b('Shift a first tranche of volume to it.', 'انقل شريحة أولى من الحجم إليه.')],
    b('Your negotiating position stops depending on goodwill.', 'يتوقف موقعك التفاوضي عن الاعتماد على حسن النية.'), GW),
  T('st-balance-to-exploit', 'strategic-balance', 'strategic-exploit', 'power', 'de-risk', 'medium',
    b('The buyer\'s position strengthens (volume, alternatives, switching ability).', 'يقوى موقع المشتري (الحجم أو البدائل أو القدرة على التبديل).'),
    [b('Seek improved terms and shared-benefit clauses while the power lasts.', 'اطلب شروطًا أفضل وبنود تقاسم المنافع ما دامت القوة قائمة.')],
    b('Converts relative strength into value.', 'يحوّل القوة النسبية إلى قيمة.'), GW),
  T('st-exploit-to-balance', 'strategic-exploit', 'strategic-balance', 'power', 'raise-risk', 'low',
    b('The supplier\'s position strengthens or the relationship is strained.', 'يقوى موقع المورد أو تتوتر العلاقة.'),
    [b('Rebuild the joint plan and stop pressing on price.', 'أعد بناء الخطة المشتركة وتوقف عن الضغط على السعر.')],
    b('Protects a critical relationship.', 'يحمي علاقة حرجة.'), IC),
  T('st-balance-to-diversify', 'strategic-balance', 'strategic-diversify', 'power', 'raise-risk', 'medium',
    b('The supplier gains power (consolidation, capacity squeeze, new lock-in).', 'يكتسب المورد قوة (اندماج أو شح طاقة أو قيد جديد).'),
    [b('Start building an alternative now, while you still have leverage.', 'ابدأ ببناء بديل الآن وأنت ما زلت تملك نفوذًا.')],
    b('Acts before the dependence deepens.', 'يتصرف قبل أن يتعمق الاعتماد.'), GW),
  T('st-balance-to-leverage', 'strategic-balance', 'leverage-stable', 'risk', 'de-risk', 'medium',
    b('Supply risk falls (alternatives exist) so a partnership is no longer needed.', 'ينخفض خطر الإمداد (توجد بدائل) فلا حاجة إلى شراكة.'),
    [b('Terminate-and-re-source or re-tender (Gelderman & van Weele).', 'أنهِ وأعد التوريد أو أعد المناقصة (Gelderman & van Weele).')],
    b('Competition replaces a relationship you no longer need.', 'تحلّ المنافسة محل علاقة لم تعد بحاجة إليها.'), GW),
  T('st-exploit-to-leverage', 'strategic-exploit', 'leverage-stable', 'risk', 'de-risk', 'low',
    b('Supply risk is now low and the buyer is strong.', 'أصبح خطر الإمداد منخفضًا والمشتري قويًا.'),
    [b('Run it as a Leverage category: tender and bundle.', 'أدِره كفئة نفوذ شرائي: اطرح مناقصة وجمّع الكميات.')],
    b('Gets the commodity price for a commodity risk.', 'تحصل على سعر السلعة لقاء مخاطرة السلعة.'), GW),
  T('st-diversify-to-locked', 'strategic-diversify', 'bottleneck-locked', 'impact', 'lateral', 'low',
    b('Spend falls so the item no longer drives profit, but no alternative exists.', 'ينخفض الإنفاق فلا يعود البند يحرّك الربح لكن لا بديل.'),
    [b('Downgrade to Bottleneck handling: contingency and buffer, not executive attention.', 'خفّضه إلى معالجة الاختناق: خطة طوارئ ومخزون لا انتباه تنفيذي.')],
    b('Right-sizes attention to the new exposure.', 'يوجّه الانتباه إلى الانكشاف الجديد.'), IC),
];

export function outgoing(k: SubtypeKey): Transition[] { return TRANSITIONS.filter((t) => t.from === k); }
export function incoming(k: SubtypeKey): Transition[] { return TRANSITIONS.filter((t) => t.to === k); }
export function crossesQuadrant(t: Transition): boolean {
  return SUBTYPES[t.from].quadrant !== SUBTYPES[t.to].quadrant;
}

/** Shortest route (fewest moves) between two sub-types, or null if unreachable. */
export function findPath(from: SubtypeKey, to: SubtypeKey): Transition[] | null {
  if (from === to) return [];
  const prev = new Map<SubtypeKey, Transition>();
  const seen = new Set<SubtypeKey>([from]);
  const queue: SubtypeKey[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const t of outgoing(cur)) {
      if (seen.has(t.to)) continue;
      seen.add(t.to); prev.set(t.to, t);
      if (t.to === to) {
        const path: Transition[] = [];
        let k: SubtypeKey = to;
        while (k !== from) { const e = prev.get(k)!; path.unshift(e); k = e.from; }
        return path;
      }
      queue.push(t.to);
    }
  }
  return null;
}

/** The position ISC suggests aiming for. null = hold and exploit where you are. ISC convention. */
export const DEFAULT_GOAL: Partial<Record<SubtypeKey, SubtypeKey>> = {
  'bottleneck-locked': 'noncritical-process',
  'bottleneck-movable': 'noncritical-pool',
  'bottleneck-situational': 'noncritical-process',
  'noncritical-process': 'noncritical-pool',
  'noncritical-pool': 'leverage-stable',
  'strategic-diversify': 'strategic-balance',
  'strategic-balance': 'strategic-exploit',
};

export interface Route {
  from: SubtypeKey;
  goal: SubtypeKey | null;
  steps: Transition[];
  totalEffort: Effort | null;
  note: Bilingual;
}

const EFFORT_RANK: Record<Effort, number> = { low: 1, medium: 2, high: 3 };
const effortLabel = (n: number): Effort => (n >= 3 ? 'high' : n === 2 ? 'medium' : 'low');

export function routeFor(from: SubtypeKey, goal: SubtypeKey | null | undefined = DEFAULT_GOAL[from]): Route {
  if (from === 'unclassified') return { from, goal: null, steps: [], totalEffort: null, note: b('Supply the missing facts first. A route needs a known position.', 'وفّر الحقائق الناقصة أولًا. يحتاج المسار إلى موقع معروف.') };
  if (!goal) return { from, goal: null, steps: [], totalEffort: null, note: b('Hold the position: exploit it, and watch the signposts that would move it.', 'أبقِ الموقع: استثمره وراقب المؤشرات التي قد تحرّكه.') };
  const path = findPath(from, goal);
  if (!path) return { from, goal, steps: [], totalEffort: null, note: b('No route is defined to that goal.', 'لا يوجد مسار معرَّف إلى هذا الهدف.') };
  const worst = path.reduce((m, t) => Math.max(m, EFFORT_RANK[t.effort]), 0);
  return { from, goal, steps: path, totalEffort: path.length ? effortLabel(worst) : null, note: b(`${path.length} move(s) to ${SUBTYPES[goal].label.en}.`, `${path.length} خطوة نحو «${SUBTYPES[goal].label.ar}».`) };
}

// ---------------------------------------------------------------------------
// 2. The big idea for each quadrant (ISC thinking, labelled as such)
// ---------------------------------------------------------------------------

export interface QuadrantIdea {
  quadrant: Quadrant;
  headline: Bilingual;
  idea: Bilingual;
  firstQuestion: Bilingual;
  measure: Bilingual;
  basis: Basis;
}

export const QUADRANT_IDEAS: Record<Quadrant, QuadrantIdea> = {
  strategic: {
    quadrant: 'strategic', basis: IC,
    headline: b('Turn dependence into a managed advantage', 'حوّل الاعتماد إلى ميزة مُدارة'),
    idea: b('Read the power both ways. Give every strategic supplier a joint value plan and, where the supplier holds the power, a dated plan to rebalance it. The goal is not a friendly relationship; it is supply you can count on and value a tender could never give.', 'اقرأ القوة في الاتجاهين. امنح كل مورد استراتيجي خطة قيمة مشتركة، وحيث يملك المورد القوة ضع خطة مؤرخة لإعادة التوازن. الهدف ليس علاقة ودية بل إمداد يمكن الاعتماد عليه وقيمة لا تمنحها المناقصة.'),
    firstQuestion: b('If this supplier stopped in 90 days, what stops with it, and who answers for it?', 'إذا توقف هذا المورد خلال 90 يومًا فما الذي يتوقف معه ومن المسؤول؟'),
    measure: b('Share of strategic spend with a joint plan and a power read.', 'نسبة الإنفاق الاستراتيجي التي لها خطة مشتركة وقراءة للقوة.'),
  },
  leverage: {
    quadrant: 'leverage', basis: IC,
    headline: b('Take the saving without planting the next bottleneck', 'خذ الوفر دون أن تزرع الاختناق القادم'),
    idea: b('Price pressure thins the supplier base over time and can turn a Leverage category into a Bottleneck. Count the saving net of switching cost and failures, and keep a live second source so your leverage stays real.', 'الضغط على السعر يُضعف قاعدة الموردين مع الوقت وقد يحوّل فئة نفوذ إلى اختناق. احسب الوفر صافيًا بعد تكلفة التبديل والإخفاقات، وأبقِ مصدرًا ثانيًا حيًا ليبقى نفوذك حقيقيًا.'),
    firstQuestion: b('Is the saving still there after the supplier\'s failures and our switching cost?', 'هل ما زال الوفر قائمًا بعد إخفاقات المورد وتكلفة التبديل؟'),
    measure: b('Net saving versus gross saving, and qualified suppliers per Leverage category (two or more).', 'الوفر الصافي مقابل الإجمالي، وعدد الموردين المؤهَّلين لكل فئة نفوذ (اثنان أو أكثر).'),
  },
  bottleneck: {
    quadrant: 'bottleneck', basis: IC,
    headline: b('An unmanaged bottleneck is hidden debt: move it, secure it or bridge it, with a date', 'الاختناق غير المُدار دَين خفي: انقله أو أمّنه أو غطِّه مؤقتًا بتاريخ محدد'),
    idea: b('Every bottleneck gets one of three decisions: move out of the box (qualify, simplify), hold and secure (contingency, buffer, remedies), or bridge (temporary, with an expiry). None sit undecided. The price of ignoring one is paid on the worst day.', 'كل اختناق يُتخذ بشأنه أحد ثلاثة قرارات: الخروج من الربع الخاص (تأهيل أو تبسيط)، أو الإبقاء والتأمين (طوارئ ومخزون وعلاجات)، أو التغطية المؤقتة (بتاريخ انتهاء). لا يُترك أي منها بلا قرار. ثمن إهماله يُدفع في أسوأ يوم!'),
    firstQuestion: b('Which of the three is it, and who owns the date?', 'أي من الثلاثة هو، ومن يملك التاريخ؟'),
    measure: b('Bottlenecks with a decision and a review date; Locked suppliers without a contingency plan (target zero).', 'اختناقات لها قرار وتاريخ مراجعة؛ موردون مقيَّدون بلا خطة طوارئ (المستهدف صفر).'),
  },
  'non-critical': {
    quadrant: 'non-critical', basis: IC,
    headline: b('Give the team its time back', 'أعِد الوقت إلى الفريق'),
    idea: b('Every hour spent on a low-value purchase is taken from the suppliers that can hurt you. Make routine buying zero-touch (catalogue, purchase card, framework agreement) and pool whatever can be pooled so it can become Leverage.', 'كل ساعة تُصرف على مشترى منخفض القيمة تُسحب من الموردين الذين قد يؤذونك. اجعل الشراء الروتيني بلا تدخل (كتالوج أو بطاقة شراء أو اتفاقية إطارية) وجمّع ما يمكن تجميعه ليصبح نفوذًا.'),
    firstQuestion: b('Can this be bought without a buyer?', 'هل يمكن شراء هذا دون مشترٍ؟'),
    measure: b('Share of non-critical orders handled without a buyer, and the number of tail suppliers.', 'نسبة الطلبات غير الحرجة التي تُنفَّذ دون مشترٍ، وعدد موردي الذيل.'),
  },
};

// ---------------------------------------------------------------------------
// 3. The management report
// ---------------------------------------------------------------------------

const QUADS: Quadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
export const QUADRANT_LABEL: Record<Quadrant, Bilingual> = {
  strategic: b('Critical (Strategic)', 'استراتيجي (حرج)'),
  leverage: b('Leverage', 'نفوذ شرائي'),
  bottleneck: b('Bottleneck (fragile supply)', 'نقطة اختناق (إمداد هش)'),
  'non-critical': b('Routine (Non-critical)', 'غير حرج (روتيني)'),
};

export interface ReportSupplierRow {
  supplierId: string;
  name: string;
  subtype: SubtypeKey;
  subtypeLabel: Bilingual;
  why: Bilingual;
  action: Bilingual;
  topSituation: Bilingual | null;
  topSeverity: Severity | null;
  review: string;
  route: Route;
  spendSAR: number | null;
}

export interface ReportQuadrant {
  quadrant: Quadrant;
  label: Bilingual;
  idea: QuadrantIdea;
  count: number;
  bySubtype: Array<{ subtype: SubtypeKey; label: Bilingual; count: number }>;
  spendSAR: number;
  spendKnownCount: number;
  rows: ReportSupplierRow[];
}

export interface KraljicReport {
  asOfIso: string;
  total: number;
  classified: number;
  unclassified: number;
  quadrants: ReportQuadrant[];
  /** Cross-quadrant and in-quadrant moves worth doing, high stakes first. */
  priorityMoves: Array<{ supplierId: string; name: string; route: Route; severity: Severity | null }>;
  migrations: Array<{ supplierId: string; name: string; reviewAs: Quadrant; why: Bilingual }>;
  dataGaps: Array<{ supplierId: string; name: string; missing: string[] }>;
  honesty: Bilingual;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEV_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export function buildKraljicReport(inputs: SubtypeSupplierInput[], asOfIso: string): KraljicReport {
  const assessed: Array<{ s: SubtypeSupplierInput; a: SubtypeAssessment }> = inputs.map((s) => ({ s, a: assess(s) }));
  const quadrants: ReportQuadrant[] = QUADS.map((q) => {
    const mine = assessed.filter((x) => x.s.quadrant === q);
    const subKeys = Array.from(new Set(mine.map((x) => x.a.result.subtype)));
    const rows: ReportSupplierRow[] = mine.map(({ s, a }) => {
      const top = [...a.situations].sort((x, y) => SEV_RANK[y.severity] - SEV_RANK[x.severity])[0];
      return {
        supplierId: s.supplierId, name: s.name, subtype: a.result.subtype, subtypeLabel: a.result.def.label,
        why: b(a.result.whyEn, a.result.whyAr), action: a.result.def.primary,
        topSituation: top ? top.problem : null, topSeverity: top ? top.severity : null,
        review: addDays(asOfIso, a.result.reviewDays), route: routeFor(a.result.subtype),
        spendSAR: typeof s.annualSpendSAR === 'number' && s.annualSpendSAR > 0 ? s.annualSpendSAR : null,
      };
    }).sort((x, y) => (y.topSeverity ? SEV_RANK[y.topSeverity] : 0) - (x.topSeverity ? SEV_RANK[x.topSeverity] : 0));
    return {
      quadrant: q, label: QUADRANT_LABEL[q], idea: QUADRANT_IDEAS[q], count: mine.length,
      bySubtype: subKeys.map((k) => ({ subtype: k, label: SUBTYPES[k].label, count: mine.filter((x) => x.a.result.subtype === k).length })),
      spendSAR: rows.reduce((t, r) => t + (r.spendSAR ?? 0), 0),
      spendKnownCount: rows.filter((r) => r.spendSAR !== null).length,
      rows,
    };
  });
  const unclassified = assessed.filter((x) => x.a.result.subtype === 'unclassified').length;
  const priorityMoves = assessed
    .map(({ s, a }) => ({ supplierId: s.supplierId, name: s.name, route: routeFor(a.result.subtype), severity: ([...a.situations].sort((x, y) => SEV_RANK[y.severity] - SEV_RANK[x.severity])[0]?.severity ?? null) as Severity | null }))
    .filter((m) => m.route.steps.length > 0)
    .sort((x, y) => SEV_RANK[y.severity ?? 'low'] - SEV_RANK[x.severity ?? 'low'] || x.route.steps.length - y.route.steps.length);
  return {
    asOfIso, total: inputs.length, classified: inputs.length - unclassified, unclassified, quadrants, priorityMoves,
    migrations: assessed.flatMap(({ s, a }) => a.migrations.map((m) => ({ supplierId: s.supplierId, name: s.name, reviewAs: m.reviewAs, why: b(m.whyEn, m.whyAr) }))),
    dataGaps: assessed.filter((x) => x.a.result.missingFacts.length > 0).map(({ s, a }) => ({ supplierId: s.supplierId, name: s.name, missing: a.result.missingFacts as string[] })),
    honesty: b('Method: ISC extends Kraljic (1983) and Gelderman & van Weele (2003) with sub-types, routes, migration alerts and repositioning. Every rule is shown in full and can be calibrated to your business. Spend totals count only suppliers with a spend figure. Decision support to be confirmed by your team.', 'المنهجية: تمدّ ISC نموذج Kraljic (1983) وGelderman & van Weele (2003) بأنواع فرعية ومسارات وتنبيهات انتقال وتغيير موضع. كل قاعدة معروضة كاملة ويمكن معايرتها لتناسب عملك. تُحتسب إجماليات الإنفاق للموردين الذين لديهم رقم إنفاق فقط. دعم قرار يؤكده فريقك.'),
  };
}

function csvCell(v: string | number | null): string {
  const s = v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvExtra { lastReview: string; nextDueDiligence: string; playbookBasis: string }

export function reportToCsv(r: KraljicReport, lang: 'en' | 'ar', extras?: Record<string, CsvExtra>): string {
  const L = (x: Bilingual) => x[lang];
  const head = lang === 'ar'
    ? ['الربع', 'المورد', 'النوع الفرعي', 'لماذا', 'الإجراء الموصى به', 'أبرز مشكلة', 'الأولوية', 'المراجعة القادمة', 'الإنفاق السنوي (ر.س)', 'الخطوات نحو الهدف']
    : ['Quadrant', 'Supplier', 'Sub-type', 'Why', 'Recommended action', 'Top problem', 'Severity', 'Next review', 'Annual spend (SAR)', 'Moves to goal'];
  const extraHead = lang === 'ar' ? ['آخر مراجعة مسجّلة', 'العناية الواجبة القادمة', 'أساس دليل العمل'] : ['Last recorded review', 'Next due diligence', 'Playbook basis'];
  const lines = [(extras ? [...head, ...extraHead] : head).map(csvCell).join(',')];
  for (const q of r.quadrants) for (const row of q.rows) {
    lines.push([L(q.label), row.name, L(row.subtypeLabel), L(row.why), L(row.action), row.topSituation ? L(row.topSituation) : '', row.topSeverity ?? '', row.review, row.spendSAR, row.route.steps.length, ...(extras ? [extras[row.supplierId]?.lastReview ?? '', extras[row.supplierId]?.nextDueDiligence ?? '', extras[row.supplierId]?.playbookBasis ?? ''] : [])].map(csvCell).join(','));
  }
  return '﻿' + lines.join('\n');
}
