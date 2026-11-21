// Kiểm tra định dạng và kích thước tệp upload (tối đa 10MB)
export function validateDocumentFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'],
  } = options;

  if (!file) return { valid: false, error: 'Vui lòng chọn một tệp.' };
  if (file.size > maxSize) return { valid: false, error: 'Dung lượng tệp vượt quá 10MB.' };
  const ext = '.' + (file.name || '').split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận .pdf, .doc, .docx, .txt.',
    };
  }
  return { valid: true, error: null };
}
