// Hàm tải từng trang (mỗi trang là một file JS riêng khi build).
// Dùng chung cho React.lazy trong App.jsx và cho việc tải trước ở layout,
// nên Vite chỉ tạo một file cho mỗi trang dù được gọi ở hai nơi.
export const PAGE_LOADERS = {
  home: () => import('~/pages/home'),
  scholarshipDetail: () => import('~/pages/scholarshipDetail'),
  login: () => import('~/pages/login'),
  register: () => import('~/pages/register'),
  forgotPassword: () => import('~/pages/forgotPassword'),
  resetPassword: () => import('~/pages/resetPassword'),
  applications: () => import('~/pages/applications'),
  applicationDetail: () => import('~/pages/applicationDetail'),
  saved: () => import('~/pages/saved'),
  dashboard: () => import('~/pages/dashboard'),
  deadlines: () => import('~/pages/deadlines'),
  recommend: () => import('~/pages/recommend'),
  compare: () => import('~/pages/compare'),
  chat: () => import('~/pages/chat'),
  news: () => import('~/pages/news'),
  notFound: () => import('~/pages/notFound'),
  adminLayout: () => import('~/layouts/adminLayout'),
  adminDashboard: () => import('~/pages/admin/dashboard'),
  adminUsers: () => import('~/pages/admin/users'),
  adminScholarships: () => import('~/pages/admin/scholarships'),
};

// Các trang người dùng hay mở, đều nhẹ (2–20KB). Không gồm dashboard (kéo theo thư viện biểu đồ ~350KB)
// và trang admin: những trang này tải khi bấm vào.
const PREFETCH_PAGES = ['scholarshipDetail', 'saved', 'applications', 'applicationDetail', 'deadlines', 'recommend', 'compare', 'news', 'chat'];

// Tải trước khi trình duyệt rảnh, để lúc bấm chuyển trang là có ngay, không phải chờ tải file
export function prefetchPages() {
  const run = () => PREFETCH_PAGES.forEach((name) => PAGE_LOADERS[name]().catch(() => {}));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
