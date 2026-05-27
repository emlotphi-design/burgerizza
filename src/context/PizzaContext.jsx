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
  const [pizzas, setPizzas] = useState(() => readLS('bz_pizzas', []));
  const [draft,  _setDraft] = useState(() => ({ ...DEFAULT_DRAFT, ...readLS('bz_draft', {}) }));

  // Always-current ref so stable callbacks can read the latest draft
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Persist counter across renders/refreshes
  const counterRef = useRef(null);
  if (counterRef.current === null) {
    const saved = readLS('bz_pizzas', []);
    const ids = saved.map(p => p.id ?? 0);
    counterRef.current = ids.length ? Math.max(...ids) + 1 : 1;
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

  // Save/update current draft as a pizza in the list.
  // Returns true if saved, false if draft is incomplete.
  const saveDraftAsPizza = useCallback(() => {
    const d = draftRef.current;
    if (!d.selectedDough || !d.selectedSauce || !d.selectedCheese) return false;

    const id = d.editingId !== null ? d.editingId : nextId();

    setPizzas(prev => {
      const pizza = d.editingId !== null
        ? {
            id,
            name: d.draftName.trim() || d.editingName || 'Custom Pizza',
            dough: d.selectedDough,
            sauce: d.selectedSauce,
            cheese: d.selectedCheese,
            meats: d.selectedMeats,
            vegetables: d.selectedVegetables,
            quantity: d.editingQuantity ?? 1,
          }
        : {
            id,
            name: d.draftName.trim() || `Custom Pizza #${prev.length + 1}`,
            dough: d.selectedDough,
            sauce: d.selectedSauce,
            cheese: d.selectedCheese,
            meats: d.selectedMeats,
            vegetables: d.selectedVegetables,
            quantity: 1,
          };
      const next = [...prev, pizza];
      writeLS('bz_pizzas', next);
      return next;
    });
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

  // Load a pizza into the builder for editing.
  // Auto-saves the current in-progress draft if it's valid.
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

    // Remove target pizza from list (it lives in the draft while editing)
    setPizzas(prev => {
      const next = prev.filter(p => p.id !== pizza.id);
      writeLS('bz_pizzas', next);
      return next;
    });

    const newDraft = {
      ...DEFAULT_DRAFT,
      selectedDough: pizza.dough,
      selectedSauce: pizza.sauce,
      selectedCheese: pizza.cheese,
      selectedMeats: pizza.meats ?? [],
      selectedVegetables: pizza.vegetables ?? [],
      draftName: pizza.name,
      editingId: pizza.id,
      editingName: pizza.name,
      editingQuantity: pizza.quantity ?? 1,
    };
    _setDraft(newDraft);
    writeLS('bz_draft', newDraft);
  }, []);

  const addBurger = useCallback((burgerDraft) => {
    const id = nextId();
    setPizzas(prev => {
      const burger = {
        id,
        type: 'burger',
        name: burgerDraft.name?.trim() || `Custom Burger #${prev.length + 1}`,
        bun: burgerDraft.bun,
        topBun: burgerDraft.bun,
        meats: burgerDraft.meats ?? {},
        cheese: burgerDraft.cheese ?? null,
        sauces: burgerDraft.sauces ?? [],
        vegetables: burgerDraft.vegetables ?? [],
        image: burgerDraft.image ?? null,
        quantity: 1,
      };
      const next = [...prev, burger];
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
      pizzas, draft,
      setDraft, clearDraft, saveDraftAsPizza,
      removePizza, setQuantity, renamePizza,
      startEditing, clearCart, replaceCart,
      addBurger,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePizzaStore() { return useContext(Ctx); }
