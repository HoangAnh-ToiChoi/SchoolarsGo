import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Các tham số tìm kiếm/lọc lưu trên URL: /scholarships?search=DAAD&degree=Master&page=2
export const FILTER_KEYS = ['search', 'country', 'degree', 'language', 'coverage', 'field', 'min_gpa', 'min_ielts', 'amount_min'];

export function readFilters(searchParams) {
  return FILTER_KEYS.reduce((filters, key) => {
    const value = searchParams.get(key)?.trim();
    if (value) filters[key] = value;
    return filters;
  }, {});
}

function toQueryString(filters, page = 1) {
  const params = new URLSearchParams();
  FILTER_KEYS.forEach((key) => {
    const value = String(filters[key] ?? '').trim();
    if (value) params.set(key, value);
  });
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Nguồn sự thật duy nhất cho từ khóa + bộ lọc: thanh tìm kiếm trên header và trang Tìm học bổng cùng dùng
export function useScholarshipFilters() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // Áp dụng bộ lọc mới → luôn về trang Tìm học bổng, trang 1
  const apply = (next) => navigate({ pathname: '/scholarships', search: toQueryString(next) });

  return {
    filters,
    page,
    activeCount: Object.keys(filters).length,
    apply,
    removeFilter: (key) => apply({ ...filters, [key]: undefined }),
    clearAll: () => apply({}),
    setPage: (nextPage) => navigate({ pathname: '/scholarships', search: toQueryString(filters, nextPage) }),
  };
}
