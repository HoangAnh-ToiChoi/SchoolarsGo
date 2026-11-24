// Luật bảo vệ file, tách khỏi hook để test được.
const LINT_CONFIG = /(^|\/)(\.eslintrc(\.\w+)?|eslint\.config\.\w+|\.prettierrc(\.\w+)?|prettier\.config\.\w+)$/;

/** Trả { action: 'deny' | 'ask', reason } hoặc null nếu cho sửa. */
export function fileDecision(relPath, { existsAtHead }) {
  if (relPath.startsWith('..')) return null;

  if (/(^|\/)\.env(\.(?!example$)[\w]+)?$/.test(relPath)) {
    return { action: 'deny', reason: 'File .env chứa khóa bí mật: người dùng tự sửa, Claude không đọc/ghi.' };
  }

  if (relPath.startsWith('vendor/')) {
    return { action: 'deny', reason: 'vendor/ là submodule của repo ngoài: không sửa tại chỗ, chép phần cần dùng sang .claude/ rồi chỉnh.' };
  }

  if (LINT_CONFIG.test(relPath)) {
    return { action: 'ask', reason: 'Sửa cấu hình lint/format: thường nên sửa code cho qua lint thay vì nới luật. Người dùng xác nhận?' };
  }

  if (/^backend\/scripts\/migrations\/.+\.sql$/.test(relPath) && existsAtHead) {
    return {
      action: 'ask',
      reason: 'Migration đã commit có thể đã chạy trên DB: thay đổi schema nên tạo file migration mới (số tiếp theo). Người dùng xác nhận sửa file cũ?',
    };
  }

  return null;
}
