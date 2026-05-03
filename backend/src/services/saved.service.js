/**
 * SavedService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Class với constructor nhận repository qua parameter (Dependency Injection)
 * - KHÔNG được import db, KHÔNG được viết SQL
 * - Chỉ: validate input, business logic, gọi repository, format response
 * - Ném lỗi với mã cụ thể (UPPER_SNAKE)
 */
class SavedService {
  constructor(savedRepository) {
    this.repo = savedRepository;
  }

  /**
   * Lấy danh sách scholarships đã lưu của user
   * @param {string} userId
   * @returns {Promise<array>}
   */
  getAll = async (userId) => {
    const rows = await this.repo.findAllByUser(userId);
    return rows;
  };

  /**
   * Lưu một scholarship (tạo draft saved)
   * @throws 'SCHOLARSHIP_NOT_FOUND' — học bổng không tồn tại
   * @throws 'SCHOLARSHIP_ALREADY_SAVED' — đã lưu rồi
   */
  save = async (userId, scholarshipId, note) => {
    const exists = await this.repo.scholarshipExists(scholarshipId);
    if (!exists) {
      const err = new Error('SCHOLARSHIP_NOT_FOUND');
      err.isOperational = true;
      throw err;
    }

    try {
      const saved = await this.repo.create({ userId, scholarshipId, note });
      const scholarship = await this.repo.getScholarshipDetails(scholarshipId);
      return { ...saved, scholarship };
    } catch (err) {
      if (err.message === 'SCHOLARSHIP_ALREADY_SAVED') {
        const error = new Error('SCHOLARSHIP_ALREADY_SAVED');
        error.isOperational = true;
        throw error;
      }
      throw err;
    }
  };

  /**
   * Bỏ lưu một scholarship
   * @throws 'SCHOLARSHIP_NOT_SAVED' — chưa lưu học bổng này
   */
  remove = async (userId, scholarshipId) => {
    const deleted = await this.repo.deleteByUserAndScholarship(userId, scholarshipId);
    if (deleted === 0) {
      const err = new Error('SCHOLARSHIP_NOT_SAVED');
      err.isOperational = true;
      throw err;
    }
    return { deleted: true };
  };
}

module.exports = SavedService;
