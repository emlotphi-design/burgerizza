-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 9: Drivers pool + assignment tracking
--
--  WHY: Replaces the hardcoded DRIVERS array in the Orders panel
--       with a proper database-backed driver pool. Also tracks
--       every order ↔ driver assignment for stats and history.
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Drivers table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drivers (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    text        NOT NULL,
  phone        text        NOT NULL DEFAULT '',
  email        text        NOT NULL DEFAULT '',
  vehicle_type text        NOT NULL DEFAULT 'scooter'
                           CHECK (vehicle_type IN ('bicycle', 'scooter', 'car')),
  notes        text        NOT NULL DEFAULT '',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.drivers                IS 'Delivery driver pool for the restaurant.';
COMMENT ON COLUMN public.drivers.vehicle_type   IS 'bicycle | scooter | car';
COMMENT ON COLUMN public.drivers.is_active      IS 'false = deactivated; hidden from order assignment picker.';


-- ── Driver assignments table ───────────────────────────────────
-- One row per order ↔ driver link. An order may be reassigned,
-- creating a new row (the old one is cancelled).

CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id     uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id    uuid        NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status       text        NOT NULL DEFAULT 'assigned'
                           CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  notes        text        NOT NULL DEFAULT ''
);

COMMENT ON TABLE  public.driver_assignments         IS 'Order ↔ driver assignment history.';
COMMENT ON COLUMN public.driver_assignments.status  IS 'assigned | in_progress | completed | cancelled';


-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drivers_is_active
  ON public.drivers (is_active);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_id
  ON public.driver_assignments (driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_order_id
  ON public.driver_assignments (order_id);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_status
  ON public.driver_assignments (status);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_assigned_at
  ON public.driver_assignments (assigned_at DESC);


-- ── Row-Level Security ────────────────────────────────────────
-- Only authenticated users (admin / staff logged in via Supabase Auth)
-- can read or write driver data. Public / anon users are denied.

ALTER TABLE public.drivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;

-- drivers
CREATE POLICY "Authenticated users can read drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON public.drivers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete drivers"
  ON public.drivers FOR DELETE
  TO authenticated
  USING (true);

-- driver_assignments
CREATE POLICY "Authenticated users can read assignments"
  ON public.driver_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert assignments"
  ON public.driver_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
  ON public.driver_assignments FOR UPDATE
  TO authenticated
  USING (true);


-- ── updated_at auto-stamp ────────────────────────────────────
-- Keeps drivers.updated_at current whenever a row is modified.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON public.drivers;
CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
