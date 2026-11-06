# ScholarsGo — Quy ước dự án

Nền tảng tìm học bổng (du học và trong nước) cho sinh viên Việt Nam.
File này là nguồn quy ước chính cho cả người và AI. Quy ước cũ (`Quy_Uoc_Chung.md`, `docs/designSystem.md`) chỉ còn giá trị ở những phần **không trái** với file này.

## Tổng quan

| Phần | Công nghệ |
|---|---|
| Frontend (`frontend/`) | React 18 + Vite, TailwindCSS 3, shadcn/ui (Radix), Redux Toolkit, TanStack Query, Heroicons |
| Backend (`backend/`) | Node.js + Express, PostgreSQL (Supabase) — **chưa tái cấu trúc**, giữ nguyên cách tổ chức hiện tại |

Frontend đang được làm lại trên nhánh `refactor/frontend-ui-v2`. Trang nào đã làm lại dùng quy ước bên dưới; trang chưa làm lại còn dùng `components/legacy/`.

## Lệnh thường dùng (trong `frontend/`)

```bash
npm run dev          # chạy local, gọi API thật ở http://localhost:3001/api
npm run lint         # bắt buộc 0 lỗi trước khi commit
npm run build        # bắt buộc build được trước khi commit
npm run build:pages  # bản demo cho GitHub Pages (dữ liệu minh họa, base /SchoolarsGo/)
```

Bản demo: đẩy nội dung `frontend/dist/` (sau `build:pages`) lên nhánh `gh-pages` → https://hoanganh-toichoi.github.io/SchoolarsGo/
Thêm `?demoDelay=7000` vào URL demo để xem trạng thái tải chậm.

## Tổ chức thư mục frontend

```
frontend/src/
  App.jsx                 router; mỗi trang tải lười (lazy)
  main.jsx                Provider Redux + React Query + Router
  index.css               BẢNG MÀU (5 màu gốc) + style nền
  pages/<tênTrang>/
    index.jsx             trang — chỉ ghép component, không gọi API trực tiếp
    components/<tên>/index.jsx   component chỉ trang này dùng
  layouts/                khung giao diện; index.jsx để dùng, components/ là phần triển khai
    userLayout/           khung user: components/userHeader, userSidebar (+ navConfig.js), userMenu
    adminLayout/          khung admin: components/adminSidebar, adminMobileNav (+ constants.js)
  components/
    ui/                   component gốc của shadcn/ui (button, card, badge, dropdownMenu, tabs…)
    common/               dùng ở nhiều trang: pageHeader, pagination, reveal, slowLoading…
    scholarship/          thẻ học bổng và các phần nhỏ của nó
    scholarshipFilter/    thanh tìm kiếm + bộ lọc (xem mục bên dưới)
    legacy/               UI kit cũ cho trang chưa làm lại — KHÔNG dùng cho code mới
  hooks/                  hook dùng chung (useScholarships, useScholarshipFilters, useSlowLoading…)
  services/<tên>.service.js   hàm gọi API theo từng nhóm, dùng chung lib/apiClient.js
  store/                  Redux: index.js + slices/ (auth, comparison, ui)
  lib/                    apiClient, utils (cn), scholarship (logic hạn nộp, nhãn), security, palette, constants, demo/
```

### Quy tắc

1. **Mỗi trang và mỗi component là một thư mục có `index.jsx`**: `pages/home/index.jsx`, `components/scholarship/scholarshipCard/index.jsx`. Tên thư mục viết `camelCase` (ví dụ `userLayout`, `adminLayout`, `scholarshipDetail`), không dùng `kebab-case`.
2. **Component lớn chia nhỏ thành thư mục con, gom lại ở `index.jsx` của thư mục cha.** Ví dụ chuẩn:
   ```
   components/scholarshipFilter/
     index.jsx          ghép các phần, giữ state, export phụ: export { default as ActiveFilters } …
     constants.js       cấu hình (danh sách 8 bộ lọc)
     searchInput/index.jsx
     filterPanel/index.jsx
     filterField/index.jsx
     filterActions/index.jsx
     activeFilters/index.jsx
   ```
3. **Import luôn từ gốc `src` bằng `~/`**, không dùng `../`:
   `import ScholarshipCard from '~/components/scholarship/scholarshipCard';`
4. Component chỉ một trang dùng → để trong `pages/<trang>/components/`. Dùng từ 2 trang trở lên → chuyển lên `components/`.
5. Thứ tự import: thư viện ngoài → `~/components` → `~/hooks` → `~/lib` / `~/store` / `~/services`.

## Cách viết code

### Đặt tên
- **Mọi tên do dự án tự đặt đều `camelCase`**: thư mục, file (`apiClient.js`, `seedCloud.js`), đường dẫn route (`/forgotPassword`, `/resetPassword`), endpoint API, class CSS tự định nghĩa trong `index.css` (`btnPrimary`, `pageHeader`). Chỉ giữ nguyên những tên do công cụ/thư viện áp đặt: class tiện ích Tailwind (`flex-col`, `bg-ink-900`), class của thư viện (`react-calendar`), tên gói npm, `package-lock.json`, `docker-compose.yml`, và tiền tố ngày của tài liệu kế hoạch (`2026-05-22-…`).
- Thư mục: `camelCase` · component: `PascalCase` · biến, hàm, hook: `camelCase` (hook bắt đầu bằng `use`) · hằng số: `UPPER_SNAKE` · biến môi trường: `VITE_UPPER_SNAKE`.
- Component mặc định `export default function TenComponent()`. File trong `components/ui/` giữ nguyên kiểu của shadcn (named export).
- Comment bằng **tiếng Việt**, giải thích *vì sao* hoặc quy tắc nghiệp vụ, không mô tả lại code. Không để code chết, không để đoạn code bị comment.

### Dữ liệu và state
| Loại dữ liệu | Đặt ở đâu |
|---|---|
| Dữ liệu từ server | TanStack Query trong `hooks/` (gọi `services/`) — không gọi axios trong component |
| State toàn cục của giao diện/phiên đăng nhập | Redux Toolkit (`store/slices/`), đọc bằng selector `selectXxx` |
| Từ khóa tìm kiếm + bộ lọc | Trên URL của trang chủ (`/?search=…&degree=…`), qua `useScholarshipFilters()` — nguồn sự thật duy nhất |
| State cục bộ của một component | `useState` |

- Redux **không lưu token**. Token do server giữ trong cookie httpOnly; store chỉ giữ thông tin hiển thị của user.
- Mỗi màn hình có đủ 4 trạng thái: đang tải (skeleton), rỗng, lỗi (có nút thử lại), có dữ liệu.
- Tải quá 5 giây → hiện `SlowLoading` (dùng `useSlowLoading(isLoading)`); có dữ liệu thì tự tắt.
- Hiệu ứng trượt lên (`Reveal`) chỉ chạy **sau khi đã có dữ liệu**; tôn trọng `prefers-reduced-motion`.

### Bảo mật (chống XSS)
- Không dùng `dangerouslySetInnerHTML`; bắt buộc thì qua `sanitizeHtml()` trong `lib/security.js`.
- Mọi URL lấy từ dữ liệu (link học bổng, tin tức, ảnh) phải qua `safeUrl()` — dữ liệu được cào từ web ngoài, có thể chứa `javascript:`.
- Link mở tab mới luôn có `rel="noopener noreferrer"`.
- Bản build có Content-Security-Policy (cấu hình trong `vite.config.js`); không thêm script nội tuyến.

### Accessibility
- Dùng thẻ thật: `<button>`, `<a href>`, `<label>` gắn với input. Nút chỉ có icon phải có `aria-label`. Icon trang trí có `aria-hidden="true"`.
- Mọi thứ bấm được phải có trạng thái hover và focus nhìn thấy được.

## Thiết kế

### Bảng màu — chỉ 5 màu
Toàn bộ màu nằm **duy nhất** trong `src/index.css`. Đổi màu chỉ sửa 5 dòng này:

| Biến | Màu | Dùng cho |
|---|---|---|
| `--c-primary` | #4F46E5 tím chàm | nút chính, liên kết, mục đang chọn, nhãn "Du học" |
| `--c-neutral` | #3F3F46 xám than | chữ, tiêu đề thẻ, viền, nền phụ, nhãn "Trong nước" |
| `--c-success` | #067647 xanh lá | hạn nộp > 30 ngày, thành công |
| `--c-warning` | #B54708 cam | hạn nộp 11–30 ngày, cảnh báo |
| `--c-danger` | #B42318 đỏ | hạn nộp ≤ 10 ngày, lỗi, xóa |

- `tailwind.config.js` chỉ **pha** sắc đậm/nhạt từ 5 màu này (hàm `tone`, `scale`, `badge`), không chứa mã màu nào ngoài trắng.
- **Không viết mã màu trong component** (`#xxxxxx`, `text-blue-500`, `bg-[#…]`). Dùng tên token: `brand-600`, `heading`, `fg`, `fg-muted`, `line`, `canvas`, `hover`, `urgent`/`soon`/`open`, `abroad`/`domestic`…
- Chỗ bắt buộc cần màu dạng giá trị JS (biểu đồ, framer-motion, toast) → `color('primary', { mix, alpha })` trong `lib/palette.js`.
- Chế độ tối **chưa làm**; giao diện luôn sáng.

### Bố cục và kích thước
- Header cao 64px, chia 3 cột (logo | thanh tìm kiếm ở chính giữa | thông báo + tài khoản). Sidebar 256px, `sticky`. Nội dung lề 32px.
- Cài đặt, đăng xuất nằm trong menu sổ xuống khi bấm avatar, không đặt ở sidebar.
- Chiều cao: điều khiển header 40px · mục sidebar 38px · nút bộ lọc 34px.
- Bo góc: thẻ `rounded-tile` (14px) · ô con `rounded-inner` (10px) · nút `rounded-control` (8px) · nhãn 6px.
- Chữ: font Be Vietnam Pro; thang cỡ `text-page-title` 24 · `text-card-title` 17 · `text-block-title` 15 · thân 13–14 · nhãn 11.5–12.
- Khoảng cách theo bội số của 4.

### Component
- **Icon**: Heroicons bản solid (`@heroicons/react/24/solid`, cỡ nhỏ dùng `/20/solid` hoặc `/16/solid`). Chỉ mũi tên xổ xuống dùng dạng nét.
- **Nút**: chỉ 1 nút chính (nền tím) trong mỗi vùng; hành động phụ dùng nút viền hoặc nút chữ.
- **Nhãn (badge)**: luôn mang nghĩa (hạn nộp, phạm vi, trạng thái), không dùng trang trí. Hạn nộp: `getDeadlineInfo()` trong `lib/scholarship.js` (ngưỡng 10 và 30 ngày là hằng số ở đó).
- **Thẻ học bổng**: đọc từ trên xuống — nhãn hạn nộp + phạm vi + nút lưu → tiêu đề + nhà tài trợ → 3 ô Quốc gia | Bậc học | Tài trợ → "Xem chi tiết" căn giữa ở đáy. Hover: thẻ nhấc lên 3px.
- **Chuyển động**: 150–220ms; không gradient, không emoji trang trí.
- **Tìm kiếm**: chỉ có **một** thanh tìm kiếm trên header (`components/scholarshipFilter`). Bảng bộ lọc ẩn (`display: none`) cho đến khi bấm vào ô tìm kiếm, hiện bằng hiệu ứng mờ → rõ tại chỗ (không trượt); đóng bằng Esc, bấm ra ngoài, tìm xong hoặc chuyển trang.
- **Kết quả tìm kiếm hiện ở trang chủ** — không có trang Tìm học bổng riêng. Link cũ `/scholarships?…` tự chuyển về `/?…`; trang chi tiết vẫn là `/scholarships/:id`.

## Git

- Nhánh: `feat/…`, `fix/…`, `refactor/…`, `docs/…`. Không commit thẳng lên `main`.
- Commit theo dạng `feat: …`, `fix: …`, `refactor: …`, `style: …`, `docs: …`.
- Merge vào `main` qua Pull Request, có ít nhất 1 người review, `npm run lint` và `npm run build` phải qua.
- Không commit file `.env`, khóa API hay dữ liệu cá nhân.
