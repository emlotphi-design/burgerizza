-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 10: Multiple saved delivery addresses
--
--  WHY: Replaces the single-address column set on public.profiles
--       with a proper user_addresses table so each user can save
--       multiple delivery addresses (Zuhause, Arbeit, etc.).
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Main table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text        NOT NULL DEFAULT 'Zuhause',
  street       text        NOT NULL DEFAULT '',
  house_number text        NOT NULL DEFAULT '',
  postal_code  text        NOT NULL DEFAULT '',
  city         text        NOT NULL DEFAULT '',
  floor        text        NOT NULL DEFAULT '',
  bell_name    text        NOT NULL DEFAULT '',
  phone        text        NOT NULL DEFAULT '',
  is_default   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.user_addresses             IS 'Multiple saved delivery addresses per user.';
COMMENT ON COLUMN public.user_addresses.label       IS 'User-facing label: Zuhause, Arbeit, Freundin, custom…';
COMMENT ON COLUMN public.user_addresses.is_default  IS 'Exactly one per user should be true (enforced by app logic).';


-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id
  ON public.user_addresses (user_id);

CREATE INDEX IF NOT EXISTS idx_user_addresses_default
  ON public.user_addresses (user_id, is_default);


-- ── Row-Level Security ────────────────────────────────────────

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses"
  ON public.user_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.user_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.user_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ── Migrate existing single-address users ─────────────────────
-- Copies the address from public.profiles into the new table.
-- Only runs for users who have a complete address (street + city)
-- and have not already been migrated.

INSERT INTO public.user_addresses (
  user_id, label, street, house_number, postal_code,
  city, floor, bell_name, phone, is_default
)
SELECT
  p.id,
  'Zuhause',
  p.street,
  COALESCE(p.house_number, ''),
  COALESCE(p.postal_code,  ''),
  p.city,
  COALESCE(p.floor,        ''),
  COALESCE(p.bell_name,    ''),
  COALESCE(p.phone,        ''),
  true
FROM public.profiles p
WHERE p.street IS NOT NULL AND trim(p.street) != ''
  AND p.city   IS NOT NULL AND trim(p.city)   != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = p.id
  );
