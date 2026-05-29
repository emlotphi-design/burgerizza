-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 2: profiles table, RLS, auto-create trigger
--
--  HOW TO RUN:
--    1. Open your Supabase project dashboard
--    2. Go to  SQL Editor → New query
--    3. Paste this entire file and click Run
--    4. Then run the "Promote admin" block at the bottom
--       with your own email address
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Create the profiles table ──────────────────────────────
create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  email      text        not null,
  role       text        not null default 'user',
  created_at timestamptz not null default now(),

  constraint profiles_role_check check (role in ('user', 'admin'))
);

comment on table  public.profiles           is 'One row per auth user. Stores app-level role.';
comment on column public.profiles.role      is 'user | admin';


-- ── 2. Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;

-- Each authenticated user may read ONLY their own profile row.
-- This is all that AdminRoute needs: "what is my own role?"
-- (Wider read access for the Users admin page comes in Step 3.)
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles
  for select
  using (auth.uid() = id);


-- ── 3. Trigger function — runs as table owner (security definer)
--       so it can write to profiles even under RLS.
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;   -- idempotent: safe to re-run
  return new;
end;
$$;


-- ── 4. Attach trigger to auth.users ───────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- ── 5. Backfill: create profile rows for users who already
--       existed before this migration was applied.
-- ──────────────────────────────────────────────────────────────
insert into public.profiles (id, email, role)
select
  u.id,
  u.email,
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- ═══════════════════════════════════════════════════════════════
--  MANUAL STEP — Promote your account to admin
--
--  Replace the email below with yours, then run this block.
--  You only need to do this once per admin account.
-- ═══════════════════════════════════════════════════════════════

-- update public.profiles
-- set role = 'admin'
-- where email = 'YOUR_EMAIL_HERE@example.com';
