import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas, { PIZZA_ASSET_URLS } from '../components/PizzaCanvas';
import CategoryToolbar from '../components/CategoryToolbar';
import { usePizzaBuilder } from '../features/pizza-builder/hooks/usePizzaBuilder';
import { LABEL, calcPrice } from '../utils/pizzaUtils';
import { calculatePizzaCalories } from '../utils/pizzaNutritionUtils';
import NutritionBadge from '../components/NutritionBadge';
import { preloadImages } from '../utils/imagePreloadCache';
import { useCalorieBadgePosition } from '../hooks/useCalorieBadgePosition';

// ── Saved-pizza card (presentational, no logic) ───────────────────────────────

function SavedPizzaCard({ pizza, onEdit, onDelete, onRename, exiting }) {
  const [renaming,  setRenaming]  = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(pizza.name);

  function commitRename() {
    const trimmed = nameDraft.trim();
    onRename(pizza.id, trimmed || pizza.name);
    setNameDraft(trimmed || pizza.name);
    setRenaming(false);
  }

  const price       = calcPrice(pizza);
  const calories    = calculatePizzaCalories(pizza);
  const meats       = Array.isArray(pizza.meats) ? pizza.meats : [];
  const vegetables  = Array.isArray(pizza.vegetables) ? pizza.vegetables : [];
  const ingredients = [
    LABEL[pizza.dough], LABEL[pizza.sauce], LABEL[pizza.cheese],
    ...meats.map(id => LABEL[id]),
    ...vegetables.map(id => LABEL[id]),
  ].filter(Boolean);

  return (
    <div className={`bpc-card preview-card${exiting ? ' bpc-card--exit' : ''}`}>
      <div className="bpc-header">
        {renaming ? (
          <input
            className="bpc-name-input"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter')  { commitRename(); }
              if (e.key === 'Escape') { setNameDraft(pizza.name); setRenaming(false); }
            }}
            autoFocus
            maxLength={28}
          />
        ) : (
          <span
            className="bpc-name bpc-name--editable"
            onClick={() => { setNameDraft(pizza.name); setRenaming(true); }}
            title="Click to rename"
          >
            {pizza.name}
          </span>
        )}
        <span className="nutrition-price-group">
          <span className="bpc-price">€{price.toFixed(2)}</span>
          <NutritionBadge calories={calories} size="sm" />
        </span>
      </div>
      <div className="bpc-image-wrap">
        <PizzaCanvas
          activeCategory=""
          selectedDough={pizza.dough}
          selectedSauce={pizza.sauce}
          selectedCheese={pizza.cheese}
          selectedMeats={meats}
          selectedVegetables={vegetables}
          size="88px"
          protectImages
        />
      </div>
      <p className="bpc-summary">
        {ingredients.slice(0, 3).join(' · ')}
        {ingredients.length > 3 && <span className="bpc-more"> +{ingredients.length - 3}</span>}
      </p>
      <div className="bpc-actions">
        <button className="bpc-edit-btn" onClick={() => onEdit(pizza)} aria-label="Edit pizza">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button className="bpc-remove-btn" onClick={() => onDelete(pizza.id)} aria-label="Remove pizza">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PizzaBuilder() {
  const {
    pizzaItems, canAddToCart, isEditing, nextPizzaNumber,
    lockMsg, exitingIds, toastVisible,
    activeCategory, selectedDough, selectedSize, sizesForDough, selectedSauce, selectedCheese,
    selectedMeats, selectedVegetables,
    draftName, editingName,
    unlocked, completed,
    handleAddToCart, handleEditPizza, handleDeletePizza,
    handleCategoryChange,
    handleDoughSelect, handleSizeSelect, handleSauceSelect, handleCheeseSelect,
    handleMeatToggle, handleVegetableToggle,
    setDraftName, renamePizza,
  } = usePizzaBuilder();

  // Preload + cache every ingredient image as soon as the builder opens,
  // instead of each one loading lazily the first time its category is
  // selected. preloadImages() is idempotent, so this is safe to call again
  // on every mount without re-fetching anything already cached.
  useEffect(() => {
    preloadImages(PIZZA_ASSET_URLS);
  }, []);

  // Shared with Burger Builder — see useCalorieBadgePosition for the full
  // placement rationale (upper-right shoulder of the product, falling
  // back to centered-above-canvas when there isn't room). sizesForDough
  // .length is an extra dependency here because the size-selector row
  // only mounts once sizes resolve for the selected dough, which changes
  // .builder-center's height and re-centers the canvas.
  const badgeWrapRef = useCalorieBadgePosition(
    !!selectedDough,
    '.pizza-canvas-wrap',
    [sizesForDough.length, pizzaItems.length],
  );

  const liveCalories = calculatePizzaCalories({
    dough: selectedDough,
    size: selectedSize,
    sauce: selectedSauce,
    cheese: selectedCheese,
    meats: selectedMeats,
    vegetables: selectedVegetables,
  });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden', paddingTop: 'var(--nav-h, 74px)' }}>
      <Navbar />
      <main className="pb-main">
        <div className="builder-stage">
          {isEditing && (
            <div className="builder-edit-banner">
              BEARBEITUNG: {editingName || 'Pizza'}
            </div>
          )}
          <CategoryToolbar
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            unlocked={unlocked}
            completed={completed}
            lockMsg={lockMsg}
          />
          <div className="builder-center">
            {selectedDough && (
              <div ref={badgeWrapRef} className="nutrition-live-float nutrition-live-float--pizza">
                <NutritionBadge calories={liveCalories} size="md" premium />
              </div>
            )}
            <PizzaCanvas
              activeCategory={activeCategory}
              selectedDough={selectedDough}
              selectedSauce={selectedSauce}
              selectedCheese={selectedCheese}
              selectedMeats={selectedMeats}
              selectedVegetables={selectedVegetables}
              onDoughSelect={handleDoughSelect}
              onSauceSelect={handleSauceSelect}
              onCheeseSelect={handleCheeseSelect}
              onMeatToggle={handleMeatToggle}
              onVegetableToggle={handleVegetableToggle}
              size="min(540px, 88vw, calc(100vh - 232px))"
              protectImages
            />
            <div className="builder-name-wrap">
              <input
                className="builder-name-input"
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                placeholder={`Custom Pizza #${nextPizzaNumber}`}
                maxLength={32}
                aria-label="Pizza name"
                spellCheck={false}
              />
            </div>
            {selectedDough && sizesForDough.length > 0 && (
              <div className="nutrition-size-row">
                {sizesForDough.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={[
                      'nutrition-size-btn',
                      selectedSize === s.id ? 'nutrition-size-btn--active' : '',
                      !s.enabled ? 'nutrition-size-btn--disabled' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => s.enabled && handleSizeSelect(s.id)}
                    disabled={!s.enabled}
                    aria-pressed={selectedSize === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {pizzaItems.length > 0 && (
        <div className="bpc-panel">
          <p className="bpc-panel-label">YOUR PIZZAS</p>
          <div className="bpc-panel-list">
            {pizzaItems.map(pizza => (
              <SavedPizzaCard
                key={pizza.id}
                pizza={pizza}
                onEdit={handleEditPizza}
                onDelete={handleDeletePizza}
                onRename={renamePizza}
                exiting={exitingIds.includes(pizza.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        className={`pb-order-btn${canAddToCart ? ' pb-order-btn--visible' : ''}`}
        onClick={handleAddToCart}
        aria-label="Order pizza"
      >
        ORDER NOW
      </button>

      {toastVisible && (
        <div className="pb-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Pizza added to cart
        </div>
      )}

      <Socials />
    </div>
  );
}
