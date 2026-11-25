/**
 * Khóa RLS (migration 011_rlsLockdown.sql) — chạy trên Supabase local, KHÔNG chạy trên DB thật.
 *
 * App dùng auth tự viết (JWT riêng) và backend gọi DB bằng service role / user postgres, nên khóa anon
 * (công khai trong bundle FE cho Realtime) không được đọc hay ghi bất kỳ bảng nào qua PostgREST.
 *
 * Chạy (trong backend/), cần Supabase local đang chạy và đã áp schema + migrations:
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   PG_HOST=127.0.0.1 PG_PORT=54322 PG_USER=postgres PG_PASSWORD=postgres PG_DATABASE=postgres \
 *   npm run test:integration
 * Thiếu biến môi trường thì test tự bỏ qua.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PG_HOST } = process.env;
const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY && PG_HOST);
const isLocal = ['127.0.0.1', 'localhost'].includes(PG_HOST) && /127\.0\.0\.1|localhost/.test(SUPABASE_URL || '');
const skip = !configured ? 'thiếu biến môi trường Supabase local' : !isLocal ? 'chỉ chạy trên Supabase local' : false;

// Mọi bảng chứa dữ liệu của app: anon không được đọc dòng nào
const PRIVATE_TABLES = [
  'users', 'profiles', 'documents', 'scholarships', 'applications', 'saved_scholarships',
  'notifications', 'user_sessions', 'ingestion_runs', 'chat_messages',
];
const FIXTURE_TITLE = 'RLS-LOCKDOWN-FIXTURE';
const INJECTED_TITLE = 'RLS-LOCKDOWN-INJECTED';

let pool;
let fixtureId;

function rest(path, { key = SUPABASE_ANON_KEY, method = 'GET', body } = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function rowsOf(response) {
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

before(async () => {
  if (skip) return;
  pool = new pg.Pool({
    host: PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });
  await pool.query('DELETE FROM scholarships WHERE title IN ($1, $2)', [FIXTURE_TITLE, INJECTED_TITLE]);
  const { rows } = await pool.query(
    `INSERT INTO scholarships (title, provider, country, degree, deadline, application_url, is_active)
     VALUES ($1, 'Fixture', 'Japan', 'Master', now() + interval '30 days', 'https://example.org/apply', true) RETURNING id`,
    [FIXTURE_TITLE]
  );
  fixtureId = rows[0].id;
});

after(async () => {
  if (!pool) return;
  await pool.query('DELETE FROM scholarships WHERE title IN ($1, $2)', [FIXTURE_TITLE, INJECTED_TITLE]);
  await pool.end();
});

test('mọi bảng trong schema public đều bật RLS (kể cả ingestion_runs, user_sessions)', { skip }, async () => {
  const { rows } = await pool.query(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity ORDER BY 1`
  );
  assert.deepEqual(rows.map((r) => r.relname), []);
});

test('không còn policy nào trong schema public (policy theo auth.uid() vô nghĩa vì app không dùng Supabase Auth)', { skip }, async () => {
  const { rows } = await pool.query(`SELECT tablename || '.' || policyname AS name FROM pg_policies WHERE schemaname = 'public' ORDER BY 1`);
  assert.deepEqual(rows.map((r) => r.name), []);
});

test('anon không thêm được học bổng qua PostgREST', { skip }, async () => {
  const response = await rest('scholarships', {
    method: 'POST',
    body: { title: INJECTED_TITLE, provider: 'x', country: 'Japan', degree: 'Master', deadline: '2027-01-01' },
  });
  const { rowCount } = await pool.query('SELECT 1 FROM scholarships WHERE title = $1', [INJECTED_TITLE]);
  assert.equal(rowCount, 0, `anon đã thêm được học bổng (HTTP ${response.status})`);
  assert.ok(response.status >= 400, `phải bị từ chối, nhận HTTP ${response.status}`);
});

test('anon không sửa được học bổng (vd. đổi link nộp đơn sang trang lừa đảo)', { skip }, async () => {
  await rest(`scholarships?id=eq.${fixtureId}`, { method: 'PATCH', body: { application_url: 'https://phishing.example' } });
  const { rows } = await pool.query('SELECT application_url FROM scholarships WHERE id = $1', [fixtureId]);
  assert.equal(rows[0].application_url, 'https://example.org/apply');
});

test('anon không xóa được học bổng', { skip }, async () => {
  await rest(`scholarships?id=eq.${fixtureId}`, { method: 'DELETE' });
  const { rowCount } = await pool.query('SELECT 1 FROM scholarships WHERE id = $1', [fixtureId]);
  assert.equal(rowCount, 1);
});

test('anon không đọc được dòng nào của mọi bảng dữ liệu', { skip }, async () => {
  for (const table of PRIVATE_TABLES) {
    const rows = await rowsOf(await rest(`${table}?select=*&limit=1`));
    assert.deepEqual(rows, [], `anon đọc được bảng ${table}`);
  }
});

test('service role (backend) vẫn đọc và ghi được', { skip }, async () => {
  const read = await rest(`scholarships?id=eq.${fixtureId}&select=id`, { key: SUPABASE_SERVICE_ROLE_KEY });
  assert.equal(read.status, 200);
  assert.equal((await read.json()).length, 1);
  const write = await rest(`scholarships?id=eq.${fixtureId}`, {
    key: SUPABASE_SERVICE_ROLE_KEY,
    method: 'PATCH',
    body: { relevance_score: 77 },
  });
  assert.equal(write.status, 200);
});
