import { CalendarDaysIcon } from '@heroicons/react/16/solid';
import { Badge } from '~/components/ui/badge';
import { getDeadlineLabel } from '~/utils/scholarship';

// "11/11/2026 · còn 5 ngày" — màu đổi theo độ gấp. Chưa rõ hạn thì hiện "Chưa công bố" màu trung tính.
export default function DeadlineBadge({ deadline }) {
  const { tone, badge } = getDeadlineLabel(deadline);
  return (
    <Badge variant={tone}>
      <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
      {badge}
    </Badge>
  );
}
