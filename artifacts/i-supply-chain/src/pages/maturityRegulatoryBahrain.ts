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
    hintAr: 'المصدر: هيئة تنظيم سوق العمل. اعتبارًا من فبراير 2026، يجب على جميع أصحاب العمل في القطاع الخاص معالجة رواتب الموظفين عبر نظام حماية الأجور المُحسّن من خلال نظام إدارة العمالة الوافدة التابع للهيئة. جميع القطاعات مُلزمة بحصص تبحرين تُراقب إلكترونيًا، وتصل في بعض القطاعات إلى 50%؛ ويجب أن يكون صاحب العمل ملتزمًا بالحصة قبل الحصول على تصاريح عمل جديدة للوافدين. يُفرض على أصحاب العمل غير الملتزمين رسم 500 دينار بحريني عن كل تصريح عمل أجنبي، ويُحظر عليهم المشاركة في المناقصات الحكومية. ارتفعت رسوم تصاريح العمل للعمالة الوافدة بنسبة 5% اعتبارًا من يناير 2026، وستتصاعد تدريجيًا إلى 25% بحلول 2029. تستهدف الخطة الوطنية توظيف 20,000 بحريني وتدريب 10,000 باحث عن عمل سنويًا حتى 2026.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.4, fmcg: 1.1, pharma: 1.0, retail: 1.3,
      logistics: 1.3, marine: 1.2, construction: 1.4, oil_gas: 1.0,
      government: 1.5, technology: 1.1, banking: 1.4, other: 1.0,
    },
    evidence: {
      label:   'LMRA Bahrainisation compliance report / Enhanced WPS submission record',
      labelAr: 'تقرير الامتثال للتبحرين لدى هيئة تنظيم سوق العمل/سجل تقديم نظام حماية الأجور المُحسّن',
      hint:    'Upload your organisation\'s most recent LMRA Bahrainisation compliance report and proof of active Enhanced WPS submissions via the EMS.',
      hintAr:  'ارفع أحدث تقرير امتثال للتبحرين لدى هيئة تنظيم سوق العمل وإثبات تقديمات نظام حماية الأجور المُحسّن النشطة عبر نظام إدارة العمالة الوافدة.',
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
          'أداء التبحرين مؤشر تنفيذي ثابت مع خطة توظيف متعددة السنوات مُصمّمة صراحة للحفاظ على الامتثال للحصة وأهلية المناقصات.',
        ],
      },
      {
        q: 'How completely has your organisation transitioned to the Enhanced Wage Protection System (WPS) via LMRA\'s Expatriate Management System (EMS), mandatory for all private-sector employers as of February 2026?',
        qAr: 'ما مدى اكتمال انتقال مؤسستكم إلى نظام حماية الأجور المُحسّن عبر نظام إدارة العمالة الوافدة التابع لهيئة تنظيم سوق العمل، الإلزامي لجميع أصحاب العمل في القطاع الخاص اعتبارًا من فبراير 2026؟',
        levels: [
          'Enhanced WPS transition has not begun; salary payments are not processed through the EMS.',
          'Transition is in progress but incomplete, with some payroll cycles still outside the Enhanced WPS.',
          'All salary payments are processed through the Enhanced WPS via EMS, verified against LMRA requirements at least quarterly.',
          'Enhanced WPS compliance is actively monitored with automated reconciliation between payroll systems and EMS submissions.',
          'Enhanced WPS compliance is a governed payroll capability with a sustained record of zero submission discrepancies or delayed payments since the February 2026 mandate.',
        ],
        levelsAr: [
          'لم يبدأ الانتقال إلى نظام حماية الأجور المُحسّن؛ ولا تُعالج الرواتب عبر نظام إدارة العمالة الوافدة.',
          'الانتقال جارٍ لكنه غير مكتمل، مع بقاء بعض دورات الرواتب خارج النظام المُحسّن.',
          'جميع مدفوعات الرواتب تُعالج عبر نظام حماية الأجور المُحسّن من خلال نظام إدارة العمالة الوافدة، ويُتحقّق منها مقابل متطلبات الهيئة فصليًا على الأقل.',
          'الامتثال لنظام حماية الأجور المُحسّن يُراقَب فعليًا مع مطابقة آلية بين أنظمة الرواتب وتقديمات نظام إدارة العمالة الوافدة.',
          'الامتثال لنظام حماية الأجور المُحسّن قدرة محوكَمة للرواتب بسجل مستدام من عدم وجود تباينات في التقديم أو تأخير في المدفوعات منذ إلزامية فبراير 2026.',
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
          'أثر تصاعد الرسوم يُنمذج استباقيًا في الميزانيات متعددة السنوات، مع اتخاذ قرارات التوريد (توظيف بحريني مقابل وافد) بناءً على المسار.',
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
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات حصص هيئة تنظيم سوق العمل وجداول الرسوم ومتطلبات نظام حماية الأجور المُحسّن/نظام إدارة العمالة الوافدة التي قد تؤثر على تخطيط القوى العاملة؟',
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

];
