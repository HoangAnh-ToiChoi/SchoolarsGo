// Cách viết tên Việt Nam có thể gặp trong cột country (dữ liệu cào + nhập tay)
const DOMESTIC_COUNTRIES = ['Vietnam', 'Viet Nam', 'Việt Nam'];

class ScholarshipRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  async findAll(filters = {}, limit, offset, userId = null) {
    let q = this.#sb.from('scholarships').select(
      'id, slug, title, provider, country, degree, amount, currency, coverage, deadline, language, min_gpa, image_url, is_featured',
      { count: 'exact' }
    ).eq('is_active', true).or(this.#notExpired());

    q = this.#applyFilters(q, filters);
    q = q
      .order('relevance_score', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await q;
    if (error) throw error;

    const rows = await this.#attachSavedStatus(data || [], userId);
    return { data: rows, total: count || 0 };
  }

  async findFeatured() {
    const { data, error } = await this.#sb
      .from('scholarships')
      .select('id, slug, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
      .eq('is_active', true)
      .eq('is_featured', true)
      .or(this.#notExpired())
      .order('relevance_score', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(6);
    if (error) throw error;
    return data || [];
  }

  async findCountries() {
    const { data, error } = await this.#sb
      .from('scholarships')
      .select('country')
      .eq('is_active', true)
      .not('country', 'is', null)
      .order('country', { ascending: true });
    if (error) throw error;
    const unique = [...new Set((data || []).map(r => r.country))];
    return unique;
  }

  /** Tìm theo id (UUID) hoặc slug — URL trang chi tiết dùng slug, link cũ vẫn dùng id. */
  async findByIdOrSlug(idOrSlug, { isUuid }, userId = null) {
    const { data: scholarship, error } = await this.#sb
      .from('scholarships')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', idOrSlug)
      .eq('is_active', true)
      .or(this.#notExpired())
      .maybeSingle();
    if (error) throw error;
    if (!scholarship) return null;

    const isSaved = await this.#checkSavedStatus(userId, scholarship.id);
    return { ...scholarship, is_saved: isSaved };
  }

  /** Điều kiện "chưa quá hạn": hạn nộp còn hoặc chưa rõ hạn (NULL). Dùng chung cho mọi truy vấn đọc. */
  #notExpired() {
    return `deadline.is.null,deadline.gte.${new Date().toISOString()}`;
  }

  #applyFilters(q, filters) {
    if (filters.country)      q = q.ilike('country', `%${filters.country}%`);
    // Chưa có cột scope: "Trong nước" = quốc gia là Việt Nam, còn lại là du học.
    // Lọc ở DB (không lọc ở frontend) để phân trang và tổng số đúng.
    if (filters.scope === 'domestic')      q = q.in('country', DOMESTIC_COUNTRIES);
    if (filters.scope === 'international') q = q.not('country', 'in', `(${DOMESTIC_COUNTRIES.map(c => `"${c}"`).join(',')})`);
    if (filters.degree)       q = q.eq('degree', filters.degree);
    if (filters.field)        q = q.ilike('field_of_study', `%${filters.field}%`);
    if (filters.language)     q = q.eq('language', filters.language);
    if (filters.min_gpa)      q = q.lte('min_gpa', Number(filters.min_gpa));
    if (filters.min_ielts)    q = q.lte('min_ielts', Number(filters.min_ielts));
    if (filters.deadline_from) q = q.gte('deadline', filters.deadline_from);
    if (filters.deadline_to)  q = q.lte('deadline', filters.deadline_to);
    if (filters.amount_min)   q = q.gte('amount', Number(filters.amount_min));
    if (filters.coverage)     q = q.eq('coverage', filters.coverage);
    if (filters.featured === 'true' || filters.featured === true) q = q.eq('is_featured', true);
    if (filters.search)       q = q.or(`title.ilike.%${filters.search}%,provider.ilike.%${filters.search}%`);
    return q;
  }

  async #attachSavedStatus(rows, userId) {
    if (!userId || rows.length === 0) return rows.map(r => ({ ...r, is_saved: false }));
    const ids = rows.map(r => r.id);
    const { data } = await this.#sb
      .from('saved_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId)
      .in('scholarship_id', ids);
    const savedIds = new Set((data || []).map(r => r.scholarship_id));
    return rows.map(r => ({ ...r, is_saved: savedIds.has(r.id) }));
  }

  async #checkSavedStatus(userId, scholarshipId) {
    if (!userId) return false;
    const { data } = await this.#sb
      .from('saved_scholarships')
      .select('id')
      .eq('user_id', userId)
      .eq('scholarship_id', scholarshipId)
      .maybeSingle();
    return !!data;
  }
}

module.exports = ScholarshipRepository;
