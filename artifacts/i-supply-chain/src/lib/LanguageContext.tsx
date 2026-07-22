import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from './translations';

type Language = 'en' | 'ar';
type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('isc-lang');
      return saved === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (l: Language) => {
    setLangState(l);
    try { localStorage.setItem('isc-lang', l); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
