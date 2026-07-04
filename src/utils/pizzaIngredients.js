/**
 * Canonical pizza ingredient catalog.
 *
 * IDs marked [visual] are used by PizzaCanvas.jsx and stored in pizza objects
 * in localStorage — they MUST NOT be renamed or removed.
 *
 * Non-visual IDs are future menu items ready to activate once assets are added.
 *
 * Nutrition fields (weight/calories/protein/carbs/fat) — added for the
 * Nutrition & Calories system. `calories: 0` + `weight: null` means no
 * verified nutrition figure has been provided yet for that item (per
 * instruction, values are never estimated/invented — only entries matching
 * the provided nutrition specification carry real numbers). protein/carbs/fat
 * stay `null` everywhere until that data is supplied; the fields exist now so
 * no schema change is needed later.
 */

export const PIZZA_INGREDIENTS = [

  // ── DOUGHS ─ price: 0 (absorbed into BASE_PIZZA_PRICE) ──────────────────
  { id: 'american',  name: 'Sausage Crust', category: 'dough', price: 0.00, isVegan: false, isSpicy: false, tags: [], weight: 390, calories: 1120, protein: null, carbs: null, fat: null },            // [visual]
  { id: 'americanp', name: 'Cheese Crust',  category: 'dough', price: 0.00, isVegan: false, isSpicy: false, tags: [], weight: 260, calories: 780,  protein: null, carbs: null, fat: null },            // [visual]
  { id: 'thin',      name: 'Thin Crust',    category: 'dough', price: 0.00, isVegan: true,  isSpicy: false, tags: ['classic'], weight: 260, calories: 620, protein: null, carbs: null, fat: null },   // [visual] — default size 33cm; see pizzaSizes.js for 26/40cm variants

  // ── SAUCES ───────────────────────────────────────────────────────────────
  { id: 'bbq',                  name: 'BBQ Sauce',            category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['smoky'], weight: 55, calories: 110, protein: null, carbs: null, fat: null },              // [visual]
  { id: 'garlic',               name: 'Garlic in Oil',        category: 'sauce', price: 0.39, isVegan: true,  isSpicy: false, tags: [], weight: 55, calories: 170, protein: null, carbs: null, fat: null },                     // [visual]
  { id: 'ketchup',              name: 'Tomato Ketchup Vegan', category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['classic', 'vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },   // [visual]
  { id: 'pestos',               name: 'Basil Pesto',          category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['italian'], weight: 50, calories: 240, protein: null, carbs: null, fat: null },            // [visual]
  { id: 'spicy',                name: 'Spicy Sauce',          category: 'sauce', price: 1.29, isVegan: true,  isSpicy: true,  tags: ['hot'], weight: null, calories: 0, protein: null, carbs: null, fat: null },                // [visual]
  { id: 'burgersauce',          name: 'Burger Sauce',         category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'cocktailsauce',        name: 'Cocktail Sauce',       category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'curry-sauce-vegan',    name: 'Curry Sauce Vegan',    category: 'sauce', price: 1.29, isVegan: true,  isSpicy: true,  tags: ['vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'danish-tartar-sauce',  name: 'Danish Tartar Sauce',  category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'hollandaise-sauce',    name: 'Hollandaise Sauce',    category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'jalapeno-lime-sauce',  name: 'Jalapeño Lime Sauce',  category: 'sauce', price: 1.49, isVegan: true,  isSpicy: true,  tags: ['hot', 'vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'teriyaki-sauce-vegan', name: 'Teriyaki Sauce Vegan', category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'herbed-remoulade',     name: 'Herbed Remoulade',     category: 'sauce', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },

  // ── CHEESES ──────────────────────────────────────────────────────────────
  { id: 'mozzarella',           name: 'Mozzarella',           category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['classic', 'italian'], weight: 120, calories: 340, protein: null, carbs: null, fat: null }, // [visual]
  { id: 'chedar',               name: 'Cheddar',              category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: [], weight: 90, calories: 360, protein: null, carbs: null, fat: null },                     // [visual]
  { id: 'gouda',                name: 'Gouda',                category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },                     // [visual]
  { id: 'italian-hard-cheese',  name: 'Italian Hard Cheese',  category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['italian'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'vegan-cheese',         name: 'Vegan Cheese',         category: 'cheese', price: 1.99, isVegan: true,  isSpicy: false, tags: ['vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'mozzarella-ball',      name: 'Mozzarella Ball',      category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['italian', 'premium'], weight: null, calories: 0, protein: null, carbs: null, fat: null },

  // ── MEATS ────────────────────────────────────────────────────────────────
  { id: 'pepperoni',              name: 'Pepperoni',              category: 'meat', price: 1.89, isVegan: false, isSpicy: true,  tags: ['spicy', 'classic'], weight: 50, calories: 250, protein: null, carbs: null, fat: null }, // [visual]
  { id: 'salami',                 name: 'Salami (Pork)',          category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['classic'], weight: null, calories: 0, protein: null, carbs: null, fat: null },          // [visual]
  { id: 'bacon',                  name: 'Bacon',                  category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['classic'], weight: 45, calories: 240, protein: null, carbs: null, fat: null },          // [visual]
  { id: 'chicken',                name: 'Chicken Kebab',          category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },                   // [visual]
  { id: 'meatball',               name: 'Meatball',               category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: 70, calories: 210, protein: null, carbs: null, fat: null },                   // [visual]
  { id: 'beefhum',                name: 'Beef Ham',               category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },                   // [visual]
  { id: 'fleisch',                name: 'Mixed Meat',             category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },                   // [visual]
  { id: 'turkeyhum',              name: 'Turkey Ham',             category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: 60, calories: 90, protein: null, carbs: null, fat: null },                    // [visual]
  { id: 'cheesesausage',          name: 'Cheese Sausage',         category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },                   // [visual]
  { id: 'mexican-pulled-chicken', name: 'Mexican Pulled Chicken', category: 'meat', price: 2.19, isVegan: false, isSpicy: true,  tags: ['spicy', 'mexican'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'chicken-breast-strips',  name: 'Chicken Breast Strips',  category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: [], weight: 70, calories: 130, protein: null, carbs: null, fat: null },
  { id: 'vegan-filet',            name: 'Vegan Filet',            category: 'meat', price: 2.19, isVegan: true,  isSpicy: false, tags: ['vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'beef-crumble',           name: 'Beef Crumble',           category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: ['premium'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'vegan-soy-salami',       name: 'Vegan Soy Salami',       category: 'meat', price: 2.19, isVegan: true,  isSpicy: false, tags: ['vegan'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'sujuk',                  name: 'Sujuk',                  category: 'meat', price: 1.89, isVegan: false, isSpicy: true,  tags: ['spicy', 'turkish'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'tuna',                   name: 'Tuna',                   category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: ['seafood'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'sausages-pork',          name: 'Sausages (Pork)',        category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [], weight: 60, calories: 190, protein: null, carbs: null, fat: null },
  { id: 'prosciutto-cotto',       name: 'Prosciutto Cotto',       category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['italian'], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'new-york-salami',        name: 'New York Style Salami',  category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['american'], weight: null, calories: 0, protein: null, carbs: null, fat: null },

  // ── VEGETABLES ───────────────────────────────────────────────────────────
  { id: 'mushroom',         name: 'Mushrooms',       category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'], weight: 40, calories: 10, protein: null, carbs: null, fat: null },         // [visual]
  { id: 'bellpepper',       name: 'Bell Pepper',     category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'], weight: 35, calories: 12, protein: null, carbs: null, fat: null },         // [visual]
  { id: 'sweetcorn',        name: 'Sweet Corn',      category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'], weight: 40, calories: 38, protein: null, carbs: null, fat: null },         // [visual]
  { id: 'cherrytomato',     name: 'Cherry Tomatoes', category: 'vegetable', price: 1.89, isVegan: true,  isSpicy: false, tags: ['italian'], weight: 35, calories: 8, protein: null, carbs: null, fat: null },          // [visual]
  { id: 'redonion',         name: 'Red Onions',      category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: 30, calories: 12, protein: null, carbs: null, fat: null },                  // [visual] — spec lists generic "Onion"; applied here as closest match
  { id: 'broccoli',         name: 'Broccoli',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: 40, calories: 14, protein: null, carbs: null, fat: null },                  // [visual]
  { id: 'eggplant',         name: 'Eggplant',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: 40, calories: 18, protein: null, carbs: null, fat: null },                  // [visual]
  { id: 'zucchini',         name: 'Zucchini',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['italian'], weight: 40, calories: 12, protein: null, carbs: null, fat: null },         // [visual]
  { id: 'dicedtomato',      name: 'Tomatoes',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'], weight: null, calories: 0, protein: null, carbs: null, fat: null },        // [visual]
  { id: 'greenolives',      name: 'Green Olives',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['mediterranean'], weight: 35, calories: 50, protein: null, carbs: null, fat: null },   // [visual]
  { id: 'blackolive',       name: 'Black Olives',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['mediterranean'], weight: 35, calories: 55, protein: null, carbs: null, fat: null },   // [visual]
  { id: 'babyspinach',      name: 'Baby Spinach',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['healthy'], weight: 30, calories: 7, protein: null, carbs: null, fat: null },          // [visual]
  { id: 'bluecheese',       name: 'Blue Cheese',     category: 'vegetable', price: 1.99, isVegan: false, isSpicy: false, tags: ['premium'], weight: 45, calories: 160, protein: null, carbs: null, fat: null },        // [visual]
  { id: 'pestocheese',      name: 'Pesto Cheese',    category: 'vegetable', price: 1.49, isVegan: false, isSpicy: false, tags: ['italian'], weight: null, calories: 0, protein: null, carbs: null, fat: null },        // [visual]
  { id: 'pineapple',        name: 'Pineapple',       category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'pickled-gherkins', name: 'Pickled Gherkins',category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'spring-onions',    name: 'Spring Onions',   category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'jalapeno-mix',     name: 'Jalapeño Mix',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: true,  tags: ['hot', 'spicy'], weight: 25, calories: 8, protein: null, carbs: null, fat: null },
  { id: 'roasted-onions',   name: 'Roasted Onions',  category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [], weight: null, calories: 0, protein: null, carbs: null, fat: null },

  // ── EXTRAS ───────────────────────────────────────────────────────────────
  // Condiments and sides separate from the main topping categories.
  // 'garlic' in the sauce list above = "Garlic in Oil" (visual builder ID preserved).

  /*
   * Future ingredients — assets not yet in visual builder:
   *   parmesan      | cheese    | 1.99
   *   avocado       | vegetable | 1.49
   *   rucola        | vegetable | 1.49
   *   spicy-oil     | extra     | 0.39
   */
];

/** O(1) lookup: id → ingredient */
export const INGREDIENTS_BY_ID = Object.fromEntries(
  PIZZA_INGREDIENTS.map(ing => [ing.id, ing])
);

/** Grouped by category for menu/UI rendering */
export const INGREDIENTS_BY_CATEGORY = PIZZA_INGREDIENTS.reduce((acc, ing) => {
  (acc[ing.category] ??= []).push(ing);
  return acc;
}, {});
