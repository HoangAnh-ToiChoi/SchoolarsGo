import test from 'node:test';
import assert from 'node:assert/strict';

import { mockService, srcUrl } from './helpers/mockService.js';

// Giả lập 2 model trước khi nạp service: không gọi DB hay Storage thật
const modelRef = mockService(srcUrl('models/document.model.js'));
const storageRef = mockService(srcUrl('models/documentStorage.model.js'));
const { default: documentService } = await import('~/services/document.service.js');

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const HTML = Buffer.from('<html><body><script>alert(1)</script></body></html>');
const LEGACY_URL = 'https://abc.supabase.co/storage/v1/object/public/documents/user-1/cv/old_1234abcd.pdf';

function fileOf(buffer, originalname = 'Bảng điểm (1).pdf', mimetype = 'application/pdf') {
  return { buffer, originalname, mimetype, size: buffer.length };
}

// Storage giả ghi lại lời gọi; link ký = "signed:<đường dẫn>"
function fakeStorage(calls = {}) {
  return {
    async upload(path, _buffer, contentType) {
      calls.upload = { path, contentType };
      return path;
    },
    async remove(path) {
      calls.removed = [...(calls.removed || []), path];
    },
    async createSignedUrls(paths) {
      calls.signed = paths;
      return new Map(paths.map((p) => [p, `signed:${p}`]));
    },
  };
}

test('upload lưu loại nội dung đọc từ byte đầu, không theo MIME client gửi, và trả link ký', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = {
    async insertDocument(input) {
      calls.insert = input;
      return { id: 'doc-1', type: 'cv', file_name: input.fileName, mime_type: input.mimeType, storage_path: input.storagePath, file_url: null };
    },
  };

  const doc = await documentService.upload('user-1', 'cv', fileOf(PDF, 'Bảng điểm (1).pdf', 'text/html'));

  assert.equal(calls.insert.mimeType, 'application/pdf');
  assert.equal(calls.upload.contentType, 'application/pdf');
  assert.match(calls.upload.path, /^user-1\/cv\/Bang-diem-1_[0-9a-f]{8}\.pdf$/);
  assert.equal(doc.file_url, `signed:${calls.upload.path}`);
  assert.equal(doc.storage_path, undefined);
});

test('upload từ chối HTML đổi đuôi .pdf và không đưa gì lên Storage', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = {};

  await assert.rejects(documentService.upload('user-1', 'other', fileOf(HTML, 'invoice.pdf')), { errorCode: 'UPLOAD_INVALID', statusCode: 400 });
  assert.equal(calls.upload, undefined);
});

test('upload từ chối loại tài liệu sai và thiếu file', async () => {
  storageRef.current = fakeStorage();
  await assert.rejects(documentService.upload('user-1', 'passport', fileOf(PDF)), { errorCode: 'INVALID_DOC_TYPE' });
  await assert.rejects(documentService.upload('user-1', 'cv', undefined), { errorCode: 'NO_FILE' });
});

test('tên file chứa ../ không thoát khỏi thư mục của người dùng', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = { async insertDocument(input) { return { id: 'd', storage_path: input.storagePath }; } };

  await documentService.upload('user-1', 'cv', fileOf(PDF, '../../other/../cv.pdf'));
  assert.match(calls.upload.path, /^user-1\/cv\/[A-Za-z0-9-]+_[0-9a-f]{8}\.pdf$/);
});

test('lưu DB lỗi thì gỡ file vừa đưa lên Storage', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = { async insertDocument() { throw new Error('db down'); } };

  await assert.rejects(documentService.upload('user-1', 'cv', fileOf(PDF)), { errorCode: 'DB_INSERT_FAILED' });
  assert.deepEqual(calls.removed, [calls.upload.path]);
});

test('getAll ký link cho cả bản ghi mới (storage_path) và bản ghi cũ (URL công khai)', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = {
    async findAllByUserId() {
      return [
        { id: 'new', storage_path: 'user-1/cv/new_aaaaaaaa.pdf', file_url: null },
        { id: 'old', storage_path: null, file_url: LEGACY_URL },
        { id: 'broken', storage_path: null, file_url: 'http://x/documents/a.pdf' },
      ];
    },
  };

  const docs = await documentService.getAll('user-1');

  assert.deepEqual(calls.signed, ['user-1/cv/new_aaaaaaaa.pdf', 'user-1/cv/old_1234abcd.pdf']);
  assert.equal(docs[0].file_url, 'signed:user-1/cv/new_aaaaaaaa.pdf');
  assert.equal(docs[1].file_url, 'signed:user-1/cv/old_1234abcd.pdf');
  assert.equal(docs[2].file_url, null);
});

test('getAll không gọi Storage khi chưa có tài liệu', async () => {
  const calls = {};
  storageRef.current = fakeStorage(calls);
  modelRef.current = { async findAllByUserId() { return []; } };

  assert.deepEqual(await documentService.getAll('user-1'), []);
  assert.equal(calls.signed, undefined);
});

test('remove xóa file theo đường dẫn trong bucket (không kèm tên bucket) rồi mới xóa bản ghi', async () => {
  const calls = { order: [] };
  storageRef.current = {
    async remove(path) {
      calls.order.push(`storage:${path}`);
    },
  };
  modelRef.current = {
    async findByIdAndUserId() {
      return { id: 'old', storage_path: null, file_url: LEGACY_URL };
    },
    async deleteByIdAndUserId(id) {
      calls.order.push(`db:${id}`);
    },
  };

  await documentService.remove('user-1', 'old');
  assert.deepEqual(calls.order, ['storage:user-1/cv/old_1234abcd.pdf', 'db:old']);
});

test('remove: Storage lỗi thì giữ bản ghi để xóa lại được', async () => {
  let dbDeleted = false;
  storageRef.current = { async remove() { throw new Error('storage down'); } };
  modelRef.current = {
    async findByIdAndUserId() { return { id: 'd', storage_path: 'user-1/cv/x.pdf' }; },
    async deleteByIdAndUserId() { dbDeleted = true; },
  };

  await assert.rejects(documentService.remove('user-1', 'd'), /storage down/);
  assert.equal(dbDeleted, false);
});

test('remove tài liệu không thuộc người dùng → 404', async () => {
  modelRef.current = { async findByIdAndUserId() { return null; } };
  await assert.rejects(documentService.remove('user-2', 'doc-1'), { statusCode: 404, errorCode: 'DOCUMENT_NOT_FOUND' });
});
