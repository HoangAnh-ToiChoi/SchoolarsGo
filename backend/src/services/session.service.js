import crypto from 'node:crypto';
import AppError from '~/utils/AppError.js';
import { toSessionUser } from '~/utils/sessionUser.js';
import { authorization } from '~/constants/errors.js';
import sessionModel from '~/models/session.model.js';
import authModel from '~/models/auth.model.js';
import tokenService from './token.service.js';

class SessionService {
  async start(user, userAgent) {
    const sessionId = crypto.randomUUID();
    const refreshToken = tokenService.signRefresh({ userId: user.id, sessionId });
    await sessionModel.createWithLimit({
      sessionId, userId: user.id, refreshTokenHash: tokenService.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 86400000), deviceName: this.#deviceName(userAgent),
    });
    return { accessToken: tokenService.signAccess({ userId: user.id, sessionId, role: user.role }), refreshToken, user: toSessionUser(user) };
  }

  async refresh(rawToken) {
    if (!rawToken) throw new AppError(authorization.REFRESH_TOKEN_MISSING);
    const claims = tokenService.verifyRefresh(rawToken);
    const session = await sessionModel.findById(claims.sid);
    if (!session || session.revoked_at) throw new AppError(authorization.SESSION_REVOKED);
    const hash = tokenService.hashToken(rawToken);
    if (hash !== session.refresh_token_hash) return this.#handleReused(session, hash);
    const user = await authModel.findSessionUserById(claims.sub);
    if (!user || !user.is_active) {
      await sessionModel.revoke(session.id, 'locked');
      throw new AppError(authorization.SESSION_REVOKED);
    }
    const refreshToken = tokenService.signRefresh({ userId: user.id, sessionId: session.id });
    const updated = await sessionModel.rotate(session.id, {
      refreshTokenHash: tokenService.hashToken(refreshToken), previousTokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 86400000), currentTokenHash: hash,
    });
    if (!updated) {
      const latest = await sessionModel.findById(session.id);
      if (latest?.previous_token_hash === hash && Date.now() - new Date(latest.rotated_at).getTime() < 30000) {
        throw new AppError(authorization.REFRESH_RACE);
      }
      throw new AppError(authorization.SESSION_REVOKED);
    }
    return { accessToken: tokenService.signAccess({ userId: user.id, sessionId: session.id, role: user.role }), refreshToken, user: toSessionUser(user) };
  }

  async #handleReused(session, hash) {
    if (hash === session.previous_token_hash && Date.now() - new Date(session.rotated_at).getTime() < 30000) {
      throw new AppError(authorization.REFRESH_RACE);
    }
    await sessionModel.revoke(session.id, 'reused');
    throw new AppError(authorization.REFRESH_TOKEN_REUSED);
  }

  async end(rawToken) {
    if (!rawToken) return;
    try {
      const claims = tokenService.verifyRefresh(rawToken);
      await sessionModel.revoke(claims.sid, 'logout');
    } catch (error) {
      if (error.code) return;
      throw error;
    }
  }

  endAllForUser(userId, reason) {
    return sessionModel.revokeAllForUser(userId, reason);
  }

  async list(userId, currentSessionId) {
    const sessions = await sessionModel.listActive(userId);
    return sessions.map(session => ({ ...session, is_current: session.id === currentSessionId }));
  }

  async endOne(userId, sessionId) {
    const session = await sessionModel.revokeForUser(sessionId, userId, 'logout');
    if (!session) throw new AppError(authorization.SESSION_NOT_FOUND);
  }

  #deviceName(userAgent = '') {
    const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox' : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'Trình duyệt';
    const platform = /Windows/.test(userAgent) ? 'Windows' : /Mac OS/.test(userAgent) ? 'macOS' : /Android/.test(userAgent) ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : 'thiết bị khác';
    return `${browser} · ${platform}`;
  }
}

export default new SessionService();