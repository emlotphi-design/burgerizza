import { INGREDIENTS_BY_ID } from './pizzaIngredients';
import { DOUGHS_BY_ID, PIZZA_DOUGHS } from './pizzaDoughs';
import { DOUGH_SIZES_BY_ID, DEFAULT_PIZZA_SIZE } from './pizzaSizes';

/**
 * Fallback base price when dough ID is unknown.
 * Uses the cheapest dough so prices never under-report.
 */
const FALLBACK_DOUGH_PRICE = Math.min(...PIZZA_DOUGHS.map(d => d.price));

/**
 * Base price for a given dough ID.
 * Falls back to the cheapest dough price for safety.
 */
export function getDoughPrice(doughId) {
  return DOUGHS_BY_ID[doughId]?.price ?? FALLBACK_DOUGH_PRICE;
}

/**
 * Size surcharge for a given (dough, size) pair — database-driven via
 * PizzaSizeConfigContext (mutates DOUGH_SIZES_BY_ID in place). Defaults to
 * 0 (no surcharge) for unknown pairs, so pizzas never throw or under/over
 * charge unexpectedly.
 */
export function getSizePrice(doughId, size) {
  return DOUGH_SIZES_BY_ID[doughId]?.[size ?? DEFAULT_PIZZA_SIZE]?.price ?? 0;
}

/**
 * Price for a single ingredient (sauce, cheese, meat, vegetable) by ID.
 * Returns 0 for unknown IDs so existing pizzas never throw.
 */
export function getIngredientPrice(id) {
  return INGREDIENTS_BY_ID[id]?.price ?? 0;
}

/**
 * Sum prices for an array of ingredient IDs.
 */
export function calculateIngredientTotal(ingredientIds) {
  return ingredientIds.reduce((sum, id) => sum + getIngredientPrice(id), 0);
}

/**
 * Full price for a pizza object.
 * pizza: { dough, size, sauce, cheese, meats: [], vegetables: [] }
 *
 * Price = dough base price + size surcharge + sauce + cheese + Σ meats + Σ vegetables
 */
export function calculatePizzaPrice(pizza) {
  const doughPrice = getDoughPrice(pizza.dough);
  const sizePrice   = getSizePrice(pizza.dough, pizza.size);

  const toppingIds = [
    pizza.sauce,
    pizza.cheese,
    ...(pizza.meats ?? []),
    ...(pizza.vegetables ?? []),
  ].filter(Boolean);

  return doughPrice + sizePrice + calculateIngredientTotal(toppingIds);
}

/**
 * Format a numeric amount as a EUR price string.
 */
export function formatPrice(amount) {
  return `€${amount.toFixed(2)}`;
}
