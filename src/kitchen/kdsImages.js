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
  '../assets/pizzas/**/*.webp',
  { eager: true, query: '?url', import: 'default' }
);

/** Safe asset lookup — returns null for any file that doesn't exist */
function pa(path) {
  return PIZZA_ASSETS[path] ?? null;
}

export const trayImg = pa('../assets/pizzas/base/full/tray-full.webp');

export const PIZZA_DOUGHS = {
  american:  { label: 'Würstchenrand', full: pa('../assets/pizzas/base/full/american-full.webp'),  preview: pa('../assets/pizzas/base/preview/american-preview.webp')  },
  americanp: { label: 'Käserand',      full: pa('../assets/pizzas/base/full/americanp-full.webp'), preview: pa('../assets/pizzas/base/preview/americanp-preview.webp') },
  thin:      { label: 'Dünn',          full: pa('../assets/pizzas/base/full/thin-full.webp'),      preview: pa('../assets/pizzas/base/preview/thin-preview.webp')      },
};

export const PIZZA_SAUCES = {
  bbq:     { label: 'BBQ',       layer: pa('../assets/pizzas/sauces/saucelayers/bbq-layer.webp'),     preview: pa('../assets/pizzas/sauces/saucespreview/bbq-preview.webp'),     layerPct: 42 },
  garlic:  { label: 'Knoblauch', layer: pa('../assets/pizzas/sauces/saucelayers/garlic-layer.webp'),  preview: pa('../assets/pizzas/sauces/saucespreview/garlic-preview.webp'),  layerPct: 42 },
  ketchup: { label: 'Ketchup',   layer: pa('../assets/pizzas/sauces/saucelayers/ketchup-layer.webp'), preview: pa('../assets/pizzas/sauces/saucespreview/ketchup-preview.webp'), layerPct: 38 },
  pestos:  { label: 'Pesto',     layer: pa('../assets/pizzas/sauces/saucelayers/pestos-layer.webp'),  preview: pa('../assets/pizzas/sauces/saucespreview/pestos-preview.webp'),  layerPct: 42 },
  spicy:   { label: 'Spicy',     layer: pa('../assets/pizzas/sauces/saucelayers/spicy-layer.webp'),   preview: pa('../assets/pizzas/sauces/saucespreview/spicy-preview.webp'),   layerPct: 38 },
};

export const PIZZA_CHEESES = {
  mozzarella: { label: 'Mozzarella', layer: pa('../assets/pizzas/cheese/cheeselayers/mozzarella-layer.webp'), preview: pa('../assets/pizzas/cheese/cheesepreview/mozzarella-preview.webp'), offsetPct: 3 },
  chedar:     { label: 'Cheddar',    layer: pa('../assets/pizzas/cheese/cheeselayers/chedar-layer.webp'),     preview: pa('../assets/pizzas/cheese/cheesepreview/chedar-preview.webp')                 },
  gouda:      { label: 'Gouda',      layer: pa('../assets/pizzas/cheese/cheeselayers/gouda-layer.webp'),      preview: pa('../assets/pizzas/cheese/cheesepreview/gouda-preview.webp')                  },
};

export const PIZZA_MEATS = {
  pepperoni:     { label: 'Pepperoni',      layer: pa('../assets/pizzas/toppings/meatlayers/pepperoni-layer.webp'),     preview: pa('../assets/pizzas/toppings/meat/pepperoni-preview.webp'),     layerPct: 42 },
  salami:        { label: 'Salami',         layer: pa('../assets/pizzas/toppings/meatlayers/salami-layer.webp'),        preview: pa('../assets/pizzas/toppings/meat/salami-preview.webp'),        layerPct: 42 },
  bacon:         { label: 'Bacon',          layer: pa('../assets/pizzas/toppings/meatlayers/bacon-layer.webp'),         preview: pa('../assets/pizzas/toppings/meat/bacon-preview.webp'),         layerPct: 42 },
  chicken:       { label: 'Chicken',        layer: pa('../assets/pizzas/toppings/meatlayers/chicken-layer.webp'),       preview: pa('../assets/pizzas/toppings/meat/chicken-preview.webp'),       layerPct: 42 },
  meatball:      { label: 'Meatball',       layer: pa('../assets/pizzas/toppings/meatlayers/meatball-layer.webp'),      preview: pa('../assets/pizzas/toppings/meat/meatball-preview.webp'),      layerPct: 42 },
  beefhum:       { label: 'Beef Ham',       layer: pa('../assets/pizzas/toppings/meatlayers/beefhum-layer.webp'),       preview: pa('../assets/pizzas/toppings/meat/beefhum-preview.webp'),       layerPct: 42 },
  fleisch:       { label: 'Fleisch',        layer: pa('../assets/pizzas/toppings/meatlayers/fleisch-layer.webp'),       preview: pa('../assets/pizzas/toppings/meat/fleisch-preview.webp'),       layerPct: 36 },
  turkeyhum:     { label: 'Turkey Ham',     layer: pa('../assets/pizzas/toppings/meatlayers/turkeyhum-layer.webp'),     preview: pa('../assets/pizzas/toppings/meat/turkeyhum-preview.webp'),     layerPct: 42 },
  cheesesausage: { label: 'Cheese Sausage', layer: pa('../assets/pizzas/toppings/meatlayers/cheesesausage-layer.webp'), preview: pa('../assets/pizzas/toppings/meat/cheesesausage-preview.webp'), layerPct: 42 },
};

export const PIZZA_VEGETABLES = {
  mushroom:      { label: 'Mushroom',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/mushroom-layer.webp'),     preview: pa('../assets/pizzas/toppings/vegetabales/mushroom-preview.webp'),      layerPct: 42 },
  bellpepper:    { label: 'Bell Pepper',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/bellpepper-layer.webp'),   preview: pa('../assets/pizzas/toppings/vegetabales/bellpepper-preview.webp'),    layerPct: 50 },
  sweetcorn:     { label: 'Sweet Corn',     layer: pa('../assets/pizzas/toppings/vegetabalelayers/sweetcorn-layer.webp'),    preview: pa('../assets/pizzas/toppings/vegetabales/sweetcorn-preview.webp'),     layerPct: 42 },
  cherrytomato:  { label: 'Cherry Tomato',  layer: pa('../assets/pizzas/toppings/vegetabalelayers/cherrytomato-layer.webp'), preview: pa('../assets/pizzas/toppings/vegetabales/cherrytomato-preview.webp'),  layerPct: 42 },
  redonion:      { label: 'Red Onion',      layer: pa('../assets/pizzas/toppings/vegetabalelayers/red-onion-layer.webp'),    preview: pa('../assets/pizzas/toppings/vegetabales/redonion-preview.webp'),      layerPct: 50 },
  broccoli:      { label: 'Broccoli',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/broccoli-layer.webp'),     preview: pa('../assets/pizzas/toppings/vegetabales/broccoli-preview.webp'),      layerPct: 46 },
  eggplant:      { label: 'Eggplant',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/eggplant-layer.webp'),     preview: pa('../assets/pizzas/toppings/vegetabales/eggplant-preview.webp'),      layerPct: 50 },
  zucchini:      { label: 'Zucchini',       layer: pa('../assets/pizzas/toppings/vegetabalelayers/zucchini-layer.webp'),     preview: pa('../assets/pizzas/toppings/vegetabales/zucchini-preview.webp'),      layerPct: 42 },
  dicedtomato:   { label: 'Diced Tomato',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/dicedtomato-layer.webp'),  preview: pa('../assets/pizzas/toppings/vegetabales/dicedtomato-preview.webp'),   layerPct: 42, offsetPct: 8 },
  greenolives:   { label: 'Green Olives',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/green-olives-layer.webp'), preview: pa('../assets/pizzas/toppings/vegetabales/greenolives-preview.webp'),   layerPct: 42 },
  blackolive:    { label: 'Black Olive',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/blackolives-layer.webp'),  preview: pa('../assets/pizzas/toppings/vegetabales/blackolive-preview.webp'),    layerPct: 42 },
  babyspinach:   { label: 'Baby Spinach',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/babyspinach-layer.webp'),  preview: pa('../assets/pizzas/toppings/vegetabales/babyspinach-preview.webp'),   layerPct: 42 },
  bluecheese:    { label: 'Blue Cheese',    layer: pa('../assets/pizzas/toppings/vegetabalelayers/bluecheese-layer.webp'),   preview: pa('../assets/pizzas/toppings/vegetabales/bluecheese-preview.webp'),    layerPct: 42 },
  pestocheese:   { label: 'Pesto Cheese',   layer: pa('../assets/pizzas/toppings/vegetabalelayers/pestocheese-layer.webp'),  preview: pa('../assets/pizzas/toppings/vegetabales/pestocheese-preview.webp'),   layerPct: 42 },
  jalapenopepper:{ label: 'Jalapeño',       layer: null,                                                                    preview: pa('../assets/pizzas/toppings/vegetabales/jalapenopepper-preview.webp'), layerPct: 42 },
};
