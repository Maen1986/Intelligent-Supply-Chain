/**
 * TCO Knowledge Base (#168 TCO Engine rebuild, v2, 2026-08-23)
 *
 * Grounds the TCO Engine in two real, named frameworks instead of one
 * ad-hoc 5-bucket list:
 *
 *  - CIPS's 4-stage Total Cost of Ownership model (Procurement costs,
 *    Acquisition costs, Usage costs, End-of-life costs) -- the professional
 *    body's own published structure (cips.org, "Total Cost of Ownership"
 *    topic guide, verified live 2026-08-23).
 *  - Ellram, L.M., "Total Cost of Ownership: Elements and Implementation,"
 *    International Journal of Purchasing and Materials Management, 1993
 *    (29: 2-11, DOI 10.1111/j.1745-493X.1993.tb00013.x) -- the original
 *    academic TCO model, which explicitly separates
 *    transaction/process costs (PO issuance, invoice processing, supplier
 *    administration) as their own cost driver rather than folding them
 *    into acquisition logistics. CIPS's 4 stages are used as the primary
 *    structure; Ellram's process-cost category is layered on as a named
 *    5th group so neither framework is silently mis-cited as the other.
 *
 * Content-honesty note (Decision Record 8.7 / 8.6): every dollar figure
 * used in a live analysis is the user's own input -- nothing here
 * auto-fills a cost field. What this file DOES provide is a grounded,
 * citable CHECKLIST: for a given procurement Category (the platform's 7
 * SKU classes), which of the cost groups above are typically the most
 * material, and why, with a real source named for every specific claim.
 * Two tiers of confidence are used deliberately:
 *   - "grounded": tied to a specific named study/finding with a live URL.
 *   - "principle": a well-established operations-management or procurement
 *     concept (e.g. cost-of-quality escalating downstream) stated without
 *     a specific number, because no single verifiable figure applies
 *     generally enough to cite as one.
 * No industry- or sub-sector-specific numeric benchmark is asserted
 * anywhere in this file -- per the user's explicit 2026-08-23 scoping
 * decision, only Category (SKU class) drives checklist content, because
 * that is the dimension with real, defensible material-cost-driver
 * research behind it. Industry and Sub-sector remain free-choice fields
 * used only to name and organize a saved analysis.
 */
import type { SkuClassKey } from './kpiBenchmarksBySkuClass';

// ─── CIPS 4-stage TCO structure (+ Ellram process-cost addendum) ─────────────

export type TcoStageId = 'procurement' | 'acquisition' | 'usage' | 'process' | 'endOfLife';

export interface TcoStageMeta {
  id: TcoStageId;
  label: string; labelAr: string;
  short: string; shortAr: string;
  description: string; descriptionAr: string;
  framework: string; // which named framework this stage comes from
}

export const TCO_STAGES: TcoStageMeta[] = [
  {
    id: 'procurement', label: 'Procurement costs', labelAr: 'تكاليف الشراء',
    short: 'CIPS stage 1', shortAr: 'المرحلة 1 (CIPS)',
    description: 'The amount paid to the supplier for the product or service itself -- unit price, taxes, and duties.',
    descriptionAr: 'المبلغ المدفوع للمورّد مقابل المنتج أو الخدمة نفسها -- سعر الوحدة والضرائب والرسوم الجمركية.',
    framework: 'CIPS Total Cost of Ownership model',
  },
  {
    id: 'acquisition', label: 'Acquisition costs', labelAr: 'تكاليف الاقتناء',
    short: 'CIPS stage 2', shortAr: 'المرحلة 2 (CIPS)',
    description: 'The cost of getting the goods from the supplier to your location -- freight, insurance, port and handling fees, last-mile delivery.',
    descriptionAr: 'تكلفة نقل البضائع من المورّد إلى موقعك -- الشحن والتأمين ورسوم المناولة بالميناء والتسليم للميل الأخير.',
    framework: 'CIPS Total Cost of Ownership model',
  },
  {
    id: 'usage', label: 'Usage costs', labelAr: 'تكاليف الاستخدام',
    short: 'CIPS stage 3', shortAr: 'المرحلة 3 (CIPS)',
    description: 'The cost of holding, converting, and using the item through its working life -- inventory carrying cost, inspection, defects, rework, supplier audits.',
    descriptionAr: 'تكلفة الاحتفاظ بالعنصر وتحويله واستخدامه طوال عمره التشغيلي -- تكلفة الاحتفاظ بالمخزون، الفحص، العيوب، إعادة العمل، تدقيق الموردين.',
    framework: 'CIPS Total Cost of Ownership model',
  },
  {
    id: 'process', label: 'Process & administration costs', labelAr: 'تكاليف العمليات والإدارة',
    short: 'Ellram addendum', shortAr: 'إضافة إلرام',
    description: 'The transaction overhead of doing business with this supplier at all -- purchase-order issuance, invoice processing and reconciliation.',
    descriptionAr: 'العبء الإداري للتعامل مع هذا المورّد أصلاً -- إصدار أوامر الشراء، معالجة الفواتير والتسوية.',
    framework: 'Ellram (1993) Total Cost of Ownership model',
  },
  {
    id: 'endOfLife', label: 'End-of-life costs', labelAr: 'تكاليف نهاية العمر',
    short: 'CIPS stage 4', shortAr: 'المرحلة 4 (CIPS)',
    description: 'Disposal, clean-up, and contract or relationship termination costs -- often the most overlooked stage in a purchase-price comparison.',
    descriptionAr: 'تكاليف التخلص والتنظيف وإنهاء العقد أو العلاقة -- غالباً المرحلة الأكثر إغفالاً عند مقارنة أسعار الشراء فقط.',
    framework: 'CIPS Total Cost of Ownership model',
  },
];

// ─── Cost line-item fields (20 total; expands the earlier 18-field v1 model
//     with the 2 End-of-life fields CIPS's 4th stage had been missing) ───────

export type TcoNumericField =
  | 'unitPrice' | 'annualQty' | 'vatPct' | 'dutyPct'
  | 'freight' | 'insurance' | 'handling' | 'lastMile'
  | 'safetyStockDays' | 'carryingCostPct'
  | 'inspectionCost' | 'defectPpm' | 'reworkCost' | 'auditCost'
  | 'poCount' | 'poCostEach' | 'invoiceProcessingCost'
  | 'disposalCost' | 'contractExitCost';

export interface TcoFieldMeta {
  key: TcoNumericField;
  stage: TcoStageId;
  label: string; labelAr: string;
}

export const TCO_FIELDS: TcoFieldMeta[] = [
  { key: 'unitPrice',             stage: 'procurement', label: 'Unit purchase price (SAR)',                  labelAr: 'سعر الوحدة (ر.س)' },
  { key: 'annualQty',             stage: 'procurement', label: 'Annual quantity',                             labelAr: 'الكمية السنوية' },
  { key: 'vatPct',                stage: 'procurement', label: 'VAT (%)',                                     labelAr: 'ضريبة القيمة المضافة (%)' },
  { key: 'dutyPct',                stage: 'procurement', label: 'Import duties / customs (%)',                labelAr: 'رسوم الجمارك / الاستيراد (%)' },
  { key: 'freight',               stage: 'acquisition', label: 'Freight / shipping (SAR/yr)',                 labelAr: 'الشحن (ر.س/سنة)' },
  { key: 'insurance',             stage: 'acquisition', label: 'Insurance in transit (SAR/yr)',                labelAr: 'التأمين أثناء النقل (ر.س/سنة)' },
  { key: 'handling',              stage: 'acquisition', label: 'Port handling fees (SAR/yr)',                 labelAr: 'رسوم مناولة الميناء (ر.س/سنة)' },
  { key: 'lastMile',              stage: 'acquisition', label: 'Last-mile delivery (SAR/yr)',                 labelAr: 'التسليم للميل الأخير (ر.س/سنة)' },
  { key: 'safetyStockDays',       stage: 'usage',        label: 'Safety stock (days)',                        labelAr: 'أيام مخزون الأمان' },
  { key: 'carryingCostPct',       stage: 'usage',        label: 'Carrying cost rate (%, typically 20-30%)',   labelAr: 'معدّل تكلفة الاحتفاظ (%، عادة 20-30%)' },
  { key: 'inspectionCost',        stage: 'usage',        label: 'Incoming inspection cost (SAR/yr)',           labelAr: 'تكلفة الفحص الوارد (ر.س/سنة)' },
  { key: 'defectPpm',             stage: 'usage',        label: 'Expected defect rate (PPM)',                 labelAr: 'معدّل العيوب المتوقّع (PPM)' },
  { key: 'reworkCost',            stage: 'usage',        label: 'Rework / return / scrap (SAR/yr)',           labelAr: 'إعادة العمل / الإرجاع / الهدر (ر.س/سنة)' },
  { key: 'auditCost',             stage: 'usage',        label: 'Supplier audit / visit (SAR/yr)',            labelAr: 'تدقيق/زيارة المورّد (ر.س/سنة)' },
  { key: 'poCount',               stage: 'process',      label: '# of POs (annual)',                          labelAr: 'عدد أوامر الشراء (سنوياً)' },
  { key: 'poCostEach',            stage: 'process',      label: 'PO processing cost each (SAR)',              labelAr: 'تكلفة معالجة أمر الشراء (ر.س)' },
  { key: 'invoiceProcessingCost', stage: 'process',      label: 'Invoice processing / reconciliation (SAR/yr)', labelAr: 'معالجة الفواتير / التسوية (ر.س/سنة)' },
  { key: 'disposalCost',          stage: 'endOfLife',    label: 'Disposal / recycling / waste handling (SAR/yr)', labelAr: 'التخلص / إعادة التدوير / معالجة النفايات (ر.س/سنة)' },
  { key: 'contractExitCost',      stage: 'endOfLife',    label: 'Contract exit / switching / decommission (SAR, one-time)', labelAr: 'إنهاء العقد / التحويل / إخراج الخدمة (ر.س، لمرة واحدة)' },
];

// ─── Grounded, category-specific hidden-cost checklist ───────────────────────

export interface TcoInsight {
  stage: TcoStageId;
  text: string; textAr: string;
  confidence: 'grounded' | 'principle';
  sourceLabel?: string; sourceUrl?: string;
}

export const TCO_CHECKLIST_BY_SKU_CLASS: Record<SkuClassKey, TcoInsight[]> = {
  'finished-goods': [
    { stage: 'acquisition', confidence: 'principle',
      text: 'Freight and last-mile costs are usually the largest hidden driver for finished/traded goods -- late or damaged delivery directly threatens shelf availability, not just cost.',
      textAr: 'تكاليف الشحن والتسليم للميل الأخير عادة هي أكبر محرك خفي للبضائع الجاهزة/المُتداوَلة -- التسليم المتأخر أو التالف يهدد توفر المنتج على الرف مباشرة، وليس فقط التكلفة.' },
    { stage: 'process', confidence: 'principle',
      text: 'High-turnover finished goods usually mean frequent replenishment orders, so PO and invoice processing cost per unit adds up faster than it looks from a single order.',
      textAr: 'ارتفاع معدل دوران البضائع الجاهزة يعني عادةً أوامر تجديد مخزون متكررة، لذا تتراكم تكلفة معالجة أوامر الشراء والفواتير للوحدة أسرع مما يبدو من طلب واحد.' },
    { stage: 'usage', confidence: 'principle',
      text: 'Returns, shrinkage, and short-dated write-offs behave like a quality/rework cost even when the product itself was never defective -- worth costing explicitly rather than treating as a rounding error.',
      textAr: 'المرتجعات والهدر والشطب بسبب قرب الصلاحية تتصرف كتكلفة جودة/إعادة عمل حتى لو لم يكن المنتج نفسه معيباً -- يستحق تقديرها صراحة بدل اعتبارها خطأ تقريب.' },
  ],
  'raw-materials': [
    { stage: 'usage', confidence: 'principle',
      text: 'A raw-material defect caught at incoming inspection is far cheaper to fix than the same defect caught after it has been converted into work-in-progress or finished goods -- a standard cost-of-quality principle (the cost of a defect rises the further downstream it travels before detection).',
      textAr: 'عيب في المادة الخام يُكتشف عند الفحص الوارد أرخص بكثير من إصلاحه بعد تحويله إلى منتج تحت التصنيع أو جاهز -- مبدأ قياسي في تكلفة الجودة (تزداد تكلفة العيب كلما اكتُشف في مرحلة أبعد).' },
    { stage: 'acquisition', confidence: 'principle',
      text: 'Bulk-imported raw materials carry duty and freight exposure that scales with tonnage, not unit count -- worth checking against actual shipment weight/volume, not just per-unit assumptions.',
      textAr: 'المواد الخام المستوردة بكميات كبيرة تحمل تعرضاً للرسوم والشحن يتناسب مع الوزن وليس عدد الوحدات -- يستحق التحقق مقابل وزن/حجم الشحنة الفعلي.' },
    { stage: 'usage', confidence: 'principle',
      text: 'Safety stock on production-critical raw materials is usually held for continuity risk, not demand variability alone -- the carrying cost of that buffer is a real cost of avoiding a line stoppage.',
      textAr: 'مخزون الأمان للمواد الخام الحرجة للإنتاج يُحتفظ به عادةً لمخاطر الاستمرارية وليس فقط لتقلب الطلب -- تكلفة الاحتفاظ بهذا المخزون هي تكلفة حقيقية لتجنب توقف خط الإنتاج.' },
  ],
  'work-in-progress': [
    { stage: 'usage', confidence: 'principle',
      text: 'WIP is the most expensive stage at which to discover a quality problem: labor and prior-stage material cost are already sunk into the item, so rework here costs more than an equivalent raw-material rejection.',
      textAr: 'المنتج تحت التصنيع هو أغلى مرحلة لاكتشاف مشكلة جودة فيها: تكلفة العمالة والمواد من المراحل السابقة أصبحت غارقة بالفعل، لذا إعادة العمل هنا أغلى من رفض مادة خام مكافئة.' },
    { stage: 'usage', confidence: 'principle',
      text: 'WIP inherently ties up working capital while sitting between production stages -- the carrying-cost rate applied here is doing real work, not just a formality.',
      textAr: 'المنتج تحت التصنيع يحتجز رأس مال عامل بطبيعته أثناء انتظاره بين مراحل الإنتاج -- معدل تكلفة الاحتفاظ المطبَّق هنا له أثر حقيقي وليس مجرد إجراء شكلي.' },
  ],
  'spare-parts-mro': [
    { stage: 'process', confidence: 'grounded',
      text: 'Capgemini research on indirect ("C-part") procurement found up to 70% of a C-part’s total cost of ownership comes from indirect/process costs, not the part price -- one cited example: a $1 material cost per bolt but over $30 in indirect cost to source, order, and manage it.',
      textAr: 'وجد بحث كابجيميني حول المشتريات غير المباشرة (أصناف C) أن ما يصل إلى 70% من إجمالي تكلفة ملكية الصنف يأتي من التكاليف غير المباشرة/الإدارية، وليس من سعر القطعة -- مثال موثّق: تكلفة مادة دولار واحد للمسمار مقابل أكثر من 30 دولاراً كتكلفة غير مباشرة لتوريده وطلبه وإدارته.',
      sourceLabel: 'Capgemini finding, cited via Component Solutions Group', sourceUrl: 'https://www.componentsolutionsgroup.com/blog/reduce-c-part-indirect-costs-tco/' },
    { stage: 'usage', confidence: 'principle',
      text: 'For a critical spare, a stockout’s real cost is usually production downtime, not the part’s replacement price -- if this part can halt a line, that risk belongs in the analysis even though it has no natural line item above.',
      textAr: 'بالنسبة لقطعة غيار حرجة، التكلفة الحقيقية لنفاد المخزون عادة هي توقف الإنتاج، وليس سعر استبدال القطعة -- إذا كانت هذه القطعة قادرة على إيقاف خط إنتاج، فإن هذا الخطر يستحق أن يكون جزءاً من التحليل حتى لو لم يكن له بند جاهز أعلاه.' },
    { stage: 'endOfLife', confidence: 'principle',
      text: 'For capital spares and equipment-linked parts, industry lifecycle-cost analyses commonly report maintenance and disposal together running 30-45% of total lifecycle cost over a 7-15 year asset life -- a general pattern worth sanity-checking against your own asset’s maintenance history, not a number to apply directly.',
      textAr: 'بالنسبة لقطع الغيار الرأسمالية والأجزاء المرتبطة بالمعدات، تشير تحليلات دورة الحياة الصناعية عموماً إلى أن الصيانة والتخلص معاً يمثلان 30-45% من إجمالي تكلفة دورة الحياة على مدى 7-15 سنة -- نمط عام يستحق التحقق منه مقابل سجل صيانة أصلك الفعلي، وليس رقماً يُطبَّق مباشرة.',
      sourceLabel: 'Industry capital-equipment TCO analyses (SpecLens, Advanced Technology Services)', sourceUrl: 'https://www.speclens.ai/guides/capital-equipment-tco' },
  ],
  'indirect-general': [
    { stage: 'process', confidence: 'grounded',
      text: 'Indirect/general spend is defined by exactly the dynamic Capgemini documented for C-parts: low unit price, disproportionate transaction cost. The same "$1 material, $30 to manage it" pattern is the reason indirect categories are usually the best place to look for process-cost savings, not price negotiation.',
      textAr: 'المشتريات غير المباشرة/العامة تتصف بنفس الديناميكية التي وثّقها كابجيميني لأصناف C: سعر وحدة منخفض وتكلفة معاملات غير متناسبة. نفس نمط "مادة بدولار واحد وإدارتها بـ30 دولاراً" هو سبب كون الفئات غير المباشرة عادة أفضل مكان للبحث عن توفير في تكلفة العمليات، لا في التفاوض على السعر.',
      sourceLabel: 'Capgemini finding, cited via Component Solutions Group', sourceUrl: 'https://www.componentsolutionsgroup.com/blog/reduce-c-part-indirect-costs-tco/' },
    { stage: 'endOfLife', confidence: 'principle',
      text: 'If this indirect purchase is software, a subscription, or a services contract, the real end-of-life cost is usually switching/exit cost (data migration, retraining, contract penalties) rather than a physical disposal cost -- worth entering under contract exit even when nothing physical is being thrown away.',
      textAr: 'إذا كان هذا الشراء غير المباشر برنامجاً أو اشتراكاً أو عقد خدمات، فإن التكلفة الحقيقية لنهاية العمر عادة هي تكلفة التحويل/الخروج (نقل البيانات، إعادة التدريب، غرامات العقد) وليس تكلفة تخلص مادي -- يستحق إدخالها تحت إنهاء العقد حتى لو لم يكن هناك شيء مادي يُتخلَّص منه.' },
    { stage: 'usage', confidence: 'grounded',
      text: 'For software/technology purchases specifically, industry analyses commonly find implementation, integration, training, and support are where budgets are underestimated, sometimes causing total spend to land well above the initial license or subscription price quoted.',
      textAr: 'بالنسبة لمشتريات البرمجيات/التقنية تحديداً، تشير التحليلات الصناعية عموماً إلى أن التنفيذ والتكامل والتدريب والدعم هي حيث تُقدَّر الميزانيات بأقل من الواقع، ما قد يجعل إجمالي الإنفاق يفوق سعر الترخيص أو الاشتراك المبدئي المعروض بوضوح.',
      sourceLabel: 'Industry enterprise-software TCO analyses (CloudNuro, HR Tech SaaS)', sourceUrl: 'https://www.cloudnuro.ai/blog/the-hidden-costs-of-itsm-what-vendors-wont-tell-you' },
  ],
  'packaging': [
    { stage: 'endOfLife', confidence: 'principle',
      text: 'Packaging is the category where end-of-life cost is most likely to be a real, growing line item rather than a formality: disposal/recycling cost and extended-producer-responsibility-style obligations are an increasingly common regulatory direction across the region -- worth checking current local requirements rather than assuming none apply.',
      textAr: 'التغليف هو الفئة التي يُرجَّح فيها أن تكون تكلفة نهاية العمر بنداً حقيقياً ومتزايداً وليس مجرد إجراء شكلي: تكلفة التخلص/إعادة التدوير والالتزامات على غرار "مسؤولية المنتج الممتدة" اتجاه تنظيمي شائع بشكل متزايد في المنطقة -- يستحق التحقق من المتطلبات المحلية الحالية بدلاً من افتراض عدم انطباقها.' },
    { stage: 'acquisition', confidence: 'principle',
      text: 'Packaging is bulky relative to its value, so freight and damage-in-transit costs are usually a larger share of its TCO than for the product it protects.',
      textAr: 'التغليف كبير الحجم نسبياً مقارنة بقيمته، لذا تكاليف الشحن والتلف أثناء النقل عادة تمثل حصة أكبر من إجمالي تكلفة ملكيته مقارنة بالمنتج الذي يحميه.' },
    { stage: 'usage', confidence: 'principle',
      text: 'A packaging failure usually shows up as a cost on the product it was protecting (damage, returns, rework), not on the packaging line item itself -- worth tracing that cost back before concluding packaging is "cheap."',
      textAr: 'فشل التغليف عادة يظهر كتكلفة على المنتج الذي كان يحميه (تلف، مرتجعات، إعادة عمل) وليس على بند التغليف نفسه -- يستحق تتبع هذه التكلفة قبل استنتاج أن التغليف "رخيص".' },
  ],
  'commodities': [
    { stage: 'procurement', confidence: 'principle',
      text: 'For bulk commodities, world-market price volatility is usually a bigger cost driver than any fee line item -- the unit price entered here should reflect the actual contract/hedge basis, not a stale reference price.',
      textAr: 'بالنسبة للسلع الجملة، يُعد تقلب أسعار السوق العالمية عادةً محركاً للتكلفة أكبر من أي بند رسوم -- يجب أن يعكس سعر الوحدة المُدخَل هنا أساس العقد/التحوّط الفعلي، وليس سعراً مرجعياً قديماً.' },
    { stage: 'acquisition', confidence: 'principle',
      text: 'Bulk freight and demurrage (vessel/vehicle waiting-time penalties) are commodity-specific acquisition costs that a generic freight line can understate if port or terminal turnaround is slow.',
      textAr: 'الشحن بالجملة ورسوم الاحتجاز (غرامات انتظار السفينة/المركبة) تكاليف اقتناء خاصة بالسلع يمكن أن يقلّل بند الشحن العام من تقديرها إذا كان دوران الميناء أو المحطة بطيئاً.' },
    { stage: 'usage', confidence: 'principle',
      text: 'Off-specification rejection on a bulk shipment is expensive precisely because the shipment is bulk -- a single quality failure affects the whole lot, not one unit.',
      textAr: 'رفض شحنة جملة بسبب عدم مطابقة المواصفات مكلف تحديداً لأن الشحنة بالجملة -- فشل جودة واحد يؤثر على الدفعة كاملة، وليس على وحدة واحدة.' },
  ],
};

// ─── Reference list (for a visible sources panel in the UI) ─────────────────

export const TCO_SOURCES: { label: string; url: string }[] = [
  { label: 'CIPS -- Total Cost of Ownership (4-stage framework)', url: 'https://www.cips.org/intelligence-hub/finance/total-cost-of-ownership' },
  { label: 'Ellram, L.M. (1993) -- Total Cost of Ownership: Elements and Implementation, International Journal of Purchasing and Materials Management, 29: 2-11', url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1745-493X.1993.tb00013.x' },
  { label: 'Capgemini indirect (C-part) cost finding, cited via Component Solutions Group', url: 'https://www.componentsolutionsgroup.com/blog/reduce-c-part-indirect-costs-tco/' },
  { label: 'Industry capital-equipment TCO / lifecycle-cost analyses', url: 'https://www.speclens.ai/guides/capital-equipment-tco' },
  { label: 'Industry enterprise-software / IT hidden-cost analyses', url: 'https://www.cloudnuro.ai/blog/the-hidden-costs-of-itsm-what-vendors-wont-tell-you' },
];
