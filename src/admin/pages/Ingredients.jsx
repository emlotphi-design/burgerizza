import { useState, useEffect, useRef, useCallback } from 'react';
import { useIngredientConfig } from '../../context/IngredientConfigContext';
import { PIZZA_DOUGHS } from '../../utils/pizzaDoughs';
import { PIZZA_INGREDIENTS } from '../../utils/pizzaIngredients';
import { ALL_BURGER_INGREDIENTS } from '../../features/burger/utils/burgerData';
import { PIZZA_PREVIEW_IMAGES, BURGER_PREVIEW_IMAGES } from '../utils/ingredientImages';
import '../styles/ingredients.css';

/* ── Category metadata ────────────────────────────────────────────────────── */
const CAT = {
  dough:     { emoji: '🌾', label: 'Dough',     color: 'amber'  },
  sauce:     { emoji: '🍅', label: 'Sauce',      color: 'red'    },
  cheese:    { emoji: '🧀', label: 'Cheese',     color: 'yellow' },
  meat:      { emoji: '🥩', label: 'Meat',       color: 'orange' },
  vegetable: { emoji: '🥬', label: 'Vegetable',  color: 'green'  },
  bun:       { emoji: '🍔', label: 'Bun',        color: 'brown'  },
};

const PIZZA_CAT_ORDER  = ['dough', 'sauce', 'cheese', 'meat', 'vegetable'];
const BURGER_CAT_ORDER = ['bun', 'meat', 'cheese', 'sauce', 'vegetable'];

/* ── Normalise pizza data — use real dough prices from PIZZA_DOUGHS ─────── */
const PIZZA_ADMIN_LIST = [
  ...PIZZA_DOUGHS.map(d => ({
    id: d.id, name: d.name, category: 'dough',
    price: d.price, isVegan: false, isSpicy: false, tags: [],
  })),
  ...PIZZA_INGREDIENTS.filter(i => i.category !== 'dough'),
];

function groupByCategory(list) {
  return list.reduce((acc, ing) => {
    (acc[ing.category] ??= []).push(ing);
    return acc;
  }, {});
}

/* ── Summary stats ──────────────────────────────────────────────────────────── */
function useSummaryStats(builder, list) {
  const { isEnabled } = useIngredientConfig();
  const total    = list.length;
  const disabled = list.filter(i => !isEnabled(builder, i.id)).length;
  const enabled  = total - disabled;
  return { total, enabled, disabled };
}

/* ── Toggle component ───────────────────────────────────────────────────────── */
function IngToggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`ing-toggle${on ? ' ing-toggle--on' : ''}`}
      onClick={onChange}
    >
      <span className="ing-toggle-thumb" />
    </button>
  );
}

/* ── Ingredient card ─────────────────────────────────────────────────────────── */
function IngredientCard({ builder, ingredient, previewImg }) {
  const { isEnabled, getPrice, updateIngredient } = useIngredientConfig();

  const enabled = isEnabled(builder, ingredient.id);
  const price   = getPrice(builder, ingredient.id);

  const [localPrice, setLocalPrice] = useState(() => price.toFixed(2));
  const [focused,    setFocused]    = useState(false);
  const timerRef = useRef(null);

  // Keep display in sync with remote updates when not actively editing
  useEffect(() => {
    if (!focused) setLocalPrice(price.toFixed(2));
  }, [price, focused]);

  const handlePriceChange = e => {
    setLocalPrice(e.target.value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num) && num >= 0) {
        updateIngredient(builder, ingredient.id, { price: parseFloat(num.toFixed(2)) });
      }
    }, 600);
  };

  const handlePriceBlur = () => {
    setFocused(false);
    const num = parseFloat(localPrice);
    if (isNaN(num) || num < 0) setLocalPrice(price.toFixed(2));
  };

  const handleToggle = useCallback(
    () => updateIngredient(builder, ingredient.id, { enabled: !enabled }),
    [builder, ingredient.id, enabled, updateIngredient],
  );

  const hasAsset = Boolean(previewImg);

  return (
    <div className={`ing-card${!enabled ? ' ing-card--off' : ''}`}>

      {/* Image */}
      <div className="ing-card-img-wrap">
        {hasAsset ? (
          <img src={previewImg} alt={ingredient.name} className="ing-card-img" />
        ) : (
          <div className="ing-card-placeholder">
            <span>{CAT[ingredient.category]?.emoji ?? '?'}</span>
          </div>
        )}
        <span className={`ing-asset-dot${hasAsset ? ' ing-asset-dot--yes' : ''}`}>
          {hasAsset ? 'Visual' : 'No Asset'}
        </span>
      </div>

      {/* Body */}
      <div className="ing-card-body">
        <div className="ing-card-name">{ingredient.name}</div>

        <div className="ing-card-meta">
          <span className={`ing-cat-pill ing-cat-pill--${ingredient.category}`}>
            {CAT[ingredient.category]?.emoji} {CAT[ingredient.category]?.label}
          </span>
          <div className="ing-tag-row">
            {ingredient.isSpicy && <span className="ing-tag ing-tag--spicy">🌶</span>}
            {ingredient.isVegan && <span className="ing-tag ing-tag--vegan">🌿</span>}
          </div>
        </div>

        {/* Price */}
        <div className="ing-price-row">
          <span className="ing-price-sym">€</span>
          <input
            type="number"
            min="0"
            max="99.99"
            step="0.10"
            value={localPrice}
            onChange={handlePriceChange}
            onFocus={() => setFocused(true)}
            onBlur={handlePriceBlur}
            className="ing-price-input"
            aria-label={`Price for ${ingredient.name}`}
          />
        </div>

        {/* Availability toggle */}
        <div className="ing-avail-row">
          <span className={`ing-avail-label${!enabled ? ' ing-avail-label--off' : ''}`}>
            {enabled ? 'Available' : 'Disabled'}
          </span>
          <IngToggle
            on={enabled}
            onChange={handleToggle}
            label={`Toggle availability for ${ingredient.name}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Category section ────────────────────────────────────────────────────────── */
function CategorySection({ builder, category, ingredients, previewImages }) {
  const { isEnabled } = useIngredientConfig();
  const meta    = CAT[category];
  const enabled = ingredients.filter(i => isEnabled(builder, i.id)).length;

  return (
    <section className="ing-section">
      <div className="ing-section-header">
        <span className="ing-section-emoji">{meta.emoji}</span>
        <h3 className="ing-section-title">{meta.label}</h3>
        <div className="ing-section-stats">
          <span className="ing-section-count">{ingredients.length} total</span>
          <span className="ing-section-enabled">{enabled} on</span>
        </div>
      </div>

      <div className="ing-grid">
        {ingredients.map(ing => (
          <IngredientCard
            key={ing.id}
            builder={builder}
            ingredient={ing}
            previewImg={previewImages[ing.id]}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Stats bar ───────────────────────────────────────────────────────────────── */
function StatsBar({ builder, list }) {
  const { total, enabled, disabled } = useSummaryStats(builder, list);
  const visual = list.filter(i =>
    (builder === 'pizza' ? PIZZA_PREVIEW_IMAGES : BURGER_PREVIEW_IMAGES)[i.id],
  ).length;

  return (
    <div className="ing-statsbar">
      <div className="ing-stat">
        <div className="ing-stat-icon-wrap">📦</div>
        <div className="ing-stat-body">
          <span className="ing-stat-value">{total}</span>
          <span className="ing-stat-label">Total</span>
        </div>
      </div>
      <div className="ing-stat">
        <div className="ing-stat-icon-wrap ing-stat-icon-wrap--on">✅</div>
        <div className="ing-stat-body">
          <span className="ing-stat-value ing-stat-value--on">{enabled}</span>
          <span className="ing-stat-label">Available</span>
        </div>
      </div>
      <div className="ing-stat ing-stat--warn">
        <div className="ing-stat-icon-wrap ing-stat-icon-wrap--off">⛔</div>
        <div className="ing-stat-body">
          <span className="ing-stat-value ing-stat-value--off">{disabled}</span>
          <span className="ing-stat-label">Disabled</span>
        </div>
      </div>
      <div className="ing-stat">
        <div className="ing-stat-icon-wrap ing-stat-icon-wrap--vis">🎨</div>
        <div className="ing-stat-body">
          <span className="ing-stat-value ing-stat-value--vis">{visual}</span>
          <span className="ing-stat-label">Visual Assets</span>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function IngredientsPage() {
  const [tab, setTab] = useState('pizza');
  const { isLoading } = useIngredientConfig();

  const pizzaGroups  = groupByCategory(PIZZA_ADMIN_LIST);
  const burgerGroups = groupByCategory(ALL_BURGER_INGREDIENTS);

  const currentList   = tab === 'pizza' ? PIZZA_ADMIN_LIST : ALL_BURGER_INGREDIENTS;
  const currentGroups = tab === 'pizza' ? pizzaGroups : burgerGroups;
  const currentOrder  = tab === 'pizza' ? PIZZA_CAT_ORDER : BURGER_CAT_ORDER;
  const currentImages = tab === 'pizza' ? PIZZA_PREVIEW_IMAGES : BURGER_PREVIEW_IMAGES;

  return (
    <div className="ing-page">

      {/* ── Header ── */}
      <div className="ing-header">
        <div className="ing-header-left">
          <h1 className="ing-title">Ingredient Management</h1>
          <p className="ing-desc">
            Configure pricing and availability for all builder ingredients.
            Changes sync to builders in real-time.
          </p>
        </div>

        <div className="ing-tab-group">
          <button
            className={`ing-tab${tab === 'pizza' ? ' ing-tab--active' : ''}`}
            onClick={() => setTab('pizza')}
          >
            <span className="ing-tab-icon">🍕</span>
            <span>Pizza</span>
            <span className="ing-tab-badge">{PIZZA_ADMIN_LIST.length}</span>
          </button>
          <button
            className={`ing-tab${tab === 'burger' ? ' ing-tab--active' : ''}`}
            onClick={() => setTab('burger')}
          >
            <span className="ing-tab-icon">🍔</span>
            <span>Burger</span>
            <span className="ing-tab-badge">{ALL_BURGER_INGREDIENTS.length}</span>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {!isLoading && (
        <StatsBar builder={tab} list={currentList} />
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="ing-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="ing-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      )}

      {/* ── Category sections ── */}
      {!isLoading && (
        <div className="ing-content">
          {currentOrder.map(cat =>
            currentGroups[cat] ? (
              <CategorySection
                key={`${tab}-${cat}`}
                builder={tab}
                category={cat}
                ingredients={currentGroups[cat]}
                previewImages={currentImages}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
