import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import ComparisonBar from './ComparisonBar';
import ChatFAB from './ChatFAB';

const Layout = () => {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ComparisonBar />
      <ChatFAB />
    </div>
  );
};

export default Layout;
