/**
 * AuthController — TẦNG 3: HTTP Handler
 *
 * Mục đích: Nhận req/res từ Express route, gọi AuthService, đẩy lỗi qua next(error)
 * Quy tắc: Dùng Arrow Functions để giữ `this`, KHÔNG tự xử lý lỗi
 * Pattern: Export CLASS, container tạo instance với DI
 */

const { success } = require('../utils/responseHelper');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/register
   * Body: { email, password, full_name }
   */
  register = async (req, res, next) => {
    try {
      const { email, password, full_name } = req.body;
      const result = await this.authService.register(email, password, full_name);
      return success(res, result, 'Đăng ký thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      return success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Headers: Authorization: Bearer <token>
   */
  me = async (req, res, next) => {
    try {
      const user = await this.authService.getMe(req.user.id);
      return success(res, user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Xoá token phía client (httpOnly cookie đã được clear ở middleware/client)
   */
  logout = async (req, res, next) => {
    try {
      return success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/refresh
   * Headers: Authorization: Bearer <token>
   */
  refresh = async (req, res, next) => {
    try {
      const token = await this.authService.refreshToken(req.user.id);
      return success(res, { token }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;
