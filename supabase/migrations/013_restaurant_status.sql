-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 13: 3-state restaurant status
--
--  WHY: Replaces the binary ordering_enabled flag with a
--       restaurant_status column that can be 'online', 'busy',
--       or 'closed'. 'busy' shows a delay warning but keeps
--       ordering enabled. ordering_enabled is kept in sync for
--       backward compatibility with any existing queries.
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS restaurant_status TEXT NOT NULL DEFAULT 'online'
  CONSTRAINT restaurant_status_values CHECK (restaurant_status IN ('online', 'busy', 'closed'));

COMMENT ON COLUMN public.restaurant_settings.restaurant_status
  IS 'online = normal | busy = delay warning | closed = ordering disabled';

-- ── Migrate existing rows ─────────────────────────────────────
UPDATE public.restaurant_settings
  SET restaurant_status = CASE WHEN ordering_enabled THEN 'online' ELSE 'closed' END
  WHERE id = 1;
