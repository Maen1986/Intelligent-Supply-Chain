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
 *
 * LIVE PRIMARY-SOURCE CHECK (2026-08-13): every specific figure/threshold
 * cited across all 7 sub-segments was re-checked against current public
 * regulator pages and law texts (MOHRE/Nafis/WPS guidance, MOIAT ICV
 * certification guidelines, Cabinet Resolution No. 122 of 2024 on Federal
 * Decree-Law No. 11/2023, Dubai Law No. 12/2020, ESMA UAE.S 2055 guidance,
 * Federal Decree-Law No. 45/2021 + UAE Data Office). This is primary-source
 * verification, NOT a named human reviewer sign-off — status stays
 * 'pending_review' until that happens. One correction was made as a result:
 * the government-procurement sub-segment's "minimum three years' experience"
 * question asserted a specific figure that does not appear in Federal
 * Decree-Law No. 11/2023 or its Cabinet Resolution No. 122/2024 executive
 * regulation (the actual prequalification criteria in Article 8 are
 * financial solvency, technical capability, expertise, and track record on
 * similar completed/ongoing projects — no fixed "3 years" threshold is
 * specified at the federal level). The question was rewritten to reflect
 * the real criteria instead of the unverified figure.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ════════════════════════════════════════════════════════════════════════════════
   UAE REGULATORY & LOCALISATION COMPLIANCE — 7 sub-segments × 5 questions
════════════════════════════════════════════════════════════════════════════════ */

export const UAE_REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 14U.1  Emiratisation & Nafis Compliance ──────────────────────── */
  {
    id: 'uae-reg-emiratisation',
    title: 'Emiratisation & Nafis Compliance',
    titleAr: 'الامتثال للتوطين وبرنامج نافس',
    hint: 'Source: MOHRE / Nafis programme. Private mainland companies with 50+ skilled employees face rising annual Emiratisation quotas (10% by end-2026); 20–49-employee companies in 14 targeted sectors must employ at least 2 Emiratis. Non-compliance fines run AED 9,000/month per unfilled role.',
    hintAr: 'المصدر: وزارة الموارد البشرية والتوطين / برنامج نافس. الشركات الخاصة في البر الرئيسي التي تضم 50 موظفًا ماهرًا فأكثر تواجه حصص توطين سنوية متصاعدة (10% بنهاية 2026)؛ والشركات من 20-49 موظفًا في 14 قطاعًا مستهدفًا يجب أن توظّف إماراتيّن على الأقل. غرامات عدم الامتثال تصل إلى 9,000 درهم شهريًا لكل وظيفة شاغرة.',
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
          'تتبّع التوطين آلي عبر بيانات نظام حماية الأجور/الوزارة، ويُراجع شهريًا، ومرتبط بخطة توظيف تستبق الزيادة السنوية القادمة.',
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
          'يوجد وعي ببرنامج نافس لكن لم يُقدّم طلب فعلي للحصول على دعم الأجور أو اشتراكات التقاعد.',
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
          'تسجيل نظام حماية الأجور والامتثال لحد الراتب للموظفين الإماراتيين لا يُتحقّق منهما بشكل فعّال.',
          'تُفحَص حالة نظام حماية الأجور فقط عند رصد مشكلة من الرواتب أو الوزارة.',
          'عملية رواتب محددة تؤكد تسجيل نظام حماية الأجور وحد الراتب الأدنى 6,000 درهم لكل إماراتي محتسَب ضمن الحصة قبل تقديمها.',
          'الامتثال لنظام حماية الأجور يُراقَب باستمرار مع تنبيهات آلية لأي إماراتي ينخفض راتبه عن الحد أو ينقطع تسجيله.',
          'الامتثال لنظام حماية الأجور وحد الراتب آلي بالكامل ويُدقّق فصليًا، دون أي تباينات تُبطل الحصة خلال آخر 24 شهرًا.',
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
          'العمالة المُستعان بها من الخارج لا تُقيَّم أبدًا من حيث أثر التوطين، حتى عندما تكون ذات صلة قانونية بعدد المجموعة.',
          'يوجد وعي بأن العمالة الخارجية قد تكون ذات أهمية، لكن لا مراجعة منهجية لعدد موظفي المقاولين/مزودي الخدمات اللوجستية.',
          'فحص محدد يراجع العدد ذا الصلة بالتوطين للمقاولين ومزودي الخدمات اللوجستية الجوهريين قبل الترسية.',
          'التعرّض لالتزامات التوطين لدى المقاولين ومزودي الخدمات اللوجستية يُراقَب باستمرار، مع بنود تعاقدية تعالج مخاطر الامتثال.',
          'التعرّض لالتزامات التوطين عبر القوى العاملة الممتدة يُنمذَج كجزء من تخطيط القوى العاملة؛ وقرارات التعاقد تُوازن صراحة بين الأثر والتكلفة.',
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
          'حد محدد يُفعّل خطة توظيف تصحيحي موثّقة قبل أن يتحول النقص إلى فجوة مُغرّمة.',
          'مخاطر النقص تُنمَذَف فصليًا مقابل خطط القوى العاملة واتجاهات الاستنزاف المعروفة، مع إجراءات طوارئ مُعتمَدة مسبقًا.',
          'مرونة الامتثال للتوطين مُدخَل ثابت في تخطيط مخاطر القوى العاملة والترخيص، وتم اختبارها مقابل سيناريو نقص محاكى.',
        ],
      },
    ],
  },

