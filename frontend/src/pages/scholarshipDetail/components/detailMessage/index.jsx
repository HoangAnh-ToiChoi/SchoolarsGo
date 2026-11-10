import { Link } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

// Thông báo thay cho nội dung trang: không tìm thấy học bổng (nút về trang chủ) hoặc lỗi tải (nút thử lại)
export default function DetailMessage({ icon: Icon, title, description, onRetry }) {
  return (
    <Card role={onRetry ? 'alert' : undefined} className="mx-auto mt-8 flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <Icon className="size-10 text-brand-200" aria-hidden="true" />
      <h1 className="mt-3 text-block-title text-heading">{title}</h1>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
      <div className="mt-5 flex gap-2">
        {onRetry ? (
          <>
            <Button type="button" onClick={onRetry}>
              Thử lại
            </Button>
            <Button asChild variant="subtle">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </>
        ) : (
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
