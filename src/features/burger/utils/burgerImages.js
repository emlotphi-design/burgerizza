/**
 * burgerImages.js
 *
 * Single source of truth for all burger asset imports and lookup maps.
 * Used by:
 *   - BurgerBuilder.jsx  (live builder stage preview + orbital selection UI)
 *   - captureBurgerImage.js  (canvas capture)
 *   - useBurgerBuilder hook  (derived ingredient layers)
 */

// ── Wrappers ─────────────────────────────────────────────────────────────────
import blackWrapper from '../../../assets/burgers/wrappers/black-wrapper.png';
import classicPaper from '../../../assets/burgers/wrappers/classic-paper.png';
import kraftPaper   from '../../../assets/burgers/wrappers/kraft-paper.png';

export const wrappers = [blackWrapper, classicPaper, kraftPaper];
export const DEFAULT_WRAPPER = classicPaper;

// ── Bun bases (builder stage + canvas) ───────────────────────────────────────
import classicBase   from '../../../assets/burgers/buns/buns-base.png/classicbun-base.png';
import classic2Base  from '../../../assets/burgers/buns/buns-base.png/classicbun-base2.png';
import charcoalBase  from '../../../assets/burgers/buns/buns-base.png/charcoalbun-base.png';
import beetrootBase  from '../../../assets/burgers/buns/buns-base.png/beetrootbun-base.png';
import parsleyBase   from '../../../assets/burgers/buns/buns-base.png/parsleybun-base.png';

export const BUN_BASES = {
  classicbun:  classicBase,
  classicbun2: classic2Base,
  charcoalbun: charcoalBase,
  beetrootbun: beetrootBase,
  parsleybun:  parsleyBase,
};

// ── Bun tops (ordering animation + canvas) ────────────────────────────────────
import classicTop   from '../../../assets/burgers/buns/top-buns/classicbun-top..png';
import classic2Top  from '../../../assets/burgers/buns/top-buns/classicbuntop2..png';
import charcoalTop  from '../../../assets/burgers/buns/top-buns/charcoalbun-top.png';
import beetrootTop  from '../../../assets/burgers/buns/top-buns/beetrootbun-top.png';
import parsleyTop   from '../../../assets/burgers/buns/top-buns/parsleybun-top.png';

export const BUN_TOPS = {
  classicbun:  classicTop,
  classicbun2: classic2Top,
  charcoalbun: charcoalTop,
  beetrootbun: beetrootTop,
  parsleybun:  parsleyTop,
};

// ── Bun previews (orbital selection UI) ──────────────────────────────────────
import classicPreview  from '../../../assets/burgers/buns/buns-preview.png/classicbun-preview.png';
import classic2Preview from '../../../assets/burgers/buns/buns-preview.png/classicbun-preview2.png';
import charcoalPreview from '../../../assets/burgers/buns/buns-preview.png/charcoalbun-preview.png';
import beetrootPreview from '../../../assets/burgers/buns/buns-preview.png/beetrootbun-preview.png';
import parsleyPreview  from '../../../assets/burgers/buns/buns-preview.png/parsleybun-preview.png';

export const BUN_PREVIEWS = {
  classicbun:  classicPreview,
  classicbun2: classic2Preview,
  charcoalbun: charcoalPreview,
  beetrootbun: beetrootPreview,
  parsleybun:  parsleyPreview,
};

// Pentagon r=42%, 72° steps from top
export const BUN_POSITIONS = {
  classicbun:  { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  classicbun2: { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  charcoalbun: { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  beetrootbun: { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  parsleybun:  { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

// baseWidth percentage per bun (matches burgerData.js)
export const BUN_BASE_WIDTH = {
  classicbun:  36,
  classicbun2: 41,
  charcoalbun: 36,
  beetrootbun: 36,
  parsleybun:  36,
};

// ── Meat bases (builder stage + canvas) ──────────────────────────────────────
import chickenBase      from '../../../assets/burgers/meats/meat-base/chicken-base.png';
import baconBase        from '../../../assets/burgers/meats/meat-base/bacon-base.png';
import friedchickenBase from '../../../assets/burgers/meats/meat-base/friedchicken-base.png';
import beefBase         from '../../../assets/burgers/meats/meat-base/beef-base.png';
import beefpattyBase    from '../../../assets/burgers/meats/meat-base/beefpatty-base.png';
import eggBase          from '../../../assets/burgers/meats/meat-base/egg-base.png';

export const MEAT_BASES = {
  chicken:      chickenBase,
  bacon:        baconBase,
  friedchicken: friedchickenBase,
  beef:         beefBase,
  beefpatty:    beefpattyBase,
  egg:          eggBase,
};

// ── Meat previews (orbital selection UI) ─────────────────────────────────────
import chickenPreview      from '../../../assets/burgers/meats/meat-preview/chicken-preview.png';
import baconPreview        from '../../../assets/burgers/meats/meat-preview/bacon-preview.png';
import friedchickenPreview from '../../../assets/burgers/meats/meat-preview/friedchicken-preview.png';
import beefPreview         from '../../../assets/burgers/meats/meat-preview/beef-preview.png';
import beefpattyPreview    from '../../../assets/burgers/meats/meat-preview/beefpatty-preview.png';
import eggPreview          from '../../../assets/burgers/meats/meat-preview/egg-preview.png';

export const MEAT_PREVIEWS = {
  chicken:      chickenPreview,
  bacon:        baconPreview,
  friedchicken: friedchickenPreview,
  beef:         beefPreview,
  beefpatty:    beefpattyPreview,
  egg:          eggPreview,
};

// Hexagon r=42%, 60° steps from top
export const MEAT_POSITIONS = {
  chicken:      { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  bacon:        { top: '29%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  friedchicken: { top: '71%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  beef:         { top: '92%', left: '50%',   transform: 'translate(-50%, -50%)' },
  beefpatty:    { top: '71%', left: '13.6%', transform: 'translate(-50%, -50%)' },
  egg:          { top: '29%', left: '13.6%', transform: 'translate(-50%, -50%)' },
};

// ── Cheese bases (builder stage + canvas) ────────────────────────────────────
import cheddarBase from '../../../assets/burgers/cheeses/cheese-base/cheddar-base.png';
import edamBase    from '../../../assets/burgers/cheeses/cheese-base/edam-base.png';
import goudaBase   from '../../../assets/burgers/cheeses/cheese-base/gouda-base.png';

export const CHEESE_BASES = {
  cheddar: cheddarBase,
  edam:    edamBase,
  gouda:   goudaBase,
};

// ── Cheese previews (orbital selection UI) ───────────────────────────────────
import cheddarPreview from '../../../assets/burgers/cheeses/cheese-preview/cheddar-preview.png';
import edamPreview    from '../../../assets/burgers/cheeses/cheese-preview/edam-preview.png';
import goudaPreview   from '../../../assets/burgers/cheeses/cheese-preview/gouda-preview.png';

export const CHEESE_PREVIEWS = {
  cheddar: cheddarPreview,
  edam:    edamPreview,
  gouda:   goudaPreview,
};

// Triangle r=42%, 120° steps from top
export const CHEESE_POSITIONS = {
  cheddar: { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  edam:    { top: '71%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  gouda:   { top: '71%', left: '13.6%', transform: 'translate(-50%, -50%)' },
};

// ── Sauce bases (builder stage + canvas) ─────────────────────────────────────
import ketchupBase        from '../../../assets/burgers/sauces/sauce-base/ketchup-base.png';
import mayonnaiseBase     from '../../../assets/burgers/sauces/sauce-base/mayonnaise-base.png';
import mustardBase        from '../../../assets/burgers/sauces/sauce-base/mustard-base.png';
import picklesauceBase    from '../../../assets/burgers/sauces/sauce-base/picklesauce-base.png';
import mushroomsauceBase  from '../../../assets/burgers/sauces/sauce-base/mushroomsauce-base.png';

export const SAUCE_BASES = {
  ketchup:       ketchupBase,
  mayonnaise:    mayonnaiseBase,
  mustard:       mustardBase,
  picklesauce:   picklesauceBase,
  mushroomsauce: mushroomsauceBase,
};

// ── Sauce previews (orbital selection UI) ────────────────────────────────────
import ketchupPreview       from '../../../assets/burgers/sauces/sauce-preview/ketchup-preview.png';
import mayonnaisePreview    from '../../../assets/burgers/sauces/sauce-preview/mayonnaise-preview.png';
import mustardPreview       from '../../../assets/burgers/sauces/sauce-preview/mustard-preview.png';
import picklesaucePreview   from '../../../assets/burgers/sauces/sauce-preview/picklesauce-preview.png';
import mushroomsaucePreview from '../../../assets/burgers/sauces/sauce-preview/mushroom-sauce-preview.png';

export const SAUCE_PREVIEWS = {
  ketchup:       ketchupPreview,
  mayonnaise:    mayonnaisePreview,
  mustard:       mustardPreview,
  picklesauce:   picklesaucePreview,
  mushroomsauce: mushroomsaucePreview,
};

// Pentagon r=42%, 72° steps from top
export const SAUCE_POSITIONS = {
  ketchup:       { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  mayonnaise:    { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  mustard:       { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  picklesauce:   { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  mushroomsauce: { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

// ── Vegetable bases (builder stage + canvas) ──────────────────────────────────
import tomatoBase      from '../../../assets/burgers/vegetables/vegetable-base/tomato-base.png';
import onionBase       from '../../../assets/burgers/vegetables/vegetable-base/onion-base.png';
import lettuceBase     from '../../../assets/burgers/vegetables/vegetable-base/lettuce-base.png';
import mushroomVegBase from '../../../assets/burgers/vegetables/vegetable-base/mushroom-base..png';
import pickleBase      from '../../../assets/burgers/vegetables/vegetable-base/pickle-base.png';

export const VEGETABLE_BASES = {
  tomato:   tomatoBase,
  onion:    onionBase,
  lettuce:  lettuceBase,
  mushroom: mushroomVegBase,
  pickle:   pickleBase,
};

// ── Vegetable previews (orbital selection UI) ─────────────────────────────────
import tomatoPreview      from '../../../assets/burgers/vegetables/vegetable-preview/tomato-preview.png';
import onionPreview       from '../../../assets/burgers/vegetables/vegetable-preview/onion-preview.png';
import lettucePreview     from '../../../assets/burgers/vegetables/vegetable-preview/lettuce-preview.png';
import mushroomVegPreview from '../../../assets/burgers/vegetables/vegetable-preview/mushroom-preview.png';
import picklePreview      from '../../../assets/burgers/vegetables/vegetable-preview/pickle-preview.png';

export const VEGETABLE_PREVIEWS = {
  tomato:   tomatoPreview,
  onion:    onionPreview,
  lettuce:  lettucePreview,
  mushroom: mushroomVegPreview,
  pickle:   picklePreview,
};

// Pentagon r=42%, 72° steps from top
export const VEGETABLE_POSITIONS = {
  tomato:   { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  onion:    { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  lettuce:  { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  mushroom: { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  pickle:   { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};
