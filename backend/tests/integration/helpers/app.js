// Hạ tầng test tích hợp: chạy app thật (HTTP) trên Supabase local. KHÔNG bao giờ chạy với DB hay .env thật.
// Cách chạy: docs/lab.md. Trên máy cá nhân thiếu cấu hình LAB thì file test tự bỏ qua (thoát 0);
// trên CI (biến CI) thì thất bại, để job không xanh giả khi không chạy test nào.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];
// Cổng mặc định của Supabase local (supabase/config.jsonc): tunnel tới DB thật trên localhost thường dùng cổng khác
const LAB_PG_PORT = '54322';
const LAB_API_PORT = '54321';
const REAL_ENV_FILES = ['.env', '.env.cloud', '.env.production'];
const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function parseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function notLocalReason({ PG_HOST, PG_PORT, SUPABASE_URL }) {
  const api = parseUrl(SUPABASE_URL);
  const localDb = LOCAL_HOSTS.includes(PG_HOST) && PG_PORT === LAB_PG_PORT;
  const localApi = api && LOCAL_HOSTS.includes(api.hostname) && api.port === LAB_API_PORT;
  return localDb && localApi ? null : `chỉ chạy trên Supabase local (DB :${LAB_PG_PORT}, API :${LAB_API_PORT})`;
}

// app.js nạp dotenv/config: không có DOTENV_CONFIG_PATH thì nó đọc backend/.env thật (SMTP, khóa AI…)
function realEnvReason({ DOTENV_CONFIG_PATH }) {
  if (DOTENV_CONFIG_PATH && REAL_ENV_FILES.includes(path.basename(DOTENV_CONFIG_PATH))) {
    return `DOTENV_CONFIG_PATH trỏ vào ${path.basename(DOTENV_CONFIG_PATH)}: dùng file env riêng cho LAB`;
  }
  const hasRealEnv = existsSync(path.join(BACKEND_DIR, '.env'));
  return hasRealEnv && !DOTENV_CONFIG_PATH ? 'có backend/.env thật mà chưa đặt DOTENV_CONFIG_PATH' : null;
}

function unsafeReason(env) {
  if (!env.PG_HOST || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return 'thiếu biến môi trường Supabase local';
  return notLocalReason(env) ?? realEnvReason(env);
}

const skipReason = unsafeReason(process.env);
if (skipReason && process.env.CI) {
  throw new Error(`[integration] CI không chạy được test tích hợp: ${skipReason}`);
}
if (skipReason) {
  console.warn(`[integration] bỏ qua: ${skipReason}`);
  process.exit(0);
}

const { default: app } = await import('~/app.js');

const pool = new pg.Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

let server;
let baseUrl;

export async function sql(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function closeDb() {
  await pool.end();
}

export async function startServer() {
  if (server) return baseUrl;
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
}

export async function stopServer() {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve) => {
    server.close(resolve);
  });
  server = null;
}

function storeCookies(jar, res) {
  for (const line of res.headers.getSetCookie()) {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    const expired = value === '' || /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(line);
    if (expired) jar.delete(name);
    else jar.set(name, value);
  }
}

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** Client giữ cookie như trình duyệt (chỉ tên=giá trị, đủ cho test). */
export function createClient() {
  const jar = new Map();

  async function request(method, urlPath, { body, headers = {}, form } = {}) {
    const init = { method, headers: { ...headers } };
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) init.headers.cookie = cookie;
    if (form) init.body = form;
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const res = await fetch(`${baseUrl}${urlPath}`, init);
    storeCookies(jar, res);
    const json = parseBody(await res.text());
    return { status: res.status, json, headers: res.headers, setCookies: res.headers.getSetCookie() };
  }

  return { jar, request };
}

let counter = 0;
export function uniqueEmail(tag) {
  counter += 1;
  // Chữ thường: backend đổi email về chữ thường, helper còn so khớp email trong SQL (registerAdmin)
  return `it.${tag}.${Date.now()}.${counter}@example.test`.toLowerCase();
}

/** Đăng ký + giữ phiên. Trả { client, email, password, user }. */
export async function registerUser(tag = 'u') {
  const client = createClient();
  const email = uniqueEmail(tag);
  const password = 'Review#12345';
  const res = await client.request('POST', '/api/auth/register', {
    body: { email, password, full_name: `Test ${tag}` },
  });
  if (res.status >= 300) throw new Error(`register ${res.status}: ${JSON.stringify(res.json)}`);
  const me = await client.request('GET', '/api/auth/me');
  return { client, email, password, user: me.json?.data };
}

/** Đăng ký rồi nâng quyền admin trong DB, đăng nhập lại để token mang role admin. */
export async function registerAdmin(tag = 'admin') {
  const u = await registerUser(tag);
  await sql(`UPDATE users SET role = 'admin' WHERE email = $1`, [u.email]);
  const client = createClient();
  const res = await client.request('POST', '/api/auth/login', { body: { email: u.email, password: u.password } });
  if (res.status !== 200) throw new Error(`admin login ${res.status}`);
  return { ...u, client };
}

export async function createScholarship(overrides = {}) {
  const title = overrides.title || `Test scholarship ${Date.now()} ${Math.random()}`;
  const fields = {
    title,
    provider: 'Test Org',
    country: 'Japan',
    degree: 'Master',
    deadline: null,
    is_active: true,
    ...overrides,
  };
  const keys = Object.keys(fields);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const rows = await sql(
    `INSERT INTO scholarships (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id, slug, title`,
    Object.values(fields)
  );
  return rows[0];
}
