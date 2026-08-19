import React from 'react';
import { DiagnosticReport } from '@/lib/diagnosticEngine';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Download, CalendarDays, CheckCircle2, AlertTriangle, TrendingUp, Compass, Target, Crosshair, ClipboardCheck } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '@/lib/LanguageContext';
import { buildMaturityHandoffQuery } from '@/lib/diagnosticHandoff';

export function ReportOutput({ report }: { report: DiagnosticReport }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const labelAr: Record<string, string> = {
    // Business size
    'Startup': 'شركة ناشئة', 'SME': 'منشأة صغيرة ومتوسطة', 'Mid-Market': 'الشركات المتوسطة',
    'Enterprise': 'مؤسسة كبرى', 'Government Entity': 'جهة حكومية',
    // Region
    'International': 'دولي', 'Saudi Arabia': 'المملكة العربية السعودية', 'Jordan': 'الأردن', 'Other GCC': 'دول الخليج الأخرى',
    // Industry
    'Manufacturing': 'التصنيع', 'Marine': 'القطاع البحري', 'Retail': 'التجزئة', 'FMCG': 'السلع الاستهلاكية سريعة الدوران',
    'Pharma': 'الأدوية', 'Logistics': 'الخدمات اللوجستية', 'Energy': 'الطاقة', 'Construction': 'الإنشاءات',
    'Tech': 'التقنية', 'Government': 'القطاع الحكومي', 'Ecommerce': 'التجارة الإلكترونية',
    'Food & Beverage': 'الأغذية والمشروبات', 'Healthcare': 'الرعاية الصحية',
    // Focus area
    'Supply Chain Strategy': 'استراتيجية سلسلة الإمداد', 'Procurement': 'المشتريات', 'CLM': 'إدارة دورة حياة العقود',
    'Supplier Governance': 'حوكمة الموردين', 'Risk Management': 'إدارة المخاطر', 'Sustainability': 'الاستدامة',
    'Resiliency': 'المرونة التشغيلية', 'Digital Transformation': 'التحول الرقمي',
    'Organizational Design': 'التصميم المؤسسي', 'Government Compliance': 'الامتثال الحكومي',
  };
  const loc = (v: string) => (isAr ? labelAr[v] ?? v : v);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 mt-4 sm:mt-8">
      {/* Action Buttons — full-width on mobile, right-aligned on sm+ */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end no-print">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10 h-11"
        >
          <Download className="w-4 h-4 mr-2" />
          {t('diagnostic.downloadPdf')}
        </Button>
        <Link href="/consultant" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white h-11">
            <CalendarDays className="w-4 h-4 mr-2" />
            {t('diagnostic.talkConsultant')}
          </Button>
        </Link>
        {/* #142: hand off to the full Maturity Assessment, pre-filled with
            whatever of industry/size/country actually maps (see
            diagnosticHandoff.ts for why country is often omitted rather
            than guessed). */}
        <Link href={buildMaturityHandoffQuery(report)} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white h-11">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            {isAr ? 'ابدأ التقييم الكامل للنضج' : 'Take the Full Maturity Assessment'}
          </Button>
        </Link>
      </div>

      {/* Report Document */}
      <div id="diagnostic-report" className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">

        {/* Document Header — reduced padding on mobile */}
        <div className="bg-gradient-to-r from-primary to-[#082C6B] p-4 sm:p-8 text-white">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-5 sm:mb-8">
            <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm">
              <Logo />
            </div>
            <div className="text-right rtl:text-left">
              <p className="text-xs sm:text-sm font-medium text-white/80 uppercase tracking-widest mb-1">{isAr ? 'سري' : 'Confidential'}</p>
              <p className="text-white/60 text-xs sm:text-sm">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">{isAr ? 'تقرير تشخيص سلسلة الإمداد' : 'Supply Chain Diagnostic Report'}</h1>

          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs sm:text-sm font-medium">{loc(report.industry)}</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs sm:text-sm font-medium">{loc(report.businessSize)}</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs sm:text-sm font-medium">{loc(report.region)}</span>
            <span className="px-3 py-1 bg-accent/20 border border-accent/50 text-accent-foreground rounded-full text-xs sm:text-sm font-medium">{loc(report.focusArea)}</span>
          </div>
        </div>

        {/* Content Sections — reduced padding on mobile */}
        <div className="p-4 sm:p-8 space-y-8 sm:space-y-12">

          {/* Executive Summary */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{isAr ? '1. الملخص التنفيذي' : '1. Executive Summary'}</h2>
            </div>
            <p className="text-foreground leading-relaxed text-base sm:text-lg">{report.executiveSummary}</p>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Regional Alignment if applicable */}
          {report.regionalAlignment && (
            <section className="bg-muted p-4 sm:p-6 rounded-lg border-l-4 border-primary">
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">{isAr ? 'التوافق الإقليمي والتنظيمي' : 'Regional & Regulatory Alignment'}</h3>
              <p className="text-foreground leading-relaxed">{report.regionalAlignment}</p>
            </section>
          )}

          {/* Diagnosis & Root Causes — stacks on mobile, 2-col on md+ */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-primary shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold text-primary">{isAr ? 'أبرز نتائج التشخيص' : 'Key Diagnostics'}</h3>
              </div>
              <ul className="space-y-3">
                {report.diagnosis.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-accent shrink-0"></span>
                    <span className="text-foreground text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Crosshair className="w-5 h-5 text-primary shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold text-primary">{isAr ? 'الأسباب الجذرية المحددة' : 'Identified Root Causes'}</h3>
              </div>
              <ul className="space-y-3">
                {report.rootCauses.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-destructive shrink-0"></span>
                    <span className="text-foreground text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <hr className="border-t-2 border-accent/30" />

          {/* Recommendations & KPIs */}
          <section>
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{isAr ? '2. التوصيات الاستراتيجية' : '2. Strategic Recommendations'}</h2>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {report.recommendations.map((item, i) => (
                <li key={i} className="flex items-start gap-3 sm:gap-4 bg-muted/50 p-3 sm:p-4 rounded-lg border border-border">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-foreground font-medium pt-0.5 text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-base sm:text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 shrink-0" /> {isAr ? 'مؤشرات الأداء الرئيسية الموصى بها' : 'Recommended KPIs'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.kpis.map((kpi, i) => (
                <div key={i} className="p-3 border border-border rounded bg-white shadow-sm flex items-start gap-2">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">{kpi}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Risks & Mitigations — horizontal scroll on mobile */}
          <section>
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{isAr ? '3. إدارة المخاطر' : '3. Risk Mitigation'}</h2>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-muted text-primary">
                    <th className="p-3 sm:p-4 border-b border-border font-bold w-1/2 text-sm sm:text-base">{isAr ? 'عامل الخطر' : 'Risk Factor'}</th>
                    <th className="p-3 sm:p-4 border-b border-border font-bold w-1/2 text-sm sm:text-base">{isAr ? 'استراتيجية التخفيف' : 'Mitigation Strategy'}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.risks.map((item, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 sm:p-4 text-foreground/90 font-medium text-sm sm:text-base">{item.risk}</td>
                      <td className="p-3 sm:p-4 text-foreground/80 text-sm sm:text-base">{item.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Transformation Roadmap — stacks on mobile, 3-col on md+ */}
          <section>
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{isAr ? '4. خارطة طريق التحول' : '4. Transformation Roadmap'}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {[report.roadmap.phase1, report.roadmap.phase2, report.roadmap.phase3].map((phase, idx) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-primary p-3 sm:p-4 text-white">
                    <h4 className="font-bold mb-1 text-sm sm:text-base">{phase.title}</h4>
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded inline-block">{phase.timeframe}</span>
                  </div>
                  <div className="p-4 sm:p-5 flex-1 bg-muted/20">
                    <ul className="space-y-3">
                      {phase.actions.map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start gap-2 text-sm">
                          <span className="text-accent mt-0.5 shrink-0">▪</span>
                          <span className="text-foreground/90">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer of the document */}
        <div className="bg-muted px-4 sm:px-8 py-4 border-t border-border flex flex-col sm:flex-row justify-between sm:items-center gap-1">
          <p className="text-sm font-bold text-primary">{isAr ? 'استشارات I Supply Chain' : 'I Supply Chain Consultancy'}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'تم إنشاؤه بالذكاء الاصطناعي · شخصية معين الحقاش · GPT-4o' : 'AI-generated · Ma\'in Alhaqash persona · GPT-4o'}</p>
        </div>

      </div>
    </div>
  );
}
