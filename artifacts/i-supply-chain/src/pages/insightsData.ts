/**
 * Insights article data.
 *
 * ALLOWED AUTHORS
 * ───────────────
 * Every `author` field must be one of the values in ALLOWED_INSIGHT_AUTHORS.
 * A CI test (src/pages/__tests__/InsightsAuthors.test.ts) enforces this so that
 * new articles cannot introduce unrecognised names silently.
 *
 * To add a new real team member, add their name to ALLOWED_INSIGHT_AUTHORS first.
 */

/** Names that may appear as an article author. */
export const ALLOWED_INSIGHT_AUTHORS = [
  'Maen Haqash',
  'ISC Editorial Team',
] as const;

export type AllowedInsightAuthor = (typeof ALLOWED_INSIGHT_AUTHORS)[number];

export const articles = [
  {
    id: 7,
    title: "IKTVA at 70%: What Aramco's Local-Content Milestone Means for the Next Phase of Supplier Qualification",
    titleAr: "اكتفاء عند 70%: ماذا يعني إنجاز أرامكو للمحتوى المحلي للمرحلة القادمة من تأهيل المورّدين؟",
    category: "GCC Policy",
    readTime: "6 min read",
    readTimeAr: "قراءة 6 دقائق",
    date: "May 2026",
    dateAr: "مايو 2026",
    excerpt: "Aramco's IKTVA programme has reached its 70% local-content target and set a new 75% goal for 2030. For suppliers across the Kingdom's energy, construction, and logistics sectors, the milestone changes what 'compliant' actually means going forward.",
    excerptAr: "بلغ برنامج اكتفاء التابع لأرامكو هدفه في تحقيق 70% من المحتوى المحلي، ووضع هدفاً جديداً بـ75% بحلول 2030. وبالنسبة للمورّدين في قطاعات الطاقة والإنشاءات والخدمات اللوجستية بالمملكة، يُغيّر هذا الإنجاز ما يعنيه \"الامتثال\" فعلياً في المرحلة المقبلة.",
    body: `Aramco confirmed in early 2026 that its In-Kingdom Total Value Add (IKTVA) programme has reached its initial 70% local-content target across the company's supply chains — a milestone that has added more than $280 billion to the Saudi economy and supported over 200,000 direct and indirect jobs since the programme's launch. A new target of 75% localisation by 2030 has now been set, extending a trajectory that has been tightening steadily since IKTVA's introduction.

For procurement and supply chain leaders, the practical implication is less about the headline number and more about what it signals: localisation targets in Saudi Arabia are not static compliance thresholds that, once met, stay fixed. They ratchet upward, and the qualification bar for "local content" — verified Saudi ownership, manufacturing presence, workforce composition, and reinvestment — tends to tighten alongside the target itself. Suppliers who treated their current IKTVA score as a finished project rather than a moving baseline are likely to find themselves falling behind as the 75% goalpost approaches.

The organisations best positioned for the next phase are those already building supplier development capability rather than simply sourcing pre-qualified local vendors: co-investment in local manufacturing capacity, structured technology transfer, and long-term workforce Saudization plans that go beyond headcount to actual skills development. As IKTVA's scope has expanded well beyond Aramco's own direct ecosystem — influencing procurement expectations across the broader energy, construction, and industrial sectors — the programme has effectively become the reference model for what "localisation done well" looks like across Vision 2030-aligned industries.`,
    bodyAr: `أكدت أرامكو في مطلع عام 2026 أن برنامج القيمة المضافة المحلية الشامل (اكتفاء) بلغ هدفه الأولي المتمثل في 70% من المحتوى المحلي عبر سلاسل إمداد الشركة — وهو إنجاز أسهم بأكثر من 280 مليار دولار في الاقتصاد السعودي ودعم أكثر من 200,000 وظيفة مباشرة وغير مباشرة منذ إطلاق البرنامج. وتم الآن تحديد هدف جديد بنسبة 75% للتوطين بحلول 2030، في استمرار لمسار كان يتشدّد باطّراد منذ إطلاق اكتفاء.

بالنسبة لقادة المشتريات وسلسلة الإمداد، فإن الأثر العملي لا يكمن كثيراً في الرقم بحد ذاته، بل فيما يدل عليه: أهداف التوطين في المملكة العربية السعودية ليست عتبات امتثال ثابتة تبقى كما هي بمجرد تحقيقها، بل ترتفع تدريجياً، وغالباً ما يتشدّد سقف تأهيل "المحتوى المحلي" — من ملكية سعودية موثّقة، وحضور تصنيعي، وتركيبة قوى عاملة، وإعادة استثمار — بالتوازي مع ارتفاع الهدف نفسه. والمورّدون الذين تعاملوا مع درجة اكتفاء الحالية كمشروع مُنجَز لا كخط أساس متحرّك، مرشّحون للتخلف عن الركب مع اقتراب هدف الـ75%.

والمنشآت الأفضل استعداداً للمرحلة القادمة هي تلك التي تبني بالفعل قدرات تطوير المورّدين بدلاً من الاكتفاء بالتوريد من بائعين محليين مؤهّلين مسبقاً: من خلال الاستثمار المشترك في القدرة التصنيعية المحلية، ونقل التقنية المنظّم، وخطط توطين طويلة الأمد تتجاوز مجرد أعداد التوظيف إلى تطوير المهارات الفعلي. ومع توسّع نطاق اكتفاء ليتجاوز منظومة أرامكو المباشرة — والتأثير في توقعات المشتريات عبر قطاعات الطاقة والإنشاءات والصناعة الأوسع — أصبح البرنامج فعلياً النموذج المرجعي لما يعنيه "التوطين المُنفَّذ بشكل صحيح" عبر الصناعات المتوافقة مع رؤية 2030.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-amber-600",
    featured: false,
  },
  {
    id: 8,
    title: "From Insight to Action: What AI Agents in Procurement Actually Do in 2026",
    titleAr: "من الرؤية إلى الفعل: ماذا يفعل الوكلاء الذكيّون في المشتريات فعلياً في 2026؟",
    category: "Technology",
    readTime: "7 min read",
    readTimeAr: "قراءة 7 دقائق",
    date: "July 2026",
    dateAr: "يوليو 2026",
    excerpt: "Procurement's AI conversation has shifted from dashboards and forecasts to systems that draft, negotiate, and execute. Here's what that shift actually looks like inside a mid-sized organisation — and where the human still has to stay in the loop.",
    excerptAr: "انتقل الحديث عن الذكاء الاصطناعي في المشتريات من لوحات المعلومات والتوقعات إلى أنظمة تصيغ وتفاوض وتُنفّذ. إليكم كيف يبدو هذا التحوّل فعلياً داخل مؤسسة متوسطة الحجم — وأين يجب أن يبقى الإنسان جزءاً من الحلقة.",
    body: `For years, "AI in procurement" meant better dashboards: spend visibility, demand forecasts, supplier scorecards that updated themselves. That era is ending. By 2026, the more consequential shift is agentic — AI systems embedded directly in procurement workflows that draft contract language, generate negotiation recommendations, and execute routine renewals within pre-approved policy limits, without a human touching every step. Industry surveys now put weekly generative AI use among procurement executives at 94%, up 44 percentage points in a single year.

What's notable is not the enthusiasm — that's been present since 2023 — but the gap between it and actual adoption. Procurement still accounts for only around 6% of enterprise AI use cases, the lowest of any major business function tracked by BCG. The reason isn't a lack of ambition; it's that procurement data is messier and more fragmented than almost any other function's, spread across ERP systems, supplier portals, contract repositories, and email threads that were never designed to talk to each other. Agentic AI amplifies whatever data quality already exists — it does not fix bad data on its own.

The organisations actually capturing value are the ones that resisted the instinct to automate everything at once. They started with narrow, high-confidence use cases — spend classification, invoice matching, first-pass supplier risk scoring — where an AI error is cheap to catch and correct, and kept a human explicitly in the approval loop for anything with real commercial or contractual consequence. That discipline, not the sophistication of the model, is what separates procurement teams that are genuinely faster in 2026 from the ones still waiting for AI to "figure it out."`,
    bodyAr: `لسنوات، كان مفهوم "الذكاء الاصطناعي في المشتريات" يعني لوحات معلومات أفضل: رؤية للإنفاق، وتوقعات للطلب، وبطاقات أداء للمورّدين تُحدَّث تلقائياً. تلك المرحلة تقترب من نهايتها. فبحلول 2026، أصبح التحوّل الأكثر أهمية "وكيلياً" — أنظمة ذكاء اصطناعي مدمجة مباشرة في مهام سير عمل المشتريات، تصيغ بنود العقود، وتولّد توصيات التفاوض، وتُنفّذ عمليات التجديد الروتينية ضمن حدود سياسات مُعتمَدة مسبقاً، دون تدخّل بشري في كل خطوة. وتشير الاستطلاعات القطاعية الآن إلى أن الاستخدام الأسبوعي للذكاء الاصطناعي التوليدي بين مسؤولي المشتريات بلغ 94%، بزيادة 44 نقطة مئوية خلال عام واحد فقط.

واللافت ليس الحماس — فهو موجود منذ 2023 — بل الفجوة بينه وبين التبنّي الفعلي. إذ لا تزال المشتريات تمثّل نحو 6% فقط من حالات استخدام الذكاء الاصطناعي المؤسسي، وهي الأدنى بين جميع وظائف الأعمال الرئيسية التي رصدتها BCG. والسبب ليس نقص الطموح، بل أن بيانات المشتريات أكثر تشتتاً وفوضوية من بيانات أي وظيفة أخرى تقريباً، موزّعة بين أنظمة تخطيط الموارد المؤسسية، وبوابات المورّدين، ومستودعات العقود، وسلاسل البريد الإلكتروني التي لم تُصمَّم أصلاً للتواصل فيما بينها. والذكاء الاصطناعي الوكيلي يُضخّم جودة البيانات القائمة أياً كانت — ولا يُصلح البيانات الرديئة من تلقاء نفسه.

والمؤسسات التي تحقّق قيمة فعلية هي تلك التي قاومت غريزة أتمتة كل شيء دفعة واحدة. فقد بدأت بحالات استخدام ضيّقة النطاق وعالية الثقة — تصنيف الإنفاق، مطابقة الفواتير، التقييم الأولي لمخاطر المورّدين — حيث يكون تصحيح خطأ الذكاء الاصطناعي فيها منخفض الكلفة، وأبقت الإنسان جزءاً صريحاً من حلقة الموافقة على أي قرار ذي أثر تجاري أو تعاقدي حقيقي. وهذا الانضباط، لا تطوّر النموذج، هو ما يميّز فرق المشتريات الأسرع فعلياً في 2026 عن تلك التي لا تزال تنتظر من الذكاء الاصطناعي أن "يتدبّر الأمر" بنفسه.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    authorTitleAr: "المؤسّس وكبير الاستشاريين",
    bgColor: "bg-teal-600",
    featured: false,
  },
  {
    id: 9,
    title: "Tariff Volatility and the Regional Reset: What 2026's Trade Fragmentation Means for Sourcing Strategy",
    titleAr: "تقلبات التعريفات الجمركية وإعادة التموضع الإقليمي: ماذا يعني تفتّت التجارة في 2026 لاستراتيجية التوريد؟",
    category: "Strategy",
    readTime: "6 min read",
    readTimeAr: "قراءة 6 دقائق",
    date: "June 2026",
    dateAr: "يونيو 2026",
    excerpt: "Tariff volatility has overtaken almost every other regulatory risk on procurement leaders' radar in 2026. The response reshaping sourcing strategy isn't reshoring — it's a harder-edged regional diversification.",
    excerptAr: "تجاوزت تقلبات التعريفات الجمركية كل المخاطر التنظيمية الأخرى تقريباً على رادار قادة المشتريات في 2026. والاستجابة التي تُعيد تشكيل استراتيجية التوريد ليست إعادة التصنيع محلياً، بل تنويعاً إقليمياً أكثر حدّة.",
    body: `Tariff volatility has moved from a background planning risk to the single most disruptive force procurement leaders are managing in 2026. A February 2026 survey of 225 senior trade professionals found 72% now name U.S. tariff volatility the most impactful regulatory change of the year — sharply up from 41% who said the same just twelve months earlier. Eighty-two percent of surveyed organisations report their supply chains have been directly affected, and 39% are absorbing higher supplier and material costs as a direct result.

What's changing structurally is not just cost, but geography. The three major trading circles — East Asia, North America, and Europe — are hardening into more independent regional blocs, with global trade increasingly organised around regional rather than global optimisation. Despite the disruption, global trade volumes have not collapsed: both US imports and Chinese exports have reached new highs even as tariff regimes tighten, meaning the story is realignment rather than retreat.

For procurement and sourcing leaders operating in or through the GCC, the practical response most organisations are converging on is multi-sourcing paired with regional inventory positioning — treating "which region" as a first-order sourcing decision rather than an afterthought to unit cost. Companies that invested in supply chain visibility and scenario-planning tools during the pandemic years are, by most accounts, weathering 2026's volatility considerably better than those now scrambling to build that capability from scratch.`,
    bodyAr: `انتقلت تقلبات التعريفات الجمركية من كونها مخاطرة تخطيطية في الخلفية إلى أكثر القوى تعطيلاً التي يديرها قادة المشتريات في 2026. فقد كشف استطلاع أُجري في فبراير 2026 شمل 225 من كبار المتخصصين في التجارة أن 72% منهم يعتبرون الآن تقلّب التعريفات الجمركية الأمريكية أكثر التغيّرات التنظيمية تأثيراً هذا العام — بارتفاع حاد من 41% قالوا الأمر ذاته قبل اثني عشر شهراً فقط. وأفادت 82% من المؤسسات المشمولة بالاستطلاع بأن سلاسل إمدادها تأثّرت بشكل مباشر، فيما استوعبت 39% منها ارتفاعاً في تكاليف المورّدين والمواد كنتيجة مباشرة لذلك.

والتغيّر البنيوي الحقيقي لا يقتصر على الكلفة، بل يمتد إلى الجغرافيا. فالتكتلات التجارية الكبرى الثلاثة — شرق آسيا، وأمريكا الشمالية، وأوروبا — تتجه نحو الاستقلالية بشكل متزايد، مع تنظيم التجارة العالمية حول التحسين الإقليمي أكثر من التحسين العالمي. ورغم هذا الاضطراب، لم تنهَر أحجام التجارة العالمية: إذ سجّلت كل من الواردات الأمريكية والصادرات الصينية مستويات قياسية جديدة حتى مع تشدّد أنظمة التعريفات الجمركية، ما يعني أن القصة هي إعادة تموضع لا انكماش.

وبالنسبة لقادة المشتريات والتوريد العاملين في منطقة الخليج أو عبرها، فإن الاستجابة العملية التي تتقارب حولها معظم المؤسسات هي الجمع بين تعدد مصادر التوريد والتموضع الإقليمي للمخزون — بمعاملة "أي منطقة" كقرار توريد من الدرجة الأولى بدلاً من اعتباره تفصيلاً ثانوياً بعد تكلفة الوحدة. والشركات التي استثمرت في أدوات رؤية سلسلة الإمداد والتخطيط للسيناريوهات خلال سنوات الجائحة تتجاوز، بحسب معظم التقديرات، اضطرابات 2026 بشكل أفضل بكثير من تلك التي تسعى الآن لبناء هذه القدرة من الصفر.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-rose-600",
    featured: false,
  },
  {
    id: 10,
    title: "From Reactive to Predictive: The 2026 Shift in Supplier Risk Management",
    titleAr: "من التفاعل إلى التنبؤ: التحوّل في إدارة مخاطر المورّدين لعام 2026",
    category: "Risk",
    readTime: "6 min read",
    readTimeAr: "قراءة 6 دقائق",
    date: "August 2026",
    dateAr: "أغسطس 2026",
    excerpt: "Supplier risk management is no longer about reacting faster to disruptions after they happen. In 2026, the leading organisations are building the data foundations to see risk coming — across geopolitical, cyber, climate, and regulatory dimensions at once.",
    excerptAr: "لم تعد إدارة مخاطر المورّدين تتعلق بالتفاعل الأسرع مع الاضطرابات بعد وقوعها. ففي 2026، تبني المؤسسات الرائدة الأسس البيانية لرؤية المخاطر قبل حدوثها — عبر الأبعاد الجيوسياسية والسيبرانية والمناخية والتنظيمية في آنٍ واحد.",
    body: `Supplier risk management has spent the last two decades largely reactive: a disruption occurs, the organisation scrambles to assess exposure, and a mitigation plan follows after the fact. That model is giving way in 2026 to something more deliberately predictive. New industry research finds 42% of risk leaders now believe AI alone can reduce third-party financial exposure by at least 20%, and by 2031 an estimated 60% of supply chain disruptions are expected to be resolved without human intervention at all — a trajectory that starts with the predictive tooling organisations are building today.

The shift is multi-dimensional by necessity. Sixty-five percent of large companies now name third-party and supply-chain vulnerabilities a leading cybersecurity challenge, while extreme weather events — floods, droughts, heatwaves, storms — are increasingly cited as a source of cascading delays across interconnected supplier networks. Geopolitical, cyber, climate, and regulatory risk used to be tracked in separate spreadsheets, owned by separate teams, reviewed on separate cycles. Predictive risk management treats them as one integrated view of a single supplier relationship, because in practice they compound rather than occur in isolation.

None of this works without a foundation most organisations still underinvest in: data quality. Predictive models are only as reliable as the supplier master data, spend history, and performance records feeding them — and for many procurement functions, that data still lives across disconnected ERP systems, supplier portals, and manually maintained spreadsheets. The organisations moving fastest toward genuinely predictive risk management are, almost without exception, the ones that treated data consolidation as the first project rather than an afterthought to the AI layer sitting on top of it.`,
    bodyAr: `أمضت إدارة مخاطر المورّدين العقدين الماضيين في نمط تفاعلي إلى حد كبير: يقع الاضطراب، فتُسارع المؤسسة لتقييم التعرّض له، وتتبع ذلك خطة تخفيف لاحقة. وهذا النموذج يتراجع في 2026 لصالح نهج أكثر تنبؤاً بشكل متعمّد. تُظهر أبحاث صناعية جديدة أن 42% من قادة إدارة المخاطر يرون الآن أن الذكاء الاصطناعي وحده قادر على خفض التعرّض المالي لمخاطر الأطراف الثالثة بنسبة 20% على الأقل، ومن المتوقع بحلول 2031 أن يُحلّ نحو 60% من اضطرابات سلسلة الإمداد دون أي تدخّل بشري على الإطلاق — وهو مسار يبدأ بأدوات التنبؤ التي تبنيها المؤسسات اليوم.

والتحوّل متعدد الأبعاد بالضرورة. إذ تُصنّف 65% من الشركات الكبرى الآن نقاط ضعف الأطراف الثالثة وسلسلة الإمداد ضمن أبرز تحدياتها في الأمن السيبراني، فيما يُشار بشكل متزايد إلى الظواهر الجوية المتطرفة — الفيضانات والجفاف وموجات الحر والعواصف — كمصدر لتأخيرات متسلسلة عبر شبكات المورّدين المترابطة. وكانت مخاطر الجغرافيا السياسية والأمن السيبراني والمناخ والتنظيم تُتابَع سابقاً في جداول بيانات منفصلة، تملكها فرق مختلفة، وتُراجَع بدورات مختلفة. أما إدارة المخاطر التنبؤية فتتعامل معها كرؤية واحدة متكاملة لعلاقة مورّد واحدة، لأنها في الواقع الفعلي تتراكم ولا تحدث بمعزل عن بعضها.

ولا شيء من هذا يعمل دون أساس لا تزال معظم المؤسسات تستثمر فيه بشكل غير كافٍ: جودة البيانات. فالنماذج التنبؤية لا تكون موثوقة إلا بقدر موثوقية بيانات المورّدين الأساسية، وسجل الإنفاق، وسجلات الأداء التي تُغذّيها — وبالنسبة لكثير من وظائف المشتريات، لا تزال هذه البيانات موزّعة بين أنظمة تخطيط موارد مؤسسية منفصلة، وبوابات مورّدين، وجداول بيانات تُدار يدوياً. والمؤسسات الأسرع تقدّماً نحو إدارة مخاطر تنبؤية حقيقية هي، بلا استثناء تقريباً، تلك التي تعاملت مع توحيد البيانات كمشروع أول وليس كتفصيل لاحق لطبقة الذكاء الاصطناعي التي تُبنى فوقه.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-violet-600",
    featured: false,
  },
  {
    id: 1,
    title: "Vision 2030 and the Transformation of Saudi Supply Chains",
    titleAr: "رؤية 2030 وتحوّل سلاسل الإمداد السعودية",
    category: "GCC Policy",
    readTime: "8 min read",
    readTimeAr: "قراءة 8 دقائق",
    date: "July 2025",
    dateAr: "يوليو 2025",
    excerpt: "Saudi Arabia's Vision 2030 is not merely an economic diversification programme — it is a fundamental restructuring of how goods and services flow across the Kingdom. Understanding the supply chain implications is essential for any organisation operating in the Saudi market.",
    excerptAr: "رؤية المملكة 2030 ليست مجرد برنامج للتنويع الاقتصادي، بل هي إعادة هيكلة جوهرية لطريقة تدفّق السلع والخدمات عبر المملكة. وفهم انعكاسات ذلك على سلسلة الإمداد أمرٌ ضروري لأي منشأة تعمل في السوق السعودي.",
    body: `Saudi Arabia's Vision 2030 is reshaping supply chain infrastructure at every level. The programme's localisation mandate — through the Iktva framework in energy, the Nitaqat programme in labour, and the broader In-Kingdom Total Value Add requirements across sectors — is forcing organisations to fundamentally rethink their supplier base.

For procurement leaders, the primary implication is clear: single-source foreign supply arrangements that were once commercially optimal are now legally and reputationally risky. The government has signalled that procurement from local suppliers will be a prerequisite for participation in major government contracts, particularly in construction, energy, healthcare, and logistics.

The opportunity, however, is equally significant. Organisations that invest now in developing compliant, high-quality local supplier relationships will gain a structural competitive advantage as the localisation requirements tighten. The procurement function has moved from a cost centre to a strategic lever for Vision 2030 compliance and national competitiveness.`,
    bodyAr: `تُعيد رؤية المملكة 2030 تشكيل البنية التحتية لسلاسل الإمداد على كل المستويات. فمتطلبات المحتوى المحلي — عبر برنامج Iktva في قطاع الطاقة، وبرنامج نطاقات في سوق العمل، ومتطلبات القيمة المضافة المحلية الأوسع عبر القطاعات — تدفع المنشآت إلى إعادة النظر جذرياً في قاعدة مورّديها.

بالنسبة لقادة المشتريات، فإن الأثر الأساسي واضح: ترتيبات التوريد الأجنبي أحادي المصدر التي كانت مثالية تجارياً في السابق أصبحت الآن محفوفة بالمخاطر قانونياً وسُمعياً. وقد أشارت الحكومة إلى أن الشراء من المورّدين المحليين سيكون شرطاً للمشاركة في العقود الحكومية الكبرى، ولا سيّما في قطاعات الإنشاءات والطاقة والرعاية الصحية والخدمات اللوجستية.

غير أن الفرصة لا تقل أهمية. فالمنشآت التي تستثمر الآن في تطوير علاقات مع مورّدين محليين متوافقين وعاليي الجودة ستكتسب ميزة تنافسية هيكلية مع تشديد متطلبات المحتوى المحلي. لقد انتقلت وظيفة المشتريات من مركز تكلفة إلى رافعة استراتيجية للامتثال لرؤية 2030 وتعزيز التنافسية الوطنية.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    authorTitleAr: "المؤسّس وكبير الاستشاريين",
    bgColor: "bg-blue-600",
    featured: true,
  },
  {
    id: 2,
    title: "The Hidden Cost of Poor Contract Lifecycle Management",
    titleAr: "التكلفة الخفية لضعف إدارة دورة حياة العقود",
    category: "Procurement",
    readTime: "6 min read",
    readTimeAr: "قراءة 6 دقائق",
    date: "June 2025",
    dateAr: "يونيو 2025",
    excerpt: "Most organisations underestimate the financial exposure created by poor contract management. Research consistently shows that weak CLM processes cost organisations between 5% and 40% of contract value — a staggering figure that few CFOs have quantified.",
    excerptAr: "تستهين معظم المنشآت بالانكشاف المالي الناتج عن ضعف إدارة العقود. وتُظهر الأبحاث باستمرار أن ضعف عمليات إدارة دورة حياة العقود (CLM) يكلّف المنشآت ما بين 5% و40% من قيمة العقد — وهو رقم مذهل قلّما قام أي مدير مالي بقياسه.",
    body: `The financial cost of poor contract lifecycle management is rarely visible on a balance sheet, but it is everywhere in an organisation's operations. Missed renewal windows that trigger automatic rollovers at unfavourable terms. Supplier invoices that exceed contracted rates because no one is enforcing the SLA. Liability clauses that were never negotiated and now expose the organisation to unlimited risk.

A well-structured CLM function does three things that generate immediate financial value. First, it creates a single source of truth for all contractual obligations, so nothing falls through the gap between legal, procurement, and operations. Second, it automates milestone alerts — renewal dates, notice periods, performance reviews — so the organisation is always acting proactively rather than reactively. Third, it creates a negotiation memory: over time, you build institutional knowledge about which clauses your suppliers resist, which concessions they will make, and where the leverage lies.

The starting point is not software. It is a structured contract register, a clear ownership model, and defined SLA monitoring intervals. With those three elements in place, most organisations recover 3–8% of contract value within the first year.`,
    bodyAr: `نادراً ما تظهر التكلفة المالية لضعف إدارة دورة حياة العقود في الميزانية العمومية، لكنها حاضرة في كل تفاصيل عمليات المنشأة: نوافذ تجديد فائتة تؤدي إلى تمديد تلقائي بشروط غير مواتية، وفواتير مورّدين تتجاوز الأسعار المتعاقد عليها لأن لا أحد يُطبّق اتفاقية مستوى الخدمة (SLA)، وبنود مسؤولية لم يجرِ التفاوض عليها قط وباتت تُعرّض المنشأة لمخاطر غير محدودة.

تؤدي وظيفة إدارة العقود المُحكمة ثلاثة أمور تُحقّق قيمة مالية فورية. أولاً، تُنشئ مصدراً موحّداً للحقيقة لكل الالتزامات التعاقدية، فلا يسقط شيء بين الشؤون القانونية والمشتريات والعمليات. ثانياً، تُؤتمت تنبيهات المحطات الرئيسية — تواريخ التجديد ومهل الإشعار ومراجعات الأداء — بحيث تتصرّف المنشأة استباقياً لا رَدّياً. ثالثاً، تُنشئ ذاكرة تفاوضية: فمع الوقت تتراكم معرفة مؤسسية حول البنود التي يقاومها مورّدوك، والتنازلات التي سيقدّمونها، ومواطن القوة التفاوضية.

نقطة الانطلاق ليست البرمجيات، بل سجلّ عقود مُنظّم، ونموذج ملكية واضح، وفترات محدّدة لمراقبة اتفاقيات مستوى الخدمة. وبتوفّر هذه العناصر الثلاثة، تستردّ معظم المنشآت 3–8% من قيمة العقد خلال العام الأول.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    authorTitleAr: "المؤسّس وكبير الاستشاريين",
    bgColor: "bg-purple-600",
    featured: false,
  },
  {
    id: 3,
    title: "Building Supply Chain Resilience: Lessons from GCC Disruptions",
    titleAr: "بناء مرونة سلسلة الإمداد: دروس من اضطرابات الخليج",
    category: "Risk",
    readTime: "7 min read",
    readTimeAr: "قراءة 7 دقائق",
    date: "May 2025",
    dateAr: "مايو 2025",
    excerpt: "The past five years have stress-tested supply chains in ways that no risk model fully anticipated. Port congestion, single-source failures, geopolitical disruptions, and pandemic aftershocks have revealed fundamental structural vulnerabilities.",
    excerptAr: "وضعت السنوات الخمس الماضية سلاسل الإمداد تحت ضغط اختبارات لم يتوقّعها أي نموذج مخاطر بالكامل. فقد كشف ازدحام الموانئ وإخفاقات المصدر الأحادي والاضطرابات الجيوسياسية وتداعيات الجائحة عن مواطن ضعف هيكلية جوهرية.",
    body: `The organisations that navigated recent supply chain disruptions with the least damage shared a common characteristic: they had invested in redundancy before they needed it. Dual-sourcing arrangements, pre-qualified contingency suppliers, and buffer stock strategies that seemed like expensive over-engineering in 2019 proved to be decisive competitive advantages by 2022.

For GCC operators, the resilience challenge has a specific regional dimension. The concentration of global shipping through key chokepoints — Suez Canal, Strait of Hormuz, and key Arabian Peninsula ports — creates geographic risk that cannot be fully diversified away. Supply chain resilience in this context means building relationships and contracts that provide flexibility, not just redundancy.

The practical framework we recommend has three levels. At the strategic level, conduct a full supply chain risk mapping exercise that identifies single-source dependencies and geographic concentrations. At the operational level, negotiate business continuity provisions into all strategic supplier contracts, including pre-agreed response times and escalation protocols. At the tactical level, maintain a living vendor list of pre-qualified alternative suppliers that can be activated within 48–72 hours.`,
    bodyAr: `اشتركت المنشآت التي تجاوزت اضطرابات سلسلة الإمداد الأخيرة بأقل الأضرار في سمة واحدة: استثمرت في التكرار والاحتياط قبل الحاجة إليه. فترتيبات التوريد الثنائي، والمورّدون البديلون المؤهّلون مسبقاً، واستراتيجيات المخزون الاحتياطي التي بدت في 2019 مبالغةً هندسية مكلفة، أثبتت بحلول 2022 أنها مزايا تنافسية حاسمة.

بالنسبة للمنشآت العاملة في الخليج، ينطوي تحدي المرونة على بُعد إقليمي محدّد. فتركّز الشحن العالمي عبر نقاط اختناق رئيسية — قناة السويس ومضيق هرمز وموانئ شبه الجزيرة العربية الرئيسية — يخلق مخاطر جغرافية لا يمكن تنويعها بالكامل. ومرونة سلسلة الإمداد في هذا السياق تعني بناء علاقات وعقود توفّر المرونة، لا مجرد التكرار.

يتألف الإطار العملي الذي نوصي به من ثلاثة مستويات. على المستوى الاستراتيجي، أجرِ تمريناً كاملاً لرسم خرائط مخاطر سلسلة الإمداد يحدّد الاعتماديات أحادية المصدر والتركّزات الجغرافية. وعلى المستوى التشغيلي، تفاوض على أحكام استمرارية الأعمال في جميع عقود المورّدين الاستراتيجيين، بما في ذلك أزمنة استجابة وبروتوكولات تصعيد متفق عليها مسبقاً. وعلى المستوى التكتيكي، حافظ على قائمة مورّدين بديلين مؤهّلين مسبقاً يمكن تفعيلهم خلال 48–72 ساعة.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-red-600",
    featured: false,
  },
  {
    id: 4,
    title: "AI in Procurement: What Actually Works for SMEs",
    titleAr: "الذكاء الاصطناعي في المشتريات: ما ينجح فعلياً للمنشآت الصغيرة والمتوسطة",
    category: "Technology",
    readTime: "5 min read",
    readTimeAr: "قراءة 5 دقائق",
    date: "April 2025",
    dateAr: "أبريل 2025",
    excerpt: "Artificial intelligence in procurement is generating enormous hype. But for SMEs and mid-market companies without dedicated data science teams, what practical applications deliver real value today — and what should you avoid?",
    excerptAr: "يُثير الذكاء الاصطناعي في المشتريات ضجيجاً هائلاً. لكن بالنسبة للمنشآت الصغيرة والمتوسطة والشركات متوسطة الحجم التي تفتقر إلى فرق متخصّصة في علوم البيانات، ما التطبيقات العملية التي تحقّق قيمة حقيقية اليوم — وما الذي ينبغي تجنّبه؟",
    body: `The gap between the AI capabilities that enterprise software vendors are selling and the actual needs of a mid-market procurement team is enormous. Most SMEs do not need predictive demand modelling or machine learning-powered supplier risk scoring. What they need is faster, more consistent execution of the fundamentals.

That is where AI genuinely delivers value today. Spend classification — automatically categorising purchase data into meaningful categories — is one of the highest-return applications. Organisations that have historically spent significant time manually reviewing purchasing data can now generate category-level spend intelligence in hours rather than weeks. The strategic decisions that follow from that intelligence are still human decisions, but they are better informed and faster.

Supplier discovery and qualification is another practical application. AI tools can now scan public databases, financial records, and news sources to build preliminary supplier profiles and flag potential risks — credit events, regulatory sanctions, adverse news — at a fraction of the cost of manual research. For procurement teams managing hundreds of suppliers, this is transformative. The starting point for any organisation is a structured spend analysis. Without clean, categorised spend data, no AI tool will deliver meaningful value.`,
    bodyAr: `الفجوة بين قدرات الذكاء الاصطناعي التي يبيعها موردو برمجيات المؤسسات والاحتياجات الفعلية لفريق مشتريات في السوق المتوسط هائلة. فمعظم المنشآت الصغيرة والمتوسطة لا تحتاج إلى نمذجة تنبّؤية للطلب أو تقييم مخاطر المورّدين المدعوم بالتعلّم الآلي. ما تحتاجه هو تنفيذ أسرع وأكثر اتساقاً للأساسيات.

هنا يقدّم الذكاء الاصطناعي قيمة حقيقية اليوم. فتصنيف الإنفاق — تصنيف بيانات الشراء آلياً إلى فئات ذات معنى — من أعلى التطبيقات عائداً. فالمنشآت التي كانت تقضي وقتاً طويلاً في المراجعة اليدوية لبيانات الشراء أصبحت قادرة على توليد رؤى إنفاق على مستوى الفئات خلال ساعات بدل أسابيع. أما القرارات الاستراتيجية التي تلي هذه الرؤى فتبقى قرارات بشرية، لكنها أفضل استنارةً وأسرع.

اكتشاف المورّدين وتأهيلهم تطبيق عملي آخر. فأدوات الذكاء الاصطناعي قادرة الآن على مسح قواعد البيانات العامة والسجلات المالية ومصادر الأخبار لبناء ملفات أولية للمورّدين ورصد المخاطر المحتملة — أحداث ائتمانية، عقوبات تنظيمية، أخبار سلبية — بجزء يسير من تكلفة البحث اليدوي. وبالنسبة لفرق المشتريات التي تدير مئات المورّدين، فهذا تحوّل جذري. ونقطة الانطلاق لأي منشأة هي تحليل إنفاق منظّم؛ فمن دون بيانات إنفاق نظيفة ومصنّفة، لن تحقّق أي أداة ذكاء اصطناعي قيمة تُذكر.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-cyan-600",
    featured: false,
  },
  {
    id: 5,
    title: "Supplier Governance: Moving Beyond the Approved Vendor List",
    titleAr: "حوكمة المورّدين: تجاوز قائمة المورّدين المعتمدين",
    category: "Procurement",
    readTime: "6 min read",
    readTimeAr: "قراءة 6 دقائق",
    date: "March 2025",
    dateAr: "مارس 2025",
    excerpt: "The approved vendor list is the foundation of supplier governance — but it is only the foundation. Organisations that stop there are managing compliance, not relationships. The difference matters enormously to the bottom line.",
    excerptAr: "قائمة المورّدين المعتمدين هي أساس حوكمة المورّدين — لكنها الأساس فقط. فالمنشآت التي تتوقّف عند هذا الحد تدير الامتثال لا العلاقات. والفرق بينهما ذو أثر كبير على النتائج النهائية.",
    body: `An approved vendor list tells you who you are allowed to buy from. Supplier governance tells you whether those suppliers are actually delivering what you contracted for, whether the relationship is developing strategically, and whether the organisation's dependency on each supplier is at an acceptable risk level.

The transition from compliance-focused to relationship-focused supplier management requires three investments. The first is a performance measurement framework with metrics that are meaningful to the business — not just on-time delivery, but quality rates, invoice accuracy, responsiveness, and innovation contribution. The second is a structured review cadence: monthly operational reviews with high-volume suppliers, quarterly strategic reviews with key partners, and annual relationship assessments with all significant vendors.

The third, and most often overlooked, investment is in supplier development. The best organisations do not just measure supplier performance — they actively improve it. This means sharing your forecasts so suppliers can plan their capacity, providing technical support when quality issues arise, and giving preferred suppliers early visibility of new requirements. The suppliers that receive this level of engagement consistently outperform on every metric.`,
    bodyAr: `تُخبرك قائمة المورّدين المعتمدين بمن يُسمح لك الشراء منهم. أما حوكمة المورّدين فتُخبرك بما إذا كان أولئك المورّدون يُسلّمون فعلاً ما تعاقدت عليه، وما إذا كانت العلاقة تتطوّر استراتيجياً، وما إذا كان اعتماد المنشأة على كل مورّد ضمن مستوى مخاطر مقبول.

يتطلّب الانتقال من إدارة المورّدين المرتكزة على الامتثال إلى المرتكزة على العلاقات ثلاثة استثمارات. أولها إطار لقياس الأداء بمؤشرات ذات معنى للأعمال — لا التسليم في الوقت المحدّد فحسب، بل معدلات الجودة ودقة الفواتير وسرعة الاستجابة والإسهام في الابتكار. وثانيها إيقاع مراجعة منظّم: مراجعات تشغيلية شهرية مع المورّدين مرتفعي الحجم، ومراجعات استراتيجية ربع سنوية مع الشركاء الرئيسيين، وتقييمات علاقة سنوية مع جميع المورّدين المهمّين.

أما الاستثمار الثالث، والأكثر إغفالاً، فهو تطوير المورّدين. فأفضل المنشآت لا تكتفي بقياس أداء المورّدين، بل تحسّنه فعلياً. ويعني ذلك مشاركة توقّعاتك ليتمكّن المورّدون من التخطيط لطاقتهم، وتقديم الدعم الفني عند ظهور مشكلات الجودة، ومنح المورّدين المفضّلين رؤية مبكرة للمتطلبات الجديدة. والمورّدون الذين يحظون بهذا المستوى من التفاعل يتفوّقون باستمرار في كل مؤشر.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    authorTitleAr: "المؤسّس وكبير الاستشاريين",
    bgColor: "bg-indigo-600",
    featured: false,
  },
  {
    id: 6,
    title: "ESG in Supply Chain: From Reporting Requirement to Competitive Advantage",
    titleAr: "معايير ESG في سلسلة الإمداد: من متطلّب إفصاح إلى ميزة تنافسية",
    category: "Sustainability",
    readTime: "7 min read",
    readTimeAr: "قراءة 7 دقائق",
    date: "February 2025",
    dateAr: "فبراير 2025",
    excerpt: "Environmental, social, and governance requirements in supply chain management have moved from a niche topic to a core business imperative. For GCC organisations seeking international contracts, ESG compliance is increasingly non-negotiable.",
    excerptAr: "انتقلت متطلبات الحوكمة البيئية والاجتماعية والمؤسسية (ESG) في إدارة سلسلة الإمداد من موضوع هامشي إلى ضرورة أعمال جوهرية. وبالنسبة لمنشآت الخليج التي تسعى إلى عقود دولية، بات الامتثال لمعايير ESG أمراً غير قابل للتفاوض بشكل متزايد.",
    body: `The pressure on supply chain sustainability has shifted decisively from voluntary to mandatory. European importers are now required under the EU Corporate Sustainability Due Diligence Directive to assess and mitigate human rights and environmental risks across their entire supply chain — including their GCC suppliers. For Saudi and Jordanian exporters with European exposure, this is a material business risk.

But the organisations that are moving fastest on supply chain ESG are not doing so because of regulatory pressure alone. They are doing so because sustainability has become a genuine competitive differentiator in procurement decisions. When a multinational is choosing between two comparable suppliers, the one with documented ESG performance, a published supplier code of conduct, and third-party verification is almost always the preferred choice.

The practical starting point is a supplier ESG assessment framework. This does not need to be complex: a structured questionnaire covering environmental practices, labour standards, and governance processes, scored and tracked annually. The data this generates creates two immediate benefits — it identifies the highest-risk suppliers in the base, and it provides credible evidence of due diligence that can be shared with customers and investors.`,
    bodyAr: `تحوّل الضغط على استدامة سلسلة الإمداد بشكل حاسم من الطوعي إلى الإلزامي. فالمستوردون الأوروبيون مُطالبون الآن بموجب توجيه الاتحاد الأوروبي للعناية الواجبة في الاستدامة المؤسسية (EU CSDDD) بتقييم وتخفيف مخاطر حقوق الإنسان والمخاطر البيئية عبر كامل سلسلة إمدادهم — بما في ذلك مورّدوهم في الخليج. وبالنسبة للمصدّرين السعوديين والأردنيين ذوي الانكشاف الأوروبي، فهذا خطر أعمال جوهري.

لكن المنشآت الأسرع تحرّكاً في مجال ESG لسلسلة الإمداد لا تفعل ذلك بدافع الضغط التنظيمي وحده، بل لأن الاستدامة أصبحت عامل تمايز تنافسي حقيقي في قرارات الشراء. فحين تختار شركة متعددة الجنسيات بين مورّدَين متكافئين، يكون المورّد الذي يملك أداءً موثّقاً في ESG ومدوّنة سلوك منشورة للمورّدين وتحقّقاً من طرف ثالث هو الخيار المفضّل في الغالب.

نقطة الانطلاق العملية هي إطار لتقييم ESG لدى المورّدين. ولا يلزم أن يكون معقّداً: استبيان منظّم يغطّي الممارسات البيئية ومعايير العمل وعمليات الحوكمة، يُسجّل ويُتابَع سنوياً. وتُحقّق البيانات الناتجة عنه فائدتين فوريتين — تحديد المورّدين الأعلى خطورة في القاعدة، وتوفير دليل موثوق على العناية الواجبة يمكن مشاركته مع العملاء والمستثمرين.`,
    author: "ISC Editorial Team",
    authorTitle: "I Supply Chain",
    authorTitleAr: "فريق تحرير I Supply Chain",
    bgColor: "bg-emerald-600",
    featured: false,
  },
];
