'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { WordPressClient } = require('../../src/ingestion/shared/wordpressClient');
const { toRawPost, signalsFromCategories } = require('../../src/ingestion/shared/wordpressMapper');

const jsonResponse = (body, { status = 200, totalPages = 1 } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => (name.toLowerCase() === 'x-wp-totalpages' ? String(totalPages) : null) },
  json: async () => body,
});

const collect = async (iterable) => {
  const out = [];
  for await (const item of iterable) out.push(item);
  return out;
};

const noSleep = async () => {};
const makeClient = (fetchImpl) => new WordPressClient({ baseUrl: 'https://x.test', fetchImpl, sleepImpl: noSleep });

test('đi hết các trang và dừng đúng chỗ', async () => {
  const calls = [];
  const client = makeClient(async (url) => {
    calls.push(url);
    const page = Number(new URL(url).searchParams.get('page'));
    return jsonResponse([{ id: page * 10 }, { id: page * 10 + 1 }], { totalPages: 2 });
  });
  const posts = await collect(client.posts({ perPage: 2, maxPages: 5 }));
  assert.deepEqual(posts.map((p) => p.id), [10, 11, 20, 21]);
  assert.equal(calls.length, 2);
});

test('gửi đúng tham số: chuyên mục, từ khoá, mốc ngày', async () => {
  let seen;
  const client = makeClient(async (url) => {
    seen = new URL(url);
    return jsonResponse([]);
  });
  await collect(client.posts({ categories: [94, 55], search: 'vietnam', after: '2026-01-01T00:00:00' }));
  assert.equal(seen.pathname, '/wp-json/wp/v2/posts');
  assert.equal(seen.searchParams.get('categories'), '94,55');
  assert.equal(seen.searchParams.get('search'), 'vietnam');
  assert.equal(seen.searchParams.get('after'), '2026-01-01T00:00:00');
});

test('HTTP 400 ở trang sau nghĩa là hết trang, không phải lỗi', async () => {
  const client = makeClient(async (url) => {
    const page = Number(new URL(url).searchParams.get('page'));
    return page === 1 ? jsonResponse([{ id: 1 }], { totalPages: 9 }) : jsonResponse({}, { status: 400 });
  });
  const posts = await collect(client.posts({ perPage: 1, maxPages: 5 }));
  assert.equal(posts.length, 1);
});

test('HTTP 400 ở trang đầu là lỗi thật (tham số sai)', async () => {
  const client = makeClient(async () => jsonResponse({}, { status: 400 }));
  await assert.rejects(collect(client.posts()), /HTTP 400/);
});

test('tự thử lại khi bị 429, rồi thành công', async () => {
  let attempts = 0;
  const client = makeClient(async () => (++attempts < 3 ? jsonResponse({}, { status: 429 }) : jsonResponse([{ id: 7 }])));
  const posts = await collect(client.posts());
  assert.deepEqual(posts.map((p) => p.id), [7]);
  assert.equal(attempts, 3);
});

test('lỗi 404 không thử lại', async () => {
  let attempts = 0;
  const client = makeClient(async () => {
    attempts++;
    return jsonResponse({}, { status: 404 });
  });
  await assert.rejects(collect(client.posts()), /HTTP 404/);
  assert.equal(attempts, 1);
});

test('mapper: đổi bài WordPress sang RawPost, bỏ HTML, suy gợi ý từ chuyên mục', () => {
  const post = {
    id: 42,
    date_gmt: '2026-10-21T10:00:00',
    link: 'https://x.test/a/',
    title: { rendered: 'Chalmers &#8211; IPOET Scholarships' },
    excerpt: { rendered: '<p>Open to international students. [&hellip;]</p>' },
    content: { rendered: '<p>Deadline: <b>1 March 2027</b></p><p>Study in: Sweden</p>' },
    class_list: ['post-42', 'category-southeast-asians-scholarships', 'category-masters-scholarships', 'category-uk-scholarships'],
  };
  const raw = toRawPost(post, { name: 'src', priority: 2 });
  assert.equal(raw.title, 'Chalmers - IPOET Scholarships');
  assert.equal(raw.externalId, '42');
  assert.equal(raw.publishedAt.toISOString(), '2026-10-21T10:00:00.000Z');
  assert.match(raw.contentText, /Deadline: 1 March 2027\nStudy in: Sweden/);
  assert.deepEqual(raw.categories, ['southeast-asians-scholarships', 'masters-scholarships', 'uk-scholarships']);
  assert.ok(raw.signals.includes('region:southeastAsia'));
  assert.ok(raw.signals.includes('degree:Master'));
  assert.ok(raw.signals.includes('country:United Kingdom'));
});

test('suy gợi ý: East/South Asians không bị nhầm với Asians chung', () => {
  assert.deepEqual(signalsFromCategories(['east-asians-scholarships']), ['region:eastAsia']);
  assert.deepEqual(signalsFromCategories(['south-asians-scholarships']), ['region:southAsia']);
  assert.deepEqual(signalsFromCategories(['asians-scholarships']), ['region:asia']);
  assert.deepEqual(signalsFromCategories(['africans-scholarships']), ['region:africa']);
});

test('suy gợi ý: chỉ slug dạng "xxx-scholarships" mới cho biết nước, slug trần thì không', () => {
  assert.deepEqual(signalsFromCategories(['uk-scholarships']), ['country:United Kingdom']);
  assert.deepEqual(signalsFromCategories(['usa']), []);
});
