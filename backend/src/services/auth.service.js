const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { sendResetEmail } = require('../utils/mailer');
const { toSessionUser } = require('../utils/sessionUser');
const { authorization } = require('../constants/errors');

class AuthService {
  #repo;
  #eventBus;
  #hash;
  #sessions;

  constructor(authRepository, eventBus, hashService, _tokenService, sessionService) {
    this.#repo = authRepository;
    this.#eventBus = eventBus;
    this.#hash = hashService;
    this.#sessions = sessionService;
  }

  register = async (email, password, fullName, userAgent) => {
    if (await this.#repo.findByEmail(email)) throw new AppError(authorization.USER_EXISTS);
    const user = await this.#repo.createUser({ email, passwordHash: await this.#hash.hash(password), fullName });
    if (!user) throw new AppError('Không thể tạo user', 500, 'CREATE_USER_FAILED');
    const session = await this.#sessions.start(user, userAgent);
    this.#eventBus.emit('user.registered', { userId: user.id, email: user.email, fullName: user.full_name, role: user.role });
    return session;
  };

  login = async (email, password, userAgent) => {
    const user = await this.#repo.findByEmailWithCredentials(email);
    if (!user || !(await this.#hash.compare(password, user.password_hash))) {
      throw new AppError(authorization.INVALID_CREDENTIALS);
    }
    if (user.is_active === false) throw new AppError(authorization.ACCOUNT_LOCKED);
    await this.#repo.updateLastLogin(user.id);
    const session = await this.#sessions.start(user, userAgent);
    this.#eventBus.emit('user.login', { userId: user.id, email: user.email, role: user.role });
    return session;
  };

  getMe = async userId => {
    const user = await this.#repo.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return toSessionUser(user);
  };

  getAccount = async userId => {
    const user = await this.#repo.findById(userId);
    if (!user) throw new AppError(authorization.USER_NOT_FOUND);
    return { email: user.email, phone: user.phone, date_of_birth: user.date_of_birth };
  };

  refresh = rawToken => this.#sessions.refresh(rawToken);
  logout = rawToken => this.#sessions.end(rawToken);
  listSessions = (userId, currentSessionId) => this.#sessions.list(userId, currentSessionId);
  endSession = (userId, sessionId) => this.#sessions.endOne(userId, sessionId);

  forgotPassword = async email => {
    const user = await this.#repo.findByEmail(email);
    if (!user) return;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await this.#repo.saveResetToken(user.id, tokenHash, expiresAt);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendResetEmail(email, `${frontendUrl}/resetPassword?token=${rawToken}`);
  };

  resetPassword = async (rawToken, newPassword) => {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.#repo.findByResetToken(tokenHash);
    if (!user) throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400, 'INVALID_RESET_TOKEN');
    if (new Date(user.reset_token_expires) < new Date()) throw new AppError('Link đã hết hạn. Vui lòng yêu cầu lại.', 400, 'EXPIRED_RESET_TOKEN');
    await this.#repo.clearResetToken(user.id, await this.#hash.hash(newPassword));
    await this.#sessions.endAllForUser(user.id, 'password_reset');
  };
}

module.exports = AuthService;
