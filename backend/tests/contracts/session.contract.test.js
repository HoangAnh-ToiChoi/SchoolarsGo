const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const TokenService = require('../../src/services/token.service');
const SessionService = require('../../src/services/session.service');

const env = { JWT_ACCESS_SECRET: 'access-secret-that-is-at-least-32-chars', JWT_REFRESH_SECRET: 'refresh-secret-that-is-also-32-chars' };

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
  const tokens = new TokenService(env);
  const repo = new MemorySessions();
  const sessions = new SessionService(repo, { findSessionUserById: async () => ({ id: 'u1', role: 'user', is_active: true }) }, tokens);
  const result = await sessions.start({ id: 'u1', role: 'user', full_name: 'A' }, 'Chrome/Windows');
  const access = jwt.decode(result.accessToken);
  const refresh = jwt.decode(result.refreshToken);
  assert.equal(access.exp - access.iat, 900);
  assert.equal(refresh.exp - refresh.iat, 604800);
  assert.notEqual([...repo.rows.values()][0].refresh_token_hash, result.refreshToken);
  assert.equal([...repo.rows.values()][0].refresh_token_hash, tokens.hashToken(result.refreshToken));
});

test('T3/T4: verify access expiration and reject wrong algorithms or secrets', () => {
  const tokens = new TokenService(env);
  const valid = tokens.signAccess({ userId: 'u1', sessionId: 's1', role: 'user' });
  assert.equal(tokens.verifyAccess(valid).sub, 'u1');
  assert.throws(() => tokens.verifyAccess(jwt.sign({ sub: 'u1' }, 'wrong-secret-that-is-long-enough-to-work')),
    error => error.code === 'ACCESS_TOKEN_INVALID');
  assert.throws(() => tokens.verifyAccess(jwt.sign({ sub: 'u1' }, env.JWT_ACCESS_SECRET, { algorithm: 'none' })),
    error => error.code === 'ACCESS_TOKEN_INVALID');
});

test('T5/T8: rotation stores previous hash, slides expiry, and recognizes a recent replay as a race', async () => {
  const tokens = new TokenService(env);
  const repo = new MemorySessions();
  const sessions = new SessionService(repo, { findSessionUserById: async () => ({ id: 'u1', role: 'admin', is_active: true }) }, tokens);
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
  const tokens = new TokenService(env);
  const repo = new MemorySessions();
  const sessions = new SessionService(repo, { findSessionUserById: async () => ({ id: 'u1', role: 'user', is_active: true }) }, tokens);
  const start = await sessions.start({ id: 'u1', role: 'user' });
  const current = await sessions.refresh(start.refreshToken);
  const row = [...repo.rows.values()][0];
  row.rotated_at = new Date(Date.now() - 31000);
  await assert.rejects(sessions.refresh(start.refreshToken), error => error.code === 'REFRESH_TOKEN_REUSED');
  assert.equal(row.revoked_reason, 'reused');
  await sessions.end(current.refreshToken);
  await assert.rejects(sessions.refresh(current.refreshToken), error => error.code === 'SESSION_REVOKED');
});

test('T16: missing or short secrets fail at service construction', () => {
  assert.throws(() => new TokenService({}), /JWT_ACCESS_SECRET/);
  assert.throws(() => new TokenService({ JWT_ACCESS_SECRET: 'short', JWT_REFRESH_SECRET: 'also-short' }), /at least 32/);
});

test.after(() => { Date.now = clock; });
