import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { usePizzaStore } from '../context/PizzaContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutStore } from '../store/checkoutStore';

/* ─── Delivery profile helpers ─────────────────────────── */
const REQUIRED_DELIVERY = ['fullName', 'street', 'houseNumber', 'postalCode', 'city', 'phone', 'email'];

const EMPTY_PROFILE = {
  fullName: '', street: '', houseNumber: '', postalCode: '',
  city: '', floor: '', doorbellName: '', phone: '', email: '',
};

/** Flatten a currentUser into the checkout form shape, with safe fallbacks */
function profileFromUser(user) {
  return {
    fullName:     user.fullName              ?? '',
    email:        user.email                 ?? '',
    phone:        user.phone                 ?? '',
    street:       user.address?.street       ?? '',
    houseNumber:  user.address?.houseNumber  ?? '',
    postalCode:   user.address?.postalCode   ?? '',
    city:         user.address?.city         ?? '',
    floor:        user.address?.floor        ?? '',
    doorbellName: user.address?.doorbellName ?? '',
  };
}

/** True when every required delivery field has content */
function isDeliveryComplete(p) {
  return REQUIRED_DELIVERY.every(k => p[k]?.trim());
}

/* Guest-only: cache delivery info in localStorage */
function readGuestProfile() {
  try { return JSON.parse(localStorage.getItem('bz_profile') ?? 'null') ?? {}; }
  catch { return {}; }
}
function saveGuestProfile(p) {
  try { localStorage.setItem('bz_profile', JSON.stringify(p)); } catch {}
}

/* ─── Price calc ────────────────────────────────────────── */
const BASE_PRICE = 10.99, CHEESE_ADD = 1.50, MEAT_ADD = 1.20, VEG_ADD = 0.80;
function calcPrice(p) {
  return BASE_PRICE + CHEESE_ADD + p.meats.length * MEAT_ADD + p.vegetables.length * VEG_ADD;
}

/* ─── Step indicator (dynamic) ─────────────────────────── */
function StepDots({ step, labels }) {
  return (
    <div className="co-steps">
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`co-step-dot${i + 1 === step ? ' co-step-dot--active' : i + 1 < step ? ' co-step-dot--done' : ''}`}>
            {i + 1 < step ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (i + 1)}
          </div>
          <span className={`co-step-label${i + 1 === step ? ' co-step-label--active' : ''}`}>{label}</span>
          {i < labels.length - 1 && <div className={`co-step-line${i + 1 < step ? ' co-step-line--done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Glass Input ───────────────────────────────────────── */
function GlassInput({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div className="co-field">
      <label className="co-label">{label}{required && <span className="co-required">*</span>}</label>
      <input
        className="co-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={name}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 1 — Delivery form
═══════════════════════════════════════════════════════ */
function StepDelivery({ profile, setProfile, onNext, autofilled }) {
  const [locLoading, setLocLoading] = useState(false);
  const [locError,   setLocError]   = useState('');
  const [errors,     setErrors]     = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const req = ['fullName', 'street', 'houseNumber', 'postalCode', 'city', 'phone', 'email'];
    const errs = {};
    req.forEach(k => { if (!profile[k]?.trim()) errs[k] = 'Pflichtfeld'; });
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Ungültige E-Mail';
    if (profile.phone && !/^[\d\s\+\-\(\)]{6,}$/.test(profile.phone)) errs.phone = 'Ungültige Nummer';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onNext();
  }

  function handleLocation() {
    if (!navigator.geolocation) { setLocError('Geolocation nicht unterstützt.'); return; }
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { 'Accept-Language': 'de' } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          setProfile(prev => ({
            ...prev,
            street:      a.road ?? prev.street,
            houseNumber: a.house_number ?? prev.houseNumber,
            postalCode:  a.postcode ?? prev.postalCode,
            city:        a.city ?? a.town ?? a.village ?? prev.city,
          }));
        } catch { setLocError('Adresse konnte nicht ermittelt werden.'); }
        finally  { setLocLoading(false); }
      },
      () => { setLocError('Standortzugriff verweigert.'); setLocLoading(false); }
    );
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      <div className="co-form-header">
        <h2 className="co-form-title">Lieferinformationen</h2>
        <p className="co-form-sub">Wohin soll deine Pizza geliefert werden?</p>
      </div>

      {autofilled && (
        <div className="co-autofill-notice">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Vorausgefüllt aus deinem Profil — Felder nach Bedarf bearbeiten
        </div>
      )}

      <button type="button" className="co-location-btn" onClick={handleLocation} disabled={locLoading}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" opacity=".3"/>
        </svg>
        {locLoading ? 'Ermittle Standort…' : 'Aktuellen Standort verwenden'}
      </button>
      {locError && <p className="co-loc-error">{locError}</p>}

      <div className="co-divider-label">oder manuell eingeben</div>

      <div className="co-fields">
        <GlassInput label="Vollständiger Name" name="fullName" value={profile.fullName} onChange={handleChange} placeholder="Max Mustermann" required />
        {errors.fullName && <span className="co-field-error">{errors.fullName}</span>}

        <div className="co-row">
          <div className="co-field co-field--grow">
            <GlassInput label="Straße" name="street" value={profile.street} onChange={handleChange} placeholder="Musterstraße" required />
            {errors.street && <span className="co-field-error">{errors.street}</span>}
          </div>
          <div className="co-field co-field--shrink">
            <GlassInput label="Hausnr." name="houseNumber" value={profile.houseNumber} onChange={handleChange} placeholder="12A" required />
            {errors.houseNumber && <span className="co-field-error">{errors.houseNumber}</span>}
          </div>
        </div>

        <div className="co-row">
          <div className="co-field co-field--shrink">
            <GlassInput label="PLZ" name="postalCode" value={profile.postalCode} onChange={handleChange} placeholder="10115" required />
            {errors.postalCode && <span className="co-field-error">{errors.postalCode}</span>}
          </div>
          <div className="co-field co-field--grow">
            <GlassInput label="Stadt" name="city" value={profile.city} onChange={handleChange} placeholder="Berlin" required />
            {errors.city && <span className="co-field-error">{errors.city}</span>}
          </div>
        </div>

        <div className="co-row">
          <div className="co-field co-field--half-equal">
            <GlassInput label="Etage" name="floor" value={profile.floor} onChange={handleChange} placeholder="2. OG" />
          </div>
          <div className="co-field co-field--half-equal">
            <GlassInput label="Klingelname" name="doorbellName" value={profile.doorbellName} onChange={handleChange} placeholder="Mustermann" />
          </div>
        </div>

        <GlassInput label="Telefon" name="phone" type="tel" value={profile.phone} onChange={handleChange} placeholder="+49 151 12345678" required />
        {errors.phone && <span className="co-field-error">{errors.phone}</span>}

        <GlassInput label="E-Mail" name="email" type="email" value={profile.email} onChange={handleChange} placeholder="max@beispiel.de" required />
        {errors.email && <span className="co-field-error">{errors.email}</span>}
      </div>

      <button type="submit" className="co-next-btn">
        Weiter zur Verifizierung
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 2 — OTP Verification (state owned by checkoutStore)
═══════════════════════════════════════════════════════ */
const OTP_LEN = 6;

function StepVerification({ profile, onNext, onBack }) {
  const {
    otpCode, otpSent, otpSending, otpError, resendTimer,
    sendOtp, verifyOtp,
  } = useCheckoutStore();

  const [method, setMethod] = useState('email');
  const [otp,    setOtp]    = useState(Array(OTP_LEN).fill(''));
  const inputRefs            = useRef([]);

  /* Reset input boxes and focus first cell after code is sent */
  useEffect(() => {
    if (otpSent) {
      setOtp(Array(OTP_LEN).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    }
  }, [otpSent]);

  function handleOtpChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (text.length === OTP_LEN) {
      setOtp(text.split(''));
      inputRefs.current[OTP_LEN - 1]?.focus();
    }
    e.preventDefault();
  }

  function handleVerify() {
    if (verifyOtp(otp.join(''))) onNext();
  }

  const destination = method === 'email' ? profile.email : profile.phone;

  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Verifizierung</h2>
        <p className="co-form-sub">Wir senden dir einen 6-stelligen Code zur Bestätigung.</p>
      </div>

      {!otpSent ? (
        <>
          <div className="co-method-tabs">
            <button type="button" className={`co-method-tab${method === 'email' ? ' co-method-tab--active' : ''}`} onClick={() => setMethod('email')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
              E-Mail
            </button>
            <button type="button" className={`co-method-tab${method === 'whatsapp' ? ' co-method-tab--active' : ''}`} onClick={() => setMethod('whatsapp')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.565 4.135 1.548 5.86L0 24l6.336-1.52A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.681-.513-5.21-1.407l-.375-.219-3.884.933.976-3.786-.243-.39A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp
            </button>
          </div>
          <div className="co-send-info">Code senden an: <strong>{destination || '—'}</strong></div>
          {import.meta.env.DEV && (
            <div className="co-dev-hint">DEV CODE: <strong>123456</strong></div>
          )}
          <button type="button" className="co-next-btn" onClick={sendOtp} disabled={otpSending}>
            {otpSending ? <span className="co-spinner" /> : (
              <>
                Code senden
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2 15 22 11 13 2 9l20-7z"/>
                </svg>
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="co-otp-sent">
            <div className="co-otp-sent-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2 15 22 11 13 2 9l20-7z"/>
              </svg>
            </div>
            <p>Bestätigungscode gesendet an <strong>{destination}</strong></p>
          </div>
          {import.meta.env.DEV && (
            <div className="co-dev-hint">DEV CODE: <strong>{otpCode}</strong></div>
          )}
          <div className="co-otp-row" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                className={`co-otp-box${digit ? ' co-otp-box--filled' : ''}${otpError ? ' co-otp-box--error' : ''}`}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKey(i, e)}
              />
            ))}
          </div>
          {otpError && <p className="co-otp-error">{otpError}</p>}
          <button type="button" className="co-next-btn" onClick={handleVerify} disabled={otp.join('').length < OTP_LEN}>
            Bestätigen
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <div className="co-resend-row">
            {resendTimer > 0
              ? <span className="co-resend-timer">Erneut senden in {resendTimer}s</span>
              : <button type="button" className="co-resend-btn" onClick={sendOtp}>Code erneut senden</button>
            }
          </div>
        </>
      )}

      <button type="button" className="co-back-link" onClick={onBack}>← Zurück zur Lieferadresse</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 3 — Create Account (only when not logged in)
═══════════════════════════════════════════════════════ */
function StepAccount({ profile, onSkip, onCreated }) {
  const { register } = useAuth();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);

  async function handleCreate() {
    const errs = {};
    if (!password)             errs.password = 'Pflichtfeld';
    else if (password.length < 8) errs.password = 'Mindestens 8 Zeichen';
    if (confirm !== password)  errs.confirm = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { user, error } = await register({
      fullName: profile.fullName,
      email:    profile.email,
      phone:    profile.phone,
      password,
      address: {
        street:      profile.street,
        houseNumber: profile.houseNumber,
        postalCode:  profile.postalCode,
        city:        profile.city,
        floor:       profile.floor,
        doorbellName: profile.doorbellName,
      },
    });
    setLoading(false);
    if (error) { setErrors({ general: error }); return; }
    onCreated(user);
  }

  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Konto erstellen</h2>
        <p className="co-form-sub">
          Speichere deine Bestellungen und Lieblingsrezepte für das nächste Mal.
        </p>
      </div>

      <div className="co-account-summary">
        <div className="co-account-avatar">{profile.fullName.slice(0, 2).toUpperCase() || '?'}</div>
        <div>
          <strong>{profile.fullName}</strong>
          <span>{profile.email}</span>
        </div>
      </div>

      {errors.general && <div className="auth-error-banner">{errors.general}</div>}

      <div className="co-fields">
        <div className="co-field">
          <label className="co-label">Passwort<span className="co-required">*</span></label>
          <input className="co-input" type="password" value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="Mindestens 8 Zeichen" autoComplete="new-password" />
          {errors.password && <span className="co-field-error">{errors.password}</span>}
        </div>
        <div className="co-field">
          <label className="co-label">Passwort bestätigen<span className="co-required">*</span></label>
          <input className="co-input" type="password" value={confirm}
            onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
            placeholder="••••••••" autoComplete="new-password" />
          {errors.confirm && <span className="co-field-error">{errors.confirm}</span>}
        </div>
      </div>

      <button type="button" className="co-next-btn" onClick={handleCreate} disabled={loading}>
        {loading ? <span className="co-spinner" /> : (
          <>
            Konto erstellen & weiter
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>

      <button type="button" className="co-back-link" style={{ opacity: 0.7 }} onClick={onSkip}>
        Ohne Konto fortfahren →
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP — Payment
═══════════════════════════════════════════════════════ */
const PAYMENT_METHODS = [
  {
    id: 'paypal', label: 'PayPal', sub: 'Schnell & sicher bezahlen',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M20.067 8.478c.492.315.844.825.983 1.39.387 1.592-.948 3.097-2.83 3.097h-.638c-.22 0-.408.16-.443.378l-.483 3.08-.136.864a.45.45 0 0 1-.445.378H13.9a.27.27 0 0 1-.267-.31l.572-3.635.025-.157a.45.45 0 0 1 .445-.378h.934c1.882 0 3.217-1.505 2.83-3.097a2.067 2.067 0 0 0-.372-.61z" fill="#009cde"/>
        <path d="M8.526 3h5.417c.638 0 1.233.047 1.776.147.155.027.306.058.453.093a5.1 5.1 0 0 1 1.798.82c.491.315.843.825.982 1.39.387 1.592-.948 3.097-2.83 3.097H13.48a.45.45 0 0 0-.444.378l-.628 3.993-.094.6-.483 3.08-.136.864a.45.45 0 0 1-.445.378H8.94a.27.27 0 0 1-.267-.31L10.39 7.38l.025-.157.025-.157.572-3.635A.27.27 0 0 1 11.278 3H8.526z" fill="#003087"/>
      </svg>
    ),
  },
  {
    id: 'card', label: 'Kreditkarte', sub: 'Visa, Mastercard, Amex',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A0A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>
      </svg>
    ),
  },
  {
    id: 'apple', label: 'Apple Pay', sub: 'Mit Face ID oder Touch ID',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1A0A00">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: 'google', label: 'Google Pay', sub: 'Schnell mit Google bezahlen',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 11v2h3.5c-.15.9-.68 1.65-1.43 2.15l2.3 1.79C17.67 15.7 18.5 14 18.5 12c0-.43-.04-.85-.1-1.25L12 11z" fill="#4285F4"/>
        <path d="M5.95 14.3A7 7 0 0 1 5 12c0-.8.14-1.57.39-2.3L3.1 7.9A10 10 0 0 0 2 12c0 1.62.39 3.15 1.08 4.5l2.87-2.2z" fill="#FBBC05"/>
        <path d="M12 19c2.43 0 4.47-.8 5.96-2.18l-2.3-1.79C14.77 15.64 13.47 16 12 16c-2.34 0-4.33-1.58-5.04-3.7L4.1 14.5A10 10 0 0 0 12 19z" fill="#34A853"/>
        <path d="M17.96 6.82C16.47 5.41 14.43 5 12 5A10 10 0 0 0 4.1 9.5l2.86 2.2C7.67 9.58 9.66 8 12 8c1.34 0 2.53.44 3.47 1.17l2.49-2.35z" fill="#EA4335"/>
      </svg>
    ),
  },
];

function StepPayment({ grandTotal, paymentStep, onBack, onConfirm }) {
  const [selected,   setSelected]   = useState(null);
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => onConfirm(selected), 1200);
  }

  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Zahlung</h2>
        <p className="co-form-sub">Wähle deine bevorzugte Zahlungsmethode.</p>
      </div>

      <div className="co-total-pill">
        Gesamtbetrag: <strong>€{grandTotal.toFixed(2)}</strong>
      </div>

      <div className="co-payment-methods">
        {PAYMENT_METHODS.map(m => (
          <button key={m.id} type="button"
            className={`co-pay-card${selected === m.id ? ' co-pay-card--selected' : ''}`}
            onClick={() => setSelected(m.id)}>
            <div className="co-pay-icon">{m.icon}</div>
            <div className="co-pay-text">
              <span className="co-pay-label">{m.label}</span>
              <span className="co-pay-sub">{m.sub}</span>
            </div>
            <div className="co-pay-radio">
              {selected === m.id && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <button type="button"
        className={`co-next-btn co-next-btn--pay${!selected ? ' co-next-btn--disabled' : ''}`}
        onClick={handleConfirm} disabled={!selected || confirming}>
        {confirming ? <span className="co-spinner" /> : (
          <>Jetzt bestellen · €{grandTotal.toFixed(2)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>

      <button type="button" className="co-back-link" onClick={onBack}>← Zurück</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ORDER SUCCESS
═══════════════════════════════════════════════════════ */
function OrderSuccess({ grandTotal, onHome }) {
  return (
    <div className="co-success">
      <div className="co-success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 className="co-success-title">Bestellung aufgegeben!</h2>
      <p className="co-success-sub">
        Deine Pizza ist unterwegs. Wir bereiten alles frisch für dich vor.<br />
        Geschätzte Lieferzeit: <strong>25–40 Minuten</strong>
      </p>
      <div className="co-success-total">€{grandTotal.toFixed(2)} bezahlt</div>
      <button className="co-next-btn" onClick={onHome}>Zurück zur Startseite</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN CHECKOUT PAGE
═══════════════════════════════════════════════════════ */
export default function Checkout() {
  const navigate = useNavigate();
  const { pizzas, clearCart } = usePizzaStore();
  const { isLoggedIn, currentUser, addOrder, savePizzaToProfile } = useAuth();
  const { resetOtp } = useCheckoutStore();

  /* Clean up OTP state whenever the user leaves checkout */
  useEffect(() => () => resetOtp(), [resetOtp]);

  /* Derive profile: auth user takes priority over guest localStorage cache */
  const [profile, setProfile] = useState(() =>
    currentUser ? profileFromUser(currentUser) : { ...EMPTY_PROFILE, ...readGuestProfile() }
  );

  /* Reactive sync: if currentUser is updated (e.g. profile page), refresh form */
  useEffect(() => {
    if (currentUser) setProfile(profileFromUser(currentUser));
  }, [currentUser]);

  /* Auto-advance past delivery step when the user already has a complete address */
  const [step, setStep] = useState(() =>
    currentUser && isDeliveryComplete(profileFromUser(currentUser)) ? 2 : 1
  );

  const [done, setDone] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);

  /* Steps differ based on login state */
  const stepLabels = isLoggedIn
    ? ['Lieferung', 'Verifizierung', 'Zahlung']
    : ['Lieferung', 'Verifizierung', 'Konto', 'Zahlung'];
  const paymentStep = isLoggedIn ? 3 : 4;

  const grandTotal = pizzas.reduce((sum, p) => sum + calcPrice(p) * (p.quantity || 1), 0);

  useEffect(() => {
    if (pizzas.length === 0 && !done) navigate('/cart');
  }, [pizzas.length, done, navigate]);

  async function handleConfirmed(paymentMethod) {
    const total = grandTotal;
    setFinalTotal(total);

    if (isLoggedIn && currentUser) {
      const order = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        pizzas: pizzas.map(p => ({ ...p })),
        total,
        address: { ...profile },
        paymentMethod,
      };
      addOrder(order);
      pizzas.forEach(p => savePizzaToProfile({ ...p }));
    }

    setDone(true);
    clearCart();
  }

  function stepForward() { setStep(s => s + 1); }

  /* Persist delivery info for guests only; auth users use their profile */
  function handleDeliveryNext() {
    if (!isLoggedIn) saveGuestProfile(profile);
    stepForward();
  }

  function handleAccountCreated() { stepForward(); }
  function handleSkipAccount()    { stepForward(); }

  const displayStep = done ? stepLabels.length + 1 : step;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="co-main">
        <div className="co-wrap">
          <StepDots step={displayStep} labels={stepLabels} />

          <div className="co-panel">
            {done ? (
              <OrderSuccess grandTotal={finalTotal || grandTotal} onHome={() => navigate('/')} />
            ) : step === 1 ? (
              <StepDelivery profile={profile} setProfile={setProfile} onNext={handleDeliveryNext} autofilled={!!currentUser} />
            ) : step === 2 ? (
              <StepVerification profile={profile} onNext={stepForward} onBack={() => setStep(1)} />
            ) : step === 3 && !isLoggedIn ? (
              <StepAccount profile={profile} onCreated={handleAccountCreated} onSkip={handleSkipAccount} />
            ) : (
              <StepPayment
                grandTotal={grandTotal}
                paymentStep={paymentStep}
                onBack={() => setStep(step - 1)}
                onConfirm={handleConfirmed}
              />
            )}
          </div>
        </div>
      </main>

      <Socials />
    </div>
  );
}
