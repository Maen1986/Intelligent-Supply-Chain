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
    // Simulate slight delay for "AI processing" feel
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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-6 no-print">
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
      case 5: return true; // optional
      default: return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[calc(100vh-200px)]">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{t('diagnostic.title')}</h1>
        <p className="text-muted-foreground">Complete this 5-step assessment to receive an instant, AI-generated strategic report tailored to your organization.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-border p-6 md:p-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i + 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${step > i + 1 ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('diagnostic.step1')}</h2>
              <RadioGroup 
                value={formData.businessSize} 
                onValueChange={(val) => setFormData(p => ({ ...p, businessSize: val }))}
                className="grid gap-3"
              >
                {['Startup', 'SME', 'Mid-Market', 'Enterprise', 'Government Entity'].map((opt) => (
                  <div key={opt} className="flex items-center space-x-3 space-x-reverse border border-border p-4 rounded-xl hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={opt} id={`bs-${opt}`} />
                    <Label htmlFor={`bs-${opt}`} className="flex-1 cursor-pointer font-medium text-base rtl:pr-2">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('diagnostic.step2')}</h2>
              <RadioGroup 
                value={formData.region} 
                onValueChange={(val) => setFormData(p => ({ ...p, region: val }))}
                className="grid gap-3"
              >
                {['International', 'Saudi Arabia', 'Jordan', 'Other GCC'].map((opt) => (
                  <div key={opt} className="flex items-center space-x-3 space-x-reverse border border-border p-4 rounded-xl hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={opt} id={`rg-${opt}`} />
                    <Label htmlFor={`rg-${opt}`} className="flex-1 cursor-pointer font-medium text-base rtl:pr-2">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('diagnostic.step3')}</h2>
              <RadioGroup 
                value={formData.industry} 
                onValueChange={(val) => setFormData(p => ({ ...p, industry: val }))}
                className="grid sm:grid-cols-2 gap-3"
              >
                {['Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce', 'Food & Beverage', 'Healthcare'].map((opt) => (
                  <div key={opt} className="flex items-center space-x-3 space-x-reverse border border-border p-3 rounded-lg hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={opt} id={`ind-${opt}`} />
                    <Label htmlFor={`ind-${opt}`} className="flex-1 cursor-pointer font-medium rtl:pr-2">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('diagnostic.step4')}</h2>
              <RadioGroup 
                value={formData.focusArea} 
                onValueChange={(val) => setFormData(p => ({ ...p, focusArea: val }))}
                className="grid sm:grid-cols-2 gap-3"
              >
                {['Supply Chain Strategy', 'Procurement', 'CLM', 'Supplier Governance', 'Risk Management', 'Sustainability', 'Resiliency', 'Digital Transformation', 'Organizational Design', 'Government Compliance'].map((opt) => (
                  <div key={opt} className="flex items-center space-x-3 space-x-reverse border border-border p-3 rounded-lg hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={opt} id={`fa-${opt}`} />
                    <Label htmlFor={`fa-${opt}`} className="flex-1 cursor-pointer font-medium rtl:pr-2">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('diagnostic.step5')}</h2>
              <p className="text-muted-foreground mb-6">Optional: Add specific context to improve your report.</p>
              <Textarea 
                placeholder="In a few sentences, describe your current supply chain challenge..."
                className="min-h-[150px] resize-none text-base"
                value={formData.challenge}
                onChange={(e) => setFormData(p => ({ ...p, challenge: e.target.value }))}
              />
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-between pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={step === 1 || isGenerating}
            className="w-28 font-medium"
          >
            {step > 1 && <ArrowLeft className="w-4 h-4 mr-2 rtl:hidden" />}
            Back
            {step > 1 && <ArrowLeft className="w-4 h-4 ml-2 hidden rtl:block rotate-180" />}
          </Button>

          {step < totalSteps ? (
            <Button 
              onClick={handleNext} 
              disabled={!isStepValid()}
              className="w-32 bg-primary hover:bg-primary/90 text-white font-bold"
            >
              Next <ChevronRight className="w-4 h-4 ml-2 rtl:rotate-180" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isGenerating}
              className="bg-accent hover:bg-accent/90 text-white font-bold min-w-[200px]"
            >
              {isGenerating ? "Analyzing..." : t('diagnostic.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
