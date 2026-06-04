class ScholarshipRepository {
  #publicSb;
  #privateSb;

  constructor(publicSb, privateSb = publicSb) {
    this.#publicSb = publicSb;
    this.#privateSb = privateSb;
  }

  async findAll(filters = {}, limit, offset, userId = null) {
    let q = this.#publicSb.from('scholarships').select(
      'id, title, provider, country, degree, amount, currency, coverage, deadline, language, min_gpa, image_url, is_featured',
      { count: 'exact' }
    ).eq('is_active', true).gte('deadline', new Date().toISOString());

    q = this.#applyFilters(q, filters);
    q = q.order('deadline', { ascending: true }).range(offset, offset + limit - 1);

    const { data, count, error } = await q;
    if (error) throw error;

    const rows = await this.#attachSavedStatus(data || [], userId);
    return { data: rows, total: count || 0 };
  }

  async findFeatured() {
    const { data, error } = await this.#publicSb
      .from('scholarships')
      .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
      .eq('is_active', true)
      .eq('is_featured', true)
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(6);
    if (error) throw error;
    return data || [];
  }

  async findCountries() {
    const { data, error } = await this.#publicSb
      .from('scholarships')
      .select('country')
      .eq('is_active', true)
      .not('country', 'is', null)
      .order('country', { ascending: true });
    if (error) throw error;
    const unique = [...new Set((data || []).map(r => r.country))];
    return unique;
  }

  async findById(id, userId = null) {
    const { data: scholarship, error } = await this.#publicSb
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .gte('deadline', new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!scholarship) return null;

    const isSaved = await this.#checkSavedStatus(userId, id);
    return { ...scholarship, is_saved: isSaved };
  }

  #applyFilters(query, filters) {
    let filteredQuery = query;

    if (filters.country) filteredQuery = filteredQuery.ilike('country', `%${filters.country}%`);
    if (filters.degree) filteredQuery = filteredQuery.eq('degree', filters.degree);
    if (filters.field) filteredQuery = filteredQuery.ilike('field_of_study', `%${filters.field}%`);
    if (filters.language) filteredQuery = filteredQuery.eq('language', filters.language);
    if (filters.min_gpa) filteredQuery = filteredQuery.lte('min_gpa', Number(filters.min_gpa));
    if (filters.min_ielts) filteredQuery = filteredQuery.lte('min_ielts', Number(filters.min_ielts));
    if (filters.deadline_from) filteredQuery = filteredQuery.gte('deadline', filters.deadline_from);
    if (filters.deadline_to) filteredQuery = filteredQuery.lte('deadline', filters.deadline_to);
    if (filters.amount_min) filteredQuery = filteredQuery.gte('amount', Number(filters.amount_min));
    if (filters.coverage) filteredQuery = filteredQuery.eq('coverage', filters.coverage);
    if (filters.featured === 'true' || filters.featured === true) {
      filteredQuery = filteredQuery.eq('is_featured', true);
    }
    if (filters.search) {
      filteredQuery = filteredQuery.or(`title.ilike.%${filters.search}%,provider.ilike.%${filters.search}%`);
    }

    return filteredQuery;
  }

  async #attachSavedStatus(rows, userId) {
    if (!userId || rows.length === 0) return rows.map(r => ({ ...r, is_saved: false }));
    const ids = rows.map(r => r.id);
    const { data } = await this.#privateSb
      .from('saved_scholarships')
      .select('scholarship_id')
      .eq('user_id', userId)
      .in('scholarship_id', ids);
    const savedIds = new Set((data || []).map(r => r.scholarship_id));
    return rows.map(r => ({ ...r, is_saved: savedIds.has(r.id) }));
  }

  async #checkSavedStatus(userId, scholarshipId) {
    if (!userId) return false;
    const { data } = await this.#privateSb
      .from('saved_scholarships')
      .select('id')
      .eq('user_id', userId)
      .eq('scholarship_id', scholarshipId)
      .maybeSingle();
    return !!data;
  }
}

module.exports = ScholarshipRepository;
