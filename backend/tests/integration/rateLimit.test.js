// Đặc tả rate limit ở chế độ production: mỗi route auth một bộ đếm; đăng nhập 5 lần sai / 15 phút / IP + email.
// Chạy riêng một tiến trình: NODE_ENV phải là production TRƯỚC khi nạp app.
process.env.NODE_ENV = 'production';

const { after, before, describe, it } = await import('node:test');
const { default: assert } = await import('node:assert/strict');
const { closeDb, createClient, startServer, stopServer, uniqueEmail } = await import('./helpers/app.js');

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await closeDb();
});

describe('Rate limit đăng nhập (production)', () => {
  it('lần sai thứ 6 trong 15 phút bị 429', async () => {
    const email = uniqueEmail('brute');
    const statuses = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await createClient().request('POST', '/api/auth/login', {
        body: { email, password: `wrong${i}` },
        headers: { origin: 'http://localhost:5173' },
      });
      statuses.push(res.status);
    }
    assert.equal(statuses.at(-1), 429, statuses.join(','));
  });

  it('đăng nhập sai nhiều lần không khóa đăng ký của người khác cùng IP', async () => {
    const res = await createClient().request('POST', '/api/auth/register', {
      body: { email: uniqueEmail('innocent'), password: 'Review#12345', full_name: 'Innocent' },
      headers: { origin: 'http://localhost:5173' },
    });
    assert.notEqual(res.status, 429, 'đăng ký bị chặn vì bộ đếm đăng nhập sai của người khác cùng IP');
  });

  it('đăng nhập sai 5 lần với một email không khóa email khác cùng IP', async () => {
    const res = await createClient().request('POST', '/api/auth/login', {
      body: { email: uniqueEmail('otherVictim'), password: 'wrong' },
      headers: { origin: 'http://localhost:5173' },
    });
    assert.equal(res.status, 401, `email khác bị khóa theo: ${res.status}`);
  });

  it('khóa theo email không lách được bằng chữ hoa / khoảng trắng', async () => {
    const email = uniqueEmail('caseBrute');
    const variants = [email, email.toUpperCase(), ` ${email}`, `${email} `, email.toUpperCase(), email];
    const statuses = [];
    for (const variant of variants) {
      const res = await createClient().request('POST', '/api/auth/login', {
        body: { email: variant, password: 'wrong' },
        headers: { origin: 'http://localhost:5173' },
      });
      statuses.push(res.status);
    }
    assert.equal(statuses.at(-1), 429, statuses.join(','));
  });
});

describe('Rate limit quên mật khẩu (production)', () => {
  it('một IP đổi email liên tục vẫn bị chặn sau 20 lần / giờ', async () => {
    const statuses = [];
    for (let i = 0; i < 21; i += 1) {
      const res = await createClient().request('POST', '/api/auth/forgotPassword', {
        body: { email: uniqueEmail('spray') },
        headers: { origin: 'http://localhost:5173' },
      });
      statuses.push(res.status);
    }
    assert.ok(statuses.slice(0, 20).every((status) => status !== 429), statuses.join(','));
    assert.equal(statuses.at(-1), 429, statuses.join(','));
  });
});
