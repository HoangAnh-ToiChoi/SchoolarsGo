// Đặc tả nghiệp vụ: hạn nộp theo giờ VN, gợi ý với hồ sơ thiếu dữ liệu, điều kiện cứng, thông báo.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { closeDb, createScholarship, registerAdmin, registerUser, sql, startServer, stopServer } from './helpers/app.js';
import { daysBetween, milestoneFor, vnToday } from '~/utils/deadline.js';

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('Hạn nộp theo Asia/Ho_Chi_Minh', () => {
  it('01:30 sáng giờ VN (18:30Z hôm trước) là ngày VN mới', () => {
    assert.equal(vnToday(new Date('2026-11-24T18:30:00Z')), '2026-11-25');
  });

  it('23:30 giờ VN (16:30Z) vẫn là ngày VN cũ', () => {
    assert.equal(vnToday(new Date('2026-11-24T16:30:00Z')), '2026-11-24');
  });

  it('hạn admin nhập dạng ISO Z lúc 0h VN (17:00Z hôm trước) được đếm đúng ngày VN', () => {
    // 2026-12-01T17:00:00Z = 00:00 ngày 02/12 giờ VN → hôm nay 24/11 VN còn 8 ngày
    assert.equal(daysBetween('2026-11-24', '2026-12-01T17:00:00Z'), 8);
  });

  it('admin nhập hạn ISO 0h giờ VN (17:00Z hôm trước) được lưu đúng ngày VN', async () => {
    const admin = await registerAdmin('deadlineIso');
    const res = await admin.client.request('POST', '/api/admin/scholarships', {
      body: { title: `Hạn ISO ${Date.now()}`, provider: 'X', country: 'Japan', degree: 'Master', deadline: '2027-03-01T17:00:00.000Z' },
    });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    const [row] = await sql(`SELECT to_char(deadline, 'YYYY-MM-DD') AS day, degree_source FROM scholarships WHERE id = $1`, [res.json.data.id]);
    assert.equal(row.day, '2027-03-02');
    assert.equal(row.degree_source, 'admin', 'bậc học admin nhập phải được ghi là đã xác nhận');

    const sourceAfterPatch = async (body) => {
      await sql(`UPDATE scholarships SET degree = 'PhD', degree_source = 'body' WHERE id = $1`, [res.json.data.id]);
      const patched = await admin.client.request('PATCH', `/api/admin/scholarships/${res.json.data.id}`, { body });
      assert.equal(patched.status, 200, JSON.stringify(patched.json));
      const [after] = await sql('SELECT degree_source FROM scholarships WHERE id = $1', [res.json.data.id]);
      return after.degree_source;
    };
    assert.equal(await sourceAfterPatch({ degree: 'PhD', title: `Sửa chính tả ${Date.now()}` }), 'body', 'lưu lại bậc cũ không phải xác nhận');
    assert.equal(await sourceAfterPatch({ degree: 'Master' }), 'admin', 'đổi bậc là admin xác nhận');
  });

  it('mốc nhắc: còn 0 ngày → mốc 1; còn 15 ngày → không nhắc', () => {
    assert.equal(milestoneFor(0), 1);
    assert.equal(milestoneFor(15), null);
  });
});

describe('Gợi ý học bổng', () => {
  let U;
  before(async () => {
    U = await registerUser('rec');
  });

  it('hồ sơ trống (GPA/IELTS null) không gây 500', async () => {
    const res = await U.client.request('POST', '/api/recommend', { body: { top_n: 5 } });
    assert.ok(res.status < 500, `status ${res.status} ${JSON.stringify(res.json).slice(0, 200)}`);
  });

  it('hồ sơ Bachelor + VN không được gợi ý học bổng chỉ dành cho PhD / quốc tịch JP', async () => {
    await U.client.request('PUT', '/api/profile', {
      body: { gpa: 3.8, english_level: 'IELTS 7.5', target_country: 'Japan', target_degree: 'Bachelor', target_major: 'Computer Science', nationality: 'VN' },
    });
    const phd = await createScholarship({
      title: `PhD only Japan Computer Science ${Date.now()}`, country: 'Japan', degree: 'PhD', degree_source: 'title', field_of_study: 'Computer Science', relevance_score: 100,
    });
    const jpOnly = await createScholarship({
      title: `Japanese nationals Computer Science ${Date.now()}`, country: 'Japan', degree: 'Bachelor', field_of_study: 'Computer Science', relevance_score: 100,
    });
    await sql(`UPDATE scholarships SET eligible_nationalities = ARRAY['JP'] WHERE id = $1`, [jpOnly.id]);

    const res = await U.client.request('POST', '/api/recommend', { body: { top_n: 50 } });
    assert.equal(res.status, 200, JSON.stringify(res.json).slice(0, 300));
    const list = res.json.data?.recommendations || res.json.data || [];
    const ids = list.map((x) => x.id || x.scholarship?.id);
    assert.ok(!ids.includes(phd.id), 'gợi ý học bổng PhD cho người muốn học Bachelor');
    assert.ok(!ids.includes(jpOnly.id), 'gợi ý học bổng chỉ cho quốc tịch JP cho người VN');
  });

  it('ngưỡng GPA / IELTS đọc ra là số: 0 không tính là yêu cầu, lý do không in "3.00"', async () => {
    const N = await registerUser('numeric');
    await N.client.request('PUT', '/api/profile', {
      body: { gpa: 3.8, english_level: 'IELTS 7.5', target_country: 'Japan', target_degree: 'Master', target_major: 'Computer Science' },
    });
    const base = { country: 'Japan', degree: 'Master', field_of_study: 'Computer Science', relevance_score: 100 };
    const withMin = await createScholarship({ ...base, title: `Numeric min ${Date.now()}`, min_gpa: 3, min_ielts: 7 });
    const zeroMin = await createScholarship({ ...base, title: `Numeric zero ${Date.now()}`, min_gpa: 0, min_ielts: 0 });

    const res = await N.client.request('POST', '/api/recommend', { body: { top_n: 50 } });
    assert.equal(res.status, 200, JSON.stringify(res.json).slice(0, 300));
    const list = res.json.data?.recommendations || res.json.data || [];
    const find = (id) => list.find((x) => x.scholarship?.id === id);

    const reasons = find(withMin.id).reasons.join(' | ');
    assert.match(reasons, /GPA [\d.]+ đạt yêu cầu tối thiểu 3(?![.\d])/);
    assert.match(reasons, /IELTS 7\.5 đạt yêu cầu tối thiểu 7(?![.\d])/);
    assert.doesNotMatch(find(zeroMin.id).reasons.join(' | '), /yêu cầu tối thiểu/);
  });

  it('thiếu IELTS thì không được gợi ý như đủ điều kiện cho học bổng đòi IELTS 7.0', async () => {
    const V = await registerUser('noIelts');
    await V.client.request('PUT', '/api/profile', { body: { gpa: 3.9, target_country: 'Korea', target_major: 'Economics' } });
    const s = await createScholarship({ title: `Korea Economics IELTS ${Date.now()}`, country: 'Korea', field_of_study: 'Economics', min_ielts: 7.0, relevance_score: 100 });
    const res = await V.client.request('POST', '/api/recommend', { body: { top_n: 50 } });
    assert.equal(res.status, 200, JSON.stringify(res.json).slice(0, 300));
    const list = res.json.data?.recommendations || res.json.data || [];
    const hit = list.find((x) => (x.id || x.scholarship?.id) === s.id);
    if (!hit) return; // không gợi ý cũng là kết quả chấp nhận được; gợi ý thì phải kèm cảnh báo
    const text = JSON.stringify(hit);
    assert.match(text, /ielts|blocker|thiếu|missing/i, `gợi ý không cảnh báo thiếu IELTS: ${text.slice(0, 300)}`);
  });
});

async function waitFor(check, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
  throw new Error('waitFor: hết thời gian chờ');
}

describe('Thông báo nhắc hạn', () => {
  it('không nhắc hạn cho học bổng đã bị admin tắt', async () => {
    const U = await registerUser('notif');
    const in5days = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
    const s = await createScholarship({ deadline: in5days });
    const control = await createScholarship({ deadline: in5days });
    await U.client.request('POST', `/api/saved/${s.id}`);
    await U.client.request('POST', `/api/saved/${control.id}`);
    // Lưu học bổng tạo nhắc hạn mà không chờ (refreshUserReminders): đợi xong, không thì nó ghi sau bước xóa bên dưới
    await waitFor(async () => (await sql('SELECT 1 FROM notifications WHERE user_id = $1', [U.user.id])).length >= 2);
    await sql('UPDATE scholarships SET is_active = false WHERE id = $1', [s.id]);
    await sql('DELETE FROM notifications WHERE user_id = $1', [U.user.id]); // xóa nhắc tạo lúc lưu, chỉ xét lượt GET
    // GET /notifications tạo nhắc hạn (mỗi người một lần mỗi ngày) trước khi đọc
    const res = await U.client.request('GET', '/api/notifications');
    assert.equal(res.status, 200, JSON.stringify(res.json));
    const rows = await sql('SELECT scholarship_id FROM notifications WHERE user_id = $1', [U.user.id]);
    const ids = rows.map((r) => r.scholarship_id);
    assert.ok(ids.includes(control.id), 'đối chứng: học bổng còn mở phải có nhắc hạn (nếu không, test không chứng minh gì)');
    assert.ok(!ids.includes(s.id), 'tạo thông báo cho học bổng đã tắt');
  });
});
