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
 */

export const PIZZA_DOUGHS = [
  { id: 'thin',      name: 'Classic Thin Crust', price: 7.00, type: 'classic'   },
  { id: 'americanp', name: 'Cheese Crust',        price: 8.00, type: 'premium'   },
  { id: 'american',  name: 'Sausage Crust',       price: 9.00, type: 'signature' },
];

/** O(1) lookup: doughId → dough object */
export const DOUGHS_BY_ID = Object.fromEntries(
  PIZZA_DOUGHS.map(d => [d.id, d])
);
