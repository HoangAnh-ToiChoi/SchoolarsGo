import AppError from '~/utils/AppError.js';
import applicationModel from '~/models/application.model.js';

class ApplicationService {
  static #VALID_TRANSITIONS = {
    draft: ['submitted', 'withdrawn'],
    submitted: ['under_review', 'rejected', 'withdrawn'],
    under_review: ['interview', 'rejected', 'withdrawn'],
    interview: ['accepted', 'rejected', 'withdrawn'],
    accepted: [],
    rejected: [],
    withdrawn: [],
  };

  static #UNDELETABLE = ['submitted', 'under_review', 'interview', 'accepted'];

  #guardFound(entity, message = 'Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền truy cập.') {
    if (!entity) throw AppError.notFound(message, 'APPLICATION_NOT_FOUND');
  }

  #assertValidTransition(from, to) {
    const allowed = ApplicationService.#VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw AppError.badRequest('Không thể chuyển trạng thái này. Kiểm tra luồng trạng thái hợp lệ.', 'INVALID_STATUS_TRANSITION');
    }
  }

  #assertDeletable(status) {
    if (ApplicationService.#UNDELETABLE.includes(status)) {
      throw AppError.badRequest('Không thể xóa đơn đã nộp. Hãy rút đơn thay vì xóa.', 'CANNOT_DELETE');
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
    if (!exists) throw AppError.notFound('Học bổng không tồn tại.', 'SCHOLARSHIP_NOT_FOUND');

    try {
      const app = await applicationModel.create(userId, { scholarshipId, checklist, notes });
      return this.#formatApplication(app);
    } catch (err) {
      if (err.message === 'APPLICATION_ALREADY_EXISTS') {
        throw AppError.conflict('Bạn đã ứng tuyển học bổng này rồi.', 'APPLICATION_ALREADY_EXISTS');
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
      if (!(updates.status in ApplicationService.#VALID_TRANSITIONS)) {
        throw AppError.badRequest(
          'Status không hợp lệ. Các status được phép: draft, submitted, under_review, interview, accepted, rejected, withdrawn.',
          'INVALID_STATUS'
        );
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