const AppError = require('../utils/AppError');

class ApplicationService {
  #repo;

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

  constructor(applicationRepository) {
    this.#repo = applicationRepository;
  }

  #guardFound(entity, message = 'Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền truy cập.') {
    if (!entity) throw new AppError(message, 404, 'APPLICATION_NOT_FOUND');
  }

  #assertValidTransition(from, to) {
    const allowed = ApplicationService.#VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new AppError('Không thể chuyển trạng thái này. Kiểm tra luồng trạng thái hợp lệ.', 400, 'INVALID_STATUS_TRANSITION');
    }
  }

  #assertDeletable(status) {
    if (ApplicationService.#UNDELETABLE.includes(status)) {
      throw new AppError('Không thể xóa đơn đã nộp. Hãy rút đơn thay vì xóa.', 400, 'CANNOT_DELETE');
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

    const { rows, total } = await this.#repo.findAllByUser(userId, { page, limit, status });

    return {
      data: rows.map(row => this.#formatApplication(row)),
      meta: { page, limit, total },
    };
  }

  async create(userId, { scholarshipId, checklist, notes }) {
    const exists = await this.#repo.scholarshipExists(scholarshipId);
    if (!exists) throw new AppError('Học bổng không tồn tại.', 404, 'SCHOLARSHIP_NOT_FOUND');

    try {
      const app = await this.#repo.create(userId, { scholarshipId, checklist, notes });
      return this.#formatApplication(app);
    } catch (err) {
      if (err.message === 'APPLICATION_ALREADY_EXISTS') {
        throw new AppError('Bạn đã ứng tuyển học bổng này rồi.', 409, 'APPLICATION_ALREADY_EXISTS');
      }
      throw err;
    }
  }

  async getById(userId, applicationId) {
    const app = await this.#repo.findByIdAndUser(applicationId, userId);
    this.#guardFound(app);
    return this.#formatApplication(app);
  }

  async update(userId, applicationId, rawUpdates) {
    const existing = await this.#repo.findByIdAndUser(applicationId, userId);
    this.#guardFound(existing);

    const updates = { ...rawUpdates };

    if (updates.status !== undefined) {
      if (!(updates.status in ApplicationService.#VALID_TRANSITIONS)) {
        throw new AppError(
          'Status không hợp lệ. Các status được phép: draft, submitted, under_review, interview, accepted, rejected, withdrawn.',
          400,
          'INVALID_STATUS'
        );
      }
      this.#assertValidTransition(existing.status, updates.status);

      if (existing.status === 'draft' && updates.status === 'submitted') {
        updates.applied_at = new Date().toISOString();
      }
    }

    const updated = await this.#repo.updateByIdAndUser(applicationId, userId, updates);
    return this.#formatApplication(updated);
  }

  async delete(userId, applicationId) {
    const existing = await this.#repo.findByIdAndUser(applicationId, userId);
    this.#guardFound(existing);
    this.#assertDeletable(existing.status);
    await this.#repo.deleteByIdAndUser(applicationId, userId);
    return { deleted: true };
  }
}

module.exports = ApplicationService;
