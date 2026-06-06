import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const LS_KEY = 'bz_restaurant_status';
const VALID  = ['online', 'busy', 'closed'];

function lsRead() {
  try {
    const v = localStorage.getItem(LS_KEY);
    /* upgrade old boolean key written by the previous binary version */
    if (v === 'true')  return 'online';
    if (v === 'false') return 'closed';
    return VALID.includes(v) ? v : 'online';
  } catch {
    return 'online';
  }
}

function lsHasKey() {
  try { return localStorage.getItem(LS_KEY) !== null; } catch { return false; }
}

function lsWrite(status) {
  try { localStorage.setItem(LS_KEY, status); } catch {}
}

const OrderingContext = createContext({
  restaurantStatus:    'online',
  setRestaurantStatus: async () => {},
  isOrderingEnabled:   true,
  isBusy:              false,
  statusLoaded:        false,
  setOrderingEnabled:  async () => {},
});

export function OrderingProvider({ children }) {
  const [restaurantStatus, setStatus] = useState(lsRead);

  /*
   * statusLoaded:
   *   - false  → we have not yet confirmed the status with the server
   *   - true   → server has responded (or we have a cached LS value — good enough)
   *
   * We pre-populate with the LS key existence so returning users (who have a
   * cached value) never see a loading flash. First-time users wait for the
   * first server fetch before the payment button becomes enabled.
   */
  const [statusLoaded, setStatusLoaded] = useState(lsHasKey);

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
        } else if (data) {
          const s = VALID.includes(data.restaurant_status)
            ? data.restaurant_status
            : (data.ordering_enabled === false ? 'closed' : 'online');
          setStatus(s);
          lsWrite(s);
        }
        /* Mark loaded regardless — don't leave payment button frozen forever */
        setStatusLoaded(true);
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

  const isOrderingEnabled = restaurantStatus === 'online';
  const isBusy            = restaurantStatus === 'busy';

  return (
    <OrderingContext.Provider value={{
      restaurantStatus,
      setRestaurantStatus,
      isOrderingEnabled,
      isBusy,
      statusLoaded,
      setOrderingEnabled: (val) => setRestaurantStatus(val ? 'online' : 'closed'),
    }}>
      {children}
    </OrderingContext.Provider>
  );
}

export const useOrdering = () => useContext(OrderingContext);
