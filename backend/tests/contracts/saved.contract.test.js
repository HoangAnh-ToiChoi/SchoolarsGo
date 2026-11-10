const test = require('node:test');
const assert = require('node:assert/strict');

const SavedRepository = require('../../src/repositories/saved.repository');
const SavedService = require('../../src/services/saved.service');

// Giả lập chuỗi truy vấn Supabase: from().select().eq().order() trả về rows cố định
const fakeSupabase = (rows) => {
  const query = {
    select: () => query,
    eq: () => query,
    order: async () => ({ data: rows, error: null }),
  };
  return { from: () => query };
};

const ROWS = [
  {
    id: 'saved-1',
    note: 'apply soon',
    created_at: '2026-11-01T00:00:00Z',
    scholarships: { id: 'sch-1', title: 'Fulbright', provider: 'US Gov', country: 'US', deadline: '2027-01-01' },
  },
];

test('SavedRepository.findAllByUser keeps saved record id separate from scholarship id', async () => {
  const repo = new SavedRepository(fakeSupabase(ROWS));
  const [row] = await repo.findAllByUser('user-1');

  assert.equal(row.id, 'saved-1');
  assert.equal(row.scholarship_id, 'sch-1');
  assert.equal(row.note, 'apply soon');
  assert.equal(row.title, 'Fulbright');
});

test('SavedService.getAll returns saved id at top level and scholarship id nested', async () => {
  const service = new SavedService(new SavedRepository(fakeSupabase(ROWS)));
  const [item] = await service.getAll('user-1');

  assert.equal(item.id, 'saved-1');
  assert.equal(item.scholarship.id, 'sch-1');
  assert.equal(item.scholarship.title, 'Fulbright');
});
