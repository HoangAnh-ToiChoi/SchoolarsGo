import { Link } from 'react-router-dom';
import { Button } from '~/components/ui/button';

// Thông báo thay cho nội dung trang: không tìm thấy học bổng (nút về trang chủ) hoặc lỗi tải (nút thử lại)
export default function DetailMessage({ icon: Icon, title, description, onRetry }) {
  return (
    <div
      role={onRetry ? 'alert' : undefined}
      className="mx-auto mt-8 flex max-w-lg flex-col items-center rounded-tile border border-line bg-surface px-6 py-12 text-center shadow-tile"
    >
      <Icon className="size-10 text-brand-200" aria-hidden="true" />
      <h1 className="mt-3 text-block-title text-heading">{title}</h1>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
      <div className="mt-5 flex gap-2">
        {onRetry ? (
          <>
            <Button type="button" onClick={onRetry} className="rounded-control bg-brand-600 shadow-none hover:bg-brand-700">
              Thử lại
            </Button>
            <Button asChild variant="subtle" className="rounded-control">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </>
        ) : (
          <Button asChild className="rounded-control bg-brand-600 shadow-none hover:bg-brand-700">
            <Link to="/">Về trang chủ</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
