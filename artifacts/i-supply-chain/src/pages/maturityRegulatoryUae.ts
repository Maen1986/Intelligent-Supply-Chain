/**
 * maturityRegulatoryUae.ts
 *
 * Sub-segment content for the UAE Regulatory & Localisation Compliance module
 * (industry module id: 'regulatory-uae', countryFor: ['uae']).
 *
 * Status: AUTHORED, PENDING INDEPENDENT LEGAL/EXPERT REVIEW.
 * This content was drafted from public regulator sources (MOHRE/Nafis, MOIAT,
 * Federal Customs Authority, ESMA, UAE Data Office, federal + Emirate-level
 * procurement law) as of August 2026. It has NOT yet been signed off by a
 * named human legal/compliance reviewer, per the platform's content-trust
 * model (see /api/regulatory/countries — status stays 'pending_review' until
 * a reviewer signs off with a date). Do not mark 'verified' without that
 * step. Sources cited inline per sub-segment for traceability.
 *
 * Mirrors the structure of REGULATORY_SUB_SEGMENTS (Saudi) in
 * maturitySubSegData6to11.ts, scoped to 5 questions per sub-segment (25 vs
 * Saudi's 70) for a first authored pass — depth can be extended per
 * sub-segment later without breaking the answer-key format.
 *
 * All Arabic is independently authored formal Gulf professional register
 * (فصحى), not machine-translated.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   UAE REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
═══════════════════════════════════════════════════════════════════════════ */

export const UAE_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14U.1  Emiratisation & Nafis Compliance ─────────────────────── */
  {
    id: 'uae-reg-emiratisation',
    title: 'Emiratisation & Nafis Compliance',
    titleAr: 'الامتثال للتوطين وبرنامج نافس',
    hint: 'Source: MOHRE / Nafis programme. Private mainland companies with 50+ skilled employees face rising annual Emiratisation quotas (10% by end-2026); 20–49-employee companies in 14 targeted sectors must employ at least 2 Emiratis. Non-compliance fines run AED 9,000/month per unfilled role.',
    hintAr: 'المصدر: وزارة الموارد البشرية والتوطين / برنامج نافس. الشركات الخاصة في البر الرئيسي التي تضم 50 موظفًا ماهرًا فأكثر تواجه حصص توطين سنوية متصاعدة (10% بنهاية 2026)؛ والشركات من 20-49 موظفًا في 14 قطاعًا مستهدفًا يجب أن توظّف إماراتيَّين على الأقل. غرامات عدم الامتثال تصل إلى 9,000 درهم شهريًا لكل وظيفة شاغرة.',
    benchmarks: { gcc: 2.0, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.3, pharma: 1.3, retail: 1.2,
      logistics: 1.3, marine: 1.2, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.3, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'MOHRE Emiratisation compliance status / Nafis registration',
      labelAr: 'حالة الامتثال للتوطين من وزارة الموارد البشرية / تسجيل نافس',
      hint:    'Upload your most recent MOHRE Emiratisation compliance report or Nafis portal registration confirmation.',
      hintAr:  'ارفع أحدث تقرير امتثال للتوطين من وزارة الموارد البشرية أو تأكيد التسجيل في منصة نافس.',
    },
    frameworks: ['MOHRE', 'Nafis', 'WPS'],
    questions: [
      {
        q: 'How proactively does your organisation track its Emiratisation quota against the rising annual threshold — by role, by skill classification, and against the mid-year checkpoint?',
        qAr: 'ما مدى استباقية مؤسستكم في تتبّع حصة التوطين مقابل العتبة السنوية المتصاعدة — حسب الوظيفة والتصنيف المهاري ومقابل نقطة المراجعة النصف سنوية؟',
        levels: [
          'Emiratisation status is unknown until MOHRE flags a shortfall or a fine is issued.',
          'Headcount is tracked at company level but not reconciled against the skilled-role definition or the current-year threshold.',
          'A defined owner checks Emiratisation status against the current threshold quarterly, with the mid-year checkpoint tracked explicitly.',
          'Emiratisation tracking is automated via WPS/MOHRE data, reviewed monthly, and tied to a hiring plan that anticipates the next annual increase.',
          'Emiratisation performance is a standing executive KPI; hiring, succession, and Nafis wage-subsidy planning are integrated years ahead of each threshold increase.',
        ],
        levelsAr: [
          'حالة التوطين مجهولة إلى أن تُنبّه وزارة الموارد البشرية بنقص أو تصدر غرامة.',
          'يُتابَع عدد الموظفين على مستوى الشركة دون مطابقته مع تعريف الوظيفة الماهرة أو عتبة العام الحالي.',
          'مالك محدد يتحقّق من حالة التوطين مقابل العتبة الحالية فصليًا، مع متابعة نقطة المراجعة النصف سنوية صراحة.',
          'تتبّع التوطين آلي عبر بيانات نظام حماية الأجور/الوزارة، ويُراجَع شهريًا، ومرتبط بخطة توظيف تستبق الزيادة السنوية القادمة.',
          'أداء التوطين مؤشر تنفيذي ثابت؛ والتوظيف والتعاقب وتخطيط دعم أجور نافس مُدمجة قبل سنوات من كل زيادة في العتبة.',
        ],
      },
      {
        q: 'How effectively does your organisation use the Nafis programme (wage subsidies, pension contribution support, verified candidate database) to reduce the cost and risk of Emiratisation compliance?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لبرنامج نافس (دعم الأجور، دعم اشتراكات التقاعد، قاعدة بيانات المرشحين المعتمدين) لتقليل تكلفة ومخاطر الامتثال للتوطين؟',
        levels: [
          'Nafis benefits are not used; Emirati hiring, where it happens, receives no wage-subsidy or pension support.',
          'Awareness of Nafis exists but no active application has been made for wage subsidies or pension contribution support.',
          'Nafis wage subsidies and pension support are claimed for newly hired Emiratis on an ad hoc basis.',
          'Nafis benefits are systematically claimed for all eligible hires, and the verified candidate database is used as a standing recruitment channel.',
          'Nafis subsidy and pension support are fully integrated into workforce cost planning; the organisation is recognised as a preferred Nafis employer partner.',
        ],
        levelsAr: [
          'مزايا نافس غير مستخدمة؛ وتوظيف الإماراتيين، إن حدث، لا يحصل على دعم أجور أو تقاعد.',
          'يوجد وعي ببرنامج نافس لكن لم يُقدَّم طلب فعلي للحصول على دعم الأجور أو اشتراكات التقاعد.',
          'دعم أجور نافس واشتراكات التقاعد تُطلَب للموظفين الإماراتيين الجدد بشكل غير منتظم.',
          'مزايا نافس تُطلَب بشكل منهجي لجميع التوظيفات المؤهلة، وقاعدة بيانات المرشحين المعتمدين قناة توظيف ثابتة.',
          'دعم أجور وتقاعد نافس مُدمَج بالكامل في تخطيط تكلفة القوى العاملة؛ والمؤسسة مُعترَف بها كشريك توظيف مفضّل لدى نافس.',
        ],
      },
      {
        q: 'How well does your organisation verify and maintain WPS (Wage Protection System) compliance for Emirati employees counted toward the quota — including the minimum AED 6,000/month salary threshold?',
        qAr: 'ما مدى جودة تحقّق مؤسستكم من امتثال نظام حماية الأجور للموظفين الإماراتيين المحتسَبين ضمن الحصة والحفاظ عليه — بما يشمل حد الراتب الأدنى 6,000 درهم شهريًا؟',
        levels: [
          'WPS registration and salary-threshold compliance for Emirati staff are not actively verified.',
          'WPS status is checked only when an issue is flagged by payroll or MOHRE.',
          'A defined payroll process confirms WPS registration and the AED 6,000 minimum salary threshold for every Emirati counted toward the quota before quota submission.',
          'WPS compliance is monitored continuously with automated alerts for any Emirati falling below the salary threshold or lapsing in registration.',
          'WPS and salary-threshold compliance are fully automated and audited quarterly, with zero quota-invalidating discrepancies over the past 24 months.',
        ],
        levelsAr: [
          'تسجيل نظام حماية الأجور والامتثال لحد الراتب للموظفين الإماراتيين لا يُتحقَّق منهما بشكل فعّال.',
          'تُفحَص حالة نظام حماية الأجور فقط عند رصد مشكلة من الرواتب أو الوزارة.',
          'عملية رواتب محددة تؤكد تسجيل نظام حماية الأجور وحد الراتب الأدنى 6,000 درهم لكل إماراتي محتسَب ضمن الحصة قبل تقديمها.',
          'الامتثال لنظام حماية الأجور يُراقَب باستمرار مع تنبيهات آلية لأي إماراتي ينخفض راتبه عن الحد أو ينقطع تسجيله.',
          'الامتثال لنظام حماية الأجور وحد الراتب آلي بالكامل ويُدقَّق فصليًا، دون أي تباينات تُبطل الحصة خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How rigorously does your organisation assess Emiratisation exposure across outsourced supply chain labour (3PL, contractors) whose headcount can affect group-level compliance calculations?',
        qAr: 'ما مدى صرامة تقييم مؤسستكم للتعرّض لالتزامات التوطين عبر العمالة المُستعان بها في سلسلة الإمداد (مزودو الخدمات اللوجستية، المقاولون) والتي قد يؤثر عددها على حسابات الامتثال على مستوى المجموعة؟',
        levels: [
          'Outsourced labour is never assessed for Emiratisation impact, even where it is legally relevant to group headcount.',
          'Awareness exists that outsourced labour may matter, but no systematic contractor/3PL headcount review occurs.',
          'A defined check reviews the Emiratisation-relevant headcount of significant contractors and 3PLs before contract award.',
          'Contractor and 3PL Emiratisation exposure is monitored on an ongoing basis, with contractual clauses addressing compliance risk.',
          'Extended-workforce Emiratisation exposure is modelled as part of workforce planning; sourcing decisions explicitly weigh compliance impact alongside cost.',
        ],
        levelsAr: [
          'العمالة المُستعان بها من الخارج لا تُقيَّم أبدًا من حيث أثر التوطين، حتى عندما تكون ذات صلة قانونية بعدد المجموعة.',
          'يوجد وعي بأن العمالة الخارجية قد تكون ذات أهمية، لكن لا مراجعة منهجية لعدد موظفي المقاولين/مزودي الخدمات اللوجستية.',
          'فحص محدد يراجع العدد ذا الصلة بالتوطين للمقاولين ومزودي الخدمات اللوجستية الجوهريين قبل الترسية.',
          'التعرّض لالتزامات التوطين لدى المقاولين ومزودي الخدمات اللوجستية يُراقَب باستمرار، مع بنود تعاقدية تعالج مخاطر الامتثال.',
          'التعرّض لالتزامات التوطين عبر القوى العاملة الممتدة يُنمذَج كجزء من تخطيط القوى العاملة؛ وقرارات التعاقد تُوازِن صراحة بين الأثر والتكلفة.',
        ],
      },
      {
        q: 'How well does your organisation plan for the operational and financial impact of a compliance shortfall — including the AED 9,000/month per-role fine and its effect on renewal/licensing?',
        qAr: 'ما مدى جودة تخطيط مؤسستكم للأثر التشغيلي والمالي لأي نقص في الامتثال — بما يشمل غرامة 9,000 درهم شهريًا لكل وظيفة وأثرها على التجديد/الترخيص؟',
        levels: [
          'No contingency exists for a compliance shortfall; fines and licensing consequences are discovered after the fact.',
          'Leadership is generally aware fines apply, but no documented early-warning threshold or corrective-hiring plan exists.',
          'A defined threshold triggers a documented corrective hiring plan before a shortfall becomes a fineable gap.',
          'Shortfall risk is modelled quarterly against workforce plans and known attrition trends, with pre-approved contingency actions.',
          'Emiratisation compliance resiliency is a standing input to workforce and licensing risk planning, stress-tested against a simulated shortfall scenario.',
        ],
        levelsAr: [
          'لا توجد خطة طوارئ لنقص الامتثال؛ وتُكتشَف الغرامات وتبعات الترخيص بعد وقوعها.',
          'القيادة على وعي عام بوجود غرامات، لكن لا يوجد حد إنذار مبكر موثّق أو خطة توظيف تصحيحي.',
          'حد محدد يُفعّل خطة توظيف تصحيحي موثّقة قبل أن يتحول النقص إلى فجوة مُغرَّمة.',
          'مخاطر النقص تُنمذَج فصليًا مقابل خطط القوى العاملة واتجاهات الاستنزاف المعروفة، مع إجراءات طوارئ مُعتمَدة مسبقًا.',
          'مرونة الامتثال للتوطين مُدخَل ثابت في تخطيط مخاطر القوى العاملة والترخيص، وتم اختبارها مقابل سيناريو نقص محاكى.',
        ],
      },
    ],
  },

  /* ── 14U.2  ICV (In-Country Value) & Local Content ───────────────── */
  {
    id: 'uae-reg-icv',
    title: 'ICV (In-Country Value) & Local Content',
    titleAr: 'القيمة المضافة المحلية والمحتوى المحلي',
    hint: 'Source: Ministry of Industry & Advanced Technology (MOIAT) National ICV Programme, launched 2021 under "Projects of the 50". Score is based on audited financial statements across weighted pillars (local procurement, investment, Emiratisation) and directly affects tender competitiveness.',
    hintAr: 'المصدر: برنامج القيمة المضافة المحلية الوطني التابع لوزارة الصناعة والتقنية المتقدمة، أُطلق عام 2021 ضمن "مشاريع الخمسين". يُبنى التقييم على القوائم المالية المدققة عبر ركائز مرجّحة (الشراء المحلي، الاستثمار، التوطين) ويؤثر مباشرة على تنافسية المناقصات.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.2, pharma: 1.3, retail: 1.0,
      logistics: 1.2, marine: 1.3, construction: 1.5, oil_gas: 1.5,
      government: 1.3, technology: 1.2, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'ICV certificate (current cycle)',
      labelAr: 'شهادة القيمة المضافة المحلية (الدورة الحالية)',
      hint:    'Upload your current MOIAT-issued ICV certificate showing your score and certifying body.',
      hintAr:  'ارفع شهادة القيمة المضافة المحلية الحالية الصادرة عن الوزارة موضحًا الدرجة والجهة المُصدرة.',
    },
    frameworks: ['MOIAT', 'ICV Programme'],
    questions: [
      {
        q: 'How rigorously does your organisation prepare and maintain the stand-alone audited financial statements MOIAT requires for ICV certification, as distinct from consolidated group accounts?',
        qAr: 'ما مدى صرامة إعداد ومؤسستكم للقوائم المالية المدققة المستقلة التي تشترطها الوزارة لشهادة القيمة المضافة المحلية، تمييزًا عن الحسابات الموحّدة للمجموعة؟',
        levels: [
          'Stand-alone audited statements for the certified legal entity do not exist; only consolidated group accounts are available.',
          'Stand-alone statements are prepared only when an ICV renewal is imminent, causing delays.',
          'Stand-alone audited statements are prepared annually as a matter of course, aligned to the ICV certification cycle.',
          'Financial reporting is structured proactively to maximise ICV-relevant categories (local procurement, investment) within the audited statements.',
          'ICV-optimised financial structuring is a standing finance-function objective, with the audited statements consistently supporting a top-quartile ICV score.',
        ],
        levelsAr: [
          'القوائم المالية المدققة المستقلة للكيان القانوني المُعتمَد غير موجودة؛ وتتوفر فقط الحسابات الموحّدة للمجموعة.',
          'تُعَدّ القوائم المستقلة فقط عند اقتراب موعد تجديد الشهادة، مما يسبب تأخيرًا.',
          'تُعَدّ القوائم المالية المدققة المستقلة سنويًا كإجراء معتاد، متماشية مع دورة الشهادة.',
          'التقارير المالية تُبنى استباقيًا لتعظيم الفئات ذات الصلة بالقيمة المضافة المحلية (الشراء المحلي، الاستثمار) ضمن القوائم المدققة.',
          'الهيكلة المالية المُحسَّنة للقيمة المضافة المحلية هدف ثابت لوظيفة المالية، والقوائم المدققة تدعم باستمرار درجة في الربع الأعلى.',
        ],
      },
      {
        q: 'How actively does your organisation manage local procurement spend to maximise its weighted contribution to the ICV score, relative to your sector\'s pillar weightings?',
        qAr: 'ما مدى فعالية إدارة مؤسستكم للإنفاق على الشراء المحلي لتعظيم مساهمته المرجّحة في درجة القيمة المضافة المحلية، مقارنة بأوزان ركائز قطاعكم؟',
        levels: [
          'Local procurement spend is not tracked separately from total procurement spend; ICV pillar weighting is unknown.',
          'Local vs. imported procurement spend is tracked, but not actively managed toward the ICV score.',
          'A defined process reviews the local-content share of procurement spend against ICV pillar weightings at least annually.',
          'Sourcing decisions actively favour ICV-eligible local suppliers where cost-competitive, with the impact on ICV score modelled before major awards.',
          'Local-content optimisation is embedded in category strategy; the organisation actively develops UAE-based suppliers to expand its ICV-eligible base.',
        ],
        levelsAr: [
          'الإنفاق على الشراء المحلي لا يُتابَع بمعزل عن إجمالي الإنفاق؛ ووزن ركائز القيمة المضافة المحلية مجهول.',
          'يُتابَع الإنفاق المحلي مقابل المستورد، لكن دون إدارته فعليًا نحو تحسين الدرجة.',
          'عملية محددة تراجع حصة المحتوى المحلي من الإنفاق مقابل أوزان الركائز سنويًا على الأقل.',
          'قرارات التوريد تُفضّل الموردين المحليين المؤهلين للقيمة المضافة عند التنافسية السعرية، مع نمذجة الأثر على الدرجة قبل الترسيات الكبرى.',
          'تحسين المحتوى المحلي مُدمَج في استراتيجية الفئات؛ والمؤسسة تطوّر فعليًا موردين إماراتيين لتوسيع قاعدتها المؤهلة.',
        ],
      },
      {
        q: 'How well does your organisation select and manage its relationship with MOIAT-authorised ICV certifying bodies to ensure accurate, defensible scoring?',
        qAr: 'ما مدى جودة اختيار مؤسستكم وإدارتها لعلاقتها مع الجهات المُعتمَدة من الوزارة لإصدار شهادات القيمة المضافة المحلية لضمان تقييم دقيق وقابل للدفاع عنه؟',
        levels: [
          'No relationship exists with an ICV certifying body; certification, if held at all, is outdated or unmanaged.',
          'A certifying body is engaged only reactively when a tender requires proof of ICV score.',
          'An ICV certifying body is engaged on a defined annual cycle aligned to the certification renewal date.',
          'The certifying-body relationship is actively managed, with pre-audit reviews to catch scoring issues before formal submission.',
          'ICV certification is treated as a strategic capability: the organisation maintains a documented, audit-ready evidence trail year-round and consistently avoids score disputes.',
        ],
        levelsAr: [
          'لا توجد علاقة مع جهة معتمدة لإصدار الشهادة؛ والشهادة، إن وُجدت، قديمة أو غير مُدارة.',
          'تُستعان بجهة الشهادة فقط بشكل تفاعلي عندما تتطلب مناقصة إثبات الدرجة.',
          'جهة الشهادة تُستعان بها وفق دورة سنوية محددة متماشية مع تاريخ التجديد.',
          'العلاقة مع جهة الشهادة تُدار بفعالية، مع مراجعات ما قبل التدقيق لالتقاط مشكلات التقييم قبل التقديم الرسمي.',
          'شهادة القيمة المضافة المحلية تُعامَل كقدرة استراتيجية: تحتفظ المؤسسة بسجل أدلة موثّق وجاهز للتدقيق طوال العام وتتجنب باستمرار نزاعات الدرجة.',
        ],
      },
      {
        q: 'How effectively does your organisation use its ICV score as a competitive input to federal and Emirate-level tender bids, beyond simple compliance?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لدرجة القيمة المضافة المحلية كمُدخَل تنافسي في المناقصات الاتحادية وعلى مستوى الإمارات، بما يتجاوز مجرد الامتثال؟',
        levels: [
          'The ICV score is not referenced in bid preparation; its tender-scoring impact is unknown to the bid team.',
          'The ICV score is included in bid documentation when required, but not positioned as a competitive differentiator.',
          'Bid teams reference the ICV score and understand its weighting impact on tender evaluation for target opportunities.',
          'ICV score trajectory is actively managed ahead of major tender cycles, with improvement targets tied to specific bid opportunities.',
          'A top-tier ICV score is a marketed competitive advantage, actively cited in bids and client relationship management across federal and Emirate-level opportunities.',
        ],
        levelsAr: [
          'درجة القيمة المضافة المحلية لا تُذكَر عند إعداد المناقصات؛ وأثرها على تقييم المناقصة مجهول لفريق التقديم.',
          'تُدرَج الدرجة في وثائق المناقصة عند الطلب، لكن دون تقديمها كميزة تنافسية.',
          'فرق التقديم تُشير إلى الدرجة وتفهم أثر وزنها على تقييم المناقصات للفرص المستهدفة.',
          'مسار تحسين الدرجة يُدار فعليًا قبل دورات المناقصات الكبرى، مع أهداف تحسين مرتبطة بفرص مناقصات محددة.',
          'الدرجة المتقدمة ميزة تنافسية تُسوَّق فعليًا وتُذكَر في المناقصات وإدارة علاقات العملاء عبر الفرص الاتحادية وعلى مستوى الإمارات.',
        ],
      },
      {
        q: 'How well does your organisation coordinate ICV data (local procurement, investment, Emiratisation) across finance, procurement, and HR functions to avoid conflicting or stale submissions?',
        qAr: 'ما مدى جودة تنسيق مؤسستكم لبيانات القيمة المضافة المحلية (الشراء المحلي، الاستثمار، التوطين) بين وظائف المالية والمشتريات والموارد البشرية لتجنب التقديمات المتضاربة أو القديمة؟',
        levels: [
          'Finance, procurement, and HR maintain separate, unreconciled data; ICV submissions risk inconsistency across functions.',
          'Data is shared between functions only when the certifying body specifically requests it.',
          'A defined annual coordination process reconciles local-procurement, investment, and Emiratisation data before ICV submission.',
          'A shared data owner maintains real-time visibility across all ICV-relevant metrics ahead of each certification cycle.',
          'ICV data governance is fully integrated across finance, procurement, and HR systems, with automated reconciliation and zero submission discrepancies over the past two cycles.',
        ],
        levelsAr: [
          'المالية والمشتريات والموارد البشرية تحتفظ ببيانات منفصلة وغير مطابَقة؛ وتقديمات القيمة المضافة المحلية معرّضة للتضارب بين الوظائف.',
          'تُشارَك البيانات بين الوظائف فقط عندما تطلبها جهة الشهادة تحديدًا.',
          'عملية تنسيق سنوية محددة تطابق بيانات الشراء المحلي والاستثمار والتوطين قبل التقديم.',
          'مالك بيانات مشترك يحتفظ برؤية آنية عبر جميع المؤشرات ذات الصلة قبل كل دورة شهادة.',
          'حوكمة بيانات القيمة المضافة المحلية مُدمَجة بالكامل عبر أنظمة المالية والمشتريات والموارد البشرية، مع مطابقة آلية ودون أي تباينات في التقديم خلال آخر دورتين.',
        ],
      },
    ],
  },

  /* ── 14U.3  Customs & Trade Compliance ───────────────────────────── */
  {
    id: 'uae-reg-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الامتثال الجمركي والتجاري',
    hint: 'Source: Federal Customs Authority (FCA) + Emirate-level customs (Dubai Customs, Abu Dhabi Customs, etc.), GCC Common Customs Tariff. Requires both a trade license and separate FCA customs registration. Free-zone goods are duty-free until transferred to the mainland (5% standard duty + VAT applies at that point).',
    hintAr: 'المصدر: الهيئة الاتحادية للجمارك + الجمارك على مستوى الإمارات (جمارك دبي، جمارك أبوظبي، إلخ)، والتعريفة الجمركية الموحدة الخليجية. يتطلب ترخيصًا تجاريًا وتسجيلًا جمركيًا منفصلًا لدى الهيئة الاتحادية. بضائع المناطق الحرة معفاة من الرسوم حتى تُنقَل إلى البر الرئيسي (تُطبَّق الرسوم القياسية 5% + ضريبة القيمة المضافة عند ذلك).',
    benchmarks: { gcc: 2.4, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.4, pharma: 1.4, retail: 1.3,
      logistics: 1.5, marine: 1.5, construction: 1.2, oil_gas: 1.3,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'FCA customs registration + trade license',
      labelAr: 'التسجيل الجمركي الاتحادي والترخيص التجاري',
      hint:    'Upload your current Federal Customs Authority registration and trade license.',
      hintAr:  'ارفع تسجيلكم الحالي لدى الهيئة الاتحادية للجمارك والترخيص التجاري.',
    },
    frameworks: ['FCA', 'GCC Common Customs Tariff', 'Mirsal 2'],
    questions: [
      {
        q: 'How completely does your organisation maintain both the trade license and the separate Federal Customs Authority registration required to legally clear goods through UAE ports?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بالترخيص التجاري والتسجيل الجمركي المنفصل لدى الهيئة الاتحادية للجمارك المطلوبَين لتخليص البضائع قانونيًا عبر الموانئ الإماراتية؟',
        levels: [
          'Customs registration status is unknown; shipments have been held or delayed due to missing or lapsed registration.',
          'Both registrations exist but are tracked informally, with renewal dates not proactively monitored.',
          'A defined process tracks trade license and FCA registration renewal dates with advance reminders.',
          'Registration status is monitored across all operating entities and Emirates with automated renewal alerts.',
          'Trade license and customs registration compliance is fully governed with zero shipment delays attributable to registration lapses over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل الجمركي مجهولة؛ وتعرّضت شحنات للاحتجاز أو التأخير بسبب تسجيل مفقود أو منتهٍ.',
          'يوجد التسجيلان لكن يُتابَعان بشكل غير رسمي، ودون مراقبة استباقية لتواريخ التجديد.',
          'عملية محددة تتابع تواريخ تجديد الترخيص التجاري والتسجيل الجمركي مع تذكيرات مسبقة.',
          'حالة التسجيل تُراقَب عبر جميع الكيانات التشغيلية والإمارات مع تنبيهات تجديد آلية.',
          'الامتثال للترخيص التجاري والتسجيل الجمركي محوكَم بالكامل دون أي تأخير في الشحنات يُعزى لانتهاء التسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How accurately does your organisation classify goods under the GCC Common Customs Tariff (HS codes) and apply the correct duty treatment for mainland vs. free-zone movements?',
        qAr: 'ما مدى دقة تصنيف مؤسستكم للبضائع بموجب التعريفة الجمركية الموحدة الخليجية (رموز التنسيق) وتطبيق المعاملة الجمركية الصحيحة لحركة البضائع بين البر الرئيسي والمناطق الحرة؟',
        levels: [
          'HS code classification is done ad hoc, often by the freight forwarder, with no internal review or accountability.',
          'A basic HS code reference list exists but is not consistently applied or updated against tariff changes.',
          'HS classification is reviewed by a trained internal resource before shipment, with free-zone/mainland duty treatment explicitly checked.',
          'Classification accuracy is audited periodically, with corrective processes for any misclassification found.',
          'HS classification and duty-treatment determination are systematised with built-in tariff-change monitoring, achieving a sustained record of zero classification-driven customs disputes.',
        ],
        levelsAr: [
          'تصنيف رموز التنسيق يتم بشكل غير منتظم، غالبًا من وكيل الشحن، دون مراجعة أو مساءلة داخلية.',
          'توجد قائمة مرجعية أساسية للرموز لكنها لا تُطبَّق باستمرار أو تُحدَّث مقابل تغييرات التعريفة.',
          'يُراجَع التصنيف من موظف داخلي مُدرَّب قبل الشحن، مع فحص صريح لمعاملة الرسوم بين البر الرئيسي والمنطقة الحرة.',
          'دقة التصنيف تُدقَّق دوريًا، مع عمليات تصحيحية لأي تصنيف خاطئ يُكتشَف.',
          'تحديد التصنيف ومعاملة الرسوم مُمنهَجان مع مراقبة مدمجة لتغييرات التعريفة، محققَين سجلًا مستدامًا من عدم وجود نزاعات جمركية بسبب التصنيف.',
        ],
      },
      {
        q: 'For organisations operating through a free zone, how well is the FZ Transit Out process (via Mirsal 2) managed when goods move to the mainland market?',
        qAr: 'بالنسبة للمؤسسات العاملة عبر منطقة حرة، ما مدى جودة إدارة عملية النقل الخارج من المنطقة الحرة (عبر مرسال 2) عند انتقال البضائع إلى السوق المحلي؟',
        levels: [
          'Free-zone-to-mainland transfers happen without formal Transit Out declarations, creating compliance exposure.',
          'Transit Out declarations are filed, but duty and VAT calculations are checked only occasionally for accuracy.',
          'A defined process files Transit Out declarations through Mirsal 2 with duty (5%) and VAT calculated and verified for every mainland transfer.',
          'Transit Out volume and cost are tracked and reconciled against finance records monthly.',
          'Free-zone-to-mainland transfer compliance is fully systematised with automated Mirsal 2 integration and a sustained record of zero duty/VAT discrepancies.',
        ],
        levelsAr: [
          'تنتقل البضائع من المنطقة الحرة إلى البر الرئيسي دون إقرارات نقل رسمية، مما يخلق تعرّضًا للمخاطر.',
          'تُقدَّم إقرارات النقل، لكن حسابات الرسوم وضريبة القيمة المضافة تُفحَص أحيانًا فقط للدقة.',
          'عملية محددة تُقدّم إقرارات النقل عبر مرسال 2 مع حساب الرسوم (5%) والضريبة والتحقق منها لكل نقل إلى البر الرئيسي.',
          'حجم وتكلفة عمليات النقل تُتابَع وتُطابَق مع سجلات المالية شهريًا.',
          'الامتثال لنقل البضائع من المنطقة الحرة إلى البر الرئيسي مُمنهَج بالكامل مع تكامل آلي مع مرسال 2 وسجل مستدام من عدم وجود تباينات في الرسوم أو الضريبة.',
        ],
      },
      {
        q: 'How complete and audit-ready is your organisation\'s customs documentation (commercial invoices, certificates of origin, packing lists) across shipments?',
        qAr: 'ما مدى اكتمال وجاهزية التدقيق لمستندات الجمارك لدى مؤسستكم (الفواتير التجارية، شهادات المنشأ، قوائم التعبئة) عبر الشحنات؟',
        levels: [
          'Customs documentation is incomplete or inconsistent, causing frequent clearance delays.',
          'Documentation is generally complete but assembled reactively per shipment with no standard template.',
          'A standardised documentation package is used for every shipment, reviewed before submission.',
          'Documentation completeness is tracked as a KPI, with root-cause analysis for any clearance delay.',
          'Customs documentation is fully digitised and audit-ready at all times, supporting a sustained record of first-time clearance with no documentation-driven delays.',
        ],
        levelsAr: [
          'مستندات الجمارك غير مكتملة أو غير متسقة، مما يسبب تأخيرات متكررة في التخليص.',
          'المستندات مكتملة عمومًا لكن تُجمَّع بشكل تفاعلي لكل شحنة دون نموذج موحد.',
          'حزمة مستندات موحدة تُستخدَم لكل شحنة، وتُراجَع قبل التقديم.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع تحليل السبب الجذري لأي تأخير في التخليص.',
          'مستندات الجمارك رقمية بالكامل وجاهزة للتدقيق في كل وقت، وتدعم سجلًا مستدامًا من التخليص من أول مرة دون تأخيرات بسبب المستندات.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to UAE customs duty rules, tariff classifications, and free-zone regulations that could affect landed cost?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم للتغيرات في قواعد الرسوم الجمركية الإماراتية وتصنيفات التعريفة ولوائح المناطق الحرة التي قد تؤثر على التكلفة الإجمالية للوصول؟',
        levels: [
          'Regulatory changes are learned about only when a shipment is affected at the port.',
          'Some monitoring occurs informally through customs brokers or industry news, without a defined process.',
          'A designated function periodically reviews FCA and Emirate-level customs updates relevant to the organisation\'s trade lanes.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'Customs regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with external customs advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تتأثر شحنة عند الميناء.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر الوسطاء الجمركيين أو أخبار القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات الهيئة الاتحادية والجمارك على مستوى الإمارات ذات الصلة بمسارات تجارة المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف التغيرات الجمركية وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين جمركيين خارجيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14U.4  Product Conformity & Standards (ESMA) ────────────────── */
  {
    id: 'uae-reg-conformity',
    title: 'Product Conformity & Standards (ESMA)',
    titleAr: 'مطابقة المنتجات والمعايير (هيئة الإمارات للمواصفات والمقاييس)',
    hint: 'Source: Emirates Authority for Standardisation and Metrology (ESMA) — the federal body for national standards, conformity assessment, and metrology.',
    hintAr: 'المصدر: هيئة الإمارات للمواصفات والمقاييس — الجهة الاتحادية للمعايير الوطنية وتقييم المطابقة والمقاييس.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 1.3, oil_gas: 1.0,
      government: 0.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'ESMA conformity/product registration certificates',
      labelAr: 'شهادات المطابقة/تسجيل المنتجات من الهيئة',
      hint:    'Upload current ESMA conformity assessment or product registration certificates for your product portfolio.',
      hintAr:  'ارفع شهادات تقييم المطابقة أو تسجيل المنتجات الحالية من الهيئة لمحفظة منتجاتكم.',
    },
    frameworks: ['ESMA', 'UAE.S Standards'],
    questions: [
      {
        q: 'How systematically does your organisation identify which of its products require ESMA conformity assessment or registration before entering the UAE market?',
        qAr: 'ما مدى منهجية تحديد مؤسستكم للمنتجات التي تتطلب تقييم مطابقة أو تسجيلًا من الهيئة قبل دخول السوق الإماراتي؟',
        levels: [
          'Product-level ESMA applicability is unknown; conformity requirements are discovered only when a shipment is rejected.',
          'Some products are known to require certification, but there is no systematic review of the full product portfolio.',
          'A defined process reviews every new product against ESMA conformity requirements before market entry.',
          'ESMA applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full portfolio.',
          'Product conformity classification is proactively managed with a governed register, achieving zero market-entry rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق متطلبات الهيئة على المنتجات مجهول؛ وتُكتشَف متطلبات المطابقة فقط عند رفض شحنة.',
          'بعض المنتجات معروف أنها تتطلب شهادة، لكن دون مراجعة منهجية لكامل محفظة المنتجات.',
          'عملية محددة تراجع كل منتج جديد مقابل متطلبات مطابقة الهيئة قبل دخول السوق.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة.',
          'تصنيف مطابقة المنتجات يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض عند دخول السوق بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation manage the ESMA-accredited conformity certification process (application, inspection, certificate issuance) end-to-end?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لعملية شهادة المطابقة المعتمدة من الهيئة (التقديم، التفتيش، إصدار الشهادة) من البداية للنهاية؟',
        levels: [
          'Certification is handled reactively, often by a supplier or agent, with no internal visibility into status or validity.',
          'Certificates exist but validity periods and renewal dates are not proactively tracked.',
          'A defined owner manages the certification process end-to-end, with renewal dates tracked and reminders set.',
          'The certification pipeline is actively managed across the full product portfolio, with pre-audit facility reviews to avoid inspection failures.',
          'ESMA certification management is a governed function with a sustained record of on-time renewals and zero certification-driven market disruptions.',
        ],
        levelsAr: [
          'تُدار الشهادات بشكل تفاعلي، غالبًا من مورد أو وكيل، دون رؤية داخلية لحالتها أو صلاحيتها.',
          'الشهادات موجودة لكن فترات الصلاحية وتواريخ التجديد لا تُتابَع استباقيًا.',
          'مالك محدد يدير عملية الشهادة من البداية للنهاية، مع متابعة تواريخ التجديد وتحديد تذكيرات.',
          'مسار الشهادات يُدار فعليًا عبر كامل محفظة المنتجات، مع مراجعات ما قبل التفتيش للمنشآت لتجنب فشل التفتيش.',
          'إدارة شهادات الهيئة وظيفة محوكَمة بسجل مستدام من التجديد في الوقت المحدد وصفر اضطرابات في السوق بسبب الشهادات.',
        ],
      },
      {
        q: 'How effectively does your organisation ensure supplier/manufacturer facilities meet ESMA inspection requirements ahead of certification or renewal?',
        qAr: 'ما مدى فعالية ضمان مؤسستكم لاستيفاء منشآت الموردين/المصنّعين لمتطلبات تفتيش الهيئة قبل الشهادة أو التجديد؟',
        levels: [
          'Supplier facility readiness for ESMA inspection is not assessed by the organisation; failures are discovered at inspection.',
          'Facility readiness is checked informally, often relying on the supplier\'s own assurance.',
          'A defined pre-inspection checklist is applied to key supplier facilities ahead of scheduled ESMA inspections.',
          'Facility readiness is actively managed with periodic self-audits against ESMA criteria between formal inspections.',
          'Supplier facility conformity readiness is a governed supplier-management KPI, with a sustained record of first-time inspection passes.',
        ],
        levelsAr: [
          'جاهزية منشآت الموردين لتفتيش الهيئة لا تُقيَّم من قبل المؤسسة؛ وتُكتشَف الإخفاقات عند التفتيش.',
          'تُفحَص جاهزية المنشآت بشكل غير رسمي، غالبًا بالاعتماد على تأكيد المورّد نفسه.',
          'قائمة تحقق محددة قبل التفتيش تُطبَّق على منشآت الموردين الرئيسية قبل مواعيد التفتيش المجدولة.',
          'جاهزية المنشآت تُدار فعليًا مع تدقيق ذاتي دوري مقابل معايير الهيئة بين التفتيشات الرسمية.',
          'جاهزية مطابقة منشآت الموردين مؤشر أداء محوكَم لإدارة الموردين، بسجل مستدام من اجتياز التفتيش من أول مرة.',
        ],
      },
      {
        q: 'How well does your organisation track and respond to ESMA standard updates (UAE.S standards) that could change product compliance requirements?',
        qAr: 'ما مدى جودة تتبّع واستجابة مؤسستكم لتحديثات معايير الهيئة (معايير الإمارات) التي قد تُغيّر متطلبات مطابقة المنتجات؟',
        levels: [
          'Standard updates are learned about only when a product is rejected or flagged at customs.',
          'Some monitoring of ESMA updates occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews ESMA standard updates relevant to the product portfolio.',
          'Standard-change monitoring is proactive and systematic, with product-impact assessments performed before changes take effect.',
          'ESMA regulatory horizon-scanning is a governed function integrated into product development, with material standard changes flagged to leadership before they take effect.',
        ],
        levelsAr: [
          'يُعرَف بتحديثات المعايير فقط عند رفض منتج أو الإشارة إليه في الجمارك.',
          'تحدث بعض مراقبة تحديثات الهيئة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات معايير الهيئة ذات الصلة بمحفظة المنتجات دوريًا.',
          'مراقبة تغيّر المعايير استباقية ومنهجية، مع تقييمات أثر على المنتجات تُجرى قبل سريان التغييرات.',
          'استشراف تغيرات معايير الهيئة وظيفة محوكَمة مُدمَجة في تطوير المنتجات، مع رفع التغييرات الجوهرية للقيادة قبل سريانها.',
        ],
      },
      {
        q: 'How complete is your organisation\'s documentation trail (test reports, certificates, technical files) supporting product conformity claims across your portfolio?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (تقارير الفحص، الشهادات، الملفات الفنية) الداعمة لمزاعم مطابقة المنتجات عبر المحفظة؟',
        levels: [
          'Conformity documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most products but is not consistently organised or readily retrievable.',
          'A central, organised documentation repository covers all products requiring ESMA conformity.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Conformity documentation is fully digitised, audit-ready, and integrated into a governed product-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المطابقة غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم المنتجات لكن غير منظمة باستمرار أو سهلة الاسترجاع.',
          'مستودع مستندات مركزي ومنظم يغطي جميع المنتجات التي تتطلب مطابقة الهيئة.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المطابقة رقمية بالكامل وجاهزة للتدقيق ومُدمَجة في نظام امتثال منتجات محوكَم دون أي فجوات مستندية.',
        ],
      },
    ],
  },

  /* ── 14U.5  Government Procurement (Federal / Abu Dhabi / Dubai) ─── */
  {
    id: 'uae-reg-procurement',
    title: 'Government Procurement (Federal / Abu Dhabi / Dubai)',
    titleAr: 'المشتريات الحكومية (الاتحادية / أبوظبي / دبي)',
    hint: 'Source: Federal Decree-Law No. 11 of 2023 on Federal Government Procurement; Abu Dhabi Government Procurement Gate (Department of Finance); Dubai Law No. 12 of 2020 on Contracts and Warehouse Management. Each jurisdiction has separate registration and evaluation rules — federal registration does not automatically qualify a bidder for Abu Dhabi or Dubai tenders.',
    hintAr: 'المصدر: المرسوم بقانون اتحادي رقم 11 لسنة 2023 بشأن المشتريات الحكومية الاتحادية؛ بوابة المشتريات الحكومية لأبوظبي (دائرة المالية)؛ قانون دبي رقم 12 لسنة 2020 بشأن العقود وإدارة المخازن. لكل جهة قواعد تسجيل وتقييم منفصلة — والتسجيل الاتحادي لا يؤهل تلقائيًا للمشاركة في مناقصات أبوظبي أو دبي.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 0.5, pharma: 1.0, retail: 0.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.3,
      government: 1.5, technology: 1.2, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'Government procurement portal registration(s)',
      labelAr: 'تسجيل بوابة (بوابات) المشتريات الحكومية',
      hint:    'Upload proof of active registration on the federal and/or relevant Emirate-level procurement portal(s) you bid through.',
      hintAr:  'ارفع إثبات التسجيل النشط في البوابة الاتحادية و/أو بوابات المشتريات على مستوى الإمارات ذات الصلة التي تقدّمون من خلالها.',
    },
    frameworks: ['Federal Decree-Law No. 11/2023', 'Abu Dhabi Procurement Gate', 'Dubai Law No. 12/2020'],
    questions: [
      {
        q: 'How clearly does your organisation understand and maintain registration across the specific government procurement jurisdictions it bids into (federal, Abu Dhabi, Dubai, or other Emirates)?',
        qAr: 'ما مدى وضوح فهم مؤسستكم واحتفاظها بالتسجيل عبر جهات المشتريات الحكومية المحددة التي تتقدّم إليها (الاتحادية، أبوظبي، دبي، أو إمارات أخرى)؟',
        levels: [
          'Registration status across jurisdictions is unclear; bids have been rejected due to missing or lapsed registration.',
          'Registration exists for at least one jurisdiction but is not systematically tracked across all jurisdictions bid into.',
          'A defined process tracks active registration status across every jurisdiction the organisation bids into.',
          'Registration is proactively maintained and expanded ahead of anticipated bidding activity in new jurisdictions.',
          'Multi-jurisdiction registration is a governed capability with zero bid disqualifications due to registration issues over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل عبر الجهات غير واضحة؛ ورُفضت مناقصات بسبب تسجيل مفقود أو منتهٍ.',
          'التسجيل موجود لجهة واحدة على الأقل لكن دون تتبّع منهجي عبر جميع الجهات المُتقدَّم إليها.',
          'عملية محددة تتابع حالة التسجيل النشط عبر كل جهة تتقدّم إليها المؤسسة.',
          'التسجيل يُحافَظ عليه ويُوسَّع استباقيًا قبل نشاط المناقصات المتوقع في جهات جديدة.',
          'التسجيل متعدد الجهات قدرة محوكَمة دون أي استبعاد من مناقصات بسبب مشكلات تسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How well does your organisation prepare bids that satisfy the documented evaluation criteria (ICV scoring, bilingual readiness, HSE governance, minimum experience) common across UAE government tenders?',
        qAr: 'ما مدى جودة إعداد مؤسستكم لمناقصات تستوفي معايير التقييم الموثّقة (تقييم القيمة المضافة المحلية، الجاهزية ثنائية اللغة، حوكمة السلامة والصحة والبيئة، الحد الأدنى من الخبرة) المشتركة عبر المناقصات الحكومية الإماراتية؟',
        levels: [
          'Bid preparation does not systematically address ICV scoring, bilingual documentation, or HSE governance requirements.',
          'These criteria are addressed reactively per bid, with inconsistent quality across submissions.',
          'A standard bid-preparation checklist ensures ICV, bilingual, HSE, and experience criteria are addressed for every submission.',
          'Bid quality is actively benchmarked against past evaluation feedback, with continuous improvement to scoring-relevant sections.',
          'Bid preparation is a governed, specialised function with a sustained high win-rate attributable to consistently strong scoring on evaluation criteria.',
        ],
        levelsAr: [
          'إعداد المناقصات لا يعالج بشكل منهجي معايير القيمة المضافة المحلية أو التوثيق ثنائي اللغة أو متطلبات حوكمة السلامة.',
          'تُعالَج هذه المعايير بشكل تفاعلي لكل مناقصة، بجودة غير متسقة عبر التقديمات.',
          'قائمة تحقق موحدة لإعداد المناقصات تضمن معالجة معايير القيمة المضافة والتوثيق ثنائي اللغة والسلامة والخبرة لكل تقديم.',
          'جودة المناقصات تُقاس فعليًا مقابل ملاحظات التقييم السابقة، مع تحسين مستمر للأقسام ذات الصلة بالتقييم.',
          'إعداد المناقصات وظيفة محوكَمة ومتخصصة بمعدل فوز مرتفع مستدام يُعزى إلى تقييم قوي باستمرار في معايير التقييم.',
        ],
      },
      {
        q: 'How effectively does your organisation maintain the minimum three years\' relevant experience documentation (contracts, completion certificates) required for tender eligibility?',
        qAr: 'ما مدى فعالية احتفاظ مؤسستكم بوثائق الخبرة ذات الصلة لثلاث سنوات على الأقل (العقود، شهادات الإنجاز) المطلوبة لأهلية المناقصة؟',
        levels: [
          'Experience documentation is scattered or incomplete; eligibility has been questioned or bids rejected as a result.',
          'Documentation exists but is assembled reactively per bid rather than maintained on an ongoing basis.',
          'A central, organised record of contracts and completion certificates supports experience claims for every relevant tender.',
          'Experience documentation is proactively updated as projects complete, ready for immediate use in any qualifying bid.',
          'Experience-eligibility documentation is a governed capability integrated with project closeout, with a sustained record of zero eligibility challenges.',
        ],
        levelsAr: [
          'وثائق الخبرة متفرقة أو غير مكتملة؛ وتم التشكيك في الأهلية أو رفض مناقصات نتيجة لذلك.',
          'المستندات موجودة لكن تُجمَّع بشكل تفاعلي لكل مناقصة بدلًا من الحفاظ عليها باستمرار.',
          'سجل مركزي ومنظم للعقود وشهادات الإنجاز يدعم مطالبات الخبرة لكل مناقصة ذات صلة.',
          'وثائق الخبرة تُحدَّث استباقيًا مع إنجاز المشاريع، وجاهزة للاستخدام الفوري في أي مناقصة مؤهلة.',
          'وثائق أهلية الخبرة قدرة محوكَمة مُدمَجة مع إغلاق المشاريع، بسجل مستدام من عدم وجود تحديات على الأهلية.',
        ],
      },
      {
        q: 'How well does your organisation understand the distinctions between federal, Abu Dhabi, and Dubai procurement rules when structuring bids and contracts across jurisdictions?',
        qAr: 'ما مدى جودة فهم مؤسستكم للفروقات بين قواعد المشتريات الاتحادية وأبوظبي ودبي عند هيكلة المناقصات والعقود عبر الجهات؟',
        levels: [
          'Bids and contracts are prepared using a single generic template regardless of jurisdiction, risking non-compliance with jurisdiction-specific rules.',
          'Awareness of jurisdictional differences exists but is not consistently applied in bid/contract preparation.',
          'Jurisdiction-specific bid and contract templates are used, reflecting the relevant federal, Abu Dhabi, or Dubai procurement rules.',
          'Legal or procurement specialists review jurisdiction-specific compliance before every major submission.',
          'Multi-jurisdiction procurement expertise is a governed organisational capability, with a documented record of successfully navigating federal, Abu Dhabi, and Dubai requirements without dispute.',
        ],
        levelsAr: [
          'تُعَدّ المناقصات والعقود بقالب عام موحد بغض النظر عن الجهة، مما يخاطر بعدم الامتثال لقواعد خاصة بكل جهة.',
          'يوجد وعي بالفروقات بين الجهات لكن دون تطبيقه باستمرار عند إعداد المناقصات/العقود.',
          'تُستخدَم قوالب مناقصات وعقود خاصة بكل جهة، تعكس قواعد المشتريات الاتحادية أو أبوظبي أو دبي ذات الصلة.',
          'متخصصون قانونيون أو في المشتريات يراجعون الامتثال الخاص بكل جهة قبل كل تقديم رئيسي.',
          'الخبرة في المشتريات متعددة الجهات قدرة تنظيمية محوكَمة، بسجل موثّق من التعامل الناجح مع متطلبات الجهة الاتحادية وأبوظبي ودبي دون نزاع.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to federal and Emirate-level procurement law that could affect bidding eligibility or contract terms?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات قانون المشتريات الاتحادي وعلى مستوى الإمارات التي قد تؤثر على أهلية المناقصة أو شروط العقد؟',
        levels: [
          'Procurement law changes are learned about only when a bid is affected or rejected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews federal and relevant Emirate-level procurement law updates.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Procurement regulatory horizon-scanning is a governed function integrated into business development strategy, with legal advisors engaged for material changes across all jurisdictions bid into.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات قانون المشتريات فقط عندما تتأثر مناقصة أو تُرفَض.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات قانون المشتريات الاتحادي وعلى مستوى الإمارة ذات الصلة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات قانون المشتريات وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين قانونيين للتغيرات الجوهرية عبر كل الجهات المُتقدَّم إليها.',
        ],
      },
    ],
  },

  /* ── 14U.6  Halal Certification & Compliance ─────────────────────── */
  {
    id: 'uae-reg-halal',
    title: 'Halal Certification & Compliance',
    titleAr: 'شهادة الحلال والامتثال',
    hint: 'Source: ESMA-accredited halal certification bodies, UAE.S 2055 standard. Mandatory for imported meat, poultry, and their derivatives; certificates specify scope and validity (1-3 years) with annual surveillance audits typically required.',
    hintAr: 'المصدر: جهات شهادة الحلال المعتمدة من الهيئة، معيار الإمارات UAE.S 2055. إلزامي للحوم والدواجن المستوردة ومشتقاتها؛ وتحدد الشهادات النطاق والصلاحية (1-3 سنوات) مع تدقيقات مراقبة سنوية مطلوبة عادةً.',
    benchmarks: { gcc: 2.5, topQuartile: 4.2 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.3, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 0.5, oil_gas: 0.5,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'ESMA-accredited halal certificate',
      labelAr: 'شهادة الحلال المعتمدة من الهيئة',
      hint:    'Upload your current halal certificate(s) from an ESMA-accredited certifying body, showing scope and validity period.',
      hintAr:  'ارفع شهادة (شهادات) الحلال الحالية من جهة معتمدة من الهيئة، موضحة النطاق وفترة الصلاحية.',
    },
    frameworks: ['ESMA', 'UAE.S 2055'],
    questions: [
      {
        q: 'How completely does your organisation identify which products in its portfolio require mandatory halal certification for UAE market entry?',
        qAr: 'ما مدى اكتمال تحديد مؤسستكم للمنتجات في محفظتها التي تتطلب شهادة حلال إلزامية لدخول السوق الإماراتي؟',
        levels: [
          'Halal certification applicability is unknown at the product level; requirements are discovered only when a shipment is rejected at customs.',
          'Meat and poultry products are known to require certification, but derivative and adjacent products are not systematically reviewed.',
          'A defined process reviews every relevant product (meat, poultry, and derivatives) against halal certification requirements before market entry.',
          'Halal applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full relevant portfolio.',
          'Halal certification classification is proactively managed with a governed register, achieving zero customs rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق شهادة الحلال على مستوى المنتج مجهول؛ وتُكتشَف المتطلبات فقط عند رفض شحنة في الجمارك.',
          'معروف أن اللحوم والدواجن تتطلب شهادة، لكن المنتجات المشتقة والمجاورة لا تُراجَع منهجيًا.',
          'عملية محددة تراجع كل منتج ذي صلة (لحوم، دواجن، ومشتقات) مقابل متطلبات شهادة الحلال قبل دخول السوق.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة ذات الصلة.',
          'تصنيف شهادة الحلال يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض جمركي بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation manage halal certificate validity periods (1–3 years) and renewal timing across its certified product portfolio?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لفترات صلاحية شهادات الحلال (1-3 سنوات) وتوقيت التجديد عبر محفظة المنتجات المُعتمَدة؟',
        levels: [
          'Certificate validity periods are not tracked; certificates have lapsed unnoticed, disrupting supply.',
          'Validity periods are known but tracked informally, without proactive renewal reminders.',
          'A defined register tracks validity and renewal dates for every halal certificate, with advance reminders set.',
          'Renewal is planned well ahead of expiry, coordinated with annual surveillance audit scheduling.',
          'Halal certificate lifecycle management is fully governed with automated tracking, achieving zero supply disruptions due to certificate lapse over the past 24 months.',
        ],
        levelsAr: [
          'فترات صلاحية الشهادات لا تُتابَع؛ وانتهت شهادات دون ملاحظة، مما عطّل الإمداد.',
          'فترات الصلاحية معروفة لكن تُتابَع بشكل غير رسمي، دون تذكيرات تجديد استباقية.',
          'سجل محدد يتابع تواريخ الصلاحية والتجديد لكل شهادة حلال، مع تحديد تذكيرات مسبقة.',
          'يُخطَّط للتجديد قبل الانتهاء بوقت كافٍ، بالتنسيق مع جدولة تدقيقات المراقبة السنوية.',
          'إدارة دورة حياة شهادات الحلال محوكَمة بالكامل مع تتبّع آلي، محققةً صفر اضطرابات إمداد بسبب انتهاء الشهادة خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How rigorously does your organisation prepare for and pass the annual surveillance audits required to maintain halal certificate validity?',
        qAr: 'ما مدى صرامة استعداد مؤسستكم واجتيازها لتدقيقات المراقبة السنوية المطلوبة للحفاظ على صلاحية شهادة الحلال؟',
        levels: [
          'Surveillance audits are not prepared for in advance; audit findings have led to certificate suspension.',
          'Audits are addressed reactively when scheduled, with limited internal readiness review.',
          'A defined pre-audit checklist confirms facility and process readiness ahead of each scheduled surveillance audit.',
          'Facility readiness is maintained continuously (not just before audits) through periodic internal self-checks against halal standard criteria.',
          'Halal compliance readiness is a governed, continuously maintained state, with a sustained record of surveillance audits passed without corrective action.',
        ],
        levelsAr: [
          'تدقيقات المراقبة لا يُستعَدّ لها مسبقًا؛ وأدت نتائج التدقيق إلى تعليق الشهادة.',
          'تُعالَج التدقيقات بشكل تفاعلي عند جدولتها، بمراجعة جاهزية داخلية محدودة.',
          'قائمة تحقق محددة قبل التدقيق تؤكد جاهزية المنشأة والعملية قبل كل تدقيق مراقبة مجدول.',
          'جاهزية المنشأة تُحافَظ عليها باستمرار (لا قبل التدقيقات فقط) عبر فحوصات ذاتية دورية مقابل معايير معيار الحلال.',
          'جاهزية الامتثال للحلال حالة محوكَمة ومُحافَظ عليها باستمرار، بسجل مستدام من اجتياز تدقيقات المراقبة دون إجراءات تصحيحية.',
        ],
      },
      {
        q: 'How well does your organisation verify halal integrity through the supply chain (sourcing, handling, storage segregation) beyond just holding a certificate?',
        qAr: 'ما مدى جودة تحقّق مؤسستكم من سلامة الحلال عبر سلسلة الإمداد (التوريد، المناولة، فصل التخزين) بما يتجاوز مجرد حيازة شهادة؟',
        levels: [
          'Halal integrity beyond certification is not actively managed; segregation of halal and non-halal goods is not verified.',
          'Basic awareness of segregation requirements exists, but verification is inconsistent across storage and handling.',
          'A defined process verifies halal segregation at sourcing, storage, and handling stages for certified products.',
          'Halal integrity is actively audited across the supply chain, including third-party logistics partners handling certified goods.',
          'End-to-end halal integrity assurance is a governed programme with full chain-of-custody traceability and a sustained record with no integrity breaches.',
        ],
        levelsAr: [
          'سلامة الحلال بما يتجاوز الشهادة لا تُدار فعليًا؛ ولا يُتحقَّق من فصل البضائع الحلال وغير الحلال.',
          'يوجد وعي أساسي بمتطلبات الفصل، لكن التحقق غير متسق عبر التخزين والمناولة.',
          'عملية محددة تتحقق من فصل الحلال في مراحل التوريد والتخزين والمناولة للمنتجات المُعتمَدة.',
          'سلامة الحلال تُدقَّق فعليًا عبر سلسلة الإمداد، بما يشمل شركاء الخدمات اللوجستية من الغير المتعاملين مع البضائع المُعتمَدة.',
          'ضمان سلامة الحلال من البداية للنهاية برنامج محوكَم بتتبّع كامل لسلسلة الحيازة وسجل مستدام دون أي خروقات للسلامة.',
        ],
      },
      {
        q: 'How proactively does your organisation select and manage relationships with ESMA-accredited halal certifying bodies to ensure reliable, defensible certification?',
        qAr: 'ما مدى استباقية اختيار مؤسستكم وإدارتها لعلاقاتها مع جهات شهادة الحلال المعتمدة من الهيئة لضمان شهادة موثوقة وقابلة للدفاع عنها؟',
        levels: [
          'No direct relationship exists with a halal certifying body; certification, where held, is managed entirely by a supplier or third party.',
          'A certifying body is engaged reactively, typically only when a certification lapse is discovered.',
          'A halal certifying body is engaged on a defined cycle aligned to certification and surveillance audit timing.',
          'The certifying-body relationship is actively managed, with pre-audit coordination to ensure smooth surveillance outcomes.',
          'Halal certification management is a governed strategic relationship, with documented evidence trails and a sustained record of dispute-free certification across all relevant products.',
        ],
        levelsAr: [
          'لا توجد علاقة مباشرة مع جهة شهادة حلال؛ وتُدار الشهادة، إن وُجدت، بالكامل من قبل مورّد أو طرف ثالث.',
          'تُستعان بجهة الشهادة بشكل تفاعلي، عادةً فقط عند اكتشاف انتهاء الشهادة.',
          'جهة شهادة الحلال تُستعان بها وفق دورة محددة متماشية مع توقيت الشهادة وتدقيق المراقبة.',
          'العلاقة مع جهة الشهادة تُدار فعليًا، مع تنسيق ما قبل التدقيق لضمان نتائج مراقبة سلسة.',
          'إدارة شهادة الحلال علاقة استراتيجية محوكَمة، بسجلات أدلة موثّقة وسجل مستدام من الشهادات دون نزاعات عبر جميع المنتجات ذات الصلة.',
        ],
      },
    ],
  },

  /* ── 14U.7  PDPL Data Privacy & Protection ───────────────────────── */
  {
    id: 'uae-reg-pdpl',
    title: 'PDPL Data Privacy & Protection',
    titleAr: 'قانون حماية البيانات الشخصية والخصوصية',
    hint: 'Source: Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data, effective 2 January 2022, overseen by the UAE Data Office. Applies UAE-wide EXCLUDING financial free zones (DIFC, ADGM), which have their own separate data protection regimes — a distinction that matters for organisations operating across zones.',
    hintAr: 'المصدر: المرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية، ساري المفعول من 2 يناير 2022، وتشرف عليه دائرة البيانات الإماراتية. يُطبَّق على مستوى الدولة باستثناء المناطق الحرة المالية (مركز دبي المالي العالمي، سوق أبوظبي العالمي)، التي لديها أنظمة حماية بيانات منفصلة خاصة بها — وهو تمييز مهم للمؤسسات العاملة عبر عدة مناطق.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.3, retail: 1.3,
      logistics: 1.0, marine: 0.5, construction: 0.5, oil_gas: 0.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'PDPL compliance policy / data inventory',
      labelAr: 'سياسة الامتثال لقانون حماية البيانات / جرد البيانات',
      hint:    'Upload your organisation\'s PDPL compliance policy or personal-data inventory covering supply chain-related data (supplier, employee, customer shipment records).',
      hintAr:  'ارفع سياسة الامتثال لقانون حماية البيانات أو جرد البيانات الشخصية لدى مؤسستكم المتعلق ببيانات سلسلة الإمداد (سجلات الموردين، الموظفين، شحنات العملاء).',
    },
    frameworks: ['Federal Decree-Law No. 45/2021', 'UAE Data Office'],
    questions: [
      {
        q: 'Does your organisation correctly determine whether Federal PDPL or a free-zone-specific regime (DIFC, ADGM) applies to each of its data-processing activities?',
        qAr: 'هل تُحدّد مؤسستكم بشكل صحيح ما إذا كان قانون حماية البيانات الاتحادي أو نظام خاص بمنطقة حرة (مركز دبي المالي، سوق أبوظبي العالمي) ينطبق على كل نشاط من أنشطة معالجة البيانات لديها؟',
        levels: [
          'The applicable data-protection regime (federal vs. free-zone) is not determined; the organisation is unaware which rules apply to which entity or activity.',
          'A general awareness exists that free zones may have different rules, but no formal determination has been made per entity.',
          'A documented assessment identifies which regime (Federal PDPL, DIFC, or ADGM) applies to each operating entity and data-processing activity.',
          'Regime applicability is reviewed whenever the organisation\'s structure or operations change (new entity, new free zone, new activity).',
          'Multi-regime data-protection applicability is a governed, continuously maintained determination, with legal sign-off for any cross-regime data flows.',
        ],
        levelsAr: [
          'النظام المُطبَّق (الاتحادي مقابل المنطقة الحرة) غير محدد؛ والمؤسسة غير مدركة أي القواعد تنطبق على أي كيان أو نشاط.',
          'يوجد وعي عام بأن المناطق الحرة قد تملك قواعد مختلفة، لكن دون تحديد رسمي لكل كيان.',
          'تقييم موثّق يحدد أي نظام (الاتحادي، مركز دبي المالي، أو سوق أبوظبي العالمي) ينطبق على كل كيان تشغيلي ونشاط معالجة بيانات.',
          'انطباق النظام يُراجَع كلما تغيّر هيكل المؤسسة أو عملياتها (كيان جديد، منطقة حرة جديدة، نشاط جديد).',
          'انطباق نظام حماية البيانات متعدد الأنظمة تحديد محوكَم ومُحافَظ عليه باستمرار، مع اعتماد قانوني لأي تدفقات بيانات عابرة للأنظمة.',
        ],
      },
      {
        q: 'How complete is your organisation\'s inventory of personal data processed through supply chain operations (supplier records, employee data, customer shipment details)?',
        qAr: 'ما مدى اكتمال جرد مؤسستكم للبيانات الشخصية المُعالَجة عبر عمليات سلسلة الإمداد (سجلات الموردين، بيانات الموظفين، تفاصيل شحن العملاء)؟',
        levels: [
          'No data inventory exists; the organisation does not know what personal data it holds or where it resides.',
          'A partial, outdated inventory exists for some systems but is not comprehensive or regularly updated.',
          'A documented data inventory covers the main supply chain systems, updated at least annually.',
          'The data inventory is actively maintained and updated whenever a new system or data flow is introduced.',
          'Data inventory management is fully automated and continuously current, integrated into system change-management processes.',
        ],
        levelsAr: [
          'لا يوجد جرد للبيانات؛ والمؤسسة لا تعرف ما هي البيانات الشخصية التي تحتفظ بها أو أين تقيم.',
          'يوجد جرد جزئي وقديم لبعض الأنظمة لكنه غير شامل أو محدَّث بانتظام.',
          'جرد بيانات موثّق يغطي أنظمة سلسلة الإمداد الرئيسية، ويُحدَّث سنويًا على الأقل.',
          'جرد البيانات يُحافَظ عليه ويُحدَّث فعليًا كلما استُحدِث نظام أو تدفق بيانات جديد.',
          'إدارة جرد البيانات آلية بالكامل ومُحدَّثة باستمرار، ومُدمَجة في عمليات إدارة التغيير للأنظمة.',
        ],
      },
      {
        q: 'How well does your organisation obtain and manage consent (or another lawful basis) for processing personal data collected through supply chain operations?',
        qAr: 'ما مدى جودة حصول مؤسستكم على الموافقة (أو أساس نظامي آخر) لمعالجة البيانات الشخصية المُجمَّعة عبر عمليات سلسلة الإمداد وإدارتها؟',
        levels: [
          'Personal data is collected and processed without a defined lawful basis or consent mechanism.',
          'Consent or lawful-basis practices exist informally but are not documented or consistently applied.',
          'A documented policy defines the lawful basis (consent or otherwise) for each category of personal data processed, applied consistently.',
          'Consent/lawful-basis records are actively maintained and auditable, with a process to handle withdrawal of consent.',
          'Lawful-basis and consent management is a governed programme with automated record-keeping and a sustained record of zero unlawful-processing findings.',
        ],
        levelsAr: [
          'تُجمَع البيانات الشخصية وتُعالَج دون أساس نظامي محدد أو آلية موافقة.',
          'توجد ممارسات موافقة أو أساس نظامي بشكل غير رسمي لكن دون توثيق أو تطبيق متسق.',
          'سياسة موثّقة تحدد الأساس النظامي (موافقة أو غيرها) لكل فئة من البيانات الشخصية المُعالَجة، وتُطبَّق باستمرار.',
          'سجلات الموافقة/الأساس النظامي تُحافَظ عليها فعليًا وقابلة للتدقيق، مع عملية للتعامل مع سحب الموافقة.',
          'إدارة الأساس النظامي والموافقة برنامج محوكَم بحفظ سجلات آلي وسجل مستدام من صفر نتائج معالجة غير قانونية.',
        ],
      },
      {
        q: 'How well does your organisation contractually bind third-party processors (logistics providers, customs brokers, IT vendors) to PDPL-compliant data-handling terms?',
        qAr: 'ما مدى جودة إلزام مؤسستكم تعاقديًا للمعالجين من الأطراف الثالثة (مزودو الخدمات اللوجستية، الوسطاء الجمركيون، موردو تقنية المعلومات) بشروط تعامل مع البيانات متوافقة مع قانون حماية البيانات؟',
        levels: [
          'Third-party contracts contain no data-protection clauses; processor compliance with PDPL is unknown.',
          'Some contracts reference data protection generically, but terms are not PDPL-specific or consistently applied.',
          'A standard PDPL-compliant data-processing clause is included in contracts with all relevant third-party processors.',
          'Third-party PDPL compliance is actively verified (e.g., through questionnaires or audits) before and during the contract term.',
          'Third-party data-processor governance is a mature, audited programme with a sustained record of zero PDPL-related third-party incidents.',
        ],
        levelsAr: [
          'عقود الأطراف الثالثة لا تحتوي على بنود حماية بيانات؛ وامتثال المعالج لقانون حماية البيانات مجهول.',
          'بعض العقود تشير إلى حماية البيانات بشكل عام، لكن الشروط ليست خاصة بالقانون أو مُطبَّقة باستمرار.',
          'بند معالجة بيانات موحد متوافق مع القانون يُدرَج في العقود مع جميع المعالجين من الأطراف الثالثة ذوي الصلة.',
          'امتثال الأطراف الثالثة للقانون يُتحقَّق منه فعليًا (عبر استبيانات أو تدقيقات) قبل وأثناء مدة العقد.',
          'حوكمة معالجي البيانات من الأطراف الثالثة برنامج ناضج ومُدقَّق بسجل مستدام من صفر حوادث متعلقة بالقانون لدى أطراف ثالثة.',
        ],
      },
      {
        q: 'How prepared is your organisation to detect, respond to, and report a personal data breach in line with PDPL and UAE Data Office expectations?',
        qAr: 'ما مدى استعداد مؤسستكم لاكتشاف اختراق بيانات شخصية والاستجابة له والإبلاغ عنه بما يتماشى مع القانون وتوقعات دائرة البيانات الإماراتية؟',
        levels: [
          'No breach-detection or response process exists; a breach would likely go undetected or unreported.',
          'General awareness of breach-reporting obligations exists, but no documented response plan or reporting timeline is defined.',
          'A documented data-breach response plan defines detection, escalation, and reporting steps aligned to PDPL requirements.',
          'The breach-response plan is tested periodically (tabletop exercises) and roles are clearly assigned across IT, legal, and operations.',
          'Breach detection and response is a mature, continuously monitored capability with automated alerting and a demonstrated ability to meet reporting timelines under real or simulated conditions.',
        ],
        levelsAr: [
          'لا توجد عملية لاكتشاف الاختراقات أو الاستجابة لها؛ ومن المرجح ألا يُكتشَف أو يُبلَّغ عن أي اختراق.',
          'يوجد وعي عام بالتزامات الإبلاغ عن الاختراقات، لكن دون خطة استجابة موثّقة أو إطار زمني محدد للإبلاغ.',
          'خطة استجابة موثّقة لاختراق البيانات تحدد خطوات الاكتشاف والتصعيد والإبلاغ بما يتماشى مع متطلبات القانون.',
          'خطة الاستجابة للاختراق تُختبَر دوريًا (تمارين محاكاة) والأدوار موزَّعة بوضوح عبر تقنية المعلومات والقانون والعمليات.',
          'اكتشاف الاختراقات والاستجابة لها قدرة ناضجة ومراقَبة باستمرار بتنبيهات آلية وقدرة مُثبَتة على الوفاء بالمهل الزمنية للإبلاغ في ظروف حقيقية أو محاكاة.',
        ],
      },
    ],
  },

];
