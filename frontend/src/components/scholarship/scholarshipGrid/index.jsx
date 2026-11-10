import { cn } from '~/utils/cn';

// Lưới thẻ học bổng dùng chung (trang chủ, học bổng tương tự): thẻ rộng tối thiểu 300px
// để hàng nhãn hạn nộp + phạm vi + nút lưu không bị bóp.
export default function ScholarshipGrid({ className, children }) {
  return <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4', className)}>{children}</div>;
}
