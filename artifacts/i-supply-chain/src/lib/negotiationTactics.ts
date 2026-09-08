/**
 * Supplier Intelligence Module 02 -- Named Negotiation Tactics & Negotiation
 * Plan Document (extension, 8 Sep 2026).
 *
 * Direct response to explicit client requests to (1) go beyond the
 * approach/BATNA/ZOPA/MIL layer already in supplierSourcingStrategy.ts and
 * name and wire specific, classic negotiation tactics (good cop/bad cop,
 * salami, prisoner's dilemma, "and many more") with when/where/how/
 * follow-up/desired-result for each, and (2) produce a fuller negotiation
 * PLAN document -- roles, participants, and a multi-level structure for
 * complex Strategic/Bottleneck negotiations -- the way real procurement
 * organizations document a negotiation before a strategic session.
 *
 * Every tactic below is a real, named, independently verifiable technique,
 * sourced from named authorities (never invented) per Decision Record 8.7.
 * Sources are cited per-entry below; the main bodies drawn on are: PON
 * (Program on Negotiation, Harvard Law School) "10 Hard-Bargaining Tactics
 * to Watch Out for in a Negotiation"; Lewicki, Saunders & Barry,
 * "Negotiation"; Axelrod's iterated Prisoner's Dilemma tournaments and
 * Anatol Rapoport's tit-for-tat strategy; standard game-theory brinkmanship
 * literature (Chicken Game); and Chris Voss, "Never Split the Difference".
 *
 * This file is deliberately separate from supplierSourcingStrategy.ts
 * (already 749 lines before this addition) rather than appended to it --
 * a ~20-tactic library with when/where/how/follow-up/counter-tactic fields
 * per entry is a distinct, sizeable concern from the quadrant-level
 * approach/BATNA/ZOPA/MIL profile that file already owns. It imports
 * KraljicQuadrant from kraljicScoring.ts (the same shared source of truth
 * used everywhere else in Module 02) and is in turn imported BY
 * supplierSourcingStrategy.ts to build the combined NegotiationPlanDocument
 * -- a one-directional dependency, no circularity.
 *
 * Honesty note (Decision Record 8.7): several of these tactics are
 * manipulative or deceptive by design (Good Cop/Bad Cop, Bogey, Snow Job,
 * Bluffing). They are documented here so a client can RECOGNIZE and DEFEND
 * against them -- via the ethicalRisk flag and counterTactic field on every
 * entry -- not to instruct a client to deceive their own suppliers. The
 * separate recommendClientTactics() function below only surfaces the
 * low-ethical-risk subset as tactics for the client to actually USE.
 */

import type { KraljicQuadrant } from '@/lib/kraljicScoring';

export interface Bilingual {
  en: string;
  ar: string;
}

export type TacticCategory =
  | 'pressure'
  | 'psychological'
  | 'information-control'
  | 'game-theoretic'
  | 'principled';

export type EthicalRisk = 'low' | 'moderate' | 'high';

export interface NamedNegotiationTactic {
  id: string;
  name: Bilingual;
  category: TacticCategory;
  whatItIs: Bilingual;
  when: Bilingual;
  where: Bilingual;
  how: Bilingual;
  desiredResult: Bilingual;
  followUp: Bilingual;
  counterTactic: Bilingual;
  suitableQuadrants: KraljicQuadrant[];
  ethicalRisk: EthicalRisk;
  ethicalNote: Bilingual;
  source: string;
}

export const NAMED_NEGOTIATION_TACTICS: NamedNegotiationTactic[] = [
  {
    id: 'extreme-anchor',
    name: { en: 'Extreme Anchor (Lowball / Highball)', ar: 'الترسية المتطرفة (عرض منخفض جداً / مرتفع جداً)' },
    category: 'pressure',
    whatItIs: { en: 'Opening with a deliberately extreme offer -- far below (buyer) or above (seller) a realistic outcome -- to shift the counterpart\'s reference point before real bargaining starts.', ar: 'افتتاح التفاوض بعرض متطرف عمداً -- أقل بكثير (كمشترٍ) أو أعلى بكثير (كبائع) من نتيجة واقعية -- لإزاحة نقطة مرجعية الطرف الآخر قبل بدء المساومة الفعلية.' },
    when: { en: 'At the opening of a distributive, price-primary negotiation where a competitive process already exists and walking away costs the client little.', ar: 'في افتتاح تفاوض تنافسي قائم على السعر بشكل أساسي، حيث توجد عملية تنافسية بالفعل وتكلفة الانسحاب منخفضة على العميل.' },
    where: { en: 'Leverage quadrant, distributive approach. Poor fit for Strategic or Bottleneck -- an extreme opening reads as adversarial exactly where the relationship cannot absorb that risk.', ar: 'ربع النفوذ، النهج التنافسي. غير مناسب للربع الاستراتيجي أو ربع الاختناق -- فالعرض المتطرف يُقرأ كخطوة خصومية تحديداً حيث لا تحتمل العلاقة هذه المخاطرة.' },
    how: { en: 'Open 15-30% away from your real target, justify it with a plausible (even if generous) rationale, and leave room to make several small concessions that still land inside your acceptable range.', ar: 'ابدأ بمسافة 15-30% عن هدفك الحقيقي، وبرّرها بمنطق معقول (وإن كان سخياً)، واترك مجالاً لتقديم عدة تنازلات صغيرة تظل ضمن نطاقك المقبول.' },
    desiredResult: { en: 'The counterpart\'s own anchor shifts toward yours, so the eventual settlement lands closer to your real target than an opening at your true number would have achieved.', ar: 'تنزاح نقطة ترسية الطرف الآخر نحو نقطتك، بحيث تصل التسوية النهائية أقرب إلى هدفك الحقيقي مما كان سيحققه الافتتاح برقمك الفعلي.' },
    followUp: { en: 'Concede in shrinking increments (not equal steps) to signal you are nearing your real limit, and tie each concession to a request in return.', ar: 'قدّم تنازلات بزيادات متناقصة (وليست متساوية) للإشارة إلى اقترابك من حدك الحقيقي، واربط كل تنازل بطلب مقابل.' },
    counterTactic: { en: 'Do not react emotionally or counter-anchor in a panic. State your own researched market range calmly, ask the counterpart to justify their number with objective data, and be willing to end the session if the gap will not close.', ar: 'لا تتفاعل عاطفياً ولا تُرسِ عرضاً مضاداً بذعر. اذكر نطاق السوق الذي بحثته بهدوء، واطلب من الطرف الآخر تبرير رقمه ببيانات موضوعية، وكن مستعداً لإنهاء الجلسة إذا لم تُغلق الفجوة.' },
    suitableQuadrants: ['leverage', 'non-critical'],
    ethicalRisk: 'low',
    ethicalNote: { en: 'Anchoring is a standard, legitimate negotiation technique as long as the justification offered is not fabricated.', ar: 'الترسية تقنية تفاوض قياسية ومشروعة طالما أن التبرير المقدَّم غير ملفَّق.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'salami-slicing',
    name: { en: 'Salami Slicing (Salami Tactics)', ar: 'تكتيك شرائح السلامي' },
    category: 'pressure',
    whatItIs: { en: 'Breaking one large ask into a series of small, individually reasonable-looking requests that cumulatively add up to a concession the other side would have refused if asked for all at once.', ar: 'تقسيم طلب كبير واحد إلى سلسلة من الطلبات الصغيرة التي تبدو معقولة كل على حدة، لكنها تتراكم لتشكل تنازلاً كان الطرف الآخر سيرفضه لو طُلب دفعة واحدة.' },
    when: { en: 'Across a negotiation that spans multiple sessions or a multi-year contract, where individual small asks can be made at different points without being compared side by side.', ar: 'عبر تفاوض يمتد لعدة جلسات أو عقد متعدد السنوات، حيث يمكن تقديم طلبات صغيرة فردية في نقاط زمنية مختلفة دون مقارنتها جنباً إلى جنب.' },
    where: { en: 'Leverage quadrant when the client holds the requesting position; also the single tactic most likely to be used AGAINST the client by a supplier in a Strategic or long-term relationship, where trust makes each small ask easy to grant.', ar: 'ربع النفوذ عندما يكون العميل هو الطرف الطالب؛ وهو أيضاً التكتيك الأكثر احتمالاً أن يُستخدم ضد العميل من قِبل مورد في علاقة استراتيجية أو طويلة الأمد، حيث تجعل الثقة كل طلب صغير سهل المنح.' },
    how: { en: 'Request the first, smallest slice and let it be granted and normalized; wait, then request the next slice framed as a minor, logical extension of what was already agreed; repeat.', ar: 'اطلب أول وأصغر شريحة ودعها تُمنح وتصبح أمراً معتاداً؛ انتظر، ثم اطلب الشريحة التالية مؤطَّرة كامتداد بسيط ومنطقي لما تم الاتفاق عليه بالفعل؛ كرر العملية.' },
    desiredResult: { en: 'The full, cumulative concession is obtained without the counterpart ever evaluating it as a single, large ask -- and without triggering the resistance a one-shot request would have.', ar: 'الحصول على التنازل الكامل المتراكم دون أن يقيّمه الطرف الآخر أبداً كطلب واحد كبير -- ودون إثارة المقاومة التي كان سيثيرها طلب دفعة واحدة.' },
    followUp: { en: 'Log every incremental concession granted across the relationship in one running record, so the cumulative total is visible the next time terms are reviewed.', ar: 'سجّل كل تنازل تدريجي مُنح عبر العلاقة في سجل تراكمي واحد، بحيث يكون المجموع التراكمي واضحاً عند المراجعة التالية للشروط.' },
    counterTactic: { en: 'Track every small request against the original agreement in a single running log across the whole relationship, not session by session. Ask explicitly: "Where does this end?" before granting the third or fourth slice.', ar: 'تتبّع كل طلب صغير مقارنةً بالاتفاقية الأصلية في سجل تراكمي واحد عبر العلاقة كاملة، وليس جلسة بجلسة. اسأل صراحة: "أين تنتهي هذه السلسلة؟" قبل منح الشريحة الثالثة أو الرابعة.' },
    suitableQuadrants: ['leverage', 'strategic'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Legitimate as an incremental negotiation style when each ask is disclosed honestly; becomes manipulative when the cumulative intent is deliberately concealed.', ar: 'مشروع كأسلوب تفاوض تدريجي عندما يُفصح عن كل طلب بصدق؛ يصبح تلاعبياً عندما تُخفى النية التراكمية عمداً.' },
    source: 'KARRASS negotiation training; Wiley Online Library negotiation literature',
  },
  {
    id: 'nibble',
    name: { en: 'Nibbling', ar: 'القضم (Nibbling)' },
    category: 'pressure',
    whatItIs: { en: 'Asking for one more small, previously-undiscussed concession right at the moment of closing, when the other side\'s guard is down and eager to finalize.', ar: 'طلب تنازل صغير إضافي لم يُناقش سابقاً في لحظة الإغلاق تحديداً، عندما يكون حذر الطرف الآخر منخفضاً وحماسه للإنهاء مرتفعاً.' },
    when: { en: 'In the final minutes of closing, after the main terms are already agreed and both sides are mentally committed to finishing.', ar: 'في الدقائق الأخيرة من الإغلاق، بعد الاتفاق على الشروط الرئيسية وبينما يكون الطرفان ملتزمين ذهنياً بالإنهاء.' },
    where: { en: 'Leverage and Non-critical quadrants where the item at stake is small relative to the whole deal (roughly 1-2% of deal value); watch for it from suppliers closing a Strategic contract too.', ar: 'ربعا النفوذ وغير الحرج حيث يكون البند المطلوب صغيراً نسبةً لقيمة الصفقة الكاملة (حوالي 1-2%)؛ راقب أيضاً استخدامه من موردين عند إغلاق عقد استراتيجي.' },
    how: { en: 'Wait until agreement feels essentially done, then add one small, specific ask ("and free delivery on the first order, right?") framed as if it were already assumed.', ar: 'انتظر حتى يبدو الاتفاق شبه مكتمل، ثم أضف طلباً صغيراً ومحدداً ("والتوصيل مجاني للطلب الأول، أليس كذلك؟") مؤطَّراً وكأنه كان مفترضاً بالفعل.' },
    desiredResult: { en: 'A small extra concession is granted simply because the other party does not want to reopen or risk the whole deal over a minor point.', ar: 'الحصول على تنازل إضافي صغير لمجرد أن الطرف الآخر لا يريد إعادة فتح الصفقة كاملة أو المخاطرة بها من أجل نقطة بسيطة.' },
    followUp: { en: 'Confirm the final, complete term sheet in writing immediately, explicitly listing every item agreed -- closing the door on any further nibbles from either side.', ar: 'أكّد ورقة الشروط النهائية الكاملة كتابياً فوراً، مع إدراج كل بند تم الاتفاق عليه صراحة -- لإغلاق الباب أمام أي قضم إضافي من أي من الطرفين.' },
    counterTactic: { en: 'Treat any new ask after "agreement" as reopening the whole deal, not a footnote -- respond with "let\'s put that on the table along with everything else" rather than granting it reflexively.', ar: 'تعامل مع أي طلب جديد بعد "الاتفاق" كإعادة فتح للصفقة بالكامل، لا كملاحظة هامشية -- رد بـ "لنضع هذا على الطاولة مع كل شيء آخر" بدلاً من منحه تلقائياً.' },
    suitableQuadrants: ['leverage', 'non-critical'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'A mild, common closing tactic, but exploits the other party\'s eagerness to finish rather than the merits of the request.', ar: 'تكتيك إغلاق خفيف وشائع، لكنه يستغل حماس الطرف الآخر للإنهاء بدلاً من وجاهة الطلب نفسه.' },
    source: 'PON Harvard hardball-tactics literature; standard negotiation-training material',
  },
  {
    id: 'take-it-or-leave-it',
    name: { en: 'Take-It-or-Leave-It / Exploding Offer', ar: 'خذه أو اتركه / العرض المتفجر (محدود المدة)' },
    category: 'pressure',
    whatItIs: { en: 'Presenting an offer as final and non-negotiable, often with an artificial or real deadline attached, to pressure quick acceptance without further bargaining.', ar: 'تقديم عرض على أنه نهائي وغير قابل للتفاوض، غالباً مع موعد نهائي مصطنع أو حقيقي، للضغط من أجل قبول سريع دون مزيد من المساومة.' },
    when: { en: 'When the offering party believes the counterpart has weak alternatives or limited time, or wants to shut down further concession requests.', ar: 'عندما يعتقد الطرف المُقدِّم للعرض أن الطرف الآخر يملك بدائل ضعيفة أو وقتاً محدوداً، أو يريد إغلاق باب طلبات التنازل الإضافية.' },
    where: { en: 'Most likely to be used against the client in Bottleneck (supplier holds real leverage) and sometimes Strategic negotiations; rarely a legitimate client-side tactic given ISC\'s relationship-preservation stance.', ar: 'الأكثر احتمالاً أن يُستخدم ضد العميل في ربع الاختناق (يملك المورد نفوذاً حقيقياً) وأحياناً في التفاوض الاستراتيجي؛ نادراً ما يكون تكتيكاً مشروعاً من جانب العميل نظراً لموقف ISC في الحفاظ على العلاقات.' },
    how: { en: 'State the offer once, label it final, and often attach a short deadline to discourage the other side from testing whether it is really fixed.', ar: 'اذكر العرض مرة واحدة، صفه بأنه نهائي، وغالباً أرفق معه موعداً نهائياً قصيراً لثني الطرف الآخر عن اختبار ما إذا كان ثابتاً فعلاً.' },
    desiredResult: { en: 'Fast acceptance without the counterpart probing for a better deal or involving more decision-makers who might resist.', ar: 'قبول سريع دون أن يبحث الطرف الآخر عن صفقة أفضل أو يُشرك صناع قرار إضافيين قد يقاومون.' },
    followUp: { en: 'If used by the client, be prepared to actually hold the line -- a "final" offer that later moves destroys credibility for every future negotiation with that counterpart.', ar: 'إذا استخدمه العميل، يجب أن يكون مستعداً للالتزام الفعلي بالموقف -- فالعرض "النهائي" الذي يتغير لاحقاً يدمر المصداقية في كل تفاوض مستقبلي مع ذلك الطرف.' },
    counterTactic: { en: 'Rarely are offers truly non-negotiable. Ignore the ultimatum framing, respond to the substance with a counter-proposal addressing both sides\' interests, and test the deadline\'s reality by asking what specifically happens if it passes.', ar: 'نادراً ما تكون العروض غير قابلة للتفاوض فعلاً. تجاهل صياغة الإنذار، ورد على المضمون بعرض مقابل يعالج مصالح الطرفين، واختبر واقعية الموعد النهائي بسؤال محدد عمّا سيحدث بالضبط إذا انقضى.' },
    suitableQuadrants: ['bottleneck', 'leverage'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Legitimate only when the deadline and finality are genuinely real (e.g. a real budget-year close); fabricated urgency is a form of deception.', ar: 'مشروع فقط عندما يكون الموعد النهائي والنهائية حقيقيين فعلاً (مثل إغلاق سنة مالية حقيقي)؛ الاستعجال المصطنع شكل من أشكال الخداع.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'deadline-pressure',
    name: { en: 'Deadline / Time Pressure', ar: 'ضغط الوقت / الموعد النهائي' },
    category: 'pressure',
    whatItIs: { en: 'Introducing or emphasizing a time constraint to push the other side toward a faster, less scrutinized decision.', ar: 'إدخال أو التأكيد على قيد زمني لدفع الطرف الآخر نحو قرار أسرع وأقل تدقيقاً.' },
    when: { en: 'When a real constraint exists (quarter-end, budget cycle, production start date) -- or, used against the client, whenever a counterpart wants to shorten the client\'s own due-diligence window.', ar: 'عند وجود قيد حقيقي (نهاية ربع سنوي، دورة ميزانية، تاريخ بدء إنتاج) -- أو عند استخدامه ضد العميل، كلما أراد الطرف الآخر تقصير فترة العناية الواجبة الخاصة بالعميل.' },
    where: { en: 'Leverage quadrant when the constraint is real; a frequent tactic to watch for from suppliers in Bottleneck situations trying to force a quick renewal before the client secures an alternative.', ar: 'ربع النفوذ عندما يكون القيد حقيقياً؛ تكتيك شائع يجب مراقبته من الموردين في حالات الاختناق لفرض تجديد سريع قبل أن يؤمّن العميل بديلاً.' },
    how: { en: 'State the real constraint plainly and tie the timeline directly to it (e.g., "this price holds through the fiscal quarter because our costing resets after that").', ar: 'اذكر القيد الحقيقي بوضوح واربط الجدول الزمني به مباشرة (مثال: "هذا السعر ساري حتى نهاية الربع المالي لأن تسعيرنا يُعاد ضبطه بعده").' },
    desiredResult: { en: 'A decision reached inside the real window, without unnecessary delay -- or, when used manipulatively, a decision rushed before the other side can verify terms or seek alternatives.', ar: 'اتخاذ قرار ضمن الإطار الزمني الحقيقي دون تأخير غير ضروري -- أو، عند استخدامه بشكل تلاعبي، دفع قرار متسرع قبل أن يتمكن الطرف الآخر من التحقق من الشروط أو البحث عن بدائل.' },
    followUp: { en: 'Document the real reason behind any deadline used, so it can be defended if challenged later.', ar: 'وثّق السبب الحقيقي وراء أي موعد نهائي مُستخدم، حتى يمكن الدفاع عنه إذا تم الاعتراض عليه لاحقاً.' },
    counterTactic: { en: 'Ask directly what specifically changes if the deadline passes. A real constraint has a specific, verifiable mechanism; a fabricated one produces a vague or shifting answer.', ar: 'اسأل مباشرة عمّا يتغير بالضبط إذا انقضى الموعد النهائي. القيد الحقيقي له آلية محددة يمكن التحقق منها؛ أما المصطنع فينتج عنه جواب مبهم أو متغير.' },
    suitableQuadrants: ['leverage', 'bottleneck'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Only legitimate when the deadline is real and verifiable -- a fabricated deadline is a hardball tactic that damages trust once discovered.', ar: 'مشروع فقط عندما يكون الموعد النهائي حقيقياً ويمكن التحقق منه -- الموعد النهائي المصطنع تكتيك قاسٍ يضر بالثقة عند اكتشافه.' },
    source: 'PON Harvard hardball-tactics literature',
  },
  {
    id: 'commitment-tactic',
    name: { en: 'Commitment Tactic ("My Hands Are Tied")', ar: 'تكتيك الالتزام المسبق ("يداي مقيدتان")' },
    category: 'psychological',
    whatItIs: { en: 'Claiming a lack of authority or a prior, fixed commitment (real or invented) to avoid making further concessions.', ar: 'ادعاء نقص الصلاحية أو وجود التزام مسبق ثابت (حقيقي أو مختلق) لتجنب تقديم مزيد من التنازلات.' },
    when: { en: 'When a negotiator wants to hold a position without appearing personally unreasonable -- blaming an absent authority instead.', ar: 'عندما يريد المفاوض التمسك بموقف دون أن يبدو غير معقول شخصياً -- فيُحمّل اللوم لجهة غائبة صاحبة صلاحية.' },
    where: { en: 'Can appear in any quadrant; most consequential in Strategic and Bottleneck negotiations where it can stall a needed multi-issue trade-off.', ar: 'يمكن أن يظهر في أي ربع؛ وأكثر تأثيراً في المفاوضات الاستراتيجية ومفاوضات الاختناق حيث قد يعطّل مقايضة متعددة القضايا ضرورية.' },
    how: { en: 'State that a policy, a superior, or a prior board decision prevents further movement, without offering to verify or escalate.', ar: 'ذكر أن سياسة، أو جهة أعلى، أو قراراً سابقاً من مجلس الإدارة يمنع أي تحرك إضافي، دون عرض التحقق أو التصعيد.' },
    desiredResult: { en: 'The other side stops pressing for further concessions, believing there is genuinely no room left to negotiate.', ar: 'توقف الطرف الآخر عن الضغط لمزيد من التنازلات، معتقداً أنه لا يوجد فعلاً مجال متبقٍ للتفاوض.' },
    followUp: { en: 'If the commitment is genuine, offer a concrete path to test or escalate it rather than letting it stall the negotiation indefinitely.', ar: 'إذا كان الالتزام حقيقياً، اعرض مساراً محدداً لاختباره أو تصعيده بدلاً من تركه يعطّل التفاوض إلى أجل غير مسمى.' },
    counterTactic: { en: 'Test whether the constraint is real by asking to speak with the person or authority in question. If access is refused without a credible reason, treat the claim as a tactic, not a fact.', ar: 'اختبر ما إذا كان القيد حقيقياً بطلب التحدث مع الشخص أو الجهة المعنية. إذا رُفض الوصول دون سبب معقول، تعامل مع الادعاء كتكتيك لا كحقيقة.' },
    suitableQuadrants: ['strategic', 'bottleneck', 'leverage'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Legitimate when the constraint is real and verifiable; a fabricated authority limit is a deceptive stalling device.', ar: 'مشروع عندما يكون القيد حقيقياً ويمكن التحقق منه؛ ادعاء صلاحية مقيدة زوراً أداة تسويف خادعة.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'unreciprocated-offer',
    name: { en: "Inviting Unreciprocated Offers (\"Don't Bid Against Yourself\")", ar: 'استدراج عروض بلا مقابل ("لا تُزايد على نفسك")' },
    category: 'pressure',
    whatItIs: { en: 'A counterpart asks the client to improve an offer before making any counteroffer of their own -- getting a concession for free.', ar: 'يطلب الطرف الآخر من العميل تحسين عرضه قبل تقديم أي عرض مقابل من جانبه -- للحصول على تنازل دون مقابل.' },
    when: { en: 'Right after the client makes an opening offer, when the counterpart responds with silence or a vague "you can do better" instead of a counter-number.', ar: 'مباشرة بعد أن يقدم العميل عرضه الافتتاحي، عندما يرد الطرف الآخر بصمت أو بعبارة مبهمة مثل "تستطيع تقديم أفضل من ذلك" بدلاً من رقم مقابل.' },
    where: { en: 'Any quadrant, but most costly in Leverage negotiations where the client is meant to hold the pricing initiative.', ar: 'أي ربع، لكنه الأكثر كلفة في مفاوضات النفوذ حيث يُفترض أن يمسك العميل بزمام المبادرة السعرية.' },
    how: { en: 'Discipline: never move a number a second time until the other side has put a specific counter-number on the table.', ar: 'الانضباط: لا تُحرّك رقماً مرة ثانية أبداً حتى يضع الطرف الآخر رقماً مقابلاً محدداً على الطاولة.' },
    desiredResult: { en: 'Avoids conceding twice for a single concession from the counterpart -- keeps the exchange reciprocal.', ar: 'تجنّب تقديم تنازلين مقابل تنازل واحد فقط من الطرف الآخر -- يحافظ على التبادل التفاوضي.' },
    followUp: { en: 'If the counterpart still refuses to counter, restate the original offer and ask directly what specific number would move them to respond.', ar: 'إذا استمر الطرف الآخر في رفض تقديم عرض مقابل، أعد ذكر العرض الأصلي واسأل مباشرة عن الرقم المحدد الذي سيدفعه للرد.' },
    counterTactic: { en: 'This tactic is itself the counter-discipline against a common trap -- recognize when you are being asked to bid against yourself, and hold firm until a real counteroffer arrives.', ar: 'هذا التكتيك هو نفسه الانضباط المضاد لفخ شائع -- تعرّف على اللحظة التي يُطلب فيها منك أن تزايد على نفسك، وتمسّك بموقفك حتى يصل عرض مقابل حقيقي.' },
    suitableQuadrants: ['leverage', 'strategic', 'bottleneck', 'non-critical'],
    ethicalRisk: 'low',
    ethicalNote: { en: 'A defensive discipline, not a manipulation of the counterpart -- appropriate for the client to apply in every quadrant.', ar: 'انضباط دفاعي وليس تلاعباً بالطرف الآخر -- مناسب لأن يطبّقه العميل في كل ربع.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'flinch',
    name: { en: 'The Flinch', ar: 'الارتعاش التفاوضي (Flinch)' },
    category: 'psychological',
    whatItIs: { en: 'A visible, often exaggerated negative reaction (surprise, discomfort) to an offer, intended to signal it is unacceptable before any words are exchanged.', ar: 'رد فعل سلبي واضح، وغالباً مبالغ فيه (دهشة، انزعاج) تجاه عرض ما، بهدف الإشارة إلى أنه غير مقبول قبل تبادل أي كلمات.' },
    when: { en: 'Immediately upon hearing an opening price or term, before any verbal counter is prepared.', ar: 'فور سماع سعر أو شرط افتتاحي، قبل تحضير أي رد لفظي مقابل.' },
    where: { en: 'Any quadrant with a distributive or mixed element -- Leverage and Bottleneck negotiations most commonly.', ar: 'أي ربع فيه عنصر تنافسي أو مختلط -- الأكثر شيوعاً في مفاوضات النفوذ والاختناق.' },
    how: { en: "React visibly (a pause, a raised eyebrow, \"that's quite a bit higher than I expected\") rather than responding neutrally, before moving to substantive counter-arguments.", ar: 'رد فعل واضح (توقف، رفع حاجب، "هذا أعلى مما توقعت بكثير") بدلاً من الرد بحياد، قبل الانتقال إلى حجج مضادة موضوعية.' },
    desiredResult: { en: 'The counterpart, seeing the reaction, often adjusts their expectations downward (or upward) before formal bargaining even starts.', ar: 'الطرف الآخر، عند رؤية رد الفعل، غالباً ما يعدّل توقعاته للأسفل (أو للأعلى) حتى قبل بدء المساومة الرسمية.' },
    followUp: { en: 'Follow the visible reaction immediately with a specific, substantive objection -- the flinch alone is not an argument.', ar: 'أتبع رد الفعل الظاهر فوراً باعتراض محدد وموضوعي -- فالارتعاش وحده ليس حجة.' },
    counterTactic: { en: 'Recognize a flinch as a performance technique, not new information about market reality -- do not adjust your offer based on a reaction alone; ask for the substantive reason.', ar: 'تعرّف على أن الارتعاش أداء تكتيكي وليس معلومة جديدة عن واقع السوق -- لا تعدّل عرضك بناءً على رد فعل فقط؛ اطلب السبب الموضوعي.' },
    suitableQuadrants: ['leverage', 'bottleneck'],
    ethicalRisk: 'low',
    ethicalNote: { en: 'A mild dramatization technique, not deceptive about facts -- widely considered acceptable negotiation theater.', ar: 'أسلوب درامي خفيف، لا يتضمن خداعاً بشأن الحقائق -- يُعد على نطاق واسع مسرحاً تفاوضياً مقبولاً.' },
    source: 'PON Harvard hardball-tactics literature; standard negotiation-training material',
  },
  {
    id: 'good-cop-bad-cop',
    name: { en: 'Good Cop, Bad Cop', ar: 'الشرطي الطيب والشرطي السيئ' },
    category: 'psychological',
    whatItIs: { en: 'A team tactic: one negotiator is hostile, demanding, and unreasonable; a second is sympathetic and reasonable. The contrast makes the "good cop"\'s position feel like relief, extracting concessions through gratitude rather than merit.', ar: 'تكتيك جماعي: مفاوض واحد عدواني ومتطلب وغير معقول؛ وآخر متعاطف ومعقول. يجعل التباين موقف "الشرطي الطيب" يبدو كأنه ارتياح، ويستخرج التنازلات عبر الامتنان لا الوجاهة.' },
    when: { en: 'In team negotiations with more than one representative per side, typically deployed once the "bad cop" has made the client visibly uncomfortable.', ar: 'في المفاوضات الجماعية التي تضم أكثر من ممثل لكل طرف، وتُستخدم عادة بعد أن يجعل "الشرطي السيئ" العميل غير مرتاح بشكل واضح.' },
    where: { en: 'Can surface in any quadrant with a multi-person counterpart team; most damaging in Strategic and Bottleneck negotiations where the client may over-concede to preserve the relationship with the "good cop".', ar: 'يمكن أن يظهر في أي ربع مع فريق مفاوض متعدد الأفراد؛ وهو الأكثر ضرراً في المفاوضات الاستراتيجية ومفاوضات الاختناق حيث قد يُفرط العميل في التنازل للحفاظ على العلاقة مع "الشرطي الطيب".' },
    how: { en: 'The bad cop opens with an extreme, aggressive position; the good cop later "intervenes" with a more moderate counter-proposal that still favors their side, framed as a personal favor.', ar: 'يفتتح الشرطي السيئ بموقف متطرف وعدواني؛ ثم "يتدخل" الشرطي الطيب لاحقاً بعرض مقابل أكثر اعتدالاً لكنه لا يزال يميل لصالح فريقه، ويُقدَّم كمعروف شخصي.' },
    desiredResult: { en: 'The client accepts the "moderate" position gratefully, without benchmarking it against an independent, objective target.', ar: 'يقبل العميل الموقف "المعتدل" بامتنان، دون قياسه مقابل هدف مستقل وموضوعي.' },
    followUp: { en: "After the session, re-evaluate the accepted terms in writing against your original BATNA and target -- not against how much better it felt than the bad cop's opening.", ar: 'بعد الجلسة، أعد تقييم الشروط المقبولة كتابياً مقابل بدائلك الأصلية وهدفك -- وليس مقابل مدى تحسّنها عن عرض الشرطي السيئ الافتتاحي.' },
    counterTactic: { en: "Name the tactic openly (\"I notice we're seeing a harder and a softer position here\") to defuse it. Treat the bad cop's extreme position as the real starting point, not the good cop's offer. Call a break to remove in-the-moment emotional pressure, and evaluate any offer on paper against your BATNA and target value, never against the apparent relief.", ar: 'سمِّ التكتيك صراحة ("ألاحظ أننا نرى موقفاً أكثر تشدداً وآخر أكثر ليونة هنا") لتفكيكه. تعامل مع الموقف المتطرف للشرطي السيئ كنقطة البداية الحقيقية، لا عرض الشرطي الطيب. اطلب استراحة لإزالة الضغط العاطفي اللحظي، وقيّم أي عرض كتابياً مقابل بدائلك وقيمتك المستهدفة، لا مقابل الارتياح الظاهري.' },
    suitableQuadrants: ['strategic', 'bottleneck', 'leverage'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'A deceptive, staged performance by design -- documented here purely for recognition and defense, never recommended for the client to use.', ar: 'أداء ملفَّق ومخادع بطبيعته -- موثَّق هنا فقط للتعرف عليه والدفاع ضده، ولا يُنصح أبداً بأن يستخدمه العميل.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation" and "The Good Cop, Bad Cop Negotiation Strategy"',
  },
  {
    id: 'personal-insults',
    name: { en: 'Personal Insults / Feather Ruffling', ar: 'الإهانات الشخصية / استفزاز المشاعر' },
    category: 'psychological',
    whatItIs: { en: "Personal attacks or belittling remarks aimed at provoking an emotional reaction that weakens the target's judgment.", ar: 'هجمات شخصية أو ملاحظات تحقيرية تهدف إلى استفزاز رد فعل عاطفي يُضعف حكم الطرف المستهدف.' },
    when: { en: 'When a counterpart wants to knock the client off a well-prepared position by making the session personally uncomfortable.', ar: 'عندما يريد الطرف الآخر زعزعة موقف العميل المُعَدّ جيداً بجعل الجلسة غير مريحة شخصياً.' },
    where: { en: 'Can appear in any quadrant; a warning sign in Strategic and Bottleneck relationships that the counterpart is shifting toward adversarial behavior worth escalating past the working level.', ar: 'يمكن أن يظهر في أي ربع؛ وهو إشارة تحذير في العلاقات الاستراتيجية وعلاقات الاختناق بأن الطرف الآخر يتحول نحو سلوك خصومي يستحق التصعيد فوق المستوى التنفيذي العامل.' },
    how: { en: 'Direct or indirect remarks questioning competence, credibility, or seniority, timed to coincide with a substantive request.', ar: 'ملاحظات مباشرة أو غير مباشرة تشكك في الكفاءة أو المصداقية أو الأقدمية، تُوقَّت لتتزامن مع طلب موضوعي.' },
    desiredResult: { en: 'The target reacts emotionally -- conceding to end the discomfort, or making a defensive mistake that reveals real limits.', ar: 'يتفاعل الهدف عاطفياً -- فيتنازل لإنهاء الإحراج، أو يرتكب خطأً دفاعياً يكشف حدوده الحقيقية.' },
    followUp: { en: 'Report the behavior to your own team and, if it recurs, raise it explicitly with the counterpart\'s management before the next session.', ar: 'أبلغ فريقك بالسلوك، وإذا تكرر، ارفعه صراحة إلى إدارة الطرف الآخر قبل الجلسة التالية.' },
    counterTactic: { en: 'Take a break if needed and set a clear boundary out loud. You are not obligated to tolerate disrespect -- naming it directly ("let\'s keep this to the substance") often ends it immediately.', ar: 'خذ استراحة إذا لزم الأمر وحدد حداً واضحاً بصوت مسموع. أنت غير ملزم بتحمل قلة الاحترام -- تسميتها مباشرة ("لنبقَ عند الجوهر") غالباً ما تنهيها فوراً.' },
    suitableQuadrants: ['strategic', 'bottleneck', 'leverage', 'non-critical'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'Never appropriate for the client to use -- documented purely for recognition and defense.', ar: 'غير مناسب أبداً لأن يستخدمه العميل -- موثَّق فقط للتعرف عليه والدفاع ضده.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'threats-and-warnings',
    name: { en: 'Threats and Warnings', ar: 'التهديدات والتحذيرات' },
    category: 'psychological',
    whatItIs: { en: 'Overt or implied statements that a failure to agree will result in a negative consequence for the other side.', ar: 'تصريحات صريحة أو ضمنية بأن عدم الاتفاق سيؤدي إلى نتيجة سلبية للطرف الآخر.' },
    when: { en: 'When a counterpart wants to force compliance quickly by raising the perceived cost of disagreement.', ar: 'عندما يريد الطرف الآخر فرض الامتثال بسرعة عبر رفع التكلفة المتصوَّرة للاختلاف.' },
    where: { en: 'Most likely from a supplier in a Bottleneck position (real leverage) or, less legitimately, in a Strategic relationship where it signals a real relationship breakdown worth escalating immediately.', ar: 'الأكثر احتمالاً من مورد في وضع اختناق (نفوذ حقيقي)، أو بشكل أقل مشروعية في علاقة استراتيجية حيث يشير إلى تصدّع حقيقي في العلاقة يستحق التصعيد الفوري.' },
    how: { en: 'State a specific negative consequence (supply cutoff, price increase, legal action) tied directly to non-agreement.', ar: 'ذكر نتيجة سلبية محددة (وقف الإمداد، رفع السعر، إجراء قانوني) مرتبطة مباشرة بعدم الاتفاق.' },
    desiredResult: { en: 'The target agrees to avoid the stated consequence, without necessarily verifying whether the threat is real or executable.', ar: 'يوافق الهدف لتجنب النتيجة المذكورة، دون التحقق بالضرورة مما إذا كان التهديد حقيقياً أو قابلاً للتنفيذ.' },
    followUp: { en: 'Document the threat verbatim and in what context it was made -- it materially changes how the relationship and any resulting contract should be governed going forward.', ar: 'وثّق التهديد حرفياً والسياق الذي قيل فيه -- فهو يغيّر جوهرياً كيفية إدارة العلاقة وأي عقد ناتج مستقبلاً.' },
    counterTactic: { en: 'Recognize a threat for what it is rather than reacting to it as fact. Calmly naming it ("that sounds like a threat -- is that really the position?") or simply not reacting to it often neutralizes its power.', ar: 'تعرّف على التهديد لما هو عليه بدلاً من التفاعل معه كحقيقة. تسميته بهدوء ("يبدو هذا كتهديد -- هل هذا هو الموقف فعلاً؟") أو ببساطة عدم التفاعل معه غالباً ما يُبطل تأثيره.' },
    suitableQuadrants: ['bottleneck', 'strategic'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'Never appropriate for the client to use -- and a real signal, when received, that the relationship needs executive-level intervention.', ar: 'غير مناسب أبداً لأن يستخدمه العميل -- وهو إشارة حقيقية، عند تلقيه، بأن العلاقة تحتاج تدخلاً على المستوى التنفيذي.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'belittling-alternatives',
    name: { en: 'Belittling Your Alternatives', ar: 'التقليل من شأن بدائلك' },
    category: 'psychological',
    whatItIs: { en: "A counterpart argues that the client's BATNA is weaker than the client believes, to reduce the client's confidence at the table.", ar: 'يجادل الطرف الآخر بأن أفضل بديل للعميل أضعف مما يعتقده، لتقليل ثقة العميل على طاولة التفاوض.' },
    when: { en: 'When the client has referenced a competing alternative or their ability to walk away.', ar: 'عندما يشير العميل إلى بديل منافس أو إلى قدرته على الانسحاب.' },
    where: { en: "Bottleneck and Leverage negotiations where the client's BATNA is the central source of negotiating power.", ar: 'مفاوضات الاختناق والنفوذ حيث يشكّل أفضل بديل للعميل المصدر المركزي لقوته التفاوضية.' },
    how: { en: "Cast doubt on the quality, cost, timeline, or reliability of the client's named alternative supplier or option.", ar: 'إثارة الشك حول جودة أو تكلفة أو جدول زمني أو موثوقية المورد أو الخيار البديل الذي ذكره العميل.' },
    desiredResult: { en: 'The client loses confidence in their own walk-away position and negotiates as though they have less leverage than they actually do.', ar: 'يفقد العميل الثقة في موقف انسحابه الخاص ويتفاوض وكأنه يملك نفوذاً أقل مما يملكه فعلاً.' },
    followUp: { en: "Independently re-verify the BATNA's real strength (a written quote, a tested pilot) rather than relying on memory when this tactic is used.", ar: 'أعد التحقق من قوة البديل الفعلية بشكل مستقل (عرض سعر مكتوب، تجربة مُختبرة) بدلاً من الاعتماد على الذاكرة عند استخدام هذا التكتيك.' },
    counterTactic: { en: 'Do not let the counterpart define your options for you. Stay grounded in your own independently verified assessment of your alternatives, not their characterization of them.', ar: 'لا تدع الطرف الآخر يحدد خياراتك نيابة عنك. تمسّك بتقييمك المستقل والمُتحقَّق منه لبدائلك، لا بوصفه لها.' },
    suitableQuadrants: ['bottleneck', 'leverage'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Borderline: legitimate if based on real, verifiable facts about the alternative; manipulative if based on unfounded claims.', ar: 'حدّي: مشروع إذا استند إلى حقائق حقيقية يمكن التحقق منها عن البديل؛ تلاعبي إذا استند إلى ادعاءات لا أساس لها.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'silent-treatment',
    name: { en: 'Silent Treatment', ar: 'المعاملة الصامتة' },
    category: 'psychological',
    whatItIs: { en: 'Deliberate withdrawal of communication or responsiveness to create anxiety and pressure the other side to make the next move -- often a concession.', ar: 'الانسحاب المتعمد من التواصل أو الاستجابة لخلق قلق والضغط على الطرف الآخر لاتخاذ الخطوة التالية -- غالباً تنازل.' },
    when: { en: 'After an offer is made, when the counterpart wants the client to fill the silence with an unprompted improvement.', ar: 'بعد تقديم عرض، عندما يريد الطرف الآخر أن يملأ العميل الصمت بتحسين غير مطلوب.' },
    where: { en: 'Any quadrant, but most consequential when used by a Bottleneck supplier stalling a time-sensitive renewal.', ar: 'أي ربع، لكنه الأكثر تأثيراً عند استخدامه من قِبل مورد في وضع اختناق يعطّل تجديداً حساساً للوقت.' },
    how: { en: 'Go quiet after an offer -- delayed replies, unanswered calls, no counter -- and wait for the other side to react.', ar: 'الصمت بعد تقديم العرض -- ردود متأخرة، مكالمات دون رد، لا عرض مقابل -- وانتظار رد فعل الطرف الآخر.' },
    desiredResult: { en: 'Anxiety about the deal collapsing pushes the other side to improve their offer unprompted, just to restart the conversation.', ar: 'القلق من انهيار الصفقة يدفع الطرف الآخر لتحسين عرضه دون طلب، فقط لإعادة فتح الحوار.' },
    followUp: { en: 'If used deliberately by the client, set an internal, honest deadline for how long to hold the silence before genuinely re-engaging.', ar: 'إذا استخدمه العميل عمداً، حدد موعداً نهائياً داخلياً وصادقاً لمدة الصمت قبل إعادة التواصل فعلياً.' },
    counterTactic: { en: 'Recognize silence as a tactic, not a signal that your offer was too low. Resist the urge to fill it with an unprompted improvement -- follow up once, professionally, on a fixed schedule instead.', ar: 'تعرّف على الصمت كتكتيك، لا كإشارة إلى أن عرضك كان منخفضاً جداً. قاوم الرغبة في ملئه بتحسين غير مطلوب -- تابع مرة واحدة، باحترافية، وفق جدول زمني ثابت بدلاً من ذلك.' },
    suitableQuadrants: ['bottleneck', 'leverage', 'strategic'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'A pressure tactic rather than a deception -- acceptable in moderation, but corrosive to trust in an ongoing Strategic relationship if overused.', ar: 'تكتيك ضغط وليس خداعاً -- مقبول باعتدال، لكنه يضر بالثقة في علاقة استراتيجية مستمرة إذا أُفرط في استخدامه.' },
    source: 'Standard negotiation-training material (Envicion, negotiation-skills literature)',
  },
  {
    id: 'higher-authority-appeal',
    name: { en: 'Higher Authority Appeal', ar: 'الاستناد إلى سلطة أعلى' },
    category: 'psychological',
    whatItIs: { en: 'A negotiator defers the final decision to an absent, higher authority (a board, an executive) to buy time or extract one more round of concessions before "checking".', ar: 'يُحيل المفاوض القرار النهائي إلى سلطة أعلى غائبة (مجلس إدارة، تنفيذي) لكسب الوقت أو استخلاص جولة إضافية من التنازلات قبل "التحقق".' },
    when: { en: 'Near the end of a session, when the negotiator wants to avoid committing to the current best offer.', ar: 'قرب نهاية الجلسة، عندما يريد المفاوض تجنب الالتزام بأفضل عرض حالي.' },
    where: { en: 'Any quadrant; a related variant of the Commitment Tactic above.', ar: 'أي ربع؛ نسخة مرتبطة بتكتيك الالتزام المسبق أعلاه.' },
    how: { en: 'Say the current terms need approval from someone not in the room, then return later asking for a further concession as "what it will take to get approved".', ar: 'القول إن الشروط الحالية تحتاج موافقة من شخص غير موجود في الغرفة، ثم العودة لاحقاً لطلب تنازل إضافي باعتباره "ما يلزم للحصول على الموافقة".' },
    desiredResult: { en: 'An extra concession is extracted in a second round that would have been resisted if requested directly in the first session.', ar: 'استخلاص تنازل إضافي في جولة ثانية كان سيُقاوَم لو طُلب مباشرة في الجلسة الأولى.' },
    followUp: { en: 'If genuinely needing internal approval, be transparent about the process and timeline up front rather than using it as a late surprise.', ar: 'إذا كانت الموافقة الداخلية مطلوبة فعلاً، كن شفافاً بشأن العملية والجدول الزمني منذ البداية بدلاً من استخدامها كمفاجأة متأخرة.' },
    counterTactic: { en: 'Ask upfront, before finalizing terms, who has actual authority to approve -- and try to negotiate directly with that person, or make clear the current offer is contingent and may be revised down if reopened.', ar: 'اسأل مسبقاً، قبل إنهاء الشروط، عن الجهة صاحبة الصلاحية الفعلية للموافقة -- وحاول التفاوض مباشرة معها، أو وضّح أن العرض الحالي مشروط وقد يُعدَّل للأسفل إذا أُعيد فتحه.' },
    suitableQuadrants: ['strategic', 'bottleneck', 'leverage'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Legitimate as a real approval process; manipulative when the "higher authority" is invented or already informally agreed.', ar: 'مشروع كعملية موافقة حقيقية؛ تلاعبي عندما تكون "السلطة الأعلى" مختلَقة أو موافقة بالفعل بشكل غير رسمي.' },
    source: 'PON Harvard hardball-tactics literature (commitment-tactic family)',
  },
  {
    id: 'bogey',
    name: { en: 'Bogey', ar: 'القضية الوهمية (Bogey)' },
    category: 'information-control',
    whatItIs: { en: 'Pretending an unimportant issue matters a great deal, so it can later be traded away in exchange for a real concession on something that actually matters.', ar: 'التظاهر بأن قضية غير مهمة ذات أهمية كبيرة، بحيث يمكن التنازل عنها لاحقاً مقابل تنازل حقيقي في أمر مهم فعلاً.' },
    when: { en: 'Early in a negotiation, before real priorities are disclosed, to plant a false trading chip.', ar: 'في وقت مبكر من التفاوض، قبل الكشف عن الأولويات الحقيقية، لزرع ورقة مقايضة وهمية.' },
    where: { en: 'Multi-issue negotiations -- most useful in Strategic and Bottleneck deals with many tradeable terms; less relevant in single-issue Leverage price negotiations.', ar: 'المفاوضات متعددة القضايا -- الأكثر فائدة في الصفقات الاستراتيجية وصفقات الاختناق ذات الشروط المتعددة القابلة للمقايضة؛ أقل أهمية في مفاوضات النفوذ أحادية القضية على السعر.' },
    how: { en: 'Raise a manufactured concern (e.g., an "expedite fee" on stock that is already sitting in inventory) as a firm requirement, then later "concede" it in exchange for movement on a real priority.', ar: 'إثارة قلق مصطنع (مثل "رسوم استعجال" على مخزون موجود بالفعل) كمتطلب ثابت، ثم "التنازل" عنه لاحقاً مقابل تحرك في أولوية حقيقية.' },
    desiredResult: { en: 'A real concession is obtained on the true priority, at the cost of only a fake one that was never genuinely needed.', ar: 'الحصول على تنازل حقيقي في الأولوية الفعلية، مقابل التنازل فقط عن أمر وهمي لم يكن مطلوباً أصلاً.' },
    followUp: { en: 'Track which issues were raised early and then dropped easily -- a pattern of this suggests bogeys were used, informing how the next round is approached.', ar: 'تتبّع القضايا التي أُثيرت مبكراً ثم أُسقطت بسهولة -- نمط كهذا يشير إلى استخدام قضايا وهمية، ما يُفيد في نهج الجولة التالية.' },
    counterTactic: { en: 'Ask the counterpart to rank their own stated priorities early and explicitly. A sudden, easy concession on something claimed to be critical is a strong sign it was a bogey.', ar: 'اطلب من الطرف الآخر ترتيب أولوياته المُعلنة مبكراً وبوضوح. التنازل المفاجئ والسهل عن شيء ادُّعي أنه بالغ الأهمية إشارة قوية إلى أنه كان قضية وهمية.' },
    suitableQuadrants: ['strategic', 'bottleneck'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'A deceptive tactic by definition -- documented for recognition and defense only, never recommended for client use.', ar: 'تكتيك خادع بحكم تعريفه -- موثَّق للتعرف عليه والدفاع ضده فقط، ولا يُنصح أبداً باستخدامه من قِبل العميل.' },
    source: 'PON Harvard hardball-tactics literature; Newsmoor negotiation-tactics guide',
  },
  {
    id: 'snow-job',
    name: { en: 'Snow Job', ar: 'إغراق المعلومات (Snow Job)' },
    category: 'information-control',
    whatItIs: { en: 'Overwhelming the other side with excessive information, data, or technical detail to obscure real priorities, a weak position, or an unfavorable term buried inside it.', ar: 'إغراق الطرف الآخر بمعلومات أو بيانات أو تفاصيل تقنية مفرطة لإخفاء الأولويات الحقيقية أو موقف ضعيف أو شرط غير مؤاتٍ مدفون داخلها.' },
    when: { en: 'When presenting a proposal or contract that contains a term the counterpart would object to if it were made prominent.', ar: 'عند تقديم عرض أو عقد يحتوي شرطاً قد يعترض عليه الطرف الآخر لو أُبرز بوضوح.' },
    where: { en: 'Technical or complex Strategic and Bottleneck deals where volume of documentation is already high and an unfavorable clause can hide easily.', ar: 'الصفقات الاستراتيجية وصفقات الاختناق المعقدة أو التقنية حيث يكون حجم التوثيق مرتفعاً بالفعل ويمكن أن يختبئ بند غير مؤاتٍ بسهولة.' },
    how: { en: 'Bury the key term in dense technical appendices, lengthy standard clauses, or an avalanche of supporting data delivered under time pressure.', ar: 'دفن البند الرئيسي في ملاحق تقنية كثيفة، أو بنود قياسية طويلة، أو كمّ هائل من البيانات الداعمة يُسلَّم تحت ضغط الوقت.' },
    desiredResult: { en: 'The unfavorable term is accepted unnoticed because reviewing every page in the time available was impractical.', ar: 'قبول البند غير المؤاتي دون ملاحظته لأن مراجعة كل صفحة ضمن الوقت المتاح لم تكن عملية.' },
    followUp: { en: 'Require a plain-language summary of every material change from the last agreed version before signing anything.', ar: 'اطلب ملخصاً بلغة واضحة لكل تغيير جوهري عن آخر نسخة مُتفق عليها قبل توقيع أي شيء.' },
    counterTactic: { en: 'Insist on a redline against the previous version or a plain-language summary of every substantive term, and refuse to sign under a deadline that prevents proper legal and technical review.', ar: 'أصرّ على نسخة بالتعديلات المميَّزة مقارنة بالنسخة السابقة أو ملخص بلغة واضحة لكل شرط جوهري، وارفض التوقيع تحت موعد نهائي يمنع المراجعة القانونية والتقنية المناسبة.' },
    suitableQuadrants: ['strategic', 'bottleneck'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'Overwhelming detail is not inherently dishonest, but using volume specifically to conceal a material term is a deceptive practice.', ar: 'التفصيل المفرط ليس خداعاً بطبيعته، لكن استخدام الحجم تحديداً لإخفاء شرط جوهري ممارسة خادعة.' },
    source: 'PON Harvard hardball-tactics literature; standard negotiation-training material',
  },
  {
    id: 'bluffing-puffing-lying',
    name: { en: 'Bluffing, Puffing, and Lying', ar: 'التبجح والمبالغة والكذب' },
    category: 'information-control',
    whatItIs: { en: 'Exaggerated claims, misrepresented facts, or outright fabrications about costs, alternatives, timelines, or intentions.', ar: 'ادعاءات مبالغ فيها، أو حقائق مُحرَّفة، أو اختلاقات صريحة بشأن التكاليف أو البدائل أو الجداول الزمنية أو النوايا.' },
    when: { en: 'Whenever a counterpart believes a claim cannot easily be verified within the negotiation timeframe.', ar: 'كلما اعتقد الطرف الآخر أن ادعاءً ما لا يمكن التحقق منه بسهولة ضمن الإطار الزمني للتفاوض.' },
    where: { en: 'Any quadrant -- most damaging in Strategic relationships where discovery later destroys trust that took years to build.', ar: 'أي ربع -- الأكثر ضرراً في العلاقات الاستراتيجية حيث يدمر اكتشافه لاحقاً ثقة استغرق بناؤها سنوات.' },
    how: { en: 'State an unverified or false claim (e.g., "we already have a competing offer 15% lower") with confidence and no supporting documentation offered.', ar: 'ذكر ادعاء غير موثَّق أو خاطئ (مثل "لدينا بالفعل عرض منافس أقل بنسبة 15%") بثقة دون تقديم مستندات داعمة.' },
    desiredResult: { en: 'The counterpart adjusts their position based on the false claim, believing it to be verified fact.', ar: 'يعدّل الطرف الآخر موقفه بناءً على الادعاء الخاطئ، معتقداً أنه حقيقة موثَّقة.' },
    followUp: { en: "If a bluff you called turns out to have been false, treat it as material information about the counterpart's future reliability, not just a one-off negotiating move.", ar: 'إذا تبين أن بلوفاً كشفته كان كاذباً، تعامل معه كمعلومة جوهرية عن موثوقية الطرف الآخر مستقبلاً، لا كخطوة تفاوضية عابرة.' },
    counterTactic: { en: 'Be skeptical of claims that sound too good or too dire to be true. Ask for the supporting evidence (a written quote, a dated document) before adjusting your position, and verify independently where the stakes justify it.', ar: 'كن متشككاً في الادعاءات التي تبدو جيدة جداً أو مقلقة جداً لتكون صحيحة. اطلب الدليل الداعم (عرض سعر مكتوب، مستند مؤرَّخ) قبل تعديل موقفك، وتحقّق بشكل مستقل عندما تبرر المخاطر ذلك.' },
    suitableQuadrants: ['strategic', 'bottleneck', 'leverage'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'Never appropriate for the client to use -- documented purely for recognition and defense; outright lying can also carry real legal and reputational risk.', ar: 'غير مناسب أبداً لأن يستخدمه العميل -- موثَّق فقط للتعرف عليه والدفاع ضده؛ الكذب الصريح قد يحمل أيضاً مخاطر قانونية وسمعية حقيقية.' },
    source: 'PON Harvard, "10 Hard-Bargaining Tactics to Watch Out for in a Negotiation"',
  },
  {
    id: 'straw-man',
    name: { en: 'Straw Man', ar: 'رجل القش (Straw Man)' },
    category: 'information-control',
    whatItIs: { en: 'Introducing a minor, easily conceded issue framed as a real demand, then conceding it prominently to create a sense of reciprocity that is used to extract a genuine concession in return.', ar: 'إدخال قضية بسيطة يسهل التنازل عنها وتأطيرها كمطلب حقيقي، ثم التنازل عنها بشكل بارز لخلق شعور بالمعاملة بالمثل يُستخدم لاستخلاص تنازل حقيقي بالمقابل.' },
    when: { en: 'Mid-negotiation, once real priorities are known internally but not yet disclosed to the other side.', ar: 'في منتصف التفاوض، بعد معرفة الأولويات الحقيقية داخلياً لكن قبل الكشف عنها للطرف الآخر.' },
    where: { en: 'Multi-issue Strategic and Bottleneck negotiations, similar in mechanism to the Bogey tactic.', ar: 'المفاوضات متعددة القضايا الاستراتيجية ومفاوضات الاختناق، بآلية مشابهة لتكتيك القضية الوهمية.' },
    how: { en: 'Raise the minor issue as if it were significant, then trade it away visibly ("look, we\'ll drop that") to bank goodwill for the next ask.', ar: 'إثارة القضية البسيطة وكأنها مهمة، ثم التنازل عنها بشكل ظاهر ("انظر، سنتنازل عن ذلك") لتكوين رصيد من حسن النية للطلب التالي.' },
    desiredResult: { en: 'The counterpart feels they owe a reciprocal concession, having just watched one apparently given up.', ar: 'يشعر الطرف الآخر بأنه مدين بتنازل مقابل، بعد أن شهد للتو تنازلاً ظاهرياً.' },
    followUp: { en: 'Same as Bogey -- track which issues were raised and dropped quickly, and discount any implied "debt" of reciprocity that followed.', ar: 'كما في القضية الوهمية -- تتبّع القضايا التي أُثيرت وأُسقطت بسرعة، وخصم أي "دين" ضمني للمعاملة بالمثل تبع ذلك.' },
    counterTactic: { en: 'Do not treat an easy concession as owing a reciprocal one automatically -- evaluate every subsequent ask on its own merits against your MIL objectives.', ar: 'لا تتعامل مع تنازل سهل باعتباره يستوجب تنازلاً مقابلاً تلقائياً -- قيّم كل طلب لاحق بمعزل استناداً إلى أهداف الإطار (يجب/ينبغي/يفضَّل) الخاصة بك.' },
    suitableQuadrants: ['strategic', 'bottleneck'],
    ethicalRisk: 'moderate',
    ethicalNote: { en: 'A manipulative framing device -- borderline rather than outright deceptive, since the "concession" itself is often genuine, only its significance is inflated.', ar: 'أداة تأطير تلاعبية -- حدّية أكثر منها خادعة صراحة، إذ يكون "التنازل" نفسه حقيقياً غالباً، وما يُضخَّم هو أهميته فقط.' },
    source: 'Standard negotiation-training material (referenced in PON Harvard reader comments and hardball-tactics guides)',
  },
  {
    id: 'prisoners-dilemma-tit-for-tat',
    name: { en: "Prisoner's Dilemma / Tit-for-Tat", ar: 'معضلة السجين / المثل بالمثل' },
    category: 'game-theoretic',
    whatItIs: { en: 'A game-theory model of two parties choosing to cooperate or defect without knowing the other\'s choice. In a single interaction, mutual defection is the rational equilibrium; in a REPEATED relationship, Anatol Rapoport\'s "tit-for-tat" strategy (cooperate first, then mirror the counterpart\'s last move) reliably outperforms pure self-interest and builds durable cooperation.', ar: 'نموذج نظرية ألعاب لطرفين يختاران التعاون أو الخيانة دون معرفة اختيار الآخر. في تفاعل واحد، الخيانة المتبادلة هي التوازن العقلاني؛ أما في علاقة متكررة، فإن استراتيجية "المثل بالمثل" لأناتول رابوبورت (التعاون أولاً، ثم محاكاة آخر تحرك للطرف الآخر) تتفوق باستمرار على المصلحة الذاتية البحتة وتبني تعاوناً دائماً.' },
    when: { en: 'At the start of, and throughout, an ongoing multi-year supplier relationship where both sides will negotiate again and again -- not a one-time transaction.', ar: 'في بداية علاقة مورد متعددة السنوات ومستمرة سيتفاوض فيها الطرفان مراراً وتكراراً -- وليس في معاملة لمرة واحدة.' },
    where: { en: 'Strategic and Bottleneck quadrants specifically -- the repeated-game logic only creates real leverage where the relationship genuinely continues; irrelevant to a true one-shot Non-critical purchase.', ar: 'الربعان الاستراتيجي والاختناق تحديداً -- منطق اللعبة المتكررة لا يخلق نفوذاً حقيقياً إلا حيث تستمر العلاقة فعلاً؛ غير ذي صلة بشراء غير حرج لمرة واحدة فعلياً.' },
    how: { en: 'Open every new negotiation cycle in good faith (cooperate). If the counterpart defects (reneges, hard-bargains unexpectedly, or breaches an understanding), respond in kind on the NEXT round -- then return to cooperation as soon as they do. Never punish more harshly than the original defection, and never hold a grudge past one retaliatory round ("generous" tit-for-tat).', ar: 'ابدأ كل دورة تفاوض جديدة بحسن نية (تعاون). إذا خان الطرف الآخر (تراجع، أو ساوم بقسوة غير متوقعة، أو خرق تفاهماً)، رد بالمثل في الجولة التالية -- ثم عد إلى التعاون فور عودته إليه. لا تعاقب أشد من الخيانة الأصلية أبداً، ولا تحمل ضغينة بعد جولة انتقام واحدة ("المثل بالمثل السخي").' },
    desiredResult: { en: 'A stable, self-reinforcing pattern of mutual cooperation over the life of the relationship, which durably outperforms either constant aggression or constant unconditional concession.', ar: 'نمط مستقر وذاتي التعزيز من التعاون المتبادل طوال عمر العلاقة، يتفوق باستمرار على العدوان المستمر أو التنازل غير المشروط المستمر.' },
    followUp: { en: 'After any defection-and-response cycle, explicitly re-open cooperative signaling (e.g., a goodwill gesture) rather than letting the relationship drift into permanent mutual defection.', ar: 'بعد أي دورة خيانة ورد فعل، أعد فتح إشارات التعاون صراحة (مثل بادرة حسن نية) بدلاً من ترك العلاقة تنجرف نحو خيانة متبادلة دائمة.' },
    counterTactic: { en: 'If a counterpart appears to be exploiting one-sided cooperation (always defecting while expecting the client to keep cooperating), respond with a single, clear, proportionate reciprocal move -- not silence, which reads as unconditional surrender and invites further exploitation.', ar: 'إذا بدا أن الطرف الآخر يستغل التعاون أحادي الجانب (يخون دائماً بينما يتوقع من العميل الاستمرار بالتعاون)، رد بتحرك مقابل واحد وواضح ومتناسب -- لا بالصمت الذي يُقرأ كاستسلام غير مشروط ويشجع على مزيد من الاستغلال.' },
    suitableQuadrants: ['strategic', 'bottleneck'],
    ethicalRisk: 'low',
    ethicalNote: { en: 'A principled, transparent strategy -- can be explained openly to a counterpart without losing its effectiveness, unlike most tactics on this list.', ar: 'استراتيجية مبدئية وشفافة -- يمكن شرحها علناً للطرف الآخر دون أن تفقد فعاليتها، بخلاف معظم التكتيكات في هذه القائمة.' },
    source: "Axelrod's iterated Prisoner's Dilemma tournaments; Anatol Rapoport's tit-for-tat strategy; documented application to repeated business negotiations",
  },
  {
    id: 'chicken-game-brinkmanship',
    name: { en: 'Chicken Game / Brinkmanship', ar: 'لعبة تشيكن / حافة الهاوية' },
    category: 'game-theoretic',
    whatItIs: { en: 'A game-theory model where two parties race toward a deadline or confrontation, each betting the other will swerve (concede) first -- whoever concedes "loses", but mutual refusal to swerve produces a worse outcome for both than either conceding would have.', ar: 'نموذج نظرية ألعاب يتسابق فيه طرفان نحو موعد نهائي أو مواجهة، ويراهن كل منهما على أن الآخر سينحرف (يتنازل) أولاً -- من ينحرف "يخسر"، لكن رفض الانحراف المتبادل ينتج نتيجة أسوأ للطرفين مما كان سينتج عن تنازل أي منهما.' },
    when: { en: 'Deadline standoffs where both sides have publicly committed to a position and neither wants to be seen backing down first.', ar: 'مواقف المواجهة عند الموعد النهائي حيث التزم الطرفان علناً بموقف ولا يريد أي منهما أن يُرى وهو يتراجع أولاً.' },
    where: { en: "Can arise in any quadrant during a real impasse, but carries the highest real cost in Bottleneck negotiations, where a supply disruption from mutual refusal to concede directly harms the client's own operations.", ar: 'يمكن أن ينشأ في أي ربع أثناء طريق مسدود حقيقي، لكنه يحمل أعلى كلفة فعلية في مفاوضات الاختناق، حيث يضر انقطاع الإمداد الناتج عن الرفض المتبادل بعمليات العميل نفسها مباشرة.' },
    how: { en: 'Publicly commit to a position (e.g., "we will not pay above X" stated to internal stakeholders or even the market) to remove your own room to back down, forcing the other side to be the one who yields.', ar: 'الالتزام علناً بموقف (مثل "لن ندفع أكثر من كذا" المُعلن لأصحاب المصلحة الداخليين أو حتى للسوق) لإزالة مجال تراجعك الخاص، وإجبار الطرف الآخر على أن يكون هو من يستسلم.' },
    desiredResult: { en: "The counterpart yields first because the cost of mutual collision (contract collapse, supply disruption) is higher for them, or because their commitment was less binding.", ar: 'استسلام الطرف الآخر أولاً لأن كلفة التصادم المتبادل (انهيار العقد، انقطاع الإمداد) أعلى بالنسبة له، أو لأن التزامه كان أقل صرامة.' },
    followUp: { en: "Before entering a brinkmanship dynamic, calculate the real cost of mutual collision to the client's own operations -- if that cost is high (a Bottleneck supply cutoff), this is the wrong tactic regardless of who \"wins\".", ar: 'قبل الدخول في ديناميكية حافة الهاوية، احسب الكلفة الفعلية للتصادم المتبادل على عمليات العميل نفسها -- إذا كانت هذه الكلفة عالية (انقطاع إمداد في وضع اختناق)، فهذا التكتيك خاطئ بغض النظر عمن "يفوز".' },
    counterTactic: { en: 'Refuse to let the standoff become binary. Introduce a third option or a short, face-saving extension that lets both sides step back without a public loss, and quietly verify whether the counterpart\'s "commitment" is actually as binding as claimed.', ar: 'ارفض السماح للمواجهة بأن تصبح ثنائية. قدّم خياراً ثالثاً أو تمديداً قصيراً يحفظ ماء الوجه يسمح لكلا الطرفين بالتراجع دون خسارة علنية، وتحقق بهدوء مما إذا كان "التزام" الطرف الآخر صارماً فعلاً كما يُدّعى.' },
    suitableQuadrants: ['bottleneck', 'leverage'],
    ethicalRisk: 'high',
    ethicalNote: { en: 'Explicitly flagged as UNSUITABLE for Strategic relationships regardless of ethical framing -- the escalation risk itself, not just the deception, makes it a poor fit wherever the relationship must survive the negotiation.', ar: 'يُشار إليه صراحة بأنه غير مناسب للعلاقات الاستراتيجية بصرف النظر عن الإطار الأخلاقي -- فمخاطر التصعيد بحد ذاتها، وليس الخداع فقط، تجعله خياراً سيئاً حيثما يجب أن تنجو العلاقة من التفاوض.' },
    source: 'Standard game-theory literature on brinkmanship and escalation dynamics (Chicken Game model)',
  },
  {
    id: 'ackerman-model',
    name: { en: 'Ackerman Model', ar: 'نموذج أكرمان' },
    category: 'principled',
    whatItIs: { en: "A structured, four-step concession model from Chris Voss's \"Never Split the Difference\": set a target price, then move through a sequence of offers at roughly 65%, 85%, 95%, and 100% of that target, using shrinking increments and calibrated questions between each move, and closing with a small non-monetary extra rather than a round final number.", ar: 'نموذج تنازل منظم من أربع خطوات من كتاب كريس فوس "لا تقسم الفرق أبداً": حدد سعراً مستهدفاً، ثم انتقل عبر سلسلة عروض عند حوالي 65% و85% و95% و100% من ذلك الهدف، باستخدام زيادات متناقصة وأسئلة معايرة بين كل تحرك، واختم بإضافة صغيرة غير نقدية بدلاً من رقم نهائي مستدير.' },
    when: { en: 'In any distributive or mixed negotiation where the client is the party making a structured series of offers toward a target price.', ar: 'في أي تفاوض تنافسي أو مختلط يكون فيه العميل هو الطرف الذي يقدم سلسلة منظمة من العروض نحو سعر مستهدف.' },
    where: { en: 'Leverage and mixed Bottleneck negotiations where price is a real, negotiable variable; less relevant where price is not the primary lever (Strategic joint-value deals).', ar: 'مفاوضات النفوذ ومفاوضات الاختناق المختلطة حيث يكون السعر متغيراً حقيقياً وقابلاً للتفاوض؛ أقل أهمية حيث لا يكون السعر الأداة الرئيسية (الصفقات الاستراتيجية ذات القيمة المشتركة).' },
    how: { en: 'Calculate your real target. Offer 65% of it first, then 85%, then 95%, then a final, deliberately odd (non-round) number just under 100% -- pausing after each move to ask a calibrated question ("how am I supposed to do that?") rather than simply waiting for a reply. Close with a small, unexpected non-cash extra (an accelerated delivery slot, an added service) rather than a further price move.', ar: 'احسب هدفك الحقيقي. اعرض 65% منه أولاً، ثم 85%، ثم 95%، ثم رقماً نهائياً غريباً عمداً (غير مستدير) قريباً من 100% -- متوقفاً بعد كل تحرك لطرح سؤال معايرة ("كيف يُفترض أن أفعل ذلك؟") بدلاً من الانتظار السلبي للرد. اختم بإضافة صغيرة غير نقدية وغير متوقعة (موعد تسليم مُعجَّل، خدمة إضافية) بدلاً من تحرك سعري إضافي.' },
    desiredResult: { en: 'The counterpart feels they are watching real, effortful movement toward agreement (not an arbitrary jump) and feels a sense of having "won" the final, odd number and the surprise extra -- while the client lands very close to its real target.', ar: 'يشعر الطرف الآخر بأنه يشهد تحركاً حقيقياً وجاداً نحو الاتفاق (لا قفزة عشوائية) ويشعر بأنه "فاز" بالرقم الغريب النهائي والإضافة المفاجئة -- بينما يصل العميل قريباً جداً من هدفه الحقيقي.' },
    followUp: { en: 'Confirm the final number and the non-cash extra in writing immediately -- the psychological win of the "surprise" only holds if it is delivered as promised.', ar: 'أكّد الرقم النهائي والإضافة غير النقدية كتابياً فوراً -- فالانتصار النفسي لـ "المفاجأة" لا يصمد إلا إذا سُلِّم كما وُعد.' },
    counterTactic: { en: 'Recognize the shrinking-increment pattern (65/85/95/100) as a structured technique, not organic movement -- focus on your own researched target and BATNA rather than being anchored purely by the shrinking gaps.', ar: 'تعرّف على نمط الزيادات المتناقصة (65/85/95/100) كتقنية منظمة، لا تحركاً عضوياً -- ركّز على هدفك المدروس وبديلك الأفضل بدلاً من الانرساء فقط على الفجوات المتناقصة.' },
    suitableQuadrants: ['leverage', 'bottleneck'],
    ethicalRisk: 'low',
    ethicalNote: { en: 'A transparent, principled concession structure -- not deceptive, since the logic can be explained openly and still functions.', ar: 'هيكل تنازل شفاف ومبدئي -- غير خادع، إذ يمكن شرح منطقه علناً ويظل يعمل رغم ذلك.' },
    source: 'Chris Voss, "Never Split the Difference" (2016)',
  },
  {
    id: 'calibrated-questions-tactical-empathy',
    name: { en: 'Calibrated Questions & Tactical Empathy', ar: 'الأسئلة المعايرة والتعاطف التكتيكي' },
    category: 'principled',
    whatItIs: { en: "Chris Voss's two paired techniques: tactical empathy names and acknowledges the counterpart's emotions or position without conceding anything, building trust; calibrated questions are open \"what\" or \"how\" questions that shift the burden of solving a problem onto the counterpart, rather than making a demand they can simply reject.", ar: 'تقنيتان مترابطتان من كريس فوس: التعاطف التكتيكي يسمّي مشاعر أو موقف الطرف الآخر ويعترف بها دون التنازل عن أي شيء، ما يبني الثقة؛ والأسئلة المعايرة هي أسئلة مفتوحة تبدأ بـ "ماذا" أو "كيف" تنقل عبء حل المشكلة إلى الطرف الآخر، بدلاً من تقديم مطلب يمكنه رفضه ببساطة.' },
    when: { en: 'Throughout any negotiation, especially when a counterpart states a hard "no" or an emotionally charged objection.', ar: 'طوال أي تفاوض، خاصة عندما يصرّح الطرف الآخر بـ "لا" قاطعة أو اعتراض مشحون عاطفياً.' },
    where: { en: 'Effective and appropriate across every Kraljic quadrant -- one of the few tactics on this list with no quadrant-specific restriction, since it strengthens rather than risks the relationship.', ar: 'فعّال ومناسب عبر كل ربع من أرباع كرالييك -- أحد التكتيكات القليلة في هذه القائمة دون قيد خاص بربع معين، لأنه يعزز العلاقة بدلاً من تعريضها للخطر.' },
    how: { en: 'Name the emotion or constraint out loud ("it sounds like this timeline is a real problem for your production schedule") before responding to the substance. Follow resistance with a calibrated question ("how am I supposed to accept these terms and still meet my own commitments?") instead of a counter-demand.', ar: 'سمِّ المشاعر أو القيد بصوت مسموع ("يبدو أن هذا الجدول الزمني مشكلة حقيقية لجدول إنتاجكم") قبل الرد على الجوهر. أتبع المقاومة بسؤال معاير ("كيف يُفترض أن أقبل هذه الشروط وأظل ألتزم بتعهداتي الخاصة؟") بدلاً من مطلب مقابل.' },
    desiredResult: { en: 'The counterpart feels heard, lowers defensiveness, and often proposes a solution themselves that the client could not have demanded directly without resistance.', ar: 'يشعر الطرف الآخر بأنه مسموع، فتنخفض دفاعيته، وغالباً ما يقترح حلاً بنفسه لم يكن العميل ليطلبه مباشرة دون مقاومة.' },
    followUp: { en: "Summarize the counterpart's own stated solution back to them in writing -- a solution they proposed is far more durable than one imposed on them.", ar: 'لخّص الحل الذي اقترحه الطرف الآخر بنفسه وأعده إليه كتابياً -- فالحل الذي يقترحه بنفسه أكثر ديمومة بكثير من الحل المفروض عليه.' },
    counterTactic: { en: 'This is a principled technique with no real downside to recognize -- if a counterpart uses it on the client, respond honestly to the calibrated question rather than treating it as a trick to resist.', ar: 'هذه تقنية مبدئية لا يوجد سلبيات حقيقية للتعرف عليها -- إذا استخدمها الطرف الآخر مع العميل، رد بصدق على السؤال المعاير بدلاً من التعامل معه كخدعة يجب مقاومتها.' },
    suitableQuadrants: ['strategic', 'leverage', 'bottleneck', 'non-critical'],
    ethicalRisk: 'low',
    ethicalNote: { en: "A transparent, relationship-building technique fully consistent with ISC's collaborative, relationship-health-oriented approach -- recommended as a default technique across every negotiation, not situational.", ar: 'تقنية شفافة تبني العلاقات ومتوافقة تماماً مع نهج ISC التعاوني الموجَّه نحو صحة العلاقة -- يُوصى بها كتقنية افتراضية عبر كل تفاوض، لا كتقنية ظرفية فقط.' },
    source: 'Chris Voss, "Never Split the Difference" (2016)',
  },
];

/** Tactics the client can appropriately choose to USE -- low ethical risk
 *  only, filtered to this quadrant's real fit. Never surfaces
 *  moderate/high-risk tactics as something to deploy. */
export function recommendClientTactics(quadrant: KraljicQuadrant): NamedNegotiationTactic[] {
  return NAMED_NEGOTIATION_TACTICS.filter(
    (t) => t.ethicalRisk === 'low' && t.suitableQuadrants.includes(quadrant),
  );
}

/** Tactics to WATCH FOR from a counterpart in this quadrant -- moderate and
 *  high ethical-risk tactics only, filtered to this quadrant's real fit.
 *  Every entry already carries its own counterTactic field. */
export function recommendWatchForTactics(quadrant: KraljicQuadrant): NamedNegotiationTactic[] {
  return NAMED_NEGOTIATION_TACTICS.filter(
    (t) => t.ethicalRisk !== 'low' && t.suitableQuadrants.includes(quadrant),
  );
}

/* ------------------------------------------------------------------------
 * Negotiation Plan Document -- roles, participants, and a multi-level
 * structure for complex negotiations.
 *
 * Direct response to: "some good companies build negotiation strategy docs
 * that have all roles, participants, tactics... for complicated cases and
 * strategic items so you can produce more than one level of negotiation."
 *
 * Real procurement practice (CIPS negotiation-planning guidance; standard
 * complex-deal negotiation playbooks) structures a negotiation team by
 * function, not just headcount, and stages complex, high-value
 * negotiations across more than one level -- technical/commercial working
 * level first, then a senior commercial round, escalating to executive
 * sponsorship only if needed. This is standard practice for Strategic and
 * Bottleneck deals; Leverage and Non-critical deals do not warrant the
 * same structure, per the same quadrant-based reasoning
 * recommendNegotiationStrategy() already applies to approach and tactics.
 * ------------------------------------------------------------------------ */

export interface NegotiationRole {
  role: Bilingual;
  responsibility: Bilingual;
}

/** The standard client-side negotiation team for a Strategic or Bottleneck
 *  negotiation -- not every role is needed for a simple Leverage or
 *  Non-critical deal, see buildNegotiationTeam() below. */
export const STANDARD_NEGOTIATION_TEAM: NegotiationRole[] = [
  {
    role: { en: 'Executive Sponsor / Decision Authority', ar: 'الراعي التنفيذي / صاحب سلطة القرار' },
    responsibility: { en: 'Holds final approval authority and is the only person authorized to make or accept a Must-tier MIL objective trade-off; engaged directly for Strategic and Bottleneck relationships, not delegated.', ar: 'يملك سلطة الموافقة النهائية وهو الوحيد المخوَّل لتقديم أو قبول مقايضة في هدف من مستوى "يجب"؛ يُشرَك مباشرة في العلاقات الاستراتيجية وعلاقات الاختناق، دون تفويض.' },
  },
  {
    role: { en: 'Lead Negotiator / Category Manager', ar: 'المفاوض الرئيسي / مدير الفئة' },
    responsibility: { en: 'Owns the negotiation strategy end-to-end, runs the session, and is the single point of continuity across every round and level.', ar: 'يمتلك استراتيجية التفاوض من البداية للنهاية، ويدير الجلسة، ويمثّل نقطة الاستمرارية الوحيدة عبر كل جولة ومستوى.' },
  },
  {
    role: { en: 'Technical / Engineering SME', ar: 'الخبير الفني / الهندسي' },
    responsibility: { en: 'Validates that any proposed technical or specification trade-off is real and safe to make -- prevents a commercial win that creates an operational problem.', ar: 'يتحقق من أن أي مقايضة فنية أو في المواصفات مطروحة حقيقية وآمنة -- يمنع فوزاً تجارياً يخلق مشكلة تشغيلية.' },
  },
  {
    role: { en: 'Finance & Commercial Analyst', ar: 'محلل مالي وتجاري' },
    responsibility: { en: 'Builds and defends the real cost/TCO model behind every number on the table, and verifies any objective-criteria claim the counterpart makes.', ar: 'يبني ويدافع عن نموذج التكلفة/إجمالي تكلفة الملكية الحقيقي وراء كل رقم على الطاولة، ويتحقق من أي ادعاء بمعايير موضوعية يقدمه الطرف الآخر.' },
  },
  {
    role: { en: 'Legal / Contracts', ar: 'الشؤون القانونية / العقود' },
    responsibility: { en: 'Reviews every material term before signing, is the required check against the Snow Job and Straw Man tactics above, and drafts the final agreement language.', ar: 'يراجع كل شرط جوهري قبل التوقيع، ويشكّل التحقق المطلوب ضد تكتيكي إغراق المعلومات ورجل القش أعلاه، ويصيغ لغة الاتفاقية النهائية.' },
  },
  {
    role: { en: 'Risk & Continuity Owner', ar: 'مسؤول المخاطر واستمرارية الإمداد' },
    responsibility: { en: "Owns the BATNA-building work (dual-sourcing, in-house substitute) in parallel with the negotiation itself -- most critical for Bottleneck deals where this role IS the client's real leverage.", ar: 'يمتلك العمل على بناء البديل الأفضل (مصادر مزدوجة، بديل داخلي) بالتوازي مع التفاوض نفسه -- الأهم في صفقات الاختناق حيث يمثّل هذا الدور نفوذ العميل الحقيقي.' },
  },
];

/** Complex negotiations (Strategic, Bottleneck) warrant the full team;
 *  simple ones (Leverage, Non-critical) are handled by the Lead Negotiator
 *  alone plus the Finance analyst, per the same proportionality logic
 *  recommendNegotiationStrategy() already applies to negotiation effort. */
export function buildNegotiationTeam(quadrant: KraljicQuadrant): NegotiationRole[] {
  if (quadrant === 'strategic' || quadrant === 'bottleneck') {
    return STANDARD_NEGOTIATION_TEAM;
  }
  return STANDARD_NEGOTIATION_TEAM.filter(
    (r) => r.role.en === 'Lead Negotiator / Category Manager' || r.role.en === 'Finance & Commercial Analyst',
  );
}

export interface NegotiationLevel {
  level: number;
  name: Bilingual;
  purpose: Bilingual;
  participants: Bilingual;
  typicalIssues: Bilingual;
}

const MULTI_LEVEL_STRUCTURE: NegotiationLevel[] = [
  {
    level: 1,
    name: { en: 'Level 1 -- Technical & Commercial Pre-Negotiation', ar: 'المستوى الأول -- التفاوض الفني والتجاري التمهيدي' },
    purpose: { en: 'Align on scope, specifications, and feasibility before any price or term is discussed -- prevents a commercial deal being struck on a technical assumption that later proves wrong.', ar: 'التوافق على النطاق والمواصفات والجدوى قبل مناقشة أي سعر أو شرط -- يمنع إبرام صفقة تجارية على افتراض فني يتضح لاحقاً أنه خاطئ.' },
    participants: { en: 'Technical/Engineering SMEs from both sides, with the Lead Negotiator observing.', ar: 'الخبراء الفنيون والهندسيون من الطرفين، مع حضور المفاوض الرئيسي كمراقب.' },
    typicalIssues: { en: 'Specification tolerances, quality standards, delivery feasibility, technical risk allocation.', ar: 'هوامش المواصفات، معايير الجودة، جدوى التسليم، توزيع المخاطر الفنية.' },
  },
  {
    level: 2,
    name: { en: 'Level 2 -- Commercial Negotiation', ar: 'المستوى الثاني -- التفاوض التجاري' },
    purpose: { en: 'The main negotiation round: price, payment terms, SLAs, and the majority of the tactics and MIL objectives in this module are applied here.', ar: 'الجولة الرئيسية للتفاوض: السعر، شروط الدفع، اتفاقيات مستوى الخدمة -- ومعظم التكتيكات وأهداف الإطار (يجب/ينبغي/يفضَّل) في هذه الوحدة تُطبَّق هنا.' },
    participants: { en: "Lead Negotiator, Finance & Commercial Analyst, and Legal, against the counterpart's equivalent commercial team.", ar: 'المفاوض الرئيسي والمحلل المالي والتجاري والشؤون القانونية، مقابل الفريق التجاري المعادل للطرف الآخر.' },
    typicalIssues: { en: 'Unit price, volume commitments, payment terms, penalty/SLA clauses, contract duration.', ar: 'سعر الوحدة، التزامات الكمية، شروط الدفع، بنود الغرامات/اتفاقيات مستوى الخدمة، مدة العقد.' },
  },
  {
    level: 3,
    name: { en: 'Level 3 -- Executive Escalation', ar: 'المستوى الثالث -- التصعيد التنفيذي' },
    purpose: { en: 'Reserved for genuine deadlock on a Must-tier MIL objective, or for the relationship-level commitments (joint investment, exclusivity) that only an executive can authorize.', ar: 'مخصص للطريق المسدود الحقيقي حول هدف من مستوى "يجب"، أو للالتزامات على مستوى العلاقة (استثمار مشترك، حصرية) التي لا يمكن أن يُصرّح بها إلا تنفيذي.' },
    participants: { en: "Executive Sponsor, against the counterpart's equivalent executive -- never delegated below this level for a genuine Must-tier deadlock.", ar: 'الراعي التنفيذي، مقابل التنفيذي المعادل للطرف الآخر -- لا يُفوَّض أبداً دون هذا المستوى في حال طريق مسدود حقيقي حول هدف من مستوى "يجب".' },
    typicalIssues: { en: 'Deadlock resolution, strategic partnership commitments, relationship repair after a real breach of trust.', ar: 'حل الطريق المسدود، الالتزامات الاستراتيجية للشراكة، إصلاح العلاقة بعد خرق حقيقي للثقة.' },
  },
];

/** Strategic and Bottleneck negotiations warrant the full 3-level structure
 *  -- real procurement practice for complex, high-value deals. Leverage and
 *  Non-critical negotiations are conducted in a single round; returning a
 *  fabricated multi-level structure for a low-complexity deal would
 *  misrepresent effort that is not warranted, per Decision Record 8.7. */
export function recommendNegotiationLevels(quadrant: KraljicQuadrant): NegotiationLevel[] {
  if (quadrant === 'strategic' || quadrant === 'bottleneck') {
    return MULTI_LEVEL_STRUCTURE;
  }
  return [
    {
      level: 1,
      name: { en: 'Single-Round Commercial Negotiation', ar: 'جولة تفاوض تجارية واحدة' },
      purpose: { en: 'This quadrant does not warrant a multi-level structure -- the transaction cost of staging Leverage or Non-critical negotiations across multiple levels would exceed the value at stake.', ar: 'لا يستدعي هذا الربع هيكلاً متعدد المستويات -- تكلفة تنظيم مفاوضات النفوذ أو غير الحرجة عبر مستويات متعددة تتجاوز القيمة المعنية.' },
      participants: { en: 'Lead Negotiator and Finance & Commercial Analyst only.', ar: 'المفاوض الرئيسي والمحلل المالي والتجاري فقط.' },
      typicalIssues: { en: 'Price, payment terms, and standard commercial conditions, resolved in a single session.', ar: 'السعر، شروط الدفع، والشروط التجارية القياسية، تُحسم في جلسة واحدة.' },
    },
  ];
}
