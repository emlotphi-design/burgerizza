import { INGREDIENTS_BY_ID } from './pizzaIngredients';
import { DOUGHS_BY_ID } from './pizzaDoughs';
import { SIZES_BY_ID, DEFAULT_PIZZA_SIZE } from './pizzaSizes';

/**
 * Calorie/weight for a given dough, honoring the size selector for the
 * 'thin' crust (the only dough with multiple sizes in the spec). Other
 * doughs ('americanp', 'american') are single-size and ignore `size`.
 */
export function getDoughNutrition(doughId, size) {
  const dough = DOUGHS_BY_ID[doughId];
  if (!dough) return { weight: null, calories: 0 };

  if (doughId === 'thin') {
    const sizeInfo = SIZES_BY_ID[size ?? DEFAULT_PIZZA_SIZE];
    if (sizeInfo) return { weight: sizeInfo.weight, calories: sizeInfo.calories };
  }

  return { weight: dough.weight ?? null, calories: dough.calories ?? 0 };
}

export function getDoughCalories(doughId, size) {
  return getDoughNutrition(doughId, size).calories;
}

/**
 * Calories for a single topping (sauce, cheese, meat, vegetable) by ID.
 * Returns 0 for unknown/unset IDs so incomplete pizzas never throw.
 */
export function getIngredientCalories(id) {
  return INGREDIENTS_BY_ID[id]?.calories ?? 0;
}

export function calculateIngredientCalorieTotal(ingredientIds) {
  return ingredientIds.reduce((sum, id) => sum + getIngredientCalories(id), 0);
}

/**
 * Total calories for a pizza object: { dough, size, sauce, cheese, meats: [], vegetables: [] }
 */
export function calculatePizzaCalories(pizza) {
  if (!pizza?.dough) return 0;
  const doughCalories = getDoughCalories(pizza.dough, pizza.size);

  const toppingIds = [
    pizza.sauce,
    pizza.cheese,
    ...(pizza.meats ?? []),
    ...(pizza.vegetables ?? []),
  ].filter(Boolean);

  return doughCalories + calculateIngredientCalorieTotal(toppingIds);
}

/**
 * Full nutrition breakdown for a pizza. protein/carbs/fat stay `null` unless
 * every contributing item has a real value — future-ready without requiring
 * a schema change once that data is supplied.
 */
export function calculatePizzaNutrition(pizza) {
  if (!pizza?.dough) return { weight: 0, calories: 0, protein: null, carbs: null, fat: null };

  const dough = getDoughNutrition(pizza.dough, pizza.size);
  const toppingIds = [
    pizza.sauce,
    pizza.cheese,
    ...(pizza.meats ?? []),
    ...(pizza.vegetables ?? []),
  ].filter(Boolean);
  const toppings = toppingIds.map(id => INGREDIENTS_BY_ID[id]).filter(Boolean);

  const weight   = (dough.weight ?? 0) + toppings.reduce((s, t) => s + (t.weight ?? 0), 0);
  const calories = dough.calories + toppings.reduce((s, t) => s + (t.calories ?? 0), 0);

  const macroSum = (key) => {
    const doughVal = INGREDIENTS_BY_ID[pizza.dough]?.[key];
    const parts = [doughVal, ...toppings.map(t => t[key])];
    if (parts.some(v => v == null)) return null;
    return parts.reduce((s, v) => s + v, 0);
  };

  return {
    weight,
    calories,
    protein: macroSum('protein'),
    carbs:   macroSum('carbs'),
    fat:     macroSum('fat'),
  };
}
