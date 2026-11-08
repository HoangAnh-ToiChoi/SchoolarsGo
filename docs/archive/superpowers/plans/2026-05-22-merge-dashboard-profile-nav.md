# Merge Dashboard + Profile & Nav theo Role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gộp DashboardPage + ProfilePage thành 1 trang 2-tab tại `/dashboard`; điều chỉnh Header nav theo role (admin thấy nút "Quản lý" → `/admin`, user thường click tên → `/dashboard`).

**Architecture:** Tab state local (`useState`) trong DashboardPage. ProfilePage được render nguyên vẹn bên trong tab "Hồ sơ". Header đọc `user?.role` từ `useAuthStore` để render nút admin. Route `/profile` redirect về `/dashboard`.

**Tech Stack:** React 18, React Router v6, Zustand (`useAuthStore`), Lucide React icons, TailwindCSS

---

## File Map

| File | Thay đổi |
|------|----------|
| `frontend/src/pages/DashboardPage.jsx` | Thêm tab layout, nhúng ProfilePage vào tab "Hồ sơ", fix quick-action buttons |
| `frontend/src/components/Header.jsx` | Username → `/dashboard`, xoá Dashboard link, thêm "Quản lý" cho admin (desktop + mobile) |
| `frontend/src/App.jsx` | Redirect `/profile` → `/dashboard` |

---

## Task 1: Thêm tab layout vào DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 1: Thêm import ProfilePage và useState tab**

Mở `frontend/src/pages/DashboardPage.jsx`. Thêm import ở đầu file:

```jsx
import { useState } from 'react';
import ProfilePage from './ProfilePage';
```

> `useState` có thể đã import qua hooks khác — nếu chưa có, thêm vào.

- [ ] **Step 2: Thêm tab state và component TabButton**

Ngay trên dòng `const navigate = useNavigate();`, thêm:

```jsx
const [activeTab, setActiveTab] = useState('overview');
```

Thêm component `TabButton` ngay trước `const DashboardPage = () => {`:

```jsx
const TabButton = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-primary-400 text-primary-400'
        : 'border-transparent text-ink-400 hover:text-ink-100'
    }`}
  >
    {label}
  </button>
);
```

- [ ] **Step 3: Bọc toàn bộ return trong tab layout**

Thay toàn bộ `return (...)` hiện tại bằng:

```jsx
  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-ink-950">
        <div className="container-page pt-8">
          <div className="flex border-b border-ink-800 mb-0">
            <TabButton id="overview" label="Tổng quan" active={false} onClick={setActiveTab} />
            <TabButton id="profile" label="Hồ sơ" active={true} onClick={setActiveTab} />
          </div>
        </div>
        <ProfilePage />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-screen bg-ink-950 pb-24">
      <div className="container-page pt-10 mb-12 space-y-8">
        {/* Tab bar */}
        <div className="flex border-b border-ink-800 -mt-4 mb-2">
          <TabButton id="overview" label="Tổng quan" active={true} onClick={setActiveTab} />
          <TabButton id="profile" label="Hồ sơ" active={false} onClick={setActiveTab} />
        </div>

        <PageHeader
          title="Dashboard"
          description="Tổng quan về hoạt động ứng tuyển của bạn"
        />

        {/* Giữ nguyên toàn bộ từ dòng <section> "Tổng quan" (metrics cards)
            xuống đến hết EmptyState — không thay đổi gì bên dưới */}
```

> Giữ nguyên toàn bộ nội dung cũ (sections: Tổng quan, Hành động nhanh, Phân bố trạng thái, Ứng tuyển gần đây, Sắp tới hạn, EmptyState). Chỉ thêm tab bar ở đầu.

- [ ] **Step 4: Cập nhật quick-action buttons "Tải tài liệu lên" và "Hoàn thiện profile"**

Tìm 2 Button trong section "Hành động nhanh":

```jsx
// Đổi từ:
onClick={() => navigate('/profile#documents')}
// Thành:
onClick={() => setActiveTab('profile')}

// Đổi từ:
onClick={() => navigate('/profile')}
// Thành:
onClick={() => setActiveTab('profile')}
```

- [ ] **Step 5: Verify trên browser**

Mở `http://localhost:5173/dashboard`:
- Thấy tab bar "Tổng quan | Hồ sơ" ở đầu trang
- Tab "Tổng quan" active mặc định
- Click "Hồ sơ" → hiển thị form profile + tài liệu
- Click "Tổng quan" → quay lại stats
- Click "Tải tài liệu lên" → chuyển sang tab "Hồ sơ"

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: add tab layout to DashboardPage (Tổng quan + Hồ sơ)"
```

---

## Task 2: Cập nhật Header — desktop nav

**Files:**
- Modify: `frontend/src/components/Header.jsx`

- [ ] **Step 1: Thêm Shield icon cho nút admin**

Trong import lucide-react ở đầu file, thêm `Shield`:

```jsx
import { GraduationCap, Menu, X, User, LogOut, BookOpen, Calendar, Shield } from 'lucide-react';
```

> Xoá `LayoutDashboard` khỏi import vì nút Dashboard sẽ không còn dùng.

- [ ] **Step 2: Thay đổi desktop authenticated nav**

Tìm block desktop auth (bên trong `{isAuthenticated ? (` ở phần `hidden md:flex`). Thay toàn bộ block đó bằng:

```jsx
{isAuthenticated ? (
  <>
    {user?.role === 'admin' && (
      <Link to="/admin" className={`flex items-center gap-1.5 ${navLinkClass('/admin')}`}>
        <Shield className="w-4 h-4" />
        Quản lý
      </Link>
    )}
    <Link to="/applications" className={`flex items-center gap-1.5 ${navLinkClass('/applications')}`}>
      <BookOpen className="w-4 h-4" />
      Đơn ứng tuyển
    </Link>
    <Link to="/deadlines" className={`flex items-center gap-1.5 ${navLinkClass('/deadlines')}`}>
      <Calendar className="w-4 h-4" />
      Deadline
    </Link>
    <Link to="/dashboard" className={`flex items-center gap-1.5 ${navLinkClass('/dashboard')}`}>
      <User className="w-4 h-4" />
      {user?.full_name?.split(' ').pop() || user?.email}
    </Link>
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-ink-500 hover:text-danger-400 hover:bg-danger-400/10 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Đăng xuất
    </button>
  </>
) : (
```

- [ ] **Step 3: Verify desktop nav**

Mở browser:
- Login user thường → không thấy nút Dashboard, không thấy "Quản lý", click tên → vào `/dashboard`
- Login admin → thấy nút "Quản lý" với icon Shield, click → vào `/admin`

---

## Task 3: Cập nhật Header — mobile menu

**Files:**
- Modify: `frontend/src/components/Header.jsx`

- [ ] **Step 1: Thay đổi mobile authenticated menu**

Tìm block mobile menu (`{isAuthenticated ? (` bên trong `{mobileOpen && (`). Thay toàn bộ block authenticated đó bằng:

```jsx
{isAuthenticated ? (
  <>
    {user?.role === 'admin' && (
      <Link to="/admin" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>
        Quản lý
      </Link>
    )}
    <Link to="/applications" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>Đơn ứng tuyển</Link>
    <Link to="/deadlines" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>Deadline</Link>
    <Link to="/dashboard" className="block px-3 py-2.5 rounded text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-ink-100" onClick={() => setMobileOpen(false)}>
      {user?.full_name?.split(' ').pop() || user?.email}
    </Link>
    <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded text-sm font-medium text-danger-400 hover:bg-danger-400/10 transition-colors">Đăng xuất</button>
  </>
) : (
```

- [ ] **Step 2: Commit Header changes**

```bash
git add frontend/src/components/Header.jsx
git commit -m "feat: update nav — username links to /dashboard, admin sees Quản lý button"
```

---

## Task 4: Redirect /profile → /dashboard trong App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Thay route /profile thành redirect**

Tìm dòng:
```jsx
<Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
```

Thay bằng:
```jsx
<Route path="profile" element={<Navigate to="/dashboard" replace />} />
```

- [ ] **Step 2: Xoá lazy import ProfilePage nếu không còn dùng**

Tìm và xoá dòng:
```jsx
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
```

> ProfilePage vẫn được import trực tiếp trong DashboardPage.jsx — không cần lazy load ở App.jsx nữa.

- [ ] **Step 3: Verify redirect**

Truy cập `http://localhost:5173/profile` → tự redirect sang `http://localhost:5173/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: redirect /profile to /dashboard"
```

---

## Task 5: Final verification checklist

- [ ] **User thường:**
  - [ ] Nav: không thấy nút "Dashboard", không thấy "Quản lý"
  - [ ] Nav: click tên → vào `/dashboard` tab "Tổng quan"
  - [ ] Tab "Hồ sơ" → form profile + tài liệu hiển thị đúng
  - [ ] Button "Tải tài liệu lên" → switch sang tab "Hồ sơ"
  - [ ] Button "Hoàn thiện profile" → switch sang tab "Hồ sơ"
  - [ ] URL `/profile` → redirect về `/dashboard`

- [ ] **Admin:**
  - [ ] Nav: thấy nút "Quản lý" với icon Shield
  - [ ] Click "Quản lý" → vào `/admin`
  - [ ] Click tên → vào `/dashboard` (tab layout giống user)

- [ ] **Mobile:**
  - [ ] User: menu có tên người dùng → `/dashboard`, không có Dashboard link
  - [ ] Admin: menu có "Quản lý" link
