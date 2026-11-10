import { Outlet } from 'react-router-dom';
import UserHeader from '~/layouts/userLayout/components/userHeader';
import UserSidebar from '~/layouts/userLayout/components/userSidebar';
import ErrorBoundary from '~/components/common/ErrorBoundary';
import ComparisonBar from '~/components/common/ComparisonBar';
import ChatFAB from '~/components/common/ChatFAB';

// Khung chung: header trên cùng, sidebar trái (từ lg), nội dung phải. Lề nội dung 16 → 24 → 32px theo màn hình
export default function UserLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <UserHeader />
      <div className="flex flex-1">
        <UserSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
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
