import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/AuthContext';


/* Map a profiles row → app address shape */
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

/**
 * Single source of truth for the logged-in user's delivery address.
 * Reads from and writes to public.profiles ONLY.
 *
 * Returns:
 *   address        — current address object (null if not logged-in or not yet loaded)
 *   hasSavedAddress — true when all 4 required fields are non-empty
 *   isLoading      — true while the initial profiles fetch is in-flight
 *   saveAddress(addr) — upserts addr to profiles, updates local state optimistically
 */
export function useDeliveryAddress() {
  const { currentUser, isLoggedIn } = useAuth();

  const [address,   setAddress]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) {
      setAddress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[addr] READ start — userId:', currentUser.id.slice(0, 8));

    supabase
      .from('profiles')
      .select('full_name, phone, street, house_number, postal_code, city, floor, bell_name')
      .eq('id', currentUser.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('[addr] READ error:', { code: error.code, message: error.message, hint: error.hint });
        } else {
          console.log('[addr] READ result:', {
            street:       data?.street       || '(empty)',
            house_number: data?.house_number || '(empty)',
            postal_code:  data?.postal_code  || '(empty)',
            city:         data?.city         || '(empty)',
            floor:        data?.floor        || '(empty)',
            bell_name:    data?.bell_name    || '(empty)',
            full_name:    data?.full_name    || '(empty)',
            phone:        data?.phone        || '(empty)',
          });
        }
        if (!error && data) setAddress(rowToAddress(data));
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[addr] READ threw:', err?.message);
        setIsLoading(false);
      });
  }, [isLoggedIn, currentUser?.id]);

  const hasSavedAddress =
    !!address?.street?.trim() &&
    !!address?.houseNumber?.trim() &&
    !!address?.postalCode?.trim() &&
    !!address?.city?.trim();

  const saveAddress = useCallback(async (addr) => {
    // Prefer context id; fall back to live session in case React state lags
    let uid = currentUser?.id;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id ?? null;
    }
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

    console.log('[addr] WRITE start — payload:', payload);

    const { data: upsertData, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('street, house_number, postal_code, city, floor, bell_name');

    if (error) {
      console.error('[addr] WRITE error:', { code: error.code, message: error.message, hint: error.hint, details: error.details });
    } else {
      console.log('[addr] WRITE success — DB confirmed:', upsertData);
    }

    if (!error) {
      // Update local state immediately — no refetch needed.
      // rowToAddress(payload) uses the same mapping as the read path,
      // so hasSavedAddress becomes true the instant the write succeeds.
      setAddress(rowToAddress(payload));

      // Verify round-trip: re-read what's now in the DB
      supabase
        .from('profiles')
        .select('street, house_number, postal_code, city')
        .eq('id', uid)
        .single()
        .then(({ data: verify, error: vErr }) => {
          if (vErr) {
            console.error('[addr] VERIFY re-read error:', vErr.message);
          } else {
            console.log('[addr] VERIFY re-read after write:', {
              street:       verify?.street       || '(empty)',
              house_number: verify?.house_number || '(empty)',
              postal_code:  verify?.postal_code  || '(empty)',
              city:         verify?.city         || '(empty)',
            });
          }
        });
    }

    return { error };
  }, [currentUser?.id]);

  return { address, hasSavedAddress, isLoading, saveAddress };
}
