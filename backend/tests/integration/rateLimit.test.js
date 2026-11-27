// Đặc tả rate limit ở chế độ production (5 lần / 15 phút / IP cho nhóm auth).
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

  it('bộ đếm dùng chung cho register/forgot: người khác cùng IP bị khóa đăng ký', { todo: 'R15 — lỗi đã biết, gỡ todo khi sửa' }, async () => {
    const res = await createClient().request('POST', '/api/auth/register', {
      body: { email: uniqueEmail('innocent'), password: 'Review#12345', full_name: 'Innocent' },
      headers: { origin: 'http://localhost:5173' },
    });
    assert.notEqual(res.status, 429, 'đăng ký bị chặn vì bộ đếm đăng nhập sai của người khác cùng IP');
  });
});
