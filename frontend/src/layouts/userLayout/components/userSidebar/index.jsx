import SidebarNav from '~/layouts/userLayout/components/sidebarNav';

// Sidebar cố định chỉ có từ lg (1024px); màn hình nhỏ hơn dùng menu trượt (mobileNav) trên header.
export default function UserSidebar() {
  // sticky: sidebar đứng yên khi cuộn nội dung, cao bằng màn hình trừ header 64px
  return (
    <nav
      aria-label="Điều hướng chính"
      className="sticky top-16 hidden h-[calc(100vh-64px)] w-sidebar shrink-0 self-start overflow-y-auto border-r border-line bg-surface px-3 py-5 lg:block"
    >
      <SidebarNav />
    </nav>
  );
}
