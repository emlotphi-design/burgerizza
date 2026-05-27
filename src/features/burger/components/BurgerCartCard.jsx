import { usePizzaStore } from '../../../context/PizzaContext';
import { calcBurgerPrice, BURGER_LABEL } from '../utils/burgerUtils';

export default function BurgerCartCard({ burger, isExiting, animDelay, onRemove }) {
  const { setQuantity } = usePizzaStore();
  const qty       = burger.quantity || 1;
  const unitPrice = calcBurgerPrice(burger);
  const subtotal  = unitPrice * qty;

  // Handle both legacy array and current object-map formats for meats
  const meatEntries = (() => {
    const m = burger.meats;
    if (!m) return [];
    if (Array.isArray(m)) return m.map(id => ({ id, qty: 1 }));
    return Object.entries(m).map(([id, qty]) => ({ id, qty }));
  })();

  const rows = [
    burger.bun                    && { cat: 'Bun',        vals: [BURGER_LABEL[burger.bun]   ?? burger.bun]   },
    burger.topBun                 && { cat: 'Top Bun',    vals: [BURGER_LABEL[burger.topBun] ?? burger.topBun] },
    meatEntries.length > 0        && {
      cat: 'Meat',
      vals: meatEntries.map(({ id, qty }) =>
        qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)
      ),
    },
    burger.cheese                 && { cat: 'Cheese',     vals: [BURGER_LABEL[burger.cheese] ?? burger.cheese] },
    burger.sauces?.length > 0     && { cat: 'Sauce',      vals: burger.sauces.map(id => BURGER_LABEL[id] ?? id) },
    burger.vegetables?.length > 0 && { cat: 'Vegetables', vals: burger.vegetables.map(id => BURGER_LABEL[id] ?? id) },
  ].filter(Boolean);

  return (
    <div
      className={`bcc-card${isExiting ? ' bcc-card--exit' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="bcc-header">
        <span className="bcc-name">{burger.name}</span>
        <span className="bcc-tag">Burger</span>
      </div>

      <div className="bcc-ingredients">
        {rows.map(row => (
          <div key={row.cat} className="bcc-row">
            <span className="bcc-row__cat">{row.cat}</span>
            <span className="bcc-row__vals">{row.vals.join(', ')}</span>
          </div>
        ))}
      </div>

      <div className="bcc-divider" />

      <div className="cart-qty-row">
        <span className="cart-qty-label">Menge</span>
        <div className="qty-ctrl">
          <button className="qty-btn" onClick={() => setQuantity(burger.id, qty - 1)} aria-label="Weniger">−</button>
          <span className="qty-val">{qty}</span>
          <button className="qty-btn" onClick={() => setQuantity(burger.id, qty + 1)} aria-label="Mehr">+</button>
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

      <div className="bcc-divider" />

      <div className="cart-card-actions">
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
  );
}
