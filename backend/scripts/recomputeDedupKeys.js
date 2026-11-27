/**
 * Tính lại scholarships.dedup_key theo công thức mới của ingestion/toRow.js (Đợt 2, R09: bỏ dấu, giữ đuôi phân biệt
 * sau " - ", tiêu đề chung chung → NULL). Không chạy thì lượt kéo đầu tiên sau deploy có thể thêm bản trùng cho
 * học bổng mà khóa cũ và khóa mới khác nhau.
 *
 * Cách dùng (trong backend/), mặc định chỉ in thay đổi, không ghi:
 *   node --import ./register.js scripts/recomputeDedupKeys.js --env=<file env>
 *   node --import ./register.js scripts/recomputeDedupKeys.js --env=.env.cloud --allow-remote --apply
 *
 * Khóa mới trùng khóa của dòng khác (cột dedup_key UNIQUE) thì giữ khóa cũ và báo ra để xem tay.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { dedupKey } from '~/ingestion/toRow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

function argValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function createPool() {
  dotenv.config({ path: path.resolve(__dirname, '..', argValue('env') || '.env') });
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

/** Dòng cần đổi khóa, bỏ những dòng mà khóa mới đụng khóa đang có hoặc đụng nhau. */
function planChanges(rows) {
  const taken = new Set(rows.map((r) => r.dedup_key).filter(Boolean));
  const changes = [];
  const conflicts = [];
  for (const row of rows) {
    const next = dedupKey(row.title);
    if (next === row.dedup_key) continue;
    if (next && taken.has(next)) {
      conflicts.push({ ...row, next });
      continue;
    }
    taken.delete(row.dedup_key);
    if (next) taken.add(next);
    changes.push({ id: row.id, title: row.title, from: row.dedup_key, to: next });
  }
  return { changes, conflicts };
}

async function apply(pool, changes) {
  if (changes.length === 0) return 0;
  const { rowCount } = await pool.query(
    `UPDATE scholarships AS s SET dedup_key = u.key
       FROM unnest($1::uuid[], $2::text[]) AS u(id, key)
      WHERE s.id = u.id`,
    [changes.map((c) => c.id), changes.map((c) => c.to)]
  );
  return rowCount;
}

async function main() {
  const pool = createPool();
  try {
    const { rows } = await pool.query('SELECT id, title, dedup_key FROM scholarships WHERE dedup_key IS NOT NULL ORDER BY created_at');
    const { changes, conflicts } = planChanges(rows);
    for (const c of changes) console.info(`  ${c.from} → ${c.to ?? 'NULL'}   (${c.title})`);
    for (const c of conflicts) console.warn(`  ! giữ ${c.dedup_key}: khóa mới ${c.next} đã có ở dòng khác (${c.title})`);
    const written = hasFlag('apply') ? await apply(pool, changes) : 0;
    const mode = hasFlag('apply') ? `đã ghi ${written}` : 'chạy thử, thêm --apply để ghi';
    console.info(`🔑 ${rows.length} dòng có khóa, ${changes.length} đổi, ${conflicts.length} trùng (${mode})`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
