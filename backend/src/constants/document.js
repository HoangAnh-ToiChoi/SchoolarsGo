// Hằng số của tài liệu người dùng (document.service, storage.service)

const DOCUMENT_VALID_TYPES = Object.freeze(['cv', 'sop', 'transcript', 'recommendation_letter', 'other']);

// Bucket private: production tạo trên Dashboard, migration 013 đặt public = false
const DOCUMENT_BUCKET = 'documents';

// Link tải tài liệu ký có hạn; FE tải lại danh sách (đổi trang, focus lại tab) là có link mới
const DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

const DOCUMENT_MIME = Object.freeze({
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
});

// file-type nhận .doc (Word 97–2003) là vùng chứa OLE chung "application/x-cfb"
const DOCUMENT_DETECTED_MIME_ALIAS = Object.freeze({ 'application/x-cfb': DOCUMENT_MIME.DOC });

const WORD_FILES = [DOCUMENT_MIME.PDF, DOCUMENT_MIME.DOC, DOCUMENT_MIME.DOCX];

// Loại nội dung thật (đọc từ byte đầu) được nhận theo loại tài liệu; khớp đuôi file ở middlewares/upload.js
const DOCUMENT_ALLOWED_MIME_BY_TYPE = Object.freeze({
  transcript: [DOCUMENT_MIME.PDF],
  recommendation_letter: [DOCUMENT_MIME.PDF],
  cv: WORD_FILES,
  sop: WORD_FILES,
  other: [...WORD_FILES, DOCUMENT_MIME.PNG, DOCUMENT_MIME.JPEG],
});

// Đường dẫn trong URL công khai cũ (trước 013): .../storage/v1/object/public/documents/<userId>/<type>/<file>
const DOCUMENT_PUBLIC_URL_PATH = /\/storage\/v1\/object\/public\/documents\/(.+)$/;

export {
  DOCUMENT_VALID_TYPES,
  DOCUMENT_BUCKET,
  DOCUMENT_SIGNED_URL_TTL_SECONDS,
  DOCUMENT_MIME,
  DOCUMENT_DETECTED_MIME_ALIAS,
  DOCUMENT_ALLOWED_MIME_BY_TYPE,
  DOCUMENT_PUBLIC_URL_PATH,
};
