import { APPLICATION_VALID_TRANSITIONS } from '~/constants/application.js';
import { DOCUMENT_VALID_TYPES } from '~/constants/document.js';
import { PROFILE_VALID_DEGREES, PROFILE_ENGLISH_LEVEL_MAX } from '~/constants/profile.js';

const authorization = Object.freeze({
  ACCESS_TOKEN_MISSING: { statusCode: 401, code: 'ACCESS_TOKEN_MISSING', message: 'Vui lòng đăng nhập để tiếp tục.' },
  ACCESS_TOKEN_EXPIRED: { statusCode: 401, code: 'ACCESS_TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn.' },
  ACCESS_TOKEN_INVALID: { statusCode: 401, code: 'ACCESS_TOKEN_INVALID', message: 'Access token không hợp lệ.' },
  REFRESH_TOKEN_MISSING: { statusCode: 401, code: 'REFRESH_TOKEN_MISSING', message: 'Thiếu refresh token.' },
  REFRESH_TOKEN_EXPIRED: { statusCode: 401, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token đã hết hạn.' },
  REFRESH_TOKEN_INVALID: { statusCode: 401, code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token không hợp lệ.' },
  REFRESH_TOKEN_REUSED: { statusCode: 401, code: 'REFRESH_TOKEN_REUSED', message: 'Refresh token đã được sử dụng lại.' },
  REFRESH_RACE: { statusCode: 409, code: 'REFRESH_RACE', message: 'Phiên đăng nhập đang được làm mới ở tab khác.' },
  SESSION_REVOKED: { statusCode: 401, code: 'SESSION_REVOKED', message: 'Phiên đăng nhập đã bị thu hồi.' },
  SESSION_NOT_FOUND: { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'Không tìm thấy thiết bị.' },
  ACCOUNT_LOCKED: { statusCode: 403, code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khóa.' },
  INVALID_CREDENTIALS: { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' },
  USER_EXISTS: { statusCode: 409, code: 'USER_EXISTS', message: 'Email đã được sử dụng.' },
  USER_NOT_FOUND: { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy tài khoản.' },
  CREATE_USER_FAILED: { statusCode: 500, code: 'CREATE_USER_FAILED', message: 'Không thể tạo tài khoản.' },
  INVALID_RESET_TOKEN: { statusCode: 400, code: 'INVALID_RESET_TOKEN', message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
  EXPIRED_RESET_TOKEN: { statusCode: 400, code: 'EXPIRED_RESET_TOKEN', message: 'Liên kết đã hết hạn. Vui lòng yêu cầu lại.' },
  LOGIN_REQUIRED: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tiếp tục' },
  FORBIDDEN: { statusCode: 403, code: 'FORBIDDEN', message: 'Không có quyền truy cập' },
  ORIGIN_NOT_ALLOWED: { statusCode: 403, code: 'ORIGIN_NOT_ALLOWED', message: 'Nguồn gửi yêu cầu không được phép.' },
});

// Lỗi chung của server (errorHandle.controller dùng khi gặp lỗi không phải AppError)
const common = Object.freeze({
  INTERNAL_SERVER_ERROR: { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Lỗi máy chủ, vui lòng thử lại sau' },
  VALIDATION_ERROR: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
  MALFORMED_JSON: { statusCode: 400, code: 'MALFORMED_JSON', message: 'Request body không phải JSON hợp lệ' },
  ROUTE_NOT_FOUND: { statusCode: 404, code: 'ROUTE_NOT_FOUND', message: 'Endpoint not found' },
  INVALID_TOKEN: { statusCode: 401, code: 'INVALID_TOKEN', message: 'Token không hợp lệ' },
  TOKEN_EXPIRED: { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn' },
});

// Mã lỗi của Postgres/Supabase (khóa là SQLSTATE)
const postgres = Object.freeze({
  23505: { statusCode: 409, code: 'DUPLICATE_ENTRY', message: 'Dữ liệu đã tồn tại (unique constraint violation)' },
  23503: { statusCode: 400, code: 'INVALID_REFERENCE', message: 'Tham chiếu không hợp lệ (foreign key violation)' },
  '22P02': { statusCode: 400, code: 'INVALID_DATA_FORMAT', message: 'Dữ liệu có định dạng không hợp lệ' },
});

// Mã lỗi của multer (khóa là err.code)
const multer = Object.freeze({
  LIMIT_FILE_SIZE: { statusCode: 400, code: 'FILE_TOO_LARGE', message: 'File quá lớn (tối đa 10MB)' },
  LIMIT_UNEXPECTED_FILE: { statusCode: 400, code: 'UNEXPECTED_FILE', message: 'Field upload không hợp lệ' },
});

// Đọc CV bằng AI (cvText.service, cvExtract.service, cvLimiter)
const cv = Object.freeze({
  MISSING_FILE: { statusCode: 400, code: 'CV_MISSING_FILE', message: 'Thiếu file CV' },
  INVALID_FILE: { statusCode: 400, code: 'CV_INVALID_FILE', message: 'File không phải PDF hoặc DOCX hợp lệ' },
  UNREADABLE_FILE: { statusCode: 400, code: 'CV_INVALID_FILE', message: 'Không đọc được nội dung file' },
  SCANNED: { statusCode: 422, code: 'CV_SCANNED', message: 'CV dạng ảnh scan, không đọc được chữ' },
  READ_TIMEOUT: { statusCode: 504, code: 'CV_READ_TIMEOUT', message: 'Xử lý quá lâu' },
  AI_UNAVAILABLE: { statusCode: 503, code: 'AI_UNAVAILABLE', message: 'Dịch vụ AI chưa sẵn sàng' },
  AI_TIMEOUT: { statusCode: 504, code: 'AI_TIMEOUT', message: 'Xử lý quá lâu' },
  AI_FAILED: { statusCode: 502, code: 'AI_FAILED', message: 'AI không phản hồi' },
  AI_BAD_RESPONSE: { statusCode: 502, code: 'AI_BAD_RESPONSE', message: 'AI trả về dữ liệu không đọc được' },
  LIMIT_REACHED: { statusCode: 429, code: 'TOO_MANY_REQUESTS', message: 'Bạn đã dùng hết lượt đọc CV hôm nay.' },
});

// Đơn ứng tuyển (application.service)
const application = Object.freeze({
  NOT_FOUND: { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền truy cập.' },
  ALREADY_EXISTS: { statusCode: 409, code: 'APPLICATION_ALREADY_EXISTS', message: 'Bạn đã ứng tuyển học bổng này rồi.' },
  INVALID_STATUS: { statusCode: 400, code: 'INVALID_STATUS', message: `Status không hợp lệ. Các status được phép: ${Object.keys(APPLICATION_VALID_TRANSITIONS).join(', ')}.` },
  INVALID_STATUS_TRANSITION: { statusCode: 400, code: 'INVALID_STATUS_TRANSITION', message: 'Không thể chuyển trạng thái này. Kiểm tra luồng trạng thái hợp lệ.' },
  CANNOT_DELETE: { statusCode: 400, code: 'CANNOT_DELETE', message: 'Không thể xóa đơn đã nộp. Hãy rút đơn thay vì xóa.' },
});

// Học bổng (scholarship.service; NOT_EXISTS dùng khi kiểm tra học bổng trước khi lưu / ứng tuyển)
const scholarship = Object.freeze({
  NOT_FOUND: { statusCode: 404, code: 'SCHOLARSHIP_NOT_FOUND', message: 'Không tìm thấy học bổng' },
  NOT_EXISTS: { statusCode: 404, code: 'SCHOLARSHIP_NOT_FOUND', message: 'Học bổng không tồn tại.' },
  INVALID_ID: { statusCode: 400, code: 'INVALID_ID', message: 'Đường dẫn học bổng không hợp lệ' },
});

// Học bổng đã lưu (saved.service)
const saved = Object.freeze({
  ALREADY_SAVED: { statusCode: 409, code: 'SCHOLARSHIP_ALREADY_SAVED', message: 'Bạn đã lưu học bổng này rồi.' },
  NOT_SAVED: { statusCode: 404, code: 'NOT_SAVED', message: 'Học bổng này chưa được lưu.' },
});

// Thông báo (notification.service)
const notification = Object.freeze({
  NOT_FOUND: { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Không tìm thấy thông báo.' },
  CHANNEL_NOT_FOUND: { statusCode: 404, code: 'NOTIFICATION_CHANNEL_NOT_FOUND', message: 'Chưa có kênh thông báo tức thời.' },
});

// Tài liệu người dùng (document.service). Hàm nhận lý do lỗi để giữ nguyên nội dung thông báo cũ
const document = Object.freeze({
  NOT_FOUND: { statusCode: 404, code: 'DOCUMENT_NOT_FOUND', message: 'Không tìm thấy document hoặc bạn không có quyền xóa' },
  NO_FILE: { statusCode: 400, code: 'NO_FILE', message: 'Không có file được upload' },
  INVALID_TYPE: { statusCode: 400, code: 'INVALID_DOC_TYPE', message: `Loại document không hợp lệ. Chỉ chấp nhận: ${DOCUMENT_VALID_TYPES.join(', ')}` },
  insertFailed: reason => ({ statusCode: 500, code: 'DB_INSERT_FAILED', message: `Lưu metadata thất bại, file đã được gỡ: ${reason}` }),
  CONTENT_MISMATCH: { statusCode: 400, code: 'UPLOAD_INVALID', message: 'Nội dung file không đúng định dạng cho phép của loại tài liệu này' },
});

// Upload bằng multer (middlewares/upload.js). Lý do cụ thể do fileFilter đặt
const upload = Object.freeze({
  invalid: reason => ({ statusCode: 400, code: 'UPLOAD_INVALID', message: reason || 'Upload file không hợp lệ' }),
});

// Hồ sơ người dùng (profile.service)
const profile = Object.freeze({
  GPA_NOT_NUMBER: { statusCode: 400, code: 'INVALID_GPA', message: 'GPA phải là số' },
  gpaOutOfRange: maxGpa => ({ statusCode: 400, code: 'INVALID_GPA', message: `GPA phải nằm trong khoảng 0 - ${maxGpa}` }),
  ENGLISH_LEVEL_TOO_LONG: { statusCode: 400, code: 'INVALID_ENGLISH_LEVEL', message: `english_level không được vượt quá ${PROFILE_ENGLISH_LEVEL_MAX} ký tự` },
  INVALID_DEGREE: { statusCode: 400, code: 'INVALID_DEGREE', message: `target_degree không hợp lệ. Giá trị được chấp nhận: ${PROFILE_VALID_DEGREES.join(', ')}` },
});

// Gợi ý học bổng (recommend.service)
const recommend = Object.freeze({
  PROFILE_REQUIRED: { statusCode: 400, code: 'PROFILE_REQUIRED', message: 'Vui lòng cập nhật profile trước khi sử dụng gợi ý' },
  PROFILE_INCOMPLETE: { statusCode: 400, code: 'PROFILE_INCOMPLETE', message: 'Vui lòng bổ sung thêm GPA, tiếng Anh, ngành học hoặc quốc gia mục tiêu để nhận gợi ý chính xác hơn' },
});

// Khu quản trị (admin.service)
const admin = Object.freeze({
  SELF_MODIFICATION_FORBIDDEN: { statusCode: 400, code: 'SELF_MODIFICATION_FORBIDDEN', message: 'Không thể tự thay đổi quyền hoặc vô hiệu hóa chính mình' },
  INVALID_ROLE: { statusCode: 400, code: 'INVALID_ROLE', message: 'Role không hợp lệ. Chỉ chấp nhận "user" hoặc "admin"' },
  USER_NOT_FOUND: { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy user' },
  USER_NOT_FOUND_OR_DISABLED: { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy user hoặc user đã bị vô hiệu hóa' },
  SCHOLARSHIP_NOT_FOUND_OR_DELETED: { statusCode: 404, code: 'SCHOLARSHIP_NOT_FOUND', message: 'Không tìm thấy học bổng hoặc học bổng đã bị xóa' },
  CREATE_SCHOLARSHIP_FAILED: { statusCode: 500, code: 'CREATE_SCHOLARSHIP_FAILED', message: 'Không thể tạo học bổng' },
});

/**
 * AppError — lỗi nghiệp vụ của ứng dụng (isOperational = true), được `appError` ở errorHandle.controller đổi thành response.
 * Chỉ một cách tạo: truyền định nghĩa dựng sẵn ở file này, không tự gõ chữ hay mã ở nơi ném lỗi.
 *   throw new AppError(saved.ALREADY_SAVED);
 *   throw new AppError(profile.gpaOutOfRange(maxGpa));   // định nghĩa có phần thay đổi thì là hàm
 * `code` (FE đọc) và `errorCode` (trường `error` của response) đều lấy từ `definition.code`.
 */
class AppError extends Error {
  constructor({ statusCode, code, message, details = null }) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.errorCode = code;
    this.details = details;
  }
}

// AppError cần `new` ở mọi nơi nên xuất theo tên (ngoại lệ của quy ước "chỉ export default bản dùng chung")
export { authorization, common, postgres, multer, cv, application, scholarship, saved, notification, document, upload, profile, recommend, admin, AppError };
