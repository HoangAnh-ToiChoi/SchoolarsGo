const { ZodError } = require('zod');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.parse(data);

      // Ghi đè lại req[source] bằng data đã validate (để loại bỏ unknown fields)
      if (source === 'body') {
        req.body = parsed;
      } else if (source === 'query') {
        req.query = parsed;
      } else {
        req.params = parsed;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          code: 400,
          errors,
        });
      }
      next(error);
    }
  };
};

module.exports = validate;
