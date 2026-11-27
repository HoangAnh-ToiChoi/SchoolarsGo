import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

const modelRef = mockService(srcUrl('models/profile.model.js'));
const { default: profileService } = await import('~/services/profile.service.js');

// Model giả trả lại đúng dữ liệu được ghi
function captureUpsert() {
  const saved = {};
  modelRef.current = {
    async upsertProfile(_userId, updates) {
      Object.assign(saved, updates);
      return updates;
    },
  };
  return saved;
}

test('GPA thang 10 quy về thang 4 trước khi lưu', async () => {
  const saved = captureUpsert();
  await profileService.updateProfile('u1', { gpa: 8.5, gpa_scale: 10 });
  assert.deepEqual(saved, { gpa: 3.4, gpa_scale: '4.0' });
});

test('GPA thang 4 giữ nguyên giá trị', async () => {
  const saved = captureUpsert();
  await profileService.updateProfile('u1', { gpa: 3.6 });
  assert.equal(saved.gpa, 3.6);
});

test('GPA lớn hơn thang đã khai → 400, không ghi', async () => {
  const saved = captureUpsert();
  await assert.rejects(profileService.updateProfile('u1', { gpa: 8.5 }), { statusCode: 400, errorCode: 'INVALID_GPA' });
  assert.deepEqual(saved, {});
});

test('không gửi GPA thì không đụng tới gpa_scale', async () => {
  const saved = captureUpsert();
  await profileService.updateProfile('u1', { bio: 'xin chào' });
  assert.deepEqual(saved, { bio: 'xin chào' });
});
