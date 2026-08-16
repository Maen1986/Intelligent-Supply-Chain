import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Newspaper, Cpu, GitBranch, Lightbulb, ExternalLink,
  ChevronRight, Zap, TrendingUp, Shield, Leaf, Radio,
  BookOpen, Clock, ArrowRight, BarChart3, Globe, Lock,
  RefreshCw, CheckCircle,
  ArrowLeft, ChevronLeft,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

/* ─── ICON MAP ───────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Cpu, Globe, Lock, TrendingUp, Zap, Leaf, BarChart3, GitBranch, Shield, Radio,
};
const ICON_COLORS: Record<string, { bg: string; color: string }> = {
  Cpu:       { bg: 'bg-blue-50',    color: 'text-blue-600'   },
  Globe:     { bg: 'bg-green-50',   color: 'text-green-600'  },
  Lock:      { bg: 'bg-orange-50',  color: 'text-orange-600' },
  TrendingUp:{ bg: 'bg-indigo-50',  color: 'text-indigo-600' },
  Zap:       { bg: 'bg-purple-50',  color: 'text-purple-600' },
  Leaf:      { bg: 'bg-emerald-50', color: 'text-emerald-600'},
  BarChart3: { bg: 'bg-blue-50',    color: 'text-blue-600'   },
  GitBranch: { bg: 'bg-red-50',     color: 'text-red-600'    },
  Shield:    { bg: 'bg-orange-50',  color: 'text-orange-600' },
  Radio:     { bg: 'bg-purple-50',  color: 'text-purple-600' },
};

/* ─── ANIMATION ─────────────────────────────────────────────────────────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── STATIC FALLBACK DATA ───────────────────────────────────────────────── */
const STATIC_NEWS = [
  {
    category: 'Risk & Resilience',
    categoryAr: 'المخاطر والمرونة',
    date: 'August 2026',
    dateAr: 'أغسطس 2026',
    headline: 'Predictive Risk Management Becomes the New Baseline as 42% of Leaders Report AI Cutting Third-Party Exposure',
    headlineAr: 'إدارة المخاطر التنبؤية تصبح المعيار الجديد مع تقرير 42% من القادة عن خفض الذكاء الاصطناعي للتعرّض لمخاطر الأطراف الثالثة',
    summary: 'Supplier risk management has shifted decisively from reactive firefighting to predictive, data-driven resilience in 2026. New industry research finds 42% of risk leaders believe AI alone can reduce third-party financial exposure by at least 20%, while 65% of large organisations now name third-party and supply-chain vulnerabilities a leading cybersecurity concern. The shift mirrors the move from "just-in-time" to "just-in-case" sourcing, with procurement teams increasingly assessing suppliers across geopolitical, cyber, climate, and regulatory dimensions simultaneously rather than in isolation.',
    summaryAr: 'شهدت إدارة مخاطر المورّدين تحوّلاً حاسماً من التعامل التفاعلي مع الأزمات إلى بناء المرونة التنبؤية القائمة على البيانات في عام 2026. تُظهر أبحاث صناعية جديدة أن 42% من قادة إدارة المخاطر يرون أن الذكاء الاصطناعي وحده قادر على خفض التعرّض المالي لمخاطر الأطراف الثالثة بنسبة 20% على الأقل، في حين تُصنّف 65% من المؤسسات الكبرى نقاط ضعف الأطراف الثالثة وسلسلة الإمداد ضمن أبرز مخاوفها الأمنية السيبرانية. ويعكس هذا التحوّل الانتقال من التوريد "في الوقت المحدد" إلى التوريد "احتياطاً للطوارئ"، مع تقييم فرق المشتريات للمورّدين عبر الأبعاد الجيوسياسية والسيبرانية والمناخية والتنظيمية في آنٍ واحد بدلاً من تقييم كل بُعد بمعزل عن الآخر.',
    impact: 'Strategic', impactAr: 'استراتيجي', impactColor: 'bg-blue-100 text-blue-700', iconName: 'Shield',
  },
  {
    category: 'Trade & Geopolitics',
    categoryAr: 'التجارة والجغرافيا السياسية',
    date: 'June 2026',
    dateAr: 'يونيو 2026',
    headline: "Tariff Volatility Becomes 2026's Top Disruption Risk as Global Trade Fragments into Regional Blocs",
    headlineAr: 'تقلبات التعريفات الجمركية تتصدّر مخاطر الاضطراب في 2026 مع تفتّت التجارة العالمية إلى تكتلات إقليمية',
    summary: 'A February 2026 survey of senior trade professionals found 72% now name U.S. tariff volatility the most disruptive regulatory change of the year, up sharply from 41% in 2025, with 82% of organisations reporting direct supply chain impact and 39% absorbing higher supplier and material costs. East Asia, North America, and Europe are hardening into more independent regional trade circles. For GCC-based importers and exporters serving these markets, single-region sourcing and shipping strategies now carry materially higher cost and continuity risk than a diversified, regionally-hedged approach.',
    summaryAr: 'كشف استطلاع أُجري في فبراير 2026 لكبار المتخصصين في التجارة أن 72% منهم يعتبرون الآن تقلّب التعريفات الجمركية الأمريكية أكثر التغيّرات التنظيمية اضطراباً هذا العام، بارتفاع حاد من 41% في 2025، فيما أفادت 82% من المؤسسات بتأثّر سلاسل إمدادها بشكل مباشر، واستوعبت 39% منها ارتفاعاً في تكاليف المورّدين والمواد. وتتجه شرق آسيا وأمريكا الشمالية وأوروبا نحو تكتلات تجارية إقليمية أكثر استقلالية. وبالنسبة للمستوردين والمصدّرين الخليجيين العاملين في هذه الأسواق، فإن استراتيجيات التوريد والشحن أحادية المنطقة باتت تحمل الآن مخاطر تكلفة واستمرارية أعلى بكثير مقارنة بنهج متنوّع ومتوازن إقليمياً.',
    impact: 'Regulatory Alert', impactAr: 'تنبيه تنظيمي', impactColor: 'bg-orange-100 text-orange-700', iconName: 'Globe',
  },
  {
    category: 'AI & Technology',
    categoryAr: 'الذكاء الاصطناعي والتقنية',
    date: 'April 2026',
    dateAr: 'أبريل 2026',
    headline: '2026 Marked as "the Year of AI Agents" in Procurement as Autonomous Contract and Renewal Workflows Go Live',
    headlineAr: '2026 يُوصَف بـ"عام الوكلاء الذكيّين" في المشتريات مع انطلاق مهام العقود والتجديد الذاتية',
    summary: "Procurement AI has moved from generating insight to taking autonomous action: by 2026, AI agents embedded in enterprise workflows are drafting contract language, generating negotiation recommendations, and executing renewals within policy limits without manual sign-off at each step. Generative AI weekly usage among procurement executives has climbed to 94%, up 44 percentage points year-over-year, though adoption still lags other business functions — procurement represents just 6% of enterprise AI use cases. Most teams' practical starting point remains unchanged: low-complexity, high-impact use cases with human-in-the-loop governance before scaling further.",
    summaryAr: 'انتقل الذكاء الاصطناعي في المشتريات من توليد الرؤى إلى اتخاذ إجراءات مستقلة: بحلول 2026، أصبحت الوكلاء الذكيّون المدمجون في أنظمة العمل المؤسسية يصيغون بنود العقود، ويولّدون توصيات التفاوض، وينفّذون التجديدات ضمن حدود السياسات دون الحاجة لموافقة يدوية في كل خطوة. وارتفع الاستخدام الأسبوعي للذكاء الاصطناعي التوليدي بين مسؤولي المشتريات إلى 94%، بزيادة 44 نقطة مئوية عن العام السابق، رغم أن التبنّي لا يزال متأخراً مقارنة بوظائف الأعمال الأخرى — إذ لا تمثّل المشتريات سوى 6% من حالات استخدام الذكاء الاصطناعي المؤسسي. وتبقى نقطة الانطلاق العملية لمعظم الفرق كما هي: حالات استخدام منخفضة التعقيد وعالية الأثر مع إبقاء الإنسان جزءاً من حلقة الحوكمة قبل التوسّع.',
    impact: 'Strategic', impactAr: 'استراتيجي', impactColor: 'bg-purple-100 text-purple-700', iconName: 'Cpu',
  },
  {
    category: 'Regulatory',
    categoryAr: 'تنظيمي',
    date: 'February 2026',
    dateAr: 'فبراير 2026',
    headline: "Aramco's IKTVA Programme Hits 70% Local Content Milestone, Sets New 75% Target for 2030",
    headlineAr: 'برنامج اكتفاء التابع لأرامكو يبلغ معلم 70% من المحتوى المحلي ويضع هدفاً جديداً بـ75% بحلول 2030',
    summary: "Aramco confirmed its In-Kingdom Total Value Add (IKTVA) programme has reached its 70% local-content target, having added more than $280 billion to the Saudi economy and supported over 200,000 direct and indirect jobs since launch. A new 75%-by-2030 target has now been set. For suppliers serving Aramco and its ecosystem, the milestone confirms localisation is a durable, tightening requirement rather than a transitional target — organisations still reliant on single-source foreign supply arrangements should expect increasing pressure to qualify local content pathways over the next phase.",
    summaryAr: 'أكدت أرامكو أن برنامج القيمة المضافة المحلية الشامل (اكتفاء) بلغ هدفه المتمثل في 70% من المحتوى المحلي، بعد أن أسهم بأكثر من 280 مليار دولار في الاقتصاد السعودي ودعم أكثر من 200,000 وظيفة مباشرة وغير مباشرة منذ انطلاقه. وتم الآن تحديد هدف جديد بنسبة 75% بحلول 2030. وبالنسبة للمورّدين العاملين مع أرامكو ومنظومتها، يؤكد هذا الإنجاز أن التوطين متطلب دائم ومتصاعد وليس هدفاً انتقالياً — وعلى المنشآت التي لا تزال تعتمد على ترتيبات توريد أجنبي أحادية المصدر أن تتوقّع ضغطاً متزايداً لتأهيل مسارات المحتوى المحلي في المرحلة القادمة.',
    impact: 'Critical for KSA', impactAr: 'حاسم للسعودية', impactColor: 'bg-green-100 text-green-700', iconName: 'TrendingUp',
  },
  {
    category: 'AI & Technology',
    categoryAr: 'الذكاء الاصطناعي والتقنية',
    date: 'July 2025',
    dateAr: 'يوليو 2025',
    headline: 'Gartner Names Agentic AI the #1 Strategic Technology for Procurement in 2025',
    headlineAr: 'Gartner تُصنّف الذكاء الاصطناعي الوكيلي التقنية الاستراتيجية الأولى للمشتريات في 2025',
    summary: "Gartner's 2025 Hype Cycle for Procurement identifies agentic AI — autonomous AI agents that can issue RFQs, evaluate bids, and manage POs without human intervention — as the single highest-impact technology in the procurement landscape. Early adopters in Fortune 500 companies report 35–60% reduction in routine procurement cycle time.",
    summaryAr: 'حدّدت دورة Gartner لعام 2025 للمشتريات الذكاء الاصطناعي الوكيلي — وكلاء ذكاء اصطناعي مستقلّون قادرون على إصدار طلبات عروض الأسعار وتقييم العطاءات وإدارة أوامر الشراء دون تدخّل بشري — بوصفه التقنية الأعلى أثراً في مشهد المشتريات. ويُبلغ المتبنّون الأوائل من شركات Fortune 500 عن خفض بنسبة 35–60% في زمن دورة المشتريات الروتينية.',
    impact: 'High Impact', impactAr: 'أثر عالٍ', impactColor: 'bg-red-100 text-red-700', iconName: 'Cpu',
  },
  {
    category: 'GCC Policy',
    categoryAr: 'سياسات الخليج',
    date: 'June 2025',
    dateAr: 'يونيو 2025',
    headline: 'Saudi Arabia Launches Unified National Procurement Portal Under Vision 2030',
    headlineAr: 'السعودية تُطلق البوابة الوطنية الموحّدة للمشتريات ضمن رؤية 2030',
    summary: 'The Saudi Ministry of Finance has launched a consolidated e-procurement portal integrating government procurement across 132 ministries and entities. The portal mandates digital submission of all tenders above SAR 100,000, full Iktva reporting, and real-time supplier performance tracking.',
    summaryAr: 'أطلقت وزارة المالية السعودية بوابة موحّدة للمشتريات الإلكترونية تدمج المشتريات الحكومية عبر 132 وزارة وجهة. وتُلزم البوابة بالتقديم الرقمي لجميع المنافسات التي تتجاوز 100,000 ريال، والإبلاغ الكامل عن Iktva، وتتبّع أداء المورّدين في الوقت الفعلي.',
    impact: 'Critical for KSA', impactAr: 'حاسم للسعودية', impactColor: 'bg-green-100 text-green-700', iconName: 'Globe',
  },
  {
    category: 'Regulatory',
    categoryAr: 'تنظيمي',
    date: 'May 2025',
    dateAr: 'مايو 2025',
    headline: 'EU CSDDD Enforcement Begins: GCC Exporters Face New Supply Chain Due Diligence Rules',
    headlineAr: 'بدء إنفاذ توجيه EU CSDDD: مصدّرو الخليج أمام قواعد جديدة للعناية الواجبة في سلسلة الإمداد',
    summary: 'The EU Corporate Sustainability Due Diligence Directive entered enforcement phase in May 2025, requiring European companies to audit entire supply chains — including GCC suppliers — for human rights and environmental risks. Saudi, Jordanian, and UAE exporters supplying European buyers must now produce ESG due diligence documentation.',
    summaryAr: 'دخل توجيه الاتحاد الأوروبي للعناية الواجبة في الاستدامة المؤسسية (EU CSDDD) مرحلة الإنفاذ في مايو 2025، مُلزِماً الشركات الأوروبية بتدقيق سلاسل الإمداد بالكامل — بما في ذلك مورّدو الخليج — بحثاً عن مخاطر حقوق الإنسان والمخاطر البيئية. وبات على المصدّرين السعوديين والأردنيين والإماراتيين الذين يورّدون للمشترين الأوروبيين تقديم وثائق العناية الواجبة لمعايير ESG.',
    impact: 'Regulatory Alert', impactAr: 'تنبيه تنظيمي', impactColor: 'bg-orange-100 text-orange-700', iconName: 'Lock',
  },
  {
    category: 'Market Intelligence',
    categoryAr: 'ذكاء السوق',
    date: 'April 2025',
    dateAr: 'أبريل 2025',
    headline: 'IMF: GCC Supply Chain Localisation Programs to Contribute $180B to GDP by 2030',
    headlineAr: 'صندوق النقد الدولي: برامج توطين سلسلة الإمداد الخليجية ستُسهم بـ 180 مليار دولار في الناتج المحلي بحلول 2030',
    summary: 'An IMF research note estimates that successful localisation programmes across the GCC — Iktva, UAE ICV, and Qatar TAWTEEN — could contribute up to $180 billion to regional GDP by 2030. Procurement leaders are urged to build local supplier development capabilities now.',
    summaryAr: 'تُقدّر مذكرة بحثية لصندوق النقد الدولي أن برامج التوطين الناجحة عبر الخليج — Iktva، وICV الإماراتي، وTAWTEEN القطري — قد تُسهم بما يصل إلى 180 مليار دولار في الناتج المحلي الإقليمي بحلول 2030. ويُحثّ قادة المشتريات على بناء قدرات تطوير المورّدين المحليين الآن.',
    impact: 'Strategic', impactAr: 'استراتيجي', impactColor: 'bg-blue-100 text-blue-700', iconName: 'TrendingUp',
  },
  {
    category: 'Digital Tools',
    categoryAr: 'الأدوات الرقمية',
    date: 'March 2025',
    dateAr: 'مارس 2025',
    headline: 'SAP Ariba Releases GenAI Supplier Risk Scoring and Auto-RFx Drafting',
    headlineAr: 'SAP Ariba تُطلق تقييم مخاطر المورّدين بالذكاء الاصطناعي التوليدي وصياغة طلبات RFx تلقائياً',
    summary: "SAP Ariba's Spring 2025 release embeds generative AI into the supplier risk module, enabling real-time risk scores based on financial data, news feeds, and ESG ratings — and auto-generated RFQ documents based on category specifications.",
    summaryAr: 'يدمج إصدار ربيع 2025 من SAP Ariba الذكاء الاصطناعي التوليدي في وحدة مخاطر المورّدين، ما يتيح درجات مخاطر لحظية مبنية على البيانات المالية والأخبار وتصنيفات ESG — إضافةً إلى توليد وثائق طلبات عروض الأسعار تلقائياً بناءً على مواصفات الفئة.',
    impact: 'Tool Update', impactAr: 'تحديث أداة', impactColor: 'bg-purple-100 text-purple-700', iconName: 'Zap',
  },
  {
    category: 'Sustainability',
    categoryAr: 'الاستدامة',
    date: 'February 2025',
    dateAr: 'فبراير 2025',
    headline: 'Scope 3 Emissions Now Mandatory Disclosure for GCC-Listed Companies Over SAR 1B Revenue',
    headlineAr: 'انبعاثات النطاق 3 تصبح إفصاحاً إلزامياً للشركات الخليجية المدرجة التي تتجاوز إيراداتها مليار ريال',
    summary: 'The Saudi Capital Market Authority has expanded ESG disclosure requirements to mandate Scope 3 (supply chain) emissions reporting for listed companies above SAR 1 billion in revenue, bringing procurement into the direct regulatory spotlight.',
    summaryAr: 'وسّعت هيئة السوق المالية السعودية متطلبات الإفصاح عن ESG لتُلزم بالإبلاغ عن انبعاثات النطاق 3 (سلسلة الإمداد) للشركات المدرجة التي تتجاوز إيراداتها مليار ريال، ما يضع المشتريات في دائرة الضوء التنظيمي المباشر.',
    impact: 'Compliance Alert', impactAr: 'تنبيه امتثال', impactColor: 'bg-emerald-100 text-emerald-700', iconName: 'Leaf',
  },
];

const STATIC_TOOLS = [
  { name: 'SAP Ariba', category: 'End-to-End Procurement', categoryAr: 'مشتريات شاملة من البداية للنهاية', desc: 'The market-leading procurement platform for large enterprises. Covers strategic sourcing, supplier management, contract lifecycle, and procure-to-pay. Now with embedded GenAI for RFx drafting and supplier risk scoring.', descAr: 'المنصة الرائدة في سوق المشتريات للمؤسسات الكبرى. تغطّي التوريد الاستراتيجي وإدارة المورّدين ودورة حياة العقود والشراء حتى السداد. وتتضمّن الآن ذكاءً اصطناعياً توليدياً لصياغة طلبات RFx وتقييم مخاطر المورّدين.', bestFor: 'Enterprise · Government · Multi-entity', bestForAr: 'المؤسسات · الحكومة · الكيانات المتعددة', badge: 'Enterprise Grade', badgeAr: 'مستوى المؤسسات', badgeColor: 'bg-blue-100 text-blue-700', rating: 'Industry Standard', ratingAr: 'المعيار المرجعي للقطاع', logo: '🔵' },
  { name: 'Coupa', category: 'AI-Powered Spend Management', categoryAr: 'إدارة الإنفاق المدعومة بالذكاء الاصطناعي', desc: "Cloud-native platform combining spend management, supplier risk, contract management, and treasury in one suite. Coupa's AI benchmarks your spend against $6 trillion in community intelligence — instantly surfacing where you are overpaying versus market.", descAr: 'منصة سحابية الأصل تجمع إدارة الإنفاق ومخاطر المورّدين وإدارة العقود والخزينة في حزمة واحدة. ويقارن الذكاء الاصطناعي في Coupa إنفاقك بـ 6 تريليونات دولار من ذكاء المجتمع — ليكشف فوراً أين تدفع أكثر من السوق.', bestFor: 'Mid-Market · Enterprise · FMCG', bestForAr: 'السوق المتوسط · المؤسسات · السلع الاستهلاكية', badge: 'AI-Native', badgeAr: 'مبني على الذكاء الاصطناعي', badgeColor: 'bg-purple-100 text-purple-700', rating: 'Gartner Leader 2025', ratingAr: 'رائد Gartner 2025', logo: '🟣' },
  { name: 'Jaggaer ONE', category: 'Strategic Sourcing & SRM', categoryAr: 'التوريد الاستراتيجي وإدارة علاقات المورّدين', desc: 'Deep strategic sourcing capabilities with advanced reverse auction, multi-attribute scoring, and supplier collaboration tools. Particularly strong for complex category management and supplier performance programmes.', descAr: 'قدرات عميقة في التوريد الاستراتيجي مع مزاد عكسي متقدّم وتقييم متعدد المعايير وأدوات تعاون مع المورّدين. قوية بشكل خاص في إدارة الفئات المعقّدة وبرامج أداء المورّدين.', bestFor: 'Manufacturing · Energy · EPC', bestForAr: 'التصنيع · الطاقة · مقاولات EPC', badge: 'Sourcing-First', badgeAr: 'يركّز على التوريد', badgeColor: 'bg-orange-100 text-orange-700', rating: 'Forrester Strong Performer', ratingAr: 'أداء قوي وفق Forrester', logo: '🟠' },
  { name: 'Microsoft Dynamics 365 SCM', category: 'ERP + Supply Chain', categoryAr: 'تخطيط موارد المؤسسة + سلسلة الإمداد', desc: "Microsoft's integrated ERP and supply chain suite. Excels at demand planning, inventory optimisation, and warehouse management — with Power BI native integration and Copilot AI for purchase order management.", descAr: 'حزمة Microsoft المتكاملة لتخطيط الموارد وسلسلة الإمداد. تتفوّق في تخطيط الطلب وتحسين المخزون وإدارة المستودعات — مع تكامل أصيل مع Power BI ومساعد Copilot الذكي لإدارة أوامر الشراء.', bestFor: 'SME · Mid-Market · Government', bestForAr: 'المنشآت الصغيرة والمتوسطة · السوق المتوسط · الحكومة', badge: 'ERP-Integrated', badgeAr: 'متكامل مع ERP', badgeColor: 'bg-cyan-100 text-cyan-700', rating: 'Microsoft Ecosystem', ratingAr: 'منظومة Microsoft', logo: '🔷' },
  { name: 'Zycus iQ', category: 'AI Procurement Suite', categoryAr: 'حزمة مشتريات بالذكاء الاصطناعي', desc: "Zycus has repositioned around AI-first procurement, with its Merlin AI handling spend classification, contract review, supplier risk, and savings opportunity identification. Strong CLM module with AI-powered clause analysis.", descAr: 'أعادت Zycus تموضعها حول مشتريات تعتمد الذكاء الاصطناعي أولاً، إذ يتولّى محرّكها Merlin AI تصنيف الإنفاق ومراجعة العقود ومخاطر المورّدين وتحديد فرص التوفير. وتتميّز بوحدة قوية لإدارة دورة حياة العقود مع تحليل بنود مدعوم بالذكاء الاصطناعي.', bestFor: 'CLM-Heavy · Multi-Contract', bestForAr: 'كثيف العقود · تعدد العقود', badge: 'AI-First', badgeAr: 'الذكاء الاصطناعي أولاً', badgeColor: 'bg-violet-100 text-violet-700', rating: 'Gartner Visionary', ratingAr: 'صاحب رؤية وفق Gartner', logo: '🟡' },
  { name: 'Power BI + Fabric', category: 'Procurement Analytics', categoryAr: 'تحليلات المشتريات', desc: "Microsoft's analytics platform has become the de facto standard for procurement KPI dashboards. With Microsoft Fabric, teams can connect ERP spend data, supplier scorecards, and contract data into unified semantic models.", descAr: 'أصبحت منصة تحليلات Microsoft المعيار الفعلي للوحات مؤشرات أداء المشتريات. ومع Microsoft Fabric، تستطيع الفرق ربط بيانات الإنفاق من ERP وبطاقات أداء المورّدين وبيانات العقود ضمن نماذج دلالية موحّدة.', bestFor: 'All sizes · Analytics teams', bestForAr: 'جميع الأحجام · فرق التحليلات', badge: 'Analytics', badgeAr: 'تحليلات', badgeColor: 'bg-yellow-100 text-yellow-700', rating: 'Widely Deployed', ratingAr: 'واسع الانتشار', logo: '📊' },
];

const STATIC_PROCESSES = [
  { iconName: 'Cpu', title: 'Agentic AI Procurement', titleAr: 'المشتريات بالذكاء الاصطناعي الوكيلي', tag: '2025 Trend', tagAr: 'اتجاه 2025', tagColor: 'bg-blue-100 text-blue-700', desc: 'AI agents that autonomously handle routine procurement tasks — generating RFQs from specs, comparing supplier bids, raising purchase orders within approved parameters, and chasing invoice approvals — without human intervention.', descAr: 'وكلاء ذكاء اصطناعي يتولّون تلقائياً مهام المشتريات الروتينية — توليد طلبات عروض الأسعار من المواصفات، ومقارنة عطاءات المورّدين، وإصدار أوامر الشراء ضمن الحدود المعتمدة، ومتابعة اعتمادات الفواتير — دون تدخّل بشري.', steps: ['Define policy guardrails and approval thresholds', 'Identify tail spend categories for automation', 'Pilot with one agent on a single category', 'Expand based on compliance and savings data'], stepsAr: ['تحديد ضوابط السياسة وحدود الاعتماد', 'تحديد فئات الإنفاق الذيلي القابلة للأتمتة', 'تجربة وكيل واحد على فئة واحدة', 'التوسّع بناءً على بيانات الامتثال والتوفير'] },
  { iconName: 'BarChart3', title: 'Continuous Spend Intelligence', titleAr: 'ذكاء الإنفاق المستمر', tag: 'Best Practice', tagAr: 'أفضل ممارسة', tagColor: 'bg-green-100 text-green-700', desc: 'Moving from annual spend reviews to real-time spend analytics. Modern procurement teams connect ERP transaction data to analytics platforms that automatically classify spend, flag maverick purchasing, and surface savings opportunities on a rolling basis.', descAr: 'الانتقال من مراجعات الإنفاق السنوية إلى تحليلات الإنفاق اللحظية. تربط فرق المشتريات الحديثة بيانات معاملات ERP بمنصات تحليلات تُصنّف الإنفاق آلياً، وترصد الشراء خارج القنوات، وتكشف فرص التوفير بشكل متجدّد.', steps: ['Establish a clean spend data taxonomy', 'Connect ERP to analytics platform with live refresh', 'Build category-level KPI dashboards', 'Run monthly savings opportunity reviews'], stepsAr: ['إنشاء تصنيف نظيف لبيانات الإنفاق', 'ربط ERP بمنصة التحليلات مع تحديث لحظي', 'بناء لوحات مؤشرات أداء على مستوى الفئات', 'إجراء مراجعات شهرية لفرص التوفير'] },
  { iconName: 'GitBranch', title: 'Dual-Sourcing as Standard Practice', titleAr: 'التوريد الثنائي كممارسة معيارية', tag: 'Resilience', tagAr: 'المرونة', tagColor: 'bg-red-100 text-red-700', desc: 'Post-pandemic supply chain disruptions have elevated dual-sourcing from a niche risk strategy to a standard operating model. Leading procurement organisations now mandate a secondary qualified supplier for all Tier-1 categories.', descAr: 'رفعت اضطرابات سلسلة الإمداد بعد الجائحة التوريد الثنائي من استراتيجية مخاطر هامشية إلى نموذج تشغيل معياري. وتُلزم المنظمات الرائدة في المشتريات الآن بوجود مورّد ثانٍ مؤهّل لجميع الفئات من المستوى الأول.', steps: ['Map all single-source critical category dependencies', 'Qualify and pre-negotiate with contingency suppliers', 'Embed dual-source requirement in sourcing policy', 'Review and test activation quarterly'], stepsAr: ['رسم خرائط كل اعتماديات الفئات الحرجة أحادية المصدر', 'تأهيل المورّدين البديلين والتفاوض المسبق معهم', 'تضمين متطلب التوريد الثنائي في سياسة التوريد', 'مراجعة التفعيل واختباره ربع سنوياً'] },
  { iconName: 'Leaf', title: 'Circular Procurement', titleAr: 'المشتريات الدائرية', tag: 'ESG', tagAr: 'ESG', tagColor: 'bg-emerald-100 text-emerald-700', desc: 'Integrating circular economy principles into procurement specifications — requiring suppliers to take back end-of-life products, use recycled content, and design for disassembly. Aligned with Saudi Net Zero 2060 targets.', descAr: 'دمج مبادئ الاقتصاد الدائري في مواصفات المشتريات — إلزام المورّدين باستعادة المنتجات منتهية العمر، واستخدام محتوى معاد تدويره، والتصميم القابل للتفكيك. بما يتوافق مع أهداف الحياد الصفري السعودي 2060.', steps: ['Add circular criteria to tender evaluation scoring', 'Require supplier material passports for key categories', 'Specify recycled content minimums in RFQ specifications', 'Track circular KPIs in supplier scorecards'], stepsAr: ['إضافة معايير دائرية إلى تقييم المنافسات', 'اشتراط جوازات مواد المورّدين للفئات الرئيسية', 'تحديد حدود دنيا للمحتوى المعاد تدويره في المواصفات', 'تتبّع مؤشرات الدائرية في بطاقات أداء المورّدين'] },
  { iconName: 'Shield', title: 'Predictive Supplier Risk Monitoring', titleAr: 'المراقبة التنبّؤية لمخاطر المورّدين', tag: 'Risk', tagAr: 'المخاطر', tagColor: 'bg-orange-100 text-orange-700', desc: 'Moving beyond annual supplier audits to continuous, AI-powered risk monitoring. Tools like Resilinc and SAP Ariba Risk scan supplier financial data, news, geopolitical events, and ESG ratings in real time.', descAr: 'تجاوز عمليات تدقيق المورّدين السنوية نحو مراقبة مخاطر مستمرة مدعومة بالذكاء الاصطناعي. أدوات مثل Resilinc وSAP Ariba Risk تمسح البيانات المالية للمورّدين والأخبار والأحداث الجيوسياسية وتصنيفات ESG في الوقت الفعلي.', steps: ['Segment suppliers by business criticality', 'Deploy real-time risk monitoring for Tier-1 suppliers', 'Define risk tolerance thresholds and alert rules', 'Build risk response playbooks by category'], stepsAr: ['تقسيم المورّدين حسب أهميتهم للأعمال', 'تفعيل مراقبة مخاطر لحظية لمورّدي المستوى الأول', 'تحديد حدود تحمّل المخاطر وقواعد التنبيه', 'بناء أدلة استجابة للمخاطر حسب الفئة'] },
  { iconName: 'Radio', title: 'Digital Twin Supply Chains', titleAr: 'التوأم الرقمي لسلاسل الإمداد', tag: 'Emerging', tagAr: 'ناشئ', tagColor: 'bg-purple-100 text-purple-700', desc: 'A digital twin creates a virtual replica of physical supply chain operations — enabling scenario modelling, stress testing, and what-if analysis before decisions are made. Leading manufacturers use digital twins to simulate disruptions.', descAr: 'يُنشئ التوأم الرقمي نسخة افتراضية من عمليات سلسلة الإمداد المادية — ما يتيح نمذجة السيناريوهات واختبارات الضغط وتحليل «ماذا لو» قبل اتخاذ القرارات. ويستخدم كبار المصنّعين التوائم الرقمية لمحاكاة الاضطرابات.', steps: ['Map the physical supply chain end-to-end', 'Build the digital model with ERP and IoT data', 'Run disruption simulations for top 5 risk scenarios', 'Integrate model outputs into S&OP planning'], stepsAr: ['رسم خريطة سلسلة الإمداد المادية بالكامل', 'بناء النموذج الرقمي ببيانات ERP وإنترنت الأشياء', 'تشغيل محاكاة الاضطراب لأهم 5 سيناريوهات مخاطر', 'دمج مخرجات النموذج في تخطيط S&OP'] },
];

const STATIC_TIPS = [
  { number: '01', title: 'Start with spend data — everything else depends on it.', titleAr: 'ابدأ ببيانات الإنفاق — فكل ما عداها يعتمد عليها.', body: 'You cannot category-manage what you cannot see. The first investment in any procurement transformation is clean, classified spend data. Run a spend analysis before you redesign processes, deploy technology, or restructure your supplier base. The data tells you where the money actually goes — and it is almost always different from what leadership believes.', bodyAr: 'لا يمكنك إدارة فئة لا تراها. أول استثمار في أي تحوّل للمشتريات هو بيانات إنفاق نظيفة ومصنّفة. أجرِ تحليلاً للإنفاق قبل إعادة تصميم العمليات أو نشر التقنية أو إعادة هيكلة قاعدة مورّديك. فالبيانات تُخبرك أين يذهب المال فعلاً — وهو ما يختلف دائماً تقريباً عمّا تعتقده القيادة.', tag: 'Transformation Foundation', tagAr: 'أساس التحوّل' },
  { number: '02', title: 'Build the governance architecture before the technology.', titleAr: 'ابنِ هيكل الحوكمة قبل التقنية.', body: 'Technology solves an execution problem; governance solves a structural problem. Organisations that deploy procurement systems without first establishing clear policy, delegation of authority, and approval workflows end up with expensive software that replicates their old broken processes faster. Design the governance first, then select and configure the tools to support it.', bodyAr: 'التقنية تحلّ مشكلة تنفيذية؛ أما الحوكمة فتحلّ مشكلة هيكلية. فالمنشآت التي تنشر أنظمة المشتريات قبل ترسيخ سياسة واضحة وتفويض صلاحيات ومسارات اعتماد، تنتهي إلى برمجيات باهظة تُكرّر عملياتها المعطوبة القديمة بوتيرة أسرع. صمّم الحوكمة أولاً، ثم اختر الأدوات واضبطها لدعمها.', tag: 'Digital Transformation', tagAr: 'التحوّل الرقمي' },
  { number: '03', title: "Treat your suppliers as strategic partners, not transactional vendors.", titleAr: 'تعامل مع مورّديك كشركاء استراتيجيين، لا كبائعين للمعاملات.', body: "Your top 20% of suppliers by spend represent 80% of your supply chain risk and 80% of your innovation potential. Organisations that invest in structured Supplier Relationship Management — regular reviews, shared KPIs, development programmes, and early visibility of upcoming demand — consistently outperform those that manage suppliers at arm's length.", bodyAr: 'يمثّل أعلى 20% من مورّديك من حيث الإنفاق نحو 80% من مخاطر سلسلة إمدادك و80% من إمكانات ابتكارك. والمنشآت التي تستثمر في إدارة منظّمة لعلاقات المورّدين — مراجعات دورية ومؤشرات أداء مشتركة وبرامج تطوير ورؤية مبكرة للطلب القادم — تتفوّق باستمرار على من يديرون مورّديهم من مسافة بعيدة.', tag: 'Supplier Management', tagAr: 'إدارة المورّدين' },
  { number: '04', title: 'Negotiate contracts — do not just accept them.', titleAr: 'تفاوض على العقود — لا تقبلها كما هي.', body: 'The majority of contracts in mid-market organisations are accepted as presented, with no meaningful commercial negotiation. Every contract has leverage points: payment terms, volume commitments, liability caps, IP ownership, renewal mechanics, and performance guarantees. A structured negotiation strategy typically recovers 5–15% of contract value.', bodyAr: 'تُقبل غالبية العقود في المنشآت متوسطة الحجم كما تُقدَّم، دون تفاوض تجاري ذي معنى. ولكل عقد نقاط قوة تفاوضية: شروط السداد، والتزامات الحجم، وسقوف المسؤولية، وملكية الملكية الفكرية، وآليات التجديد، وضمانات الأداء. وتستردّ استراتيجية التفاوض المنظّمة عادةً 5–15% من قيمة العقد.', tag: 'Contract Strategy', tagAr: 'استراتيجية العقود' },
  { number: '05', title: 'Never let a contract auto-renew without a review.', titleAr: 'لا تدع عقداً يتجدّد تلقائياً دون مراجعة.', body: 'Auto-renewal clauses in supplier contracts are a silent margin drain in most organisations. Suppliers know that procurement teams are under-resourced and rarely audit renewal dates proactively. Building a contract milestone alert system that flags renewals 90 days in advance gives you the leverage window to negotiate, re-tender, or exit on your terms.', bodyAr: 'تُعدّ بنود التجديد التلقائي في عقود المورّدين استنزافاً صامتاً للهامش في معظم المنشآت. فالمورّدون يعلمون أن فرق المشتريات تعاني من نقص الموارد ونادراً ما تدقّق تواريخ التجديد استباقياً. وبناء نظام تنبيه بمحطات العقود يُشعرك بالتجديدات قبل 90 يوماً يمنحك نافذة التفاوض أو إعادة الطرح أو الانسحاب بشروطك.', tag: 'CLM', tagAr: 'إدارة دورة حياة العقود' },
  { number: '06', title: 'Make Vision 2030 localisation a sourcing strategy, not a compliance exercise.', titleAr: 'اجعل توطين رؤية 2030 استراتيجية توريد، لا مجرد امتثال شكلي.', body: 'Organisations in Saudi Arabia that treat Iktva and local content as a tick-box exercise are missing a genuine competitive advantage. Building a robust local supplier development programme creates long-term cost advantage, reduces logistics risk, and builds the political capital that matters for large government contracts.', bodyAr: 'المنشآت في السعودية التي تتعامل مع Iktva والمحتوى المحلي كمجرد إجراء شكلي تُفوّت ميزة تنافسية حقيقية. فبناء برنامج قوي لتطوير المورّدين المحليين يخلق ميزة تكلفة طويلة الأمد، ويقلّل مخاطر الخدمات اللوجستية، ويبني رأس المال المؤسسي المهم للفوز بالعقود الحكومية الكبرى.', tag: 'Vision 2030 / GCC', tagAr: 'رؤية 2030 / الخليج' },
  { number: '07', title: 'Measure TCO, not just purchase price.', titleAr: 'قِس التكلفة الإجمالية للملكية، لا سعر الشراء فقط.', body: 'The lowest-price supplier is rarely the lowest-cost supplier when you account for quality failure rates, rework costs, delivery reliability, returns handling, and relationship management overhead. Organisations that shift from purchase price to Total Cost of Ownership consistently identify 10–25% cost reduction opportunities that price-focused sourcing misses entirely.', bodyAr: 'نادراً ما يكون المورّد الأرخص هو الأقل تكلفة عندما تحتسب معدلات فشل الجودة وتكاليف إعادة العمل وموثوقية التسليم ومعالجة المرتجعات وأعباء إدارة العلاقة. والمنشآت التي تنتقل من سعر الشراء إلى التكلفة الإجمالية للملكية (TCO) تحدّد باستمرار فرص خفض تكلفة بنسبة 10–25% يُغفلها التوريد المرتكز على السعر تماماً.', tag: 'Cost Management', tagAr: 'إدارة التكلفة' },
  { number: '08', title: 'Use AI as a thinking partner — not a replacement for expertise.', titleAr: 'استخدم الذكاء الاصطناعي شريكاً في التفكير — لا بديلاً عن الخبرة.', body: 'Generative AI tools can dramatically accelerate procurement work: drafting RFQs, reviewing contract clauses, summarising supplier proposals, researching market benchmarks. But they require experienced procurement judgement to direct, validate, and refine the output. The highest-return use of AI in procurement is pairing it with a senior practitioner who knows what good looks like.', bodyAr: 'يمكن لأدوات الذكاء الاصطناعي التوليدي أن تُسرّع عمل المشتريات بشكل كبير: صياغة طلبات عروض الأسعار، ومراجعة بنود العقود، وتلخيص عروض المورّدين، وبحث المعايير المرجعية للسوق. لكنها تتطلّب حُكماً خبيراً في المشتريات لتوجيهها والتحقّق منها وصقل مخرجاتها. وأعلى عائد لاستخدام الذكاء الاصطناعي في المشتريات هو إقرانه بممارس خبير يعرف كيف يبدو الأداء الجيّد.', tag: 'AI & Technology', tagAr: 'الذكاء الاصطناعي والتقنية' },
];

/* ─── API TYPES ─────────────────────────────────────────────────────────── */
interface ApiNewsItem {
  category: string; date: string; headline: string; summary: string;
  impact: string; impactColor: string; iconName: string;
  categoryAr?: string; dateAr?: string; headlineAr?: string; summaryAr?: string; impactAr?: string;
}
interface ApiToolItem {
  name: string; category: string; desc: string; bestFor: string;
  badge: string; badgeColor: string; rating: string; logo: string;
  categoryAr?: string; descAr?: string; bestForAr?: string; badgeAr?: string; ratingAr?: string;
}
interface ApiProcessItem {
  iconName: string; title: string; tag: string; tagColor: string;
  desc: string; steps: string[];
  titleAr?: string; tagAr?: string; descAr?: string; stepsAr?: string[];
}
interface ApiTipItem { number: string; title: string; body: string; tag: string; titleAr?: string; bodyAr?: string; tagAr?: string; }
interface ApiData {
  generatedAt: string;
  news: ApiNewsItem[];
  tools: ApiToolItem[];
  processes: ApiProcessItem[];
  tips: ApiTipItem[];
}

/* ─── TABS ──────────────────────────────────────────────────────────────── */
const TABS = ['Latest News', 'Tools Spotlight', 'Process Innovation', 'Expert Tips'];
const TABS_AR = ['أحدث الأخبار', 'أبرز الأدوات', 'ابتكار العمليات', 'نصائح الخبراء'];

import { API_BASE } from '@/lib/apiBase';

/* ─── SKELETON ──────────────────────────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-primary/8 rounded-xl ${className}`} />;
}
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

/* ─── COMPONENT ─────────────────────────────────────────────────────────── */
export function Intelligence() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/intelligence`)
      .then(r => r.ok ? r.json() as Promise<ApiData> : Promise.reject(r.status))
      .then(data => {
        setApiData(data);
        if (data.generatedAt) {
          setLastUpdated(new Date(data.generatedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          }));
        }
      })
      .catch(() => { /* silently fall back to static data */ })
      .finally(() => setLoading(false));
  }, [isAr]);

  const news = (apiData?.news ?? STATIC_NEWS) as ApiNewsItem[];
  const tools = (apiData?.tools ?? STATIC_TOOLS) as ApiToolItem[];
  const processes = (apiData?.processes ?? STATIC_PROCESSES) as ApiProcessItem[];
  const tips = (apiData?.tips ?? STATIC_TIPS) as ApiTipItem[];

  const switchTab = (i: number) => {
    setActiveTab(i);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  function resolveIcon(name: string): React.ElementType {
    return ICON_MAP[name] ?? Cpu;
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-[#082C6B]">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.18) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 60%, #0d4db8 100%)' }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{isAr ? 'مركز الذكاء الحي' : 'Live Intelligence Hub'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            {isAr ? 'ذكاء المشتريات وسلسلة الإمداد' : <>Procurement &amp; Supply Chain Intelligence</>}
          </h1>
          <p className="text-white/75 text-base md:text-lg max-w-2xl">
            {isAr ? "أحدث أخبار القطاع والأدوات الرقمية وابتكارات العمليات ورؤى التحوّل — بإشراف مَعِن الحقّاش، MCIPS." : "Latest industry news, digital tools, process innovations, and transformation insights — curated by Ma'in Alhaqash, MCIPS."}
          </p>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 mt-3 text-white/60 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? `تحديث أسبوعي · آخر تحديث ${lastUpdated}` : `Refreshed weekly · Last updated ${lastUpdated}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map((tab, i) => {
              const icons = [Newspaper, Cpu, GitBranch, Lightbulb];
              const Icon = icons[i];
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(i)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 shrink-0 ${
                    activeTab === i
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isAr ? TABS_AR[i] : tab}
                  {loading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground/60 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={contentRef} className="container mx-auto px-4 py-10 max-w-6xl" style={{ scrollMarginTop: '140px' }}>

        {/* ── Tab 0: Latest News ──────────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{isAr ? 'أحدث أخبار القطاع' : 'Latest Industry News'}</h2>
                <p className="text-muted-foreground mt-1">{isAr ? 'مستجدّات مختارة تُشكّل إدارة المشتريات وسلسلة الإمداد — تُحدَّث أسبوعياً.' : 'Curated developments shaping procurement and supply chain management — refreshed every week.'}</p>
              </div>
              <span className="flex items-center gap-2 text-xs text-accent font-bold uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {lastUpdated ? (isAr ? `حُدّث ${lastUpdated}` : `Updated ${lastUpdated}`) : (isAr ? 'تحديث أسبوعي' : 'Weekly refresh')}
              </span>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : news.map((item, i) => {
                    const iconColors = ICON_COLORS[item.iconName] ?? ICON_COLORS['Cpu'];
                    const Icon = resolveIcon(item.iconName);
                    return (
                      <Reveal key={item.headline} delay={i * 0.06}>
                        <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 h-full">
                          <div className="flex items-start justify-between gap-3">
                            <div className={`w-11 h-11 rounded-xl ${iconColors.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-5 h-5 ${iconColors.color}`} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.impactColor} shrink-0`}>
                              {isAr ? (item.impactAr ?? item.impact) : item.impact}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{isAr ? (item.categoryAr ?? item.category) : item.category}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{isAr ? (item.dateAr ?? item.date) : item.date}</span>
                            </div>
                            <h3 className="font-bold text-primary text-base leading-snug mb-3">{isAr ? (item.headlineAr ?? item.headline) : item.headline}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? (item.summaryAr ?? item.summary) : item.summary}</p>
                          </div>
                          <div className="mt-auto pt-4 border-t border-border">
                            <Link href="/consultant">
                              <span className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                                {isAr ? 'ناقش مع استشاري' : 'Discuss with a consultant'} {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
            </div>

            <Reveal className="bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-primary">{isAr ? 'ابقَ على اطّلاع كل أسبوع' : 'Stay updated every week'}</p>
                <p className="text-muted-foreground text-sm">{isAr ? 'اشترك في نشرتنا الاستخباراتية — تحديثات تنظيمية خليجية، وإصدارات الأدوات، وذكاء السوق تصلك إلى بريدك.' : 'Subscribe to our intelligence briefing — GCC regulatory updates, tool releases, and market intelligence delivered to your inbox.'}</p>
              </div>
              <Link href="/insights#newsletter">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shrink-0">
                  {isAr ? 'اشترك في النشرة' : 'Subscribe to Newsletter'}
                </Button>
              </Link>
            </Reveal>
          </div>
        )}

        {/* ── Tab 1: Tools Spotlight ──────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'أبرز الأدوات الرقمية' : 'Digital Tools Spotlight'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'المنصّات والتقنيات التي ينشرها مَعِن وفريق I Supply Chain للعملاء — مُقيَّمة باستقلالية، وتُحدَّث أسبوعياً.' : "The platforms and technologies Ma'in and the I Supply Chain team deploy for clients — assessed independently, refreshed weekly."}</p>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : tools.map((tool, i) => (
                    <Reveal key={tool.name} delay={i * 0.06}>
                      <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-2xl">{tool.logo}</span>
                              <h3 className="font-bold text-primary text-lg">{tool.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">{isAr ? (tool.categoryAr ?? tool.category) : tool.category}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tool.badgeColor} shrink-0 ml-2`}>
                            {isAr ? (tool.badgeAr ?? tool.badge) : tool.badge}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{isAr ? (tool.descAr ?? tool.desc) : tool.desc}</p>
                        <div className="pt-4 border-t border-border space-y-2">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{isAr ? 'الأنسب لـ' : 'Best For'}</p>
                            <p className="text-sm text-foreground font-medium">{isAr ? (tool.bestForAr ?? tool.bestFor) : tool.bestFor}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-accent">{isAr ? (tool.ratingAr ?? tool.rating) : tool.rating}</span>
                            <Link href="/consultant">
                              <span className="text-primary text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                                {isAr ? 'اسأل عن التطبيق' : 'Ask about implementation'} {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
            </div>

            <Reveal className="bg-[#082C6B] text-white rounded-2xl p-7 flex gap-5 items-start">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">{isAr ? 'رأي مَعِن الحقّاش — MCIPS, CPSM' : "Ma'in Alhaqash's View — MCIPS, CPSM"}</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {isAr
                    ? '«الخطأ الذي ترتكبه معظم المنشآت هو اختيار الأداة قبل تصميم العملية. فـ SAP Ariba في بيئة حوكمة مشتريات معطوبة ستمنحك نتائج معطوبة بوتيرة أسرع. قبل أن تستثمر في أي منصّة، ارسم عمليتك الحالية، وحدّد نموذج تشغيلك المستقبلي، وابنِ هيكل حوكمتك. عندها فقط ستُحقّق أي تقنية عائداً حقيقياً. لقد نشرتُ SAP MM/SCM وAriba وMS Dynamics 365 وIFS وJD Edwards وOdoo عبر السعودية وجورجيا والأردن — وكان المؤشّر الأكبر للنجاح في كل عملية تطبيق هو جودة تصميم الحوكمة السابقة للتقنية، لا المنصّة نفسها.»'
                    : "\"The mistake most organisations make is selecting the tool before designing the process. SAP Ariba in a broken procurement governance environment will give you broken outcomes faster. Before you invest in any platform, map your current-state process, define your future-state operating model, and build your governance structure. Only then will any technology deliver a genuine return. I have deployed SAP MM/SCM, Ariba, MS Dynamics 365, IFS, JD Edwards, and Odoo across KSA, Georgia, and Jordan — and the single biggest predictor of success in every implementation was the quality of the governance design upstream of the technology, not the platform itself.\""}
                </p>
              </div>
            </Reveal>
          </div>
        )}

        {/* ── Tab 2: Process Innovation ───────────────────────────────── */}
        {activeTab === 2 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'ابتكارات العمليات' : 'Process Innovations'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'أكثر التطوّرات أثراً في عمليات المشتريات وسلسلة الإمداد التي تُحدّد أفضل الممارسات — تُحدَّث أسبوعياً.' : 'The most impactful procurement and supply chain process advances defining best practice — refreshed weekly.'}</p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : processes.map((proc, i) => {
                    const Icon = resolveIcon(proc.iconName);
                    return (
                      <Reveal key={proc.title} delay={i * 0.06}>
                        <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-7 flex flex-col gap-5 h-full">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${proc.tagColor} mb-1 inline-block`}>{isAr ? (proc.tagAr ?? proc.tag) : proc.tag}</span>
                              <h3 className="font-bold text-primary text-lg leading-tight">{isAr ? (proc.titleAr ?? proc.title) : proc.title}</h3>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? (proc.descAr ?? proc.desc) : proc.desc}</p>
                          <div className="bg-muted rounded-xl p-4 mt-auto">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{isAr ? 'مسار التطبيق' : 'Implementation Pathway'}</p>
                            <ol className="space-y-2">
                              {(isAr ? (proc.stepsAr ?? proc.steps) : proc.steps).map((step, si) => (
                                <li key={si} className="flex items-start gap-3 text-sm text-foreground">
                                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{si + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
            </div>

            <Reveal className="text-center pt-4">
              <Link href="/diagnostic">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8">
                  {isAr ? 'قيّم نضج عملياتك بالذكاء الاصطناعي' : 'Assess Your Process Maturity with AI'} {isAr ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </Link>
              <p className="text-muted-foreground text-sm mt-3">{isAr ? 'تشخيص مجاني في 5 دقائق — حدّد أي فجوات العمليات تكلّفك الأكثر.' : 'Free 5-minute diagnostic — identify which process gaps cost you the most.'}</p>
            </Reveal>
          </div>
        )}

        {/* ── Tab 3: Expert Tips ──────────────────────────────────────── */}
        {activeTab === 3 && (
          <div className="space-y-8">
            <Reveal>
              <div className="flex items-start gap-5">
                <img
                  src="/brand/maen-photo.jpg"
                  alt="Ma'in Alhaqash"
                  className="w-16 h-16 rounded-full object-cover object-top border-2 border-accent shrink-0 hidden sm:block"
                />
                <div>
                  <h2 className="text-2xl font-bold text-primary">{isAr ? 'نصائح الخبراء في التحوّل' : 'Expert Transformation Tips'}</h2>
                  <p className="text-muted-foreground mt-1">
                    {isAr ? (
                      <>مبادئ من <span className="font-semibold text-primary">مَعِن الحقّاش</span> — أكثر من 20 عاماً، ووفورات تتجاوز 100 مليون دولار، وثقة BP وMaersk ووزارات حكومية سعودية. تُحدَّث أسبوعياً.</>
                    ) : (
                      <>Principles from <span className="font-semibold text-primary">Ma'in Alhaqash</span> — 20+ years, $100M+ in savings, trusted by BP, Maersk, and Saudi government ministries. Refreshed weekly.</>
                    )}
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                : tips.map((tip, i) => (
                    <Reveal key={tip.number} delay={i * 0.05}>
                      <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-7 flex flex-col gap-4 h-full">
                        <div className="flex items-start gap-4">
                          <span className="text-5xl font-extrabold text-primary/10 leading-none font-mono shrink-0 select-none">{tip.number}</span>
                          <div className="flex-1">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15 mb-2 inline-block">
                              {isAr ? (tip.tagAr ?? tip.tag) : tip.tag}
                            </span>
                            <h3 className="font-bold text-primary text-base leading-snug">{isAr ? (tip.titleAr ?? tip.title) : tip.title}</h3>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{isAr ? (tip.bodyAr ?? tip.body) : tip.body}</p>
                      </div>
                    </Reveal>
                  ))}
            </div>

            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-3xl p-10 text-white text-center">
              <Lightbulb className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">{isAr ? 'هل تودّ تطبيق هذه المبادئ على منشأتك؟' : 'Want these principles applied to your organisation?'}</h3>
              <p className="text-white/70 max-w-xl mx-auto mb-7 text-sm leading-relaxed">
                {isAr ? 'احجز استشارة فردية مع مَعِن للحصول على تقييم خبير وصريح لموقع وظيفة المشتريات وسلسلة الإمداد لديك — وخارطة طريق ملموسة للتحوّل.' : "Book a 1-on-1 consultation with Ma'in to get a candid, expert assessment of where your procurement and supply chain function stands — and a concrete roadmap for transformation."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consultant">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                    {isAr ? 'احجز استشارة' : 'Book a Consultation'}
                  </Button>
                </Link>
                <Link href="/diagnostic">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">
                    {isAr ? 'ابدأ التشخيص المجاني بالذكاء الاصطناعي' : 'Start Free AI Diagnostic'}
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
