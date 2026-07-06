import Navbar from '../../components/Navbar';
import Socials from '../../components/Socials';
import { useIngredientConfig } from '../../context/IngredientConfigContext';
import BurgerSidebar from './components/BurgerSidebar';
import BurgerPreviewCard from './components/BurgerPreviewCard';
import NutritionBadge from '../../components/NutritionBadge';
import { calculateBurgerCalories } from './utils/burgerNutritionUtils';
import { useBurgerBuilder } from './hooks/useBurgerBuilder';
import { useCalorieBadgePosition } from '../../hooks/useCalorieBadgePosition';
import { DEFAULT_WRAPPER } from './utils/burgerImages';

const previewBtn = {
  width: '100%', height: '100%', padding: 0,
  background: 'none', border: 'none', borderRadius: 0,
  cursor: 'pointer', overflow: 'visible',
};

export default function BurgerBuilder() {
  const { isEnabled: ingEnabled } = useIngredientConfig();

  const {
    activeItem, setActiveItem,
    isOrdering, toastVisible, exitingBurgerIds,
    draft,
    burgerItems,
    selectedWrapper,
    bunBase, bunWidth, topBunSrc,
    selectedMeats, selectedCheeses, selectedSauces,
    hasMeat, ingredientLayers,
    mergedBuns, mergedBunPreviews, mergedBunPositions,
    mergedMeats, mergedMeatPreviews, mergedMeatPositions,
    mergedCheeses, mergedCheesePreviews, mergedCheesePositions,
    mergedSauces, mergedSaucePreviews, mergedSaucePositions,
    mergedVegetables, mergedVegetablePreviews, mergedVegetablePositions,
    handleOrder,
    handleEditBurger, handleRemoveBurger,
    handleSelectBun,
    handleToggleSauce,
    handleToggleMeat, handleIncrementMeat, handleDecrementMeat,
    handleToggleCheese, handleIncrementCheese, handleDecrementCheese,
    handleToggleVegetable,
    setName,
    MAX_MEAT_QTY, MAX_CHEESE_QTY, MAX_VEG_QTY, SAUCE_LIMIT,
  } = useBurgerBuilder();

  // Shared with Pizza Builder — see useCalorieBadgePosition for the full
  // placement rationale (upper-right shoulder of the product, falling
  // back to centered-above-canvas when there isn't room).
  const badgeWrapRef = useCalorieBadgePosition(
    !!draft.bun,
    '.bb-builder-canvas',
    [burgerItems.length],
  );

  return (
    <div className="bb-stage page-enter">
      <Navbar />

      <div className="bb-workspace">
        {/* Sibling of .bb-builder-canvas, not a child: that element has
            `contain: layout`, which per the CSS Containment spec makes it
            a containing block for position:fixed descendants — a badge
            nested inside it would resolve its "fixed" coordinates against
            the canvas box instead of the viewport. */}
        {draft.bun && (
          <div ref={badgeWrapRef} className="nutrition-live-float nutrition-live-float--burger">
            <NutritionBadge calories={calculateBurgerCalories(draft)} size="md" premium />
          </div>
        )}
        <div className="bb-builder-canvas">

          {/* Wrapper paper */}
          <img
            className="bb-wrapper-img"
            src={selectedWrapper}
            alt="Burger wrapper"
            onError={e => {
              if (e.currentTarget.src !== DEFAULT_WRAPPER) e.currentTarget.src = DEFAULT_WRAPPER;
            }}
          />

          {/* Bottom bun */}
          {bunBase && (
            <img
              className="bb-bun-img"
              src={bunBase}
              alt="Selected bun"
              style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* Ingredient layers in selection order — last selected = highest z-index */}
          {ingredientLayers.map(({ key, cls, src, style }) => (
            <img key={key} className={cls} src={src} alt="" style={style} />
          ))}

          {/* Top bun — drops in above all layers when ORDER is clicked */}
          {isOrdering && topBunSrc && (
            <img
              className="bb-top-bun-img"
              src={topBunSrc}
              alt="Top bun"
              style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* ── Orbital previews (hidden during ordering animation) ── */}

          {!isOrdering && activeItem === 'bun' && mergedBuns.map((bun, i) => {
            const isSelected    = draft.bun === bun.id;
            const adminDisabled = !ingEnabled('burger', bun.id);
            return (
              <div
                key={bun.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${adminDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...mergedBunPositions[bun.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={adminDisabled}
                  onClick={() => handleSelectBun(bun.id)}
                  aria-label={bun.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img src={mergedBunPreviews[bun.id]} alt={bun.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </button>
                <span className="bb-preview-label">{bun.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'sauce' && mergedSauces.map((sauce, i) => {
            const isSelected    = selectedSauces.includes(sauce.id);
            const isDisabled    = !ingEnabled('burger', sauce.id) || (selectedSauces.length >= SAUCE_LIMIT && !isSelected);
            return (
              <div
                key={sauce.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${isDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...mergedSaucePositions[sauce.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={isDisabled}
                  onClick={() => handleToggleSauce(sauce)}
                  aria-label={sauce.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img src={mergedSaucePreviews[sauce.id]} alt={sauce.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </button>
                <span className="bb-preview-label">{sauce.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'meat' && mergedMeats.map((meat, i) => {
            const qty           = selectedMeats[meat.id] ?? 0;
            const isSelected    = qty > 0;
            const adminDisabled = !ingEnabled('burger', meat.id);
            return (
              <div
                key={meat.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${adminDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...mergedMeatPositions[meat.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={adminDisabled}
                  onClick={() => handleToggleMeat(meat)}
                  aria-label={meat.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img src={mergedMeatPreviews[meat.id]} alt={meat.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </button>

                {isSelected && meat.hasQty && (
                  <div className="bb-qty-bar">
                    <button className="bb-qty-btn" aria-label={`Remove one ${meat.name}`}
                      onClick={e => { e.stopPropagation(); handleDecrementMeat(meat); }}>−</button>
                    <span className="bb-qty-count">{qty}</span>
                    <button className="bb-qty-btn" aria-label={`Add one ${meat.name}`}
                      disabled={qty >= MAX_MEAT_QTY}
                      onClick={e => { e.stopPropagation(); handleIncrementMeat(meat); }}>+</button>
                  </div>
                )}

                <span className="bb-preview-label">{meat.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'cheese' && mergedCheeses.map((cheese, i) => {
            const qty           = (selectedCheeses)[cheese.id] ?? 0;
            const isSelected    = qty > 0;
            const adminDisabled = !ingEnabled('burger', cheese.id);
            return (
              <div
                key={cheese.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${adminDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...mergedCheesePositions[cheese.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={adminDisabled}
                  onClick={() => handleToggleCheese(cheese)}
                  aria-label={cheese.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  {mergedCheesePreviews[cheese.id] && (
                    <img src={mergedCheesePreviews[cheese.id]} alt={cheese.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  )}
                </button>

                {isSelected && cheese.hasQty && (
                  <div className="bb-qty-bar">
                    <button className="bb-qty-btn" aria-label={`Remove one ${cheese.name}`}
                      onClick={e => { e.stopPropagation(); handleDecrementCheese(cheese); }}>−</button>
                    <span className="bb-qty-count">{qty}</span>
                    <button className="bb-qty-btn" aria-label={`Add one ${cheese.name}`}
                      disabled={qty >= MAX_CHEESE_QTY}
                      onClick={e => { e.stopPropagation(); handleIncrementCheese(cheese); }}>+</button>
                  </div>
                )}

                <span className="bb-preview-label">{cheese.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'vegetables' && mergedVegetables.map((veg, i) => {
            const selectedVegetables = draft.vegetables ?? [];
            const isSelected    = selectedVegetables.includes(veg.id);
            const isDisabled    = !ingEnabled('burger', veg.id) || (selectedVegetables.length >= MAX_VEG_QTY && !isSelected);
            return (
              <div
                key={veg.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${isDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...mergedVegetablePositions[veg.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={isDisabled}
                  onClick={() => handleToggleVegetable(veg)}
                  aria-label={veg.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  {mergedVegetablePreviews[veg.id] && (
                    <img src={mergedVegetablePreviews[veg.id]} alt={veg.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  )}
                </button>
                <span className="bb-preview-label">{veg.name}</span>
              </div>
            );
          })}

        </div>

        <div className="builder-name-wrap">
          <input
            className="builder-name-input"
            type="text"
            value={draft.name}
            onChange={e => setName(e.target.value)}
            placeholder={`Custom Burger #${burgerItems.length + 1}`}
            maxLength={32}
            aria-label="Burger name"
            spellCheck={false}
          />
        </div>

        <BurgerSidebar activeItem={activeItem} onSelect={setActiveItem} bunSelected={!!draft.bun} />
      </div>

      {/* ORDER NOW — fixed pill, visible only when meat is selected */}
      <button
        className={`bb-order-btn${hasMeat && !isOrdering ? ' bb-order-btn--visible' : ''}`}
        onClick={handleOrder}
        aria-label="Order now"
      >
        ORDER NOW
      </button>

      {burgerItems.length > 0 && (
        <div className="bpc-panel">
          <p className="bpc-panel-label">YOUR BURGERS</p>
          <div className="bpc-panel-list">
            {burgerItems.map(burger => (
              <BurgerPreviewCard
                key={burger.id}
                burger={burger}
                isExiting={exitingBurgerIds.includes(burger.id)}
                onEdit={handleEditBurger}
                onRemove={handleRemoveBurger}
              />
            ))}
          </div>
        </div>
      )}

      {toastVisible && (
        <div className="bb-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Burger added to cart
        </div>
      )}

      <Socials />
    </div>
  );
}
