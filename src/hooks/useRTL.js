import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Syncs <html lang> with the active i18n language.
 * All supported languages (de, en) are LTR — direction is always 'ltr'.
 */
export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'de';
    document.documentElement.dir  = 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.classList.remove('rtl');
    document.documentElement.classList.add('ltr');
  }, [i18n.language]);
}
