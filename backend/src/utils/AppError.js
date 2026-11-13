/**
 * AppError — Custom Error class cho toàn bộ ứng dụng
 *
 * Kế thừa từ Error mặc định của Node.js.
 * Bổ sung statusCode + isOperational để Global Error Handler phân biệt
 * lỗi nghiệp vụ (operational) và lỗi hệ thống (programming).
 */
class AppError extends Error {
  /**
   * @param {string} message - Thông báo lỗi (hiển thị cho client)
   * @param {number} statusCode - HTTP status code (400, 404, 409, 500...)
   * @param {string} [code] - Mã lỗi UPPER_SNAKE_CASE (optional)
   */
  constructor(messageOrDetails, statusCode = 500, code) {
    const details = typeof messageOrDetails === 'object' && messageOrDetails !== null
      ? messageOrDetails
      : { message: messageOrDetails, statusCode, code };

    super(details.message);
    this.statusCode = details.statusCode;
    this.isOperational = true;
    if (details.code) this.code = details.code;
  }
}

module.exports = AppError;
