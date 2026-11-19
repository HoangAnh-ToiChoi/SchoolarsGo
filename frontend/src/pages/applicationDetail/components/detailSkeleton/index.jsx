import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

// Khung chờ cùng bố cục với trang thật để nội dung không nhảy khi tải xong
export default function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-3/4 max-w-[520px]" />
        <Skeleton className="h-6 w-64" />
      </div>
      <Skeleton className="h-[84px] rounded-tile" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex flex-col gap-4 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-1.5 w-full" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
        <Skeleton className="h-[220px] rounded-tile" />
      </div>
    </div>
  );
}
