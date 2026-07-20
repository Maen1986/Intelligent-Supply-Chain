import React, { useState } from 'react';
import { Link } from 'wouter';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const navLinks = [
    { key: 'nav.home', href: '/' },
    { key: 'nav.solutions', href: '/#solutions' },
    { key: 'nav.industries', href: '/#industries' },
    { key: 'nav.packages', href: '/#packages' },
    { key: 'nav.csr', href: '/csr' },
    { key: 'nav.contact', href: '/consultant' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t(link.key as any)}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-medium" data-testid="button-lang-toggle">
            {lang === 'en' ? 'AR' : 'EN'}
          </Button>
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted" data-testid="button-login">
            {t('nav.loginRegister')}
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-medium">
            {lang === 'en' ? 'AR' : 'EN'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white p-4 flex flex-col gap-4 shadow-lg absolute w-full left-0">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-base font-medium text-foreground py-2 border-b border-border/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(link.key as any)}
            </Link>
          ))}
          <Button variant="outline" className="mt-2 w-full justify-center">
            {t('nav.loginRegister')}
          </Button>
        </div>
      )}
    </header>
  );
}
