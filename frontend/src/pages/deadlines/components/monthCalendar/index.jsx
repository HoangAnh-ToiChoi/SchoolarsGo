import { useMemo } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { TONE_DOT } from '~/pages/deadlines/constants';
import { cn } from '~/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MAX_DOTS = 3;

// Lịch tháng tự vẽ: mỗi ngày có tối đa 3 chấm màu theo các mốc trong ngày đó
export default function MonthCalendar({ month, onMonthChange, selected, onSelect, events }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const list = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return list;
  }, [month]);

  const eventsOf = (day) => events.filter((e) => isSameDay(e.date, day));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-block-title capitalize">{format(month, 'MMMM yyyy', { locale: vi })}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(new Date())}
            className="h-8 rounded-control px-2.5 text-[13px] font-semibold text-fg-secondary transition-colors hover:bg-hover hover:text-fg"
          >
            Hôm nay
          </button>
          <button type="button" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Tháng trước" className="flex size-8 items-center justify-center rounded-control text-fg-secondary transition-colors hover:bg-hover hover:text-fg">
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Tháng sau" className="flex size-8 items-center justify-center rounded-control text-fg-secondary transition-colors hover:bg-hover hover:text-fg">
            <ChevronRightIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Lịch tháng">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-[11.5px] font-semibold text-fg-muted" role="columnheader">
            {w}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = eventsOf(day);
          const isSelected = isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              type="button"
              role="gridcell"
              onClick={() => onSelect(day)}
              aria-selected={isSelected}
              aria-label={`${format(day, 'EEEE dd/MM', { locale: vi })}${dayEvents.length ? `, ${dayEvents.length} mốc` : ''}`}
              className={cn(
                'flex h-16 flex-col items-center justify-start gap-1.5 rounded-inner border pt-2 text-sm transition-colors duration-150',
                isSelected ? 'border-brand-600 bg-brand-50 font-bold text-brand-700' : 'border-transparent hover:bg-hover',
                !isSameMonth(day, month) && !isSelected && 'text-fg-muted/60',
                isToday(day) && !isSelected && 'border-brand-200 font-semibold text-brand-600'
              )}
            >
              {format(day, 'd')}
              {dayEvents.length > 0 && (
                <span className="flex items-center gap-1" aria-hidden="true">
                  {dayEvents.slice(0, MAX_DOTS).map((e) => (
                    <span key={e.id} className={cn('size-1.5 rounded-full', TONE_DOT[e.tone])} />
                  ))}
                  {dayEvents.length > MAX_DOTS && <span className="text-[10px] leading-none text-fg-muted">+</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
