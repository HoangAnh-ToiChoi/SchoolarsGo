const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Lấy token từ Authorization header hoặc cookie
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

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
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
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
