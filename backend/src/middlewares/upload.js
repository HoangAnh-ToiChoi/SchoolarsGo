/**
 * Upload Middleware — dùng multer với memoryStorage
 *
 * Thay đổi so với bản cũ:
 * - Dùng memoryStorage thay vì diskStorage (tối ưu tốc độ, không ghi ra ổ cứng)
 * - Validation theo từng document type:
 *   * transcript / recommendation_letter: chỉ nhận .pdf
 *   * cv / sop: nhận .pdf, .doc, .docx
 *   * other: nhận .pdf, .doc, .docx, .png, .jpg
 * - Giới hạn kích thước: 10MB
 * - Multer chỉ đọc file vào RAM, không lưu đĩa
 */

const multer = require('multer');

// Mỗi document type có danh sách extension cho phép riêng
const ALLOWED_EXTS_BY_TYPE = {
  transcript: ['.pdf'],
  recommendation_letter: ['.pdf'],
  cv: ['.pdf', '.doc', '.docx'],
  sop: ['.pdf', '.doc', '.docx'],
  other: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
};


// Cấu hình storage dùng bộ nhớ RAM (không ghi ra đĩa)
const storage = multer.memoryStorage();

/**
 * File filter — kiểm tra type field và extension theo từng loại document
 * Lỗi từ đây được bắt bởi wrapper middleware bên dưới, trả về JSON chuẩn cho client.
 *
 * Lưu ý: req.body.type có thể undefined nếu field "type" nằm sau field "file" trong
 * form-data stream (busboy không đảm bảo thứ tự parse). Multer v1.x parse fields và
 * files song song nên fileFilter có thể chạy trước khi body hoàn tất. Trong trường hợp
 * này fileFilter sẽ throw và wrapper sẽ trả về 400 JSON thay vì crash server.
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
 * Custom middleware wrapper cho upload.single('file')
 *
 * Mục đích: Multer fileFilter throw Error nguyên gốc (không phải MulterError).
 * Nếu không bắt, error sẽ rơi vào Express và trả response không đúng format JSON
 * (dẫn đến "Failed to fetch" trên client thay vì message lỗi rõ ràng).
 *
 * LƯU Ý: Khi có lỗi, PHẢI return ngay để không chạy tiếp xuống controller.
 * Nếu không có return, controller sẽ tiếp tục chạy và cố gắng gửi thêm response,
 * gây ra lỗi "Cannot set headers after they are sent to the client".
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const handleUploadError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Upload file không hợp lệ',
      code: 400,
    });
  }
  // Không có lỗi → chuyển tiếp cho controller xử lý
  return next();
};

module.exports = { upload, handleUploadError };
