import { CheckIcon } from '@heroicons/react/16/solid';
import { Card } from '~/components/ui/card';
import { cn } from '~/utils/cn';
import { getStepIndex, STEPS } from '~/pages/applicationDetail/helper';

// Thanh tiến trình đơn: nhìn một lần là biết đơn đang ở chặng nào.
// Chặng cuối đổi chữ/màu theo kết quả (được nhận = xanh, từ chối = đỏ).
export default function StatusStepper({ status }) {
  if (status === 'withdrawn') {
    return <Card className="px-5 py-4 text-sm text-fg-muted">Bạn đã rút đơn này. Đơn không còn được theo dõi tiến độ.</Card>;
  }

  const current = getStepIndex(status);
  const isResult = status === 'accepted' || status === 'rejected';

  return (
    <Card className="px-4 py-4 sm:px-6">
      <ol className="grid grid-cols-5" aria-label="Tiến trình đơn">
        {STEPS.map((step, i) => {
          const done = i < current || (isResult && i === current);
          const active = i === current;
          const label = i === STEPS.length - 1 && isResult ? (status === 'accepted' ? 'Được nhận' : 'Từ chối') : step.label;
          const failed = active && status === 'rejected';
          const won = active && status === 'accepted';
          return (
            <li
              key={step.key}
              className="relative flex flex-col items-center text-center"
              aria-current={active ? 'step' : undefined}
            >
              {/* Đường nối với chặng trước */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2',
                    i <= current ? 'bg-brand-600' : 'bg-track',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-bold',
                  failed
                    ? 'border-urgent-fg bg-urgent-fg text-white'
                    : won
                      ? 'border-open-fg bg-open-fg text-white'
                      : done
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : active
                          ? 'border-brand-600 bg-surface text-brand-600'
                          : 'border-line bg-surface text-fg-muted',
                )}
              >
                {done && !failed ? <CheckIcon className="size-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'mt-2 text-[12px] leading-tight',
                  failed
                    ? 'font-semibold text-urgent-fg'
                    : won
                      ? 'font-semibold text-open-fg'
                      : active
                        ? 'font-semibold text-fg'
                        : 'text-fg-muted',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
