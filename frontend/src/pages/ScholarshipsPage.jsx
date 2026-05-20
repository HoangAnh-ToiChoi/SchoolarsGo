import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScholarships, useCountries } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select } from '../components/ui';

const FILTER_KEYS = ['search', 'country', 'degree', 'language', 'coverage', 'field', 'min_gpa', 'min_ielts', 'amount_min'];
const ADVANCED_FILTER_KEYS = FILTER_KEYS.filter((key) => key !== 'search');

const getSearchValue = (searchParams, key) => {
  const value = searchParams.get(key);
  return value ? value.trim() : '';
};

const getFiltersFromSearchParams = (searchParams) => {
  return FILTER_KEYS.reduce((filters, key) => {
    const value = getSearchValue(searchParams, key);
    if (value) {
      filters[key] = value;
    }
    return filters;
  }, {});
};

const getPageFromSearchParams = (searchParams) => {
  const page = Number(searchParams.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getPaginationItems = (page, totalPages) => {
  if (totalPages <= 1) return [1];

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const normalized = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);

  return normalized.flatMap((value, index) => {
    const previous = normalized[index - 1];
    if (index > 0 && previous !== value - 1) {
      return ['ellipsis', value];
    }
    return [value];
  });
};

const getFilterLabel = (key, value) => {
  const mapping = {
    search: `Từ khóa: ${value}`,
    country: `Quốc gia: ${value}`,
    degree: `Bậc học: ${value}`,
    language: `Ngôn ngữ: ${value}`,
    coverage: `Phạm vi: ${value}`,
    field: `Ngành: ${value}`,
    min_gpa: `GPA từ ${value}`,
    min_ielts: `IELTS từ ${value}`,
    amount_min: `Học bổng từ ${value}`,
  };

  return mapping[key] || `${key}: ${value}`;
};

const ScholarshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = getPageFromSearchParams(searchParams);
  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams]);
  const hasAdvancedFilters = useMemo(
    () => ADVANCED_FILTER_KEYS.some((key) => filters[key]),
    [filters]
  );
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    if (hasAdvancedFilters) {
      setShowFilters(true);
    }
  }, [hasAdvancedFilters]);

  const queryParams = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page]);

  const { data, isLoading, isFetching } = useScholarships(queryParams);
  const { data: countriesResp } = useCountries();
  const countryOptions = (countriesResp?.data || []).map((c) => ({ value: c, label: c }));

  const scholarships = data?.data || [];
  const meta = data?.meta || {};
  const activeFilters = Object.entries(filters).filter(([, value]) => !!value);
  const totalPages = meta.totalPages || 1;
  const currentPage = meta.page || page;
  const pageItems = getPaginationItems(currentPage, totalPages);
  const startResult = meta.total ? (currentPage - 1) * (meta.limit || PAGE_SIZE) + 1 : 0;
  const endResult = meta.total ? Math.min(currentPage * (meta.limit || PAGE_SIZE), meta.total) : 0;

  const updateSearchParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    if (!('page' in updates)) {
      nextParams.set('page', '1');
    }

    if (nextParams.get('page') === '1') {
      nextParams.delete('page');
    }

    setSearchParams(nextParams);
  };

  const handleFilterChange = (key, value) => {
    updateSearchParams({ [key]: value || undefined });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams({ search: searchValue.trim() || undefined });
  };

  const handleReset = () => {
    setSearchValue('');
    setSearchParams({});
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-screen bg-ink-950 pb-16">
      <div className="bg-ink-900 border-b border-ink-800 pt-8 pb-10">
        <div className="container-page max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-4 py-1.5 text-sm text-ink-300 mb-5">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span>Khám phá hàng ngàn học bổng toàn cầu</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-100 mb-4">
              Tìm Kiếm Học Bổng
            </h1>
            <p className="text-ink-400 mb-8 max-w-2xl mx-auto">
              Lọc theo mục tiêu học tập, điều kiện đầu vào và mức hỗ trợ tài chính để ra shortlist nhanh chóng.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 border border-ink-800 rounded-lg bg-ink-900 p-1.5">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-ink-500" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tên học bổng, trường, tổ chức..."
                className="flex-1 bg-ink-900 text-ink-100 placeholder:text-ink-500 pl-10 pr-4 py-2 focus:outline-none w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors',
                  showFilters
                    ? 'bg-ink-800 border-ink-700 text-ink-300'
                    : 'text-ink-400 hover:bg-ink-800 border-ink-700'
                )}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
              <button
                type="submit"
                className="bg-primary-400 text-ink-950 px-5 py-2 rounded text-sm font-semibold hover:bg-primary-300 transition-colors"
              >
                Tìm
              </button>
            </div>
          </form>

          {activeFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              <span className="text-sm text-ink-400 mr-2">Đang lọc theo:</span>
              {activeFilters.map(([key, value]) => (
                <div key={`${key}-${value}`} className="flex items-center gap-2 rounded-full bg-ink-800 border border-ink-700 px-3 py-1 text-sm text-ink-300">
                  <span>{getFilterLabel(key, value)}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(key, undefined)}
                    className="text-ink-500 hover:text-ink-100 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-primary-400 hover:text-primary-400 transition-colors ml-2 underline underline-offset-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-page">
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          showFilters ? "max-h-[800px] opacity-100 mb-8 mt-8" : "max-h-0 opacity-0 mb-0"
        )}>
          <div className="bg-ink-900 border border-ink-800 rounded-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-400" />
                Bộ lọc nâng cao
              </h3>
              <button onClick={() => setShowFilters(false)} className="text-ink-500 hover:text-ink-100 bg-ink-800 hover:bg-ink-800 rounded-full p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Quốc gia"
                options={countryOptions}
                placeholder="Tất cả quốc gia"
                value={filters.country || ''}
                onChange={(value) => handleFilterChange('country', value)}
              />
              <Select
                label="Bậc học"
                options={DEGREES}
                placeholder="Tất cả"
                value={filters.degree || ''}
                onChange={(value) => handleFilterChange('degree', value)}
              />
              <Select
                label="Ngôn ngữ"
                options={LANGUAGES}
                placeholder="Tất cả"
                value={filters.language || ''}
                onChange={(value) => handleFilterChange('language', value)}
              />
              <Select
                label="Phạm vi"
                options={COVERAGES}
                placeholder="Tất cả"
                value={filters.coverage || ''}
                onChange={(value) => handleFilterChange('coverage', value)}
              />
              <Input
                label="Ngành học"
                value={filters.field || ''}
                placeholder="VD: Data Science"
                onChange={(e) => handleFilterChange('field', e.target.value)}
              />
              <Input
                label="GPA tối thiểu"
                type="number"
                min="0"
                max="4"
                step="0.1"
                value={filters.min_gpa || ''}
                placeholder="VD: 3.2"
                onChange={(e) => handleFilterChange('min_gpa', e.target.value)}
              />
              <Input
                label="IELTS tối thiểu"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={filters.min_ielts || ''}
                placeholder="VD: 6.5"
                onChange={(e) => handleFilterChange('min_ielts', e.target.value)}
              />
              <Input
                label="Mức hỗ trợ tối thiểu ($)"
                type="number"
                min="0"
                step="100"
                value={filters.amount_min || ''}
                placeholder="VD: 5000"
                onChange={(e) => handleFilterChange('amount_min', e.target.value)}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-ink-800">
              <Button variant="secondary" onClick={handleReset}>
                Làm mới
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Áp dụng
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isFetching ? (
            <div className="flex items-center gap-3 text-primary-400 bg-primary-400/10 px-4 py-2 rounded-lg border border-ink-800 w-fit">
              <span className="w-4 h-4 border-2 border-primary-400/20 border-t-primary-400 rounded-full animate-spin inline-block" />
              <span className="text-sm font-medium">Đang tải dữ liệu mới...</span>
            </div>
          ) : (
            <div className="text-ink-400">
              Hiển thị <strong className="font-semibold text-ink-100">{startResult}-{endResult}</strong> trên <strong className="font-semibold text-ink-100">{meta.total || 0}</strong> học bổng
            </div>
          )}
          {meta.total > 0 && (
            <div className="text-sm text-ink-300 bg-ink-900 border border-ink-800 px-4 py-2 rounded">
              Trang {currentPage} / {totalPages}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : scholarships.length === 0 ? (
          <div className="bg-ink-900 border border-ink-800 rounded-card p-12 text-center mt-8">
            <div className="w-20 h-20 bg-ink-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-ink-500" />
            </div>
            <h3 className="text-xl font-bold text-ink-100 mb-2">Không tìm thấy học bổng nào</h3>
            <p className="text-ink-400 max-w-md mx-auto mb-8">
              Rất tiếc, không có học bổng nào phù hợp với tiêu chí tìm kiếm hiện tại của bạn. Thử thay đổi bộ lọc hoặc từ khóa.
            </p>
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300', isFetching && 'opacity-60 blur-[2px] scale-[0.99] pointer-events-none')}>
            {scholarships.map((s, i) => (
              <ScholarshipCard key={s.id} scholarship={s} index={i} />
            ))}
          </div>
        )}

        {totalPages > 1 && !isLoading && scholarships.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => updateSearchParams({ page: Math.max(1, currentPage - 1) })}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded border border-ink-800 bg-ink-900 text-ink-300 hover:bg-ink-800 hover:border-ink-700 disabled:opacity-30 transition-colors"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {pageItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-ink-500">...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateSearchParams({ page: item })}
                  className={cn(
                    'min-w-[40px] h-10 px-3 rounded border text-sm font-medium transition-colors',
                    item === currentPage
                      ? 'bg-primary-400 text-ink-950 border-primary-400'
                      : 'bg-ink-900 border-ink-800 text-ink-300 hover:bg-ink-800'
                  )}
                >
                  {item}
                </button>
              )
            ))}

            <button
              onClick={() => updateSearchParams({ page: Math.min(totalPages, currentPage + 1) })}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded border border-ink-800 bg-ink-900 text-ink-300 hover:bg-ink-800 hover:border-ink-700 disabled:opacity-30 transition-colors"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ScholarshipsPage;
