const AppError = require('../utils/AppError');

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

class ScholarshipService {
  #repo;

  constructor(scholarshipRepository) {
    this.#repo = scholarshipRepository;
  }

  #guardFound(entity, message = 'Không tìm thấy học bổng') {
    if (!entity) throw new AppError(message, 404, 'SCHOLARSHIP_NOT_FOUND');
  }

  #guardValidId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || id === 'undefined' || id === 'null' || !uuidRegex.test(id))
      throw new AppError('ID học bổng không hợp lệ', 400, 'INVALID_ID');
  }

  getAll = async (filters = {}, userId = null) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
    const offset = (page - 1) * limit;

    const { data, total } = await this.#repo.findAll(filters, limit, offset, userId);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
  };

  getFeatured = async () => {
    return this.#repo.findFeatured();
  };

  getCountries = async () => {
    return this.#repo.findCountries();
  };

  getById = async (id, userId = null) => {
    this.#guardValidId(id);
    const scholarship = await this.#repo.findById(id, userId);
    this.#guardFound(scholarship);
    return scholarship;
  };
}

module.exports = ScholarshipService;
