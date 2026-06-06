import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { usePizzaStore } from '../store/PizzaContext';
import { useAuth } from '../store/AuthContext';
import { calcPrice } from '../utils/pizzaUtils';
import GlassInput from '../components/GlassInput';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { useRestaurantMode } from '../store/RestaurantModeContext';
import { useOrdering } from '../store/OrderingContext';
import { useTranslation } from 'react-i18next';
import { createOrder } from '../admin/services/adminService';
import PasswordInput from '../components/ui/PasswordInput';
import CheckoutAddressSelector from '../components/checkout/CheckoutAddressSelector';
import MultiAddressSelector from '../components/checkout/MultiAddressSelector';
import { useDeliveryAddress } from '../hooks/useDeliveryAddress';
import { useUserAddresses } from '../hooks/useUserAddresses';

/* ─── Delivery profile helpers ─────────────────────────── */
const EMPTY_PROFILE = {
  fullName: '', street: '', houseNumber: '', postalCode: '',
  city: '', floor: '', doorbellName: '', phone: '', email: '',
};

/* Guest-only: cache delivery info in localStorage */
function readGuestProfile() {
  try { return JSON.parse(localStorage.getItem('bz_profile') ?? 'null') ?? {}; }
  catch { return {}; }
}
function saveGuestProfile(p) {
  try { localStorage.setItem('bz_profile', JSON.stringify(p)); } catch { }
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


/* ═══════════════════════════════════════════════════════
   STEP 1 — Delivery form
═══════════════════════════════════════════════════════ */
function StepDelivery({ profile, setProfile, onNext, autofilled, lockedFields = [], onBackToSaved }) {
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    if (lockedFields.includes(name)) return;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const req = ['fullName', 'street', 'houseNumber', 'postalCode', 'city', 'phone'];
    if (!lockedFields.includes('email')) req.push('email');
    const errs = {};
    req.forEach(k => { if (!profile[k]?.trim()) errs[k] = 'Pflichtfeld'; });
    if (!lockedFields.includes('email') && profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Ungültige E-Mail';
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
            street: a.road ?? prev.street,
            houseNumber: a.house_number ?? prev.houseNumber,
            postalCode: a.postcode ?? prev.postalCode,
            city: a.city ?? a.town ?? a.village ?? prev.city,
          }));
        } catch { setLocError('Adresse konnte nicht ermittelt werden.'); }
        finally { setLocLoading(false); }
      },
      () => { setLocError('Standortzugriff verweigert.'); setLocLoading(false); }
    );
  }

  return (
    <form className="co-form" onSubmit={handleSubmit} noValidate>
      {onBackToSaved && (
        <button type="button" className="co-back-link" onClick={onBackToSaved} style={{ marginBottom: 12 }}>
          ← Gespeicherte Adresse verwenden
        </button>
      )}

      <div className="co-form-header">
        <h2 className="co-form-title">Lieferinformationen</h2>
        <p className="co-form-sub">Wohin soll deine Pizza geliefert werden?</p>
      </div>

      {autofilled && (
        <div className="co-autofill-notice">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Vorausgefüllt aus deinem Profil — Felder nach Bedarf bearbeiten
        </div>
      )}

      <button type="button" className="co-location-btn" onClick={handleLocation} disabled={locLoading}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" opacity=".3" />
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

        {!lockedFields.includes('email') && (
          <>
            <GlassInput label="E-Mail" name="email" type="email" value={profile.email} onChange={handleChange} placeholder="max@beispiel.de" required />
            {errors.email && <span className="co-field-error">{errors.email}</span>}
          </>
        )}
      </div>

      <button type="submit" className="co-next-btn">
        Weiter zur Zahlung
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 2 (guest) — Create Account
═══════════════════════════════════════════════════════ */
function StepAccount({ profile, onSkip, onCreated }) {
  const { register } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleCreate() {
    const errs = {};
    if (!password) errs.password = 'Pflichtfeld';
    else if (password.length < 8) errs.password = 'Mindestens 8 Zeichen';
    if (confirm !== password) errs.confirm = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const result = await register({ fullName: profile.fullName, email: profile.email, phone: profile.phone, password });
    setLoading(false);

    const { user, error, needsVerification } = result;

    if (error) { setErrors({ general: error }); return; }

    if (needsVerification) {
      // Email confirmation required — user is NOT yet logged in.
      // Show a clear verification-pending screen instead of silently
      // advancing to payment with isLoggedIn=false.
      setVerificationSent(true);
      return;
    }

    onCreated(user);
  }

  /* ── Verification pending screen ── */
  if (verificationSent) {
    return (
      <div className="co-form">
        <div className="co-form-header" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
          <h2 className="co-form-title">E-Mail bestätigen</h2>
          <p className="co-form-sub">
            Wir haben eine Bestätigungs-E-Mail an <strong>{profile.email}</strong> gesendet.
            Bitte klicke auf den Link, um dein Konto zu aktivieren — du bleibst danach dauerhaft angemeldet.
          </p>
        </div>
        <div style={{
          background: 'rgba(61,185,110,0.08)',
          border: '1px solid rgba(61,185,110,0.25)',
          borderRadius: 14,
          padding: '14px 18px',
          fontSize: 13,
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          color: '#2a7a4a',
          marginBottom: 20,
          lineHeight: 1.6,
        }}>
          Nach der Bestätigung wird deine Adresse automatisch gespeichert.<br />
          Du musst dich nicht erneut anmelden.
        </div>
        <button type="button" className="co-next-btn" onClick={onSkip}>
          Jetzt bestellen · ohne Bestätigung
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(26,10,0,0.38)', textAlign: 'center', marginTop: 14 }}>
          Deine Bestellung wird sofort platziert. Die Adressspeicherung erfolgt nach der E-Mail-Bestätigung.
        </p>
      </div>
    );
  }

  /* ── Account creation form ── */
  return (
    <div className="co-form">
      <div className="co-form-header">
        <h2 className="co-form-title">Konto erstellen</h2>
        <p className="co-form-sub">
          Speichere deine Adresse einmalig — beim nächsten Checkout nie wieder eingeben.
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
          <PasswordInput className="co-input" name="password" value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="Mindestens 8 Zeichen" autoComplete="new-password" />
          {errors.password && <span className="co-field-error">{errors.password}</span>}
        </div>
        <div className="co-field">
          <label className="co-label">Passwort bestätigen<span className="co-required">*</span></label>
          <PasswordInput className="co-input" name="confirmPassword" value={confirm}
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
              <path d="M5 12h14M12 5l7 7-7 7" />
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
        <path d="M20.067 8.478c.492.315.844.825.983 1.39.387 1.592-.948 3.097-2.83 3.097h-.638c-.22 0-.408.16-.443.378l-.483 3.08-.136.864a.45.45 0 0 1-.445.378H13.9a.27.27 0 0 1-.267-.31l.572-3.635.025-.157a.45.45 0 0 1 .445-.378h.934c1.882 0 3.217-1.505 2.83-3.097a2.067 2.067 0 0 0-.372-.61z" fill="#009cde" />
        <path d="M8.526 3h5.417c.638 0 1.233.047 1.776.147.155.027.306.058.453.093a5.1 5.1 0 0 1 1.798.82c.491.315.843.825.982 1.39.387 1.592-.948 3.097-2.83 3.097H13.48a.45.45 0 0 0-.444.378l-.628 3.993-.094.6-.483 3.08-.136.864a.45.45 0 0 1-.445.378H8.94a.27.27 0 0 1-.267-.31L10.39 7.38l.025-.157.025-.157.572-3.635A.27.27 0 0 1 11.278 3H8.526z" fill="#003087" />
      </svg>
    ),
  },
  {
    id: 'card', label: 'Kreditkarte', sub: 'Visa, Mastercard, Amex',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A0A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
  {
    id: 'apple', label: 'Apple Pay', sub: 'Mit Face ID oder Touch ID',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1A0A00">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    id: 'google', label: 'Google Pay', sub: 'Schnell mit Google bezahlen',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 11v2h3.5c-.15.9-.68 1.65-1.43 2.15l2.3 1.79C17.67 15.7 18.5 14 18.5 12c0-.43-.04-.85-.1-1.25L12 11z" fill="#4285F4" />
        <path d="M5.95 14.3A7 7 0 0 1 5 12c0-.8.14-1.57.39-2.3L3.1 7.9A10 10 0 0 0 2 12c0 1.62.39 3.15 1.08 4.5l2.87-2.2z" fill="#FBBC05" />
        <path d="M12 19c2.43 0 4.47-.8 5.96-2.18l-2.3-1.79C14.77 15.64 13.47 16 12 16c-2.34 0-4.33-1.58-5.04-3.7L4.1 14.5A10 10 0 0 0 12 19z" fill="#34A853" />
        <path d="M17.96 6.82C16.47 5.41 14.43 5 12 5A10 10 0 0 0 4.1 9.5l2.86 2.2C7.67 9.58 9.66 8 12 8c1.34 0 2.53.44 3.47 1.17l2.49-2.35z" fill="#EA4335" />
      </svg>
    ),
  },
];

function StepPayment({ grandTotal, paymentStep, onBack, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const { isOrderingEnabled, isBusy } = useOrdering();
  const { t } = useTranslation();

  function handleConfirm() {
    if (!selected || !isOrderingEnabled) return;
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <button type="button"
        className={`co-next-btn co-next-btn--pay${(!selected || !isOrderingEnabled) ? ' co-next-btn--disabled' : ''}`}
        onClick={handleConfirm}
        disabled={!selected || confirming || !isOrderingEnabled}>
        {confirming ? (
          <span className="co-spinner" />
        ) : !isOrderingEnabled ? (
          <>
            {isBusy ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
            {isBusy ? t('restaurant.busyBtn') : t('restaurant.closedBtn')}
          </>
        ) : (
          <>
            Jetzt bestellen · €{grandTotal.toFixed(2)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
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
function OrderSuccess({ grandTotal, orderId, onHome, onTrack }) {
  return (
    <div className="co-success">
      <div className="co-success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="co-success-title">Bestellung aufgegeben!</h2>
      <p className="co-success-sub">
        Deine Pizza ist unterwegs. Wir bereiten alles frisch für dich vor.<br />
        Geschätzte Lieferzeit: <strong>25–40 Minuten</strong>
      </p>
      <div className="co-success-total">€{(grandTotal ?? 0).toFixed(2)} bezahlt</div>
      {orderId && (
        <button className="co-next-btn" onClick={onTrack} style={{ marginBottom: 10 }}>
          🛵 Track My Order
        </button>
      )}
      <button className={orderId ? 'co-back-link' : 'co-next-btn'} onClick={onHome}>
        Zurück zur Startseite
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESTAURANT MODE CHECKOUT — replaces normal flow
═══════════════════════════════════════════════════════ */
function RestaurantCheckout() {
  const navigate = useNavigate();
  const { pizzas, clearCart } = usePizzaStore();
  const { rmConfig, exitRestaurantMode } = useRestaurantMode();

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const grandTotal = pizzas.reduce((s, p) => s + calcPrice(p) * (p.quantity || 1), 0);

  async function handleSend() {
    if (!pizzas.length || sending) return;
    setSending(true);
    setErrMsg('');

    try {
      /* ── Customer label ── */
      const customerName =
        rmConfig.orderType === 'dine_in'
          ? (rmConfig.customerName.trim() || `Table ${rmConfig.tableNumber || '?'}`)
          : (rmConfig.customerName.trim() || 'Walk-in');

      /* ── Serialize cart items — same shape as normal checkout ── */
      const items = pizzas.map(p => {
        const item = {
          name: p.name || (p.type === 'burger' ? 'Custom Burger' : 'Custom Pizza'),
          type: p.type || 'pizza',
          quantity: p.quantity ?? 1,
          price: calcPrice(p),
          emoji: p.emoji,
        };
        // Pizza customizations
        if (p.dough) item.dough = p.dough;
        if (p.sauce) item.sauce = p.sauce;
        if (p.cheese) item.cheese = p.cheese;
        if (p.meats?.length) item.meats = p.meats;
        if (p.vegetables?.length) item.vegetables = p.vegetables;
        // Burger customizations
        if (p.bun) item.bun = p.bun;
        if (p.sauces?.length) item.sauces = p.sauces;
        if (p.cheeses && Object.keys(p.cheeses).length) item.cheeses = p.cheeses;
        // Burger meats are an object map { [meatId]: qty }, not an array
        if (p.type === 'burger' && p.meats && typeof p.meats === 'object' && !Array.isArray(p.meats)) {
          item.burger_meats = p.meats;
          delete item.meats;
        }
        return item;
      });

      /* ── Build order payload ─────────────────────────────────────
         Migration 007 adds source/order_type/table_number columns.
         Until it runs, those fields live inside delivery_address
         (JSONB, always exists) so the INSERT succeeds immediately.
      ────────────────────────────────────────────────────────────── */
      const tableNum = rmConfig.orderType === 'dine_in' ? (rmConfig.tableNumber || '') : '';

      const payload = {
        user_id: null,
        customer_name: customerName,
        customer_email: '',           // NOT NULL DEFAULT ''
        customer_phone: rmConfig.phone?.trim() || '',
        delivery_address: {
          mode: rmConfig.orderType,
          tableNumber: tableNum,
          // Restaurant metadata stored here as fallback (readable before migration):
          source: 'restaurant_mode',
          order_type: rmConfig.orderType,
          table_number: tableNum,
          payment: rmConfig.payment,
        },
        items,
        total_price: +grandTotal.toFixed(2),
        status: 'pending',            // no migration needed for this
        payment_method: rmConfig.payment,
      };

      console.log('[RestaurantCheckout] placing order:', payload);

      /* ── Insert via adminService — throws on any Supabase error ── */
      const saved = await createOrder(payload);
      if (saved?.id) setOrderId(saved.id);

      /* ── Soft confirmation sound (2-note, not kitchen ding) ── */
      try {
        const ctx = new window.AudioContext();
        [[660, 0], [880, 0.14]].forEach(([hz, delay]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = hz; osc.type = 'sine';
          gain.gain.setValueAtTime(0.13, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.26);
        });
      } catch (_) { }

      clearCart();
      setDone(true);

    } catch (err) {
      /* Surface the real Supabase error — both in console and UI */
      console.error('[RestaurantCheckout] Order insert failed:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        payload: { rmConfig, itemCount: pizzas.length },
      });
      setErrMsg(err?.message || 'Unknown error — check console for details');
    } finally {
      setSending(false);
    }
  }

  /* ── Styles (uses website palette, no admin CSS) ── */
  const brand = { fontFamily: 'Nunito, sans-serif' };
  const accent = '#FFD54A';
  const dark = '#1A0A00';

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFF9EC', ...brand }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 }}>
          <div style={{ fontSize: 64 }}>🧾</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: dark, margin: 0 }}>Order Placed!</h2>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#5A4A2A', margin: 0 }}>
            Waiting in Orders dashboard — admin will send it to the kitchen
          </p>
          {orderId && (
            <p style={{ fontSize: 12, fontWeight: 700, color: '#A09070', margin: 0, fontFamily: 'monospace' }}>
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setDone(false); navigate('/menu'); }}
              style={{ padding: '12px 24px', borderRadius: 14, border: `2px solid ${accent}`, background: accent, color: dark, fontWeight: 900, fontSize: 14, cursor: 'pointer', ...brand }}
            >
              🍔 Take Another Order
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              style={{ padding: '12px 24px', borderRadius: 14, border: '2px solid #E8E0CB', background: 'white', color: dark, fontWeight: 800, fontSize: 14, cursor: 'pointer', ...brand }}
            >
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFF9EC', ...brand }}>
      <Navbar />
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0, maxWidth: 900, margin: '0 auto', width: '100%', padding: '28px 20px 60px', alignItems: 'start', boxSizing: 'border-box' }}>

        {/* Left: item list */}
        <div style={{ paddingRight: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: dark, margin: '0 0 16px' }}>
            Order Summary
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: '#A09070' }}>
              {pizzas.length} item{pizzas.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pizzas.map((p, i) => {
              const price = calcPrice(p) * (p.quantity || 1);
              return (
                <div key={i} style={{ background: 'white', border: '1.5px solid #E8E0CB', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{p.type === 'burger' ? '🍔' : p.emoji || '🍕'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: dark }}>
                      {p.name || (p.type === 'burger' ? 'Custom Burger' : 'Custom Pizza')}
                      {(p.quantity ?? 1) > 1 && <span style={{ color: '#A09070', marginLeft: 6, fontWeight: 700 }}>×{p.quantity}</span>}
                    </div>
                    {p.dough && <div style={{ fontSize: 11, color: '#A09070', fontWeight: 700, marginTop: 2 }}>{[p.dough, p.sauce, p.cheese].filter(Boolean).join(' · ')}</div>}
                    {p.bun && <div style={{ fontSize: 11, color: '#A09070', fontWeight: 700, marginTop: 2 }}>{p.bun}</div>}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: '#8B6914' }}>€{price.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: order config + payment */}
        <div style={{ background: 'white', border: '1.5px solid #E8E0CB', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* Total header */}
          <div style={{ background: accent, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: dark }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: dark, letterSpacing: '-0.5px' }}>€{grandTotal.toFixed(2)}</span>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Order type — read from banner config (already set) */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A09070', marginBottom: 8 }}>
                Order type
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {[{ id: 'walkin', l: 'Walk-in', i: '🚶' }, { id: 'pickup', l: 'Pickup', i: '🏃' }, { id: 'dine_in', l: 'Dine-in', i: '🪑' }].map(t => (
                  <div key={t.id} style={{ padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${rmConfig.orderType === t.id ? accent : '#E8E0CB'}`, background: rmConfig.orderType === t.id ? `rgba(255,213,74,0.14)` : '#FFFDF5', textAlign: 'center', fontSize: 10, fontWeight: 800, color: rmConfig.orderType === t.id ? '#8B6914' : '#A09070' }}>
                    <div style={{ fontSize: 16 }}>{t.i}</div>
                    {t.l}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#A09070', margin: '6px 0 0', fontWeight: 700 }}>
                Configure order type in the banner above ↑
              </p>
            </div>

            {/* Show active config summary */}
            <div style={{ background: '#FFF8EE', borderRadius: 10, padding: '10px 14px', border: '1px solid #E8E0CB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5A4A2A', lineHeight: 1.6 }}>
                {rmConfig.orderType === 'dine_in' && <>🪑 Table {rmConfig.tableNumber || '?'}{rmConfig.customerName ? ` · ${rmConfig.customerName}` : ''}</>}
                {rmConfig.orderType === 'pickup' && <>{rmConfig.customerName || 'Walk-in'}{rmConfig.phone ? ` · ${rmConfig.phone}` : ''}</>}
                {rmConfig.orderType === 'walkin' && <>{rmConfig.customerName || 'Walk-in customer'}</>}
                <br />
                {rmConfig.payment === 'cash' ? '💵 Cash' : '💳 Card in Store'}
              </div>
            </div>

            {/* Place Order */}
            <button
              onClick={handleSend}
              disabled={sending || pizzas.length === 0}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: sending || pizzas.length === 0
                  ? '#ccc'
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                fontSize: 15,
                fontWeight: 900,
                cursor: sending || pizzas.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                boxShadow: sending ? 'none' : '0 4px 16px rgba(22,163,74,0.28)',
                transition: 'all 0.16s ease',
                ...brand,
              }}
            >
              {sending ? (
                <>
                  <svg style={{ animation: 'spin 0.7s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Place Order
                </>
              )}
            </button>

            {errMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(220,38,38,0.08)',
                border: '1.5px solid rgba(220,38,38,0.30)',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                lineHeight: 1.5,
              }}>
                ❌ {errMsg}
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: '#C0B090' }}>
              Status → <strong style={{ color: '#eab308' }}>Waiting Confirmation</strong> · admin sends to kitchen
            </div>

            <button
              onClick={() => navigate('/menu')}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #E8E0CB', background: 'transparent', color: '#A09070', fontWeight: 800, fontSize: 12, cursor: 'pointer', ...brand }}
            >
              ← Keep adding items
            </button>
          </div>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* CheckoutAddressSelector is now a standalone reusable component — imported above */

/* ═══════════════════════════════════════════════════════
   MAIN CHECKOUT PAGE
═══════════════════════════════════════════════════════ */
function CheckoutNormal() {
  const navigate = useNavigate();
  const { pizzas, clearCart } = usePizzaStore();
  const { isLoggedIn, currentUser, addOrder, savePizzaToProfile, loading: authLoading } = useAuth();
  const { isOrderingEnabled } = useOrdering();
  const { t } = useTranslation();

  /* ── Canonical delivery address — profiles → last order fallback ──────── */
  const { address: savedAddress, hasSavedAddress, isLoading: addrLoading, saveAddress, refreshAddress } = useDeliveryAddress();

  /* ── Multiple saved addresses (new system) ───────────────── */
  const { addresses: savedAddresses, isLoading: multiAddrLoading, hasAddresses, defaultAddress } = useUserAddresses();

  /* Form state: pre-fill identity from auth for logged-in users.
     Address fields start empty — the confirm card handles saved addresses. */
  const [profile, setProfile] = useState(() =>
    currentUser
      ? { ...EMPTY_PROFILE, email: currentUser.email || '', fullName: currentUser.fullName || '', phone: currentUser.phone || '' }
      : { ...EMPTY_PROFILE, ...readGuestProfile() }
  );

  /* Only email is locked — taken directly from the Supabase session */
  const lockedFields = isLoggedIn ? ['email'] : [];

  /* false = show confirm card (default for users with a saved address);
     true  = user explicitly requested the manual form */
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const showConfirmCard = hasSavedAddress && !showNewAddressForm;

  /* Spinner until auth resolves AND address fetch settles.
     addrLoading is checked unconditionally — mobile users with email-confirmation
     pending have isLoggedIn=false but still need the address fetch to complete
     before we decide whether to show the confirm card or the empty form. */
  const isLoading = authLoading || addrLoading || (isLoggedIn && multiAddrLoading);

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [savedOrderId, setSavedOrderId] = useState(null);
  /* Explicit flag: set when user confirms the saved address card. Prevents any
     re-render (auth refresh, Supabase fetch, context update) from flipping the
     view back to the address form once the user has chosen to proceed. */
  const [savedAddressConfirmed, setSavedAddressConfirmed] = useState(false);

  /* Steps differ based on login state */
  const stepLabels = isLoggedIn
    ? ['Lieferung', 'Zahlung']
    : ['Lieferung', 'Konto', 'Zahlung'];
  const paymentStep = isLoggedIn ? 2 : 3;

  const grandTotal = pizzas.reduce((sum, p) => sum + calcPrice(p) * (p.quantity || 1), 0);

  /* Clear cart AFTER done=true is committed to avoid a concurrent-render race
     where clearCart()'s cross-context propagation (cartStore → PizzaContext)
     produces an intermediate render with pizzas=[] but done=false, incorrectly
     triggering the empty-cart redirect. */
  useEffect(() => {
    if (done) clearCart();
  }, [done]); // clearCart is a stable useCallback ref

  useEffect(() => {
    if (pizzas.length === 0 && !done && window.location.pathname === '/checkout') {
      navigate('/cart');
    }
  }, [pizzas.length, done, navigate]);

  async function handleConfirmed(paymentMethod) {
    if (!isOrderingEnabled) return;
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

    api.orders.create({
      items: pizzas.map(p => ({ ...p })),
      totalPrice: total,
    }).catch(err => console.warn('[checkout] order not saved to backend:', err.message));

    try {
      const { data: savedOrder, error: orderError } = await supabase.from('orders').insert({
        user_id: currentUser?.id ?? null,
        customer_name: profile.fullName || '',
        customer_email: profile.email || '',
        customer_phone: profile.phone || '',
        delivery_address: {
          street: profile.street || '',
          houseNumber: profile.houseNumber || '',
          postalCode: profile.postalCode || '',
          city: profile.city || '',
          floor: profile.floor || '',
          doorbellName: profile.doorbellName || '',
        },
        items: pizzas.map(p => {
          const item = {
            name: p.name || (p.type === 'burger' ? 'Custom Burger' : 'Custom Pizza'),
            type: p.type || 'pizza',
            quantity: p.quantity ?? 1,
            price: calcPrice(p),
          };
          // Pizza customizations
          if (p.dough) item.dough = p.dough;
          if (p.sauce) item.sauce = p.sauce;
          if (p.cheese) item.cheese = p.cheese;
          if (p.meats?.length) item.meats = p.meats;
          if (p.vegetables?.length) item.vegetables = p.vegetables;
          // Burger customizations
          if (p.bun) item.bun = p.bun;
          if (p.sauces?.length) item.sauces = p.sauces;
          if (p.cheeses && Object.keys(p.cheeses).length) item.cheeses = p.cheeses;
          if (p.type === 'burger' && p.meats && typeof p.meats === 'object' && !Array.isArray(p.meats)) {
            item.burger_meats = p.meats;
            delete item.meats;
          }
          return item;
        }),
        total_price: total,
        status: 'pending',
        payment_method: paymentMethod,
      }).select('id').single();

      console.log('[checkout] Supabase response', { savedOrder, orderError });

      if (orderError) {
        console.warn('[checkout] Supabase SELECT error (order was still created):', orderError);
      }

      if (savedOrder?.id) {
        const oid = savedOrder.id;
        console.log('[checkout] orderId:', oid, '| tracking:', `/order-tracking/${oid}`);
        setSavedOrderId(oid);
        localStorage.setItem('bz_last_order_id', oid);
      }
    } catch (insertErr) {
      console.error('[checkout] insert threw — order may or may not have been created:', insertErr);
    }

    // ── Persist delivery address to profiles ─────────────────────────────
    // Direct upsert — uses currentUser?.id from this function's outer scope,
    // the same uid already used for the orders INSERT above. Avoids the
    // useCallback closure timing bug where saveAddress() can capture
    // currentUser?.id === null on iOS Safari before auth has resolved.
    if (profile.street?.trim()) {
      const { data: { session: _addrSess } } = await supabase.auth.getSession();
      const addrUid = currentUser?.id ?? _addrSess?.user?.id ?? null;
      if (addrUid) {
        const { error: addrErr } = await supabase
          .from('profiles')
          .upsert({
            id:           addrUid,
            full_name:    profile.fullName     || '',
            phone:        profile.phone        || '',
            street:       profile.street       || '',
            house_number: profile.houseNumber  || '',
            postal_code:  profile.postalCode   || '',
            city:         profile.city         || '',
            floor:        profile.floor        || '',
            bell_name:    profile.doorbellName || '',
          }, { onConflict: 'id' });
        if (addrErr) {
          console.error('[checkout] profiles upsert failed:', addrErr.code, addrErr.message);
        } else {
          console.log('[checkout] profiles upsert ok — street:', profile.street, '| uid:', addrUid.slice(0, 8));
          refreshAddress();
        }
      } else {
        console.warn('[checkout] profiles upsert skipped — no uid');
      }
    }

    // Transition to success. clearCart() is deferred to a useEffect that fires
    // after done=true is committed, preventing a concurrent-render race condition.
    setDone(true);
  }

  function stepForward() { setStep(s => s + 1); }

  /* Going back from payment: restore address step in its default state —
     confirm card if there is a saved address, plain form if not. */
  function handlePaymentBack() {
    setSavedAddressConfirmed(false);
    setShowNewAddressForm(false); // re-show confirm card (not the expanded form)
    setStep(s => s - 1);
  }

  /* Persist delivery info for guests only; auth users use their profile */
  function handleDeliveryNext() {
    if (!isLoggedIn) {
      saveGuestProfile(profile);
    } else {
      // Eagerly persist to profiles as soon as the delivery step is confirmed.
      // Fire-and-forget — checkout advances immediately while the write runs async.
      // This fires earlier than payment, so currentUser and the Supabase JWT
      // are both settled by the time this runs on mobile.
      saveAddress({
        fullName:     profile.fullName,
        phone:        profile.phone,
        street:       profile.street,
        houseNumber:  profile.houseNumber,
        postalCode:   profile.postalCode,
        city:         profile.city,
        floor:        profile.floor        || '',
        doorbellName: profile.doorbellName || '',
      });
    }
    stepForward();
  }

  function handleAccountCreated() { stepForward(); }
  function handleSkipAccount() { stepForward(); }

  /* When address is confirmed, show the payment step label in the dots. */
  const displayStep = done
    ? stepLabels.length + 1
    : (savedAddressConfirmed ? paymentStep : step);

  return (
    <div className="page-enter co-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar />

      <main className="co-main">
        <div className="co-wrap">
          <StepDots step={displayStep} labels={stepLabels} />

          <div className="co-panel">
            {done ? (
              <OrderSuccess
                grandTotal={finalTotal || grandTotal}
                orderId={savedOrderId}
                onHome={() => navigate('/')}
                onTrack={() => navigate(savedOrderId ? `/order-tracking/${savedOrderId}` : '/')}
              />
            ) : isLoading ? (
              <div className="co-form" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
                <span className="co-spinner" />
              </div>
            ) : (savedAddressConfirmed || step >= paymentStep) ? (
              <StepPayment
                grandTotal={grandTotal}
                paymentStep={paymentStep}
                onBack={handlePaymentBack}
                onConfirm={handleConfirmed}
              />
            ) : step === 1 && hasAddresses ? (
              <MultiAddressSelector
                addresses={savedAddresses}
                defaultAddress={defaultAddress}
                onUseAddress={(addr) => {
                  setProfile({
                    fullName:     currentUser?.fullName || '',
                    email:        currentUser?.email    || '',
                    phone:        addr.phone || currentUser?.phone || '',
                    street:       addr.street        || '',
                    houseNumber:  addr.house_number  || '',
                    postalCode:   addr.postal_code   || '',
                    city:         addr.city          || '',
                    floor:        addr.floor         || '',
                    doorbellName: addr.bell_name     || '',
                  });
                  setSavedAddressConfirmed(true);
                  setStep(paymentStep);
                }}
                onEnterNew={() => {
                  setSavedAddressConfirmed(false);
                  setShowNewAddressForm(true);
                  setProfile({
                    ...EMPTY_PROFILE,
                    email:    currentUser?.email    || '',
                    fullName: currentUser?.fullName || '',
                    phone:    currentUser?.phone    || '',
                  });
                }}
              />
            ) : step === 1 && showConfirmCard ? (
              <CheckoutAddressSelector
                savedAddress={savedAddress}
                onUseThis={() => {
                  setProfile({ ...savedAddress, email: currentUser?.email || '' });
                  setSavedAddressConfirmed(true);
                  setStep(paymentStep);
                }}
                onEnterNew={() => {
                  setSavedAddressConfirmed(false);
                  setShowNewAddressForm(true);
                  setProfile({
                    ...EMPTY_PROFILE,
                    email: currentUser?.email || '',
                    fullName: currentUser?.fullName || '',
                    phone: currentUser?.phone || '',
                  });
                }}
              />
            ) : step === 1 && (!hasSavedAddress || showNewAddressForm) ? (
              <StepDelivery
                profile={profile}
                setProfile={setProfile}
                onNext={handleDeliveryNext}
                autofilled={!!currentUser}
                lockedFields={lockedFields}
                onBackToSaved={hasSavedAddress ? () => setShowNewAddressForm(false) : undefined}
              />
            ) : (
              /* Guest step 2: account creation. Logged-in users at step 2 are
                 already caught by the paymentStep condition above. */
              <StepAccount profile={profile} onCreated={handleAccountCreated} onSkip={handleSkipAccount} />
            )}
          </div>
        </div>
      </main>

      <Socials />
    </div>
  );
}

export default function Checkout() {
  const { isRestaurantMode } = useRestaurantMode();
  if (isRestaurantMode) return <RestaurantCheckout />;
  return <CheckoutNormal />;
}
