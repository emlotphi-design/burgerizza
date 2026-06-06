import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const LS_KEY = 'bz_restaurant_status';
const VALID  = ['online', 'busy', 'closed'];

function lsRead() {
  try {
    const v = localStorage.getItem(LS_KEY);
    /* also upgrade old boolean key written by the previous binary version */
    if (v === 'true')  return 'online';
    if (v === 'false') return 'closed';
    return VALID.includes(v) ? v : 'online';
  } catch {
    return 'online';
  }
}

function lsWrite(status) {
  try { localStorage.setItem(LS_KEY, status); } catch {}
}

const OrderingContext = createContext({
  restaurantStatus:    'online',
  setRestaurantStatus: async () => {},
  isOrderingEnabled:   true,
  isBusy:              false,
  setOrderingEnabled:  async () => {},  // backward compat
});

export function OrderingProvider({ children }) {
  const [restaurantStatus, setStatus] = useState(lsRead);

  useEffect(() => {
    let mounted = true;

    /* ── Initial DB fetch ── */
    supabase
      .from('restaurant_settings')
      .select('restaurant_status, ordering_enabled')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[Ordering] fetch failed — using localStorage:', error.message);
          return;
        }
        if (data) {
          /* Prefer the new column; fall back to ordering_enabled for old rows */
          const s = VALID.includes(data.restaurant_status)
            ? data.restaurant_status
            : (data.ordering_enabled === false ? 'closed' : 'online');
          setStatus(s);
          lsWrite(s);
        }
      });

    /* ── Realtime subscription ── */
    const channel = supabase
      .channel('bz-restaurant-status-v3')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_settings', filter: 'id=eq.1' },
        (payload) => {
          const s = payload.new?.restaurant_status;
          if (VALID.includes(s)) {
            setStatus(s);
            lsWrite(s);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function setRestaurantStatus(status) {
    if (!VALID.includes(status)) return;

    /* Optimistic — never reverts */
    setStatus(status);
    lsWrite(status);

    const { error } = await supabase
      .from('restaurant_settings')
      .upsert(
        {
          id: 1,
          restaurant_status: status,
          ordering_enabled:  status !== 'closed',
          updated_at:        new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('[Ordering] upsert failed — state preserved locally:', error.message);
    }
  }

  /* Derived helpers — both 'busy' and 'closed' block ordering */
  const isOrderingEnabled = restaurantStatus === 'online';
  const isBusy            = restaurantStatus === 'busy';

  return (
    <OrderingContext.Provider value={{
      restaurantStatus,
      setRestaurantStatus,
      isOrderingEnabled,
      isBusy,
      /* backward compat — any old code calling setOrderingEnabled still works */
      setOrderingEnabled: (val) => setRestaurantStatus(val ? 'online' : 'closed'),
    }}>
      {children}
    </OrderingContext.Provider>
  );
}

export const useOrdering = () => useContext(OrderingContext);
