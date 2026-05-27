import '../styles/burger-sidebar.css';
import bunIcon        from '../../../assets/icons/burger/bun-icon.png';
import sauceIcon      from '../../../assets/icons/burger/sauce-icon.png';
import meatIcon       from '../../../assets/icons/burger/meat-icon.png';
import cheeseIcon     from '../../../assets/icons/burger/cheese-icon.png';
import vegetablesIcon from '../../../assets/icons/burger/vegetables-icon.png';

const SIDEBAR_ITEMS = [
  { id: 'bun',        label: 'BUN',        icon: bunIcon        },
  { id: 'sauce',      label: 'SAUCE',      icon: sauceIcon      },
  { id: 'meat',       label: 'MEAT',       icon: meatIcon       },
  { id: 'cheese',     label: 'CHEESE',     icon: cheeseIcon     },
  { id: 'vegetables', label: 'VEGETABLES', icon: vegetablesIcon },
];

export default function BurgerSidebar({ activeItem, onSelect, bunSelected }) {
  return (
    <nav className="bs-rail" aria-label="Burger categories">
      {SIDEBAR_ITEMS.map(item => {
        const locked = !bunSelected && item.id !== 'bun';
        return (
          <button
            key={item.id}
            className={[
              'bs-item',
              activeItem === item.id ? 'bs-item--active' : '',
              locked ? 'bs-item--locked' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => { if (!locked) onSelect(item.id); }}
            aria-label={item.label}
            aria-pressed={activeItem === item.id}
            aria-disabled={locked}
          >
            <div className="bs-item__icon">
              <img src={item.icon} alt="" className="bs-item__icon-img" />
            </div>
            <span className="bs-item__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
