import React, { useEffect, useState, Component } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../services/supabase';
import { usePizzaStore } from '../store/PizzaContext';
import { calcPrice } from '../utils/pizzaUtils';
import { useMountDelay } from '../hooks/useMountDelay';
import { useUserAddresses } from '../hooks/useUserAddresses';
import PasswordInput from '../components/ui/PasswordInput';

// ─── Always-available fallback — page never goes blank ───────
const MOCK_USER = {
  id: 'mock',
  fullName: 'Azad',
  email: 'emlotphi@gmail.com',
  phone: '+49 151 000 0000',
  address: {},
  savedPizzas: [],
  orderHistory: [],
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ─── Error boundary — catches any sub-tree crash ─────────────
class ProfileErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(14px)',
            borderRadius: 20,
            padding: '32px 24px',
            maxWidth: 480,
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <p style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 900, fontSize: 16, color: 'rgba(255,255,255,0.90)', marginBottom: 8 }}>
              Etwas ist schiefgelaufen.
            </p>
            <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.50)', marginBottom: 20 }}>
              {String(this.state.error?.message ?? '')}
            </p>
            <button
              style={{ padding: '10px 24px', borderRadius: 50, border: 'none', background: '#FF6B1A', color: '#fff', fontFamily: 'Nunito,sans-serif', fontWeight: 900, cursor: 'pointer' }}
              onClick={() => this.setState({ crashed: false, error: null })}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function fmt(iso) {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
}

function initials(name = '') {
  return (name || '?').split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

// ─── Small shared pieces ──────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="pf-info-row">
      <span className="pf-info-label">{label}</span>
      <span className="pf-info-value">{value || '—'}</span>
    </div>
  );
}

function SectionCard({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`pf-section glass-card${open ? ' pf-section--open' : ''}`}>
      <button
        className="pf-section-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="pf-section-icon">{icon}</span>
        <h2 className="pf-section-title">{title}</h2>
        <svg
          className={`pf-section-chevron${open ? ' pf-section-chevron--open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={`pf-section-body${open ? ' pf-section-body--open' : ''}`}>
        <div className="pf-section-body__inner">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Personal info section ────────────────────────────────────
function PersonalInfoSection({ user }) {
  const auth = useAuth();
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
  });

  async function handleSave() {
    if (auth?.updateProfile) await auth.updateProfile(fields);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="pf-info-grid">
        <InfoRow label="Name" value={user?.fullName} />
        <InfoRow label="E-Mail" value={user?.email} />
        <InfoRow label="Telefon" value={user?.phone} />
        <InfoRow label="Mitglied" value={fmt(user?.createdAt)} />
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="pf-info-grid">
      {/* Email is read-only — changing it requires Supabase email-verification flow */}
      <div className="pf-field-row" style={{ opacity: 0.55 }}>
        <label className="pf-info-label">E-Mail</label>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700 }}>
          {user?.email}
        </span>
      </div>
      {[
        { label: 'Name', key: 'fullName', type: 'text', ph: 'Vollständiger Name' },
        { label: 'Telefon', key: 'phone', type: 'tel', ph: '+49 …' },
      ].map(f => (
        <div key={f.key} className="pf-field-row">
          <label className="pf-info-label">{f.label}</label>
          <input
            className="pf-inline-input"
            type={f.type}
            value={fields[f.key]}
            placeholder={f.ph}
            onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="pf-save-btn" onClick={handleSave}>Speichern</button>
        <button className="pf-cancel-btn" onClick={() => setEditing(false)}>Abbrechen</button>
      </div>
    </div>
  );
}

// ─── Change password section ──────────────────────────────────
function ChangePasswordSection() {
  const { changePassword } = useAuth();
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  async function handleSave() {
    const errs = {};
    if (!newPw) errs.newPw = 'Pflichtfeld';
    else if (newPw.length < 8) errs.newPw = 'Mindestens 8 Zeichen';
    if (confirm !== newPw) errs.confirm = 'Passwörter stimmen nicht überein';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setErrors({});
    const { error } = await changePassword(newPw);
    setSaving(false);

    if (error) { setErrors({ general: error }); return; }

    setNewPw('');
    setConfirm('');
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 4000);
  }

  return (
    <div className="pf-info-grid">
      {saveOk && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', marginBottom: 4,
          background: 'rgba(61,185,110,0.10)',
          border: '1px solid rgba(61,185,110,0.28)', borderRadius: 10,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3db96e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, color: '#2a9655' }}>
            Passwort erfolgreich geändert ✓
          </span>
        </div>
      )}

      {errors.general && (
        <div style={{ padding: '8px 14px', background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.20)', borderRadius: 10, fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#FF3B30' }}>
          {errors.general}
        </div>
      )}

      <div className="pf-field-row">
        <label className="pf-info-label">Neues Passwort *</label>
        <PasswordInput
          className="pf-inline-input"
          value={newPw}
          onChange={e => { setNewPw(e.target.value); setErrors(p => ({ ...p, newPw: '' })); }}
          placeholder="Mindestens 8 Zeichen"
          autoComplete="new-password"
        />
      </div>
      {errors.newPw && <span className="co-field-error" style={{ paddingLeft: 0 }}>{errors.newPw}</span>}

      <div className="pf-field-row">
        <label className="pf-info-label">Bestätigen *</label>
        <PasswordInput
          className="pf-inline-input"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>
      {errors.confirm && <span className="co-field-error" style={{ paddingLeft: 0 }}>{errors.confirm}</span>}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern…' : 'Passwort ändern'}
        </button>
      </div>
    </div>
  );
}

// ─── Address form modal (add / edit) ─────────────────────────
const LABEL_PRESETS = ['Zuhause', 'Arbeit', 'Freundin', 'Freund', 'Eltern', 'Andere'];

const EMPTY_ADDR_FORM = {
  label: 'Zuhause', street: '', house_number: '', postal_code: '',
  city: '', floor: '', bell_name: '', phone: '', is_default: false,
};

function AddressFormModal({ address, isFirst, onSave, onClose }) {
  const [form, setForm] = useState(address ? {
    label:        address.label        || 'Zuhause',
    street:       address.street       || '',
    house_number: address.house_number || '',
    postal_code:  address.postal_code  || '',
    city:         address.city         || '',
    floor:        address.floor        || '',
    bell_name:    address.bell_name    || '',
    phone:        address.phone        || '',
    is_default:   address.is_default   ?? false,
  } : { ...EMPTY_ADDR_FORM, is_default: isFirst });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  /* Lock background scroll while modal is open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.street.trim())  { setErr('Straße ist erforderlich.'); return; }
    if (!form.city.trim())    { setErr('Stadt ist erforderlich.');  return; }
    if (!form.label.trim())   { setErr('Bezeichnung ist erforderlich.'); return; }
    setSaving(true); setErr('');
    try {
      await onSave(address?.id ?? null, {
        label:        form.label.trim(),
        street:       form.street.trim(),
        house_number: form.house_number.trim(),
        postal_code:  form.postal_code.trim(),
        city:         form.city.trim(),
        floor:        form.floor.trim(),
        bell_name:    form.bell_name.trim(),
        phone:        form.phone.trim(),
        is_default:   form.is_default,
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* Rendered via portal so it escapes the glass-card backdrop-filter stacking context */
  return createPortal(
    <div className="pf-addr-modal-overlay" onClick={onClose}>
      <div className="pf-addr-modal" onClick={e => e.stopPropagation()}>

        {/* ── Sticky header ── */}
        <div className="pf-addr-modal-header">
          <span className="pf-addr-modal-title">{address ? 'Adresse bearbeiten' : 'Neue Adresse'}</span>
          <button type="button" className="pf-addr-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── Scrollable body ── */}
          <div className="pf-addr-modal-body">
            <div className="pf-addr-form">

              <div className="pf-addr-form-row">
                <label className="pf-addr-form-label">Bezeichnung *</label>
                <input
                  className="pf-inline-input"
                  value={form.label}
                  onChange={e => set('label', e.target.value)}
                  list="pf-addr-label-list"
                  placeholder="z.B. Zuhause, Arbeit"
                />
                <datalist id="pf-addr-label-list">
                  {LABEL_PRESETS.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              <div className="pf-addr-form-row">
                <label className="pf-addr-form-label">Straße *</label>
                <input className="pf-inline-input" value={form.street}
                  onChange={e => set('street', e.target.value)} placeholder="Musterstraße" />
              </div>

              <div className="pf-addr-form-2col">
                <div className="pf-addr-form-row">
                  <label className="pf-addr-form-label">Hausnr.</label>
                  <input className="pf-inline-input" value={form.house_number}
                    onChange={e => set('house_number', e.target.value)} placeholder="12A" />
                </div>
                <div className="pf-addr-form-row">
                  <label className="pf-addr-form-label">PLZ</label>
                  <input className="pf-inline-input" value={form.postal_code}
                    onChange={e => set('postal_code', e.target.value)} placeholder="10115" />
                </div>
              </div>

              <div className="pf-addr-form-row">
                <label className="pf-addr-form-label">Stadt *</label>
                <input className="pf-inline-input" value={form.city}
                  onChange={e => set('city', e.target.value)} placeholder="Berlin" />
              </div>

              <div className="pf-addr-form-2col">
                <div className="pf-addr-form-row">
                  <label className="pf-addr-form-label">Etage</label>
                  <input className="pf-inline-input" value={form.floor}
                    onChange={e => set('floor', e.target.value)} placeholder="2. OG" />
                </div>
                <div className="pf-addr-form-row">
                  <label className="pf-addr-form-label">Klingelname</label>
                  <input className="pf-inline-input" value={form.bell_name}
                    onChange={e => set('bell_name', e.target.value)} placeholder="Mustermann" />
                </div>
              </div>

              <div className="pf-addr-form-row">
                <label className="pf-addr-form-label">Telefon</label>
                <input className="pf-inline-input" type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="+49 151 …" />
              </div>

              <div className="pf-addr-form-row pf-addr-form-row--inline">
                <label className="pf-addr-form-label">Als Standard</label>
                <button
                  type="button"
                  onClick={() => set('is_default', !form.is_default)}
                  style={{
                    width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: form.is_default ? 'rgba(255,107,26,0.18)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center',
                    padding: '0 3px', transition: 'background 0.18s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#FF6B1A', opacity: form.is_default ? 1 : 0.4,
                    transform: form.is_default ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 0.18s, opacity 0.18s',
                  }} />
                </button>
              </div>

              {err && (
                <div style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(200,0,30,0.07)', border: '1px solid rgba(200,0,30,0.22)',
                  fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#FF3B30',
                }}>
                  {err}
                </div>
              )}

            </div>
          </div>

          {/* ── Sticky footer ── */}
          <div className="pf-addr-modal-footer">
            <button type="button" className="pf-cancel-btn" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="pf-save-btn" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Speichern…' : address ? 'Änderungen speichern' : 'Adresse hinzufügen'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Multi-address management section ────────────────────────
function MultiAddressSection() {
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefault } = useUserAddresses();
  const [modal,    setModal]    = useState(null); // null | 'add' | { address }
  const [deleting, setDeleting] = useState(null);

  async function handleSave(id, payload) {
    if (id) {
      const { error } = await updateAddress(id, payload);
      if (error) throw new Error(error.message ?? 'Fehler beim Speichern.');
    } else {
      const { error } = await addAddress(payload);
      if (error) throw new Error(error.message ?? 'Fehler beim Hinzufügen.');
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    await deleteAddress(id);
    setDeleting(null);
  }

  async function handleSetDefault(id) {
    setDeleting(id); // reuse busy state
    await setDefault(id);
    setDeleting(null);
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.10)',
          borderTopcolor: '#FF3B30',
          animation: 'co-spin 0.7s linear infinite',
        }} />
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.40)' }}>
          Lade Adressen…
        </span>
      </div>
    );
  }

  return (
    <>
      {modal === 'add' && (
        <AddressFormModal
          isFirst={addresses.length === 0}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.address && (
        <AddressFormModal
          address={modal.address}
          isFirst={false}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="pf-addr-header">
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.50)' }}>
          {addresses.length} {addresses.length === 1 ? 'Adresse' : 'Adressen'} gespeichert
        </span>
        <button className="pf-addr-add-btn" onClick={() => setModal('add')}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Neue Adresse
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="pf-empty-hint">
          Noch keine Adresse gespeichert. Einmal hinzufügen — beim Checkout immer griffbereit.
        </p>
      ) : (
        <div className="pf-addr-grid">
          {addresses.map(addr => (
            <div key={addr.id} className={`pf-addr-card${addr.is_default ? ' pf-addr-card--default' : ''}`}>
              <div className="pf-addr-card-top">
                <span className="pf-addr-label-name">{addr.label}</span>
                {addr.is_default && <span className="pf-addr-default-chip">Standard</span>}
              </div>
              <div className="pf-addr-line">{addr.street} {addr.house_number}</div>
              {addr.floor && <div className="pf-addr-line">{addr.floor}</div>}
              <div className="pf-addr-line">{addr.postal_code} {addr.city}</div>
              {addr.phone && <div className="pf-addr-phone">{addr.phone}</div>}
              <div className="pf-addr-actions">
                <button className="pf-addr-btn" onClick={() => setModal({ address: addr })}>
                  Bearbeiten
                </button>
                {!addr.is_default && (
                  <button
                    className="pf-addr-btn pf-addr-btn--default-set"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={deleting === addr.id}
                  >
                    {deleting === addr.id ? '…' : 'Standard setzen'}
                  </button>
                )}
                <button
                  className="pf-addr-btn pf-addr-btn--danger"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deleting === addr.id}
                >
                  {deleting === addr.id ? '…' : 'Löschen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addresses.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3db96e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: '#3db96e' }}>
            Beim Checkout automatisch zur Auswahl bereit
          </span>
        </div>
      )}
    </>
  );
}

// ─── Order history section ────────────────────────────────────
function OrderHistorySection({ orders }) {
  const navigate = useNavigate();
  const store = usePizzaStore();
  const list = Array.isArray(orders) ? orders : [];

  if (!list.length) {
    return <p className="pf-empty-hint">Noch keine Bestellungen aufgegeben.</p>;
  }

  function handleReorder(order) {
    const items = (order.pizzas ?? []).map(p => ({ ...p, id: Date.now() + Math.random(), quantity: p.quantity || 1 }));
    store?.replaceCart(items);
    navigate('/cart');
  }

  return (
    <div className="pf-order-list">
      {list.map((order, i) => (
        <div key={order.id ?? i} className="pf-order-card">
          <div className="pf-order-header">
            <div className="pf-order-meta">
              <span className="pf-order-date">{fmt(order.date)}</span>
              <span className="pf-order-status">Geliefert</span>
            </div>
            <span className="pf-order-total">€{Number(order.total ?? 0).toFixed(2)}</span>
          </div>
          <button className="pf-reorder-btn" onClick={() => handleReorder(order)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
            Erneut bestellen
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Saved-items summary ──────────────────────────────────────
function SavedSummarySection({ items, linkPath, emptyText }) {
  const navigate = useNavigate();
  return (
    <div className="pf-saved-summary">
      {items.length === 0 ? (
        <p className="pf-empty-hint">{emptyText}</p>
      ) : (
        <div className="pf-saved-preview-list">
          {items.slice(0, 3).map(item => (
            <div key={item.id} className="pf-saved-preview-row">
              <span className="pf-saved-preview-name">{item.name}</span>
              <span className="pf-saved-preview-price">€{calcPrice(item).toFixed(2)}</span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="pf-saved-preview-more">+{items.length - 3} more</p>
          )}
        </div>
      )}
      <button
        className="pf-view-all-btn"
        onClick={() => navigate(linkPath)}
      >
        {items.length === 0 ? 'Create one now →' : 'View all →'}
      </button>
    </div>
  );
}

// ─── Payment placeholder ──────────────────────────────────────
function PaymentSection() {
  return (
    <div className="pf-payment-list">
      {['PayPal', 'Kreditkarte', 'Apple Pay', 'Google Pay'].map(m => (
        <div key={m} className="pf-payment-row">
          <span className="pf-payment-label">{m}</span>
          <span className="pf-payment-badge">Bald verfügbar</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="app-page">
      <Navbar />
      <main className="pf-main">
        <div className="pf-hero">
          <div className="sk sk-circle" style={{ width: 68, height: 68, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sk sk-line sk-line--title" style={{ width: 140 }} />
            <div className="sk sk-line sk-line--half" />
            <div className="sk sk-line sk-line--short" />
          </div>
        </div>
        <div className="pf-content">
          {[160, 100, 110, 130, 120].map((w, i) => (
            <div key={i} className="pf-section glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                <div className="sk" style={{ width: 18, height: 18, borderRadius: 5 }} />
                <div className="sk sk-line" style={{ width: w }} />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Socials />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
function ProfileContent() {
  const navigate = useNavigate();

  // Safe context access — if context is null for any reason, fall back gracefully
  const auth = useAuth();
  const currentUser = auth?.currentUser ?? null;
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const logout = auth?.logout;

  const store = usePizzaStore();
  const savedItems = store?.savedItems ?? [];
  const savedPizzas = savedItems.filter(i => i.type !== 'burger');
  const savedBurgers = savedItems.filter(i => i.type === 'burger');

  const ready = useMountDelay(280);

  // Always render with real or mock data — no redirect, no blank page
  const user = currentUser ?? MOCK_USER;
  const orderCount = user?.orderHistory?.length ?? 0;

  if (!ready) return <ProfileSkeleton />;

  function handleLogout() {
    if (isLoggedIn && logout) logout();
    navigate('/');
  }

  console.log('[Profile] mounting — user:', user?.fullName, '| isLoggedIn:', isLoggedIn);

  return (
    <div className="app-page page-enter">
      <Navbar />

      <main className="pf-main">

        {/* ── Hero banner ── */}
        <div className="pf-hero">
          <div className="pf-avatar">{initials(user?.fullName)}</div>

          <div className="pf-hero-info">
            <h1 className="pf-hero-name">{user?.fullName ?? 'Profil'}</h1>
            <p className="pf-hero-email">{user?.email ?? ''}</p>
            <div className="pf-hero-stats">
              {isLoggedIn && (
                <span className="pf-hero-stat" style={{ color: '#2a7a4a' }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="#3db96e">
                    <circle cx="5" cy="5" r="5" />
                  </svg>
                  Angemeldet · Sitzung gespeichert
                </span>
              )}
              {isLoggedIn && <span className="pf-hero-stat-sep">·</span>}
              <span className="pf-hero-stat">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {orderCount} {orderCount === 1 ? 'Bestellung' : 'Bestellungen'}
              </span>
              <span className="pf-hero-stat-sep">·</span>
              <span className="pf-hero-stat">Seit {fmt(user?.createdAt)}</span>
            </div>
          </div>

          <div className="pf-hero-actions">
            <button
              className="pf-edit-profile-btn"
              onClick={() => document.getElementById('pf-info-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
            <button className="pf-logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="pf-content">

          <div id="pf-info-section">
            <SectionCard
              defaultOpen
              title="Persönliche Informationen"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              }
            >
              <ProfileErrorBoundary>
                <PersonalInfoSection user={user} />
              </ProfileErrorBoundary>
            </SectionCard>
          </div>

          <SectionCard
            title="Lieferadressen"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <MultiAddressSection />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title={`My Pizzas${savedPizzas.length ? ` (${savedPizzas.length})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2.5 21.5h19L12 2z" />
                <path d="M3 21 Q12 16.5 21 21" />
                <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <SavedSummarySection
                items={savedPizzas}
                linkPath="/my-pizzas"
                emptyText="No saved pizzas yet — build one!"
              />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title={`My Burgers${savedBurgers.length ? ` (${savedBurgers.length})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11a8 8 0 0 1 16 0H4z" />
                <rect x="3" y="11" width="18" height="3" rx="1" />
                <path d="M3 14h18v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14z" />
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <SavedSummarySection
                items={savedBurgers}
                linkPath="/my-burgers"
                emptyText="No saved burgers yet — build one!"
              />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title={`Bestellhistorie${orderCount ? ` (${orderCount})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <OrderHistorySection orders={user?.orderHistory} />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title="Passwort ändern"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <ChangePasswordSection />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title="Zahlungsmethoden"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          >
            <PaymentSection />
          </SectionCard>

        </div>

        {/* ── Mobile logout ── */}
        <button className="pf-logout-bottom" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Abmelden
        </button>

      </main>

      <Socials />
    </div>
  );
}

export default function ProfileDashboard() {
  return (
    <ProfileErrorBoundary>
      <ProfileContent />
    </ProfileErrorBoundary>
  );
}
