import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScholarships } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button, Select, EmptyState, PageHeader } from '../components/ui';

const ScholarshipsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching } = useScholarships({ ...filters, page, limit: PAGE_SIZE });

  const scholarships = data?.data || [];
  const meta = data?.meta || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    handleFilterChange('search', formData.get('search'));
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  return (
    <div className="container-page py-8">
      <PageHeader title="Tìm Học Bổng" description="Tìm kiếm học bổng phù hợp với profile của bạn" />

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="search"
            type="text"
            placeholder="Tìm kiếm theo tên học bổng, trường..."
            className="input-with-icon"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn',
            showFilters
              ? 'btn-primary'
              : 'btn-secondary'
          )}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Bộ lọc</span>
        </button>
        <Button type="submit">Tìm</Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="card card-body mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="input-label">Quốc gia</label>
              <input type="text" placeholder="VD: UK, USA, Australia" className="input" onChange={(e) => handleFilterChange('country', e.target.value)} />
            </div>
            <Select label="Bậc học" options={DEGREES} placeholder="Tất cả" onChange={(e) => handleFilterChange('degree', e.target.value)} />
            <Select label="Ngôn ngữ" options={LANGUAGES} placeholder="Tất cả" onChange={(e) => handleFilterChange('language', e.target.value)} />
            <Select label="Phạm vi" options={COVERAGES} placeholder="Tất cả" onChange={(e) => handleFilterChange('coverage', e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={handleReset}>Xóa bộ lọc</Button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="mb-4 text-body text-gray-600">
            {isFetching && <span className="text-primary-600">Đang tải...</span>}
            {!isFetching && <span>Tìm thấy <strong>{meta.total || 0}</strong> học bổng</span>}
          </div>

          {scholarships.length === 0 ? (
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

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm p-2">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-body font-medium text-gray-700">{page} / {meta.totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary btn-sm p-2">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ScholarshipsPage;
