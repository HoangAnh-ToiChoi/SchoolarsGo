const AppError = require('../utils/AppError');

class SavedService {
  #repo;

  constructor(savedRepository) {
    this.#repo = savedRepository;
  }

  getAll = async userId => {
    const rows = await this.#repo.findAllByUser(userId);
    return rows.map(row => ({
      id: row.id,
      note: row.note,
      created_at: row.created_at,
      scholarship: {
        id: row.scholarship_id,
        title: row.title,
        provider: row.provider,
        country: row.country,
        degree: row.degree,
        amount: row.amount,
        currency: row.currency,
        deadline: row.deadline,
        image_url: row.image_url,
        is_featured: row.is_featured,
      },
    }));
  };

  save = async (userId, scholarshipId, note) => {
    const exists = await this.#repo.scholarshipExists(scholarshipId);
    if (!exists) throw new AppError('Học bổng không tồn tại.', 404, 'SCHOLARSHIP_NOT_FOUND');

    try {
      const saved = await this.#repo.create({ userId, scholarshipId, note });
      const scholarship = await this.#repo.getScholarshipDetails(scholarshipId);
      return { ...saved, scholarship };
    } catch (err) {
      if (err.message === 'SCHOLARSHIP_ALREADY_SAVED') {
        throw new AppError('Bạn đã lưu học bổng này rồi.', 409, 'SCHOLARSHIP_ALREADY_SAVED');
      }
      throw err;
    }
  };

  remove = async (userId, scholarshipId) => {
    const deleted = await this.#repo.deleteByUserAndScholarship(userId, scholarshipId);
    if (deleted === 0) throw new AppError('Học bổng này chưa được lưu.', 404, 'NOT_SAVED');
    return { deleted: true };
  };
}

module.exports = SavedService;
