-- Confirm all existing unconfirmed users so they can log in immediately.
-- Run this once in Supabase SQL Editor (requires service role / dashboard access).
-- Safe to run multiple times — the WHERE clause only updates rows that need it.

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at       = COALESCE(confirmed_at,       now()),
  updated_at         = now()
WHERE
  email_confirmed_at IS NULL
  OR confirmed_at IS NULL;
