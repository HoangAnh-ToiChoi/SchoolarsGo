import { Component } from 'react';
import { Link } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Button } from '~/components/ui/button';
import { ROUTES } from '~/utils/routes';

/**
 * Lưới chặn lỗi render quanh <Outlet /> của layout (R32).
 * - Gửi lỗi lên Sentry kèm component stack (Sentry chưa init thì không gửi gì).
 * - `resetKey` đổi (layout truyền pathname) thì tự xóa lỗi: chuyển sang trang khác không còn kẹt màn hình lỗi.
 * - "Về trang chủ" dùng Link của router để giữ basename (bản GitHub Pages chạy dưới /SchoolarsGo/).
 * Class component vì React chỉ bắt lỗi render qua getDerivedStateFromError / componentDidCatch.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) this.reset();
  }

  reset() {
    this.setState({ hasError: false });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="mx-auto max-w-md py-16 text-center" role="alert">
        <h2 className="text-block-title text-heading">Trang gặp lỗi khi hiển thị</h2>
        <p className="mt-2 text-sm text-fg-muted">Lỗi đã được ghi lại. Thử tải lại phần này hoặc về trang chủ.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={this.reset}>Thử lại</Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.home} onClick={this.reset}>Về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }
}
