import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import Reveal from '~/components/common/reveal';
import SlowLoading from '~/components/common/slowLoading';
import { useScholarship } from '~/hooks/useScholarship';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import ActionPanel from '~/pages/scholarshipDetail/components/actionPanel';
import DetailHeader from '~/pages/scholarshipDetail/components/detailHeader';
import DetailMessage from '~/pages/scholarshipDetail/components/detailMessage';
import DetailTabs from '~/pages/scholarshipDetail/components/detailTabs';
import DetailSkeleton from '~/pages/scholarshipDetail/components/detailSkeleton';
import SimilarScholarships from '~/pages/scholarshipDetail/components/similarScholarships';
import { buildSections } from '~/pages/scholarshipDetail/helper';

// Trang chi tiết học bổng (/scholarships/:slug). :slug là slug của học bổng; link cũ dùng UUID vẫn mở được
// (backend nhận cả hai). Trang chỉ ghép component, không gọi API trực tiếp.
export default function ScholarshipDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError, error, refetch } = useScholarship(slug);
  const isSlow = useSlowLoading(isLoading);
  const scholarship = data?.data;
  const sections = useMemo(() => (scholarship ? buildSections(scholarship) : []), [scholarship]);

  // Bấm sang học bổng tương tự (cuối trang) thì trang mới phải bắt đầu từ đầu
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) return <DetailSkeleton notice={isSlow && <SlowLoading />} />;

  if (isError && error?.status !== 404) {
    return (
      <DetailMessage
        icon={ExclamationTriangleIcon}
        title="Không tải được học bổng"
        description={error?.message || 'Có lỗi khi kết nối máy chủ, vui lòng thử lại.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!scholarship) {
    return (
      <DetailMessage
        icon={DocumentMagnifyingGlassIcon}
        title="Không tìm thấy học bổng"
        description="Học bổng này không tồn tại, đã hết hạn hoặc đã bị gỡ. Hãy xem các học bổng đang mở ở trang chủ."
      />
    );
  }

  return (
    // key: chuyển sang học bổng khác thì dựng lại toàn bộ (mục lục, hiệu ứng) từ đầu
    <div key={scholarship.id}>
      <Reveal>
        <DetailHeader scholarship={scholarship} />
      </Reveal>

      <Reveal index={1} className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <DetailTabs sections={sections} />
        </div>
        {/* Màn hình hẹp: khung hành động lên trước nội dung để nút nộp đơn luôn trong tầm mắt */}
        <aside aria-label="Hành động" className="order-first mt-6 lg:sticky lg:top-[88px] lg:order-none">
          <ActionPanel scholarship={scholarship} />
        </aside>
      </Reveal>

      <SimilarScholarships scholarship={scholarship} />
    </div>
  );
}
