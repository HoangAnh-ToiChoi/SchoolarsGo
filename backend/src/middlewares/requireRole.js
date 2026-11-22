/** Chặn người dùng không có role được phép (dùng sau middleware auth). */

import { AppError, authorization } from '~/constants/errors.js';

const requireRole = role => (req, res, next) => {
  if (!req.user) {
    return next(new AppError(authorization.LOGIN_REQUIRED));
  }

  if (req.user.role !== role) {
    return next(new AppError(authorization.FORBIDDEN));
  }

  next();
};

export default requireRole;