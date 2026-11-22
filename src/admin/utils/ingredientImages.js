/**
 * Centralized preview image map for the Ingredient Management admin page.
 * Maps ingredient ID → imported asset URL.
 *
 * Pizza images are re-imported here (Vite deduplicates — no extra bundle size).
 * Burger images are re-exported from burgerImages.js.
 */

// ── Pizza: dough previews ─────────────────────────────────────────────────────
import americanPrev  from '../../assets/pizzas/base/preview/american-preview.webp';
import americanpPrev from '../../assets/pizzas/base/preview/americanp-preview.webp';
import thinPrev      from '../../assets/pizzas/base/preview/thin-preview.webp';

// ── Pizza: sauce previews ─────────────────────────────────────────────────────
import bbqPrev     from '../../assets/pizzas/sauces/saucespreview/bbq-preview.webp';
import garlicPrev  from '../../assets/pizzas/sauces/saucespreview/garlic-preview.webp';
import ketchupPrev from '../../assets/pizzas/sauces/saucespreview/ketchup-preview.webp';
import pestosPrev  from '../../assets/pizzas/sauces/saucespreview/pestos-preview.webp';
import spicyPrev   from '../../assets/pizzas/sauces/saucespreview/spicy-preview.webp';

// ── Pizza: cheese previews ────────────────────────────────────────────────────
import chedarPrev     from '../../assets/pizzas/cheese/cheesepreview/chedar-preview.webp';
import goudaPrev      from '../../assets/pizzas/cheese/cheesepreview/gouda-preview.webp';
import mozzarellaPrev from '../../assets/pizzas/cheese/cheesepreview/mozzarella-preview.webp';

// ── Pizza: meat previews ──────────────────────────────────────────────────────
import baconPrev_pz         from '../../assets/pizzas/toppings/meat/bacon-preview.webp';
import beefhumPrev          from '../../assets/pizzas/toppings/meat/beefhum-preview.webp';
import cheesesausagePrev    from '../../assets/pizzas/toppings/meat/cheesesausage-preview.webp';
import chickenPrev_pz       from '../../assets/pizzas/toppings/meat/chicken-preview.webp';
import fleischPrev          from '../../assets/pizzas/toppings/meat/fleisch-preview.webp';
import meatballPrev         from '../../assets/pizzas/toppings/meat/meatball-preview.webp';
import pepperoniPrev        from '../../assets/pizzas/toppings/meat/pepperoni-preview.webp';
import salamiPrev           from '../../assets/pizzas/toppings/meat/salami-preview.webp';
import turkeyhumprev        from '../../assets/pizzas/toppings/meat/turkeyhum-preview.webp';

// ── Pizza: vegetable previews ─────────────────────────────────────────────────
import mushroomPrev_pz  from '../../assets/pizzas/toppings/vegetabales/mushroom-preview.webp';
import bellpepperPrev   from '../../assets/pizzas/toppings/vegetabales/bellpepper-preview.webp';
import sweetcornPrev    from '../../assets/pizzas/toppings/vegetabales/sweetcorn-preview.webp';
import cherrytomatoPrev from '../../assets/pizzas/toppings/vegetabales/cherrytomato-preview.webp';
import redonionPrev     from '../../assets/pizzas/toppings/vegetabales/redonion-preview.webp';
import broccoliPrev     from '../../assets/pizzas/toppings/vegetabales/broccoli-preview.webp';
import eggplantPrev     from '../../assets/pizzas/toppings/vegetabales/eggplant-preview.webp';
import zucchiniPrev     from '../../assets/pizzas/toppings/vegetabales/zucchini-preview.webp';
import dicedtomatoPrev  from '../../assets/pizzas/toppings/vegetabales/dicedtomato-preview.webp';
import greenolivesPrev  from '../../assets/pizzas/toppings/vegetabales/greenolives-preview.webp';
import blackolivePrev   from '../../assets/pizzas/toppings/vegetabales/blackolive-preview.webp';
import babyspinachPrev  from '../../assets/pizzas/toppings/vegetabales/babyspinach-preview.webp';
import bluecheesePrev   from '../../assets/pizzas/toppings/vegetabales/bluecheese-preview.webp';
import pestocheesePrev  from '../../assets/pizzas/toppings/vegetabales/pestocheese-preview.webp';

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
