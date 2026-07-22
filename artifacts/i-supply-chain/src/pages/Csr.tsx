import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';

const INDUSTRIES = [
  { en: 'Manufacturing', ar: 'التصنيع' },
  { en: 'Marine', ar: 'القطاع البحري' },
  { en: 'Retail', ar: 'التجزئة' },
  { en: 'FMCG', ar: 'السلع الاستهلاكية سريعة الدوران' },
  { en: 'Pharma', ar: 'الأدوية' },
  { en: 'Logistics', ar: 'الخدمات اللوجستية' },
  { en: 'Energy', ar: 'الطاقة' },
  { en: 'Construction', ar: 'الإنشاءات' },
  { en: 'Tech', ar: 'التقنية' },
  { en: 'Food & Beverage', ar: 'الأغذية والمشروبات' },
  { en: 'Healthcare', ar: 'الرعاية الصحية' },
  { en: 'Other', ar: 'أخرى' },
];

// Bilingual report content keyed by industry. `default` is the fallback.
const REPORT_CONTENT: Record<string, {
  summary: string; summaryAr: string;
  gaps: string[]; gapsAr: string[];
  risks: string[]; risksAr: string[];
  roadmap: string[]; roadmapAr: string[];
}> = {
  default: {
    summary: 'Small businesses in this sector typically face limited leverage with suppliers, informal contract structures, and cash flow pressures driven by inventory holding.',
    summaryAr: 'تواجه الشركات الصغيرة في هذا القطاع عادةً قدرةً تفاوضيةً محدودةً مع الموردين، وهياكل تعاقدية غير رسمية، وضغوطًا على التدفق النقدي ناتجةً عن الاحتفاظ بالمخزون.',
    gaps: [
      'Informal vendor selection without competitive benchmarking',
      'No structured purchase order (PO) approval workflow',
      'Limited tracking of supplier lead times and reliability',
    ],
    gapsAr: [
      'اختيار الموردين بشكل غير رسمي دون مقارنة مرجعية تنافسية',
      'عدم وجود مسار منظّم لاعتماد أوامر الشراء (PO)',
      'تتبّع محدود لمهل توريد الموردين ومدى موثوقيتهم',
    ],
    risks: [
      'Unfavorable payment terms stressing working capital',
      'Lack of limitation of liability in supplier agreements',
    ],
    risksAr: [
      'شروط سداد غير مواتية تُرهِق رأس المال العامل',
      'غياب بنود تحديد المسؤولية في اتفاقيات الموردين',
    ],
    roadmap: [
      'Month 1: Centralize a list of all active suppliers and total spend',
      'Month 2: Implement a basic Purchase Order process for all spend over a set threshold',
      'Month 3: Standardize your company\'s preferred payment terms and negotiate with top 3 suppliers',
    ],
    roadmapAr: [
      'الشهر 1: توحيد قائمة بجميع الموردين النشطين وإجمالي الإنفاق',
      'الشهر 2: تطبيق عملية أساسية لأوامر الشراء لكل إنفاق يتجاوز حدًا معيّنًا',
      'الشهر 3: توحيد شروط السداد المفضّلة لشركتك والتفاوض مع أفضل 3 موردين',
    ],
  },
  Manufacturing: {
    summary: 'Manufacturing SMEs typically face fragmented supplier management, limited inventory visibility, and reactive maintenance procurement.',
    summaryAr: 'تواجه المنشآت الصناعية الصغيرة والمتوسطة عادةً تفكّكًا في إدارة الموردين، ورؤية محدودة للمخزون، ومشتريات صيانة تُدار بردّ الفعل.',
    gaps: ['No formal approved vendor list for raw materials', 'Spot purchasing driving price volatility', 'Limited supplier quality data and inspection processes'],
    gapsAr: ['عدم وجود قائمة موردين معتمدين رسمية للمواد الخام', 'الشراء الفوري يؤدي إلى تقلّب الأسعار', 'بيانات جودة محدودة للموردين وعمليات فحص قاصرة'],
    risks: ['No fixed-price clauses for raw material price spikes', 'Inadequate force majeure and supply disruption provisions'],
    risksAr: ['غياب بنود تثبيت الأسعار عند ارتفاع أسعار المواد الخام', 'قصور في أحكام القوة القاهرة وانقطاع الإمداد'],
    roadmap: ['Month 1-2: Document top 10 suppliers and establish performance scorecards', 'Month 2-4: Implement standard purchase order and approval workflow', 'Month 4-6: Negotiate framework agreements with top 3 material suppliers'],
    roadmapAr: ['الشهر 1-2: توثيق أهم 10 موردين وإنشاء بطاقات قياس الأداء', 'الشهر 2-4: تطبيق أوامر شراء موحّدة ومسار اعتماد', 'الشهر 4-6: التفاوض على اتفاقيات إطارية مع أفضل 3 موردين للمواد'],
  },
  Retail: {
    summary: 'Retail SMEs commonly struggle with demand-driven inventory imbalances, inconsistent supplier terms, and limited visibility into supply lead times.',
    summaryAr: 'تعاني منشآت التجزئة الصغيرة والمتوسطة عادةً من اختلالات في المخزون مدفوعة بالطلب، وشروط موردين غير متسقة، ورؤية محدودة لمهل التوريد.',
    gaps: ['No category-level spend analysis across product lines', 'Inconsistent supplier payment terms creating cash flow pressure', 'Limited use of demand forecasting data in purchasing decisions'],
    gapsAr: ['عدم وجود تحليل إنفاق على مستوى الفئات عبر خطوط المنتجات', 'شروط سداد غير متسقة للموردين تُسبّب ضغطًا على التدفق النقدي', 'استخدام محدود لبيانات التنبؤ بالطلب في قرارات الشراء'],
    risks: ['Insufficient exclusivity and minimum order quantity terms with key brands', 'No clear returns and damaged goods policy in supplier agreements'],
    risksAr: ['شروط حصرية وكميات طلب دنيا غير كافية مع العلامات التجارية الرئيسية', 'عدم وجود سياسة واضحة للمرتجعات والبضائع التالفة في اتفاقيات الموردين'],
    roadmap: ['Month 1-2: Conduct full supplier and spend audit', 'Month 2-4: Standardize supplier contracts and payment terms', 'Month 4-6: Implement basic inventory management and reorder point system'],
    roadmapAr: ['الشهر 1-2: إجراء تدقيق شامل للموردين والإنفاق', 'الشهر 2-4: توحيد عقود الموردين وشروط السداد', 'الشهر 4-6: تطبيق نظام أساسي لإدارة المخزون ونقاط إعادة الطلب'],
  },
  'Food & Beverage': {
    summary: 'F&B businesses face unique challenges regarding perishability, stringent quality requirements, and seasonal supply fluctuations.',
    summaryAr: 'تواجه شركات الأغذية والمشروبات تحديات فريدة تتعلّق بقابلية التلف، ومتطلبات الجودة الصارمة، وتقلّبات الإمداد الموسمية.',
    gaps: ['Lack of alternate approved sources for critical ingredients', 'Manual traceability and batch tracking', 'Reactive rather than predictive ordering'],
    gapsAr: ['غياب مصادر معتمدة بديلة للمكوّنات الحرجة', 'تتبّع يدوي للتعقّب وتتبّع الدفعات', 'الطلب برد الفعل بدلاً من الطلب التنبّئي'],
    risks: ['Quality degradation liability not passed to logistics providers', 'Over-dependence on local distributors without direct manufacturer relationships'],
    risksAr: ['عدم تحميل مزوّدي الخدمات اللوجستية مسؤولية تدهور الجودة', 'الاعتماد المفرط على الموزّعين المحليين دون علاقات مباشرة مع المُصنّعين'],
    roadmap: ['Month 1: Map the full ingredient supply tree for your top 5 products', 'Month 2: Establish strict quality Service Level Agreements (SLAs) with fresh suppliers', 'Month 3: Implement inventory buffer rules based on shelf life'],
    roadmapAr: ['الشهر 1: رسم شجرة توريد المكوّنات الكاملة لأهم 5 منتجات لديك', 'الشهر 2: وضع اتفاقيات مستوى خدمة (SLA) صارمة للجودة مع موردي المنتجات الطازجة', 'الشهر 3: تطبيق قواعد مخزون احتياطي بناءً على العمر الافتراضي'],
  },
};

export function Csr() {
  const { t, lang } = useLanguage();
  const ar = lang === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);

  const [formData, setFormData] = useState({
    industry: '',
    challenge: '',
  });

  const generateCsrReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let key = 'default';
      if (formData.industry === 'Manufacturing') key = 'Manufacturing';
      else if (formData.industry === 'Retail' || formData.industry === 'Ecommerce') key = 'Retail';
      else if (formData.industry === 'Food & Beverage') key = 'Food & Beverage';

      const c = REPORT_CONTENT[key];
      const industryLabel = INDUSTRIES.find(i => i.en === formData.industry);

      setReport({
        industry: formData.industry,
        industryAr: industryLabel?.ar || formData.industry,
        summary: c.summary,
        summaryAr: c.summaryAr,
        gaps: c.gaps,
        gapsAr: c.gapsAr,
        risks: c.risks,
        risksAr: c.risksAr,
        roadmap: c.roadmap,
        roadmapAr: c.roadmapAr,
      });
      setIsGenerating(false);
    }, 1000);
  };

  const isFormValid = !!formData.industry && !!formData.challenge;

  const gaps: string[] = report ? (ar ? report.gapsAr : report.gaps) : [];
  const risks: string[] = report ? (ar ? report.risksAr : report.risks) : [];
  const roadmap: string[] = report ? (ar ? report.roadmapAr : report.roadmap) : [];

  return (
    <div className="w-full">
      {/* Page Hero Banner */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img
          src="/brand/page-csr.jpg"
          alt="CSR Free Diagnostic"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/90 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{t('csr.title')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            {ar
              ? 'دعم مجاني لسلسلة الإمداد للشركات الناشئة والمنشآت الصغيرة — إسهامنا في مجتمعات أقوى وأكثر مرونة.'
              : 'Free supply chain support for startups and small businesses — our contribution to stronger, more resilient communities.'}
          </p>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-10 sm:py-16 max-w-4xl">
        {!report ? (
          <div className="bg-white rounded-2xl shadow-lg border border-border p-6 md:p-10 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="industry" className="text-base font-medium">{ar ? 'قطاعك' : 'Your Industry'}</Label>
                <Select onValueChange={(val) => setFormData(p => ({ ...p, industry: val }))}>
                  <SelectTrigger id="industry" className="h-12 text-base">
                    <SelectValue placeholder={ar ? 'اختر القطاع' : 'Select industry'} />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind.en} value={ind.en}>{ar ? ind.ar : ind.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="challenge" className="text-base font-medium">{ar ? 'التحدّي الأساسي' : 'Primary Challenge'}</Label>
                <Textarea
                  id="challenge"
                  placeholder={ar ? 'صِف تحدّيك الحالي في بضع جمل...' : 'Describe your current challenge in a few sentences...'}
                  className="resize-none min-h-[120px] text-base"
                  value={formData.challenge}
                  onChange={(e) => setFormData(p => ({ ...p, challenge: e.target.value }))}
                />
              </div>

              <Button
                onClick={generateCsrReport}
                disabled={!isFormValid || isGenerating}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 text-lg mt-4"
              >
                {isGenerating ? (ar ? 'جارٍ التحليل...' : 'Analyzing...') : (ar ? 'إنشاء التقرير المجاني' : 'Generate Free Report')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-end no-print">
              <Button variant="outline" onClick={() => window.print()} className="border-accent text-accent hover:bg-accent/10">
                {ar ? 'تنزيل كـ PDF' : 'Download as PDF'}
              </Button>
            </div>

            <div id="diagnostic-report" className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="bg-[#EAF1FB] p-4 sm:p-8 border-b border-border">
                <div className="flex justify-between items-start mb-6">
                  <Logo />
                  <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">{ar ? 'برنامج الدعم المجتمعي' : 'CSR Support Program'}</span>
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">{ar ? 'خطة عمل سلسلة الإمداد للمنشآت الصغيرة والمتوسطة' : 'SME Supply Chain Action Plan'}</h2>
                <p className="text-muted-foreground font-medium">
                  {ar ? `أُعِدّ لقطاع: ${report.industryAr}` : `Prepared for: ${report.industry} Sector`}
                </p>
              </div>

              <div className="p-4 sm:p-8 space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">{ar ? '1. ملخّص التشخيص' : '1. Diagnostic Summary'}</h3>
                  <p className="text-foreground leading-relaxed">{ar ? report.summaryAr : report.summary}</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">{ar ? '2. تحليل فجوات المشتريات' : '2. Procurement Gap Analysis'}</h3>
                  <ul className="space-y-3">
                    {gaps.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-accent shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">{ar ? '3. مسح مخاطر العقود' : '3. Contract Risk Scan'}</h3>
                  <ul className="space-y-3">
                    {risks.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-destructive shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">{ar ? '4. خارطة طريق التحسين الأساسية' : '4. Basic Improvement Roadmap'}</h3>
                  <div className="bg-muted p-5 rounded-lg border border-border">
                    <ul className="space-y-4">
                      {roadmap.map((item: string, i: number) => {
                        const [time, action] = item.split(/:(.+)/);
                        return (
                          <li key={i} className="flex items-start gap-3">
                            <span className="font-bold text-primary">{time}:</span>
                            <span className="text-foreground/90">{action ? action.trim() : ''}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              </div>

              <div className="bg-primary px-4 sm:px-8 py-4 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-sm">
                <p>{ar ? 'I Supply Chain — مبادرة المسؤولية الاجتماعية' : 'I Supply Chain — CSR Initiative'}</p>
                <p>{ar ? 'سرّي' : 'Confidential'}</p>
              </div>
            </div>

            <div className="mt-8 text-center no-print">
              <Button variant="ghost" onClick={() => setReport(null)}>
                {ar ? 'إجراء تحليل آخر' : 'Run Another Analysis'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
