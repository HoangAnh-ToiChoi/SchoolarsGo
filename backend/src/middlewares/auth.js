const AppError = require('../utils/AppError');
const { authorization } = require('../constants/errors');

const extractToken = req => {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) return authorization.slice(7);
  return req.cookies?.accessToken || null;
};

let tokenService;
const getTokenService = () => {
  if (!tokenService) tokenService = new (require('../services/token.service'))();
  return tokenService;
};

const auth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError(authorization.ACCESS_TOKEN_MISSING);
    const { sub, sid, role } = getTokenService().verifyAccess(token);
    req.user = { id: sub, sid, role };
    return next();
  } catch (error) {
    return next(error);
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const { sub, sid, role } = getTokenService().verifyAccess(token);
      req.user = { id: sub, sid, role };
    }
  } catch (_error) {
    req.user = undefined;
  }
  return next();
};

module.exports = { auth, optionalAuth, extractToken };
