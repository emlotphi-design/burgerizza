import doughIcon      from '../assets/icons/dough-icon.png';
import sauceIcon      from '../assets/icons/sauce-icon.png';
import cheeseIcon     from '../assets/icons/cheese-icon.png';
import meatIcon       from '../assets/icons/meat-icon.png';
import vegetablesIcon from '../assets/icons/vegetables-icon.png';

const CATEGORIES = [
  { id: 'dough',      label: 'Dough',   icon: doughIcon      },
  { id: 'sauces',     label: 'Sauce',   icon: sauceIcon      },
  { id: 'cheese',     label: 'Cheese',  icon: cheeseIcon     },
  { id: 'meat',       label: 'Meat',    icon: meatIcon       },
  { id: 'vegetables', label: 'Veggies', icon: vegetablesIcon },
];

export default function CategoryToolbar({
  activeCategory,
  onCategoryChange,
  unlocked  = {},
  completed = {},
  lockMsg   = '',
}) {
  return (
    <div className="category-toolbar">

      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat.id;
        const isLocked = !unlocked[cat.id];
        const isDone   = completed[cat.id];

        const cls = [
          'cat-btn',
          isActive ? 'cat-btn--active' : '',
          isLocked ? 'cat-btn--locked' : '',
          isDone   ? 'cat-btn--done'   : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={cat.id}
            className={cls}
            onClick={() => onCategoryChange(cat.id)}
            aria-label={cat.label}
            aria-disabled={isLocked}
            tabIndex={isLocked ? -1 : 0}
          >
            <span className="cat-icon">
              <img src={cat.icon} alt={cat.label} className="cat-icon-img" />
            </span>
            {isDone && <span className="cat-check">✓</span>}
          </button>
        );
      })}

      {/* Lock message — slides in to the right of the toolbar */}
      <div className={`lock-msg${lockMsg ? ' lock-msg--visible' : ''}`}>
        {lockMsg || 'Please select a dough first'}
      </div>

    </div>
  );
}
