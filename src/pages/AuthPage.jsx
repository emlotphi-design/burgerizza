import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { useAuth } from '../context/AuthContext';

/* ─── Shared glass input ────────────────────────────────── */
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
function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!fields.email.trim()) errs.email = 'Pflichtfeld';
    if (!fields.password)     errs.password = 'Pflichtfeld';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { user, error } = await login(fields.email, fields.password);
    setLoading(false);
    if (error) { setErrors({ general: error }); return; }
    onSuccess(user);
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      <div className="co-form-header">
        <h2 className="co-form-title">Willkommen zurück</h2>
        <p className="co-form-sub">Melde dich an, um deine Bestellungen zu verwalten.</p>
      </div>

      {errors.general && <div className="auth-error-banner">{errors.general}</div>}

      <div className="co-fields">
        <Field label="E-Mail" name="email" type="email" value={fields.email} onChange={handleChange}
          placeholder="max@beispiel.de" required error={errors.email} />
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
function RegisterForm({ onSuccess }) {
  const { register } = useAuth();
  const [fields, setFields] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!fields.fullName.trim()) errs.fullName = 'Pflichtfeld';
    if (!fields.email.trim()) errs.email = 'Pflichtfeld';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = 'Ungültige E-Mail';
    if (!fields.phone.trim()) errs.phone = 'Pflichtfeld';
    if (!fields.password) errs.password = 'Pflichtfeld';
    else if (fields.password.length < 8) errs.password = 'Mindestens 8 Zeichen';
    if (fields.confirmPassword !== fields.password) errs.confirmPassword = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { user, error } = await register({
      fullName: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      password: fields.password,
    });
    setLoading(false);
    if (error) { setErrors({ general: error }); return; }
    onSuccess(user);
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
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isLoggedIn } = useAuth();

  const defaultTab = location.state?.tab ?? 'login';
  const [tab, setTab] = useState(defaultTab);
  const returnTo   = location.state?.returnTo ?? '/profile';

  if (isLoggedIn) {
    navigate(returnTo, { replace: true });
    return null;
  }

  function handleSuccess() {
    navigate(returnTo, { replace: true });
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
              ? <LoginForm onSuccess={handleSuccess} />
              : <RegisterForm onSuccess={handleSuccess} />
            }
          </div>
        </div>
      </main>

      <Socials />
    </div>
  );
}
