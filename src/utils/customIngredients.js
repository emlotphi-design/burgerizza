/**
 * Helpers for merging admin-created custom ingredients (custom_ingredients
 * table, via CustomIngredientsContext) into the existing hardcoded pizza /
 * burger ingredient catalogs and canvases.
 *
 * category determines which builder(s) a row belongs to:
 *   dough                          -> pizza only
 *   bun                            -> burger only
 *   sauce / cheese / meat / vegetable -> pizza + burger
 */

export const CATEGORY_BUILDERS = {
  dough:     ['pizza'],
  bun:       ['burger'],
  sauce:     ['pizza', 'burger'],
  cheese:    ['pizza', 'burger'],
  meat:      ['pizza', 'burger'],
  vegetable: ['pizza', 'burger'],
};

export const CATEGORY_LABELS = {
  dough:     'Dough',
  sauce:     'Sauce',
  cheese:    'Cheese',
  meat:      'Meat',
  vegetable: 'Vegetables',
  bun:       'Bun',
};

export function buildersForCategory(category) {
  return CATEGORY_BUILDERS[category] ?? [];
}

export function forBuilder(rows, builder) {
  return rows.filter(row => buildersForCategory(row.category).includes(builder));
}

/** Shape expected by the admin Ingredients.jsx IngredientCard / grouping code. */
export function toAdminIngredient(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    isVegan: false,
    isSpicy: false,
    tags: [],
  };
}
