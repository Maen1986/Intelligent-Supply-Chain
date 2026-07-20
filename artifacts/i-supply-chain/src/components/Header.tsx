import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X, ChevronDown } from 'lucide-react';
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
  { key: 'nav.solutions',   href: '/#solutions',  label: 'Our Solutions' },
  { key: 'nav.packages',    href: '/#packages',   label: 'Packages' },
  { key: 'nav.diagnostic',  href: '/diagnostic',  label: 'AI Diagnostic' },
  { key: 'nav.caseStudies', href: '/case-studies',label: 'Case Studies' },
  { key: 'nav.intelligence',href: '/intelligence', label: 'Intelligence Hub' },
  { key: 'nav.maturity',    href: '/maturity',     label: 'Maturity Assessment' },
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

  // Close dropdowns on route change
  useEffect(() => {
    setServicesOpen(false);
    setIndustriesOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
      if (industriesRef.current && !industriesRef.current.contains(e.target as Node)) {
        setIndustriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLabel = (key: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      'nav.home':        { en: 'Home',         ar: 'الرئيسية' },
      'nav.services':    { en: 'Services',      ar: 'الخدمات' },
      'nav.solutions':   { en: 'Our Solutions', ar: 'الحلول' },
      'nav.packages':    { en: 'Packages',      ar: 'الباقات' },
      'nav.diagnostic':  { en: 'AI Diagnostic', ar: 'التشخيص الذكي' },
      'nav.caseStudies': { en: 'Case Studies',  ar: 'دراسات الحالة' },
      'nav.intelligence':{ en: 'Intelligence Hub',    ar: 'المستجدات' },
      'nav.maturity':    { en: 'Maturity Assessment', ar: 'نضج سلسلة الإمداد' },
      'nav.industries':  { en: 'Industries',    ar: 'القطاعات' },
      'nav.insights':    { en: 'Insights',      ar: 'المقالات' },
      'nav.about':       { en: 'About',         ar: 'من نحن' },
      'nav.csr':         { en: 'CSR',           ar: 'المسؤولية الاجتماعية' },
      'nav.contact':     { en: 'Contact',       ar: 'تواصل معنا' },
    };
    return map[key]?.[lang] ?? key;
  };

  const isActive = (href: string) =>
    href !== '/' ? location.startsWith(href) : location === '/';

  const dropdownCls = 'absolute top-full left-0 mt-1.5 bg-white border border-border rounded-2xl shadow-2xl py-2 z-50 min-w-[200px]';
  const dropItemCls = 'flex items-center gap-2 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors font-medium';

  return (
    <header className={`sticky top-0 z-50 w-full bg-white border-b border-border transition-shadow duration-200 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-0.5">

          {/* Home */}
          <Link href="/" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
            {navLabel('nav.home')}
          </Link>

          {/* Services dropdown */}
          <div ref={servicesRef} className="relative">
            <button
              onClick={() => { setServicesOpen(v => !v); setIndustriesOpen(false); }}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${servicesOpen ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}
            >
              {navLabel('nav.services')}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicesOpen && (
              <div className={dropdownCls} style={{ minWidth: 220 }}>
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
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${industriesOpen ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}
            >
              {navLabel('nav.industries')}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${industriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {industriesOpen && (
              <div className={dropdownCls} style={{ minWidth: 200 }}>
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

          {/* Insights */}
          <Link href="/insights" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/insights') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
            {navLabel('nav.insights')}
          </Link>

          {/* About */}
          <Link href="/about" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/about') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
            {navLabel('nav.about')}
          </Link>

          {/* CSR */}
          <Link href="/csr" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/csr') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
            {navLabel('nav.csr')}
          </Link>

          {/* Contact */}
          <Link href="/consultant" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/consultant') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
            {navLabel('nav.contact')}
          </Link>

        </nav>

        {/* Desktop Actions */}
        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold text-muted-foreground hover:text-primary">
            {lang === 'en' ? 'AR' : 'EN'}
          </Button>
          <Link href="/consultant">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold px-5">
              Book a Consultation
            </Button>
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="xl:hidden flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold text-muted-foreground">
            {lang === 'en' ? 'AR' : 'EN'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-white absolute w-full left-0 shadow-xl z-40 max-h-[85vh] overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">

            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium rounded-lg text-foreground hover:text-primary hover:bg-muted transition-colors">
              Home
            </Link>

            {/* Services group */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-2">Services</p>
            {servicesList.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-6 py-2.5 text-base text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                {navLabel(item.key)}
              </Link>
            ))}

            {/* Industries group */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-2">Industries</p>
            {industryList.map(ind => (
              <Link key={ind.href} href={ind.href} onClick={() => setMobileMenuOpen(false)} className="block px-6 py-2.5 text-base text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                {ind.label}
              </Link>
            ))}

            <div className="border-t border-border my-2" />
            {[
              { label: navLabel('nav.insights'),  href: '/insights' },
              { label: navLabel('nav.about'),     href: '/about' },
              { label: navLabel('nav.csr'),       href: '/csr' },
              { label: navLabel('nav.contact'),   href: '/consultant' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 text-base font-medium rounded-lg transition-colors ${isActive(item.href) ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'}`}>
                {item.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/consultant" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">Book a Consultation</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
