import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import ComparisonBar from './ComparisonBar';
import ChatFAB from './ChatFAB';

const Layout = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Apply theme to document root for CSS variables to work
    document.documentElement.dataset.theme = theme;

    // Also set to localStorage for persistence (already done by Zustand, but ensure it)
    localStorage.setItem('scholarsgo-theme', theme);
  }, [theme]);

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
