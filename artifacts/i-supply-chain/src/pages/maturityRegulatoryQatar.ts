/**
 * maturityRegulatoryQatar.ts
 *
 * Sub-segment content for the Qatar Regulatory & Localisation Compliance module
 * (industry module id: 'regulatory-qatar', countryFor: ['qatar']).
 *
 * Status: AUTHORED, PENDING INDEPENDENT LEGAL/EXPERT REVIEW.
 * This content was drafted from public regulator sources (Ministry of Labour,
 * Tawteen/ICV Programme, General Authority of Customs, Qatar General
 * Organization for Standardization, Ministry of Finance / Monaqasat, Ministry
 * of Public Health, Qatar Data Protection Authority) as of August 2026. It
 * has NOT yet been signed off by a named human legal/compliance reviewer, per
 * the platform's content-trust model (see /api/regulatory/countries — status
 * stays 'pending_review' until a reviewer signs off with a date). Do not mark
 * 'verified' without that step. Sources cited inline per sub-segment for
 * traceability.
 *
 * Mirrors the structure of UAE_REGULATORY_SUB_SEGMENTS in
 * maturityRegulatoryUae.ts: 5 questions per sub-segment (25 vs Saudi's 70)
 * for a first authored pass — depth can be extended per sub-segment later
 * without breaking the answer-key format.
 *
 * All Arabic is independently authored formal Gulf professional register
 * (فصحى), not machine-translated.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   QATAR REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
═══════════════════════════════════════════════════════════════════════════ */

export const QATAR_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14Q.1  Qatarization & Workforce Nationalization ─────────────── */
  {
    id: 'qatar-reg-qatarization',
    title: 'Qatarization & Workforce Nationalization',
    titleAr: 'التقطير وتوطين القوى العاملة',
    hint: 'Source: Law No. 12 of 2024 on the Qatarization of Jobs in the Private Sector, in force since 17 April 2025. Employers must prioritise Qatari nationals (then children of Qatari women) before hiring expatriates, notify the Ministry of Labour of vacancies within one month, and submit biannual workforce-composition reports. Fines up to QAR 100,000. Companies owned by QatarEnergy or engaged in petroleum/petrochemical operations are excluded. National target: 20% Qatari private/mixed-sector employment by 2030.',
    hintAr: 'المصدر: القانون رقم 12 لسنة 2024 بشأن تقطير الوظائف في القطاع الخاص، الساري منذ 17 أبريل 2025. يجب على أصحاب العمل إعطاء الأولوية للمواطنين القطريين (ثم أبناء القطريات) قبل توظيف الوافدين، وإخطار وزارة العمل بالشواغر خلال شهر واحد، وتقديم تقارير نصف سنوية عن تكوين القوى العاملة. غرامات تصل إلى 100,000 ريال قطري. الشركات المملوكة لقطر للطاقة أو العاملة في عمليات البترول/البتروكيماويات مستثناة. الهدف الوطني: 20% توظيف قطري في القطاعين الخاص والمختلط بحلول 2030.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.3, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.2, marine: 1.2, construction: 1.5, oil_gas: 0.5,
      government: 1.5, technology: 1.2, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'Ministry of Labour Qatarization compliance report',
      labelAr: 'تقرير الامتثال للتقطير من وزارة العمل',
      hint:    'Upload your organisation\'s most recent biannual workforce-composition report submitted to the Ministry of Labour.',
      hintAr:  'ارفع أحدث تقرير نصف سنوي عن تكوين القوى العاملة قدّمتموه لوزارة العمل.',
    },
    frameworks: ['Law No. 12/2024', 'Ministry of Labour'],
    questions: [
      {
        q: 'How proactively does your organisation notify the Ministry of Labour of job vacancies within the required one-month window, including job conditions, wages, and timelines?',
        qAr: 'ما مدى استباقية مؤسستكم في إخطار وزارة العمل بالشواغر الوظيفية خلال المهلة المطلوبة البالغة شهرًا واحدًا، بما يشمل شروط الوظيفة والأجور والجداول الزمنية؟',
        levels: [
          'Vacancy notifications to the Ministry are not tracked; the one-month requirement has been missed on multiple occasions.',
          'Notifications are filed reactively, close to or past the one-month deadline, without a defined internal process.',
          'A defined HR process files Ministry notifications for every vacancy within the one-month window.',
          'Vacancy notification is integrated into the recruitment workflow with automated deadline tracking across all entities.',
          'Vacancy-notification compliance is a governed HR KPI with a sustained record of zero missed deadlines over the past 24 months.',
        ],
        levelsAr: [
          'إخطارات الشواغر لوزارة العمل لا تُتابَع؛ وتم تفويت مهلة الشهر في مناسبات متعددة.',
          'تُقدَّم الإخطارات بشكل تفاعلي، قريبًا من مهلة الشهر أو بعدها، دون عملية داخلية محددة.',
          'عملية موارد بشرية محددة تقدّم إخطارات الوزارة لكل شاغر خلال مهلة الشهر.',
          'إخطار الشواغر مُدمَج في سير عمل التوظيف مع تتبّع آلي للمواعيد النهائية عبر جميع الكيانات.',
          'الامتثال لإخطار الشواغر مؤشر أداء محوكَم للموارد البشرية بسجل مستدام من عدم تفويت أي موعد خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How well does your organisation demonstrate that Qatari nationals (and children of Qatari women) were genuinely prioritised before an expatriate hire was made, as the law requires?',
        qAr: 'ما مدى جودة إثبات مؤسستكم أن المواطنين القطريين (وأبناء القطريات) قد حظوا بأولوية حقيقية قبل توظيف أي وافد، كما يشترط القانون؟',
        levels: [
          'No documented evidence exists that Qatari candidates were considered before an expatriate hire; hiring decisions are undocumented.',
          'Some hiring files reference a Qatari-candidate search, but the process is inconsistent and rarely evidenced.',
          'A defined recruitment process documents the Qatari-candidate search and outcome for every vacancy before an expatriate offer is extended.',
          'Qatari-candidate sourcing is actively pursued through Ministry channels and national talent pipelines before external recruitment begins.',
          'Priority-hiring compliance is a governed, audit-ready process with a sustained record of zero findings in Ministry workforce reviews.',
        ],
        levelsAr: [
          'لا يوجد دليل موثّق على أن المرشحين القطريين قد نُظر فيهم قبل توظيف وافد؛ وقرارات التوظيف غير موثّقة.',
          'تشير بعض ملفات التوظيف إلى بحث عن مرشح قطري، لكن العملية غير متسقة ونادرًا ما تُوثَّق.',
          'عملية توظيف محددة توثّق البحث عن مرشح قطري ونتيجته لكل شاغر قبل تقديم عرض لوافد.',
          'يُسعى فعليًا لاستقطاب الكفاءات القطرية عبر قنوات الوزارة وقنوات المواهب الوطنية قبل بدء التوظيف الخارجي.',
          'الامتثال لأولوية التوظيف عملية محوكَمة وجاهزة للتدقيق بسجل مستدام من عدم وجود ملاحظات في مراجعات القوى العاملة الوزارية.',
        ],
      },
      {
        q: 'How well does your organisation track its progress against the national 20%-by-2030 Qatarization trajectory, broken down by role and sector-specific target where applicable?',
        qAr: 'ما مدى جودة تتبّع مؤسستكم لتقدّمها مقابل مسار التقطير الوطني المستهدف 20% بحلول 2030، مصنّفًا حسب الوظيفة والهدف القطاعي المحدد عند الانطباق؟',
        levels: [
          'Qatarization percentage is not calculated or tracked at the organisation level.',
          'An overall Qatarization percentage is known but not broken down by role, department, or trajectory toward 2030.',
          'A defined process calculates and reviews the Qatarization percentage against the national trajectory at least annually.',
          'Qatarization tracking is embedded in workforce planning with role-level targets reviewed quarterly.',
          'Qatarization performance is a standing executive KPI with a multi-year hiring and development plan explicitly aligned to the 2030 national target.',
        ],
        levelsAr: [
          'نسبة التقطير لا تُحسَب أو تُتابَع على مستوى المؤسسة.',
          'نسبة تقطير إجمالية معروفة لكن دون تصنيف حسب الوظيفة أو القسم أو المسار نحو 2030.',
          'عملية محددة تحسب وتراجع نسبة التقطير مقابل المسار الوطني سنويًا على الأقل.',
          'تتبّع التقطير مُدمَج في تخطيط القوى العاملة مع أهداف على مستوى الوظيفة تُراجَع فصليًا.',
          'أداء التقطير مؤشر تنفيذي ثابت مع خطة توظيف وتطوير متعددة السنوات مرتبطة صراحة بالهدف الوطني لعام 2030.',
        ],
      },
      {
        q: 'How rigorously does your organisation assess Qatarization exposure across outsourced supply chain labour (3PL, contractors) whose headcount may be relevant to sector-level reporting?',
        qAr: 'ما مدى صرامة تقييم مؤسستكم للتعرّض لالتزامات التقطير عبر العمالة المُستعان بها في سلسلة الإمداد (مزودو الخدمات اللوجستية، المقاولون) والتي قد يكون عددها ذا صلة بالتقارير على مستوى القطاع؟',
        levels: [
          'Outsourced labour is never assessed for Qatarization relevance, even where it may affect sector-level reporting.',
          'Awareness exists that outsourced labour may matter, but no systematic contractor/3PL review occurs.',
          'A defined check reviews the Qatarization-relevant headcount of significant contractors and 3PLs before contract award.',
          'Contractor and 3PL Qatarization exposure is monitored on an ongoing basis, with contractual clauses addressing compliance risk.',
          'Extended-workforce Qatarization exposure is modelled as part of workforce planning; sourcing decisions explicitly weigh compliance impact alongside cost.',
        ],
        levelsAr: [
          'العمالة المُستعان بها من الخارج لا تُقيَّم أبدًا من حيث صلتها بالتقطير، حتى عندما قد تؤثر على التقارير على مستوى القطاع.',
          'يوجد وعي بأن العمالة الخارجية قد تكون ذات أهمية، لكن لا مراجعة منهجية للمقاولين/مزودي الخدمات اللوجستية.',
          'فحص محدد يراجع العدد ذا الصلة بالتقطير للمقاولين ومزودي الخدمات اللوجستية الجوهريين قبل الترسية.',
          'التعرّض لالتزامات التقطير لدى المقاولين ومزودي الخدمات اللوجستية يُراقَب باستمرار، مع بنود تعاقدية تعالج مخاطر الامتثال.',
          'التعرّض لالتزامات التقطير عبر القوى العاملة الممتدة يُنمذَج كجزء من تخطيط القوى العاملة؛ وقرارات التعاقد تُوازِن صراحة بين الأثر والتكلفة.',
        ],
      },
      {
        q: 'How well does your organisation plan for the operational and financial impact of a Qatarization compliance shortfall, including the QAR 100,000 fine exposure?',
        qAr: 'ما مدى جودة تخطيط مؤسستكم للأثر التشغيلي والمالي لأي نقص في الامتثال للتقطير، بما يشمل التعرّض لغرامة تصل إلى 100,000 ريال قطري؟',
        levels: [
          'No contingency exists for a compliance shortfall; fines are discovered after the fact.',
          'Leadership is generally aware fines apply, but no documented early-warning threshold or corrective-hiring plan exists.',
          'A defined threshold triggers a documented corrective hiring plan before a shortfall becomes a fineable gap.',
          'Shortfall risk is modelled quarterly against workforce plans and known attrition trends, with pre-approved contingency actions.',
          'Qatarization compliance resiliency is a standing input to workforce risk planning, stress-tested against a simulated shortfall scenario.',
        ],
        levelsAr: [
          'لا توجد خطة طوارئ لنقص الامتثال؛ وتُكتشَف الغرامات بعد وقوعها.',
          'القيادة على وعي عام بوجود غرامات، لكن لا يوجد حد إنذار مبكر موثّق أو خطة توظيف تصحيحي.',
          'حد محدد يُفعّل خطة توظيف تصحيحي موثّقة قبل أن يتحول النقص إلى فجوة مُغرَّمة.',
          'مخاطر النقص تُنمذَج فصليًا مقابل خطط القوى العاملة واتجاهات الاستنزاف المعروفة، مع إجراءات طوارئ مُعتمَدة مسبقًا.',
          'مرونة الامتثال للتقطير مُدخَل ثابت في تخطيط مخاطر القوى العاملة، وتم اختبارها مقابل سيناريو نقص محاكى.',
        ],
      },
    ],
  },

  /* ── 14Q.2  Tawteen / In-Country Value (ICV) ─────────────────────── */
  {
    id: 'qatar-reg-icv',
    title: 'Tawteen / In-Country Value (ICV)',
    titleAr: 'برنامج توطين / القيمة المضافة المحلية',
    hint: 'Source: Tawteen Supply Chain Localisation Programme, led by QatarEnergy for the energy sector and extended sector-by-sector. ICV score measures local purchases, workforce upskilling, local supplier development, and capital investment, verified via third-party certification (icv.qa / icv.tawteen.com.qa portal) and considered alongside technical and commercial bid criteria.',
    hintAr: 'المصدر: برنامج توطين سلسلة الإمداد، بقيادة قطر للطاقة لقطاع الطاقة ويتوسع قطاعًا بقطاع. يقيس مؤشر القيمة المضافة المحلية الشراء المحلي وتطوير مهارات القوى العاملة وتطوير الموردين المحليين والاستثمار الرأسمالي، ويُتحقّق منه عبر شهادة من طرف ثالث (بوابة icv.qa / icv.tawteen.com.qa) ويُؤخذ بعين الاعتبار إلى جانب معايير التقييم الفني والتجاري للعطاءات.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.0, retail: 0.5,
      logistics: 1.2, marine: 1.3, construction: 1.4, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'ICV certificate (current cycle)',
      labelAr: 'شهادة القيمة المضافة المحلية (الدورة الحالية)',
      hint:    'Upload your current ICV certificate from an approved Tawteen certifier, showing your score and certifying body.',
      hintAr:  'ارفع شهادة القيمة المضافة المحلية الحالية من جهة معتمدة من برنامج توطين، موضحة الدرجة والجهة المُصدرة.',
    },
    frameworks: ['Tawteen', 'ICV Programme', 'QatarEnergy'],
    questions: [
      {
        q: 'How rigorously does your organisation prepare and maintain the operational and financial records the ICV formula requires (local purchases, workforce upskilling, supplier development, capital investment)?',
        qAr: 'ما مدى صرامة إعداد ومؤسستكم للسجلات التشغيلية والمالية التي تتطلبها معادلة القيمة المضافة المحلية (الشراء المحلي، تطوير مهارات القوى العاملة، تطوير الموردين، الاستثمار الرأسمالي)؟',
        levels: [
          'Records supporting the ICV formula categories do not exist in a usable, auditable form.',
          'Records are assembled only when an ICV renewal or bid submission is imminent, causing delays.',
          'Records across all four ICV categories are maintained on an ongoing basis, aligned to the certification cycle.',
          'Financial and operational reporting is structured proactively to maximise ICV-relevant categories within existing systems.',
          'ICV-optimised record-keeping is a standing finance/operations objective, consistently supporting a top-quartile ICV score.',
        ],
        levelsAr: [
          'السجلات الداعمة لفئات معادلة القيمة المضافة المحلية غير موجودة بشكل قابل للاستخدام والتدقيق.',
          'تُجمَّع السجلات فقط عند اقتراب موعد تجديد الشهادة أو تقديم مناقصة، مما يسبب تأخيرًا.',
          'السجلات عبر جميع الفئات الأربع تُحافَظ عليها باستمرار، متماشية مع دورة الشهادة.',
          'التقارير المالية والتشغيلية تُبنى استباقيًا لتعظيم الفئات ذات الصلة بالقيمة المضافة المحلية ضمن الأنظمة القائمة.',
          'إدارة السجلات المُحسَّنة للقيمة المضافة المحلية هدف ثابت للمالية/العمليات، تدعم باستمرار درجة في الربع الأعلى.',
        ],
      },
      {
        q: 'How actively does your organisation manage local procurement spend to maximise its weighted contribution to the ICV score?',
        qAr: 'ما مدى فعالية إدارة مؤسستكم للإنفاق على الشراء المحلي لتعظيم مساهمته المرجّحة في درجة القيمة المضافة المحلية؟',
        levels: [
          'Local procurement spend is not tracked separately from total procurement spend; ICV impact is unknown.',
          'Local vs. imported procurement spend is tracked, but not actively managed toward the ICV score.',
          'A defined process reviews the local-content share of procurement spend against ICV targets at least annually.',
          'Sourcing decisions actively favour ICV-eligible local suppliers where cost-competitive, with the impact on ICV score modelled before major awards.',
          'Local-content optimisation is embedded in category strategy; the organisation actively develops Qatar-based suppliers to expand its ICV-eligible base.',
        ],
        levelsAr: [
          'الإنفاق على الشراء المحلي لا يُتابَع بمعزل عن إجمالي الإنفاق؛ وأثره على الدرجة مجهول.',
          'يُتابَع الإنفاق المحلي مقابل المستورد، لكن دون إدارته فعليًا نحو تحسين الدرجة.',
          'عملية محددة تراجع حصة المحتوى المحلي من الإنفاق مقابل أهداف القيمة المضافة سنويًا على الأقل.',
          'قرارات التوريد تُفضّل الموردين المحليين المؤهلين للقيمة المضافة عند التنافسية السعرية، مع نمذجة الأثر على الدرجة قبل الترسيات الكبرى.',
          'تحسين المحتوى المحلي مُدمَج في استراتيجية الفئات؛ والمؤسسة تطوّر فعليًا موردين قطريين لتوسيع قاعدتها المؤهلة.',
        ],
      },
      {
        q: 'How well does your organisation select and manage its relationship with an approved Tawteen ICV certifier to ensure accurate, defensible scoring?',
        qAr: 'ما مدى جودة اختيار مؤسستكم وإدارتها لعلاقتها مع جهة تصديق معتمدة من برنامج توطين لضمان تقييم دقيق وقابل للدفاع عنه؟',
        levels: [
          'No relationship exists with an ICV certifier; certification, if held at all, is outdated or unmanaged.',
          'A certifier is engaged only reactively when a tender requires proof of ICV score.',
          'An ICV certifier is engaged on a defined annual cycle aligned to the certification renewal date.',
          'The certifier relationship is actively managed, with pre-audit reviews to catch scoring issues before formal submission.',
          'ICV certification is treated as a strategic capability: the organisation maintains a documented, audit-ready evidence trail year-round and consistently avoids score disputes.',
        ],
        levelsAr: [
          'لا توجد علاقة مع جهة تصديق للقيمة المضافة المحلية؛ والشهادة، إن وُجدت، قديمة أو غير مُدارة.',
          'تُستعان بجهة التصديق فقط بشكل تفاعلي عندما تتطلب مناقصة إثبات الدرجة.',
          'جهة التصديق تُستعان بها وفق دورة سنوية محددة متماشية مع تاريخ التجديد.',
          'العلاقة مع جهة التصديق تُدار بفعالية، مع مراجعات ما قبل التدقيق لالتقاط مشكلات التقييم قبل التقديم الرسمي.',
          'شهادة القيمة المضافة المحلية تُعامَل كقدرة استراتيجية: تحتفظ المؤسسة بسجل أدلة موثّق وجاهز للتدقيق طوال العام وتتجنب باستمرار نزاعات الدرجة.',
        ],
      },
      {
        q: 'How effectively does your organisation use its ICV score as a competitive input to QatarEnergy and other sector-level tender bids, beyond simple compliance?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لدرجة القيمة المضافة المحلية كمُدخَل تنافسي في مناقصات قطر للطاقة وغيرها من المناقصات القطاعية، بما يتجاوز مجرد الامتثال؟',
        levels: [
          'The ICV score is not referenced in bid preparation; its tender-scoring impact is unknown to the bid team.',
          'The ICV score is included in bid documentation when required, but not positioned as a competitive differentiator.',
          'Bid teams reference the ICV score and understand its weighting impact on tender evaluation for target opportunities.',
          'ICV score trajectory is actively managed ahead of major tender cycles, with improvement targets tied to specific bid opportunities.',
          'A top-tier ICV score is a marketed competitive advantage, actively cited in bids and client relationship management across sector opportunities.',
        ],
        levelsAr: [
          'درجة القيمة المضافة المحلية لا تُذكَر عند إعداد المناقصات؛ وأثرها على تقييم المناقصة مجهول لفريق التقديم.',
          'تُدرَج الدرجة في وثائق المناقصة عند الطلب، لكن دون تقديمها كميزة تنافسية.',
          'فرق التقديم تُشير إلى الدرجة وتفهم أثر وزنها على تقييم المناقصات للفرص المستهدفة.',
          'مسار تحسين الدرجة يُدار فعليًا قبل دورات المناقصات الكبرى، مع أهداف تحسين مرتبطة بفرص مناقصات محددة.',
          'الدرجة المتقدمة ميزة تنافسية تُسوَّق فعليًا وتُذكَر في المناقصات وإدارة علاقات العملاء عبر الفرص القطاعية.',
        ],
      },
      {
        q: 'How well does your organisation coordinate ICV data (procurement, workforce, supplier development, capital investment) across finance, procurement, and HR functions to avoid conflicting or stale submissions?',
        qAr: 'ما مدى جودة تنسيق مؤسستكم لبيانات القيمة المضافة المحلية (المشتريات، القوى العاملة، تطوير الموردين، الاستثمار الرأسمالي) بين وظائف المالية والمشتريات والموارد البشرية لتجنب التقديمات المتضاربة أو القديمة؟',
        levels: [
          'Finance, procurement, and HR maintain separate, unreconciled data; ICV submissions risk inconsistency across functions.',
          'Data is shared between functions only when the certifier specifically requests it.',
          'A defined annual coordination process reconciles procurement, workforce, and investment data before ICV submission.',
          'A shared data owner maintains real-time visibility across all ICV-relevant metrics ahead of each certification cycle.',
          'ICV data governance is fully integrated across finance, procurement, and HR systems, with automated reconciliation and zero submission discrepancies over the past two cycles.',
        ],
        levelsAr: [
          'المالية والمشتريات والموارد البشرية تحتفظ ببيانات منفصلة وغير مطابَقة؛ وتقديمات القيمة المضافة المحلية معرّضة للتضارب بين الوظائف.',
          'تُشارَك البيانات بين الوظائف فقط عندما تطلبها جهة التصديق تحديدًا.',
          'عملية تنسيق سنوية محددة تطابق بيانات المشتريات والقوى العاملة والاستثمار قبل التقديم.',
          'مالك بيانات مشترك يحتفظ برؤية آنية عبر جميع المؤشرات ذات الصلة قبل كل دورة شهادة.',
          'حوكمة بيانات القيمة المضافة المحلية مُدمَجة بالكامل عبر أنظمة المالية والمشتريات والموارد البشرية، مع مطابقة آلية ودون أي تباينات في التقديم خلال آخر دورتين.',
        ],
      },
    ],
  },

  /* ── 14Q.3  Customs & Trade Compliance ───────────────────────────── */
  {
    id: 'qatar-reg-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الامتثال الجمركي والتجاري',
    hint: 'Source: General Authority of Customs (GAC), GCC Common Customs Law (standard 5% duty on CIF value). Qatar Free Zones (Ras Bufontas, Umm Alhoul) offer 0% customs duty on goods used within the zone; standard duty applies once goods move to the mainland market. Qatar Financial Centre (QFC) is a separate regime for legal, financial, and professional services.',
    hintAr: 'المصدر: الهيئة العامة للجمارك، القانون الجمركي الموحد الخليجي (رسم قياسي 5% على قيمة السيف). تمنح المناطق الحرة القطرية (رأس بو فنطاس، أم الحول) إعفاءً جمركيًا 0% على البضائع المستخدمة داخل المنطقة؛ وتُطبَّق الرسوم القياسية عند انتقال البضائع إلى السوق المحلي. مركز قطر للمال (QFC) نظام منفصل للخدمات القانونية والمالية والمهنية.',
    benchmarks: { gcc: 2.4, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.4, pharma: 1.4, retail: 1.3,
      logistics: 1.5, marine: 1.5, construction: 1.2, oil_gas: 1.2,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'GAC customs registration + trade license',
      labelAr: 'التسجيل الجمركي لدى الهيئة العامة للجمارك والترخيص التجاري',
      hint:    'Upload your current General Authority of Customs registration and trade license.',
      hintAr:  'ارفع تسجيلكم الحالي لدى الهيئة العامة للجمارك والترخيص التجاري.',
    },
    frameworks: ['GAC', 'GCC Common Customs Law', 'Qatar Free Zones'],
    questions: [
      {
        q: 'How completely does your organisation maintain both the trade license and the separate GAC customs registration required to legally clear goods through Qatari ports?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بالترخيص التجاري والتسجيل الجمركي المنفصل لدى الهيئة العامة للجمارك المطلوبَين لتخليص البضائع قانونيًا عبر الموانئ القطرية؟',
        levels: [
          'Customs registration status is unknown; shipments have been held or delayed due to missing or lapsed registration.',
          'Both registrations exist but are tracked informally, with renewal dates not proactively monitored.',
          'A defined process tracks trade license and GAC registration renewal dates with advance reminders.',
          'Registration status is monitored across all operating entities with automated renewal alerts.',
          'Trade license and customs registration compliance is fully governed with zero shipment delays attributable to registration lapses over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل الجمركي مجهولة؛ وتعرّضت شحنات للاحتجاز أو التأخير بسبب تسجيل مفقود أو منتهٍ.',
          'يوجد التسجيلان لكن يُتابَعان بشكل غير رسمي، ودون مراقبة استباقية لتواريخ التجديد.',
          'عملية محددة تتابع تواريخ تجديد الترخيص التجاري والتسجيل الجمركي مع تذكيرات مسبقة.',
          'حالة التسجيل تُراقَب عبر جميع الكيانات التشغيلية مع تنبيهات تجديد آلية.',
          'الامتثال للترخيص التجاري والتسجيل الجمركي محوكَم بالكامل دون أي تأخير في الشحنات يُعزى لانتهاء التسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How accurately does your organisation classify goods under the GCC Common Customs Tariff and apply the correct duty treatment for mainland vs. free-zone movements?',
        qAr: 'ما مدى دقة تصنيف مؤسستكم للبضائع بموجب التعريفة الجمركية الموحدة الخليجية وتطبيق المعاملة الجمركية الصحيحة لحركة البضائع بين البر الرئيسي والمناطق الحرة؟',
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
        q: 'For organisations operating through a Qatar Free Zone, how well is the transfer process managed when goods move from the free zone to the mainland market?',
        qAr: 'بالنسبة للمؤسسات العاملة عبر منطقة حرة قطرية، ما مدى جودة إدارة عملية النقل عند انتقال البضائع من المنطقة الحرة إلى السوق المحلي؟',
        levels: [
          'Free-zone-to-mainland transfers happen without formal declarations, creating compliance exposure.',
          'Transfer declarations are filed, but duty calculations are checked only occasionally for accuracy.',
          'A defined process files transfer declarations with duty (5%) calculated and verified for every mainland transfer.',
          'Transfer volume and cost are tracked and reconciled against finance records monthly.',
          'Free-zone-to-mainland transfer compliance is fully systematised with automated tracking and a sustained record of zero duty discrepancies.',
        ],
        levelsAr: [
          'تنتقل البضائع من المنطقة الحرة إلى البر الرئيسي دون إقرارات نقل رسمية، مما يخلق تعرّضًا للمخاطر.',
          'تُقدَّم إقرارات النقل، لكن حسابات الرسوم تُفحَص أحيانًا فقط للدقة.',
          'عملية محددة تُقدّم إقرارات النقل مع حساب الرسوم (5%) والتحقق منها لكل نقل إلى البر الرئيسي.',
          'حجم وتكلفة عمليات النقل تُتابَع وتُطابَق مع سجلات المالية شهريًا.',
          'الامتثال لنقل البضائع من المنطقة الحرة إلى البر الرئيسي مُمنهَج بالكامل مع تتبّع آلي وسجل مستدام من عدم وجود تباينات في الرسوم.',
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
        q: 'How proactively does your organisation monitor changes to Qatari customs duty rules, tariff classifications, and free-zone regulations that could affect landed cost?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم للتغيرات في قواعد الرسوم الجمركية القطرية وتصنيفات التعريفة ولوائح المناطق الحرة التي قد تؤثر على التكلفة الإجمالية للوصول؟',
        levels: [
          'Regulatory changes are learned about only when a shipment is affected at the port.',
          'Some monitoring occurs informally through customs brokers or industry news, without a defined process.',
          'A designated function periodically reviews GAC and free-zone updates relevant to the organisation\'s trade lanes.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'Customs regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with external customs advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تتأثر شحنة عند الميناء.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر الوسطاء الجمركيين أو أخبار القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات الهيئة العامة للجمارك والمناطق الحرة ذات الصلة بمسارات تجارة المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف التغيرات الجمركية وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين جمركيين خارجيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14Q.4  Product Conformity & Standards (QS) ──────────────────── */
  {
    id: 'qatar-reg-conformity',
    title: 'Product Conformity & Standards (QS)',
    titleAr: 'مطابقة المنتجات والمعايير (منظمة قطر للمواصفات والمقاييس)',
    hint: 'Source: Qatar General Organization for Standardization (QS) — comprises Quality & Conformity, Standards & Metrology, and Central Laboratories departments. Regulated imported products require a Certificate of Conformity issued by an approved third party under the Product Conformity Assessment (PCA/PVoC) scheme; registration of private labs/certification bodies requires ILAC/IAF-recognised accreditation.',
    hintAr: 'المصدر: منظمة قطر للمواصفات والمقاييس — تضم إدارات الجودة والمطابقة، والمواصفات والمقاييس، والمختبرات المركزية. تتطلب المنتجات المستوردة الخاضعة للتنظيم شهادة مطابقة صادرة عن جهة معتمدة من طرف ثالث ضمن برنامج تقييم مطابقة المنتجات (PCA/PVoC)؛ ويتطلب تسجيل المختبرات وجهات الشهادات الخاصة اعتمادًا معترفًا به من ILAC/IAF.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 1.3, oil_gas: 1.0,
      government: 0.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'QS conformity certificate / product registration',
      labelAr: 'شهادة المطابقة/تسجيل المنتجات من منظمة قطر للمواصفات والمقاييس',
      hint:    'Upload current QS-approved Certificate of Conformity or product registration certificates for your product portfolio.',
      hintAr:  'ارفع شهادة المطابقة الحالية المعتمدة من المنظمة أو شهادات تسجيل المنتجات لمحفظة منتجاتكم.',
    },
    frameworks: ['QS', 'PCA/PVoC'],
    questions: [
      {
        q: 'How systematically does your organisation identify which of its products are subject to QS-regulated technical requirements requiring a Certificate of Conformity before entering the Qatari market?',
        qAr: 'ما مدى منهجية تحديد مؤسستكم للمنتجات الخاضعة لمتطلبات المنظمة الفنية التنظيمية التي تتطلب شهادة مطابقة قبل دخول السوق القطري؟',
        levels: [
          'Product-level QS applicability is unknown; conformity requirements are discovered only when a shipment is rejected.',
          'Some products are known to require certification, but there is no systematic review of the full product portfolio.',
          'A defined process reviews every new product against QS conformity requirements before market entry.',
          'QS applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full portfolio.',
          'Product conformity classification is proactively managed with a governed register, achieving zero market-entry rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق متطلبات المنظمة على المنتجات مجهول؛ وتُكتشَف متطلبات المطابقة فقط عند رفض شحنة.',
          'بعض المنتجات معروف أنها تتطلب شهادة، لكن دون مراجعة منهجية لكامل محفظة المنتجات.',
          'عملية محددة تراجع كل منتج جديد مقابل متطلبات مطابقة المنظمة قبل دخول السوق.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة.',
          'تصنيف مطابقة المنتجات يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض عند دخول السوق بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation manage the PCA/PVoC pre-export verification process (application, inspection, certificate issuance) end-to-end?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لعملية التحقق قبل التصدير PCA/PVoC (التقديم، التفتيش، إصدار الشهادة) من البداية للنهاية؟',
        levels: [
          'Certification is handled reactively, often by a supplier or agent, with no internal visibility into status or validity.',
          'Certificates exist but validity periods and renewal dates are not proactively tracked.',
          'A defined owner manages the certification process end-to-end, with renewal dates tracked and reminders set.',
          'The certification pipeline is actively managed across the full product portfolio, with pre-audit facility reviews to avoid inspection failures.',
          'PCA/PVoC certification management is a governed function with a sustained record of on-time renewals and zero certification-driven market disruptions.',
        ],
        levelsAr: [
          'تُدار الشهادات بشكل تفاعلي، غالبًا من مورد أو وكيل، دون رؤية داخلية لحالتها أو صلاحيتها.',
          'الشهادات موجودة لكن فترات الصلاحية وتواريخ التجديد لا تُتابَع استباقيًا.',
          'مالك محدد يدير عملية الشهادة من البداية للنهاية، مع متابعة تواريخ التجديد وتحديد تذكيرات.',
          'مسار الشهادات يُدار فعليًا عبر كامل محفظة المنتجات، مع مراجعات ما قبل التفتيش للمنشآت لتجنب فشل التفتيش.',
          'إدارة شهادات PCA/PVoC وظيفة محوكَمة بسجل مستدام من التجديد في الوقت المحدد وصفر اضطرابات في السوق بسبب الشهادات.',
        ],
      },
      {
        q: 'How effectively does your organisation ensure supplier/manufacturer facilities meet the accredited-inspection requirements ahead of certification or renewal?',
        qAr: 'ما مدى فعالية ضمان مؤسستكم لاستيفاء منشآت الموردين/المصنّعين لمتطلبات التفتيش المعتمد قبل الشهادة أو التجديد؟',
        levels: [
          'Supplier facility readiness for inspection is not assessed by the organisation; failures are discovered at inspection.',
          'Facility readiness is checked informally, often relying on the supplier\'s own assurance.',
          'A defined pre-inspection checklist is applied to key supplier facilities ahead of scheduled inspections.',
          'Facility readiness is actively managed with periodic self-audits against QS criteria between formal inspections.',
          'Supplier facility conformity readiness is a governed supplier-management KPI, with a sustained record of first-time inspection passes.',
        ],
        levelsAr: [
          'جاهزية منشآت الموردين للتفتيش لا تُقيَّم من قبل المؤسسة؛ وتُكتشَف الإخفاقات عند التفتيش.',
          'تُفحَص جاهزية المنشآت بشكل غير رسمي، غالبًا بالاعتماد على تأكيد المورّد نفسه.',
          'قائمة تحقق محددة قبل التفتيش تُطبَّق على منشآت الموردين الرئيسية قبل مواعيد التفتيش المجدولة.',
          'جاهزية المنشآت تُدار فعليًا مع تدقيق ذاتي دوري مقابل معايير المنظمة بين التفتيشات الرسمية.',
          'جاهزية مطابقة منشآت الموردين مؤشر أداء محوكَم لإدارة الموردين، بسجل مستدام من اجتياز التفتيش من أول مرة.',
        ],
      },
      {
        q: 'How well does your organisation track and respond to QS standard updates that could change product compliance requirements?',
        qAr: 'ما مدى جودة تتبّع واستجابة مؤسستكم لتحديثات معايير المنظمة التي قد تُغيّر متطلبات مطابقة المنتجات؟',
        levels: [
          'Standard updates are learned about only when a product is rejected or flagged at customs.',
          'Some monitoring of QS updates occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews QS standard updates relevant to the product portfolio.',
          'Standard-change monitoring is proactive and systematic, with product-impact assessments performed before changes take effect.',
          'QS regulatory horizon-scanning is a governed function integrated into product development, with material standard changes flagged to leadership before they take effect.',
        ],
        levelsAr: [
          'يُعرَف بتحديثات المعايير فقط عند رفض منتج أو الإشارة إليه في الجمارك.',
          'تحدث بعض مراقبة تحديثات المنظمة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات معايير المنظمة ذات الصلة بمحفظة المنتجات دوريًا.',
          'مراقبة تغيّر المعايير استباقية ومنهجية، مع تقييمات أثر على المنتجات تُجرى قبل سريان التغييرات.',
          'استشراف تغيرات معايير المنظمة وظيفة محوكَمة مُدمَجة في تطوير المنتجات، مع رفع التغييرات الجوهرية للقيادة قبل سريانها.',
        ],
      },
      {
        q: 'How complete is your organisation\'s documentation trail (test reports, certificates, technical files) supporting product conformity claims across your portfolio?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (تقارير الفحص، الشهادات، الملفات الفنية) الداعمة لمزاعم مطابقة المنتجات عبر المحفظة؟',
        levels: [
          'Conformity documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most products but is not consistently organised or readily retrievable.',
          'A central, organised documentation repository covers all products requiring QS conformity.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Conformity documentation is fully digitised, audit-ready, and integrated into a governed product-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المطابقة غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم المنتجات لكن غير منظمة باستمرار أو سهلة الاسترجاع.',
          'مستودع مستندات مركزي ومنظم يغطي جميع المنتجات التي تتطلب مطابقة المنظمة.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المطابقة رقمية بالكامل وجاهزة للتدقيق ومُدمَجة في نظام امتثال منتجات محوكَم دون أي فجوات مستندية.',
        ],
      },
    ],
  },

  /* ── 14Q.5  Government Procurement ───────────────────────────────── */
  {
    id: 'qatar-reg-procurement',
    title: 'Government Procurement',
    titleAr: 'المشتريات الحكومية',
    hint: 'Source: Law No. 24 of 2015 on the Regulation of Tenders and Auctions, Ministry of Finance. Procurement is conducted via local, general (open), or restricted tendering through the Monaqasat e-tendering portal (monaqasat.mof.gov.qa). Each procuring entity forms its own Tender Committee (5-7 members). SMEs are exempt from performance bonds and payment guarantees; recent amendments allow publication of contractor/supplier classification results and additional SME/eco-friendly-project benefits. QatarEnergy, defence/security bodies, and confidential-contract institutions are excluded.',
    hintAr: 'المصدر: القانون رقم 24 لسنة 2015 بشأن تنظيم المناقصات والمزايدات، وزارة المالية. تُجرى المشتريات عبر مناقصات محلية أو عامة (مفتوحة) أو محدودة من خلال بوابة مناقصات الإلكترونية (monaqasat.mof.gov.qa). تُشكّل كل جهة مشترية لجنة مناقصات خاصة بها (5-7 أعضاء). الشركات الصغيرة والمتوسطة مُعفاة من ضمانات حسن الأداء والدفع؛ وتسمح التعديلات الأخيرة بنشر نتائج تصنيف المقاولين/الموردين ومزايا إضافية للمشاريع الصغيرة والمتوسطة والصديقة للبيئة. قطر للطاقة وجهات الدفاع/الأمن والمؤسسات ذات العقود السرية مستثناة.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 0.5, pharma: 1.0, retail: 0.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.0,
      government: 1.5, technology: 1.2, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'Monaqasat portal registration / contractor classification',
      labelAr: 'تسجيل بوابة مناقصات / تصنيف المقاولين',
      hint:    'Upload proof of active registration on the Monaqasat portal and your current contractor/supplier classification, if applicable.',
      hintAr:  'ارفع إثبات التسجيل النشط في بوابة مناقصات وتصنيفكم الحالي كمقاول/مورد، إن انطبق.',
    },
    frameworks: ['Law No. 24/2015', 'Ministry of Finance', 'Monaqasat'],
    questions: [
      {
        q: 'How clearly does your organisation understand and maintain registration and classification status on the Monaqasat e-tendering portal?',
        qAr: 'ما مدى وضوح فهم مؤسستكم واحتفاظها بحالة التسجيل والتصنيف على بوابة مناقصات الإلكترونية؟',
        levels: [
          'Registration and classification status on Monaqasat is unclear; bids have been rejected due to missing or lapsed registration.',
          'Registration exists but classification status is not systematically tracked or renewed.',
          'A defined process tracks active registration and classification status on Monaqasat.',
          'Registration and classification are proactively maintained and upgraded ahead of anticipated bidding activity.',
          'Monaqasat registration and classification management is a governed capability with zero bid disqualifications due to registration issues over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل والتصنيف على بوابة مناقصات غير واضحة؛ ورُفضت مناقصات بسبب تسجيل مفقود أو منتهٍ.',
          'التسجيل موجود لكن حالة التصنيف لا تُتابَع أو تُجدَّد منهجيًا.',
          'عملية محددة تتابع حالة التسجيل والتصنيف النشط على بوابة مناقصات.',
          'التسجيل والتصنيف يُحافَظ عليهما ويُطوَّران استباقيًا قبل نشاط المناقصات المتوقع.',
          'إدارة التسجيل والتصنيف على بوابة مناقصات قدرة محوكَمة دون أي استبعاد من مناقصات بسبب مشكلات تسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How well does your organisation prepare bids that satisfy the documented evaluation criteria (technical capability, financial standing, ICV score where applicable) common across Qatari government tenders?',
        qAr: 'ما مدى جودة إعداد مؤسستكم لمناقصات تستوفي معايير التقييم الموثّقة (القدرة الفنية، المركز المالي، درجة القيمة المضافة المحلية عند الانطباق) المشتركة عبر المناقصات الحكومية القطرية؟',
        levels: [
          'Bid preparation does not systematically address technical, financial, or ICV-scoring requirements.',
          'These criteria are addressed reactively per bid, with inconsistent quality across submissions.',
          'A standard bid-preparation checklist ensures all evaluation criteria are addressed for every submission.',
          'Bid quality is actively benchmarked against past evaluation feedback, with continuous improvement to scoring-relevant sections.',
          'Bid preparation is a governed, specialised function with a sustained high win-rate attributable to consistently strong scoring on evaluation criteria.',
        ],
        levelsAr: [
          'إعداد المناقصات لا يعالج بشكل منهجي المتطلبات الفنية أو المالية أو تقييم القيمة المضافة المحلية.',
          'تُعالَج هذه المعايير بشكل تفاعلي لكل مناقصة، بجودة غير متسقة عبر التقديمات.',
          'قائمة تحقق موحدة لإعداد المناقصات تضمن معالجة جميع معايير التقييم لكل تقديم.',
          'جودة المناقصات تُقاس فعليًا مقابل ملاحظات التقييم السابقة، مع تحسين مستمر للأقسام ذات الصلة بالتقييم.',
          'إعداد المناقصات وظيفة محوكَمة ومتخصصة بمعدل فوز مرتفع مستدام يُعزى إلى تقييم قوي باستمرار في معايير التقييم.',
        ],
      },
      {
        q: 'How completely does your organisation maintain the prequalification evidence (completed-contract records, financial statements, technical capacity documentation) that Tender Committees evaluate before shortlisting?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بأدلة التأهيل المسبق (سجلات العقود المنجزة، القوائم المالية، وثائق القدرة الفنية) التي تُقيّمها لجان المناقصات قبل الترشيح؟',
        levels: [
          'Prequalification evidence is scattered or incomplete; eligibility has been questioned or bids rejected as a result.',
          'Evidence exists but is assembled reactively per bid rather than maintained on an ongoing basis.',
          'A central, organised record of completed-contract records and technical/financial documentation supports prequalification claims for every relevant tender.',
          'Prequalification evidence is proactively updated as projects complete, ready for immediate use in any qualifying bid.',
          'Prequalification-evidence management is a governed capability integrated with project closeout, with a sustained record of zero eligibility challenges.',
        ],
        levelsAr: [
          'أدلة التأهيل المسبق متفرقة أو غير مكتملة؛ وتم التشكيك في الأهلية أو رفض مناقصات نتيجة لذلك.',
          'الأدلة موجودة لكن تُجمّع بشكل تفاعلي لكل مناقصة بدلاً من الحفاظ عليها باستمرار.',
          'سجل مركزي ومنظم لسجلات العقود المنجزة والوثائق الفنية/المالية يدعم مطالبات التأهيل المسبق لكل مناقصة ذات صلة.',
          'أدلة التأهيل المسبق تُحدّث استباقيًا مع إنجاز المشاريع، وجاهزة للاستخدام الفوري في أي مناقصة مؤهلة.',
          'إدارة أدلة التأهيل المسبق قدرة محوكَمة مُدمَجة مع إغلاق المشاريع، بسجل مستدام من عدم وجود تحديات على الأهلية.',
        ],
      },
      {
        q: 'How well does your organisation take advantage of SME-relevant exemptions and benefits (e.g., exemption from performance bonds and payment guarantees) where it qualifies?',
        qAr: 'ما مدى استفادة مؤسستكم من الإعفاءات والمزايا ذات الصلة بالمنشآت الصغيرة والمتوسطة (مثل الإعفاء من ضمانات حسن الأداء والدفع) عند استيفاء الشروط؟',
        levels: [
          'SME status and related exemptions are not assessed or claimed, even where the organisation may qualify.',
          'SME status is known but exemptions are claimed inconsistently across bids.',
          'A defined process confirms SME eligibility and applies relevant exemptions for every qualifying bid.',
          'SME-status benefits are proactively tracked and factored into bid-cost planning and competitiveness.',
          'SME classification and benefit optimisation is a governed capability, consistently improving bid economics where eligible.',
        ],
        levelsAr: [
          'حالة المنشأة الصغيرة والمتوسطة والإعفاءات ذات الصلة لا تُقيَّم أو تُطلَب، حتى عندما قد تستوفي المؤسسة الشروط.',
          'حالة المنشأة الصغيرة والمتوسطة معروفة لكن الإعفاءات تُطلَب بشكل غير متسق عبر المناقصات.',
          'عملية محددة تؤكد أهلية المنشأة الصغيرة والمتوسطة وتُطبّق الإعفاءات ذات الصلة لكل مناقصة مؤهلة.',
          'مزايا حالة المنشأة الصغيرة والمتوسطة تُتابَع استباقيًا وتُدرَج في تخطيط تكلفة المناقصات وتنافسيتها.',
          'تصنيف المنشأة الصغيرة والمتوسطة وتحسين المزايا قدرة محوكَمة، تحسّن باستمرار اقتصاديات المناقصة عند الأهلية.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to Qatari government procurement law and Monaqasat platform requirements that could affect bidding eligibility or contract terms?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات قانون المشتريات الحكومية القطري ومتطلبات منصة مناقصات التي قد تؤثر على أهلية المناقصة أو شروط العقد؟',
        levels: [
          'Procurement law changes are learned about only when a bid is affected or rejected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Ministry of Finance procurement law and Monaqasat updates.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Procurement regulatory horizon-scanning is a governed function integrated into business development strategy, with legal advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات قانون المشتريات فقط عندما تتأثر مناقصة أو تُرفَض.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات قانون المشتريات لوزارة المالية وبوابة مناقصات دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات قانون المشتريات وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين قانونيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14Q.6  Halal Certification & Compliance ─────────────────────── */
  {
    id: 'qatar-reg-halal',
    title: 'Halal Certification & Compliance',
    titleAr: 'شهادة الحلال والامتثال',
    hint: 'Source: Ministry of Public Health (MOPH), Port Health & Food Control Section. Imported meat, poultry, and derivative products require a health certificate from the exporting country plus a Halal Slaughtering Certificate (unprocessed meat) or Halal Certificate (products containing meat, fats, or animal-derived ingredients such as gelatin) issued by an MOPH-approved Islamic centre. Requirements extend across the food chain: animal feed, ante-mortem procedures, slaughtering, handling, packaging, processing, and storage.',
    hintAr: 'المصدر: وزارة الصحة العامة، قسم الصحة والرقابة الغذائية بالموانئ. تتطلب اللحوم والدواجن المستوردة ومشتقاتها شهادة صحية من دولة التصدير بالإضافة إلى شهادة ذبح حلال (للحوم غير المصنّعة) أو شهادة حلال (للمنتجات المحتوية على لحوم أو دهون أو مكونات حيوانية المنشأ كالجيلاتين) صادرة عن مركز إسلامي معتمد من الوزارة. تمتد المتطلبات عبر سلسلة الغذاء بأكملها: علف الحيوان، إجراءات ما قبل الذبح، الذبح، المناولة، التعبئة، المعالجة، والتخزين.',
    benchmarks: { gcc: 2.5, topQuartile: 4.2 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.3, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 0.5, oil_gas: 0.5,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'MOPH-approved halal certificate',
      labelAr: 'شهادة الحلال المعتمدة من وزارة الصحة العامة',
      hint:    'Upload your current halal certificate(s) from an MOPH-approved Islamic centre, showing scope and validity period.',
      hintAr:  'ارفع شهادة (شهادات) الحلال الحالية من مركز إسلامي معتمد من الوزارة، موضحة النطاق وفترة الصلاحية.',
    },
    frameworks: ['MOPH', 'Port Health & Food Control'],
    questions: [
      {
        q: 'How completely does your organisation identify which products in its portfolio require mandatory halal certification for Qatari market entry?',
        qAr: 'ما مدى اكتمال تحديد مؤسستكم للمنتجات في محفظتها التي تتطلب شهادة حلال إلزامية لدخول السوق القطري؟',
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
        q: 'How well does your organisation obtain and manage both required certificates — the export-country health certificate and the Halal Slaughtering/Halal Certificate — for every relevant shipment?',
        qAr: 'ما مدى جودة حصول مؤسستكم على الشهادتين المطلوبتين — الشهادة الصحية من دولة التصدير وشهادة الذبح الحلال/شهادة الحلال — وإدارتهما لكل شحنة ذات صلة؟',
        levels: [
          'The dual-certificate requirement is not consistently understood or applied; shipments have been held for missing documentation.',
          'Certificates are obtained but tracked informally, without a defined verification step before shipment.',
          'A defined process verifies both certificates are valid and matched to the correct product before every shipment.',
          'Certificate verification is embedded in the supplier-qualification process, with proactive follow-up on renewal timing.',
          'Dual-certificate management is a governed, audit-ready process with a sustained record of zero port holds due to missing documentation.',
        ],
        levelsAr: [
          'متطلب الشهادتين لا يُفهم أو يُطبَّق باستمرار؛ واحتُجزت شحنات بسبب نقص المستندات.',
          'تُستخرَج الشهادات لكن تُتابَع بشكل غير رسمي، دون خطوة تحقق محددة قبل الشحن.',
          'عملية محددة تتحقق من صلاحية الشهادتين ومطابقتهما للمنتج الصحيح قبل كل شحنة.',
          'التحقق من الشهادات مُدمَج في عملية تأهيل الموردين، مع متابعة استباقية لتوقيت التجديد.',
          'إدارة الشهادتين عملية محوكَمة وجاهزة للتدقيق بسجل مستدام من عدم وجود احتجاز بالميناء بسبب نقص المستندات.',
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
        q: 'How rigorously does your organisation ensure compliance with the full-chain requirements (animal feed, ante-mortem procedures, slaughtering, handling) rather than only the final product certificate?',
        qAr: 'ما مدى صرامة ضمان مؤسستكم للامتثال لمتطلبات السلسلة الكاملة (علف الحيوان، إجراءات ما قبل الذبح، الذبح، المناولة) وليس فقط شهادة المنتج النهائي؟',
        levels: [
          'Compliance focus is limited to the final product certificate; upstream chain requirements (feed, ante-mortem, slaughtering conditions) are not reviewed.',
          'Some upstream requirements are understood but verification relies entirely on supplier self-declaration.',
          'A defined supplier-qualification process reviews upstream compliance (feed, ante-mortem, slaughtering) for key meat/poultry suppliers.',
          'Upstream compliance is periodically audited, not just declared, for suppliers representing material volume.',
          'Full-chain halal compliance assurance is a governed programme with direct or third-party audits of upstream facilities and a sustained record of no chain-of-custody findings.',
        ],
        levelsAr: [
          'يقتصر تركيز الامتثال على شهادة المنتج النهائي؛ ولا تُراجَع متطلبات السلسلة الأولية (العلف، ما قبل الذبح، ظروف الذبح).',
          'بعض المتطلبات الأولية مفهومة لكن التحقق يعتمد كليًا على إقرار المورّد الذاتي.',
          'عملية تأهيل موردين محددة تراجع الامتثال الأولي (العلف، ما قبل الذبح، الذبح) للموردين الرئيسيين للحوم/الدواجن.',
          'الامتثال الأولي يُدقَّق دوريًا، لا يُقتصَر على الإقرار، للموردين ذوي الحجم الجوهري.',
          'ضمان الامتثال الحلال عبر السلسلة الكاملة برنامج محوكَم بتدقيقات مباشرة أو من طرف ثالث للمنشآت الأولية وسجل مستدام دون ملاحظات على سلسلة الحيازة.',
        ],
      },
      {
        q: 'How proactively does your organisation select and manage relationships with MOPH-approved Islamic certifying centres to ensure reliable, defensible certification?',
        qAr: 'ما مدى استباقية اختيار مؤسستكم وإدارتها لعلاقاتها مع المراكز الإسلامية المعتمدة من وزارة الصحة العامة لإصدار الشهادات لضمان شهادة موثوقة وقابلة للدفاع عنها؟',
        levels: [
          'No direct relationship exists with a halal certifying centre; certification, where held, is managed entirely by a supplier or third party.',
          'A certifying centre is engaged reactively, typically only when a certification lapse is discovered.',
          'A halal certifying centre is engaged on a defined cycle aligned to certification timing.',
          'The certifying-centre relationship is actively managed, with pre-shipment coordination to ensure smooth clearance outcomes.',
          'Halal certification management is a governed strategic relationship, with documented evidence trails and a sustained record of dispute-free certification across all relevant products.',
        ],
        levelsAr: [
          'لا توجد علاقة مباشرة مع مركز شهادة حلال؛ وتُدار الشهادة، إن وُجدت، بالكامل من قبل مورّد أو طرف ثالث.',
          'يُستعان بمركز الشهادة بشكل تفاعلي، عادةً فقط عند اكتشاف انتهاء الشهادة.',
          'مركز شهادة الحلال يُستعان به وفق دورة محددة متماشية مع توقيت الشهادة.',
          'العلاقة مع مركز الشهادة تُدار فعليًا، مع تنسيق ما قبل الشحن لضمان نتائج تخليص سلسة.',
          'إدارة شهادة الحلال علاقة استراتيجية محوكَمة، بسجلات أدلة موثّقة وسجل مستدام من الشهادات دون نزاعات عبر جميع المنتجات ذات الصلة.',
        ],
      },
    ],
  },

  /* ── 14Q.7  PDPPL Data Privacy & Protection ──────────────────────── */
  {
    id: 'qatar-reg-pdppl',
    title: 'PDPPL Data Privacy & Protection',
    titleAr: 'قانون حماية الخصوصية والبيانات الشخصية',
    hint: 'Source: Law No. 13 of 2016 Concerning Personal Data Privacy Protection (PDPPL), overseen by the Qatar Data Protection Authority (QDPA / NCGAA). Applies broadly across sectors including retail, logistics, and technology. Requires a Data Protection Officer or responsible compliance function, a detailed processing-activity record, Data Protection Impact Assessments (DPIA) and Transfer Impact Assessments (TIA) for cross-border data flows, and breach notification for high-risk incidents.',
    hintAr: 'المصدر: القانون رقم 13 لسنة 2016 بشأن حماية خصوصية البيانات الشخصية، وتشرف عليه هيئة حماية البيانات القطرية. يُطبَّق على نطاق واسع عبر القطاعات بما يشمل التجزئة واللوجستيات والتقنية. يتطلب تعيين مسؤول حماية بيانات أو وظيفة امتثال مسؤولة، وسجلًا تفصيليًا لأنشطة المعالجة، وتقييمات أثر حماية البيانات وتقييمات أثر النقل للتدفقات العابرة للحدود، والإبلاغ عن الاختراقات عالية الخطورة.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.3, retail: 1.3,
      logistics: 1.0, marine: 0.5, construction: 0.5, oil_gas: 0.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'PDPPL compliance policy / data inventory',
      labelAr: 'سياسة الامتثال لقانون حماية البيانات / جرد البيانات',
      hint:    'Upload your organisation\'s PDPPL compliance policy or personal-data inventory covering supply chain-related data (supplier, employee, customer shipment records).',
      hintAr:  'ارفع سياسة الامتثال لقانون حماية البيانات أو جرد البيانات الشخصية لدى مؤسستكم المتعلق ببيانات سلسلة الإمداد (سجلات الموردين، الموظفين، شحنات العملاء).',
    },
    frameworks: ['Law No. 13/2016', 'QDPA'],
    questions: [
      {
        q: 'Has your organisation appointed a Data Protection Officer or designated a responsible compliance function as the PDPPL expects?',
        qAr: 'هل عيّنت مؤسستكم مسؤول حماية بيانات أو حدّدت وظيفة امتثال مسؤولة كما يتوقعه قانون حماية البيانات؟',
        levels: [
          'No individual or function is responsible for data-privacy compliance; PDPPL obligations are unowned.',
          'A function is informally responsible for data privacy but without a defined mandate or documented authority.',
          'A designated Data Protection Officer or compliance function has documented authority and responsibility for PDPPL compliance.',
          'The DPO/compliance function actively drives PDPPL compliance activities (DPIAs, TIAs, breach response) across the organisation.',
          'Data-privacy governance is a mature, board-visible function with the DPO role embedded in organisational decision-making for any new data-processing activity.',
        ],
        levelsAr: [
          'لا يوجد فرد أو وظيفة مسؤولة عن الامتثال لحماية البيانات؛ والتزامات القانون بلا مالك.',
          'وظيفة ما مسؤولة بشكل غير رسمي عن خصوصية البيانات لكن دون تفويض محدد أو سلطة موثّقة.',
          'مسؤول حماية بيانات محدد أو وظيفة امتثال لديها سلطة ومسؤولية موثّقة عن الامتثال للقانون.',
          'وظيفة مسؤول حماية البيانات/الامتثال تقود فعليًا أنشطة الامتثال (تقييمات الأثر، الاستجابة للاختراقات) عبر المؤسسة.',
          'حوكمة خصوصية البيانات وظيفة ناضجة ومرئية لمجلس الإدارة، ودور مسؤول حماية البيانات مُدمَج في صنع القرار التنظيمي لأي نشاط معالجة بيانات جديد.',
        ],
      },
      {
        q: 'How complete is your organisation\'s record of processing activities and inventory of personal data processed through supply chain operations (supplier records, employee data, customer shipment details)?',
        qAr: 'ما مدى اكتمال سجل أنشطة المعالجة وجرد مؤسستكم للبيانات الشخصية المُعالَجة عبر عمليات سلسلة الإمداد (سجلات الموردين، بيانات الموظفين، تفاصيل شحن العملاء)؟',
        levels: [
          'No processing-activity record or data inventory exists; the organisation does not know what personal data it holds or where it resides.',
          'A partial, outdated inventory exists for some systems but is not comprehensive or regularly updated.',
          'A documented data inventory and processing-activity record covers the main supply chain systems, updated at least annually.',
          'The data inventory is actively maintained and updated whenever a new system or data flow is introduced.',
          'Data inventory management is fully automated and continuously current, integrated into system change-management processes.',
        ],
        levelsAr: [
          'لا يوجد سجل لأنشطة المعالجة أو جرد للبيانات؛ والمؤسسة لا تعرف ما هي البيانات الشخصية التي تحتفظ بها أو أين تقيم.',
          'يوجد جرد جزئي وقديم لبعض الأنظمة لكنه غير شامل أو محدَّث بانتظام.',
          'جرد بيانات موثّق وسجل أنشطة معالجة يغطي أنظمة سلسلة الإمداد الرئيسية، ويُحدَّث سنويًا على الأقل.',
          'جرد البيانات يُحافَظ عليه ويُحدَّث فعليًا كلما استُحدِث نظام أو تدفق بيانات جديد.',
          'إدارة جرد البيانات آلية بالكامل ومُحدَّثة باستمرار، ومُدمَجة في عمليات إدارة التغيير للأنظمة.',
        ],
      },
      {
        q: 'How well does your organisation conduct Data Protection Impact Assessments (DPIA) and Transfer Impact Assessments (TIA) for cross-border data flows, particularly where data is transferred outside Qatar?',
        qAr: 'ما مدى جودة إجراء مؤسستكم تقييمات أثر حماية البيانات وتقييمات أثر النقل للتدفقات العابرة للحدود، لا سيما عند نقل البيانات خارج قطر؟',
        levels: [
          'DPIAs and TIAs are not conducted; cross-border data transfers occur without assessment of adequacy or transfer mechanism.',
          'Assessments are conducted informally and inconsistently, without a documented methodology.',
          'A documented DPIA/TIA process is applied to new processing activities and cross-border transfers before they begin.',
          'DPIA/TIA outcomes actively inform system design and vendor selection, with remediation tracked to closure.',
          'DPIA/TIA governance is a mature, audited programme with a sustained record of QDPA-compliant cross-border transfers and zero unassessed high-risk processing.',
        ],
        levelsAr: [
          'لا تُجرى تقييمات أثر حماية البيانات أو تقييمات أثر النقل؛ وتحدث عمليات نقل البيانات عبر الحدود دون تقييم للكفاية أو آلية النقل.',
          'تُجرى التقييمات بشكل غير رسمي وغير متسق، دون منهجية موثّقة.',
          'عملية موثّقة لتقييمات الأثر تُطبَّق على أنشطة المعالجة الجديدة والتحويلات العابرة للحدود قبل بدئها.',
          'نتائج تقييمات الأثر تُوجّه فعليًا تصميم الأنظمة واختيار الموردين، مع متابعة الإجراءات التصحيحية حتى الإغلاق.',
          'حوكمة تقييمات الأثر برنامج ناضج ومُدقَّق بسجل مستدام من عمليات نقل متوافقة مع الهيئة ودون أي معالجة عالية الخطورة غير مُقيَّمة.',
        ],
      },
      {
        q: 'How well does your organisation contractually bind third-party processors (logistics providers, customs brokers, IT vendors) to PDPPL-compliant data-handling terms?',
        qAr: 'ما مدى جودة إلزام مؤسستكم تعاقديًا للمعالجين من الأطراف الثالثة (مزودو الخدمات اللوجستية، الوسطاء الجمركيون، موردو تقنية المعلومات) بشروط تعامل مع البيانات متوافقة مع قانون حماية البيانات؟',
        levels: [
          'Third-party contracts contain no data-protection clauses; processor compliance with PDPPL is unknown.',
          'Some contracts reference data protection generically, but terms are not PDPPL-specific or consistently applied.',
          'A standard PDPPL-compliant data-processing clause is included in contracts with all relevant third-party processors.',
          'Third-party PDPPL compliance is actively verified (e.g., through questionnaires or audits) before and during the contract term.',
          'Third-party data-processor governance is a mature, audited programme with a sustained record of zero PDPPL-related third-party incidents.',
        ],
        levelsAr: [
          'عقود الأطراف الثالثة لا تحتوي على بنود حماية بيانات؛ وامتثال المعالج للقانون مجهول.',
          'بعض العقود تشير إلى حماية البيانات بشكل عام، لكن الشروط ليست خاصة بالقانون أو مُطبَّقة باستمرار.',
          'بند معالجة بيانات موحد متوافق مع القانون يُدرَج في العقود مع جميع المعالجين من الأطراف الثالثة ذوي الصلة.',
          'امتثال الأطراف الثالثة للقانون يُتحقَّق منه فعليًا (عبر استبيانات أو تدقيقات) قبل وأثناء مدة العقد.',
          'حوكمة معالجي البيانات من الأطراف الثالثة برنامج ناضج ومُدقَّق بسجل مستدام من صفر حوادث متعلقة بالقانون لدى أطراف ثالثة.',
        ],
      },
      {
        q: 'How prepared is your organisation to detect, respond to, and report a personal data breach in line with PDPPL and QDPA expectations?',
        qAr: 'ما مدى استعداد مؤسستكم لاكتشاف اختراق بيانات شخصية والاستجابة له والإبلاغ عنه بما يتماشى مع القانون وتوقعات هيئة حماية البيانات؟',
        levels: [
          'No breach-detection or response process exists; a breach would likely go undetected or unreported.',
          'General awareness of breach-reporting obligations exists, but no documented response plan or reporting timeline is defined.',
          'A documented data-breach response plan defines detection, escalation, and reporting steps aligned to PDPPL requirements.',
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
