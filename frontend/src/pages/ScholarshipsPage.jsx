import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { useScholarships, useCountries } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import { Button, Select, EmptyState } from '../components/ui';

const DEGREE_PILLS = [
  { label: 'Đại học', value: 'Bachelor' },
  { label: 'Thạc sĩ', value: 'Master' },
  { label: 'Tiến sĩ', value: 'PhD' },
];

const FILTER_LABELS = {
  search: (v) => `"${v}"`,
  country: (v) => v,
  degree: (v) => ({ Bachelor: 'Đại học', Master: 'Thạc sĩ', PhD: 'Tiến sĩ' }[v] || v),
  language: (v) => v,
  coverage: (v) => v,
};

const SkeletonCard = () => (
  <div className="card overflow-hidden animate-pulse">
    <div className="h-1 bg-gray-200 w-full" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 bg-gray-100 rounded-full w-20" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="pt-3 border-t border-gray-50">
        <div className="h-5 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  </div>
);

const ScholarshipsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filterKey, setFilterKey] = useState(0);

  const { data, isLoading, isFetching } = useScholarships({ ...filters, page, limit: PAGE_SIZE });
  const { data: countriesResp } = useCountries();
  const countryOptions = (countriesResp?.data || []).map((c) => ({ value: c, label: c }));

  const scholarships = data?.data || [];
  const meta = data?.meta || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };

  const removeFilter = (key) => {
    setFilters((prev) => { const next = { ...prev }; delete next[key]; return next; });
    if (key === 'search') setSearchInput('');
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setSearchInput('');
    setPage(1);
    setFilterKey((k) => k + 1);
  };

  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  const getPageNumbers = () => {
    const total = meta.totalPages || 1;
    const range = [];
    const left = Math.max(1, page - 2);
    const right = Math.min(total, page + 2);
    if (left > 1) { range.push(1); if (left > 2) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total) { if (right < total - 1) range.push('...'); range.push(total); }
    return range;
  };

  return (
    <div>
      {/* Hero Search Banner */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-heading-1 font-bold text-white mb-1 animate-fade-in">
            Khám phá học bổng quốc tế
          </h1>
          <p className="text-primary-200 mb-6 animate-fade-in" style={{ animationDelay: '0.08s' }}>
            Hơn 1,000+ học bổng từ 50+ quốc gia — tìm cơ hội phù hợp với bạn
          </p>
          <form
            onSubmit={handleSearch}
            className="flex gap-2 animate-slide-up"
            style={{ animationDelay: '0.14s' }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type="text"
                placeholder="Tìm tên học bổng, trường, quốc gia..."
                className="w-full pl-11 pr-4 py-3 rounded-button text-gray-900 text-body placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-lg"
              />
            </div>
            <Button type="submit" className="shrink-0 shadow-lg">Tìm kiếm</Button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Quick degree pills + filter toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-body-sm text-gray-500 mr-1">Bậc học:</span>
          {DEGREE_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => handleFilterChange('degree', filters.degree === pill.value ? '' : pill.value)}
              className={cn(
                'px-4 py-1.5 rounded-tag text-body-sm font-medium border transition-all duration-200 active:scale-95',
                filters.degree === pill.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700'
              )}
            >
              {pill.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'ml-auto flex items-center gap-2 px-4 py-1.5 rounded-tag text-body-sm font-medium border transition-all duration-200',
              showFilters
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc nâng cao
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div key={filterKey} className="card card-body mb-4 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Quốc gia"
                options={countryOptions}
                placeholder="Tất cả quốc gia"
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              />
              <Select
                label="Bậc học"
                options={DEGREES}
                placeholder="Tất cả"
                value={filters.degree || ''}
                onChange={(e) => handleFilterChange('degree', e.target.value)}
              />
              <Select
                label="Ngôn ngữ"
                options={LANGUAGES}
                placeholder="Tất cả"
                value={filters.language || ''}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              />
              <Select
                label="Phạm vi"
                options={COVERAGES}
                placeholder="Tất cả"
                value={filters.coverage || ''}
                onChange={(e) => handleFilterChange('coverage', e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={handleReset}>Xóa tất cả bộ lọc</Button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
            {activeFilters.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-tag text-body-sm border border-primary-100"
              >
                {FILTER_LABELS[key]?.(value) ?? value}
                <button
                  onClick={() => removeFilter(key)}
                  className="hover:text-primary-900 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <button
              onClick={handleReset}
              className="text-body-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center gap-2 mb-5 text-body-sm text-gray-500">
          {isFetching ? (
            <span className="flex items-center gap-2 text-primary-600">
              <span className="w-3.5 h-3.5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin inline-block" />
              Đang tải...
            </span>
          ) : (
            <span>
              Tìm thấy <strong className="text-gray-900">{meta.total || 0}</strong> học bổng
            </span>
          )}
        </div>

        {/* Card Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : scholarships.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy học bổng nào"
            description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
            actionLabel="Xóa bộ lọc"
            actionTo="/scholarships"
          />
        ) : (
          <>
            <div
              className={cn(
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200',
                isFetching && 'opacity-50 pointer-events-none'
              )}
            >
              {scholarships.map((s, i) => (
                <ScholarshipCard key={s.id} scholarship={s} index={i} />
              ))}
            </div>

            {/* Numbered Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-10 animate-fade-in">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-button border border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-1 text-gray-400 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-9 h-9 rounded-button text-body-sm font-medium border transition-all duration-150 active:scale-95',
                        p === page
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-button border border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScholarshipsPage;
