import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import de from './locales/de/common.json';
import en from './locales/en/common.json';
import fa from './locales/fa/common.json';

// `fa` is registered here so translation keys resolve to real Persian text
// (e.g. admin.inventory) if it's ever activated, but it is intentionally
// left out of `supportedLngs`/`LANGUAGES` below — Persian is not yet
// selectable in the UI and the rest of the app has no RTL support wired up.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { common: de },
      en: { common: en },
      fa: { common: fa },
    },
    defaultNS: 'common',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
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

/** Language registry — used by LanguageSwitcher */
export const LANGUAGES = [
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
];
