import { useEffect, useRef } from 'react';
import { usePizzaIngredients } from '../../../components/PizzaCanvas';
import { useIngredientConfig } from '../../../context/IngredientConfigContext';

/**
 * Bain-marie counter — replaces the category toolbar and the ring of
 * ingredient previews around the plate. Shows the current step's
 * ingredients in small steel pans; arrows / dots move between steps.
 */

const STEPS = [
  { id: 'dough',      label: 'Teig',    multi: false },
  { id: 'sauces',     label: 'Sauce',   multi: false },
  { id: 'cheese',     label: 'Käse',    multi: false },
  { id: 'meat',       label: 'Fleisch', multi: true, max: 4 },
  { id: 'vegetables', label: 'Gemüse',  multi: true, max: 6 },
];

export default function BainMarieCounter({
  activeCategory,
  onCategoryChange,
  unlocked = {},
  completed = {},
  lockMsg = '',
  selectedDough, selectedSauce, selectedCheese,
  selectedMeats = [], selectedVegetables = [],
  onDoughSelect, onSauceSelect, onCheeseSelect,
  onMeatToggle, onVegetableToggle,
}) {
  const { isEnabled } = useIngredientConfig();
  const lists = usePizzaIngredients();
  const advanceTimer = useRef(null);
  const rowRef = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  useEffect(() => { rowRef.current?.scrollTo({ left: 0 }); }, [activeCategory]);

  const stepIdx = Math.max(0, STEPS.findIndex(s => s.id === activeCategory));
  const step = STEPS[stepIdx];

  const config = {
    dough:      { items: lists.mergedDoughs,     selected: [selectedDough],  pick: onDoughSelect },
    sauces:     { items: lists.mergedSauces,     selected: [selectedSauce],  pick: onSauceSelect },
    cheese:     { items: lists.mergedCheeses,    selected: [selectedCheese], pick: onCheeseSelect },
    meat:       { items: lists.mergedMeats,      selected: selectedMeats,    pick: onMeatToggle },
    vegetables: { items: lists.mergedVegetables, selected: selectedVegetables, pick: onVegetableToggle },
  }[step.id];

  const atLimit = step.multi && config.selected.length >= step.max;

  function handlePick(id) {
    config.pick(id);
    // Single-choice steps move on to the next step by themselves.
    if (!step.multi && stepIdx < STEPS.length - 1) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => onCategoryChange(STEPS[stepIdx + 1].id), 380);
    }
  }

  const prev = STEPS[stepIdx - 1];
  const next = STEPS[stepIdx + 1];

  return (
    <section className="bm-counter" aria-label="Zutaten">
      <div className="bm-head">
        <button
          type="button"
          className="bm-arrow"
          onClick={() => prev && onCategoryChange(prev.id)}
          disabled={!prev}
          aria-label={prev ? `Zurück: ${prev.label}` : 'Zurück'}
        >‹</button>

        <div className="bm-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={[
                'bm-step',
                i === stepIdx ? 'bm-step--active' : '',
                completed[s.id] ? 'bm-step--done' : '',
                !unlocked[s.id] ? 'bm-step--locked' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onCategoryChange(s.id)}
              aria-current={i === stepIdx ? 'step' : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="bm-arrow"
          onClick={() => next && onCategoryChange(next.id)}
          disabled={!next}
          aria-label={next ? `Weiter: ${next.label}` : 'Weiter'}
        >›</button>
      </div>

      <div className={`bm-msg${lockMsg || atLimit ? ' bm-msg--visible' : ''}`} role="status">
        {lockMsg || (atLimit ? `Maximal ${step.max} × ${step.label}` : '')}
      </div>

      <div className="bm-row" ref={rowRef} key={step.id}>
        {config.items.map((item, i) => {
          const isSelected = config.selected.includes(item.id);
          const adminDisabled = !isEnabled('pizza', item.id);
          const disabled = adminDisabled || (atLimit && !isSelected);
          return (
            <button
              key={item.id}
              type="button"
              className={[
                'bm-item',
                isSelected ? 'bm-item--selected' : '',
                disabled ? 'bm-item--disabled' : '',
              ].filter(Boolean).join(' ')}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => !disabled && handlePick(item.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span className="bm-pan">
                <span className="bm-well">
                  <img src={item.preview} alt="" draggable={false} decoding="async" />
                </span>
                {isSelected && <span className="bm-check" aria-hidden="true">✓</span>}
              </span>
              <span className="bm-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
