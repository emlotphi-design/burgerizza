import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

/* ─── Per-user localStorage helpers ────────────────────── */
function uKey(uid, suffix) { return `bz_${suffix}_${uid}`; }

function readULS(uid, suffix, fallback) {
  try { return JSON.parse(localStorage.getItem(uKey(uid, suffix)) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function writeULS(uid, suffix, val) {
  try { localStorage.setItem(uKey(uid, suffix), JSON.stringify(val)); } catch {}
}

/* ─── Map Supabase user → app user shape ───────────────── */
function toAppUser(supaUser) {
  if (!supaUser) return null;
  const m = supaUser.user_metadata ?? {};
  return {
    id:           supaUser.id,
    email:        supaUser.email,
    fullName:     m.fullName ?? '',
    phone:        m.phone    ?? '',
    createdAt:    supaUser.created_at,
    savedPizzas:  readULS(supaUser.id, 'saved',  []),
    orderHistory: readULS(supaUser.id, 'orders', []),
  };
}

/* ─── German error messages ─────────────────────────────── */
function mapError(code = '', msg = '') {
  if (code === 'invalid_credentials'
   || msg.includes('Invalid login credentials'))        return 'Falsche E-Mail oder Passwort.';
  if (code === 'email_not_confirmed'
   || msg.includes('Email not confirmed'))              return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (code === 'user_already_exists'
   || msg.includes('User already registered')
   || msg.includes('already registered'))               return 'Diese E-Mail ist bereits registriert. Bitte melde dich an.';
  if (msg.includes('Password should be'))               return 'Passwort muss mindestens 6 Zeichen haben.';
  if (code === 'over_email_send_rate_limit'
   || msg.includes('over_email_send_rate_limit')
   || msg.includes('email rate limit')
   || msg.includes('rate limit'))                       return 'Zu viele Versuche. Bitte warte einige Minuten.';
  if (msg.includes('Unable to validate'))               return 'Ungültige E-Mail-Adresse.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Netzwerkfehler. Bitte prüfe deine Verbindung.';
  return msg || 'Ein unbekannter Fehler ist aufgetreten.';
}

/* ─── Hydrate user from public.profiles (primary DB source) ─
   Fetches name/phone from the profiles row so they stay fresh
   even if user_metadata hasn't been updated yet.
   Delivery address is NOT stored here — use useDeliveryAddress.
──────────────────────────────────────────────────────────── */
async function hydrateUser(supaUser) {
  if (!supaUser) return null;
  const base = toAppUser(supaUser);

  try {
    const { data: row, error } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', base.id)
      .single();

    if (error || !row) return base;

    return {
      ...base,
      fullName: row.full_name || base.fullName,
      phone:    row.phone     || base.phone,
    };
  } catch (err) {
    console.error('[auth] hydrateUser threw:', err?.message);
    return base;
  }
}

/* ─── Context ──────────────────────────────────────────── */
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const registerInFlight = useRef(false);
  const loginInFlight    = useRef(false);

  /* Restore session on mount, listen for auth changes */
  useEffect(() => {
    // Step 1 — quick render: set basic user from session cache (no DB call)
    // then enrich async from profiles table so address is available immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { setCurrentUser(null); setLoading(false); return; }
      setCurrentUser(toAppUser(session.user)); // fast, from localStorage cache
      setLoading(false);
      hydrateUser(session.user).then(enriched => setCurrentUser(enriched)); // DB fetch
    });

    // Step 2 — auth events: sign-in / sign-out / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[auth] onAuthStateChange →', event, '| session:', !!session);
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token rotated — keep existing profile data, no extra DB call needed
          setLoading(false);
        } else if (session?.user) {
          // SIGNED_IN, USER_UPDATED, INITIAL_SESSION, PASSWORD_RECOVERY
          hydrateUser(session.user).then(appUser => {
            setCurrentUser(appUser);
            setLoading(false);
          });
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ── register ─────────────────────────────────────────── */
  const register = useCallback(async ({ fullName, email, phone, password }) => {
    if (registerInFlight.current) return {};
    registerInFlight.current = true;

    // Hardcoded production callback — must match Supabase → Auth → Redirect URLs exactly.
    // Dynamic SITE_URL was causing silent email failures on mobile when the computed URL
    // did not appear in Supabase's allowed redirect list.
    const redirectTo = 'https://burgerizza-iota.vercel.app/auth/callback';
    console.log('[auth] signUp →', email, '| redirectTo:', redirectTo);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { fullName, phone },
          emailRedirectTo: redirectTo,
        },
      });

      console.log('[auth] signUp result:', {
        userId:          data?.user?.id               ?? null,
        hasSession:      !!data?.session,
        identities:      data?.user?.identities?.length ?? 'n/a',
        emailConfirmed:  data?.user?.email_confirmed_at ?? null,
        errorCode:       error?.code                  ?? null,
        errorMsg:        error?.message               ?? null,
      });

      if (error) return { error: mapError(error.code ?? '', error.message ?? '') };

      // Supabase "fake success": email already registered — identities array is empty,
      // no email is sent (email enumeration protection).
      if (data.user && data.user.identities?.length === 0) {
        console.warn('[auth] fake success — email already exists:', email);
        return { error: 'Diese E-Mail ist bereits registriert. Bitte melde dich an oder setze dein Passwort zurück.' };
      }

      // No session → email confirmation required (normal case with confirm email enabled)
      if (!data.session) {
        console.log('[auth] confirmation email dispatched to:', email);
        return { needsVerification: true };
      }

      // Session present → Supabase auto-confirmed (confirm email disabled) → logged in
      console.log('[auth] auto-confirm enabled — user logged in immediately:', email);
      return { user: toAppUser(data.user) };
    } catch (err) {
      console.error('[auth] signUp threw:', err?.message);
      return { error: mapError(err?.message ?? '') };
    } finally {
      registerInFlight.current = false;
    }
  }, []);

  /* ── login ────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    if (loginInFlight.current) return {};
    loginInFlight.current = true;
    console.log('[auth] login →', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn('[auth] login error:', error.code, error.message);
        return { error: mapError(error.code ?? '', error.message ?? '') };
      }

      console.log('[auth] login ok:', data.user?.id ?? null);
      return { user: toAppUser(data.user) };
    } catch (err) {
      console.error('[auth] login threw:', err?.message);
      return { error: mapError(err?.message ?? '') };
    } finally {
      loginInFlight.current = false;
    }
  }, []);

  /* ── logout ───────────────────────────────────────────── */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('bz_jwt');
  }, []);

  /* ── changePassword ───────────────────────────────────── */
  const changePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? mapError(error.code ?? '', error.message ?? '') : null };
  }, []);

  /* ── updateProfile ────────────────────────────────────────
     Updates name and phone only.
     Delivery address is managed separately via useDeliveryAddress.
  ──────────────────────────────────────────────────────────── */
  const updateProfile = useCallback(async (partial, newPassword) => {
    if (!currentUser) return;

    const fullName = partial.fullName ?? currentUser.fullName ?? '';
    const phone    = partial.phone    ?? currentUser.phone    ?? '';

    // ── 1. Update public.profiles (name + phone only) ───────
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ id: currentUser.id, full_name: fullName, phone }, { onConflict: 'id' });

    if (dbError) console.error('[auth] profiles upsert failed:', dbError.message);

    // ── 2. Update auth user_metadata so JWT claims stay fresh ─
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: { fullName, phone },
      ...(newPassword ? { password: newPassword } : {}),
    });
    if (authError) console.error('[auth] updateUser (metadata) failed:', authError.message);

    // ── 3. Optimistic local state update ────────────────────
    if (!authError && authData?.user) {
      setCurrentUser(prev => ({
        ...toAppUser(authData.user),
        savedPizzas:  prev.savedPizzas,
        orderHistory: prev.orderHistory,
      }));
    } else {
      setCurrentUser(prev => ({ ...prev, fullName, phone }));
    }
  }, [currentUser]);

  /* ── addOrder ─────────────────────────────────────────── */
  const addOrder = useCallback((order) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setCurrentUser(prev => {
      const orderHistory = [order, ...prev.orderHistory];
      writeULS(uid, 'orders', orderHistory);
      return { ...prev, orderHistory };
    });
  }, [currentUser?.id]);

  /* ── savePizzaToProfile ───────────────────────────────── */
  const savePizzaToProfile = useCallback((pizza) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setCurrentUser(prev => {
      if (prev.savedPizzas.find(p => p.id === pizza.id)) return prev;
      const savedPizzas = [
        ...prev.savedPizzas,
        { ...pizza, savedAt: new Date().toISOString(), isFavorite: false },
      ];
      writeULS(uid, 'saved', savedPizzas);
      return { ...prev, savedPizzas };
    });
  }, [currentUser?.id]);

  /* ── removeSavedPizza ─────────────────────────────────── */
  const removeSavedPizza = useCallback((pizzaId) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setCurrentUser(prev => {
      const savedPizzas = prev.savedPizzas.filter(p => p.id !== pizzaId);
      writeULS(uid, 'saved', savedPizzas);
      return { ...prev, savedPizzas };
    });
  }, [currentUser?.id]);

  /* ── toggleFavorite ───────────────────────────────────── */
  const toggleFavorite = useCallback((pizzaId) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setCurrentUser(prev => {
      const savedPizzas = prev.savedPizzas.map(p =>
        p.id === pizzaId ? { ...p, isFavorite: !p.isFavorite } : p
      );
      writeULS(uid, 'saved', savedPizzas);
      return { ...prev, savedPizzas };
    });
  }, [currentUser?.id]);

  /* ── renameSavedPizza ─────────────────────────────────── */
  const renameSavedPizza = useCallback((pizzaId, name) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setCurrentUser(prev => {
      const savedPizzas = prev.savedPizzas.map(p =>
        p.id === pizzaId ? { ...p, name } : p
      );
      writeULS(uid, 'saved', savedPizzas);
      return { ...prev, savedPizzas };
    });
  }, [currentUser?.id]);

  return (
    <AuthCtx.Provider value={{
      currentUser,
      isLoggedIn: !!currentUser,
      loading,
      register,
      login,
      logout,
      changePassword,
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
