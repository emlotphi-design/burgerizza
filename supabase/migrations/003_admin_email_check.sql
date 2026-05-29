-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 4: Email-based admin check
--
--  Replaces the manual "UPDATE profiles SET role='admin'" step.
--  is_admin() now checks the authenticated user's JWT email directly.
--  Add/remove emails in the array below to manage admins.
--
--  HOW TO RUN:
--    1. Open your Supabase project dashboard
--    2. Go to  SQL Editor → New query
--    3. Paste this file and click Run
-- ═══════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() ->> 'email') = any(
    -- ▼ Add or remove admin emails here ▼
    array['emlotphi@gmail.com']
  )
  or exists (
    -- Fallback: keep supporting accounts manually promoted via SQL
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
