import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scrubBreadcrumb, scrubSentryEvent, scrubUrl } from './sentry.js';

const MASK = '[ẩn]';

describe('scrubUrl', () => {
  it('che token đặt lại mật khẩu, giữ tham số khác', () => {
    assert.equal(scrubUrl('https://x.io/SchoolarsGo/resetPassword?token=abc123&lang=vi'), `https://x.io/SchoolarsGo/resetPassword?token=${MASK}&lang=vi`);
  });

  it('URL không có token và giá trị không phải chuỗi giữ nguyên', () => {
    assert.equal(scrubUrl('https://x.io/scholarships?q=token'), 'https://x.io/scholarships?q=token');
    assert.equal(scrubUrl(undefined), undefined);
  });
});

describe('scrubSentryEvent', () => {
  it('che URL trang và Referer', () => {
    const event = scrubSentryEvent({ request: { url: '/resetPassword?token=a', headers: { Referer: '/resetPassword?token=a' } } });
    assert.equal(event.request.url, `/resetPassword?token=${MASK}`);
    assert.equal(event.request.headers.Referer, `/resetPassword?token=${MASK}`);
  });

  it('sự kiện không có request giữ nguyên', () => {
    const event = { message: 'lỗi' };
    assert.equal(scrubSentryEvent(event), event);
  });
});

describe('scrubBreadcrumb', () => {
  it('che from/to của điều hướng và url của fetch', () => {
    const nav = scrubBreadcrumb({ category: 'navigation', data: { from: '/login', to: '/resetPassword?token=a' } });
    const xhr = scrubBreadcrumb({ category: 'fetch', data: { url: '/api/x?access_token=b', method: 'GET' } });
    assert.deepEqual(nav.data, { from: '/login', to: `/resetPassword?token=${MASK}` });
    assert.equal(xhr.data.url, `/api/x?access_token=${MASK}`);
  });
});
