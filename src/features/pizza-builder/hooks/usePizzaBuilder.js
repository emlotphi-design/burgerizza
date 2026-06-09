import { useState, useRef, useCallback, useEffect } from 'react';
import { usePizzaStore } from '../../../store/PizzaContext';
import { useIngredientConfig } from '../../../context/IngredientConfigContext';

const LOCK_MSG_DURATION = 2200;
const TOAST_DURATION    = 2800;

function buildUnlocked(dough, sauce, cheese) {
  return { dough: true, sauces: !!dough, cheese: !!sauce, meat: !!cheese, vegetables: !!cheese };
}

function buildCompleted(dough, sauce, cheese, meats, vegs) {
  return { dough: !!dough, sauces: !!sauce, cheese: !!cheese, meat: meats.length > 0, vegetables: vegs.length > 0 };
}

function getLockMessage(dough, sauce, cheese) {
  if (!dough)  return 'Please select a dough first';
  if (!sauce)  return 'Please select a sauce first';
  if (!cheese) return 'Please select a cheese first';
  return 'Complete the previous step first';
}

export function usePizzaBuilder() {
  const {
    pizzas, draft,
    setDraft, clearDraft, saveDraftAsPizza,
    removePizza, renamePizza, startEditing,
  } = usePizzaStore();

  const {
    activeCategory,
    selectedDough, selectedSauce, selectedCheese,
    selectedMeats, selectedVegetables,
    draftName, editingId, editingName,
  } = draft;

  const { isEnabled, config } = useIngredientConfig();

  const [lockMsg,     setLockMsg]     = useState('');
  const [exitingIds,  setExitingIds]  = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const lockTimerRef  = useRef(null);
  const toastTimerRef = useRef(null);

  // Auto-deselect any pizza ingredient that becomes disabled via admin dashboard.
  // Runs on mount (initial localStorage config) and whenever config changes
  // (realtime event or cross-tab storage event).
  useEffect(() => {
    const updates = {};

    if (selectedDough && !isEnabled('pizza', selectedDough)) {
      updates.selectedDough = null;
    }
    if (selectedSauce && !isEnabled('pizza', selectedSauce)) {
      updates.selectedSauce = null;
    }
    if (selectedCheese && !isEnabled('pizza', selectedCheese)) {
      updates.selectedCheese = null;
    }

    const validMeats = selectedMeats.filter(id => isEnabled('pizza', id));
    if (validMeats.length !== selectedMeats.length) {
      updates.selectedMeats = validMeats;
    }

    const validVegs = selectedVegetables.filter(id => isEnabled('pizza', id));
    if (validVegs.length !== selectedVegetables.length) {
      updates.selectedVegetables = validVegs;
    }

    if (Object.keys(updates).length > 0) {
      setDraft(updates);
    }
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock page scroll while builder is mounted
  useEffect(() => {
    const prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.classList.add('is-builder');
    return () => {
      document.documentElement.style.overflowY = prev;
      document.body.classList.remove('is-builder');
    };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const pizzaItems     = pizzas.filter(p => p.type !== 'burger');
  const canAddToCart   = !!selectedDough && !!selectedSauce && !!selectedCheese;
  const isEditing      = editingId !== null;
  const nextPizzaNumber = pizzas.length + 1;

  const unlocked  = buildUnlocked(selectedDough, selectedSauce, selectedCheese);
  const completed = buildCompleted(selectedDough, selectedSauce, selectedCheese, selectedMeats, selectedVegetables);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;
    saveDraftAsPizza();
    clearDraft();
    clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), TOAST_DURATION);
  }, [canAddToCart, saveDraftAsPizza, clearDraft]);

  const handleEditPizza = useCallback((pizza) => {
    startEditing(pizza);
  }, [startEditing]);

  const handleDeletePizza = useCallback((id) => {
    setExitingIds(prev => [...prev, id]);
    setTimeout(() => {
      removePizza(id);
      setExitingIds(prev => prev.filter(x => x !== id));
    }, 400);
  }, [removePizza]);

  const handleCategoryChange = useCallback((id) => {
    if (!unlocked[id]) {
      const msg = getLockMessage(selectedDough, selectedSauce, selectedCheese);
      setLockMsg(msg);
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => setLockMsg(''), LOCK_MSG_DURATION);
      return;
    }
    setDraft({ activeCategory: id });
  }, [unlocked, selectedDough, selectedSauce, selectedCheese, setDraft]);

  const handleDoughSelect = useCallback((id) => setDraft({ selectedDough: id }), [setDraft]);
  const handleSauceSelect = useCallback((id) => setDraft({ selectedSauce: id }), [setDraft]);
  const handleCheeseSelect = useCallback((id) => setDraft({ selectedCheese: id }), [setDraft]);

  const handleMeatToggle = useCallback((id) => {
    setDraft(prev => {
      const cur  = prev.selectedMeats;
      const next = cur.includes(id)
        ? cur.filter(m => m !== id)
        : cur.length >= 4 ? cur : [...cur, id];
      return { selectedMeats: next };
    });
  }, [setDraft]);

  const handleVegetableToggle = useCallback((id) => {
    setDraft(prev => {
      const cur  = prev.selectedVegetables;
      const next = cur.includes(id)
        ? cur.filter(v => v !== id)
        : cur.length >= 6 ? cur : [...cur, id];
      return { selectedVegetables: next };
    });
  }, [setDraft]);

  const setDraftName = useCallback((val) => setDraft({ draftName: val }), [setDraft]);

  return {
    // Cart items (pizza only)
    pizzaItems,
    // Flags
    canAddToCart,
    isEditing,
    nextPizzaNumber,
    // UI state
    lockMsg,
    exitingIds,
    toastVisible,
    // Draft values (passed to canvas / toolbar as props)
    activeCategory,
    selectedDough,
    selectedSauce,
    selectedCheese,
    selectedMeats,
    selectedVegetables,
    draftName,
    editingId,
    editingName,
    // Toolbar data
    unlocked,
    completed,
    // Handlers
    handleAddToCart,
    handleEditPizza,
    handleDeletePizza,
    handleCategoryChange,
    handleDoughSelect,
    handleSauceSelect,
    handleCheeseSelect,
    handleMeatToggle,
    handleVegetableToggle,
    setDraftName,
    renamePizza,
  };
}
