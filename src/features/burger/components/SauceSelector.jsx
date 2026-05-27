import { BURGER_SAUCES } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

const MAX_SAUCES = 3;

export default function SauceSelector() {
  const { draft, setDraft } = useBurgerStore();
  const selected = draft.sauces ?? [];

  const toggle = (id) => {
    if (selected.includes(id)) {
      setDraft({ sauces: selected.filter(s => s !== id) });
    } else if (selected.length < MAX_SAUCES) {
      setDraft({ sauces: [...selected, id] });
    }
  };

  return (
    <>
      <p className="bb-limit-note">Up to {MAX_SAUCES} — {selected.length}/{MAX_SAUCES} selected</p>
      <div className="bb-grid">
        {BURGER_SAUCES.map(sauce => {
          const isSelected = selected.includes(sauce.id);
          const isDisabled = !isSelected && selected.length >= MAX_SAUCES;
          return (
            <button
              key={sauce.id}
              className={`bb-card${isSelected ? ' bb-card--selected' : ''}${isDisabled ? ' bb-card--disabled' : ''}`}
              onClick={() => toggle(sauce.id)}
              disabled={isDisabled}
            >
              <div className="bb-card__dot" style={{ background: sauce.color }} />
              <span className="bb-card__name">{sauce.name}</span>
              <span className="bb-card__price">€{sauce.price.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
