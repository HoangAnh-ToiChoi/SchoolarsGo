import { AppError, application as applicationErrors, scholarship as scholarshipErrors } from '~/constants/errors.js';
import applicationModel from '~/models/application.model.js';
import notificationService from '~/services/notification.service.js';
import { APPLICATION_VALID_TRANSITIONS, APPLICATION_UNDELETABLE_STATUSES } from '~/constants/application.js';

class ApplicationService {
  #guardFound(entity) {
    if (!entity) throw new AppError(applicationErrors.NOT_FOUND);
  }

  #assertValidTransition(from, to) {
    const allowed = APPLICATION_VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new AppError(applicationErrors.INVALID_STATUS_TRANSITION);
    }
  }

  #assertDeletable(status) {
    if (APPLICATION_UNDELETABLE_STATUSES.includes(status)) {
      throw new AppError(applicationErrors.CANNOT_DELETE);
    }
  }

  #formatApplication(row) {
    return {
      id: row.id,
      status: row.status,
      applied_at: row.applied_at,
      notes: row.notes,
      checklist: row.checklist,
      documents_used: row.documents_used,
      result: row.result,
      created_at: row.created_at,
      updated_at: row.updated_at,
      scholarship: {
        id: row.scholarship_id,
        slug: row.scholarship_slug,
        title: row.scholarship_title,
        country: row.country,
        deadline: row.deadline,
        amount: row.amount,
        image_url: row.image_url,
      },
    };
  }

  async getAll(userId, filters = {}) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 20));
    const status = filters.status || null;

    const { rows, total } = await applicationModel.findAllByUser(userId, { page, limit, status });

    return {
      data: rows.map(row => this.#formatApplication(row)),
      meta: { page, limit, total },
    };
  }

  async create(userId, { scholarshipId, checklist, notes }) {
    const exists = await applicationModel.scholarshipExists(scholarshipId);
    if (!exists) throw new AppError(scholarshipErrors.NOT_EXISTS);

    try {
      const app = await applicationModel.create(userId, { scholarshipId, checklist, notes });
      notificationService.refreshUserReminders(userId); // không chờ: nhắc hạn không được làm chậm thao tác tạo đơn
      return this.#formatApplication(app);
    } catch (err) {
      if (err.message === 'APPLICATION_ALREADY_EXISTS') {
        throw new AppError(applicationErrors.ALREADY_EXISTS);
      }
      throw err;
    }
  }

  async getById(userId, applicationId) {
    const app = await applicationModel.findByIdAndUser(applicationId, userId);
    this.#guardFound(app);
    return this.#formatApplication(app);
  }

  async update(userId, applicationId, rawUpdates) {
    const existing = await applicationModel.findByIdAndUser(applicationId, userId);
    this.#guardFound(existing);

    const updates = { ...rawUpdates };

    if (updates.status !== undefined) {
      if (!(updates.status in APPLICATION_VALID_TRANSITIONS)) {
        throw new AppError(applicationErrors.INVALID_STATUS);
      }
      this.#assertValidTransition(existing.status, updates.status);

      if (existing.status === 'draft' && updates.status === 'submitted') {
        updates.applied_at = new Date().toISOString();
      }
    }

    const updated = await applicationModel.updateByIdAndUser(applicationId, userId, updates);
    return this.#formatApplication(updated);
  }

  async delete(userId, applicationId) {
    const existing = await applicationModel.findByIdAndUser(applicationId, userId);
    this.#guardFound(existing);
    this.#assertDeletable(existing.status);
    await applicationModel.deleteByIdAndUser(applicationId, userId);
    return { deleted: true };
  }
}

export default new ApplicationService();