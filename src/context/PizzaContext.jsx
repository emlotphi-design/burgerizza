import { createContext, useContext, useState, useRef, useCallback } from 'react';

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
  const [pizzas,     setPizzas]     = useState(() => readLS('bz_pizzas', []));
  const [draft,      _setDraft]     = useState(() => ({ ...DEFAULT_DRAFT, ...readLS('bz_draft', {}) }));
  const [savedItems, setSavedItems] = useState(() => readLS('bz_saved', []));

  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Counter seeded from both cart and saved to avoid ID collisions
  const counterRef = useRef(null);
  if (counterRef.current === null) {
    const cartItems  = readLS('bz_pizzas', []);
    const savedSnap  = readLS('bz_saved',  []);
    const allIds     = [...cartItems, ...savedSnap].map(p => p.id ?? 0);
    counterRef.current = allIds.length ? Math.max(...allIds) + 1 : 1;
  }
  function nextId() { return counterRef.current++; }

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

    // Cart item (auto-numbered fallback name uses prev.length)
    setPizzas(prev => {
      const pizza = isNew
        ? { ...base, name: custom || `Custom Pizza #${prev.length + 1}`, quantity: 1 }
        : { ...base, name: custom || d.editingName || 'Custom Pizza', quantity: d.editingQuantity ?? 1 };
      const next = [...prev, pizza];
      writeLS('bz_pizzas', next);
      return next;
    });

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
  }, []);

  const removePizza = useCallback((id) => {
    setPizzas(prev => {
      const next = prev.filter(p => p.id !== id);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const setQuantity = useCallback((id, qty) => {
    setPizzas(prev => {
      const next = prev.map(p => p.id === id ? { ...p, quantity: Math.max(1, qty) } : p);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const renamePizza = useCallback((id, name) => {
    setPizzas(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name } : p);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const startEditing = useCallback((pizza) => {
    const d = draftRef.current;

    // Auto-save an in-progress new pizza before switching
    if (d.editingId === null && d.selectedDough && d.selectedSauce && d.selectedCheese) {
      const newId = nextId();
      setPizzas(prev => {
        const auto = {
          id: newId,
          name: d.draftName.trim() || `Custom Pizza #${prev.length + 1}`,
          dough: d.selectedDough,
          sauce: d.selectedSauce,
          cheese: d.selectedCheese,
          meats: d.selectedMeats,
          vegetables: d.selectedVegetables,
          quantity: 1,
        };
        const next = [...prev, auto];
        writeLS('bz_pizzas', next);
        return next;
      });
    }

    // Remove target pizza from cart (no-op if it's a saved-only item)
    setPizzas(prev => {
      const next = prev.filter(p => p.id !== pizza.id);
      writeLS('bz_pizzas', next);
      return next;
    });

    const newDraft = {
      ...DEFAULT_DRAFT,
      selectedDough:    pizza.dough,
      selectedSauce:    pizza.sauce,
      selectedCheese:   pizza.cheese,
      selectedMeats:    pizza.meats ?? [],
      selectedVegetables: pizza.vegetables ?? [],
      draftName:        pizza.name,
      editingId:        pizza.id,
      editingName:      pizza.name,
      editingQuantity:  pizza.quantity ?? 1,
    };
    _setDraft(newDraft);
    writeLS('bz_draft', newDraft);
  }, []);

  const addBurger = useCallback((burgerDraft) => {
    const id        = nextId();
    const isEditing = !!burgerDraft.editingId;

    const burgerBase = {
      id,
      type:       'burger',
      bun:        burgerDraft.bun,
      topBun:     burgerDraft.bun,
      meats:      burgerDraft.meats   ?? {},
      cheeses:    burgerDraft.cheeses ?? {},
      sauces:     burgerDraft.sauces  ?? [],
      vegetables: burgerDraft.vegetables ?? [],
      image:      burgerDraft.image ?? null,
      quantity:   1,
    };

    // Cart item (auto-numbered fallback uses prev.length)
    setPizzas(prev => {
      const burger = {
        ...burgerBase,
        name: burgerDraft.name?.trim() || `Custom Burger #${prev.length + 1}`,
      };
      const next = [...prev, burger];
      writeLS('bz_pizzas', next);
      return next;
    });

    // Save new burgers to profile (not edits of existing cart items)
    if (!isEditing) {
      setSavedItems(prev => {
        const entry = {
          ...burgerBase,
          name: burgerDraft.name?.trim() || 'My Custom Burger',
          savedAt: new Date().toISOString(),
        };
        const next = [entry, ...prev];
        writeLS('bz_saved', next);
        return next;
      });
    }
  }, []);

  const removeSavedItem = useCallback((id) => {
    setSavedItems(prev => {
      const next = prev.filter(item => item.id !== id);
      writeLS('bz_saved', next);
      return next;
    });
  }, []);

  // Add a saved item back to the cart (reorder) — always gets a fresh id
  const addToCart = useCallback((item) => {
    const id = nextId();
    setPizzas(prev => {
      const cartItem = { ...item, id, quantity: 1 };
      const next = [...prev, cartItem];
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setPizzas([]);
    writeLS('bz_pizzas', []);
    clearDraft();
  }, [clearDraft]);

  const replaceCart = useCallback((newPizzas) => {
    const next = newPizzas.map(p => ({ ...p, id: counterRef.current++ }));
    setPizzas(next);
    writeLS('bz_pizzas', next);
    _setDraft(DEFAULT_DRAFT);
    writeLS('bz_draft', DEFAULT_DRAFT);
  }, []);

  return (
    <Ctx.Provider value={{
      pizzas, draft, savedItems,
      setDraft, clearDraft, saveDraftAsPizza,
      removePizza, setQuantity, renamePizza,
      startEditing, clearCart, replaceCart,
      addBurger,
      removeSavedItem, addToCart,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePizzaStore() { return useContext(Ctx); }
