const { success } = require('../utils/responseHelper');
const crypto = require('crypto');

const buildCookieOptions = (maxAge) => {
  const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
  const options = {
    httpOnly: true,
    secure: sameSite === 'none' ? true : process.env.NODE_ENV === 'production',
    sameSite,
    maxAge,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

const buildClearCookieOptions = () => {
  const options = buildCookieOptions(0);
  delete options.maxAge;
  return options;
};

class AuthController {
  #service;

  constructor(authService) {
    this.#service = authService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('AuthService is required');
  }

  #setAuthCookie(res, token) {
    res.cookie('token', token, buildCookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  #clearAuthCookie(res) {
    res.clearCookie('token', buildClearCookieOptions());
  }

  #setOAuthCookie(res, name, value) {
    res.cookie(name, value, buildCookieOptions(10 * 60 * 1000));
  }

  #clearOAuthCookie(res, name) {
    res.clearCookie(name, buildClearCookieOptions());
  }

  #getBackendUrl(req) {
    if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
  }

  #getFrontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  }

  #buildFrontendRedirectUrl(params = {}) {
    const url = new URL(`${this.#getFrontendUrl()}/oauth/complete`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  }

  #redirectOAuthFailure(res, provider, error) {
    const message = error?.isOperational
      ? error.message
      : 'Đăng nhập mạng xã hội thất bại. Vui lòng thử lại.';
    return res.redirect(this.#buildFrontendRedirectUrl({ provider, error: message }));
  }

  #parseAppleUser(rawUser) {
    if (!rawUser) return null;
    if (typeof rawUser === 'object') return rawUser;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

  register = async (req, res, next) => {
    try {
      const { email, password, full_name } = req.body;
      const { user, token } = await this.#service.register(email, password, full_name);
      this.#setAuthCookie(res, token);
      return success(res, { user }, 'Đăng ký thành công');
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.#service.login(email, password);
      this.#setAuthCookie(res, token);
      return success(res, { user }, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  };

  startFacebookOAuth = async (req, res) => {
    try {
      const stateValue = crypto.randomBytes(24).toString('hex');
      this.#setOAuthCookie(res, 'oauth_state_facebook', stateValue);
      const redirectUri = `${this.#getBackendUrl(req)}/api/auth/oauth/facebook/callback`;
      const url = this.#service.getFacebookAuthorizationUrl({ state: stateValue, redirectUri });
      return res.redirect(url);
    } catch (error) {
      return this.#redirectOAuthFailure(res, 'facebook', error);
    }
  };

  facebookCallback = async (req, res) => {
    try {
      const state = req.query.state;
      const expectedState = req.cookies?.oauth_state_facebook;
      if (!state || !expectedState || state !== expectedState) {
        throw Object.assign(new Error('Phiên xác thực Facebook không hợp lệ hoặc đã hết hạn'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      if (req.query.error) {
        throw Object.assign(new Error(req.query.error_description || 'Bạn đã hủy đăng nhập Facebook'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      const redirectUri = `${this.#getBackendUrl(req)}/api/auth/oauth/facebook/callback`;
      const { user, token } = await this.#service.loginWithFacebook({
        code: req.query.code,
        redirectUri,
      });

      this.#setAuthCookie(res, token);
      this.#clearOAuthCookie(res, 'oauth_state_facebook');
      return res.redirect(this.#buildFrontendRedirectUrl({ provider: 'facebook', success: '1', email: user.email }));
    } catch (error) {
      this.#clearOAuthCookie(res, 'oauth_state_facebook');
      return this.#redirectOAuthFailure(res, 'facebook', error);
    }
  };

  startAppleOAuth = async (req, res) => {
    try {
      const state = crypto.randomBytes(24).toString('hex');
      this.#setOAuthCookie(res, 'oauth_state_apple', state);
      const redirectUri = `${this.#getBackendUrl(req)}/api/auth/oauth/apple/callback`;
      const url = this.#service.getAppleAuthorizationUrl({ state, redirectUri });
      return res.redirect(url);
    } catch (error) {
      return this.#redirectOAuthFailure(res, 'apple', error);
    }
  };

  appleCallback = async (req, res) => {
    try {
      const payload = req.method === 'POST' ? req.body : req.query;
      const state = payload.state;
      const expectedState = req.cookies?.oauth_state_apple;

      if (!state || !expectedState || state !== expectedState) {
        throw Object.assign(new Error('Phiên xác thực Apple không hợp lệ hoặc đã hết hạn'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      if (payload.error) {
        throw Object.assign(new Error(payload.error_description || 'Bạn đã hủy đăng nhập Apple ID'), {
          statusCode: 400,
          isOperational: true,
        });
      }

      const redirectUri = `${this.#getBackendUrl(req)}/api/auth/oauth/apple/callback`;
      const { user, token } = await this.#service.loginWithApple({
        code: payload.code,
        idToken: payload.id_token,
        redirectUri,
        user: this.#parseAppleUser(payload.user),
      });

      this.#setAuthCookie(res, token);
      this.#clearOAuthCookie(res, 'oauth_state_apple');
      return res.redirect(this.#buildFrontendRedirectUrl({ provider: 'apple', success: '1', email: user.email }));
    } catch (error) {
      this.#clearOAuthCookie(res, 'oauth_state_apple');
      return this.#redirectOAuthFailure(res, 'apple', error);
    }
  };

  me = async (req, res, next) => {
    try {
      const user = await this.#service.getMe(req.user.id);
      return success(res, user);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      this.#clearAuthCookie(res);
      return success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const token = await this.#service.refreshToken(req.user.id);
      this.#setAuthCookie(res, token);
      return success(res, null, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      await this.#service.forgotPassword(req.body.email);
      return success(res, null, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      await this.#service.resetPassword(req.body.token, req.body.password);
      return success(res, null, 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;
