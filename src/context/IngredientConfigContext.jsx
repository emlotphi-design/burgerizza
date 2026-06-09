import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DOUGHS_BY_ID } from '../utils/pizzaDoughs';
import { INGREDIENTS_BY_ID } from '../utils/pizzaIngredients';
import { BURGER_INGREDIENTS_BY_ID } from '../features/burger/utils/burgerData';

const IngredientConfigContext = createContext(null);

const LS_KEY = 'bz_ingredient_config';

function getStaticDefault(builder, id) {
  if (builder === 'pizza') {
    const dough = DOUGHS_BY_ID[id];
    if (dough) return { price: dough.price, enabled: true };
    const ing = INGREDIENTS_BY_ID[id];
    return ing ? { price: ing.price, enabled: true } : { price: 0, enabled: true };
  }
  const ing = BURGER_INGREDIENTS_BY_ID[id];
  return ing ? { price: ing.price, enabled: true } : { price: 0, enabled: true };
}

function syncPricesToStaticData(config) {
  for (const [key, conf] of Object.entries(config)) {
    if (conf.price === undefined) continue;
    const sep = key.indexOf(':');
    if (sep === -1) continue;
    const builder = key.slice(0, sep);
    const id      = key.slice(sep + 1);
    if (builder === 'pizza') {
      if (DOUGHS_BY_ID[id])      DOUGHS_BY_ID[id].price      = conf.price;
      if (INGREDIENTS_BY_ID[id]) INGREDIENTS_BY_ID[id].price = conf.price;
    } else if (builder === 'burger') {
      if (BURGER_INGREDIENTS_BY_ID[id]) BURGER_INGREDIENTS_BY_ID[id].price = conf.price;
    }
  }
}

export function IngredientConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      const parsed = cached ? JSON.parse(cached) : {};
      syncPricesToStaticData(parsed);
      return parsed;
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Ref so updateIngredient always reads latest config without stale-closure issues
  // and without recreating the function on every config change.
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; });

  // ── Initial load from Supabase ───────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('ingredient_config')
          .select('id, builder, price, enabled');
        if (error) throw error;
        if (active && data?.length > 0) {
          const map = {};
          for (const row of data) {
            map[`${row.builder}:${row.id}`] = { price: Number(row.price), enabled: row.enabled };
          }
          syncPricesToStaticData(map);
          setConfig(map);
          localStorage.setItem(LS_KEY, JSON.stringify(map));
        }
      } catch (err) {
        console.warn('[IngredientConfig] initial load failed — using localStorage cache', err?.message ?? err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── Supabase Realtime — cross-device / cross-browser sync ────────────────
  // Requires the table to be in the supabase_realtime publication.
  // See migration 016_ingredient_realtime.sql.
  useEffect(() => {
    let ch;
    try {
      ch = supabase
        .channel('ingredient_config_rt')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ingredient_config' },
          ({ new: row, old: oldRow, eventType }) => {
            setConfig(prev => {
              const next = { ...prev };
              if (eventType === 'DELETE') {
                delete next[`${oldRow.builder}:${oldRow.id}`];
              } else {
                next[`${row.builder}:${row.id}`] = {
                  price:   Number(row.price),
                  enabled: row.enabled,
                };
              }
              syncPricesToStaticData(next);
              localStorage.setItem(LS_KEY, JSON.stringify(next));
              return next;
            });
          },
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(
              '[IngredientConfig] Realtime subscription error. ' +
              'Ensure migration 016_ingredient_realtime.sql has been applied.',
            );
          }
        });
    } catch (err) {
      console.warn('[IngredientConfig] Realtime setup failed', err);
    }
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  // ── Cross-tab sync via storage event (same browser, different tabs) ──────
  // The storage event fires in all OTHER tabs when one tab writes to localStorage.
  // This gives instant sync when admin and customer are in the same browser
  // without depending on Supabase Realtime being configured.
  useEffect(() => {
    const handler = e => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        syncPricesToStaticData(incoming);
        setConfig(incoming);
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const isEnabled = useCallback(
    (builder, id) => config[`${builder}:${id}`]?.enabled ?? true,
    [config],
  );

  const getPrice = useCallback(
    (builder, id) => config[`${builder}:${id}`]?.price ?? getStaticDefault(builder, id).price,
    [config],
  );

  // updateIngredient reads from configRef so it never has a stale view of config
  // and never needs to be recreated when config changes.
  const updateIngredient = useCallback(async (builder, id, changes) => {
    const key     = `${builder}:${id}`;
    const current = configRef.current[key] ?? getStaticDefault(builder, id);
    const updated = { ...current, ...changes };

    // Optimistic local update — writes to localStorage which triggers the storage
    // event in all other same-origin tabs for instant cross-tab propagation.
    setConfig(prev => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });

    // Propagate price change to static lookup objects immediately
    if ('price' in changes) {
      if (builder === 'pizza') {
        if (DOUGHS_BY_ID[id])      DOUGHS_BY_ID[id].price      = changes.price;
        if (INGREDIENTS_BY_ID[id]) INGREDIENTS_BY_ID[id].price = changes.price;
      } else if (builder === 'burger') {
        if (BURGER_INGREDIENTS_BY_ID[id]) BURGER_INGREDIENTS_BY_ID[id].price = changes.price;
      }
    }

    // Persist to Supabase — triggers realtime events in all other connected clients
    try {
      const { error } = await supabase
        .from('ingredient_config')
        .upsert(
          { id, builder, price: updated.price, enabled: updated.enabled },
          { onConflict: 'id,builder' },
        );
      if (error) console.error('[IngredientConfig] upsert failed:', error.message);
    } catch (err) {
      console.error('[IngredientConfig] upsert exception:', err);
    }
  }, []); // No deps — reads live config from configRef

  return (
    <IngredientConfigContext.Provider value={{ config, isEnabled, getPrice, updateIngredient, isLoading }}>
      {children}
    </IngredientConfigContext.Provider>
  );
}

export function useIngredientConfig() {
  const ctx = useContext(IngredientConfigContext);
  if (!ctx) throw new Error('useIngredientConfig: must be inside IngredientConfigProvider');
  return ctx;
}
