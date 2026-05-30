const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { sendResetEmail } = require('../utils/mailer');

class AuthService {
  #repo;
  #eventBus;
  #hash;
  #token;

  /**
   * @param {object} authRepository
   * @param {object} eventBus
   * @param {object} hashService  - { hash(plain), compare(plain, hash) }
   * @param {object} tokenService - { sign(payload) }
   */
  constructor(authRepository, eventBus, hashService, tokenService) {
    this.#repo = authRepository;
    this.#eventBus = eventBus;
    this.#hash = hashService;
    this.#token = tokenService;
  }

  #guardFound(entity, message = 'Không tìm thấy') {
    if (!entity) throw new AppError(message, 404);
  }

  #buildUserPublic(user) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      phone: user.phone,
      date_of_birth: user.date_of_birth,
    };
  }

  register = async (email, password, fullName) => {
    const existing = await this.#repo.findByEmail(email);
    if (existing) {
      throw new AppError('Email đã được sử dụng', 409, 'USER_EXISTS');
    }

    const passwordHash = await this.#hash.hash(password);

    const user = await this.#repo.createUser({ email, passwordHash, fullName });
    if (!user) {
      throw new AppError('Không thể tạo user', 500, 'CREATE_USER_FAILED');
    }

    const token = this.#token.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    this.#eventBus.emit('user.registered', {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });

    return {
      user: this.#buildUserPublic(user),
      token,
    };
  };

  login = async (email, password) => {
    const user = await this.#repo.findByEmailWithCredentials(email);
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await this.#hash.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    const updatedUser = await this.#repo.updateLastLogin(user.id);
    if (!updatedUser) {
      throw new AppError('Không thể cập nhật phiên đăng nhập', 500, 'UPDATE_LOGIN_FAILED');
    }

    const token = this.#token.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    this.#eventBus.emit('user.login', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return {
      user: this.#buildUserPublic(updatedUser),
      token,
    };
  };

  getMe = async userId => {
    const user = await this.#repo.findById(userId);
    this.#guardFound(user, 'Không tìm thấy user');
    return user;
  };

  refreshToken = async userId => {
    const user = await this.#repo.findById(userId);
    this.#guardFound(user, 'Không tìm thấy user');

    return this.#token.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  };

  forgotPassword = async (email) => {
    const user = await this.#repo.findByEmail(email);
    // Always succeed to prevent email enumeration
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await this.#repo.saveResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    await sendResetEmail(email, resetLink);
  };

  resetPassword = async (rawToken, newPassword) => {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.#repo.findByResetToken(tokenHash);

    if (!user) throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400, 'INVALID_RESET_TOKEN');
    if (new Date(user.reset_token_expires) < new Date()) {
      throw new AppError('Link đã hết hạn. Vui lòng yêu cầu lại.', 400, 'EXPIRED_RESET_TOKEN');
    }

    const passwordHash = await this.#hash.hash(newPassword);
    await this.#repo.clearResetToken(user.id, passwordHash);
  };
}

module.exports = AuthService;
