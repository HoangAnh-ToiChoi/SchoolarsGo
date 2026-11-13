const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { getAuthSecrets } = require('../config/env');
const { authorization } = require('../constants/errors');

class TokenService {
  constructor(env = process.env) {
    ({ accessSecret: this.accessSecret, refreshSecret: this.refreshSecret } = getAuthSecrets(env));
  }

  signAccess({ userId, sessionId, role }) {
    return jwt.sign({ sub: userId, sid: sessionId, role }, this.accessSecret, { algorithm: 'HS256', expiresIn: '15m' });
  }

  verifyAccess(token) {
    try {
      return jwt.verify(token, this.accessSecret, { algorithms: ['HS256'] });
    } catch (error) {
      throw new AppError(error.name === 'TokenExpiredError' ? authorization.ACCESS_TOKEN_EXPIRED : authorization.ACCESS_TOKEN_INVALID);
    }
  }

  signRefresh({ userId, sessionId }) {
    return jwt.sign({ sub: userId, sid: sessionId, jti: crypto.randomUUID() }, this.refreshSecret, { algorithm: 'HS256', expiresIn: '7d' });
  }

  verifyRefresh(token) {
    try {
      return jwt.verify(token, this.refreshSecret, { algorithms: ['HS256'] });
    } catch (error) {
      throw new AppError(error.name === 'TokenExpiredError' ? authorization.REFRESH_TOKEN_EXPIRED : authorization.REFRESH_TOKEN_INVALID);
    }
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = TokenService;
