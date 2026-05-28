import { BURGER_VEGETABLES } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

const MAX_VEGETABLES = 6;

export default function VegetableSelector() {
  const { draft, setDraft } = useBurgerStore();
  const selected = draft.vegetables ?? [];

  const toggle = (id) => {
    if (selected.includes(id)) {
      setDraft({ vegetables: selected.filter(v => v !== id) });
    } else if (selected.length < MAX_VEGETABLES) {
      setDraft({ vegetables: [...selected, id] });
    }
  };

  return (
    <>
      <p className="bb-limit-note">Up to {MAX_VEGETABLES} — {selected.length}/{MAX_VEGETABLES} selected</p>
      <div className="bb-grid">
        {BURGER_VEGETABLES.map(veg => {
          const isSelected = selected.includes(veg.id);
          const isDisabled = !isSelected && selected.length >= MAX_VEGETABLES;
          return (
            <button
              key={veg.id}
              className={`bb-card ing-card${isSelected ? ' bb-card--selected' : ''}${isDisabled ? ' bb-card--disabled' : ''}`}
              onClick={() => toggle(veg.id)}
              disabled={isDisabled}
            >
              <div className="bb-card__dot" style={{ background: veg.color }} />
              <span className="bb-card__name">{veg.name}</span>
              <span className="bb-card__price">€{veg.price.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
