import React, { useState } from 'react';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';
import { Linkedin, Twitter, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/lib/apiBase';

export function Footer() {
  const { t, lang } = useLanguage();
  const ar = lang === 'ar';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || subscribing) return;
    setSubscribing(true);
    setSubscribeError(false);
    try {
      const res = await fetch(`${API_BASE}/leads/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setSubscribed(true);
      setEmail('');
    } catch {
      setSubscribeError(true);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#082C6B] text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <div className="bg-white p-3 rounded-xl shadow-sm self-start">
              <Logo />
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {ar
                ? 'استشارات متخصصة في سلسلة الإمداد تجمع بين التشخيص المدعوم بالذكاء الاصطناعي والخبرة البشرية الرفيعة، لخدمة المنشآت في دول الخليج والسعودية والأردن وحول العالم.'
                : 'A boutique supply chain consultancy combining AI-powered diagnostics with senior human expertise, serving organisations across the GCC, Saudi Arabia, Jordan, and internationally.'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={`https://wa.me/966549479722`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#25D366]/30 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 32 32" width="16" height="16" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.613 4.547 1.68 6.467L2.667 29.333l7.12-1.653A13.267 13.267 0 0 0 16.004 29.333C23.36 29.333 29.333 23.36 29.333 16S23.36 2.667 16.004 2.667zm6.08 15.733c-.334-.174-1.96-.974-2.267-1.08-.306-.107-.52-.16-.747.16-.226.32-.88 1.08-1.08 1.307-.2.226-.4.24-.733.08-.334-.16-1.4-.52-2.667-1.654-.987-.88-1.653-1.96-1.853-2.293-.2-.334-.014-.52.147-.68.147-.147.334-.373.493-.547.16-.173.214-.293.32-.507.107-.213.054-.4-.027-.546-.08-.147-.746-1.8-1.027-2.454-.266-.64-.546-.546-.746-.56-.2-.013-.427-.013-.654-.013-.226 0-.6.08-.907.4-.307.32-1.173 1.147-1.173 2.8 0 1.653 1.2 3.253 1.36 3.466.16.214 2.36 3.6 5.72 5.054.8.347 1.427.547 1.907.707.8.253 1.534.213 2.107.133.64-.094 1.96-.8 2.24-1.573.28-.774.28-1.44.2-1.574-.08-.133-.294-.213-.627-.386z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/50">{ar ? 'الخدمات' : 'Services'}</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'AI Supply Chain Diagnostic', labelAr: 'التشخيص الذكي لسلسلة الإمداد', href: '/diagnostic' },
                { label: 'Human Consultant Booking', labelAr: 'حجز استشاري متخصص', href: '/consultant' },
                { label: 'Supply Chain Strategy', labelAr: 'استراتيجية سلسلة الإمداد', href: '/#solutions' },
                { label: 'Procurement Excellence', labelAr: 'التميّز في المشتريات', href: '/#solutions' },
                { label: 'Contract Lifecycle Management', labelAr: 'إدارة دورة حياة العقود', href: '/#solutions' },
                { label: 'Risk Management', labelAr: 'إدارة المخاطر', href: '/risk-management' },
                { label: 'Governance & Compliance', labelAr: 'الحوكمة والامتثال', href: '/governance-compliance' },
                { label: 'CSR Free Support', labelAr: 'الدعم المجاني للمسؤولية الاجتماعية', href: '/csr' },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="text-white/70 hover:text-white text-sm transition-colors hover:translate-x-0.5 inline-block">
                  {ar ? l.labelAr : l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/50">{ar ? 'الشركة' : 'Company'}</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'About Us', labelAr: 'من نحن', href: '/about' },
                { label: 'Case Studies', labelAr: 'دراسات الحالة', href: '/case-studies' },
                { label: 'Insights', labelAr: 'الرؤى والمقالات', href: '/insights' },
                { label: 'Industries We Serve', labelAr: 'القطاعات التي نخدمها', href: '/#industries' },
                { label: 'Service Packages', labelAr: 'باقات الخدمات', href: '/#packages' },
                { label: 'CSR Programme', labelAr: 'برنامج المسؤولية الاجتماعية', href: '/csr' },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="text-white/70 hover:text-white text-sm transition-colors hover:translate-x-0.5 inline-block">
                  {ar ? l.labelAr : l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact & Newsletter */}
          <div className="flex flex-col gap-5">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/50">{ar ? 'تواصل معنا' : 'Get in Touch'}</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+966549479722" className="flex items-center gap-3 text-white/70 hover:text-white text-sm transition-colors">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                +966 549 479 722
              </a>
              <a href="mailto:maen.haqash@yahoo.com" className="flex items-center gap-3 text-white/70 hover:text-white text-sm transition-colors">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                maen.haqash@yahoo.com
              </a>
              <div className="flex items-start gap-3 text-white/70 text-sm">
                <MapPin className="w-4 h-4 shrink-0 text-accent mt-0.5" />
                <span>{ar ? 'الرياض، السعودية · عمّان، الأردن' : 'Riyadh, Saudi Arabia · Amman, Jordan'}</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-2">
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-3">{ar ? 'نشرة الرؤى الشهرية' : 'Monthly Insights Newsletter'}</p>
              {subscribed ? (
                <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-white/80 border border-white/20">
                  {ar ? '✓ تم اشتراكك — شكراً لك!' : "✓ You're subscribed — thank you!"}
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={ar ? 'بريدك الإلكتروني' : 'Your email'}
                      required
                      disabled={subscribing}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 min-w-0 disabled:opacity-60"
                    />
                    <Button type="submit" size="sm" disabled={subscribing} className="bg-accent hover:bg-accent/90 text-white px-3 shrink-0 disabled:opacity-60">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {subscribeError && (
                    <p className="text-red-300 text-xs mt-2">{ar ? 'تعذّر الاشتراك، حاول مرة أخرى.' : 'Something went wrong — please try again.'}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <div>
            <p>{lang === 'ar' ? '© 2026 آي سبلاي تشين. جميع الحقوق محفوظة.' : '© 2026 I Supply Chain. All Rights Reserved.'}</p>
            <p className="text-white/25 text-[10px] mt-0.5">{ar ? 'جميع الملكيات الفكرية والمنهجيات وأدوات الذكاء الاصطناعي والأطر مملوكة حصرياً لشركة ISC.' : 'All intellectual property, methodologies, AI tools & frameworks are exclusively owned by ISC.'}</p>
          </div>
          <div className="flex gap-5">
            <Link href="/legal" className="hover:text-white/70 transition-colors">{ar ? 'الإشعار القانوني والملكية الفكرية' : 'Legal & IP Notice'}</Link>
            <Link href="/legal" className="hover:text-white/70 transition-colors">{ar ? 'شروط الاستخدام' : 'Terms of Use'}</Link>
            <Link href="/csr" className="hover:text-white/70 transition-colors">{ar ? 'برنامج المسؤولية الاجتماعية' : 'CSR Programme'}</Link>
            <Link href="/data-sources" className="hover:text-white/70 transition-colors">{ar ? 'مصادر البيانات' : 'Data Sources'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
