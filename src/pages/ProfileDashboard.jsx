import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import { useAuth } from '../context/AuthContext';
import { usePizzaStore } from '../context/PizzaContext';
import { LABEL } from '../utils/pizzaUtils';
import GlassInput from '../components/GlassInput';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

function initials(name = '') {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

/* ─── Section wrapper ───────────────────────────────────── */
function Section({ title, icon, children, action }) {
  return (
    <div className="pf-section">
      <div className="pf-section-header">
        <span className="pf-section-icon">{icon}</span>
        <h2 className="pf-section-title">{title}</h2>
        {action && <div className="pf-section-action">{action}</div>}
      </div>
      {children}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   PERSONAL INFO SECTION
═══════════════════════════════════════════════════════ */
function PersonalInfo({ user }) {
  const { updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fields, setFields]   = useState({
    fullName: user.fullName,
    email:    user.email,
    phone:    user.phone,
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  async function handleSave() {
    const errs = {};
    if (!fields.fullName.trim()) errs.fullName = 'Pflichtfeld';
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      errs.email = 'Gültige E-Mail erforderlich';
    if (fields.newPassword && fields.newPassword.length < 8)
      errs.newPassword = 'Mindestens 8 Zeichen';
    if (fields.newPassword && fields.newPassword !== fields.confirmPassword)
      errs.confirmPassword = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    await updateProfile(
      { fullName: fields.fullName, email: fields.email, phone: fields.phone },
      fields.newPassword || undefined
    );
    setSaving(false);
    setEditing(false);
    setFields(p => ({ ...p, newPassword: '', confirmPassword: '' }));
  }

  if (!editing) {
    return (
      <div className="pf-info-grid">
        <InfoRow label="Name"     value={user.fullName} />
        <InfoRow label="E-Mail"   value={user.email} />
        <InfoRow label="Telefon"  value={user.phone || '—'} />
        <InfoRow label="Mitglied" value={formatDate(user.createdAt)} />
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>
          <PencilIcon /> Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="co-fields">
      {errors.general && <div className="auth-error-banner">{errors.general}</div>}
      <GlassInput label="Name" name="fullName" value={fields.fullName} onChange={handleChange} placeholder="Max Mustermann" />
      {errors.fullName && <span className="co-field-error">{errors.fullName}</span>}
      <GlassInput label="E-Mail" name="email" type="email" value={fields.email} onChange={handleChange} placeholder="max@beispiel.de" />
      {errors.email && <span className="co-field-error">{errors.email}</span>}
      <GlassInput label="Telefon" name="phone" type="tel" value={fields.phone} onChange={handleChange} placeholder="+49 151..." />
      <GlassInput label="Neues Passwort" name="newPassword" type="password" value={fields.newPassword} onChange={handleChange} placeholder="Leer lassen = unverändert" />
      {errors.newPassword && <span className="co-field-error">{errors.newPassword}</span>}
      {fields.newPassword && (
        <>
          <GlassInput label="Passwort bestätigen" name="confirmPassword" type="password"
            value={fields.confirmPassword} onChange={handleChange} placeholder="••••••••" />
          {errors.confirmPassword && <span className="co-field-error">{errors.confirmPassword}</span>}
        </>
      )}
      <div className="pf-edit-actions">
        <button className="co-next-btn" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
          {saving ? <span className="co-spinner" /> : 'Speichern'}
        </button>
        <button className="pf-cancel-btn" onClick={() => setEditing(false)}>Abbrechen</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ADDRESS SECTION
═══════════════════════════════════════════════════════ */
function AddressSection({ user }) {
  const { updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [addr, setAddr]       = useState({ ...user.address });
  const [saving, setSaving]   = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setAddr(p => ({ ...p, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await updateProfile({ address: addr });
    setSaving(false);
    setEditing(false);
  }

  const a = user.address;
  const hasAddress = a.street || a.city;

  if (!editing) {
    return (
      <div className="pf-info-grid">
        {hasAddress ? (
          <>
            <InfoRow label="Straße"   value={`${a.street} ${a.houseNumber}`.trim() || '—'} />
            <InfoRow label="PLZ/Ort"  value={`${a.postalCode} ${a.city}`.trim() || '—'} />
            {a.floor        && <InfoRow label="Etage"      value={a.floor} />}
            {a.doorbellName && <InfoRow label="Klingel"    value={a.doorbellName} />}
          </>
        ) : (
          <p className="pf-empty-hint">Noch keine Adresse gespeichert.</p>
        )}
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>
          <PencilIcon /> {hasAddress ? 'Bearbeiten' : 'Adresse hinzufügen'}
        </button>
      </div>
    );
  }

  return (
    <div className="co-fields">
      <div className="co-row">
        <div className="co-field co-field--grow">
          <GlassInput label="Straße" name="street" value={addr.street} onChange={handleChange} placeholder="Musterstraße" />
        </div>
        <div className="co-field co-field--shrink">
          <GlassInput label="Hausnr." name="houseNumber" value={addr.houseNumber} onChange={handleChange} placeholder="12A" />
        </div>
      </div>
      <div className="co-row">
        <div className="co-field co-field--shrink">
          <GlassInput label="PLZ" name="postalCode" value={addr.postalCode} onChange={handleChange} placeholder="10115" />
        </div>
        <div className="co-field co-field--grow">
          <GlassInput label="Stadt" name="city" value={addr.city} onChange={handleChange} placeholder="Berlin" />
        </div>
      </div>
      <div className="co-row">
        <div className="co-field co-field--half-equal">
          <GlassInput label="Etage" name="floor" value={addr.floor} onChange={handleChange} placeholder="2. OG" />
        </div>
        <div className="co-field co-field--half-equal">
          <GlassInput label="Klingel" name="doorbellName" value={addr.doorbellName} onChange={handleChange} placeholder="Mustermann" />
        </div>
      </div>
      <div className="pf-edit-actions">
        <button className="co-next-btn" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
          {saving ? <span className="co-spinner" /> : 'Speichern'}
        </button>
        <button className="pf-cancel-btn" onClick={() => setEditing(false)}>Abbrechen</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ORDER HISTORY SECTION
═══════════════════════════════════════════════════════ */
function OrderHistory({ orders }) {
  const navigate = useNavigate();
  const { pizzas: cartPizzas } = usePizzaStore();
  const store = usePizzaStore();

  function handleReorder(order) {
    const reloaded = order.pizzas.map(p => ({
      ...p,
      id: Date.now() + Math.random(),
      quantity: p.quantity || 1,
    }));
    store.replaceCart(reloaded);
    navigate('/cart');
  }

  if (!orders.length) {
    return <p className="pf-empty-hint">Du hast noch keine Bestellungen aufgegeben.</p>;
  }

  return (
    <div className="pf-order-list">
      {orders.map(order => (
        <div key={order.id} className="pf-order-card">
          <div className="pf-order-header">
            <div className="pf-order-meta">
              <span className="pf-order-date">{formatDate(order.date)}</span>
              <span className="pf-order-status">Geliefert</span>
            </div>
            <span className="pf-order-total">€{Number(order.total).toFixed(2)}</span>
          </div>

          <div className="pf-order-pizzas">
            {order.pizzas.map((p, i) => (
              <div key={i} className="pf-order-pizza">
                <div className="pf-order-preview">
                  <PizzaCanvas
                    activeCategory=""
                    selectedDough={p.dough}
                    selectedSauce={p.sauce}
                    selectedCheese={p.cheese}
                    selectedMeats={p.meats ?? []}
                    selectedVegetables={p.vegetables ?? []}
                    size="72px"
                  />
                </div>
                <div className="pf-order-pizza-info">
                  <span className="pf-order-pizza-name">{p.name || 'Custom Pizza'}</span>
                  <span className="pf-order-pizza-ing">
                    {[LABEL[p.dough], LABEL[p.sauce], LABEL[p.cheese],
                      ...(p.meats ?? []).map(id => LABEL[id]),
                      ...(p.vegetables ?? []).map(id => LABEL[id]),
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="pf-reorder-btn" onClick={() => handleReorder(order)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
            Erneut bestellen
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SAVED PIZZAS SECTION
═══════════════════════════════════════════════════════ */
function SavedPizzas({ pizzas: savedPizzas }) {
  const navigate = useNavigate();
  const store = usePizzaStore();
  const { removeSavedPizza, toggleFavorite, renameSavedPizza } = useAuth();
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal]   = useState('');

  function startRename(p) {
    setRenamingId(p.id);
    setRenameVal(p.name);
  }

  function commitRename(id) {
    if (renameVal.trim()) renameSavedPizza(id, renameVal.trim());
    setRenamingId(null);
  }

  function handleReorder(pizza) {
    store.replaceCart([{ ...pizza, id: Date.now(), quantity: 1 }]);
    navigate('/cart');
  }

  if (!savedPizzas.length) {
    return <p className="pf-empty-hint">Noch keine Pizzen gespeichert. Bestellungen werden automatisch hier gespeichert.</p>;
  }

  const favorites = savedPizzas.filter(p => p.isFavorite);
  const rest      = savedPizzas.filter(p => !p.isFavorite);
  const ordered   = [...favorites, ...rest];

  return (
    <div className="pf-pizza-grid">
      {ordered.map(pizza => (
        <div key={pizza.id} className="pf-pizza-card">
          <div className="pf-pizza-preview">
            <PizzaCanvas
              activeCategory=""
              selectedDough={pizza.dough}
              selectedSauce={pizza.sauce}
              selectedCheese={pizza.cheese}
              selectedMeats={pizza.meats ?? []}
              selectedVegetables={pizza.vegetables ?? []}
              size="100px"
            />
          </div>

          <div className="pf-pizza-body">
            {renamingId === pizza.id ? (
              <input
                className="pf-rename-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={() => commitRename(pizza.id)}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(pizza.id); }}
                autoFocus
                maxLength={32}
              />
            ) : (
              <span className="pf-pizza-name" onClick={() => startRename(pizza)}>
                {pizza.name}
                <PencilIcon size={11} />
              </span>
            )}

            <span className="pf-pizza-ing">
              {[LABEL[pizza.dough], LABEL[pizza.sauce], LABEL[pizza.cheese],
                ...(pizza.meats ?? []).map(id => LABEL[id]),
              ].filter(Boolean).slice(0, 3).join(' · ')}
            </span>

            <div className="pf-pizza-actions">
              <button
                className={`pf-fav-btn${pizza.isFavorite ? ' pf-fav-btn--active' : ''}`}
                onClick={() => toggleFavorite(pizza.id)}
                title={pizza.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              >
                <HeartIcon filled={pizza.isFavorite} />
              </button>
              <button className="pf-reorder-btn pf-reorder-btn--sm" onClick={() => handleReorder(pizza)}>
                Bestellen
              </button>
              <button className="pf-remove-btn" onClick={() => removeSavedPizza(pizza.id)}>
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAYMENT METHODS (placeholder)
═══════════════════════════════════════════════════════ */
const PAYMENT_ICONS = [
  { id: 'paypal', label: 'PayPal' },
  { id: 'card',   label: 'Kreditkarte' },
  { id: 'apple',  label: 'Apple Pay' },
  { id: 'google', label: 'Google Pay' },
];

function PaymentMethods() {
  return (
    <div className="pf-payment-list">
      {PAYMENT_ICONS.map(m => (
        <div key={m.id} className="pf-payment-row">
          <span className="pf-payment-label">{m.label}</span>
          <span className="pf-payment-badge">Bald verfügbar</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════════════ */
function InfoRow({ label, value }) {
  return (
    <div className="pf-info-row">
      <span className="pf-info-label">{label}</span>
      <span className="pf-info-value">{value}</span>
    </div>
  );
}

function PencilIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginLeft: 5, flexShrink: 0 }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill={filled ? '#C8001E' : 'none'} stroke={filled ? '#C8001E' : 'currentColor'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PROFILE DASHBOARD
═══════════════════════════════════════════════════════ */
export default function ProfileDashboard() {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    navigate('/auth', { replace: true });
    return null;
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const allSavedPizzas = currentUser.savedPizzas ?? [];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="pf-main">
        {/* ── Profile header ── */}
        <div className="pf-hero">
          <div className="pf-avatar">{initials(currentUser.fullName)}</div>
          <div className="pf-hero-info">
            <h1 className="pf-hero-name">{currentUser.fullName}</h1>
            <p className="pf-hero-email">{currentUser.email}</p>
            <p className="pf-hero-since">
              Mitglied seit {formatDate(currentUser.createdAt)}
            </p>
          </div>
          <button className="pf-logout-btn" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Abmelden
          </button>
        </div>

        <div className="pf-content">
          {/* ── Persönliche Informationen ── */}
          <Section
            title="Persönliche Informationen"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
          >
            <PersonalInfo user={currentUser} />
          </Section>

          {/* ── Lieferadresse ── */}
          <Section
            title="Lieferadresse"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            }
          >
            <AddressSection user={currentUser} />
          </Section>

          {/* ── Bestellhistorie ── */}
          <Section
            title={`Bestellhistorie${currentUser.orderHistory.length ? ` (${currentUser.orderHistory.length})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }
          >
            <OrderHistory orders={currentUser.orderHistory} />
          </Section>

          {/* ── Gespeicherte Pizzen ── */}
          <Section
            title={`Meine Pizzen${allSavedPizzas.length ? ` (${allSavedPizzas.length})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
            }
          >
            <SavedPizzas pizzas={allSavedPizzas} />
          </Section>

          {/* ── Zahlungsmethoden ── */}
          <Section
            title="Zahlungsmethoden"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            }
          >
            <PaymentMethods />
          </Section>
        </div>

        <button className="pf-logout-bottom" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Abmelden
        </button>
      </main>

      <Socials />
    </div>
  );
}
