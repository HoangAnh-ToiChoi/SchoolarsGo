import { useDispatch } from 'react-redux';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid';
import PageHeader from '~/components/common/page-header';
import Pagination from '~/components/common/pagination';
import Reveal from '~/components/common/reveal';
import SlowLoading from '~/components/common/slow-loading';
import ScholarshipCard from '~/components/scholarship/scholarship-card';
import ScholarshipCardSkeleton from '~/components/scholarship/scholarship-card-skeleton';
import { ActiveFilters } from '~/components/scholarship-filter';
import { Button } from '~/components/ui/button';
import { useScholarships } from '~/hooks/useScholarship';
import { useScholarshipFilters } from '~/hooks/useScholarshipFilters';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import { PAGE_SIZE } from '~/lib/constants';
import { filterOpened } from '~/store/slices/uiSlice';

// Trang Tìm học bổng. Từ khóa và bộ lọc nhập ở thanh tìm kiếm trên header;
// trang này chỉ hiện kết quả + nhãn bộ lọc đang bật.
export default function ScholarshipsPage() {
  const dispatch = useDispatch();
  const { filters, page, activeCount, setPage } = useScholarshipFilters();
  const { data, isLoading, isError, refetch } = useScholarships({ ...filters, page, limit: PAGE_SIZE });
  const isSlow = useSlowLoading(isLoading);

  const scholarships = data?.data ?? [];
  const meta = data?.meta;
  const description = meta
    ? `${meta.total} kết quả${filters.search ? ` cho “${filters.search}”` : ''}`
    : 'Đang tìm…';

  const goToPage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tìm học bổng"
        description={description}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch(filterOpened())}
            className="h-filter gap-2 rounded-control border-line px-3 text-[13px] font-semibold shadow-none hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
          >
            <AdjustmentsHorizontalIcon aria-hidden="true" />
            Bộ lọc
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] text-white">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <ActiveFilters />
      {isSlow && <SlowLoading />}

      {isError ? (
        <div className="rounded-tile border border-line bg-surface p-8 text-center">
          <p className="font-semibold">Không tải được học bổng</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <ScholarshipCardSkeleton key={i} />)
            : scholarships.map((s, i) => (
                <Reveal key={`${page}-${s.id}`} index={i} className="flex">
                  <ScholarshipCard scholarship={s} />
                </Reveal>
              ))}
        </div>
      )}
      {!isLoading && !isError && scholarships.length === 0 && (
        <p className="rounded-tile border border-dashed border-line bg-surface p-8 text-center text-sm text-fg-muted">
          Không có học bổng phù hợp. Thử bỏ bớt bộ lọc hoặc đổi từ khóa.
        </p>
      )}
      {meta && <Pagination page={meta.page ?? page} totalPages={meta.totalPages ?? 1} onChange={goToPage} />}
    </div>
  );
}
