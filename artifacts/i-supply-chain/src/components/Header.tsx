import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X, ChevronDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const industryList = [
  { label: 'Manufacturing',   href: '/case-studies?industry=manufacturing' },
  { label: 'Energy & Oil',    href: '/case-studies?industry=energy' },
  { label: 'Government',      href: '/case-studies?industry=government' },
  { label: 'Pharmaceutical',  href: '/case-studies?industry=pharma' },
  { label: 'Retail & FMCG',  href: '/case-studies?industry=retail' },
  { label: 'Logistics',       href: '/case-studies?industry=logistics' },
  { label: 'Marine',          href: '/case-studies?industry=marine' },
  { label: 'Construction',    href: '/case-studies?industry=construction' },
  { label: 'Healthcare',      href: '/case-studies?industry=healthcare' },
  { label: 'Technology',      href: '/case-studies?industry=tech' },
];

const servicesList = [
  { key: 'nav.solutions',    href: '/#solutions',   label: 'Our Solutions' },
  { key: 'nav.packages',     href: '/#packages',    label: 'Packages & Pricing' },
  { key: 'nav.diagnostic',   href: '/diagnostic',   label: 'AI Diagnostic' },
  { key: 'nav.caseStudies',  href: '/case-studies', label: 'Case Studies' },
  { key: 'nav.intelligence', href: '/intelligence', label: 'Intelligence Hub' },
  { key: 'nav.maturity',     href: '/maturity',     label: 'Maturity Assessment' },
];

export function Header() {
  const { lang, setLang } = useLanguage();
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
      'nav.maturity':    { en: 'Maturity Assessment', ar: 'نضج سلسلة الإمداد' },
      'nav.industries':  { en: 'Industries',          ar: 'القطاعات' },
      'nav.insights':    { en: 'Insights',            ar: 'المقالات' },
      'nav.about':       { en: 'About',               ar: 'من نحن' },
      'nav.csr':         { en: 'CSR',                 ar: 'المسؤولية الاجتماعية' },
      'nav.contact':     { en: 'Contact',             ar: 'تواصل معنا' },
    };
    return map[key]?.[lang] ?? key;
  };

  const isActive = (href: string) =>
    href !== '/' ? location.startsWith(href.split('?')[0].replace('/#', '/')) : location === '/';

  /* ─── shared styles ─── */
  const tabBase =
    'relative flex items-center gap-1 px-4 py-2 text-[15px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap';
  const tabActive = 'text-primary bg-primary/8 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-primary after:rounded-full';
  const tabIdle   = 'text-gray-700 hover:text-primary hover:bg-primary/5';

  const dropdownCls  = 'absolute top-full left-0 mt-2 bg-white border border-border rounded-2xl shadow-2xl py-2 z-50';
  const dropItemCls  = 'flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors';

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${scrolled ? 'bg-white shadow-lg border-b border-border' : 'bg-white shadow-md border-b border-border'}`}>

      {/* ── Top utility bar ── */}
      <div className="hidden lg:flex items-center justify-end gap-6 px-6 py-1.5 bg-[#082C6B] text-white text-[12px] font-medium">
        <a href="tel:+966549479722" className="flex items-center gap-1.5 hover:text-[#C9A84C] transition-colors">
          <Phone className="w-3 h-3" />
          +966 549 479 722
        </a>
        <span className="text-white/40">|</span>
        <button onClick={toggleLanguage} className="hover:text-[#C9A84C] transition-colors font-semibold tracking-wide">
          {lang === 'en' ? 'عربي' : 'English'}
        </button>
      </div>

      {/* ── Main header row ── */}
      <div className="container mx-auto px-4 h-[68px] flex items-center justify-between gap-4">

        <Logo />

        {/* ── Desktop Nav tabs ── */}
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
                  <Link key={item.href} href={item.href} className={dropItemCls} onClick={() => setServicesOpen(false)}>
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
              <div className={dropdownCls} style={{ minWidth: 210 }}>
                <Link href="/#industries" className={dropItemCls} onClick={() => setIndustriesOpen(false)}>
                  All Industries
                </Link>
                <div className="border-t border-border my-1" />
                {industryList.map(ind => (
                  <Link key={ind.href} href={ind.href} className={dropItemCls} onClick={() => setIndustriesOpen(false)}>
                    {ind.label}
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
              Book a Consultation
            </Button>
          </Link>
        </div>

        {/* ── Mobile controls ── */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          <button onClick={toggleLanguage} className="text-sm font-bold text-muted-foreground hover:text-primary px-2 py-1">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-muted transition-colors"
            aria-label="Toggle menu"
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
              Home
            </Link>

            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 mt-3">Services</p>
            {servicesList.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className="block px-7 py-2.5 text-[15px] text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
                {navLabel(item.key)}
              </Link>
            ))}

            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 mt-3">Industries</p>
            {industryList.map(ind => (
              <Link key={ind.href} href={ind.href} onClick={() => setMobileMenuOpen(false)}
                className="block px-7 py-2.5 text-[15px] text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
                {ind.label}
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
              <a href="tel:+966549479722"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-primary text-primary font-semibold text-[15px] hover:bg-primary/5 transition-colors">
                <Phone className="w-4 h-4" />
                +966 549 479 722
              </a>
              <Link href="/consultant" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold text-[15px] py-3 rounded-xl">
                  Book a Consultation
                </Button>
              </Link>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
