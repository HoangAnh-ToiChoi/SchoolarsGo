const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

class AuthService {
  #repo;
  #eventBus;

  constructor(authRepository, eventBus) {
    this.#repo = authRepository;
    this.#eventBus = eventBus;
  }

  #hashPassword = async plain => {
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

    const passwordHash = await this.#hashPassword(password);

    const user = await this.#repo.createUser({ email, passwordHash, fullName });
    if (!user) {
      throw new AppError('Không thể tạo user', 500, 'CREATE_USER_FAILED');
    }

    const token = this.#generateToken({
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

    const valid = await this.#comparePassword(password, user.password_hash);
    if (!valid) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    const updatedUser = await this.#repo.updateLastLogin(user.id);
    if (!updatedUser) {
      throw new AppError('Không thể cập nhật phiên đăng nhập', 500, 'UPDATE_LOGIN_FAILED');
    }

    const token = this.#generateToken({
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

    return this.#generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  };
}

module.exports = AuthService;
