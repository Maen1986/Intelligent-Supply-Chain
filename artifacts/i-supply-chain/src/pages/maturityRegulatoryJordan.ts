/**
 * maturityRegulatoryJordan.ts
 *
 * Sub-segment content for the Jordan Regulatory & Localisation Compliance module
 * (industry module id: 'regulatory-jordan', countryFor: ['jordan']).
 *
 * Status: AUTHORED, PENDING INDEPENDENT LEGAL/EXPERT REVIEW.
 * This content was drafted from public regulator sources (Ministry of Labour,
 * Jordan Customs Department, Jordan Standards and Metrology Organization
 * (JSMO), Jordan Food and Drug Administration (JFDA), Government Tenders
 * Unit / Bylaw No. 8 of 2022, Ministry of Digital Economy and
 * Entrepreneurship / Personal Data Protection Law No. 24 of 2023) as of
 * August 2026. It has NOT yet been signed off by a named human
 * legal/compliance reviewer, per the platform's content-trust model (see
 * /api/regulatory/countries — status stays 'pending_review' until a reviewer
 * signs off with a date). Do not mark 'verified' without that step. Sources
 * cited inline per sub-segment for traceability.
 *
 * Mirrors the structure of UAE_REGULATORY_SUB_SEGMENTS and
 * QATAR_REGULATORY_SUB_SEGMENTS: 5 questions per sub-segment (25 vs Saudi's
 * 70) for a first authored pass — depth can be extended per sub-segment
 * later without breaking the answer-key format.
 *
 * All Arabic is independently authored formal Modern Standard Arabic
 * (فصحى), not machine-translated.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   JORDAN REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
═══════════════════════════════════════════════════════════════════════════ */

export const JORDAN_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14J.1  Jordanization & Labor Localization ────────────────────── */
  {
    id: 'jordan-reg-jordanization',
    title: 'Jordanization & Labor Localization',
    titleAr: 'الأردنة وتوطين سوق العمل',
    hint: 'Source: Ministry of Labour. Since 1 June 2025 the Ministry has frozen new work-permit issuance for non-Jordanian workers across most sectors to prioritise Jordanian employment, with municipalities and the sanitation sector ceasing renewals from January 2026. Exemptions apply to domestic workers, the garments/textiles sector, and manufacturers of apparel-sector production inputs operating in development zones, Qualified Industrial Zones (QIZs), and free zones, plus occupations with insufficient local-market skills availability. A parallel foreign-worker regularization campaign runs through 30 September 2026.',
    hintAr: 'المصدر: وزارة العمل. اعتبارًا من 1 يونيو 2025، جمّدت الوزارة إصدار تصاريح عمل جديدة للعمال غير الأردنيين عبر معظم القطاعات لإعطاء الأولوية للتوظيف الأردني، مع توقف البلديات وقطاع الصرف الصحي عن التجديد اعتبارًا من يناير 2026. تُستثنى العمالة المنزلية وقطاع الألبسة/المنسوجات ومصنّعو مدخلات الإنتاج لقطاع الألبسة العاملون في المناطق التنموية والمناطق الصناعية المؤهلة (QIZ) والمناطق الحرة، إضافة إلى المهن ذات المهارات غير المتوفرة بالقدر الكافي محليًا. وتستمر حملة موازية لتسوية أوضاع العمالة الوافدة حتى 30 سبتمبر 2026.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.4, fmcg: 1.1, pharma: 1.0, retail: 1.1,
      logistics: 1.3, marine: 0.8, construction: 1.5, oil_gas: 0.6,
      government: 1.3, technology: 1.1, banking: 1.2, other: 1.0,
    },
    evidence: {
      label:   'Ministry of Labour workforce-composition / work-permit register',
      labelAr: 'سجل تكوين القوى العاملة/تصاريح العمل لدى وزارة العمل',
      hint:    'Upload your organisation\'s current work-permit register and most recent workforce-composition summary submitted or available to the Ministry of Labour.',
      hintAr:  'ارفع سجل تصاريح العمل الحالي وآخر ملخص لتكوين القوى العاملة المُقدَّم أو المتاح لوزارة العمل.',
    },
    frameworks: ['Ministry of Labour', 'Work-Permit Freeze (2025)', 'QIZ Exemptions'],
    questions: [
      {
        q: 'How completely does your organisation understand which of its roles fall under the Ministry of Labour\'s foreign-worker recruitment freeze versus the QIZ/garments-sector and specialised-skills exemptions?',
        qAr: 'ما مدى اكتمال فهم مؤسستكم للأدوار الخاضعة لتجميد وزارة العمل لتوظيف العمالة الوافدة مقابل استثناءات قطاع الألبسة/المناطق الصناعية المؤهلة والمهارات المتخصصة؟',
        levels: [
          'Role-level exposure to the freeze and its exemptions is unknown; hiring plans have been disrupted by unexpected permit rejections.',
          'General awareness of the freeze exists, but exemption eligibility is checked only reactively per hire.',
          'A defined process reviews every non-Jordanian hiring need against the freeze and exemption criteria before recruitment begins.',
          'Freeze and exemption status is tracked at the role level across all entities, feeding directly into workforce planning.',
          'Freeze/exemption exposure management is a governed HR capability with a sustained record of zero disrupted hires due to permit-freeze surprises.',
        ],
        levelsAr: [
          'التعرّض على مستوى الوظيفة لتجميد التصاريح واستثناءاته مجهول؛ وتعطّلت خطط التوظيف بسبب رفض تصاريح غير متوقع.',
          'يوجد وعي عام بالتجميد، لكن أهلية الاستثناء تُفحَص فقط بشكل تفاعلي لكل حالة توظيف.',
          'عملية محددة تراجع كل احتياج توظيف غير أردني مقابل معايير التجميد والاستثناء قبل بدء التوظيف.',
          'حالة التجميد والاستثناء تُتابَع على مستوى الوظيفة عبر جميع الكيانات، وتُغذّي تخطيط القوى العاملة مباشرة.',
          'إدارة التعرّض للتجميد/الاستثناء قدرة محوكَمة للموارد البشرية بسجل مستدام من عدم تعطّل أي توظيف بسبب مفاجآت التجميد.',
        ],
      },
      {
        q: 'How well does your organisation track the transition of municipal and sanitation-adjacent roles away from non-Jordanian labour ahead of the January 2026 renewal cutoff and beyond?',
        qAr: 'ما مدى جودة تتبّع مؤسستكم لانتقال الأدوار البلدية والمرتبطة بالصرف الصحي بعيدًا عن العمالة غير الأردنية قبل موعد وقف التجديد في يناير 2026 وما بعده؟',
        levels: [
          'No plan exists to transition affected roles; reliance on non-renewable permits continues without a succession plan.',
          'Awareness exists that affected roles must transition, but no documented timeline or replacement-hiring plan has been built.',
          'A defined transition plan identifies affected roles and sets replacement-hiring milestones ahead of the cutoff.',
          'Transition planning is actively resourced with training-academy partnerships or equivalent upskilling pipelines for Jordanian replacements.',
          'Workforce localisation transition is a governed programme with a sustained record of zero service disruption in affected functions.',
        ],
        levelsAr: [
          'لا توجد خطة لانتقال الأدوار المتأثرة؛ ويستمر الاعتماد على تصاريح غير قابلة للتجديد دون خطة إحلال.',
          'يوجد وعي بضرورة انتقال الأدوار المتأثرة، لكن دون جدول زمني موثّق أو خطة توظيف بديل.',
          'خطة انتقال محددة تحدد الأدوار المتأثرة وتضع معالم توظيف بديل قبل موعد الوقف.',
          'يُدعَم التخطيط للانتقال فعليًا بشراكات مع أكاديميات تدريب أو مسارات تطوير مهارات مماثلة للبدائل الأردنية.',
          'توطين القوى العاملة برنامج محوكَم بسجل مستدام من عدم انقطاع الخدمة في الوظائف المتأثرة.',
        ],
      },
      {
        q: 'How proactively does your organisation participate in the foreign-worker regularization campaign (through 30 September 2026) for any existing non-Jordanian workers whose status needs correction?',
        qAr: 'ما مدى استباقية مشاركة مؤسستكم في حملة تسوية أوضاع العمالة الوافدة (حتى 30 سبتمبر 2026) لأي عمالة غير أردنية حالية تحتاج أوضاعها إلى تصحيح؟',
        levels: [
          'Worker-status irregularities are not assessed; the organisation is unaware whether any current workers require regularization.',
          'Some awareness exists of the regularization campaign, but no systematic review of the current workforce has been conducted.',
          'A defined review has identified all non-Jordanian workers requiring regularization and initiated the process for each.',
          'Regularization status is actively tracked to completion, with escalation for cases at risk of missing the deadline.',
          'Worker-status compliance is a governed HR capability with a sustained record of zero unregularized non-Jordanian workers past the campaign deadline.',
        ],
        levelsAr: [
          'مخالفات أوضاع العمالة لا تُقيَّم؛ والمؤسسة غير مدركة ما إذا كانت أي عمالة حالية تحتاج إلى تسوية.',
          'يوجد وعي جزئي بحملة التسوية، لكن دون مراجعة منهجية للقوى العاملة الحالية.',
          'مراجعة محددة حدّدت جميع العمال غير الأردنيين المحتاجين للتسوية وبدأت العملية لكل حالة.',
          'حالة التسوية تُتابَع فعليًا حتى الإنجاز، مع تصعيد للحالات المعرّضة لتفويت الموعد النهائي.',
          'الامتثال لأوضاع العمالة قدرة محوكَمة للموارد البشرية بسجل مستدام من عدم وجود عمالة غير مسوّاة بعد موعد الحملة.',
        ],
      },
      {
        q: 'How well does your organisation forecast and mitigate the operational risk of role-vacancy gaps created by the recruitment freeze, particularly in roles reliant on specialised or scarce local skills?',
        qAr: 'ما مدى جودة توقّع مؤسستكم وتخفيفها للمخاطر التشغيلية الناتجة عن فجوات الشواغر التي يخلقها تجميد التوظيف، لا سيما في الأدوار المعتمدة على مهارات متخصصة أو نادرة محليًا؟',
        levels: [
          'Vacancy-gap risk from the freeze is not assessed; critical roles have gone unfilled without a mitigation plan.',
          'Risk is generally understood but no documented mitigation plan exists for scarce-skill roles.',
          'A defined process identifies scarce-skill roles at risk and applies for the specialised-skills exemption where applicable.',
          'Scarce-skill vacancy risk is actively managed through upskilling, redeployment, or contractor bridging while exemption applications are pending.',
          'Vacancy-risk mitigation for scarce-skill roles is a governed workforce-planning capability with a sustained record of zero critical-role disruption.',
        ],
        levelsAr: [
          'مخاطر فجوات الشواغر الناتجة عن التجميد لا تُقيَّم؛ وبقيت أدوار حرجة شاغرة دون خطة تخفيف.',
          'المخاطر مفهومة عمومًا لكن دون خطة تخفيف موثّقة للأدوار ذات المهارات النادرة.',
          'عملية محددة تحدد الأدوار ذات المهارات النادرة المعرّضة للخطر وتتقدم بطلب استثناء المهارات المتخصصة عند الانطباق.',
          'مخاطر الشواغر ذات المهارات النادرة تُدار فعليًا عبر تطوير المهارات أو إعادة التوزيع أو الاستعانة بمقاولين مؤقتًا ريثما تُبَت طلبات الاستثناء.',
          'تخفيف مخاطر الشواغر للأدوار النادرة قدرة محوكَمة لتخطيط القوى العاملة بسجل مستدام من عدم انقطاع أي دور حرج.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor Ministry of Labour policy changes to the localisation framework (freeze scope, exemption list, new sector inclusions) that could affect hiring plans?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات سياسة وزارة العمل في إطار التوطين (نطاق التجميد، قائمة الاستثناءات، إدراج قطاعات جديدة) التي قد تؤثر على خطط التوظيف؟',
        levels: [
          'Policy changes are learned about only when a hiring plan is disrupted.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Ministry of Labour announcements relevant to workforce planning.',
          'Policy-change monitoring is proactive and systematic, with hiring-plan impact assessed before changes take effect.',
          'Labour-policy horizon-scanning is a governed function integrated into workforce strategy, with legal/HR advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات في السياسة فقط عندما تتعطل خطة توظيف.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع إعلانات وزارة العمل ذات الصلة بتخطيط القوى العاملة دوريًا.',
          'مراقبة تغيرات السياسة استباقية ومنهجية، مع تقييم أثرها على خطط التوظيف قبل سريانها.',
          'استشراف سياسات العمل وظيفة محوكَمة مُدمَجة في استراتيجية القوى العاملة، مع الاستعانة بمستشارين قانونيين/موارد بشرية للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14J.2  QIZ Local Content & Rules of Origin ───────────────────── */
  {
    id: 'jordan-reg-qiz',
    title: 'QIZ Local Content & Rules of Origin',
    titleAr: 'المحتوى المحلي وقواعد المنشأ في المناطق الصناعية المؤهلة',
    hint: 'Source: Jordan-US Free Trade Agreement and the Qualifying Industrial Zone (QIZ) framework. Goods produced in designated QIZs (and qualifying Jordanian producers generally) can access the US market duty-free and quota-free provided a minimum 35% value-add is met and a small mandated portion of Israeli input is included, per the QIZ rules of origin. Correct classification and documentation of value-add and input sourcing is required to sustain preferential access.',
    hintAr: 'المصدر: اتفاقية التجارة الحرة الأردنية-الأمريكية وإطار المناطق الصناعية المؤهلة (QIZ). يمكن للبضائع المنتجة في المناطق الصناعية المؤهلة المحددة (وعمومًا المنتجين الأردنيين المؤهلين) الوصول إلى السوق الأمريكي بدون رسوم جمركية أو حصص، شريطة تحقيق حد أدنى من القيمة المضافة 35% وتضمين نسبة إلزامية صغيرة من المدخلات الإسرائيلية، وفق قواعد المنشأ الخاصة بالمناطق الصناعية المؤهلة. يتطلب الحفاظ على الوصول التفضيلي تصنيفًا وتوثيقًا صحيحين للقيمة المضافة ومصادر المدخلات.',
    benchmarks: { gcc: 1.9, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.2, pharma: 0.8, retail: 0.6,
      logistics: 1.2, marine: 0.5, construction: 0.5, oil_gas: 0.3,
      government: 0.5, technology: 0.8, banking: 0.3, other: 0.6,
    },
    evidence: {
      label:   'QIZ value-add / rules-of-origin worksheet',
      labelAr: 'ورقة عمل القيمة المضافة/قواعد المنشأ للمناطق الصناعية المؤهلة',
      hint:    'Upload your organisation\'s current value-add calculation worksheet and rules-of-origin documentation for QIZ-eligible products.',
      hintAr:  'ارفع ورقة عمل حساب القيمة المضافة الحالية ووثائق قواعد المنشأ للمنتجات المؤهلة للمناطق الصناعية المؤهلة.',
    },
    frameworks: ['Jordan-US FTA', 'QIZ Rules of Origin'],
    questions: [
      {
        q: 'How rigorously does your organisation calculate and document the minimum 35% value-add required to qualify products for QIZ preferential access?',
        qAr: 'ما مدى صرامة حساب وتوثيق مؤسستكم للحد الأدنى من القيمة المضافة البالغ 35% المطلوب لتأهيل المنتجات للوصول التفضيلي عبر المناطق الصناعية المؤهلة؟',
        levels: [
          'Value-add calculations are not performed or documented; QIZ eligibility is assumed without verification.',
          'Value-add is estimated informally, without a defined methodology or supporting cost records.',
          'A defined process calculates and documents value-add per product line against the 35% threshold before shipment.',
          'Value-add calculations are audited periodically, with corrective sourcing action when a product line risks falling below threshold.',
          'Value-add compliance is a governed, audit-ready capability integrated with product costing, with a sustained record of zero QIZ eligibility disputes.',
        ],
        levelsAr: [
          'حسابات القيمة المضافة لا تُجرى أو تُوثَّق؛ ويُفترَض استيفاء الأهلية دون تحقق.',
          'تُقدَّر القيمة المضافة بشكل غير رسمي، دون منهجية محددة أو سجلات تكلفة داعمة.',
          'عملية محددة تحسب وتوثّق القيمة المضافة لكل خط منتج مقابل عتبة 35% قبل الشحن.',
          'حسابات القيمة المضافة تُدقَّق دوريًا، مع إجراء توريد تصحيحي عندما يكون خط منتج معرّضًا لهبوطه دون العتبة.',
          'الامتثال للقيمة المضافة قدرة محوكَمة وجاهزة للتدقيق مُدمَجة مع تكلفة المنتج، بسجل مستدام من عدم وجود نزاعات على أهلية المناطق الصناعية.',
        ],
      },
      {
        q: 'How well does your organisation manage the mandated Israeli-input sourcing component required to maintain QIZ rules-of-origin compliance?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لعنصر التوريد الإسرائيلي الإلزامي المطلوب للحفاظ على الامتثال لقواعد المنشأ في المناطق الصناعية المؤهلة؟',
        levels: [
          'The Israeli-input sourcing requirement is not tracked; compliance status is unknown.',
          'A supplier relationship exists but the input percentage is not systematically verified against the requirement.',
          'A defined process verifies and documents the Israeli-input percentage for every qualifying shipment.',
          'Israeli-input sourcing is actively managed with backup suppliers to avoid single-source risk to preferential access.',
          'Israeli-input compliance is a governed sourcing capability with a sustained record of zero rules-of-origin disputes tied to this requirement.',
        ],
        levelsAr: [
          'متطلب التوريد الإسرائيلي لا يُتابَع؛ وحالة الامتثال مجهولة.',
          'توجد علاقة مع مورّد لكن نسبة المدخل لا تُتحقَّق منها منهجيًا مقابل المتطلب.',
          'عملية محددة تتحقق وتوثّق نسبة المدخل الإسرائيلي لكل شحنة مؤهلة.',
          'توريد المدخل الإسرائيلي يُدار فعليًا بموردين احتياطيين لتجنب مخاطر المصدر الواحد على الوصول التفضيلي.',
          'الامتثال للمدخل الإسرائيلي قدرة توريد محوكَمة بسجل مستدام من عدم وجود نزاعات على قواعد المنشأ مرتبطة بهذا المتطلب.',
        ],
      },
      {
        q: 'How completely does your organisation maintain audit-ready origin documentation (bills of materials, supplier certificates, cost breakdowns) supporting every QIZ preferential-access claim?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بمستندات المنشأ الجاهزة للتدقيق (قوائم المواد، شهادات الموردين، تفصيل التكاليف) الداعمة لكل مطالبة بالوصول التفضيلي عبر المناطق الصناعية المؤهلة؟',
        levels: [
          'Origin documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most shipments but is assembled reactively rather than maintained on an ongoing basis.',
          'A standardised, centrally maintained documentation package supports every QIZ-eligible shipment.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Origin documentation is fully digitised, audit-ready at all times, and integrated into a governed trade-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المنشأ غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم الشحنات لكن تُجمَّع بشكل تفاعلي بدلاً من الحفاظ عليها باستمرار.',
          'حزمة مستندات موحدة ومحفوظة مركزيًا تدعم كل شحنة مؤهلة عبر المناطق الصناعية.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المنشأ رقمية بالكامل وجاهزة للتدقيق في كل وقت، ومُدمَجة في نظام امتثال تجاري محوكَم دون أي فجوات.',
        ],
      },
      {
        q: 'How effectively does your organisation weigh QIZ preferential-access benefits against sourcing-flexibility trade-offs when making procurement and supplier decisions?',
        qAr: 'ما مدى فعالية موازنة مؤسستكم بين مزايا الوصول التفضيلي عبر المناطق الصناعية المؤهلة ومقايضات مرونة التوريد عند اتخاذ قرارات الشراء واختيار الموردين؟',
        levels: [
          'QIZ eligibility impact is not considered in sourcing decisions; decisions are made on cost alone.',
          'QIZ impact is considered informally for major decisions, without a documented trade-off framework.',
          'A defined framework weighs QIZ preferential-access value against sourcing flexibility for significant procurement decisions.',
          'QIZ trade-off analysis is embedded in category strategy, with scenario modelling for major sourcing shifts.',
          'QIZ-informed sourcing strategy is a governed, board-visible capability, consistently optimising the balance between preferential access and supply-chain resilience.',
        ],
        levelsAr: [
          'أثر أهلية المناطق الصناعية لا يُؤخَذ بعين الاعتبار في قرارات التوريد؛ وتُتخَذ القرارات بناءً على التكلفة فقط.',
          'يُؤخَذ الأثر بعين الاعتبار بشكل غير رسمي للقرارات الكبرى، دون إطار مقايضة موثّق.',
          'إطار محدد يوازن بين قيمة الوصول التفضيلي عبر المناطق الصناعية ومرونة التوريد لقرارات الشراء الجوهرية.',
          'تحليل المقايضة مُدمَج في استراتيجية الفئات، مع نمذجة سيناريوهات للتحولات الكبرى في التوريد.',
          'استراتيجية التوريد المستنيرة بأهلية المناطق الصناعية قدرة محوكَمة ومرئية لمجلس الإدارة، تُحسّن باستمرار التوازن بين الوصول التفضيلي ومرونة سلسلة الإمداد.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to QIZ eligibility rules, Jordan-US FTA terms, or zone designations that could affect existing preferential-access arrangements?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم للتغيرات في قواعد أهلية المناطق الصناعية المؤهلة أو شروط اتفاقية التجارة الحرة الأردنية-الأمريكية أو تصنيفات المناطق التي قد تؤثر على ترتيبات الوصول التفضيلي القائمة؟',
        levels: [
          'Regulatory changes are learned about only when a shipment loses preferential treatment.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews QIZ and FTA updates relevant to the organisation\'s product lines.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'QIZ/FTA regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with trade advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تفقد شحنة معاملتها التفضيلية.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات المناطق الصناعية واتفاقية التجارة الحرة ذات الصلة بخطوط منتجات المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف تغيرات المناطق الصناعية واتفاقية التجارة الحرة وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين تجاريين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14J.3  Customs & Trade Compliance ────────────────────────────── */
  {
    id: 'jordan-reg-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الامتثال الجمركي والتجاري',
    hint: 'Source: Jordan Customs Department, Import and Export Law No. 21 of 2001, and the Import and Export Licences and Card Regulation No. 114 of 2004. Customs duty rates follow the Harmonized Tariff Schedule published annually in the Official Gazette, with in-year amendments published in the same Gazette. Jordan\'s Free Zones (including the Aqaba Special Economic Zone) are exempt from most Jordanian taxes and from Regulation No. 114/2004, operating under a separate regime.',
    hintAr: 'المصدر: دائرة الجمارك الأردنية، قانون الاستيراد والتصدير رقم 21 لسنة 2001، ونظام إجازات وبطاقات الاستيراد والتصدير رقم 114 لسنة 2004. تتبع معدلات الرسوم الجمركية الجدول التعريفي المنسق المنشور سنويًا في الجريدة الرسمية، مع تعديلات خلال العام تُنشَر في الجريدة ذاتها. المناطق الحرة الأردنية (بما فيها منطقة العقبة الاقتصادية الخاصة) مُعفاة من معظم الضرائب الأردنية ومن النظام رقم 114/2004، وتعمل بموجب نظام منفصل.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.4, pharma: 1.4, retail: 1.3,
      logistics: 1.5, marine: 1.0, construction: 1.2, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Customs Department registration + import/export licence',
      labelAr: 'التسجيل لدى دائرة الجمارك وإجازة الاستيراد/التصدير',
      hint:    'Upload your current Jordan Customs Department registration and import/export licence under Regulation No. 114/2004 (where applicable).',
      hintAr:  'ارفع تسجيلكم الحالي لدى دائرة الجمارك الأردنية وإجازة الاستيراد/التصدير بموجب النظام رقم 114/2004 (عند الانطباق).',
    },
    frameworks: ['Import and Export Law No. 21/2001', 'Regulation No. 114/2004', 'Jordan Customs Department'],
    questions: [
      {
        q: 'How completely does your organisation maintain the import/export licence and Customs Department registration required to legally clear goods through Jordanian ports and border crossings?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بإجازة الاستيراد/التصدير والتسجيل لدى دائرة الجمارك المطلوبَين لتخليص البضائع قانونيًا عبر الموانئ والمعابر الحدودية الأردنية؟',
        levels: [
          'Licence and registration status is unknown; shipments have been held or delayed due to missing or lapsed documentation.',
          'Both exist but are tracked informally, with renewal dates not proactively monitored.',
          'A defined process tracks licence and registration renewal dates with advance reminders.',
          'Registration and licence status is monitored across all operating entities with automated renewal alerts.',
          'Licence and registration compliance is fully governed with zero shipment delays attributable to lapses over the past 24 months.',
        ],
        levelsAr: [
          'حالة الإجازة والتسجيل مجهولة؛ وتعرّضت شحنات للاحتجاز أو التأخير بسبب مستندات مفقودة أو منتهية.',
          'يوجد كلاهما لكن يُتابَعان بشكل غير رسمي، ودون مراقبة استباقية لتواريخ التجديد.',
          'عملية محددة تتابع تواريخ تجديد الإجازة والتسجيل مع تذكيرات مسبقة.',
          'حالة التسجيل والإجازة تُراقَب عبر جميع الكيانات التشغيلية مع تنبيهات تجديد آلية.',
          'الامتثال للإجازة والتسجيل محوكَم بالكامل دون أي تأخير في الشحنات يُعزى لانتهاء الصلاحية خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How accurately does your organisation classify goods under the annually published Harmonized Tariff Schedule and apply correct duty treatment, including any in-year Official Gazette amendments?',
        qAr: 'ما مدى دقة تصنيف مؤسستكم للبضائع بموجب الجدول التعريفي المنسق المنشور سنويًا وتطبيق المعاملة الجمركية الصحيحة، بما يشمل أي تعديلات تصدر خلال العام في الجريدة الرسمية؟',
        levels: [
          'HS code classification is done ad hoc, often by the freight forwarder, with no internal review or accountability.',
          'A basic HS code reference list exists but is not consistently applied or updated against Gazette amendments.',
          'HS classification is reviewed by a trained internal resource before shipment, with current-year Gazette amendments explicitly checked.',
          'Classification accuracy is audited periodically, with corrective processes for any misclassification found.',
          'HS classification and duty-treatment determination are systematised with built-in Gazette-amendment monitoring, achieving a sustained record of zero classification-driven customs disputes.',
        ],
        levelsAr: [
          'تصنيف رموز التنسيق يتم بشكل غير منتظم، غالبًا من وكيل الشحن، دون مراجعة أو مساءلة داخلية.',
          'توجد قائمة مرجعية أساسية للرموز لكنها لا تُطبَّق باستمرار أو تُحدَّث مقابل تعديلات الجريدة الرسمية.',
          'يُراجَع التصنيف من موظف داخلي مُدرَّب قبل الشحن، مع فحص صريح لتعديلات الجريدة الرسمية للعام الحالي.',
          'دقة التصنيف تُدقَّق دوريًا، مع عمليات تصحيحية لأي تصنيف خاطئ يُكتشَف.',
          'تحديد التصنيف ومعاملة الرسوم مُمنهَجان مع مراقبة مدمجة لتعديلات الجريدة الرسمية، محققَين سجلًا مستدامًا من عدم وجود نزاعات جمركية بسبب التصنيف.',
        ],
      },
      {
        q: 'For organisations operating through a Jordanian Free Zone or the Aqaba Special Economic Zone, how well is the distinct regulatory regime (tax exemption, licence exemption under Regulation 114/2004) understood and managed?',
        qAr: 'بالنسبة للمؤسسات العاملة عبر منطقة حرة أردنية أو منطقة العقبة الاقتصادية الخاصة، ما مدى جودة فهم وإدارة النظام التنظيمي المنفصل (الإعفاء الضريبي، الإعفاء من الإجازة بموجب النظام 114/2004)؟',
        levels: [
          'Free-zone/Aqaba regime distinctions are not understood; mainland compliance requirements are applied incorrectly or missed.',
          'General awareness of the separate regime exists, but day-to-day compliance decisions are not consistently informed by it.',
          'A defined process correctly applies Free Zone/Aqaba SEZ rules (tax and licence exemptions) to all eligible operations.',
          'Free-zone compliance is actively managed with dedicated documentation distinguishing zone operations from mainland operations.',
          'Free-zone/Aqaba SEZ regime management is a governed capability with a sustained record of zero regime-misapplication findings.',
        ],
        levelsAr: [
          'الفروقات في نظام المناطق الحرة/العقبة غير مفهومة؛ وتُطبَّق متطلبات امتثال البر الرئيسي بشكل خاطئ أو تُهمَل.',
          'يوجد وعي عام بالنظام المنفصل، لكن قرارات الامتثال اليومية لا تسترشد به باستمرار.',
          'عملية محددة تطبّق بشكل صحيح قواعد المنطقة الحرة/العقبة (الإعفاءات الضريبية وإعفاءات الإجازة) على جميع العمليات المؤهلة.',
          'الامتثال للمنطقة الحرة يُدار فعليًا بمستندات مخصصة تميّز عمليات المنطقة عن عمليات البر الرئيسي.',
          'إدارة نظام المنطقة الحرة/العقبة قدرة محوكَمة بسجل مستدام من عدم وجود ملاحظات على سوء التطبيق.',
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
        q: 'How proactively does your organisation monitor changes to Jordanian customs duty rules, tariff amendments, and free-zone regulations that could affect landed cost?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم للتغيرات في قواعد الرسوم الجمركية الأردنية وتعديلات التعريفة ولوائح المناطق الحرة التي قد تؤثر على التكلفة الإجمالية للوصول؟',
        levels: [
          'Regulatory changes are learned about only when a shipment is affected at the border.',
          'Some monitoring occurs informally through customs brokers or industry news, without a defined process.',
          'A designated function periodically reviews Customs Department and Official Gazette updates relevant to the organisation\'s trade lanes.',
          'Regulatory-change monitoring is proactive and systematic, with landed-cost impact assessed before changes take effect.',
          'Customs regulatory horizon-scanning is a governed function integrated into sourcing and pricing strategy, with external customs advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بالتغيرات النظامية فقط عندما تتأثر شحنة عند الحدود.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر الوسطاء الجمركيين أو أخبار القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات دائرة الجمارك والجريدة الرسمية ذات الصلة بمسارات تجارة المؤسسة دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم الأثر على التكلفة الإجمالية قبل سريان التغييرات.',
          'استشراف التغيرات الجمركية وظيفة محوكَمة ومُدمَجة في استراتيجية التوريد والتسعير، مع الاستعانة بمستشارين جمركيين خارجيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14J.4  Product Conformity & Standards (JSMO) ─────────────────── */
  {
    id: 'jordan-reg-conformity',
    title: 'Product Conformity & Standards (JSMO)',
    titleAr: 'مطابقة المنتجات والمعايير (مؤسسة المواصفات والمقاييس)',
    hint: 'Source: Jordan Standards and Metrology Organization (JSMO), which develops and publishes Jordanian standards and issues Certificates of Conformity under ISO/IEC 17065:2012. Goods subject to mandatory Jordanian standards require verification through laboratory testing in Jordan before import clearance. JSMO delegates food and agricultural-product testing to the Jordan Food and Drug Administration (JFDA) while retaining responsibility for standards development and conformity assurance.',
    hintAr: 'المصدر: مؤسسة المواصفات والمقاييس الأردنية (JSMO)، التي تضع وتنشر المواصفات الأردنية وتُصدر شهادات المطابقة بموجب المعيار الدولي ISO/IEC 17065:2012. تتطلب المنتجات الخاضعة للمواصفات الأردنية الإلزامية تحققًا عبر فحص مخبري في الأردن قبل تخليص الاستيراد. تُفوّض المؤسسة فحص المنتجات الغذائية والزراعية إلى مؤسسة الغذاء والدواء الأردنية (JFDA) مع احتفاظها بمسؤولية وضع المواصفات وضمان المطابقة.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.3,
      logistics: 0.5, marine: 0.4, construction: 1.3, oil_gas: 0.8,
      government: 0.5, technology: 1.0, banking: 0.4, other: 1.0,
    },
    evidence: {
      label:   'JSMO Certificate of Conformity / product registration',
      labelAr: 'شهادة المطابقة من مؤسسة المواصفات والمقاييس/تسجيل المنتجات',
      hint:    'Upload current JSMO-issued Certificates of Conformity or product registration records for your product portfolio.',
      hintAr:  'ارفع شهادات المطابقة الحالية الصادرة عن المؤسسة أو سجلات تسجيل المنتجات لمحفظة منتجاتكم.',
    },
    frameworks: ['JSMO', 'ISO/IEC 17065:2012', 'JFDA'],
    questions: [
      {
        q: 'How systematically does your organisation identify which of its products are subject to mandatory Jordanian standards requiring a JSMO Certificate of Conformity before market entry?',
        qAr: 'ما مدى منهجية تحديد مؤسستكم للمنتجات الخاضعة للمواصفات الأردنية الإلزامية التي تتطلب شهادة مطابقة من المؤسسة قبل دخول السوق؟',
        levels: [
          'Product-level JSMO applicability is unknown; conformity requirements are discovered only when a shipment is rejected.',
          'Some products are known to require certification, but there is no systematic review of the full product portfolio.',
          'A defined process reviews every new product against JSMO conformity requirements before market entry.',
          'JSMO applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full portfolio.',
          'Product conformity classification is proactively managed with a governed register, achieving zero market-entry rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق متطلبات المؤسسة على المنتجات مجهول؛ وتُكتشَف متطلبات المطابقة فقط عند رفض شحنة.',
          'بعض المنتجات معروف أنها تتطلب شهادة، لكن دون مراجعة منهجية لكامل محفظة المنتجات.',
          'عملية محددة تراجع كل منتج جديد مقابل متطلبات مطابقة المؤسسة قبل دخول السوق.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة.',
          'تصنيف مطابقة المنتجات يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض عند دخول السوق بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation manage the mandatory in-Jordan laboratory testing process for products subject to mandatory standards, end-to-end?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لعملية الفحص المخبري الإلزامي داخل الأردن للمنتجات الخاضعة للمواصفات الإلزامية، من البداية للنهاية؟',
        levels: [
          'Testing is handled reactively, often by a supplier or agent, with no internal visibility into status or results.',
          'Test results exist but validity periods and retest requirements are not proactively tracked.',
          'A defined owner manages the testing process end-to-end, with results tracked and retest reminders set.',
          'The testing pipeline is actively managed across the full product portfolio, with pre-submission sample reviews to avoid test failures.',
          'JSMO/JFDA testing management is a governed function with a sustained record of on-time results and zero test-driven market-entry disruptions.',
        ],
        levelsAr: [
          'يُدار الفحص بشكل تفاعلي، غالبًا من مورد أو وكيل، دون رؤية داخلية لحالته أو نتائجه.',
          'نتائج الفحص موجودة لكن فترات الصلاحية ومتطلبات إعادة الفحص لا تُتابَع استباقيًا.',
          'مالك محدد يدير عملية الفحص من البداية للنهاية، مع متابعة النتائج وتحديد تذكيرات لإعادة الفحص.',
          'مسار الفحص يُدار فعليًا عبر كامل محفظة المنتجات، مع مراجعات عينات ما قبل التقديم لتجنب فشل الفحص.',
          'إدارة فحوصات المؤسسة/مؤسسة الغذاء والدواء وظيفة محوكَمة بسجل مستدام من نتائج في الوقت المحدد وصفر اضطرابات في دخول السوق بسبب الفحوصات.',
        ],
      },
      {
        q: 'How effectively does your organisation coordinate between JSMO (standards/conformity) and JFDA (food/agricultural product testing) for products that fall under both authorities\' scope?',
        qAr: 'ما مدى فعالية تنسيق مؤسستكم بين المؤسسة (المواصفات/المطابقة) ومؤسسة الغذاء والدواء (فحص المنتجات الغذائية/الزراعية) للمنتجات التي تقع ضمن نطاق كلتا الجهتين؟',
        levels: [
          'Coordination between the two authorities\' requirements is not managed; dual-authority products are handled inconsistently.',
          'Awareness of the JSMO/JFDA split exists, but requirements from each are addressed separately without a unified process.',
          'A defined process maps dual-authority requirements for each relevant product and ensures both are satisfied before market entry.',
          'JSMO/JFDA coordination is actively managed with a single accountable owner tracking both authorities\' timelines and outcomes.',
          'Dual-authority conformity management is a governed capability with a sustained record of zero delays attributable to coordination gaps between JSMO and JFDA.',
        ],
        levelsAr: [
          'التنسيق بين متطلبات الجهتين لا يُدار؛ وتُعالَج المنتجات ذات الاختصاص المزدوج بشكل غير متسق.',
          'يوجد وعي بالتقسيم بين المؤسسة ومؤسسة الغذاء والدواء، لكن تُعالَج متطلبات كل منهما بشكل منفصل دون عملية موحدة.',
          'عملية محددة تُخطّط متطلبات الجهتين لكل منتج ذي صلة وتضمن استيفاء كليهما قبل دخول السوق.',
          'التنسيق بين المؤسسة ومؤسسة الغذاء والدواء يُدار فعليًا بمالك مسؤول واحد يتابع جداول الجهتين ونتائجهما.',
          'إدارة المطابقة ذات الاختصاص المزدوج قدرة محوكَمة بسجل مستدام من عدم وجود تأخيرات تُعزى لفجوات التنسيق بين المؤسسة ومؤسسة الغذاء والدواء.',
        ],
      },
      {
        q: 'How well does your organisation track and respond to JSMO standard updates that could change product compliance requirements?',
        qAr: 'ما مدى جودة تتبّع واستجابة مؤسستكم لتحديثات مواصفات المؤسسة التي قد تُغيّر متطلبات مطابقة المنتجات؟',
        levels: [
          'Standard updates are learned about only when a product is rejected or flagged at customs.',
          'Some monitoring of JSMO updates occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews JSMO standard updates relevant to the product portfolio.',
          'Standard-change monitoring is proactive and systematic, with product-impact assessments performed before changes take effect.',
          'JSMO regulatory horizon-scanning is a governed function integrated into product development, with material standard changes flagged to leadership before they take effect.',
        ],
        levelsAr: [
          'يُعرَف بتحديثات المواصفات فقط عند رفض منتج أو الإشارة إليه في الجمارك.',
          'تحدث بعض مراقبة تحديثات المؤسسة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تحديثات مواصفات المؤسسة ذات الصلة بمحفظة المنتجات دوريًا.',
          'مراقبة تغيّر المواصفات استباقية ومنهجية، مع تقييمات أثر على المنتجات تُجرى قبل سريان التغييرات.',
          'استشراف تغيرات مواصفات المؤسسة وظيفة محوكَمة مُدمَجة في تطوير المنتجات، مع رفع التغييرات الجوهرية للقيادة قبل سريانها.',
        ],
      },
      {
        q: 'How complete is your organisation\'s documentation trail (test reports, certificates, technical files) supporting product conformity claims across your portfolio?',
        qAr: 'ما مدى اكتمال سجل مستندات مؤسستكم (تقارير الفحص، الشهادات، الملفات الفنية) الداعمة لمزاعم مطابقة المنتجات عبر المحفظة؟',
        levels: [
          'Conformity documentation is incomplete or scattered, with no central repository.',
          'Documentation exists for most products but is not consistently organised or readily retrievable.',
          'A central, organised documentation repository covers all products requiring JSMO conformity.',
          'Documentation completeness is tracked as a KPI, with gap-closure plans for any missing evidence.',
          'Conformity documentation is fully digitised, audit-ready, and integrated into a governed product-compliance system with zero documentation gaps.',
        ],
        levelsAr: [
          'مستندات المطابقة غير مكتملة أو متفرقة، دون مستودع مركزي.',
          'المستندات موجودة لمعظم المنتجات لكن غير منظمة باستمرار أو سهلة الاسترجاع.',
          'مستودع مستندات مركزي ومنظم يغطي جميع المنتجات التي تتطلب مطابقة المؤسسة.',
          'اكتمال المستندات يُتابَع كمؤشر أداء، مع خطط لسد أي أدلة مفقودة.',
          'مستندات المطابقة رقمية بالكامل وجاهزة للتدقيق ومُدمَجة في نظام امتثال منتجات محوكَم دون أي فجوات مستندية.',
        ],
      },
    ],
  },

  /* ── 14J.5  Government Procurement ────────────────────────────────── */
  {
    id: 'jordan-reg-procurement',
    title: 'Government Procurement',
    titleAr: 'المشتريات الحكومية',
    hint: 'Source: Bylaw No. 8 of 2022 and the Instructions for Regulating Government Procurement Procedures (2022), which govern public procurement across Jordanian government entities. Tender notices, deadlines, and documents are published via the Government Tenders Unit portal (gtu.gov.jo). The tender lifecycle typically covers publication, bidder registration, document download, bid submission, technical evaluation, financial evaluation, and contract award.',
    hintAr: 'المصدر: النظام رقم 8 لسنة 2022 وتعليمات تنظيم إجراءات المشتريات الحكومية (2022)، التي تحكم المشتريات العامة عبر الجهات الحكومية الأردنية. تُنشَر إشعارات المناقصات والمواعيد النهائية والمستندات عبر بوابة وحدة المشتريات الحكومية (gtu.gov.jo). تشمل دورة حياة المناقصة عادة النشر، تسجيل مقدمي العروض، تحميل المستندات، تقديم العروض، التقييم الفني، التقييم المالي، وترسية العقد.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 0.5, pharma: 1.1, retail: 0.5,
      logistics: 1.0, marine: 0.6, construction: 1.5, oil_gas: 0.8,
      government: 1.5, technology: 1.2, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'Government Tenders Unit (gtu.gov.jo) registration / classification',
      labelAr: 'تسجيل وحدة المشتريات الحكومية (gtu.gov.jo)/التصنيف',
      hint:    'Upload proof of active registration on the Government Tenders Unit portal and your current contractor/supplier classification, if applicable.',
      hintAr:  'ارفع إثبات التسجيل النشط في بوابة وحدة المشتريات الحكومية وتصنيفكم الحالي كمقاول/مورد، إن انطبق.',
    },
    frameworks: ['Bylaw No. 8/2022', 'Government Tenders Unit', 'Procurement Procedures Instructions (2022)'],
    questions: [
      {
        q: 'How clearly does your organisation understand and maintain registration and classification status on the Government Tenders Unit (gtu.gov.jo) portal?',
        qAr: 'ما مدى وضوح فهم مؤسستكم واحتفاظها بحالة التسجيل والتصنيف على بوابة وحدة المشتريات الحكومية (gtu.gov.jo)؟',
        levels: [
          'Registration and classification status on the GTU portal is unclear; bids have been rejected due to missing or lapsed registration.',
          'Registration exists but classification status is not systematically tracked or renewed.',
          'A defined process tracks active registration and classification status on the GTU portal.',
          'Registration and classification are proactively maintained and upgraded ahead of anticipated bidding activity.',
          'GTU registration and classification management is a governed capability with zero bid disqualifications due to registration issues over the past 24 months.',
        ],
        levelsAr: [
          'حالة التسجيل والتصنيف على بوابة وحدة المشتريات الحكومية غير واضحة؛ ورُفضت مناقصات بسبب تسجيل مفقود أو منتهٍ.',
          'التسجيل موجود لكن حالة التصنيف لا تُتابَع أو تُجدَّد منهجيًا.',
          'عملية محددة تتابع حالة التسجيل والتصنيف النشط على بوابة الوحدة.',
          'التسجيل والتصنيف يُحافَظ عليهما ويُطوَّران استباقيًا قبل نشاط المناقصات المتوقع.',
          'إدارة التسجيل والتصنيف على بوابة الوحدة قدرة محوكَمة دون أي استبعاد من مناقصات بسبب مشكلات تسجيل خلال آخر 24 شهرًا.',
        ],
      },
      {
        q: 'How well does your organisation prepare bids that satisfy the technical and financial evaluation criteria set under Bylaw No. 8 of 2022 and its Procurement Procedures Instructions?',
        qAr: 'ما مدى جودة إعداد مؤسستكم لمناقصات تستوفي معايير التقييم الفني والمالي المحددة بموجب النظام رقم 8 لسنة 2022 وتعليماته التنفيذية؟',
        levels: [
          'Bid preparation does not systematically address the technical and financial evaluation requirements set under Bylaw No. 8.',
          'These criteria are addressed reactively per bid, with inconsistent quality across submissions.',
          'A standard bid-preparation checklist ensures all evaluation criteria are addressed for every submission.',
          'Bid quality is actively benchmarked against past evaluation feedback, with continuous improvement to scoring-relevant sections.',
          'Bid preparation is a governed, specialised function with a sustained high win-rate attributable to consistently strong scoring on evaluation criteria.',
        ],
        levelsAr: [
          'إعداد المناقصات لا يعالج بشكل منهجي متطلبات التقييم الفني والمالي المحددة بموجب النظام رقم 8.',
          'تُعالَج هذه المعايير بشكل تفاعلي لكل مناقصة، بجودة غير متسقة عبر التقديمات.',
          'قائمة تحقق موحدة لإعداد المناقصات تضمن معالجة جميع معايير التقييم لكل تقديم.',
          'جودة المناقصات تُقاس فعليًا مقابل ملاحظات التقييم السابقة، مع تحسين مستمر للأقسام ذات الصلة بالتقييم.',
          'إعداد المناقصات وظيفة محوكَمة ومتخصصة بمعدل فوز مرتفع مستدام يُعزى إلى تقييم قوي باستمرار في معايير التقييم.',
        ],
      },
      {
        q: 'How completely does your organisation maintain the prequalification evidence (completed-contract records, financial statements, technical capacity documentation) that procurement committees evaluate before shortlisting?',
        qAr: 'ما مدى اكتمال احتفاظ مؤسستكم بأدلة التأهيل المسبق (سجلات العقود المنجزة، القوائم المالية، وثائق القدرة الفنية) التي تُقيّمها لجان المشتريات قبل الترشيح؟',
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
        q: 'How well does your organisation navigate the full tender lifecycle (publication, registration, submission, technical evaluation, financial evaluation, award) without avoidable procedural errors?',
        qAr: 'ما مدى جودة تعامل مؤسستكم مع دورة حياة المناقصة الكاملة (النشر، التسجيل، التقديم، التقييم الفني، التقييم المالي، الترسية) دون أخطاء إجرائية يمكن تجنبها؟',
        levels: [
          'Tender-lifecycle steps are managed ad hoc, with a history of procedural errors causing bid rejection.',
          'A general understanding of the lifecycle exists, but execution is inconsistent across bid teams.',
          'A standard operating procedure guides the organisation through every tender-lifecycle stage.',
          'Tender-lifecycle execution is actively monitored, with lessons from any procedural issue fed back into the SOP.',
          'Tender-lifecycle management is a governed, specialised capability with a sustained record of zero procedural disqualifications.',
        ],
        levelsAr: [
          'تُدار خطوات دورة حياة المناقصة بشكل غير منتظم، مع سجل من الأخطاء الإجرائية التي تسببت برفض عروض.',
          'يوجد فهم عام للدورة، لكن التنفيذ غير متسق بين فرق التقديم.',
          'إجراء تشغيلي موحد يوجّه المؤسسة عبر كل مرحلة من دورة حياة المناقصة.',
          'تنفيذ دورة حياة المناقصة يُراقَب فعليًا، مع تغذية الدروس المستفادة من أي مشكلة إجرائية إلى الإجراء الموحد.',
          'إدارة دورة حياة المناقصة قدرة محوكَمة ومتخصصة بسجل مستدام من عدم وجود استبعاد إجرائي.',
        ],
      },
      {
        q: 'How proactively does your organisation monitor changes to Jordanian government procurement bylaws and Government Tenders Unit requirements that could affect bidding eligibility or contract terms?',
        qAr: 'ما مدى استباقية مراقبة مؤسستكم لتغيرات أنظمة المشتريات الحكومية الأردنية ومتطلبات وحدة المشتريات الحكومية التي قد تؤثر على أهلية المناقصة أو شروط العقد؟',
        levels: [
          'Procurement bylaw changes are learned about only when a bid is affected or rejected.',
          'Some monitoring occurs informally through industry contacts, without a defined process.',
          'A designated function periodically reviews Bylaw No. 8/2022 amendments and GTU updates.',
          'Regulatory-change monitoring is proactive and systematic, with bid-strategy impact assessed before changes take effect.',
          'Procurement regulatory horizon-scanning is a governed function integrated into business development strategy, with legal advisors engaged for material changes.',
        ],
        levelsAr: [
          'يُعرَف بتغيرات أنظمة المشتريات فقط عندما تتأثر مناقصة أو تُرفَض.',
          'تحدث بعض المراقبة بشكل غير رسمي عبر جهات اتصال في القطاع، دون عملية محددة.',
          'جهة محددة تراجع تعديلات النظام رقم 8/2022 وتحديثات وحدة المشتريات الحكومية دوريًا.',
          'مراقبة التغيرات النظامية استباقية ومنهجية، مع تقييم أثرها على استراتيجية المناقصات قبل سريانها.',
          'استشراف تغيرات أنظمة المشتريات وظيفة محوكَمة مُدمَجة في استراتيجية تطوير الأعمال، مع الاستعانة بمستشارين قانونيين للتغيرات الجوهرية.',
        ],
      },
    ],
  },

  /* ── 14J.6  Halal Certification & Compliance ──────────────────────── */
  {
    id: 'jordan-reg-halal',
    title: 'Halal Certification & Compliance',
    titleAr: 'شهادة الحلال والامتثال',
    hint: 'Source: Jordan Standards and Metrology Organization (JSMO), Jordanian Standard No. 1475 and its amendments, with product testing delegated to the Jordan Food and Drug Administration (JFDA). All meat, poultry, and animal-derived products imported into Jordan (excluding pork and pork products) require a halal certificate issued by a recognised Islamic association/institution in the country of slaughter, certifying compliance with Islamic rites and confirming precautions against contamination with non-halal products.',
    hintAr: 'المصدر: مؤسسة المواصفات والمقاييس الأردنية، المواصفة الأردنية رقم 1475 وتعديلاتها، مع تفويض فحص المنتجات إلى مؤسسة الغذاء والدواء الأردنية. تتطلب جميع اللحوم والدواجن والمنتجات ذات المنشأ الحيواني المستوردة إلى الأردن (باستثناء لحم الخنزير ومشتقاته) شهادة حلال صادرة عن جمعية/مؤسسة إسلامية معترف بها في بلد الذبح، تشهد بالامتثال للشعائر الإسلامية وتؤكد اتخاذ الاحتياطات لمنع التلوث بمنتجات غير حلال.',
    benchmarks: { gcc: 2.3, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.2, retail: 1.3,
      logistics: 0.5, marine: 0.4, construction: 0.4, oil_gas: 0.3,
      government: 0.4, technology: 0.4, banking: 0.3, other: 0.5,
    },
    evidence: {
      label:   'JSMO/JFDA-recognised halal certificate',
      labelAr: 'شهادة الحلال المعترف بها من المؤسسة/مؤسسة الغذاء والدواء',
      hint:    'Upload your current halal certificate(s) from a recognised Islamic association/institution, showing scope and validity period.',
      hintAr:  'ارفع شهادة (شهادات) الحلال الحالية من جمعية/مؤسسة إسلامية معترف بها، موضحة النطاق وفترة الصلاحية.',
    },
    frameworks: ['JS 1475', 'JSMO', 'JFDA'],
    questions: [
      {
        q: 'How completely does your organisation identify which products in its portfolio require mandatory halal certification for Jordanian market entry?',
        qAr: 'ما مدى اكتمال تحديد مؤسستكم للمنتجات في محفظتها التي تتطلب شهادة حلال إلزامية لدخول السوق الأردني؟',
        levels: [
          'Halal certification applicability is unknown at the product level; requirements are discovered only when a shipment is rejected at customs.',
          'Meat and poultry products are known to require certification, but derivative and adjacent products are not systematically reviewed.',
          'A defined process reviews every relevant product (meat, poultry, and derivatives) against Jordanian Standard No. 1475 requirements before market entry.',
          'Halal applicability review is embedded in the product-launch and supplier-onboarding process, with tracking across the full relevant portfolio.',
          'Halal certification classification is proactively managed with a governed register, achieving zero customs rejections due to missing certification.',
        ],
        levelsAr: [
          'انطباق شهادة الحلال على مستوى المنتج مجهول؛ وتُكتشَف المتطلبات فقط عند رفض شحنة في الجمارك.',
          'معروف أن اللحوم والدواجن تتطلب شهادة، لكن المنتجات المشتقة والمجاورة لا تُراجَع منهجيًا.',
          'عملية محددة تراجع كل منتج ذي صلة (لحوم، دواجن، ومشتقات) مقابل متطلبات المواصفة الأردنية رقم 1475 قبل دخول السوق.',
          'مراجعة الانطباق مُدمَجة في عملية إطلاق المنتج وتأهيل الموردين، مع تتبّع عبر كامل المحفظة ذات الصلة.',
          'تصنيف شهادة الحلال يُدار استباقيًا بسجل محوكَم، محققًا صفر رفض جمركي بسبب نقص الشهادات.',
        ],
      },
      {
        q: 'How well does your organisation obtain and verify halal certificates from a recognised Islamic association/institution for every relevant shipment?',
        qAr: 'ما مدى جودة حصول مؤسستكم على شهادات الحلال والتحقق منها من جمعية/مؤسسة إسلامية معترف بها لكل شحنة ذات صلة؟',
        levels: [
          'Certificate requirements are not consistently understood or applied; shipments have been held for missing or unrecognised certification.',
          'Certificates are obtained but tracked informally, without a defined verification step confirming the issuing body is recognised.',
          'A defined process verifies the certificate is valid, matched to the correct product, and issued by a recognised body before every shipment.',
          'Certificate verification is embedded in the supplier-qualification process, with proactive follow-up on renewal timing.',
          'Halal-certificate management is a governed, audit-ready process with a sustained record of zero border holds due to missing or unrecognised documentation.',
        ],
        levelsAr: [
          'متطلبات الشهادة لا تُفهم أو تُطبَّق باستمرار؛ واحتُجزت شحنات بسبب نقص الشهادات أو صدورها عن جهة غير معترف بها.',
          'تُستخرَج الشهادات لكن تُتابَع بشكل غير رسمي، دون خطوة تحقق محددة تؤكد أن الجهة المُصدرة معترف بها.',
          'عملية محددة تتحقق من صلاحية الشهادة ومطابقتها للمنتج الصحيح وصدورها عن جهة معترف بها قبل كل شحنة.',
          'التحقق من الشهادات مُدمَج في عملية تأهيل الموردين، مع متابعة استباقية لتوقيت التجديد.',
          'إدارة شهادة الحلال عملية محوكَمة وجاهزة للتدقيق بسجل مستدام من عدم وجود احتجاز حدودي بسبب نقص المستندات أو عدم الاعتراف بها.',
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
        q: 'How rigorously does your organisation ensure the certifying statement explicitly confirms precautions against contamination with non-halal products, as Jordanian requirements expect, rather than accepting a generic certificate?',
        qAr: 'ما مدى صرامة ضمان مؤسستكم أن بيان الشهادة يؤكد صراحة اتخاذ الاحتياطات لمنع التلوث بمنتجات غير حلال، كما تتوقعه المتطلبات الأردنية، بدلاً من قبول شهادة عامة؟',
        levels: [
          'Certificate content is not reviewed for the contamination-precaution statement; generic certificates are accepted without scrutiny.',
          'Some awareness exists that the statement matters, but certificates are not systematically checked for it.',
          'A defined review confirms every accepted certificate explicitly includes the contamination-precaution statement before shipment acceptance.',
          'Certificate-content review is embedded in the supplier-qualification and renewal process, with non-compliant certificates rejected proactively.',
          'Certificate-content assurance is a governed capability with a sustained record of zero certificate-content-driven customs or market disputes.',
        ],
        levelsAr: [
          'محتوى الشهادة لا يُراجَع للتحقق من بيان احتياطات التلوث؛ وتُقبَل الشهادات العامة دون تدقيق.',
          'يوجد وعي جزئي بأهمية البيان، لكن الشهادات لا تُفحَص منهجيًا للتحقق منه.',
          'مراجعة محددة تؤكد أن كل شهادة مقبولة تتضمن صراحة بيان احتياطات التلوث قبل قبول الشحنة.',
          'مراجعة محتوى الشهادة مُدمَجة في عملية تأهيل الموردين وتجديدهم، مع رفض الشهادات غير المتوافقة استباقيًا.',
          'ضمان محتوى الشهادة قدرة محوكَمة بسجل مستدام من عدم وجود نزاعات جمركية أو سوقية بسبب محتوى الشهادة.',
        ],
      },
      {
        q: 'How proactively does your organisation select and manage relationships with recognised Islamic certifying bodies to ensure reliable, defensible certification?',
        qAr: 'ما مدى استباقية اختيار مؤسستكم وإدارتها لعلاقاتها مع الجهات الإسلامية المعترف بها لإصدار الشهادات لضمان شهادة موثوقة وقابلة للدفاع عنها؟',
        levels: [
          'No direct relationship exists with a halal certifying body; certification, where held, is managed entirely by a supplier or third party.',
          'A certifying body is engaged reactively, typically only when a certification lapse is discovered.',
          'A recognised halal certifying body is engaged on a defined cycle aligned to certification timing.',
          'The certifying-body relationship is actively managed, with pre-shipment coordination to ensure smooth clearance outcomes.',
          'Halal certification management is a governed strategic relationship, with documented evidence trails and a sustained record of dispute-free certification across all relevant products.',
        ],
        levelsAr: [
          'لا توجد علاقة مباشرة مع جهة شهادة حلال؛ وتُدار الشهادة، إن وُجدت، بالكامل من قبل مورّد أو طرف ثالث.',
          'يُستعان بجهة الشهادة بشكل تفاعلي، عادةً فقط عند اكتشاف انتهاء الشهادة.',
          'جهة شهادة الحلال المعترف بها تُستعان بها وفق دورة محددة متماشية مع توقيت الشهادة.',
          'العلاقة مع جهة الشهادة تُدار فعليًا، مع تنسيق ما قبل الشحن لضمان نتائج تخليص سلسة.',
          'إدارة شهادة الحلال علاقة استراتيجية محوكَمة، بسجلات أدلة موثّقة وسجل مستدام من الشهادات دون نزاعات عبر جميع المنتجات ذات الصلة.',
        ],
      },
    ],
  },

  /* ── 14J.7  Personal Data Protection Law (PDPL) ───────────────────── */
  {
    id: 'jordan-reg-pdpl',
    title: 'Personal Data Protection Law (PDPL)',
    titleAr: 'قانون حماية البيانات الشخصية',
    hint: 'Source: Personal Data Protection Law No. 24 of 2023, effective 17 March 2024 with full compliance required by the end of the one-year transition period on 17 March 2025. Applies to all entities processing personal data in Jordan and to foreign businesses offering services to Jordanian residents. Requires informed consent, a Data Protection Officer for large-scale sensitive-data processors, breach notification (72 hours to the regulator, 24 hours to affected data subjects for high-harm breaches), restrictions on cross-border data transfers absent adequate protections, and parental consent for processing children\'s data.',
    hintAr: 'المصدر: قانون حماية البيانات الشخصية رقم 24 لسنة 2023، النافذ اعتبارًا من 17 مارس 2024 مع اشتراط الامتثال الكامل بنهاية فترة الانتقال البالغة سنة واحدة في 17 مارس 2025. يُطبَّق على جميع الجهات التي تُعالج بيانات شخصية في الأردن وعلى الشركات الأجنبية التي تقدّم خدمات للمقيمين الأردنيين. يتطلب موافقة مستنيرة، وتعيين مسؤول حماية بيانات للجهات التي تُعالج بيانات حساسة على نطاق واسع، والإبلاغ عن الاختراقات (خلال 72 ساعة للجهة الرقابية وخلال 24 ساعة لأصحاب البيانات المتأثرين في حال الاختراقات عالية الضرر)، وقيودًا على نقل البيانات عبر الحدود دون ضمانات كافية، وموافقة الوالدين لمعالجة بيانات الأطفال.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 0.9, fmcg: 1.0, pharma: 1.3, retail: 1.3,
      logistics: 1.0, marine: 0.4, construction: 0.5, oil_gas: 0.4,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'PDPL compliance policy / data inventory',
      labelAr: 'سياسة الامتثال لقانون حماية البيانات الشخصية / جرد البيانات',
      hint:    'Upload your organisation\'s PDPL compliance policy or personal-data inventory covering supply chain-related data (supplier, employee, customer shipment records).',
      hintAr:  'ارفع سياسة الامتثال لقانون حماية البيانات الشخصية أو جرد البيانات الشخصية لدى مؤسستكم المتعلق ببيانات سلسلة الإمداد (سجلات الموردين، الموظفين، شحنات العملاء).',
    },
    frameworks: ['Law No. 24/2023 (PDPL)', 'Ministry of Digital Economy and Entrepreneurship'],
    questions: [
      {
        q: 'Has your organisation appointed a Data Protection Officer or designated a responsible compliance function where required by the scale of sensitive-data processing under the PDPL?',
        qAr: 'هل عيّنت مؤسستكم مسؤول حماية بيانات أو حدّدت وظيفة امتثال مسؤولة حيثما يتطلب ذلك نطاق معالجة البيانات الحساسة بموجب قانون حماية البيانات الشخصية؟',
        levels: [
          'No individual or function is responsible for data-privacy compliance; PDPL obligations are unowned.',
          'A function is informally responsible for data privacy but without a defined mandate or documented authority.',
          'A designated Data Protection Officer or compliance function has documented authority and responsibility for PDPL compliance.',
          'The DPO/compliance function actively drives PDPL compliance activities (consent management, breach response, cross-border transfer review) across the organisation.',
          'Data-privacy governance is a mature, board-visible function with the DPO role embedded in organisational decision-making for any new data-processing activity.',
        ],
        levelsAr: [
          'لا يوجد فرد أو وظيفة مسؤولة عن الامتثال لحماية البيانات؛ والتزامات القانون بلا مالك.',
          'وظيفة ما مسؤولة بشكل غير رسمي عن خصوصية البيانات لكن دون تفويض محدد أو سلطة موثّقة.',
          'مسؤول حماية بيانات محدد أو وظيفة امتثال لديها سلطة ومسؤولية موثّقة عن الامتثال للقانون.',
          'وظيفة مسؤول حماية البيانات/الامتثال تقود فعليًا أنشطة الامتثال (إدارة الموافقات، الاستجابة للاختراقات، مراجعة النقل عبر الحدود) عبر المؤسسة.',
          'حوكمة خصوصية البيانات وظيفة ناضجة ومرئية لمجلس الإدارة، ودور مسؤول حماية البيانات مُدمَج في صنع القرار التنظيمي لأي نشاط معالجة بيانات جديد.',
        ],
      },
      {
        q: 'How completely has your organisation implemented informed-consent processes and lawful-purpose documentation for personal data collected through supply chain operations (suppliers, employees, customers)?',
        qAr: 'ما مدى اكتمال تنفيذ مؤسستكم لعمليات الموافقة المستنيرة وتوثيق الغرض القانوني للبيانات الشخصية المجمّعة عبر عمليات سلسلة الإمداد (الموردين، الموظفين، العملاء)؟',
        levels: [
          'No consent process exists; personal data is collected and processed without documented lawful basis.',
          'Consent is obtained inconsistently, without a standard process or documented lawful-purpose record.',
          'A documented consent process and lawful-purpose record covers the main personal-data collection points in supply chain operations.',
          'Consent and lawful-purpose documentation is actively maintained and updated whenever a new data-collection activity is introduced.',
          'Consent management is fully systematised and continuously current, integrated into system change-management processes with zero undocumented processing activities.',
        ],
        levelsAr: [
          'لا توجد عملية موافقة؛ وتُجمَّع البيانات الشخصية وتُعالَج دون أساس قانوني موثّق.',
          'تُستحصَل الموافقة بشكل غير متسق، دون عملية موحدة أو سجل غرض قانوني موثّق.',
          'عملية موافقة موثّقة وسجل غرض قانوني يغطيان نقاط جمع البيانات الشخصية الرئيسية في عمليات سلسلة الإمداد.',
          'توثيق الموافقة والغرض القانوني يُحافَظ عليه ويُحدَّث فعليًا كلما استُحدِث نشاط جمع بيانات جديد.',
          'إدارة الموافقات مُمنهَجة بالكامل ومُحدَّثة باستمرار، ومُدمَجة في عمليات إدارة التغيير للأنظمة دون أي أنشطة معالجة غير موثّقة.',
        ],
      },
      {
        q: 'How well is your organisation prepared to meet the PDPL\'s tight breach-notification windows (72 hours to the regulator, 24 hours to affected data subjects for high-harm breaches)?',
        qAr: 'ما مدى استعداد مؤسستكم للوفاء بالمهل الزمنية الضيقة للإبلاغ عن الاختراقات بموجب القانون (72 ساعة للجهة الرقابية، 24 ساعة لأصحاب البيانات المتأثرين في حال الاختراقات عالية الضرر)؟',
        levels: [
          'No breach-detection or response process exists; a breach would likely go undetected or miss the notification windows.',
          'General awareness of the notification windows exists, but no documented response plan or escalation timeline is defined.',
          'A documented data-breach response plan defines detection, escalation, and reporting steps aligned to the 72-hour/24-hour PDPL windows.',
          'The breach-response plan is tested periodically (tabletop exercises) and roles are clearly assigned across IT, legal, and operations.',
          'Breach detection and response is a mature, continuously monitored capability with automated alerting and a demonstrated ability to meet PDPL notification windows under real or simulated conditions.',
        ],
        levelsAr: [
          'لا توجد عملية لاكتشاف الاختراقات أو الاستجابة لها؛ ومن المرجح ألا يُكتشَف أي اختراق أو تفويت مهل الإبلاغ.',
          'يوجد وعي عام بمهل الإبلاغ، لكن دون خطة استجابة موثّقة أو إطار زمني تصعيد محدد.',
          'خطة استجابة موثّقة لاختراق البيانات تحدد خطوات الاكتشاف والتصعيد والإبلاغ بما يتماشى مع مهلتَي 72 و24 ساعة.',
          'خطة الاستجابة للاختراق تُختبَر دوريًا (تمارين محاكاة) والأدوار موزَّعة بوضوح عبر تقنية المعلومات والقانون والعمليات.',
          'اكتشاف الاختراقات والاستجابة لها قدرة ناضجة ومراقَبة باستمرار بتنبيهات آلية وقدرة مُثبَتة على الوفاء بمهل الإبلاغ في ظروف حقيقية أو محاكاة.',
        ],
      },
      {
        q: 'How well does your organisation assess and document adequate protections before transferring personal data outside Jordan, particularly for cloud-hosted supply chain systems?',
        qAr: 'ما مدى جودة تقييم وتوثيق مؤسستكم للضمانات الكافية قبل نقل البيانات الشخصية خارج الأردن، لا سيما لأنظمة سلسلة الإمداد المستضافة على السحابة؟',
        levels: [
          'Cross-border data transfers occur without assessment of adequacy or documented transfer mechanism.',
          'Some awareness exists that cross-border transfers require justification, but assessments are conducted informally and inconsistently.',
          'A documented adequacy-assessment process is applied to new cross-border transfers before they begin, including for cloud-hosted systems.',
          'Cross-border transfer assessments actively inform system and vendor selection, with remediation tracked to closure for any gap found.',
          'Cross-border transfer governance is a mature, audited programme with a sustained record of PDPL-compliant transfers and zero unassessed high-risk transfers.',
        ],
        levelsAr: [
          'تحدث عمليات نقل البيانات عبر الحدود دون تقييم للكفاية أو آلية نقل موثّقة.',
          'يوجد وعي بأن النقل عبر الحدود يتطلب تبريرًا، لكن التقييمات تُجرى بشكل غير رسمي وغير متسق.',
          'عملية تقييم كفاية موثّقة تُطبَّق على عمليات النقل الجديدة عبر الحدود قبل بدئها، بما يشمل الأنظمة المستضافة على السحابة.',
          'تقييمات النقل عبر الحدود تُوجّه فعليًا اختيار الأنظمة والموردين، مع متابعة الإجراءات التصحيحية حتى الإغلاق لأي فجوة تُكتشَف.',
          'حوكمة النقل عبر الحدود برنامج ناضج ومُدقَّق بسجل مستدام من عمليات نقل متوافقة مع القانون ودون أي نقل عالي الخطورة غير مُقيَّم.',
        ],
      },
      {
        q: 'How well does your organisation contractually bind third-party processors (logistics providers, customs brokers, IT vendors) to PDPL-compliant data-handling terms?',
        qAr: 'ما مدى جودة إلزام مؤسستكم تعاقديًا للمعالجين من الأطراف الثالثة (مزودو الخدمات اللوجستية، الوسطاء الجمركيون، موردو تقنية المعلومات) بشروط تعامل مع البيانات متوافقة مع قانون حماية البيانات الشخصية؟',
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
