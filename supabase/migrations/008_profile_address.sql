-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Migration 008: delivery address columns on profiles
--
--  Adds full_name, phone, and all address fields to public.profiles
--  so that user profile data (including delivery address) has a proper
--  database home instead of relying solely on auth.users user_metadata.
--
--  Also adds UPDATE / INSERT RLS policies so authenticated users can
--  save their own profile row, and wires up the updated_at trigger.
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Add columns (idempotent — safe to re-run) ──────────────
alter table public.profiles
  add column if not exists full_name    text not null default '',
  add column if not exists phone        text not null default '',
  add column if not exists street       text not null default '',
  add column if not exists house_number text not null default '',
  add column if not exists postal_code  text not null default '',
  add column if not exists city         text not null default '',
  add column if not exists floor        text not null default '',
  add column if not exists bell_name    text not null default '',
  add column if not exists updated_at   timestamptz   not null default now();


-- ── 2. RLS — users may update their own profile row ──────────
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles
  for update
  using     (auth.uid() = id)
  with check (auth.uid() = id);

-- Needed for upsert fallback (handle_new_user trigger may have missed a row)
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id);


-- ── 3. updated_at trigger (set_updated_at defined in migration 002) ──
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ── 4. Backfill: copy full_name + phone from auth.users user_metadata
--       for users who already existed.  Address stays blank — users will
--       populate it on their next profile edit or checkout.
-- ─────────────────────────────────────────────────────────────
update public.profiles p
set
  full_name = coalesce(nullif(u.raw_user_meta_data->>'fullName', ''), ''),
  phone     = coalesce(nullif(u.raw_user_meta_data->>'phone',    ''), '')
from auth.users u
where p.id = u.id;
