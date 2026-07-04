import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DOUGHS_BY_ID } from '../utils/pizzaDoughs';
import { INGREDIENTS_BY_ID } from '../utils/pizzaIngredients';
import { SIZES_BY_ID } from '../utils/pizzaSizes';
import { BURGER_INGREDIENTS_BY_ID } from '../features/burger/utils/burgerData';
import { MENU_ITEMS_BY_ID } from '../utils/menuData';

/**
 * Isolated nutrition sync pipeline — mirrors IngredientConfigContext.jsx's
 * price/enabled pattern (Supabase table + Realtime + localStorage cross-tab
 * + in-place static-object mutation) but on a separate `nutrition_config`
 * table, so it never touches price sync or the ingredient_config table.
 */

const NutritionConfigContext = createContext(null);

const LS_KEY = 'bz_nutrition_config';

function staticTargets(scope, id) {
  if (scope === 'pizza') {
    const targets = [];
    if (DOUGHS_BY_ID[id])      targets.push(DOUGHS_BY_ID[id]);
    if (INGREDIENTS_BY_ID[id]) targets.push(INGREDIENTS_BY_ID[id]);
    if (SIZES_BY_ID[id])       targets.push(SIZES_BY_ID[id]);
    return targets;
  }
  if (scope === 'burger') {
    return BURGER_INGREDIENTS_BY_ID[id] ? [BURGER_INGREDIENTS_BY_ID[id]] : [];
  }
  return MENU_ITEMS_BY_ID[id] ? [MENU_ITEMS_BY_ID[id]] : [];
}

function getStaticDefault(scope, id) {
  const [target] = staticTargets(scope, id);
  if (!target) return { weight: null, calories: 0, protein: null, carbs: null, fat: null };
  return {
    weight:   target.weight   ?? null,
    calories: target.calories ?? 0,
    protein:  target.protein  ?? null,
    carbs:    target.carbs    ?? null,
    fat:      target.fat      ?? null,
  };
}

function syncNutritionToStaticData(config) {
  for (const [key, conf] of Object.entries(config)) {
    const sep = key.indexOf(':');
    if (sep === -1) continue;
    const scope = key.slice(0, sep);
    const id    = key.slice(sep + 1);
    for (const target of staticTargets(scope, id)) {
      if (conf.weight   !== undefined) target.weight   = conf.weight;
      if (conf.calories !== undefined) target.calories = conf.calories;
      if (conf.protein  !== undefined) target.protein  = conf.protein;
      if (conf.carbs    !== undefined) target.carbs    = conf.carbs;
      if (conf.fat      !== undefined) target.fat      = conf.fat;
    }
  }
}

function rowToConf(row) {
  return {
    weight:   row.weight_g  != null ? Number(row.weight_g)  : null,
    calories: Number(row.calories ?? 0),
    protein:  row.protein_g != null ? Number(row.protein_g) : null,
    carbs:    row.carbs_g   != null ? Number(row.carbs_g)   : null,
    fat:      row.fat_g     != null ? Number(row.fat_g)     : null,
  };
}

export function NutritionConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      const parsed = cached ? JSON.parse(cached) : {};
      syncNutritionToStaticData(parsed);
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
          .from('nutrition_config')
          .select('id, scope, weight_g, calories, protein_g, carbs_g, fat_g');
        if (error) throw error;
        if (active && data?.length > 0) {
          const map = {};
          for (const row of data) {
            map[`${row.scope}:${row.id}`] = rowToConf(row);
          }
          syncNutritionToStaticData(map);
          setConfig(map);
          localStorage.setItem(LS_KEY, JSON.stringify(map));
        }
      } catch (err) {
        console.warn('[NutritionConfig] initial load failed — using localStorage cache', err?.message ?? err);
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
        .channel('nutrition_config_rt')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'nutrition_config' },
          ({ new: row, old: oldRow, eventType }) => {
            setConfig(prev => {
              const next = { ...prev };
              if (eventType === 'DELETE') {
                delete next[`${oldRow.scope}:${oldRow.id}`];
              } else {
                next[`${row.scope}:${row.id}`] = rowToConf(row);
              }
              syncNutritionToStaticData(next);
              localStorage.setItem(LS_KEY, JSON.stringify(next));
              return next;
            });
          },
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(
              '[NutritionConfig] Realtime subscription error. ' +
              'Ensure migration 017_nutrition_config.sql has been applied.',
            );
          }
        });
    } catch (err) {
      console.warn('[NutritionConfig] Realtime setup failed', err);
    }
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  // ── Cross-tab sync via storage event ──────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        syncNutritionToStaticData(incoming);
        setConfig(incoming);
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getNutrition = useCallback(
    (scope, id) => config[`${scope}:${id}`] ?? getStaticDefault(scope, id),
    [config],
  );

  const updateNutrition = useCallback(async (scope, id, changes) => {
    const key     = `${scope}:${id}`;
    const current = configRef.current[key] ?? getStaticDefault(scope, id);
    const updated = { ...current, ...changes };

    setConfig(prev => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });

    for (const target of staticTargets(scope, id)) {
      if ('weight'   in changes) target.weight   = changes.weight;
      if ('calories' in changes) target.calories = changes.calories;
      if ('protein'  in changes) target.protein  = changes.protein;
      if ('carbs'    in changes) target.carbs    = changes.carbs;
      if ('fat'      in changes) target.fat      = changes.fat;
    }

    try {
      const { error } = await supabase
        .from('nutrition_config')
        .upsert(
          {
            id, scope,
            weight_g:  updated.weight,
            calories:  updated.calories,
            protein_g: updated.protein,
            carbs_g:   updated.carbs,
            fat_g:     updated.fat,
          },
          { onConflict: 'id,scope' },
        );
      if (error) console.error('[NutritionConfig] upsert failed:', error.message);
    } catch (err) {
      console.error('[NutritionConfig] upsert exception:', err);
    }
  }, []);

  return (
    <NutritionConfigContext.Provider value={{ config, getNutrition, updateNutrition, isLoading }}>
      {children}
    </NutritionConfigContext.Provider>
  );
}

export function useNutritionConfig() {
  const ctx = useContext(NutritionConfigContext);
  if (!ctx) throw new Error('useNutritionConfig: must be inside NutritionConfigProvider');
  return ctx;
}
