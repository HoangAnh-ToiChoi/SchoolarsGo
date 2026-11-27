import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

const modelRef = mockService(srcUrl('models/admin.model.js'));
const sessionRef = mockService(srcUrl('services/session.service.js'));
const { default: adminService } = await import('~/services/admin.service.js');

sessionRef.current = { async endAllForUser() { return undefined; } };

function recordingModel(result) {
  const calls = [];
  modelRef.current = {
    async createScholarship(data) {
      calls.push(['create', data]);
      return result;
    },
    async updateScholarship(id, data) {
      calls.push(['update', id, data]);
      return result;
    },
  };
  return calls;
}

test('R25 tạo học bổng: hạn ISO 17:00Z (0h VN hôm sau) ghi thành ngày VN', async () => {
  const calls = recordingModel({ id: 's1' });
  await adminService.addScholarship({ title: 'A', deadline: '2026-12-01T17:00:00.000Z' });
  const [, data] = calls[0];
  assert.equal(data.deadline, '2026-12-02');
  assert.equal(data.is_active, true);
});

test('R25 sửa học bổng: hạn ISO đổi về ngày VN; hạn null và không gửi hạn giữ nguyên', async () => {
  const calls = recordingModel({ id: 's1' });
  await adminService.modifyScholarship('s1', { deadline: '2026-12-01T16:59:00.000Z' });
  await adminService.modifyScholarship('s1', { deadline: null });
  await adminService.modifyScholarship('s1', { title: 'B' });
  assert.equal(calls[0][2].deadline, '2026-12-01');
  assert.equal(calls[1][2].deadline, null);
  assert.equal('deadline' in calls[2][2], false);
});

test('sửa học bổng không tồn tại → 404', async () => {
  recordingModel(null);
  await assert.rejects(
    adminService.modifyScholarship('missing', { title: 'B' }),
    error => error.statusCode === 404,
  );
});
