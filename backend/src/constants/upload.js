// Giới hạn multipart dùng chung cho upload tài liệu và đọc CV: field nằm trong RAM, mặc định multer không giới hạn số lượng
const MULTIPART_LIMITS = Object.freeze({ fields: 5, fieldSize: 1024, fieldNameSize: 100, parts: 6 });

export { MULTIPART_LIMITS };
