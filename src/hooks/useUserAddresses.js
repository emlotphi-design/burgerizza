import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/AuthContext';

/**
 * Manages multiple saved delivery addresses for the logged-in user.
 * Reads from public.user_addresses.
 * Auto-migrates legacy single-address from public.profiles on first load.
 */
export function useUserAddresses() {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? null;

  const [addresses,  setAddresses]  = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);

  /* Sort: default first, then by created_at ascending */
  function sortAddresses(list) {
    return [...list].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  const doFetch = useCallback(async () => {
    if (!uid) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', uid)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useUserAddresses] fetch failed:', error.code, error.message);
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    if (data.length === 0) {
      /* Auto-migrate: if profiles has a complete address, create the first entry */
      const { data: prof } = await supabase
        .from('profiles')
        .select('street, house_number, postal_code, city, floor, bell_name, phone')
        .eq('id', uid)
        .single();

      if (prof?.street?.trim() && prof?.city?.trim()) {
        const { data: migrated, error: insErr } = await supabase
          .from('user_addresses')
          .insert({
            user_id:      uid,
            label:        'Zuhause',
            street:       prof.street,
            house_number: prof.house_number || '',
            postal_code:  prof.postal_code  || '',
            city:         prof.city,
            floor:        prof.floor        || '',
            bell_name:    prof.bell_name    || '',
            phone:        prof.phone        || '',
            is_default:   true,
          })
          .select()
          .single();

        if (!insErr && migrated) {
          setAddresses([migrated]);
          setIsLoading(false);
          return;
        }
      }
    }

    setAddresses(sortAddresses(data));
    setIsLoading(false);
  }, [uid]);

  useEffect(() => { doFetch(); }, [doFetch]);

  /* ── Add ───────────────────────────────────────────────────── */
  const addAddress = useCallback(async (payload) => {
    if (!uid) return { error: 'not-logged-in' };

    if (payload.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', uid);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({ ...payload, user_id: uid })
      .select()
      .single();

    if (!error && data) {
      setAddresses(prev => sortAddresses(
        payload.is_default
          ? [...prev.map(a => ({ ...a, is_default: false })), data]
          : [...prev, data]
      ));
    }
    return { data, error };
  }, [uid]);

  /* ── Update ────────────────────────────────────────────────── */
  const updateAddress = useCallback(async (id, updates) => {
    if (!uid) return { error: 'not-logged-in' };

    if (updates.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', uid);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setAddresses(prev => sortAddresses(
        updates.is_default
          ? prev.map(a => ({ ...a, is_default: false })).map(a => a.id === id ? data : a)
          : prev.map(a => a.id === id ? data : a)
      ));
    }
    return { data, error };
  }, [uid]);

  /* ── Delete ────────────────────────────────────────────────── */
  const deleteAddress = useCallback(async (id) => {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      setAddresses(prev => {
        const next = prev.filter(a => a.id !== id);
        // If deleted was default, promote the first remaining
        if (next.length > 0 && !next.some(a => a.is_default)) {
          next[0] = { ...next[0], is_default: true };
          supabase.from('user_addresses').update({ is_default: true }).eq('id', next[0].id);
        }
        return next;
      });
    }
    return { error };
  }, []);

  /* ── Set default ───────────────────────────────────────────── */
  const setDefault = useCallback(async (id) => {
    return updateAddress(id, { is_default: true });
  }, [updateAddress]);

  const defaultAddress = addresses.find(a => a.is_default) ?? addresses[0] ?? null;
  const hasAddresses   = addresses.length > 0;

  return {
    addresses,
    isLoading,
    hasAddresses,
    defaultAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    reload: doFetch,
  };
}
