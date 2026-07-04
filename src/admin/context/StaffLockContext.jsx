import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { STAFF_ADMIN_PASSWORD } from '../config/staffLock';

/* ─────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────── */
const StaffLockCtx = createContext(null);

export function useStaffLock() {
  return useContext(StaffLockCtx);
}

/* ─────────────────────────────────────────────────────────
   Password Modal
───────────────────────────────────────────────────────── */
const DOT_COUNT = Math.max(STAFF_ADMIN_PASSWORD.length, 4);

// Keypad layout: rows of [digit/action]
const KEYPAD = ['1','2','3','4','5','6','7','8','9','back','0','confirm'];

function LockSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#7A5C00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function BackspaceSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
      <line x1="18" y1="9" x2="12" y2="15"/>
      <line x1="12" y1="9" x2="18" y2="15"/>
    </svg>
  );
}

function CheckSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function StaffLockModal({ intendedPath, onSuccess, onCancel }) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);
  const navigate             = useNavigate();
  const isDark               = localStorage.getItem('adminTheme') === 'dark';

  const trySubmit = useCallback((currentPin) => {
    if (currentPin === STAFF_ADMIN_PASSWORD) {
      onSuccess();
      navigate(intendedPath);
    } else {
      setError(true);
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 420);
    }
  }, [intendedPath, navigate, onSuccess]);

  function handleKey(key) {
    setError(false);
    if (key === 'back') {
      setPin(p => p.slice(0, -1));
    } else if (key === 'confirm') {
      trySubmit(pin);
    } else if (pin.length < DOT_COUNT) {
      setPin(p => p + key);
    }
  }

  // Physical keyboard support
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === 'Backspace')    handleKey('back');
      else if (e.key === 'Enter')        trySubmit(pin);
      else if (e.key === 'Escape')       onCancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pin, trySubmit, onCancel]);

  return (
    <>
      {/* CSS keyframes — injected once */}
      <style>{`
        @keyframes sfFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes sfSlideUp  { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes sfShake    {
          0%,100% { transform:none }
          18%     { transform:translateX(-10px) }
          36%     { transform:translateX(10px) }
          54%     { transform:translateX(-6px) }
          72%     { transform:translateX(6px) }
        }
        .sf-key:active { transform:scale(0.91) !important; }
      `}</style>

      {/* Overlay — semi-transparent so Orders stays visible in background */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(10,5,0,0.50)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'sfFadeIn 0.15s ease both',
        }}
      />

      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, pointerEvents: 'none',
        }}
      >
        <div style={{
          background: isDark
            ? 'rgba(18,18,18,0.88)'
            : 'linear-gradient(160deg, #FFFFF8 0%, #FFFCE8 100%)',
          backdropFilter: isDark ? 'blur(24px) saturate(1.4)' : undefined,
          WebkitBackdropFilter: isDark ? 'blur(24px) saturate(1.4)' : undefined,
          borderRadius: 26,
          padding: '32px 26px 24px',
          width: '100%', maxWidth: 320,
          boxShadow: isDark
            ? '0 28px 72px rgba(0,0,0,0.72), 0 4px 16px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 28px 72px rgba(0,0,0,0.36), 0 4px 16px rgba(0,0,0,0.10)',
          border: isDark ? '1.5px solid rgba(250,204,21,0.22)' : '1.5px solid rgba(255,213,74,0.50)',
          pointerEvents: 'auto',
          animation: shake
            ? 'sfShake 0.42s ease'
            : 'sfSlideUp 0.2s cubic-bezier(0.22,1,0.36,1) both',
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(255,213,74,0.30), rgba(255,213,74,0.15))',
              border: '1.5px solid rgba(255,213,74,0.55)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, boxShadow: '0 4px 16px rgba(180,120,0,0.14)',
            }}>
              <LockSvg />
            </div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 18, color: isDark ? 'rgba(240,236,228,0.95)' : '#1A0A00', lineHeight: 1.2 }}>
              Admin-Zugang
            </div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12, color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(26,10,0,0.45)', marginTop: 4 }}>
              Bitte Passwort eingeben
            </div>
          </div>

          {/* PIN dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 11, marginBottom: error ? 8 : 22 }}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => {
              const filled = i < pin.length;
              return (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: filled
                    ? (error ? '#C8001E' : '#FFD23F')
                    : 'transparent',
                  border: `2.5px solid ${filled ? (error ? '#C8001E' : '#C09500') : isDark ? 'rgba(255,255,255,0.22)' : 'rgba(26,10,0,0.20)'}`,
                  transition: 'background 0.1s ease, border-color 0.1s ease',
                  boxShadow: filled && !error ? '0 0 0 3px rgba(255,213,74,0.25)' : 'none',
                }} />
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              textAlign: 'center', fontFamily: 'Nunito, sans-serif',
              fontSize: 12, fontWeight: 800, color: '#C8001E',
              marginBottom: 14,
            }}>
              Falsches Passwort — bitte erneut versuchen
            </div>
          )}

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {KEYPAD.map(key => {
              const isConfirm = key === 'confirm';
              const isBack    = key === 'back';
              return (
                <button
                  key={key}
                  type="button"
                  className="sf-key"
                  onClick={() => handleKey(key)}
                  style={{
                    height: 56,
                    borderRadius: 14,
                    border: isConfirm
                      ? '2px solid rgba(255,210,63,0.70)'
                      : isDark ? '1.5px solid rgba(255,255,255,0.10)' : '1.5px solid rgba(26,10,0,0.10)',
                    background: isConfirm
                      ? 'linear-gradient(135deg, #FFE970, #FFD23F)'
                      : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.68)',
                    color: isBack ? (isDark ? '#f87171' : '#B00018') : isDark ? 'rgba(240,236,228,0.90)' : '#1A0A00',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: isConfirm ? 900 : 700,
                    fontSize: isBack ? 15 : isConfirm ? 15 : 22,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isConfirm
                      ? '0 4px 16px rgba(180,120,0,0.22), inset 0 1px 0 rgba(255,255,255,0.60)'
                      : '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {isBack ? <BackspaceSvg /> : isConfirm ? <CheckSvg /> : key}
                </button>
              );
            })}
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            style={{
              marginTop: 16, width: '100%', padding: '9px',
              border: 'none', background: 'transparent',
              fontFamily: 'Nunito, sans-serif', fontWeight: 800,
              fontSize: 12, color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(26,10,0,0.35)',
              cursor: 'pointer', letterSpacing: '0.2px',
              transition: 'color 0.14s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(26,10,0,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(26,10,0,0.35)'; }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Provider
───────────────────────────────────────────────────────── */
export function StaffLockProvider({ children }) {
  // Unlock state is in-memory only: resets on every page load / refresh.
  const [unlocked, setUnlocked] = useState(false);
  // pending: { intendedPath } — set when a locked nav item or route is requested
  const [pending, setPending]   = useState(null);

  const requestUnlock = useCallback((intendedPath) => {
    if (unlocked) return; // already open — no modal needed
    setPending({ intendedPath });
  }, [unlocked]);

  function onUnlockSuccess() {
    setUnlocked(true);
    setPending(null);
  }

  function cancelModal() {
    setPending(null);
  }

  return (
    <StaffLockCtx.Provider value={{ unlocked, requestUnlock }}>
      {children}
      {pending && (
        <StaffLockModal
          intendedPath={pending.intendedPath}
          onSuccess={onUnlockSuccess}
          onCancel={cancelModal}
        />
      )}
    </StaffLockCtx.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   StaffLockedRoute
   Wraps protected admin route children.
   On mount: if locked → redirect to /admin/orders + show modal.
   If already unlocked → render children normally.
───────────────────────────────────────────────────────── */
export function StaffLockedRoute({ children }) {
  const { unlocked, requestUnlock } = useStaffLock();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    if (!unlocked) {
      requestUnlock(location.pathname);
      navigate('/admin/orders', { replace: true });
    }
  // Intentionally runs once on mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!unlocked) return null;
  return children;
}
