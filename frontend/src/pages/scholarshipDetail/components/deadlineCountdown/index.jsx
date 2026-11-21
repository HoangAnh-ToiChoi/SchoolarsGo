import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import { cn } from '~/utils/cn';
import { TONE_CLASS } from '~/utils/palette';
import { getDeadlineLabel } from '~/utils/scholarship';

/**
 * Hiển thị khối đếm ngược hoặc trạng thái hạn nộp trong ActionPanel.
 * Dùng getDeadlineLabel để đồng bộ thông tin và TONE_CLASS để định kiểu màu sắc.
 */
export default function DeadlineCountdown({ deadline }) {
  const deadlineLabel = getDeadlineLabel(deadline);

  return (
    <div className="flex items-center gap-3.5">
      {!deadlineLabel.hasDeadline ? (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-tile bg-hover text-fg-muted">
          <CalendarDaysIcon className="size-6" aria-hidden="true" />
        </span>
      ) : (
        <span
          className={cn(
            'flex size-14 shrink-0 flex-col items-center justify-center rounded-tile',
            TONE_CLASS[deadlineLabel.tone]?.box
          )}
        >
          <span className="text-[22px] font-bold leading-none">{deadlineLabel.daysLeft}</span>
          <span className="text-[11px] font-semibold">ngày</span>
        </span>
      )}

      <div>
        <p className="text-block-title text-heading">{deadlineLabel.actionTitle}</p>
        <p className="mt-0.5 text-[12.5px] text-fg-muted">{deadlineLabel.actionDesc}</p>
      </div>
    </div>
  );
}
