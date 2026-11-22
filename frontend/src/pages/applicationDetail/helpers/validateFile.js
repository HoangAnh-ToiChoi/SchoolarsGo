import { ACCEPTED_FILES, MAX_FILE_MB } from '../constants';

export function validateFile(file) {
  const ext = `.${file.name.split('.').pop().toLowerCase()}`;
  if (!ACCEPTED_FILES.split(',').includes(ext)) return 'Chỉ nhận tệp PDF, DOC, DOCX hoặc TXT';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Tệp lớn hơn ${MAX_FILE_MB}MB`;
  return null;
}
