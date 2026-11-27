/**
 * Tạo tài khoản admin (hoặc nâng quyền admin cho tài khoản đã có) để vào trang quản trị.
 *
 * Cách dùng (trong backend/):
 *   ADMIN_EMAIL=ban@vi-du.com ADMIN_PASSWORD='mật-khẩu-dài' node scripts/seedAdmin.js --env=<file env LAB>
 *   ... --env=.env.cloud --allow-remote        -- DB thật (Supabase Cloud)
 *
 * Email và mật khẩu bắt buộc lấy từ biến môi trường: repo public, trước đây gõ cứng trong file này
 * nên ai cũng biết mật khẩu admin của bất kỳ DB nào từng chạy script. Mật khẩu không bao giờ được in ra.
 * Tài khoản đã có thì chỉ nâng quyền, KHÔNG đổi mật khẩu.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

function argValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

// Biến đã export trong shell thắng file env (dotenv không ghi đè)
function loadEnv() {
  const envFile = argValue('env') || '.env';
  dotenv.config({ path: path.resolve(__dirname, '..', envFile) });
}

function readAdminInput() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email.includes('@')) throw new Error('Thiếu ADMIN_EMAIL (biến môi trường).');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự (biến môi trường).`);
  }
  return { email, password, fullName: process.env.ADMIN_FULL_NAME || 'Admin' };
}

function createPool() {
  const host = process.env.PG_HOST || 'localhost';
  if (!LOCAL_HOSTS.includes(host) && !hasFlag('allow-remote')) {
    throw new Error(`PG_HOST là "${host}", không phải localhost. Thêm --allow-remote nếu thật sự muốn.`);
  }
  return new pg.Pool({
    host,
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'postgres',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

async function promote(pool, email) {
  await pool.query(`UPDATE users SET role = 'admin', updated_at = now() WHERE email = $1`, [email]);
  console.info(`✅ Đã nâng quyền admin cho ${email} (mật khẩu giữ nguyên).`);
}

async function create(pool, { email, password, fullName }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin')`,
    [email, passwordHash, fullName]
  );
  console.info(`✅ Đã tạo admin ${email}.`);
}

async function main() {
  loadEnv();
  const input = readAdminInput();
  const pool = createPool();
  try {
    const { rows } = await pool.query('SELECT role FROM users WHERE email = $1', [input.email]);
    if (rows[0]?.role === 'admin') console.info(`✅ ${input.email} đã là admin, không đổi gì.`);
    else if (rows[0]) await promote(pool, input.email);
    else await create(pool, input);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
