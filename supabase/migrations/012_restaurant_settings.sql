-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 12: Restaurant Settings (ordering toggle)
--
--  WHY: Replaces restaurant_config (step 11) with a cleaner
--       restaurant_settings table. The upsert approach means the
--       row is auto-created on first write, so the toggle works
--       even before any manual seeding.
--
--  HOW TO RUN (choose one):
--    a) Supabase Dashboard → SQL Editor → New query → paste → Run
--    b) Supabase CLI       → npx supabase db push
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id               integer     PRIMARY KEY DEFAULT 1,
  ordering_enabled boolean     NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

COMMENT ON TABLE  public.restaurant_settings                   IS 'Singleton global config — one row, id = 1.';
COMMENT ON COLUMN public.restaurant_settings.ordering_enabled  IS 'false = customers cannot checkout or place orders.';

-- ── Seed the singleton row ────────────────────────────────────
INSERT INTO public.restaurant_settings (id, ordering_enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read
CREATE POLICY "restaurant_settings_select"
  ON public.restaurant_settings FOR SELECT
  USING (true);

-- Authenticated users (admins) can upsert (INSERT + UPDATE)
CREATE POLICY "restaurant_settings_insert"
  ON public.restaurant_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "restaurant_settings_update"
  ON public.restaurant_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Enable Realtime so the frontend subscription fires ────────
-- Run this block only if realtime is not already enabled for this table.
-- (Supabase: Table Editor → restaurant_settings → Realtime → Enable)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;
