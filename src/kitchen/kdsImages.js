/**
 * kdsImages.js — Kitchen Display System image maps
 *
 * Uses import.meta.glob to load all pizza assets at build time.
 * Missing files return null — components already guard against null layers/previews.
 */

// Load every pizza PNG once; key = relative path from this file
//
// `as: 'url'` is deprecated — worse, in a production build it makes Rollup
// store the whole module namespace object ({ default: [Getter] }) instead
// of the URL string, so every <img src> here resolved to "[object Object]"
// (broken icon) despite working fine against the dev server, which handles
// the deprecated option differently. `query: '?url', import: 'default'` is
// the modern equivalent and inlines the actual string in both modes.
const PIZZA_ASSETS = import.meta.glob(
  '../assets/pizzas/**/*.png',
  { eager: true, query: '?url', import: 'default' }
);

/** Safe asset lookup — returns null for any file that doesn't exist */
function pa(path) {
  return PIZZA_ASSETS[path] ?? null;
}

export const trayImg = pa('../assets/pizzas/base/full/tray-full.png');

export const PIZZA_DOUGHS = {
  american:  { label: 'Würstchenrand', full: pa('../assets/pizzas/base/full/american-full.png'),  preview: pa('../assets/pizzas/base/preview/american-preview.png')  },
  americanp: { label: 'Käserand',      full: pa('../assets/pizzas/base/full/americanp-full.png'), preview: pa('../assets/pizzas/base/preview/americanp-preview.png') },
  thin:      { label: 'Dünn',          full: pa('../assets/pizzas/base/full/thin-full.png'),      preview: pa('../assets/pizzas/base/preview/thin-preview.png')      },
};

export const PIZZA_SAUCES = {
  bbq:     { label: 'BBQ',       layer: pa('../assets/pizzas/sauces/saucelayers/bbq-layer.png'),     preview: pa('../assets/pizzas/sauces/saucespreview/bbq-preview.png'),     layerPct: 42 },
  garlic:  { label: 'Knoblauch', layer: pa('../assets/pizzas/sauces/saucelayers/garlic-layer.png'),  preview: pa('../assets/pizzas/sauces/saucespreview/garlic-preview.png'),  layerPct: 42 },
  ketchup: { label: 'Ketchup',   layer: pa('../assets/pizzas/sauces/saucelayers/ketchup-layer.png'), preview: pa('../assets/pizzas/sauces/saucespreview/ketchup-preview.png'), layerPct: 38 },
  pestos:  { label: 'Pesto',     layer: pa('../assets/pizzas/sauces/saucelayers/pestos-layer.png'),  preview: pa('../assets/pizzas/sauces/saucespreview/pestos-preview.png'),  layerPct: 42 },
  spicy:   { label: 'Spicy',     layer: pa('../assets/pizzas/sauces/saucelayers/spicy-layer.png'),   preview: pa('../assets/pizzas/sauces/saucespreview/spicy-preview.png'),   layerPct: 38 },
};

export const PIZZA_CHEESES = {
  mozzarella: { label: 'Mozzarella', layer: pa('../assets/pizzas/cheese/cheeselayers/mozzarella-layer.png'), preview: pa('../assets/pizzas/cheese/cheesepreview/mozzarella-preview.png'), offsetPct: 3 },
  chedar:     { label: 'Cheddar',    layer: pa('../assets/pizzas/cheese/cheeselayers/chedar-layer.png'),     preview: pa('../assets/pizzas/cheese/cheesepreview/chedar-preview.png')                 },
  gouda:      { label: 'Gouda',      layer: pa('../assets/pizzas/cheese/cheeselayers/gouda-layer.png'),      preview: pa('../assets/pizzas/cheese/cheesepreview/gouda-preview.png')                  },
};

export const PIZZA_MEATS = {
  pepperoni:     { label: 'Pepperoni',      layer: pa('../assets/pizzas/toppings/meatlayers/pepperoni-layer.png'),     preview: pa('../assets/pizzas/toppings/meat/pepperoni-preview.png'),     layerPct: 42 },
  salami:        { label: 'Salami',         layer: pa('../assets/pizzas/toppings/meatlayers/salami-layer.png'),        preview: pa('../assets/pizzas/toppings/meat/salami-preview.png'),        layerPct: 42 },
  bacon:         { label: 'Bacon',          layer: pa('../assets/pizzas/toppings/meatlayers/bacon-layer.png'),         preview: pa('../assets/pizzas/toppings/meat/bacon-preview.png'),         layerPct: 42 },
  chicken:       { label: 'Chicken',        layer: pa('../assets/pizzas/toppings/meatlayers/chicken-layer.png'),       preview: pa('../assets/pizzas/toppings/meat/chicken-preview.png'),       layerPct: 42 },
  meatball:      { label: 'Meatball',       layer: pa('../assets/pizzas/toppings/meatlayers/meatball-layer.png'),      preview: pa('../assets/pizzas/toppings/meat/meatball-preview.png'),      layerPct: 42 },
  beefhum:       { label: 'Beef Ham',       layer: pa('../assets/pizzas/toppings/meatlayers/beefhum-layer.png'),       preview: pa('../assets/pizzas/toppings/meat/beefhum-preview.png'),       layerPct: 42 },
  fleisch:       { label: 'Fleisch',        layer: pa('../assets/pizzas/toppings/meatlayers/fleisch-layer.png'),       preview: pa('../assets/pizzas/toppings/meat/fleisch-preview.png'),       layerPct: 36 },
  turkeyhum:     { label: 'Turkey Ham',     layer: pa('../assets/pizzas/toppings/meatlayers/turkeyhum-layer.png'),     preview: pa('../assets/pizzas/toppings/meat/turkeyhum-preview.png'),     layerPct: 42 },
  cheesesausage: { label: 'Cheese Sausage', layer: pa('../assets/pizzas/toppings/meatlayers/cheesesausage-layer.png'), preview: pa('../assets/pizzas/toppings/meat/cheesesausage-preview.png'), layerPct: 42 },
};

export const PIZZA_VEGETABLES = {
  mushroom:      { label: 'Mushroom',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/mushroom-layer.png'),     preview: pa('../assets/pizzas/toppings/vegetabales/mushroom-preview.png'),      layerPct: 42 },
  bellpepper:    { label: 'Bell Pepper',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/bellpepper-layer.png'),   preview: pa('../assets/pizzas/toppings/vegetabales/bellpepper-preview.png'),    layerPct: 50 },
  sweetcorn:     { label: 'Sweet Corn',     layer: pa('../assets/pizzas/toppings/vegetabalelayers/sweetcorn-layer.png'),    preview: pa('../assets/pizzas/toppings/vegetabales/sweetcorn-preview.png'),     layerPct: 42 },
  cherrytomato:  { label: 'Cherry Tomato',  layer: pa('../assets/pizzas/toppings/vegetabalelayers/cherrytomato-layer.png'), preview: pa('../assets/pizzas/toppings/vegetabales/cherrytomato-preview.png'),  layerPct: 42 },
  redonion:      { label: 'Red Onion',      layer: pa('../assets/pizzas/toppings/vegetabalelayers/red-onion-layer.png'),    preview: pa('../assets/pizzas/toppings/vegetabales/redonion-preview.png'),      layerPct: 50 },
  broccoli:      { label: 'Broccoli',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/broccoli-layer.png'),     preview: pa('../assets/pizzas/toppings/vegetabales/broccoli-preview.png'),      layerPct: 46 },
  eggplant:      { label: 'Eggplant',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/eggplant-layer.png'),     preview: pa('../assets/pizzas/toppings/vegetabales/eggplant-preview.png'),      layerPct: 50 },
  zucchini:      { label: 'Zucchini',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/zucchini-layer.png'),     preview: pa('../assets/pizzas/toppings/vegetabales/zucchini-preview.png'),      layerPct: 42 },
  dicedtomato:   { label: 'Diced Tomato',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/dicedtomato-layer.png'),  preview: pa('../assets/pizzas/toppings/vegetabales/dicedtomato-preview.png'),   layerPct: 42, offsetPct: 8 },
  greenolives:   { label: 'Green Olives',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/green-olives-layer.png'), preview: pa('../assets/pizzas/toppings/vegetabales/greenolives-preview.png'),   layerPct: 42 },
  blackolive:    { label: 'Black Olive',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/blackolives-layer.png'),  preview: pa('../assets/pizzas/toppings/vegetabales/blackolive-preview.png'),    layerPct: 42 },
  babyspinach:   { label: 'Baby Spinach',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/babyspinach-layer.png'),  preview: pa('../assets/pizzas/toppings/vegetabales/babyspinach-preview.png'),   layerPct: 42 },
  bluecheese:    { label: 'Blue Cheese',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/bluecheese-layer.png'),   preview: pa('../assets/pizzas/toppings/vegetabales/bluecheese-preview.png'),    layerPct: 42 },
  pestocheese:   { label: 'Pesto Cheese',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/pestocheese-layer.png'),  preview: pa('../assets/pizzas/toppings/vegetabales/pestocheese-preview.png'),   layerPct: 42 },
  jalapenopepper:{ label: 'Jalapeño',       layer: null,                                                                    preview: pa('../assets/pizzas/toppings/vegetabales/jalapenopepper-preview.png'), layerPct: 42 },
};
