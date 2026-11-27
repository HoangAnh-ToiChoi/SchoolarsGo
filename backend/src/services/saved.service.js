import { AppError, saved as savedErrors, scholarship as scholarshipErrors } from '~/constants/errors.js';
import savedModel from '~/models/saved.model.js';
import notificationService from '~/services/notification.service.js';

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
    if (!exists) throw new AppError(scholarshipErrors.NOT_EXISTS);

    try {
      const saved = await savedModel.create({ userId, scholarshipId, note });
      const scholarship = await savedModel.getScholarshipDetails(scholarshipId);
      notificationService.refreshUserReminders(userId); // không chờ: nhắc hạn không được làm chậm thao tác lưu
      return { ...saved, scholarship };
    } catch (err) {
      if (err.message === 'SCHOLARSHIP_ALREADY_SAVED') {
        throw new AppError(savedErrors.ALREADY_SAVED);
      }
      throw err;
    }
  }

  async remove(userId, scholarshipId) {
    const deleted = await savedModel.deleteByUserAndScholarship(userId, scholarshipId);
    if (deleted === 0) throw new AppError(savedErrors.NOT_SAVED);
    return { deleted: true };
  }
}

export default new SavedService();