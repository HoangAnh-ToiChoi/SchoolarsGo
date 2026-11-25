import {
  SENTRY_MASK,
  SENTRY_SENSITIVE_FIELD,
  SENTRY_SENSITIVE_HEADERS,
  SENTRY_TOKEN_IN_URL,
} from '~/constants/sentry.js';

function scrubUrl(value) {
  if (typeof value !== 'string') return value;
  return value.replace(SENTRY_TOKEN_IN_URL, `$1${SENTRY_MASK}`);
}

function scrubHeaders(headers) {
  const kept = {};
  for (const [name, value] of Object.entries(headers)) {
    const isSensitive = SENTRY_SENSITIVE_HEADERS.includes(name.toLowerCase());
    kept[name] = isSensitive ? SENTRY_MASK : value;
  }
  return kept;
}

function scrubFields(value) {
  if (Array.isArray(value)) return value.map(scrubFields);
  if (!value || typeof value !== 'object') return value;
  const kept = {};
  for (const [key, field] of Object.entries(value)) {
    kept[key] = SENTRY_SENSITIVE_FIELD.test(key) ? SENTRY_MASK : scrubFields(field);
  }
  return kept;
}

// Sentry Node ghi body dạng chuỗi thô: JSON thì che từng trường, chuỗi khác (form, text) thì che cả
function scrubBody(data) {
  if (typeof data !== 'string') return scrubFields(data);
  try {
    const parsed = JSON.parse(data);
    return JSON.stringify(scrubFields(parsed));
  } catch {
    return SENTRY_MASK;
  }
}

function scrubQuery(query) {
  if (typeof query !== 'string') return scrubFields(query);
  const scrubbed = scrubUrl(`&${query}`);
  return scrubbed.slice(1);
}

/** beforeSend của Sentry: bỏ cookie, che header đăng nhập, token trong URL và trường nhạy cảm trong body. */
function scrubSentryEvent(event) {
  const request = event.request;
  if (!request) return event;

  delete request.cookies;
  if (request.headers) request.headers = scrubHeaders(request.headers);
  if (request.data) request.data = scrubBody(request.data);
  if (request.query_string) request.query_string = scrubQuery(request.query_string);
  request.url = scrubUrl(request.url);
  return event;
}

export { scrubSentryEvent };
