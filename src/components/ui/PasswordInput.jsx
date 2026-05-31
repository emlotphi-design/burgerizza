import { useState } from 'react';

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/**
 * Drop-in replacement for <input type="password"> that adds a visibility toggle.
 * Accepts the same props as <input> (except type, which is controlled internally).
 * Pass className and style the same way you'd style the underlying input.
 */
export default function PasswordInput({ className = '', style, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: 44, width: '100%', boxSizing: 'border-box', ...style }}
      />
      <button
        type="button"
        aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
        aria-pressed={visible}
        onClick={() => setVisible(v => !v)}
        style={{
          position:        'absolute',
          right:            0,
          top:              0,
          bottom:           0,
          width:            44,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          background:      'transparent',
          border:          'none',
          cursor:          'pointer',
          color:           '#8A7A6A',
          padding:          0,
          borderRadius:    '0 8px 8px 0',
          transition:      'color 0.15s ease',
          flexShrink:       0,
          outline:         'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#1A0A00'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8A7A6A'; }}
        onFocus={e => { e.currentTarget.style.color = '#1A0A00'; }}
        onBlur={e => { e.currentTarget.style.color = '#8A7A6A'; }}
      >
        {visible ? <EyeClosed /> : <EyeOpen />}
      </button>
    </div>
  );
}
