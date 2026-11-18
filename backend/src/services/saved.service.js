const AppError = require('../utils/AppError');
const SavedModel = require('../models/saved.model');

class SavedService {
  #model;

  constructor(savedModel = new SavedModel()) {
    this.#model = savedModel;
  }

  async getAll(userId) {
    const rows = await this.#model.findAllByUser(userId);
    return rows.map(row => ({
      id: row.id,
      note: row.note,
      created_at: row.created_at,
      scholarship: {
        id: row.scholarship_id,
        slug: row.slug,
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
  }

  async save(userId, scholarshipId, note) {
    const exists = await this.#model.scholarshipExists(scholarshipId);
    if (!exists) throw new AppError('Học bổng không tồn tại.', 404, 'SCHOLARSHIP_NOT_FOUND');

    try {
      const saved = await this.#model.create({ userId, scholarshipId, note });
      const scholarship = await this.#model.getScholarshipDetails(scholarshipId);
      return { ...saved, scholarship };
    } catch (err) {
      if (err.message === 'SCHOLARSHIP_ALREADY_SAVED') {
        throw new AppError('Bạn đã lưu học bổng này rồi.', 409, 'SCHOLARSHIP_ALREADY_SAVED');
      }
      throw err;
    }
  }

  async remove(userId, scholarshipId) {
    const deleted = await this.#model.deleteByUserAndScholarship(userId, scholarshipId);
    if (deleted === 0) throw new AppError('Học bổng này chưa được lưu.', 404, 'NOT_SAVED');
    return { deleted: true };
  }
}

module.exports = SavedService;
