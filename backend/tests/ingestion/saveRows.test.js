import test from 'node:test';
import assert from 'node:assert/strict';
import { saveRows } from '~/ingestion/save.js';

const NOW = new Date('2026-11-08T00:00:00Z');

/** Store giả: trả dòng đã có cố định, ghi lại dòng đưa vào từng nhánh. */
function fakeStore(existing) {
  const state = { inserted: [], updated: [], renewed: [], query: null };
  return {
    state,
    async findExisting(query) {
      state.query = query;
      return existing;
    },
    async insertMany(rows) {
      state.inserted.push(...rows);
      return rows.length;
    },
    async updateMany(rows) {
      state.updated.push(...rows);
      return rows.length;
    },
    async renewMany(rows) {
      state.renewed.push(...rows);
      return rows.length;
    },
  };
}

const row = (overrides) => ({ title: 'X', source_url: 'https://a.test/x/', dedup_key: 'x', deadline: new Date('2027-03-01'), is_active: true, ...overrides });

test('R08: học bổng admin đã ẩn / sửa (admin_locked_at) không bị làm mới theo link bài', async () => {
  const store = fakeStore([{ id: 'id-1', source_url: 'https://a.test/x/', dedup_key: 'x', deadline: null, admin_locked_at: new Date() }]);
  const stats = await saveRows(store, [row()], { now: NOW });
  assert.equal(store.state.updated.length, 0);
  assert.deepEqual(stats, { inserted: 0, updated: 0, skipped: 1 });
});

test('R09: kỳ năm sau (link mới, cùng khoá) làm mới dòng cũ đã quá hạn thay vì bị chặn', async () => {
  const store = fakeStore([{ id: 'old', source_url: 'https://a.test/x-2026/', dedup_key: 'x', deadline: new Date('2026-03-01'), admin_locked_at: null }]);
  const stats = await saveRows(store, [row({ source_url: 'https://a.test/x-2027/', title: 'X 2027' })], { now: NOW });
  assert.equal(store.state.renewed.length, 1);
  assert.equal(store.state.renewed[0].id, 'old');
  assert.equal(store.state.renewed[0].source_url, 'https://a.test/x-2027/');
  assert.equal(store.state.inserted.length, 0);
  assert.deepEqual(stats, { inserted: 0, updated: 1, skipped: 0 });
});

test('cùng khoá, dòng cũ còn hạn (trang khác đã đăng) → bỏ qua', async () => {
  const store = fakeStore([{ id: 'other', source_url: 'https://b.test/x/', dedup_key: 'x', deadline: new Date('2027-01-01'), admin_locked_at: null }]);
  const stats = await saveRows(store, [row()], { now: NOW });
  assert.equal(stats.skipped, 1);
  assert.equal(store.state.renewed.length + store.state.inserted.length, 0);
});

test('cùng khoá, dòng cũ quá hạn nhưng admin đã khóa → bỏ qua, không làm mới theo kỳ', async () => {
  const store = fakeStore([{ id: 'old', source_url: 'https://b.test/x/', dedup_key: 'x', deadline: new Date('2026-01-01'), admin_locked_at: new Date() }]);
  const stats = await saveRows(store, [row()], { now: NOW });
  assert.equal(stats.skipped, 1);
  assert.equal(store.state.renewed.length, 0);
});

test('hai bài cùng khoá trong một lô chỉ làm mới dòng cũ một lần', async () => {
  const store = fakeStore([{ id: 'old', source_url: 'https://b.test/x/', dedup_key: 'x', deadline: new Date('2026-01-01'), admin_locked_at: null }]);
  const stats = await saveRows(store, [row({ source_url: 'https://a.test/1/' }), row({ source_url: 'https://a.test/2/' })], { now: NOW });
  assert.equal(store.state.renewed.length, 1);
  assert.equal(store.state.renewed[0].source_url, 'https://a.test/1/');
  assert.equal(stats.skipped, 1);
});

test('khoá null không được tra theo khoá: chỉ chống trùng theo link', async () => {
  const store = fakeStore([]);
  await saveRows(store, [row({ dedup_key: null, source_url: 'https://a.test/1/' }), row({ dedup_key: null, source_url: 'https://a.test/2/' })], { now: NOW });
  assert.deepEqual(store.state.query.dedupKeys, []);
  assert.equal(store.state.inserted.length, 2);
});

test('dryRun đếm cả dòng làm mới theo kỳ, không ghi gì', async () => {
  const store = fakeStore([{ id: 'old', source_url: 'https://b.test/x/', dedup_key: 'x', deadline: new Date('2026-01-01'), admin_locked_at: null }]);
  const stats = await saveRows(store, [row(), row({ dedup_key: 'y', source_url: 'https://a.test/y/' })], { dryRun: true, now: NOW });
  assert.deepEqual(stats, { inserted: 1, updated: 1, skipped: 0 });
  assert.equal(store.state.renewed.length + store.state.inserted.length, 0);
});

test('admin khóa dòng giữa lúc đọc và lúc ghi: SQL không ghi, dòng đó tính vào "bỏ qua"', async () => {
  const store = fakeStore([{ id: 'id-1', source_url: 'https://a.test/x/', dedup_key: 'x', deadline: null, admin_locked_at: null }]);
  store.updateMany = async () => 0;
  const stats = await saveRows(store, [row()], { now: NOW });
  assert.deepEqual(stats, { inserted: 0, updated: 0, skipped: 1 });
});

test('hai dòng làm mới cùng tiêu đề trong một lô: dòng sau gửi title null (giữ tiêu đề cũ)', async () => {
  const store = fakeStore([
    { id: 'old-x', source_url: 'https://b.test/x/', dedup_key: 'x', deadline: new Date('2026-01-01'), admin_locked_at: null },
    { id: 'old-y', source_url: 'https://b.test/y/', dedup_key: 'y', deadline: new Date('2026-01-01'), admin_locked_at: null },
  ]);
  const rows = [row({ title: 'Same 2027', source_url: 'https://a.test/1/' }), row({ title: 'Same 2027', dedup_key: 'y', source_url: 'https://a.test/2/' })];
  await saveRows(store, rows, { now: NOW });
  assert.deepEqual(store.state.renewed.map((r) => r.title), ['Same 2027', null]);
});
