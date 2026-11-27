import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

// Giả lập model và nhắc hạn trước khi nạp service: không gọi DB thật
const modelRef = mockService(srcUrl('models/application.model.js'));
const notificationRef = mockService(srcUrl('services/notification.service.js'));
const { default: applicationService } = await import('~/services/application.service.js');

notificationRef.current = { async refreshUserReminders() {} };

const DOC_A = '11111111-1111-4111-8111-111111111111';
const DOC_B = '22222222-2222-4222-8222-222222222222';
const ROW = { id: 'a1', status: 'draft', checklist: [], scholarships: null };

// Model giả: `owned` là danh sách id tài liệu của người dùng; ghi lại id được hỏi
function fakeModel({ open = true, owned = [], existing = ROW } = {}) {
  const calls = { asked: null, created: false, updated: null };
  return {
    calls,
    async isScholarshipOpen() {
      return open;
    },
    async countOwnedDocuments(_userId, ids) {
      calls.asked = ids;
      return ids.filter((id) => owned.includes(id)).length;
    },
    async create() {
      calls.created = true;
      return ROW;
    },
    async findByIdAndUser() {
      return existing;
    },
    async updateByIdAndUser(_id, _userId, updates) {
      calls.updated = updates;
      return { ...ROW, ...updates };
    },
  };
}

test('create: học bổng đã tắt hoặc không có → 400 SCHOLARSHIP_CLOSED, không tạo đơn', async () => {
  const model = fakeModel({ open: false });
  modelRef.current = model;
  await assert.rejects(applicationService.create('u1', { scholarshipId: 's1' }), { statusCode: 400, errorCode: 'SCHOLARSHIP_CLOSED' });
  assert.equal(model.calls.created, false);
});

test('create: checklist trỏ tới tài liệu của người khác → 400 DOCUMENT_NOT_OWNED', async () => {
  const model = fakeModel({ owned: [DOC_A] });
  modelRef.current = model;
  const checklist = [{ item: 'CV', done: true, document_id: DOC_B }];
  await assert.rejects(applicationService.create('u1', { scholarshipId: 's1', checklist }), { errorCode: 'DOCUMENT_NOT_OWNED' });
  assert.equal(model.calls.created, false);
});

test('create: checklist không đính kèm tài liệu thì không hỏi DB về tài liệu', async () => {
  const model = fakeModel();
  modelRef.current = model;
  await applicationService.create('u1', { scholarshipId: 's1', checklist: [{ item: 'CV', done: false }] });
  assert.equal(model.calls.asked, null);
  assert.equal(model.calls.created, true);
});

test('update: documents_used có tài liệu của người khác → 400, không ghi', async () => {
  const model = fakeModel({ owned: [DOC_A] });
  modelRef.current = model;
  await assert.rejects(applicationService.update('u1', 'a1', { documents_used: [DOC_A, DOC_B] }), { errorCode: 'DOCUMENT_NOT_OWNED' });
  assert.equal(model.calls.updated, null);
});

test('update: tài liệu của chính mình (trùng giữa documents_used và checklist) được nhận', async () => {
  const model = fakeModel({ owned: [DOC_A] });
  modelRef.current = model;
  const updates = { documents_used: [DOC_A], checklist: [{ item: 'CV', done: true, document_id: DOC_A }] };
  await applicationService.update('u1', 'a1', updates);
  assert.deepEqual(model.calls.asked, [DOC_A]);
  assert.deepEqual(model.calls.updated.documents_used, [DOC_A]);
});

test('update: đơn không thuộc người dùng → 404', async () => {
  modelRef.current = fakeModel({ existing: null });
  await assert.rejects(applicationService.update('u2', 'a1', { notes: 'x' }), { statusCode: 404, errorCode: 'APPLICATION_NOT_FOUND' });
});
