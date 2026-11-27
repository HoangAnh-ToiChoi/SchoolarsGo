// Đặc tả upload tài liệu: kiểm nội dung thật, giới hạn kích thước, tên file độc, bucket private, xóa phải xóa cả file trên Storage.
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
// PNG 1x1 hợp lệ (chữ ký 8 byte + IHDR) để file-type nhận ra image/png
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

describe('Upload tài liệu', () => {
  it('file .pdf hợp lệ được nhận', async () => {
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'cv.pdf', PDF, 'application/pdf') });
    assert.equal(res.status, 201, JSON.stringify(res.json));
  });

  it('file HTML đổi đuôi .pdf bị từ chối (kiểm byte đầu, không tin đuôi)', async () => {
    const html = '<html><body><script>alert(document.domain)</script></body></html>';
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('other', 'invoice.pdf', html, 'text/html') });
    assert.equal(res.status, 400, `nhận file HTML giả PDF: status ${res.status}, mime lưu = ${res.json?.data?.mime_type}`);
  });

  it('mime_type lưu theo nội dung, không theo Content-Type client gửi', async () => {
    const res = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'x.pdf', PDF, 'text/html') });
    assert.equal(res.status, 201, JSON.stringify(res.json));
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

  it('xóa tài liệu thì file trên Storage cũng bị xóa', async () => {
    const up = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'delete-me.pdf', PDF, 'application/pdf') });
    assert.equal(up.status, 201, JSON.stringify(up.json));
    const [obj] = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 ORDER BY created_at DESC LIMIT 1', ['documents']);
    const del = await U.client.request('DELETE', `/api/documents/${up.json.data.id}`);
    assert.ok(del.status < 300, `xóa: ${del.status}`);
    const left = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2', ['documents', obj.name]);
    assert.equal(left.length, 0, `file còn trên Storage sau khi xóa: ${obj.name}`);
    const link = await fetch(up.json.data.file_url);
    assert.notEqual(link.status, 200, 'link ký vẫn tải được file đã xóa');
  });

  it('file PNG thật được nhận cho loại "other" nhưng không cho "transcript"', async () => {
    const other = await U.client.request('POST', '/api/documents/upload', { form: formWith('other', 'scan.png', PNG, 'image/png') });
    assert.equal(other.status, 201, JSON.stringify(other.json));
    assert.equal(other.json.data.mime_type, 'image/png');
    const transcript = await U.client.request('POST', '/api/documents/upload', { form: formWith('transcript', 'scan.pdf', PNG, 'application/pdf') });
    assert.equal(transcript.status, 400, JSON.stringify(transcript.json));
  });
});

describe('Bucket tài liệu private', () => {
  it('file không tải được qua URL công khai, chỉ qua link ký trong danh sách', async () => {
    const up = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'private.pdf', PDF, 'application/pdf') });
    assert.equal(up.status, 201, JSON.stringify(up.json));
    const [row] = await sql('SELECT storage_path, file_url FROM documents WHERE id = $1', [up.json.data.id]);
    assert.ok(row.storage_path.startsWith(`${U.user.id}/cv/`), row.storage_path);
    assert.equal(row.file_url, null, 'không lưu URL công khai nữa');

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${row.storage_path}`;
    const pub = await fetch(publicUrl);
    assert.notEqual(pub.status, 200, 'bucket còn public: tải được file không cần link ký');

    const list = await U.client.request('GET', '/api/documents');
    assert.equal(list.status, 200, JSON.stringify(list.json));
    const item = list.json.data.find((d) => d.id === up.json.data.id);
    assert.ok(item?.file_url, 'danh sách thiếu link tải');
    assert.equal(item.storage_path, undefined, 'không trả đường dẫn nội bộ ra client');
    const signed = await fetch(item.file_url);
    assert.equal(signed.status, 200, `link ký không tải được: ${signed.status}`);
    assert.equal(signed.headers.get('content-type'), 'application/pdf');
  });

  it('bản ghi cũ chỉ có URL công khai vẫn có link tải và xóa được file', async () => {
    const up = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'legacy.pdf', PDF, 'application/pdf') });
    const [row] = await sql('SELECT storage_path FROM documents WHERE id = $1', [up.json.data.id]);
    const legacyUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${row.storage_path}`;
    await sql('UPDATE documents SET storage_path = NULL, file_url = $1 WHERE id = $2', [legacyUrl, up.json.data.id]);

    const list = await U.client.request('GET', '/api/documents');
    const item = list.json.data.find((d) => d.id === up.json.data.id);
    assert.ok(item?.file_url?.includes('/object/sign/'), `bản ghi cũ không có link ký: ${item?.file_url}`);

    const del = await U.client.request('DELETE', `/api/documents/${up.json.data.id}`);
    assert.ok(del.status < 300, `xóa: ${del.status}`);
    const left = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2', ['documents', row.storage_path]);
    assert.equal(left.length, 0, 'file của bản ghi cũ còn trên Storage');
  });

  it('người khác không xóa được tài liệu (404) và file vẫn còn', async () => {
    const up = await U.client.request('POST', '/api/documents/upload', { form: formWith('cv', 'mine.pdf', PDF, 'application/pdf') });
    const [row] = await sql('SELECT storage_path FROM documents WHERE id = $1', [up.json.data.id]);
    const other = await registerUser('uploadOther');
    const del = await other.client.request('DELETE', `/api/documents/${up.json.data.id}`);
    assert.equal(del.status, 404);
    const left = await sql('SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2', ['documents', row.storage_path]);
    assert.equal(left.length, 1);
  });
});
