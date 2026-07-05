/**
 * Pizza size variants — labels/ids only. `PIZZA_SIZES`/`SIZES_BY_ID` stay
 * as the id → label lookup used by display code (Cart, Checkout, Kitchen,
 * Admin Orders all just need "which size is this and what's it called").
 *
 * Per-dough availability, price surcharge, calories, and weight are
 * database-driven — see `DOUGH_SIZES_BY_ID` below and
 * `src/context/PizzaSizeConfigContext.jsx`, which mutates it in place from
 * the `pizza_size_config` table (same "static object, live-synced" trick
 * IngredientConfigContext/NutritionConfigContext already use). These
 * constants are only the resilience fallback for when Supabase is
 * unreachable, matching every other config system in this codebase.
 */

export const PIZZA_SIZES = [
  { id: '26', label: '26cm' },
  { id: '33', label: '33cm' },
  { id: '40', label: '40cm' },
];

export const DEFAULT_PIZZA_SIZE = '33';

/** O(1) lookup: sizeId → { id, label } */
export const SIZES_BY_ID = Object.fromEntries(
  PIZZA_SIZES.map(s => [s.id, s])
);

/** The three dough ids that carry a size selector (see pizzaDoughs.js). */
export const SIZED_DOUGH_IDS = ['thin', 'americanp', 'american'];

const FALLBACK_SIZE_DATA = {
  26: { price: 0, calories: 430, weight: 180 },
  33: { price: 0, calories: 620, weight: 260 },
  40: { price: 0, calories: 900, weight: 380 },
};

/**
 * doughId → sizeId → { label, price, calories, weight, enabled, sortOrder }
 * Seeded identically across all three doughs (matches pre-database-driven
 * behavior exactly); `PizzaSizeConfigContext` overwrites these fields in
 * place once the real per-dough config loads from Supabase.
 */
export const DOUGH_SIZES_BY_ID = Object.fromEntries(
  SIZED_DOUGH_IDS.map(dough => [
    dough,
    Object.fromEntries(
      PIZZA_SIZES.map((s, i) => [
        s.id,
        {
          label:     s.label,
          price:     FALLBACK_SIZE_DATA[s.id].price,
          calories:  FALLBACK_SIZE_DATA[s.id].calories,
          weight:    FALLBACK_SIZE_DATA[s.id].weight,
          enabled:   true,
          sortOrder: i,
        },
      ]),
    ),
  ]),
);
