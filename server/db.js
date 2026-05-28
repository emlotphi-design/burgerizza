require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function createTables() {
  // Auth users are managed by Supabase — no custom users table needed.
  // Burger, Pizza, and Order tables are created via: npx prisma db push
  console.log('[db] PostgreSQL connected');
}

module.exports = { pool, createTables };
