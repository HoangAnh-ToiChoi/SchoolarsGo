/**
 * Kiểm tra req.body | req.query | req.params bằng schema zod.
 * Sai → zod ném ZodError, Express chuyển sang errorHandle.controller (400 + danh sách lỗi từng trường).
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.parse(req[source]);

  // Ghi đè bằng dữ liệu đã validate để loại bỏ trường lạ
  if (source === 'query') {
    // Express 5: req.query chỉ đọc, phải định nghĩa lại thuộc tính
    Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true, enumerable: true });
  } else {
    req[source] = parsed;
  }

  next();
};

export default validate;
