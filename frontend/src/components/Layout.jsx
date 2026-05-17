import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ComparisonBar from './ComparisonBar';
import { useUIStore } from '../stores/uiStore';
import AuroraBackground from './landing/AuroraBackground';

const Layout = () => {
  const { theme } = useUIStore();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-transparent">
      {theme === 'dark' && <AuroraBackground />}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ComparisonBar />
    </div>
  );
};

export default Layout;
