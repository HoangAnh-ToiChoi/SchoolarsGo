import { Link } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { Badge } from '~/components/ui/badge';
import { statusLabel, TONE_DOT } from '~/pages/deadlines/constants';
import { cn } from '~/utils/cn';
import { scholarshipPath } from '~/utils/scholarship';

function describe(event) {
  if (event.kind === 'followUp') return 'Nên hỏi lại kết quả';
  const days = differenceInCalendarDays(event.date, new Date());
  if (event.isPast) return 'Đã qua hạn nộp';
  return days === 0 ? 'Hạn nộp hôm nay' : `Hạn nộp · còn ${days} ngày`;
}

// Danh sách mốc thời gian (dùng cho "Sắp tới" và "Ngày đã chọn")
export default function EventList({ events, emptyText }) {
  if (events.length === 0) return <p className="py-3 text-[13px] text-fg-muted">{emptyText}</p>;
  return (
    <ul className="divide-y divide-line-soft">
      {events.map((e) => (
        <li key={e.id}>
          <Link to={scholarshipPath({ id: e.scholarshipId, slug: e.scholarshipSlug })} className="-mx-2 flex items-center gap-3 rounded-control px-2 py-3 transition-colors duration-150 hover:bg-canvas">
            <div className="w-11 shrink-0 rounded-inner bg-canvas py-1.5 text-center">
              <div className="text-base font-bold leading-none text-fg">{format(e.date, 'dd')}</div>
              <div className="mt-1 text-[11px] font-medium text-fg-muted">Th {format(e.date, 'M')}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-fg">{e.title}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                <span className={cn('size-2 rounded-full', TONE_DOT[e.tone])} aria-hidden="true" />
                {describe(e)}
              </div>
            </div>
            <Badge variant={e.status ? 'brand' : 'neutral'} className="shrink-0">
              {e.status ? statusLabel(e.status) : 'Đã lưu'}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
