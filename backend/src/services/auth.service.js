import crypto from 'node:crypto';
import { sendResetEmail } from '~/configs/nodemailer.js';
import { toSessionUser } from '~/utils/sessionUser.js';
import { AppError, authorization } from '~/constants/errors.js';
import authModel from '~/models/auth.model.js';
import hashService from '~/utils/hash.js';
import sessionService from './session.service.js';

class AuthService {
  async register(email, password, fullName, userAgent) {
    if (await authModel.findByEmail(email)) throw new AppError(authorization.USER_EXISTS);
    const user = await authModel.createUser({ email, passwordHash: await hashService.hash(password), fullName });
    if (!user) throw new AppError(authorization.CREATE_USER_FAILED);
    const session = await sessionService.start(user, userAgent);
    return session;
  }

  async login(email, password, userAgent) {
    const user = await authModel.findByEmailWithCredentials(email);
    if (!user || !(await hashService.compare(password, user.password_hash))) {
      throw new AppError(authorization.INVALID_CREDENTIALS);
    }
    if (user.is_active === false) throw new AppError(authorization.ACCOUNT_LOCKED);
    await authModel.updateLastLogin(user.id);
    const session = await sessionService.start(user, userAgent);
    return session;
  }

  async getMe(userId) {
    const user = await authModel.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return toSessionUser(user);
  }

  async getAccount(userId) {
    const user = await authModel.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return { email: user.email, phone: user.phone, date_of_birth: user.date_of_birth };
  }

  async refresh(rawToken) {
    return sessionService.refresh(rawToken);
  }

  async logout(rawToken) {
    return sessionService.end(rawToken);
  }

  async listSessions(userId, currentSessionId) {
    return sessionService.list(userId, currentSessionId);
  }

  async endSession(userId, sessionId) {
    return sessionService.endOne(userId, sessionId);
  }

  async forgotPassword(email) {
    const user = await authModel.findByEmail(email);
    if (!user) return;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await authModel.saveResetToken(user.id, tokenHash, expiresAt);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendResetEmail(email, `${frontendUrl}/resetPassword?token=${rawToken}`);
  }

  async resetPassword(rawToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await authModel.findByResetToken(tokenHash);
    if (!user) throw new AppError(authorization.INVALID_RESET_TOKEN);
    if (new Date(user.reset_token_expires) < new Date()) throw new AppError(authorization.EXPIRED_RESET_TOKEN);
    await authModel.clearResetToken(user.id, await hashService.hash(newPassword));
    await sessionService.endAllForUser(user.id, 'password_reset');
  }
}

export default new AuthService();