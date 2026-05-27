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
  { id: 'b-cheddar',    name: 'Cheddar',     price: 1.49, category: 'cheese', color: '#F5B800', layerColor: 'linear-gradient(180deg, #FFCC00 0%, #E5A800 100%)', image: null },
  { id: 'b-mozzarella', name: 'Mozzarella',  price: 1.49, category: 'cheese', color: '#F0EAD6', layerColor: 'linear-gradient(180deg, #FAF4E0 0%, #E0DAC6 100%)', image: null },
  { id: 'b-gouda',      name: 'Gouda',       price: 1.49, category: 'cheese', color: '#E8C060', layerColor: 'linear-gradient(180deg, #F8D070 0%, #D8B050 100%)', image: null },
  { id: 'b-bluecheese', name: 'Blue Cheese', price: 1.99, category: 'cheese', color: '#7B88CC', layerColor: 'linear-gradient(180deg, #8B98DC 0%, #6B78BC 100%)', image: null },
  { id: 'b-swiss',      name: 'Swiss',       price: 1.49, category: 'cheese', color: '#F5F0C0', layerColor: 'linear-gradient(180deg, #FFFADA 0%, #E5E0AA 100%)', image: null },
];

export const BURGER_SAUCES = [
  { id: 'ketchup',       name: 'Ketchup',        price: 0.49, category: 'sauce', color: '#CC1100' },
  { id: 'mayonnaise',    name: 'Mayonnaise',      price: 0.49, category: 'sauce', color: '#E8E0A0' },
  { id: 'mustard',       name: 'Mustard',         price: 0.49, category: 'sauce', color: '#E8C030' },
  { id: 'picklesauce',   name: 'Pickle Sauce',    price: 0.79, category: 'sauce', color: '#5D8A3C' },
  { id: 'mushroomsauce', name: 'Mushroom Sauce',  price: 0.79, category: 'sauce', color: '#8B7355' },
];

export const BURGER_VEGETABLES = [
  { id: 'b-lettuce',    name: 'Lettuce',     price: 0.79, category: 'vegetable', color: '#4A8C3F', layerColor: 'rgba(74,140,63,0.75)',   image: null },
  { id: 'b-tomato',     name: 'Tomato',      price: 0.79, category: 'vegetable', color: '#CC3300', layerColor: 'rgba(204,51,0,0.75)',    image: null },
  { id: 'b-onion',      name: 'Onion',       price: 0.79, category: 'vegetable', color: '#C8A8D8', layerColor: 'rgba(200,168,216,0.75)', image: null },
  { id: 'b-pickles',    name: 'Pickles',     price: 0.79, category: 'vegetable', color: '#5D8A3C', layerColor: 'rgba(93,138,60,0.75)',   image: null },
  { id: 'b-red-onion',  name: 'Red Onion',   price: 0.79, category: 'vegetable', color: '#9B3060', layerColor: 'rgba(155,48,96,0.75)',   image: null },
  { id: 'b-jalapeno',   name: 'Jalapeño',    price: 0.99, category: 'vegetable', color: '#2A8A2A', layerColor: 'rgba(42,138,42,0.75)',   image: null },
  { id: 'b-mushroom',   name: 'Mushroom',    price: 0.99, category: 'vegetable', color: '#8B7355', layerColor: 'rgba(139,115,85,0.75)', image: null },
  { id: 'b-bellpepper', name: 'Bell Pepper', price: 0.99, category: 'vegetable', color: '#D44020', layerColor: 'rgba(212,64,32,0.75)',   image: null },
  { id: 'b-avocado',    name: 'Avocado',     price: 1.49, category: 'vegetable', color: '#5A8A3A', layerColor: 'rgba(90,138,58,0.75)',   image: null },
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
