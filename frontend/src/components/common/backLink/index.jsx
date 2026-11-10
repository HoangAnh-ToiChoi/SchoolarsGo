import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/16/solid';
import { cn } from '~/utils/cn';

// Nút quay lại dùng chung mọi trang: mũi tên trong ô tròn + tên trang sẽ về.
// Là link thật (có href) để mở tab mới được và đi tới bằng bàn phím; nhãn luôn nói rõ về đâu
// ("Đơn ứng tuyển", "Đăng nhập") thay vì chỉ ghi "Quay lại".
export default function BackLink({ to, children, className }) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex w-fit items-center gap-2 rounded-full py-0.5 pr-2 text-[13px] font-semibold text-fg-secondary outline-none transition-colors duration-150 hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full border border-line bg-surface shadow-tile transition-colors duration-150 group-hover:border-brand-200 group-hover:bg-brand-50"
      >
        <ArrowLeftIcon className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
      </span>
      <span>
        <span className="sr-only">Quay lại </span>
        {children}
      </span>
    </Link>
  );
}
