import { Component } from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-narrow py-16 text-center">
          <h2 className="mb-4 text-heading-1 text-gray-900">Đã xảy ra lỗi</h2>
          <p className="mb-6 text-gray-600">Vui lòng thử tải lại trang hoặc quay về trang chủ.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            className="btn-primary"
          >
            Về trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
