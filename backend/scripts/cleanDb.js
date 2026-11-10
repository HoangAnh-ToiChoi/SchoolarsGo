/**
 * Dọn DB local — xoá dữ liệu cũ, giữ tài khoản admin.
 *
 * Cách dùng (trong backend/):
 *   node scripts/cleanDb.js                                  -- local: chỉ ĐẾM
 *   node scripts/cleanDb.js --yes                            -- local: xoá thật
 *
 *   Supabase Cloud (đọc kết nối từ backend/.env.cloud):
 *   node scripts/cleanDb.js --env=.env.cloud --allow-remote                           -- chỉ ĐẾM
 *   node scripts/cleanDb.js --env=.env.cloud --allow-remote --confirm=<PG_HOST> --yes -- xoá thật
 *
 * DB không phải localhost thì phải có --allow-remote, và muốn xoá thật phải gõ lại đúng
 * tên host ở --confirm để không dọn nhầm. Nhớ backup trước (xem scripts/README.md).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const argValue = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1];

// --env=.env.cloud để trỏ vào cloud; mặc định dùng .env (local)
const envFile = argValue('env') || '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

const { Pool } = require('pg');

const host = process.env.PG_HOST || 'localhost';
const pool = new Pool({
  host,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'postgres',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const TABLES = ['users', 'profiles', 'scholarships', 'applications', 'saved_scholarships', 'documents', 'chat_messages'];

async function countAll(client) {
  const result = {};
  for (const table of TABLES) {
    const exists = await client.query('SELECT to_regclass($1) AS t', [`public.${table}`]);
    result[table] = exists.rows[0].t ? Number((await client.query(`SELECT count(*) FROM ${table}`)).rows[0].count) : '(không có bảng)';
  }
  return result;
}

async function main() {
  const isLocal = ['localhost', '127.0.0.1'].includes(host);
  const execute = process.argv.includes('--yes');

  if (!isLocal) {
    if (!process.argv.includes('--allow-remote')) {
      console.error(`❌ PG_HOST là "${host}", không phải localhost. Thêm --allow-remote nếu thật sự muốn.`);
      process.exit(1);
    }
    if (execute && argValue('confirm') !== host) {
      console.error(`❌ Xoá trên DB từ xa cần gõ lại host: --confirm=${host}`);
      process.exit(1);
    }
  }
  const client = await pool.connect();
  try {
    console.log(`🗄  DB: ${process.env.PG_DATABASE}@${host}\n`);
    console.log('Trước khi dọn:');
    console.table(await countAll(client));

    if (!execute) {
      console.log('\nChế độ đếm. Thêm --yes để xoá thật.');
      return;
    }

    await client.query(fs.readFileSync(path.join(__dirname, 'cleanDb.sql'), 'utf8'));
    console.log('\n✅ Đã dọn. Sau khi dọn:');
    console.table(await countAll(client));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
