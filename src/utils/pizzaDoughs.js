/**
 * Pizza dough/base catalog.
 *
 * IDs MUST match PizzaCanvas.jsx and the values stored in pizza objects
 * in localStorage — do NOT rename them.
 *
 * The dough price is the starting price of a pizza (base + crust + preparation).
 * All toppings (sauce, cheese, meats, vegetables) are added on top.
 *
 * Scalable: burger buns, wrap bases, or combo bases follow the same shape.
 *
 * Nutrition: values below are the exact figures from the provided nutrition
 * specification (never estimated). 'americanp' = "American Cheese Crust" and
 * 'american' = "Sausage Cheese Crust" map 1:1 to spec entries of the same
 * name. 'thin' ("Classic Thin Crust") has no size selector of its own here —
 * its base weight/calories default to the spec's 33cm size; see
 * `pizzaSizes.js` for the 26cm/40cm variants used by the size selector in the
 * builder, which override this default when a size is chosen.
 */

export const PIZZA_DOUGHS = [
  { id: 'thin',      name: 'Classic Thin Crust', price: 7.00, type: 'classic',   weight: 260, calories: 620,  protein: null, carbs: null, fat: null },
  { id: 'americanp', name: 'Cheese Crust',        price: 8.00, type: 'premium',   weight: 260, calories: 780,  protein: null, carbs: null, fat: null },
  { id: 'american',  name: 'Sausage Crust',       price: 9.00, type: 'signature', weight: 390, calories: 1120, protein: null, carbs: null, fat: null },
];

/** O(1) lookup: doughId → dough object */
export const DOUGHS_BY_ID = Object.fromEntries(
  PIZZA_DOUGHS.map(d => [d.id, d])
);
