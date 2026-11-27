/**
 * Chạy mọi migration chưa áp trong scripts/migrations/ theo thứ tự số, ghi lại vào bảng schema_migrations.
 *
 * Cách dùng (trong backend/):
 *   npm run migrate                                        -- DB local (PG_* trong .env hoặc biến đã export)
 *   npm run migrate -- --dry-run                           -- chỉ liệt kê file sẽ chạy, không ghi gì vào DB
 *   npm run migrate -- --env=.env.cloud --allow-remote     -- Supabase Cloud
 *
 * Mọi file migration viết dạng chạy lại không lỗi, nên lần đầu chạy trên DB đã dựng tay (chưa có schema_migrations)
 * cứ chạy thường: file nào đã áp thì không đổi gì, file thiếu (vd. index của 001, cột của 007) sẽ được bù.
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
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function loadEnv() {
  const envFile = argValue('env') || '.env';
  const envPath = path.resolve(__dirname, '..', envFile);
  dotenv.config({ path: envPath });
}

/** Tên file migration theo thứ tự; số trùng là lỗi vì thứ tự chạy không còn xác định. */
function listMigrationFiles() {
  const all = fs.readdirSync(MIGRATIONS_DIR);
  const files = all.filter((f) => MIGRATION_FILE.test(f)).sort();
  const numbers = files.map((f) => f.slice(0, 3));
  const duplicated = new Set(numbers.filter((n, i) => numbers.indexOf(n) !== i));
  if (duplicated.size) throw new Error(`Trùng số migration: ${[...duplicated].join(', ')}`);
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
    // Supabase pooler dùng chứng chỉ không nằm trong kho CA mặc định của Node (giống configs/database.config.js)
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

/** Tên file đã áp. Chạy thử (--dry-run) thì chỉ đọc: bảng theo dõi chưa có nghĩa là chưa áp file nào. */
async function appliedNames(pool, dryRun) {
  if (dryRun) {
    const { rows } = await pool.query(`SELECT to_regclass('public.schema_migrations') AS t`);
    if (!rows[0].t) return new Set();
  } else {
    await pool.query(CREATE_TRACKING_TABLE);
  }
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const names = rows.map((r) => r.name);
  return new Set(names);
}

async function apply(pool, name) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
  try {
    await pool.query(sql);
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
}

async function main() {
  loadEnv();
  const dryRun = hasFlag('dry-run');
  const files = listMigrationFiles();
  const pool = createPool();
  try {
    const applied = await appliedNames(pool, dryRun);
    const pending = files.filter((f) => !applied.has(f));
    const target = `${process.env.PG_DATABASE || 'postgres'}@${process.env.PG_HOST || 'localhost'}`;
    console.info(`🗄  ${target}: ${pending.length} migration chưa áp${dryRun ? ' (chạy thử, không ghi gì)' : ''}`);

    for (const name of pending) {
      if (!dryRun) await apply(pool, name);
      console.info(`   ${dryRun ? '·' : '✓'} ${name}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
