import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import { usePizzaStore } from '../context/PizzaContext';
import { calcPrice, LABEL } from '../utils/pizzaUtils';
import { useMountDelay } from '../hooks/useMountDelay';

function fmt(iso) {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
}

function SavedPizzaCard({ pizza, isExiting, onEdit, onReorder, onDelete }) {
  const price = calcPrice(pizza);

  const rows = [
    pizza.dough      && { cat: 'Teig',    val: LABEL[pizza.dough]    ?? pizza.dough    },
    pizza.sauce      && { cat: 'Sauce',   val: LABEL[pizza.sauce]    ?? pizza.sauce    },
    pizza.cheese     && { cat: 'Käse',    val: LABEL[pizza.cheese]   ?? pizza.cheese   },
    (pizza.meats      ?? []).length > 0 && { cat: 'Fleisch', val: (pizza.meats      ?? []).map(id => LABEL[id] ?? id).join(', ') },
    (pizza.vegetables ?? []).length > 0 && { cat: 'Gemüse',  val: (pizza.vegetables ?? []).map(id => LABEL[id] ?? id).join(', ') },
  ].filter(Boolean);

  return (
    <div className={`cart-pizza-card${isExiting ? ' cart-pizza-card--exit' : ''}`}>
      <div className="cart-layout">

        <div className="cart-preview">
          <PizzaCanvas
            activeCategory=""
            selectedDough={pizza.dough}
            selectedSauce={pizza.sauce}
            selectedCheese={pizza.cheese}
            selectedMeats={pizza.meats ?? []}
            selectedVegetables={pizza.vegetables ?? []}
            size="min(200px, 48vw)"
          />
        </div>

        <div className="cart-details">
          <div className="cart-pizza-name-row">
            <span className="cart-pizza-name">{pizza.name}</span>
          </div>

          {pizza.savedAt && (
            <p className="saved-item-date">Gespeichert {fmt(pizza.savedAt)}</p>
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

      <div className="cart-pizzas-list saved-items-list">
        {[0, 1].map(i => (
          <div key={i} className="cart-pizza-card glass-card" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <div className="sk sk-circle" style={{ width: 160, height: 160, flexShrink: 0 }} />
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
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
          <div className="cart-pizzas-list saved-items-list">
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
