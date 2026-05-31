import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { useAuth } from '../store/AuthContext';
import { supabase, AUTH_REDIRECT } from '../services/supabase';
import PasswordInput from '../components/ui/PasswordInput';

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
  const cls = `co-input${error ? ' co-input--error' : ''}`;
  return (
    <div className="co-field">
      <label className="co-label">{label}{required && <span className="co-required">*</span>}</label>
      {type === 'password' ? (
        <PasswordInput
          className={cls}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name}
        />
      ) : (
        <input
          className={cls}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name}
        />
      )}
      {error && <span className="co-field-error">{error}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORGOT PASSWORD FORM — email reset OR phone OTP
═══════════════════════════════════════════════════════ */
function ForgotPasswordForm({ onBack, showToast, onPhoneVerified }) {
  const [mode, setMode] = useState('email'); // 'email' | 'phone'

  // ── Email state ──────────────────────────────────────────
  const [email,        setEmail]        = useState('');
  const [emailSent,    setEmailSent]    = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError,   setEmailError]   = useState('');

  // ── Phone / OTP state ────────────────────────────────────
  const [phone,        setPhone]        = useState('');
  const [phoneStep,    setPhoneStep]    = useState('input'); // 'input' | 'otp'
  const [otp,          setOtp]          = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError,   setPhoneError]   = useState('');

  const inFlight = useRef(false);

  // ── Email: send reset link ───────────────────────────────
  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Pflichtfeld'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Ungültige E-Mail-Adresse');
      return;
    }
    inFlight.current = true;
    setEmailLoading(true);
    setEmailError('');

    // ── TEMP DEBUG — remove after email delivery is confirmed working ──
    console.log('📧 [email] sending reset email…', {
      to:         trimmed,
      provider:   'Supabase Auth  →  POST /auth/v1/recover',
      redirectTo: AUTH_REDIRECT,
      timestamp:  new Date().toISOString(),
    });

    try {
      const { data, error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: AUTH_REDIRECT,
      });

      // Log the raw provider response so the exact reply is visible
      console.log('📧 [email] provider raw response:', { data, error: err ?? null });

      if (err) {
        const msg = err.message?.toLowerCase() ?? '';
        const isRateLimit = msg.includes('rate') || msg.includes('limit') || msg.includes('too many');
        console.error('📧 [email] ❌ SMTP rejected request:', {
          code:      err.code    ?? '—',
          status:    err.status  ?? '—',
          message:   err.message ?? '—',
          rateLimit: isRateLimit,
          // If status 429 → rate-limited (2 emails/hr per address on Supabase free)
          // If status 422 → invalid email format (Supabase validation failed)
          // If status 500 → Supabase SMTP misconfiguration or provider outage
        });
        setEmailError(
          isRateLimit
            ? 'Zu viele Versuche. Bitte warte einige Minuten und versuche es erneut.'
            : err.message,
        );
        return;
      }

      // Supabase accepted the request — email is queued for delivery.
      // Note: Supabase returns success even for non-existent emails (enumeration
      // protection), so this log does NOT guarantee the inbox received the email.
      // To confirm delivery, check: Supabase Dashboard → Logs → Auth
      console.log('📧 [email] ✅ email sent successfully — Supabase accepted delivery for:', trimmed);
      setEmailSent(true);
      showToast('Passwort-Reset-Link gesendet!');
    } catch (thrown) {
      console.error('📧 [email] ❌ unexpected exception (network / CORS / env vars):', {
        message: thrown?.message,
        name:    thrown?.name,
        // If "Failed to fetch" → no network / Supabase project paused / CORS
        // If "supabase.auth.resetPasswordForEmail is not a function" → env vars missing, stub in use
      });
      setEmailError('Verbindungsfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      inFlight.current = false;
      setEmailLoading(false);
    }
  }

  // ── Phone: send OTP ──────────────────────────────────────
  async function handlePhoneSend(e) {
    e.preventDefault();
    if (inFlight.current) return;
    if (!phone.trim()) { setPhoneError('Pflichtfeld'); return; }
    inFlight.current = true;
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
      if (err) {
        const raw = err.message?.toLowerCase() ?? '';
        if (raw.includes('rate') || raw.includes('limit') || raw.includes('too many')) {
          setPhoneError('Zu viele Versuche. Bitte warte einige Minuten.');
        } else if (raw.includes('invalid') && raw.includes('phone')) {
          setPhoneError('Ungültige Telefonnummer. Bitte mit Ländervorwahl eingeben, z.B. +49…');
        } else {
          setPhoneError('SMS konnte nicht gesendet werden. Bitte versuche es erneut.');
        }
        return;
      }
      setPhoneStep('otp');
      showToast('SMS-Code gesendet!');
    } catch {
      setPhoneError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
    } finally {
      inFlight.current = false;
      setPhoneLoading(false);
    }
  }

  // ── Phone: verify OTP ────────────────────────────────────
  async function handleOtpVerify(e) {
    e.preventDefault();
    if (inFlight.current) return;
    if (!otp.trim()) { setPhoneError('Code eingeben'); return; }
    inFlight.current = true;
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: 'sms',
      });
      if (err) {
        const raw = err.message?.toLowerCase() ?? '';
        if (raw.includes('invalid') || raw.includes('expired') || raw.includes('incorrect')) {
          setPhoneError('Ungültiger oder abgelaufener Code. Bitte fordere einen neuen an.');
        } else if (raw.includes('rate') || raw.includes('limit')) {
          setPhoneError('Zu viele Versuche. Bitte warte einige Minuten.');
        } else {
          setPhoneError('Code konnte nicht bestätigt werden. Bitte versuche es erneut.');
        }
        return;
      }
      showToast('Bestätigt! Bitte neues Passwort festlegen.');
      onPhoneVerified();
    } catch {
      setPhoneError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
    } finally {
      inFlight.current = false;
      setPhoneLoading(false);
    }
  }

  // ── Resend handler (extracted — needs real try/catch for network errors) ──
  async function handleResendEmail() {
    setEmailLoading(true);
    setEmailError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_REDIRECT,
      });
      if (err) {
        const msg = err.message?.toLowerCase() ?? '';
        if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
          setEmailError('Limit erreicht: max. 2 Reset-E-Mails pro Stunde. Bitte warte kurz.');
        } else {
          setEmailError('Reset-E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.');
        }
      } else {
        showToast('Neuer Reset-Link gesendet!');
      }
    } catch {
      // Network failure, CORS, or Supabase project paused
      setEmailError('Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Email: link sent confirmation ────────────────────────
  if (emailSent) {
    return (
      <div className="co-form">
        <div className="co-form-header">
          <h2 className="co-form-title">Prüfe deine E-Mail</h2>
          {/* Honest message: Supabase returns success even for unregistered emails
              (enumeration protection), so we can't confirm delivery. */}
          <p className="co-form-sub">
            Falls <strong style={{ color: '#1A0A00' }}>{email}</strong> in unserem System
            registriert ist, erhältst du in Kürze einen Reset-Link.
            Der Link ist <strong>60 Minuten</strong> gültig.
          </p>
        </div>

        <div style={{
          background: 'rgba(26,10,0,0.04)',
          border: '1px solid rgba(26,10,0,0.09)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 20,
        }}>
          <p className="co-form-sub" style={{ fontWeight: 800, color: '#1A0A00', marginBottom: 6 }}>
            E-Mail nicht angekommen?
          </p>
          <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li className="co-form-sub">Prüfe deinen <strong>Spam- / Junk-Ordner</strong></li>
            <li className="co-form-sub">Warte bis zu <strong>5 Minuten</strong> — manchmal verzögert</li>
            <li className="co-form-sub">Klicke den Link im <strong>gleichen Browser</strong>, in dem du die Anfrage gestellt hast</li>
            <li className="co-form-sub">Nutze die Schaltfläche unten für einen neuen Link</li>
          </ul>
        </div>

        <button
          type="button"
          className="co-next-btn"
          style={{ marginBottom: 10 }}
          disabled={emailLoading}
          onClick={handleResendEmail}
        >
          {emailLoading ? <span className="co-spinner" /> : 'Neuen Link senden'}
        </button>

        {emailError && (
          <div className="auth-error-banner" style={{ marginBottom: 12 }}>{emailError}</div>
        )}

        <button type="button" className="co-back-link" onClick={onBack}>
          ← Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  // ── Phone: OTP entry ─────────────────────────────────────
  if (mode === 'phone' && phoneStep === 'otp') {
    return (
      <form className="co-form" onSubmit={handleOtpVerify} noValidate>
        <div className="co-form-header">
          <h2 className="co-form-title">Code eingeben</h2>
          <p className="co-form-sub">
            Wir haben einen 6-stelligen Code an{' '}
            <strong style={{ color: '#1A0A00' }}>{phone}</strong> gesendet.
            Dieser Code ist 10 Minuten gültig.
          </p>
        </div>

        {phoneError && <div className="auth-error-banner">{phoneError}</div>}

        <div className="co-fields">
          <Field
            label="Bestätigungscode"
            name="otp"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setPhoneError(''); }}
            placeholder="000000"
            required
            error=""
          />
        </div>

        <button type="submit" className="co-next-btn" disabled={phoneLoading}>
          {phoneLoading ? <span className="co-spinner" /> : 'Code bestätigen'}
        </button>
        <button
          type="button"
          className="co-back-link"
          style={{ marginTop: 10 }}
          onClick={() => { setPhoneStep('input'); setOtp(''); setPhoneError(''); }}
        >
          ← Anderen Code anfordern
        </button>
      </form>
    );
  }

  // ── Main form: email or phone input ─────────────────────
  const tabStyle = (active) => ({
    flex: 1, height: 40, borderRadius: 12,
    border: active ? '2px solid #C8001E' : '1.5px solid rgba(26,10,0,0.15)',
    background: active ? 'rgba(200,0,30,0.06)' : 'transparent',
    color: active ? '#C8001E' : '#8A7A6A',
    fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.15s ease',
  });

  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Passwort vergessen?</h2>
        <p className="co-form-sub">
          {mode === 'email'
            ? 'Wir senden dir einen Reset-Link per E-Mail.'
            : 'Wir senden dir einen Bestätigungscode per SMS.'}
        </p>
      </div>

      {/* Recovery method tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button type="button" style={tabStyle(mode === 'email')}
          onClick={() => { setMode('email'); setEmailError(''); setPhoneError(''); }}>
          ✉ E-Mail
        </button>
        <button type="button" style={tabStyle(mode === 'phone')}
          onClick={() => { setMode('phone'); setEmailError(''); setPhoneError(''); }}>
          📱 Telefon
        </button>
      </div>

      {mode === 'email' ? (
        <form onSubmit={handleEmailSubmit} noValidate>
          {emailError && <div className="auth-error-banner">{emailError}</div>}
          <div className="co-fields">
            <Field label="E-Mail" name="email" type="email" value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="max@beispiel.de" required error={emailError && !email ? emailError : ''} />
          </div>
          <button type="submit" className="co-next-btn" disabled={emailLoading}>
            {emailLoading ? <span className="co-spinner" /> : 'Reset-Link senden'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePhoneSend} noValidate>
          {phoneError && <div className="auth-error-banner">{phoneError}</div>}
          <div className="co-fields">
            <Field label="Telefonnummer" name="phone" type="tel" value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
              placeholder="+49 151 12345678" required error={phoneError && !phone ? phoneError : ''} />
          </div>
          <button type="submit" className="co-next-btn" disabled={phoneLoading}>
            {phoneLoading ? <span className="co-spinner" /> : 'Code senden'}
          </button>
        </form>
      )}

      <button type="button" className="co-back-link" style={{ marginTop: 10 }} onClick={onBack}>
        ← Zurück zur Anmeldung
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESET PASSWORD FORM (after clicking email link)
═══════════════════════════════════════════════════════ */
function ResetPasswordForm({ showToast, onDone }) {
  const [fields,      setFields]      = useState({ password: '', confirmPassword: '' });
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [sessionOk,   setSessionOk]   = useState(null); // null=checking, true=ok, false=missing
  const inFlight = useRef(false);

  // Verify an active recovery session exists before letting the user type anything.
  // supabase.auth.getSession() reads from localStorage — it's synchronous-fast.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const ok = !!(session?.user);
      setSessionOk(ok);
      console.log('[reset] session check on mount:', ok ? '✅ session present' : '❌ NO SESSION — updateUser will fail', {
        userId:    session?.user?.id    ?? '—',
        email:     session?.user?.email ?? '—',
        expiresAt: session?.expires_at  ?? '—',
      });
    });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;

    const errs = {};
    if (!fields.password)                errs.password        = 'Pflichtfeld';
    else if (fields.password.length < 8) errs.password        = 'Mindestens 8 Zeichen';
    if (!fields.confirmPassword)         errs.confirmPassword = 'Pflichtfeld';
    else if (fields.confirmPassword !== fields.password)
                                         errs.confirmPassword = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    inFlight.current = true;
    setLoading(true);

    console.log('[reset] attempting password update via supabase.auth.updateUser…');

    try {
      const { data, error } = await supabase.auth.updateUser({ password: fields.password });

      // Log the raw provider response
      console.log('[reset] updateUser raw response:', { data, error: error ?? null });

      if (error) {
        console.error('[reset] ❌ password update FAILED:', {
          message: error.message,
          code:    error.code    ?? '—',
          status:  error.status  ?? '—',
          // Common errors:
          // "Auth session missing!"          → no active session (link expired or wrong browser)
          // "New password should be different"→ same as old password
          // "Password should be at least 6 characters" → Supabase project min-length setting
        });

        // Map technical Supabase messages to user-friendly German
        const raw = error.message ?? '';
        let friendly = raw;
        if (raw.toLowerCase().includes('session missing') || raw.toLowerCase().includes('not authenticated')) {
          friendly = 'Deine Sitzung ist abgelaufen. Bitte fordere einen neuen Reset-Link an.';
        } else if (raw.toLowerCase().includes('different from the old')) {
          friendly = 'Das neue Passwort muss sich vom alten Passwort unterscheiden.';
        } else if (raw.toLowerCase().includes('at least')) {
          friendly = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
        }

        setErrors({ general: friendly });
        return;
      }

      console.log('[reset] ✅ password updated successfully for:', data?.user?.email ?? '—');
      showToast('Passwort erfolgreich geändert!');
      onDone();
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  // Still checking session
  if (sessionOk === null) {
    return (
      <div className="co-form" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <span className="co-spinner" />
      </div>
    );
  }

  // No session — link was expired, already used, or opened in different browser
  if (sessionOk === false) {
    return (
      <div className="co-form">
        <div className="co-form-header">
          <h2 className="co-form-title">Link ungültig</h2>
          <p className="co-form-sub">
            Dieser Reset-Link ist abgelaufen oder wurde bereits verwendet.
            Bitte fordere einen neuen Link an.
          </p>
        </div>
        <button
          type="button"
          className="co-next-btn"
          onClick={() => window.location.replace('/auth')}
        >
          Neuen Reset-Link anfordern
        </button>
      </div>
    );
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      <div className="co-form-header">
        <h2 className="co-form-title">Neues Passwort</h2>
        <p className="co-form-sub">Wähle ein neues, sicheres Passwort für dein Konto.</p>
      </div>

      {errors.general && <div className="auth-error-banner">{errors.general}</div>}

      <div className="co-fields">
        <Field label="Neues Passwort" name="password" type="password" value={fields.password}
          onChange={handleChange} placeholder="Mindestens 8 Zeichen" required error={errors.password} />
        <Field label="Passwort bestätigen" name="confirmPassword" type="password"
          value={fields.confirmPassword} onChange={handleChange} placeholder="••••••••"
          required error={errors.confirmPassword} />
      </div>

      <button type="submit" className="co-next-btn" disabled={loading}>
        {loading ? <span className="co-spinner" /> : 'Passwort speichern'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN TAB
═══════════════════════════════════════════════════════ */
function LoginForm({ onSuccess, showToast, onForgotPassword }) {
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
        <div className="co-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <label className="co-label" style={{ marginBottom: 0 }}>
              Passwort<span className="co-required">*</span>
            </label>
            <button type="button" className="co-forgot-link" onClick={onForgotPassword}>
              Passwort vergessen?
            </button>
          </div>
          <PasswordInput
            className={`co-input${errors.password ? ' co-input--error' : ''}`}
            name="password"
            value={fields.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {errors.password && <span className="co-field-error">{errors.password}</span>}
        </div>
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
        options: { emailRedirectTo: AUTH_REDIRECT },
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

  const searchParams = new URLSearchParams(location.search);
  const isReset = searchParams.get('reset') === '1';

  const defaultTab = location.state?.tab ?? 'login';
  const [tab,           setTab]           = useState(defaultTab);
  const [showForgot,    setForgot]        = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const returnTo = location.state?.returnTo ?? '/profile';

  useEffect(() => {
    if (!loading && isLoggedIn && !isReset && !phoneVerified) navigate(returnTo, { replace: true });
  }, [isLoggedIn, loading, navigate, returnTo, isReset, phoneVerified]);

  if (loading) return null;
  if (isLoggedIn && !isReset && !phoneVerified) return null;

  function handleSuccess() {
    navigate(returnTo, { replace: true });
  }

  // Password reset mode — email link OR phone OTP verified
  if (isReset || phoneVerified) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toast toast={toast} />
        <Navbar />
        <main className="co-main">
          <div className="co-wrap" style={{ maxWidth: 480 }}>
            <div className="co-panel">
              <ResetPasswordForm
                showToast={showToast}
                onDone={() => navigate('/profile', { replace: true })}
              />
            </div>
          </div>
        </main>
        <Socials />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toast toast={toast} />
      <Navbar />

      <main className="co-main">
        <div className="co-wrap" style={{ maxWidth: 480 }}>

          {!showForgot && (
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
          )}

          <div className="co-panel">
            {showForgot ? (
              <ForgotPasswordForm
                onBack={() => setForgot(false)}
                showToast={showToast}
                onPhoneVerified={() => { setForgot(false); setPhoneVerified(true); }}
              />
            ) : tab === 'login' ? (
              <LoginForm
                onSuccess={handleSuccess}
                showToast={showToast}
                onForgotPassword={() => setForgot(true)}
              />
            ) : (
              <RegisterForm onSuccess={handleSuccess} showToast={showToast} />
            )}
          </div>
        </div>
      </main>

      <Socials />
    </div>
  );
}
