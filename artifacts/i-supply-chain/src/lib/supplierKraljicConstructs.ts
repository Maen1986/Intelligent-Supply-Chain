/**
 * Sub-type deciding constructs (Round B4, item 3).
 *
 * For every sub-type: the measured construct that decides it (not a re-read
 * of the two axes: Caniels & Gelderman note Kraljic does not treat power and
 * dependence explicitly), the questions a reviewer should ask ("why is it
 * here"), the grounding, and whether the name is sourced or ISC synthesis.
 * Grounding: Gelderman & van Weele (2003) hold-or-move logic and their
 * lock-in versus chosen-partnership split; Kraljic (1983) exploit/balance/
 * diversify; Tip et al. (2021/22) temporary bottlenecks in COVID; Tomlin
 * (2006) on short versus long disruptions.
 *
 * STANDALONE-FIRST: no imports.
 */
import type { Bilingual, SubtypeKey } from './supplierKraljicSubtypes';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

export interface Construct {
  construct: Bilingual;
  whyHere: Bilingual[];
  grounding: Bilingual;
  origin: 'sourced' | 'isc-synthesis';
}

export const CONSTRUCTS: Record<SubtypeKey, Construct> = {
  'bottleneck-movable': {
    construct: b('Scarcity that can be removed: a qualified alternative exists, or the specification can change.', 'ندرة يمكن إزالتها: يوجد بديل مؤهَّل أو يمكن تغيير المواصفة.'),
    whyHere: [
      b('Who else could supply this, and what would they need to change?', 'من يستطيع التوريد غير هذا المورد، وما الذي يلزمهم تغييره؟'),
      b('Is the tight specification really needed, or just inherited?', 'هل المواصفة الضيقة ضرورية فعلًا أم موروثة؟'),
    ],
    grounding: b('Gelderman & van Weele (2003): bottleneck items can often move toward Routine by loosening the specification or re-sourcing. CIPS (2020): relax specifications.', 'Gelderman & van Weele (2003): يمكن غالبًا نقل بنود الاختناق نحو الروتيني بتخفيف المواصفة أو إعادة التوريد. CIPS (2020): خفّف المواصفات.'),
    origin: 'sourced',
  },
  'bottleneck-locked': {
    construct: b('Structural scarcity: no qualified alternative and the specification cannot change (patent, licence, single source, scarce resource).', 'ندرة هيكلية: لا بديل مؤهَّل ولا يمكن تغيير المواصفة (براءة أو ترخيص أو مصدر وحيد أو مورد نادر).'),
    whyHere: [
      b('Is the lock-in legal (licence, patent) or physical (single mine, single plant)?', 'هل القيد قانوني (ترخيص، براءة) أم مادي (منجم واحد، مصنع واحد)؟'),
      b('If this supplier stopped tomorrow, how long could we run?', 'لو توقف هذا المورد غدًا، كم نستطيع الاستمرار؟'),
    ],
    grounding: b('Gelderman & van Weele (2003): some bottleneck positions can hardly be shifted. Zsidisin: market characteristics drive structural supply risk.', 'Gelderman & van Weele (2003): بعض مواقع الاختناق يصعب تغييرها. Zsidisin: خصائص السوق تحدد خطر الإمداد الهيكلي.'),
    origin: 'sourced',
  },
  'bottleneck-situational': {
    construct: b('Shock-driven scarcity expected to recover: disruption shorter than the time we can survive without supply.', 'ندرة ناتجة عن صدمة يُتوقع زوالها: انقطاع أقصر من المدة التي نصمد فيها دون إمداد.'),
    whyHere: [
      b('What caused the shortage and when is recovery expected?', 'ما سبب النقص ومتى يُتوقع التعافي؟'),
      b('Is the expected duration shorter than our time-to-survive?', 'هل المدة المتوقعة أقصر من مدة صمودنا؟'),
    ],
    grounding: b('Tip et al. (2021): COVID turned low-risk hospital items into temporary bottlenecks. Tomlin (2006): short, frequent disruptions favour inventory; rare, long ones favour sourcing change. The sub-type itself is ISC synthesis.', 'Tip وآخرون (2021): حوّلت كوفيد بنودًا منخفضة الخطر إلى اختناقات مؤقتة. Tomlin (2006): الانقطاعات القصيرة المتكررة تناسبها المخزونات والنادرة الطويلة تناسبها إعادة التوريد. النوع الفرعي نفسه تركيب من ISC.'),
    origin: 'isc-synthesis',
  },
  'leverage-stable': {
    construct: b('Buyer power in a steady market: many suppliers, low switching cost, stable prices.', 'قوة المشتري في سوق مستقر: موردون كثر وكلفة تحويل منخفضة وأسعار مستقرة.'),
    whyHere: [
      b('How many suppliers could bid tomorrow?', 'كم مورد يستطيع التقدم للمناقصة غدًا؟'),
      b('Have prices moved less than the tolerance you accept over the last year?', 'هل تحركت الأسعار أقل من هامش التحمل الذي تقبله خلال العام الماضي؟'),
    ],
    grounding: b('Kraljic (1983): exploit purchasing power. Dyer, Cho & Chu (1998): durable arm\'s-length with a few suppliers and scheduled rebids.', 'Kraljic (1983): استثمر القوة الشرائية. Dyer وCho وChu (1998): علاقات مستقلة دائمة مع عدد قليل من الموردين وإعادة طرح مجدولة.'),
    origin: 'sourced',
  },
  'leverage-volatile': {
    construct: b('Buyer power in a swinging market: many suppliers but unstable prices.', 'قوة المشتري في سوق متأرجح: موردون كثر لكن الأسعار غير مستقرة.'),
    whyHere: [
      b('Is there a published index the price can follow?', 'هل يوجد مؤشر منشور يمكن ربط السعر به؟'),
      b('How large are the swings against your budget tolerance?', 'ما حجم التقلبات مقارنةً بهامش تحمل الميزانية؟'),
    ],
    grounding: b('Index-linked and price-adjustment clauses are a growing practice (SDA Bocconi, 2025). The stable/volatile split is ISC synthesis: no published source splits Leverage this way.', 'بنود الربط بمؤشر وتعديل السعر ممارسة متنامية (SDA Bocconi، 2025). التقسيم مستقر/متقلب تركيب من ISC: لا مصدر منشور يقسم النفوذ بهذه الطريقة.'),
    origin: 'isc-synthesis',
  },
  'noncritical-pool': {
    construct: b('Combinable demand: low value each, but sites or categories buy the same thing separately.', 'طلب قابل للتجميع: قيمة كل بند منخفضة لكن المواقع أو الفئات تشتري الشيء نفسه منفصلة.'),
    whyHere: [
      b('Do several sites or teams buy this from different suppliers?', 'هل تشتري عدة مواقع أو فرق هذا البند من موردين مختلفين؟'),
      b('Could one agreement cover them all?', 'هل يمكن لاتفاقية واحدة أن تغطيهم جميعًا؟'),
    ],
    grounding: b('Gelderman & van Weele (2003): non-critical items move up toward Leverage by pooling demand.', 'Gelderman & van Weele (2003): تنتقل البنود غير الحرجة نحو النفوذ بتجميع الطلب.'),
    origin: 'sourced',
  },
  'noncritical-process': {
    construct: b('Process efficiency: low value and not worth combining, so the goal is the least effort.', 'كفاءة العملية: قيمة منخفضة ولا يستحق التجميع، فالهدف أقل جهد ممكن.'),
    whyHere: [
      b('Is the cost of buying it more than the cost of the item?', 'هل كلفة شرائه أكبر من كلفة البند نفسه؟'),
      b('Could a catalogue or purchase card remove the manual steps?', 'هل يمكن لكتالوج أو بطاقة شراء إزالة الخطوات اليدوية؟'),
    ],
    grounding: b('Gelderman & van Weele (2003) and CIPS (2020): individual ordering, purchase card, systems contracting.', 'Gelderman & van Weele (2003) وCIPS (2020): طلب فردي وبطاقة شراء وعقود نظامية.'),
    origin: 'sourced',
  },
  'strategic-exploit': {
    construct: b('Relative power in the buyer\'s favour: company strength against supply-market strength.', 'قوة نسبية لصالح المشتري: قوة الشركة مقابل قوة سوق التوريد.'),
    whyHere: [
      b('If we reduced volume by a third, who would be hurt more?', 'لو خفضنا الكمية بمقدار الثلث، من سيتضرر أكثر؟'),
      b('Are we a major customer for this supplier?', 'هل نحن عميل رئيسي لهذا المورد؟'),
    ],
    grounding: b('Kraljic (1983) second-stage matrix: exploit when company strength is high. Caniels & Gelderman (2007) measure power and dependence.', 'مصفوفة Kraljic (1983) في المرحلة الثانية: استثمر عندما تكون قوة الشركة مرتفعة. Caniels وGelderman (2007) يقيسان القوة والاعتماد.'),
    origin: 'sourced',
  },
  'strategic-balance': {
    construct: b('Mutual dependence: both sides invest and neither can walk away cheaply (a chosen partnership).', 'اعتماد متبادل: يستثمر الطرفان ولا يستطيع أي منهما الانسحاب بسهولة (شراكة مختارة).'),
    whyHere: [
      b('Have both sides made investments that are hard to reverse?', 'هل قدّم الطرفان استثمارات يصعب التراجع عنها؟'),
      b('Is the dependence chosen, or forced on us?', 'هل الاعتماد مختار أم مفروض علينا؟'),
    ],
    grounding: b('Kraljic (1983): balance. CIPS: balance power through performance-based partnerships. Gelderman & van Weele (2003): separate a chosen partnership from an involuntary one.', 'Kraljic (1983): وازن. CIPS: وازن القوى عبر شراكات قائمة على الأداء. Gelderman & van Weele (2003): فرّق بين الشراكة المختارة والمفروضة.'),
    origin: 'sourced',
  },
  'strategic-diversify': {
    construct: b('Relative power in the supplier\'s favour: supply-market strength exceeds company strength.', 'قوة نسبية لصالح المورد: قوة سوق التوريد تفوق قوة الشركة.'),
    whyHere: [
      b('Could the supplier raise prices or cut priority without losing us?', 'هل يستطيع المورد رفع الأسعار أو خفض أولويتنا دون أن يخسرنا؟'),
      b('How long would a switch take, and what would it cost?', 'كم يستغرق التحويل وكم يكلّف؟'),
    ],
    grounding: b('Kraljic (1983): diversify when the supplier is stronger. Gelderman & van Weele (2003): an imprisoned strategic position (patent, switching cost) differs from a chosen one.', 'Kraljic (1983): نوّع عندما يكون المورد أقوى. Gelderman & van Weele (2003): الموقع الاستراتيجي المقيَّد (براءة، كلفة تحويل) يختلف عن المختار.'),
    origin: 'sourced',
  },
  unclassified: {
    construct: b('Not yet decided: one deciding fact is missing.', 'لم يُحسم بعد: تنقص حقيقة حاسمة واحدة.'),
    whyHere: [b('Which fact is missing? Answer it and the sub-type appears.', 'ما الحقيقة الناقصة؟ أجب عنها ويظهر النوع الفرعي.')],
    grounding: b('ISC rule: never guess (Decision Record 8.7).', 'قاعدة ISC: لا تخمين أبدًا (سجل القرار 8.7).'),
    origin: 'isc-synthesis',
  },
};
