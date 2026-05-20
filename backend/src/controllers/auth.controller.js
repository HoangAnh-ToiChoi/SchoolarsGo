const { success } = require('../utils/responseHelper');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
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
    res.cookie('token', token, COOKIE_OPTIONS);
  }

  #clearAuthCookie(res) {
    res.clearCookie('token', { path: '/' });
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
