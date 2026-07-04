/**
 * Pizza size variants — only applicable to the 'thin' (Classic Thin Crust)
 * dough, per the exact nutrition specification provided. The visual builder
 * has no size selector of its own (see PizzaCanvas.jsx), so this is a
 * nutrition-only dimension layered on top of the existing dough choice; it
 * does not affect pricing or the pizza graphic.
 */

export const PIZZA_SIZES = [
  { id: '26', label: '26cm', weight: 180, calories: 430, protein: null, carbs: null, fat: null },
  { id: '33', label: '33cm', weight: 260, calories: 620, protein: null, carbs: null, fat: null },
  { id: '40', label: '40cm', weight: 380, calories: 900, protein: null, carbs: null, fat: null },
];

export const DEFAULT_PIZZA_SIZE = '33';

/** O(1) lookup: sizeId → size object */
export const SIZES_BY_ID = Object.fromEntries(
  PIZZA_SIZES.map(s => [s.id, s])
);
