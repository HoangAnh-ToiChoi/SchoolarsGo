import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserFilters } from './buildUserFilters.js';

describe('buildUserFilters', () => {
  it('chỉ có trang và số dòng khi chưa lọc gì', () => {
    assert.deepEqual(buildUserFilters({ page: 1, search: '', role: '', status: '' }), { page: 1, limit: 20 });
  });

  it('thêm từ khóa, role, trạng thái khi có giá trị', () => {
    const filters = buildUserFilters({ page: 3, search: 'an', role: 'admin', status: 'inactive' });
    assert.deepEqual(filters, { page: 3, limit: 20, search: 'an', role: 'admin', status: 'inactive' });
  });
});
