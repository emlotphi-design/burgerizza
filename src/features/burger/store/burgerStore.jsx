import { createContext, useContext, useState, useCallback } from 'react';

export const DEFAULT_BURGER_DRAFT = {
  bun: null,
  meats: {},    // { [meatId]: quantity }
  cheeses: {},  // { [cheeseId]: quantity }
  sauces: [],
  vegetables: [],
  wrapper: null,
  name: '',
  editingId: null,
};

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const BurgerCtx = createContext(null);

export function BurgerProvider({ children }) {
  const [draft, _setDraft] = useState(() => {
    const stored = readLS('bz_burger_draft', {});
    // Migrate old array format to object map
    if (Array.isArray(stored.meats)) {
      stored.meats = Object.fromEntries((stored.meats).map(id => [id, 1]));
    }
    // Migrate old scalar cheese to object map
    if (stored.cheese != null && !stored.cheeses) {
      stored.cheeses = { [stored.cheese]: 1 };
      delete stored.cheese;
    }
    return { ...DEFAULT_BURGER_DRAFT, ...stored };
  });

  const setDraft = useCallback((partialOrFn) => {
    _setDraft(prev => {
      const partial = typeof partialOrFn === 'function' ? partialOrFn(prev) : partialOrFn;
      const next = { ...prev, ...partial };
      writeLS('bz_burger_draft', next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    _setDraft(DEFAULT_BURGER_DRAFT);
    writeLS('bz_burger_draft', DEFAULT_BURGER_DRAFT);
  }, []);

  return (
    <BurgerCtx.Provider value={{ draft, setDraft, clearDraft }}>
      {children}
    </BurgerCtx.Provider>
  );
}

export function useBurgerStore() { return useContext(BurgerCtx); }
