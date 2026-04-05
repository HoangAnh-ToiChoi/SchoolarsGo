/**
 * ScholarsGo — Direct PostgreSQL Client (singleton)
 * Dùng cho tất cả query trong backend (seed script + API).
 * Kết nối trực tiếp PostgreSQL — hỗ trợ cả Supabase Cloud Connection Pooling
 * (port 6543) lẫn Supabase local Docker (port 5432).
 *
 * Connection pool: reuse connection, tự động handle disconnect/reconnect.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'scholarsgo',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Supabase Connection Pooler (port 6543): bỏ qua DNS family — pooler trung gian xử lý
  family: parseInt(process.env.PG_DNS_FAMILY || '0', 10),
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text - SQL query
 * @param {any[]} params - Query parameters
 * @returns {Promise<{rows: any[], rowCount: number}>}
 */
const query = async (text, params) => {
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount };
};

/**
 * Execute a query and return the first row or null.
 */
const queryOne = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
};

/**
 * Execute a transaction (array of {text, params}).
 */
const transaction = async (queries) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const { text, params } of queries) {
      const res = await client.query(text, params);
      results.push({ rows: res.rows, rowCount: res.rowCount });
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, queryOne, transaction };
