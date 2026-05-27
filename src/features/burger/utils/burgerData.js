export const BURGER_BUNS = [
  { id: 'classicbun',  name: 'Classic Bun',   price: 2.99, category: 'bun', color: '#D4944A', baseWidth: '36%' },
  { id: 'classicbun2', name: 'Classic Bun II', price: 2.99, category: 'bun', color: '#D4944A', baseWidth: '41%' },
  { id: 'charcoalbun', name: 'Charcoal Bun',  price: 3.49, category: 'bun', color: '#3A3A3A' },
  { id: 'beetrootbun', name: 'Beetroot Bun',  price: 3.49, category: 'bun', color: '#8B1A4A' },
  { id: 'parsleybun',  name: 'Parsley Bun',   price: 2.99, category: 'bun', color: '#5A8A3A' },
];

export const BURGER_MEATS = [
  { id: 'chicken',      name: 'Chicken',       price: 3.49, category: 'meat', color: '#C8863A', hasQty: true },
  { id: 'bacon',        name: 'Bacon',         price: 1.89, category: 'meat', color: '#9B2335', hasQty: true },
  { id: 'friedchicken', name: 'Fried Chicken', price: 3.99, category: 'meat', color: '#C8A030', hasQty: true },
  { id: 'beef',         name: 'Beef',          price: 3.99, category: 'meat', color: '#6B3A1F', hasQty: true },
  { id: 'beefpatty',    name: 'Beef Patty',    price: 4.49, category: 'meat', color: '#5A2E12', hasQty: true },
  { id: 'egg',          name: 'Egg',           price: 1.49, category: 'meat', color: '#F5D060' },
];

export const BURGER_CHEESES = [
  { id: 'cheddar', name: 'Cheddar', price: 1.49, category: 'cheese', color: '#F5B800', hasQty: true },
  { id: 'edam',    name: 'Edam',    price: 1.49, category: 'cheese', color: '#E8B040', hasQty: true },
  { id: 'gouda',   name: 'Gouda',   price: 1.49, category: 'cheese', color: '#E8C060', hasQty: true },
];

export const BURGER_SAUCES = [
  { id: 'ketchup',       name: 'Ketchup',        price: 0.49, category: 'sauce', color: '#CC1100' },
  { id: 'mayonnaise',    name: 'Mayonnaise',      price: 0.49, category: 'sauce', color: '#E8E0A0' },
  { id: 'mustard',       name: 'Mustard',         price: 0.49, category: 'sauce', color: '#E8C030' },
  { id: 'picklesauce',   name: 'Pickle Sauce',    price: 0.79, category: 'sauce', color: '#5D8A3C' },
  { id: 'mushroomsauce', name: 'Mushroom Sauce',  price: 0.79, category: 'sauce', color: '#8B7355' },
];

export const BURGER_VEGETABLES = [
  { id: 'tomato',   name: 'Tomato',   price: 0.79, category: 'vegetable', color: '#CC3300' },
  { id: 'onion',    name: 'Onion',    price: 0.79, category: 'vegetable', color: '#C8A8D8' },
  { id: 'lettuce',  name: 'Lettuce',  price: 0.79, category: 'vegetable', color: '#4A8C3F' },
  { id: 'mushroom', name: 'Mushroom', price: 0.99, category: 'vegetable', color: '#8B7355' },
  { id: 'pickle',   name: 'Pickle',   price: 0.79, category: 'vegetable', color: '#5D8A3C' },
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
