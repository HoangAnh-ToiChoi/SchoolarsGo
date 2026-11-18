const { success } = require('../utils/responseHelper');
const { getCookieSameSite } = require('../config/jwt.config');

const cookieOptions = (path, maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: getCookieSameSite(),
  maxAge,
  path,
});

class AuthController {
  #service;

  constructor(authService) {
    this.#service = authService;
  }

  #setAuthCookies(res, { accessToken, refreshToken }) {
    res.cookie('accessToken', accessToken, cookieOptions('/api', 15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions('/api/auth', 7 * 86400000));
  }

  #clearAuthCookies(res) {
    res.clearCookie('accessToken', cookieOptions('/api', 0));
    res.clearCookie('refreshToken', cookieOptions('/api/auth', 0));
    res.clearCookie('token', { path: '/' });
  }

  async register(req, res, next) {
    try {
      const result = await this.#service.register(req.body.email, req.body.password, req.body.full_name, req.get('user-agent'));
      this.#setAuthCookies(res, result);
      return success(res, { user: result.user }, 'Đăng ký thành công');
    } catch (error) { next(error); }
  }

  async login(req, res, next) {
    try {
      const result = await this.#service.login(req.body.email, req.body.password, req.get('user-agent'));
      this.#setAuthCookies(res, result);
      return success(res, { user: result.user }, 'Đăng nhập thành công');
    } catch (error) { next(error); }
  }

  async me(req, res, next) {
    try { return success(res, await this.#service.getMe(req.user.id)); }
    catch (error) { next(error); }
  }

  async account(req, res, next) {
    try { return success(res, await this.#service.getAccount(req.user.id)); }
    catch (error) { next(error); }
  }

  async sessions(req, res, next) {
    try { return success(res, await this.#service.listSessions(req.user.id, req.user.sid)); }
    catch (error) { next(error); }
  }

  async endSession(req, res, next) {
    try {
      await this.#service.endSession(req.user.id, req.params.id);
      return success(res, null, 'Đã đăng xuất thiết bị');
    } catch (error) { next(error); }
  }

  async logout(req, res, next) {
    try {
      await this.#service.logout(req.cookies?.refreshToken);
      this.#clearAuthCookies(res);
      return success(res, null, 'Đăng xuất thành công');
    } catch (error) { next(error); }
  }

  async refresh(req, res, next) {
    try {
      const result = await this.#service.refresh(req.cookies?.refreshToken);
      this.#setAuthCookies(res, result);
      return success(res, { user: result.user }, 'Phiên đăng nhập đã được làm mới');
    } catch (error) { next(error); }
  }

  async forgotPassword(req, res, next) {
    try {
      await this.#service.forgotPassword(req.body.email);
      return success(res, null, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.');
    } catch (error) { next(error); }
  }

  async resetPassword(req, res, next) {
    try {
      await this.#service.resetPassword(req.body.token, req.body.password);
      this.#clearAuthCookies(res);
      return success(res, null, 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.');
    } catch (error) { next(error); }
  }
}

module.exports = AuthController;
