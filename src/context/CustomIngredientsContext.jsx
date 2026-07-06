import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { INGREDIENTS_BY_ID } from '../utils/pizzaIngredients';
import { DOUGHS_BY_ID } from '../utils/pizzaDoughs';
import { BURGER_INGREDIENTS_BY_ID } from '../features/burger/utils/burgerData';
import { buildersForCategory } from '../utils/customIngredients';

/**
 * Admin-created ingredients (custom_ingredients table) — purely additive
 * data merged at render time into the hardcoded pizza/burger catalogs and
 * canvases. No localStorage cache: unlike IngredientConfigContext/
 * NutritionConfigContext this isn't overriding a static default, it's the
 * only source for these rows, so a brief loading state is fine.
 *
 * calculatePizzaPrice/calculatePizzaNutrition (pizzaPriceUtils.js /
 * pizzaNutritionUtils.js) and calcBurgerPrice/calculateBurgerNutrition
 * (burgerUtils.js / burgerNutritionUtils.js) read ingredient price/calories/
 * weight directly from INGREDIENTS_BY_ID / DOUGHS_BY_ID /
 * BURGER_INGREDIENTS_BY_ID — the same plain objects IngredientConfigContext/
 * NutritionConfigContext already mutate in place for price/nutrition edits.
 * A brand-new custom ingredient has no entry there at all, so
 * injectIntoStatics() adds one (mirroring that existing mutate-in-place
 * pattern) — this is what makes cart totals and calorie badges include
 * custom ingredients exactly like built-in ones.
 */
function injectIntoStatics(row) {
  const builders = buildersForCategory(row.category);
  const shared = {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    isVegan: false,
    isSpicy: false,
    tags: [],
    weight: row.weight_g != null ? Number(row.weight_g) : null,
    calories: Number(row.calories),
    protein: null,
    carbs: null,
    fat: null,
  };

  if (builders.includes('pizza')) {
    if (row.category === 'dough') {
      DOUGHS_BY_ID[row.id] = { ...(DOUGHS_BY_ID[row.id] ?? {}), ...shared };
    } else {
      INGREDIENTS_BY_ID[row.id] = { ...(INGREDIENTS_BY_ID[row.id] ?? {}), ...shared };
    }
  }
  if (builders.includes('burger')) {
    BURGER_INGREDIENTS_BY_ID[row.id] = {
      ...(BURGER_INGREDIENTS_BY_ID[row.id] ?? {}),
      ...shared,
      color: '#999999',
      hasQty: row.category === 'meat' || row.category === 'cheese',
    };
  }
}

const CustomIngredientsContext = createContext(null);

export function CustomIngredientsProvider({ children }) {
  const [customIngredients, setCustomIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('custom_ingredients')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        (data ?? []).forEach(injectIntoStatics);
        if (active) setCustomIngredients(data ?? []);
      } catch (err) {
        console.warn('[CustomIngredients] initial load failed', err?.message ?? err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let ch;
    try {
      ch = supabase
        .channel('custom_ingredients_rt')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'custom_ingredients' },
          ({ new: row, old: oldRow, eventType }) => {
            if (eventType !== 'DELETE') injectIntoStatics(row);
            setCustomIngredients(prev => {
              if (eventType === 'DELETE') {
                return prev.filter(r => r.id !== oldRow.id);
              }
              const exists = prev.some(r => r.id === row.id);
              return exists
                ? prev.map(r => (r.id === row.id ? row : r))
                : [...prev, row];
            });
          },
        )
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(
              '[CustomIngredients] Realtime subscription error. ' +
              'Ensure migration 020_custom_ingredients.sql has been applied.',
            );
          }
        });
    } catch (err) {
      console.warn('[CustomIngredients] Realtime setup failed', err);
    }
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  // Insert a new row and reflect it immediately in this tab, ahead of the
  // realtime echo (which will just no-op via the `exists` check above).
  const createCustomIngredient = useCallback(async (row) => {
    const { data, error } = await supabase
      .from('custom_ingredients')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    injectIntoStatics(data);
    setCustomIngredients(prev => [...prev, data]);
    return data;
  }, []);

  return (
    <CustomIngredientsContext.Provider value={{ customIngredients, isLoading, createCustomIngredient }}>
      {children}
    </CustomIngredientsContext.Provider>
  );
}

export function useCustomIngredients() {
  const ctx = useContext(CustomIngredientsContext);
  if (!ctx) throw new Error('useCustomIngredients: must be inside CustomIngredientsProvider');
  return ctx;
}
