/**
 * HashService — Dịch vụ băm mật khẩu
 *
 * Tách riêng khỏi AuthService (SRP): nếu đổi thuật toán hash
 * (bcrypt → argon2), chỉ cần sửa file này.
 *
 * Được inject vào AuthService qua constructor (DIP).
 */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

class HashService {
  /**
   * Băm mật khẩu plaintext.
   * @param {string} plain
   * @returns {Promise<string>}
   */
  hash = async (plain) => {
    return bcrypt.hash(plain, SALT_ROUNDS);
  };

  /**
   * So sánh mật khẩu plaintext với hash.
   * @param {string} plain
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  compare = async (plain, hash) => {
    return bcrypt.compare(plain, hash);
  };
}

module.exports = HashService;
