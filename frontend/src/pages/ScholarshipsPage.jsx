import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useScholarships, useCountries } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Input, Select } from '../components/ui';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import AnimatedPage from '../components/ui/AnimatedPage';
import AnimatedList from '../components/ui/AnimatedList';
import AnimatedItem from '../components/ui/AnimatedItem';
import { useThemeStore } from '../stores/themeStore';

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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

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
    <AnimatedPage className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-16">
      <AuroraBackground />

      {/* Premium Hero Search Section */}
      <div className="relative z-10 pb-16 pt-24 md:pt-32 mb-12">
        {/* Background Animation for Search Section */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-40 dark:opacity-70">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-cyan-600/20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-[80px] rounded-full animate-[spin_12s_linear_infinite]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        </div>

        <div className="container-page relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-300 animate-pulse" />
              <span className="text-purple-700 dark:text-purple-100">Khám phá hàng ngàn học bổng toàn cầu</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white dark:to-white/70">
              Tìm Kiếm Học Bổng
            </h1>
            <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
              Lọc theo mục tiêu học tập, điều kiện đầu vào và mức hỗ trợ tài chính để ra shortlist nhanh chóng.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 p-2.5 bg-white/90 dark:bg-[#0a0a1a]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/15 rounded-2xl sm:rounded-full shadow-[0_0_40px_rgba(168,85,247,0.1)] hover:shadow-[0_0_60px_rgba(168,85,247,0.2)] hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-500">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-white/50" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tên học bổng, trường, tổ chức..."
                className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 pl-12 pr-4 py-3 focus:outline-none focus:ring-0 text-base"
              />
            </div>
            <div className="flex gap-2 px-2 sm:px-0 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-full font-medium transition-all duration-300 flex-1 sm:flex-none',
                  showFilters
                    ? 'bg-gray-200 dark:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/30 shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-transparent'
                )}
              >
                <Filter className="w-5 h-5" />
                Bộ lọc
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-8 py-3 rounded-xl sm:rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex-1 sm:flex-none"
              >
                Tìm
              </button>
            </div>
          </form>

          {activeFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
              <span className="text-sm text-gray-500 dark:text-white/50 mr-2">Đang lọc theo:</span>
              {activeFilters.map(([key, value]) => (
                <div key={`${key}-${value}`} className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1 text-sm text-gray-700 dark:text-white border border-gray-200 dark:border-white/20 backdrop-blur-md transition-all hover:bg-gray-200 dark:hover:bg-white/20">
                  <span>{getFilterLabel(key, value)}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(key, undefined)}
                    className="text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors ml-2 underline underline-offset-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-page relative z-10">
        {/* Advanced Filters Panel */}
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          showFilters ? "max-h-[800px] opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"
        )}>
          <div className="bg-white dark:bg-[#0a0a1a]/80 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.08)] p-6 sm:p-8 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                Bộ lọc nâng cao
              </h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full p-1.5 transition-colors">
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

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-white/10">
              <Button variant="ghost" onClick={handleReset} className="text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-6 border-none">
                Làm mới
              </Button>
              <Button onClick={() => setShowFilters(false)} className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl px-8 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 border-none transition-all">
                Áp dụng
              </Button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isFetching ? (
            <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-300 bg-gray-100 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 w-fit">
              <span className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin inline-block" />
              <span className="text-sm font-medium">Đang tải dữ liệu mới...</span>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-white/60">
              Hiển thị <strong className="text-gray-900 dark:text-white">{startResult}-{endResult}</strong> trên <strong className="text-gray-900 dark:text-white">{meta.total || 0}</strong> học bổng
            </div>
          )}
          {meta.total > 0 && (
            <div className="text-sm font-medium text-gray-600 dark:text-white/80 bg-gray-100 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10">
              Trang {currentPage} / {totalPages}
            </div>
          )}
        </div>

        {/* Scholarship Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : scholarships.length === 0 ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-12 text-center mt-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-400 dark:text-white/40" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy học bổng nào</h3>
            <p className="text-gray-500 dark:text-white/50 max-w-md mx-auto mb-8">
              Rất tiếc, không có học bổng nào phù hợp với tiêu chí tìm kiếm hiện tại của bạn. Thử thay đổi bộ lọc hoặc từ khóa.
            </p>
            <button
              onClick={handleReset}
              className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-full px-8 py-2.5 transition-colors border border-gray-200 dark:border-white/20"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <AnimatedList className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300', isFetching && 'opacity-60 blur-[2px] scale-[0.99] pointer-events-none')}>
            {scholarships.map((s) => (
              <AnimatedItem key={s.id}>
                <ScholarshipCard scholarship={s} isDark={isDark} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && scholarships.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => updateSearchParams({ page: Math.max(1, currentPage - 1) })}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {pageItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400 dark:text-white/40">...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateSearchParams({ page: item })}
                  className={cn(
                    'min-w-[40px] h-10 px-3 rounded-xl font-medium transition-all',
                    item === currentPage
                      ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border-none'
                      : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {item}
                </button>
              )
            ))}

            <button
              onClick={() => updateSearchParams({ page: Math.min(totalPages, currentPage + 1) })}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ScholarshipsPage;
