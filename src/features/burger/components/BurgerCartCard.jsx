import { useState } from 'react';
import { usePizzaStore } from '../../../context/PizzaContext';
import { calcBurgerPrice, BURGER_LABEL } from '../utils/burgerUtils';

export default function BurgerCartCard({ burger, isExiting, animDelay, onRemove, onEdit, idx, visibleCount }) {
  const { setQuantity } = usePizzaStore();
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const qty       = burger.quantity || 1;
  const unitPrice = calcBurgerPrice(burger);
  const subtotal  = unitPrice * qty;

  const meatEntries = (() => {
    const m = burger.meats;
    if (!m) return [];
    if (Array.isArray(m)) return m.map(id => ({ id, qty: 1 }));
    return Object.entries(m).map(([id, qty]) => ({ id, qty }));
  })();

  const cheeseEntries = (() => {
    const c = burger.cheeses;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      return Object.entries(c).map(([id, qty]) => ({ id, qty }));
    }
    if (burger.cheese) return [{ id: burger.cheese, qty: 1 }];
    return [];
  })();

  const rows = [
    burger.bun             && { cat: 'Brötchen', vals: [BURGER_LABEL[burger.bun] ?? burger.bun] },
    meatEntries.length > 0 && {
      cat: 'Fleisch',
      vals: meatEntries.map(({ id, qty }) =>
        qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)
      ),
    },
    cheeseEntries.length > 0 && {
      cat: 'Käse',
      vals: cheeseEntries.map(({ id, qty }) =>
        qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)
      ),
    },
    burger.sauces?.length > 0     && { cat: 'Sauce',  vals: burger.sauces.map(id => BURGER_LABEL[id] ?? id) },
    burger.vegetables?.length > 0 && { cat: 'Gemüse', vals: burger.vegetables.map(id => BURGER_LABEL[id] ?? id) },
  ].filter(Boolean);

  return (
    <div
      className={`cart-pizza-card${isExiting ? ' cart-pizza-card--exit' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Corner delete — mobile-only, hidden on desktop via CSS */}
      <button
        className="cart-delete-corner"
        onClick={() => onRemove(burger.id)}
        aria-label="Burger entfernen"
      >
        <svg width="9" height="9" viewBox="0 0 18 18" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="3" y1="3" x2="15" y2="15" />
          <line x1="15" y1="3" x2="3" y2="15" />
        </svg>
      </button>

      <div className="cart-layout">
        <div className="cart-preview">
          {burger.image && (
            <img
              className="cart-burger-img"
              src={burger.image}
              alt={burger.name}
              style={{
                width: 'min(240px, 60vw)',
                height: 'min(240px, 60vw)',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
              }}
            />
          )}
        </div>

        <div className="cart-details">
          {/* 1 — Name */}
          <div className="cart-pizza-name-row">
            <span className="cart-pizza-name">{burger.name}</span>
            {visibleCount > 1 && idx != null && (
              <span className="cart-pizza-num">#{idx + 1}</span>
            )}
          </div>

          {/* 2 — Compact price (mobile-only, hidden on desktop via CSS) */}
          <div className="cart-price-compact">
            <span className="cart-price-compact__total">€{subtotal.toFixed(2)}</span>
            {qty > 1 && <span className="cart-price-compact__unit">€{unitPrice.toFixed(2)} / Stk.</span>}
          </div>

          {/* 3 — Ingredient body: normal flow on desktop, accordion on mobile */}
          <div className={`cart-ing-body${ingredientsOpen ? ' cart-ing-body--open' : ''}`}>
            <div className="cart-ing-body__inner">
              <p className="cart-section-label">Zutaten</p>
              <div className="cart-ingredients">
                {rows.map(row => (
                  <div key={row.cat} className="ingredient-row">
                    <span className="ingredient-cat">{row.cat}</span>
                    <span className="ingredient-vals">{row.vals.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider after ingredients (desktop-only, hidden on mobile) */}
          <div className="cart-divider cart-divider--ing" />

          {/* 4 — Quantity */}
          <div className="cart-qty-row">
            <span className="cart-qty-label">Menge</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQuantity(burger.id, qty - 1)} aria-label="Weniger">−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQuantity(burger.id, qty + 1)} aria-label="Mehr">+</button>
            </div>
          </div>

          {/* 5 — Price block (desktop-only, hidden on mobile via CSS) */}
          <div className="cart-price-block" style={{ marginTop: '14px' }}>
            <div className="cart-price-row">
              <span>Stückpreis</span>
              <span>€{unitPrice.toFixed(2)}</span>
            </div>
            <div className="cart-price-row cart-price-total">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* 6 — Ingredient toggle (mobile-only, hidden on desktop via CSS) */}
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

          {/* Divider before actions */}
          <div className="cart-divider cart-divider--actions" />

          {/* 7 — Card actions */}
          <div className="cart-card-actions">
            {onEdit && (
              <button className="cart-edit-btn" onClick={() => onEdit(burger)} aria-label="Burger bearbeiten">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Bearbeiten
              </button>
            )}
            <button className="cart-delete-btn" onClick={() => onRemove(burger.id)} aria-label="Burger entfernen">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Entfernen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
