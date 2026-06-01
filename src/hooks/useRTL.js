import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES } from '../i18n/index.js';

/**
 * Applies RTL/LTR direction to <html> whenever the active language changes.
 * Mount once at the app root (in App.jsx or main.jsx).
 *
 * Effects:
 *  - document.documentElement.dir  = 'rtl' | 'ltr'
 *  - document.documentElement.lang = language code
 *  - document.documentElement classList: adds 'rtl' or 'ltr' for CSS targeting
 */
export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'de';
    const dir  = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';

    document.documentElement.dir  = dir;
    document.documentElement.lang = lang;

    /* CSS class on <html> so selectors like [dir="rtl"] and .rtl both work */
    document.documentElement.classList.remove('rtl', 'ltr');
    document.documentElement.classList.add(dir);
  }, [i18n.language]);
}
