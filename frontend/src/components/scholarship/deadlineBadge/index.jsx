import { CalendarDaysIcon } from '@heroicons/react/16/solid';
import { Badge } from '~/components/ui/badge';
import { formatDate } from '~/utils/format';
import { getDeadlineInfo } from '~/utils/scholarship';

// "11/11/2026 · còn 5 ngày" — màu đổi theo độ gấp. Chưa rõ hạn thì hiện "Chưa rõ hạn nộp" màu trung tính.
export default function DeadlineBadge({ deadline }) {
  const { daysLeft, tone } = getDeadlineInfo(deadline);
  return (
    <Badge variant={tone}>
      <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
      {daysLeft === null ? 'Chưa rõ hạn nộp' : `${formatDate(deadline)} · còn ${daysLeft} ngày`}
    </Badge>
  );
}
