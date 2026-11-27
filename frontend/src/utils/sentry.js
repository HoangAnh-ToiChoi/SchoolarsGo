// Sentry là dịch vụ bên thứ ba: link đặt lại mật khẩu (/resetPassword?token=…) không được rời trình duyệt
const SENTRY_MASK = '[ẩn]';
const TOKEN_IN_URL = /([?&](?:token|access_token|refresh_token|code)=)[^&#\s]*/gi;
const BREADCRUMB_URL_KEYS = ['url', 'from', 'to'];
// Message lỗi render có thể chứa dữ liệu người dùng (email, số điện thoại)
const EMAIL_IN_TEXT = /[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,4}/g;
const PHONE_IN_TEXT = /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}\b/g;

export function scrubUrl(url) {
  if (typeof url !== 'string') return url;
  return url.replace(TOKEN_IN_URL, `$1${SENTRY_MASK}`);
}

export function scrubText(text) {
  if (typeof text !== 'string') return text;
  const noEmail = text.replace(EMAIL_IN_TEXT, SENTRY_MASK);
  return noEmail.replace(PHONE_IN_TEXT, SENTRY_MASK);
}

function scrubRequest(request) {
  request.url = scrubUrl(request.url);
  if (request.headers?.Referer) request.headers.Referer = scrubUrl(request.headers.Referer);
}

function scrubExceptions(exception) {
  for (const value of exception.values || []) {
    value.value = scrubText(value.value);
  }
}

/** beforeSend: URL trang và Referer có thể chứa token; message lỗi có thể chứa email / số điện thoại. */
export function scrubSentryEvent(event) {
  if (event.request) scrubRequest(event.request);
  if (event.exception) scrubExceptions(event.exception);
  if (event.message) event.message = scrubText(event.message);
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
