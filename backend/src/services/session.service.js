const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { toSessionUser } = require('../utils/sessionUser');

class SessionService {
  #repo;
  #users;
  #token;

  constructor(sessionRepository, authRepository, tokenService) {
    this.#repo = sessionRepository;
    this.#users = authRepository;
    this.#token = tokenService;
  }

  async start(user, userAgent) {
    const sessionId = crypto.randomUUID();
    const refreshToken = this.#token.signRefresh({ userId: user.id, sessionId });
    await this.#repo.createWithLimit({
      sessionId, userId: user.id, refreshTokenHash: this.#token.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 86400000), deviceName: this.#deviceName(userAgent),
    });
    return { accessToken: this.#token.signAccess({ userId: user.id, sessionId, role: user.role }), refreshToken, user: toSessionUser(user) };
  }

  async refresh(rawToken) {
    if (!rawToken) throw new AppError('Thiếu refresh token', 401, 'REFRESH_TOKEN_MISSING');
    const claims = this.#token.verifyRefresh(rawToken);
    const session = await this.#repo.findById(claims.sid);
    if (!session || session.revoked_at) throw new AppError('Phiên đăng nhập đã bị thu hồi', 401, 'SESSION_REVOKED');
    const hash = this.#token.hashToken(rawToken);
    if (hash !== session.refresh_token_hash) return this.#handleReused(session, hash);
    const user = await this.#users.findSessionUserById(claims.sub);
    if (!user || !user.is_active) {
      await this.#repo.revoke(session.id, 'locked');
      throw new AppError('Tài khoản không hoạt động', 401, 'SESSION_REVOKED');
    }
    const refreshToken = this.#token.signRefresh({ userId: user.id, sessionId: session.id });
    const updated = await this.#repo.rotate(session.id, {
      refreshTokenHash: this.#token.hashToken(refreshToken), previousTokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 86400000), currentTokenHash: hash,
    });
    if (!updated) {
      const latest = await this.#repo.findById(session.id);
      if (latest?.previous_token_hash === hash && Date.now() - new Date(latest.rotated_at).getTime() < 30000) {
        throw new AppError('Đang làm mới phiên ở tab khác', 409, 'REFRESH_RACE');
      }
      throw new AppError('Phiên đăng nhập đã bị thu hồi', 401, 'SESSION_REVOKED');
    }
    return { accessToken: this.#token.signAccess({ userId: user.id, sessionId: session.id, role: user.role }), refreshToken, user: toSessionUser(user) };
  }

  async #handleReused(session, hash) {
    if (hash === session.previous_token_hash && Date.now() - new Date(session.rotated_at).getTime() < 30000) {
      throw new AppError('Đang làm mới phiên ở tab khác', 409, 'REFRESH_RACE');
    }
    await this.#repo.revoke(session.id, 'reused');
    throw new AppError('Refresh token đã được sử dụng lại', 401, 'REFRESH_TOKEN_REUSED');
  }

  async end(rawToken) {
    if (!rawToken) return;
    try {
      const claims = this.#token.verifyRefresh(rawToken);
      await this.#repo.revoke(claims.sid, 'logout');
    } catch (error) {
      if (error.code) return;
      throw error;
    }
  }

  endAllForUser(userId, reason) {
    return this.#repo.revokeAllForUser(userId, reason);
  }

  async list(userId, currentSessionId) {
    const sessions = await this.#repo.listActive(userId);
    return sessions.map(session => ({ ...session, is_current: session.id === currentSessionId }));
  }

  async endOne(userId, sessionId) {
    const session = await this.#repo.revokeForUser(sessionId, userId, 'logout');
    if (!session) throw new AppError('Không tìm thấy thiết bị', 404, 'SESSION_NOT_FOUND');
  }

  #deviceName(userAgent = '') {
    const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox' : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'Trình duyệt';
    const platform = /Windows/.test(userAgent) ? 'Windows' : /Mac OS/.test(userAgent) ? 'macOS' : /Android/.test(userAgent) ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : 'thiết bị khác';
    return `${browser} · ${platform}`;
  }
}

module.exports = SessionService;
