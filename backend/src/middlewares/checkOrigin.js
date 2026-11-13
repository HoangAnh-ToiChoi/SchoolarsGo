const AppError = require('../utils/AppError');
const { isAllowedOrigin } = require('../config/cors.config');
const { authorization } = require('../constants/errors');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const checkOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (!WRITE_METHODS.has(req.method) || !origin) return next();
  if (isAllowedOrigin(origin)) return next();
  return next(new AppError(authorization.ORIGIN_NOT_ALLOWED));
};

module.exports = checkOrigin;
