import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useIngredientConfig } from '../../../context/IngredientConfigContext';
import { useCustomIngredients } from '../../../context/CustomIngredientsContext';
import { useBurgerStore } from '../store/burgerStore.jsx';
import { usePizzaStore } from '../../../store/PizzaContext';
import { useAuth } from '../../../store/AuthContext';
import { api } from '../../../services/api';
import { captureBurgerImage } from '../utils/captureBurgerImage';
import { calcBurgerPrice } from '../utils/burgerUtils';
import { forBuilder } from '../../../utils/customIngredients';
import { mergeBurgerCategory } from '../utils/burgerCustomMerge';
import {
  BUN_BASES, BUN_TOPS, BUN_PREVIEWS, BUN_POSITIONS,
  MEAT_BASES, CHEESE_BASES, SAUCE_BASES, VEGETABLE_BASES,
  MEAT_PREVIEWS, CHEESE_PREVIEWS, SAUCE_PREVIEWS, VEGETABLE_PREVIEWS,
  MEAT_POSITIONS, CHEESE_POSITIONS, SAUCE_POSITIONS, VEGETABLE_POSITIONS,
  wrappers,
} from '../utils/burgerImages';
import { BURGER_BUNS, BURGER_MEATS, BURGER_CHEESES, BURGER_SAUCES, BURGER_VEGETABLES } from '../utils/burgerData';

const MAX_MEAT_QTY   = 5;
const MAX_CHEESE_QTY = 5;
const MAX_VEG_QTY    = 5;
const SAUCE_LIMIT    = 2;
const TOAST_DURATION = 2800;

// Removes the LAST occurrence of {type, id} from the layer order array.
// Used when decrementing qty so the most recently added layer is removed.
function removeLastOf(order, type, id) {
  for (let i = order.length - 1; i >= 0; i--) {
    if (order[i].type === type && order[i].id === id) {
      return [...order.slice(0, i), ...order.slice(i + 1)];
    }
  }
  return order;
}

export function useBurgerBuilder() {
  const [activeItem,       setActiveItem]       = useState('bun');
  const [isOrdering,       setIsOrdering]       = useState(false);
  const [toastVisible,     setToastVisible]     = useState(false);
  const [exitingBurgerIds, setExitingBurgerIds] = useState([]);

  const { draft, setDraft, clearDraft } = useBurgerStore();
  const { addBurger, pizzas, removePizza } = usePizzaStore();
  const { isLoggedIn } = useAuth();
  const { isEnabled, config } = useIngredientConfig();
  const { customIngredients } = useCustomIngredients();

  const burgerCustom = useMemo(() => forBuilder(customIngredients, 'burger'), [customIngredients]);
  const customByCategory = useMemo(() => ({
    bun:       burgerCustom.filter(r => r.category === 'bun'),
    meat:      burgerCustom.filter(r => r.category === 'meat'),
    cheese:    burgerCustom.filter(r => r.category === 'cheese'),
    sauce:     burgerCustom.filter(r => r.category === 'sauce'),
    vegetable: burgerCustom.filter(r => r.category === 'vegetable'),
  }), [burgerCustom]);

  const bunMerge       = useMemo(() => mergeBurgerCategory(BURGER_BUNS, BUN_POSITIONS, customByCategory.bun), [customByCategory.bun]);
  const meatMerge       = useMemo(() => mergeBurgerCategory(BURGER_MEATS, MEAT_POSITIONS, customByCategory.meat), [customByCategory.meat]);
  const cheeseMerge      = useMemo(() => mergeBurgerCategory(BURGER_CHEESES, CHEESE_POSITIONS, customByCategory.cheese), [customByCategory.cheese]);
  const sauceMerge      = useMemo(() => mergeBurgerCategory(BURGER_SAUCES, SAUCE_POSITIONS, customByCategory.sauce), [customByCategory.sauce]);
  const vegetableMerge = useMemo(() => mergeBurgerCategory(BURGER_VEGETABLES, VEGETABLE_POSITIONS, customByCategory.vegetable), [customByCategory.vegetable]);

  const mergedBunPreviews       = { ...BUN_PREVIEWS, ...bunMerge.previews };
  const mergedBunPositions      = bunMerge.positions;
  const mergedBunBases          = { ...BUN_BASES, ...bunMerge.bases };
  const mergedBunTops           = { ...BUN_TOPS, ...bunMerge.bases };
  const mergedMeatPreviews      = { ...MEAT_PREVIEWS, ...meatMerge.previews };
  const mergedMeatPositions     = meatMerge.positions;
  const mergedCheesePreviews    = { ...CHEESE_PREVIEWS, ...cheeseMerge.previews };
  const mergedCheesePositions   = cheeseMerge.positions;
  const mergedSaucePreviews     = { ...SAUCE_PREVIEWS, ...sauceMerge.previews };
  const mergedSaucePositions    = sauceMerge.positions;
  const mergedVegetablePreviews  = { ...VEGETABLE_PREVIEWS, ...vegetableMerge.previews };
  const mergedVegetablePositions = vegetableMerge.positions;

  const mergedMeatBases      = { ...MEAT_BASES, ...meatMerge.bases };
  const mergedCheeseBases    = { ...CHEESE_BASES, ...cheeseMerge.bases };
  const mergedSauceBases     = { ...SAUCE_BASES, ...sauceMerge.bases };
  const mergedVegetableBases = { ...VEGETABLE_BASES, ...vegetableMerge.bases };

  const orderSnapshotRef = useRef(null);
  const toastTimerRef    = useRef(null);
  const prevBunRef       = useRef(draft.bun);
  const initWrapperIdx   = useRef(Math.floor(Math.random() * wrappers.length));

  // Auto-deselect any burger ingredient that becomes disabled via admin dashboard.
  // Runs on mount (initial localStorage config) and whenever config changes
  // (realtime event or cross-tab storage event).
  useEffect(() => {
    const {
      bun,
      sauces      = [],
      meats       = {},
      cheeses     = {},
      vegetables  = [],
      selectionOrder = [],
    } = draft;

    const updates = {};

    if (bun && !isEnabled('burger', bun)) {
      updates.bun = null;
    }

    const validSauces = sauces.filter(id => isEnabled('burger', id));
    if (validSauces.length !== sauces.length) updates.sauces = validSauces;

    const validMeats = Object.fromEntries(
      Object.entries(meats).filter(([id]) => isEnabled('burger', id)),
    );
    if (Object.keys(validMeats).length !== Object.keys(meats).length) {
      updates.meats = validMeats;
    }

    const validCheeses = Object.fromEntries(
      Object.entries(cheeses).filter(([id]) => isEnabled('burger', id)),
    );
    if (Object.keys(validCheeses).length !== Object.keys(cheeses).length) {
      updates.cheeses = validCheeses;
    }

    const validVegs = vegetables.filter(id => isEnabled('burger', id));
    if (validVegs.length !== vegetables.length) updates.vegetables = validVegs;

    if (Object.keys(updates).length > 0) {
      // Rebuild selectionOrder to match the surviving selections
      const meatIds   = new Set(Object.keys(updates.meats    ?? meats));
      const cheeseIds = new Set(Object.keys(updates.cheeses  ?? cheeses));
      const sauceIds  = new Set(updates.sauces    ?? sauces);
      const vegIds    = new Set(updates.vegetables ?? vegetables);

      updates.selectionOrder = selectionOrder.filter(e => {
        if (e.type === 'meat')      return meatIds.has(e.id);
        if (e.type === 'cheese')    return cheeseIds.has(e.id);
        if (e.type === 'sauce')     return sauceIds.has(e.id);
        if (e.type === 'vegetable') return vegIds.has(e.id);
        return true;
      });

      setDraft(updates);
    }
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear any stale active-tab key left by previous versions
  useEffect(() => {
    localStorage.removeItem('bb-active-item');
  }, []);

  // Initialize wrapper to a random choice if unset
  useEffect(() => {
    if (draft.wrapper === null || draft.wrapper === undefined) {
      setDraft({ wrapper: initWrapperIdx.current });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.add('is-builder');
    return () => {
      document.body.classList.remove('is-builder');
    };
  }, []);

  // Auto-advance tab: bun selected → move to sauce; draft cleared → back to bun
  useEffect(() => {
    const prevBun = prevBunRef.current;
    prevBunRef.current = draft.bun;

    if (!prevBun && draft.bun && activeItem === 'bun') {
      const t = setTimeout(() => setActiveItem('sauce'), 420);
      return () => clearTimeout(t);
    }
    if (prevBun && !draft.bun) {
      setActiveItem('bun');
    }
  }, [draft.bun]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────────────────────

  const burgerItems = (pizzas ?? []).filter(p => p.type === 'burger');

  const wrapperIndex    = draft.wrapper ?? initWrapperIdx.current;
  const selectedWrapper = wrappers[wrapperIndex] ?? wrappers[0];

  const bunBase     = draft.bun ? mergedBunBases[draft.bun]  : null;
  const topBunSrc   = draft.bun ? mergedBunTops[draft.bun]   : null;
  const selectedBun = draft.bun ? bunMerge.list.find(b => b.id === draft.bun) : null;
  const bunWidth    = selectedBun?.baseWidth ?? '36%';

  const selectedMeats   = draft.meats      ?? {};
  const selectedCheeses = draft.cheeses    ?? {};
  const selectedSauces  = draft.sauces     ?? [];

  const hasMeat = Object.keys(selectedMeats).length > 0;

  // One entry in selectionOrder = one rendered layer; z-index = 5+idx so the
  // most recently added entry always sits on top.
  const ingredientLayers = (draft.selectionOrder ?? []).map(({ type, id }, idx) => {
    const style = {
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)', zIndex: 5 + idx,
    };
    switch (type) {
      case 'sauce':     return mergedSauceBases[id]     ? { key: `s-${idx}`, cls: 'bb-sauce-img',     src: mergedSauceBases[id],     style } : null;
      case 'meat':      return mergedMeatBases[id]       ? { key: `m-${idx}`, cls: 'bb-meat-img',      src: mergedMeatBases[id],      style } : null;
      case 'cheese':    return mergedCheeseBases[id]     ? { key: `c-${idx}`, cls: 'bb-cheese-img',    src: mergedCheeseBases[id],    style } : null;
      case 'vegetable': return mergedVegetableBases[id]  ? { key: `v-${idx}`, cls: 'bb-vegetable-img', src: mergedVegetableBases[id], style } : null;
      default: return null;
    }
  }).filter(Boolean);

  // ── Ingredient selection handlers ─────────────────────────────────────────

  const handleSelectBun = useCallback((id) => {
    setDraft({ bun: id });
  }, [setDraft]);

  const handleToggleSauce = useCallback((sauce) => {
    setDraft(prev => {
      const adding = !prev.sauces.includes(sauce.id);
      const atLimit = prev.sauces.length >= SAUCE_LIMIT;
      if (atLimit && adding) return prev;
      return {
        sauces: adding
          ? [...prev.sauces, sauce.id]
          : prev.sauces.filter(s => s !== sauce.id),
        selectionOrder: adding
          ? [...(prev.selectionOrder ?? []), { type: 'sauce', id: sauce.id }]
          : (prev.selectionOrder ?? []).filter(e => !(e.type === 'sauce' && e.id === sauce.id)),
      };
    });
  }, [setDraft]);

  const handleToggleMeat = useCallback((meat) => {
    setDraft(prev => {
      const meats = { ...prev.meats };
      const wasSelected = !!meats[meat.id];
      if (wasSelected) { delete meats[meat.id]; } else { meats[meat.id] = 1; }
      return {
        meats,
        selectionOrder: wasSelected
          ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'meat' && e.id === meat.id))
          : [...(prev.selectionOrder ?? []), { type: 'meat', id: meat.id }],
      };
    });
  }, [setDraft]);

  const handleIncrementMeat = useCallback((meat) => {
    setDraft(prev => {
      const current = prev.meats[meat.id] ?? 0;
      if (current >= MAX_MEAT_QTY) return prev;
      return {
        meats: { ...prev.meats, [meat.id]: current + 1 },
        selectionOrder: [...(prev.selectionOrder ?? []), { type: 'meat', id: meat.id }],
      };
    });
  }, [setDraft]);

  const handleDecrementMeat = useCallback((meat) => {
    setDraft(prev => {
      const meats = { ...prev.meats };
      const removing = (meats[meat.id] ?? 0) <= 1;
      if (removing) { delete meats[meat.id]; } else { meats[meat.id] -= 1; }
      return {
        meats,
        selectionOrder: removing
          ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'meat' && e.id === meat.id))
          : removeLastOf(prev.selectionOrder ?? [], 'meat', meat.id),
      };
    });
  }, [setDraft]);

  const handleToggleCheese = useCallback((cheese) => {
    setDraft(prev => {
      const cheeses = { ...prev.cheeses };
      const wasSelected = !!cheeses[cheese.id];
      if (wasSelected) { delete cheeses[cheese.id]; } else { cheeses[cheese.id] = 1; }
      return {
        cheeses,
        selectionOrder: wasSelected
          ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'cheese' && e.id === cheese.id))
          : [...(prev.selectionOrder ?? []), { type: 'cheese', id: cheese.id }],
      };
    });
  }, [setDraft]);

  const handleIncrementCheese = useCallback((cheese) => {
    setDraft(prev => {
      const current = (prev.cheeses ?? {})[cheese.id] ?? 0;
      if (current >= MAX_CHEESE_QTY) return prev;
      return {
        cheeses: { ...prev.cheeses, [cheese.id]: current + 1 },
        selectionOrder: [...(prev.selectionOrder ?? []), { type: 'cheese', id: cheese.id }],
      };
    });
  }, [setDraft]);

  const handleDecrementCheese = useCallback((cheese) => {
    setDraft(prev => {
      const cheeses = { ...prev.cheeses };
      const removing = (cheeses[cheese.id] ?? 0) <= 1;
      if (removing) { delete cheeses[cheese.id]; } else { cheeses[cheese.id] -= 1; }
      return {
        cheeses,
        selectionOrder: removing
          ? (prev.selectionOrder ?? []).filter(e => !(e.type === 'cheese' && e.id === cheese.id))
          : removeLastOf(prev.selectionOrder ?? [], 'cheese', cheese.id),
      };
    });
  }, [setDraft]);

  const handleToggleVegetable = useCallback((veg) => {
    setDraft(prev => {
      const vegs = prev.vegetables ?? [];
      const adding = !vegs.includes(veg.id);
      const atLimit = vegs.length >= MAX_VEG_QTY;
      if (atLimit && adding) return prev;
      return {
        vegetables: adding ? [...vegs, veg.id] : vegs.filter(v => v !== veg.id),
        selectionOrder: adding
          ? [...(prev.selectionOrder ?? []), { type: 'vegetable', id: veg.id }]
          : (prev.selectionOrder ?? []).filter(e => !(e.type === 'vegetable' && e.id === veg.id)),
      };
    });
  }, [setDraft]);

  const setName = useCallback((val) => setDraft({ name: val }), [setDraft]);

  // ── Burger panel handlers ──────────────────────────────────────────────────

  const handleEditBurger = useCallback((burger) => {
    const meats      = burger.meats      ?? {};
    const cheeses    = burger.cheeses    ?? (burger.cheese ? { [burger.cheese]: 1 } : {});
    const sauces     = burger.sauces     ?? [];
    const vegetables = burger.vegetables ?? [];

    // Validate selectionOrder: must have one entry per qty layer for meats/cheeses.
    // Old saved burgers may have one entry per ingredient — rebuild if counts are off.
    const saved = burger.selectionOrder;
    const countsOk = saved &&
      Object.entries(meats).every(([id, qty]) =>
        qty === saved.filter(e => e.type === 'meat'   && e.id === id).length) &&
      Object.entries(cheeses).every(([id, qty]) =>
        qty === saved.filter(e => e.type === 'cheese' && e.id === id).length);

    const selectionOrder = countsOk ? saved : [
      ...sauces.map(id => ({ type: 'sauce', id })),
      ...Object.entries(meats).flatMap(([id, qty]) =>
        Array.from({ length: qty }, () => ({ type: 'meat', id }))),
      ...Object.entries(cheeses).flatMap(([id, qty]) =>
        Array.from({ length: qty }, () => ({ type: 'cheese', id }))),
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

  // ── Order flow ────────────────────────────────────────────────────────────

  const handleOrder = useCallback(() => {
    if (!hasMeat || isOrdering) return;
    orderSnapshotRef.current = { ...draft };
    setIsOrdering(true);
  }, [hasMeat, isOrdering, draft]);

  // Runs after setIsOrdering(true). Waits for the bun-drop animation (650ms)
  // then captures the canvas image, commits to cart, and resets the builder.
  useEffect(() => {
    if (!isOrdering) return;
    let cancelled = false;

    const showToast = () => {
      clearTimeout(toastTimerRef.current);
      setToastVisible(true);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), TOAST_DURATION);
    };

    const commit = () => {
      const snapshot = orderSnapshotRef.current;
      orderSnapshotRef.current = null;
      if (!snapshot) { setIsOrdering(false); return; }

      const afterCommit = (image) => {
        if (cancelled) return;
        flushSync(() => {
          addBurger({ ...snapshot, image: image ?? null });
          clearDraft();
          setIsOrdering(false);
          setActiveItem('bun');
        });
        try { localStorage.setItem('bb-active-item', 'bun'); } catch {}
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
        showToast();
      };

      captureBurgerImage(snapshot)
        .then(afterCommit)
        .catch(() => afterCommit(null));
    };

    // If there's a bun, wait for the drop animation (550ms + buffer).
    // If there's no bun, commit after one tick so isOrdering render completes.
    const delay = orderSnapshotRef.current?.bun ? 650 : 0;
    const timer = setTimeout(commit, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOrdering]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // UI state
    activeItem,
    setActiveItem,
    isOrdering,
    toastVisible,
    exitingBurgerIds,
    // Draft / derived
    draft,
    burgerItems,
    selectedWrapper,
    bunBase,
    bunWidth,
    topBunSrc,
    selectedMeats,
    selectedCheeses,
    selectedSauces,
    hasMeat,
    ingredientLayers,
    // Merged (static + admin-created custom) ingredient lists/maps for the
    // preview wheels — see burgerCustomMerge.js
    mergedBuns: bunMerge.list,
    mergedBunPreviews,
    mergedBunPositions,
    mergedMeats: meatMerge.list,
    mergedMeatPreviews,
    mergedMeatPositions,
    mergedCheeses: cheeseMerge.list,
    mergedCheesePreviews,
    mergedCheesePositions,
    mergedSauces: sauceMerge.list,
    mergedSaucePreviews,
    mergedSaucePositions,
    mergedVegetables: vegetableMerge.list,
    mergedVegetablePreviews,
    mergedVegetablePositions,
    // Order
    handleOrder,
    // Burger panel
    handleEditBurger,
    handleRemoveBurger,
    // Ingredient selection
    handleSelectBun,
    handleToggleSauce,
    handleToggleMeat,
    handleIncrementMeat,
    handleDecrementMeat,
    handleToggleCheese,
    handleIncrementCheese,
    handleDecrementCheese,
    handleToggleVegetable,
    setName,
    // Limits (used by orbital UI for disabled states)
    MAX_MEAT_QTY,
    MAX_CHEESE_QTY,
    MAX_VEG_QTY,
    SAUCE_LIMIT,
  };
}
