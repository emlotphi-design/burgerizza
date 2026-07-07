import { useState, useEffect, useRef, useCallback } from 'react';
import { useIngredientConfig } from '../../context/IngredientConfigContext';
import { useNutritionConfig } from '../../context/NutritionConfigContext';
import { usePizzaSizeConfig } from '../../context/PizzaSizeConfigContext';
import { PIZZA_DOUGHS } from '../../utils/pizzaDoughs';
import { MENU_ITEMS } from '../../utils/menuData';
import { PIZZA_SIZES } from '../../utils/pizzaSizes';
import { useAllIngredients } from '../utils/useAllIngredients';
import AddIngredientCard from '../components/ui/AddIngredientCard';
import AddIngredientModal from '../components/ui/AddIngredientModal';
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
  const { getNutrition, updateNutrition } = useNutritionConfig();

  const enabled   = isEnabled(builder, ingredient.id);
  const price     = getPrice(builder, ingredient.id);
  const nutrition = getNutrition(builder, ingredient.id);

  const [localPrice, setLocalPrice] = useState(() => price.toFixed(2));
  const [focused,    setFocused]    = useState(false);
  const timerRef = useRef(null);

  const [localWeight,   setLocalWeight]   = useState(() => nutrition.weight ?? '');
  const [localCalories, setLocalCalories] = useState(() => String(nutrition.calories ?? 0));
  const [weightFocused,   setWeightFocused]   = useState(false);
  const [caloriesFocused, setCaloriesFocused] = useState(false);
  const weightTimerRef   = useRef(null);
  const caloriesTimerRef = useRef(null);

  // Keep display in sync with remote updates when not actively editing
  useEffect(() => {
    if (!focused) setLocalPrice(price.toFixed(2));
  }, [price, focused]);

  useEffect(() => {
    if (!weightFocused) setLocalWeight(nutrition.weight ?? '');
  }, [nutrition.weight, weightFocused]);

  useEffect(() => {
    if (!caloriesFocused) setLocalCalories(String(nutrition.calories ?? 0));
  }, [nutrition.calories, caloriesFocused]);

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

  const handleWeightChange = e => {
    setLocalWeight(e.target.value);
    clearTimeout(weightTimerRef.current);
    weightTimerRef.current = setTimeout(() => {
      const raw = e.target.value;
      const num = raw === '' ? null : parseFloat(raw);
      if (raw === '' || (!isNaN(num) && num >= 0)) {
        updateNutrition(builder, ingredient.id, { weight: num });
      }
    }, 600);
  };

  const handleWeightBlur = () => {
    setWeightFocused(false);
    if (localWeight !== '') {
      const num = parseFloat(localWeight);
      if (isNaN(num) || num < 0) setLocalWeight(nutrition.weight ?? '');
    }
  };

  const handleCaloriesChange = e => {
    setLocalCalories(e.target.value);
    clearTimeout(caloriesTimerRef.current);
    caloriesTimerRef.current = setTimeout(() => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num) && num >= 0) {
        updateNutrition(builder, ingredient.id, { calories: num });
      }
    }, 600);
  };

  const handleCaloriesBlur = () => {
    setCaloriesFocused(false);
    const num = parseFloat(localCalories);
    if (isNaN(num) || num < 0) setLocalCalories(String(nutrition.calories ?? 0));
  };

  const handleToggle = useCallback(
    () => updateIngredient(builder, ingredient.id, { enabled: !enabled }),
    [builder, ingredient.id, enabled, updateIngredient],
  );

  return (
    <div className={`ing-card${!enabled ? ' ing-card--off' : ''}`}>

      {/* Image */}
      <div className="ing-card-img-wrap">
        <img src={previewImg} alt={ingredient.name} className="ing-card-img" />
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

        {/* Nutrition — weight (g) / calories (kcal) */}
        <div className="ing-nutrition-row">
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Weight (g)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={localWeight}
              onChange={handleWeightChange}
              onFocus={() => setWeightFocused(true)}
              onBlur={handleWeightBlur}
              className="ing-nutrition-input"
              placeholder="—"
              aria-label={`Weight in grams for ${ingredient.name}`}
            />
          </div>
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Calories (kcal)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={localCalories}
              onChange={handleCaloriesChange}
              onFocus={() => setCaloriesFocused(true)}
              onBlur={handleCaloriesBlur}
              className="ing-nutrition-input"
              aria-label={`Calories for ${ingredient.name}`}
            />
          </div>
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
  const [showAddModal, setShowAddModal] = useState(false);
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
        <AddIngredientCard onClick={() => setShowAddModal(true)} />
      </div>

      {showAddModal && (
        <AddIngredientModal category={category} onClose={() => setShowAddModal(false)} />
      )}
    </section>
  );
}

/* ── Stats bar ───────────────────────────────────────────────────────────────── */
function StatsBar({ builder, list }) {
  const { total, enabled, disabled } = useSummaryStats(builder, list);

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
    </div>
  );
}

/* ── Nutrition-only card (menu items, pizza sizes) — no price/toggle ── */
function NutritionOnlyCard({ scope, id, name, emoji }) {
  const { getNutrition, updateNutrition } = useNutritionConfig();
  const nutrition = getNutrition(scope, id);

  const [localWeight,   setLocalWeight]   = useState(() => nutrition.weight ?? '');
  const [localCalories, setLocalCalories] = useState(() => String(nutrition.calories ?? 0));
  const [weightFocused,   setWeightFocused]   = useState(false);
  const [caloriesFocused, setCaloriesFocused] = useState(false);
  const weightTimerRef   = useRef(null);
  const caloriesTimerRef = useRef(null);

  useEffect(() => {
    if (!weightFocused) setLocalWeight(nutrition.weight ?? '');
  }, [nutrition.weight, weightFocused]);

  useEffect(() => {
    if (!caloriesFocused) setLocalCalories(String(nutrition.calories ?? 0));
  }, [nutrition.calories, caloriesFocused]);

  const handleWeightChange = e => {
    setLocalWeight(e.target.value);
    clearTimeout(weightTimerRef.current);
    weightTimerRef.current = setTimeout(() => {
      const raw = e.target.value;
      const num = raw === '' ? null : parseFloat(raw);
      if (raw === '' || (!isNaN(num) && num >= 0)) {
        updateNutrition(scope, id, { weight: num });
      }
    }, 600);
  };

  const handleCaloriesChange = e => {
    setLocalCalories(e.target.value);
    clearTimeout(caloriesTimerRef.current);
    caloriesTimerRef.current = setTimeout(() => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num) && num >= 0) {
        updateNutrition(scope, id, { calories: num });
      }
    }, 600);
  };

  return (
    <div className="ing-card">
      <div className="ing-card-img-wrap">
        <div className="ing-card-placeholder"><span>{emoji}</span></div>
      </div>
      <div className="ing-card-body">
        <div className="ing-card-name">{name}</div>
        <div className="ing-nutrition-row">
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Weight (g)</label>
            <input
              type="number" min="0" step="1"
              value={localWeight}
              onChange={handleWeightChange}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              className="ing-nutrition-input"
              placeholder="—"
              aria-label={`Weight in grams for ${name}`}
            />
          </div>
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Calories (kcal)</label>
            <input
              type="number" min="0" step="1"
              value={localCalories}
              onChange={handleCaloriesChange}
              onFocus={() => setCaloriesFocused(true)}
              onBlur={() => setCaloriesFocused(false)}
              className="ing-nutrition-input"
              aria-label={`Calories for ${name}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pizza size card — price (surcharge) + calories/weight + enable + sort order,
   independently per (dough, size) ─────────────────────────────────────────── */
function SizeConfigCard({ dough, size }) {
  const { getSizeConfig, updateSizeConfig } = usePizzaSizeConfig();
  const conf = getSizeConfig(dough, size.id);

  const [localPrice,    setLocalPrice]    = useState(() => conf.price.toFixed(2));
  const [localWeight,   setLocalWeight]   = useState(() => conf.weight ?? '');
  const [localCalories, setLocalCalories] = useState(() => String(conf.calories ?? 0));
  const [localSort,     setLocalSort]     = useState(() => String(conf.sortOrder ?? 0));
  const [priceFocused,    setPriceFocused]    = useState(false);
  const [weightFocused,   setWeightFocused]   = useState(false);
  const [caloriesFocused, setCaloriesFocused] = useState(false);
  const [sortFocused,     setSortFocused]     = useState(false);
  const priceTimerRef    = useRef(null);
  const weightTimerRef   = useRef(null);
  const caloriesTimerRef = useRef(null);
  const sortTimerRef     = useRef(null);

  useEffect(() => { if (!priceFocused)    setLocalPrice(conf.price.toFixed(2)); },       [conf.price, priceFocused]);
  useEffect(() => { if (!weightFocused)   setLocalWeight(conf.weight ?? ''); },          [conf.weight, weightFocused]);
  useEffect(() => { if (!caloriesFocused) setLocalCalories(String(conf.calories ?? 0)); }, [conf.calories, caloriesFocused]);
  useEffect(() => { if (!sortFocused)     setLocalSort(String(conf.sortOrder ?? 0)); },  [conf.sortOrder, sortFocused]);

  const handlePriceChange = e => {
    setLocalPrice(e.target.value);
    clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num) && num >= 0) updateSizeConfig(dough, size.id, { price: parseFloat(num.toFixed(2)) });
    }, 600);
  };
  const handlePriceBlur = () => {
    setPriceFocused(false);
    const num = parseFloat(localPrice);
    if (isNaN(num) || num < 0) setLocalPrice(conf.price.toFixed(2));
  };

  const handleWeightChange = e => {
    setLocalWeight(e.target.value);
    clearTimeout(weightTimerRef.current);
    weightTimerRef.current = setTimeout(() => {
      const raw = e.target.value;
      const num = raw === '' ? null : parseFloat(raw);
      if (raw === '' || (!isNaN(num) && num >= 0)) updateSizeConfig(dough, size.id, { weight: num });
    }, 600);
  };

  const handleCaloriesChange = e => {
    setLocalCalories(e.target.value);
    clearTimeout(caloriesTimerRef.current);
    caloriesTimerRef.current = setTimeout(() => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num) && num >= 0) updateSizeConfig(dough, size.id, { calories: num });
    }, 600);
  };

  const handleSortChange = e => {
    setLocalSort(e.target.value);
    clearTimeout(sortTimerRef.current);
    sortTimerRef.current = setTimeout(() => {
      const num = parseInt(e.target.value, 10);
      if (!isNaN(num)) updateSizeConfig(dough, size.id, { sortOrder: num });
    }, 600);
  };
  const handleSortBlur = () => {
    setSortFocused(false);
    if (localSort === '' || isNaN(parseInt(localSort, 10))) setLocalSort(String(conf.sortOrder ?? 0));
  };

  const handleToggle = useCallback(
    () => updateSizeConfig(dough, size.id, { enabled: !conf.enabled }),
    [dough, size.id, conf.enabled, updateSizeConfig],
  );

  return (
    <div className={`ing-card${!conf.enabled ? ' ing-card--off' : ''}`}>
      <div className="ing-card-img-wrap">
        <div className="ing-card-placeholder"><span>📐</span></div>
      </div>
      <div className="ing-card-body">
        <div className="ing-card-name">{size.label}</div>

        {/* Price — surcharge added on top of the dough's base price */}
        <div className="ing-price-row">
          <span className="ing-price-sym">€</span>
          <input
            type="number" min="0" max="99.99" step="0.10"
            value={localPrice}
            onChange={handlePriceChange}
            onFocus={() => setPriceFocused(true)}
            onBlur={handlePriceBlur}
            className="ing-price-input"
            aria-label={`Size surcharge for ${size.label}`}
          />
        </div>

        {/* Nutrition */}
        <div className="ing-nutrition-row">
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Weight (g)</label>
            <input
              type="number" min="0" step="1"
              value={localWeight}
              onChange={handleWeightChange}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              className="ing-nutrition-input"
              placeholder="—"
              aria-label={`Weight in grams for ${size.label}`}
            />
          </div>
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Calories (kcal)</label>
            <input
              type="number" min="0" step="1"
              value={localCalories}
              onChange={handleCaloriesChange}
              onFocus={() => setCaloriesFocused(true)}
              onBlur={() => setCaloriesFocused(false)}
              className="ing-nutrition-input"
              aria-label={`Calories for ${size.label}`}
            />
          </div>
        </div>

        {/* Sort order — plain numeric field, same pattern as admin/pages/Products.jsx */}
        <div className="ing-nutrition-row">
          <div className="ing-nutrition-field">
            <label className="ing-nutrition-label">Sort order</label>
            <input
              type="number" step="1"
              value={localSort}
              onChange={handleSortChange}
              onFocus={() => setSortFocused(true)}
              onBlur={handleSortBlur}
              className="ing-nutrition-input"
              aria-label={`Sort order for ${size.label}`}
            />
          </div>
        </div>

        {/* Availability toggle */}
        <div className="ing-avail-row">
          <span className={`ing-avail-label${!conf.enabled ? ' ing-avail-label--off' : ''}`}>
            {conf.enabled ? 'Available' : 'Disabled'}
          </span>
          <IngToggle
            on={conf.enabled}
            onChange={handleToggle}
            label={`Toggle availability for ${size.label}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Pizza sizes section — one group per dough, each with its own 3 size cards ── */
function PizzaSizeSection() {
  return (
    <section className="ing-section">
      <div className="ing-section-header">
        <span className="ing-section-emoji">📐</span>
        <h3 className="ing-section-title">Pizza Sizes (Per Dough)</h3>
        <div className="ing-section-stats">
          <span className="ing-section-count">{PIZZA_DOUGHS.length * PIZZA_SIZES.length} total</span>
        </div>
      </div>
      <p className="ing-desc" style={{ margin: '0 0 12px' }}>
        Every dough (Classic Thin Crust, Käserand, Würstchenrand) manages its own sizes
        independently — enable/disable, a price surcharge added on top of the dough's
        base price, weight/calories, and display order.
      </p>
      {PIZZA_DOUGHS.map(d => (
        <div key={d.id} className="ing-subsection">
          <h4 className="ing-subsection-title">{d.name}</h4>
          <div className="ing-grid">
            {PIZZA_SIZES.map(s => (
              <SizeConfigCard key={`${d.id}-${s.id}`} dough={d.id} size={s} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function IngredientsPage() {
  const [tab, setTab] = useState('pizza');
  const { isLoading } = useIngredientConfig();
  const isMenuTab = tab === 'dessert' || tab === 'drinks';

  const { pizzaList, burgerList, pizzaImages, burgerImages } = useAllIngredients();

  const pizzaGroups  = groupByCategory(pizzaList);
  const burgerGroups = groupByCategory(burgerList);

  const currentList   = tab === 'pizza' ? pizzaList : burgerList;
  const currentGroups = tab === 'pizza' ? pizzaGroups : burgerGroups;
  const currentOrder  = tab === 'pizza' ? PIZZA_CAT_ORDER : BURGER_CAT_ORDER;
  const currentImages = tab === 'pizza' ? pizzaImages : burgerImages;
  const currentMenuItems = isMenuTab ? MENU_ITEMS[tab] : [];

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
            <span className="ing-tab-badge">{pizzaList.length}</span>
          </button>
          <button
            className={`ing-tab${tab === 'burger' ? ' ing-tab--active' : ''}`}
            onClick={() => setTab('burger')}
          >
            <span className="ing-tab-icon">🍔</span>
            <span>Burger</span>
            <span className="ing-tab-badge">{burgerList.length}</span>
          </button>
          <button
            className={`ing-tab${tab === 'dessert' ? ' ing-tab--active' : ''}`}
            onClick={() => setTab('dessert')}
          >
            <span className="ing-tab-icon">🍰</span>
            <span>Desserts</span>
            <span className="ing-tab-badge">{MENU_ITEMS.dessert.length}</span>
          </button>
          <button
            className={`ing-tab${tab === 'drinks' ? ' ing-tab--active' : ''}`}
            onClick={() => setTab('drinks')}
          >
            <span className="ing-tab-icon">🥤</span>
            <span>Drinks</span>
            <span className="ing-tab-badge">{MENU_ITEMS.drinks.length}</span>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {!isLoading && !isMenuTab && (
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

      {/* ── Menu item nutrition (desserts/drinks) ── */}
      {!isLoading && isMenuTab && (
        <div className="ing-content">
          <section className="ing-section">
            <div className="ing-section-header">
              <span className="ing-section-emoji">{tab === 'dessert' ? '🍰' : '🥤'}</span>
              <h3 className="ing-section-title">{tab === 'dessert' ? 'Desserts' : 'Drinks'}</h3>
              <div className="ing-section-stats">
                <span className="ing-section-count">{currentMenuItems.length} total</span>
              </div>
            </div>
            <div className="ing-grid">
              {currentMenuItems.map(item => (
                <NutritionOnlyCard key={item.id} scope="menu" id={item.id} name={item.name} emoji={item.emoji} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Category sections ── */}
      {!isLoading && !isMenuTab && (
        <div className="ing-content">
          {tab === 'pizza' && <PizzaSizeSection />}
          {currentOrder.map(cat => (
            <CategorySection
              key={`${tab}-${cat}`}
              builder={tab}
              category={cat}
              ingredients={currentGroups[cat] ?? []}
              previewImages={currentImages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
