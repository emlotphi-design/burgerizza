import { createContext, useContext, useState, useCallback, useRef } from 'react';

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readLS('bz_pizzas', []));

  // Counter seeded from both cart and saved to avoid ID collisions across stores
  const counterRef = useRef(null);
  if (counterRef.current === null) {
    const cartIds  = readLS('bz_pizzas', []).map(p => p.id ?? 0);
    const savedIds = readLS('bz_saved',  []).map(p => p.id ?? 0);
    const allIds   = [...cartIds, ...savedIds];
    counterRef.current = allIds.length ? Math.max(...allIds) + 1 : 1;
  }

  // nextId is exposed so PizzaContext can coordinate IDs shared between cart
  // and savedItems (e.g. saveDraftAsPizza uses the same id for both)
  const nextId = useCallback(() => counterRef.current++, []);

  // addItem accepts an item object OR a function (prev) => item, so callers
  // can compute auto-numbered names based on the live items length
  const addItem = useCallback((itemOrFn) => {
    setItems(prev => {
      const item = typeof itemOrFn === 'function' ? itemOrFn(prev) : itemOrFn;
      const next = [...prev, item];
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => {
      const next = prev.filter(p => p.id !== id);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const setQuantity = useCallback((id, qty) => {
    setItems(prev => {
      const next = prev.map(p => p.id === id ? { ...p, quantity: Math.max(1, qty) } : p);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const renameItem = useCallback((id, name) => {
    setItems(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name } : p);
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    writeLS('bz_pizzas', []);
  }, []);

  const replaceCart = useCallback((newItems) => {
    const next = newItems.map(p => ({ ...p, id: counterRef.current++ }));
    setItems(next);
    writeLS('bz_pizzas', next);
  }, []);

  // Reorder a saved item back into the cart — always gets a fresh id
  const addToCart = useCallback((item) => {
    const id = counterRef.current++;
    setItems(prev => {
      const cartItem = { ...item, id, quantity: 1 };
      const next = [...prev, cartItem];
      writeLS('bz_pizzas', next);
      return next;
    });
  }, []);

  return (
    <CartCtx.Provider value={{
      items,
      nextId,
      addItem,
      removeItem,
      setQuantity,
      renameItem,
      clearCart,
      replaceCart,
      addToCart,
    }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCartStore() { return useContext(CartCtx); }
