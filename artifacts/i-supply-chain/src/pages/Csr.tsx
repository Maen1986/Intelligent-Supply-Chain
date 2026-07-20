import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';

export function Csr() {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);

  const [formData, setFormData] = useState({
    industry: '',
    challenge: ''
  });

  const industries = [
    'Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 
    'Energy', 'Construction', 'Tech', 'Food & Beverage', 'Healthcare', 'Other'
  ];

  const generateCsrReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let summary = "Small businesses in this sector typically face limited leverage with suppliers, informal contract structures, and cash flow pressures driven by inventory holding.";
      let gaps = [
        "Informal vendor selection without competitive benchmarking",
        "No structured purchase order (PO) approval workflow",
        "Limited tracking of supplier lead times and reliability"
      ];
      let risks = [
        "Unfavorable payment terms stressing working capital",
        "Lack of limitation of liability in supplier agreements"
      ];
      let roadmap = [
        "Month 1: Centralize a list of all active suppliers and total spend",
        "Month 2: Implement a basic Purchase Order process for all spend over a set threshold",
        "Month 3: Standardize your company's preferred payment terms and negotiate with top 3 suppliers"
      ];

      // Custom industry overrrides
      if (formData.industry === 'Manufacturing') {
        summary = "Manufacturing SMEs typically face fragmented supplier management, limited inventory visibility, and reactive maintenance procurement.";
        gaps = ["No formal approved vendor list for raw materials", "Spot purchasing driving price volatility", "Limited supplier quality data and inspection processes"];
        risks = ["No fixed-price clauses for raw material price spikes", "Inadequate force majeure and supply disruption provisions"];
        roadmap = ["Month 1-2: Document top 10 suppliers and establish performance scorecards", "Month 2-4: Implement standard purchase order and approval workflow", "Month 4-6: Negotiate framework agreements with top 3 material suppliers"];
      } else if (formData.industry === 'Retail' || formData.industry === 'Ecommerce') {
        summary = "Retail SMEs commonly struggle with demand-driven inventory imbalances, inconsistent supplier terms, and limited visibility into supply lead times.";
        gaps = ["No category-level spend analysis across product lines", "Inconsistent supplier payment terms creating cash flow pressure", "Limited use of demand forecasting data in purchasing decisions"];
        risks = ["Insufficient exclusivity and minimum order quantity terms with key brands", "No clear returns and damaged goods policy in supplier agreements"];
        roadmap = ["Month 1-2: Conduct full supplier and spend audit", "Month 2-4: Standardize supplier contracts and payment terms", "Month 4-6: Implement basic inventory management and reorder point system"];
      } else if (formData.industry === 'Food & Beverage') {
        summary = "F&B businesses face unique challenges regarding perishability, stringent quality requirements, and seasonal supply fluctuations.";
        gaps = ["Lack of alternate approved sources for critical ingredients", "Manual traceability and batch tracking", "Reactive rather than predictive ordering"];
        risks = ["Quality degradation liability not passed to logistics providers", "Over-dependence on local distributors without direct manufacturer relationships"];
        roadmap = ["Month 1: Map the full ingredient supply tree for your top 5 products", "Month 2: Establish strict quality Service Level Agreements (SLAs) with fresh suppliers", "Month 3: Implement inventory buffer rules based on shelf life"];
      }

      setReport({ industry: formData.industry, summary, gaps, risks, roadmap });
      setIsGenerating(false);
    }, 1000);
  };

  const isFormValid = !!formData.industry && !!formData.challenge;

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[calc(100vh-200px)]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{t('csr.title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Free supply chain support for startups and small businesses — our contribution to stronger, more resilient communities.
        </p>
      </div>

      {!report ? (
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6 md:p-10 max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="industry" className="text-base font-medium">Your Industry</Label>
              <Select onValueChange={(val) => setFormData(p => ({ ...p, industry: val }))}>
                <SelectTrigger id="industry" className="h-12 text-base">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="challenge" className="text-base font-medium">Primary Challenge</Label>
              <Textarea 
                id="challenge"
                placeholder="Describe your current challenge in a few sentences..." 
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
              {isGenerating ? "Analyzing..." : "Generate Free Report"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end no-print">
             <Button variant="outline" onClick={() => window.print()} className="border-accent text-accent hover:bg-accent/10">
                Download as PDF
             </Button>
          </div>
          
          <div id="diagnostic-report" className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="bg-[#EAF1FB] p-8 border-b border-border">
              <div className="flex justify-between items-start mb-6">
                <Logo />
                <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">CSR Support Program</span>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">SME Supply Chain Action Plan</h2>
              <p className="text-muted-foreground font-medium">Prepared for: {report.industry} Sector</p>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">1. Diagnostic Summary</h3>
                <p className="text-foreground leading-relaxed">{report.summary}</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">2. Procurement Gap Analysis</h3>
                <ul className="space-y-3">
                  {report.gaps.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-2 rounded-full bg-accent shrink-0"></span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">3. Contract Risk Scan</h3>
                <ul className="space-y-3">
                  {report.risks.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-2 rounded-full bg-destructive shrink-0"></span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-primary mb-3 uppercase tracking-wide border-b-2 border-accent pb-2">4. Basic Improvement Roadmap</h3>
                <div className="bg-muted p-5 rounded-lg border border-border">
                  <ul className="space-y-4">
                    {report.roadmap.map((item: string, i: number) => {
                      const [time, action] = item.split(': ');
                      return (
                        <li key={i} className="flex items-start gap-3">
                          <span className="font-bold text-primary whitespace-nowrap">{time}:</span>
                          <span className="text-foreground/90">{action}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            </div>
            
            <div className="bg-primary px-8 py-4 text-white flex justify-between items-center text-sm">
              <p>I Supply Chain — CSR Initiative</p>
              <p>Confidential</p>
            </div>
          </div>
          
          <div className="mt-8 text-center no-print">
            <Button variant="ghost" onClick={() => setReport(null)}>
               Run Another Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
