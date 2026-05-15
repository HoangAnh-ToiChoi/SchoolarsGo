const { success } = require('../utils/responseHelper');

class AuthController {
  #service;

  constructor(authService) {
    this.#service = authService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('AuthService is required');
  }

  register = async (req, res, next) => {
    try {
      const { email, password, full_name } = req.body;
      const result = await this.#service.register(email, password, full_name);
      return success(res, result, 'Đăng ký thành công');
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.#service.login(email, password);
      return success(res, result, 'Đăng nhập thành công');
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
      return success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const token = await this.#service.refreshToken(req.user.id);
      return success(res, { token }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;
