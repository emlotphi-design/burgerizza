/*
  Migration 016 — ingredient_config realtime + access grants

  Enables Supabase Realtime broadcasts for the ingredient_config table
  so admin toggles and price changes sync instantly to customer builders
  on ALL devices (desktop and mobile).

  Safe to run on databases where 015 was already applied without these lines.
  All statements are idempotent.
*/

-- Full row snapshots in realtime payloads (required for UPDATE/DELETE old values)
alter table public.ingredient_config replica identity full;

-- Add to realtime publication only if not already present
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'ingredient_config'
  ) then
    execute 'alter publication supabase_realtime add table public.ingredient_config';
  end if;
end $$;

-- Table-level grants required for Supabase Realtime postgres_changes to work.
-- RLS policies alone are not sufficient — the role must also have the GRANT.
-- Without grant select to anon, anonymous mobile users receive no realtime events.
grant select on public.ingredient_config to anon;
grant select, insert, update, delete on public.ingredient_config to authenticated;
