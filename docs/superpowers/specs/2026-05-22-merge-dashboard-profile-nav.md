# Spec: Gộp Dashboard + Profile & Điều chỉnh Nav theo Role

## Context

Hiện tại user có 2 điểm vào riêng biệt: nút "Dashboard" → `/dashboard` và click tên → `/profile`. Hai trang này chứa thông tin liên quan nhau nhưng bị tách rời gây trải nghiệm rời rạc. Mục tiêu: gộp thành một trang duy nhất, điều chỉnh nav theo role.

## Thay đổi Nav (`Header.jsx`)

| Role | Thay đổi |
|------|----------|
| `user` | Xoá nút "Dashboard". Click tên người dùng → `/dashboard` |
| `admin` | Hiện thêm nút **"Quản lý"** → `/admin`. Click tên → `/dashboard` |
| Chưa login | Không đổi |

## Trang Gộp `/dashboard`

Tab layout với 2 tab:

### Tab 1 — "Tổng quan"
Giữ nguyên toàn bộ nội dung `DashboardPage.jsx` hiện tại:
- 4 stat cards (tổng đơn, đã lưu, hoàn thành profile, sắp hạn)
- Quick action buttons
- Phân bố trạng thái
- Đơn ứng tuyển gần đây
- Deadline sắp tới

### Tab 2 — "Hồ sơ"
Giữ nguyên toàn bộ nội dung `ProfilePage.jsx` hiện tại:
- Form thông tin cá nhân (GPA, tiếng Anh, quốc gia, bậc học, ngành, bio)
- Quản lý tài liệu (upload, xem, xoá)

### URL & Tab state
- Default: Tab "Tổng quan"
- `/profile` redirect → `/dashboard` (tab Tổng quan, không cần tab=profile vì user sẽ navigate tự nhiên)
- Tab state dùng local state (không cần URL param)

## Files cần sửa

| File | Thay đổi |
|------|----------|
| `frontend/src/components/Header.jsx` | Điều chỉnh nav theo role, username → `/dashboard` |
| `frontend/src/pages/DashboardPage.jsx` | Wrap nội dung cũ vào Tab layout, thêm Tab "Hồ sơ" nhúng ProfilePage content |
| `frontend/src/App.jsx` | Thêm redirect `/profile` → `/dashboard` |

## Files KHÔNG sửa
- `ProfilePage.jsx` — giữ nguyên, import trực tiếp JSX content vào tab "Hồ sơ" trong DashboardPage
- `AdminDashboardPage.jsx`, `AdminLayout.jsx` — không đổi
- Routes admin `/admin/*` — không đổi

## Verification
1. Login user thường → không thấy nút Dashboard trong nav
2. Click tên → vào `/dashboard`, thấy 2 tab
3. Tab "Tổng quan" hiển thị stats đúng
4. Tab "Hồ sơ" hiển thị form + tài liệu đúng
5. Truy cập `/profile` → redirect về `/dashboard`
6. Login admin → thấy nút "Quản lý" trong nav → click vào `/admin`
7. Admin click tên → vào `/dashboard`
