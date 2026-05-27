import { BURGER_MEATS } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

const MAX_QTY = 5;

export default function MeatSelector() {
  const { draft, setDraft } = useBurgerStore();
  const meats = draft.meats ?? {};

  const toggle = (id) => {
    setDraft(prev => {
      const next = { ...prev.meats };
      if (next[id]) { delete next[id]; } else { next[id] = 1; }
      return { meats: next };
    });
  };

  const increment = (id) => {
    setDraft(prev => {
      const current = prev.meats[id] ?? 0;
      if (current >= MAX_QTY) return prev;
      return { meats: { ...prev.meats, [id]: current + 1 } };
    });
  };

  const decrement = (id) => {
    setDraft(prev => {
      const next = { ...prev.meats };
      if ((next[id] ?? 0) <= 1) { delete next[id]; } else { next[id] -= 1; }
      return { meats: next };
    });
  };

  return (
    <div className="bb-grid">
      {BURGER_MEATS.map(meat => {
        const qty = meats[meat.id] ?? 0;
        const isSelected = qty > 0;
        return (
          <button
            key={meat.id}
            className={`bb-card${isSelected ? ' bb-card--selected' : ''}`}
            onClick={() => toggle(meat.id)}
          >
            <div className="bb-card__dot" style={{ background: meat.color }} />
            <span className="bb-card__name">{meat.name}</span>
            {isSelected && meat.hasQty && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button className="bb-qty-btn" onClick={() => decrement(meat.id)}>−</button>
                <span className="bb-qty-count" style={{ color: '#1A0A00' }}>{qty}</span>
                <button className="bb-qty-btn" onClick={() => increment(meat.id)} disabled={qty >= MAX_QTY}>+</button>
              </div>
            )}
            <span className="bb-card__price">€{(meat.price * (qty || 1)).toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
}
