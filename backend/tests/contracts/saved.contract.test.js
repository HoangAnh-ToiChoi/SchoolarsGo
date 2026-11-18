import test from 'node:test';
import assert from 'node:assert/strict';

import { mockSupabase } from './helpers/mockService.js';

// Model gọi getSupabase() nên giả lập configs/supabase.js trước khi nạp model và service
const supabaseRef = mockSupabase();
const { default: savedModel } = await import('~/models/saved.model.js');
const { default: savedService } = await import('~/services/saved.service.js');

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

test('SavedModel.findAllByUser keeps saved record id separate from scholarship id', async () => {
  supabaseRef.current = fakeSupabase(ROWS);
  const [row] = await savedModel.findAllByUser('user-1');

  assert.equal(row.id, 'saved-1');
  assert.equal(row.scholarship_id, 'sch-1');
  assert.equal(row.note, 'apply soon');
  assert.equal(row.title, 'Fulbright');
});

test('SavedService.getAll returns saved id at top level and scholarship id nested', async () => {
  supabaseRef.current = fakeSupabase(ROWS);
  const [item] = await savedService.getAll('user-1');

  assert.equal(item.id, 'saved-1');
  assert.equal(item.scholarship.id, 'sch-1');
  assert.equal(item.scholarship.title, 'Fulbright');
});
