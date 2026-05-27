import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar      from '../components/Navbar';
import Socials     from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import { usePizzaStore } from '../context/PizzaContext';
import { LABEL, calcPrice } from '../utils/pizzaUtils';
import BurgerCartCard from '../features/burger/components/BurgerCartCard';

function EmptyCart({ onBuild }) {
  return (
    <main className="cart-empty">
      <p className="cart-empty-msg">Dein Warenkorb ist leer.</p>
      <button className="btn" onClick={onBuild}>PIZZA BAUEN</button>
    </main>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { pizzas, setQuantity, removePizza, startEditing } = usePizzaStore();

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

  if (pizzas.length === 0) {
    return (
      <div className="cart-page page-enter">
        <Navbar />
        <EmptyCart onBuild={() => navigate('/build-pizza')} />
        <Socials />
      </div>
    );
  }

  // Exclude exiting pizzas from the total so it updates instantly
  const grandTotal = pizzas
    .filter(p => !exitingIds.includes(p.id))
    .reduce((sum, p) => sum + calcPrice(p) * (p.quantity || 1), 0);

  const visibleCount = pizzas.filter(p => !exitingIds.includes(p.id)).length;

  return (
    <div className="cart-page page-enter">
      <Navbar />

      <main className="cart-main">
        <h1 className="heading" style={{ marginBottom: '28px' }}>
          <span className="h-dark">DEINE </span>
          <span className="h-red">{visibleCount > 1 ? 'PIZZEN' : 'PIZZA'}</span>
        </h1>

        <div className="cart-pizzas-list">
          {pizzas.map((pizza, idx) => {
            if (pizza.type === 'burger') {
              return (
                <BurgerCartCard
                  key={pizza.id}
                  burger={pizza}
                  isExiting={exitingIds.includes(pizza.id)}
                  animDelay={idx * 80}
                  onRemove={handleRemove}
                />
              );
            }

            const qty       = pizza.quantity || 1;
            const unitPrice = calcPrice(pizza);
            const subtotal  = unitPrice * qty;
            const exiting   = exitingIds.includes(pizza.id);

            const rows = [
              { cat: 'Teig',    vals: [LABEL[pizza.dough]]                              },
              { cat: 'Sauce',   vals: [LABEL[pizza.sauce]]                              },
              { cat: 'Käse',    vals: [LABEL[pizza.cheese]]                             },
              pizza.meats.length      && { cat: 'Fleisch', vals: pizza.meats.map(id => LABEL[id])      },
              pizza.vegetables.length && { cat: 'Gemüse',  vals: pizza.vegetables.map(id => LABEL[id]) },
            ].filter(Boolean);

            return (
              <div
                key={pizza.id}
                className={`cart-pizza-card${exiting ? ' cart-pizza-card--exit' : ''}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
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
                    <div className="cart-pizza-name-row">
                      <span className="cart-pizza-name">{pizza.name}</span>
                      {visibleCount > 1 && (
                        <span className="cart-pizza-num">#{idx + 1}</span>
                      )}
                    </div>

                    <p className="cart-section-label">Zutaten</p>
                    <div className="cart-ingredients">
                      {rows.map(row => (
                        <div key={row.cat} className="ingredient-row">
                          <span className="ingredient-cat">{row.cat}</span>
                          <span className="ingredient-vals">{row.vals.join(', ')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="cart-divider" />

                    <div className="cart-qty-row">
                      <span className="cart-qty-label">Menge</span>
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty - 1)} aria-label="Weniger">−</button>
                        <span className="qty-val">{qty}</span>
                        <button className="qty-btn" onClick={() => setQuantity(pizza.id, qty + 1)} aria-label="Mehr">+</button>
                      </div>
                    </div>

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

                    <div className="cart-divider" />

                    <div className="cart-card-actions">
                      <button className="cart-edit-btn" onClick={() => handleEdit(pizza)} aria-label="Pizza bearbeiten">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Bearbeiten
                      </button>
                      <button className="cart-delete-btn" onClick={() => handleRemove(pizza.id)} aria-label="Pizza entfernen">
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
          })}
        </div>

        <div className="cart-summary">
          {visibleCount > 1 && (
            <div className="cart-summary-total">
              <span>Gesamtbetrag ({visibleCount} Pizzen)</span>
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

        <button className="cart-back-btn" onClick={() => navigate('/build-pizza')}>
          ← Zurück zum Builder
        </button>
      </main>

      <Socials />
    </div>
  );
}
