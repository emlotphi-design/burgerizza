import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/* ─── Minimal toast ──────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((msg, type = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return [toast, show];
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 82,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: toast.type === 'error' ? '#C8001E' : '#3db96e',
        color: '#fff',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        fontSize: 13,
        padding: '9px 22px',
        borderRadius: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
        maxWidth: 'calc(100vw - 40px)',
        textAlign: 'center',
        pointerEvents: 'none',
        animation: 'toast-in 0.28s ease both',
        whiteSpace: 'nowrap',
      }}
    >
      {toast.msg}
    </div>
  );
}

/* ─── Shared glass input ─────────────────────────────────── */
function Field({ label, name, value, onChange, type = 'text', placeholder, required, error }) {
  return (
    <div className="co-field">
      <label className="co-label">{label}{required && <span className="co-required">*</span>}</label>
      <input
        className={`co-input${error ? ' co-input--error' : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={name}
      />
      {error && <span className="co-field-error">{error}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN TAB
═══════════════════════════════════════════════════════ */
function LoginForm({ onSuccess, showToast }) {
  const { login } = useAuth();
  const [fields,  setFields]  = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;

    const errs = {};
    if (!fields.email.trim()) errs.email    = 'Pflichtfeld';
    if (!fields.password)     errs.password = 'Pflichtfeld';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    inFlight.current = true;
    setLoading(true);
    try {
      const { user, error } = await login(fields.email, fields.password);
      if (error) { setErrors({ general: error }); return; }
      onSuccess(user);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      <div className="co-form-header">
        <h2 className="co-form-title">Willkommen zurück</h2>
        <p className="co-form-sub">Melde dich an, um deine Bestellungen zu verwalten.</p>
      </div>

      {errors.general && <div className="auth-error-banner">{errors.general}</div>}

      <div className="co-fields">
        <Field label="E-Mail" name="email" type="email" value={fields.email}
          onChange={handleChange} placeholder="max@beispiel.de" required error={errors.email} />
        <Field label="Passwort" name="password" type="password" value={fields.password}
          onChange={handleChange} placeholder="••••••••" required error={errors.password} />
      </div>

      <button type="submit" className="co-next-btn" disabled={loading}>
        {loading ? <span className="co-spinner" /> : 'Anmelden'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   REGISTER TAB
═══════════════════════════════════════════════════════ */
function RegisterForm({ onSuccess, showToast }) {
  const { register } = useAuth();
  const [fields, setFields] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [verifying,    setVerifying]    = useState(false);
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | sent | error
  const inFlight = useRef(false);

  async function handleResend() {
    if (resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: fields.email,
        options: { emailRedirectTo: window.location.origin },
      });
      console.log('[auth] resend →', error?.message ?? 'ok');
      if (error) {
        setResendStatus('error');
        showToast('Zu viele Versuche. Bitte warte einige Minuten.', 'error');
      } else {
        setResendStatus('sent');
        showToast('Bestätigungslink erneut gesendet!');
      }
    } catch (err) {
      console.error('[auth] resend threw:', err?.message);
      setResendStatus('error');
      showToast('Fehler beim Senden. Bitte versuche es erneut.', 'error');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;

    const errs = {};
    if (!fields.fullName.trim()) errs.fullName = 'Pflichtfeld';
    if (!fields.email.trim())    errs.email    = 'Pflichtfeld';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = 'Ungültige E-Mail';
    if (!fields.phone.trim())    errs.phone    = 'Pflichtfeld';
    if (!fields.password)        errs.password = 'Pflichtfeld';
    else if (fields.password.length < 8) errs.password = 'Mindestens 8 Zeichen';
    if (fields.confirmPassword !== fields.password) errs.confirmPassword = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    inFlight.current = true;
    setLoading(true);
    try {
      const { user, error, needsVerification } = await register({
        fullName: fields.fullName,
        email:    fields.email,
        phone:    fields.phone,
        password: fields.password,
      });
      if (error) { setErrors({ general: error }); return; }
      if (needsVerification) {
        showToast('Bestätigungslink wurde gesendet!');
        setVerifying(true);
        return;
      }
      onSuccess(user);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="co-form">
        <div className="co-form-header">
          <h2 className="co-form-title">E-Mail bestätigen</h2>
          <p className="co-form-sub">
            Wir haben einen Bestätigungslink an{' '}
            <strong style={{ color: '#1A0A00' }}>{fields.email}</strong> gesendet.
          </p>
        </div>

        <div style={{
          background: 'rgba(26,10,0,0.04)',
          border: '1px solid rgba(26,10,0,0.09)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 20,
        }}>
          <p className="co-form-sub" style={{ marginBottom: 6, fontWeight: 800, color: '#1A0A00' }}>
            E-Mail nicht angekommen?
          </p>
          <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li className="co-form-sub">Prüfe deinen <strong>Spam-Ordner</strong></li>
            <li className="co-form-sub">Warte bis zu <strong>5 Minuten</strong></li>
            <li className="co-form-sub">Nutze die Schaltfläche unten zum erneuten Senden</li>
          </ul>
        </div>

        <button
          type="button"
          className="co-next-btn"
          onClick={handleResend}
          disabled={resendStatus === 'sending' || resendStatus === 'sent'}
          style={{ marginBottom: 8 }}
        >
          {resendStatus === 'sending' ? <span className="co-spinner" /> :
           resendStatus === 'sent'    ? '✓ Erneut gesendet!' :
           'Bestätigungslink erneut senden'}
        </button>

        {resendStatus === 'error' && (
          <p style={{ color: '#C8001E', fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Supabase erlaubt nur 2 E-Mails/Stunde. Bitte warte kurz.
          </p>
        )}

        <button type="button" className="co-back-link" onClick={() => setVerifying(false)}>
          ← Andere E-Mail verwenden
        </button>
      </div>
    );
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      <div className="co-form-header">
        <h2 className="co-form-title">Konto erstellen</h2>
        <p className="co-form-sub">Speichere deine Bestellungen und Lieblingsrezepte.</p>
      </div>

      {errors.general && <div className="auth-error-banner">{errors.general}</div>}

      <div className="co-fields">
        <Field label="Vollständiger Name" name="fullName" value={fields.fullName}
          onChange={handleChange} placeholder="Max Mustermann" required error={errors.fullName} />
        <Field label="E-Mail" name="email" type="email" value={fields.email}
          onChange={handleChange} placeholder="max@beispiel.de" required error={errors.email} />
        <Field label="Telefon" name="phone" type="tel" value={fields.phone}
          onChange={handleChange} placeholder="+49 151 12345678" required error={errors.phone} />
        <Field label="Passwort" name="password" type="password" value={fields.password}
          onChange={handleChange} placeholder="Mindestens 8 Zeichen" required error={errors.password} />
        <Field label="Passwort bestätigen" name="confirmPassword" type="password"
          value={fields.confirmPassword} onChange={handleChange} placeholder="••••••••"
          required error={errors.confirmPassword} />
      </div>

      <button type="submit" className="co-next-btn" disabled={loading}>
        {loading ? <span className="co-spinner" /> : 'Konto erstellen'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN AUTH PAGE
═══════════════════════════════════════════════════════ */
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, loading } = useAuth();
  const [toast, showToast] = useToast();

  const defaultTab = location.state?.tab ?? 'login';
  const [tab, setTab] = useState(defaultTab);
  const returnTo = location.state?.returnTo ?? '/profile';

  useEffect(() => {
    if (!loading && isLoggedIn) navigate(returnTo, { replace: true });
  }, [isLoggedIn, loading, navigate, returnTo]);

  if (loading || isLoggedIn) return null;

  function handleSuccess() {
    navigate(returnTo, { replace: true });
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toast toast={toast} />
      <Navbar />

      <main className="co-main">
        <div className="co-wrap" style={{ maxWidth: 480 }}>

          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('login')}
            >
              Anmelden
            </button>
            <button
              className={`auth-tab${tab === 'register' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('register')}
            >
              Registrieren
            </button>
          </div>

          <div className="co-panel">
            {tab === 'login'
              ? <LoginForm onSuccess={handleSuccess} showToast={showToast} />
              : <RegisterForm onSuccess={handleSuccess} showToast={showToast} />
            }
          </div>
        </div>
      </main>

      <Socials />
    </div>
  );
}
