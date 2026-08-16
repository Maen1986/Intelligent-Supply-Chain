/**
 * maturityRegulatoryBahrain.ts
 *
 * Sub-segment content for the Bahrain Regulatory & Localisation Compliance
 * module (industry module id: 'regulatory-bahrain', countryFor: ['bahrain']).
 *
 * Status: AUTHORED, PENDING INDEPENDENT LEGAL/EXPERT REVIEW.
 * This content was drafted from public regulator sources (Labour Market
 * Regulatory Authority / LMRA, Tamkeen / Labour Fund, Bahrain Customs
 * Affairs, Bahrain Standards and Metrology Directorate / BSMD under the
 * Ministry of Industry and Commerce, Tender Board / Legislative Decree
 * No. 36 of 2002, Animal Health Directorate / Ministry of Municipalities
 * Affairs and Agriculture, Personal Data Protection Authority / Law No. 30
 * of 2018) as of August 2026. It has NOT yet been signed off by a named
 * human legal/compliance reviewer, per the platform's content-trust model
 * (see /api/regulatory/countries — status stays 'pending_review' until a
 * reviewer signs off with a date). Do not mark 'verified' without that
 * step. Sources cited inline per sub-segment for traceability.
 *
 * Mirrors the structure of UAE_REGULATORY_SUB_SEGMENTS, QATAR_REGULATORY_
 * SUB_SEGMENTS, JORDAN_REGULATORY_SUB_SEGMENTS, and OMAN_REGULATORY_
 * SUB_SEGMENTS: 5 questions per sub-segment (25 vs Saudi's 70) for a first
 * authored pass — depth can be extended per sub-segment later without
 * breaking the answer-key format.
 *
 * All Arabic is independently authored formal Gulf professional register
 * (فصحى), not machine-translated.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   BAHRAIN REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
═══════════════════════════════════════════════════════════════════════════ */

export const BAHRAIN_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14B.1  Bahrainisation & Workforce Localization ───────────────── */
  {
    id: 'bahrain-reg-bahrainisation',
    title: 'Bahrainisation & Workforce Localization',
    titleAr: 'التبحرين وتوطين القوى العاملة',
    hint: 'Source: Labour Market Regulatory Authority (LMRA). As of February 2026, all private-sector employers must process salary payments through the Enhanced Wage Protection System (WPS) via LMRA\'s Expatriate Management System (EMS). All sectors are bound by electronically-monitored Bahrainisation quotas, reaching up to 50% in some sectors; employers must be quota-compliant before obtaining new expatriate work permits. Non-compliant employers are charged BHD 500 per foreign work permit and are blocked from government tenders. Work-permit fees for foreign workers rose 5% from January 2026, escalating gradually to 25% by 2029. The National Plan targets employment of 20,000 Bahrainis and training of 10,000 job seekers annually through 2026.',
    hintAr: 'المصدر: هيئة تنظيم سوق العمل. اعتبارًا من فبراير 2026، يجب على جميع أصحاب العمل في القطاع الخاص معالجة رواتب الموظفين عبر نظام حماية الأجور المُحسَّن من خلال نظام إدارة العمالة الوافدة التابع للهيئة. جميع القطاعات مُلزَمة بحصص تبحرين تُراقَب إلكترونيًا، وتصل في بعض القطاعات إلى 50%؛ ويجب أن يكون صاحب العمل ملتزمًا بالحصة قبل الحصول على تصاريح عمل جديدة للوافدين. يُفرَض على أصحاب العمل غير الملتزمين رسم 500 دينار بحريني عن كل تصريح عمل أجنبي، ويُحظَر عليهم المشاركة في المناقصات الحكومية. ارتفعت رسوم تصاريح العمل للعمالة الوافدة بنسبة 5% اعتبارًا من يناير 2026، وستتصاعد تدريجيًا إلى 25% بحلول 2029. تستهدف الخطة الوطنية توظيف 20,000 بحريني وتدريب 10,000 باحث عن عمل سنويًا حتى 2026.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.4, fmcg: 1.1, pharma: 1.0, retail: 1.3,
      logistics: 1.3, marine: 1.2, construction: 1.4, oil_gas: 1.0,
      government: 1.5, technology: 1.1, banking: 1.4, other: 1.0,
    },
    evidence: {
      label:   'LMRA Bahrainisation compliance report / Enhanced WPS submission record',
      labelAr: 'تقرير الامتثال للتبحرين لدى هيئة تنظيم سوق العمل/سجل تقديم نظام حماية الأجور المُحسَّن',
      hint:    'Upload your organisation\'s most recent LMRA Bahrainisation compliance report and proof of active Enhanced WPS submissions via the EMS.',
      hintAr:  'ارفع أحدث تقرير امتثال للتبحرين لدى هيئة تنظيم سوق العمل وإثبات تقديمات نظام حماية الأجور المُحسَّن النشطة عبر نظام إدارة العمالة الوافدة.',
    },
    frameworks: ['LMRA', 'Enhanced WPS / EMS', 'National Employment Plan'],
    questions: [
      {
        q: 'How accurately does your organisation track its Bahrainisation percentage against the sector-specific quota set by the LMRA, including awareness of the BHD 500 per-permit penalty and tender-blocklist consequences of non-compliance?',
        qAr: 'ما مدى دقة تتبّع مؤسستكم لنسبة التبحرين مقابل الحصة القطاعية المحددة من هيئة تنظيم سوق العمل، بما يشمل الوعي بغرامة 500 دينار بحريني عن كل تصريح وتبعات الحظر من المناقصات لعدم الامتثال؟',
        levels: [
          'Bahrainisation percentage is not tracked at the organisation level; penalty and tender-blocklist exposure is unknown.',
          'An overall Bahrainisation percentage is known but not benchmarked against the specific sector quota, and penalty exposure is not quantified.',
          'A defined process calculates and reviews Bahrainisation percentage against the sector quota at least annually, with penalty exposure estimated.',
          'Bahrainisation tracking is embedded in workforce planning with quota compliance reviewed quarterly ahead of any new work-permit application.',
          'Bahrainisation performance is a standing executive KPI with a multi-year hiring plan explicitly structured to sustain quota compliance and tender eligibility.',
        ],
        levelsAr: [
          'نسبة التبحرين لا تُتابَع على مستوى المؤسسة؛ والتعرّض للغرامة والحظر من المناقصات مجهول.',
          'نسبة تبحرين إجمالية معروفة لكن دون قياسها مقابل الحصة القطاعية المحددة، ودون تحديد كمي للتعرّض للغرامة.',
          'عملية محددة تحسب وتراجع نسبة التبحرين مقابل الحصة القطاعية سنويًا على الأقل، مع تقدير التعرّض للغرامة.',
          'تتبّع التبحرين مُدمَج في تخطيط القوى العاملة مع مراجعة الامتثال للحصة فصليًا قبل أي طلب تصريح عمل جديد.',
          'أداء التبحرين مؤشر تنفيذي ثابت مع خطة توظيف متعددة السنوات مُصمَّمة صراحة للحفاظ على الامتثال للحصة وأهلية المناقصات.',
        ],
      },
      {
        q: 'How completely has your organisation transitioned to the Enhanced Wage Protection System (WPS) via LMRA\'s Expatriate Management System (EMS), mandatory for all private-sector employers as of February 2026?',
        qAr: 'ما مدى اكتمال انتقال مؤسستكم إلى نظام حماية الأجور المُحسَّن عبر نظام إدارة العمالة الوافدة التابع لهيئة تنظيم سوق العمل، الإلزامي لجميع أصحاب العمل في القطاع الخاص اعتبارًا من فبراير 2026؟',
        levels: [
          'Enhanced WPS transition has not begun; salary payments are not processed through the EMS.',
          'Transition is in progress but incomplete, with some payroll cycles still outside the Enhanced WPS.',
          'All salary payments are processed through the Enhanced WPS via EMS, verified against LMRA requirements at least quarterly.',
          'Enhanced WPS compliance is actively monitored with automated reconciliation between payroll systems and EMS submissions.',
          'Enhanced WPS compliance is a governed payroll capability with a sustained record of zero submission discrepancies or delayed payments since the February 2026 mandate.',
        ],
        levelsAr: [
          'لم يبدأ الانتقال إلى نظام حماية الأجور المُحسَّن؛ ولا تُعالَج الرواتب عبر نظام إدارة العمالة الوافدة.',
          'الانتقال جارٍ لكنه غير مكتمل، مع بقاء بعض دورات الرواتب خارج النظام المُحسَّن.',
          'جميع مدفوعات الرواتب تُعالَج عبر نظام حماية الأجور المُحسَّن من خلال نظام إدارة العمالة الوافدة، ويُتحقَّق منها مقابل متطلبات الهيئة فصليًا على الأقل.',
          'الامتثال لنظام حماية الأجور المُحسَّن يُراقَب فعليًا مع مطابقة آلية بين أنظمة الرواتب وتقديمات نظام إدارة العمالة الوافدة.',
          'الامتثال لنظام حماية الأجور المُحسَّن قدرة محوكَمة للرواتب بسجل مستدام من عدم وجود تباينات في التقديم أو تأخير في المدفوعات منذ إلزامية فبراير 2026.',
        ],
      },
      {
        q: 'How well does your organisation manage the escalating work-permit fee structure (5% increase from January 2026, rising gradually to 25% by 2029) in workforce cost planning?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لهيكل رسوم تصاريح العمل المتصاعد (زيادة 5% اعتبارًا من يناير 2026، ترتفع تدريجيًا إلى 25% بحلول 2029) في تخطيط تكاليف القوى العاملة؟',
        levels: [
          'The escalating fee structure is not incorporated into workforce cost planning; budget exposure is unknown.',
          'The fee increase is known but not modelled into multi-year workforce budgets.',
          'A defined process models the escalating fee structure into workforce cost planning on an annual basis.',
          'Fee-escalation impact is proactively modelled into multi-year budgets, with sourcing decisions (Bahraini vs. expatriate hiring) informed by the trajectory.',
          'Work-permit fee-escalation management is a governed finance/HR capability, with hiring strategy actively adjusted to optimise cost as fees approach the 25% ceiling.',
        ],
        levelsAr: [
          'هيكل الرسوم المتصاعد غير مُدمَج في تخطيط تكاليف القوى العاملة؛ والتعرّض للميزانية مجهول.',
          'زيادة الرسوم معروفة لكن غير مُدرَجة في ميزانيات القوى العاملة متعددة السنوات.',
          'عملية محددة تُدرِج هيكل الرسوم المتصاعد في تخطيط تكاليف القوى العاملة سنويًا.',
          'أثر تصاعد الرسوم يُنمذَج استباقيًا في الميزانيات متعددة السنوات، مع اتخاذ قرارات التوريد (توظيف بحريني مقابل وافد) بناءً على المسار.',
          'إدارة تصاعد رسوم تصاريح العمل قدرة محوكَمة للمالية/الموارد البشرية، مع تعديل فعلي لاستراتيجية التوظيف لتحسين التكلفة مع اقتراب الرسوم من سقف 25%.',
        ],
      },
      {
        q: 'How proactively does your organisation align its hiring practices with the National Plan targets (20,000 Bahrainis employed and 10,000 job seekers trained annually) to support both compliance and national workforce goals?',
        qAr: 'ما مدى استباقية مواءمة مؤسستكم لممارسات التوظيف مع أهداف الخطة الوطنية (توظيف 20,000 بحريني وتدريب 10,000 باحث عن عمل سنويًا) لدعم الامتثال وأهداف القوى العاملة الوطنية معًا؟',
        levels: [
          'National Plan targets are unknown to the organisation; hiring practices are not aligned with them in any way.',
          'National Plan targets are generally known but not reflected in the organisation\'s hiring or training plans.',
          'A defined process aligns annual hiring and training plans with National Plan targets where relevant to the organisation\'s workforce.',
          'The organisation actively partners with Tamkeen or LMRA-affiliated training programmes to contribute measurably to national targets.',
          'National workforce-goal alignment is a governed strategic objective, with the organisation recognised as a contributor to National Plan targets through sustained Bahraini hiring and training pipelines.',
        ],
        levelsAr: [
          'أهداف الخطة الوطنية مجهولة لدى المؤسسة؛ وممارسات التوظيف غير متماشية معها بأي شكل.',
          'أهداف الخطة الوطنية معروفة عمومًا لكن غير منعكسة في خطط التوظيف أو التدريب لدى المؤسسة.',
          'عملية محددة تُوائم خطط التوظيف والتدريب السنوية مع أهداف الخطة الوطنية حيثما تتعلق بالقوى العاملة لدى المؤسسة.',
          'المؤسسة تتشارك فعليًا مع برامج تدريب تابعة لتمكين أو هيئة تنظيم سوق العمل للمساهمة بشكل قابل للقياس في الأهداف الوطنية.',
          'مواءمة أهداف القوى العاملة الوطنية هدف استراتيجي محوكَم، والمؤسسة معترف بها كمساهمة في أهداف الخطة الوطنية عبر مسارات مستدامة لتوظيف وتدريب البحرينيين.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to LMRA quotas, fee schedules, and Enhanced WPS/EMS requirements that could affect workforce planning?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات حصص هيئة تنظيم سوق العمل وجداول الرسوم ومتطلبات نظام حماية الأجور المُحسَّن/نظام إدارة العمالة الوافدة التي قد تؤثر على تخطيط القوى العاملة؟',
        levels: [
          'Regulatory changes are learned about only when a hiring or compliance issue arises.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews LMRA announcements relevant to workforce planning.',
          'Regulatory-change monitoring is proactive and systematic, with hiring-plan impact assessed before changes take effect.',
          'LMRA regulatory horizon-scanning is a governed function integrated into workforce strategy, with legal/HR advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تنشأ مشكلة توظيف أو امتثال.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع إعلانات هيئة تنظيم سوق العمل ذات الصلة بتخطيط القوى العاملة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على خطط التوظيف قبل سريانها.',
          'استشراف تغيرات هيئة تنظيم سوق العمل وظيفة محوكَمة مُدمَجة في استراتيجية القوى العاملة، مع الاستعانة بمستشارين قانونيين/موارد بشرية للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14B.2  Local Content & National Preference ───────────────────── */
  {
    id: 'bahrain-reg-localcontent',
    title: 'Local Content & National Preference',
    titleAr: 'المحتوى المحلي والأفضلية الوطنية',
    hint: 'Source: Tamkeen (Labour Fund), a semi-governmental organisation under Economic Vision 2030 supporting private-sector development, workforce training, and SME digital enablement. Bahrain\'s Tender Board framework provides price preference for Bahraini-manufactured goods over imported equivalents when specifications, delivery, and quality are comparable, and earmarks a minimum 20% of Bahrain Tenders Board (BTB) tenders for exclusive SME participation. International bidders typically require a registered Bahraini subsidiary or local partner to access SME-earmarked opportunities.',
    hintAr: 'المصدر: تمكين (صندوق العمل)، مؤسسة شبه حكومية تحت رؤية البحرين الاقتصادية 2030 تدعم تطوير القطاع الخاص وتدريب القوى العاملة والتمكين الرقمي للمنشآت الصغيرة والمتوسطة. يمنح إطار مجلس المناقصات في البحرين أفضلية سعرية للمنتجات المصنّعة بحرينيًا مقارنة بالمكافئات المستوردة عندما تكون المواصفات وشروط التسليم والجودة متقاربة، ويُخصّص ما لا يقل عن 20% من مناقصات مجلس المناقصات الحكومي حصريًا لمشاركة المنشآت الصغيرة والمتوسطة. عادةً ما يتطلب من مقدمي العطاءات الدوليين وجود شركة تابعة مسجلة في البحرين أو شريك محلي للوصول إلى الفرص المُخصَّصة للمنشآت الصغيرة والمتوسطة.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.4, fmcg: 1.0, pharma: 0.9, retail: 0.8,
      logistics: 1.0, marine: 1.0, construction: 1.3, oil_gas: 1.0,
      government: 1.3, technology: 1.2, banking: 0.6, other: 0.8,
    },
    evidence: {
      label:   'Tamkeen enrolment record / BTB SME registration certificate',
      labelAr: 'سجل التسجيل لدى تمكين/شهادة تسجيل المنشآت الصغيرة والمتوسطة لدى مجلس المناقصات',
      hint:    'Upload your organisation\'s current Tamkeen programme enrolment record and, if applicable, your Bahrain Tenders Board SME registration certificate.',
      hintAr:  'ارفع سجل التسجيل الحالي لدى برنامج تمكين، وشهادة تسجيل المنشآت الصغيرة والمتوسطة لدى مجلس المناقصات إن انطبق.',
    },
    frameworks: ['Tamkeen', 'Economic Vision 2030', 'Tender Board SME Set-Aside'],
    questions: [
      {
        q: 'How actively does your organisation leverage Tamkeen programmes (financing, training, digital enablement) to strengthen its local operational capability and workforce?',
        qAr: 'ما مدى فعالية استفادة مؤسستكم من برامج تمكين (التمويل، التدريب، التمكين الرقمي) لتعزيز قدرتها التشغيلية المحلية وقواها العاملة؟',
        levels: [
          'Tamkeen programmes are not utilised; the organisation is unaware of relevant grants or training offerings.',
          'Some awareness of Tamkeen programmes exists, but engagement is ad hoc and undocumented.',
          'A defined process reviews and applies for relevant Tamkeen programmes (training, digital enablement, financing) on an annual basis.',
          'Tamkeen engagement is proactively managed as part of workforce and digital-transformation strategy, with programme outcomes tracked.',
          'Tamkeen partnership is a governed strategic capability, with the organisation recognised as an active participant across multiple programme tracks with measurable ROI.',
        ],
        levelsAr: [
          'برامج تمكين غير مُستخدَمة؛ والمؤسسة غير مدركة للمنح أو عروض التدريب ذات الصلة.',
          'يوجد بعض الوعي ببرامج تمكين، لكن المشاركة غير منتظمة وغير موثّقة.',
          'عملية محددة تراجع وتتقدم للبرامج ذات الصلة من تمكين (تدريب، تمكين رقمي، تمويل) سنويًا.',
          'المشاركة مع تمكين تُدار استباقيًا كجزء من استراتيجية القوى العاملة والتحول الرقمي، مع تتبّع نتائج البرامج.',
          'الشراكة مع تمكين قدرة استراتيجية محوكَمة، والمؤسسة معترف بها كمشاركة فعالة عبر عدة مسارات برامج بعائد استثمار قابل للقياس.',
        ],
      },
      {
        q: 'How well does your organisation position Bahraini-manufactured or Bahrain-sourced goods and services to benefit from Tender Board price preference when bidding on government contracts?',
        qAr: 'ما مدى جودة تموضع مؤسستكم للسلع والخدمات المصنّعة أو المُصدَّرة بحرينيًا للاستفادة من الأفضلية السعرية لمجلس المناقصات عند التقدم للعقود الحكومية؟',
        levels: [
          'Bahraini-origin content is not tracked or highlighted in bid submissions; price-preference eligibility is unknown.',
          'Bahraini-origin content is generally known but not formally documented or claimed in bids.',
          'A defined process documents and claims Bahraini-origin content in every eligible government bid.',
          'Sourcing decisions actively favour Bahraini-manufactured inputs where cost-competitive, to strengthen future price-preference eligibility.',
          'Bahraini-content optimisation is embedded in category and bid strategy, consistently capturing available price-preference margins across government contracts.',
        ],
        levelsAr: [
          'المحتوى ذو المنشأ البحريني لا يُتابَع أو يُبرَز في تقديمات المناقصات؛ وأهلية الأفضلية السعرية مجهولة.',
          'المحتوى ذو المنشأ البحريني معروف عمومًا لكن غير موثّق أو مُطالَب به رسميًا في المناقصات.',
          'عملية محددة توثّق وتُطالِب بالمحتوى ذي المنشأ البحريني في كل مناقصة حكومية مؤهلة.',
          'قرارات التوريد تُفضّل فعليًا المدخلات المصنّعة بحرينيًا عند التنافسية السعرية، لتعزيز أهلية الأفضلية السعرية مستقبلاً.',
          'تحسين المحتوى البحريني مُدمَج في استراتيجية الفئات والمناقصات، محققًا باستمرار هوامش الأفضلية السعرية المتاحة عبر العقود الحكومية.',
        ],
      },
      {
        q: 'How well does your organisation navigate the SME set-aside (minimum 20% of BTB tenders) — either as an eligible SME bidder or, for larger firms, through Bahraini subsidiary or local-partner structures?',
        qAr: 'ما مدى جودة تعامل مؤسستكم مع تخصيص المنشآت الصغيرة والمتوسطة (20% كحد أدنى من مناقصات مجلس المناقصات) — سواء كمقدم عطاء مؤهل من المنشآت الصغيرة والمتوسطة، أو عبر هياكل شركة تابعة بحرينية أو شريك محلي للشركات الأكبر؟',
        levels: [
          'SME set-aside eligibility or access pathway is not understood; the organisation cannot access SME-earmarked opportunities.',
          'General awareness of the SME set-aside exists, but no formal registration or partner structure is in place.',
          'A defined SME registration (where eligible) or local-partner structure is maintained and kept current.',
          'SME set-aside or local-partner strategy is actively managed as part of business development, with a tracked pipeline of eligible opportunities.',
          'SME/local-partner access to BTB set-aside tenders is a governed business-development capability with a sustained record of successful participation.',
        ],
        levelsAr: [
          'أهلية أو مسار الوصول لتخصيص المنشآت الصغيرة والمتوسطة غير مفهوم؛ ولا يمكن للمؤسسة الوصول للفرص المُخصَّصة.',
          'يوجد وعي عام بالتخصيص، لكن لا يوجد تسجيل رسمي أو هيكل شريك قائم.',
          'تسجيل مُحدَّد للمنشآت الصغيرة والمتوسطة (حيثما تكون مؤهلة) أو هيكل شريك محلي يُحافَظ عليه ويُحدَّث.',
          'استراتيجية التخصيص أو الشريك المحلي تُدار فعليًا كجزء من تطوير الأعمال، مع مسار مُتابَع للفرص المؤهلة.',
          'الوصول عبر المنشآت الصغيرة والمتوسطة/الشريك المحلي لمناقصات مجلس المناقصات المُخصَّصة قدرة محوكَمة لتطوير الأعمال بسجل مستدام من المشاركة الناجحة.',
        ],
      },
      {
        q: 'How completely does your organisation maintain the documentation trail (Tamkeen enrolment records, Bahraini-origin certificates, SME registration) needed to substantiate local-content and preference claims?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (سجلات التسجيل لدى تمكين، شهادات المنشأ البحريني، تسجيل المنشآت الصغيرة والمتوسطة) اللازمة لإثبات مطالبات المحتوى المحلي والأفضلية؟',
        levels: [
          'Documentation supporting local-content or preference claims does not exist in a usable, auditable form.',
          'Documentation is assembled only when a specific tender requires it, causing delays.',
          'Documentation across Tamkeen enrolment, origin certification, and SME registration is maintained on an ongoing basis.',
          'Documentation completeness is tracked as a KPI ahead of major tender cycles, with gap-closure plans for any missing evidence.',
          'Local-content and preference documentation is fully digitised and audit-ready at all times, supporting a sustained record of successfully substantiated claims.',
        ],
        levelsAr: [
          'المستندات الداعمة لمطالبات المحتوى المحلي أو الأفضلية غير موجودة بشكل قابل للاستخدام والتدقيق.',
          'تُجمَّع المستندات فقط عند طلب مناقصة محددة لها، مما يسبب تأخيرًا.',
          'المستندات عبر تسجيل تمكين وشهادات المنشأ وتسجيل المنشآت الصغيرة والمتوسطة تُحافَظ عليها باستمرار.',
          'اكتمال المستندات يُتابَع كمؤشر أداء قبل دورات المناقصات الكبرى، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المحتوى المحلي والأفضلية رقمية بالكامل وجاهزة للتدقيق في كل وقت، وتدعم سجلًا مستدامًا من المطالبات المُثبَتة بنجاح.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to Tamkeen programme offerings and Tender Board local-content/SME preference rules that could affect eligibility or bid strategy?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات عروض برامج تمكين وقواعد أفضلية المحتوى المحلي/المنشآت الصغيرة والمتوسطة لدى مجلس المناقصات التي قد تؤثر على الأهلية أو استراتيجية المناقصات؟',
        levels: [
          'Programme and rule changes are learned about only when a bid or funding opportunity is affected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Tamkeen and Tender Board updates relevant to the organisation.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Local-content and SME-preference horizon-scanning is a governed function integrated into business development strategy, with advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات البرامج والقواعد فقط عندما تتأثر مناقصة أو فرصة تمويل.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات تمكين ومجلس المناقصات ذات الصلة بالمؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات المحتوى المحلي وأفضلية المنشآت الصغيرة والمتوسطة وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14B.3  Customs & Trade Compliance ────────────────────────────── */
  {
    id: 'bahrain-reg-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الامتثال الجمركي والتجاري',
    hint: 'Source: Bahrain Customs Affairs, operating under the GCC Common Customs Law with a standard external tariff of 5% on the CIF value of most imported goods. Decree No. 23/2026 (announced 18 May 2026) amends Bahrain\'s domestic customs regulations to align more closely with the GCC Common Customs Law, modifying provisions on valuation thresholds, documentation requirements, and clearance procedures. Non-compliance risks penalties, potential goods forfeiture, and reputational exposure with Bahrain Customs Affairs.',
    hintAr: 'المصدر: إدارة الجمارك البحرينية، العاملة بموجب القانون الجمركي الموحد الخليجي بتعريفة خارجية قياسية 5% على قيمة معظم البضائع المستوردة شاملة التكلفة والتأمين والشحن. يُعدِّل المرسوم رقم 23/2026 (المُعلَن في 18 مايو 2026) لوائح الجمارك المحلية في البحرين لمواءمتها بشكل أوثق مع القانون الجمركي الموحد الخليجي، معدِّلاً أحكام عتبات التقييم ومتطلبات المستندات وإجراءات التخليص. يترتب على عدم الامتثال مخاطر غرامات ومصادرة محتملة للبضائع وتعرّض للسمعة أمام إدارة الجمارك البحرينية.',
    benchmarks: { gcc: 2.3, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.4, pharma: 1.4, retail: 1.3,
      logistics: 1.5, marine: 1.3, construction: 1.2, oil_gas: 1.2,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Customs registration + Decree No. 23/2026 compliance checklist',
      labelAr: 'التسجيل الجمركي وقائمة تحقق الامتثال للمرسوم رقم 23/2026',
      hint:    'Upload your current Bahrain Customs Affairs registration and internal compliance checklist reflecting Decree No. 23/2026 amendments.',
      hintAr:  'ارفع تسجيلكم الحالي لدى إدارة الجمارك البحرينية وقائمة التحقق الداخلية للامتثال المُحدَّثة وفق تعديلات المرسوم رقم 23/2026.',
    },
    frameworks: ['GCC Common Customs Law', 'Decree No. 23/2026', 'Bahrain Customs Affairs'],
    questions: [
      {
        q: 'How completely has your organisation reviewed and adapted its customs procedures to the valuation, documentation, and clearance changes introduced by Decree No. 23/2026?',
        qAr: 'ما مدى اكتمال مراجعة مؤسستكم وتكييفها لإجراءاتها الجمركية مع تغييرات التقييم والمستندات والتخليص التي أدخلها المرسوم رقم 23/2026؟',
        levels: [
          'Decree No. 23/2026 changes are unknown to the organisation; customs procedures have not been reviewed against them.',
          'General awareness of the decree exists, but no formal gap assessment against current procedures has been conducted.',
          'A defined process has reviewed customs procedures against Decree No. 23/2026 and identified necessary adjustments.',
          'Required adjustments have been implemented and are actively monitored for continued compliance.',
          'Decree No. 23/2026 compliance is a governed capability with a sustained record of zero clearance issues attributable to the transition.',
        ],
        levelsAr: [
          'تغييرات المرسوم رقم 23/2026 مجهولة لدى المؤسسة؛ ولم تُراجَع الإجراءات الجمركية مقابلها.',
          'يوجد وعي عام بالمرسوم، لكن لم يُجرَ تقييم فجوة رسمي مقابل الإجراءات الحالية.',
          'عملية محددة راجعت الإجراءات الجمركية مقابل المرسوم رقم 23/2026 وحدّدت التعديلات اللازمة.',
          'التعديلات اللازمة نُفِّذت وتُراقَب فعليًا لاستمرار الامتثال.',
          'الامتثال للمرسوم رقم 23/2026 قدرة محوكَمة بسجل مستدام من عدم وجود مشكلات تخليص تُعزى للانتقال.',
        ],
      },
      {
        q: 'How accurately does your organisation classify goods under the GCC Common Customs Tariff and apply the correct 5% (or applicable) duty rate?',
        qAr: 'ما مدى دقة تصنيف مؤسستكم للبضائع بموجب التعريفة الجمركية الموحدة الخليجية وتطبيق معدل الرسم الصحيح 5% (أو المعدل المنطبق)؟',
        levels: [
          'HS code classification is done ad hoc, often by the freight forwarder, with no internal review or accountability.',
          'A basic HS code reference list exists but is not consistently applied or updated against tariff changes.',
          'HS classification is reviewed by a trained internal resource before shipment, with duty rate explicitly verified.',
          'Classification accuracy is audited periodically, with corrective processes for any misclassification found.',
          'HS classification and duty determination are systematised with built-in tariff-change monitoring, achieving a sustained record of zero classification-driven customs disputes.',
        ],
        levelsAr: [
          'تصنيف رموز التنسيق يتم بشكل غير منتظم، غالبًا من وكيل الشحن، دون مراجعة أو مساءلة داخلية.',
          'توجد قائمة مرجعية أساسية للرموز لكنها لا تُطبَّق باستمرار أو تُحدَّث مقابل تغييرات التعريفة.',
          'يُراجَع التصنيف من موظف داخلي مُدرَّب قبل الشحن، مع التحقق الصريح من معدل الرسم.',
          'دقة التصنيف تُدقَّق دوريًا، مع عمليات تصحيحية لأي تصنيف خاطئ يُكتشَف.',
          'تحديد التصنيف والرسوم مُمنهَجان مع مراقبة مدمجة لتغييرات التعريفة، محققَين سجلًا مستدامًا من عدم وجود نزاعات جمركية بسبب التصنيف.',
        ],
      },
      {
        q: 'How complete and audit-ready is your organisation\'s customs documentation (commercial invoices, certificates of origin, packing lists) given the tightened documentation requirements under the 2026 amendments?',
        qAr: 'ما مدى اكتمال وجاهزية التدقيق لمستندات الجمارك لدى مؤسستكم (الفواتير التجارية، شهادات المنشأ، قوائم التعبئة) في ظل متطلبات المستندات المُشدَّدة بموجب تعديلات 2026؟',
        levels: [
          'Customs documentation is incomplete or inconsistent, causing frequent clearance delays.',
          'Documentation is generally complete but assembled reactively per shipment with no standard template.',
          'A standardised documentation package is used for every shipment, reviewed against current requirements before submission.',
          'Documentation completeness is tracked as a KPI, with root-cause analysis for any clearance delay.',
          'Customs documentation is fully digitised and audit-ready at all times, supporting a sustained record of first-time clearance with no documentation-driven delays.',
        ],
        levelsAr: [
          'مستندات الجمارك غير مكتملة أو غير متسقة، مما يسبب تأخيرات متكررة في التخليص.',
          'المستندات مكتملة عمومًا لكن تُجمَّع بشكل تفاعلي لكل شحنة دون نموذج موحد.',
          'حزمة مستندات موحدة تُستخدَم لكل شحنة، وتُراجَع مقابل المتطلبات الحالية قبل التقديم.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع تحليل السبب الجذري لأي تأخير في التخليص.',
          'مستندات الجمارك رقمية بالكامل وجاهزة للتدقيق في كل وقت، وتدعم سجلًا مستدامًا من التخليص من أول مرة دون تأخيرات بسبب المستندات.',
        ],
      },
      {
        q: 'How well does your organisation manage risk exposure to penalties, goods forfeiture, or reputational damage from customs non-compliance identified in trade or industry guidance?',
        qAr: 'ما مدى جودة إدارة مؤسستكم للتعرّض لمخاطر الغرامات أو مصادرة البضائع أو الضرر بالسمعة الناتجة عن عدم الامتثال الجمركي المُشار إليه في إرشادات التجارة أو القطاع؟',
        levels: [
          'Customs non-compliance risk is not assessed or tracked; exposure to penalties or forfeiture is unknown.',
          'General awareness of compliance risk exists, but no formal risk assessment or mitigation plan is in place.',
          'A defined process periodically assesses customs compliance risk and tracks mitigation actions.',
          'Compliance risk is actively managed with pre-shipment reviews designed to prevent penalty or forfeiture exposure.',
          'Customs compliance risk management is a governed capability integrated with broader trade-compliance governance, with a sustained record of zero penalties or forfeitures.',
        ],
        levelsAr: [
          'مخاطر عدم الامتثال الجمركي لا تُقيَّم أو تُتابَع؛ والتعرّض للغرامات أو المصادرة مجهول.',
          'يوجد وعي عام بمخاطر الامتثال، لكن لا يوجد تقييم مخاطر رسمي أو خطة تخفيف.',
          'عملية محددة تقيّم مخاطر الامتثال الجمركي دوريًا وتتابع إجراءات التخفيف.',
          'مخاطر الامتثال تُدار فعليًا بمراجعات ما قبل الشحن مُصمَّمة لمنع التعرّض للغرامة أو المصادرة.',
          'إدارة مخاطر الامتثال الجمركي قدرة محوكَمة مُدمَجة مع حوكمة الامتثال التجاري الأوسع، بسجل مستدام من عدم وجود غرامات أو مصادرات.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor further GCC Common Customs Law and Bahrain-specific amendments that could affect landed cost or clearance procedures?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لمزيد من تعديلات القانون الجمركي الموحد الخليجي والتعديلات الخاصة بالبحرين التي قد تؤثر على التكلفة الإجمالية أو إجراءات التخليص؟',
        levels: [
          'Regulatory changes are learned about only when a shipment is affected at the port.',
          'Some monitoring occurs informally through customs brokers or industry news, without a defined process.',
          'A designated function periodically reviews Bahrain Customs Affairs updates relevant to the organisation\'s trade lanes.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'Customs regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with external customs advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تتأثر شحنة عند الميناء.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر الوسطاء الجمركيين أو أخبار القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات إدارة الجمارك البحرينية ذات الصلة بمسارات تجارة المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف التغيرات الجمركية وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين جمركيين خارجيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14B.4  Product Conformity & Standards (BSMD) ─────────────────── */
  {
    id: 'bahrain-reg-conformity',
    title: 'Product Conformity & Standards (BSMD)',
    titleAr: 'مطابقة المنتجات والمعايير (المديرية العامة للمواصفات والمقاييس)',
    hint: 'Source: Bahrain Standards and Metrology Directorate (BSMD), Ministry of Industry and Commerce — Bahrain\'s national standards body, responsible for developing standards by adopting international or GCC standards or preparing standards to meet national requirements. BSMD is a correspondent member of OIML, an ISO member, an associated member of the IEC, and a member of IECEE, and implements WTO/TBT good regulatory practice. BSMD operates a dedicated office at Khalifa Bin Salman Port within the Customs Department to check and approve all regulated products before they enter Bahrain, alongside ongoing market surveillance of controlled goods already in the country.',
    hintAr: 'المصدر: المديرية العامة للمواصفات والمقاييس، وزارة الصناعة والتجارة — الهيئة الوطنية للمواصفات في البحرين، المسؤولة عن وضع المواصفات باعتماد المواصفات الدولية أو الخليجية أو إعداد مواصفات لتلبية المتطلبات الوطنية. المديرية عضو مراسل في المنظمة الدولية للمترولوجيا القانونية، وعضو في المنظمة الدولية للمعايير، وعضو منتسب في اللجنة الكهروتقنية الدولية، وعضو في نظام شهادات المطابقة الكهروتقنية، وتُطبِّق ممارسات التنظيم الجيد لاتفاقية الحواجز الفنية أمام التجارة لمنظمة التجارة العالمية. تُشغِّل المديرية مكتبًا مخصصًا في ميناء خليفة بن سلمان ضمن إدارة الجمارك لفحص واعتماد جميع المنتجات الخاضعة للتنظيم قبل دخولها البحرين، إلى جانب مراقبة السوق المستمرة للسلع الخاضعة للرقابة الموجودة بالفعل في البلاد.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 1.3, oil_gas: 1.0,
      government: 0.5, technology: 1.1, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'BSMD conformity assessment approval / Khalifa Bin Salman Port clearance record',
      labelAr: 'اعتماد تقييم المطابقة من المديرية العامة/سجل التخليص من ميناء خليفة بن سلمان',
      hint:    'Upload your current BSMD conformity assessment approval and, where applicable, your Khalifa Bin Salman Port clearance record for regulated products.',
      hintAr:  'ارفع اعتماد تقييم المطابقة الحالي من المديرية العامة، وسجل التخليص من ميناء خليفة بن سلمان للمنتجات الخاضعة للتنظيم إن انطبق.',
    },
    frameworks: ['BSMD', 'GCC Standardization Organization', 'ISO / IEC / IECEE'],
    questions: [
      {
        q: 'How systematically does your organisation identify which of its products are regulated and require BSMD conformity assessment before entering Bahrain via Khalifa Bin Salman Port?',
        qAr: 'ما مدى منهجية تحديد مؤسستكم للمنتجات الخاضعة للتنظيم والتي تتطلب تقييم مطابقة من المديرية العامة قبل دخولها البحرين عبر ميناء خليفة بن سلمان؟',
        levels: [
          'Product-level BSMD applicability is unknown; conformity requirements are discovered only when a shipment is held at port.',
          'Some products are known to require conformity assessment, but there is no systematic review of the full product portfolio.',
          'A defined process reviews every new product against BSMD conformity requirements before shipment.',
          'BSMD applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full portfolio.',
          'Product conformity classification is proactively managed with a governed register, achieving zero port holds due to missing conformity approval.',
        ],
        levelsAr: [
          'انطباق متطلبات المديرية العامة على المنتجات مجهول؛ وتُكتشَف متطلبات المطابقة فقط عند احتجاز شحنة بالميناء.',
          'بعض المنتجات معروف أنها تتطلب تقييم مطابقة، لكن دون مراجعة منهجية لكامل محفظة المنتجات.',
          'عملية محددة تراجع كل منتج جديد مقابل متطلبات مطابقة المديرية العامة قبل الشحن.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة.',
          'تصنيف مطابقة المنتجات يُدار استباقيًا بسجل محوكَم، محققًا صفر احتجاز بالميناء بسبب نقص اعتماد المطابقة.',
        ],
      },
      {
        q: 'How well does your organisation prepare for and coordinate with the BSMD office at Khalifa Bin Salman Port to secure timely product approval and clearance?',
        qAr: 'ما مدى جودة استعداد مؤسستكم وتنسيقها مع مكتب المديرية العامة في ميناء خليفة بن سلمان لتأمين اعتماد المنتج وتخليصه في الوقت المناسب؟',
        levels: [
          'No direct coordination with the BSMD port office occurs; clearance timing is unpredictable and reactive.',
          'Coordination happens only when a shipment is already delayed at the port.',
          'A defined process proactively submits required documentation to the BSMD port office ahead of shipment arrival.',
          'Coordination with the BSMD port office is actively managed, with clearance timelines tracked and bottlenecks addressed.',
          'BSMD port-office coordination is a governed logistics capability with a sustained record of predictable, on-time clearance for all regulated products.',
        ],
        levelsAr: [
          'لا يحدث تنسيق مباشر مع مكتب المديرية العامة بالميناء؛ وتوقيت التخليص غير متوقع وتفاعلي.',
          'يحدث التنسيق فقط عندما تكون شحنة مُتأخِّرة بالفعل عند الميناء.',
          'عملية محددة تُقدِّم المستندات المطلوبة لمكتب المديرية العامة بالميناء استباقيًا قبل وصول الشحنة.',
          'التنسيق مع مكتب المديرية العامة بالميناء يُدار فعليًا، مع تتبّع الجداول الزمنية للتخليص ومعالجة الاختناقات.',
          'التنسيق مع مكتب المديرية العامة بالميناء قدرة لوجستية محوكَمة بسجل مستدام من تخليص متوقع وفي الوقت المحدد لجميع المنتجات الخاضعة للتنظيم.',
        ],
      },
      {
        q: 'How well does your organisation maintain conformity to relevant GCC, ISO, and IEC standards adopted by BSMD across its product portfolio, including periodic re-verification?',
        qAr: 'ما مدى جودة حفاظ مؤسستكم على المطابقة للمعايير الخليجية والدولية والكهروتقنية الدولية ذات الصلة التي اعتمدتها المديرية العامة عبر محفظة منتجاتها، بما يشمل إعادة التحقق الدورية؟',
        levels: [
          'Standards conformity is assumed but not actively verified or re-verified over time.',
          'Conformity was verified at initial product launch but not systematically re-checked as standards evolve.',
          'A defined process re-verifies conformity to applicable standards on a periodic basis.',
          'Standards conformity is actively monitored, with corrective action triggered promptly when a standard changes.',
          'Standards conformity management is a governed, continuous capability with a sustained record of zero non-conformity findings across the product portfolio.',
        ],
        levelsAr: [
          'المطابقة للمعايير تُفترَض لكن لا يُتحقَّق منها أو يُعاد التحقق فعليًا بمرور الوقت.',
          'تم التحقق من المطابقة عند إطلاق المنتج الأولي لكن دون إعادة فحص منهجية مع تطور المعايير.',
          'عملية محددة تعيد التحقق من المطابقة للمعايير المنطبقة دوريًا.',
          'المطابقة للمعايير تُراقَب فعليًا، مع اتخاذ إجراء تصحيحي فوري عند تغيّر معيار.',
          'إدارة المطابقة للمعايير قدرة محوكَمة ومستمرة بسجل مستدام من عدم وجود نتائج عدم مطابقة عبر محفظة المنتجات.',
        ],
      },
      {
        q: 'How completely does your organisation respond to BSMD market surveillance activities for controlled goods already circulating within Bahrain?',
        qAr: 'ما مدى اكتمال استجابة مؤسستكم لأنشطة مراقبة السوق التي تُجريها المديرية العامة للسلع الخاضعة للرقابة المتداولة بالفعل داخل البحرين؟',
        levels: [
          'Market surveillance requirements and processes are not understood; the organisation has no prepared response protocol.',
          'General awareness of market surveillance exists, but responses to inquiries or inspections are ad hoc.',
          'A defined protocol governs the organisation\'s response to BSMD market surveillance inquiries or inspections.',
          'Market surveillance readiness is actively maintained, with product documentation kept audit-ready at all times.',
          'Market surveillance response is a governed capability with a sustained record of clean outcomes across all BSMD inspections and inquiries.',
        ],
        levelsAr: [
          'متطلبات وعمليات مراقبة السوق غير مفهومة؛ ولا يوجد لدى المؤسسة بروتوكول استجابة مُعَد.',
          'يوجد وعي عام بمراقبة السوق، لكن الاستجابات للاستفسارات أو عمليات التفتيش غير منتظمة.',
          'بروتوكول محدد يحكم استجابة المؤسسة لاستفسارات أو عمليات تفتيش مراقبة السوق من المديرية العامة.',
          'جاهزية مراقبة السوق تُحافَظ عليها فعليًا، مع الاحتفاظ بمستندات المنتج جاهزة للتدقيق في كل وقت.',
          'الاستجابة لمراقبة السوق قدرة محوكَمة بسجل مستدام من نتائج نظيفة عبر جميع عمليات التفتيش والاستفسارات من المديرية العامة.',
        ],
      },
      {
        q: 'How complete is your organisation\'s documentation trail (test reports, certificates, technical files) supporting BSMD conformity claims across your portfolio?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (تقارير الفحص، الشهادات، الملفات الفنية) الداعمة لمزاعم مطابقة المديرية العامة عبر المحفظة؟',
        levels: [
          'Conformity documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most products but is not consistently organised or readily retrievable.',
          'A central, organised documentation repository covers all products requiring BSMD conformity assessment.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Conformity documentation is fully digitised, audit-ready, and integrated into a governed product-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المطابقة غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم المنتجات لكن غير منظمة باستمرار أو سهلة الاسترجاع.',
          'مستودع مستندات مركزي ومنظم يغطي جميع المنتجات التي تتطلب تقييم مطابقة من المديرية العامة.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المطابقة رقمية بالكامل وجاهزة للتدقيق ومُدمَجة في نظام امتثال منتجات محوكَم دون أي فجوات مستندية.',
        ],
      },
    ],
  },

  /* ── 14B.5  Government Procurement ────────────────────────────────── */
  {
    id: 'bahrain-reg-procurement',
    title: 'Government Procurement',
    titleAr: 'المشتريات الحكومية',
    hint: 'Source: Legislative Decree No. 36 of 2002 with respect to Regulating Government Tenders and Purchases, supported by implementing regulations, ministerial decisions, and circulars from the Tender Board. 2025-2026 amendments raise internal-purchase thresholds (ministries: BHD 25,000 to BHD 50,000; wholly state-owned companies: BHD 50,000 to BHD 100,000), replace rigid auction rules with flexible contracting methods (including private-sector-managed electronic auctions), and introduce negotiation provisions with Cabinet approval for single-bidder, over-budget, or near-budget cases. Between January and September 2025, the Tender Board awarded 1,538 government contracts across services, construction, energy, aviation, and materials supply.',
    hintAr: 'المصدر: المرسوم بقانون رقم 36 لسنة 2002 بشأن تنظيم المناقصات والمشتريات الحكومية، مدعومًا باللوائح التنفيذية والقرارات الوزارية والتعاميم الصادرة عن مجلس المناقصات. تُرفِّع تعديلات 2025-2026 عتبات الشراء الداخلي (الوزارات: من 25,000 إلى 50,000 دينار بحريني؛ الشركات المملوكة بالكامل للدولة: من 50,000 إلى 100,000 دينار بحريني)، وتستبدل قواعد المزاد الصارمة بأساليب تعاقد مرنة (بما يشمل مزادات إلكترونية تُديرها جهات من القطاع الخاص)، وتُدخِل أحكام تفاوض بموافقة مجلس الوزراء لحالات مقدم العطاء الوحيد أو تجاوز الميزانية أو الاقتراب منها. بين يناير وسبتمبر 2025، منح مجلس المناقصات 1,538 عقدًا حكوميًا عبر الخدمات والإنشاءات والطاقة والطيران وتوريد المواد.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 0.5, pharma: 1.0, retail: 0.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.1,
      government: 1.5, technology: 1.2, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'eProcurement portal registration / Tender Board bid history',
      labelAr: 'تسجيل بوابة المشتريات الإلكترونية/سجل مناقصات مجلس المناقصات',
      hint:    'Upload proof of active registration on Bahrain\'s eProcurement portal and, if available, a recent Tender Board bid submission record.',
      hintAr:  'ارفع إثبات التسجيل النشط في بوابة المشتريات الإلكترونية البحرينية، وسجل تقديم مناقصة حديث لدى مجلس المناقصات إن توفر.',
    },
    frameworks: ['Legislative Decree No. 36/2002', 'Tender Board', 'eProcurement Portal'],
    questions: [
      {
        q: 'How well does your organisation understand and adapt its bidding strategy to the raised internal-purchase thresholds and flexible contracting methods introduced by the 2025-2026 amendments to Decree No. 36/2002?',
        qAr: 'ما مدى جودة فهم مؤسستكم وتكييفها لاستراتيجية تقديم العطاءات مع عتبات الشراء الداخلي المُرفَّعة وأساليب التعاقد المرنة التي أدخلتها تعديلات 2025-2026 على المرسوم بقانون رقم 36/2002؟',
        levels: [
          'The 2025-2026 amendments are unknown to the organisation; bid strategy has not been reviewed against them.',
          'General awareness of the amendments exists, but bid strategy has not been formally updated.',
          'A defined process has reviewed and updated bid strategy in light of the raised thresholds and new contracting methods.',
          'Bid strategy is actively adapted to target opportunities newly accessible or affected by the amendments, including electronic auctions.',
          'Government-procurement strategy is a governed, continuously updated capability that has demonstrably captured additional opportunities created by the 2025-2026 amendments.',
        ],
        levelsAr: [
          'تعديلات 2025-2026 مجهولة لدى المؤسسة؛ ولم تُراجَع استراتيجية تقديم العطاءات مقابلها.',
          'يوجد وعي عام بالتعديلات، لكن لم تُحدَّث استراتيجية العطاءات رسميًا.',
          'عملية محددة راجعت وحدّثت استراتيجية العطاءات في ضوء العتبات المُرفَّعة وأساليب التعاقد الجديدة.',
          'استراتيجية العطاءات تُكيَّف فعليًا لاستهداف الفرص المتاحة حديثًا أو المتأثرة بالتعديلات، بما يشمل المزادات الإلكترونية.',
          'استراتيجية المشتريات الحكومية قدرة محوكَمة ومُحدَّثة باستمرار حققت فعليًا فرصًا إضافية نتجت عن تعديلات 2025-2026.',
        ],
      },
      {
        q: 'How completely does your organisation maintain the prequalification evidence (completed-contract records, financial statements, technical capacity documentation) that Tender Board evaluators assess before shortlisting?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بأدلة التأهيل المسبق (سجلات العقود المنجزة، القوائم المالية، وثائق القدرة الفنية) التي يُقيّمها مقيّمو مجلس المناقصات قبل الترشيح؟',
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
        q: 'How well is your organisation prepared to use the new negotiation provisions (single-bidder, over-budget, or near-budget cases, subject to Cabinet approval) to improve contract outcomes?',
        qAr: 'ما مدى استعداد مؤسستكم لاستخدام أحكام التفاوض الجديدة (حالات مقدم العطاء الوحيد أو تجاوز الميزانية أو الاقتراب منها، رهنًا بموافقة مجلس الوزراء) لتحسين نتائج العقود؟',
        levels: [
          'The negotiation provisions are unknown; the organisation has no strategy to leverage them where applicable.',
          'General awareness of the negotiation provisions exists, but no formal process considers their use in relevant bids.',
          'A defined process evaluates whether the negotiation provisions apply to relevant bid situations and prepares accordingly.',
          'Negotiation-provision strategy is actively integrated into bid planning, with legal/commercial input sought for applicable cases.',
          'Negotiation-provision utilisation is a governed commercial capability with a sustained record of improved contract outcomes where applicable.',
        ],
        levelsAr: [
          'أحكام التفاوض مجهولة؛ ولا توجد لدى المؤسسة استراتيجية للاستفادة منها حيثما تنطبق.',
          'يوجد وعي عام بأحكام التفاوض، لكن لا توجد عملية رسمية تنظر في استخدامها في المناقصات ذات الصلة.',
          'عملية محددة تُقيّم ما إذا كانت أحكام التفاوض تنطبق على حالات المناقصات ذات الصلة وتستعد وفقًا لذلك.',
          'استراتيجية أحكام التفاوض مُدمَجة فعليًا في تخطيط المناقصات، مع طلب مدخلات قانونية/تجارية للحالات المنطبقة.',
          'استخدام أحكام التفاوض قدرة تجارية محوكَمة بسجل مستدام من تحسين نتائج العقود حيثما تنطبق.',
        ],
      },
      {
        q: 'How clearly does your organisation understand and maintain registration on Bahrain\'s eProcurement platform?',
        qAr: 'ما مدى وضوح فهم مؤسستكم واحتفاظها بالتسجيل على منصة المشتريات الإلكترونية البحرينية؟',
        levels: [
          'Registration status on the eProcurement platform is unclear; bids have been missed or rejected due to missing or lapsed registration.',
          'Registration exists but is not systematically tracked or kept current.',
          'A defined process tracks active registration status on the eProcurement platform.',
          'Registration is proactively maintained and updated ahead of anticipated bidding activity.',
          'eProcurement registration management is a governed capability with zero missed opportunities due to registration issues over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل على منصة المشتريات الإلكترونية غير واضحة؛ وفُقدت أو رُفضت مناقصات بسبب تسجيل مفقود أو منتهٍ.',
          'التسجيل موجود لكن لا يُتابَع منهجيًا أو يُحافَظ عليه محدَّثًا.',
          'عملية محددة تتابع حالة التسجيل النشط على منصة المشتريات الإلكترونية.',
          'التسجيل يُحافَظ عليه ويُحدَّث استباقيًا قبل نشاط المناقصات المتوقع.',
          'إدارة تسجيل المشتريات الإلكترونية قدرة محوكَمة دون أي فرص مفقودة بسبب مشكلات تسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor further Tender Board rule changes and circulars that could affect bidding eligibility or contract terms?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لمزيد من تغييرات قواعد وتعاميم مجلس المناقصات التي قد تؤثر على أهلية المناقصة أو شروط العقد؟',
        levels: [
          'Procurement rule changes are learned about only when a bid is affected or rejected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Tender Board updates and circulars.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Procurement regulatory horizon-scanning is a governed function integrated into business development strategy, with legal advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات قواعد المشتريات فقط عندما تتأثر مناقصة أو تُرفَض.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات وتعاميم مجلس المناقصات دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات قواعد المشتريات وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين قانونيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14B.6  Halal Certification & Compliance ──────────────────────── */
  {
    id: 'bahrain-reg-halal',
    title: 'Halal Certification & Compliance',
    titleAr: 'شهادة الحلال والامتثال',
    hint: 'Source: Cabinet Decision No. (61) of 2024 concerning Halal Products, establishing Bahrain\'s National Halal System, which came into effect on 13 December 2025. The Animal Health Directorate (AHD), Ministry of Municipalities Affairs and Agriculture, now requires all imports of poultry, livestock meat, and related products to be accompanied by Halal certificates issued by Halal certification bodies (HCBs) accredited by the GCC Accreditation Center (GAC), headquartered in Saudi Arabia. HCBs beginning the registration process may be granted a grace period even if not yet GAC-accredited. The Bahrain Halal Certification Center (BHCC) is a key national certifying body.',
    hintAr: 'المصدر: قرار مجلس الوزراء رقم 61 لسنة 2024 بشأن المنتجات الحلال، الذي أسّس النظام الوطني للحلال في البحرين، والذي دخل حيّز التنفيذ في 13 ديسمبر 2025. تشترط مديرية الصحة الحيوانية التابعة لوزارة شؤون البلديات والزراعة الآن أن تكون جميع واردات الدواجن ولحوم المواشي والمنتجات ذات الصلة مصحوبة بشهادات حلال صادرة عن جهات إصدار شهادات حلال معتمدة من مركز الاعتماد الخليجي، الذي يقع مقره في المملكة العربية السعودية. قد تُمنَح جهات إصدار الشهادات التي تبدأ عملية التسجيل مهلة سماح حتى قبل حصولها على اعتماد المركز. يُعَدّ مركز شهادة الحلال البحريني إحدى الجهات الوطنية الرئيسية لإصدار الشهادات.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.2, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 0.4, oil_gas: 0.4,
      government: 0.4, technology: 0.4, banking: 0.3, other: 0.5,
    },
    evidence: {
      label:   'GAC-accredited HCB halal certificate (post-13 Dec 2025 format)',
      labelAr: 'شهادة حلال من جهة إصدار معتمدة من مركز الاعتماد الخليجي (بالصيغة النافذة بعد 13 ديسمبر 2025)',
      hint:    'Upload your current halal certificate(s) issued by a GAC-accredited Halal certification body, reflecting the National Halal System requirements effective 13 December 2025.',
      hintAr:  'ارفع شهادة (شهادات) الحلال الحالية الصادرة عن جهة معتمدة من مركز الاعتماد الخليجي، بما يعكس متطلبات النظام الوطني للحلال النافذة اعتبارًا من 13 ديسمبر 2025.',
    },
    frameworks: ['Cabinet Decision No. 61/2024', 'GCC Accreditation Center (GAC)', 'Animal Health Directorate'],
    questions: [
      {
        q: 'How completely has your organisation transitioned its halal-certified imports (poultry, livestock meat, related products) to certificates issued by GAC-accredited HCBs, mandatory since 13 December 2025?',
        qAr: 'ما مدى اكتمال انتقال مؤسستكم لوارداتها المُعتمَدة حلال (الدواجن، لحوم المواشي، المنتجات ذات الصلة) إلى شهادات صادرة عن جهات إصدار معتمدة من مركز الاعتماد الخليجي، الإلزامية منذ 13 ديسمبر 2025؟',
        levels: [
          'The GAC-accreditation requirement is unknown; the organisation may be using certificates from non-accredited bodies.',
          'The requirement is known but the organisation\'s current certifying bodies have not been verified for GAC accreditation status.',
          'A defined process has verified GAC-accreditation status of all halal certifying bodies used, with any gaps identified.',
          'Sourcing relationships are actively managed to ensure exclusive use of GAC-accredited HCBs, including tracking any grace-period arrangements.',
          'GAC-accredited HCB sourcing is a governed capability with a sustained record of zero import rejections due to certification-body accreditation issues.',
        ],
        levelsAr: [
          'متطلب اعتماد مركز الاعتماد الخليجي مجهول؛ وقد تستخدم المؤسسة شهادات من جهات غير معتمدة.',
          'المتطلب معروف لكن لم يُتحقَّق من حالة اعتماد جهات إصدار الشهادات الحالية لدى المؤسسة.',
          'عملية محددة تحققت من حالة اعتماد جميع جهات إصدار شهادات الحلال المُستخدَمة، مع تحديد أي فجوات.',
          'علاقات التوريد تُدار فعليًا لضمان الاستخدام الحصري لجهات معتمدة من مركز الاعتماد الخليجي، بما يشمل تتبّع أي ترتيبات مهلة سماح.',
          'التوريد من جهات معتمدة من مركز الاعتماد الخليجي قدرة محوكَمة بسجل مستدام من عدم وجود رفض استيراد بسبب مشكلات اعتماد جهة الإصدار.',
        ],
      },
      {
        q: 'How well does your organisation understand and comply with the broader National Halal System established under Cabinet Decision No. 61/2024, beyond just certificate sourcing?',
        qAr: 'ما مدى جودة فهم مؤسستكم وامتثالها للنظام الوطني الأوسع للحلال المُؤسَّس بموجب قرار مجلس الوزراء رقم 61/2024، بما يتجاوز مجرد توريد الشهادات؟',
        levels: [
          'Cabinet Decision No. 61/2024 requirements beyond certification are not understood or tracked.',
          'General awareness of the broader National Halal System exists, but compliance beyond certificate sourcing has not been formally assessed.',
          'A defined process has reviewed and addressed the full scope of National Halal System requirements relevant to the organisation.',
          'National Halal System compliance is actively monitored, with internal controls updated as implementing guidance evolves.',
          'National Halal System compliance is a governed, comprehensive capability with a sustained record of zero findings across all applicable requirements.',
        ],
        levelsAr: [
          'متطلبات قرار مجلس الوزراء رقم 61/2024 بما يتجاوز الشهادات غير مفهومة أو متابَعة.',
          'يوجد وعي عام بالنظام الوطني الأوسع للحلال، لكن لم يُقيَّم الامتثال بما يتجاوز توريد الشهادات رسميًا.',
          'عملية محددة راجعت وعالجت النطاق الكامل لمتطلبات النظام الوطني للحلال ذات الصلة بالمؤسسة.',
          'الامتثال للنظام الوطني للحلال يُراقَب فعليًا، مع تحديث الضوابط الداخلية مع تطور الإرشادات التنفيذية.',
          'الامتثال للنظام الوطني للحلال قدرة محوكَمة وشاملة بسجل مستدام من عدم وجود نتائج عبر جميع المتطلبات المنطبقة.',
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
        q: 'How proactively did your organisation manage the transition risk around the 13 December 2025 effective date, including any use of registration grace periods for non-yet-accredited certifying bodies?',
        qAr: 'ما مدى استباقية إدارة مؤسستكم لمخاطر الانتقال المرتبطة بتاريخ النفاذ في 13 ديسمبر 2025، بما يشمل أي استخدام لمهل التسجيل السماحية لجهات إصدار شهادات لم تحصل بعد على الاعتماد؟',
        levels: [
          'No transition planning occurred around the 13 December 2025 effective date; supply continuity risk was not assessed.',
          'Some awareness of the effective date existed, but transition planning was reactive rather than proactive.',
          'A defined transition plan was executed ahead of the effective date, including supplier engagement on accreditation status.',
          'Transition risk was actively managed with contingency sourcing options identified in case of certifying-body accreditation delays.',
          'Transition management for the National Halal System rollout is a governed capability with a sustained record of zero supply disruptions attributable to the change.',
        ],
        levelsAr: [
          'لم يحدث تخطيط انتقالي حول تاريخ النفاذ في 13 ديسمبر 2025؛ ولم يُقيَّم خطر استمرارية التوريد.',
          'وُجد بعض الوعي بتاريخ النفاذ، لكن التخطيط الانتقالي كان تفاعليًا وليس استباقيًا.',
          'خطة انتقالية محددة نُفِّذت قبل تاريخ النفاذ، بما يشمل التواصل مع الموردين بشأن حالة الاعتماد.',
          'خطر الانتقال يُدار فعليًا مع تحديد خيارات توريد بديلة في حال تأخر اعتماد جهة الإصدار.',
          'إدارة الانتقال لتطبيق النظام الوطني للحلال قدرة محوكَمة بسجل مستدام من عدم وجود اضطرابات توريد تُعزى للتغيير.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor further National Halal System guidance, GAC accreditation-list updates, and Animal Health Directorate requirements?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لمزيد من إرشادات النظام الوطني للحلال وتحديثات قائمة اعتماد مركز الاعتماد الخليجي ومتطلبات مديرية الصحة الحيوانية؟',
        levels: [
          'Guidance and accreditation-list updates are learned about only when a shipment is affected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Animal Health Directorate and GAC updates relevant to the organisation\'s halal-certified imports.',
          'Guidance-change monitoring is proactive and systematic, with supply-continuity impact assessed before changes take effect.',
          'Halal regulatory horizon-scanning is a governed function integrated into sourcing strategy, with advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتحديثات الإرشادات وقائمة الاعتماد فقط عندما تتأثر شحنة.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات مديرية الصحة الحيوانية ومركز الاعتماد الخليجي ذات الصلة بواردات المؤسسة المُعتمَدة حلال دوريًا.',
          'مراقبة تغيّر الإرشادات استباقية ومنهجية، مع تقييم الأثر على استمرارية التوريد قبل سريان التغييرات.',
          'استشراف تغيرات تنظيم الحلال وظيفة محوكَمة مُدمَجة في استراتيجية التوريد، مع الاستعانة بمستشارين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14B.7  Personal Data Protection Law (PDPL) ───────────────────── */
  {
    id: 'bahrain-reg-pdpl',
    title: 'Personal Data Protection Law (PDPL)',
    titleAr: 'قانون حماية البيانات الشخصية',
    hint: 'Source: Law No. (30) of 2018 with Respect to Personal Data Protection, in force since 1 August 2019, overseen by the Personal Data Protection Authority (PDPA) under the Ministry of Justice, Islamic Affairs and Waqf. The PDPA has enforcement powers including investigations, audits, and penalty imposition. On 17 March 2022, the PDPA issued 10 ministerial resolutions supplementing the PDPL. In late 2025, members of the Shura Council proposed a Cybercrime Law amendment addressing data privacy in digital communications; as of May 2026 it had been approved by the Shura Council\'s Legislative and Legal Affairs Committee and referred for further review, but had not yet been enacted.',
    hintAr: 'المصدر: القانون رقم 30 لسنة 2018 بشأن حماية البيانات الشخصية، النافذ منذ 1 أغسطس 2019، وتشرف عليه هيئة حماية البيانات الشخصية التابعة لوزارة العدل والشؤون الإسلامية والأوقاف. تتمتع الهيئة بصلاحيات إنفاذ تشمل التحقيقات والتدقيقات وفرض الغرامات. في 17 مارس 2022، أصدرت الهيئة 10 قرارات وزارية مكمّلة للقانون. في أواخر 2025، اقترح أعضاء مجلس الشورى تعديلًا على قانون الجرائم الإلكترونية يتناول خصوصية البيانات في الاتصالات الرقمية؛ وحتى مايو 2026 وافقت عليه لجنة الشؤون التشريعية والقانونية بمجلس الشورى وأُحيل لمزيد من المراجعة، لكنه لم يُصدَر بعد.',
    benchmarks: { gcc: 2.4, topQuartile: 4.2 },
    industryWeights: {
      manufacturing: 0.9, fmcg: 1.0, pharma: 1.3, retail: 1.3,
      logistics: 1.0, marine: 0.4, construction: 0.5, oil_gas: 0.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'PDPL compliance policy / PDPA registration or audit record',
      labelAr: 'سياسة الامتثال لقانون حماية البيانات الشخصية/سجل تسجيل أو تدقيق هيئة حماية البيانات',
      hint:    'Upload your organisation\'s PDPL compliance policy and any relevant PDPA registration or audit record.',
      hintAr:  'ارفع سياسة الامتثال لقانون حماية البيانات الشخصية وأي سجل تسجيل أو تدقيق ذي صلة من هيئة حماية البيانات الشخصية.',
    },
    frameworks: ['Law No. 30/2018 (PDPL)', 'PDPA Ministerial Resolutions (2022)', 'PDPA'],
    questions: [
      {
        q: 'How completely has your organisation implemented the data-protection controls required under Law No. 30/2018 and the 10 supplementing ministerial resolutions issued by the PDPA in March 2022?',
        qAr: 'ما مدى اكتمال تنفيذ مؤسستكم لضوابط حماية البيانات المطلوبة بموجب القانون رقم 30/2018 والقرارات الوزارية العشرة المكمّلة الصادرة عن الهيئة في مارس 2022؟',
        levels: [
          'PDPL controls are not implemented; the organisation has not reviewed the law or its supplementing resolutions.',
          'Some general data-protection practices exist, but they are not mapped to specific PDPL or resolution requirements.',
          'A defined compliance programme maps organisational practices to PDPL and ministerial-resolution requirements.',
          'PDPL compliance is actively monitored and updated as PDPA guidance evolves, with internal audits conducted periodically.',
          'PDPL compliance is a governed, board-visible programme with a sustained record of clean PDPA audit outcomes.',
        ],
        levelsAr: [
          'ضوابط القانون غير مُنفَّذة؛ ولم تراجع المؤسسة القانون أو قراراته المكمّلة.',
          'توجد بعض ممارسات حماية البيانات العامة، لكنها غير مُطابَقة مع متطلبات القانون أو القرارات المحددة.',
          'برنامج امتثال محدد يُطابِق ممارسات المؤسسة مع متطلبات القانون والقرارات الوزارية.',
          'الامتثال للقانون يُراقَب ويُحدَّث فعليًا مع تطور إرشادات الهيئة، مع إجراء تدقيقات داخلية دوريًا.',
          'الامتثال للقانون برنامج محوكَم ومرئي لمجلس الإدارة بسجل مستدام من نتائج تدقيق نظيفة من الهيئة.',
        ],
      },
      {
        q: 'Has your organisation appointed a data-protection function with clear accountability for PDPL compliance, and is it prepared to respond to PDPA investigations, audits, or penalty proceedings?',
        qAr: 'هل عيّنت مؤسستكم وظيفة لحماية البيانات لديها مساءلة واضحة عن الامتثال للقانون، وهل هي مستعدة للاستجابة لتحقيقات هيئة حماية البيانات أو تدقيقاتها أو إجراءات فرض الغرامات؟',
        levels: [
          'No function is accountable for PDPL compliance; the organisation has no prepared response protocol for PDPA action.',
          'A function is informally responsible for data privacy, but authority and response protocols are undocumented.',
          'A designated data-protection function has documented authority and a defined response protocol for PDPA inquiries.',
          'The data-protection function actively drives compliance activities across the organisation, with response readiness tested periodically.',
          'Data-privacy governance is a mature, board-visible function with a sustained record of well-managed PDPA interactions and zero adverse enforcement outcomes.',
        ],
        levelsAr: [
          'لا توجد وظيفة مسؤولة عن الامتثال للقانون؛ ولا يوجد لدى المؤسسة بروتوكول استجابة مُعَد لإجراءات الهيئة.',
          'وظيفة ما مسؤولة بشكل غير رسمي عن خصوصية البيانات، لكن السلطة وبروتوكولات الاستجابة غير موثّقة.',
          'وظيفة حماية بيانات محددة لديها سلطة موثّقة وبروتوكول استجابة محدد لاستفسارات الهيئة.',
          'وظيفة حماية البيانات تقود فعليًا أنشطة الامتثال عبر المؤسسة، مع اختبار جاهزية الاستجابة دوريًا.',
          'حوكمة خصوصية البيانات وظيفة ناضجة ومرئية لمجلس الإدارة بسجل مستدام من تعاملات مُدارة جيدًا مع الهيئة ودون نتائج إنفاذ سلبية.',
        ],
      },
      {
        q: 'How completely has your organisation implemented lawful-processing and consent-management processes for personal data collected through supply chain operations (suppliers, employees, customers)?',
        qAr: 'ما مدى اكتمال تنفيذ مؤسستكم لعمليات المعالجة القانونية وإدارة الموافقة للبيانات الشخصية المجمّعة عبر عمليات سلسلة الإمداد (الموردين، الموظفين، العملاء)؟',
        levels: [
          'No consent or lawful-processing framework exists; personal data is collected and processed without documented lawful basis.',
          'Consent is obtained inconsistently, without a standard process or documented lawful-basis record.',
          'A documented consent and lawful-processing framework covers the main personal-data collection points in supply chain operations.',
          'Consent and lawful-basis documentation is actively maintained and updated whenever a new data-collection activity is introduced.',
          'Consent management is fully systematised and continuously current, integrated into system change-management processes with zero undocumented processing activities.',
        ],
        levelsAr: [
          'لا يوجد إطار للموافقة أو المعالجة القانونية؛ وتُجمَّع البيانات الشخصية وتُعالَج دون أساس قانوني موثّق.',
          'تُستحصَل الموافقة بشكل غير متسق، دون عملية موحدة أو سجل أساس قانوني موثّق.',
          'إطار موثّق للموافقة والمعالجة القانونية يغطي نقاط جمع البيانات الشخصية الرئيسية في عمليات سلسلة الإمداد.',
          'توثيق الموافقة والأساس القانوني يُحافَظ عليه ويُحدَّث فعليًا كلما استُحدِث نشاط جمع بيانات جديد.',
          'إدارة الموافقات مُمنهَجة بالكامل ومُحدَّثة باستمرار، ومُدمَجة في عمليات إدارة التغيير للأنظمة دون أي أنشطة معالجة غير موثّقة.',
        ],
      },
      {
        q: 'How closely does your organisation track the proposed Cybercrime Law amendment addressing digital-communications data privacy, and how prepared is it to adapt if the amendment is enacted?',
        qAr: 'ما مدى دقة تتبّع مؤسستكم للتعديل المقترح على قانون الجرائم الإلكترونية المتعلق بخصوصية بيانات الاتصالات الرقمية، وما مدى استعدادها للتكيف إذا صدر التعديل؟',
        levels: [
          'The proposed amendment is unknown to the organisation; no monitoring or contingency planning exists.',
          'General awareness of the proposed amendment exists, but no formal tracking or contingency plan is in place.',
          'A defined process tracks the amendment\'s legislative progress and has assessed likely compliance impact if enacted.',
          'Contingency planning for the amendment is actively maintained, with draft internal controls prepared ahead of potential enactment.',
          'Legislative horizon-scanning for the Cybercrime Law amendment is a governed capability, with the organisation positioned to adapt quickly and demonstrably upon enactment.',
        ],
        levelsAr: [
          'التعديل المقترح مجهول لدى المؤسسة؛ ولا يوجد تتبّع أو تخطيط طوارئ.',
          'يوجد وعي عام بالتعديل المقترح، لكن لا يوجد تتبّع رسمي أو خطة طوارئ.',
          'عملية محددة تتابع التقدم التشريعي للتعديل وقيّمت الأثر المحتمل على الامتثال إذا صدر.',
          'التخطيط للطوارئ للتعديل يُحافَظ عليه فعليًا، مع إعداد ضوابط داخلية أولية قبل الإصدار المحتمل.',
          'استشراف التطورات التشريعية لتعديل قانون الجرائم الإلكترونية قدرة محوكَمة، والمؤسسة في وضع يسمح لها بالتكيف بسرعة وبشكل واضح عند الإصدار.',
        ],
      },
      {
        q: 'How well does your organisation contractually bind third-party processors (logistics providers, customs brokers, IT vendors) to PDPL-compliant data-handling terms?',
        qAr: 'ما مدى جودة إلزام مؤسستكم تعاقديًا للمعالجين من الأطراف الثالثة (مزودو الخدمات اللوجستية، الوسطاء الجمركيون، موردو تقنية المعلومات) بشروط تعامل مع البيانات متوافقة مع القانون؟',
        levels: [
          'Third-party contracts contain no data-protection clauses; processor compliance with the PDPL is unknown.',
          'Some contracts reference data protection generically, but terms are not PDPL-specific or consistently applied.',
          'A standard PDPL-compliant data-processing clause is included in contracts with all relevant third-party processors.',
          'Third-party PDPL compliance is actively verified (e.g., through questionnaires or audits) before and during the contract term.',
          'Third-party data-processor governance is a mature, audited programme with a sustained record of zero PDPL-related third-party incidents.',
        ],
        levelsAr: [
          'عقود الأطراف الثالثة لا تحتوي على بنود حماية بيانات؛ وامتثال المعالج للقانون مجهول.',
          'بعض العقود تشير إلى حماية البيانات بشكل عام، لكن الشروط ليست خاصة بالقانون أو مُطبَّقة باستمرار.',
          'بند معالجة بيانات موحد متوافق مع القانون يُدرَج في العقود مع جميع المعالجين من الأطراف الثالثة ذوي الصلة.',
          'امتثال الأطراف الثالثة للقانون يُتحقَّق منه فعليًا (عبر استبيانات أو تدقيقات) قبل وأثناء مدة العقد.',
          'حوكمة معالجي البيانات من الأطراف الثالثة برنامج ناضج ومُدقَّق بسجل مستدام من صفر حوادث متعلقة بالقانون لدى أطراف ثالثة.',
        ],
      },
    ],
  },

];
