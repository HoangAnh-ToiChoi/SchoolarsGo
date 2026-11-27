// Đặc tả xác thực: đăng ký / đăng nhập / đăng xuất / refresh / quên + đặt lại mật khẩu, cờ cookie.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { closeDb, createClient, registerUser, sql, startServer, stopServer, uniqueEmail } from './helpers/app.js';

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('Đăng ký / đăng nhập', () => {
  it('đăng ký đặt cookie httpOnly và không trả password_hash', async () => {
    const client = createClient();
    const res = await client.request('POST', '/api/auth/register', {
      body: { email: uniqueEmail('reg'), password: 'Review#12345', full_name: 'Reg User' },
    });
    assert.ok(res.status < 300, JSON.stringify(res.json));
    assert.ok(res.setCookies.length >= 2, 'thiếu cookie phiên');
    for (const c of res.setCookies) assert.match(c, /HttpOnly/i, c.split(';')[0].split('=')[0]);
    assert.doesNotMatch(JSON.stringify(res.json), /password_hash|refresh_token/);
  });

  it('email khác chữ hoa/thường là cùng một tài khoản', async () => {
    const email = uniqueEmail('case');
    const first = await createClient().request('POST', '/api/auth/register', {
      body: { email, password: 'Review#12345', full_name: 'Case One' },
    });
    assert.ok(first.status < 300);
    const second = await createClient().request('POST', '/api/auth/register', {
      body: { email: email.toUpperCase(), password: 'Review#12345', full_name: 'Case Two' },
    });
    assert.equal(second.status, 409, `tạo được tài khoản trùng: status ${second.status}`);
    const login = await createClient().request('POST', '/api/auth/login', {
      body: { email: ` ${email.toUpperCase()} `, password: 'Review#12345' },
    });
    assert.equal(login.status, 200, `đăng nhập bằng email chữ hoa: ${login.status}`);
  });

  it('sai mật khẩu và email không tồn tại trả cùng mã + thông báo', async () => {
    const u = await registerUser('enum');
    const wrongPass = await createClient().request('POST', '/api/auth/login', {
      body: { email: u.email, password: 'wrong-password' },
    });
    const noUser = await createClient().request('POST', '/api/auth/login', {
      body: { email: uniqueEmail('ghost'), password: 'wrong-password' },
    });
    assert.equal(wrongPass.status, noUser.status);
    assert.equal(wrongPass.json.message, noUser.json.message);
  });
});

describe('Đăng xuất và phiên', () => {
  // R14 (đánh đổi đã chấp nhận 28/11/2026): access token không kiểm DB nên còn dùng được tới khi hết hạn (tối đa 15 phút),
  // nhưng phiên đã thu hồi thì không refresh được: cookie bị đánh cắp hết tác dụng sau lần hết hạn kế tiếp
  it('sau đăng xuất: access token cũ còn tới khi hết hạn (R14), refresh bị từ chối', async () => {
    const u = await registerUser('logout');
    const stolen = createClient();
    for (const [k, v] of u.client.jar) stolen.jar.set(k, v);
    const out = await u.client.request('POST', '/api/auth/logout');
    assert.ok(out.status < 300);
    const stillValid = await stolen.request('GET', '/api/profile');
    assert.equal(stillValid.status, 200, 'R14: access token chưa hết hạn vẫn dùng được (đổi hành vi này thì sửa test + docs)');
    const refresh = await stolen.request('POST', '/api/auth/refresh');
    assert.equal(refresh.status, 401, 'phiên đã đăng xuất vẫn refresh được');
  });

  it('refresh xoay vòng trong cùng phiên, không sinh thêm phiên mới', async () => {
    const u = await registerUser('rotate');
    const before = await sql('SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL', [u.user.id]);
    const res = await u.client.request('POST', '/api/auth/refresh');
    assert.equal(res.status, 200, JSON.stringify(res.json));
    const afterRows = await sql('SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL', [u.user.id]);
    assert.equal(afterRows[0].n, before[0].n, 'refresh tạo thêm phiên thay vì xoay vòng');
  });
});

describe('Quên / đặt lại mật khẩu', () => {
  it('email có và không có trong hệ thống trả cùng phản hồi', async () => {
    const u = await registerUser('forgot');
    const known = await createClient().request('POST', '/api/auth/forgotPassword', { body: { email: u.email } });
    const unknown = await createClient().request('POST', '/api/auth/forgotPassword', { body: { email: uniqueEmail('nobody') } });
    assert.equal(known.status, unknown.status);
    assert.equal(known.json.message, unknown.json.message);
  });

  it('token lưu dạng băm, dùng một lần, và thu hồi các phiên cũ', async () => {
    const u = await registerUser('reset');
    await createClient().request('POST', '/api/auth/forgotPassword', { body: { email: u.email } });
    const [row] = await sql('SELECT reset_token, reset_token_expires FROM users WHERE email = $1', [u.email]);
    assert.ok(row.reset_token, 'không lưu token');
    // Không biết token thô (mail không gửi) → tự đặt token đã biết theo đúng cách băm SHA-256 của service
    const raw = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    await sql(`UPDATE users SET reset_token = $1, reset_token_expires = now() + interval '1 hour' WHERE email = $2`, [hashed, u.email]);

    const ok = await createClient().request('POST', '/api/auth/resetPassword', { body: { token: raw, password: 'NewPass#123' } });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    const again = await createClient().request('POST', '/api/auth/resetPassword', { body: { token: raw, password: 'Other#123' } });
    assert.equal(again.status, 400, 'token dùng lại được');
    const old = await u.client.request('POST', '/api/auth/refresh');
    assert.equal(old.status, 401, 'phiên cũ vẫn refresh được sau khi đặt lại mật khẩu');
  });
});
