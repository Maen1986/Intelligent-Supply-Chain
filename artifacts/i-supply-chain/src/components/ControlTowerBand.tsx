import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { X, Brain, Zap, Clock, Wallet, UserCheck, ArrowRight, ArrowLeft, BarChart3, ShieldAlert, CalendarCheck, PiggyBank } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export const CONTROL_TOWER_DISMISS_KEY = 'isc_float_dismissed';

/**
 * In-page call-to-action for the AI Control Tower (Backlog #453 follow-up).
 * Replaces the old floating pop-up card, which covered page content.
 * Lives in the normal page flow just above the footer, so it can never overlap
 * anything, on any screen size. Dismissible for the session.
 */
export function ControlTowerBand() {
  const [location] = useLocation();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [dismissed, setDismissed] = useState(() => {
    try { return !!sessionStorage.getItem(CONTROL_TOWER_DISMISS_KEY); } catch { return false; }
  });

  if (dismissed || location === '/command-center') return null;

  const dismiss = () => {
    try { sessionStorage.setItem(CONTROL_TOWER_DISMISS_KEY, '1'); } catch { /* storage unavailable */ }
    setDismissed(true);
  };

  const deliverables = [
    { icon: BarChart3, en: 'Peer benchmarks', ar: 'مقارنة مع الأقران' },
    { icon: PiggyBank, en: 'Savings model', ar: 'نموذج التوفير' },
    { icon: ShieldAlert, en: 'Risk score', ar: 'مؤشر المخاطر' },
    { icon: CalendarCheck, en: '90-day plan', ar: 'خطة 90 يوماً' },
  ];
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section
      data-testid="control-tower-band"
      aria-label={ar ? 'برج التحكم الذكي' : 'AI Control Tower'}
      className="bg-[#082C6B] border-t-4 border-[#C9A84C]"
    >
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-[#C9A84C]" aria-hidden="true" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-[#C9A84C]">
                <Zap className="w-3 h-3" aria-hidden="true" /> {ar ? 'مدعوم بالذكاء الاصطناعي' : 'AI-Powered'}
              </span>
            </div>
            <h2 className="text-white font-bold text-xl md:text-2xl leading-tight mb-2">
              {ar ? 'احصل على إحاطة تنفيذية مخصصة لسلسلة الإمداد لديك' : 'Get a personalised executive briefing on your supply chain'}
            </h2>
            <ul className="flex flex-wrap gap-2 mb-3" aria-label={ar ? 'ما ستحصل عليه' : 'What you get'}>
              {deliverables.map(({ icon: Icon, en, ar: arLabel }) => (
                <li key={en} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white text-xs font-semibold px-3 py-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#C9A84C]" aria-hidden="true" /> {ar ? arLabel : en}
                </li>
              ))}
            </ul>
            <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1 text-white/75 text-xs">
              <li className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C9A84C]" aria-hidden="true" />{ar ? 'حوالي 5-7 دقائق لإكمال التقييم' : 'About 5-7 minutes to complete the assessment'}</li>
              <li className="inline-flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-[#C9A84C]" aria-hidden="true" />{ar ? 'حساب مجاني لإنشاء إحاطتك الكاملة' : 'Free account to generate your full briefing'}</li>
              <li className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-[#C9A84C]" aria-hidden="true" />{ar ? 'الاشتراكات تبدأ من 250 ريال شهرياً حسب حجم منشأتك' : 'Plans from SAR 250 / month, sized to your organisation'}</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-3 md:w-60 shrink-0">
            <Link
              href="/command-center"
              onClick={() => { try { sessionStorage.setItem(CONTROL_TOWER_DISMISS_KEY, '1'); } catch { /* ignore */ } }}
              className="inline-flex items-center justify-center gap-2 min-h-11 bg-[#C9A84C] hover:bg-[#b8973e] text-[#082C6B] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {ar ? 'استكشف برج التحكم' : 'Explore Control Tower'} <Arrow className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 text-white/70 hover:text-white text-xs font-semibold px-3 rounded-xl border border-white/20"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" /> {ar ? 'إخفاء' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
