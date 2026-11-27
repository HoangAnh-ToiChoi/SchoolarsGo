import { Component } from 'react';
import { Link } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Button } from '~/components/ui/button';
import { ROUTES } from '~/utils/routes';
import { isChunkLoadError } from './helpers';

/**
 * Lưới chặn lỗi render quanh <Outlet /> của layout (R32).
 * - Gửi lỗi lên Sentry kèm component stack (Sentry chưa init thì không gửi gì).
 * - `resetKey` đổi (layout truyền pathname) thì tự xóa lỗi: chuyển sang trang khác không còn kẹt màn hình lỗi.
 * - "Về trang chủ" dùng Link của router để giữ basename (bản GitHub Pages chạy dưới /SchoolarsGo/);
 *   không reset trong onClick: reset trước khi route đổi sẽ render lại trang hỏng và gửi Sentry lần hai.
 * - Lỗi tải chunk trang (sau deploy): "Thử lại" tải lại cả trang vì React.lazy giữ kết quả reject.
 * Class component vì React chỉ bắt lỗi render qua getDerivedStateFromError / componentDidCatch.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) this.reset();
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  retry() {
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.reset();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="mx-auto max-w-md py-16 text-center" role="alert">
        <h2 className="text-block-title text-heading">Trang gặp lỗi khi hiển thị</h2>
        <p className="mt-2 text-sm text-fg-muted">Lỗi đã được ghi lại. Thử tải lại phần này hoặc về trang chủ.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={this.retry}>Thử lại</Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.home}>Về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }
}
