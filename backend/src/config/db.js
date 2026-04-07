const { Pool } = require("pg");

/**
 * Single connection pool for the entire app.
 * Configure via DATABASE_URL — works with Supabase, AWS RDS, Neon, local Postgres, anything.
 * To switch databases: change DATABASE_URL in .env only.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For Supabase/RDS with SSL:
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected DB pool error:", err.message);
});

/**
 * Run a single query. Use this everywhere.
 * @param {string} text - SQL with $1, $2 placeholders
 * @param {any[]} [params] - parameter values
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === "development") {
    console.log(`[DB] ${Date.now() - start}ms — ${text.slice(0, 80)}`);
  }
  return res;
}

/**
 * Get a client for transactions.
 * Usage: const client = await getClient(); try { await client.query('BEGIN'); ... await client.query('COMMIT'); } finally { client.release(); }
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
