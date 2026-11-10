import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid';
import PageHeader from '~/components/common/pageHeader';
import Pagination from '~/components/common/pagination';
import Reveal from '~/components/common/reveal';
import SlowLoading from '~/components/common/slowLoading';
import ScholarshipCard from '~/components/scholarship/scholarshipCard';
import ScholarshipGrid from '~/components/scholarship/scholarshipGrid';
import ScholarshipCardSkeleton from '~/components/scholarship/scholarshipCardSkeleton';
import { Button } from '~/components/ui/button';
import { useScholarships } from '~/hooks/useScholarship';
import { useScholarshipFilters } from '~/hooks/useScholarshipFilters';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import { PAGE_SIZE } from '~/utils/constants';
import { filterOpened } from '~/store/slices/uiSlice';
import FilterBar from '~/pages/home/components/filterBar';
import ProfileProgressCard from '~/pages/home/components/profileProgressCard';
import ScopeTabs from '~/pages/home/components/scopeTabs';

// Trang chủ = trang tìm học bổng: vào là thấy học bổng đang mở; từ khóa và bộ lọc
// nhập ở thanh tìm kiếm trên header, lưu trên URL (/?search=DAAD&degree=Master).
// Trang chỉ ghép component, không gọi API trực tiếp.
export default function HomePage() {
  const dispatch = useDispatch();
  const [scope, setScope] = useState('all');
  const { filters, page, activeCount, setPage } = useScholarshipFilters();
  // Lọc Du học / Trong nước ở server để phân trang và tổng số đúng
  const { data, isLoading, isError, refetch } = useScholarships({
    ...filters,
    scope: scope === 'all' ? undefined : scope,
    page,
    limit: PAGE_SIZE,
  });
  // Tải quá 5 giây thì hiện thêm thông báo đang tải; có dữ liệu thì tự tắt
  const isSlow = useSlowLoading(isLoading);

  const scholarships = data?.data ?? [];

  // Đổi phạm vi thì quay về trang 1, tránh đứng ở trang không còn tồn tại
  const handleScopeChange = (next) => {
    setScope(next);
    if (page > 1) setPage(1);
  };

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-labelledby="home-title">
      <ProfileProgressCard />
      <PageHeader
        title={<span id="home-title">{activeCount > 0 ? 'Kết quả tìm kiếm' : 'Học bổng đang mở'}</span>}
        description={
          data?.meta
            ? `${data.meta.total} học bổng còn hạn${filters.search ? ` cho “${filters.search}”` : ''}`
            : 'Đang cập nhật…'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatch(filterOpened())}
              className="h-control rounded-inner px-3 text-[13px]"
            >
              <AdjustmentsHorizontalIcon aria-hidden="true" />
              Bộ lọc
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] text-white">
                  {activeCount}
                </span>
              )}
            </Button>
            <ScopeTabs value={scope} onChange={handleScopeChange} />
          </div>
        }
      />
      <FilterBar />
      {isSlow && <SlowLoading />}

      {isError ? (
        <div className="rounded-tile border border-line bg-surface p-8 text-center">
          <p className="font-semibold">Không tải được học bổng</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Thử lại
          </button>
        </div>
      ) : (
        <ScholarshipGrid>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <ScholarshipCardSkeleton key={i} />)
            : scholarships.map((s, i) => (
                // Chỉ chạy hiệu ứng khi đã có dữ liệu; key gồm scope để đổi tab thì thẻ trượt lên lại
                <Reveal key={`${scope}-${page}-${s.id}`} index={i} className="flex">
                  <ScholarshipCard scholarship={s} />
                </Reveal>
              ))}
        </ScholarshipGrid>
      )}
      {!isLoading && !isError && scholarships.length === 0 && (
        <p className="rounded-tile border border-dashed border-line bg-surface p-8 text-center text-sm text-fg-muted">
          Không có học bổng phù hợp. Thử bỏ bớt bộ lọc hoặc đổi từ khóa.
        </p>
      )}
      {data?.meta && (
        <Pagination
          page={data.meta.page ?? page}
          totalPages={data.meta.totalPages ?? 1}
          onChange={(next) => {
            setPage(next);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </section>
  );
}
