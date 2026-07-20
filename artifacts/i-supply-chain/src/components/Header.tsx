import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { key: 'nav.home', href: '/' },
  {
    key: 'nav.services', label: 'Services', children: [
      { key: 'nav.solutions', href: '/#solutions', label: 'Our Solutions' },
      { key: 'nav.packages', href: '/#packages', label: 'Packages' },
      { key: 'nav.diagnostic', href: '/diagnostic', label: 'AI Diagnostic' },
    ]
  },
  { key: 'nav.industries', href: '/#industries' },
  { key: 'nav.caseStudies', href: '/case-studies' },
  { key: 'nav.insights', href: '/insights' },
  { key: 'nav.about', href: '/about' },
  { key: 'nav.csr', href: '/csr' },
  { key: 'nav.contact', href: '/consultant' },
];

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  const toggleLanguage = () => setLang(lang === 'en' ? 'ar' : 'en');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setServicesOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  const navLabel = (key: string, fallback?: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      'nav.home':        { en: 'Home',         ar: 'الرئيسية' },
      'nav.services':    { en: 'Services',      ar: 'الخدمات' },
      'nav.solutions':   { en: 'Solutions',     ar: 'الحلول' },
      'nav.packages':    { en: 'Packages',      ar: 'الباقات' },
      'nav.diagnostic':  { en: 'AI Diagnostic', ar: 'التشخيص الذكي' },
      'nav.industries':  { en: 'Industries',    ar: 'القطاعات' },
      'nav.caseStudies': { en: 'Case Studies',  ar: 'دراسات الحالة' },
      'nav.insights':    { en: 'Insights',      ar: 'المقالات' },
      'nav.about':       { en: 'About',         ar: 'من نحن' },
      'nav.csr':         { en: 'CSR',           ar: 'المسؤولية الاجتماعية' },
      'nav.contact':     { en: 'Contact',       ar: 'تواصل معنا' },
    };
    return map[key]?.[lang] ?? fallback ?? key;
  };

  return (
    <header className={`sticky top-0 z-50 w-full bg-white border-b border-border transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.key} className="relative">
                <button
                  onClick={() => setServicesOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setServicesOpen(false), 150)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                >
                  {navLabel(link.key)}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-xl py-1.5 z-50">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {navLabel(child.key, child.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href!}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted ${
                  location === link.href && link.href !== '/#solutions' && link.href !== '/#packages' && link.href !== '/#industries'
                    ? 'text-primary bg-primary/5'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {navLabel(link.key)}
              </Link>
            )
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold text-muted-foreground hover:text-primary" data-testid="button-lang-toggle">
            {lang === 'en' ? 'AR' : 'EN'}
          </Button>
          <Link href="/consultant">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold px-5" data-testid="button-login">
              Book a Consultation
            </Button>
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden flex items-center gap-2">
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
        <div className="lg:hidden border-t border-border bg-white absolute w-full left-0 shadow-xl z-40 max-h-[80vh] overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.key}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-2">{navLabel(link.key)}</p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-6 py-2.5 text-base text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      {navLabel(child.key, child.label)}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 text-base font-medium rounded-lg transition-colors ${
                    location === link.href ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {navLabel(link.key)}
                </Link>
              )
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/consultant" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
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
