import multer from 'multer';

const MAX_SIZE = 5 * 1024 * 1024;
const CV_NAME = /\.(pdf|docx)$/i;

// Đuôi file chỉ là lọc nhanh; loại file thật được kiểm ở cvText.service bằng byte đầu
const fileFilter = (req, file, cb) => {
  if (!CV_NAME.test(file.originalname)) return cb(new Error('CV chỉ nhận file .pdf hoặc .docx'), false);
  return cb(null, true);
};

// File chỉ nằm trong RAM, không ghi xuống đĩa
const uploader = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
});

const cvUpload = uploader.single('file');

export { cvUpload };
