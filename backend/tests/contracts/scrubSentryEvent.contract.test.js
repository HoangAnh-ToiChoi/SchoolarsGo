import test from 'node:test';
import assert from 'node:assert/strict';

import { scrubSentryEvent } from '~/utils/scrubSentryEvent.js';

const MASK = '[ẩn]';

test('bỏ cookie, che header đăng nhập, giữ header thường', () => {
  const event = scrubSentryEvent({
    request: {
      cookies: { accessToken: 'jwt' },
      headers: { Cookie: 'accessToken=jwt', authorization: 'Bearer x', 'user-agent': 'UA' },
    },
  });
  assert.equal(event.request.cookies, undefined);
  assert.deepEqual(event.request.headers, { Cookie: MASK, authorization: MASK, 'user-agent': 'UA' });
});

test('body JSON: che mật khẩu, token lồng sâu; giữ trường thường', () => {
  const body = JSON.stringify({ email: 'a@b.c', password: 'p', profile: { refresh_token: 't', gpa: 3 } });
  const event = scrubSentryEvent({ request: { data: body } });
  assert.deepEqual(JSON.parse(event.request.data), { email: 'a@b.c', password: MASK, profile: { refresh_token: MASK, gpa: 3 } });
});

test('body không phải JSON thì che cả; body object cũng được che', () => {
  assert.equal(scrubSentryEvent({ request: { data: 'password=p&x=1' } }).request.data, MASK);
  assert.deepEqual(scrubSentryEvent({ request: { data: { newPassword: 'p', ok: 1 } } }).request.data, { newPassword: MASK, ok: 1 });
});

test('token trong URL và query string bị che', () => {
  const event = scrubSentryEvent({
    request: { url: 'https://api.x/api/auth/resetPassword?token=abc&lang=vi', query_string: 'token=abc&lang=vi' },
  });
  assert.equal(event.request.url, `https://api.x/api/auth/resetPassword?token=${MASK}&lang=vi`);
  assert.equal(event.request.query_string, `token=${MASK}&lang=vi`);
});

test('sự kiện không có request thì giữ nguyên', () => {
  const event = { message: 'cron lỗi' };
  assert.equal(scrubSentryEvent(event), event);
});
