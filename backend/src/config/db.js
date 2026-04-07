const { neon, neonConfig } = require("@neondatabase/serverless");

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);

/**
 * Run a single query via Neon HTTP.
 * @param {string} text - SQL with $1, $2 placeholders
 * @param {any[]} [params] - parameter values
 */
async function query(text, params) {
  const start = Date.now();
  const rows = await sql.query(text, params ?? []);
  if (process.env.NODE_ENV === "development") {
    console.log(`[DB] ${Date.now() - start}ms — ${text.slice(0, 80)}`);
  }
  return { rows };
}

/**
 * Get a transaction client compatible with existing BEGIN/COMMIT pattern.
 * Usage: const client = await getClient();
 *   try { await client.query('BEGIN'); ... await client.query('COMMIT'); }
 *   finally { client.release(); }
 */
async function getClient() {
  const queries = [];

  const client = {
    async query(text, params) {
      if (text.trim().toUpperCase() === "BEGIN") return;
      if (text.trim().toUpperCase() === "COMMIT") {
        const results = await sql.transaction(queries.map((q) => sql.query(q.text, q.params ?? [])));
        return { rows: results[results.length - 1] ?? [] };
      }
      if (text.trim().toUpperCase() === "ROLLBACK") return;
      queries.push({ text, params });
      return { rows: [] };
    },
    release() {},
  };

  return client;
}

module.exports = { query, getClient, pool: null };
