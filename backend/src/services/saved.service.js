import AppError from '#utils/AppError.js';
import savedModel from '#models/saved.model.js';

class SavedService {
  async getAll(userId) {
    const rows = await savedModel.findAllByUser(userId);
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
    const exists = await savedModel.scholarshipExists(scholarshipId);
    if (!exists) throw AppError.notFound('Học bổng không tồn tại.', 'SCHOLARSHIP_NOT_FOUND');

    try {
      const saved = await savedModel.create({ userId, scholarshipId, note });
      const scholarship = await savedModel.getScholarshipDetails(scholarshipId);
      return { ...saved, scholarship };
    } catch (err) {
      if (err.message === 'SCHOLARSHIP_ALREADY_SAVED') {
        throw AppError.conflict('Bạn đã lưu học bổng này rồi.', 'SCHOLARSHIP_ALREADY_SAVED');
      }
      throw err;
    }
  }

  async remove(userId, scholarshipId) {
    const deleted = await savedModel.deleteByUserAndScholarship(userId, scholarshipId);
    if (deleted === 0) throw AppError.notFound('Học bổng này chưa được lưu.', 'NOT_SAVED');
    return { deleted: true };
  }
}

export default new SavedService();