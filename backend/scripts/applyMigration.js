/**
 * Chạy một file migration trong scripts/migrations/.
 *
 * Cách dùng (trong backend/):
 *   node scripts/applyMigration.js --file=003_ingestion.sql                                  -- DB local
 *   node scripts/applyMigration.js --file=003_ingestion.sql --env=.env.cloud --allow-remote  -- Supabase Cloud
 *
 * Các file migration viết dạng idempotent (IF NOT EXISTS) nên chạy lại nhiều lần không sao.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const argValue = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1];
require('dotenv').config({ path: path.resolve(__dirname, '..', argValue('env') || '.env') });

const { Pool } = require('pg');

async function main() {
  const file = argValue('file');
  if (!file) throw new Error('Thiếu --file=<tên file trong scripts/migrations>');
  const sqlPath = path.join(__dirname, 'migrations', path.basename(file));

  const host = process.env.PG_HOST || 'localhost';
  if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`PG_HOST là "${host}", không phải localhost. Thêm --allow-remote nếu thật sự muốn.`);
  }

  const pool = new Pool({
    host,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'postgres',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  try {
    console.log(`🗄  ${process.env.PG_DATABASE}@${host} ← ${path.basename(sqlPath)}`);
    await pool.query(fs.readFileSync(sqlPath, 'utf8'));
    console.log('✅ Đã áp dụng migration.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
