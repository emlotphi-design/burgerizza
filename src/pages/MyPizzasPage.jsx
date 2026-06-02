import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import { usePizzaStore } from '../store/PizzaContext';
import { calcPrice, LABEL } from '../utils/pizzaUtils';
import { useMountDelay } from '../hooks/useMountDelay';

function fmt(iso) {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
}

function SavedPizzaCard({ pizza, isExiting, onEdit, onReorder, onDelete }) {
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const price = calcPrice(pizza);

  const rows = [
    pizza.dough      && { cat: 'Teig',    val: LABEL[pizza.dough]    ?? pizza.dough    },
    pizza.sauce      && { cat: 'Sauce',   val: LABEL[pizza.sauce]    ?? pizza.sauce    },
    pizza.cheese     && { cat: 'Käse',    val: LABEL[pizza.cheese]   ?? pizza.cheese   },
    (pizza.meats      ?? []).length > 0 && { cat: 'Fleisch', val: (pizza.meats      ?? []).map(id => LABEL[id] ?? id).join(', ') },
    (pizza.vegetables ?? []).length > 0 && { cat: 'Gemüse',  val: (pizza.vegetables ?? []).map(id => LABEL[id] ?? id).join(', ') },
  ].filter(Boolean);

  return (
    <div className={`saved-card glass-card${isExiting ? ' saved-card--exit' : ''}`}>

      {/* ── Header: name + date left, price right ── */}
      <div className="saved-card-header">
        <div className="saved-card-meta">
          <span className="saved-card-name">{pizza.name}</span>
          {pizza.savedAt && (
            <span className="saved-card-date">Gespeichert {fmt(pizza.savedAt)}</span>
          )}
        </div>
        <span className="saved-card-price">€{price.toFixed(2)}</span>
      </div>

      {/* ── Image ── */}
      <div className="saved-card-image">
        <PizzaCanvas
          activeCategory=""
          selectedDough={pizza.dough}
          selectedSauce={pizza.sauce}
          selectedCheese={pizza.cheese}
          selectedMeats={pizza.meats ?? []}
          selectedVegetables={pizza.vegetables ?? []}
          size="160px"
        />
      </div>

      {/* ── Collapsible Zutaten ── */}
      <div className="saved-card-body">
        <button
          className={`cart-ing-toggle${ingredientsOpen ? ' cart-ing-toggle--open' : ''}`}
          onClick={() => setIngredientsOpen(o => !o)}
          aria-expanded={ingredientsOpen}
        >
          <span>Zutaten</span>
          <svg
            className="cart-ing-toggle__chevron"
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className={`cart-ing-body${ingredientsOpen ? ' cart-ing-body--open' : ''}`}>
          <div className="cart-ing-body__inner">
            <div className="cart-ingredients">
              {rows.map(row => (
                <div key={row.cat} className="ingredient-row">
                  <span className="ingredient-cat">{row.cat}</span>
                  <span className="ingredient-vals">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="saved-card-actions">
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
  );
}

function PizzasSkeleton() {
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

      <div className="saved-items-grid">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="saved-card glass-card">
            <div style={{ padding: '18px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                <div className="sk sk-line" style={{ width: '68%', height: 16 }} />
                <div className="sk sk-line" style={{ width: '44%', height: 10 }} />
              </div>
              <div className="sk" style={{ width: 46, height: 20, borderRadius: 6, flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 18px 18px' }}>
              <div className="sk sk-circle" style={{ width: 150, height: 150 }} />
            </div>
            <div style={{ padding: '0 14px' }}>
              <div className="sk" style={{ height: 34, borderRadius: 10, width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px 16px' }}>
              {[0, 1, 2].map(j => (
                <div key={j} className="sk" style={{ flex: 1, height: 36, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function MyPizzasPage() {
  const navigate = useNavigate();
  const { savedItems, removeSavedItem, addToCart, startEditing } = usePizzaStore();
  const [exitingIds, setExitingIds] = useState([]);
  const ready = useMountDelay(280);

  if (!ready) return <PizzasSkeleton />;

  const pizzas = (savedItems ?? []).filter(i => i.type !== 'burger');

  function handleEdit(pizza) {
    startEditing(pizza);
    navigate('/build-pizza');
  }

  function handleReorder(pizza) {
    addToCart(pizza);
    navigate('/cart');
  }

  function handleDelete(id) {
    setExitingIds(prev => [...prev, id]);
    setTimeout(() => {
      removeSavedItem(id);
      setExitingIds(prev => prev.filter(x => x !== id));
    }, 400);
  }

  return (
    <div className="app-page page-enter">
      <Navbar />

      <main className="saved-page-main">
        <div className="saved-page-hero">
          <div className="saved-page-hero-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 2.5 21.5h19L12 2z"/>
              <path d="M3 21 Q12 16.5 21 21"/>
              <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none"/>
              <circle cx="8.8" cy="19.2" r="1" fill="currentColor" stroke="none"/>
              <circle cx="15.2" cy="19.2" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div>
            <h1 className="saved-page-title">My Pizzas</h1>
            <p className="saved-page-subtitle">
              {pizzas.length === 0
                ? 'No saved pizzas yet'
                : `${pizzas.length} saved pizza${pizzas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="saved-page-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {pizzas.length === 0 ? (
          <div className="saved-page-empty">
            <p className="cart-empty-msg">Build a custom pizza to save it here.</p>
            <button className="btn" onClick={() => navigate('/build-pizza')} style={{ marginTop: 8 }}>
              BUILD A PIZZA
            </button>
          </div>
        ) : (
          <div className="saved-items-grid">
            {pizzas.map(pizza => (
              <SavedPizzaCard
                key={pizza.id}
                pizza={pizza}
                isExiting={exitingIds.includes(pizza.id)}
                onEdit={() => handleEdit(pizza)}
                onReorder={() => handleReorder(pizza)}
                onDelete={() => handleDelete(pizza.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Socials />
    </div>
  );
}
