/**
 * Nutrition fields (weight/calories/protein/carbs/fat) — added for the
 * Nutrition & Calories system. No verified nutrition spec has been provided
 * for burger ingredients yet, so `calories: 0` / `weight: null` here means
 * "not yet supplied" (never estimated). Admins can fill in real values from
 * the Ingredients admin page; the live calorie counter will reflect them
 * immediately once set.
 */

export const BURGER_BUNS = [
  { id: 'classicbun',  name: 'Classic Bun',   price: 2.99, category: 'bun', color: '#D4944A', baseWidth: '36%', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'classicbun2', name: 'Classic Bun II', price: 2.99, category: 'bun', color: '#D4944A', baseWidth: '41%', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'charcoalbun', name: 'Charcoal Bun',  price: 3.49, category: 'bun', color: '#3A3A3A', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'beetrootbun', name: 'Beetroot Bun',  price: 3.49, category: 'bun', color: '#8B1A4A', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'parsleybun',  name: 'Parsley Bun',   price: 2.99, category: 'bun', color: '#5A8A3A', weight: null, calories: 0, protein: null, carbs: null, fat: null },
];

export const BURGER_MEATS = [
  { id: 'chicken',      name: 'Chicken',       price: 3.49, category: 'meat', color: '#C8863A', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'bacon',        name: 'Bacon',         price: 1.89, category: 'meat', color: '#9B2335', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'friedchicken', name: 'Fried Chicken', price: 3.99, category: 'meat', color: '#C8A030', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'beef',         name: 'Beef',          price: 3.99, category: 'meat', color: '#6B3A1F', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'beefpatty',    name: 'Beef Patty',    price: 4.49, category: 'meat', color: '#5A2E12', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'egg',          name: 'Egg',           price: 1.49, category: 'meat', color: '#F5D060', weight: null, calories: 0, protein: null, carbs: null, fat: null },
];

export const BURGER_CHEESES = [
  { id: 'cheddar', name: 'Cheddar', price: 1.49, category: 'cheese', color: '#F5B800', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'edam',    name: 'Edam',    price: 1.49, category: 'cheese', color: '#E8B040', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'gouda',   name: 'Gouda',   price: 1.49, category: 'cheese', color: '#E8C060', hasQty: true, weight: null, calories: 0, protein: null, carbs: null, fat: null },
];

export const BURGER_SAUCES = [
  { id: 'ketchup',       name: 'Ketchup',        price: 0.49, category: 'sauce', color: '#CC1100', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'mayonnaise',    name: 'Mayonnaise',      price: 0.49, category: 'sauce', color: '#E8E0A0', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'mustard',       name: 'Mustard',         price: 0.49, category: 'sauce', color: '#E8C030', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'picklesauce',   name: 'Pickle Sauce',    price: 0.79, category: 'sauce', color: '#5D8A3C', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'mushroomsauce', name: 'Mushroom Sauce',  price: 0.79, category: 'sauce', color: '#8B7355', weight: null, calories: 0, protein: null, carbs: null, fat: null },
];

export const BURGER_VEGETABLES = [
  { id: 'tomato',   name: 'Tomato',   price: 0.79, category: 'vegetable', color: '#CC3300', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'onion',    name: 'Onion',    price: 0.79, category: 'vegetable', color: '#C8A8D8', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'lettuce',  name: 'Lettuce',  price: 0.79, category: 'vegetable', color: '#4A8C3F', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'mushroom', name: 'Mushroom', price: 0.99, category: 'vegetable', color: '#8B7355', weight: null, calories: 0, protein: null, carbs: null, fat: null },
  { id: 'pickle',   name: 'Pickle',   price: 0.79, category: 'vegetable', color: '#5D8A3C', weight: null, calories: 0, protein: null, carbs: null, fat: null },
];

export const ALL_BURGER_INGREDIENTS = [
  ...BURGER_BUNS,
  ...BURGER_MEATS,
  ...BURGER_CHEESES,
  ...BURGER_SAUCES,
  ...BURGER_VEGETABLES,
];

export const BURGER_INGREDIENTS_BY_ID = Object.fromEntries(
  ALL_BURGER_INGREDIENTS.map(ing => [ing.id, ing])
);
