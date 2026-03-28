import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScholarships } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn, formatCurrency } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tìm Học Bổng</h1>
        <p className="text-gray-600">Tìm kiếm học bổng phù hợp với profile của bạn</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="search"
            type="text"
            placeholder="Tìm kiếm theo tên học bổng, trường..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn('px-4 py-3 border rounded-xl font-medium flex items-center gap-2 transition-colors', showFilters ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300')}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Bộ lọc</span>
        </button>
        <button type="submit" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors">
          Tìm
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
              <input type="text" placeholder="VD: UK, USA, Australia" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" onChange={(e) => handleFilterChange('country', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bậc học</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" onChange={(e) => handleFilterChange('degree', e.target.value)}>
                <option value="">Tất cả</option>
                {DEGREES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" onChange={(e) => handleFilterChange('language', e.target.value)}>
                <option value="">Tất cả</option>
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" onChange={(e) => handleFilterChange('coverage', e.target.value)}>
                <option value="">Tất cả</option>
                {COVERAGES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-700 font-medium">Xóa bộ lọc</button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            {isFetching && <span className="text-primary-600">Đang tải...</span>}
            {!isFetching && <span>Tìm thấy <strong>{meta.total || 0}</strong> học bổng</span>}
          </div>

          {scholarships.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy học bổng nào</h3>
              <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={handleReset} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">Xóa bộ lọc</button>
            </div>
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
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-gray-700 font-medium">{page} / {meta.totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
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
