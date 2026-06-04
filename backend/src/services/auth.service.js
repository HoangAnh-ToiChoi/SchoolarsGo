const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { sendResetEmail } = require('../utils/mailer');

class AuthService {
  #repo;
  #eventBus;
  #hash;
  #token;
  #oauth;

  /**
   * @param {object} authRepository
   * @param {object} eventBus
   * @param {object} hashService  - { hash(plain), compare(plain, hash) }
   * @param {object} tokenService - { sign(payload) }
   */
  constructor(authRepository, eventBus, hashService, tokenService, oauthService) {
    this.#repo = authRepository;
    this.#eventBus = eventBus;
    this.#hash = hashService;
    this.#token = tokenService;
    this.#oauth = oauthService;
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

  #issueAuthResult(user) {
    const token = this.#token.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.#buildUserPublic(user),
      token,
    };
  }

  #emitSocialLifecycle(user, isNewUser) {
    if (isNewUser) {
      this.#eventBus.emit('user.registered', {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      });
    }

    this.#eventBus.emit('user.login', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  getFacebookAuthorizationUrl = ({ state, redirectUri }) =>
    this.#oauth.buildFacebookAuthorizationUrl({ state, redirectUri });

  getAppleAuthorizationUrl = ({ state, redirectUri }) =>
    this.#oauth.buildAppleAuthorizationUrl({ state, redirectUri });

  #buildPlaceholderPassword = async () => {
    return this.#hash.hash(crypto.randomUUID());
  };

  #ensureOAuthEmail(profile) {
    if (!profile.email) {
      throw new AppError(
        'Tài khoản mạng xã hội của bạn chưa chia sẻ email. Vui lòng dùng email/password hoặc chọn tài khoản khác.',
        400,
        'OAUTH_EMAIL_REQUIRED'
      );
    }
  }

  #resolveDisplayName(profile) {
    return profile.fullName || profile.email.split('@')[0];
  }

  #linkOrCreateOAuthUser = async (profile) => {
    const existingIdentity = await this.#repo.findOAuthIdentity(profile.provider, profile.providerUserId);
    if (existingIdentity) {
      await this.#repo.touchOAuthIdentity(existingIdentity.id, profile.email);
      const user = await this.#repo.updateLastLogin(existingIdentity.user_id);
      if (!user) throw new AppError('Không thể cập nhật phiên đăng nhập', 500, 'UPDATE_LOGIN_FAILED');
      return { user, isNewUser: false };
    }

    this.#ensureOAuthEmail(profile);

    let user = await this.#repo.findPublicByEmail(profile.email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await this.#repo.createOAuthUser({
        email: profile.email,
        passwordHash: await this.#buildPlaceholderPassword(),
        fullName: this.#resolveDisplayName(profile),
        avatarUrl: profile.avatarUrl,
      });
    }

    await this.#repo.createOAuthIdentity({
      userId: user.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      providerEmail: profile.email,
    });

    user = await this.#repo.updateLastLogin(user.id);
    return { user, isNewUser };
  };

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

    this.#eventBus.emit('user.registered', {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });

    return this.#issueAuthResult(user);
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

    this.#eventBus.emit('user.login', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return this.#issueAuthResult(updatedUser);
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

  loginWithFacebook = async ({ code, redirectUri }) => {
    const profile = await this.#oauth.getFacebookProfile({ code, redirectUri });
    const { user, isNewUser } = await this.#linkOrCreateOAuthUser(profile);
    this.#emitSocialLifecycle(user, isNewUser);
    return this.#issueAuthResult(user);
  };

  loginWithApple = async ({ code, idToken, redirectUri, user }) => {
    const profile = await this.#oauth.getAppleProfile({ code, idToken, redirectUri, user });
    const { user: localUser, isNewUser } = await this.#linkOrCreateOAuthUser(profile);
    this.#emitSocialLifecycle(localUser, isNewUser);
    return this.#issueAuthResult(localUser);
  };
}

module.exports = AuthService;
