import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

// Lưu học bổng / tạo đơn phải tạo nhắc hạn ngay (chuông không còn tự tạo mỗi lần mở)
const savedModelRef = mockService(srcUrl('models/saved.model.js'));
const applicationModelRef = mockService(srcUrl('models/application.model.js'));
const notificationRef = mockService(srcUrl('services/notification.service.js'));
const { default: savedService } = await import('~/services/saved.service.js');
const { default: applicationService } = await import('~/services/application.service.js');

function trackReminders() {
  const refreshed = [];
  notificationRef.current = { refreshUserReminders: async (userId) => { refreshed.push(userId); } };
  return refreshed;
}

test('lưu học bổng thành công → tạo nhắc hạn cho người đó', async () => {
  const refreshed = trackReminders();
  savedModelRef.current = {
    scholarshipExists: async () => true,
    create: async () => ({ id: 'sv1' }),
    getScholarshipDetails: async () => ({ id: 's1' }),
  };
  await savedService.save('u1', 's1');
  assert.deepEqual(refreshed, ['u1']);
});

test('lưu trùng → không tạo nhắc hạn', async () => {
  const refreshed = trackReminders();
  savedModelRef.current = {
    scholarshipExists: async () => true,
    create: async () => { throw new Error('SCHOLARSHIP_ALREADY_SAVED'); },
  };
  await assert.rejects(savedService.save('u1', 's1'), { code: 'SCHOLARSHIP_ALREADY_SAVED' });
  assert.deepEqual(refreshed, []);
});

test('tạo đơn thành công → tạo nhắc hạn cho người đó', async () => {
  const refreshed = trackReminders();
  applicationModelRef.current = {
    isScholarshipOpen: async () => true,
    create: async () => ({ id: 'a1', status: 'draft', checklist: [], scholarships: null }),
  };
  await applicationService.create('u2', { scholarshipId: 's1' });
  assert.deepEqual(refreshed, ['u2']);
});
