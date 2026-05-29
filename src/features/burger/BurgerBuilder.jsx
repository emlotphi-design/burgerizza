import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import Navbar from '../../components/Navbar';
import Socials from '../../components/Socials';
import BurgerSidebar from './components/BurgerSidebar';
import BurgerPreviewCard from './components/BurgerPreviewCard';
import { useBurgerStore } from './store/burgerStore.jsx';
import { usePizzaStore } from '../../context/PizzaContext';
import { BURGER_BUNS, BURGER_MEATS, BURGER_CHEESES, BURGER_SAUCES, BURGER_VEGETABLES } from './utils/burgerData';
import { calcBurgerPrice } from './utils/burgerUtils';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

import blackWrapper from '../../assets/burgers/wrappers/black-wrapper.png';
import classicPaper from '../../assets/burgers/wrappers/classic-paper.png';
import kraftPaper   from '../../assets/burgers/wrappers/kraft-paper.png';

import classicBase   from '../../assets/burgers/buns/buns-base.png/classicbun-base.png';
import classic2Base  from '../../assets/burgers/buns/buns-base.png/classicbun-base2.png';
import charcoalBase  from '../../assets/burgers/buns/buns-base.png/charcoalbun-base.png';
import beetrootBase  from '../../assets/burgers/buns/buns-base.png/beetrootbun-base.png';
import parsleyBase   from '../../assets/burgers/buns/buns-base.png/parsleybun-base.png';

import classicPreview  from '../../assets/burgers/buns/buns-preview.png/classicbun-preview.png';
import classic2Preview from '../../assets/burgers/buns/buns-preview.png/classicbun-preview2.png';
import charcoalPreview from '../../assets/burgers/buns/buns-preview.png/charcoalbun-preview.png';
import beetrootPreview from '../../assets/burgers/buns/buns-preview.png/beetrootbun-preview.png';
import parsleyPreview  from '../../assets/burgers/buns/buns-preview.png/parsleybun-preview.png';

import classicTop   from '../../assets/burgers/buns/top-buns/classicbun-top..png';
import classic2Top  from '../../assets/burgers/buns/top-buns/classicbuntop2..png';
import charcoalTop  from '../../assets/burgers/buns/top-buns/charcoalbun-top.png';
import beetrootTop  from '../../assets/burgers/buns/top-buns/beetrootbun-top.png';
import parsleyTop   from '../../assets/burgers/buns/top-buns/parsleybun-top.png';

import chickenBase      from '../../assets/burgers/meats/meat-base/chicken-base.png';
import baconBase        from '../../assets/burgers/meats/meat-base/bacon-base.png';
import friedchickenBase from '../../assets/burgers/meats/meat-base/friedchicken-base.png';
import beefBase         from '../../assets/burgers/meats/meat-base/beef-base.png';
import beefpattyBase    from '../../assets/burgers/meats/meat-base/beefpatty-base.png';
import eggBase          from '../../assets/burgers/meats/meat-base/egg-base.png';

import chickenPreview      from '../../assets/burgers/meats/meat-preview/chicken-preview.png';
import baconPreview        from '../../assets/burgers/meats/meat-preview/bacon-preview.png';
import friedchickenPreview from '../../assets/burgers/meats/meat-preview/friedchicken-preview.png';
import beefPreview         from '../../assets/burgers/meats/meat-preview/beef-preview.png';
import beefpattyPreview    from '../../assets/burgers/meats/meat-preview/beefpatty-preview.png';
import eggPreview          from '../../assets/burgers/meats/meat-preview/egg-preview.png';

import cheddarBase    from '../../assets/burgers/cheeses/cheese-base/cheddar-base.png';
import edamBase       from '../../assets/burgers/cheeses/cheese-base/edam-base.png';
import goudaBase      from '../../assets/burgers/cheeses/cheese-base/gouda-base.png';

import cheddarPreview from '../../assets/burgers/cheeses/cheese-preview/cheddar-preview.png';
import edamPreview    from '../../assets/burgers/cheeses/cheese-preview/edam-preview.png';
import goudaPreview   from '../../assets/burgers/cheeses/cheese-preview/gouda-preview.png';

import tomatoBase    from '../../assets/burgers/vegetables/vegetable-base/tomato-base.png';
import onionBase     from '../../assets/burgers/vegetables/vegetable-base/onion-base.png';
import lettuceBase   from '../../assets/burgers/vegetables/vegetable-base/lettuce-base.png';
import mushroomVegBase from '../../assets/burgers/vegetables/vegetable-base/mushroom-base..png';
import pickleBase    from '../../assets/burgers/vegetables/vegetable-base/pickle-base.png';

import tomatoPreview    from '../../assets/burgers/vegetables/vegetable-preview/tomato-preview.png';
import onionPreview     from '../../assets/burgers/vegetables/vegetable-preview/onion-preview.png';
import lettucePreview   from '../../assets/burgers/vegetables/vegetable-preview/lettuce-preview.png';
import mushroomVegPreview from '../../assets/burgers/vegetables/vegetable-preview/mushroom-preview.png';
import picklePreview    from '../../assets/burgers/vegetables/vegetable-preview/pickle-preview.png';

import ketchupBase        from '../../assets/burgers/sauces/sauce-base/ketchup-base.png';
import mayonnaiseBase     from '../../assets/burgers/sauces/sauce-base/mayonnaise-base.png';
import mustardBase        from '../../assets/burgers/sauces/sauce-base/mustard-base.png';
import picklesauceBase    from '../../assets/burgers/sauces/sauce-base/picklesauce-base.png';
import mushroomsauceBase  from '../../assets/burgers/sauces/sauce-base/mushroomsauce-base.png';

import ketchupPreview       from '../../assets/burgers/sauces/sauce-preview/ketchup-preview.png';
import mayonnaisePreview    from '../../assets/burgers/sauces/sauce-preview/mayonnaise-preview.png';
import mustardPreview       from '../../assets/burgers/sauces/sauce-preview/mustard-preview.png';
import picklesaucePreview   from '../../assets/burgers/sauces/sauce-preview/picklesauce-preview.png';
import mushroomsaucePreview from '../../assets/burgers/sauces/sauce-preview/mushroom-sauce-preview.png';

// ─── Lookup tables ──────────────────────────────────────────────────────────

const wrappers = [blackWrapper, classicPaper, kraftPaper];

const BUN_BASES = {
  classicbun:  classicBase,
  classicbun2: classic2Base,
  charcoalbun: charcoalBase,
  beetrootbun: beetrootBase,
  parsleybun:  parsleyBase,
};

const BUN_PREVIEWS = {
  classicbun:  classicPreview,
  classicbun2: classic2Preview,
  charcoalbun: charcoalPreview,
  beetrootbun: beetrootPreview,
  parsleybun:  parsleyPreview,
};

const BUN_TOPS = {
  classicbun:  classicTop,
  classicbun2: classic2Top,
  charcoalbun: charcoalTop,
  beetrootbun: beetrootTop,
  parsleybun:  parsleyTop,
};

// Pentagon r=42%, 72° steps from top
const BUN_POSITIONS = {
  classicbun:  { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  classicbun2: { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  charcoalbun: { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  beetrootbun: { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  parsleybun:  { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

const MEAT_BASES = {
  chicken:      chickenBase,
  bacon:        baconBase,
  friedchicken: friedchickenBase,
  beef:         beefBase,
  beefpatty:    beefpattyBase,
  egg:          eggBase,
};

const MEAT_PREVIEWS = {
  chicken:      chickenPreview,
  bacon:        baconPreview,
  friedchicken: friedchickenPreview,
  beef:         beefPreview,
  beefpatty:    beefpattyPreview,
  egg:          eggPreview,
};

// Hexagon r=42%, 60° steps from top
const MEAT_POSITIONS = {
  chicken:      { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  bacon:        { top: '29%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  friedchicken: { top: '71%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  beef:         { top: '92%', left: '50%',   transform: 'translate(-50%, -50%)' },
  beefpatty:    { top: '71%', left: '13.6%', transform: 'translate(-50%, -50%)' },
  egg:          { top: '29%', left: '13.6%', transform: 'translate(-50%, -50%)' },
};

const SAUCE_BASES = {
  ketchup:       ketchupBase,
  mayonnaise:    mayonnaiseBase,
  mustard:       mustardBase,
  picklesauce:   picklesauceBase,
  mushroomsauce: mushroomsauceBase,
};

const SAUCE_PREVIEWS = {
  ketchup:       ketchupPreview,
  mayonnaise:    mayonnaisePreview,
  mustard:       mustardPreview,
  picklesauce:   picklesaucePreview,
  mushroomsauce: mushroomsaucePreview,
};

// Pentagon r=42%, 72° steps from top
const SAUCE_POSITIONS = {
  ketchup:       { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  mayonnaise:    { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  mustard:       { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  picklesauce:   { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  mushroomsauce: { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

const CHEESE_BASES = {
  cheddar: cheddarBase,
  edam:    edamBase,
  gouda:   goudaBase,
};

const CHEESE_PREVIEWS = {
  cheddar: cheddarPreview,
  edam:    edamPreview,
  gouda:   goudaPreview,
};

// Triangle r=42%, 120° steps from top
const CHEESE_POSITIONS = {
  cheddar: { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  edam:    { top: '71%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  gouda:   { top: '71%', left: '13.6%', transform: 'translate(-50%, -50%)' },
};

const VEGETABLE_BASES = {
  tomato:   tomatoBase,
  onion:    onionBase,
  lettuce:  lettuceBase,
  mushroom: mushroomVegBase,
  pickle:   pickleBase,
};

const VEGETABLE_PREVIEWS = {
  tomato:   tomatoPreview,
  onion:    onionPreview,
  lettuce:  lettucePreview,
  mushroom: mushroomVegPreview,
  pickle:   picklePreview,
};

// Pentagon r=42%, 72° steps from top
const VEGETABLE_POSITIONS = {
  tomato:   { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  onion:    { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  lettuce:  { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  mushroom: { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  pickle:   { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

const MAX_VEG_QTY    = 5;
const MAX_MEAT_QTY   = 5;
const MAX_CHEESE_QTY = 5;

const previewBtn = {
  width: '100%',
  height: '100%',
  padding: 0,
  background: 'none',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  overflow: 'visible',
};

// ─── Canvas capture ─────────────────────────────────────────────────────────
// Composites all ingredient layers onto an offscreen canvas and returns a PNG
// data URL. All lookup maps are module-level so this plain function can read them.

async function captureToDataURL(snapshot) {
  const SIZE = 240;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const loadImg = src => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const drawCentered = async (src, drawSize, rotateDeg = 0) => {
    if (!src) return;
    const img = await loadImg(src);
    if (!img) return;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotateDeg) ctx.rotate(rotateDeg * Math.PI / 180);
    ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
  };

  const ingSize = SIZE * 0.36;
  const bunData = BURGER_BUNS.find(b => b.id === snapshot.bun);
  const bunSize = SIZE * (parseFloat(bunData?.baseWidth ?? '36') / 100);

  // Bottom bun
  await drawCentered(BUN_BASES[snapshot.bun], bunSize, -2);
  // Ingredients in selection order — last selected = top layer
  for (const { type, id } of (snapshot.selectionOrder ?? [])) {
    if (type === 'sauce' && SAUCE_BASES[id]) {
      await drawCentered(SAUCE_BASES[id], ingSize);
    } else if (type === 'meat' && MEAT_BASES[id]) {
      const qty = (snapshot.meats ?? {})[id] ?? 0;
      for (let i = 0; i < qty; i++) await drawCentered(MEAT_BASES[id], ingSize);
    } else if (type === 'cheese' && CHEESE_BASES[id]) {
      const qty = (snapshot.cheeses ?? {})[id] ?? 0;
      for (let i = 0; i < qty; i++) await drawCentered(CHEESE_BASES[id], ingSize);
    } else if (type === 'vegetable' && VEGETABLE_BASES[id]) {
      await drawCentered(VEGETABLE_BASES[id], ingSize);
    }
  }
  // Top bun is always included in the final captured image
  await drawCentered(BUN_TOPS[snapshot.bun], bunSize, -2);

  try { return canvas.toDataURL('image/png'); } catch { return null; }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BurgerBuilder() {
  const [activeItem, setActiveItem]   = useState(() => localStorage.getItem('bb-active-item') ?? 'bun');
  const [isOrdering, setIsOrdering]   = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const { draft, setDraft, clearDraft } = useBurgerStore();
  const { addBurger, pizzas, removePizza } = usePizzaStore();
  const { isLoggedIn } = useAuth();

  const [exitingBurgerIds, setExitingBurgerIds] = useState([]);

  // Snapshot captured at click time so the timer commit uses the correct data
  const orderSnapshotRef = useRef(null);
  const toastTimerRef    = useRef(null);

  const burgerItems = pizzas.filter(p => p.type === 'burger');

  // ── Lock html scroll + mark body while builder is mounted ───────────────
  useEffect(() => {
    const prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.classList.add('is-builder');
    return () => {
      document.documentElement.style.overflowY = prev;
      document.body.classList.remove('is-builder');
    };
  }, []);

  // ── Active sidebar item persistence ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('bb-active-item', activeItem);
  }, [activeItem]);

  // ── Wrapper persistence ──────────────────────────────────────────────────
  const initWrapperIdx = useRef(Math.floor(Math.random() * wrappers.length));
  useEffect(() => {
    if (draft.wrapper === null || draft.wrapper === undefined) {
      setDraft({ wrapper: initWrapperIdx.current });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const wrapperIndex    = draft.wrapper ?? initWrapperIdx.current;
  const selectedWrapper = wrappers[wrapperIndex] ?? wrappers[0];

  // ── Derived state ────────────────────────────────────────────────────────
  const bunBase       = draft.bun ? BUN_BASES[draft.bun] : null;
  const selectedBun   = draft.bun ? BURGER_BUNS.find(b => b.id === draft.bun) : null;
  const bunWidth      = selectedBun?.baseWidth ?? '36%';
  const topBunSrc     = draft.bun ? BUN_TOPS[draft.bun] : null;

  const selectedMeats   = draft.meats   ?? {};
  const selectedCheeses = draft.cheeses ?? {};
  const selectedSauces  = draft.sauces  ?? [];

  const hasMeat = Object.keys(selectedMeats).length > 0;

  // Ingredient layers in selection order — each entry gets z-index 5+idx so the
  // last selected ingredient always renders on top. Preview orbitals are at z=30,
  // top bun at z=25 (CSS), so all ingredient layers stay safely below both.
  const ingredientLayers = (draft.selectionOrder ?? []).flatMap(({ type, id }, idx) => {
    const style = { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 + idx };
    switch (type) {
      case 'sauce':
        return SAUCE_BASES[id] ? [{ key: `s-${id}`, cls: 'bb-sauce-img', src: SAUCE_BASES[id], style }] : [];
      case 'meat': {
        const qty = selectedMeats[id] ?? 0;
        return MEAT_BASES[id] ? Array.from({ length: qty }, (_, j) => ({ key: `m-${id}-${j}`, cls: 'bb-meat-img', src: MEAT_BASES[id], style })) : [];
      }
      case 'cheese': {
        const qty = selectedCheeses[id] ?? 0;
        return CHEESE_BASES[id] ? Array.from({ length: qty }, (_, j) => ({ key: `c-${id}-${j}`, cls: 'bb-cheese-img', src: CHEESE_BASES[id], style })) : [];
      }
      case 'vegetable':
        return VEGETABLE_BASES[id] ? [{ key: `v-${id}`, cls: 'bb-vegetable-img', src: VEGETABLE_BASES[id], style }] : [];
      default: return [];
    }
  });

  // ── Burger panel handlers ────────────────────────────────────────────────
  const handleEditBurger = useCallback((burger) => {
    const meats = burger.meats ?? {};
    const cheeses = burger.cheeses ?? (burger.cheese ? { [burger.cheese]: 1 } : {});
    const sauces = burger.sauces ?? [];
    const vegetables = burger.vegetables ?? [];
    // Restore saved order or reconstruct in default category sequence
    const selectionOrder = burger.selectionOrder ?? [
      ...sauces.map(id => ({ type: 'sauce', id })),
      ...Object.keys(meats).map(id => ({ type: 'meat', id })),
      ...Object.keys(cheeses).map(id => ({ type: 'cheese', id })),
      ...vegetables.map(id => ({ type: 'vegetable', id })),
    ];
    setDraft({ bun: burger.bun, meats, cheeses, sauces, vegetables, selectionOrder, name: burger.name, editingId: burger.id });
    removePizza(burger.id);
  }, [setDraft, removePizza]);

  const handleRemoveBurger = useCallback((id) => {
    setExitingBurgerIds(prev => [...prev, id]);
    setTimeout(() => {
      removePizza(id);
      setExitingBurgerIds(prev => prev.filter(x => x !== id));
    }, 400);
  }, [removePizza]);

  // ── Order flow ───────────────────────────────────────────────────────────
  // Always set isOrdering=true immediately so the double-click guard fires
  // for BOTH the bun-animation path and the no-bun path.
  const handleOrder = () => {
    if (!hasMeat || isOrdering) return;
    orderSnapshotRef.current = { ...draft };
    setIsOrdering(true);
  };

  useEffect(() => {
    if (!isOrdering) return;
    let cancelled = false;

    const commit = () => {
      const snapshot = orderSnapshotRef.current;
      orderSnapshotRef.current = null;
      if (!snapshot) { setIsOrdering(false); return; }

      const showAddedToast = () => {
        clearTimeout(toastTimerRef.current);
        setToastVisible(true);
        toastTimerRef.current = setTimeout(() => setToastVisible(false), 2800);
      };

      captureToDataURL(snapshot).then(image => {
        if (cancelled) return;
        flushSync(() => {
          addBurger({ ...snapshot, image });
          clearDraft();
          setIsOrdering(false);
          setActiveItem('bun');
        });
        try { localStorage.setItem('bb-active-item', 'bun'); } catch {}
        // Persist to database for logged-in users (fire-and-forget)
        if (isLoggedIn) {
          api.burgers.save({
            name:       (snapshot.name ?? '').trim() || 'Custom Burger',
            bun:        snapshot.bun,
            sauces:     snapshot.sauces     ?? [],
            meats:      snapshot.meats      ?? {},
            cheeses:    snapshot.cheeses    ?? {},
            vegetables: snapshot.vegetables ?? [],
            totalPrice: calcBurgerPrice(snapshot),
            image:      image ?? null,
          }).catch(() => {});
        }
        showAddedToast();
      }).catch(() => {
        if (cancelled) return;
        flushSync(() => {
          addBurger(snapshot);
          clearDraft();
          setIsOrdering(false);
          setActiveItem('bun');
        });
        try { localStorage.setItem('bb-active-item', 'bun'); } catch {}
        // Persist to database for logged-in users (fire-and-forget, no image)
        if (isLoggedIn) {
          api.burgers.save({
            name:       (snapshot.name ?? '').trim() || 'Custom Burger',
            bun:        snapshot.bun,
            sauces:     snapshot.sauces     ?? [],
            meats:      snapshot.meats      ?? {},
            cheeses:    snapshot.cheeses    ?? {},
            vegetables: snapshot.vegetables ?? [],
            totalPrice: calcBurgerPrice(snapshot),
            image:      null,
          }).catch(() => {});
        }
        showAddedToast();
      });
    };

    // If there's a bun, wait for the drop animation (550ms + 100ms buffer).
    // If there's no bun, commit after one tick so isOrdering render completes first.
    const delay = orderSnapshotRef.current?.bun ? 650 : 0;
    const timer = setTimeout(commit, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOrdering]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bb-stage page-enter">
      <Navbar />

      <div className="bb-workspace">
        <div className="bb-builder-canvas">

          {/* Wrapper paper */}
          <img
            className="bb-wrapper-img"
            src={selectedWrapper}
            alt="Burger wrapper"
            onError={e => {
              if (e.currentTarget.src !== classicPaper) e.currentTarget.src = classicPaper;
            }}
          />

          {/* Bottom bun */}
          {bunBase && (
            <img
              className="bb-bun-img"
              src={bunBase}
              alt="Selected bun"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* Ingredient layers in selection order — last selected = highest z-index */}
          {ingredientLayers.map(({ key, cls, src, style }) => (
            <img key={key} className={cls} src={src} alt="" style={style} />
          ))}

          {/* Top bun — drops in above all layers when ORDER is clicked */}
          {isOrdering && topBunSrc && (
            <img
              className="bb-top-bun-img"
              src={topBunSrc}
              alt="Top bun"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* ── Orbital previews (hidden during ordering animation) ── */}

          {!isOrdering && activeItem === 'bun' && BURGER_BUNS.map((bun, i) => {
            const isSelected = draft.bun === bun.id;
            return (
              <div
                key={bun.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...BUN_POSITIONS[bun.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  onClick={() => setDraft({ bun: bun.id })}
                  aria-label={bun.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={BUN_PREVIEWS[bun.id]}
                    alt={bun.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>
                <span className="bb-preview-label">{bun.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'sauce' && BURGER_SAUCES.map((sauce, i) => {
            const isSelected  = selectedSauces.includes(sauce.id);
            const atLimit     = selectedSauces.length >= 2;
            const isDisabled  = atLimit && !isSelected;
            return (
              <div
                key={sauce.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${isDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...SAUCE_POSITIONS[sauce.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setDraft(prev => {
                      const adding = !prev.sauces.includes(sauce.id);
                      return {
                        sauces: adding ? [...prev.sauces, sauce.id] : prev.sauces.filter(s => s !== sauce.id),
                        selectionOrder: adding
                          ? [...(prev.selectionOrder ?? []), { type: 'sauce', id: sauce.id }]
                          : (prev.selectionOrder ?? []).filter(e => !(e.type === 'sauce' && e.id === sauce.id)),
                      };
                    });
                  }}
                  aria-label={sauce.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={SAUCE_PREVIEWS[sauce.id]}
                    alt={sauce.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>
                <span className="bb-preview-label">{sauce.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'meat' && BURGER_MEATS.map((meat, i) => {
            const qty        = selectedMeats[meat.id] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={meat.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...MEAT_POSITIONS[meat.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  onClick={() => setDraft(prev => {
                    const meats = { ...prev.meats };
                    const wasSelected = !!meats[meat.id];
                    if (wasSelected) { delete meats[meat.id]; } else { meats[meat.id] = 1; }
                    return {
                      meats,
                      selectionOrder: wasSelected
                        ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'meat' && e.id === meat.id))
                        : [...(prev.selectionOrder ?? []), { type: 'meat', id: meat.id }],
                    };
                  })}
                  aria-label={meat.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={MEAT_PREVIEWS[meat.id]}
                    alt={meat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>

                {isSelected && meat.hasQty && (
                  <div className="bb-qty-bar">
                    <button
                      className="bb-qty-btn"
                      aria-label={`Remove one ${meat.name}`}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const meats = { ...prev.meats };
                          const removing = (meats[meat.id] ?? 0) <= 1;
                          if (removing) { delete meats[meat.id]; } else { meats[meat.id] -= 1; }
                          return {
                            meats,
                            selectionOrder: removing
                              ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'meat' && e.id === meat.id))
                              : prev.selectionOrder ?? [],
                          };
                        });
                      }}
                    >−</button>
                    <span className="bb-qty-count">{qty}</span>
                    <button
                      className="bb-qty-btn"
                      aria-label={`Add one ${meat.name}`}
                      disabled={qty >= MAX_MEAT_QTY}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const current = prev.meats[meat.id] ?? 0;
                          if (current >= MAX_MEAT_QTY) return prev;
                          return { meats: { ...prev.meats, [meat.id]: current + 1 } };
                        });
                      }}
                    >+</button>
                  </div>
                )}

                <span className="bb-preview-label">{meat.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'cheese' && BURGER_CHEESES.map((cheese, i) => {
            const qty        = (draft.cheeses ?? {})[cheese.id] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={cheese.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...CHEESE_POSITIONS[cheese.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  onClick={() => setDraft(prev => {
                    const cheeses = { ...prev.cheeses };
                    const wasSelected = !!cheeses[cheese.id];
                    if (wasSelected) { delete cheeses[cheese.id]; } else { cheeses[cheese.id] = 1; }
                    return {
                      cheeses,
                      selectionOrder: wasSelected
                        ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'cheese' && e.id === cheese.id))
                        : [...(prev.selectionOrder ?? []), { type: 'cheese', id: cheese.id }],
                    };
                  })}
                  aria-label={cheese.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  {CHEESE_PREVIEWS[cheese.id] && (
                    <img
                      src={CHEESE_PREVIEWS[cheese.id]}
                      alt={cheese.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  )}
                </button>

                {isSelected && (
                  <div className="bb-qty-bar">
                    <button
                      className="bb-qty-btn"
                      aria-label={`Remove one ${cheese.name}`}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const cheeses = { ...prev.cheeses };
                          const removing = (cheeses[cheese.id] ?? 0) <= 1;
                          if (removing) { delete cheeses[cheese.id]; } else { cheeses[cheese.id] -= 1; }
                          return {
                            cheeses,
                            selectionOrder: removing
                              ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'cheese' && e.id === cheese.id))
                              : prev.selectionOrder ?? [],
                          };
                        });
                      }}
                    >−</button>
                    <span className="bb-qty-count">{qty}</span>
                    <button
                      className="bb-qty-btn"
                      aria-label={`Add one ${cheese.name}`}
                      disabled={qty >= MAX_CHEESE_QTY}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const current = (prev.cheeses ?? {})[cheese.id] ?? 0;
                          if (current >= MAX_CHEESE_QTY) return prev;
                          return { cheeses: { ...prev.cheeses, [cheese.id]: current + 1 } };
                        });
                      }}
                    >+</button>
                  </div>
                )}

                <span className="bb-preview-label">{cheese.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'vegetables' && BURGER_VEGETABLES.map((veg, i) => {
            const selectedVegetables = draft.vegetables ?? [];
            const isSelected = selectedVegetables.includes(veg.id);
            const atLimit    = selectedVegetables.length >= MAX_VEG_QTY;
            const isDisabled = atLimit && !isSelected;
            return (
              <div
                key={veg.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${isDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...VEGETABLE_POSITIONS[veg.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setDraft(prev => {
                      const vegs = prev.vegetables ?? [];
                      const adding = !vegs.includes(veg.id);
                      return {
                        vegetables: adding ? [...vegs, veg.id] : vegs.filter(v => v !== veg.id),
                        selectionOrder: adding
                          ? [...(prev.selectionOrder ?? []), { type: 'vegetable', id: veg.id }]
                          : (prev.selectionOrder ?? []).filter(e => !(e.type === 'vegetable' && e.id === veg.id)),
                      };
                    });
                  }}
                  aria-label={veg.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  {VEGETABLE_PREVIEWS[veg.id] && (
                    <img
                      src={VEGETABLE_PREVIEWS[veg.id]}
                      alt={veg.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  )}
                </button>
                <span className="bb-preview-label">{veg.name}</span>
              </div>
            );
          })}

        </div>

        <div className="builder-name-wrap">
          <input
            className="builder-name-input"
            type="text"
            value={draft.name}
            onChange={e => setDraft({ name: e.target.value })}
            placeholder={`Custom Burger #${burgerItems.length + 1}`}
            maxLength={32}
            aria-label="Burger name"
            spellCheck={false}
          />
        </div>

        <BurgerSidebar activeItem={activeItem} onSelect={setActiveItem} bunSelected={!!draft.bun} />
      </div>

      {/* ORDER NOW — fixed pill, visible only when meat selected and not ordering */}
      <button
        className={`bb-order-btn${hasMeat && !isOrdering ? ' bb-order-btn--visible' : ''}`}
        onClick={handleOrder}
        aria-label="Order now"
      >
        ORDER NOW
      </button>

      {burgerItems.length > 0 && (
        <div className="bpc-panel">
          <p className="bpc-panel-label">YOUR BURGERS</p>
          <div className="bpc-panel-list">
            {burgerItems.map(burger => (
              <BurgerPreviewCard
                key={burger.id}
                burger={burger}
                isExiting={exitingBurgerIds.includes(burger.id)}
                onEdit={handleEditBurger}
                onRemove={handleRemoveBurger}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toast: shown after burger is added to cart */}
      {toastVisible && (
        <div className="bb-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Burger added to cart
        </div>
      )}

      <Socials />
    </div>
  );
}
