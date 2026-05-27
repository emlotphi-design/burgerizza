import { ALL_BURGER_INGREDIENTS, BURGER_INGREDIENTS_BY_ID } from './burgerData';

export function getBurgerIngredientById(id) {
  return BURGER_INGREDIENTS_BY_ID[id] ?? null;
}

export function getBurgerIngredientPrice(id) {
  return BURGER_INGREDIENTS_BY_ID[id]?.price ?? 0;
}

export function calcBurgerPrice(burger) {
  if (!burger?.bun) return 0;
  let sum = getBurgerIngredientPrice(burger.bun);

  const meats = burger.meats ?? {};
  if (Array.isArray(meats)) {
    // legacy array format
    sum += meats.reduce((s, id) => s + getBurgerIngredientPrice(id), 0);
  } else {
    // object map { [meatId]: qty }
    sum += Object.entries(meats).reduce(
      (s, [id, qty]) => s + getBurgerIngredientPrice(id) * (qty || 1), 0
    );
  }

  if (burger.cheese) sum += getBurgerIngredientPrice(burger.cheese);
  sum += (burger.sauces     ?? []).reduce((s, id) => s + getBurgerIngredientPrice(id), 0);
  sum += (burger.vegetables ?? []).reduce((s, id) => s + getBurgerIngredientPrice(id), 0);
  return sum;
}

export const BURGER_LABEL = Object.fromEntries(
  ALL_BURGER_INGREDIENTS.map(ing => [ing.id, ing.name])
);
