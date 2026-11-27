/**
 * Chạy mọi migration chưa áp trong scripts/migrations/ theo thứ tự số, ghi lại vào bảng schema_migrations.
 *
 * Cách dùng (trong backend/):
 *   npm run migrate                                        -- DB local (PG_* trong .env)
 *   npm run migrate -- --dry-run                           -- chỉ liệt kê file sẽ chạy
 *   npm run migrate -- --env=.env.cloud --allow-remote     -- Supabase Cloud
 *   npm run migrate -- --env=.env.cloud --allow-remote --baseline
 *       -- DB đã chạy tay đủ các file hiện có: chỉ ghi tên file vào schema_migrations, không chạy lại
 *
 * Mọi file migration viết dạng chạy lại không lỗi, nên lần đầu chạy trên DB cũ (chưa có schema_migrations) vẫn an toàn.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_FILE = /^\d{3}_\w+\.sql$/;
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT        PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
`;

function argValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

/** Tên file migration theo thứ tự; số trùng là lỗi vì thứ tự chạy không còn xác định. */
function listMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => MIGRATION_FILE.test(f)).sort();
  const numbers = files.map((f) => f.slice(0, 3));
  const duplicated = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (duplicated.length) throw new Error(`Trùng số migration: ${[...new Set(duplicated)].join(', ')}`);
  return files;
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

async function appliedNames(pool) {
  await pool.query(CREATE_TRACKING_TABLE);
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

async function record(pool, name) {
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
}

async function apply(pool, name) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
  await pool.query(sql);
  await record(pool, name);
}

async function main() {
  dotenv.config({ path: path.resolve(__dirname, '..', argValue('env') || '.env') });
  const files = listMigrationFiles();
  const pool = createPool();
  try {
    const applied = await appliedNames(pool);
    const pending = files.filter((f) => !applied.has(f));
    console.info(`🗄  ${process.env.PG_DATABASE || 'postgres'}@${process.env.PG_HOST || 'localhost'}: ${pending.length} migration chưa áp`);

    for (const name of pending) {
      if (hasFlag('dry-run')) {
        console.info(`   · ${name}`);
      } else if (hasFlag('baseline')) {
        await record(pool, name);
        console.info(`   ✓ ${name} (chỉ ghi nhận)`);
      } else {
        await apply(pool, name);
        console.info(`   ✓ ${name}`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
