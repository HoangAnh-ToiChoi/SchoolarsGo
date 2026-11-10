import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { cn } from '~/utils/cn';

// Màu dấu tích: quyền lợi = xanh lá (điều có lợi), điều kiện = tím (yêu cầu cần đáp ứng)
const TONE_CLASS = { success: 'text-success-600', brand: 'text-brand-600' };

export default function CheckList({ items, tone = 'brand' }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex gap-2.5 text-sm leading-[1.55] text-fg">
          <CheckCircleIcon className={cn('mt-px size-[18px] shrink-0', TONE_CLASS[tone])} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
