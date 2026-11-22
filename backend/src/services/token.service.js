import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getAuthSecrets, jwtConfig } from '~/configs/jwt.config.js';
import { AppError, authorization } from '~/constants/errors.js';

class TokenService {
  constructor() {
    ({ accessSecret: this.accessSecret, refreshSecret: this.refreshSecret } = getAuthSecrets());
  }

  signAccess({ userId, sessionId, role }) {
    return jwt.sign({ sub: userId, sid: sessionId, role }, this.accessSecret, { algorithm: jwtConfig.algorithm, expiresIn: jwtConfig.accessExpiresIn });
  }

  verifyAccess(token) {
    try {
      return jwt.verify(token, this.accessSecret, { algorithms: [jwtConfig.algorithm] });
    } catch (error) {
      throw new AppError(error.name === 'TokenExpiredError' ? authorization.ACCESS_TOKEN_EXPIRED : authorization.ACCESS_TOKEN_INVALID);
    }
  }

  signRefresh({ userId, sessionId }) {
    return jwt.sign({ sub: userId, sid: sessionId, jti: crypto.randomUUID() }, this.refreshSecret, { algorithm: jwtConfig.algorithm, expiresIn: jwtConfig.refreshExpiresIn });
  }

  verifyRefresh(token) {
    try {
      return jwt.verify(token, this.refreshSecret, { algorithms: [jwtConfig.algorithm] });
    } catch (error) {
      throw new AppError(error.name === 'TokenExpiredError' ? authorization.REFRESH_TOKEN_EXPIRED : authorization.REFRESH_TOKEN_INVALID);
    }
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default new TokenService();