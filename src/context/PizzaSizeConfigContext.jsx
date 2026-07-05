import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DOUGH_SIZES_BY_ID, SIZED_DOUGH_IDS, SIZES_BY_ID } from '../utils/pizzaSizes';

/**
 * Per-(dough, size) config — enabled/price/calories/weight/sort order.
 * Mirrors IngredientConfigContext.jsx / NutritionConfigContext.jsx exactly
 * (Supabase table + Realtime + localStorage cross-tab + in-place
 * static-object mutation), on its own `pizza_size_config` table, keyed by
 * `${dough}:${size}` instead of `${builder}:${id}` / `${scope}:${id}`.
 */

const PizzaSizeConfigContext = createContext(null);

const LS_KEY = 'bz_pizza_size_config';

function getStaticDefault(dough, size) {
  return (
    DOUGH_SIZES_BY_ID[dough]?.[size] ??
    { label: SIZES_BY_ID[size]?.label ?? size, price: 0, calories: 0, weight: null, enabled: true, sortOrder: 0 }
  );
}

function syncToStaticData(config) {
  for (const [key, conf] of Object.entries(config)) {
    const sep = key.indexOf(':');
    if (sep === -1) continue;
    const dough = key.slice(0, sep);
    const size  = key.slice(sep + 1);
    const target = DOUGH_SIZES_BY_ID[dough]?.[size];
    if (!target) continue;
    if (conf.price     !== undefined) target.price     = conf.price;
    if (conf.calories  !== undefined) target.calories  = conf.calories;
    if (conf.weight    !== undefined) target.weight    = conf.weight;
    if (conf.enabled   !== undefined) target.enabled   = conf.enabled;
    if (conf.sortOrder !== undefined) target.sortOrder = conf.sortOrder;
  }
}

function rowToConf(row) {
  return {
    enabled:   row.enabled,
    price:     Number(row.price ?? 0),
    calories:  Number(row.calories ?? 0),
    weight:    row.weight_g != null ? Number(row.weight_g) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function PizzaSizeConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      const parsed = cached ? JSON.parse(cached) : {};
      syncToStaticData(parsed);
      return parsed;
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; });

  // ── Initial load from Supabase ───────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('pizza_size_config')
          .select('dough, size, enabled, price, calories, weight_g, sort_order');
        if (error) throw error;
        if (active && data?.length > 0) {
          const map = {};
          for (const row of data) {
            map[`${row.dough}:${row.size}`] = rowToConf(row);
          }
          syncToStaticData(map);
          setConfig(map);
          localStorage.setItem(LS_KEY, JSON.stringify(map));
        }
      } catch (err) {
        console.warn('[PizzaSizeConfig] initial load failed — using static fallback', err?.message ?? err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── Supabase Realtime — cross-device / cross-browser sync ────────────────
  useEffect(() => {
    let ch;
    try {
      ch = supabase
        .channel('pizza_size_config_rt')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pizza_size_config' },
          ({ new: row, old: oldRow, eventType }) => {
            setConfig(prev => {
              const next = { ...prev };
              if (eventType === 'DELETE') {
                delete next[`${oldRow.dough}:${oldRow.size}`];
              } else {
                next[`${row.dough}:${row.size}`] = rowToConf(row);
              }
              syncToStaticData(next);
              localStorage.setItem(LS_KEY, JSON.stringify(next));
              return next;
            });
          },
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(
              '[PizzaSizeConfig] Realtime subscription error. ' +
              'Ensure migration 019_pizza_size_config.sql has been applied.',
            );
          }
        });
    } catch (err) {
      console.warn('[PizzaSizeConfig] Realtime setup failed', err);
    }
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  // ── Cross-tab sync via storage event ──────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        syncToStaticData(incoming);
        setConfig(incoming);
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Merge (not replace) — `label` only ever lives on the static fallback
  // (it's not part of the DB schema, since it's not admin-editable), so a
  // loaded/realtime config row — which only carries enabled/price/calories/
  // weight/sortOrder — must not clobber it.
  const getSizeConfig = useCallback(
    (dough, size) => ({ ...getStaticDefault(dough, size), ...config[`${dough}:${size}`] }),
    [config],
  );

  const sortedSizesForDough = useCallback(
    (dough) => {
      const sizeIds = Object.keys(DOUGH_SIZES_BY_ID[dough] ?? {});
      return sizeIds
        .map(size => ({ id: size, ...getSizeConfig(dough, size) }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [getSizeConfig],
  );

  /** Enabled-only sizes for a dough — e.g. for picking an auto-fallback size. */
  const getSizesForDough = useCallback(
    (dough) => sortedSizesForDough(dough).filter(s => s.enabled),
    [sortedSizesForDough],
  );

  /**
   * Every size for a dough (enabled AND disabled), sorted for display — the
   * Builder renders all of these as buttons, greying out/disabling the ones
   * with `enabled: false` rather than hiding them.
   */
  const getAllSizesForDough = useCallback(
    (dough) => sortedSizesForDough(dough),
    [sortedSizesForDough],
  );

  const updateSizeConfig = useCallback(async (dough, size, changes) => {
    const key     = `${dough}:${size}`;
    const current = configRef.current[key] ?? getStaticDefault(dough, size);
    const updated = { ...current, ...changes };

    setConfig(prev => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });

    const target = DOUGH_SIZES_BY_ID[dough]?.[size];
    if (target) {
      if ('price'     in changes) target.price     = changes.price;
      if ('calories'  in changes) target.calories  = changes.calories;
      if ('weight'    in changes) target.weight    = changes.weight;
      if ('enabled'   in changes) target.enabled   = changes.enabled;
      if ('sortOrder' in changes) target.sortOrder = changes.sortOrder;
    }

    try {
      const { error } = await supabase
        .from('pizza_size_config')
        .upsert(
          {
            dough, size,
            enabled:    updated.enabled,
            price:      updated.price,
            calories:   updated.calories,
            weight_g:   updated.weight,
            sort_order: updated.sortOrder,
          },
          { onConflict: 'dough,size' },
        );
      if (error) console.error('[PizzaSizeConfig] upsert failed:', error.message);
    } catch (err) {
      console.error('[PizzaSizeConfig] upsert exception:', err);
    }
  }, []);

  return (
    <PizzaSizeConfigContext.Provider
      value={{ config, getSizeConfig, getSizesForDough, getAllSizesForDough, updateSizeConfig, isLoading, doughIds: SIZED_DOUGH_IDS }}
    >
      {children}
    </PizzaSizeConfigContext.Provider>
  );
}

export function usePizzaSizeConfig() {
  const ctx = useContext(PizzaSizeConfigContext);
  if (!ctx) throw new Error('usePizzaSizeConfig: must be inside PizzaSizeConfigProvider');
  return ctx;
}
