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
   Falls back to a live Supabase session query so mobile users who registered
   with email-confirmation pending (isLoggedIn=false in React context but a
   real session exists) are handled identically to already-logged-in users. */
async function resolveUid(contextUserId) {
  if (contextUserId) return contextUserId;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Single canonical source for the logged-in user's delivery address.
 * Reads from and writes to public.profiles ONLY.
 *
 * Returns:
 *   address          — current address object (null when not resolved yet)
 *   hasSavedAddress  — true when street + houseNumber + postalCode + city are all non-empty
 *   isLoading        — true while the initial profiles fetch is in-flight
 *   saveAddress(addr) — upserts to profiles, updates local state immediately
 *   refreshAddress() — force re-fetch from DB (call after external writes)
 */
export function useDeliveryAddress() {
  const { currentUser, isLoggedIn } = useAuth();

  const [address,   setAddress]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Core read ── */
  const fetchAddress = useCallback(async () => {
    const uid = await resolveUid(currentUser?.id);

    if (!uid) {
      console.log('[addr] no uid — skipping fetch');
      setAddress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[addr] reading profile for uid', uid);

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, street, house_number, postal_code, city, floor, bell_name')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('[addr] READ error:', { code: error.code, message: error.message, hint: error.hint });
    } else {
      console.log('[addr] raw profile row', data);
    }

    if (!error && data) setAddress(rowToAddress(data));
    setIsLoading(false);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-fetch whenever auth identity changes (login, logout, registration) */
  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  /* ── Public refresh for callers that need to force a re-read ── */
  const refreshAddress = useCallback(() => {
    fetchAddress();
  }, [fetchAddress]);

  /* ── Derived state ── */
  const hasSavedAddress =
    !!address?.street?.trim() &&
    !!address?.houseNumber?.trim() &&
    !!address?.postalCode?.trim() &&
    !!address?.city?.trim();

  console.log('[addr] current address state', address);
  console.log('[addr] hasSavedAddress', hasSavedAddress);

  /* ── Write ── */
  const saveAddress = useCallback(async (addr) => {
    const uid = await resolveUid(currentUser?.id);
    if (!uid) {
      console.error('[addr] WRITE blocked — no user id in context or session');
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

    console.log('[addr] save payload', payload);

    const { data: upsertData, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('street, house_number, postal_code, city, floor, bell_name');

    if (error) {
      console.error('[addr] WRITE error:', {
        code: error.code, message: error.message,
        hint: error.hint, details: error.details,
      });
    } else {
      console.log('[addr] upsert success', upsertData);
      // Update local state immediately — rowToAddress(payload) uses the same
      // mapping as the read path so hasSavedAddress flips to true instantly.
      setAddress(rowToAddress(payload));
    }

    return { error };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { address, hasSavedAddress, isLoading, saveAddress, refreshAddress };
}
