import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';
import { CHAT_REPLY } from '~/constants/chat.js';

// Service dùng bản model xuất sẵn: giả lập model trước khi nạp service
const modelRef = mockService(srcUrl('models/chat.model.js'));
const { default: chatService } = await import('~/services/chat.service.js');

function fakeModel({ profile = null, scholarships = [] } = {}) {
  const calls = { filters: [], inserted: [] };
  modelRef.current = {
    findProfile: async () => profile,
    findScholarships: async (filters, limit) => {
      calls.filters.push({ filters, limit });
      return scholarships;
    },
    insertMessages: async (rows) => {
      calls.inserted.push(rows);
    },
    findHistory: async () => [
      { role: 'assistant', content: 'mới', created_at: '2026-11-24T02:00:00Z' },
      { role: 'user', content: 'cũ', created_at: '2026-11-24T01:00:00Z' },
    ],
  };
  return calls;
}

const user = (content) => ({ role: 'user', content });

test('câu hỏi không về học bổng → câu hướng dẫn, không truy vấn DB, không lỗi 503', async () => {
  const calls = fakeModel();
  const reply = await chatService.chat([user('xin chào')], { userId: 'u1' });
  assert.equal(reply, CHAT_REPLY.guide);
  assert.equal(calls.filters.length, 0);
});

test('rút bộ lọc quốc gia (đúng tên lưu trong DB), bậc học, GPA, IELTS từ câu hỏi', async () => {
  const calls = fakeModel();
  await chatService.chat([user('tìm học bổng Anh thạc sĩ GPA 3.2 IELTS 6.5')], { userId: 'u1' });
  assert.deepEqual(calls.filters[0].filters, { country: 'United Kingdom', degree: 'Master', min_gpa: 3.2, min_ielts: 6.5 });
  assert.equal(calls.filters[0].limit, 8);
});

test('chữ có dấu: "tiến sĩ", "Úc"; "tiếng Anh" không phải nước Anh', async () => {
  const calls = fakeModel();
  await chatService.chat([user('học bổng tiến sĩ ở Úc, mình có IELTS tiếng Anh 7.0')], { userId: 'u1' });
  assert.equal(calls.filters[0].filters.country, 'Australia');
  assert.equal(calls.filters[0].filters.degree, 'PhD');
  const calls2 = fakeModel();
  await chatService.chat([user('tìm học bổng cần tiếng Anh tốt')], { userId: 'u1' });
  assert.equal(calls2.filters[0].filters.country, undefined);
});

test('câu hỏi thiếu tiêu chí thì lấy từ hồ sơ', async () => {
  const calls = fakeModel({ profile: { target_country: 'Japan', target_degree: 'Any', gpa: '3.6', english_level: 'IELTS 7.0' } });
  await chatService.chat([user('gợi ý học bổng cho mình')], { userId: 'u1' });
  assert.deepEqual(calls.filters[0].filters, { country: 'Japan', min_gpa: 3.6, min_ielts: 7 });
});

test('có học bổng → trả danh sách chữ kèm hạn nộp và link', async () => {
  fakeModel({
    scholarships: [
      { title: 'MEXT', provider: 'Gov JP', country: 'Japan', deadline: null, min_gpa: 3, amount: null, application_url: 'https://x.jp' },
    ],
  });
  const reply = await chatService.chat([user('học bổng Nhật')], { userId: 'u1' });
  assert.match(reply, /\*\*MEXT\*\* \(Gov JP\) — Japan — Hạn nộp: Chưa rõ/);
  assert.match(reply, /GPA tối thiểu: 3/);
  assert.match(reply, /Link: https:\/\/x\.jp/);
});

test('không có học bổng khớp → câu gợi ý nới tiêu chí', async () => {
  fakeModel({ scholarships: [] });
  const reply = await chatService.chat([user('học bổng Thụy Điển tiến sĩ')], { userId: 'u1' });
  assert.equal(reply, CHAT_REPLY.notFound);
});

test('lịch sử trả từ cũ đến mới, chỉ role + content', async () => {
  fakeModel();
  const history = await chatService.getHistory('u1');
  assert.deepEqual(history, [
    { role: 'user', content: 'cũ' },
    { role: 'assistant', content: 'mới' },
  ]);
});

test('lưu cặp tin nhắn; không có userId thì không ghi', async () => {
  const calls = fakeModel();
  await chatService.saveMessages('u1', 'hỏi', 'đáp');
  await chatService.saveMessages(null, 'hỏi', 'đáp');
  assert.equal(calls.inserted.length, 1);
  const [asked, answered] = calls.inserted[0];
  assert.deepEqual([asked.role, answered.role], ['user', 'assistant']);
  assert.ok(answered.created_at > asked.created_at, 'tin trợ lý phải sau tin người dùng để lịch sử đúng thứ tự');
});

const assistant = (content) => ({ role: 'assistant', content });

test('bỏ qua tin trợ lý: câu hướng dẫn chứa "Nhật", "GPA 3.2" không thành bộ lọc', async () => {
  const calls = fakeModel();
  const reply = await chatService.chat([user('xin chào'), assistant(CHAT_REPLY.guide), user('chào bạn')], { userId: 'u1' });
  assert.equal(reply, CHAT_REPLY.guide, 'chữ "học bổng" trong câu hướng dẫn không biến "chào bạn" thành câu hỏi học bổng');

  await chatService.chat([user('xin chào'), assistant(CHAT_REPLY.guide), user('tìm học bổng')], { userId: 'u1' });
  assert.deepEqual(calls.filters[0].filters, {});
});

test('người dùng đổi ý: tin mới nhất thắng', async () => {
  const calls = fakeModel();
  await chatService.chat([user('học bổng Úc thạc sĩ'), assistant('danh sách Australia…'), user('thế còn học bổng Đức?')], { userId: 'u1' });
  assert.equal(calls.filters[0].filters.country, 'Germany');
  assert.equal(calls.filters[0].filters.degree, 'Master', 'tiêu chí cũ chưa bị thay vẫn giữ');
});

test('âm tiết trùng từ thường không thành tên nước', async () => {
  const calls = fakeModel();
  await chatService.chat([user('anh muốn tìm học bổng, cập nhật giúp em ngành thẩm mỹ')], { userId: 'u1' });
  assert.equal(calls.filters[0].filters.country, undefined);
  await chatService.chat([user('du học Anh'), user('học bổng ở Mỹ'), user('học bổng Hàn Quốc')], { userId: 'u1' });
  assert.equal(calls.filters[1].filters.country, 'South Korea');
});

test('GPA ngoài thang 4 bị bỏ qua, "gpa 3" vẫn nhận', async () => {
  const calls = fakeModel();
  await chatService.chat([user('học bổng gpa 4.5')], { userId: 'u1' });
  await chatService.chat([user('học bổng điểm 8.0')], { userId: 'u1' });
  await chatService.chat([user('học bổng gpa 3')], { userId: 'u1' });
  assert.deepEqual(calls.filters.map((c) => c.filters.min_gpa), [undefined, undefined, 3]);
});

test('nước trong hồ sơ là chữ tự gõ ("UK", "Nhật Bản", "Mỹ") → tên lưu trong DB', async () => {
  const expected = { UK: 'United Kingdom', 'Nhật Bản': 'Japan', Mỹ: 'United States', Mongolia: 'Mongolia' };
  for (const [typed, stored] of Object.entries(expected)) {
    const calls = fakeModel({ profile: { target_country: typed } });
    await chatService.chat([user('gợi ý học bổng')], { userId: 'u1' });
    assert.equal(calls.filters[0].filters.country, stored);
  }
});

test('reply: trả câu trả lời và lưu cặp tin mới nhất; lưu lỗi vẫn trả lời', async () => {
  const calls = fakeModel();
  const answer = await chatService.reply([assistant('chào'), user('xin chào')], 'u1');
  assert.equal(answer, CHAT_REPLY.guide);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls.inserted[0].map((r) => r.content), ['xin chào', CHAT_REPLY.guide]);

  modelRef.current.insertMessages = async () => {
    throw new Error('db down');
  };
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await chatService.reply([user('xin chào')], 'u1'), CHAT_REPLY.guide);
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    console.warn = warn;
  }
});
