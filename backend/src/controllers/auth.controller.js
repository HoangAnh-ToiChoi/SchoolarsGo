const authService = require('../services/auth.service');
const { success, created } = require('../utils/responseHelper');

const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const result = await authService.register(email, password, full_name);
    return created(res, { user: result.user, token: result.token }, 'Đăng ký thành công');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, { user: result.user, token: result.token }, 'Đăng nhập thành công');
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  return success(res, null, 'Đăng xuất thành công');
};

const refresh = async (req, res, next) => {
  try {
    const token = await authService.refreshToken(req.user.id);
    return success(res, { token }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me, logout, refresh };
