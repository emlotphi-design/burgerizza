import { calcBurgerPrice, BURGER_LABEL } from '../utils/burgerUtils';

export default function BurgerPreviewCard({ burger, isExiting, onEdit, onRemove }) {
  const price = calcBurgerPrice(burger);

  const meatEntries = (() => {
    const m = burger.meats;
    if (!m) return [];
    if (Array.isArray(m)) return m.map(id => ({ id, qty: 1 }));
    return Object.entries(m).map(([id, qty]) => ({ id, qty }));
  })();

  const parts = [
    burger.bun    && (BURGER_LABEL[burger.bun]    ?? burger.bun),
    ...meatEntries.map(({ id, qty }) =>
      qty > 1 ? `${BURGER_LABEL[id] ?? id} ×${qty}` : (BURGER_LABEL[id] ?? id)
    ),
    burger.cheese && (BURGER_LABEL[burger.cheese] ?? burger.cheese),
    ...(burger.sauces     ?? []).map(id => BURGER_LABEL[id] ?? id),
    ...(burger.vegetables ?? []).map(id => BURGER_LABEL[id] ?? id),
  ].filter(Boolean);

  return (
    <div className={`bpc-card${isExiting ? ' bpc-card--exit' : ''}`}>
      <div className="bpc-header">
        <span className="bpc-name">{burger.name}</span>
        <span className="bpc-price">€{price.toFixed(2)}</span>
      </div>

      {burger.image && (
        <div className="bpc-thumb-wrap">
          <img className="bpc-thumb" src={burger.image} alt={burger.name} />
        </div>
      )}

      <p className="bpc-summary">
        {parts.slice(0, 3).join(' · ')}
        {parts.length > 3 && <span className="bpc-more"> +{parts.length - 3}</span>}
      </p>

      <div className="bpc-actions">
        <button className="bpc-edit-btn" onClick={() => onEdit(burger)} aria-label="Edit burger">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button className="bpc-remove-btn" onClick={() => onRemove(burger.id)} aria-label="Remove burger">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}
