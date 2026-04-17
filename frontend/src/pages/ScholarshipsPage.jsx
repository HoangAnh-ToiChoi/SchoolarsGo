import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScholarships } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Select, EmptyState, PageHeader } from '../components/ui';

const FILTER_KEYS = ['search', 'country', 'degree', 'language', 'coverage', 'field'];

const normalizeFilters = (searchParams) => {
  const filters = {};
  FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });
  return filters;
};

const serializeParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams;
};

const ScholarshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');

  const currentFilters = useMemo(() => normalizeFilters(searchParams), [searchParams]);
  const page = Number(searchParams.get('page') || 1);
  const query = useMemo(() => ({ ...currentFilters, page, limit: PAGE_SIZE }), [currentFilters, page]);

  const { data, isLoading, isFetching } = useScholarships(query);
  const scholarships = data?.data || [];
  const meta = data?.meta || {};

  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  const updateQuery = (next) => {
    setSearchParams(serializeParams(next), { replace: true });
  };

  const handleFilterChange = (key, value) => {
    updateQuery({ ...currentFilters, [key]: value || undefined, page: 1 });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchText.trim() || undefined);
  };

  const handleReset = () => {
    setSearchText('');
    setShowFilters(false);
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (newPage) => {
    updateQuery({ ...currentFilters, page: newPage });
  };

  return (
    <div className="container-page py-8">
      <PageHeader title="Tìm Học Bổng" description="Tìm kiếm học bổng phù hợp với profile của bạn" />

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="search"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm theo tên học bổng, trường..."
            className="input-with-icon"
          />
        </div>

        <div className="flex items-stretch gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              'btn',
              showFilters ? 'btn-primary' : 'btn-secondary'
            )}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
          <Button type="submit">Tìm</Button>
        </div>
      </form>

      {showFilters && (
        <div className="card card-body mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="input-label">Quốc gia</label>
              <input
                type="text"
                value={currentFilters.country || ''}
                placeholder="VD: UK, USA, Australia"
                className="input"
                onChange={(e) => handleFilterChange('country', e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Ngành học</label>
              <input
                type="text"
                value={currentFilters.field || ''}
                placeholder="VD: Computer Science"
                className="input"
                onChange={(e) => handleFilterChange('field', e.target.value)}
              />
            </div>
            <Select
              label="Bậc học"
              name="degree"
              options={DEGREES}
              placeholder="Tất cả"
              value={currentFilters.degree || ''}
              onChange={(e) => handleFilterChange('degree', e.target.value)}
            />
            <Select
              label="Ngôn ngữ"
              name="language"
              options={LANGUAGES}
              placeholder="Tất cả"
              value={currentFilters.language || ''}
              onChange={(e) => handleFilterChange('language', e.target.value)}
            />
            <Select
              label="Phạm vi"
              name="coverage"
              options={COVERAGES}
              placeholder="Tất cả"
              value={currentFilters.coverage || ''}
              onChange={(e) => handleFilterChange('coverage', e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-3">
            <div className="text-sm text-gray-500">{Object.keys(currentFilters).length > 0 && <span>Đang lọc theo {Object.keys(currentFilters).filter((key) => key !== 'search').length} điều kiện</span>}</div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleReset}>Xóa bộ lọc</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-body text-gray-600">
        {isFetching ? (
          <span className="text-primary-600">Đang tải...</span>
        ) : (
          <span>Tìm thấy <strong>{meta.total ?? 0}</strong> học bổng</span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((s) => (
              <ScholarshipCard key={s.id} scholarship={s} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary btn-sm p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-body font-medium text-gray-700">{page} / {meta.totalPages}</span>
              <button
                onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="btn-secondary btn-sm p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScholarshipsPage;
