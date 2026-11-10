import { cn } from '~/utils/cn';

// Hiệu ứng trượt từ dưới lên khi phần tử xuất hiện. index tạo độ trễ nối tiếp cho danh sách.
// Người dùng bật "giảm chuyển động" trong hệ điều hành thì không chạy hiệu ứng.
export default function Reveal({ index = 0, step = 60, className, children, as: Tag = 'div' }) {
  return (
    <Tag
      className={cn(
        'animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both motion-reduce:animate-none',
        className
      )}
      style={{ animationDelay: `${index * step}ms` }}
    >
      {children}
    </Tag>
  );
}
