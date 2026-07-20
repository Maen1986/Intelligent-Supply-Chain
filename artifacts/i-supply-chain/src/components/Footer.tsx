import React from 'react';
import { Logo } from './Logo';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#082C6B] text-white py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4 items-start">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm self-start">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-extrabold text-sm tracking-widest leading-none">SC</span>
            </div>
            <div className="font-bold text-primary tracking-[0.15em] uppercase text-sm sm:text-base leading-none">
              I Supply Chain
            </div>
          </div>
          <p className="text-white/80 max-w-sm text-sm leading-relaxed mt-2">
            {t('hero.headline')}
          </p>
          <p className="text-white/60 text-xs mt-4">
            {t('footer.rights')}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 md:items-end">
          <h3 className="font-bold text-lg mb-2">{t('footer.contact')}</h3>
          <p className="text-white/80 text-sm">{t('footer.mobile')}</p>
          <p className="text-white/80 text-sm">{t('footer.email')}</p>
          <div className="flex flex-wrap gap-4 mt-4 md:justify-end">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">{t('nav.home')}</Link>
            <Link href="/diagnostic" className="text-white/70 hover:text-white text-sm transition-colors">{t('diagnostic.title')}</Link>
            <Link href="/csr" className="text-white/70 hover:text-white text-sm transition-colors">{t('nav.csr')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
