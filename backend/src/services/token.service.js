const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

class TokenService {
  constructor(env = process.env) {
    this.accessSecret = env.JWT_ACCESS_SECRET;
    this.refreshSecret = env.JWT_REFRESH_SECRET;
    if (!this.accessSecret || this.accessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
    if (!this.refreshSecret || this.refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
    if (this.accessSecret === this.refreshSecret) throw new Error('JWT access and refresh secrets must be different');
  }

  signAccess({ userId, sessionId, role }) {
    return jwt.sign({ sub: userId, sid: sessionId, role }, this.accessSecret, { algorithm: 'HS256', expiresIn: '15m' });
  }

  verifyAccess(token) {
    try {
      return jwt.verify(token, this.accessSecret, { algorithms: ['HS256'] });
    } catch (error) {
      const expired = error.name === 'TokenExpiredError';
      throw new AppError(expired ? 'Access token đã hết hạn' : 'Access token không hợp lệ', 401, expired ? 'ACCESS_TOKEN_EXPIRED' : 'ACCESS_TOKEN_INVALID');
    }
  }

  signRefresh({ userId, sessionId }) {
    return jwt.sign({ sub: userId, sid: sessionId, jti: crypto.randomUUID() }, this.refreshSecret, { algorithm: 'HS256', expiresIn: '7d' });
  }

  verifyRefresh(token) {
    try {
      return jwt.verify(token, this.refreshSecret, { algorithms: ['HS256'] });
    } catch (error) {
      const expired = error.name === 'TokenExpiredError';
      throw new AppError(expired ? 'Refresh token đã hết hạn' : 'Refresh token không hợp lệ', 401, expired ? 'REFRESH_TOKEN_EXPIRED' : 'REFRESH_TOKEN_INVALID');
    }
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = TokenService;
