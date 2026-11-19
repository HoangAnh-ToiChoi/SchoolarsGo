import { Skeleton } from '~/components/ui/skeleton';
import { Card } from '~/components/ui/card';

export default function ProfileSkeleton({ embedded = false }) {
  return (
    <div
      role="status"
      aria-label="Đang tải dữ liệu hồ sơ"
      className="mx-auto max-w-3xl space-y-6 py-6"
    >
      {!embedded && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}

      {/* AccountCard Skeleton */}
      <Card className="p-6 sm:p-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
        </div>
      </Card>

      {/* SessionList Skeleton */}
      <Card className="p-6 sm:p-8 space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </Card>

      {/* ProfileForm Skeleton */}
      <Card className="p-6 sm:p-8 space-y-5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-16 w-full rounded-inner" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control md:col-span-2" />
          <Skeleton className="h-24 w-full rounded-control md:col-span-2" />
        </div>
      </Card>

      {/* DocumentSection Skeleton */}
      <Card className="p-6 sm:p-8 space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-28 w-full rounded-inner" />
      </Card>
    </div>
  );
}
