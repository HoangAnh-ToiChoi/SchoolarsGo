import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPosts } from '~/ingestion/wordpress.js';
import { runIngestion } from '~/ingestion/index.js';
import { createStore } from '~/ingestion/save.js';
import { NOW } from './helpers.js';

const silent = { info() {}, warn() {}, error() {} };

const SOURCE = { name: 'src', priority: 1, baseUrl: 'https://x.test', maxAgeDays: 30, maxPages: 3, delayMs: 0, queries: [{ search: 'vietnam' }] };

function wpPost(id, modifiedGmt) {
  return { id, date_gmt: '2026-11-01T00:00:00', modified_gmt: modifiedGmt, link: `https://x.test/${id}/`, title: { rendered: `Post ${id}` } };
}

function fakeFetch(posts) {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(new URL(url));
    return { ok: true, status: 200, headers: { get: () => '1' }, json: async () => posts };
  };
  return { urls, fetchImpl };
}

const collect = async (iterable) => {
  const out = [];
  for await (const item of iterable) out.push(item);
  return out;
};

test('lượt tăng dần: sắp theo ngày sửa, gửi modified_after lùi 1 ngày, dừng ở bài cũ hơn mốc', async () => {
  const since = new Date('2026-11-07T10:00:00Z');
  const { urls, fetchImpl } = fakeFetch([
    wpPost(3, '2026-11-07T12:00:00'),
    wpPost(2, '2026-11-07T10:30:00'),
    wpPost(1, '2026-11-07T09:00:00'), // cũ hơn mốc: đã xử lý ở lượt trước
    wpPost(0, '2026-11-07T11:00:00'), // sau bài cũ thì không đọc tiếp
  ]);
  const posts = await collect(fetchPosts(SOURCE, { fetchImpl, now: () => NOW, modifiedAfter: since }));

  assert.deepEqual(posts.map((p) => p.externalId), ['3', '2']);
  assert.equal(urls[0].searchParams.get('orderby'), 'modified');
  assert.equal(urls[0].searchParams.get('modified_after'), '2026-11-06T10:00:00');
  assert.equal(posts[0].modifiedAt.toISOString(), '2026-11-07T12:00:00.000Z');
});

test('lượt đầy đủ giữ nguyên: sắp theo ngày đăng, không gửi modified_after', async () => {
  const { urls, fetchImpl } = fakeFetch([wpPost(1, '2026-01-01T00:00:00')]);
  const posts = await collect(fetchPosts(SOURCE, { fetchImpl, now: () => NOW }));
  assert.equal(posts.length, 1);
  assert.equal(urls[0].searchParams.get('orderby'), 'date');
  assert.equal(urls[0].searchParams.has('modified_after'), false);
});

function recordingSource(name) {
  const calls = [];
  return {
    calls,
    source: {
      name,
      priority: 1,
      async *fetchPosts(options) {
        calls.push(options);
      },
    },
  };
}

function storeWithLastRun(lastRunBySource) {
  return {
    findLastSuccessfulRunAt: async (source) => lastRunBySource[source] ?? null,
    findExisting: async () => [],
    insertMany: async () => 0,
    updateMany: async () => 0,
    renewMany: async () => 0,
    recordRun: async () => {},
  };
}

test('runIngestion tăng dần: mỗi nguồn lấy mốc riêng; nguồn chưa từng chạy thành công thì chạy đầy đủ', async () => {
  const lastRun = new Date('2026-11-07T10:00:00Z');
  const a = recordingSource('a');
  const b = recordingSource('b');
  const results = await runIngestion(
    { sources: [a.source, b.source], store: storeWithLastRun({ a: lastRun }), logger: silent, now: () => NOW },
    { incremental: true }
  );
  assert.equal(a.calls[0].modifiedAfter, lastRun);
  assert.equal(b.calls[0].modifiedAfter, null);
  assert.equal(results[0].modifiedAfter, lastRun);
});

test('runIngestion mặc định (đầy đủ) không đọc mốc', async () => {
  const a = recordingSource('a');
  const store = { ...storeWithLastRun({}), findLastSuccessfulRunAt: async () => assert.fail('không được gọi') };
  await runIngestion({ sources: [a.source], store, logger: silent, now: () => NOW });
  assert.equal(a.calls[0].modifiedAfter, null);
});

test('store: mốc lấy lượt thành công, không chạy thử; ghi nhật ký bằng giờ UTC', async () => {
  const queries = [];
  const db = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      return { rows: [{ last_run_at: new Date('2026-11-07T10:00:00Z') }], rowCount: 1 };
    },
  };
  const store = createStore(db);
  const last = await store.findLastSuccessfulRunAt('src');
  assert.equal(last.toISOString(), '2026-11-07T10:00:00.000Z');
  assert.match(queries[0].sql, /dry_run = false AND error IS NULL/);
  assert.deepEqual(queries[0].params, ['src']);

  await store.recordRun({ source: 'src', dryRun: false, startedAt: new Date('2026-11-07T10:00:00Z'), finishedAt: null, fetched: 0, rejected: {}, inserted: 0, updated: 0, skipped: 0 });
  assert.equal(queries[1].params[2], '2026-11-07T10:00:00.000Z');
  assert.equal(queries[1].params[3], null);
});
