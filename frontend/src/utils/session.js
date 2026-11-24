import { ROUTES } from './routes.js';

/**
 * URL trang đăng nhập khi phiên hết hạn. `pathname` của trình duyệt có cả base (`/SchoolarsGo/`)
 * còn router đã gắn `basename`: phải bỏ base khỏi `redirect`, nếu không sẽ về `/SchoolarsGo/SchoolarsGo/...`.
 */
export function buildLoginUrl({ base, pathname, search, code }) {
  const basePath = base.replace(/\/$/, '');
  const insideBase = basePath && pathname.startsWith(`${basePath}/`);
  const appPath = insideBase ? pathname.slice(basePath.length) : pathname;
  const redirect = encodeURIComponent(`${appPath}${search}`);
  const reason = code === 'SESSION_REVOKED' ? '&reason=SESSION_REVOKED' : '';
  return `${basePath}${ROUTES.login}?redirect=${redirect}${reason}`;
}
