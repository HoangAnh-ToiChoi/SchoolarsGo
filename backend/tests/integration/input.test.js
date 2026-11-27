// Đặc tả đầu vào sai / thiếu / quá dài và các luật dữ liệu ở endpoint chính.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { closeDb, createClient, createScholarship, registerUser, sql, startServer, stopServer } from './helpers/app.js';

let U;

before(async () => {
  await startServer();
  U = await registerUser('input');
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('Tìm kiếm học bổng', () => {
  it('search có dấu phẩy / ngoặc không gây 500', async () => {
    for (const q of ['Harvard,MIT', 'a)b', 'x(y', 'a.b']) {
      const res = await createClient().request('GET', `/api/scholarships?search=${encodeURIComponent(q)}`);
      assert.ok(res.status < 500, `search=${q} → ${res.status}`);
    }
  });

  it('search không chèn được điều kiện OR làm vô hiệu bộ lọc', async () => {
    const marker = `ZZNOMATCH${Date.now()}`;
    const normal = await createClient().request('GET', `/api/scholarships?search=${marker}`);
    const injected = await createClient().request('GET', `/api/scholarships?search=${encodeURIComponent(`${marker}%,id.not.is.null`)}`);
    const count = (r) => r.json?.meta?.total ?? (Array.isArray(r.json?.data) ? r.json.data.length : r.json?.data?.length);
    assert.equal(count(normal), 0);
    assert.equal(count(injected), 0, `chuỗi chèn trả ${count(injected)} kết quả, status ${injected.status}`);
  });

  it('limit quá lớn bị chặn (không trả hàng nghìn dòng)', async () => {
    const res = await createClient().request('GET', '/api/scholarships?limit=100000');
    assert.ok(res.status < 500, `status ${res.status}`);
    assert.ok(res.status === 400 || (res.json?.data?.length ?? 0) <= 100, `status ${res.status}`);
  });

  it('lọc min_gpa vẫn giữ học bổng không yêu cầu GPA (min_gpa NULL)', async () => {
    const s = await createScholarship({ title: `NoGpaReq ${Date.now()}`, min_gpa: null });
    const res = await createClient().request('GET', `/api/scholarships?min_gpa=3&search=${encodeURIComponent(s.title)}`);
    assert.equal(res.status, 200, JSON.stringify(res.json));
    const ids = (res.json.data || []).map((x) => x.id);
    assert.ok(ids.includes(s.id), 'học bổng không đòi GPA bị loại khỏi kết quả lọc GPA');
  });

  it('id sai định dạng ở /scholarships/:id trả 404/400, không 500', async () => {
    const res = await createClient().request('GET', "/api/scholarships/'%20or%201=1");
    assert.ok([400, 404].includes(res.status), `status ${res.status}`);
  });
});

describe('Đã lưu / đơn ứng tuyển', () => {
  it('scholarshipId không phải UUID trả 400/404, không 500', async () => {
    const res = await U.client.request('POST', '/api/saved/not-a-uuid');
    assert.ok([400, 404].includes(res.status), `status ${res.status} ${JSON.stringify(res.json)}`);
  });

  it('note 1MB của saved bị từ chối', { todo: 'R28 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const s = await createScholarship();
    const res = await U.client.request('POST', `/api/saved/${s.id}`, { body: { note: 'x'.repeat(1024 * 1024) } });
    assert.equal(res.status, 400, `lưu được note 1MB: status ${res.status}`);
  });

  it('không tạo được đơn cho học bổng đã tắt', { todo: 'R28 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const s = await createScholarship({ is_active: false });
    const res = await U.client.request('POST', '/api/applications', { body: { scholarship_id: s.id } });
    assert.ok(res.status >= 400, `tạo được đơn cho học bổng đã tắt: ${res.status}`);
  });

  it('checklist 5000 mục bị từ chối', { todo: 'R28 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const s = await createScholarship();
    const checklist = Array.from({ length: 5000 }, (_, i) => ({ item: `mục ${i}`, done: false }));
    const res = await U.client.request('POST', '/api/applications', { body: { scholarship_id: s.id, checklist } });
    assert.equal(res.status, 400, `nhận checklist 5000 mục: ${res.status}`);
  });

  it('tạo đơn đồng thời cho cùng học bổng chỉ ra 1 đơn, các request còn lại 409', async () => {
    const s = await createScholarship();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => U.client.request('POST', '/api/applications', { body: { scholarship_id: s.id } }))
    );
    const statuses = results.map((r) => r.status).sort();
    const rows = await sql('SELECT count(*)::int AS n FROM applications WHERE user_id = $1 AND scholarship_id = $2', [U.user.id, s.id]);
    assert.equal(rows[0].n, 1);
    assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
  });
});

describe('Hồ sơ', () => {
  it('GPA thang 10 (8.5, gpa_scale 10) được nhận và quy đổi', { todo: 'R33 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const res = await U.client.request('PUT', '/api/profile', { body: { gpa: 8.5, gpa_scale: '10' } });
    assert.equal(res.status, 200, `GPA thang 10 bị từ chối: ${res.status} ${res.json?.message}`);
  });

  it('chuỗi bio quá dài bị 400', async () => {
    const res = await U.client.request('PUT', '/api/profile', { body: { bio: 'x'.repeat(5000) } });
    assert.equal(res.status, 400);
  });

  it('body JSON hỏng trả 400', async () => {
    const res = await U.client.request('PUT', '/api/profile', { body: '{"bio":' });
    assert.equal(res.status, 400);
  });
});

describe('Chat', () => {
  it('lịch sử chat khổng lồ bị chặn ở validation (trước khi gọi LLM)', async () => {
    const huge = Array.from({ length: 19 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(200_000) }));
    huge.push({ role: 'user', content: 'học bổng Nhật' });
    const res = await U.client.request('POST', '/api/chat', { body: { messages: huge } });
    assert.ok([400, 413].includes(res.status), `payload ~3.8MB qua validation: status ${res.status}`);
  });
});
