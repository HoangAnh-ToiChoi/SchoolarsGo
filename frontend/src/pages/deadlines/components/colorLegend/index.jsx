import { LEGEND, TONE_DOT } from '~/pages/deadlines/constants';
import { cn } from '~/utils/cn';

// Chú thích màu chấm trên lịch
export default function ColorLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-fg-secondary" aria-label="Chú thích màu">
      {LEGEND.map((item) => (
        <li key={item.tone} className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', TONE_DOT[item.tone])} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
