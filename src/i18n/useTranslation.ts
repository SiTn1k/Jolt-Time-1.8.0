import { useState, useCallback, useMemo } from 'react';
import uk from './uk.json';
import en from './en.json';

export type Locale = 'uk' | 'en';

const translations = { uk, en };

type TranslationKey = string;

interface TranslationOptions {
  count?: number;
  [key: string]: string | number | undefined;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | Record<string, unknown> | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : (current as Record<string, unknown> | undefined);
}

function interpolate(text: string, options?: TranslationOptions): string {
  if (!options) return text;
  
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const value = options[key];
    if (value === undefined) return `{${key}}`;
    return String(value);
  });
}

export function useTranslation(initialLocale: Locale = 'uk') {
  const [locale, setLocale] = useState<Locale>(() => {
    // Try to get saved locale from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jolt_time_locale');
      if (saved === 'uk' || saved === 'en') {
        return saved as Locale;
      }
    }
    return initialLocale;
  });

  const t = useCallback((key: TranslationKey, options?: TranslationOptions): string => {
    const translation = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);
    
    if (translation === undefined) {
      // Fallback to Ukrainian if key not found in current locale
      const fallback = getNestedValue(translations.uk as unknown as Record<string, unknown>, key);
      if (fallback === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      return interpolate(String(fallback), options);
    }
    
    return interpolate(String(translation), options);
  }, [locale]);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jolt_time_locale', newLocale);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = locale === 'uk' ? 'en' : 'uk';
    changeLocale(newLocale);
  }, [locale, changeLocale]);

  return useMemo(() => ({
    locale,
    t,
    changeLocale,
    toggleLocale,
    isUkrainian: locale === 'uk',
    isEnglish: locale === 'en',
  }), [locale, t, changeLocale, toggleLocale]);
}

export type { TranslationOptions };
