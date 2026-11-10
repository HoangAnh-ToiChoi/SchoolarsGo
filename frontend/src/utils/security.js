import DOMPurify from 'dompurify';

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

// Chống XSS qua link: dữ liệu học bổng/tin tức được cào từ web ngoài nên có thể chứa
// "javascript:..." trong URL. Chỉ cho phép http, https, mailto; còn lại trả về undefined.
export function safeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  try {
    const parsed = new URL(url.trim(), window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

// Chống XSS khi buộc phải render HTML: chỉ giữ các thẻ được liệt kê, bỏ toàn bộ thuộc tính
export function sanitizeHtml(html, allowedTags = ['strong', 'em', 'br', 'p', 'ul', 'ol', 'li']) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: [] });
}
