import { useMemo, useState } from 'react';
import PageHeader from '~/components/common/PageHeader';
import ScholarshipCard from '~/components/scholarship/ScholarshipCard';
import ScholarshipCardSkeleton from '~/components/scholarship/ScholarshipCardSkeleton';
import { useScholarships } from '~/hooks/useScholarship';
import { getScope } from '~/lib/scholarship';
import FilterBar from '~/pages/home/components/FilterBar';
import ProfileProgressCard from '~/pages/home/components/ProfileProgressCard';
import ScopeTabs from '~/pages/home/components/ScopeTabs';
import UpcomingDeadlinesCard from '~/pages/home/components/UpcomingDeadlinesCard';

// Trang chủ: vào là thấy học bổng đang mở. Trang chỉ ghép component, không gọi API trực tiếp.
export default function HomePage() {
  const [scope, setScope] = useState('all');
  const [degree, setDegree] = useState();
  const { data, isLoading, isError, refetch } = useScholarships({ degree, limit: 24 });

  const all = useMemo(() => data?.data ?? [], [data]);
  // DB chưa có cột scope nên lọc Du học / Trong nước ở frontend
  const scholarships = useMemo(
    () => (scope === 'all' ? all : all.filter((s) => getScope(s) === scope)),
    [all, scope]
  );

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5" aria-labelledby="home-title">
        <PageHeader
          title={<span id="home-title">Học bổng đang mở</span>}
          description={data?.meta ? `${data.meta.total} học bổng còn hạn` : 'Đang cập nhật…'}
          actions={<ScopeTabs value={scope} onChange={setScope} />}
        />
        <FilterBar degree={degree} onDegreeChange={setDegree} />

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
              : scholarships.map((s) => <ScholarshipCard key={s.id} scholarship={s} />)}
          </div>
        )}
        {!isLoading && !isError && scholarships.length === 0 && (
          <p className="rounded-tile border border-dashed border-line bg-surface p-8 text-center text-sm text-fg-muted">
            Chưa có học bổng phù hợp bộ lọc.
          </p>
        )}
      </section>

      <aside className="flex max-w-full flex-[1_1_288px] flex-col gap-4" aria-label="Thông tin nhanh">
        <ProfileProgressCard />
        <UpcomingDeadlinesCard scholarships={all} />
      </aside>
    </div>
  );
}
