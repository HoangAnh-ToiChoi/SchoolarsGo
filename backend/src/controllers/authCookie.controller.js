import { getCookieSameSite } from '~/configs/jwt.config.js';

const ACCESS_PATH = '/api';
const REFRESH_PATH = '/api/auth';
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 86400000;

/**
 * AuthCookieController — đặt và xóa cookie đăng nhập (httpOnly, token không lộ cho JavaScript của FE).
 * Chỉ làm việc với res; không nghiệp vụ. Dùng chung cho đăng ký, đăng nhập, làm mới phiên, đăng xuất.
 */
class AuthCookieController {
  /** Đặt cookie accessToken (15 phút) và refreshToken (7 ngày). */
  set(res, { accessToken, refreshToken }) {
    res.cookie('accessToken', accessToken, this.#options(ACCESS_PATH, ACCESS_MAX_AGE));
    res.cookie('refreshToken', refreshToken, this.#options(REFRESH_PATH, REFRESH_MAX_AGE));
  }

  /** Xóa cookie đăng nhập, gồm cả cookie `token` của bản cũ. */
  clear(res) {
    res.clearCookie('accessToken', this.#options(ACCESS_PATH, 0));
    res.clearCookie('refreshToken', this.#options(REFRESH_PATH, 0));
    res.clearCookie('token', { path: '/' });
  }

  #options(path, maxAge) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: getCookieSameSite(),
      maxAge,
      path,
    };
  }
}

export default new AuthCookieController();
