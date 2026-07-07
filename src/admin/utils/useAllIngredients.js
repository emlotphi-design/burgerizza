import { useCustomIngredients } from '../../context/CustomIngredientsContext';
import { PIZZA_DOUGHS } from '../../utils/pizzaDoughs';
import { PIZZA_INGREDIENTS } from '../../utils/pizzaIngredients';
import { ALL_BURGER_INGREDIENTS } from '../../features/burger/utils/burgerData';
import { PIZZA_PREVIEW_IMAGES, BURGER_PREVIEW_IMAGES } from '../utils/ingredientImages';
import { forBuilder, toAdminIngredient } from '../../utils/customIngredients';

/* Normalise pizza data — use real dough prices from PIZZA_DOUGHS */
const PIZZA_ADMIN_LIST = [
  ...PIZZA_DOUGHS.map(d => ({
    id: d.id, name: d.name, category: 'dough',
    price: d.price, isVegan: false, isSpicy: false, tags: [],
  })),
  ...PIZZA_INGREDIENTS.filter(i => i.category !== 'dough'),
];

/**
 * The merged "real" (has a resolved image) pizza/burger ingredient lists —
 * static catalogs + admin-created custom_ingredients — shared by
 * Ingredients.jsx and the Inventory Consumption Mapping tab so both read the
 * exact same set of selectable ingredients without duplicating the merge.
 */
export function useAllIngredients() {
  const { customIngredients } = useCustomIngredients();

  const customPizzaImages  = Object.fromEntries(forBuilder(customIngredients, 'pizza').map(r => [r.id, r.image_url]));
  const customBurgerImages = Object.fromEntries(forBuilder(customIngredients, 'burger').map(r => [r.id, r.image_url]));
  const pizzaImages  = { ...PIZZA_PREVIEW_IMAGES,  ...customPizzaImages };
  const burgerImages = { ...BURGER_PREVIEW_IMAGES, ...customBurgerImages };

  // Drop the old asset-less catalog stubs ("No Asset" placeholders) — only
  // ingredients with a resolved image are real, selectable ingredients.
  const pizzaList = [
    ...PIZZA_ADMIN_LIST.filter(i => pizzaImages[i.id]),
    ...forBuilder(customIngredients, 'pizza').map(toAdminIngredient),
  ];
  const burgerList = [
    ...ALL_BURGER_INGREDIENTS.filter(i => burgerImages[i.id]),
    ...forBuilder(customIngredients, 'burger').map(toAdminIngredient),
  ];

  return { pizzaList, burgerList, pizzaImages, burgerImages };
}
