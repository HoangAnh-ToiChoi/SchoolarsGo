---
name: new-page
description: Thêm trang hoặc màn hình frontend ScholarsGo đúng cấu trúc (pages/<trang>/index.jsx chỉ ghép component, hook TanStack Query, service, đăng ký PAGE_LOADERS + App.jsx) và đủ 4 trạng thái skeleton/rỗng/lỗi/dữ liệu. Dùng khi người dùng muốn thêm trang/màn hình hoặc gõ /new-page <tên>.
argument-hint: "<tênTrang> — mô tả"
---

# Trang mới — ScholarsGo

Đọc mục "Frontend" và "Thiết kế" trong CLAUDE.md. Mẫu tham chiếu: `frontend/src/pages/saved/index.jsx` (4 trạng thái), `hooks/useNotifications.js`, `services/saved.service.js`, `pageLoaders.js`, `App.jsx`.

## 0. Làm rõ
- URL (camelCase, vd. `/forgotPassword`), cần đăng nhập (`guard(...)`)? thuộc userLayout hay adminLayout?
- API đã có chưa? Chưa → `/new-endpoint` trước (hoặc dữ liệu minh họa cho `build:pages` trong `utils/demo/`).
- Có trong menu sidebar không?

## 1. Các file

1. `services/<nhóm>.service.js` — object hàm gọi `api` từ `~/utils/apiClient` (chỉ nơi này gọi API).
2. `hooks/use<Nhóm>.js` — `useQuery({ queryKey, queryFn: () => xService.list().then((res) => res.data) })`; mutation invalidate đúng key; cần đăng nhập → `enabled: isAuthenticated`.
3. `pages/<trang>/components/<tênComponent>/index.jsx` — phần riêng của trang; dùng ở ≥ 2 trang → `components/`.
4. `pages/<trang>/index.jsx` — `export default function TenPage()`, chỉ ghép component + hook, không import service.
5. `pageLoaders.js` → thêm vào `PAGE_LOADERS` (và `PREFETCH_PAGES` nếu trang nhẹ, hay mở).
6. `App.jsx` → `const XPage = lazy(PAGE_LOADERS.x)` + `<Route>`.

## 2. Bốn trạng thái (bắt buộc)

```jsx
const { data, isLoading, isError, refetch } = useX();
const isSlow = useSlowLoading(isLoading);
// isSlow → <SlowLoading />
// isError → Card + "Không tải được …" + <Button variant="link" onClick={() => refetch()}>Thử lại</Button>
// !isLoading && rỗng → Card viền đứt + icon Heroicons solid aria-hidden + câu hướng dẫn + 1 nút chính
// isLoading → skeleton đúng hình dạng nội dung (không spinner trơn)
// có dữ liệu → <Reveal> từng mục
```

## 3. Thiết kế
- `PageHeader` (tiêu đề 24) · `BackLink` nhãn = tên trang đích · lề do layout lo (`p-4 sm:p-6 lg:p-8`).
- Màu chỉ token (`brand-600`, `heading`, `fg`, `fg-muted`, `line`, `canvas`…); hạn nộp `getDeadlineInfo()`; danh sách học bổng `ScholarshipGrid` + `ScholarshipCard`.
- Lưới `grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))]`; chữ dài `min-w-0 truncate`.
- Thẻ thật, nút chỉ icon có `aria-label`, focus nhìn thấy. Component ≤ 200 dòng, hook ≤ 150.

## 4. Kết thúc
`/verify` (FE lint + build). Nhắc người dùng kiểm 360/768/1024/1280px (hoặc chụp bằng Playwright MCP nếu đã bật trong `.mcp.json`).
