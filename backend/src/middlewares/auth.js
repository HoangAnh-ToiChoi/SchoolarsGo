const jwt = require('jsonwebtoken');

/**
 * Trích xuất JWT token từ cookie hoặc Authorization header.
 * Dùng chung cho cả auth() và optionalAuth() — tránh trùng lặp.
 *
 * @param {import('express').Request} req
 * @returns {string|null} Token string hoặc null nếu không tìm thấy
 */
const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
};

const auth = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục',
        code: 401,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: uuid, email: string }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        code: 401,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      code: 401,
    });
  }
};

// Middleware optional auth — gắn user nếu có token, không thì bỏ qua
const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};

module.exports = { auth, optionalAuth };
