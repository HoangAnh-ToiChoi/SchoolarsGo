const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { sendResetEmail } = require('../configs/nodemailer');
const { toSessionUser } = require('../utils/sessionUser');
const { authorization } = require('../constants/errors');
const AuthModel = require('../models/auth.model');
const HashService = require('./hash.service');
const SessionService = require('./session.service');

class AuthService {
  #model;
  #hash;
  #sessions;

  constructor(authModel = new AuthModel(), hashService = new HashService(), sessionService = new SessionService()) {
    this.#model = authModel;
    this.#hash = hashService;
    this.#sessions = sessionService;
  }

  async register(email, password, fullName, userAgent) {
    if (await this.#model.findByEmail(email)) throw new AppError(authorization.USER_EXISTS);
    const user = await this.#model.createUser({ email, passwordHash: await this.#hash.hash(password), fullName });
    if (!user) throw new AppError(authorization.CREATE_USER_FAILED);
    const session = await this.#sessions.start(user, userAgent);
    return session;
  }

  async login(email, password, userAgent) {
    const user = await this.#model.findByEmailWithCredentials(email);
    if (!user || !(await this.#hash.compare(password, user.password_hash))) {
      throw new AppError(authorization.INVALID_CREDENTIALS);
    }
    if (user.is_active === false) throw new AppError(authorization.ACCOUNT_LOCKED);
    await this.#model.updateLastLogin(user.id);
    const session = await this.#sessions.start(user, userAgent);
    return session;
  }

  async getMe(userId) {
    const user = await this.#model.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return toSessionUser(user);
  }

  async getAccount(userId) {
    const user = await this.#model.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return { email: user.email, phone: user.phone, date_of_birth: user.date_of_birth };
  }

  refresh = rawToken => this.#sessions.refresh(rawToken);
  logout = rawToken => this.#sessions.end(rawToken);
  listSessions = (userId, currentSessionId) => this.#sessions.list(userId, currentSessionId);
  endSession = (userId, sessionId) => this.#sessions.endOne(userId, sessionId);

  async forgotPassword(email) {
    const user = await this.#model.findByEmail(email);
    if (!user) return;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await this.#model.saveResetToken(user.id, tokenHash, expiresAt);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendResetEmail(email, `${frontendUrl}/resetPassword?token=${rawToken}`);
  }

  async resetPassword(rawToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.#model.findByResetToken(tokenHash);
    if (!user) throw new AppError(authorization.INVALID_RESET_TOKEN);
    if (new Date(user.reset_token_expires) < new Date()) throw new AppError(authorization.EXPIRED_RESET_TOKEN);
    await this.#model.clearResetToken(user.id, await this.#hash.hash(newPassword));
    await this.#sessions.endAllForUser(user.id, 'password_reset');
  }
}

module.exports = AuthService;
