/**
 * requireRole.js — Middleware kiểm tra quyền truy cập theo role
 *
 * Quy tắc:
 * - Middleware thuần, không cần class
 * - Dùng AppError để throw lỗi cho errorHandler xử lý
 */

const AppError = require('../utils/AppError');

/**
 * Middleware factory — tạo middleware kiểm tra role
 * @param {string} role - Role cần kiểm tra (VD: 'admin')
 * @returns {Function} Express middleware
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Vui lòng đăng nhập để tiếp tục', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== role) {
    return next(new AppError('Không có quyền truy cập', 403, 'FORBIDDEN'));
  }

  next();
};

module.exports = requireRole;
