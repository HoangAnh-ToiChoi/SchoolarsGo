import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import ComparisonBar from './ComparisonBar';

const Layout = () => {
  return (
    <div className="landing-theme min-h-screen bg-landing-background flex flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ComparisonBar />
    </div>
  );
};

export default Layout;
