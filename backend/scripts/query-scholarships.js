/**
 * Quick query script để xem scholarship data
 * Chạy: node scripts/query-scholarships.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'scholarsgo',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
});

async function main() {
  await client.connect();

  // ── 1. Tổng quan ──────────────────────────────────────────────────
  const total = await client.query(
    `SELECT COUNT(*) as cnt FROM scholarships WHERE is_active = true AND deadline >= NOW()`
  );
  console.log(`\n📊 Tổng cộng: ${total.rows[0].cnt} scholarships đang active\n`);

  // ── 2. Theo quốc gia ─────────────────────────────────────────────
  const byCountry = await client.query(`
    SELECT country, COUNT(*) as cnt
    FROM scholarships
    WHERE is_active = true AND deadline >= NOW()
    GROUP BY country
    ORDER BY cnt DESC
  `);
  console.log('🌍 Theo quốc gia:');
  console.table(byCountry.rows);

  // ── 3. Theo bậc học ──────────────────────────────────────────────
  const byDegree = await client.query(`
    SELECT degree, COUNT(*) as cnt
    FROM scholarships
    WHERE is_active = true AND deadline >= NOW()
    GROUP BY degree
    ORDER BY cnt DESC
  `);
  console.log('🎓 Theo bậc học:');
  console.table(byDegree.rows);

  // ── 4. Theo ngôn ngữ giảng dạy ──────────────────────────────────
  const byLang = await client.query(`
    SELECT language, COUNT(*) as cnt
    FROM scholarships
    WHERE is_active = true AND deadline >= NOW()
    GROUP BY language
    ORDER BY cnt DESC
  `);
  console.log('🗣️ Theo ngôn ngữ giảng dạy:');
  console.table(byLang.rows);

  // ── 5. Full scholarship list ─────────────────────────────────────
  const all = await client.query(`
    SELECT
      title,
      country,
      university,
      degree,
      field_of_study,
      coverage,
      amount,
      currency,
      min_gpa,
      min_ielts,
      language,
      deadline::date as deadline
    FROM scholarships
    WHERE is_active = true AND deadline >= NOW()
    ORDER BY country, degree
  `);
  console.log('\n📋 Danh sách đầy đủ 53 scholarships:\n');
  console.table(all.rows);

  await client.end();
}

main().catch(console.error);
