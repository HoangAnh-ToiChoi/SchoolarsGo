// Hằng số của tính năng đọc CV (POST /profile/cv)

const CV_MAX_FILE_SIZE = 5 * 1024 * 1024;
const CV_UPLOAD_FIELD = 'file';
const CV_FILE_NAME_PATTERN = /\.(pdf|docx)$/i;
const CV_FILE_NAME_ERROR = 'CV chỉ nhận file .pdf hoặc .docx';

const CV_MIME = Object.freeze({
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

const CV_READ_TIMEOUT_MS = 10000;
const CV_AI_TIMEOUT_MS = 20000;
const CV_MIN_TEXT_LENGTH = 50;
const CV_MAX_TEXT_LENGTH = 20000;
const CV_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Thẻ bọc chữ CV trong prompt; chữ CV bị bỏ các thẻ này để không thoát khỏi khối dữ liệu
const CV_TAG_OPEN = '<cv>';
const CV_TAG_CLOSE = '</cv>';

const CV_GENERATION_CONFIG = Object.freeze({ responseMimeType: 'application/json', temperature: 0 });

// Tên lỗi thư viện pdfjs (unpdf) ném khi PDF hỏng, thiếu hoặc có mật khẩu
const CV_FILE_ERROR_NAMES = Object.freeze(['InvalidPDFException', 'MissingPDFException', 'FormatError', 'PasswordException']);

// Luật kiểm tra bản nháp AI trả về
const CV_DEGREES = Object.freeze(['Bachelor', 'Master', 'PhD']);
const CV_MAX_CERTIFICATES = 10;
const CV_CERTIFICATE_TYPE_MAX = 20;
const CV_CERTIFICATE_SCORE_MAX = 120;
const CV_MAJOR_MAX = 100;
const CV_EXPERIENCE_MAX = 2000;
const CV_IELTS_NAME = 'ielts';
const CV_IELTS_MAX_SCORE = 9;
const GPA_TARGET_SCALE = 4;
const GPA_DECIMALS = 2;

// Xóa thông tin liên hệ trước khi gửi chữ CV cho AI bên ngoài. Mỗi mẫu chỉ dùng lượng từ đơn giản, không lồng nhau, để chuỗi dài không làm regex chạy mãi
const CV_HIDDEN_MARK = '[ẩn]';
const CV_CONTACT_PATTERNS = Object.freeze([
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  /(?:https?:\/\/|www\.)\S+/gi,
  /\b(?:linkedin|facebook|github|twitter|instagram|zalo)\.\S+/gi,
  /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}/g,
  /^.*(?:địa chỉ|address)\s*:.*$/gim,
]);

export {
  CV_MAX_FILE_SIZE, CV_UPLOAD_FIELD, CV_FILE_NAME_PATTERN, CV_FILE_NAME_ERROR, CV_MIME,
  CV_READ_TIMEOUT_MS, CV_AI_TIMEOUT_MS, CV_MIN_TEXT_LENGTH, CV_MAX_TEXT_LENGTH, CV_RATE_WINDOW_MS,
  CV_TAG_OPEN, CV_TAG_CLOSE, CV_GENERATION_CONFIG,
  CV_DEGREES, CV_MAX_CERTIFICATES, CV_CERTIFICATE_TYPE_MAX, CV_CERTIFICATE_SCORE_MAX, CV_MAJOR_MAX, CV_EXPERIENCE_MAX,
  CV_IELTS_NAME, CV_IELTS_MAX_SCORE, GPA_TARGET_SCALE, GPA_DECIMALS,
  CV_HIDDEN_MARK, CV_CONTACT_PATTERNS, CV_FILE_ERROR_NAMES,
};
