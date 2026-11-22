import { LEGEND } from '~/pages/deadlines/constants';
import { cn } from '~/utils/cn';
import { TONE_CLASS } from '~/utils/palette';

// Chú thích màu chấm trên lịch
export default function ColorLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-label text-fg-secondary" aria-label="Chú thích màu">
      {LEGEND.map((item) => (
        <li key={item.tone} className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', TONE_CLASS[item.tone]?.dot)} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
