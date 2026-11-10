import Reveal from '~/components/common/reveal';
import ScholarshipCard from '~/components/scholarship/scholarshipCard';
import ScholarshipCardSkeleton from '~/components/scholarship/scholarshipCardSkeleton';
import { useScholarships } from '~/hooks/useScholarship';

const SIMILAR_LIMIT = 3;

// Học bổng cùng quốc gia + bậc học, trừ học bổng đang xem.
// Đây là phần phụ: lỗi hoặc không có kết quả thì ẩn cả mục, không làm phiền người đọc.
export default function SimilarScholarships({ scholarship }) {
  const { id, country, degree } = scholarship;
  // Lấy dư 1 vì kết quả có thể chứa chính học bổng đang xem
  const { data, isLoading, isError } = useScholarships({ country, degree, limit: SIMILAR_LIMIT + 1 });
  const items = (data?.data ?? []).filter((s) => s.id !== id).slice(0, SIMILAR_LIMIT);

  if (isError || (!isLoading && items.length === 0)) return null;

  return (
    <section aria-labelledby="similar-title" className="mt-8">
      <h2 id="similar-title" className="mb-3 text-card-title text-heading">
        Học bổng tương tự
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
        {isLoading
          ? Array.from({ length: SIMILAR_LIMIT }, (_, i) => <ScholarshipCardSkeleton key={i} />)
          : items.map((s, i) => (
              <Reveal key={s.id} index={i} className="flex">
                <ScholarshipCard scholarship={s} />
              </Reveal>
            ))}
      </div>
    </section>
  );
}
