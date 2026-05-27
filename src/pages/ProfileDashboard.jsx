import React, { useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { useAuth } from '../context/AuthContext';
import { usePizzaStore } from '../context/PizzaContext';
import { calcPrice } from '../utils/pizzaUtils';

// ─── Always-available fallback — page never goes blank ───────
const MOCK_USER = {
  id:           'mock',
  fullName:     'Azad',
  email:        'emlotphi@gmail.com',
  phone:        '+49 151 000 0000',
  address:      { street: 'Musterstraße', houseNumber: '12', postalCode: '10115', city: 'Berlin', floor: '', doorbellName: '' },
  savedPizzas:  [],
  orderHistory: [],
  createdAt:    '2025-01-01T00:00:00.000Z',
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
            <p style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 900, fontSize: 16, color: '#1A0A00', marginBottom: 8 }}>
              Etwas ist schiefgelaufen.
            </p>
            <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 13, color: 'rgba(26,10,0,0.5)', marginBottom: 20 }}>
              {String(this.state.error?.message ?? '')}
            </p>
            <button
              style={{ padding: '10px 24px', borderRadius: 50, border: 'none', background: '#FFD23F', fontFamily: 'Nunito,sans-serif', fontWeight: 900, cursor: 'pointer' }}
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

function SectionCard({ title, icon, children }) {
  return (
    <div className="pf-section">
      <div className="pf-section-header">
        <span className="pf-section-icon">{icon}</span>
        <h2 className="pf-section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Personal info section ────────────────────────────────────
function PersonalInfoSection({ user }) {
  const auth      = useAuth();
  const [editing, setEditing] = useState(false);
  const [fields,  setFields]  = useState({
    fullName: user?.fullName ?? '',
    email:    user?.email    ?? '',
    phone:    user?.phone    ?? '',
  });

  async function handleSave() {
    if (auth?.updateProfile) await auth.updateProfile(fields);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="pf-info-grid">
        <InfoRow label="Name"     value={user?.fullName} />
        <InfoRow label="E-Mail"   value={user?.email} />
        <InfoRow label="Telefon"  value={user?.phone} />
        <InfoRow label="Mitglied" value={fmt(user?.createdAt)} />
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="pf-info-grid">
      {[
        { label: 'Name',     key: 'fullName', type: 'text',  ph: 'Vollständiger Name' },
        { label: 'E-Mail',   key: 'email',    type: 'email', ph: 'E-Mail Adresse'     },
        { label: 'Telefon',  key: 'phone',    type: 'tel',   ph: '+49 …'              },
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

// ─── Order history section ────────────────────────────────────
function OrderHistorySection({ orders }) {
  const navigate  = useNavigate();
  const store     = usePizzaStore();
  const list      = Array.isArray(orders) ? orders : [];

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
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
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

// ─── Main component ───────────────────────────────────────────
function ProfileContent() {
  const navigate = useNavigate();

  // Safe context access — if context is null for any reason, fall back gracefully
  const auth        = useAuth();
  const currentUser = auth?.currentUser ?? null;
  const isLoggedIn  = auth?.isLoggedIn  ?? false;
  const logout      = auth?.logout;

  const store      = usePizzaStore();
  const savedItems = store?.savedItems ?? [];
  const savedPizzas  = savedItems.filter(i => i.type !== 'burger');
  const savedBurgers = savedItems.filter(i => i.type === 'burger');

  // Always render with real or mock data — no redirect, no blank page
  const user       = currentUser ?? MOCK_USER;
  const orderCount = user?.orderHistory?.length ?? 0;

  function handleLogout() {
    if (isLoggedIn && logout) logout();
    navigate('/');
  }

  console.log('[Profile] mounting — user:', user?.fullName, '| isLoggedIn:', isLoggedIn);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="pf-main">

        {/* ── Hero banner ── */}
        <div className="pf-hero">
          <div className="pf-avatar">{initials(user?.fullName)}</div>

          <div className="pf-hero-info">
            <h1 className="pf-hero-name">{user?.fullName ?? 'Profil'}</h1>
            <p className="pf-hero-email">{user?.email ?? ''}</p>
            <div className="pf-hero-stats">
              <span className="pf-hero-stat">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
            <button className="pf-logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="pf-content">

          <div id="pf-info-section">
            <SectionCard
              title="Persönliche Informationen"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              }
            >
              <ProfileErrorBoundary>
                <PersonalInfoSection user={user} />
              </ProfileErrorBoundary>
            </SectionCard>
          </div>

          <SectionCard
            title={`My Pizzas${savedPizzas.length ? ` (${savedPizzas.length})` : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2.5 21.5h19L12 2z"/>
                <path d="M3 21 Q12 16.5 21 21"/>
                <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none"/>
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
                <path d="M4 11a8 8 0 0 1 16 0H4z"/>
                <rect x="3" y="11" width="18" height="3" rx="1"/>
                <path d="M3 14h18v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14z"/>
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }
          >
            <ProfileErrorBoundary>
              <OrderHistorySection orders={user?.orderHistory} />
            </ProfileErrorBoundary>
          </SectionCard>

          <SectionCard
            title="Zahlungsmethoden"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            }
          >
            <PaymentSection />
          </SectionCard>

        </div>

        {/* ── Mobile logout ── */}
        <button className="pf-logout-bottom" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

export default function ProfileDashboard() {
  return (
    <ProfileErrorBoundary>
      <ProfileContent />
    </ProfileErrorBoundary>
  );
}
