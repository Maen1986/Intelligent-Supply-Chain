import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { generateReport, DiagnosticReport } from '@/lib/diagnosticEngine';
import { ReportOutput } from '@/components/ReportOutput';
import { DIAGNOSTIC_LEAD_WEBHOOK_URL } from '@/config';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function Diagnostic() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const [formData, setFormData] = useState({
    businessSize: '',
    region: '',
    industry: '',
    focusArea: '',
    challenge: ''
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1200));

    const generated = generateReport(formData as any);
    setReport(generated);
    setIsGenerating(false);

    if (DIAGNOSTIC_LEAD_WEBHOOK_URL) {
      try {
        fetch(DIAGNOSTIC_LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionType: 'diagnostic',
            businessSize: formData.businessSize,
            region: formData.region,
            industry: formData.industry,
            focusArea: formData.focusArea,
            challengeText: formData.challenge,
            reportSummary: generated.executiveSummary,
          }),
        }).catch(() => {});
      } catch (e) {
        // silent fail
      }
    }
  };

  if (report) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <div className="mb-4 sm:mb-6 no-print">
          <Button variant="ghost" onClick={() => setReport(null)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Start Over
          </Button>
        </div>
        <ReportOutput report={report} />
      </div>
    );
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.businessSize;
      case 2: return !!formData.region;
      case 3: return !!formData.industry;
      case 4: return !!formData.focusArea;
      case 5: return true;
      default: return false;
    }
  };

  /* Shared radio-item class — full-width touch target, works in both LTR and RTL */
  const radioItemCls =
    'flex items-center gap-3 border border-border p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer';

  return (
    <div className="w-full">
      {/* Page Hero Banner */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/page-diagnostic.jpg" alt="AI Supply Chain Diagnostic" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/90 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{t('diagnostic.title')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">Complete this 5-step assessment to receive an instant, AI-generated strategic report tailored to your organization.</p>
        </div>
      </div>

    <div className="container mx-auto px-4 py-10 sm:py-16 max-w-3xl">
      <div className="bg-white rounded-2xl shadow-xl border border-border p-5 sm:p-6 md:p-10">

        {/* Step Progress — compact on mobile */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors shrink-0 ${
                  step >= i + 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded ${step > i + 1 ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[280px] sm:min-h-[300px]">

          {/* Step 1 — Business Size */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step1')}</h2>
              <RadioGroup
                value={formData.businessSize}
                onValueChange={(val) => setFormData(p => ({ ...p, businessSize: val }))}
                className="grid gap-3"
              >
                {['Startup', 'SME', 'Mid-Market', 'Enterprise', 'Government Entity'].map((opt) => (
                  <label key={opt} htmlFor={`bs-${opt}`} className={radioItemCls}>
                    <RadioGroupItem value={opt} id={`bs-${opt}`} />
                    <span className="flex-1 font-medium text-base">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2 — Region */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step2')}</h2>
              <RadioGroup
                value={formData.region}
                onValueChange={(val) => setFormData(p => ({ ...p, region: val }))}
                className="grid gap-3"
              >
                {['International', 'Saudi Arabia', 'Jordan', 'Other GCC'].map((opt) => (
                  <label key={opt} htmlFor={`rg-${opt}`} className={radioItemCls}>
                    <RadioGroupItem value={opt} id={`rg-${opt}`} />
                    <span className="flex-1 font-medium text-base">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3 — Industry */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step3')}</h2>
              <RadioGroup
                value={formData.industry}
                onValueChange={(val) => setFormData(p => ({ ...p, industry: val }))}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {['Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce', 'Food & Beverage', 'Healthcare'].map((opt) => (
                  <label key={opt} htmlFor={`ind-${opt}`} className={radioItemCls}>
                    <RadioGroupItem value={opt} id={`ind-${opt}`} />
                    <span className="flex-1 font-medium">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 4 — Focus Area */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step4')}</h2>
              <RadioGroup
                value={formData.focusArea}
                onValueChange={(val) => setFormData(p => ({ ...p, focusArea: val }))}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {['Supply Chain Strategy', 'Procurement', 'CLM', 'Supplier Governance', 'Risk Management', 'Sustainability', 'Resiliency', 'Digital Transformation', 'Organizational Design', 'Government Compliance'].map((opt) => (
                  <label key={opt} htmlFor={`fa-${opt}`} className={radioItemCls}>
                    <RadioGroupItem value={opt} id={`fa-${opt}`} />
                    <span className="flex-1 font-medium">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 5 — Challenge */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('diagnostic.step5')}</h2>
              <p className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base">Optional: Add specific context to improve your report.</p>
              <Textarea
                placeholder="In a few sentences, describe your current supply chain challenge..."
                className="min-h-[140px] sm:min-h-[150px] resize-none text-base"
                value={formData.challenge}
                onChange={(e) => setFormData(p => ({ ...p, challenge: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Navigation buttons — both shrink/grow proportionally on mobile */}
        <div className="mt-8 flex items-center justify-between gap-3 pt-5 sm:pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isGenerating}
            className="min-w-[80px] sm:min-w-[112px] font-medium h-11"
            data-testid="button-wizard-back"
          >
            {step > 1 && <ArrowLeft className="w-4 h-4 mr-1 rtl:hidden" />}
            Back
            {step > 1 && <ArrowLeft className="w-4 h-4 ml-1 hidden rtl:block rotate-180" />}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 sm:flex-none sm:min-w-[120px] bg-primary hover:bg-primary/90 text-white font-bold h-11"
              data-testid="button-wizard-next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1 rtl:rotate-180" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-accent hover:bg-accent/90 text-white font-bold h-11 sm:min-w-[200px]"
              data-testid="button-wizard-submit"
            >
              {isGenerating ? 'Analyzing...' : t('diagnostic.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
