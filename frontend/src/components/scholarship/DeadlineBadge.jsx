import { CalendarDaysIcon } from '@heroicons/react/16/solid';
import { Badge } from '~/components/ui/badge';
import { formatDate } from '~/lib/helpers';
import { getDeadlineInfo } from '~/lib/scholarship';

// "11/11/2026 · còn 5 ngày" — màu đổi theo độ gấp
export default function DeadlineBadge({ deadline }) {
  const { daysLeft, tone } = getDeadlineInfo(deadline);
  return (
    <Badge variant={tone}>
      <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
      {formatDate(deadline)} · còn {daysLeft} ngày
    </Badge>
  );
}
