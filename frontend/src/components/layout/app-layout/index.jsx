import { Outlet } from 'react-router-dom';
import AppHeader from '~/components/layout/app-header';
import AppSidebar from '~/components/layout/app-sidebar';
import ErrorBoundary from '~/components/common/ErrorBoundary';
import ComparisonBar from '~/components/common/ComparisonBar';
import ChatFAB from '~/components/common/ChatFAB';

// Khung chung: header trên cùng, sidebar trái, nội dung phải
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ComparisonBar />
      <ChatFAB />
    </div>
  );
}
