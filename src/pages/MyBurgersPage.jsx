import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import { usePizzaStore } from '../context/PizzaContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { calcBurgerPrice, BURGER_LABEL } from '../features/burger/utils/burgerUtils';
import SkeletonImage from '../components/SkeletonImage';
import { useMountDelay } from '../hooks/useMountDelay';

function fmt(iso) {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
}

function cheeseEntries(burger) {
  const c = burger.cheeses;
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    return Object.entries(c).map(([id, qty]) => ({ id, qty }));
  }
  if (burger.cheese) return [{ id: burger.cheese, qty: 1 }];
  return [];
}

function meatEntries(burger) {
  const m = burger.meats;
  if (!m) return [];
  if (Array.isArray(m)) return m.map(id => ({ id, qty: 1 }));
  return Object.entries(m).map(([id, qty]) => ({ id, qty }));
}

function SavedBurgerCard({ burger, isExiting, onEdit, onReorder, onDelete }) {
  const price   = calcBurgerPrice(burger);
  const meats   = meatEntries(burger);
  const cheeses = cheeseEntries(burger);

  const rows = [
    burger.bun            && { cat: 'Brötchen', val: BURGER_LABEL[burger.bun]  ?? burger.bun  },
    meats.length > 0      && { cat: 'Fleisch',  val: meats.map(({ id, qty }) => qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)).join(', ') },
    cheeses.length > 0    && { cat: 'Käse',     val: cheeses.map(({ id, qty }) => qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)).join(', ') },
    (burger.sauces     ?? []).length > 0 && { cat: 'Sauce',   val: (burger.sauces     ?? []).map(id => BURGER_LABEL[id] ?? id).join(', ') },
    (burger.vegetables ?? []).length > 0 && { cat: 'Gemüse',  val: (burger.vegetables ?? []).map(id => BURGER_LABEL[id] ?? id).join(', ') },
  ].filter(Boolean);

  return (
    <div className={`cart-pizza-card${isExiting ? ' cart-pizza-card--exit' : ''}`}>
      <div className="cart-layout">

        <div className="cart-preview">
          {burger.image ? (
            <SkeletonImage
              src={burger.image}
              alt={burger.name}
              skeletonRadius="16px"
              wrapperStyle={{ width: 'min(200px, 48vw)', height: 'min(200px, 48vw)' }}
              imgStyle={{
                width: 'min(200px, 48vw)',
                height: 'min(200px, 48vw)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.15))',
              }}
            />
          ) : (
            <div className="saved-burger-placeholder">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(26,10,0,0.18)' }}>
                <path d="M4 11a8 8 0 0 1 16 0H4z"/>
                <rect x="3" y="11" width="18" height="3" rx="1"/>
                <path d="M3 14h18v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14z"/>
              </svg>
            </div>
          )}
        </div>

        <div className="cart-details">
          <div className="cart-pizza-name-row">
            <span className="cart-pizza-name">{burger.name}</span>
          </div>

          {burger.savedAt && (
            <p className="saved-item-date">Gespeichert {fmt(burger.savedAt)}</p>
          )}

          <p className="cart-section-label">Zutaten</p>
          <div className="cart-ingredients">
            {rows.map(row => (
              <div key={row.cat} className="ingredient-row">
                <span className="ingredient-cat">{row.cat}</span>
                <span className="ingredient-vals">{row.val}</span>
              </div>
            ))}
          </div>

          <div className="cart-divider" />

          <div className="cart-price-block">
            <div className="cart-price-row cart-price-total">
              <span>Preis</span>
              <span>€{price.toFixed(2)}</span>
            </div>
          </div>

          <div className="cart-divider" />

          <div className="cart-card-actions saved-item-actions">
            <button className="cart-edit-btn" onClick={onEdit} aria-label="Bearbeiten">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Bearbeiten
            </button>
            <button className="cart-edit-btn saved-reorder-btn" onClick={onReorder} aria-label="Bestellen">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Bestellen
            </button>
            <button className="cart-delete-btn" onClick={onDelete} aria-label="Löschen">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Löschen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function BurgersSkeleton() {
  return (
    <main className="saved-page-main">
      <div className="saved-page-hero">
        <div className="saved-page-hero-icon">
          <div className="sk" style={{ width: 22, height: 22, borderRadius: 5 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div className="sk sk-line sk-line--title" style={{ width: 110 }} />
          <div className="sk sk-line sk-line--half" />
        </div>
      </div>

      <div className="cart-pizzas-list saved-items-list">
        {[0, 1].map(i => (
          <div key={i} className="cart-pizza-card glass-card" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <div className="sk" style={{ width: 160, height: 160, borderRadius: 16, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="sk sk-line sk-line--title sk-line--long" />
                <div className="sk sk-line sk-line--short" />
                {[80, 68, 74].map((w, j) => (
                  <div key={j} className="sk sk-line" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function MyBurgersPage() {
  const navigate = useNavigate();
  const { savedItems, removeSavedItem, addToCart } = usePizzaStore();
  const { isLoggedIn } = useAuth();

  const [exitingIds,  setExitingIds]  = useState([]);
  const [dbBurgers,   setDbBurgers]   = useState([]);
  const [fetching,    setFetching]    = useState(false);
  const [fetchError,  setFetchError]  = useState(null);
  const ready = useMountDelay(280);

  // Fetch saved burgers from database when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    setFetching(true);
    setFetchError(null);
    api.burgers.list()
      .then(data => {
        setDbBurgers(
          (data.burgers ?? []).map(b => ({
            ...b,
            type:    'burger',
            savedAt: b.createdAt,
          }))
        );
      })
      .catch(() => setFetchError('Deine Burgers konnten nicht geladen werden.'))
      .finally(() => setFetching(false));
  }, [isLoggedIn]);

  if (!ready || (isLoggedIn && fetching)) return <BurgersSkeleton />;

  // Logged-in: use DB as source of truth. Guest: use localStorage.
  const burgers = isLoggedIn
    ? dbBurgers
    : (savedItems ?? []).filter(i => i.type === 'burger');

  function handleEdit(burger) {
    // Write to bz_burger_draft localStorage so BurgerBuilder picks it up on mount
    const draft = {
      bun:        burger.bun,
      meats:      burger.meats   ?? {},
      cheeses:    burger.cheeses ?? (burger.cheese ? { [burger.cheese]: 1 } : {}),
      sauces:     burger.sauces  ?? [],
      vegetables: burger.vegetables ?? [],
      name:       burger.name,
      editingId:  null,   // not editing a cart item — new entry on save
      wrapper:    burger.wrapper ?? null,
    };
    try { localStorage.setItem('bz_burger_draft', JSON.stringify(draft)); } catch {}
    navigate('/build-burger');
  }

  function handleReorder(burger) {
    addToCart(burger);
    navigate('/cart');
  }

  function handleDelete(id) {
    setExitingIds(prev => [...prev, id]);
    setTimeout(() => {
      if (isLoggedIn) {
        setDbBurgers(prev => prev.filter(b => b.id !== id));
        api.burgers.remove(id).catch(() => {});
      } else {
        removeSavedItem(id);
      }
      setExitingIds(prev => prev.filter(x => x !== id));
    }, 400);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="saved-page-main">
        <div className="saved-page-hero">
          <div className="saved-page-hero-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a8 8 0 0 1 16 0H4z"/>
              <rect x="3" y="11" width="18" height="3" rx="1"/>
              <path d="M3 14h18v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14z"/>
            </svg>
          </div>
          <div>
            <h1 className="saved-page-title">My Burgers</h1>
            <p className="saved-page-subtitle">
              {burgers.length === 0
                ? 'No saved burgers yet'
                : `${burgers.length} saved burger${burgers.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="saved-page-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {fetchError && (
          <p className="auth-error-banner" style={{ marginBottom: 16 }}>{fetchError}</p>
        )}

        {burgers.length === 0 ? (
          <div className="saved-page-empty">
            <p className="cart-empty-msg">Build a custom burger to save it here.</p>
            <button className="btn" onClick={() => navigate('/build-burger')} style={{ marginTop: 8 }}>
              BUILD A BURGER
            </button>
          </div>
        ) : (
          <div className="cart-pizzas-list saved-items-list">
            {burgers.map(burger => (
              <SavedBurgerCard
                key={burger.id}
                burger={burger}
                isExiting={exitingIds.includes(burger.id)}
                onEdit={() => handleEdit(burger)}
                onReorder={() => handleReorder(burger)}
                onDelete={() => handleDelete(burger.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Socials />
    </div>
  );
}
