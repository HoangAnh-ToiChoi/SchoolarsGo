/**
 * TokenService — Dịch vụ quản lý JWT
 *
 * Tách riêng khỏi AuthService (SRP): nếu đổi cơ chế xác thực
 * (JWT → session/cookie, hoặc đổi thư viện), chỉ cần sửa file này.
 *
 * Được inject vào AuthService qua constructor (DIP).
 */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

class TokenService {
  /**
   * Tạo JWT token.
   * @param {{ id: string, email: string, role: string }} payload
   * @returns {string}
   */
  sign(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('JWT_SECRET env var is required', 500);
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}

module.exports = TokenService;
