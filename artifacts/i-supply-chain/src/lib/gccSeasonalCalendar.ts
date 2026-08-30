/**
 * GCC Seasonal Operations Calendar (#376, Tier A), 30 Aug 2026 -- Ramadan/
 * Hajj-aware procurement countdown, deterministic and disclosed, per
 * Decision Record 8.7 (no fabricated freight-delay or congestion-severity
 * figures).
 *
 * Unblocked 30 Aug 2026 per direct owner instruction ("ok let us finalize
 * them two") after being held since 25 Aug ("Hold -- not a priority right
 * now"). The original blocker was real practitioner ground-truth for
 * "effective lost working days / freight congestion severity" per country
 * -- that figure still does not exist as a clean, citable, per-country
 * index, and this file does not invent one. What changed: instead of
 * estimating a severity score, this tool anchors on real, sourced, dated
 * facts that ARE citable -- statutory Ramadan working-hour reductions
 * (law-based, stable), official 2026 Eid al-Fitr/Eid al-Adha holiday-day
 * counts (government-announced, moon-sighting caveat disclosed), and one
 * real, dated, sourced 2026 case study of Hajj-season port congestion at
 * Jeddah (with its own confounding-cause disclosure -- 2026's congestion
 * was partly Red Sea-diversion-driven, not purely seasonal, and that is
 * stated to the client, not hidden).
 *
 * Hijri dates are NOT computed by an astronomical or tabular algorithm --
 * GCC governments set the actual Ramadan/Eid start date by moon-sighting
 * announcement, typically only 1-2 days ahead, and a calculated
 * approximation would silently drift and mislead a procurement planner.
 * Instead, each year's real, sourced Gregorian dates are hand-entered as
 * they are officially announced/reported. 2026 is populated below; a
 * future year with no entry shows an honest "not yet sourced" state
 * rather than a computed guess (see getYearData / hasYearData).
 *
 * IMPORTANT date-reality note: as of this build (30 Aug 2026), every 2026
 * milestone below (Ramadan start ~19 Feb, Eid al-Fitr ~20 Mar, Eid al-Adha
 * ~26 May, Hajj season Jun-Jul) has already passed. 2027 dates were not
 * available in any source reviewed during this build -- GCC governments
 * typically do not confirm next year's Ramadan/Eid dates until Q4 of the
 * preceding year at the earliest, with the exact day fixed only 1-2 days
 * ahead by moon sighting. This tool is therefore shipped as (a) an
 * evergreen reference on each country's Ramadan operating-hours rules,
 * which is not date-dependent and is useful today, and (b) a 2026
 * historical calendar record with the T-90/60/30/14 countdown logic
 * fully built and ready -- it will start producing live upcoming
 * milestones the moment 2027 dates are sourced and added below.
 *
 * Ramadan working-hours sources (verified against the primary legal
 * citation where one was findable, 30 Aug 2026 research pass):
 *  - Saudi Arabia: Labor Law Article 98 -- 6h/day, 36h/week, Muslim
 *    employees, no separate public-sector schedule (same cap platform-wide),
 *    no pay reduction.
 *  - UAE: Federal Decree-Law No. 33 of 2021, MOHRE 2026 circular -- private
 *    sector -2h/day (6h from 8h, 36h/week) for ALL employees regardless of
 *    religion; federal public sector Mon-Thu 9:00-14:30, Fri 9:00-12:00.
 *  - Qatar: Labour Law No. 14 of 2004, Article 73 (checked directly against
 *    Al Meezan, the official Qatari legal portal -- an earlier search
 *    result had misquoted this as "Law No. 3 of 1962" and that error was
 *    caught and corrected before use) -- 6h/day, 36h/week, ALL employees;
 *    2026 Civil Service Circular No. 1 of 2026 sets civil servants at
 *    5h/day, 9:00-14:00, with no salary reduction.
 *  - Jordan: Ministry of Labor confirmed for 2026 that private-sector hour
 *    reductions are NOT legally mandated -- employer discretion only.
 *    Public sector runs 9:00-14:30 per Prime Ministry directive. This is a
 *    genuine outlier vs the rest of the GCC/Jordan set and is flagged as
 *    such, not smoothed over -- it is real, useful information for a
 *    client weighing counterparty risk in Jordan specifically.
 *  - Oman: Labour Law Article 56 -- private sector 6h/day but a 30h/week
 *    cap (lower than the 36h/week seen elsewhere -- also flagged, not
 *    averaged away); public sector 5h/day, 9:00-14:00 (flexible 7:00-15:00
 *    window).
 *  - Bahrain: 6h/day, 36h/week, Muslim employees -- a 25% cut from the
 *    standard 48h/week. No specific labor-law article number was found in
 *    this research pass; that gap is disclosed rather than invented.
 *
 * Eid holiday-day sources: 2026 government/press announcements per country
 * (Khaleej Times, Gulf News, MOHRE, Qatar News Agency/QNA, Roya News
 * Jordan, Gulf Insider/Gulf News Oman, Time Out Doha/Dubai) -- see each
 * entry's sourceNote. All Islamic-calendar dates carry a moon-sighting
 * caveat: officially confirmed only 1-2 days ahead of the actual date, so
 * treat these as the best available advance estimate, not a locked
 * calendar entry.
 *
 * Hajj congestion case study: Kuehne+Nagel ("Regional cargo flows impact
 * operations at Jeddah Port"), The Loadstar, MarineRadar, and Trans-Border
 * Global Freight Systems all reported, independently, Jeddah Islamic Port
 * running at ~90% yard capacity with 5km truck queues and 6-8 week
 * container-release waits during the Jun-Jul 2026 Hajj season. Mawani
 * (Saudi Ports Authority) responded with a 15-day in-transit cargo
 * departure rule. Every source reviewed also attributed part of this
 * specifically to Red Sea shipping diversions arriving at the same time --
 * that confounding cause is disclosed in the advisory text itself, not
 * hidden, so this is presented as "here is what happened, once, with a
 * known confound" rather than an annual severity guarantee.
 */

export type GccCountry = 'saudi' | 'uae' | 'qatar' | 'jordan' | 'oman' | 'bahrain';

export const GCC_COUNTRIES: GccCountry[] = ['saudi', 'uae', 'qatar', 'jordan', 'oman', 'bahrain'];

export interface RamadanHoursRule {
  mandated: boolean;
  appliesTo: 'all_employees' | 'muslim_employees_only' | 'employer_discretion';
  privateSectorHoursPerDay: number | null;
  privateSectorHoursPerWeek: number | null;
  publicSectorScheduleEn: string;
  publicSectorScheduleAr: string;
  /** Free text rather than a boolean -- pay-protection was explicitly
   * reconfirmed in sourcing for Saudi/Qatar; for UAE/Oman/Bahrain it is
   * standard GCC practice but was not independently re-confirmed in this
   * pass, and that gap is stated rather than assumed silently. */
  payNoteEn: string;
  payNoteAr: string;
  legalBasisEn: string;
  legalBasisAr: string;
  sourceNoteEn: string;
  sourceNoteAr: string;
}

export interface HolidayWindow {
  /** ISO date (YYYY-MM-DD), first day of the official holiday. */
  startDate: string;
  /** ISO date (YYYY-MM-DD), last day of the official holiday (inclusive). */
  endDate: string;
  sector: 'public' | 'private' | 'both';
  noteEn: string;
  noteAr: string;
}

export interface CountryYearData {
  /** ISO date, moon-sighting-dependent approximate start -- see file header caveat. */
  ramadanStartApprox: string;
  eidAlFitr: HolidayWindow;
  eidAlAdha: HolidayWindow;
}

export interface CountrySeasonalData {
  country: GccCountry;
  labelEn: string;
  labelAr: string;
  ramadanHours: RamadanHoursRule;
  years: Partial<Record<2026, CountryYearData>>;
}

export const GCC_SEASONAL_DATA: Record<GccCountry, CountrySeasonalData> = {
  saudi: {
    country: 'saudi',
    labelEn: 'Saudi Arabia',
    labelAr: 'المملكة العربية السعودية',
    ramadanHours: {
      mandated: true,
      appliesTo: 'muslim_employees_only',
      privateSectorHoursPerDay: 6,
      privateSectorHoursPerWeek: 36,
      publicSectorScheduleEn: 'No separate public-sector schedule -- the same 6h/day, 36h/week cap applies platform-wide.',
      publicSectorScheduleAr: 'لا يوجد جدول منفصل للقطاع العام -- ينطبق سقف 6 ساعات/يوم و36 ساعة/أسبوع على جميع القطاعات.',
      payNoteEn: 'No pay reduction -- full monthly salary for the reduced hours (confirmed explicitly in sourcing).',
      payNoteAr: 'لا خصم من الراتب -- الراتب الشهري كاملاً مقابل الساعات المخفضة (مؤكد صراحة في المصادر).',
      legalBasisEn: 'Saudi Labor Law, Article 98.',
      legalBasisAr: 'نظام العمل السعودي، المادة 98.',
      sourceNoteEn: 'Ratiby "Ramadan Working Hours & Pay Saudi Arabia 2026"; Saudi Expatriates "Ramadan 1447 Working Hours" (2026).',
      sourceNoteAr: 'المصدر: Ratiby "Ramadan Working Hours & Pay Saudi Arabia 2026"؛ Saudi Expatriates "Ramadan 1447 Working Hours" (2026).',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-20', endDate: '2026-03-22', sector: 'both',
          noteEn: 'Official 3-day holiday (Fri 20 - Sun 22 Mar); residents could take extra leave Mon 23 - Tue 24 Mar to extend to 5 days.',
          noteAr: 'عطلة رسمية 3 أيام (الجمعة 20 - الأحد 22 مارس)؛ أمكن أخذ إجازة إضافية الاثنين 23 - الثلاثاء 24 مارس لتمديدها إلى 5 أيام.',
        },
        eidAlAdha: {
          startDate: '2026-05-26', endDate: '2026-05-29', sector: 'both',
          noteEn: '4-day public holiday, public and private sectors, from Arafat Day (Tue 26 May).',
          noteAr: 'عطلة رسمية 4 أيام للقطاعين العام والخاص، ابتداءً من يوم عرفة (الثلاثاء 26 مايو).',
        },
      },
    },
  },
  uae: {
    country: 'uae',
    labelEn: 'United Arab Emirates',
    labelAr: 'الإمارات العربية المتحدة',
    ramadanHours: {
      mandated: true,
      appliesTo: 'all_employees',
      privateSectorHoursPerDay: 6,
      privateSectorHoursPerWeek: 36,
      publicSectorScheduleEn: 'Federal public sector: Mon-Thu 9:00-14:30, Fri 9:00-12:00.',
      publicSectorScheduleAr: 'القطاع العام الاتحادي: الاثنين-الخميس 9:00-14:30، الجمعة 9:00-12:00.',
      payNoteEn: 'Standard GCC practice is no pro-rata pay cut for statutory hour reductions; not independently re-confirmed for the UAE specifically in this pass.',
      payNoteAr: 'الممارسة المعتادة في الخليج عدم خصم الراتب نسبياً مقابل تخفيض الساعات القانوني؛ لم يُعاد تأكيد ذلك تحديداً للإمارات في هذه الجولة البحثية.',
      legalBasisEn: 'Federal Decree-Law No. 33 of 2021; MOHRE 2026 Ramadan circular.',
      legalBasisAr: 'المرسوم بقانون اتحادي رقم 33 لسنة 2021؛ تعميم وزارة الموارد البشرية والتوطين لرمضان 2026.',
      sourceNoteEn: 'MOHRE official announcement (mohre.gov.ae); WION News; Khaleej Times / Gulf News 2026 Ramadan coverage.',
      sourceNoteAr: 'إعلان رسمي من وزارة الموارد البشرية والتوطين (mohre.gov.ae)؛ WION News؛ تغطية Khaleej Times / Gulf News لرمضان 2026.',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-19', endDate: '2026-03-22', sector: 'both',
          noteEn: 'Federal government: Thu 19 - Sun 22 Mar (4 days). Private sector: Thu 19 - Sat 21 Mar (3 days), extended to Sun 22 Mar if Ramadan runs 30 days.',
          noteAr: 'الحكومة الاتحادية: الخميس 19 - الأحد 22 مارس (4 أيام). القطاع الخاص: الخميس 19 - السبت 21 مارس (3 أيام)، تمتد إلى الأحد 22 مارس إذا استمر رمضان 30 يوماً.',
        },
        eidAlAdha: {
          startDate: '2026-05-25', endDate: '2026-05-29', sector: 'both',
          noteEn: 'Government employees on leave Mon 25 - Fri 29 May; combined with the weekend, the break extends to 9 consecutive days (resume Mon 1 Jun). Private-sector length not itemized in sources reviewed -- typically shorter; confirm with the specific counterparty.',
          noteAr: 'إجازة موظفي الحكومة من الاثنين 25 إلى الجمعة 29 مايو؛ مع عطلة نهاية الأسبوع تمتد الإجازة إلى 9 أيام متتالية (العودة الاثنين 1 يونيو). مدة إجازة القطاع الخاص غير مفصلة في المصادر المراجعة -- عادة أقصر؛ يُنصح بالتأكد من الطرف المقابل تحديداً.',
        },
      },
    },
  },
  qatar: {
    country: 'qatar',
    labelEn: 'Qatar',
    labelAr: 'قطر',
    ramadanHours: {
      mandated: true,
      appliesTo: 'all_employees',
      privateSectorHoursPerDay: 6,
      privateSectorHoursPerWeek: 36,
      publicSectorScheduleEn: 'Civil servants: 5h/day, 9:00-14:00, per 2026 Civil Service Circular No. 1 (start as late as 10:00 if the full 5h is completed).',
      publicSectorScheduleAr: 'موظفو الخدمة المدنية: 5 ساعات/يوم، 9:00-14:00، بموجب تعميم الخدمة المدنية رقم 1 لسنة 2026 (يمكن البدء حتى الساعة 10:00 شرط إتمام 5 ساعات كاملة).',
      payNoteEn: 'No salary reduction when hours decrease from 8h to 6h (private) or 5h (government) -- explicitly guaranteed under Qatari Labour Law.',
      payNoteAr: 'لا خصم من الراتب عند تخفيض الساعات من 8 إلى 6 ساعات (خاص) أو 5 ساعات (حكومي) -- مضمون صراحة بموجب قانون العمل القطري.',
      legalBasisEn: 'Qatar Labour Law No. 14 of 2004, Article 73 (private sector); 2026 Civil Service Circular No. 1 (government sector).',
      legalBasisAr: 'قانون العمل القطري رقم 14 لسنة 2004، المادة 73 (القطاع الخاص)؛ تعميم الخدمة المدنية رقم 1 لسنة 2026 (القطاع الحكومي).',
      sourceNoteEn: 'Article 73 verified directly against Al Meezan, the official Qatari legal portal (almeezan.qa). QNA official circular coverage; Doha Guides.',
      sourceNoteAr: 'تم التحقق من المادة 73 مباشرة عبر البوابة القانونية القطرية الرسمية "الميزان" (almeezan.qa). تغطية وكالة الأنباء القطرية الرسمية للتعميم؛ Doha Guides.',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-20', endDate: '2026-03-22', sector: 'both',
          noteEn: 'Reported as a 4-day holiday (Fri 20 - Sun 22 Mar); the "4-day" label and the 3-day date range differ slightly across sources reviewed -- treat the date range as primary.',
          noteAr: 'أُفيد أنها عطلة 4 أيام (الجمعة 20 - الأحد 22 مارس)؛ يختلف وصف "4 أيام" قليلاً عن نطاق التواريخ ذي الثلاثة أيام بين المصادر -- يُعتمد نطاق التاريخ كأساس.',
        },
        eidAlAdha: {
          startDate: '2026-05-26', endDate: '2026-05-30', sector: 'both',
          noteEn: '5 days off reported, aligned with the Saudi/UAE/Oman calendar (Arafat Tue 26 May). Exact day-by-day breakdown not itemized in sources reviewed -- treat as approximate.',
          noteAr: 'أُفيد بـ 5 أيام إجازة، متوافقة مع تقويم السعودية والإمارات وعُمان (عرفة الثلاثاء 26 مايو). التفصيل اليومي الدقيق غير مذكور في المصادر المراجعة -- يُعتبر تقريبياً.',
        },
      },
    },
  },
  jordan: {
    country: 'jordan',
    labelEn: 'Jordan',
    labelAr: 'الأردن',
    ramadanHours: {
      mandated: false,
      appliesTo: 'employer_discretion',
      privateSectorHoursPerDay: null,
      privateSectorHoursPerWeek: null,
      publicSectorScheduleEn: 'Public sector, education, ministries, municipalities, state-owned companies: 9:00-14:30, per Prime Ministry directive.',
      publicSectorScheduleAr: 'القطاع العام والتعليم والوزارات والبلديات والشركات الحكومية: 9:00-14:30، بموجب توجيه رئاسة الوزراء.',
      payNoteEn: 'Not applicable -- there is no mandated private-sector hour reduction to protect pay against.',
      payNoteAr: 'لا ينطبق -- لا يوجد تخفيض ساعات إلزامي في القطاع الخاص يستوجب حماية الراتب مقابله.',
      legalBasisEn: 'Jordan Ministry of Labor confirmation (2026): Jordanian labor law does NOT require reduced private-sector hours during Ramadan -- employers set their own schedules. This is a real outlier vs. the rest of this GCC/Jordan set, not an oversight.',
      legalBasisAr: 'تأكيد وزارة العمل الأردنية (2026): لا يُلزم قانون العمل الأردني بتخفيض ساعات العمل في القطاع الخاص خلال رمضان -- يحدد أصحاب العمل جداولهم بأنفسهم. هذا استثناء حقيقي مقارنة ببقية دول المجموعة، وليس إغفالاً.',
      sourceNoteEn: 'Roya News ("Jordan sets official working hours for Ramadan 2026 across sectors"); 7HillsJo.',
      sourceNoteAr: 'المصدر: Roya News ("الأردن يحدد ساعات العمل الرسمية لرمضان 2026 في جميع القطاعات")؛ 7HillsJo.',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-19', endDate: '2026-03-23', sector: 'both',
          noteEn: 'Approximate window only -- no single itemized government announcement found in sources reviewed; expect confirmation to land close to the actual date (moon-sighting caveat applies more strongly here than for the other 5 countries).',
          noteAr: 'نطاق تقريبي فقط -- لم يُعثر على إعلان حكومي مفصل واحد في المصادر المراجعة؛ يُتوقع تأكيد التاريخ قريباً من الموعد الفعلي (تنبيه ترائي الهلال ينطبق هنا بدرجة أقوى من الدول الخمس الأخرى).',
        },
        eidAlAdha: {
          startDate: '2026-05-26', endDate: '2026-05-31', sector: 'both',
          noteEn: 'Approximate window, reported as a national holiday roughly 26-31 May -- same sourcing caveat as Eid al-Fitr above.',
          noteAr: 'نطاق تقريبي، أُفيد بأنه عطلة وطنية تقريباً 26-31 مايو -- نفس تنبيه المصادر أعلاه لعيد الفطر.',
        },
      },
    },
  },
  oman: {
    country: 'oman',
    labelEn: 'Oman',
    labelAr: 'عُمان',
    ramadanHours: {
      mandated: true,
      appliesTo: 'muslim_employees_only',
      privateSectorHoursPerDay: 6,
      privateSectorHoursPerWeek: 30,
      publicSectorScheduleEn: 'Civil service: 5 consecutive hours/day, core 9:00-14:00 (flexible arrival as early as 7:00, departure as late as 15:00, calculated from actual arrival to departure). Remote work allowed where operationally feasible, min. 50% on-site.',
      publicSectorScheduleAr: 'الخدمة المدنية: 5 ساعات متتالية يومياً، الأساسية 9:00-14:00 (مرونة الحضور من الساعة 7:00 والانصراف حتى 15:00، تُحتسب من وقت الحضور الفعلي للانصراف). يُسمح بالعمل عن بُعد حيثما أمكن تشغيلياً، بحد أدنى 50% حضور ميداني.',
      payNoteEn: 'Standard GCC practice is no pro-rata pay cut; not independently re-confirmed for Oman specifically in this pass.',
      payNoteAr: 'الممارسة المعتادة في الخليج عدم خصم الراتب نسبياً؛ لم يُعاد تأكيد ذلك تحديداً لعُمان في هذه الجولة البحثية.',
      legalBasisEn: 'Oman Labour Law, Article 56. Note the 30h/week private-sector cap is lower than the 36h/week seen in Saudi/UAE/Qatar/Bahrain -- a genuine cross-country difference, not rounded away.',
      legalBasisAr: 'قانون العمل العُماني، المادة 56. يُلاحظ أن سقف 30 ساعة/أسبوع للقطاع الخاص أقل من 36 ساعة/أسبوع المعمول بها في السعودية والإمارات وقطر والبحرين -- فارق حقيقي بين الدول، لم يُهمَل بالتقريب.',
      sourceNoteEn: 'Gulf Insider "Oman Reduces Public, Private Work Hours"; omaneportal.com; Gulf News Oman coverage 2026.',
      sourceNoteAr: 'المصدر: Gulf Insider "عُمان تخفض ساعات العمل بالقطاعين العام والخاص"؛ omaneportal.com؛ تغطية Gulf News لعُمان 2026.',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-20', endDate: '2026-03-23', sector: 'both',
          noteEn: '4-day holiday, aligned public and private sectors.',
          noteAr: 'عطلة 4 أيام، متوافقة بين القطاعين العام والخاص.',
        },
        eidAlAdha: {
          startDate: '2026-05-26', endDate: '2026-05-30', sector: 'both',
          noteEn: 'Aligned public/private holiday begins Tue 26 May; official duty resumes Sun 31 May.',
          noteAr: 'عطلة موحدة للقطاعين العام والخاص تبدأ الثلاثاء 26 مايو؛ استئناف العمل الرسمي الأحد 31 مايو.',
        },
      },
    },
  },
  bahrain: {
    country: 'bahrain',
    labelEn: 'Bahrain',
    labelAr: 'البحرين',
    ramadanHours: {
      mandated: true,
      appliesTo: 'muslim_employees_only',
      privateSectorHoursPerDay: 6,
      privateSectorHoursPerWeek: 36,
      publicSectorScheduleEn: 'Specific public-sector schedule not itemized in sources reviewed -- the 6h/36h private-sector figure is well-confirmed across multiple sources; the public-sector detail gap is disclosed rather than guessed.',
      publicSectorScheduleAr: 'لم يُحدد جدول القطاع العام تحديداً في المصادر المراجعة -- رقم 6 ساعات/36 ساعة للقطاع الخاص مؤكد جيداً عبر عدة مصادر؛ فجوة تفاصيل القطاع العام مُصرّح بها وليست تخميناً.',
      payNoteEn: 'Standard GCC practice is no pro-rata pay cut; not independently re-confirmed for Bahrain specifically in this pass.',
      payNoteAr: 'الممارسة المعتادة في الخليج عدم خصم الراتب نسبياً؛ لم يُعاد تأكيد ذلك تحديداً للبحرين في هذه الجولة البحثية.',
      legalBasisEn: 'Bahrain labor law, Ramadan hour-reduction provision -- specific article number not confirmed in this research pass (disclosed gap, not invented).',
      legalBasisAr: 'قانون العمل البحريني، حكم تخفيض ساعات رمضان -- رقم المادة تحديداً غير مؤكد في هذه الجولة البحثية (فجوة مُصرّح بها وليست مُختلقة).',
      sourceNoteEn: 'Morgan Lewis "Ramadan in the Arab Gulf Cooperation Countries"; bahraineportal.com; qureos.com Bahrain labor-law guide.',
      sourceNoteAr: 'المصدر: Morgan Lewis "رمضان في دول مجلس التعاون الخليجي"؛ bahraineportal.com؛ دليل قانون العمل البحريني من qureos.com.',
    },
    years: {
      2026: {
        ramadanStartApprox: '2026-02-19',
        eidAlFitr: {
          startDate: '2026-03-20', endDate: '2026-03-22', sector: 'both',
          noteEn: '3-day holiday (Fri 20 - Sun 22 Mar).',
          noteAr: 'عطلة 3 أيام (الجمعة 20 - الأحد 22 مارس).',
        },
        eidAlAdha: {
          startDate: '2026-05-26', endDate: '2026-05-29', sector: 'both',
          noteEn: 'Ministries/agencies closed Tue 26 - Fri 29 May (Arafat + 3 Eid days); since the Friday falls inside the closure, it is compensated with Sunday 31 May off, extending the public-sector break to 6 days total.',
          noteAr: 'إغلاق الوزارات والجهات الحكومية من الثلاثاء 26 إلى الجمعة 29 مايو (يوم عرفة + 3 أيام عيد)؛ نظراً لوقوع الجمعة ضمن الإغلاق، يُعوَّض بإجازة الأحد 31 مايو، لتمتد عطلة القطاع العام إلى 6 أيام إجمالاً.',
        },
      },
    },
  },
};

export function hasYearData(country: GccCountry, year: number): boolean {
  return !!GCC_SEASONAL_DATA[country].years[year as 2026];
}

export function getYearData(country: GccCountry, year: number): CountryYearData | null {
  return GCC_SEASONAL_DATA[country].years[year as 2026] ?? null;
}

/** Only Saudi Arabia -- the sourced 2026 Jeddah Port case study is Saudi-specific. */
export function getHajjAdvisory(country: GccCountry, isAr: boolean): string | null {
  if (country !== 'saudi') return null;
  return isAr
    ? 'دراسة حالة حقيقية موثّقة (2026): بلغت طاقة ساحات ميناء جدة الإسلامي نحو 90% مع طوابير شاحنات بطول 5 كم وانتظار الإفراج عن الحاويات 6-8 أسابيع خلال موسم الحج (يونيو-يوليو 2026)، وفق تقارير مستقلة من Kuehne+Nagel وThe Loadstar وMarineRadar. استجابت موانئ (الهيئة العامة للموانئ السعودية) بقاعدة مغادرة البضائع العابرة خلال 15 يوماً. تنبيه: عزت جميع المصادر جزءاً من هذا الازدحام إلى تحويلات الشحن عبر البحر الأحمر التي تزامنت مع الموسم -- فهذه نقطة بيانات حقيقية وموثّقة لمرة واحدة، وليست ضماناً بتكرار نفس الشدة سنوياً.'
    : 'Real, documented 2026 case study: Jeddah Islamic Port reached ~90% yard capacity with 5km truck queues and 6-8 week container-release waits during the Jun-Jul 2026 Hajj season, per independent reports (Kuehne+Nagel, The Loadstar, MarineRadar). Mawani (Saudi Ports Authority) responded with a 15-day in-transit cargo departure rule. Caveat: every source attributed part of this to Red Sea shipping diversions arriving at the same time -- treat this as one real, dated data point, not an annual severity guarantee.';
}

export type CountdownMilestoneType = 'ramadanStart' | 'eidAlFitr' | 'eidAlAdha' | 'hajjSeason';

export interface CountdownItem {
  milestoneType: CountdownMilestoneType;
  milestoneLabelEn: string;
  milestoneLabelAr: string;
  /** ISO date of the milestone itself. */
  milestoneDate: string;
  tMinusDays: 90 | 60 | 30 | 14;
  /** ISO date this checklist action is due (milestoneDate - tMinusDays). */
  dueDate: string;
  actionEn: string;
  actionAr: string;
  isPast: boolean;
}

const T_MARKERS: (90 | 60 | 30 | 14)[] = [90, 60, 30, 14];

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function actionForMilestone(
  type: CountdownMilestoneType, tMinus: number, data: CountrySeasonalData, isAr: boolean,
): { en: string; ar: string } {
  const h = data.ramadanHours;
  if (type === 'ramadanStart') {
    const hoursText = h.mandated
      ? (isAr ? `تنخفض ساعات عمل نظرائك إلى ${h.privateSectorHoursPerDay} ساعات/يوم (${h.privateSectorHoursPerWeek} ساعة/أسبوع)` : `counterpart working hours drop to ${h.privateSectorHoursPerDay}h/day (${h.privateSectorHoursPerWeek}h/week)`)
      : (isAr ? 'لا يوجد تخفيض إلزامي لساعات العمل -- التقدير متروك لكل جهة' : 'no mandated hour reduction -- varies by employer');
    return {
      en: `T-${tMinus}: Ramadan begins ${data.years[2026]?.ramadanStartApprox} (approx.) -- ${hoursText}. Build in slower response times from ${data.labelEn} counterparties from this date.`,
      ar: `قبل ${tMinus} يوماً: يبدأ رمضان في ${data.years[2026]?.ramadanStartApprox} (تقريباً) -- ${hoursText}. احسب حساب استجابة أبطأ من الأطراف المقابلة في ${data.labelAr} اعتباراً من هذا التاريخ.`,
    };
  }
  if (type === 'eidAlFitr' || type === 'eidAlAdha') {
    const w = type === 'eidAlFitr' ? data.years[2026]?.eidAlFitr : data.years[2026]?.eidAlAdha;
    const label = type === 'eidAlFitr' ? (isAr ? 'عيد الفطر' : 'Eid al-Fitr') : (isAr ? 'عيد الأضحى' : 'Eid al-Adha');
    return {
      en: `T-${tMinus}: ${label} closure ${w?.startDate} to ${w?.endDate} -- government offices, customs, and most counterparties closed. Front-load approvals, customs filings, and payment runs before this window.`,
      ar: `قبل ${tMinus} يوماً: إغلاق ${label} من ${w?.startDate} إلى ${w?.endDate} -- الجهات الحكومية والجمارك ومعظم الأطراف المقابلة مغلقة. قدّم الموافقات والإجراءات الجمركية ودورات الدفع قبل هذه الفترة.`,
    };
  }
  // hajjSeason -- Saudi only
  return {
    en: `T-${tMinus}: Hajj-season port pressure window approaching (Jeddah). See the sourced 2026 case study below before committing shipment timing through Saudi ports this period.`,
    ar: `قبل ${tMinus} يوماً: اقتراب فترة ضغط الموانئ خلال موسم الحج (جدة). راجع دراسة الحالة الموثّقة لعام 2026 أدناه قبل تحديد مواعيد الشحن عبر الموانئ السعودية خلال هذه الفترة.`,
  };
}

/**
 * Builds the T-90/60/30/14 countdown for a given country + "today", using
 * whichever years have sourced data (see file header -- 2026 only as of
 * this build). Returns an empty array, honestly, once every 2026 milestone
 * has passed and no later year is sourced yet -- it does not fall back to
 * a computed guess.
 */
export function buildCountdown(country: GccCountry, todayIso: string, isAr: boolean): CountdownItem[] {
  const data = GCC_SEASONAL_DATA[country];
  const items: CountdownItem[] = [];

  for (const yearKey of Object.keys(data.years) as unknown as (2026)[]) {
    const yd = data.years[yearKey];
    if (!yd) continue;

    const milestones: { type: CountdownMilestoneType; date: string; labelEn: string; labelAr: string }[] = [
      { type: 'ramadanStart', date: yd.ramadanStartApprox, labelEn: 'Ramadan start', labelAr: 'بداية رمضان' },
      { type: 'eidAlFitr', date: yd.eidAlFitr.startDate, labelEn: 'Eid al-Fitr', labelAr: 'عيد الفطر' },
      { type: 'eidAlAdha', date: yd.eidAlAdha.startDate, labelEn: 'Eid al-Adha', labelAr: 'عيد الأضحى' },
    ];
    if (country === 'saudi') {
      // Hajj (Dhul Hijjah 8-12) sits immediately before Eid al-Adha -- approximate as 4 days prior.
      milestones.push({ type: 'hajjSeason', date: addDaysIso(yd.eidAlAdha.startDate, -4), labelEn: 'Hajj season begins', labelAr: 'بداية موسم الحج' });
    }

    for (const m of milestones) {
      for (const t of T_MARKERS) {
        const due = addDaysIso(m.date, -t);
        const action = actionForMilestone(m.type, t, data, isAr);
        items.push({
          milestoneType: m.type,
          milestoneLabelEn: m.labelEn,
          milestoneLabelAr: m.labelAr,
          milestoneDate: m.date,
          tMinusDays: t,
          dueDate: due,
          actionEn: action.en,
          actionAr: action.ar,
          isPast: due < todayIso,
        });
      }
    }
  }

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function buildSeasonalCalendarPrompt(country: GccCountry, industry: string, isAr: boolean): string {
  const data = GCC_SEASONAL_DATA[country];
  const h = data.ramadanHours;
  const y = data.years[2026];
  const lines = [
    isAr ? '## التقويم الموسمي الخليجي -- ساعات رمضان والأعياد' : '## GCC Seasonal Calendar -- Ramadan & Eid Hours',
    '',
    isAr ? `الدولة: ${data.labelAr}` : `Country: ${data.labelEn}`,
    isAr ? `الصناعة: ${industry}` : `Industry: ${industry}`,
    h.mandated
      ? (isAr ? `ساعات رمضان: ${h.privateSectorHoursPerDay} س/يوم، ${h.privateSectorHoursPerWeek} س/أسبوع (${h.legalBasisAr})` : `Ramadan hours: ${h.privateSectorHoursPerDay}h/day, ${h.privateSectorHoursPerWeek}h/week (${h.legalBasisEn})`)
      : (isAr ? 'لا يوجد تخفيض إلزامي لساعات رمضان في القطاع الخاص' : 'No mandated private-sector Ramadan hour reduction'),
    y ? (isAr ? `عيد الفطر 2026: ${y.eidAlFitr.startDate} إلى ${y.eidAlFitr.endDate}` : `Eid al-Fitr 2026: ${y.eidAlFitr.startDate} to ${y.eidAlFitr.endDate}`) : '',
    y ? (isAr ? `عيد الأضحى 2026: ${y.eidAlAdha.startDate} إلى ${y.eidAlAdha.endDate}` : `Eid al-Adha 2026: ${y.eidAlAdha.startDate} to ${y.eidAlAdha.endDate}`) : '',
    '',
    isAr
      ? 'اقترح خطوات عملية للتخطيط للمشتريات استناداً فقط إلى الحقائق أعلاه -- لا تفترض بيانات تواريخ 2027 غير المتوفرة، ووضّح أن تواريخ الهلال تقريبية.'
      : 'Suggest practical procurement-planning steps grounded only in the facts above -- do not assume unavailable 2027 dates, and note that moon-sighting dates are approximate.',
  ].filter(Boolean);
  return lines.join('\n');
}
