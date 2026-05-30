/**
 * Seed Admin User
 * Script tạo tài khoản admin để truy cập dashboard admin.
 *
 * Cách dùng:
 *   node scripts/seed-admin.js
 *
 * Sau khi chạy, đăng nhập với:
 *   Email:    admin@scholarsgo.com
 *   Password: Admin@123
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const SALT_ROUNDS = 12;
const ADMIN_EMAIL = 'admin@scholarsgo.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_FULL_NAME = 'Admin';

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'postgres',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedAdmin() {
  console.log('🔐  Seed Admin Account — ScholarsGo\n');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}\n`);

  let client;
  try {
    client = await pool.connect();

    // 1. Kiểm tra user đã tồn tại chưa
    const { rows: existing } = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      const user = existing[0];
      if (user.role === 'admin') {
        console.log(`✅  Admin "${ADMIN_EMAIL}" đã tồn tại (id: ${user.id}). Bỏ qua.\n`);
        return;
      } else {
        // Upgrade role lên admin
        await client.query(
          `UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = $1`,
          [ADMIN_EMAIL]
        );
        console.log(`✅  Đã upgrade user "${ADMIN_EMAIL}" lên admin.\n`);
        return;
      }
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    console.log('   Hashing password... OK');

    // 3. Tạo user với role = 'admin'
    const { rows: inserted } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, email, full_name, role, created_at`,
      [ADMIN_EMAIL, passwordHash, ADMIN_FULL_NAME]
    );

    const user = inserted[0];
    console.log('\n✅  Admin account đã được tạo thành công!');
    console.log(`   ID       : ${user.id}`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Full Name: ${user.full_name}`);
    console.log(`   Role     : ${user.role}`);
    console.log(`   Created  : ${user.created_at}`);
    console.log('\n   → Sử dụng email/password trên để đăng nhập vào dashboard admin.\n');
  } catch (err) {
    console.error('❌  Lỗi khi tạo admin:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Không kết nối được PostgreSQL. Kiểm tra PG_HOST / PG_PORT / PG_PASSWORD.');
    } else if (err.code === '28P01') {
      console.error('   → Sai username hoặc password PostgreSQL.');
    } else if (err.code === '42P01') {
      console.error('   → Bảng "users" chưa tồn tại. Chạy migration trước.');
    }
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

seedAdmin();
