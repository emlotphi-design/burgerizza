import { BURGER_CHEESES } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

export default function CheeseSelector() {
  const { draft, setDraft } = useBurgerStore();

  const toggle = (id) => {
    setDraft({ cheese: draft.cheese === id ? null : id });
  };

  return (
    <>
      <p className="bb-limit-note">Optional — select one or none</p>
      <div className="bb-grid">
        {BURGER_CHEESES.map(cheese => (
          <button
            key={cheese.id}
            className={`bb-card${draft.cheese === cheese.id ? ' bb-card--selected' : ''}`}
            onClick={() => toggle(cheese.id)}
          >
            <div className="bb-card__dot" style={{ background: cheese.color }} />
            <span className="bb-card__name">{cheese.name}</span>
            <span className="bb-card__price">€{cheese.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
