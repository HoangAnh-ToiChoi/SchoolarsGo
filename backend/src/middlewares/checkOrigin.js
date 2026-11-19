import AppError from '~/utils/AppError.js';
import { isAllowedOrigin } from '~/configs/cors.config.js';
import { authorization } from '~/constants/errors.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const checkOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (!WRITE_METHODS.has(req.method) || !origin) return next();
  if (isAllowedOrigin(origin)) return next();
  return next(new AppError(authorization.ORIGIN_NOT_ALLOWED));
};

export default checkOrigin;