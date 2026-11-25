import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';
import { vnToday, addDays, daysBetween, milestoneFor } from '~/utils/deadline.js';

const modelRef = mockService(srcUrl('models/notification.model.js'));
const { default: notificationService } = await import('~/services/notification.service.js');


// Repository giả: ghi lại các bản ghi được thêm để kiểm tra
const fakeRepo = ({ saved = [], drafts = [], rows = [] } = {}) => {
  const inserted = [];
  return {
    inserted,
    findSavedDueBetween: async () => saved,
    findDraftApplicationsDueBetween: async () => drafts,
    insertIgnoreDuplicates: async (items) => inserted.push(...items),
    findByUser: async () => rows,
    markRead: async (_userId, id) => id === 'n-1',
    markAllRead: async () => 2,
  };
};

const NOW = new Date('2026-11-10T03:00:00Z'); // 10:00 ngày 10/11 giờ Việt Nam

test('milestoneFor picks the nearest reminder at or after the days left', () => {
  assert.equal(milestoneFor(0), 1);
  assert.equal(milestoneFor(1), 1);
  assert.equal(milestoneFor(5), 7);
  assert.equal(milestoneFor(14), 14);
  assert.equal(milestoneFor(15), null);
  assert.equal(milestoneFor(-1), null);
});

test('vnToday uses Vietnam time, not UTC', () => {
  // 18:00 UTC ngày 10/11 = 01:00 ngày 11/11 ở Việt Nam
  assert.equal(vnToday(new Date('2026-11-10T18:00:00Z')), '2026-11-11');
  assert.equal(daysBetween('2026-11-10', '2026-11-15T00:00:00'), 5);
});

test('generateDeadlineReminders prefers the draft application over the saved entry', async () => {
  const repo = fakeRepo({
    saved: [
      { user_id: 'u1', scholarship_id: 's1', application_id: null, deadline: '2026-11-15T00:00:00' },
      { user_id: 'u1', scholarship_id: 's2', application_id: null, deadline: '2026-11-19T00:00:00' },
    ],
    drafts: [{ user_id: 'u1', scholarship_id: 's1', application_id: 'a1', deadline: '2026-11-15T00:00:00' }],
  });
  modelRef.current = repo;
  await notificationService.generateDeadlineReminders({ now: NOW });

  assert.deepEqual(
    repo.inserted.map((r) => [r.scholarship_id, r.application_id, r.milestone]).sort(),
    [['s1', 'a1', 7], ['s2', null, 14]]
  );
  assert.ok(repo.inserted.every((r) => r.type === 'deadline'));
});

test('getAll keeps one notification per scholarship, drops expired deadlines and submitted applications', async () => {
  // Tính theo ngày giờ VN như service: dùng giờ UTC thì 0h–7h sáng VN ra 4 ngày và test fail
  const future = `${addDays(vnToday(), 5)}T00:00:00`;
  const scholarship = { id: 's1', slug: 'a', title: 'A', provider: 'P', deadline: future };
  const repo = fakeRepo({
    rows: [
      { id: 'n-2', type: 'deadline', milestone: 7, read_at: null, created_at: '2', scholarships: scholarship },
      { id: 'n-1', type: 'deadline', milestone: 14, read_at: '2026-11-01', created_at: '1', scholarships: scholarship },
      { id: 'n-3', type: 'deadline', milestone: 1, read_at: null, created_at: '0', scholarships: { ...scholarship, id: 's9', deadline: '2020-01-01T00:00:00' } },
      { id: 'n-4', type: 'deadline', milestone: 7, read_at: null, created_at: '0', applications: { status: 'submitted' }, scholarships: { ...scholarship, id: 's8' } },
    ],
  });
  modelRef.current = repo;
  const { data, unread } = await notificationService.getAll('u1');

  assert.deepEqual(data.map((n) => n.id), ['n-2']);
  assert.equal(data[0].days_left, 5);
  assert.equal(data[0].scholarship.slug, 'a');
  assert.equal(unread, 1);
});

test('markRead returns 404 for a notification the user does not own', async () => {
  modelRef.current = fakeRepo();
  await assert.doesNotReject(notificationService.markRead('u1', 'n-1'));
  await assert.rejects(notificationService.markRead('u1', 'other'), (err) => err.statusCode === 404);
});

test('getAll chỉ tạo nhắc hạn một lần mỗi ngày cho mỗi người (mở chuông nhiều lần không ghi DB lại)', async () => {
  let generated = 0;
  modelRef.current = { ...fakeRepo(), findSavedDueBetween: async () => { generated += 1; return []; } };
  await notificationService.getAll('once-per-day-user');
  await notificationService.getAll('once-per-day-user');
  await notificationService.getAll('another-user');
  assert.equal(generated, 2);
});

test('getAll bỏ nhắc hạn của học bổng admin đã tắt', async () => {
  const future = '2099-01-01T00:00:00';
  modelRef.current = fakeRepo({
    rows: [
      { id: 'n1', type: 'deadline', scholarships: { id: 's1', deadline: future, is_active: false } },
      { id: 'n2', type: 'deadline', scholarships: { id: 's2', deadline: future, is_active: true } },
    ],
  });
  const { data } = await notificationService.getAll('inactive-filter-user');
  assert.deepEqual(data.map((n) => n.id), ['n2']);
});

test('refreshUserReminders: lỗi DB chỉ ghi log, không ném', async () => {
  modelRef.current = { ...fakeRepo(), findSavedDueBetween: async () => { throw new Error('db down'); } };
  const warn = console.warn;
  console.warn = () => {};
  try {
    await assert.doesNotReject(notificationService.refreshUserReminders('u1'));
  } finally {
    console.warn = warn;
  }
});

test('getChannel trả kênh realtime ngẫu nhiên của chính người dùng', async () => {
  const asked = [];
  modelRef.current = { ...fakeRepo(), findRealtimeTopic: async (userId) => { asked.push(userId); return 'a1b2'; } };
  assert.deepEqual(await notificationService.getChannel('u1'), { topic: 'user:a1b2' });
  assert.deepEqual(asked, ['u1']);
});

test('getChannel: chưa có kênh (DB chưa chạy migration 010) → 404, chuông vẫn dùng cách tự làm mới', async () => {
  modelRef.current = { ...fakeRepo(), findRealtimeTopic: async () => null };
  await assert.rejects(notificationService.getChannel('u1'), { code: 'NOTIFICATION_CHANNEL_NOT_FOUND', statusCode: 404 });
});
