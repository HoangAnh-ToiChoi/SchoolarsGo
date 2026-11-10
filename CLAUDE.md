# ScholarsGo — Quy ước dự án

Nền tảng tìm học bổng (du học và trong nước) cho sinh viên Việt Nam. File này là **nguồn quy ước duy nhất** cho người và AI.

- Frontend (`frontend/`): React 18 + Vite, TailwindCSS 3, shadcn/ui (Radix), Redux Toolkit, TanStack Query, Heroicons.
- Backend (`backend/`): Node.js + Express, PostgreSQL (Supabase). **Chưa tái cấu trúc** — giữ cách tổ chức hiện tại (routes → controllers → services → repositories).
- Tài liệu: `docs/roadmap.md` (lộ trình, việc còn dở), `docs/api.md`, `docs/database.md` (viết trước đây, có thể lệch code — code là đúng); `docs/archive/` chỉ để tham khảo.
- Trang nào chưa làm lại vẫn dùng `components/legacy/`; code mới không dùng thư mục này.

## Lệnh (trong `frontend/`)

```bash
npm run dev          # chạy local, gọi API theo VITE_API_BASE_URL trong .env.local
npm run lint         # 0 lỗi trước khi commit
npm run build        # build được trước khi commit
npm run build:pages  # bản demo GitHub Pages: dữ liệu minh họa, base /SchoolarsGo/
```

Demo: đẩy `frontend/dist/` (sau `build:pages`) lên nhánh `gh-pages` → https://hoanganh-toichoi.github.io/SchoolarsGo/ (thêm `?demoDelay=7000` để xem trạng thái tải chậm).

## Cấu trúc frontend

```
frontend/src/
  App.jsx, main.jsx        router (trang tải lười) · Provider Redux + React Query + Router
  pageLoaders.js           hàm tải từng trang + tải trước khi rảnh (thêm trang mới: thêm vào đây)
  index.css                5 màu gốc + style nền
  pages/<tenTrang>/index.jsx    trang — chỉ ghép component, không gọi API
    components/<ten>/index.jsx  component chỉ trang đó dùng
  layouts/                 khung giao diện: index.jsx để dùng, components/ là phần triển khai
    userLayout/            components/ userHeader, userSidebar, mobileNav, sidebarNav (+ navConfig.js), userMenu, notificationMenu
    adminLayout/           components/ adminSidebar, adminMobileNav (+ constants.js)
  components/
    ui/                    shadcn/ui gốc (button, card, badge, dropdownMenu, tabs…)
    common/                dùng nhiều trang: pageHeader, pagination, reveal, slowLoading
    scholarship/           thẻ học bổng và các phần của nó
    scholarshipFilter/     thanh tìm kiếm + bộ lọc
    legacy/                UI kit cũ — không dùng cho code mới
  hooks/                   useScholarships, useScholarshipFilters, useSlowLoading…
  services/<nhom>.service.js    gọi API qua utils/apiClient.js
  store/                   Redux: slices/ auth, comparison, ui
  utils/                   hàm dùng chung toàn dự án: cn, format, scholarship (hạn nộp, nhãn), security, palette, constants, apiClient, demo/
```

1. **Mỗi trang, mỗi component, mỗi layout là một thư mục có `index.jsx`.**
2. **Component lớn chia thư mục con, gom ở `index.jsx` cha.** Mẫu chuẩn: `components/scholarshipFilter/` gồm `index.jsx` (ghép + state), `constants.js`, `searchInput/`, `filterPanel/`, `filterField/`, `filterActions/`, `activeFilters/`.
3. **Import từ gốc `src` bằng `~/`**, không dùng `../`.
4. Chỉ một trang dùng → `pages/<trang>/components/`. Từ hai trang trở lên → `components/`.
5. Thứ tự import: thư viện ngoài → `~/layouts`, `~/components` → `~/hooks` → `~/utils`, `~/store`, `~/services`.
6. **Đặt hàm tính toán ở đâu:**
   - `utils/`: dùng ở nhiều nơi trong dự án (định dạng ngày, tính hạn nộp, chống XSS…).
   - `helper.js` đặt ngay trong thư mục page hoặc layout (`pages/deadlines/helper.js`, `layouts/userLayout/helper.js`): tính toán chỉ trang/layout đó dùng. Khi có nơi thứ hai cần thì chuyển lên `utils/`.
   - `lib/`: chỉ dành cho phần cấu hình/bọc framework; hiện chưa có nên không tạo.

## Viết code

- **Mọi tên do dự án tự đặt đều `camelCase`**: thư mục, file (`apiClient.js`, `seedCloud.js`), route (`/forgotPassword`), endpoint API, class CSS tự định nghĩa trong `index.css` (`btnPrimary`, `pageHeader`). Giữ nguyên tên do công cụ/thư viện áp đặt: class Tailwind, class của thư viện (`react-calendar`), tên gói npm, `package-lock.json`, `docker-compose.yml`, `README.md`/`CLAUDE.md`/`CHANGELOG.md`, tiền tố ngày của tài liệu kế hoạch (`2026-05-22-…`).
- Component `PascalCase` · hook bắt đầu bằng `use` · hằng số `UPPER_SNAKE` · biến môi trường `VITE_UPPER_SNAKE`.
- Component: `export default function TenComponent()`; riêng `components/ui/` giữ kiểu shadcn (named export).
- Comment tiếng Việt, giải thích *vì sao* hoặc quy tắc nghiệp vụ. Không để code chết hay code bị comment.

| Dữ liệu | Đặt ở đâu |
|---|---|
| Từ server | TanStack Query trong `hooks/`, gọi `services/` — không gọi axios trong component |
| State toàn cục (giao diện, phiên đăng nhập) | Redux Toolkit `store/slices/`, đọc bằng selector `selectXxx` |
| Từ khóa + bộ lọc | URL trang chủ (`/?search=…&degree=…`) qua `useScholarshipFilters()` |
| Cục bộ | `useState` |

- Redux **không lưu token** (token nằm trong cookie httpOnly do server quản lý).
- Mỗi màn hình đủ 4 trạng thái: đang tải (skeleton), rỗng, lỗi (có nút thử lại), có dữ liệu.
- Chuyển trang không được nháy: `Suspense` đặt quanh `<Outlet />` trong layout (không bọc cả layout), router bật `v7_startTransition`, trang hay dùng được tải trước trong `pageLoaders.js`.
- Tải quá 5 giây → `SlowLoading` qua `useSlowLoading(isLoading)`. Hiệu ứng `Reveal` chỉ chạy khi đã có dữ liệu, tôn trọng `prefers-reduced-motion`.

**Bảo mật (XSS):** không dùng `dangerouslySetInnerHTML` (bắt buộc thì qua `sanitizeHtml()`); mọi URL từ dữ liệu phải qua `safeUrl()` vì dữ liệu được cào từ web ngoài; link tab mới có `rel="noopener noreferrer"`; không thêm script nội tuyến (bản build có CSP trong `vite.config.js`).

**Accessibility:** dùng thẻ thật (`<button>`, `<a href>`, `<label>` gắn input); nút chỉ có icon phải có `aria-label`; icon trang trí `aria-hidden="true"`; mọi thứ bấm được có hover và focus nhìn thấy được.

## Thiết kế

**Chỉ 5 màu**, khai báo duy nhất trong `src/index.css`:

| Biến | Màu | Dùng cho |
|---|---|---|
| `--c-primary` | #4F46E5 tím chàm | nút chính, liên kết, mục đang chọn, nhãn "Du học" |
| `--c-neutral` | #3F3F46 xám than | chữ, tiêu đề thẻ, viền, nền phụ, nhãn "Trong nước" |
| `--c-success` | #067647 xanh lá | hạn nộp > 30 ngày, thành công |
| `--c-warning` | #B54708 cam | hạn nộp 11–30 ngày, cảnh báo |
| `--c-danger` | #B42318 đỏ | hạn nộp ≤ 10 ngày, lỗi, xóa |

- `tailwind.config.js` chỉ pha sắc đậm/nhạt từ 5 màu (`tone`, `scale`, `badge`). Component **không viết mã màu** (`#…`, `text-blue-500`, `bg-[#…]`) — dùng token: `brand-600`, `heading`, `fg`, `fg-muted`, `line`, `canvas`, `hover`, `urgent`/`soon`/`open`, `abroad`/`domestic`.
- Cần màu dạng giá trị JS (biểu đồ, framer-motion, toast) → `color('primary', { mix, alpha })` trong `utils/palette.js`.
- Chế độ tối chưa làm: giao diện luôn sáng.

**Bố cục:** header 64px chia 3 cột (logo | thanh tìm kiếm ở chính giữa | thông báo + tài khoản); sidebar 256px `sticky`; nội dung lề 32px. Cài đặt, đăng xuất nằm trong menu sổ xuống của avatar. Thông báo **không có trang riêng**: bấm chuông là sổ danh sách (`notificationMenu`).

**Danh sách học bổng** (trang chủ, đã lưu, tương tự) luôn dùng `ScholarshipGrid` + `ScholarshipCard`; danh sách đơn ứng tuyển dùng dạng dòng (học bổng | giấy tờ | trạng thái).

**Responsive (bắt buộc mọi trang):** kiểm tra ở 360, 768, 1024, 1280px — không được cuộn ngang.
- Từ `lg` (1024px): bố cục đầy đủ như trên. Dưới `lg`: sidebar ẩn, thay bằng nút ☰ mở menu trượt (`Sheet`); header chỉ còn nút menu + logo thu gọn | ô tìm kiếm | chuông + avatar; bảng bộ lọc bám hai mép màn hình.
- Lề nội dung 16 → 24 → 32px (`p-4 sm:p-6 lg:p-8`); khối tràn sát lề (VD dải đầu trang chi tiết) phải đổi lề âm theo cùng mốc.
- Lưới dùng `auto-fill/auto-fit` với `minmax(min(Npx,100%),1fr)`; hàng nút/nhãn cho phép `flex-wrap`; chữ không được tràn khung (`min-w-0`, `truncate`, `break-words`).
- Chỉ chỉnh ở component gốc (`components/ui`, layout) khi lỗi lặp nhiều nơi; không vá riêng từng trang.

**Kích thước:** điều khiển header 40px · mục sidebar 38px · nút bộ lọc 34px · bo góc thẻ `rounded-tile` 14px, ô con `rounded-inner` 10px, nút `rounded-control` 8px, nhãn 6px · khoảng cách bội số của 4.

**Chữ:** Be Vietnam Pro · `text-page-title` 24 · `text-card-title` 17 · `text-block-title` 15 · thân 13–14 · nhãn 11.5–12.

**Component:**
- Icon: Heroicons solid (`/24/solid`; nhỏ dùng `/20/solid`, `/16/solid`). Chỉ mũi tên xổ xuống dùng dạng nét.
- Mỗi vùng chỉ 1 nút chính (nền tím); hành động phụ dùng nút viền hoặc nút chữ.
- Nhãn luôn mang nghĩa, không trang trí. Hạn nộp: `getDeadlineInfo()` trong `utils/scholarship.js` (ngưỡng 10 và 30 ngày).
- Thẻ học bổng đọc từ trên xuống: nhãn hạn nộp + phạm vi + nút lưu → tiêu đề + nhà tài trợ → 3 ô Quốc gia | Bậc học | Tài trợ → "Xem chi tiết" căn giữa ở đáy. Hover nhấc lên 3px. Cả thẻ là một `<Link>`; nút lưu đặt chồng ở góc, nằm ngoài link (HTML không cho nút trong thẻ `<a>`).
- Chuyển động 150–220ms; không gradient, không emoji trang trí.

**Tìm kiếm:**
- Chỉ **một** thanh tìm kiếm trên header (`components/scholarshipFilter`). Bảng bộ lọc `display: none` cho đến khi bấm vào ô; hiện bằng mờ → rõ tại chỗ (không trượt); đóng bằng Esc, bấm ra ngoài, tìm xong hoặc chuyển trang.
- Kết quả hiện ở **trang chủ**; không có trang Tìm học bổng riêng. `/scholarships?…` tự chuyển về `/?…`; trang chi tiết là `/scholarships/:slug` (tạo đường dẫn bằng `scholarshipPath()`; link cũ dùng UUID vẫn mở được).

## Git

- Nhánh `feat/…`, `fix/…`, `refactor/…`, `docs/…`; không commit thẳng lên `main`.
- Commit dạng `feat: …`, `fix: …`, `refactor: …`, `style: …`, `docs: …`.
- Merge vào `dev` hoặc `main` qua Pull Request: ít nhất 1 người review, `lint` và `build` phải qua.
- Không commit `.env`, khóa API, dữ liệu cá nhân.
