import { Link } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/20/solid';
import { DropdownMenuItem } from '~/components/ui/dropdownMenu';
import { cn } from '~/utils/cn';
import { formatDate } from '~/utils/format';
import { scholarshipPath } from '~/utils/scholarship';

// Màu icon theo độ gấp, cùng thang với nhãn hạn nộp trên thẻ
const TONE_CLASS = {
  urgent: 'bg-urgent-bg text-urgent-fg',
  soon: 'bg-soon-bg text-soon-fg',
  open: 'bg-open-bg text-open-fg',
};

const SOURCE_LABELS = { saved: 'Học bổng đã lưu', application: 'Đơn đang chuẩn bị' };

const describe = (daysLeft) => (daysLeft === 0 ? 'hết hạn hôm nay' : `còn ${daysLeft} ngày là hết hạn`);

export default function NotificationItem({ item, onRead }) {
  const { scholarship, daysLeft, tone, source, unread } = item;
  return (
    <DropdownMenuItem asChild onSelect={onRead} className="items-start gap-3 rounded-control px-2.5 py-2.5 focus:bg-hover">
      <Link to={item.to ?? scholarshipPath(scholarship)}>
        <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', TONE_CLASS[tone])}>
          <ClockIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-[13.5px] leading-snug text-fg', unread && 'font-medium')}>
            <span className="font-semibold">{scholarship.title}</span> {describe(daysLeft)}
          </span>
          <span className="mt-0.5 block text-xs text-fg-muted">
            {SOURCE_LABELS[source]} · hạn {formatDate(scholarship.deadline)}
          </span>
        </span>
        {unread && (
          <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-600">
            <span className="sr-only">Chưa đọc</span>
          </span>
        )}
      </Link>
    </DropdownMenuItem>
  );
}
