// Sentry là dịch vụ bên thứ ba: link đặt lại mật khẩu (/resetPassword?token=…) không được rời trình duyệt
const SENTRY_MASK = '[ẩn]';
const TOKEN_IN_URL = /([?&](?:token|access_token|refresh_token|code)=)[^&#\s]*/gi;
const BREADCRUMB_URL_KEYS = ['url', 'from', 'to'];

export function scrubUrl(url) {
  if (typeof url !== 'string') return url;
  return url.replace(TOKEN_IN_URL, `$1${SENTRY_MASK}`);
}

/** beforeSend: URL trang và Referer có thể chứa token. */
export function scrubSentryEvent(event) {
  const request = event.request;
  if (!request) return event;
  request.url = scrubUrl(request.url);
  if (request.headers?.Referer) request.headers.Referer = scrubUrl(request.headers.Referer);
  return event;
}

/** beforeBreadcrumb: điều hướng (from/to) và fetch/xhr (url) ghi lại URL đầy đủ. */
export function scrubBreadcrumb(breadcrumb) {
  const data = breadcrumb.data;
  if (!data) return breadcrumb;
  for (const key of BREADCRUMB_URL_KEYS) {
    if (data[key]) data[key] = scrubUrl(data[key]);
  }
  return breadcrumb;
}
