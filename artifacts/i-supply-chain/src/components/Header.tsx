import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from './Logo';
import { PilotStatusBadge } from './PilotStatusBadge';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, ChevronDown, Phone, LogOut, User, Settings, LayoutDashboard, ClipboardList, ListChecks, Waves, Newspaper, LayoutGrid, BookOpen, Map as MapIcon, BarChart3 } from 'lucide-react';
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
  { key: 'nav.gccSeasonalCalendar', href: '/gcc-seasonal-calendar', label: '📅 Seasonal Calendar' },
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [location] = useLocation();

  const servicesRef = useRef<HTMLDivElement>(null);
  const industriesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

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
    setAccountOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
      if (industriesRef.current && !industriesRef.current.contains(e.target as Node)) setIndustriesOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
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

  const tabBase = 'relative flex items-center gap-0.5 xl:gap-1 px-1.5 xl:px-2 2xl:px-3 py-2 text-[12px] xl:text-[13px] 2xl:text-[15px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap';
  const tabActive = 'text-white bg-white/15';
  const tabIdle = 'text-white/80 hover:text-white hover:bg-white/10';
  const dropdownCls = `absolute top-full ${lang === 'ar' ? 'right-0' : 'left-0'} mt-2 bg-white border border-border rounded-2xl shadow-2xl py-2 z-50`;
  const dropItemCls = 'flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors';

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 bg-[#082C6B] ${scrolled ? 'shadow-lg' : 'shadow-md'} border-b border-white/10`}>

      {/* ── Single, narrower header row -- owner's call (31 Aug 2026): merge the
          two stacked bars (navy utility strip + white nav row) into one bar,
          with the phone/account/language items folded in on the right next
          to the CTA instead of stacked above it. ── */}
      {/* w-full (not the centered `container`) so the logo and CTA cluster
          sit near the bar's actual left/right edges on wide viewports,
          instead of being capped by container's max-width with unused
          navy margin on both sides -- reported live via screenshot. */}
      <div className="w-full px-4 sm:px-6 lg:px-4 xl:px-6 2xl:px-10 h-16 flex items-center justify-between gap-2 lg:gap-2 xl:gap-3 2xl:gap-4">
        <div className="flex items-center gap-3 shrink-0">
          {/* Chip height (44px logo + 8px padding = 52px) is kept well under
              the header's own h-16 (64px) bar so it never pokes out past the
              bar's top/bottom edge -- Logo's default 100px (used by
              Footer/Csr/ReportOutput, which aren't height-constrained like
              this) would overflow a 64px-tall container. */}
          <div className="bg-white rounded-xl px-2.5 py-1 shadow-sm">
            <Logo heightPx={44} />
          </div>
          <PilotStatusBadge lang={lang} className="hidden sm:inline-flex lg:hidden xl:inline-flex" />
        </div>

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

        {/* ── Desktop utility + CTA cluster -- everything that used to live in
            the separate navy bar now sits here, condensed, on one line. Icon-
            only below xl (phone, sign-in) to keep the single merged row from
            overflowing on common ~1280px laptop widths -- the earlier version
            overflowed the viewport horizontally at that size. ── */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink-0">
          <a href="tel:+966549479722" title="+966 549 479 722" className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors text-[14px] font-medium">
            <Phone className="w-[18px] h-[18px]" strokeWidth={2.25} />
            <span className="hidden xl:inline">+966 549 479 722</span>
          </a>

          {loading ? (
            <span data-testid="auth-loading-placeholder" className="w-20 h-3 rounded bg-muted animate-pulse inline-block" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <ScopedCommandBar />
              <NotificationsBell lang={lang} />
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className={`flex items-center gap-1.5 text-[14px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${accountOpen ? 'text-white bg-white/15' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={2.25} /> <span className="hidden 2xl:inline max-w-[110px] truncate">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountOpen && (
                  <div className={dropdownCls} style={{ minWidth: 220 }}>
                    {user.role === 'admin' && (
                      <Link href="/admin" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" /> {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                      </Link>
                    )}
                    <Link href="/brief" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <Newspaper className="w-4 h-4" /> {lang === 'ar' ? 'ملخصك' : 'Your Brief'}
                    </Link>
                    <Link href="/workbench" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <LayoutGrid className="w-4 h-4" /> {lang === 'ar' ? 'مساحة عملي' : 'My Workbench'}
                    </Link>
                    <Link href="/problem-map" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <MapIcon className="w-4 h-4" /> {lang === 'ar' ? 'خريطة المشكلات' : 'Problem Map'}
                    </Link>
                    <Link href="/industry-benchmark" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <BarChart3 className="w-4 h-4" /> {lang === 'ar' ? 'مقارنة القطاع' : 'Benchmark'}
                    </Link>
                    <Link href="/my-assessments" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <ClipboardList className="w-4 h-4" /> {lang === 'ar' ? 'تقييماتي' : 'My Assessments'}
                    </Link>
                    <Link href="/action-tracker" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <ListChecks className="w-4 h-4" /> {lang === 'ar' ? 'خطة العمل' : 'Action Tracker'}
                    </Link>
                    <Link href="/roi-waterfall" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <Waves className="w-4 h-4" /> {lang === 'ar' ? 'تحقيق القيمة' : 'Value Realization'}
                    </Link>
                    <Link href="/decision-memory" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <BookOpen className="w-4 h-4" /> {lang === 'ar' ? 'ذاكرة القرار' : 'Decision Memory'}
                    </Link>
                    <Link href="/account" className={dropItemCls} onClick={() => setAccountOpen(false)}>
                      <Settings className="w-4 h-4" /> {lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setAccountOpen(false); logout(); }}
                      className={`${dropItemCls} w-full text-left`}
                    >
                      <LogOut className="w-4 h-4" /> {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" title={lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'} className="flex items-center gap-1.5 text-[14px] font-semibold text-white/90 hover:text-white transition-colors">
              <User className="w-[18px] h-[18px]" strokeWidth={2.25} />
              <span className="hidden xl:inline">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </Link>
          )}

          <button onClick={toggleLanguage} className="text-[15px] font-bold text-white/90 hover:text-white transition-colors tracking-wide">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>

          <Link href="/consultant">
            <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold px-4 py-2 text-[14px] rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap">
              {/* Shorter label at lg (extra safety margin against the merged
                  row overflowing on ~1280px laptop widths); full label once
                  there's room at xl+. */}
              <span className="2xl:hidden">{lang === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
              <span className="hidden 2xl:inline">{lang === 'ar' ? 'احجز استشارة' : 'Book a Consultation'}</span>
            </Button>
          </Link>
        </div>

        {/* ── Mobile controls ── */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          {user && (
            <span className="text-white/80">
              <NotificationsBell lang={lang} />
            </span>
          )}
          <button onClick={toggleLanguage} className="text-sm font-bold text-white/70 hover:text-white px-2 py-1">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
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

            <div className="px-4 pb-2">
              <PilotStatusBadge lang={lang} />
            </div>

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
                  <Link href="/industry-benchmark" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
                    <BarChart3 className="w-4 h-4" /> {lang === 'ar' ? 'مقارنة القطاع' : 'Benchmark'}
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
