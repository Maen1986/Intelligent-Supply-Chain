import React from 'react';
import { DiagnosticReport } from '@/lib/diagnosticEngine';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Download, CalendarDays, CheckCircle2, AlertTriangle, TrendingUp, Compass, Target, Crosshair } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '@/lib/LanguageContext';

export function ReportOutput({ report }: { report: DiagnosticReport }) {
  const { t } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-end no-print">
        <Button onClick={handlePrint} variant="outline" className="border-accent text-accent hover:bg-accent/10">
          <Download className="w-4 h-4 mr-2" />
          {t('diagnostic.downloadPdf')}
        </Button>
        <Link href="/consultant">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <CalendarDays className="w-4 h-4 mr-2" />
            {t('diagnostic.talkConsultant')}
          </Button>
        </Link>
      </div>

      {/* Report Document */}
      <div id="diagnostic-report" className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
        {/* Document Header */}
        <div className="bg-gradient-to-r from-primary to-[#082C6B] p-8 text-white">
          <div className="flex justify-between items-start mb-8">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Logo />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-1">Confidential</p>
              <p className="text-white/60 text-sm">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Supply Chain Diagnostic Report</h1>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">{report.industry}</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">{report.businessSize}</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">{report.region}</span>
            <span className="px-3 py-1 bg-accent/20 border border-accent/50 text-accent-foreground rounded-full text-sm font-medium">{report.focusArea}</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-8 space-y-12">
          
          {/* Executive Summary */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Compass className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">1. Executive Summary</h2>
            </div>
            <p className="text-foreground leading-relaxed text-lg">{report.executiveSummary}</p>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Regional Alignment if applicable */}
          {report.regionalAlignment && (
            <section className="bg-muted p-6 rounded-lg border-l-4 border-primary">
              <h3 className="text-xl font-bold text-primary mb-3">Regional & Regulatory Alignment</h3>
              <p className="text-foreground leading-relaxed">{report.regionalAlignment}</p>
            </section>
          )}

          {/* Diagnosis & Root Causes Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-primary">Key Diagnostics</h3>
              </div>
              <ul className="space-y-3">
                {report.diagnosis.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-accent shrink-0"></span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Crosshair className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-primary">Identified Root Causes</h3>
              </div>
              <ul className="space-y-3">
                {report.rootCauses.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-destructive shrink-0"></span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <hr className="border-t-2 border-accent/30" />

          {/* Recommendations & KPIs */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">2. Strategic Recommendations</h2>
            </div>
            <ul className="space-y-4 mb-8">
              {report.recommendations.map((item, i) => (
                <li key={i} className="flex items-start gap-4 bg-muted/50 p-4 rounded-lg border border-border">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <span className="text-foreground font-medium pt-1">{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Recommended KPIs
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.kpis.map((kpi, i) => (
                <div key={i} className="p-3 border border-border rounded bg-white shadow-sm flex items-start gap-2">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground">{kpi}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Risks & Mitigations */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">3. Risk Mitigation</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted text-primary">
                    <th className="p-4 border-b border-border font-bold w-1/2">Risk Factor</th>
                    <th className="p-4 border-b border-border font-bold w-1/2">Mitigation Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {report.risks.map((item, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/30">
                      <td className="p-4 text-foreground/90 font-medium">{item.risk}</td>
                      <td className="p-4 text-foreground/80">{item.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-t-2 border-accent/30" />

          {/* Transformation Roadmap */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CalendarDays className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">4. Transformation Roadmap</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[report.roadmap.phase1, report.roadmap.phase2, report.roadmap.phase3].map((phase, idx) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-primary p-4 text-white">
                    <h4 className="font-bold mb-1">{phase.title}</h4>
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded inline-block">{phase.timeframe}</span>
                  </div>
                  <div className="p-5 flex-1 bg-muted/20">
                    <ul className="space-y-3">
                      {phase.actions.map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start gap-2 text-sm">
                          <span className="text-accent mt-0.5">▪</span>
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
        <div className="bg-muted px-8 py-4 border-t border-border flex justify-between items-center">
          <p className="text-sm font-bold text-primary">I Supply Chain Consultancy</p>
          <p className="text-xs text-muted-foreground">Generated via Intelligent Diagnostic Engine</p>
        </div>

      </div>
    </div>
  );
}
