const { supabase, supabaseAdmin } = require('./supabase');

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

// Build Supabase query từ filters
const buildFilters = (query, filters) => {
  const {
    country,
    degree,
    field,
    language,
    min_gpa,
    min_ielts,
    deadline_from,
    deadline_to,
    amount_min,
    coverage,
    featured,
    search,
  } = filters;

  if (country) query = query.ilike('country', `%${country}%`);
  if (degree) query = query.eq('degree', degree);
  if (field) query = query.ilike('field_of_study', `%${field}%`);
  if (language) query = query.eq('language', language);
  if (min_gpa) query = query.lte('min_gpa', Number(min_gpa));
  if (min_ielts) query = query.lte('min_ielts', Number(min_ielts));
  if (deadline_from) query = query.gte('deadline', deadline_from);
  if (deadline_to) query = query.lte('deadline', deadline_to);
  if (amount_min) query = query.gte('amount', Number(amount_min));
  if (coverage) query = query.eq('coverage', coverage);
  if (featured !== undefined) query = query.eq('is_featured', featured === 'true' || featured === true);

  // Chỉ hiển thị scholarships còn hạn và active
  query = query.eq('is_active', true);
  query = query.gte('deadline', new Date().toISOString());

  if (search) {
    query = query.or(`title.ilike.%${search}%,provider.ilike.%${search}%`);
  }

  return query;
};

const getAll = async (filters) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('scholarships')
    .select('id, title, provider, country, degree, amount, currency, coverage, deadline, language, min_gpa, image_url, is_featured', { count: 'exact' });

  query = buildFilters(query, filters);
  query = query.order('deadline', { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: { page, limit, total, totalPages },
  };
};

const getFeatured = async () => {
  const { data, error } = await supabase
    .from('scholarships')
    .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
    .eq('is_featured', true)
    .eq('is_active', true)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data;
};

const getCountries = async () => {
  const { data, error } = await supabase
    .from('scholarships')
    .select('country')
    .eq('is_active', true)
    .not('country', 'is', null)
    .order('country');

  if (error) throw error;

  // Loại bỏ duplicates
  const countries = [...new Set(data.map((r) => r.country))];
  return countries;
};

const getById = async (id, userId) => {
  const { data, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Kiểm tra user đã save chưa
  let isSaved = false;
  if (userId) {
    const { data: saved } = await supabase
      .from('saved_scholarships')
      .select('id')
      .eq('user_id', userId)
      .eq('scholarship_id', id)
      .single();
    isSaved = !!saved;
  }

  return { ...data, is_saved: isSaved };
};

module.exports = { getAll, getFeatured, getCountries, getById };
