'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './translations/en';
import ar from './translations/ar';
import ku from './translations/ku';

const translations = { en, ar, ku };
const rtlLocales = ['ar', 'ku'];

const LanguageContext = createContext();

function createTranslationProxy(locale) {
  const active = translations[locale] || translations.en;
  const fallback = translations.en;
  const shouldWarn = process.env.NODE_ENV !== 'production';

  return new Proxy(active, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop];
      if (prop in target) return target[prop];

      // Fallback to English if present, but warn so we can reach full coverage.
      if (prop in fallback) {
        if (shouldWarn) {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] Missing key "${prop}" for locale "${locale}"`);
        }
        return fallback[prop];
      }

      if (shouldWarn) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing key "${prop}" (not in en, ar, ku)`);
      }
      return prop; // show key name so it’s obvious what to add
    },
  });
}

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  const t = createTranslationProxy(locale);

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
