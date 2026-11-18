import { success } from '#utils/responseHelper.js';
import authService from '#services/auth.service.js';
import authCookieController from '#controllers/authCookie.controller.js';

class AuthController {
  async register(req, res) {
    const result = await authService.register(req.body.email, req.body.password, req.body.full_name, req.get('user-agent'));
    authCookieController.set(res, result);
    return success(res, { user: result.user }, 'Đăng ký thành công');
  }

  async login(req, res) {
    const result = await authService.login(req.body.email, req.body.password, req.get('user-agent'));
    authCookieController.set(res, result);
    return success(res, { user: result.user }, 'Đăng nhập thành công');
  }

  async me(req, res) {
    return success(res, await authService.getMe(req.user.id));
  }

  async account(req, res) {
    return success(res, await authService.getAccount(req.user.id));
  }

  async sessions(req, res) {
    return success(res, await authService.listSessions(req.user.id, req.user.sid));
  }

  async endSession(req, res) {
    await authService.endSession(req.user.id, req.params.id);
    return success(res, null, 'Đã đăng xuất thiết bị');
  }

  async logout(req, res) {
    await authService.logout(req.cookies?.refreshToken);
    authCookieController.clear(res);
    return success(res, null, 'Đăng xuất thành công');
  }

  async refresh(req, res) {
    const result = await authService.refresh(req.cookies?.refreshToken);
    authCookieController.set(res, result);
    return success(res, { user: result.user }, 'Phiên đăng nhập đã được làm mới');
  }

  async forgotPassword(req, res) {
    await authService.forgotPassword(req.body.email);
    return success(res, null, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.');
  }

  async resetPassword(req, res) {
    await authService.resetPassword(req.body.token, req.body.password);
    authCookieController.clear(res);
    return success(res, null, 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.');
  }
}

export default new AuthController();