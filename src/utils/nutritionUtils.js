import { calculatePizzaCalories, calculatePizzaNutrition } from './pizzaNutritionUtils';
import { calculateBurgerCalories, calculateBurgerNutrition } from '../features/burger/utils/burgerNutritionUtils';

/**
 * Total calories for a pizza or burger item. Mirrors calcPrice's dispatch
 * shape in pizzaUtils.js.
 */
export function calculateCalories(item) {
  if (item?.type === 'burger') return calculateBurgerCalories(item);
  return calculatePizzaCalories(item);
}

/**
 * Full nutrition breakdown (weight/calories/protein/carbs/fat) for a pizza
 * or burger item.
 */
export function calculateNutrition(item) {
  if (item?.type === 'burger') return calculateBurgerNutrition(item);
  return calculatePizzaNutrition(item);
}

export function formatCalories(kcal) {
  return `${Math.round(kcal ?? 0)} kcal`;
}
