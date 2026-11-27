// Đặc tả nghiệp vụ: hạn nộp theo giờ VN, gợi ý với hồ sơ thiếu dữ liệu, điều kiện cứng, thông báo.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { closeDb, createScholarship, registerUser, sql, startServer, stopServer } from './helpers/app.js';
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

  it('hạn admin nhập dạng ISO Z lúc 0h VN (17:00Z hôm trước) được đếm đúng ngày VN', { todo: 'R25 — lỗi đã biết, gỡ todo khi sửa' }, () => {
    // 2026-12-01T17:00:00Z = 00:00 ngày 02/12 giờ VN → hôm nay 24/11 VN còn 8 ngày
    assert.equal(daysBetween('2026-11-24', '2026-12-01T17:00:00Z'), 8);
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

  it('hồ sơ Bachelor + VN không được gợi ý học bổng chỉ dành cho PhD / quốc tịch JP', { todo: 'R20 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    await U.client.request('PUT', '/api/profile', {
      body: { gpa: 3.8, english_level: 'IELTS 7.5', target_country: 'Japan', target_degree: 'Bachelor', target_major: 'Computer Science', nationality: 'VN' },
    });
    const phd = await createScholarship({
      title: `PhD only Japan Computer Science ${Date.now()}`, country: 'Japan', degree: 'PhD', field_of_study: 'Computer Science', relevance_score: 100,
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

describe('Thông báo nhắc hạn', () => {
  it('không nhắc hạn cho học bổng đã bị admin tắt', async () => {
    const U = await registerUser('notif');
    const in5days = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
    const s = await createScholarship({ deadline: in5days });
    const control = await createScholarship({ deadline: in5days });
    await U.client.request('POST', `/api/saved/${s.id}`);
    await U.client.request('POST', `/api/saved/${control.id}`);
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
