/**
 * Upload bằng multer (memoryStorage, tối đa 10MB, file chỉ nằm trong RAM rồi đẩy lên Storage).
 * Định dạng cho phép theo loại tài liệu:
 *   transcript, recommendation_letter → .pdf  |  cv, sop → .pdf .doc .docx  |  other → thêm .png .jpg
 */

import multer from 'multer';
import { AppError, upload as uploadErrors } from '~/constants/errors.js';

const ALLOWED_EXTS_BY_TYPE = {
  transcript: ['.pdf'],
  recommendation_letter: ['.pdf'],
  cv: ['.pdf', '.doc', '.docx'],
  sop: ['.pdf', '.doc', '.docx'],
  other: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
};

const storage = multer.memoryStorage();

/**
 * Kiểm tra field "type" và đuôi file theo loại tài liệu. Lỗi ném ra được handleUploadError đổi thành JSON 400.
 * Lưu ý: nếu field "type" nằm sau "file" trong form-data thì req.body.type chưa có khi filter chạy
 * (multer đọc field và file song song) → bị từ chối với 400, không làm sập server.
 */
const fileFilter = (req, file, cb) => {
  const docType = req.body && req.body.type;

  if (!docType) {
    return cb(new Error('Thiếu field "type" trong request'), false);
  }

  const allowedExts = ALLOWED_EXTS_BY_TYPE[docType];
  if (!allowedExts) {
    return cb(
      new Error(
        `Loại document không hợp lệ. Chỉ chấp nhận: cv, sop, transcript, recommendation_letter, other`
      ),
      false
    );
  }

  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File "${docType}" chỉ chấp nhận đuôi: ${allowedExts.join(', ')}`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

/**
 * MulterError (file quá lớn, sai field...) chuyển thẳng cho errorHandle.controller, nơi đã có mã lỗi và thông báo riêng.
 * Lỗi của fileFilter (Error thường) đổi thành AppError 400; nếu không client chỉ thấy "Failed to fetch".
 * Phải return ngay khi có lỗi, không thì controller chạy tiếp và gửi response lần hai.
 */
const handleUploadError = (err, req, res, next) => {
  if (!err) return next();
  if (err.statusCode) return next(err);

  // Đọc hết body trước khi trả lời, nếu không client bị ERR_CONNECTION_RESET khi multer từ chối sớm
  req.resume();
  if (err instanceof multer.MulterError) return next(err);
  return next(new AppError(uploadErrors.invalid(err.message)));
};

export { upload, handleUploadError };