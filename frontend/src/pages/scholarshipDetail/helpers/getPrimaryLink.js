import { safeUrl } from '~/utils/security.js';

/**
 * Xác định liên kết chính (primary) và liên kết phụ (bài đăng gốc) cho học bổng.
 * - Ưu tiên application_url (Nộp hồ sơ ngay).
 * - Nếu không có application_url thì dùng source_url (Xem bài đăng gốc).
 * - Nếu cả hai đều không hợp lệ: Tạo đơn ứng tuyển (href = null, isExternal = false).
 * - safeUrl được tính duy nhất một lần cho mỗi trường URL.
 * - showSourceLink: chỉ hiển thị khi có sourceUrl và primary.href khác sourceUrl.
 */
export function getPrimaryLink(scholarship) {
  const applyUrl = safeUrl(scholarship?.application_url) ?? null;
  const sourceUrl = safeUrl(scholarship?.source_url) ?? null;

  let primary;
  if (applyUrl) {
    primary = {
      label: 'Nộp hồ sơ ngay',
      href: applyUrl,
      isExternal: true,
    };
  } else if (sourceUrl) {
    primary = {
      label: 'Xem bài đăng gốc',
      href: sourceUrl,
      isExternal: true,
    };
  } else {
    primary = {
      label: 'Tạo đơn ứng tuyển',
      href: null,
      isExternal: false,
    };
  }

  const showSourceLink = Boolean(sourceUrl && primary.href !== sourceUrl);

  return {
    ...primary,
    primary,
    sourceUrl,
    showSourceLink,
  };
}
