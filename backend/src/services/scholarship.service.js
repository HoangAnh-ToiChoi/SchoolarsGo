const AppError = require('../utils/AppError');

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;
const COUNTRIES_TTL_MS = 10 * 60 * 1000; // 10 minutes

class ScholarshipService {
  #repo;
  #countriesCache = null;
  #countriesCachedAt = 0;

  constructor(scholarshipRepository) {
    this.#repo = scholarshipRepository;
  }

  #guardFound(entity, message = 'Không tìm thấy học bổng') {
    if (!entity) throw new AppError(message, 404, 'SCHOLARSHIP_NOT_FOUND');
  }

  // Trang chi tiết nhận id (UUID) hoặc slug (chữ thường, số, gạch ngang — xem migration 004)
  #parseIdOrSlug(value) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');
    const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '') && value.length <= 120;
    if (!isUuid && !isSlug) throw new AppError('Đường dẫn học bổng không hợp lệ', 400, 'INVALID_ID');
    return { isUuid };
  }

  async getAll(filters = {}, userId = null) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
    const offset = (page - 1) * limit;

    const { data, total } = await this.#repo.findAll(filters, limit, offset, userId);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
  }

  async getFeatured() {
    return this.#repo.findFeatured();
  }

  async getCountries() {
    const now = Date.now();
    if (this.#countriesCache && now - this.#countriesCachedAt < COUNTRIES_TTL_MS) {
      return this.#countriesCache;
    }
    const result = await this.#repo.findCountries();
    this.#countriesCache = result;
    this.#countriesCachedAt = now;
    return result;
  }

  async getById(idOrSlug, userId = null) {
    const kind = this.#parseIdOrSlug(idOrSlug);
    const scholarship = await this.#repo.findByIdOrSlug(idOrSlug, kind, userId);
    this.#guardFound(scholarship);
    return scholarship;
  }
}

module.exports = ScholarshipService;
