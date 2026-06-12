/**
 * Centralized preview image map for the Ingredient Management admin page.
 * Maps ingredient ID → imported asset URL.
 *
 * Pizza images are re-imported here (Vite deduplicates — no extra bundle size).
 * Burger images are re-exported from burgerImages.js.
 */

// ── Pizza: dough previews ─────────────────────────────────────────────────────
import americanPrev  from '../../assets/pizzas/base/preview/american-preview.png';
import americanpPrev from '../../assets/pizzas/base/preview/americanp-preview.png';
import thinPrev      from '../../assets/pizzas/base/preview/thin-preview.png';

// ── Pizza: sauce previews ─────────────────────────────────────────────────────
import bbqPrev     from '../../assets/pizzas/sauces/saucespreview/bbq-preview.png';
import garlicPrev  from '../../assets/pizzas/sauces/saucespreview/garlic-preview.png';
import ketchupPrev from '../../assets/pizzas/sauces/saucespreview/ketchup-preview.png';
import pestosPrev  from '../../assets/pizzas/sauces/saucespreview/pestos-preview.png';
import spicyPrev   from '../../assets/pizzas/sauces/saucespreview/spicy-preview.png';

// ── Pizza: cheese previews ────────────────────────────────────────────────────
import chedarPrev     from '../../assets/pizzas/cheese/cheesepreview/chedar-preview.png';
import goudaPrev      from '../../assets/pizzas/cheese/cheesepreview/gouda-preview.png';
import mozzarellaPrev from '../../assets/pizzas/cheese/cheesepreview/mozzarella-preview.png';

// ── Pizza: meat previews ──────────────────────────────────────────────────────
import baconPrev_pz         from '../../assets/pizzas/toppings/meat/bacon-preview.png';
import beefhumPrev          from '../../assets/pizzas/toppings/meat/beefhum-preview.png';
import cheesesausagePrev    from '../../assets/pizzas/toppings/meat/cheesesausage-preview.png';
import chickenPrev_pz       from '../../assets/pizzas/toppings/meat/chicken-preview.png';
import fleischPrev          from '../../assets/pizzas/toppings/meat/fleisch-preview.png';
import meatballPrev         from '../../assets/pizzas/toppings/meat/meatball-preview.png';
import pepperoniPrev        from '../../assets/pizzas/toppings/meat/pepperoni-preview.png';
import salamiPrev           from '../../assets/pizzas/toppings/meat/salami-preview.png';
import turkeyhumprev        from '../../assets/pizzas/toppings/meat/turkeyhum-preview.png';

// ── Pizza: vegetable previews ─────────────────────────────────────────────────
import mushroomPrev_pz  from '../../assets/pizzas/toppings/vegetabales/mushroom-preview.png';
import bellpepperPrev   from '../../assets/pizzas/toppings/vegetabales/bellpepper-preview.png';
import sweetcornPrev    from '../../assets/pizzas/toppings/vegetabales/sweetcorn-preview.png';
import cherrytomatoPrev from '../../assets/pizzas/toppings/vegetabales/cherrytomato-preview.png';
import redonionPrev     from '../../assets/pizzas/toppings/vegetabales/redonion-preview.png';
import broccoliPrev     from '../../assets/pizzas/toppings/vegetabales/broccoli-preview.png';
import eggplantPrev     from '../../assets/pizzas/toppings/vegetabales/eggplant-preview.png';
import zucchiniPrev     from '../../assets/pizzas/toppings/vegetabales/zucchini-preview.png';
import dicedtomatoPrev  from '../../assets/pizzas/toppings/vegetabales/dicedtomato-preview.png';
import greenolivesPrev  from '../../assets/pizzas/toppings/vegetabales/greenolives-preview.png';
import blackolivePrev   from '../../assets/pizzas/toppings/vegetabales/blackolive-preview.png';
import babyspinachPrev  from '../../assets/pizzas/toppings/vegetabales/babyspinach-preview.png';
import bluecheesePrev   from '../../assets/pizzas/toppings/vegetabales/bluecheese-preview.png';
import pestocheesePrev  from '../../assets/pizzas/toppings/vegetabales/pestocheese-preview.png';

export const PIZZA_PREVIEW_IMAGES = {
  // Doughs
  american:  americanPrev,
  americanp: americanpPrev,
  thin:      thinPrev,
  // Sauces
  bbq:    bbqPrev,
  garlic: garlicPrev,
  ketchup: ketchupPrev,
  pestos: pestosPrev,
  spicy:  spicyPrev,
  // Cheeses
  chedar:     chedarPrev,
  gouda:      goudaPrev,
  mozzarella: mozzarellaPrev,
  // Meats
  bacon:         baconPrev_pz,
  beefhum:       beefhumPrev,
  cheesesausage: cheesesausagePrev,
  chicken:       chickenPrev_pz,
  fleisch:       fleischPrev,
  meatball:      meatballPrev,
  pepperoni:     pepperoniPrev,
  salami:        salamiPrev,
  turkeyhum:     turkeyhumprev,
  // Vegetables
  mushroom:     mushroomPrev_pz,
  bellpepper:   bellpepperPrev,
  sweetcorn:    sweetcornPrev,
  cherrytomato: cherrytomatoPrev,
  redonion:     redonionPrev,
  broccoli:     broccoliPrev,
  eggplant:     eggplantPrev,
  zucchini:     zucchiniPrev,
  dicedtomato:  dicedtomatoPrev,
  greenolives:  greenolivesPrev,
  blackolive:   blackolivePrev,
  babyspinach:  babyspinachPrev,
  bluecheese:   bluecheesePrev,
  pestocheese:  pestocheesePrev,
};

// ── Burger images ─────────────────────────────────────────────────────────────
import {
  BUN_PREVIEWS,
  MEAT_PREVIEWS,
  CHEESE_PREVIEWS,
  SAUCE_PREVIEWS,
  VEGETABLE_PREVIEWS,
} from '../../features/burger/utils/burgerImages';

export const BURGER_PREVIEW_IMAGES = {
  ...BUN_PREVIEWS,
  ...MEAT_PREVIEWS,
  ...CHEESE_PREVIEWS,
  ...SAUCE_PREVIEWS,
  ...VEGETABLE_PREVIEWS,
};
