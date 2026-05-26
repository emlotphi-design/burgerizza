export const LABEL = {
  american: 'Würstchenrand', americanp: 'Käserand', thin: 'Dünn',
  bbq: 'BBQ', garlic: 'Knoblauch', ketchup: 'Ketchup', pestos: 'Pesto', spicy: 'Spicy',
  mozzarella: 'Mozzarella', chedar: 'Cheddar', gouda: 'Gouda',
  pepperoni: 'Pepperoni', salami: 'Salami', bacon: 'Bacon', chicken: 'Chicken',
  meatball: 'Meatball', beefhum: 'Beef Ham', fleisch: 'Fleisch',
  turkeyhum: 'Turkey Ham', cheesesausage: 'Cheese Sausage',
  mushroom: 'Mushroom', bellpepper: 'Bell Pepper', sweetcorn: 'Sweet Corn',
  cherrytomato: 'Cherry Tomato', redonion: 'Red Onion', broccoli: 'Broccoli',
  eggplant: 'Eggplant', zucchini: 'Zucchini', dicedtomato: 'Diced Tomato',
  greenolives: 'Green Olives', blackolive: 'Black Olive', babyspinach: 'Baby Spinach',
  bluecheese: 'Blue Cheese', pestocheese: 'Pesto Cheese',
};

export const BASE_PRICE = 10.99;
export const CHEESE_ADD = 1.50;
export const MEAT_ADD   = 1.20;
export const VEG_ADD    = 0.80;

export function calcPrice(pizza) {
  return BASE_PRICE + CHEESE_ADD + pizza.meats.length * MEAT_ADD + pizza.vegetables.length * VEG_ADD;
}
