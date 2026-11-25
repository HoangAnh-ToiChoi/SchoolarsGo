// Sentry là dịch vụ bên thứ ba: không gửi cookie phiên, token, mật khẩu (kể cả trong body request lỗi 5xx)
const SENTRY_MASK = '[ẩn]';
const SENTRY_SENSITIVE_HEADERS = ['cookie', 'set-cookie', 'authorization', 'x-refresh-token'];
const SENTRY_SENSITIVE_FIELD = /pass(word)?|token|secret|otp|api[_-]?key/i;
const SENTRY_TOKEN_IN_URL = /([?&](?:token|access_token|refresh_token|code)=)[^&#\s]*/gi;

export { SENTRY_MASK, SENTRY_SENSITIVE_HEADERS, SENTRY_SENSITIVE_FIELD, SENTRY_TOKEN_IN_URL };
