import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(undefined);

// English-only. Amharic and Afaan Oromoo language switching has been removed.
const LANGUAGE = 'en';

export function LanguageProvider({ children }) {
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  // Falls back to the raw key itself so a missing translation shows up as a
  // readable key rather than breaking the page.
  // Optional `vars` fills {placeholders}: t('key', { name: 'Abebe' }).
  const t = useCallback((key, vars) => {
    let str = translations.en[key] ?? key;
    if (vars && typeof str === 'string') {
      str = str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    }
    return str;
  }, []);

  const formatNumber = useCallback((n, opts) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n ?? '');
    try {
      return num.toLocaleString('en', opts);
    } catch {
      return String(num);
    }
  }, []);

  const formatDate = useCallback((value, opts, withTime = false) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    try {
      return withTime ? d.toLocaleString('en', opts) : d.toLocaleDateString('en', opts);
    } catch {
      return withTime ? d.toLocaleString('en') : d.toLocaleDateString('en');
    }
  }, []);

  // setLanguage is a no-op kept for API compatibility with any remaining callers
  const setLanguage = useCallback(() => {}, []);

  const value = useMemo(
    () => ({ language: LANGUAGE, setLanguage, t, formatNumber, formatDate }),
    [t, formatNumber, formatDate, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
