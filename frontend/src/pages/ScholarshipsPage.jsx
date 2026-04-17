import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useScholarships, useCountries } from '../hooks/useScholarship';
import { DEGREES, LANGUAGES, COVERAGES, PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/helpers';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Badge, Button, EmptyState, Input, PageHeader, Select } from '../components/ui';

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
    search: `Tu khoa: ${value}`,
    country: `Quoc gia: ${value}`,
    degree: `Bac hoc: ${value}`,
    language: `Ngon ngu: ${value}`,
    coverage: `Pham vi: ${value}`,
    field: `Nganh: ${value}`,
    min_gpa: `GPA tu ${value}`,
    min_ielts: `IELTS tu ${value}`,
    amount_min: `Hoc bong tu ${value}`,
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
    <div className="container-page py-8">
      <PageHeader
        title="Tim Hoc Bong"
        description="Loc theo muc tieu hoc tap, dieu kien dau vao va muc ho tro tai chinh de ra shortlist nhanh hon."
        actions={
          activeFilters.length > 0 ? (
            <Button variant="ghost" onClick={handleReset}>
              Xoa tat ca
            </Button>
          ) : null
        }
      />

      <form onSubmit={handleSearch} className="mb-6 grid gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Input
          name="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          type="text"
          placeholder="Tim theo ten hoc bong, truong, to chuc cap hoc bong..."
          icon={Search}
          wrapperClassName="min-w-0"
        />
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
          <span className="hidden sm:inline">Bo loc</span>
        </button>
        <Button type="submit">Tìm</Button>
      </form>

      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map(([key, value]) => (
            <Badge key={`${key}-${value}`} color="blue" className="gap-2 rounded-full px-3 py-1.5">
              <span>{getFilterLabel(key, value)}</span>
              <button
                type="button"
                onClick={() => handleFilterChange(key, undefined)}
                className="text-primary-700 transition hover:text-primary-900"
                aria-label={`Xoa bo loc ${key}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="card card-body mb-6 animate-slide-down">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              label="Mức hỗ trợ tối thiểu"
              type="number"
              min="0"
              step="100"
              value={filters.amount_min || ''}
              placeholder="VD: 5000"
              onChange={(e) => handleFilterChange('amount_min', e.target.value)}
            />
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={handleReset}>Xóa bộ lọc</Button>
            <Button onClick={() => setShowFilters(false)} variant="secondary">Ẩn bộ lọc</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 rounded-card border border-slate-200 bg-white p-4 text-body text-slate-600 shadow-card sm:flex-row sm:items-center sm:justify-between">
            {isFetching ? (
              <span className="flex items-center gap-2 text-primary-600">
                <span className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin inline-block" />
                Dang tai du lieu moi...
              </span>
            ) : (
              <span>
                Hien thi <strong>{startResult}-{endResult}</strong> tren <strong>{meta.total || 0}</strong> hoc bong
              </span>
            )}
            <span className="text-body-sm text-slate-500">Trang {currentPage} / {totalPages}</span>
          </div>

          {scholarships.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Khong tim thay hoc bong nao"
              description="Thu mo rong tu khoa, bo bot dieu kien loc hoac quay lai danh sach tong." 
              actionLabel="Xoa bo loc"
              actionTo="/scholarships"
            />
          ) : (
            <>
              <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300', isFetching && 'opacity-50 pointer-events-none')}>
                {scholarships.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => updateSearchParams({ page: Math.max(1, currentPage - 1) })}
                    disabled={currentPage === 1}
                    className="btn-secondary btn-sm p-2"
                    aria-label="Trang truoc"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {pageItems.map((item, index) => (
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => updateSearchParams({ page: item })}
                        className={cn('btn-sm min-w-10 rounded-button px-3 py-2', item === currentPage ? 'btn-primary' : 'btn-secondary')}
                      >
                        {item}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => updateSearchParams({ page: Math.min(totalPages, currentPage + 1) })}
                    disabled={currentPage === totalPages}
                    className="btn-secondary btn-sm p-2"
                    aria-label="Trang sau"
                  >
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
