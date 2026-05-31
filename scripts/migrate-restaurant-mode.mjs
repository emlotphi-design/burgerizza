/**
 * Burgerizza — Restaurant Mode Migration Runner
 *
 * Adds the columns needed for restaurant_mode orders to the Supabase
 * orders table. Uses the direct PostgreSQL connection (not the anon key).
 *
 * HOW TO GET YOUR DATABASE PASSWORD:
 *   Supabase Dashboard → Settings → Database
 *   → Connection string → URI (copy the full postgres://… URL)
 *   OR just the password (shown next to "Database Password")
 *
 * HOW TO RUN:
 *   node scripts/migrate-restaurant-mode.mjs "postgres://postgres:[YOUR_PASSWORD]@db.betvhnqxsyakylmdcbmm.supabase.co:5432/postgres"
 *
 * OR set env variable first:
 *   $env:DB_URL = "postgres://postgres:[YOUR_PASSWORD]@db.betvhnqxsyakylmdcbmm.supabase.co:5432/postgres"
 *   node scripts/migrate-restaurant-mode.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use pg from server/node_modules since that's where it's installed
let pg;
try {
  pg = require('../server/node_modules/pg');
} catch {
  try {
    pg = require('pg');
  } catch {
    console.error('❌  Cannot find the pg package. Run: cd server && npm install');
    process.exit(1);
  }
}
const { Client } = pg;

/* ── Connection URL ──────────────────────────────────────────── */
const DB_URL =
  process.argv[2] ||
  process.env.DB_URL ||
  process.env.DATABASE_URL;

if (!DB_URL || DB_URL.includes('REPLACE_WITH')) {
  console.error(`
❌  No database URL provided.

Supabase Dashboard → Settings → Database → Connection String → URI

Then run:
  node scripts/migrate-restaurant-mode.mjs "postgres://postgres:YOUR_PASSWORD@db.betvhnqxsyakylmdcbmm.supabase.co:5432/postgres"
`);
  process.exit(1);
}

/* ── Migration SQL ───────────────────────────────────────────── */
const STEPS = [
  {
    name: 'Drop old status constraint',
    sql: `ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;`,
  },
  {
    name: 'Add waiting_confirmation to status constraint',
    sql: `
      ALTER TABLE public.orders
        ADD CONSTRAINT orders_status_check CHECK (
          status IN (
            'waiting_confirmation',
            'pending',
            'confirmed',
            'preparing',
            'ready',
            'delivered',
            'cancelled'
          )
        );
    `.trim(),
  },
  {
    name: 'Add source column',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT '';`,
  },
  {
    name: 'Add order_type column',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT '';`,
  },
  {
    name: 'Add table_number column',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT NOT NULL DEFAULT '';`,
  },
  {
    name: 'Verify final schema',
    sql: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'orders'
        AND column_name  IN ('source', 'order_type', 'table_number', 'status')
      ORDER BY column_name;
    `.trim(),
    isVerify: true,
  },
];

/* ── Run ─────────────────────────────────────────────────────── */
const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },   // required for Supabase hosted instances
});

async function run() {
  console.log('\n🔌  Connecting to Supabase PostgreSQL…\n');
  await client.connect();
  console.log('✅  Connected.\n');

  for (const step of STEPS) {
    process.stdout.write(`  ⏳  ${step.name}… `);
    try {
      const result = await client.query(step.sql);
      if (step.isVerify) {
        console.log('done\n');
        console.log('  Schema verification:');
        console.table(result.rows);
      } else {
        console.log('✓');
      }
    } catch (err) {
      console.log('FAILED');
      console.error(`\n  ❌  Error on "${step.name}":`);
      console.error(`     Code:    ${err.code}`);
      console.error(`     Message: ${err.message}`);
      if (err.detail)  console.error(`     Detail:  ${err.detail}`);
      if (err.hint)    console.error(`     Hint:    ${err.hint}`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('\n🎉  Migration complete! Restaurant Mode orders will now insert correctly.\n');
}

run().catch(err => {
  console.error('\n❌  Unexpected error:', err.message);
  process.exit(1);
});
