---
name: new-page
description: Thêm trang hoặc màn hình frontend ScholarsGo đúng khung (pages/<trang>/index.jsx + components/ hooks/ helpers/ constants/), dữ liệu qua hook TanStack Query + service, đăng ký PAGE_LOADERS + App.jsx + ROUTES, đủ 4 trạng thái skeleton/rỗng/lỗi/dữ liệu, theo R1–R11. Dùng khi người dùng muốn thêm trang/màn hình hoặc gõ /new-page <tên>.
argument-hint: "<tênTrang> — mô tả"
---

# Trang mới — ScholarsGo

Đọc `CLAUDE.md` mục 5 và `docs/frontendRules/frontendRules.md` (R1–R11) trước. Mẫu tham chiếu: `frontend/src/pages/deadlines/` (khung thư mục), `pages/saved/index.jsx` (4 trạng thái), `pages/scholarshipDetail/helpers/*.test.js` (test hàm thuần), `hooks/useNotifications.js`, `services/saved.service.js`, `utils/routes.js`, `pageLoaders.js`, `App.jsx`.

## 0. Làm rõ
- URL (camelCase, vd. `/forgotPassword`), cần đăng nhập (`guard(...)`)? userLayout hay adminLayout? Có trong menu sidebar?
- API đã có chưa? Chưa → `/new-endpoint` trước (hoặc dữ liệu minh họa cho `build:pages` trong `utils/demo/`).

## 1. Khung thư mục (R10 — tạo thư mục chỉ khi có thứ bỏ vào)

```
pages/<trang>/
  index.jsx                 export default function TenPage() — chỉ ghép component + hook
  components/<tên>/index.jsx
  hooks/      index.js + useXxx.js          một hook một file (gọi API, điều hướng, toast)
  helpers/    index.js + tenHam.js + tenHam.test.js   một hàm thuần một file, có test (R9)
  constants/  index.js + tenNhom.js         nhãn, số ma thuật (R3)
```
- `index.js` chỉ re-export; nơi dùng import qua thư mục (`~/pages/<trang>/helpers`). Trong cùng thư mục dùng `./tenFile`; `helpers/` được import `'../constants'`.
- Hook dữ liệu server dùng ≥ 2 trang → `src/hooks/`; hàm/hằng số dùng ≥ 2 trang → `src/utils/` (R11). Không chuyển trước "phòng khi cần".

## 2. Nối dây
1. `services/<nhóm>.service.js` — object hàm gọi `api` từ `~/utils/apiClient` (chỉ nơi này gọi API).
2. Hook: `useQuery({ queryKey, queryFn: () => xService.list().then((res) => res.data) })`; mutation xử lý lỗi ở `onError`, invalidate đúng key; cần đăng nhập → `enabled: isAuthenticated`.
3. `utils/routes.js` → thêm vào `ROUTES`; điều hướng/`to=` luôn dùng `ROUTES` (R6).
4. `pageLoaders.js` → `PAGE_LOADERS` (và `PREFETCH_PAGES` nếu nhẹ, hay mở). `App.jsx` → `lazy(PAGE_LOADERS.x)` + `<Route>`.

## 3. Bốn trạng thái (bắt buộc)

```jsx
const { data, isLoading, isError, refetch } = useX();
const isSlow = useSlowLoading(isLoading);
// isSlow → <SlowLoading />
// isError → Card + "Không tải được …" + <Button variant="link" onClick={() => refetch()}>Thử lại</Button>
// !isLoading && rỗng → Card viền đứt + icon Heroicons solid aria-hidden + câu hướng dẫn + 1 nút chính
// isLoading → skeleton đúng hình dạng nội dung (không spinner trơn)
// có dữ liệu → <Reveal> từng mục
```
Phân nhánh/tính toán dữ liệu hiển thị → hàm trong `helpers/` (R1), không ternary lồng trong JSX.

## 4. Thiết kế
- Đầu trang `PageHeader`/`PageBand` (không lề âm bù layout — R5) · `BackLink` nhãn = tên trang đích · tab mới qua `ExternalLink`.
- Màu chỉ token; mức gấp qua `TONE_CLASS`, chữ hạn nộp `getDeadlineLabel` (R2); "hôm nay" tính một lần ở trang/hook (R8).
- Không `[Npx]`, không mã màu (R4): cần cỡ mới → thêm token `tailwind.config.js`.
- Danh sách học bổng `ScholarshipGrid` + `ScholarshipCard`; chữ dài `min-w-0 truncate`.
- Thẻ thật, nút chỉ icon có `aria-label`, focus nhìn thấy. Component ≤ 200 dòng, hook ≤ 150.

## 5. Kết thúc
`/verify` (FE lint + build + test helpers). Ghi lỗi đã sửa (nếu có) vào "Nhật ký quy tắc". Nhắc người dùng kiểm 360/768/1024/1280px (hoặc chụp bằng Playwright MCP nếu đã bật).
