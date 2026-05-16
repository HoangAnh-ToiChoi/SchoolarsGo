const getSupabase = require('../utils/supabase');

const PAGE_SIZE = 20;
const MAX_LIMIT = 50;

const LIST_COLS = 'id, title, provider, country, degree, amount, currency, coverage, deadline, language, min_gpa, image_url, is_featured';

const getAll = async (filters) => {
  const sb = getSupabase();
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || PAGE_SIZE));
  const offset = (page - 1) * limit;
  const now = new Date().toISOString();

  let q = sb.from('scholarships').select(LIST_COLS, { count: 'exact' })
    .eq('is_active', true)
    .gt('deadline', now);

  if (filters.country)      q = q.ilike('country', `%${filters.country}%`);
  if (filters.degree)       q = q.eq('degree', filters.degree);
  if (filters.field)        q = q.ilike('field_of_study', `%${filters.field}%`);
  if (filters.language)     q = q.eq('language', filters.language);
  if (filters.min_gpa)      q = q.lte('min_gpa', Number(filters.min_gpa));
  if (filters.min_ielts)    q = q.lte('min_ielts', Number(filters.min_ielts));
  if (filters.deadline_from) q = q.gte('deadline', filters.deadline_from);
  if (filters.deadline_to)   q = q.lte('deadline', filters.deadline_to);
  if (filters.amount_min)   q = q.gte('amount', Number(filters.amount_min));
  if (filters.coverage)     q = q.eq('coverage', filters.coverage);
  if (filters.featured === 'true' || filters.featured === true) q = q.eq('is_featured', true);
  if (filters.search)       q = q.or(`title.ilike.%${filters.search}%,provider.ilike.%${filters.search}%`);

  const { data, count, error } = await q.order('deadline', { ascending: true }).range(offset, offset + limit - 1);

  if (error) throw error;

  const total = count ?? 0;
  return {
    data: data || [],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getFeatured = async () => {
  const { data, error } = await getSupabase().from('scholarships')
    .select('id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured')
    .eq('is_active', true)
    .eq('is_featured', true)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data || [];
};

const getCountries = async () => {
  const { data, error } = await getSupabase().from('scholarships')
    .select('country')
    .eq('is_active', true)
    .not('country', 'is', null)
    .order('country', { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data || []).map(r => r.country).filter(Boolean))];
  return unique;
};

const getById = async (id, userId) => {
  const sb = getSupabase();
  const { data: scholarship, error } = await sb.from('scholarships')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .gt('deadline', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!scholarship) {
    const err = new Error('Không tìm thấy học bổng');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  let isSaved = false;
  if (userId) {
    const { data: saved } = await sb.from('saved_scholarships')
      .select('id').eq('user_id', userId).eq('scholarship_id', id).maybeSingle();
    isSaved = !!saved;
  }

  return { ...scholarship, is_saved: isSaved };
};

module.exports = { getAll, getFeatured, getCountries, getById };
