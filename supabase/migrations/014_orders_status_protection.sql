-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 14: Hard order protection via RLS
--
--  WHY: All previous status checks live in the frontend and can be
--       bypassed by stale client state or missed realtime events.
--       This migration adds a database-level policy on the orders
--       table that Supabase enforces on every INSERT regardless of
--       what the frontend does.
--
--  ALSO: Idempotently creates the restaurant_settings table and
--        restaurant_status column so the full system works even if
--        migrations 012/013 were never run.
--
--  SCHEMA NOTE: The base orders table (migration 002) has no
--       top-level "source" column. Staff order type is identified
--       via the delivery_address JSONB field:
--         POS orders            → delivery_address->>'source' = 'pos'
--         Restaurant-mode orders→ delivery_address->>'source' = 'restaurant_mode'
--         Customer web orders   → delivery_address has no 'source' key
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Ensure restaurant_settings exists ─────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id               integer     PRIMARY KEY DEFAULT 1,
  ordering_enabled boolean     NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Add restaurant_status column if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'restaurant_settings'
      AND column_name  = 'restaurant_status'
  ) THEN
    ALTER TABLE public.restaurant_settings
      ADD COLUMN restaurant_status text NOT NULL DEFAULT 'online';
  END IF;
END $$;

-- Add the CHECK constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name      = 'restaurant_settings'
      AND column_name     = 'restaurant_status'
      AND constraint_name LIKE '%restaurant_status%'
  ) THEN
    ALTER TABLE public.restaurant_settings
      ADD CONSTRAINT restaurant_status_values
      CHECK (restaurant_status IN ('online', 'busy', 'closed'));
  END IF;
END $$;

-- ── 2. Seed singleton row ─────────────────────────────────────
INSERT INTO public.restaurant_settings (id, ordering_enabled, restaurant_status)
VALUES (1, true, 'online')
ON CONFLICT (id) DO NOTHING;

-- ── 3. RLS on restaurant_settings ────────────────────────────
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_settings_select"  ON public.restaurant_settings;
DROP POLICY IF EXISTS "restaurant_settings_insert"  ON public.restaurant_settings;
DROP POLICY IF EXISTS "restaurant_settings_update"  ON public.restaurant_settings;

CREATE POLICY "restaurant_settings_select"
  ON public.restaurant_settings FOR SELECT USING (true);

CREATE POLICY "restaurant_settings_insert"
  ON public.restaurant_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "restaurant_settings_update"
  ON public.restaurant_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── 4. Enable Realtime if not already ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname   = 'supabase_realtime'
      AND tablename = 'restaurant_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;
  END IF;
END $$;

-- ── 5. Hard RLS on orders table ──────────────────────────────
-- All order type discrimination uses the delivery_address JSONB
-- field — no dependency on any top-level column beyond what was
-- defined in migration 002.
--
-- Allowed:
--   a) POS terminal orders  → delivery_address->>'source' = 'pos'
--   b) Restaurant-mode orders → delivery_address->>'source' = 'restaurant_mode'
--   c) Customer web orders  → only when ordering_enabled = true
--
-- Blocked:
--   Customer orders when ordering_enabled = false (restaurant is busy or closed)

DROP POLICY IF EXISTS "orders_validate_restaurant_open" ON public.orders;

CREATE POLICY "orders_validate_restaurant_open"
  ON public.orders FOR INSERT
  WITH CHECK (
    -- Staff orders: always allowed regardless of restaurant open/closed status.
    -- These are identified by the 'source' key inside the delivery_address JSONB
    -- (no top-level source column required).
    (
      delivery_address IS NOT NULL
      AND delivery_address->>'source' IN ('pos', 'restaurant_mode')
    )
    OR
    -- Customer web / mobile orders: only insert when ordering_enabled = true.
    -- COALESCE(…, true) means: if the settings row is missing, fail open so
    -- ordering is never accidentally blocked by a missing config row.
    COALESCE(
      (
        SELECT ordering_enabled
        FROM public.restaurant_settings
        WHERE id = 1
        LIMIT 1
      ),
      true
    )
  );
