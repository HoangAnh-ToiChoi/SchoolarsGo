/**
 * Seed Test User
 * Script tạo account test để dev và demo.
 *
 * Cách dùng:
 *   node scripts/seed-test-user.js
 *
 * Sau khi chạy, có thể đăng nhập với:
 *   Email:    baocao147281@example.com
 *   Password: 123456
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const SALT_ROUNDS = 12;
const TEST_EMAIL = 'baocao147281@example.com';
const TEST_PASSWORD = '123456';
const TEST_FULL_NAME = 'Báo Cáo';

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'scholarsgo',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'scholarsgo_password',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedTestUser() {
  console.log('🔑  Seed Test User — ScholarsGo\n');
  console.log(`   Email   : ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}\n`);

  let client;
  try {
    client = await pool.connect();

    // 1. Kiểm tra user đã tồn tại chưa
    const { rows: existing } = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [TEST_EMAIL]
    );

    if (existing.length > 0) {
      console.log(`✅  User "${TEST_EMAIL}" đã tồn tại (id: ${existing[0].id}). Bỏ qua.\n`);
      return;
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

    // 3. Tạo user
    const { rows: inserted } = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [TEST_EMAIL, passwordHash, TEST_FULL_NAME]
    );

    const user = inserted[0];
    console.log('✅  User đã được tạo thành công!');
    console.log(`   ID       : ${user.id}`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Full Name: ${user.full_name}`);
    console.log(`   Created  : ${user.created_at}\n`);

    // 4. Gợi ý cấu hình .env nếu chưa có JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.log('⚠️  Lưu ý: Backend hiện không có JWT_SECRET trong .env.');
      console.log('   Vui lòng thêm vào backend/.env:');
      console.log('   JWT_SECRET=scholarsgo-jwt-secret-with-at-least-32-characters-long\n');
    }
  } catch (err) {
    console.error('❌  Lỗi khi tạo user:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Không kết nối được PostgreSQL. Kiểm tra lại PG_HOST / PG_PORT / PG_PASSWORD.\n');
    } else if (err.code === '28P01') {
      console.error('   → Sai username hoặc password PostgreSQL.\n');
    } else if (err.code === '42P01') {
      console.error('   → Bảng "users" chưa tồn tại. Chạy migration trước.\n');
    }
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

seedTestUser();
