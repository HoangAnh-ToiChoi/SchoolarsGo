/** Chặn người dùng không có role được phép (dùng sau middleware auth). */

import AppError from '~/utils/AppError.js';

const requireRole = role => (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Vui lòng đăng nhập để tiếp tục', 'UNAUTHORIZED'));
  }

  if (req.user.role !== role) {
    return next(AppError.forbidden('Không có quyền truy cập', 'FORBIDDEN'));
  }

  next();
};

export default requireRole;