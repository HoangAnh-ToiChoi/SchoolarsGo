// Đặc tả phân quyền: user A không được đụng dữ liệu user B; user thường không vào /admin.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  closeDb,
  createClient,
  createScholarship,
  registerAdmin,
  registerUser,
  sql,
  startServer,
  stopServer,
} from './helpers/app.js';

let A;
let B;
let scholarship;

before(async () => {
  await startServer();
  A = await registerUser('authzA');
  B = await registerUser('authzB');
  scholarship = await createScholarship();
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('IDOR giữa hai người dùng', () => {
  it('B không đọc / sửa / xóa được đơn của A (404)', async () => {
    const created = await A.client.request('POST', '/api/applications', { body: { scholarship_id: scholarship.id } });
    assert.equal(created.status, 201, JSON.stringify(created.json));
    const id = created.json.data.id;

    const read = await B.client.request('GET', `/api/applications/${id}`);
    const patch = await B.client.request('PATCH', `/api/applications/${id}`, { body: { notes: 'hacked' } });
    const del = await B.client.request('DELETE', `/api/applications/${id}`);
    assert.deepEqual([read.status, patch.status, del.status], [404, 404, 404]);

    const [row] = await sql('SELECT notes FROM applications WHERE id = $1', [id]);
    assert.notEqual(row.notes, 'hacked');
  });

  it('B không đánh dấu đọc được thông báo của A', async () => {
    const [n] = await sql(
      `INSERT INTO notifications (user_id, type, scholarship_id, milestone) VALUES ($1, 'deadline', $2, 7) RETURNING id`,
      [A.user.id, scholarship.id]
    );
    const res = await B.client.request('PATCH', `/api/notifications/${n.id}/read`);
    assert.equal(res.status, 404, JSON.stringify(res.json));
    const [row] = await sql('SELECT read_at FROM notifications WHERE id = $1', [n.id]);
    assert.equal(row.read_at, null);
  });

  it('B không xóa được tài liệu của A', async () => {
    const [d] = await sql(
      `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
       VALUES ($1, 'cv', 'a.pdf', 'http://x/documents/a.pdf', 10, 'application/pdf') RETURNING id`,
      [A.user.id]
    );
    const res = await B.client.request('DELETE', `/api/documents/${d.id}`);
    assert.equal(res.status, 404);
    const rows = await sql('SELECT id FROM documents WHERE id = $1', [d.id]);
    assert.equal(rows.length, 1);
  });

  it('B không kết thúc được phiên đăng nhập của A', async () => {
    const [s] = await sql('SELECT id FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL LIMIT 1', [A.user.id]);
    const res = await B.client.request('DELETE', `/api/auth/sessions/${s.id}`);
    assert.equal(res.status, 404, `status ${res.status}`);
    // /auth/me của A vẫn 200 kể cả khi phiên bị thu hồi (access token sống 15 phút, R14) nên phải kiểm DB
    const [after] = await sql('SELECT revoked_at FROM user_sessions WHERE id = $1', [s.id]);
    assert.equal(after.revoked_at, null, 'B đã thu hồi được phiên của A');
  });

  it('documents_used chỉ nhận tài liệu của chính mình', async () => {
    const [d] = await sql(
      `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
       VALUES ($1, 'cv', 'b.pdf', 'http://x/documents/b.pdf', 10, 'application/pdf') RETURNING id`,
      [B.user.id]
    );
    const s2 = await createScholarship();
    const created = await A.client.request('POST', '/api/applications', { body: { scholarship_id: s2.id } });
    const res = await A.client.request('PATCH', `/api/applications/${created.json.data.id}`, {
      body: { documents_used: [d.id] },
    });
    assert.ok(res.status >= 400, `nhận tài liệu của người khác: status ${res.status}`);
  });
});

describe('Quyền admin', () => {
  it('user thường gọi /admin/* bị 403', async () => {
    const stats = await A.client.request('GET', '/api/admin/stats');
    const promote = await A.client.request('PATCH', `/api/admin/users/${A.user.id}/role`, { body: { role: 'admin' } });
    assert.deepEqual([stats.status, promote.status], [403, 403]);
  });

  it('chưa đăng nhập gọi /admin/* bị 401', async () => {
    const res = await createClient().request('GET', '/api/admin/stats');
    assert.equal(res.status, 401);
  });

  it('admin bị hạ quyền thì mất quyền admin ngay (không đợi token hết hạn)', { todo: 'R14 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const admin = await registerAdmin('demoted');
    const before = await admin.client.request('GET', '/api/admin/stats');
    assert.equal(before.status, 200, JSON.stringify(before.json));
    await sql(`UPDATE users SET role = 'user' WHERE email = $1`, [admin.email]);
    const afterDemote = await admin.client.request('GET', '/api/admin/stats');
    assert.equal(afterDemote.status, 403, 'token cũ vẫn mang role admin');
  });

  it('tài khoản bị khóa (is_active=false) không gọi API được nữa', { todo: 'R14 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const u = await registerUser('banned');
    await sql('UPDATE users SET is_active = false WHERE email = $1', [u.email]);
    const res = await u.client.request('GET', '/api/profile');
    assert.equal(res.status, 401, 'user bị khóa vẫn dùng được access token');
  });

  it('bộ lọc ?status=inactive của /admin/users có tác dụng', async () => {
    const admin = await registerAdmin('filter');
    const banned = await registerUser('inactiveOne');
    await sql('UPDATE users SET is_active = false WHERE email = $1', [banned.email]);
    const res = await admin.client.request('GET', '/api/admin/users?status=active&limit=50');
    assert.equal(res.status, 200, JSON.stringify(res.json));
    const list = res.json.data?.users || res.json.data || [];
    assert.ok(!list.some((x) => x.email === banned.email), 'user bị khóa vẫn có trong danh sách active');
  });

  it('admin tạo học bổng thiếu country/degree nhận 400 (không 500)', async () => {
    const admin = await registerAdmin('creator');
    const res = await admin.client.request('POST', '/api/admin/scholarships', {
      body: { title: `Thiếu nước ${Date.now()}`, provider: 'X' },
    });
    assert.equal(res.status, 400, `status ${res.status} ${JSON.stringify(res.json)}`);
  });
});
