/** Băm và so mật khẩu bằng bcrypt. Muốn đổi thuật toán (vd. argon2) chỉ sửa file này. */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

class HashService {
  async hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}

export default new HashService();