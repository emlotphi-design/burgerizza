import { createContext, useContext, useState, useCallback, useRef } from 'react';

/* ─── SHA-256 via Web Crypto (auth-backend-ready) ──────── */
async function sha256(str) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str + '__bz_2025_salt')
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ─── localStorage helpers ─────────────────────────────── */
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function removeLS(key) {
  try { localStorage.removeItem(key); } catch {}
}

/* ─── User factory ─────────────────────────────────────── */
export function makeUser({ fullName, email, phone = '', passwordHash, address = {} }) {
  return {
    id: crypto.randomUUID(),
    fullName,
    email: email.toLowerCase().trim(),
    phone,
    passwordHash,
    address: {
      street: '', houseNumber: '', postalCode: '',
      city: '', floor: '', doorbellName: '',
      ...address,
    },
    savedPizzas:  [],
    orderHistory: [],
    createdAt: new Date().toISOString(),
  };
}

/* ─── Context ──────────────────────────────────────────── */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => readLS('bz_accounts', []));
  const [currentUser, setCurrentUser] = useState(() => {
    const session = readLS('bz_session', null);
    if (!session?.userId) return null;
    const accs = readLS('bz_accounts', []);
    return accs.find(a => a.id === session.userId) ?? null;
  });

  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  /* keep currentUser in sync inside callbacks */
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  function persistAccounts(next) {
    setAccounts(next);
    writeLS('bz_accounts', next);
  }

  function openSession(user) {
    setCurrentUser(user);
    writeLS('bz_session', { userId: user.id });
  }

  /* ── register ─────────────────────────────────────────── */
  const register = useCallback(async ({ fullName, email, phone, password, address }) => {
    const accs = accountsRef.current;
    const norm = email.toLowerCase().trim();
    if (accs.find(a => a.email === norm)) {
      return { error: 'Diese E-Mail ist bereits registriert.' };
    }
    const passwordHash = await sha256(password);
    const user = makeUser({ fullName, email, phone, passwordHash, address });
    persistAccounts([...accs, user]);
    openSession(user);
    return { user };
  }, []);

  /* ── login ────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    const accs = accountsRef.current;
    const norm = email.toLowerCase().trim();
    const user = accs.find(a => a.email === norm);
    if (!user) return { error: 'Kein Konto mit dieser E-Mail gefunden.' };
    const passwordHash = await sha256(password);
    if (user.passwordHash !== passwordHash) return { error: 'Falsches Passwort.' };
    openSession(user);
    return { user };
  }, []);

  /* ── logout ───────────────────────────────────────────── */
  const logout = useCallback(() => {
    setCurrentUser(null);
    removeLS('bz_session');
  }, []);

  /* ── updateProfile ────────────────────────────────────── */
  const updateProfile = useCallback(async (partial, newPassword) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;

    let passwordHash = currentUserRef.current.passwordHash;
    if (newPassword) passwordHash = await sha256(newPassword);

    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        const updated = { ...a, ...partial, passwordHash };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  /* ── addOrder ─────────────────────────────────────────── */
  const addOrder = useCallback((order) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        const updated = { ...a, orderHistory: [order, ...a.orderHistory] };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  /* ── savePizzaToProfile ───────────────────────────────── */
  const savePizzaToProfile = useCallback((pizza) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        if (a.savedPizzas.find(p => p.id === pizza.id)) return a;
        const saved = { ...pizza, savedAt: new Date().toISOString(), isFavorite: false };
        const updated = { ...a, savedPizzas: [...a.savedPizzas, saved] };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  /* ── removeSavedPizza ─────────────────────────────────── */
  const removeSavedPizza = useCallback((pizzaId) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        const updated = { ...a, savedPizzas: a.savedPizzas.filter(p => p.id !== pizzaId) };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  /* ── toggleFavorite ───────────────────────────────────── */
  const toggleFavorite = useCallback((pizzaId) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        const savedPizzas = a.savedPizzas.map(p =>
          p.id === pizzaId ? { ...p, isFavorite: !p.isFavorite } : p
        );
        const updated = { ...a, savedPizzas };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  /* ── renameSavedPizza ─────────────────────────────────── */
  const renameSavedPizza = useCallback((pizzaId, name) => {
    const uid = currentUserRef.current?.id;
    if (!uid) return;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id !== uid) return a;
        const savedPizzas = a.savedPizzas.map(p =>
          p.id === pizzaId ? { ...p, name } : p
        );
        const updated = { ...a, savedPizzas };
        setCurrentUser(updated);
        currentUserRef.current = updated;
        return updated;
      });
      writeLS('bz_accounts', next);
      return next;
    });
  }, []);

  return (
    <AuthCtx.Provider value={{
      currentUser,
      isLoggedIn: !!currentUser,
      register,
      login,
      logout,
      updateProfile,
      addOrder,
      savePizzaToProfile,
      removeSavedPizza,
      toggleFavorite,
      renameSavedPizza,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }
