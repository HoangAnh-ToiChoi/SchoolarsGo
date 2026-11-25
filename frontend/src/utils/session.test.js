import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoginUrl } from './session.js';

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
