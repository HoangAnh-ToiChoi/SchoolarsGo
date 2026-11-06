import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

// Khung chờ cùng kích thước với ScholarshipCard để trang không bị nhảy khi tải xong
export default function ScholarshipCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 rounded-tile border-line p-5 shadow-tile" aria-hidden="true">
      <div className="flex gap-1.5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="ml-auto size-8" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-14 w-full rounded-inner" />
      <Skeleton className="h-6 w-28 self-center" />
    </Card>
  );
}
