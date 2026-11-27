import multer from 'multer';
import { MULTIPART_LIMITS } from '~/constants/upload.js';
import { CV_MAX_FILE_SIZE, CV_UPLOAD_FIELD, CV_FILE_NAME_PATTERN, CV_FILE_NAME_ERROR } from '~/constants/cv.js';

// Đuôi file chỉ là lọc nhanh; loại file thật được kiểm ở cvText.service bằng byte đầu
const fileFilter = (req, file, cb) => {
  if (!CV_FILE_NAME_PATTERN.test(file.originalname)) return cb(new Error(CV_FILE_NAME_ERROR), false);
  return cb(null, true);
};

// File chỉ nằm trong RAM, không ghi xuống đĩa
const uploader = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { ...MULTIPART_LIMITS, fileSize: CV_MAX_FILE_SIZE, files: 1 },
});

const cvUpload = uploader.single(CV_UPLOAD_FIELD);

export { cvUpload };
