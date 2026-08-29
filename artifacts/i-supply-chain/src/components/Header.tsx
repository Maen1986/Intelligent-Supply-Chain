import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, ChevronDown, Phone, LogOut, User, Settings, LayoutDashboard, ClipboardList, ListChecks, Waves, Newspaper, LayoutGrid, BookOpen, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsBell } from './NotificationsBell';
import { ScopedCommandBar } from './ScopedCommandBar';

const industryList = [
  { label: 'Manufacturing',           labelAr: 'التصنيع',                    slug: 'manufacturing' },
  { label: 'Energy & Oil',            labelAr: 'الطاقة والنفط',              slug: 'energy' },
  { label: 'Government & Public Sector', labelAr: 'الحكومة والقطاع العام',   slug: 'government' },
  { label: 'Pharmaceutical',          labelAr: 'الأدوية',                    slug: 'pharma' },
  { label: 'Retail & FMCG',          labelAr: 'التجزئة والسلع الاستهلاكية', slug: 'retail' },
  { label: 'Logistics & Distribution', labelAr: 'الخدمات اللوجستية والتوزيع', slug: 'logistics' },
  { label: 'Marine & Port Operations', labelAr: 'العمليات البحرية والموانئ',  slug: 'marine' },
  { label: 'Construction & EPC',      labelAr: 'الإنشاءات والمقاولات',       slug: 'construction' },
  { label: 'Healthcare',              labelAr: 'الرعاية الصحية',             slug: 'healthcare' },
  { label: 'Technology & ICT',        labelAr: 'التقنية والاتصالات',         slug: 'tech' },
];

const servicesList = [
  { key: 'nav.commandCenter',href: '/command-center',          label: '⚡ Control Tower', highlight: true },
  { key: 'nav.solutions',    href: '/#solutions',              label: 'Our Solutions' },
  { key: 'nav.packages',     href: '/#packages',               label: 'Packages & Pricing' },
  { key: 'nav.diagnostic',   href: '/diagnostic',              label: 'AI Diagnostic' },
  { key: 'nav.maturity',     href: '/maturity',                label: 'Maturity Assessment' },
  { key: 'nav.lean',         href: '/lean-six-sigma',          label: 'Lean & Six Sigma' },
  { key: 'nav.risk',         href: '/risk-management',         label: 'Risk Management' },
  { key: 'nav.governance',   href: '/governance-compliance',   label: 'Governance & Compliance' },
  { key: 'nav.kraljic',     href: '/kraljic',                 label: '🧩 Kraljic Matrix' },
  { key: 'nav.decisionLab', href: '/decision-lab',             label: '⚖️ Decision Lab' },
  { key: 'nav.supplierDependency', href: '/supplier-dependency', label: '🔗 Supplier Dependency' },
  { key: 'nav.lcgpaReadiness', href: '/lcgpa-readiness', label: '🏛️ LCGPA Readiness' },
  { key: 'nav.freeZoneRouting', href: '/freezone-routing', label: '🏭 Free-Zone Routing' },
  { key: 'nav.caseStudies',  href: '/case-studies',            label: 'Case Studies' },
  { key: 'nav.intelligence', href: '/intelligence',            label: 'Intelligence Hub' },
];

export function Header() {
  const { lang, setLang } = useLanguage();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  const servicesRef = useRef<HTMLDivElement>(null);
  const industriesRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => setLang(lang === 'en' ? 'ar' : 'en');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setServicesOpen(false);
    setIndustriesOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
      if (industriesRef.current && !industriesRef.current.contains(e.target as Node)) setIndustriesOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLabel = (key: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      'nav.home':        { en: 'Home',               ar: 'الرئيسية' },
      'nav.services':    { en: 'Services',            ar: 'الخدمات' },
      'nav.solutions':   { en: 'Our Solutions',       ar: 'الحلول' },
      'nav.packages':    { en: 'Packages & Pricing',  ar: 'الباقات' },
      'nav.diagnostic':  { en: 'AI Diagnostic',       ar: 'التشخيص الذكي' },
      'nav.caseStudies': { en: 'Case Studies',        ar: 'دراسات الحالة' },
      'nav.intelligence':{ en: 'Intelligence Hub',    ar: 'المستجدات' },
      'nav.maturity':      { en: 'Maturity Assessment',       ar: 'نضج سلسلة الإمداد' },
      'nav.commandCenter': { en: '⚡ Control Tower',           ar: '⚡ برج التحكم' },
      'nav.lean':          { en: 'Lean & Six Sigma',           ar: 'لين وسيكس سيغما' },
      'nav.risk':          { en: 'Risk Management',            ar: 'إدارة المخاطر' },
      'nav.governance':    { en: 'Governance & Compliance',    ar: 'الحوكمة والامتثال' },
      'nav.industries':    { en: 'Industries',                 ar: 'القطاعات' },
      'nav.insights':      { en: 'Insights',                   ar: 'المقالات' },
      'nav.about':         { en: 'About',                      ar: 'من نحن' },
      'nav.csr':           { en: 'CSR',                        ar: 'المسؤولية الاجتماعية' },
      'nav.contact':       { en: 'Contact',                    ar: 'تواصل معنا' },
      'nav.kraljic':       { en: '🧩 Kraljic Matrix',          ar: '🧩 مصفوفة كرالجيك' },
      'nav.decisionLab':   { en: '⚖️ Decision Lab',            ar: '⚖️ مختبر القرار' },
      'nav.supplierDependency': { en: '🔗 Supplier Dependency', ar: '🔗 اعتمادية المورّد' },
      'nav.lcgpaReadiness': { en: '🏛️ LCGPA Readiness', ar: '🏛️ جاهزية المحتوى المحلي' },
      'nav.freeZoneRouting': { en: '🏭 Free-Zone Routing', ar: '🏭 توجيه المنطقة الحرة' },
    };
    return map[key]?.[lang] ?? key;
  };

  const isActive = (href: string) =>
    href.startsWith('/#') ? false : href !== '/' ? location.startsWith(href.split('?')[0]) : location === '/';

  const tabBase = 'relative flex items-center gap-1 px-4 py-2 text-[15px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap';
  const tabActive = 'text-primary bg-primary/8';
  const tabIdle = 'text-gray-700 hover:text-primary hover:bg-primary/5';
  const dropdownCls = `absolute top-full ${lang === 'ar' ? 'right-0' : 'left-0'} mt-2 bg-white border border-border rounded-2xl shadow-2xl py-2 z-50`;
  const dropItemCls = 'flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors';

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${scrolled ? 'bg-white shadow-lg border-b border-border' : 'bg-white shadow-md border-b border-border'}`}>

      {/* ── Top utility bar ── */}
      <div className="hidden lg:flex items-center justify-end gap-6 px-6 py-1.5 bg-[#082C6B] text-white text-[12px] font-medium">
        <a href="tel:+966549479722" className="flex items-center gap-1.5 hover:text-[#C9A84C] transition-colors">
          <Phone className="w-3 h-3" /> +966 549 479 722
        </a>
        <span className="text-white/40">|</span>
        {loading ? (
          <span data-testid="auth-loading-placeholder" className="w-24 h-3 rounded bg-white/20 animate-pulse inline-block" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-white/80">
              <User className="w-3 h-3" /> {user.fullName.split(' ')[0]}
            </span>
            {user.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
                <LayoutDashboard className="w-3 h-3" /> {lang === 'ar' ? 'لوحة الإدارة' : 'Admin'}
              </Link>
            )}
            <Link href="/brief" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <Newspaper className="w-3 h-3" /> {lang === 'ar' ? 'ملخصك' : 'Your Brief'}
            </Link>
            <Link href="/workbench" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <LayoutGrid className="w-3 h-3" /> {lang === 'ar' ? 'مساحة عملي' : 'My Workbench'}
            </Link>
            <Link href="/problem-map" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <MapIcon className="w-3 h-3" /> {lang === 'ar' ? 'خريطة المشكلات' : 'Problem Map'}
            </Link>
            <Link href="/my-assessments" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <ClipboardList className="w-3 h-3" /> {lang === 'ar' ? 'تقييماتي' : 'My Assessments'}
            </Link>
            <Link href="/action-tracker" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <ListChecks className="w-3 h-3" /> {lang === 'ar' ? 'خطة العمل' : 'Action Tracker'}
            </Link>
            <Link href="/roi-waterfall" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <Waves className="w-3 h-3" /> {lang === 'ar' ? 'تحقيق القيمة' : 'Value Realization'}
            </Link>
            <Link href="/decision-memory" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <BookOpen className="w-3 h-3" /> {lang === 'ar' ? 'ذاكرة القرار' : 'Decision Memory'}
            </Link>
            <Link href="/account" className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <Settings className="w-3 h-3" /> {lang === 'ar' ? 'إعدادات الحساب' : 'Account'}
            </Link>
            <ScopedCommandBar />
            <NotificationsBell lang={lang} />
            <button onClick={logout} className="flex items-center gap-1 hover:text-[#C9A84C] transition-colors">
              <LogOut className="w-3 h-3" /> {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </div>
        ) : (
          <Link href="/login" className="hover:text-[#C9A84C] transition-colors font-semibold">{lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</Link>
        )}
        <span className="text-white/40">|</span>
        <button onClick={toggleLanguage} className="hover:text-[#C9A84C] transition-colors font-semibold tracking-wide">
          {lang === 'en' ? 'عربي' : 'English'}
        </button>
      </div>

      {/* ── Main header row ── */}
      <div className="container mx-auto px-4 h-[68px] flex items-center justify-between gap-4">
        <Logo />

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">

          <Link href="/" className={`${tabBase} ${isActive('/') ? tabActive : tabIdle}`}>
            {navLabel('nav.home')}
          </Link>

          {/* Services dropdown */}
          <div ref={servicesRef} className="relative">
            <button
              onClick={() => { setServicesOpen(v => !v); setIndustriesOpen(false); }}
              className={`${tabBase} ${servicesOpen ? tabActive : tabIdle}`}
            >
              {navLabel('nav.services')}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicesOpen && (
              <div className={dropdownCls} style={{ minWidth: 230 }}>
                {servicesList.map(item => (
                  item.href.startsWith('/#')
                    ? <a key={item.href} href={item.href} className={dropItemCls} onClick={() => setServicesOpen(false)}>
                        {navLabel(item.key)}
                      </a>
                    : <Link key={item.href} href={item.href} className={dropItemCls} onClick={() => setServicesOpen(false)}>
                        {navLabel(item.key)}
                      </Link>
                ))}
              </div>
            )}
          </div>

          {/* Industries dropdown */}
          <div ref={industriesRef} className="relative">
            <button
              onClick={() => { setIndustriesOpen(v => !v); setServicesOpen(false); }}
              className={`${tabBase} ${industriesOpen ? tabActive : tabIdle}`}
            >
              {navLabel('nav.industries')}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${industriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {industriesOpen && (
              <div className={dropdownCls} style={{ minWidth: 230 }}>
                {industryList.map(ind => (
                  <Link
                    key={ind.slug}
                    href={`/industry/${ind.slug}`}
                    className={dropItemCls}
                    onClick={() => setIndustriesOpen(false)}
                  >
                    {lang === 'ar' ? ind.labelAr : ind.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/insights" className={`${tabBase} ${isActive('/insights') ? tabActive : tabIdle}`}>
            {navLabel('nav.insights')}
          </Link>

          <Link href="/about" className={`${tabBase} ${isActive('/about') ? tabActive : tabIdle}`}>
            {navLabel('nav.about')}
          </Link>

          <Link href="/csr" className={`${tabBase} ${isActive('/csr') ? tabActive : tabIdle}`}>
            {navLabel('nav.csr')}
          </Link>

          <Link href="/consultant" className={`${tabBase} ${isActive('/consultant') ? tabActive : tabIdle}`}>
            {navLabel('nav.contact')}
          </Link>

        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden lg:flex items-center shrink-0">
          <Link href="/consultant">
            <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold px-6 py-2.5 text-[15px] rounded-xl shadow-md hover:shadow-lg transition-all">
              {lang === 'ar' ? 'احجز استشارة' : 'Book a Consultation'}
            </Button>
          </Link>
        </div>

        {/* ── Mobile controls ── */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          {user && (
            <span className="text-gray-700">
              <NotificationsBell lang={lang} />
            </span>
          )}
          <button onClick={toggleLanguage} className="text-sm font-bold text-muted-foreground hover:text-primary px-2 py-1">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-muted transition-colors"
            aria-label={lang === 'ar' ? 'تبديل القائمة' : 'Toggle menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white absolute w-full left-0 shadow-2xl z-40 max-h-[85vh] overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">

            <Link href="/" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-semibold rounded-lg text-gray-800 hover:text-primary hover:bg-primary/5 transition-colors">
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>

            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 mt-3">{lang === 'ar' ? 'الخدمات' : 'Services'}</p>
            {servicesList.map(item => (
              item.href.startsWith('/#')
                ? <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-7 py-2.5 text-[15px] text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
                    {navLabel(item.key)}
                  </a>
                : <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className="block px-7 py-2.5 text-[15px] text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
                    {navLabel(item.key)}
                  </Link>
            ))}

            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 mt-3">{lang === 'ar' ? 'القطاعات' : 'Industries'}</p>
            {industryList.map(ind => (
              <Link key={ind.slug} href={`/industry/${ind.slug}`} onClick={() => setMobileMenuOpen(false)}
                className="block px-7 py-2.5 text-[15px] text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
                {lang === 'ar' ? ind.labelAr : ind.label}
              </Link>
            ))}

            <div className="border-t border-border my-3" />
            {[
              { label: navLabel('nav.insights'), href: '/insights' },
              { label: navLabel('nav.about'),    href: '/about' },
              { label: navLabel('nav.csr'),      href: '/csr' },
              { label: navLabel('nav.contact'),  href: '/consultant' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-base font-semibold rounded-lg transition-colors ${isActive(item.href) ? 'text-primary bg-primary/5' : 'text-gray-800 hover:text-primary hover:bg-muted'}`}>
                {item.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {loading ? (
                <div data-testid="auth-loading-placeholder-mobile" className="h-10 rounded-xl bg-muted animate-pulse" />
              ) : user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-4 py-2 bg-primary/5 rounded-xl">
                    <span className="text-sm font-semibold text-primary">{user.fullName}</span>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-sm text-red-500 font-semibold">{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</button>
                  </div>
                  <Link href="/brief" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <Newspaper className="w-4 h-4" /> {lang === 'ar' ? 'ملخصك' : 'Your Brief'}
                  </Link>
                  <Link href="/workbench" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <LayoutGrid className="w-4 h-4" /> {lang === 'ar' ? 'مساحة عملي' : 'My Workbench'}
                  </Link>
                  <Link href="/problem-map" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <MapIcon className="w-4 h-4" /> {lang === 'ar' ? 'خريطة المشكلات' : 'Problem Map'}
                  </Link>
                  <Link href="/my-assessments" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <ClipboardList className="w-4 h-4" /> {lang === 'ar' ? 'تقييماتي' : 'My Assessments'}
                  </Link>
                  <Link href="/action-tracker" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <ListChecks className="w-4 h-4" /> {lang === 'ar' ? 'خطة العمل' : 'Action Tracker'}
                  </Link>
                  <Link href="/roi-waterfall" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <Waves className="w-4 h-4" /> {lang === 'ar' ? 'تحقيق القيمة' : 'Value Realization'}
                  </Link>
                  <Link href="/decision-memory" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <BookOpen className="w-4 h-4" /> {lang === 'ar' ? 'ذاكرة القرار' : 'Decision Memory'}
                  </Link>
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <Settings className="w-4 h-4" /> {lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-primary text-primary font-semibold">{lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</Button>
                </Link>
              )}
              <a href="tel:+966549479722"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-primary text-primary font-semibold text-[15px] hover:bg-primary/5 transition-colors">
                <Phone className="w-4 h-4" /> +966 549 479 722
              </a>
              <Link href="/consultant" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold text-[15px] py-3 rounded-xl">
                  {lang === 'ar' ? 'احجز استشارة' : 'Book a Consultation'}
                </Button>
              </Link>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
