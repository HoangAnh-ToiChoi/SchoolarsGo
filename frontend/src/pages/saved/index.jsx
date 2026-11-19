import { Link } from 'react-router-dom';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import PageHeader from '~/components/common/pageHeader';
import Reveal from '~/components/common/reveal';
import SlowLoading from '~/components/common/slowLoading';
import ScholarshipCard from '~/components/scholarship/scholarshipCard';
import ScholarshipCardSkeleton from '~/components/scholarship/scholarshipCardSkeleton';
import ScholarshipGrid from '~/components/scholarship/scholarshipGrid';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useSavedScholarships } from '~/hooks/useScholarship';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import { sortByDeadline } from '~/utils/scholarship';

// Học bổng đã lưu: dùng chung thẻ và lưới với trang chủ để hai nơi nhìn giống hệt nhau.
// Bỏ lưu bằng nút lưu ở góc thẻ — thẻ tự biến mất khỏi danh sách.
export default function SavedPage() {
  const { data, isLoading, isError, refetch } = useSavedScholarships();
  const isSlow = useSlowLoading(isLoading);

  // Gần hết hạn lên đầu để sinh viên thấy việc cần làm trước
  const scholarships = sortByDeadline((data?.data ?? []).map((item) => item.scholarship).filter(Boolean));

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-labelledby="saved-title">
      <PageHeader
        title={<span id="saved-title">Học bổng đã lưu</span>}
        description={isLoading ? 'Đang cập nhật…' : `${scholarships.length} học bổng · gần hết hạn xếp trước`}
      />
      {isSlow && <SlowLoading />}

      {isError ? (
        <Card className="p-8 text-center">
          <p className="font-semibold">Không tải được danh sách đã lưu</p>
          <Button variant="link" onClick={() => refetch()} className="mt-1">
            Thử lại
          </Button>
        </Card>
      ) : !isLoading && scholarships.length === 0 ? (
        <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <BookmarkIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-block-title text-heading">Chưa lưu học bổng nào</p>
          <p className="mt-1 max-w-sm text-sm text-fg-muted">
            Bấm biểu tượng lưu ở góc thẻ học bổng để đưa vào đây và nhận nhắc hạn nộp.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">Tìm học bổng</Link>
          </Button>
        </Card>
      ) : (
        <ScholarshipGrid>
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => <ScholarshipCardSkeleton key={i} />)
            : scholarships.map((s, i) => (
                <Reveal key={s.id} index={i} className="flex">
                  <ScholarshipCard scholarship={s} />
                </Reveal>
              ))}
        </ScholarshipGrid>
      )}
    </section>
  );
}
