import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import de from './locales/de/common.json';
import en from './locales/en/common.json';
import fa from './locales/fa/common.json';
import tr from './locales/tr/common.json';
import ar from './locales/ar/common.json';
import uk from './locales/uk/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { common: de },
      en: { common: en },
      fa: { common: fa },
      tr: { common: tr },
      ar: { common: ar },
      uk: { common: uk },
    },
    defaultNS: 'common',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'fa', 'tr', 'ar', 'uk'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bz_language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

/** RTL language codes */
export const RTL_LANGUAGES = new Set(['fa', 'ar']);

/** Language registry — used by LanguageSwitcher */
export const LANGUAGES = [
  { code: 'de', name: 'Deutsch',    nativeName: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇬🇧', dir: 'ltr' },
  { code: 'fa', name: 'Persian',    nativeName: 'فارسی',      flag: '🇮🇷', dir: 'rtl' },
  { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',     flag: '🇹🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  { code: 'uk', name: 'Ukrainian',  nativeName: 'Українська', flag: '🇺🇦', dir: 'ltr' },
];
