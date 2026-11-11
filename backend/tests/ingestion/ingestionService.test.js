'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runIngestion } = require('../../src/ingestion');
const { createAiFill } = require('../../src/ingestion/aiExtract');
const { NOW, rawPost } = require('./helpers');

const silent = { info() {}, warn() {}, error() {} };

/** Nguồn giả trả đúng các bài truyền vào. */
const fakeSource = (name, priority, posts, { fail = false } = {}) => ({
  name,
  priority,
  async *fetchPosts() {
    if (fail) throw new Error('nguồn sập');
    for (const post of posts) yield { ...post, sourceName: name, priority };
  },
});

/** Store giả trong bộ nhớ, ghi lại những gì được lưu. */
function fakeStore(existing = []) {
  const state = { inserted: [], updated: [], runs: [] };
  return {
    state,
    findExisting: async () => existing,
    insertMany: async (rows) => {
      state.inserted.push(...rows);
      return rows.length;
    },
    updateMany: async (rows) => {
      state.updated.push(...rows);
      return rows.length;
    },
    recordRun: async (run) => {
      state.runs.push(run);
    },
    deactivateExpired: async () => 0,
  };
}

function build(sources, store = fakeStore()) {
  const service = { run: (options) => runIngestion({ sources, store, logger: silent, now: () => NOW }, options) };
  return { service, store };
}

const good = (n) =>
  rawPost({
    externalId: String(n),
    title: `Alpha University ${n} Scholarship for Asian Students`,
    link: `https://example.org/alpha-${n}/`,
    contentText: 'Deadline: 1 March 2027\nStudy in: Japan\nOpen to students from Vietnam. Master degree.',
  });

test('bài tốt được lưu, bài xấu bị loại và đếm theo từng luật', async () => {
  const posts = [
    good(1),
    rawPost({ title: 'Senior Accountant Job Vacancy in Hanoi', link: 'https://example.org/job/' }),
    rawPost({ title: 'Old Scholarship Already Closed Years Ago', link: 'https://example.org/old/', contentText: 'Deadline: 1 March 2026' }),
    rawPost({ title: 'Valid Looking Scholarship Without Link', link: '' }),
  ];
  const { service, store } = build([fakeSource('a', 1, posts)]);
  const [stats] = await service.run();

  assert.equal(stats.fetched, 4);
  assert.deepEqual(stats.rejected, { R1: 1, R2: 1, R5: 1 });
  assert.equal(stats.passed, 1);
  assert.equal(store.state.inserted.length, 1);
  assert.equal(store.state.inserted[0].source, 'a');
  assert.equal(store.state.inserted[0].source_url, 'https://example.org/alpha-1/');
  assert.equal(store.state.inserted[0].country, 'Japan');
});

test('dryRun không ghi gì và không ghi nhật ký, nhưng vẫn báo số sẽ thêm', async () => {
  const { service, store } = build([fakeSource('a', 1, [good(1), good(2)])]);
  const [stats] = await service.run({ dryRun: true });
  assert.equal(stats.inserted, 2);
  assert.equal(store.state.inserted.length, 0);
  assert.equal(store.state.runs.length, 0);
});

test('cùng học bổng ở hai nguồn: nguồn chạy trước (ưu tiên cao) thắng', async () => {
  const same = (name) =>
    rawPost({
      title: 'Swedish Institute Scholarship 2027',
      link: `https://${name}.test/si/`,
      contentText: 'Deadline: 1 March 2027\nStudy in: Sweden\nVietnam students welcome.',
    });
  const { service, store } = build([fakeSource('first', 1, [same('first')]), fakeSource('second', 2, [same('second')])]);
  const results = await service.run();
  assert.equal(store.state.inserted.length, 1);
  assert.equal(store.state.inserted[0].source, 'first');
  assert.equal(results[1].duplicateInRun, 1);
});

test('một nguồn lỗi không làm hỏng nguồn khác, và lỗi được ghi lại', async () => {
  const { service, store } = build([fakeSource('broken', 1, [], { fail: true }), fakeSource('ok', 2, [good(1)])]);
  const results = await service.run();
  assert.equal(results[0].error, 'nguồn sập');
  assert.equal(results[1].inserted, 1);
  assert.equal(store.state.runs.length, 2);
  assert.equal(store.state.runs[0].error, 'nguồn sập');
});

test('học bổng đã có từ cùng link được làm mới; trùng khoá với nguồn khác thì bỏ qua', async () => {
  const store = fakeStore([
    { id: 'id-1', source_url: 'https://example.org/alpha-1/', dedup_key: 'alpha-university-1-asian' },
    { id: 'id-9', source_url: 'https://other.test/x/', dedup_key: 'alpha-university-2-asian' },
  ]);
  const { service } = build([fakeSource('a', 1, [good(1), good(2), good(3)])], store);
  const [stats] = await service.run();
  assert.equal(store.state.updated.length, 1);
  assert.equal(store.state.updated[0].id, 'id-1');
  assert.equal(stats.skipped, 1);
  assert.equal(store.state.inserted.length, 1);
});

test('luật R4 chạy sau khi trích xuất và loại bài chỉ dành cho nhóm khác', async () => {
  const post = rawPost({ title: 'Euro Fellowship Programme Open Call', contentText: 'Deadline: 1 March 2027\nOpen to EU citizens only.' });
  const { service } = build([fakeSource('a', 1, [post])]);
  const [stats] = await service.run();
  assert.deepEqual(stats.rejected, { R4: 1 });
});

test('bộ trích xuất AI chỉ được gọi cho bài đã qua luật giai đoạn 1', async () => {
  const calls = [];
  const aiFill = async (raw, facts) => {
    calls.push(raw.title);
    return facts;
  };
  const store = fakeStore();
  const hiring = rawPost({ title: 'Hiring Marketing Manager Now Open', link: 'https://example.org/j/' });
  await runIngestion({ sources: [fakeSource('a', 1, [good(1), hiring])], store, aiFill, logger: silent, now: () => NOW });
  assert.equal(calls.length, 1);
});

test('Gemini: lỗi vĩnh viễn (model không còn) thì tắt AI, chỉ báo một lần', async () => {
  const warnings = [];
  let calls = 0;
  const model = { generateContent: async () => { calls++; throw new Error('[404 Not Found] This model is no longer available'); } };
  const extractor = createAiFill({ model, logger: { ...silent, warn: (m) => warnings.push(m) }, minIntervalMs: 0 });
  const facts = { country: null, degreeKnown: false, provider: null, deadline: null };
  for (let i = 0; i < 5; i++) await extractor(rawPost(), facts);
  assert.equal(calls, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /model không còn tồn tại/);
});

test('Gemini: chỉ điền chỗ trống, không ghi đè thứ đã có', async () => {
  const model = { generateContent: async () => ({ response: { text: () => '{"country":"Japan","degree":"PhD","provider":"Kyoto University","deadline":"2027-02-01"}' } }) };
  const extractor = createAiFill({ model, logger: silent, now: () => NOW, minIntervalMs: 0 });
  const filled = await extractor(rawPost(), { country: 'Germany', degree: 'Any', degreeKnown: false, provider: null, deadline: null });
  assert.equal(filled.country, 'Germany');
  assert.equal(filled.degree, 'PhD');
  assert.equal(filled.provider, 'Kyoto University');
  assert.equal(filled.deadline.toISOString().slice(0, 10), '2027-02-01');
});

test('Gemini: treo quá lâu thì bỏ bài đó, lỗi liên tiếp 3 lần thì tắt AI', async () => {
  let calls = 0;
  const model = { generateContent: () => { calls++; return new Promise(() => {}); } }; // không bao giờ trả về
  const extractor = createAiFill({ model, logger: silent, timeoutMs: 20, minIntervalMs: 0 });
  const facts = { country: null, degreeKnown: false, provider: null, deadline: null };
  for (let i = 0; i < 6; i++) assert.equal(await extractor(rawPost(), facts), facts);
  assert.equal(calls, 3);
});

test('Gemini: bị giới hạn theo phút thì nghỉ rồi gọi tiếp, không tắt hẳn', async () => {
  let t = 1000;
  let calls = 0;
  const model = {
    generateContent: async () => {
      calls++;
      if (calls === 1) throw new Error('[429 Too Many Requests] Quota exceeded for requests per minute');
      return { response: { text: () => '{"country":"Japan"}' } };
    },
  };
  const extractor = createAiFill({ model, logger: silent, minIntervalMs: 0, cooldownMs: 60000, clock: () => t });
  const facts = { country: null, degreeKnown: true, provider: 'X', deadline: new Date('2027-01-01') };
  await extractor(rawPost(), facts);                 // bị 429 → bắt đầu nghỉ
  assert.equal((await extractor(rawPost(), facts)).country, null);   // đang nghỉ: bỏ qua, không gọi
  assert.equal(calls, 1);
  t += 61000;                                              // hết nghỉ
  assert.equal((await extractor(rawPost(), facts)).country, 'Japan');
  assert.equal(calls, 2);
});

test('Gemini: hết hạn mức theo ngày thì tắt hẳn', async () => {
  let calls = 0;
  const model = { generateContent: async () => { calls++; throw new Error('429 Quota exceeded: GenerateRequestsPerDayPerProjectPerModel'); } };
  const extractor = createAiFill({ model, logger: silent, minIntervalMs: 0 });
  const facts = { country: null, degreeKnown: false, provider: null, deadline: null };
  for (let i = 0; i < 4; i++) await extractor(rawPost(), facts);
  assert.equal(calls, 1);
});

test('Gemini: các lệnh gọi liên tiếp bị giãn cách tối thiểu minIntervalMs', async () => {
  let t = 0;
  const waits = [];
  const model = { generateContent: async () => ({ response: { text: () => '{}' } }) };
  const extractor = createAiFill({
    model, logger: silent, minIntervalMs: 5000, clock: () => t,
    sleep: async (ms) => { waits.push(ms); t += ms; },
  });
  const facts = { country: null, degreeKnown: false, provider: null, deadline: null };
  await extractor(rawPost(), facts);
  await extractor(rawPost(), facts);
  assert.deepEqual(waits, [5000]);
});

test('Gemini: đọc được JSON dù có rào ```json hoặc chữ thừa phía sau', async () => {
  const replies = [
    '```json\n{"country":"Japan","degree":null}\n```',
    '{"country":"Japan"}\nNote: this is {an example} of extra text',
    'Đây là kết quả: {"country":"Japan","provider":"Kyoto {Univ}"} hết',
  ];
  for (const reply of replies) {
    const model = { generateContent: async () => ({ response: { text: () => reply } }) };
    const extractor = createAiFill({ model, logger: silent, minIntervalMs: 0 });
    const out = await extractor(rawPost(), { country: null, degreeKnown: true, provider: 'X', deadline: new Date('2027-01-01') });
    assert.equal(out.country, 'Japan', reply);
  }
});
