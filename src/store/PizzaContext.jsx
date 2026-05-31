import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useCartStore } from './cartStore';

export const DEFAULT_DRAFT = {
  activeCategory: 'dough',
  selectedDough: null,
  selectedSauce: null,
  selectedCheese: null,
  selectedMeats: [],
  selectedVegetables: [],
  draftName: '',
  editingId: null,
  editingName: null,
  editingQuantity: 1,
};

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const Ctx = createContext(null);

export function PizzaProvider({ children }) {
  // Cart state lives entirely in cartStore — no duplicate state here
  const {
    items,
    nextId,
    addItem,
    removeItem,
    setQuantity,
    renameItem,
    clearCart:   clearCartItems,
    replaceCart: replaceCartItems,
    addToCart,
  } = useCartStore();

  const [draft,      _setDraft]     = useState(() => ({ ...DEFAULT_DRAFT, ...readLS('bz_draft', {}) }));
  const [savedItems, setSavedItems] = useState(() => readLS('bz_saved', []));

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const setDraft = useCallback((partialOrFn) => {
    _setDraft(prev => {
      const partial = typeof partialOrFn === 'function' ? partialOrFn(prev) : partialOrFn;
      const next = { ...prev, ...partial };
      writeLS('bz_draft', next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    _setDraft(DEFAULT_DRAFT);
    writeLS('bz_draft', DEFAULT_DRAFT);
  }, []);

  const saveDraftAsPizza = useCallback(() => {
    const d = draftRef.current;
    if (!d.selectedDough || !d.selectedSauce || !d.selectedCheese) return false;

    const id     = d.editingId !== null ? d.editingId : nextId();
    const isNew  = d.editingId === null;
    const custom = d.draftName.trim();

    const base = {
      id,
      dough:      d.selectedDough,
      sauce:      d.selectedSauce,
      cheese:     d.selectedCheese,
      meats:      d.selectedMeats,
      vegetables: d.selectedVegetables,
    };

    // Cart item — functional form so auto-numbered name uses live prev.length
    addItem(prev => isNew
      ? { ...base, name: custom || `Custom Pizza #${prev.length + 1}`, quantity: 1 }
      : { ...base, name: custom || d.editingName || 'Custom Pizza', quantity: d.editingQuantity ?? 1 }
    );

    // Saved-items: add new or update existing
    const profileName = custom || (isNew ? 'My Custom Pizza' : d.editingName || 'Custom Pizza');
    if (isNew) {
      setSavedItems(prev => {
        const entry = { ...base, name: profileName, quantity: 1, savedAt: new Date().toISOString() };
        const next  = [entry, ...prev];
        writeLS('bz_saved', next);
        return next;
      });
    } else {
      setSavedItems(prev => {
        const next = prev.map(item =>
          item.id === id ? { ...item, ...base, name: profileName } : item
        );
        writeLS('bz_saved', next);
        return next;
      });
    }

    return true;
  }, [nextId, addItem]);

  const startEditing = useCallback((pizza) => {
    const d = draftRef.current;

    // Auto-save an in-progress new pizza before switching
    if (d.editingId === null && d.selectedDough && d.selectedSauce && d.selectedCheese) {
      const newId = nextId();
      addItem(prev => ({
        id:         newId,
        name:       d.draftName.trim() || `Custom Pizza #${prev.length + 1}`,
        dough:      d.selectedDough,
        sauce:      d.selectedSauce,
        cheese:     d.selectedCheese,
        meats:      d.selectedMeats,
        vegetables: d.selectedVegetables,
        quantity:   1,
      }));
    }

    // Remove target pizza from cart (no-op if it's a saved-only item)
    removeItem(pizza.id);

    const newDraft = {
      ...DEFAULT_DRAFT,
      selectedDough:      pizza.dough,
      selectedSauce:      pizza.sauce,
      selectedCheese:     pizza.cheese,
      selectedMeats:      pizza.meats ?? [],
      selectedVegetables: pizza.vegetables ?? [],
      draftName:          pizza.name,
      editingId:          pizza.id,
      editingName:        pizza.name,
      editingQuantity:    pizza.quantity ?? 1,
    };
    _setDraft(newDraft);
    writeLS('bz_draft', newDraft);
  }, [nextId, addItem, removeItem]);

  const addBurger = useCallback((burgerDraft) => {
    const id        = nextId();
    const isEditing = !!burgerDraft.editingId;

    const burgerBase = {
      id,
      type:       'burger',
      bun:        burgerDraft.bun,
      topBun:     burgerDraft.bun,
      meats:      burgerDraft.meats      ?? {},
      cheeses:    burgerDraft.cheeses    ?? {},
      sauces:     burgerDraft.sauces     ?? [],
      vegetables: burgerDraft.vegetables ?? [],
      image:      burgerDraft.image      ?? null,
      quantity:   1,
    };

    // Cart item — functional form for auto-numbered name
    addItem(prev => ({
      ...burgerBase,
      name: burgerDraft.name?.trim() || `Custom Burger #${prev.length + 1}`,
    }));

    // Save new burgers to profile (not edits of existing cart items)
    if (!isEditing) {
      setSavedItems(prev => {
        const entry = { ...burgerBase, name: burgerDraft.name?.trim() || 'My Custom Burger', savedAt: new Date().toISOString() };
        const next  = [entry, ...prev];
        writeLS('bz_saved', next);
        return next;
      });
    }
  }, [nextId, addItem]);

  const removeSavedItem = useCallback((id) => {
    setSavedItems(prev => {
      const next = prev.filter(item => item.id !== id);
      writeLS('bz_saved', next);
      return next;
    });
  }, []);

  // clearCart clears cart items AND the pizza builder draft
  const clearCart = useCallback(() => {
    clearCartItems();
    clearDraft();
  }, [clearCartItems, clearDraft]);

  // replaceCart replaces items AND resets draft
  const replaceCart = useCallback((newPizzas) => {
    replaceCartItems(newPizzas);
    _setDraft(DEFAULT_DRAFT);
    writeLS('bz_draft', DEFAULT_DRAFT);
  }, [replaceCartItems]);

  return (
    <Ctx.Provider value={{
      // Cart state — sourced from cartStore, aliased for backward compatibility
      pizzas:     items,
      removePizza: removeItem,
      setQuantity,
      renamePizza: renameItem,
      addToCart,
      clearCart,
      replaceCart,
      // Pizza builder state — owned by this context
      draft,
      savedItems,
      setDraft,
      clearDraft,
      saveDraftAsPizza,
      startEditing,
      addBurger,
      removeSavedItem,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePizzaStore() { return useContext(Ctx); }
