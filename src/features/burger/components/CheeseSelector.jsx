import { BURGER_CHEESES } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

const MAX_QTY = 5;

export default function CheeseSelector() {
  const { draft, setDraft } = useBurgerStore();
  const cheeses = draft.cheeses ?? {};

  const toggle = (id) => {
    setDraft(prev => {
      const next = { ...prev.cheeses };
      if (next[id]) { delete next[id]; } else { next[id] = 1; }
      return { cheeses: next };
    });
  };

  const increment = (id) => {
    setDraft(prev => {
      const current = (prev.cheeses ?? {})[id] ?? 0;
      if (current >= MAX_QTY) return prev;
      return { cheeses: { ...prev.cheeses, [id]: current + 1 } };
    });
  };

  const decrement = (id) => {
    setDraft(prev => {
      const next = { ...prev.cheeses };
      if ((next[id] ?? 0) <= 1) { delete next[id]; } else { next[id] -= 1; }
      return { cheeses: next };
    });
  };

  return (
    <div className="bb-grid">
      {BURGER_CHEESES.map(cheese => {
        const qty = cheeses[cheese.id] ?? 0;
        const isSelected = qty > 0;
        return (
          <button
            key={cheese.id}
            className={`bb-card${isSelected ? ' bb-card--selected' : ''}`}
            onClick={() => toggle(cheese.id)}
          >
            <div className="bb-card__dot" style={{ background: cheese.color }} />
            <span className="bb-card__name">{cheese.name}</span>
            {isSelected && cheese.hasQty && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button className="bb-qty-btn" onClick={() => decrement(cheese.id)}>−</button>
                <span className="bb-qty-count" style={{ color: '#1A0A00' }}>{qty}</span>
                <button className="bb-qty-btn" onClick={() => increment(cheese.id)} disabled={qty >= MAX_QTY}>+</button>
              </div>
            )}
            <span className="bb-card__price">€{(cheese.price * (qty || 1)).toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
}
