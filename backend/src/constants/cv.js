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
const CV_CERTIFICATE_LEVEL_MAX = 20;
const CV_BIRTH_YEAR_MIN = 1940;
const CV_BIRTH_YEAR_MAX = new Date().getFullYear();
const CV_MAJOR_MAX = 100;
const CV_EXPERIENCE_MAX = 2000;
const CV_IELTS_NAME = 'ielts';
const CV_IELTS_MAX_SCORE = 9;
const GPA_TARGET_SCALE = 4;
const GPA_DECIMALS = 2;

// Xóa thông tin liên hệ và giấy tờ tùy thân trước khi gửi chữ CV cho AI bên ngoài (R17). Mỗi mẫu chỉ dùng lượng từ đơn giản, không lồng nhau, để chuỗi dài không làm regex chạy mãi
const CV_HIDDEN_MARK = '[ẩn]';
const CV_CONTACT_PATTERNS = Object.freeze([
  // Giới hạn độ dài theo chuẩn email (trước @ ≤ 64, mỗi nhãn tên miền ≤ 63): để không giới hạn thì chuỗi dài không có @ chạy O(n²)
  /[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,8}/g,
  /(?:https?:\/\/|www\.)\S+/gi,
  // Tên miền không có http (vd. ten.github.io, app.vercel.app). Chỉ chữ thường nên "Node.js" và "ASP.NET" không bị ẩn nhầm; độ dài giới hạn để regex không chạy mãi
  /\b[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){0,4}\.(?:com|io|app|dev|vn|me|org)\b\S*/g,
  /\b(?:linkedin|facebook|github|twitter|instagram|zalo)\.\S+/gi,
  // Giấy tờ tùy thân có nhãn: hộ chiếu, CCCD / CMND (không nhãn thì không đoán, dễ ẩn nhầm mã môn học).
  // Đứng trước mẫu số điện thoại: CCCD bắt đầu bằng 0 mà để mẫu điện thoại ăn trước thì lộ chữ số cuối
  /(?:passport|hộ chiếu|cccd|cmnd|căn cước|national id|id card)(?:\s*(?:no\.?|number|số))?\s*:?\s*[A-Z]{0,2}\d{6,12}\b/gi,
  /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}/g,
  // Số điện thoại quốc tế: +1 (415) 555-0134, +44 20 7946 0958
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d){5,10}/g,
  // Email viết tránh bộ lọc: "ten [at] gmail [dot] com", "ten @ gmail . com", "ten at gmail dot com"
  /[\w.+-]{1,64}\s?[[(]\s?at\s?[\])]\s?[\w-]{1,63}(?:\s?[[(]\s?dot\s?[\])]\s?[\w-]{1,63}){1,4}/gi,
  /[\w.+-]{1,64}\s{0,3}@\s{0,3}[\w-]{1,63}(?:\s{0,3}\.\s{0,3}[\w-]{1,63}){1,4}/g,
  /[\w.+-]{1,64}\sat\s[\w-]{1,63}(?:\sdot\s[\w-]{1,63}){1,4}/gi,
  // Dòng địa chỉ: có nhãn + dấu hai chấm, hoặc nhãn rồi tới số nhà ("Address 12 Le Loi")
  /^.*(?<![a-z])(?:địa chỉ|address|addr\.?|add|home)\s*:.*$/gim,
  /^.*(?<![a-z])(?:địa chỉ|address)\s+\d.*$/gim,
]);

// Chỉ ngày sinh có nhãn đi trước mới bị rút về năm (xét điều kiện tuổi chỉ cần năm); các ngày khác như ngày cấp chứng chỉ giữ nguyên
const CV_BIRTH_DATE_PATTERN = /((?:ngày sinh|sinh ngày|date of birth|dob|birthday)\s*:?\s*)\d{1,2}[/.-]\d{1,2}[/.-](\d{4})/gi;

export {
  CV_MAX_FILE_SIZE, CV_UPLOAD_FIELD, CV_FILE_NAME_PATTERN, CV_FILE_NAME_ERROR, CV_MIME,
  CV_READ_TIMEOUT_MS, CV_AI_TIMEOUT_MS, CV_MIN_TEXT_LENGTH, CV_MAX_TEXT_LENGTH, CV_RATE_WINDOW_MS,
  CV_TAG_OPEN, CV_TAG_CLOSE, CV_GENERATION_CONFIG,
  CV_DEGREES, CV_MAX_CERTIFICATES, CV_CERTIFICATE_TYPE_MAX, CV_CERTIFICATE_SCORE_MAX, CV_MAJOR_MAX, CV_EXPERIENCE_MAX,
  CV_CERTIFICATE_LEVEL_MAX, CV_BIRTH_YEAR_MIN, CV_BIRTH_YEAR_MAX, CV_BIRTH_DATE_PATTERN,
  CV_IELTS_NAME, CV_IELTS_MAX_SCORE, GPA_TARGET_SCALE, GPA_DECIMALS,
  CV_HIDDEN_MARK, CV_CONTACT_PATTERNS, CV_FILE_ERROR_NAMES,
};
