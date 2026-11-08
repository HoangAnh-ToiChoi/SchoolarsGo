import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import PageHeader from '~/components/common/pageHeader';
import Reveal from '~/components/common/reveal';
import SlowLoading from '~/components/common/slowLoading';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useDeadlineEvents } from '~/hooks/useDeadlineEvents';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import ColorLegend from '~/pages/deadlines/components/colorLegend';
import EventList from '~/pages/deadlines/components/eventList';
import MonthCalendar from '~/pages/deadlines/components/monthCalendar';

const UPCOMING_LIMIT = 6;
const cardClass = 'rounded-tile border-line p-5 shadow-tile';

// Lịch deadline CỦA RIÊNG người dùng: chỉ hiện học bổng đã lưu và đơn ứng tuyển,
// không hiện toàn bộ học bổng trong hệ thống.
export default function DeadlinesPage() {
  const { events, isLoading, isError, refetch } = useDeadlineEvents();
  const isSlow = useSlowLoading(isLoading);
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());

  const upcoming = useMemo(() => events.filter((e) => !e.isPast).slice(0, UPCOMING_LIMIT), [events]);
  const selectedEvents = useMemo(() => events.filter((e) => isSameDay(e.date, selected)), [events, selected]);

  const changeMonth = (next) => {
    setMonth(next);
    if (isSameDay(next, new Date())) setSelected(next);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Lịch deadline" description="Hạn nộp của học bổng bạn đã lưu và các đơn bạn đã tạo." />
      {isSlow && <SlowLoading />}

      {isError && (
        <Card className={`${cardClass} text-center`}>
          <p className="font-semibold">Không tải được lịch</p>
          <button type="button" onClick={refetch} className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Thử lại
          </button>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-wrap items-start gap-6" aria-hidden="true">
          <Skeleton className="h-[460px] min-w-0 flex-[999_1_560px] rounded-tile" />
          <Skeleton className="h-[460px] flex-[1_1_300px] rounded-tile" />
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <Reveal>
          <Card className={`${cardClass} flex flex-col items-center px-6 py-12 text-center`}>
            <CalendarDaysIcon className="size-10 text-brand-200" aria-hidden="true" />
            <p className="mt-3 text-block-title">Chưa có hạn nộp nào để theo dõi</p>
            <p className="mt-1 max-w-md text-sm text-fg-muted">
              Bấm nút lưu trên thẻ học bổng hoặc tạo đơn ứng tuyển, hạn nộp sẽ tự hiện ở đây.
            </p>
            <Button asChild className="mt-5 rounded-control bg-brand-600 hover:bg-brand-700">
              <Link to="/">Tìm học bổng</Link>
            </Button>
          </Card>
        </Reveal>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="flex flex-wrap items-start gap-6">
          <Reveal className="min-w-0 flex-[999_1_560px]">
            <Card className={`${cardClass} flex flex-col gap-5`}>
              <MonthCalendar month={month} onMonthChange={changeMonth} selected={selected} onSelect={setSelected} events={events} />
              <div className="border-t border-line-soft pt-4">
                <ColorLegend />
              </div>
            </Card>
          </Reveal>

          <div className="flex max-w-full flex-[1_1_300px] flex-col gap-4">
            <Reveal index={1}>
              <Card className={cardClass}>
                <h2 className="text-block-title">Ngày {format(selected, 'dd/MM/yyyy')}</h2>
                <EventList events={selectedEvents} emptyText="Không có mốc nào trong ngày này." />
              </Card>
            </Reveal>
            <Reveal index={2}>
              <Card className={cardClass}>
                <h2 className="text-block-title">Sắp tới</h2>
                <EventList events={upcoming} emptyText="Không còn hạn nộp nào sắp tới." />
              </Card>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
}
