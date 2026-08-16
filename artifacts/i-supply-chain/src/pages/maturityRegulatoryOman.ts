/**
 * maturityRegulatoryOman.ts
 *
 * Sub-segment content for the Oman Regulatory & Localisation Compliance module
 * (industry module id: 'regulatory-oman', countryFor: ['oman']).
 *
 * Status: AUTHORED, PENDING INDEPENDENT LEGAL/EXPERT REVIEW.
 * This content was drafted from public regulator sources (Ministry of
 * Labour, Authority for Projects, Tenders and Local Content / National
 * Local Content Policy, Directorate General of Customs / Royal Oman Police,
 * Directorate General for Specifications and Measurements (DGSM), Ministry
 * of Agriculture, Fisheries and Water Resources, Ministry of Endowments and
 * Religious Affairs, Ministry of Transport, Communications and Information
 * Technology (MTCIT) / Royal Decree 6/2022 Personal Data Protection Law) as
 * of August 2026. It has NOT yet been signed off by a named human
 * legal/compliance reviewer, per the platform's content-trust model (see
 * /api/regulatory/countries — status stays 'pending_review' until a reviewer
 * signs off with a date). Do not mark 'verified' without that step. Sources
 * cited inline per sub-segment for traceability.
 *
 * Mirrors the structure of UAE_REGULATORY_SUB_SEGMENTS, QATAR_REGULATORY_
 * SUB_SEGMENTS, and JORDAN_REGULATORY_SUB_SEGMENTS: 5 questions per
 * sub-segment (25 vs Saudi's 70) for a first authored pass — depth can be
 * extended per sub-segment later without breaking the answer-key format.
 *
 * All Arabic is independently authored formal Gulf professional register
 * (فصحى), not machine-translated.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   OMAN REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
═══════════════════════════════════════════════════════════════════════════ */

export const OMAN_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14O.1  Omanisation & Workforce Nationalization ───────────────── */
  {
    id: 'oman-reg-omanisation',
    title: 'Omanisation & Workforce Nationalization',
    titleAr: 'التعمين وتوطين القوى العاملة',
    hint: 'Source: Labour Law (Sultani Decree No. 53 of 2023) and Ministry of Labour sector-specific Omanisation quotas. Ministerial Decision 602/2025 (effective October 2025) ties labour-authorisation and work-permit fees directly to compliance: a 30% fee reduction for compliant employers, doubled fees for non-compliant ones. Wholly foreign-owned companies must employ at least one Omani national within one year of starting commercial activities (30-day grace period beyond the 1 April 2025 deadline for existing cases). A growing list of occupations (HR roles, PRO/government-liaison roles, reception, security, commercial driving, customs clearance, insurance sales) is reserved exclusively for Omanis. Free zones (Duqm 25%, Salalah 20%) apply relaxed Omanisation rates.',
    hintAr: 'المصدر: قانون العمل (المرسوم السلطاني رقم 53 لسنة 2023) وحصص التعمين القطاعية الصادرة عن وزارة العمل. يربط القرار الوزاري 602/2025 (النافذ من أكتوبر 2025) رسوم تصاريح العمل والتراخيص مباشرة بالامتثال: تخفيض 30% للرسوم لأصحاب العمل الملتزمين، ومضاعفة الرسوم لغير الملتزمين. يجب على الشركات المملوكة بالكامل لمستثمرين أجانب توظيف عماني واحد على الأقل خلال سنة من بدء النشاط التجاري (مهلة سماح 30 يومًا بعد موعد 1 أبريل 2025 للحالات القائمة). قائمة متنامية من المهن (الموارد البشرية، العلاقات العامة/الاتصال الحكومي، الاستقبال، الأمن، القيادة التجارية، التخليص الجمركي، مبيعات التأمين) محجوزة حصريًا للعمانيين. تُطبّق المناطق الحرة (الدقم 25%، صلالة 20%) معدلات تعمين مخفّفة.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.4, fmcg: 1.1, pharma: 1.0, retail: 1.2,
      logistics: 1.3, marine: 1.2, construction: 1.5, oil_gas: 1.0,
      government: 1.5, technology: 1.1, banking: 1.4, other: 1.0,
    },
    evidence: {
      label:   'Ministry of Labour Omanisation compliance report / annual localization strategy',
      labelAr: 'تقرير الامتثال للتعمين/استراتيجية التوطين السنوية لدى وزارة العمل',
      hint:    'Upload your organisation\'s most recent annual workforce-localization strategy submitted to the Ministry of Labour and current Omanisation percentage report.',
      hintAr:  'ارفع أحدث استراتيجية توطين سنوية للقوى العاملة قدّمتموها لوزارة العمل وتقرير نسبة التعمين الحالية.',
    },
    frameworks: ['Sultani Decree No. 53/2023', 'Ministerial Decision 602/2025', 'Ministry of Labour'],
    questions: [
      {
        q: 'How accurately does your organisation track its Omanisation percentage against the sector- and job-category-specific quota set by the Ministry of Labour, including the fee incentive/penalty implications of Ministerial Decision 602/2025?',
        qAr: 'ما مدى دقة تتبّع مؤسستكم لنسبة التعمين مقابل الحصة الخاصة بالقطاع وفئة الوظيفة المحددة من وزارة العمل، بما يشمل تبعات الحوافز/الغرامات على الرسوم بموجب القرار الوزاري 602/2025؟',
        levels: [
          'Omanisation percentage is not tracked at the organisation level; fee implications under MD 602/2025 are unknown.',
          'An overall Omanisation percentage is known but not broken down by sector or job-category quota, and fee impact is not modelled.',
          'A defined process calculates and reviews Omanisation percentage against sector-specific quotas at least annually, with fee impact estimated.',
          'Omanisation tracking is embedded in workforce planning with job-category-level targets reviewed quarterly and fee incentives actively pursued.',
          'Omanisation performance is a standing executive KPI with a multi-year hiring plan explicitly optimised to sustain the 30% fee-reduction tier.',
        ],
        levelsAr: [
          'نسبة التعمين لا تُتابَع على مستوى المؤسسة؛ وتبعات الرسوم بموجب القرار 602/2025 مجهولة.',
          'نسبة تعمين إجمالية معروفة لكن دون تصنيف حسب حصة القطاع أو فئة الوظيفة، ودون نمذجة أثر الرسوم.',
          'عملية محددة تحسب وتراجع نسبة التعمين مقابل الحصص القطاعية سنويًا على الأقل، مع تقدير أثر الرسوم.',
          'تتبّع التعمين مُدمَج في تخطيط القوى العاملة مع أهداف على مستوى فئة الوظيفة تُراجَع فصليًا وسعي فعلي لتحقيق حوافز الرسوم.',
          'أداء التعمين مؤشر تنفيذي ثابت مع خطة توظيف متعددة السنوات مُحسَّنة صراحة للحفاظ على شريحة تخفيض الرسوم بنسبة 30%.',
        ],
      },
      {
        q: 'How well does your organisation ensure roles on the Ministry of Labour\'s reserved-occupations list (HR, PRO/government liaison, reception, security, commercial driving, customs clearance, insurance sales) are staffed exclusively by Omani nationals?',
        qAr: 'ما مدى جودة ضمان مؤسستكم أن الأدوار المدرجة في قائمة المهن المحجوزة لدى وزارة العمل (الموارد البشرية، العلاقات العامة/الاتصال الحكومي، الاستقبال، الأمن، القيادة التجارية، التخليص الجمركي، مبيعات التأمين) مشغولة حصريًا بمواطنين عمانيين؟',
        levels: [
          'Reserved-occupation compliance is not tracked; non-Omani staff may occupy restricted roles without detection.',
          'General awareness exists, but no systematic audit confirms reserved roles are Omani-staffed.',
          'A defined process audits reserved-occupation roles against the current Ministry list at least annually.',
          'Reserved-occupation compliance is actively monitored with automated alerts whenever the Ministry updates the restricted-role list.',
          'Reserved-occupation staffing is a governed HR capability with a sustained record of zero non-compliance findings across all restricted roles.',
        ],
        levelsAr: [
          'الامتثال للمهن المحجوزة لا يُتابَع؛ وقد يشغل موظفون غير عمانيين أدوارًا مقيّدة دون اكتشاف.',
          'يوجد وعي عام، لكن لا تدقيق منهجي يؤكد أن الأدوار المحجوزة مشغولة بعمانيين.',
          'عملية محددة تدقق الأدوار المحجوزة مقابل قائمة الوزارة الحالية سنويًا على الأقل.',
          'الامتثال للمهن المحجوزة يُراقَب فعليًا مع تنبيهات آلية كلما حدّثت الوزارة قائمة الأدوار المقيّدة.',
          'توظيف المهن المحجوزة قدرة محوكَمة للموارد البشرية بسجل مستدام من عدم وجود مخالفات عبر جميع الأدوار المقيّدة.',
        ],
      },
      {
        q: 'For wholly foreign-owned entities, how proactively does your organisation manage the requirement to employ at least one Omani national within one year of starting commercial activities?',
        qAr: 'بالنسبة للكيانات المملوكة بالكامل لمستثمرين أجانب، ما مدى استباقية إدارة مؤسستكم لمتطلب توظيف عماني واحد على الأقل خلال سنة من بدء النشاط التجاري؟',
        levels: [
          'The one-Omani-within-one-year requirement is not tracked; compliance status for wholly foreign-owned entities is unknown.',
          'The requirement is known but hiring is only initiated reactively as the deadline approaches.',
          'A defined process tracks the one-year clock from commercial-activity start and initiates hiring with adequate lead time.',
          'Compliance is proactively managed with a documented contingency plan for the 30-day grace period if a deadline risk emerges.',
          'First-hire compliance for wholly foreign-owned entities is a governed capability with a sustained record of on-time compliance across all applicable entities.',
        ],
        levelsAr: [
          'متطلب توظيف عماني واحد خلال سنة لا يُتابَع؛ وحالة الامتثال للكيانات المملوكة بالكامل لأجانب مجهولة.',
          'المتطلب معروف لكن التوظيف يُبدَأ فقط بشكل تفاعلي مع اقتراب الموعد النهائي.',
          'عملية محددة تتابع مهلة السنة من بدء النشاط التجاري وتبدأ التوظيف بوقت كافٍ.',
          'الامتثال يُدار استباقيًا مع خطة طوارئ موثّقة لمهلة السماح 30 يومًا في حال ظهور خطر تفويت الموعد.',
          'الامتثال لأول توظيف للكيانات المملوكة بالكامل لأجانب قدرة محوكَمة بسجل مستدام من الامتثال في الوقت المحدد عبر جميع الكيانات المعنية.',
        ],
      },
      {
        q: 'How well does your organisation apply the relaxed Omanisation rates available in free zones (e.g., Duqm 25%, Salalah 20%) where it operates, without over- or under-applying mainland requirements?',
        qAr: 'ما مدى جودة تطبيق مؤسستكم لمعدلات التعمين المخفّفة المتاحة في المناطق الحرة (مثل الدقم 25%، صلالة 20%) حيثما تعمل، دون تطبيق مفرط أو ناقص لمتطلبات البر الرئيسي؟',
        levels: [
          'Free-zone Omanisation rate distinctions are not understood; mainland rates are applied incorrectly or missed in free-zone operations.',
          'General awareness of relaxed free-zone rates exists, but application is inconsistent across entities.',
          'A defined process correctly applies the applicable free-zone Omanisation rate to each eligible operation.',
          'Free-zone Omanisation compliance is actively managed with dedicated tracking distinguishing free-zone from mainland workforce.',
          'Free-zone Omanisation rate management is a governed capability with a sustained record of zero rate-misapplication findings.',
        ],
        levelsAr: [
          'الفروقات في معدلات التعمين للمناطق الحرة غير مفهومة؛ وتُطبَّق معدلات البر الرئيسي بشكل خاطئ أو تُهمَل في عمليات المناطق الحرة.',
          'يوجد وعي عام بالمعدلات المخفّفة للمناطق الحرة، لكن التطبيق غير متسق عبر الكيانات.',
          'عملية محددة تطبّق معدل التعمين المناسب للمنطقة الحرة على كل عملية مؤهلة.',
          'الامتثال لمعدلات التعمين في المناطق الحرة يُدار فعليًا بتتبّع مخصص يميّز القوى العاملة في المنطقة الحرة عن البر الرئيسي.',
          'إدارة معدلات التعمين في المناطق الحرة قدرة محوكَمة بسجل مستدام من عدم وجود مخالفات في سوء التطبيق.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to Ministry of Labour Omanisation quotas, reserved-occupation lists, and fee policy that could affect workforce planning?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات حصص التعمين وقوائم المهن المحجوزة وسياسة الرسوم لدى وزارة العمل التي قد تؤثر على تخطيط القوى العاملة؟',
        levels: [
          'Policy changes are learned about only when a hiring or compliance issue arises.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Ministry of Labour announcements relevant to workforce planning.',
          'Policy-change monitoring is proactive and systematic, with hiring-plan impact assessed before changes take effect.',
          'Labour-policy horizon-scanning is a governed function integrated into workforce strategy, with legal/HR advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات في السياسة فقط عندما تنشأ مشكلة توظيف أو امتثال.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع إعلانات وزارة العمل ذات الصلة بتخطيط القوى العاملة دوريًا.',
          'مراقبة تغيرات السياسة استباقية ومنهجية، مع تقييم أثرها على خطط التوظيف قبل سريانها.',
          'استشراف سياسات العمل وظيفة محوكَمة مُدمَجة في استراتيجية القوى العاملة، مع الاستعانة بمستشارين قانونيين/موارد بشرية للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14O.2  In-Country Value (ICV) Program ────────────────────────── */
  {
    id: 'oman-reg-icv',
    title: 'In-Country Value (ICV) Program',
    titleAr: 'برنامج القيمة المضافة المحلية',
    hint: 'Source: Oman\'s National Local Content Policy, overseen by the Authority for Projects, Tenders and Local Content (formerly the Secretariat General of the Tender Board, renamed under Royal Decree No. 57/2025). The 2026-2030 five-year plan targets an ICV contribution to GDP exceeding 40%. Four pillars: employment and training of Omani nationals, retention of expenditure within Oman, retention of local service providers and suppliers, and use of Omani goods and services. Sector-specific requirements exist (e.g., ICT projects require a minimum 40% ICV, with 20% mandatory subcontracting to specified categories when contracting with large or international firms).',
    hintAr: 'المصدر: سياسة المحتوى المحلي الوطنية العُمانية، تحت إشراف هيئة المشاريع والمناقصات والمحتوى المحلي (سابقًا الأمانة العامة لمجلس المناقصات، أُعيدت تسميتها بموجب المرسوم السلطاني رقم 57/2025). تستهدف الخطة الخمسية 2026-2030 مساهمة للقيمة المضافة المحلية في الناتج المحلي الإجمالي تتجاوز 40%. أربع ركائز: توظيف وتدريب المواطنين العمانيين، الاحتفاظ بالإنفاق داخل عُمان، الاحتفاظ بمزودي الخدمات والموردين المحليين، واستخدام السلع والخدمات العمانية. توجد متطلبات قطاعية محددة (مثل مشاريع تقنية المعلومات والاتصالات التي تتطلب حدًا أدنى 40% قيمة مضافة محلية، مع تعاقد من الباطن إلزامي بنسبة 20% لفئات محددة عند التعاقد مع شركات كبرى أو دولية).',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.0, retail: 0.5,
      logistics: 1.2, marine: 1.3, construction: 1.4, oil_gas: 1.5,
      government: 1.2, technology: 1.3, banking: 0.5, other: 0.6,
    },
    evidence: {
      label:   'ICV certificate / local content declaration (current cycle)',
      labelAr: 'شهادة القيمة المضافة المحلية/إقرار المحتوى المحلي (الدورة الحالية)',
      hint:    'Upload your current ICV certificate or local-content declaration, showing your score across the four pillars and the certifying body.',
      hintAr:  'ارفع شهادة القيمة المضافة المحلية الحالية أو إقرار المحتوى المحلي، موضحة الدرجة عبر الركائز الأربع والجهة المُصدرة.',
    },
    frameworks: ['National Local Content Policy', 'Authority for Projects, Tenders and Local Content', 'ICV'],
    questions: [
      {
        q: 'How rigorously does your organisation prepare and maintain the operational and financial records the ICV formula requires across all four pillars (employment/training, expenditure retention, local supplier retention, Omani goods/services)?',
        qAr: 'ما مدى صرامة إعداد ومؤسستكم للسجلات التشغيلية والمالية التي تتطلبها معادلة القيمة المضافة المحلية عبر الركائز الأربع (التوظيف/التدريب، الاحتفاظ بالإنفاق، الاحتفاظ بالموردين المحليين، السلع/الخدمات العمانية)؟',
        levels: [
          'Records supporting the ICV pillar categories do not exist in a usable, auditable form.',
          'Records are assembled only when an ICV submission or tender requirement is imminent, causing delays.',
          'Records across all four ICV pillars are maintained on an ongoing basis, aligned to the reporting cycle.',
          'Financial and operational reporting is structured proactively to maximise ICV-relevant categories within existing systems.',
          'ICV-optimised record-keeping is a standing finance/operations objective, consistently supporting a top-quartile ICV score.',
        ],
        levelsAr: [
          'السجلات الداعمة لفئات ركائز القيمة المضافة المحلية غير موجودة بشكل قابل للاستخدام والتدقيق.',
          'تُجمَّع السجلات فقط عند اقتراب موعد تقديم القيمة المضافة أو متطلب مناقصة، مما يسبب تأخيرًا.',
          'السجلات عبر جميع الركائز الأربع تُحافَظ عليها باستمرار، متماشية مع دورة التقارير.',
          'التقارير المالية والتشغيلية تُبنى استباقيًا لتعظيم الفئات ذات الصلة بالقيمة المضافة المحلية ضمن الأنظمة القائمة.',
          'إدارة السجلات المُحسَّنة للقيمة المضافة المحلية هدف ثابت للمالية/العمليات، تدعم باستمرار درجة في الربع الأعلى.',
        ],
      },
      {
        q: 'How actively does your organisation manage local procurement spend and supplier development to maximise its contribution to the ICV score?',
        qAr: 'ما مدى فعالية إدارة مؤسستكم للإنفاق على الشراء المحلي وتطوير الموردين لتعظيم مساهمته في درجة القيمة المضافة المحلية؟',
        levels: [
          'Local procurement spend is not tracked separately from total procurement spend; ICV impact is unknown.',
          'Local vs. imported procurement spend is tracked, but not actively managed toward the ICV score.',
          'A defined process reviews the local-content share of procurement spend against ICV targets at least annually.',
          'Sourcing decisions actively favour ICV-eligible local suppliers where cost-competitive, with the impact on ICV score modelled before major awards.',
          'Local-content optimisation is embedded in category strategy; the organisation actively develops Oman-based suppliers to expand its ICV-eligible base.',
        ],
        levelsAr: [
          'الإنفاق على الشراء المحلي لا يُتابَع بمعزل عن إجمالي الإنفاق؛ وأثره على الدرجة مجهول.',
          'يُتابَع الإنفاق المحلي مقابل المستورد، لكن دون إدارته فعليًا نحو تحسين الدرجة.',
          'عملية محددة تراجع حصة المحتوى المحلي من الإنفاق مقابل أهداف القيمة المضافة سنويًا على الأقل.',
          'قرارات التوريد تُفضّل الموردين المحليين المؤهلين للقيمة المضافة عند التنافسية السعرية، مع نمذجة الأثر على الدرجة قبل الترسيات الكبرى.',
          'تحسين المحتوى المحلي مُدمَج في استراتيجية الفئات؛ والمؤسسة تطوّر فعليًا موردين عمانيين لتوسيع قاعدتها المؤهلة.',
        ],
      },
      {
        q: 'For sectors with specific ICV thresholds (e.g., ICT\'s 40% project-level requirement and 20% mandatory subcontracting), how well does your organisation verify and document compliance with sector-specific rules?',
        qAr: 'بالنسبة للقطاعات ذات العتبات المحددة للقيمة المضافة المحلية (مثل متطلب مشاريع تقنية المعلومات والاتصالات البالغ 40% والتعاقد من الباطن الإلزامي 20%)، ما مدى جودة تحقّق مؤسستكم وتوثيقها للامتثال للقواعد القطاعية المحددة؟',
        levels: [
          'Sector-specific ICV thresholds are not identified or tracked; compliance status is unknown.',
          'Thresholds are generally known but verification occurs only reactively when a tender requires proof.',
          'A defined process verifies and documents sector-specific ICV compliance (including subcontracting quotas) for every relevant project.',
          'Sector-specific compliance is proactively managed with subcontractor relationships pre-qualified against the mandatory categories.',
          'Sector-specific ICV compliance is a governed capability with a sustained record of zero disputes over threshold or subcontracting requirements.',
        ],
        levelsAr: [
          'العتبات القطاعية المحددة للقيمة المضافة المحلية لا تُحدَّد أو تُتابَع؛ وحالة الامتثال مجهولة.',
          'العتبات معروفة عمومًا لكن التحقق يحدث فقط بشكل تفاعلي عندما تتطلب مناقصة إثباتًا.',
          'عملية محددة تتحقق وتوثّق الامتثال القطاعي المحدد للقيمة المضافة المحلية (بما يشمل حصص التعاقد من الباطن) لكل مشروع ذي صلة.',
          'الامتثال القطاعي المحدد يُدار استباقيًا مع علاقات مقاولين من الباطن مؤهلة مسبقًا مقابل الفئات الإلزامية.',
          'الامتثال القطاعي المحدد للقيمة المضافة المحلية قدرة محوكَمة بسجل مستدام من عدم وجود نزاعات على متطلبات العتبة أو التعاقد من الباطن.',
        ],
      },
      {
        q: 'How effectively does your organisation use its ICV score as a competitive input to Authority for Projects, Tenders and Local Content bids, beyond simple compliance?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لدرجة القيمة المضافة المحلية كمُدخَل تنافسي في مناقصات هيئة المشاريع والمناقصات والمحتوى المحلي، بما يتجاوز مجرد الامتثال؟',
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
        q: 'How well does your organisation coordinate ICV data (procurement, workforce training, supplier development, local goods/services) across finance, procurement, and HR functions to avoid conflicting or stale submissions?',
        qAr: 'ما مدى جودة تنسيق مؤسستكم لبيانات القيمة المضافة المحلية (المشتريات، تدريب القوى العاملة، تطوير الموردين، السلع/الخدمات المحلية) بين وظائف المالية والمشتريات والموارد البشرية لتجنب التقديمات المتضاربة أو القديمة؟',
        levels: [
          'Finance, procurement, and HR maintain separate, unreconciled data; ICV submissions risk inconsistency across functions.',
          'Data is shared between functions only when the Authority specifically requests it.',
          'A defined annual coordination process reconciles procurement, workforce, and local-content data before ICV submission.',
          'A shared data owner maintains real-time visibility across all ICV-relevant metrics ahead of each reporting cycle.',
          'ICV data governance is fully integrated across finance, procurement, and HR systems, with automated reconciliation and zero submission discrepancies over the past two cycles.',
        ],
        levelsAr: [
          'المالية والمشتريات والموارد البشرية تحتفظ ببيانات منفصلة وغير مطابَقة؛ وتقديمات القيمة المضافة المحلية معرّضة للتضارب بين الوظائف.',
          'تُشارَك البيانات بين الوظائف فقط عندما تطلبها الهيئة تحديدًا.',
          'عملية تنسيق سنوية محددة تطابق بيانات المشتريات والقوى العاملة والمحتوى المحلي قبل التقديم.',
          'مالك بيانات مشترك يحتفظ برؤية آنية عبر جميع المؤشرات ذات الصلة قبل كل دورة تقارير.',
          'حوكمة بيانات القيمة المضافة المحلية مُدمَجة بالكامل عبر أنظمة المالية والمشتريات والموارد البشرية، مع مطابقة آلية ودون أي تباينات في التقديم خلال آخر دورتين.',
        ],
      },
    ],
  },

  /* ── 14O.3  Customs & Trade Compliance ────────────────────────────── */
  {
    id: 'oman-reg-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الامتثال الجمركي والتجاري',
    hint: 'Source: Directorate General of Customs (under the Royal Oman Police), operating the electronic Bayan customs-declaration system, and the GCC Common Customs Law (harmonised and fully digitised under the Unified GCC Customs System since 2021, standard 5% duty). Oman\'s special economic and free zones (Duqm Special Economic Zone, Salalah Free Zone) offer no customs duty, no minimum share-capital requirements, and up to 30-year income-tax exemptions, alongside relaxed Omanisation rates.',
    hintAr: 'المصدر: دائرة الجمارك العامة (تابعة لشرطة عُمان السلطانية)، التي تُشغّل نظام بيان الجمركي الإلكتروني، والقانون الجمركي الموحد الخليجي (المنسّق والمُرقمن بالكامل بموجب النظام الجمركي الموحد الخليجي منذ 2021، برسم قياسي 5%). تمنح المناطق الاقتصادية والحرة العُمانية (منطقة الدقم الاقتصادية الخاصة، منطقة صلالة الحرة) إعفاءً جمركيًا كاملًا، ودون حد أدنى لرأس المال، وإعفاءات ضريبية على الدخل تصل إلى 30 عامًا، إلى جانب معدلات تعمين مخفّفة.',
    benchmarks: { gcc: 2.3, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.4, pharma: 1.4, retail: 1.3,
      logistics: 1.5, marine: 1.4, construction: 1.2, oil_gas: 1.3,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Customs registration + Bayan system access credentials',
      labelAr: 'التسجيل الجمركي وبيانات الوصول لنظام بيان',
      hint:    'Upload your current Directorate General of Customs registration and proof of active Bayan system access.',
      hintAr:  'ارفع تسجيلكم الحالي لدى دائرة الجمارك العامة وإثبات الوصول النشط لنظام بيان.',
    },
    frameworks: ['GCC Common Customs Law', 'Bayan System', 'Directorate General of Customs'],
    questions: [
      {
        q: 'How completely does your organisation maintain the customs registration and Bayan system access required to legally clear goods through Omani ports and border crossings?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بالتسجيل الجمركي والوصول لنظام بيان المطلوبَين لتخليص البضائع قانونيًا عبر الموانئ والمعابر الحدودية العُمانية؟',
        levels: [
          'Registration and Bayan access status is unknown; shipments have been held or delayed due to missing or lapsed access.',
          'Both exist but are tracked informally, with renewal or access-review dates not proactively monitored.',
          'A defined process tracks customs registration and Bayan access status with advance reminders.',
          'Registration and system-access status is monitored across all operating entities with automated alerts.',
          'Customs registration and Bayan access compliance is fully governed with zero shipment delays attributable to access lapses over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل والوصول لنظام بيان مجهولة؛ وتعرّضت شحنات للاحتجاز أو التأخير بسبب وصول مفقود أو منتهٍ.',
          'يوجد كلاهما لكن يُتابَعان بشكل غير رسمي، ودون مراقبة استباقية لتواريخ التجديد أو المراجعة.',
          'عملية محددة تتابع حالة التسجيل الجمركي والوصول لنظام بيان مع تذكيرات مسبقة.',
          'حالة التسجيل والوصول للنظام تُراقَب عبر جميع الكيانات التشغيلية مع تنبيهات آلية.',
          'الامتثال للتسجيل الجمركي والوصول لنظام بيان محوكَم بالكامل دون أي تأخير في الشحنات يُعزى لانقطاع الوصول خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How accurately does your organisation classify goods under the GCC Common Customs Tariff and apply the correct duty treatment for mainland vs. free-zone (Duqm/Salalah) movements?',
        qAr: 'ما مدى دقة تصنيف مؤسستكم للبضائع بموجب التعريفة الجمركية الموحدة الخليجية وتطبيق المعاملة الجمركية الصحيحة لحركة البضائع بين البر الرئيسي والمناطق الحرة (الدقم/صلالة)؟',
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
        q: 'For organisations operating through Duqm Special Economic Zone or Salalah Free Zone, how well is the transfer process managed when goods move from the free zone to the mainland market?',
        qAr: 'بالنسبة للمؤسسات العاملة عبر منطقة الدقم الاقتصادية الخاصة أو منطقة صلالة الحرة، ما مدى جودة إدارة عملية النقل عند انتقال البضائع من المنطقة الحرة إلى السوق المحلي؟',
        levels: [
          'Free-zone-to-mainland transfers happen without formal declarations, creating compliance exposure.',
          'Transfer declarations are filed, but duty calculations are checked only occasionally for accuracy.',
          'A defined process files transfer declarations with duty calculated and verified for every mainland transfer.',
          'Transfer volume and cost are tracked and reconciled against finance records monthly.',
          'Free-zone-to-mainland transfer compliance is fully systematised with automated tracking and a sustained record of zero duty discrepancies.',
        ],
        levelsAr: [
          'تنتقل البضائع من المنطقة الحرة إلى البر الرئيسي دون إقرارات نقل رسمية، مما يخلق تعرّضًا للمخاطر.',
          'تُقدَّم إقرارات النقل، لكن حسابات الرسوم تُفحَص أحيانًا فقط للدقة.',
          'عملية محددة تُقدّم إقرارات النقل مع حساب الرسوم والتحقق منها لكل نقل إلى البر الرئيسي.',
          'حجم وتكلفة عمليات النقل تُتابَع وتُطابَق مع سجلات المالية شهريًا.',
          'الامتثال لنقل البضائع من المنطقة الحرة إلى البر الرئيسي مُمنهَج بالكامل مع تتبّع آلي وسجل مستدام من عدم وجود تباينات في الرسوم.',
        ],
      },
      {
        q: 'How complete and audit-ready is your organisation\'s customs documentation (commercial invoices, certificates of origin, packing lists) processed through the Bayan system?',
        qAr: 'ما مدى اكتمال وجاهزية التدقيق لمستندات الجمارك لدى مؤسستكم (الفواتير التجارية، شهادات المنشأ، قوائم التعبئة) المُعالَجة عبر نظام بيان؟',
        levels: [
          'Customs documentation is incomplete or inconsistent, causing frequent clearance delays.',
          'Documentation is generally complete but assembled reactively per shipment with no standard template.',
          'A standardised documentation package is used for every shipment, reviewed before Bayan submission.',
          'Documentation completeness is tracked as a KPI, with root-cause analysis for any clearance delay.',
          'Customs documentation is fully digitised and audit-ready at all times, supporting a sustained record of first-time clearance with no documentation-driven delays.',
        ],
        levelsAr: [
          'مستندات الجمارك غير مكتملة أو غير متسقة، مما يسبب تأخيرات متكررة في التخليص.',
          'المستندات مكتملة عمومًا لكن تُجمَّع بشكل تفاعلي لكل شحنة دون نموذج موحد.',
          'حزمة مستندات موحدة تُستخدَم لكل شحنة، وتُراجَع قبل التقديم عبر نظام بيان.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع تحليل السبب الجذري لأي تأخير في التخليص.',
          'مستندات الجمارك رقمية بالكامل وجاهزة للتدقيق في كل وقت، وتدعم سجلًا مستدامًا من التخليص من أول مرة دون تأخيرات بسبب المستندات.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to GCC Common Customs Law updates, Omani duty rules, and free-zone regulations that could affect landed cost?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم للتغيرات في تحديثات القانون الجمركي الموحد الخليجي وقواعد الرسوم العُمانية ولوائح المناطق الحرة التي قد تؤثر على التكلفة الإجمالية للوصول؟',
        levels: [
          'Regulatory changes are learned about only when a shipment is affected at the port.',
          'Some monitoring occurs informally through customs brokers or industry news, without a defined process.',
          'A designated function periodically reviews Directorate General of Customs and free-zone updates relevant to the organisation\'s trade lanes.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'Customs regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with external customs advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تتأثر شحنة عند الميناء.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر الوسطاء الجمركيين أو أخبار القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات دائرة الجمارك العامة والمناطق الحرة ذات الصلة بمسارات تجارة المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف التغيرات الجمركية وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين جمركيين خارجيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14O.4  Product Conformity & Standards (DGSM) ─────────────────── */
  {
    id: 'oman-reg-conformity',
    title: 'Product Conformity & Standards (DGSM)',
    titleAr: 'مطابقة المنتجات والمعايير (المديرية العامة للمواصفات والمقاييس)',
    hint: 'Source: Directorate General for Specifications and Measurements (DGSM), Ministry of Commerce and Industry — Oman\'s National Standards Body responsible for standardisation, metrology, conformity assessment, and accreditation. The Omani Conformity Scheme (Ministerial Decree No. 190/2021) verifies Certificates of Conformity for regulated imported products via approved notified bodies, rolled out in stages by product category. The Omani Quality Mark (OQM/G-mark) became a mandatory product-certification requirement effective 1 March 2026.',
    hintAr: 'المصدر: المديرية العامة للمواصفات والمقاييس، وزارة التجارة والصناعة — الهيئة الوطنية للمواصفات في عُمان المسؤولة عن التوحيد القياسي والمقاييس وتقييم المطابقة والاعتماد. يتحقق نظام المطابقة العُماني (المرسوم الوزاري رقم 190/2021) من شهادات المطابقة للمنتجات المستوردة الخاضعة للتنظيم عبر جهات مُخطَرة معتمدة، ويُطبَّق على مراحل حسب فئة المنتج. أصبحت علامة الجودة العُمانية (OQM/G-mark) متطلبًا إلزاميًا لشهادة المنتجات اعتبارًا من 1 مارس 2026.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 1.3, oil_gas: 1.0,
      government: 0.5, technology: 1.1, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'DGSM Certificate of Conformity / Omani Quality Mark (OQM)',
      labelAr: 'شهادة المطابقة من المديرية العامة للمواصفات والمقاييس/علامة الجودة العُمانية',
      hint:    'Upload your current DGSM-issued Certificate of Conformity and, where applicable, your Omani Quality Mark (OQM) registration.',
      hintAr:  'ارفع شهادة المطابقة الحالية الصادرة عن المديرية العامة وتسجيل علامة الجودة العُمانية عند الانطباق.',
    },
    frameworks: ['DGSM', 'Omani Conformity Scheme (MD 190/2021)', 'Omani Quality Mark'],
    questions: [
      {
        q: 'How systematically does your organisation identify which of its products are subject to the Omani Conformity Scheme, requiring a DGSM Certificate of Conformity before market entry?',
        qAr: 'ما مدى منهجية تحديد مؤسستكم للمنتجات الخاضعة لنظام المطابقة العُماني، التي تتطلب شهادة مطابقة من المديرية العامة قبل دخول السوق؟',
        levels: [
          'Product-level DGSM applicability is unknown; conformity requirements are discovered only when a shipment is rejected.',
          'Some products are known to require certification, but there is no systematic review of the full product portfolio against staged rollout categories.',
          'A defined process reviews every new product against DGSM conformity requirements before market entry, tracking scheme rollout stages.',
          'DGSM applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full portfolio.',
          'Product conformity classification is proactively managed with a governed register, achieving zero market-entry rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق متطلبات المديرية العامة على المنتجات مجهول؛ وتُكتشَف متطلبات المطابقة فقط عند رفض شحنة.',
          'بعض المنتجات معروف أنها تتطلب شهادة، لكن دون مراجعة منهجية لكامل محفظة المنتجات مقابل فئات التطبيق المرحلي.',
          'عملية محددة تراجع كل منتج جديد مقابل متطلبات مطابقة المديرية العامة قبل دخول السوق، وتتابع مراحل تطبيق النظام.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة.',
          'تصنيف مطابقة المنتجات يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض عند دخول السوق بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well is your organisation prepared for the mandatory Omani Quality Mark (OQM) requirement effective 1 March 2026, including application readiness across the applicable product portfolio?',
        qAr: 'ما مدى استعداد مؤسستكم لمتطلب علامة الجودة العُمانية الإلزامي النافذ اعتبارًا من 1 مارس 2026، بما يشمل جاهزية التقديم عبر محفظة المنتجات المعنية؟',
        levels: [
          'OQM applicability and timeline are not tracked; the organisation risks non-compliance at the mandatory effective date.',
          'OQM is generally known but no product-level readiness assessment or application plan exists.',
          'A defined process has assessed OQM applicability across the portfolio and initiated applications ahead of the mandatory date.',
          'OQM transition is actively managed with a tracked application pipeline and contingency plans for products at risk of missing the deadline.',
          'OQM compliance readiness is a governed capability with a sustained record of on-time certification across the full applicable portfolio.',
        ],
        levelsAr: [
          'انطباق علامة الجودة العُمانية وجدولها الزمني لا يُتابَعان؛ والمؤسسة معرّضة لعدم الامتثال عند الموعد الإلزامي.',
          'علامة الجودة العُمانية معروفة عمومًا لكن دون تقييم جاهزية على مستوى المنتج أو خطة تقديم.',
          'عملية محددة قيّمت انطباق العلامة عبر المحفظة وبدأت التقديمات قبل الموعد الإلزامي.',
          'انتقال علامة الجودة يُدار فعليًا بمسار تقديمات مُتابَع وخطط طوارئ للمنتجات المعرّضة لتفويت الموعد.',
          'جاهزية الامتثال لعلامة الجودة العُمانية قدرة محوكَمة بسجل مستدام من الشهادات في الوقت المحدد عبر كامل المحفظة المعنية.',
        ],
      },
      {
        q: 'How well does your organisation manage certification renewals (e.g., annual renewal for low-voltage electrical equipment conformity certificates) end-to-end across its product portfolio?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لتجديدات الشهادات (مثل التجديد السنوي لشهادات مطابقة المعدات الكهربائية منخفضة الجهد) من البداية للنهاية عبر محفظة منتجاتها؟',
        levels: [
          'Certification renewals are handled reactively, often by a supplier or agent, with no internal visibility into status or validity.',
          'Certificates exist but validity periods and renewal dates are not proactively tracked.',
          'A defined owner manages the renewal process end-to-end, with renewal dates tracked and reminders set.',
          'The renewal pipeline is actively managed across the full product portfolio, with pre-audit facility reviews to avoid inspection failures.',
          'DGSM certification renewal management is a governed function with a sustained record of on-time renewals and zero certification-driven market disruptions.',
        ],
        levelsAr: [
          'تُدار تجديدات الشهادات بشكل تفاعلي، غالبًا من مورد أو وكيل، دون رؤية داخلية لحالتها أو صلاحيتها.',
          'الشهادات موجودة لكن فترات الصلاحية وتواريخ التجديد لا تُتابَع استباقيًا.',
          'مالك محدد يدير عملية التجديد من البداية للنهاية، مع متابعة تواريخ التجديد وتحديد تذكيرات.',
          'مسار التجديد يُدار فعليًا عبر كامل محفظة المنتجات، مع مراجعات ما قبل التفتيش للمنشآت لتجنب فشل التفتيش.',
          'إدارة تجديد شهادات المديرية العامة وظيفة محوكَمة بسجل مستدام من التجديد في الوقت المحدد وصفر اضطرابات في السوق بسبب الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation track and respond to DGSM standard updates and staged Omani Conformity Scheme category expansions that could change product compliance requirements?',
        qAr: 'ما مدى جودة تتبّع واستجابة مؤسستكم لتحديثات مواصفات المديرية العامة والتوسعات المرحلية لفئات نظام المطابقة العُماني التي قد تُغيّر متطلبات مطابقة المنتجات؟',
        levels: [
          'Standard updates are learned about only when a product is rejected or flagged at customs.',
          'Some monitoring of DGSM updates occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews DGSM standard updates and scheme category expansions relevant to the product portfolio.',
          'Standard-change monitoring is proactive and systematic, with product-impact assessments performed before changes take effect.',
          'DGSM regulatory horizon-scanning is a governed function integrated into product development, with material standard changes flagged to leadership before they take effect.',
        ],
        levelsAr: [
          'يُعرَف بتحديثات المواصفات فقط عند رفض منتج أو الإشارة إليه في الجمارك.',
          'تحدث بعض مراقبة تحديثات المديرية العامة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات مواصفات المديرية العامة وتوسعات فئات النظام ذات الصلة بمحفظة المنتجات دوريًا.',
          'مراقبة تغيّر المواصفات استباقية ومنهجية، مع تقييمات أثر على المنتجات تُجرى قبل سريان التغييرات.',
          'استشراف تغيرات مواصفات المديرية العامة وظيفة محوكَمة مُدمَجة في تطوير المنتجات، مع رفع التغييرات الجوهرية للقيادة قبل سريانها.',
        ],
      },
      {
        q: 'How complete is your organisation\'s documentation trail (test reports, certificates, technical files) supporting product conformity and OQM claims across your portfolio?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (تقارير الفحص، الشهادات، الملفات الفنية) الداعمة لمزاعم مطابقة المنتجات وعلامة الجودة العُمانية عبر المحفظة؟',
        levels: [
          'Conformity documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most products but is not consistently organised or readily retrievable.',
          'A central, organised documentation repository covers all products requiring DGSM conformity or OQM certification.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Conformity documentation is fully digitised, audit-ready, and integrated into a governed product-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المطابقة غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم المنتجات لكن غير منظمة باستمرار أو سهلة الاسترجاع.',
          'مستودع مستندات مركزي ومنظم يغطي جميع المنتجات التي تتطلب مطابقة المديرية العامة أو شهادة علامة الجودة.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المطابقة رقمية بالكامل وجاهزة للتدقيق ومُدمَجة في نظام امتثال منتجات محوكَم دون أي فجوات مستندية.',
        ],
      },
    ],
  },

  /* ── 14O.5  Government Procurement ────────────────────────────────── */
  {
    id: 'oman-reg-procurement',
    title: 'Government Procurement',
    titleAr: 'المشتريات الحكومية',
    hint: 'Source: Authority for Projects, Tenders and Local Content (PTLC) — formerly the Secretariat General of the Tender Board, renamed under Royal Decree No. 57/2025 to reflect its expanded mandate overseeing procurement, local-content targets, and spending-efficiency across government contracts. Tenders are published and managed through the e-Tendering portal (etendering.tenderboard.gov.om). Under Royal Decree 59/2024, Ministry of Finance sign-off is now required specifically for government bonds, guarantees, and investment projects outside Oman Investment Authority holdings.',
    hintAr: 'المصدر: هيئة المشاريع والمناقصات والمحتوى المحلي — سابقًا الأمانة العامة لمجلس المناقصات، أُعيدت تسميتها بموجب المرسوم السلطاني رقم 57/2025 لتعكس ولايتها الموسّعة في الإشراف على المشتريات وأهداف المحتوى المحلي وكفاءة الإنفاق عبر العقود الحكومية. تُنشَر المناقصات وتُدار عبر بوابة المناقصات الإلكترونية (etendering.tenderboard.gov.om). بموجب المرسوم السلطاني 59/2024، أصبح توقيع وزارة المالية مطلوبًا تحديدًا للسندات الحكومية والضمانات والمشاريع الاستثمارية خارج ممتلكات جهاز الاستثمار العُماني.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 0.5, pharma: 1.0, retail: 0.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.2,
      government: 1.5, technology: 1.2, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'e-Tendering portal registration / contractor classification',
      labelAr: 'تسجيل بوابة المناقصات الإلكترونية/تصنيف المقاولين',
      hint:    'Upload proof of active registration on the e-Tendering portal and your current contractor/supplier classification, if applicable.',
      hintAr:  'ارفع إثبات التسجيل النشط في بوابة المناقصات الإلكترونية وتصنيفكم الحالي كمقاول/مورد، إن انطبق.',
    },
    frameworks: ['Royal Decree No. 57/2025', 'Authority for Projects, Tenders and Local Content', 'e-Tendering Portal'],
    questions: [
      {
        q: 'How clearly does your organisation understand and maintain registration and classification status on the e-Tendering portal (etendering.tenderboard.gov.om)?',
        qAr: 'ما مدى وضوح فهم مؤسستكم واحتفاظها بحالة التسجيل والتصنيف على بوابة المناقصات الإلكترونية (etendering.tenderboard.gov.om)؟',
        levels: [
          'Registration and classification status on the e-Tendering portal is unclear; bids have been rejected due to missing or lapsed registration.',
          'Registration exists but classification status is not systematically tracked or renewed.',
          'A defined process tracks active registration and classification status on the e-Tendering portal.',
          'Registration and classification are proactively maintained and upgraded ahead of anticipated bidding activity.',
          'e-Tendering registration and classification management is a governed capability with zero bid disqualifications due to registration issues over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل والتصنيف على بوابة المناقصات الإلكترونية غير واضحة؛ ورُفضت مناقصات بسبب تسجيل مفقود أو منتهٍ.',
          'التسجيل موجود لكن حالة التصنيف لا تُتابَع أو تُجدَّد منهجيًا.',
          'عملية محددة تتابع حالة التسجيل والتصنيف النشط على بوابة المناقصات الإلكترونية.',
          'التسجيل والتصنيف يُحافَظ عليهما ويُطوَّران استباقيًا قبل نشاط المناقصات المتوقع.',
          'إدارة التسجيل والتصنيف على بوابة المناقصات قدرة محوكَمة دون أي استبعاد من مناقصات بسبب مشكلات تسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How well does your organisation prepare bids that satisfy both the technical/financial evaluation criteria and the local-content (ICV) targets that the Authority for Projects, Tenders and Local Content now evaluates jointly?',
        qAr: 'ما مدى جودة إعداد مؤسستكم لمناقصات تستوفي معايير التقييم الفني/المالي وأهداف المحتوى المحلي (القيمة المضافة المحلية) التي تُقيّمها هيئة المشاريع والمناقصات والمحتوى المحلي معًا الآن؟',
        levels: [
          'Bid preparation does not systematically address technical, financial, or local-content evaluation requirements.',
          'These criteria are addressed reactively per bid, with inconsistent quality across submissions.',
          'A standard bid-preparation checklist ensures all evaluation criteria, including local-content targets, are addressed for every submission.',
          'Bid quality is actively benchmarked against past evaluation feedback, with continuous improvement to scoring-relevant sections.',
          'Bid preparation is a governed, specialised function with a sustained high win-rate attributable to consistently strong scoring on evaluation criteria, including local content.',
        ],
        levelsAr: [
          'إعداد المناقصات لا يعالج بشكل منهجي المتطلبات الفنية أو المالية أو متطلبات تقييم المحتوى المحلي.',
          'تُعالَج هذه المعايير بشكل تفاعلي لكل مناقصة، بجودة غير متسقة عبر التقديمات.',
          'قائمة تحقق موحدة لإعداد المناقصات تضمن معالجة جميع معايير التقييم، بما يشمل أهداف المحتوى المحلي، لكل تقديم.',
          'جودة المناقصات تُقاس فعليًا مقابل ملاحظات التقييم السابقة، مع تحسين مستمر للأقسام ذات الصلة بالتقييم.',
          'إعداد المناقصات وظيفة محوكَمة ومتخصصة بمعدل فوز مرتفع مستدام يُعزى إلى تقييم قوي باستمرار في معايير التقييم، بما يشمل المحتوى المحلي.',
        ],
      },
      {
        q: 'How completely does your organisation maintain the prequalification evidence (completed-contract records, financial statements, technical capacity documentation) that procurement evaluators assess before shortlisting?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بأدلة التأهيل المسبق (سجلات العقود المنجزة، القوائم المالية، وثائق القدرة الفنية) التي يُقيّمها مقيّمو المشتريات قبل الترشيح؟',
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
        q: 'How well does your organisation understand and comply with the sign-off pathway required under Royal Decree 59/2024 for contracts involving government bonds, guarantees, or investment projects?',
        qAr: 'ما مدى جودة فهم مؤسستكم وامتثالها لمسار الاعتماد المطلوب بموجب المرسوم السلطاني 59/2024 للعقود المتعلقة بالسندات الحكومية أو الضمانات أو المشاريع الاستثمارية؟',
        levels: [
          'The Royal Decree 59/2024 sign-off pathway is not understood; relevant contracts have been delayed or challenged due to missing Ministry of Finance sign-off.',
          'General awareness of the requirement exists, but applicability is checked only reactively per contract.',
          'A defined process identifies contracts requiring Ministry of Finance sign-off and routes them accordingly before execution.',
          'Sign-off pathway compliance is actively managed with pre-contract legal review to confirm applicability and required approvals.',
          'Royal Decree 59/2024 sign-off compliance is a governed capability with a sustained record of zero contract delays attributable to missing approvals.',
        ],
        levelsAr: [
          'مسار الاعتماد بموجب المرسوم السلطاني 59/2024 غير مفهوم؛ وتعطّلت عقود ذات صلة أو تم الطعن فيها بسبب نقص اعتماد وزارة المالية.',
          'يوجد وعي عام بالمتطلب، لكن الانطباق يُفحَص فقط بشكل تفاعلي لكل عقد.',
          'عملية محددة تحدد العقود التي تتطلب اعتماد وزارة المالية وتوجّهها وفقًا لذلك قبل التنفيذ.',
          'الامتثال لمسار الاعتماد يُدار فعليًا بمراجعة قانونية قبل التعاقد لتأكيد الانطباق والموافقات المطلوبة.',
          'الامتثال لمسار اعتماد المرسوم السلطاني 59/2024 قدرة محوكَمة بسجل مستدام من عدم وجود تأخيرات في العقود تُعزى لنقص الموافقات.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to Authority for Projects, Tenders and Local Content requirements and e-Tendering platform rules that could affect bidding eligibility or contract terms?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات متطلبات هيئة المشاريع والمناقصات والمحتوى المحلي وقواعد منصة المناقصات الإلكترونية التي قد تؤثر على أهلية المناقصة أو شروط العقد؟',
        levels: [
          'Procurement rule changes are learned about only when a bid is affected or rejected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Authority for Projects, Tenders and Local Content and e-Tendering updates.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Procurement regulatory horizon-scanning is a governed function integrated into business development strategy, with legal advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات قواعد المشتريات فقط عندما تتأثر مناقصة أو تُرفَض.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات هيئة المشاريع والمناقصات والمحتوى المحلي ومنصة المناقصات الإلكترونية دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات قواعد المشتريات وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين قانونيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14O.6  Halal Certification & Compliance ──────────────────────── */
  {
    id: 'oman-reg-halal',
    title: 'Halal Certification & Compliance',
    titleAr: 'شهادة الحلال والامتثال',
    hint: 'Source: Ministry of Agriculture, Fisheries and Water Resources (import licensing and product registration for meat, poultry, and animal-derived products), with the Ministry of Endowments and Religious Affairs providing the Islamic scholarly authority underpinning halal standards. Halal certification is mandatory for all meat, poultry, and animal-derived-ingredient products regardless of origin. A halal slaughter certificate from an approved Islamic centre in the country of origin is required, and for shipments from certain markets must be notarised by the Omani Embassy/Consulate (or another Arab diplomatic mission where no Omani mission is present).',
    hintAr: 'المصدر: وزارة الزراعة والثروة السمكية وموارد المياه (ترخيص الاستيراد وتسجيل المنتجات للحوم والدواجن والمنتجات ذات المنشأ الحيواني)، مع تقديم وزارة الأوقاف والشؤون الدينية للسلطة الشرعية الإسلامية الداعمة لمعايير الحلال. شهادة الحلال إلزامية لجميع منتجات اللحوم والدواجن والمكونات ذات المنشأ الحيواني بغض النظر عن بلد المنشأ. يُشترط شهادة ذبح حلال من مركز إسلامي معتمد في بلد المنشأ، وبالنسبة للشحنات من أسواق معينة يجب توثيقها من السفارة/القنصلية العُمانية (أو بعثة دبلوماسية عربية أخرى حيث لا توجد بعثة عُمانية).',
    benchmarks: { gcc: 2.4, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.2, retail: 1.3,
      logistics: 0.5, marine: 0.5, construction: 0.4, oil_gas: 0.4,
      government: 0.4, technology: 0.4, banking: 0.3, other: 0.5,
    },
    evidence: {
      label:   'Halal slaughter certificate (notarised where required)',
      labelAr: 'شهادة الذبح الحلال (موثّقة حيثما يُشترط)',
      hint:    'Upload your current halal slaughter certificate(s) from an approved Islamic centre, including notarisation where required for your export market.',
      hintAr:  'ارفع شهادة (شهادات) الذبح الحلال الحالية من مركز إسلامي معتمد، بما يشمل التوثيق حيثما يُشترط لسوق التصدير الخاص بكم.',
    },
    frameworks: ['Ministry of Agriculture, Fisheries and Water Resources', 'Ministry of Endowments and Religious Affairs'],
    questions: [
      {
        q: 'How completely does your organisation identify which products in its portfolio require mandatory halal certification for Omani market entry?',
        qAr: 'ما مدى اكتمال تحديد مؤسستكم للمنتجات في محفظتها التي تتطلب شهادة حلال إلزامية لدخول السوق العُماني؟',
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
        q: 'How well does your organisation manage the notarisation requirement (Omani Embassy/Consulate or alternative Arab diplomatic mission) for halal certificates from markets where this applies?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لمتطلب التوثيق (السفارة/القنصلية العُمانية أو بعثة دبلوماسية عربية بديلة) لشهادات الحلال من الأسواق التي يُطبَّق فيها ذلك؟',
        levels: [
          'The notarisation requirement is not consistently understood or applied; shipments have been held for missing notarisation.',
          'Notarisation is obtained but tracked informally, without a defined verification step before shipment.',
          'A defined process verifies notarisation is complete and matched to the correct shipment before dispatch.',
          'Notarisation is embedded in the supplier-qualification process, with proactive coordination with diplomatic missions on turnaround timing.',
          'Notarisation management is a governed, audit-ready process with a sustained record of zero port holds due to missing notarisation.',
        ],
        levelsAr: [
          'متطلب التوثيق لا يُفهم أو يُطبَّق باستمرار؛ واحتُجزت شحنات بسبب نقص التوثيق.',
          'يُستخرَج التوثيق لكن يُتابَع بشكل غير رسمي، دون خطوة تحقق محددة قبل الشحن.',
          'عملية محددة تتحقق من اكتمال التوثيق ومطابقته للشحنة الصحيحة قبل الإرسال.',
          'التوثيق مُدمَج في عملية تأهيل الموردين، مع تنسيق استباقي مع البعثات الدبلوماسية بشأن توقيت الإنجاز.',
          'إدارة التوثيق عملية محوكَمة وجاهزة للتدقيق بسجل مستدام من عدم وجود احتجاز بالميناء بسبب نقص التوثيق.',
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
        q: 'How completely does your organisation register relevant products with the Ministry of Agriculture, Fisheries and Water Resources ahead of market entry, alongside halal certification?',
        qAr: 'ما مدى اكتمال تسجيل مؤسستكم للمنتجات ذات الصلة لدى وزارة الزراعة والثروة السمكية وموارد المياه قبل دخول السوق، إلى جانب شهادة الحلال؟',
        levels: [
          'Product registration with the Ministry is not tracked; shipments have been held for missing registration.',
          'Registration is understood as a requirement but pursued only reactively per shipment.',
          'A defined process registers every relevant product with the Ministry before market entry, tracked alongside halal certification.',
          'Product registration status is actively monitored across the portfolio, with renewal or update triggers managed proactively.',
          'Product registration management is a governed capability integrated with halal-certification tracking, with a sustained record of zero registration-driven delays.',
        ],
        levelsAr: [
          'تسجيل المنتجات لدى الوزارة لا يُتابَع؛ واحتُجزت شحنات بسبب نقص التسجيل.',
          'التسجيل مفهوم كمتطلب لكن يُتابَع فقط بشكل تفاعلي لكل شحنة.',
          'عملية محددة تسجل كل منتج ذي صلة لدى الوزارة قبل دخول السوق، بمتابعة مقترنة بشهادة الحلال.',
          'حالة تسجيل المنتجات تُراقَب فعليًا عبر المحفظة، مع إدارة استباقية لمحفزات التجديد أو التحديث.',
          'إدارة تسجيل المنتجات قدرة محوكَمة مُدمَجة مع متابعة شهادة الحلال، بسجل مستدام من عدم وجود تأخيرات تُعزى للتسجيل.',
        ],
      },
      {
        q: 'How proactively does your organisation select and manage relationships with approved Islamic certifying centres to ensure reliable, defensible halal certification?',
        qAr: 'ما مدى استباقية اختيار مؤسستكم وإدارتها لعلاقاتها مع المراكز الإسلامية المعتمدة لإصدار الشهادات لضمان شهادة حلال موثوقة وقابلة للدفاع عنها؟',
        levels: [
          'No direct relationship exists with a halal certifying centre; certification, where held, is managed entirely by a supplier or third party.',
          'A certifying centre is engaged reactively, typically only when a certification lapse is discovered.',
          'An approved halal certifying centre is engaged on a defined cycle aligned to certification timing.',
          'The certifying-centre relationship is actively managed, with pre-shipment coordination to ensure smooth clearance outcomes.',
          'Halal certification management is a governed strategic relationship, with documented evidence trails and a sustained record of dispute-free certification across all relevant products.',
        ],
        levelsAr: [
          'لا توجد علاقة مباشرة مع مركز شهادة حلال؛ وتُدار الشهادة، إن وُجدت، بالكامل من قبل مورّد أو طرف ثالث.',
          'يُستعان بمركز الشهادة بشكل تفاعلي، عادةً فقط عند اكتشاف انتهاء الشهادة.',
          'مركز شهادة الحلال المعتمد يُستعان به وفق دورة محددة متماشية مع توقيت الشهادة.',
          'العلاقة مع مركز الشهادة تُدار فعليًا، مع تنسيق ما قبل الشحن لضمان نتائج تخليص سلسة.',
          'إدارة شهادة الحلال علاقة استراتيجية محوكَمة، بسجلات أدلة موثّقة وسجل مستدام من الشهادات دون نزاعات عبر جميع المنتجات ذات الصلة.',
        ],
      },
    ],
  },

  /* ── 14O.7  Personal Data Protection Law (PDPL) ───────────────────── */
  {
    id: 'oman-reg-pdpl',
    title: 'Personal Data Protection Law (PDPL)',
    titleAr: 'قانون حماية البيانات الشخصية',
    hint: 'Source: Royal Decree 6/2022 (Personal Data Protection Law), with Executive Regulations issued under Ministerial Decision No. 34/2024, overseen by the Ministry of Transport, Communications and Information Technology (MTCIT). Requires controllers (not processors) to appoint a Data Protection Officer, maintain records, and implement data-protection controls. All organisations collecting data on Omani residents must engage an MTCIT-approved external auditor to evaluate their data-protection mechanisms. Cross-border transfers are permitted only under specified controls, and no transfer may proceed if it would harm the data subject. Breaches involving destruction, alteration, disclosure, access, or illegal processing must be reported to the Ministry and affected data subjects.',
    hintAr: 'المصدر: المرسوم السلطاني رقم 6/2022 (قانون حماية البيانات الشخصية)، مع اللائحة التنفيذية الصادرة بموجب القرار الوزاري رقم 34/2024، وتشرف عليه وزارة النقل والاتصالات وتقنية المعلومات. يتطلب من المتحكمين (وليس المعالجين) تعيين مسؤول حماية بيانات، والاحتفاظ بالسجلات، وتطبيق ضوابط حماية البيانات. يجب على جميع الجهات التي تجمع بيانات عن المقيمين العُمانيين الاستعانة بمدقق خارجي معتمد من الوزارة لتقييم آليات حماية البيانات لديها. يُسمح بالنقل عبر الحدود فقط بموجب ضوابط محددة، ولا يجوز أي نقل إذا كان سيُلحق ضررًا بصاحب البيانات. يجب الإبلاغ عن الاختراقات التي تشمل الإتلاف أو التعديل أو الإفشاء أو الوصول أو المعالجة غير القانونية إلى الوزارة وأصحاب البيانات المتأثرين.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 0.9, fmcg: 1.0, pharma: 1.3, retail: 1.3,
      logistics: 1.0, marine: 0.4, construction: 0.5, oil_gas: 0.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'PDPL compliance policy / MTCIT-approved external audit report',
      labelAr: 'سياسة الامتثال لقانون حماية البيانات الشخصية/تقرير التدقيق الخارجي المعتمد من الوزارة',
      hint:    'Upload your organisation\'s PDPL compliance policy and most recent MTCIT-approved external audit report of your data-protection mechanisms.',
      hintAr:  'ارفع سياسة الامتثال لقانون حماية البيانات الشخصية وأحدث تقرير تدقيق خارجي معتمد من الوزارة لآليات حماية البيانات لديكم.',
    },
    frameworks: ['Royal Decree 6/2022 (PDPL)', 'Ministerial Decision 34/2024', 'MTCIT'],
    questions: [
      {
        q: 'Has your organisation appointed a Data Protection Officer (as controller) and engaged an MTCIT-approved external auditor as required under the PDPL Executive Regulations?',
        qAr: 'هل عيّنت مؤسستكم مسؤول حماية بيانات (بصفتها متحكمًا) واستعانت بمدقق خارجي معتمد من الوزارة كما تتطلب اللائحة التنفيذية لقانون حماية البيانات الشخصية؟',
        levels: [
          'No Data Protection Officer is appointed and no external audit has been conducted; PDPL obligations are unowned.',
          'A function is informally responsible for data privacy, but no external audit has been engaged and DPO authority is undocumented.',
          'A designated Data Protection Officer has documented authority, and an MTCIT-approved external auditor has been engaged at least once.',
          'The DPO actively drives PDPL compliance activities across the organisation, with external audits conducted on a defined recurring cycle.',
          'Data-privacy governance is a mature, board-visible function with the DPO role embedded in organisational decision-making and a sustained record of clean external-audit outcomes.',
        ],
        levelsAr: [
          'لا يوجد مسؤول حماية بيانات مُعيَّن ولم يُجرَ أي تدقيق خارجي؛ والتزامات القانون بلا مالك.',
          'وظيفة ما مسؤولة بشكل غير رسمي عن خصوصية البيانات، لكن لم يُستعَن بتدقيق خارجي وسلطة مسؤول حماية البيانات غير موثّقة.',
          'مسؤول حماية بيانات محدد لديه سلطة موثّقة، وتم الاستعانة بمدقق خارجي معتمد من الوزارة مرة واحدة على الأقل.',
          'مسؤول حماية البيانات يقود فعليًا أنشطة الامتثال عبر المؤسسة، مع إجراء تدقيقات خارجية وفق دورة متكررة محددة.',
          'حوكمة خصوصية البيانات وظيفة ناضجة ومرئية لمجلس الإدارة، ودور مسؤول حماية البيانات مُدمَج في صنع القرار التنظيمي بسجل مستدام من نتائج تدقيق خارجي نظيفة.',
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
        q: 'How well does your organisation assess whether a cross-border data transfer would cause harm to the data subject before proceeding, as the PDPL requires?',
        qAr: 'ما مدى جودة تقييم مؤسستكم لما إذا كان نقل البيانات عبر الحدود سيُلحق ضررًا بصاحب البيانات قبل المضي فيه، كما يتطلب القانون؟',
        levels: [
          'Cross-border data transfers occur without any harm assessment or documented transfer mechanism.',
          'Some awareness exists that cross-border transfers require justification, but harm assessments are conducted informally and inconsistently.',
          'A documented harm-assessment process is applied to new cross-border transfers before they begin, including for cloud-hosted systems.',
          'Harm assessments actively inform system and vendor selection, with remediation tracked to closure for any risk identified.',
          'Cross-border transfer governance is a mature, audited programme with a sustained record of PDPL-compliant transfers and zero unassessed high-risk transfers.',
        ],
        levelsAr: [
          'تحدث عمليات نقل البيانات عبر الحدود دون أي تقييم للضرر أو آلية نقل موثّقة.',
          'يوجد وعي بأن النقل عبر الحدود يتطلب تبريرًا، لكن تقييمات الضرر تُجرى بشكل غير رسمي وغير متسق.',
          'عملية تقييم ضرر موثّقة تُطبَّق على عمليات النقل الجديدة عبر الحدود قبل بدئها، بما يشمل الأنظمة المستضافة على السحابة.',
          'تقييمات الضرر تُوجّه فعليًا اختيار الأنظمة والموردين، مع متابعة الإجراءات التصحيحية حتى الإغلاق لأي خطر يُكتشَف.',
          'حوكمة النقل عبر الحدود برنامج ناضج ومُدقَّق بسجل مستدام من عمليات نقل متوافقة مع القانون ودون أي نقل عالي الخطورة غير مُقيَّم.',
        ],
      },
      {
        q: 'How well is your organisation prepared to detect, respond to, and report a personal data breach (destruction, alteration, disclosure, access, or illegal processing) to the Ministry and affected data subjects?',
        qAr: 'ما مدى استعداد مؤسستكم لاكتشاف اختراق بيانات شخصية (إتلاف، تعديل، إفشاء، وصول، أو معالجة غير قانونية) والاستجابة له والإبلاغ عنه للوزارة وأصحاب البيانات المتأثرين؟',
        levels: [
          'No breach-detection or response process exists; a breach would likely go undetected or unreported.',
          'General awareness of breach-reporting obligations exists, but no documented response plan or reporting timeline is defined.',
          'A documented data-breach response plan defines detection, escalation, and reporting steps aligned to PDPL requirements.',
          'The breach-response plan is tested periodically (tabletop exercises) and roles are clearly assigned across IT, legal, and operations.',
          'Breach detection and response is a mature, continuously monitored capability with automated alerting and a demonstrated ability to meet reporting obligations under real or simulated conditions.',
        ],
        levelsAr: [
          'لا توجد عملية لاكتشاف الاختراقات أو الاستجابة لها؛ ومن المرجح ألا يُكتشَف أو يُبلَّغ عن أي اختراق.',
          'يوجد وعي عام بالتزامات الإبلاغ عن الاختراقات، لكن دون خطة استجابة موثّقة أو إطار زمني محدد للإبلاغ.',
          'خطة استجابة موثّقة لاختراق البيانات تحدد خطوات الاكتشاف والتصعيد والإبلاغ بما يتماشى مع متطلبات القانون.',
          'خطة الاستجابة للاختراق تُختبَر دوريًا (تمارين محاكاة) والأدوار موزَّعة بوضوح عبر تقنية المعلومات والقانون والعمليات.',
          'اكتشاف الاختراقات والاستجابة لها قدرة ناضجة ومراقَبة باستمرار بتنبيهات آلية وقدرة مُثبَتة على الوفاء بالتزامات الإبلاغ في ظروف حقيقية أو محاكاة.',
        ],
      },
      {
        q: 'How well does your organisation contractually bind third-party processors (logistics providers, customs brokers, IT vendors) to PDPL-compliant data-handling terms, given the law\'s focus on controller accountability?',
        qAr: 'ما مدى جودة إلزام مؤسستكم تعاقديًا للمعالجين من الأطراف الثالثة (مزودو الخدمات اللوجستية، الوسطاء الجمركيون، موردو تقنية المعلومات) بشروط تعامل مع البيانات متوافقة مع القانون، نظرًا لتركيز القانون على مساءلة المتحكم؟',
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
