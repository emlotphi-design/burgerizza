import { calculatePizzaPrice } from './pizzaPriceUtils';
import { calcBurgerPrice } from '../features/burger/utils/burgerUtils';

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

export function calcPrice(item) {
  if (item?.type === 'burger') return calcBurgerPrice(item);
  return calculatePizzaPrice(item);
}
