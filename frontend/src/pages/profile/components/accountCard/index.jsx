import { useAccount } from '~/hooks/useAuth';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

function formatDate(val) {
  if (!val) return 'Chưa cập nhật';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('vi-VN');
  } catch {
    return String(val);
  }
}

export default function AccountCard() {
  const { data: account, isLoading, isError, refetch } = useAccount();

  if (isLoading) {
    return (
      <Card className="space-y-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-10 w-full rounded-control" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center p-6 text-center sm:p-8">
        <AlertCircle className="size-8 text-urgent-fg" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-heading">Không tải được thông tin tài khoản.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          Thử lại
        </Button>
      </Card>
    );
  }

  return (
    <section className="rounded-tile border border-line bg-surface p-6 shadow-tile sm:p-8">
      <h2 className="mb-4 border-b border-line pb-3 text-lg font-semibold text-heading">
        Thông tin tài khoản
      </h2>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs text-fg-muted">Email</dt>
          <dd className="mt-1 truncate text-sm font-medium text-fg">
            {account?.email || 'Chưa cập nhật'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-fg-muted">Số điện thoại</dt>
          <dd className="mt-1 truncate text-sm font-medium text-fg">
            {account?.phone || 'Chưa cập nhật'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-fg-muted">Ngày sinh</dt>
          <dd className="mt-1 truncate text-sm font-medium text-fg">
            {formatDate(account?.date_of_birth)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
