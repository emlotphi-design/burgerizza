import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/index.js';

/**
 * Language switcher dropdown.
 *
 * Props:
 *   compact  — show flag only, no text (default: false)
 *   dark     — dark-background variant for admin sidebar (default: false)
 */
export default function LanguageSwitcher({ compact = false, dark = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleOut(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleSelect(code) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div
      className={`lang-sw${dark ? ' lang-sw--dark' : ''}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="lang-sw-trigger"
        onClick={() => setOpen(v => !v)}
        aria-label={`Language: ${currentLang.nativeName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lang-sw-flag">{currentLang.flag}</span>
        {!compact && (
          <span className="lang-sw-name">
            {currentLang.nativeName}
          </span>
        )}
        <svg
          className={`lang-sw-chevron${open ? ' lang-sw-chevron--open' : ''}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="lang-sw-menu" role="listbox" aria-label="Select language">
          {LANGUAGES.map(lang => {
            const isActive = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`lang-sw-option${isActive ? ' lang-sw-option--active' : ''}`}
                onClick={() => handleSelect(lang.code)}
              >
                <span className="lang-sw-option-flag">{lang.flag}</span>
                <span className="lang-sw-option-name">
                  {lang.nativeName}
                </span>
                {isActive && (
                  <svg
                    className="lang-sw-check"
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
