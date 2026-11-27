import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoginUrl, safeRedirectPath } from './session.js';

describe('buildLoginUrl', () => {
  it('bản GitHub Pages: giữ base ở URL đăng nhập, bỏ base khỏi redirect', () => {
    const url = buildLoginUrl({ base: '/SchoolarsGo/', pathname: '/SchoolarsGo/applications', search: '?tab=draft' });
    assert.equal(url, `/SchoolarsGo/login?redirect=${encodeURIComponent('/applications?tab=draft')}`);
  });

  it('base gốc "/" giữ nguyên đường dẫn', () => {
    assert.equal(buildLoginUrl({ base: '/', pathname: '/saved', search: '' }), `/login?redirect=${encodeURIComponent('/saved')}`);
  });

  it('phiên bị thu hồi thì kèm lý do', () => {
    const url = buildLoginUrl({ base: '/', pathname: '/', search: '', code: 'SESSION_REVOKED' });
    assert.match(url, /&reason=SESSION_REVOKED$/);
  });
});

describe('safeRedirectPath', () => {
  it('nhận đường dẫn nội bộ, giữ query', () => {
    assert.equal(safeRedirectPath('/applications?tab=draft', '/'), '/applications?tab=draft');
  });

  it('thiếu hoặc không bắt đầu bằng "/" thì về trang mặc định', () => {
    assert.equal(safeRedirectPath(null, '/'), '/');
    assert.equal(safeRedirectPath('https://evil.com', '/'), '/');
    assert.equal(safeRedirectPath('javascript:alert(1)', '/'), '/');
  });

  it('chặn đường dẫn trình duyệt hiểu thành trang khác: //, /\\, ký tự điều khiển', () => {
    assert.equal(safeRedirectPath('//evil.com', '/'), '/');
    assert.equal(safeRedirectPath('/\\evil.com', '/'), '/');
    assert.equal(safeRedirectPath('/\t/evil.com', '/'), '/');
    assert.equal(safeRedirectPath('/\n/evil.com', '/'), '/');
  });
});
