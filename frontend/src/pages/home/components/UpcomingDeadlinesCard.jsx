import { Link } from 'react-router-dom';
import { Card } from '~/components/ui/card';
import { formatDate } from '~/lib/helpers';
import { getDeadlineInfo } from '~/lib/scholarship';
import { cn } from '~/lib/utils';

const BOX_TONES = {
  urgent: 'bg-urgent-bg text-urgent-fg',
  soon: 'bg-soon-bg text-soon-fg',
  open: 'bg-brand-50 text-brand-700',
};

// 4 học bổng sắp hết hạn nhất trong danh sách đang hiển thị
export default function UpcomingDeadlinesCard({ scholarships = [] }) {
  const upcoming = [...scholarships]
    .filter((s) => getDeadlineInfo(s.deadline).daysLeft >= 0)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  return (
    <Card className="flex flex-col rounded-tile border-line px-5 pb-2 pt-5 shadow-tile">
      <div className="flex items-center justify-between pb-2.5">
        <h2 className="text-block-title">Sắp hết hạn</h2>
        <Link to="/deadlines" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
          Xem lịch
        </Link>
      </div>
      {upcoming.length === 0 && <p className="border-t border-line-soft py-4 text-[13px] text-fg-muted">Chưa có hạn nộp nào sắp tới.</p>}
      <ul>
        {upcoming.map((s) => {
          const { daysLeft, tone } = getDeadlineInfo(s.deadline);
          return (
            <li key={s.id} className="border-t border-line-soft">
              <Link to={`/scholarships/${s.id}`} className="-mx-2 flex items-center gap-3 rounded-control px-2 py-3 transition-colors duration-150 hover:bg-canvas">
                <div className={cn('w-11 shrink-0 rounded-inner py-1.5 text-center', BOX_TONES[tone])}>
                  <div className="text-base font-bold leading-none">{formatDate(s.deadline, 'dd')}</div>
                  <div className="mt-1 text-[11px] font-medium">Th {formatDate(s.deadline, 'M')}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{s.title}</div>
                  <div className="mt-0.5 text-xs text-fg-muted">còn {daysLeft} ngày</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
