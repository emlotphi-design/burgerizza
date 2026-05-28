import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar      from '../components/Navbar';
import Socials     from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import { usePizzaStore } from '../context/PizzaContext';
import { useBurgerStore } from '../features/burger/store/burgerStore.jsx';
import { LABEL, calcPrice } from '../utils/pizzaUtils';
import BurgerCartCard from '../features/burger/components/BurgerCartCard';

// Correct unit price for all item types
function getUnitPrice(item) {
  if (item.type === 'menu') return item.price ?? 0;
  return calcPrice(item);
}

function EmptyCart({ onBuild }) {
  const navigate = useNavigate();
  return (
    <main className="cart-empty">
      <p className="cart-empty-msg">Dein Warenkorb ist leer.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn" onClick={onBuild}>PIZZA BAUEN</button>
        <button className="btn" onClick={() => navigate('/menu')}>MENÜ</button>
      </div>
    </main>
  );
}

function PizzaCartCard({ pizza, idx, visibleCount, isExiting, animDelay, onEdit, onRemove, setQuantity }) {
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const qty       = pizza.quantity || 1;
  const unitPrice = calcPrice(pizza);
  const subtotal  = unitPrice * qty;

  const rows = [
    { cat: 'Teig',    vals: [LABEL[pizza.dough]]                              },
    { cat: 'Sauce',   vals: [LABEL[pizza.sauce]]                              },
    { cat: 'Käse',    vals: [LABEL[pizza.cheese]]                             },
    pizza.meats.length      && { cat: 'Fleisch', vals: pizza.meats.map(id => LABEL[id])      },
    pizza.vegetables.length && { cat: 'Gemüse',  vals: pizza.vegetables.map(id => LABEL[id]) },
  ].filter(Boolean);

  return (
    <div
      className={`cart-pizza-card glass-card${isExiting ? ' cart-pizza-card--exit' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Corner delete — mobile-only, hidden on desktop via CSS */}
      <button
        className="cart-delete-corner"
        onClick={() => onRemove(pizza.id)}
        aria-label="Pizza entfernen"
      >
        <svg width="9" height="9" viewBox="0 0 18 18" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="3" y1="3" x2="15" y2="15" />
          <line x1="15" y1="3" x2="3" y2="15" />
        </svg>
      </button>

      <div className="cart-layout">
        <div className="cart-preview">
          <PizzaCanvas
            activeCategory=""
            selectedDough={pizza.dough}
            selectedSauce={pizza.sauce}
            selectedCheese={pizza.cheese}
            selectedMeats={pizza.meats}
            selectedVegetables={pizza.vegetables}
            size="min(240px, 60vw)"
          />
        </div>

        <div className="cart-details">
          {/* 1 — Name */}
          <div className="cart-pizza-name-row">
            <span className="cart-pizza-name">{pizza.name}</span>
            {visibleCount > 1 && <span className="cart-pizza-num">#{idx + 1}</span>}
          </div>

          {/* 2 — Compact price (mobile-only, hidden on desktop via CSS) */}
          <div className="cart-price-compact">
            <span className="cart-price-compact__total">€{subtotal.toFixed(2)}</span>
            {qty > 1 && <span className="cart-price-compact__unit">€{unitPrice.toFixed(2)} / Stk.</span>}
          </div>

          {/* 3 — Ingredient toggle: accordion header at all breakpoints */}
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

          {/* 4 — Ingredient body: accordion at all breakpoints */}
          <div className={`cart-ing-body${ingredientsOpen ? ' cart-ing-body--open' : ''}`}>
            <div className="cart-ing-body__inner">
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

          {/* Divider after ingredients */}
          <div className="cart-divider cart-divider--ing" />

          {/* 5 — Quantity */}
          <div className="cart-qty-row">
            <span className="cart-qty-label">Menge</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty - 1)} aria-label="Weniger">−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty + 1)} aria-label="Mehr">+</button>
            </div>
          </div>

          {/* 6 — Price block (desktop-only, hidden on mobile) */}
          <div className="cart-price-block">
            <div className="cart-price-row">
              <span>Stückpreis</span>
              <span>€{unitPrice.toFixed(2)}</span>
            </div>
            <div className="cart-price-row cart-price-total">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Divider before actions */}
          <div className="cart-divider cart-divider--actions" />

          {/* 7 — Card actions */}
          <div className="cart-card-actions">
            <button className="cart-edit-btn" onClick={() => onEdit(pizza)} aria-label="Pizza bearbeiten">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Bearbeiten
            </button>
            <button className="cart-delete-btn" onClick={() => onRemove(pizza.id)} aria-label="Pizza entfernen">
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

export default function Cart() {
  const navigate = useNavigate();
  const { pizzas, setQuantity, removePizza, startEditing } = usePizzaStore();
  const { setDraft: setBurgerDraft } = useBurgerStore();

  const [exitingIds, setExitingIds] = useState([]);

  const handleRemove = useCallback((id) => {
    setExitingIds(prev => [...prev, id]);
    setTimeout(() => {
      removePizza(id);
      setExitingIds(prev => prev.filter(x => x !== id));
    }, 400);
  }, [removePizza]);

  const handleEdit = useCallback((pizza) => {
    startEditing(pizza);
    navigate('/build-pizza');
  }, [startEditing, navigate]);

  const handleEditBurger = useCallback((burger) => {
    setBurgerDraft({
      bun:        burger.bun,
      meats:      burger.meats   ?? {},
      cheeses:    burger.cheeses ?? (burger.cheese ? { [burger.cheese]: 1 } : {}),
      sauces:     burger.sauces  ?? [],
      vegetables: burger.vegetables ?? [],
      name:       burger.name,
      editingId:  burger.id,
    });
    removePizza(burger.id);
    navigate('/build-burger');
  }, [setBurgerDraft, removePizza, navigate]);

  if (pizzas.length === 0) {
    return (
      <div className="cart-page page-enter">
        <Navbar />
        <EmptyCart onBuild={() => navigate('/build-pizza')} />
        <Socials />
      </div>
    );
  }

  const hasMenuItems = pizzas.some(p => p.type === 'menu');
  const visibleItems = pizzas.filter(p => !exitingIds.includes(p.id));
  const visibleCount = visibleItems.length;

  const grandTotal = visibleItems.reduce(
    (sum, p) => sum + getUnitPrice(p) * (p.quantity || 1),
    0
  );

  // Cart heading adapts to item types
  const cartLabel = hasMenuItems ? 'WARENKORB' : (visibleCount > 1 ? 'PIZZEN' : 'PIZZA');
  const cartPrefix = hasMenuItems ? 'DEIN' : 'DEINE';
  const itemWord = hasMenuItems ? 'Artikel' : 'Pizzen';
  const backLabel = hasMenuItems ? '← Zurück zum Menü' : '← Zurück zum Builder';
  const backPath  = hasMenuItems ? '/menu' : '/build-pizza';

  return (
    <div className="cart-page page-enter">
      <Navbar />

      <main className="cart-main">
        <h1 className="heading" style={{ marginBottom: '28px' }}>
          <span className="h-dark">{cartPrefix} </span>
          <span className="h-red">{cartLabel}</span>
        </h1>

        <div className="cart-pizzas-list">
          {pizzas.map((pizza, idx) => {

            // ── Burger card ─────────────────────────────
            if (pizza.type === 'burger') {
              return (
                <BurgerCartCard
                  key={pizza.id}
                  burger={pizza}
                  isExiting={exitingIds.includes(pizza.id)}
                  animDelay={idx * 80}
                  onRemove={handleRemove}
                  onEdit={handleEditBurger}
                  idx={idx}
                  visibleCount={visibleCount}
                />
              );
            }

            // ── Menu item card ───────────────────────────
            if (pizza.type === 'menu') {
              const qty      = pizza.quantity || 1;
              const unitPrice = pizza.price ?? 0;
              const subtotal  = unitPrice * qty;
              const exiting   = exitingIds.includes(pizza.id);

              return (
                <div
                  key={pizza.id}
                  className={`cart-pizza-card${exiting ? ' cart-pizza-card--exit' : ''}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {/* Corner delete — mobile-only, hidden on desktop via CSS */}
                  <button
                    className="cart-delete-corner"
                    onClick={() => handleRemove(pizza.id)}
                    aria-label="Artikel entfernen"
                  >
                    <svg width="9" height="9" viewBox="0 0 18 18" fill="none"
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="3" y1="3" x2="15" y2="15" />
                      <line x1="15" y1="3" x2="3" y2="15" />
                    </svg>
                  </button>

                  <div className="cart-layout">

                    <div className="cart-preview menu-item-emoji-area">
                      <span className="menu-item-cart-emoji" aria-hidden="true">
                        {pizza.emoji}
                      </span>
                    </div>

                    <div className="cart-details">
                      {/* 1 — Name */}
                      <div className="cart-pizza-name-row">
                        <span className="cart-pizza-name">{pizza.name}</span>
                      </div>

                      {/* 2 — Compact price (mobile-only) */}
                      <div className="cart-price-compact">
                        <span className="cart-price-compact__total">€{subtotal.toFixed(2)}</span>
                        {qty > 1 && <span className="cart-price-compact__unit">€{unitPrice.toFixed(2)} / Stk.</span>}
                      </div>

                      {pizza.description && (
                        <p className="menu-item-cart-desc">{pizza.description}</p>
                      )}

                      {/* Divider after description (desktop-only, hidden on mobile) */}
                      <div className="cart-divider cart-divider--desc" />

                      {/* 3 — Quantity */}
                      <div className="cart-qty-row">
                        <span className="cart-qty-label">Menge</span>
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty - 1)} aria-label="Weniger">−</button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty + 1)} aria-label="Mehr">+</button>
                        </div>
                      </div>

                      {/* 4 — Price block (desktop-only, hidden on mobile) */}
                      <div className="cart-price-block">
                        <div className="cart-price-row">
                          <span>Stückpreis</span>
                          <span>€{unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="cart-price-row cart-price-total">
                          <span>Subtotal</span>
                          <span>€{subtotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Divider before actions */}
                      <div className="cart-divider cart-divider--actions" />

                      {/* 5 — Card actions (desktop delete; corner button handles mobile) */}
                      <div className="cart-card-actions">
                        <button
                          className="cart-delete-btn"
                          onClick={() => handleRemove(pizza.id)}
                          aria-label="Artikel entfernen"
                        >
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

            // ── Pizza card ───────────────────────────────
            return (
              <PizzaCartCard
                key={pizza.id}
                pizza={pizza}
                idx={idx}
                visibleCount={visibleCount}
                isExiting={exitingIds.includes(pizza.id)}
                animDelay={idx * 80}
                onEdit={handleEdit}
                onRemove={handleRemove}
                setQuantity={setQuantity}
              />
            );
          })}
        </div>

        <div className="cart-summary">
          {visibleCount > 1 && (
            <div className="cart-summary-total">
              <span>Gesamtbetrag ({visibleCount} {itemWord})</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
          )}
          <button className="btn-checkout-premium" onClick={() => navigate('/checkout')}>
            <span className="btn-checkout-shine" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Zur Kasse · €{grandTotal.toFixed(2)}
          </button>
        </div>

        <button className="cart-back-btn" onClick={() => navigate(backPath)}>
          {backLabel}
        </button>
      </main>

      <Socials />
    </div>
  );
}
