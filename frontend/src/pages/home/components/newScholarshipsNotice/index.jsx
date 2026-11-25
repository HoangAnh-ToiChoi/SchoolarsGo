import { SparklesIcon } from '@heroicons/react/20/solid';
import { Button } from '~/components/ui/button';
import { formatNewScholarshipCount } from '~/pages/home/helpers';

// Dải báo có học bổng mới (realtime). Không có gì mới thì không chiếm chỗ.
export default function NewScholarshipsNotice({ count, onShow }) {
  return (
    <div aria-live="polite">
      {count > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-inner border border-brand-200 bg-brand-50 px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-ui text-fg">
            <SparklesIcon className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span className="truncate">Có {formatNewScholarshipCount(count)} học bổng mới vừa được cập nhật</span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onShow}>
            Xem ngay
          </Button>
        </div>
      )}
    </div>
  );
}
