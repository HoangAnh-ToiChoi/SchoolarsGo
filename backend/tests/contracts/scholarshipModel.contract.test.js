import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { mockSupabase, srcUrl } from './helpers/mockService.js';

const sqlCalls = [];
mock.module(srcUrl('configs/database.config.js'), {
  namedExports: {
    query: async (sql, params) => {
      sqlCalls.push({ sql, params });
      return { rows: [{ country: 'Australia' }, { country: 'Japan' }], rowCount: 2 };
    },
  },
});
const supabaseRef = mockSupabase();
const { default: scholarshipModel } = await import('~/models/scholarship.model.js');

// Supabase giả: ghi lại mọi lời gọi bộ lọc theo thứ tự
function recordingSupabase() {
  const calls = [];
  const builder = new Proxy({}, {
    get(_, method) {
      if (method === 'then') return (resolve) => resolve({ data: [], count: 0, error: null });
      return (...args) => {
        calls.push([method, ...args]);
        return builder;
      };
    },
  });
  supabaseRef.current = { from: () => builder };
  return calls;
}

const orFilters = (calls) => calls.filter(([method]) => method === 'or').map(([, filter]) => filter);

test('findCountries: DISTINCT ở DB qua pg, không bị PostgREST cắt 1000 dòng', async () => {
  const countries = await scholarshipModel.findCountries();
  assert.deepEqual(countries, ['Australia', 'Japan']);
  assert.match(sqlCalls.at(-1).sql, /SELECT DISTINCT country/);
});

test('tìm kiếm có dấu phẩy, ngoặc, nháy kép được bọc nháy để không vỡ cú pháp .or()', async () => {
  const calls = recordingSupabase();
  await scholarshipModel.findAll({ search: 'Harvard, MIT (USA) "x"\\' }, 10, 0);
  const search = orFilters(calls).find((f) => f.startsWith('title.ilike'));
  assert.equal(search, 'title.ilike."%Harvard, MIT (USA) \\"x\\"\\\\%",provider.ilike."%Harvard, MIT (USA) \\"x\\"\\\\%"');
});

test('lọc GPA / IELTS giữ học bổng không ghi yêu cầu (NULL)', async () => {
  const calls = recordingSupabase();
  await scholarshipModel.findAll({ min_gpa: 3.2, min_ielts: 6.5 }, 10, 0);
  const filters = orFilters(calls);
  assert.ok(filters.includes('min_gpa.is.null,min_gpa.lte.3.2'));
  assert.ok(filters.includes('min_ielts.is.null,min_ielts.lte.6.5'));
  assert.ok(!calls.some(([method, column]) => method === 'lte' && column === 'min_gpa'));
});
