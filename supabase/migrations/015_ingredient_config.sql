/*
  Migration 015 — ingredient_config (superseded by 016)

  This migration is kept for reference but has been superseded by
  016_ingredient_realtime.sql which is a single, self-contained migration
  that creates the table AND enables realtime in one step.

  DO NOT run this file. Run 016_ingredient_realtime.sql instead.

  If you already ran 015 before 016 was written, run 016 — every DDL
  statement in it uses IF NOT EXISTS / DROP IF EXISTS / OR REPLACE so it
  is safe to apply on top of 015 without conflicts.
*/
