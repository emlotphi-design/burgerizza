-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 11: Restaurant Config
--
--  WHY: Adds a singleton config table so admins can enable or
--       disable online ordering globally from the dashboard.
--       When ordering_enabled = false, the frontend blocks all
--       customer checkout and cart submission paths.
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Main table (singleton — exactly one row, id = 1) ─────────
CREATE TABLE IF NOT EXISTS public.restaurant_config (
  id               integer     PRIMARY KEY DEFAULT 1,
  ordering_enabled boolean     NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

COMMENT ON TABLE  public.restaurant_config                   IS 'Singleton global config for the restaurant.';
COMMENT ON COLUMN public.restaurant_config.ordering_enabled  IS 'When false, customers cannot place new orders.';

-- ── Seed the singleton row ────────────────────────────────────
INSERT INTO public.restaurant_config (id, ordering_enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.restaurant_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read the status
CREATE POLICY "restaurant_config: public read"
  ON public.restaurant_config FOR SELECT
  USING (true);

-- Only authenticated users (admins) can update
CREATE POLICY "restaurant_config: authenticated update"
  ON public.restaurant_config FOR UPDATE
  USING (auth.role() = 'authenticated');
