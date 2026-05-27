/**
 * Canonical pizza ingredient catalog.
 *
 * IDs marked [visual] are used by PizzaCanvas.jsx and stored in pizza objects
 * in localStorage — they MUST NOT be renamed or removed.
 *
 * Non-visual IDs are future menu items ready to activate once assets are added.
 */

export const PIZZA_INGREDIENTS = [

  // ── DOUGHS ─ price: 0 (absorbed into BASE_PIZZA_PRICE) ──────────────────
  { id: 'american',  name: 'Sausage Crust', category: 'dough', price: 0.00, isVegan: false, isSpicy: false, tags: [] },            // [visual]
  { id: 'americanp', name: 'Cheese Crust',  category: 'dough', price: 0.00, isVegan: false, isSpicy: false, tags: [] },            // [visual]
  { id: 'thin',      name: 'Thin Crust',    category: 'dough', price: 0.00, isVegan: true,  isSpicy: false, tags: ['classic'] },   // [visual]

  // ── SAUCES ───────────────────────────────────────────────────────────────
  { id: 'bbq',                  name: 'BBQ Sauce',            category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['smoky'] },              // [visual]
  { id: 'garlic',               name: 'Garlic in Oil',        category: 'sauce', price: 0.39, isVegan: true,  isSpicy: false, tags: [] },                     // [visual]
  { id: 'ketchup',              name: 'Tomato Ketchup Vegan', category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['classic', 'vegan'] },   // [visual]
  { id: 'pestos',               name: 'Basil Pesto',          category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['italian'] },            // [visual]
  { id: 'spicy',                name: 'Spicy Sauce',          category: 'sauce', price: 1.29, isVegan: true,  isSpicy: true,  tags: ['hot'] },                // [visual]
  { id: 'burgersauce',          name: 'Burger Sauce',         category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [] },
  { id: 'cocktailsauce',        name: 'Cocktail Sauce',       category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [] },
  { id: 'curry-sauce-vegan',    name: 'Curry Sauce Vegan',    category: 'sauce', price: 1.29, isVegan: true,  isSpicy: true,  tags: ['vegan'] },
  { id: 'danish-tartar-sauce',  name: 'Danish Tartar Sauce',  category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [] },
  { id: 'hollandaise-sauce',    name: 'Hollandaise Sauce',    category: 'sauce', price: 1.29, isVegan: false, isSpicy: false, tags: [] },
  { id: 'jalapeno-lime-sauce',  name: 'Jalapeño Lime Sauce',  category: 'sauce', price: 1.49, isVegan: true,  isSpicy: true,  tags: ['hot', 'vegan'] },
  { id: 'teriyaki-sauce-vegan', name: 'Teriyaki Sauce Vegan', category: 'sauce', price: 1.29, isVegan: true,  isSpicy: false, tags: ['vegan'] },
  { id: 'herbed-remoulade',     name: 'Herbed Remoulade',     category: 'sauce', price: 1.89, isVegan: false, isSpicy: false, tags: [] },

  // ── CHEESES ──────────────────────────────────────────────────────────────
  { id: 'mozzarella',           name: 'Mozzarella',           category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['classic', 'italian'] }, // [visual]
  { id: 'chedar',               name: 'Cheddar',              category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: [] },                     // [visual]
  { id: 'gouda',                name: 'Gouda',                category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: [] },                     // [visual]
  { id: 'italian-hard-cheese',  name: 'Italian Hard Cheese',  category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['italian'] },
  { id: 'vegan-cheese',         name: 'Vegan Cheese',         category: 'cheese', price: 1.99, isVegan: true,  isSpicy: false, tags: ['vegan'] },
  { id: 'mozzarella-ball',      name: 'Mozzarella Ball',      category: 'cheese', price: 1.99, isVegan: false, isSpicy: false, tags: ['italian', 'premium'] },

  // ── MEATS ────────────────────────────────────────────────────────────────
  { id: 'pepperoni',              name: 'Pepperoni',              category: 'meat', price: 1.89, isVegan: false, isSpicy: true,  tags: ['spicy', 'classic'] }, // [visual]
  { id: 'salami',                 name: 'Salami (Pork)',          category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['classic'] },          // [visual]
  { id: 'bacon',                  name: 'Bacon',                  category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['classic'] },          // [visual]
  { id: 'chicken',                name: 'Chicken Kebab',          category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'meatball',               name: 'Meatball',               category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'beefhum',                name: 'Beef Ham',               category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'fleisch',                name: 'Mixed Meat',             category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'turkeyhum',              name: 'Turkey Ham',             category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'cheesesausage',          name: 'Cheese Sausage',         category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },                   // [visual]
  { id: 'mexican-pulled-chicken', name: 'Mexican Pulled Chicken', category: 'meat', price: 2.19, isVegan: false, isSpicy: true,  tags: ['spicy', 'mexican'] },
  { id: 'chicken-breast-strips',  name: 'Chicken Breast Strips',  category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: [] },
  { id: 'vegan-filet',            name: 'Vegan Filet',            category: 'meat', price: 2.19, isVegan: true,  isSpicy: false, tags: ['vegan'] },
  { id: 'beef-crumble',           name: 'Beef Crumble',           category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: ['premium'] },
  { id: 'vegan-soy-salami',       name: 'Vegan Soy Salami',       category: 'meat', price: 2.19, isVegan: true,  isSpicy: false, tags: ['vegan'] },
  { id: 'sujuk',                  name: 'Sujuk',                  category: 'meat', price: 1.89, isVegan: false, isSpicy: true,  tags: ['spicy', 'turkish'] },
  { id: 'tuna',                   name: 'Tuna',                   category: 'meat', price: 2.19, isVegan: false, isSpicy: false, tags: ['seafood'] },
  { id: 'sausages-pork',          name: 'Sausages (Pork)',        category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: [] },
  { id: 'prosciutto-cotto',       name: 'Prosciutto Cotto',       category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['italian'] },
  { id: 'new-york-salami',        name: 'New York Style Salami',  category: 'meat', price: 1.89, isVegan: false, isSpicy: false, tags: ['american'] },

  // ── VEGETABLES ───────────────────────────────────────────────────────────
  { id: 'mushroom',         name: 'Mushrooms',       category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'] },         // [visual]
  { id: 'bellpepper',       name: 'Bell Pepper',     category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'] },         // [visual]
  { id: 'sweetcorn',        name: 'Sweet Corn',      category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'] },         // [visual]
  { id: 'cherrytomato',     name: 'Cherry Tomatoes', category: 'vegetable', price: 1.89, isVegan: true,  isSpicy: false, tags: ['italian'] },         // [visual]
  { id: 'redonion',         name: 'Red Onions',      category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },                  // [visual]
  { id: 'broccoli',         name: 'Broccoli',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },                  // [visual]
  { id: 'eggplant',         name: 'Eggplant',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },                  // [visual]
  { id: 'zucchini',         name: 'Zucchini',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['italian'] },         // [visual]
  { id: 'dicedtomato',      name: 'Tomatoes',        category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['classic'] },         // [visual]
  { id: 'greenolives',      name: 'Green Olives',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['mediterranean'] },  // [visual]
  { id: 'blackolive',       name: 'Black Olives',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['mediterranean'] },  // [visual]
  { id: 'babyspinach',      name: 'Baby Spinach',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: ['healthy'] },        // [visual]
  { id: 'bluecheese',       name: 'Blue Cheese',     category: 'vegetable', price: 1.99, isVegan: false, isSpicy: false, tags: ['premium'] },        // [visual]
  { id: 'pestocheese',      name: 'Pesto Cheese',    category: 'vegetable', price: 1.49, isVegan: false, isSpicy: false, tags: ['italian'] },        // [visual]
  { id: 'pineapple',        name: 'Pineapple',       category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },
  { id: 'pickled-gherkins', name: 'Pickled Gherkins',category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },
  { id: 'spring-onions',    name: 'Spring Onions',   category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },
  { id: 'jalapeno-mix',     name: 'Jalapeño Mix',    category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: true,  tags: ['hot', 'spicy'] },
  { id: 'roasted-onions',   name: 'Roasted Onions',  category: 'vegetable', price: 1.49, isVegan: true,  isSpicy: false, tags: [] },

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
