import { Outlet } from 'react-router-dom';
import AdminSidebar from '~/layouts/adminLayout/components/adminSidebar';
import AdminMobileNav from '~/layouts/adminLayout/components/adminMobileNav';

// Khung trang admin: sidebar trái (desktop), thanh điều hướng dưới (mobile), nội dung ở giữa
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="flex min-h-screen pt-16">
        <AdminSidebar />
        <AdminMobileNav />
        <main className="flex-1 overflow-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
