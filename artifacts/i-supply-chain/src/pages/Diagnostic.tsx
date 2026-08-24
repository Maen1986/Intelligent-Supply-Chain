import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { generateReport, DiagnosticReport } from '@/lib/diagnosticEngine';
import { ReportOutput } from '@/components/ReportOutput';
import { FeedbackModal, shouldShowFeedback } from '@/components/FeedbackModal';
import { ChevronRight, ArrowLeft, Brain, Loader2 } from 'lucide-react';

import { API_BASE } from '@/lib/apiBase';
import { useRateLimitCountdown } from '@/hooks/useRateLimitCountdown';

// ── Symptom picker options (grounded in the real-world supply-chain problem
//    library — Section 12 Symptom-to-Root-Cause Library — so the free-text
//    box is no longer the only way a user can hand the AI something specific
//    to reason about). Keep ids stable: the backend keys off these exact ids.
//
//    focusAreas tags each symptom to the Step 5 focus-area value(s) (exact
//    strings from the Step 5 options list below) it is genuinely relevant
//    to, so Step 7 can show a shorter, more relevant subset instead of a
//    flat 8-item list (#181, Adaptive Diagnostic Interrogation v1 — a small
//    tag-and-filter pass, not a decision-tree engine). `focusAreas: null`
//    means "always show, not filterable" — reserved for 'other', the
//    explicit escape valve. A "Show all symptoms" reveal in Step 7 always
//    lets a user see the full list, so filtering never hides a real option
//    with no way back to it. ──
const SYMPTOM_OPTIONS = [
  { id: 'stockouts',            en: 'Stockouts / cannot fulfil orders',                        ar: 'نفاد المخزون / تعذّر تلبية الطلبات',
    focusAreas: ['Supply Chain Strategy', 'Risk Management', 'Resiliency'] as string[] },
  { id: 'excess_inventory',     en: 'Excess inventory / slow-moving stock',                     ar: 'مخزون زائد / بطيء الحركة',
    focusAreas: ['Supply Chain Strategy', 'Sustainability'] as string[] },
  { id: 'late_deliveries',      en: 'Late customer deliveries',                                 ar: 'تأخر التسليم للعملاء',
    focusAreas: ['Supply Chain Strategy', 'Supplier Governance', 'Risk Management', 'Resiliency'] as string[] },
  { id: 'high_cost',            en: 'High procurement / purchasing cost',                       ar: 'ارتفاع تكلفة الشراء/المشتريات',
    focusAreas: ['Procurement', 'CLM'] as string[] },
  { id: 'supplier_reliability', en: 'Supplier reliability issues (late, inconsistent, capacity)', ar: 'مشاكل موثوقية الموردين (تأخر، عدم اتساق، طاقة إنتاجية)',
    focusAreas: ['Procurement', 'CLM', 'Supplier Governance', 'Risk Management', 'Resiliency'] as string[] },
  { id: 'quality_defects',      en: 'Quality / defect issues',                                  ar: 'مشاكل الجودة / العيوب',
    focusAreas: ['Supplier Governance', 'Risk Management', 'Sustainability', 'Government Compliance'] as string[] },
  { id: 'data_visibility',      en: 'Data & visibility gaps (spreadsheets, ERP mismatches)',     ar: 'فجوات البيانات والرؤية (جداول بيانات، عدم تطابق ERP)',
    focusAreas: ['Supply Chain Strategy', 'Digital Transformation', 'Organizational Design', 'Government Compliance'] as string[] },
  { id: 'other',                en: 'Something else / not sure yet',                            ar: 'شيء آخر / لست متأكداً بعد',
    focusAreas: null as string[] | null },
] as const;

const FREQUENCY_OPTIONS = [
  { id: 'rare',       en: 'Rare',       ar: 'نادر' },
  { id: 'occasional', en: 'Occasional', ar: 'أحياناً' },
  { id: 'frequent',   en: 'Frequent',   ar: 'متكرر' },
  { id: 'constant',   en: 'Constant',   ar: 'مستمر' },
] as const;

const IMPACT_OPTIONS = [
  { id: 'not_sure', en: 'Not sure',  ar: 'غير متأكد' },
  { id: 'minor',    en: 'Minor',     ar: 'طفيف' },
  { id: 'moderate', en: 'Moderate',  ar: 'متوسط' },
  { id: 'severe',   en: 'Severe',    ar: 'كبير' },
] as const;

interface SymptomDetail { frequency: string; impact: string; }

export function Diagnostic() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Show the feedback modal once per session after the report is rendered
  useEffect(() => {
    if (!report) return;
    if (!shouldShowFeedback('diagnostic')) return;
    const id = setTimeout(() => setFeedbackOpen(true), 2500);
    return () => clearTimeout(id);
  }, [report]);

  // Server-honest retry countdown for the leads rate limit (resyncs on tab
  // wake/focus and when the local countdown reaches zero).
  const rateLimit = useRateLimitCountdown(`${API_BASE}/leads/diagnostic/rate-limit`);

  const [formData, setFormData] = useState({
    businessSize: '',
    region: '',
    industry: '',
    supplyChainType: '',
    focusArea: '',
    dataMaturity: '',
    challenge: '',
  });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomDetails, setSymptomDetails] = useState<Record<string, SymptomDetail>>({});
  // Step 7 symptom picker: on by default the grid is narrowed to the Step 5
  // focusArea answer (see SYMPTOM_OPTIONS.focusAreas above); this is a
  // one-way reveal — once a user asks to see everything we don't re-hide
  // anything, which keeps the escape hatch unambiguous and honest.
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  const totalSteps = 7;

  const handleNext = () => { if (step < totalSteps) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  // A symptom is "in focus" for the current Step 5 answer when it's tagged
  // null (always-show, e.g. 'other') or its focusAreas list includes the
  // selected focusArea.
  const isSymptomInFocus = (opt: (typeof SYMPTOM_OPTIONS)[number]) =>
    !opt.focusAreas || (opt.focusAreas as readonly string[]).includes(formData.focusArea);

  // What actually renders in the Step 7 grid: everything in focus, plus
  // anything already selected (even if the user then went back to Step 5
  // and picked a different focus area) so a prior selection is never made
  // invisible/unremovable, plus everything once "Show all symptoms" has
  // been used.
  const visibleSymptomOptions = SYMPTOM_OPTIONS.filter(
    (opt) => showAllSymptoms || isSymptomInFocus(opt) || symptoms.includes(opt.id),
  );
  const hasHiddenSymptoms = !showAllSymptoms && SYMPTOM_OPTIONS.some(
    (opt) => !isSymptomInFocus(opt) && !symptoms.includes(opt.id),
  );

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => {
      if (prev.includes(id)) {
        setSymptomDetails((d) => { const next = { ...d }; delete next[id]; return next; });
        return prev.filter((s) => s !== id);
      }
      setSymptomDetails((d) => ({ ...d, [id]: { frequency: '', impact: '' } }));
      return [...prev, id];
    });
  };

  const setSymptomField = (id: string, field: 'frequency' | 'impact', value: string) => {
    setSymptomDetails((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  // Compose the structured symptom picks into a plain-language block appended
  // to the free-text challenge, so the AI always has something concrete to
  // reason about even if the user skips the textarea entirely.
  const buildSymptomSummary = (): string => {
    if (symptoms.length === 0) return '';
    const lines = symptoms.map((id) => {
      const opt = SYMPTOM_OPTIONS.find((s) => s.id === id);
      const detail = symptomDetails[id];
      const freq = FREQUENCY_OPTIONS.find((f) => f.id === detail?.frequency)?.en;
      const imp = IMPACT_OPTIONS.find((i) => i.id === detail?.impact)?.en;
      const qualifiers = [freq && `frequency: ${freq}`, imp && `impact: ${imp}`].filter(Boolean).join(', ');
      return `- ${opt?.en}${qualifiers ? ` (${qualifiers})` : ''}`;
    });
    return `Reported symptoms:\n${lines.join('\n')}`;
  };

  const retryMessage = (seconds: number) => {
    if (seconds >= 3600) {
      return isAr
        ? 'لقد وصلت إلى الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى بعد حوالي ساعة.'
        : "You've reached the request limit. Please try again in about an hour.";
    }
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return isAr
        ? `لقد وصلت إلى الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى بعد حوالي ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}.`
        : `You've reached the request limit. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }
    return isAr
      ? `لقد وصلت إلى الحد الأقصى للطلبات. يمكنك المحاولة مرة أخرى خلال ${seconds} ${seconds === 1 ? 'ثانية' : 'ثوانٍ'}.`
      : `You've reached the request limit. You can try again in ${seconds} second${seconds === 1 ? '' : 's'}.`;
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    rateLimit.clear();

    const symptomSummary = buildSymptomSummary();
    const composedChallenge = [symptomSummary, formData.challenge.trim()].filter(Boolean).join('\n\n');

    let generated: DiagnosticReport;

    try {
      // ── Live AI diagnostic via GPT-4o (Ma'in Alhaqash persona) ────────────
      const res = await fetch(`${API_BASE}/diagnostic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSize:    formData.businessSize,
          region:          formData.region,
          industry:        formData.industry,
          supplyChainType: formData.supplyChainType,
          focusArea:       formData.focusArea,
          dataMaturity:    formData.dataMaturity,
          symptoms:        symptoms.map((id) => ({
            id,
            label:     SYMPTOM_OPTIONS.find((s) => s.id === id)?.en ?? id,
            frequency: symptomDetails[id]?.frequency || undefined,
            impact:    symptomDetails[id]?.impact || undefined,
          })),
          challenge:       composedChallenge,
          language:        lang,
        }),
      });

      // Any non-ok response (including 429 when AI is busy) → use fallback.
      // The rate-limit UI is only driven by the leads endpoint below.
      if (!res.ok) throw new Error(`AI diagnostic returned ${res.status}`);

      const data = await res.json();
      if (!data.report) throw new Error('AI diagnostic: missing report in response');
      generated = data.report as DiagnosticReport;
    } catch (err) {
      // ── Graceful fallback: static engine ensures the client always gets
      //    a report even if the AI service is temporarily unavailable ────────
      console.warn('[diagnostic] AI generation failed, using static fallback', err);
      generated = generateReport({ ...formData, challenge: composedChallenge } as any, lang);
    }

    // ── Lead capture: best-effort, never blocks the report ─────────────────
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/leads/diagnostic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSize:  formData.businessSize,
            region:        formData.region,
            industry:      formData.industry,
            focusArea:     formData.focusArea,
            challengeText: composedChallenge,
            reportSummary: generated.executiveSummary,
          }),
        });
        if (res.status === 429) {
          let seconds = Number(res.headers.get('Retry-After'));
          if (!Number.isFinite(seconds) || seconds <= 0) {
            const body = await res.json().catch(() => null);
            seconds = Number(body?.retryAfterSeconds) || 3600;
          }
          rateLimit.start(seconds);
        }
      } catch (e) { /* silent fail */ }
    })();

    // ── Usage logging: best-effort, never blocks the report ────────────────
    //    Persists every submission (region/industry/focus/etc.) to Postgres
    //    via the shared submissions table (tool: 'diagnostic'), so we have
    //    real data on how often non-GCC world regions are actually selected
    //    before investing in curated regional benchmark data for them.
    void fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'diagnostic',
        inputs: {
          businessSize:    formData.businessSize,
          region:          formData.region,
          industry:        formData.industry,
          supplyChainType: formData.supplyChainType,
          focusArea:       formData.focusArea,
          dataMaturity:    formData.dataMaturity,
          symptoms,
          challenge:       composedChallenge,
        },
        outputs: {
          executiveSummary: generated.executiveSummary,
        },
        language: lang,
      }),
    }).catch(() => { /* silent fail — logging must never block the report */ });

    setReport(generated);
    setIsGenerating(false);
  };

  if (report) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <div className="mb-4 sm:mb-6 no-print">
          <Button variant="ghost" onClick={() => setReport(null)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2 rtl:rotate-180" /> {isAr ? 'البدء من جديد' : 'Start Over'}
          </Button>
        </div>
        <ReportOutput report={report} />
        <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} tool="diagnostic" />
      </div>
    );
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.businessSize;
      case 2: return !!formData.region;
      case 3: return !!formData.industry;
      case 4: return !!formData.supplyChainType;
      case 5: return !!formData.focusArea;
      case 6: return !!formData.dataMaturity;
      case 7: return true;
      default: return false;
    }
  };

  const radioItemCls = 'flex items-center gap-3 border border-border p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer';

  const labelAr: Record<string, string> = {
    // Business size
    'Startup': 'شركة ناشئة',
    'SME': 'منشأة صغيرة ومتوسطة',
    'Mid-Market': 'الشركات المتوسطة',
    'Enterprise': 'مؤسسة كبرى',
    'Government Entity': 'جهة حكومية',
    // Region / country
    'Saudi Arabia': 'المملكة العربية السعودية',
    'United Arab Emirates': 'الإمارات العربية المتحدة',
    'Qatar': 'قطر',
    'Jordan': 'الأردن',
    'Oman': 'عُمان',
    'Bahrain': 'البحرين',
    'Other GCC': 'دول الخليج الأخرى',
    'North America': 'أمريكا الشمالية',
    'Europe': 'أوروبا',
    'Africa': 'أفريقيا',
    'Asia-Pacific': 'آسيا والمحيط الهادئ',
    'Latin America': 'أمريكا اللاتينية',
    'International (Other)': 'دولي (أخرى)',
    // Industry
    'Manufacturing': 'التصنيع',
    'Marine': 'القطاع البحري',
    'Retail': 'التجزئة',
    'FMCG': 'السلع الاستهلاكية سريعة الدوران',
    'Pharma': 'الأدوية',
    'Logistics': 'الخدمات اللوجستية',
    'Energy': 'الطاقة',
    'Construction': 'الإنشاءات',
    'Tech': 'التقنية',
    'Government': 'القطاع الحكومي',
    'Ecommerce': 'التجارة الإلكترونية',
    'Food & Beverage': 'الأغذية والمشروبات',
    'Healthcare': 'الرعاية الصحية',
    // Supply chain type
    'Make-to-Stock': 'الإنتاج للمخزون',
    'Make-to-Order': 'الإنتاج حسب الطلب',
    'Engineer-to-Order / Project-based': 'الهندسة حسب الطلب / قائم على المشاريع',
    'Distribution & Retail (no manufacturing)': 'التوزيع والتجزئة (بدون تصنيع)',
    // Focus area
    'Supply Chain Strategy': 'استراتيجية سلسلة الإمداد',
    'Procurement': 'المشتريات',
    'CLM': 'إدارة دورة حياة العقود',
    'Supplier Governance': 'حوكمة الموردين',
    'Risk Management': 'إدارة المخاطر',
    'Sustainability': 'الاستدامة',
    'Resiliency': 'المرونة التشغيلية',
    'Digital Transformation': 'التحول الرقمي',
    'Organizational Design': 'التصميم المؤسسي',
    'Government Compliance': 'الامتثال الحكومي',
    // Data & systems maturity
    'Spreadsheets & email-driven': 'جداول بيانات وبريد إلكتروني بشكل أساسي',
    'Core ERP, limited integration': 'نظام ERP أساسي، تكامل محدود',
    'Integrated ERP + WMS/TMS': 'تكامل ERP مع أنظمة المستودعات/النقل',
    'Advanced analytics & AI-enabled': 'تحليلات متقدمة ومدعومة بالذكاء الاصطناعي',
  };
  const optLabel = (opt: string) => (isAr ? labelAr[opt] ?? opt : opt);

  return (
    <div className="w-full">
      {/* Page Hero Banner */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img
          src="/brand/page-diagnostic.jpg"
          alt="AI Supply Chain Diagnostic"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/90 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{t('diagnostic.title')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            {isAr
              ? 'أكمل هذا التقييم المكوّن من سبع خطوات لتحصل فوراً على تقرير استراتيجي مُعد بالذكاء الاصطناعي ومصمم خصيصاً لمنشأتك.'
              : 'Complete this 7-step assessment to receive an instant, AI-generated strategic report tailored to your organization.'}
          </p>
        </div>
      </div>

      {/* Wizard */}
      <div className="container mx-auto px-4 py-10 sm:py-16 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-5 sm:p-6 md:p-10">

          {/* Step Progress */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors shrink-0 ${step >= i + 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded ${step > i + 1 ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[280px] sm:min-h-[300px]">

            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step1')}</h2>
                <RadioGroup value={formData.businessSize} onValueChange={(val) => setFormData(p => ({ ...p, businessSize: val }))} className="grid gap-3">
                  {['Startup', 'SME', 'Mid-Market', 'Enterprise', 'Government Entity'].map((opt) => (
                    <label key={opt} htmlFor={`bs-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`bs-${opt}`} />
                      <span className="flex-1 font-medium text-base">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step2')}</h2>
                <RadioGroup value={formData.region} onValueChange={(val) => setFormData(p => ({ ...p, region: val }))} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Jordan', 'Oman', 'Bahrain', 'Other GCC', 'North America', 'Europe', 'Africa', 'Asia-Pacific', 'Latin America', 'International (Other)'].map((opt) => (
                    <label key={opt} htmlFor={`rg-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`rg-${opt}`} />
                      <span className="flex-1 font-medium text-base">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step3')}</h2>
                <RadioGroup value={formData.industry} onValueChange={(val) => setFormData(p => ({ ...p, industry: val }))} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce', 'Food & Beverage', 'Healthcare'].map((opt) => (
                    <label key={opt} htmlFor={`ind-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`ind-${opt}`} />
                      <span className="flex-1 font-medium">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('diagnostic.step4')}</h2>
                <p className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base">
                  {isAr ? 'هذا يحدد نوع المخاطر والتوصيات الأنسب لعملياتك.' : "This shapes which risks and remedies actually apply to how you operate."}
                </p>
                <RadioGroup value={formData.supplyChainType} onValueChange={(val) => setFormData(p => ({ ...p, supplyChainType: val }))} className="grid gap-3">
                  {['Make-to-Stock', 'Make-to-Order', 'Engineer-to-Order / Project-based', 'Distribution & Retail (no manufacturing)'].map((opt) => (
                    <label key={opt} htmlFor={`sct-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`sct-${opt}`} />
                      <span className="flex-1 font-medium text-base">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">{t('diagnostic.step5')}</h2>
                <RadioGroup value={formData.focusArea} onValueChange={(val) => setFormData(p => ({ ...p, focusArea: val }))} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Supply Chain Strategy', 'Procurement', 'CLM', 'Supplier Governance', 'Risk Management', 'Sustainability', 'Resiliency', 'Digital Transformation', 'Organizational Design', 'Government Compliance'].map((opt) => (
                    <label key={opt} htmlFor={`fa-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`fa-${opt}`} />
                      <span className="flex-1 font-medium">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 6 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('diagnostic.step6')}</h2>
                <p className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base">
                  {isAr ? 'مدى نضج بياناتك يغيّر أي جذور المشاكل هي الأكثر ترجيحاً.' : "How mature your data/systems are changes which root causes are actually likely."}
                </p>
                <RadioGroup value={formData.dataMaturity} onValueChange={(val) => setFormData(p => ({ ...p, dataMaturity: val }))} className="grid gap-3">
                  {['Spreadsheets & email-driven', 'Core ERP, limited integration', 'Integrated ERP + WMS/TMS', 'Advanced analytics & AI-enabled'].map((opt) => (
                    <label key={opt} htmlFor={`dm-${opt}`} className={radioItemCls}>
                      <RadioGroupItem value={opt} id={`dm-${opt}`} />
                      <span className="flex-1 font-medium text-base">{optLabel(opt)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 7 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('diagnostic.step7')}</h2>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  {isAr
                    ? 'اختر ما ينطبق عليك — هذا هو أهم مُدخل نملكه لتخصيص تقريرك فعلياً.'
                    : "Pick what applies to you — this is the single most important input we have for actually personalizing your report."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {visibleSymptomOptions.map((opt) => {
                    const active = symptoms.includes(opt.id);
                    const keptFromEarlierAnswer = active && !showAllSymptoms && !isSymptomInFocus(opt);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleSymptom(opt.id)}
                        data-testid={`symptom-${opt.id}`}
                        className={`text-left p-3.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                          active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        {isAr ? opt.ar : opt.en}
                        {keptFromEarlierAnswer && (
                          <span className="block mt-0.5 text-xs font-normal opacity-70">
                            {isAr ? 'من إجابة سابقة' : 'From an earlier answer'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasHiddenSymptoms && (
                  <button
                    type="button"
                    onClick={() => setShowAllSymptoms(true)}
                    data-testid="button-show-all-symptoms"
                    className="text-sm font-semibold text-primary hover:underline mb-4"
                  >
                    {isAr ? 'إظهار كل الأعراض' : 'Show all symptoms'}
                  </button>
                )}
                {!hasHiddenSymptoms && <div className="mb-4" />}

                {symptoms.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {symptoms.map((id) => {
                      const opt = SYMPTOM_OPTIONS.find((s) => s.id === id)!;
                      const detail = symptomDetails[id] || { frequency: '', impact: '' };
                      return (
                        <div key={id} className="rounded-xl border border-border bg-muted/30 p-3.5">
                          <p className="font-semibold text-sm mb-2.5">{isAr ? opt.ar : opt.en}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'التكرار' : 'Frequency'}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {FREQUENCY_OPTIONS.map((f) => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setSymptomField(id, 'frequency', f.id)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                      detail.frequency === f.id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/40'
                                    }`}
                                  >
                                    {isAr ? f.ar : f.en}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'الأثر' : 'Impact'}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {IMPACT_OPTIONS.map((imp) => (
                                  <button
                                    key={imp.id}
                                    type="button"
                                    onClick={() => setSymptomField(id, 'impact', imp.id)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                      detail.impact === imp.id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/40'
                                    }`}
                                  >
                                    {isAr ? imp.ar : imp.en}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-sm font-medium text-foreground mb-2">
                  {isAr ? 'تفاصيل إضافية (اختياري)' : 'Anything else specific? (optional)'}
                </p>
                <Textarea
                  placeholder={isAr ? 'مثال: رقم القطعة، اسم المورد، الكمية، منذ متى...' : 'e.g. specific SKU, supplier name, quantities involved, how long this has been going on...'}
                  className="min-h-[110px] resize-none text-base"
                  value={formData.challenge}
                  onChange={(e) => setFormData(p => ({ ...p, challenge: e.target.value }))}
                />
              </div>
            )}
          </div>

          {rateLimit.limited && rateLimit.secondsLeft > 0 && (
            <div
              className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              role="alert"
              data-testid="notice-rate-limit"
            >
              {retryMessage(rateLimit.secondsLeft)}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-5 sm:pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isGenerating}
              className="min-w-[80px] sm:min-w-[112px] font-medium h-11"
              data-testid="button-wizard-back"
            >
              {step > 1 && <ArrowLeft className="w-4 h-4 mr-1 rtl:hidden" />}
              {isAr ? 'رجوع' : 'Back'}
              {step > 1 && <ArrowLeft className="w-4 h-4 ml-1 hidden rtl:block rotate-180" />}
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 sm:flex-none sm:min-w-[120px] bg-primary hover:bg-primary/90 text-white font-bold h-11"
                data-testid="button-wizard-next"
              >
                {isAr ? 'التالي' : 'Next'} <ChevronRight className="w-4 h-4 ml-1 rtl:rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isGenerating || rateLimit.limited}
                className="flex-1 sm:flex-none bg-accent hover:bg-accent/90 text-white font-bold h-11 sm:min-w-[200px]"
                data-testid="button-wizard-submit"
              >
                {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAr ? 'يُحلّل الذكاء الاصطناعي...' : 'AI is analysing…'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  {t('diagnostic.submit')}
                </span>
              )}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
