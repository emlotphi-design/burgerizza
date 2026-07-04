import { BURGER_INGREDIENTS_BY_ID } from './burgerData';

export function getBurgerIngredientCalories(id) {
  return BURGER_INGREDIENTS_BY_ID[id]?.calories ?? 0;
}

/**
 * Total calories for a burger object. Mirrors calcBurgerPrice's qty-aware
 * summation (meats/cheeses as { [id]: qty } maps, legacy array format
 * supported for backward compat with older saved burgers).
 */
export function calculateBurgerCalories(burger) {
  if (!burger?.bun) return 0;
  let sum = getBurgerIngredientCalories(burger.bun);

  const meats = burger.meats ?? {};
  if (Array.isArray(meats)) {
    sum += meats.reduce((s, id) => s + getBurgerIngredientCalories(id), 0);
  } else {
    sum += Object.entries(meats).reduce(
      (s, [id, qty]) => s + getBurgerIngredientCalories(id) * (qty || 1), 0
    );
  }

  const cheeses = burger.cheeses;
  if (cheeses && typeof cheeses === 'object' && !Array.isArray(cheeses)) {
    sum += Object.entries(cheeses).reduce(
      (s, [id, qty]) => s + getBurgerIngredientCalories(id) * (qty || 1), 0
    );
  } else if (burger.cheese) {
    sum += getBurgerIngredientCalories(burger.cheese);
  }
  sum += (burger.sauces     ?? []).reduce((s, id) => s + getBurgerIngredientCalories(id), 0);
  sum += (burger.vegetables ?? []).reduce((s, id) => s + getBurgerIngredientCalories(id), 0);
  return sum;
}

/**
 * Full nutrition breakdown for a burger. protein/carbs/fat stay `null`
 * unless every contributing item has a real value.
 */
export function calculateBurgerNutrition(burger) {
  if (!burger?.bun) return { weight: 0, calories: 0, protein: null, carbs: null, fat: null };

  const entries = [];
  const bun = BURGER_INGREDIENTS_BY_ID[burger.bun];
  if (bun) entries.push(bun);

  const meats = burger.meats ?? {};
  if (Array.isArray(meats)) {
    meats.forEach(id => { const i = BURGER_INGREDIENTS_BY_ID[id]; if (i) entries.push(i); });
  } else {
    Object.entries(meats).forEach(([id, qty]) => {
      const i = BURGER_INGREDIENTS_BY_ID[id];
      if (i) for (let n = 0; n < (qty || 1); n++) entries.push(i);
    });
  }

  const cheeses = burger.cheeses;
  if (cheeses && typeof cheeses === 'object' && !Array.isArray(cheeses)) {
    Object.entries(cheeses).forEach(([id, qty]) => {
      const i = BURGER_INGREDIENTS_BY_ID[id];
      if (i) for (let n = 0; n < (qty || 1); n++) entries.push(i);
    });
  } else if (burger.cheese) {
    const i = BURGER_INGREDIENTS_BY_ID[burger.cheese];
    if (i) entries.push(i);
  }

  (burger.sauces ?? []).forEach(id => { const i = BURGER_INGREDIENTS_BY_ID[id]; if (i) entries.push(i); });
  (burger.vegetables ?? []).forEach(id => { const i = BURGER_INGREDIENTS_BY_ID[id]; if (i) entries.push(i); });

  const weight   = entries.reduce((s, i) => s + (i.weight ?? 0), 0);
  const calories = entries.reduce((s, i) => s + (i.calories ?? 0), 0);

  const macroSum = (key) => {
    if (entries.some(i => i[key] == null)) return null;
    return entries.reduce((s, i) => s + i[key], 0);
  };

  return {
    weight,
    calories,
    protein: macroSum('protein'),
    carbs:   macroSum('carbs'),
    fat:     macroSum('fat'),
  };
}
