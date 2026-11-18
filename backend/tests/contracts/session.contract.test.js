import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { mockService, srcUrl } from './helpers/mockService.js';
import { toSessionUser } from '#utils/sessionUser.js';

process.env.CORS_ORIGINS = 'https://good.example,https://other.example';

// Service dùng model đã import sẵn nên giả lập các module model/hash trước khi nạp service.
// Mỗi test gán `.current` = bản giả riêng. Token service chạy thật với khóa từ tests/setupEnv.js.
const sessionModelRef = mockService(srcUrl('models/session.model.js'));
const authModelRef = mockService(srcUrl('models/auth.model.js'));
const adminModelRef = mockService(srcUrl('models/admin.model.js'));
const hashRef = mockService(srcUrl('services/hash.service.js'));

const { default: tokens } = await import('#services/token.service.js');
const { default: sessions } = await import('#services/session.service.js');
const { default: auth } = await import('#services/auth.service.js');
const { default: admin } = await import('#services/admin.service.js');
const { getAuthSecrets } = await import('#configs/jwt.config.js');
// cors.config đọc env lúc nạp nên phải nạp động sau khi đặt CORS_ORIGINS
const { isAllowedOrigin } = await import('#configs/cors.config.js');

const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = process.env;
const activeUser = (role = 'user') => ({ findSessionUserById: async () => ({ id: 'u1', role, is_active: true }) });

class MemorySessions {
  rows = new Map();
  async createWithLimit(session) {
    const active = [...this.rows.values()].filter(row => row.user_id === session.userId && !row.revoked_at);
    if (active.length >= 3) active.sort((a, b) => new Date(a.last_used_at) - new Date(b.last_used_at))[0].revoked_at = new Date();
    this.rows.set(session.sessionId, { id: session.sessionId, user_id: session.userId, refresh_token_hash: session.refreshTokenHash, expires_at: session.expiresAt, revoked_at: null, last_used_at: new Date() });
  }
  async findById(id) { return this.rows.get(id) || null; }
  async rotate(id, values) {
    const row = this.rows.get(id);
    if (!row || row.revoked_at || row.refresh_token_hash !== values.currentTokenHash) return null;
    Object.assign(row, { refresh_token_hash: values.refreshTokenHash, previous_token_hash: values.previousTokenHash, rotated_at: new Date(), expires_at: values.expiresAt });
    return row;
  }
  async revoke(id, reason) { const row = this.rows.get(id); if (row) Object.assign(row, { revoked_at: new Date(), revoked_reason: reason }); }
  async revokeAllForUser() {}
  async revokeForUser() { return { id: 'x' }; }
  async listActive() { return []; }
}

let clock;
beforeEach(() => {
  clock = Date.now;
});

test('T1: access and refresh lifetimes are 15 minutes and 7 days; only a hash is persisted', async () => {
  const repo = new MemorySessions();
  sessionModelRef.current = repo;
  authModelRef.current = activeUser();
  const result = await sessions.start({ id: 'u1', role: 'user', full_name: 'A' }, 'Chrome/Windows');
  const access = jwt.decode(result.accessToken);
  const refresh = jwt.decode(result.refreshToken);
  assert.equal(access.exp - access.iat, 900);
  assert.equal(refresh.exp - refresh.iat, 604800);
  assert.notEqual([...repo.rows.values()][0].refresh_token_hash, result.refreshToken);
  assert.equal([...repo.rows.values()][0].refresh_token_hash, tokens.hashToken(result.refreshToken));
});

test('T3/T4: verify access expiration and reject wrong algorithms or secrets', () => {
  const valid = tokens.signAccess({ userId: 'u1', sessionId: 's1', role: 'user' });
  assert.equal(tokens.verifyAccess(valid).sub, 'u1');
  assert.throws(() => tokens.verifyAccess(jwt.sign({ sub: 'u1' }, 'wrong-secret-that-is-long-enough-to-work')),
    error => error.code === 'ACCESS_TOKEN_INVALID');
  assert.throws(() => tokens.verifyAccess(jwt.sign({ sub: 'u1' }, JWT_ACCESS_SECRET, { algorithm: 'none' })),
    error => error.code === 'ACCESS_TOKEN_INVALID');
  const expired = jwt.sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 1 }, JWT_ACCESS_SECRET, { algorithm: 'HS256' });
  assert.throws(() => tokens.verifyAccess(expired), error => error.code === 'ACCESS_TOKEN_EXPIRED');
});

test('T5/T8: rotation stores previous hash, slides expiry, and recognizes a recent replay as a race', async () => {
  const repo = new MemorySessions();
  sessionModelRef.current = repo;
  authModelRef.current = activeUser('admin');
  const start = await sessions.start({ id: 'u1', role: 'user' }, 'Firefox');
  const rotated = await sessions.refresh(start.refreshToken);
  const row = [...repo.rows.values()][0];
  assert.equal(row.previous_token_hash, tokens.hashToken(start.refreshToken));
  assert.equal(new Date(row.expires_at).getTime() - Date.now() < 604801000, true);
  assert.equal(jwt.decode(rotated.accessToken).role, 'admin');
  await assert.rejects(sessions.refresh(start.refreshToken), error => error.code === 'REFRESH_RACE');
  assert.equal(row.revoked_at, null);
});

test('T7/T12: an old token after the race window revokes the session and logout prevents refresh', async () => {
  const repo = new MemorySessions();
  sessionModelRef.current = repo;
  authModelRef.current = activeUser();
  const start = await sessions.start({ id: 'u1', role: 'user' });
  const current = await sessions.refresh(start.refreshToken);
  const row = [...repo.rows.values()][0];
  row.rotated_at = new Date(Date.now() - 31000);
  await assert.rejects(sessions.refresh(start.refreshToken), error => error.code === 'REFRESH_TOKEN_REUSED');
  assert.equal(row.revoked_reason, 'reused');
  await sessions.end(current.refreshToken);
  await assert.rejects(sessions.refresh(current.refreshToken), error => error.code === 'SESSION_REVOKED');
});

test('T16: missing or short secrets are rejected', () => {
  assert.throws(() => getAuthSecrets({}), /JWT_ACCESS_SECRET/);
  assert.throws(() => getAuthSecrets({ JWT_ACCESS_SECRET: 'short', JWT_REFRESH_SECRET: 'also-short' }), /at least 32/);
});

test('T2: locked accounts cannot log in or create sessions', async () => {
  let started = false;
  authModelRef.current = { findByEmailWithCredentials: async () => ({ id: 'u1', is_active: false, password_hash: 'hash' }) };
  hashRef.current = { compare: async () => true };
  sessionModelRef.current = { createWithLimit: async () => { started = true; } };
  await assert.rejects(auth.login('a@b.com', 'pass'), error => error.code === 'ACCOUNT_LOCKED' && error.statusCode === 403);
  assert.equal(started, false);
});

test('T6: refresh tokens expire after seven days', () => {
  const expired = jwt.sign({ sub: 'u1', sid: 's1', exp: Math.floor(Date.now() / 1000) - 1 }, JWT_REFRESH_SECRET, { algorithm: 'HS256' });
  assert.throws(() => tokens.verifyRefresh(expired), error => error.code === 'REFRESH_TOKEN_EXPIRED');
});

test('T9: the fourth device revokes the least recently used session', async () => {
  const repo = new MemorySessions();
  sessionModelRef.current = repo;
  authModelRef.current = {};
  const started = await Promise.all([1, 2, 3, 4].map(() => sessions.start({ id: 'u1', role: 'user' })));
  const rows = [...repo.rows.values()];
  assert.equal(rows.filter(row => !row.revoked_at).length, 3);
  assert.equal(rows[0].revoked_at instanceof Date, true);
  await assert.rejects(sessions.refresh(started[0].refreshToken), error => error.code === 'SESSION_REVOKED');
});

test('T10/T11: role, lock and password reset revoke only the affected user sessions', async () => {
  const revoked = [];
  sessionModelRef.current = { revokeAllForUser: async (id, reason) => { revoked.push({ id, reason }); } };
  adminModelRef.current = { updateUserRole: async id => ({ id }), updateUserStatus: async id => ({ id }) };
  await admin.changeUserRole('u1', 'admin', 'admin-1');
  await admin.changeUserStatus('u2', false, 'admin-1');
  assert.deepEqual(revoked, [{ id: 'u1', reason: 'role_changed' }, { id: 'u2', reason: 'locked' }]);

  authModelRef.current = {
    findByResetToken: async () => ({ id: 'u3', reset_token_expires: new Date(Date.now() + 60000) }),
    clearResetToken: async () => {},
  };
  hashRef.current = { hash: async () => 'new-hash' };
  await auth.resetPassword('raw', 'new-password');
  assert.deepEqual(revoked[2], { id: 'u3', reason: 'password_reset' });
});

test('T13/T14: session ownership errors and public user fields are constrained', async () => {
  sessionModelRef.current = { revokeForUser: async () => null };
  await assert.rejects(sessions.endOne('u1', 'other-session'), error => error.statusCode === 404);
  assert.deepEqual(toSessionUser({ id: 'u1', full_name: 'A', avatar_url: null, role: 'user', email: 'private@example.com', phone: '1' }),
    { id: 'u1', full_name: 'A', avatar_url: null, role: 'user' });
});

test('T15: allowed CORS origins are exact and reject deceptive or null origins', () => {
  assert.equal(isAllowedOrigin('https://good.example'), true);
  assert.equal(isAllowedOrigin('https://good.example.evil.com'), false);
  assert.equal(isAllowedOrigin('null'), false);
});

test.after(() => { Date.now = clock; });
