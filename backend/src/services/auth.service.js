/**
 * AuthService — TẦNG 2: Business Logic
 *
 * Mục đích: Xử lý nghiệp vụ Auth, KHÔNG chứa SQL, KHÔNG chứa HTTP
 * Quy tắc: Inject AuthRepository qua constructor, throw Error với UPPER_SNAKE_CODE
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

class AuthService {
  /**
   * @param {AuthRepository} authRepository
   */
  constructor(authRepository, eventBus) {
    this.repo = authRepository;
    this.eventBus = eventBus;
  }

  // ── Private helpers ─────────────────────────────────────────

  #throwError(message, statusCode, code) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    err.code = code; // UPPER_SNAKE_CASE
    throw err;
  }

  #hashPassword = async (plain) => {
    return bcrypt.hash(plain, SALT_ROUNDS);
  };

  #comparePassword = async (plain, hash) => {
    return bcrypt.compare(plain, hash);
  };

  #generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || 'scholarsgo-dev-secret-fallback-32chars', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
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

  // ── Public API ──────────────────────────────────────────────

  /**
   * Đăng ký user mới
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @returns {{ user: object, token: string }}
   */
  register = async (email, password, fullName) => {
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      this.#throwError('Email đã được sử dụng', 409, 'USER_EXISTS');
    }

    const passwordHash = await this.#hashPassword(password);

    const user = await this.repo.createUser({ email, passwordHash, fullName });
    if (!user) {
      this.#throwError('Không thể tạo user', 500, 'CREATE_USER_FAILED');
    }

    // JWT payload chứa { id, email, role }
    const token = this.#generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Loose Coupling: AuthService không biết AuthListener tồn tại
    this.eventBus.emit('user.registered', {
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

  /**
   * Đăng nhập — thành công thì gọi repo updateLastLogin
   * @param {string} email
   * @param {string} password
   * @returns {{ user: object, token: string }}
   */
  login = async (email, password) => {
    const user = await this.repo.findByEmailWithCredentials(email);
    if (!user) {
      this.#throwError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await this.#comparePassword(password, user.password_hash);
    if (!valid) {
      this.#throwError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    // Ghi nhận last_login_at sau khi login thành công
    const updatedUser = await this.repo.updateLastLogin(user.id);
    if (!updatedUser) {
      this.#throwError('Không thể cập nhật phiên đăng nhập', 500, 'UPDATE_LOGIN_FAILED');
    }

    // JWT payload chứa { id, email, role }
    const token = this.#generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Loose Coupling: AuthService không biết AuthListener tồn tại
    this.eventBus.emit('user.login', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return {
      user: this.#buildUserPublic(updatedUser),
      token,
    };
  };

  /**
   * Lấy thông tin user hiện tại
   * @param {number} userId
   * @returns {Promise<object>}
   */
  getMe = async (userId) => {
    const user = await this.repo.findById(userId);
    if (!user) {
      this.#throwError('Không tìm thấy user', 404, 'USER_NOT_FOUND');
    }
    return user;
  };

  /**
   * Refresh JWT token — lấy role từ DB
   * @param {number} userId
   * @returns {Promise<string>}
   */
  refreshToken = async (userId) => {
    const user = await this.repo.findById(userId);
    if (!user) {
      this.#throwError('Không tìm thấy user', 404, 'USER_NOT_FOUND');
    }

    return this.#generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  };
}

module.exports = AuthService;
