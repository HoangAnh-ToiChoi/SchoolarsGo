// Đặc tả scripts/migrate.js trên Supabase local: chạy đồng thời không lỗi, 015 không đụng email trùng.
// Test xóa dòng trong schema_migrations để chạy lại file: mọi migration viết dạng chạy lại được.
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { closeDb, sql, uniqueEmail } from './helpers/app.js';

const run = promisify(execFile);
const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// --env trỏ file không tồn tại: chỉ dùng PG_* của LAB đã có trong môi trường
const migrate = () => run(process.execPath, ['scripts/migrate.js', '--env=.env.none'], { cwd: BACKEND_DIR, env: process.env });

after(async () => {
  await closeDb();
});

describe('Migration', () => {
  it('ba tiến trình chạy cùng lúc đều thành công, mỗi file chỉ áp một lần', async () => {
    await sql('DELETE FROM schema_migrations');
    const results = await Promise.all([migrate(), migrate(), migrate()]);
    const output = results.map((result) => result.stdout).join('\n');
    const [{ total }] = await sql('SELECT count(*)::int AS total FROM schema_migrations');
    const applied = output.match(/✓ /g) ?? [];
    assert.equal(applied.length, total, output);
  });

  it('015: hai email trùng đều có chữ hoa thì giữ nguyên, cảnh báo, không lỗi', async () => {
    const lower = uniqueEmail('dup');
    const variants = [lower.toUpperCase(), `I${lower.slice(1)}`];
    await sql('DROP INDEX IF EXISTS uq_users_email_lower');
    for (const email of variants) {
      await sql(`INSERT INTO users (email, password_hash, full_name) VALUES ($1, 'x', 'dup')`, [email]);
    }
    await sql(`DELETE FROM schema_migrations WHERE name = '015_emailLowercase.sql'`);
    try {
      const { stdout, stderr } = await migrate();
      assert.match(`${stdout}${stderr}`, /còn email trùng/);
      const rows = await sql('SELECT email FROM users WHERE lower(email) = $1', [lower]);
      const emails = rows.map((row) => row.email);
      assert.deepEqual(emails.sort(), [...variants].sort());
    } finally {
      await sql('DELETE FROM users WHERE lower(email) = $1', [lower]);
      await sql(`DELETE FROM schema_migrations WHERE name = '015_emailLowercase.sql'`);
      await migrate();
    }
    const [{ index }] = await sql(`SELECT to_regclass('public.uq_users_email_lower')::text AS index`);
    assert.equal(index, 'uq_users_email_lower');
  });
});
