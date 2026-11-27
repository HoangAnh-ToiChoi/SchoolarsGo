// Đặc tả upload tài liệu: kiểm nội dung thật, giới hạn kích thước, tên file độc, xóa phải xóa cả file trên Storage.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { closeDb, registerUser, sql, startServer, stopServer } from './helpers/app.js';

let U;

before(async () => {
  await startServer();
  U = await registerUser('upload');
});

after(async () => {
  await stopServer();
  await closeDb();
});

function formWith(type, name, content, mime) {
  const form = new FormData();
  form.append('type', type);
  form.append('file', new Blob([content], { type: mime }), name);
  return form;
}

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

describe('Upload tài liệu', () => {
  it('file .pdf hợp lệ được nhận', async () => {
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'cv.pdf', PDF, 'application/pdf') });
    assert.equal(res.status, 201, JSON.stringify(res.json));
  });

  it('file HTML đổi đuôi .pdf bị từ chối (kiểm byte đầu, không tin đuôi)', { todo: 'R07 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const html = '<html><body><script>alert(document.domain)</script></body></html>';
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('other', 'invoice.pdf', html, 'text/html') });
    assert.equal(res.status, 400, `nhận file HTML giả PDF: status ${res.status}, mime lưu = ${res.json?.data?.mime_type}`);
  });

  it('mime_type lưu theo nội dung, không theo Content-Type client gửi', { todo: 'R07 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'x.pdf', PDF, 'text/html') });
    if (res.status !== 201) return;
    assert.equal(res.json.data.mime_type, 'application/pdf', `lưu mime client: ${res.json.data.mime_type}`);
  });

  it('file > 10MB bị từ chối bằng 400/413', async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024 + 10)]);
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'big.pdf', big, 'application/pdf') });
    assert.ok([400, 413].includes(res.status), `status ${res.status}`);
  });

  it('tên file có ../ không thoát khỏi thư mục của user trên Storage', async () => {
    const res = await U.client.request('POST', '/api/documents/upload', {
      form: formWith('cv', '../../../otherUser/cv.pdf', PDF, 'application/pdf'),
    });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    const objects = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 ORDER BY created_at DESC LIMIT 1', ['documents']);
    assert.ok(objects[0].name.startsWith(`${U.user.id}/`), objects[0].name);
    assert.doesNotMatch(objects[0].name, /\.\./);
  });

  it('xóa tài liệu thì file trên Storage cũng bị xóa', { todo: 'R06 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const up = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'delete-me.pdf', PDF, 'application/pdf') });
    assert.equal(up.status, 201, JSON.stringify(up.json));
    const [obj] = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 ORDER BY created_at DESC LIMIT 1', ['documents']);
    const del = await U.client.request('DELETE', `/api/documents/${up.json.data.id}`);
    assert.ok(del.status < 300, `xóa: ${del.status}`);
    const left = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2', ['documents', obj.name]);
    assert.equal(left.length, 0, `file còn trên Storage sau khi xóa: ${obj.name}`);
    const pub = await fetch(up.json.data.file_url);
    assert.notEqual(pub.status, 200, 'URL công khai vẫn tải được file đã xóa');
  });
});
