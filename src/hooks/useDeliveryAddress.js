import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/AuthContext';

/* Map a profiles row (snake_case) → app address shape (camelCase) */
function rowToAddress(row) {
  return {
    fullName:     row.full_name    || '',
    phone:        row.phone        || '',
    street:       row.street       || '',
    houseNumber:  row.house_number || '',
    postalCode:   row.postal_code  || '',
    city:         row.city         || '',
    floor:        row.floor        || '',
    doorbellName: row.bell_name    || '',
  };
}

/* Resolve the authenticated user id.
   Falls back to a live Supabase session query so the hook works even when
   the React AuthContext hasn't hydrated yet (common on mobile cold-starts). */
async function resolveUid(contextUserId) {
  if (contextUserId) return contextUserId;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Single canonical source for the logged-in user's delivery address.
 * Read strategy: (1) profiles table, (2) most recent order's delivery_address.
 *
 * Returns:
 *   address           — current address object (null when not resolved yet)
 *   hasSavedAddress   — true when street + houseNumber + postalCode + city are non-empty
 *   isLoading         — true while the initial fetch is in-flight
 *   saveAddress(addr) — upserts to profiles, updates local state immediately
 *   refreshAddress()  — force re-fetch from DB
 */
export function useDeliveryAddress() {
  const { currentUser } = useAuth();

  const [address,   setAddress]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Core read ──────────────────────────────────────────────────────────── */
  const doFetch = useCallback(async () => {
    const uid = await resolveUid(currentUser?.id);

    if (!uid) {
      setAddress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // ── Step 1: profiles table (primary source) ───────────────────────────
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, street, house_number, postal_code, city, floor, bell_name')
      .eq('id', uid)
      .single();

    if (error) {
      // 42703 = column does not exist → migration 008 not applied in production
      // PGRST116 = no rows found → profiles row missing for this user
      // 42501 = RLS violation → SELECT policy missing or auth.uid() is null
      console.error('[addr] profiles fetch failed — code:', error.code,
        '| hint:', error.hint ?? '—',
        '| message:', error.message,
        '| uid:', uid?.slice(0, 8));
    } else {
      console.log('[addr] profiles ok — street:', data?.street || '(empty)',
        '| city:', data?.city || '(empty)');
    }

    const profAddr   = (!error && data) ? rowToAddress(data) : null;
    const profComplete = !!profAddr?.street?.trim() && !!profAddr?.city?.trim();

    if (profComplete) {
      setAddress(profAddr);
      setIsLoading(false);
      return;
    }

    // ── Step 2: most recent order's delivery_address (fallback) ──────────
    // Used when profiles has no complete address — covers first-time mobile
    // users and cases where the earlier profile-write bug prevented the save.
    // Query is authenticated: RLS enforces auth.uid() = user_id, so this
    // only ever returns the signed-in user's own orders.
    const { data: lastOrder, error: orderErr } = await supabase
      .from('orders')
      .select('delivery_address, customer_name, customer_phone')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderErr) {
      console.error('[addr] orders fallback failed — code:', orderErr.code,
        '| message:', orderErr.message, '| uid:', uid?.slice(0, 8));
    }

    const da = lastOrder?.delivery_address;
    if (da?.street?.trim() && da?.city?.trim()) {
      console.log('[addr] using last order address — street:', da.street, '| city:', da.city);
      setAddress({
        fullName:     da.fullName     || lastOrder.customer_name  || '',
        phone:        da.phone        || lastOrder.customer_phone || '',
        street:       da.street       || '',
        houseNumber:  da.houseNumber  || '',
        postalCode:   da.postalCode   || '',
        city:         da.city         || '',
        floor:        da.floor        || '',
        doorbellName: da.doorbellName || '',
      });
    } else if (profAddr) {
      // Profiles row exists but address is incomplete — use what we have
      // (name/phone are still useful for pre-filling the delivery form)
      setAddress(profAddr);
    } else {
      setAddress(null);
    }

    setIsLoading(false);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-fetch when currentUser.id changes (normal login/logout path) */
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  /* Also subscribe to Supabase auth events directly.
     This catches the case where SIGNED_IN fires (e.g. after a PKCE redirect on
     mobile) but the React render cycle hasn't propagated currentUser yet — the
     address would be fetched from the live session instead of waiting for state. */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          doFetch();
        }
        if (event === 'SIGNED_OUT') {
          setAddress(null);
          setIsLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [doFetch]);

  /* ── Public refresh ─────────────────────────────────────────────────────── */
  const refreshAddress = useCallback(() => { doFetch(); }, [doFetch]);

  /* ── Derived state ──────────────────────────────────────────────────────── */
  const hasSavedAddress =
    !!address?.street?.trim() &&
    !!address?.houseNumber?.trim() &&
    !!address?.postalCode?.trim() &&
    !!address?.city?.trim();

  /* ── Write ──────────────────────────────────────────────────────────────── */
  const saveAddress = useCallback(async (addr) => {
    const contextUid  = currentUser?.id ?? null;
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUid  = session?.user?.id ?? null;
    const uid         = contextUid ?? sessionUid ?? null;

    console.log('[addr:save] uid:', uid?.slice(0, 8) ?? 'null',
      '| source:', contextUid ? 'context' : sessionUid ? 'session' : 'NONE');

    if (!uid) {
      console.error('[addr:save] blocked — no uid');
      return { error: 'not-logged-in' };
    }

    const payload = {
      id:           uid,
      full_name:    addr.fullName     || '',
      phone:        addr.phone        || '',
      street:       addr.street       || '',
      house_number: addr.houseNumber  || '',
      postal_code:  addr.postalCode   || '',
      city:         addr.city         || '',
      floor:        addr.floor        || '',
      bell_name:    addr.doorbellName || '',
    };

    const { data: upsertData, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('id, street, house_number, postal_code, city');

    if (error) {
      // 42703 = address columns missing → migration 008 not applied
      // 42501 = RLS violation → UPDATE/INSERT policy missing or no session
      console.error('[addr:save] upsert failed — code:', error.code,
        '| message:', error.message,
        '| hint:', error.hint ?? '—',
        '| uid:', uid?.slice(0, 8));
    } else {
      console.log('[addr:save] ok — street:', upsertData?.[0]?.street || '(empty)',
        '| city:', upsertData?.[0]?.city || '(empty)');
      setAddress(rowToAddress(payload));
    }

    return { error };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { address, hasSavedAddress, isLoading, saveAddress, refreshAddress };
}
