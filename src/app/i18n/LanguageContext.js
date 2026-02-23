'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './translations/en';
import ar from './translations/ar';
import ku from './translations/ku';

const translations = { en, ar, ku };
const rtlLocales = ['ar', 'ku'];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  const t = translations[locale] || translations.en;

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved && translations[saved]) {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', dir);

    if (rtlLocales.includes(locale)) {
      document.body.style.fontFamily = 'var(--font-cairo), sans-serif';
    } else {
      document.body.style.fontFamily = '';
    }
  }, [locale, dir]);

  const changeLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLocale(lang);
      localStorage.setItem('locale', lang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, dir, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
