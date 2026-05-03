/**
 * appLocals — Quản lý app.locals tập trung
 *
 * Container gọi setAuthService(authService) sau khi tạo instance
 * Controller truy cập qua req.app.locals.authService
 *
 * QUY TẮC: KHÔNG dùng global variable, chỉ qua app.locals
 */

let _authService = null;

const setAuthService = (service) => {
  _authService = service;
};

const getAuthService = () => {
  if (!_authService) {
    throw new Error('authService chưa được khởi tạo trong container.js');
  }
  return _authService;
};

// Export hàm để gắn vào app.locals
const attachToApp = (app) => {
  app.locals.authService = _authService;
};

module.exports = { setAuthService, getAuthService, attachToApp };
