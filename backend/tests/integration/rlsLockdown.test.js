/**
 * Khóa RLS (migration 011_rlsLockdown.sql) — chạy trên Supabase local, KHÔNG chạy trên DB thật.
 *
 * App dùng auth tự viết (JWT riêng) và backend gọi DB bằng service role / user postgres, nên khóa anon
 * (công khai trong bundle FE cho Realtime) không được đọc, ghi bảng hay gọi hàm nào qua PostgREST.
 *
 * Chạy (trong backend/), cần Supabase local đang chạy và đã áp schema + migrations:
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   PG_HOST=127.0.0.1 PG_PORT=54322 PG_USER=postgres PG_PASSWORD=postgres PG_DATABASE=postgres \
 *   npm run test:integration
 * Thiếu biến môi trường hoặc không phải máy local thì test tự bỏ qua.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PG_HOST } = process.env;
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY && PG_HOST);
const isLocal = LOCAL_HOSTS.includes(PG_HOST) && LOCAL_HOSTS.includes(hostOf(SUPABASE_URL));
const skip = !configured ? 'thiếu biến môi trường Supabase local' : !isLocal ? 'chỉ chạy trên Supabase local' : false;

const DENIED = [401, 403]; // PostgREST trả 401 / 403 khi role không có quyền (42501)
const FIXTURE_TITLE = 'RLS-LOCKDOWN-FIXTURE';
const INJECTED_TITLE = 'RLS-LOCKDOWN-INJECTED';
const SERVICE_TITLE = 'RLS-LOCKDOWN-SERVICE';
const PROBE_TABLE = 'rls_lockdown_probe';

let pool;
let fixtureId;
let tables = [];

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

async function cleanup() {
  await pool.query('DELETE FROM scholarships WHERE title = ANY($1)', [[FIXTURE_TITLE, INJECTED_TITLE, SERVICE_TITLE]]);
  await pool.query(`DROP TABLE IF EXISTS public.${PROBE_TABLE}`);
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
  await cleanup();
  const { rows } = await pool.query(
    `INSERT INTO scholarships (title, provider, country, degree, deadline, application_url, is_active)
     VALUES ($1, 'Fixture', 'Japan', 'Master', now() + interval '30 days', 'https://example.org/apply', true) RETURNING id`,
    [FIXTURE_TITLE]
  );
  fixtureId = rows[0].id;
  // Lấy danh sách bảng từ catalog: bảng mới thêm sau này cũng được kiểm, không cần sửa test
  const result = await pool.query(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') ORDER BY 1`
  );
  tables = result.rows.map((r) => r.relname);
});

after(async () => {
  if (!pool) return;
  await cleanup();
  await pool.end();
});

test('mọi bảng trong schema public đều bật RLS (kể cả ingestion_runs, user_sessions)', { skip }, async () => {
  const { rows } = await pool.query(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity ORDER BY 1`
  );
  assert.ok(tables.includes('ingestion_runs'), 'schema chưa dựng đủ bảng');
  assert.deepEqual(rows.map((r) => r.relname), []);
});

test('không còn policy nào trong schema public (policy theo auth.uid() vô nghĩa vì app không dùng Supabase Auth)', { skip }, async () => {
  const { rows } = await pool.query(`SELECT tablename || '.' || policyname AS name FROM pg_policies WHERE schemaname = 'public' ORDER BY 1`);
  assert.deepEqual(rows.map((r) => r.name), []);
});

test('anon bị từ chối đọc mọi bảng; cùng URL bằng service role thì đọc được (loại trừ sai URL / 5xx)', { skip }, async () => {
  for (const table of tables) {
    const anon = await rest(`${table}?select=*&limit=1`);
    assert.ok(DENIED.includes(anon.status), `anon đọc bảng ${table}: HTTP ${anon.status}`);
    const service = await rest(`${table}?select=*&limit=1`, { key: SUPABASE_SERVICE_ROLE_KEY });
    assert.equal(service.status, 200, `service role đọc bảng ${table}: HTTP ${service.status}`);
  }
});

test('anon không thêm được học bổng qua PostgREST', { skip }, async () => {
  const response = await rest('scholarships', {
    method: 'POST',
    body: { title: INJECTED_TITLE, provider: 'x', country: 'Japan', degree: 'Master', deadline: '2027-01-01' },
  });
  const { rowCount } = await pool.query('SELECT 1 FROM scholarships WHERE title = $1', [INJECTED_TITLE]);
  assert.ok(DENIED.includes(response.status), `HTTP ${response.status}`);
  assert.equal(rowCount, 0);
});

test('anon không sửa được học bổng (vd. đổi link nộp đơn sang trang lừa đảo)', { skip }, async () => {
  const response = await rest(`scholarships?id=eq.${fixtureId}`, { method: 'PATCH', body: { application_url: 'https://phishing.example' } });
  const { rows } = await pool.query('SELECT application_url FROM scholarships WHERE id = $1', [fixtureId]);
  assert.ok(DENIED.includes(response.status), `HTTP ${response.status}`);
  assert.equal(rows[0].application_url, 'https://example.org/apply');
});

test('anon không xóa được học bổng', { skip }, async () => {
  const response = await rest(`scholarships?id=eq.${fixtureId}`, { method: 'DELETE' });
  const { rowCount } = await pool.query('SELECT 1 FROM scholarships WHERE id = $1', [fixtureId]);
  assert.ok(DENIED.includes(response.status), `HTTP ${response.status}`);
  assert.equal(rowCount, 1);
});

test('anon không gọi được hàm của schema public qua /rpc', { skip }, async () => {
  const response = await rest('rpc/scholarship_slugify', { method: 'POST', body: { input: 'abc' } });
  assert.ok(DENIED.includes(response.status) || response.status === 404, `HTTP ${response.status}`);
});

test('bảng postgres tạo sau này: anon / authenticated không có quyền sẵn (default privileges)', { skip }, async () => {
  await pool.query(`CREATE TABLE public.${PROBE_TABLE} (id int)`);
  const { rows } = await pool.query(
    `SELECT has_table_privilege('anon', $1, 'SELECT') AS anon_read, has_table_privilege('authenticated', $1, 'INSERT') AS auth_write`,
    [`public.${PROBE_TABLE}`]
  );
  assert.deepEqual(rows[0], { anon_read: false, auth_write: false });
});

test('service role (backend) vẫn đọc, sửa, thêm được — trigger tạo slug vẫn chạy', { skip }, async () => {
  const update = await rest(`scholarships?id=eq.${fixtureId}`, { key: SUPABASE_SERVICE_ROLE_KEY, method: 'PATCH', body: { relevance_score: 77 } });
  assert.equal(update.status, 200);
  const insert = await rest('scholarships', {
    key: SUPABASE_SERVICE_ROLE_KEY,
    method: 'POST',
    body: { title: SERVICE_TITLE, provider: 'x', country: 'Japan', degree: 'Master', deadline: '2027-01-01' },
  });
  assert.equal(insert.status, 201);
  const [created] = await insert.json();
  assert.ok(created.slug, 'trigger scholarships_set_slug phải tạo slug');
});
