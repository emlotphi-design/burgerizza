import { createContext, useContext, useState, useCallback } from 'react';

export const DEFAULT_BURGER_DRAFT = {
  bun: null,
  meats: {},    // { [meatId]: quantity }
  cheeses: {},  // { [cheeseId]: quantity }
  sauces: [],
  vegetables: [],
  selectionOrder: [], // [{ type, id }] — visual stacking order, last = top layer
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
    // Build selectionOrder with one entry per layer (qty=2 → 2 entries).
    // Runs when absent OR when a meat/cheese has qty > the current entry count
    // (old format stored one entry per ingredient regardless of qty).
    const needsRebuild = !stored.selectionOrder ||
      Object.entries(stored.meats   ?? {}).some(([id, qty]) => qty > (stored.selectionOrder).filter(e => e.type === 'meat'   && e.id === id).length) ||
      Object.entries(stored.cheeses ?? {}).some(([id, qty]) => qty > (stored.selectionOrder).filter(e => e.type === 'cheese' && e.id === id).length);
    if (needsRebuild) {
      const order = [];
      for (const id of (stored.sauces ?? [])) order.push({ type: 'sauce', id });
      for (const [id, qty] of Object.entries(stored.meats   ?? {})) for (let i = 0; i < qty; i++) order.push({ type: 'meat',   id });
      for (const [id, qty] of Object.entries(stored.cheeses ?? {})) for (let i = 0; i < qty; i++) order.push({ type: 'cheese', id });
      for (const id of (stored.vegetables ?? [])) order.push({ type: 'vegetable', id });
      stored.selectionOrder = order;
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
