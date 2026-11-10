import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Card } from '~/components/ui/card';

// Nhiều học bổng cào về chỉ có tiêu đề: không có mục nào để chia tab
export default function EmptyDetail() {
  return (
    <Card className="mt-6 flex flex-col items-center border-dashed px-6 py-10 text-center shadow-none">
      <DocumentMagnifyingGlassIcon className="size-10 text-brand-200" aria-hidden="true" />
      <p className="mt-3 text-block-title text-heading">Chưa có mô tả chi tiết</p>
      <p className="mt-1 max-w-md text-sm text-fg-muted">
        Nguồn tin chưa đăng quyền lợi, điều kiện và hồ sơ của học bổng này. Hãy xem trang của nhà tài trợ để có thông tin mới nhất.
      </p>
    </Card>
  );
}
