# Quy tắc code Frontend — BẮT BUỘC

File này là **luật**, không phải gợi ý. PR vào `dev` vi phạm thì bị trả lại. Đọc cùng `CLAUDE.md` (cấu trúc, màu, kích thước); file này lo phần **cách viết component** và là nơi ghi lại **mọi lỗi đã sửa thành quy tắc**.

> Danh sách vi phạm hiện có của nhánh FE và việc cần sửa: xem [`frontend/reviewTasks.md`](../../frontend/reviewTasks.md). File này chỉ chứa luật, không chứa danh sách lỗi.

---

## ⚠️ QUY TẮC VÀNG: sửa lỗi xong phải thành quy tắc

> **Mỗi lỗi hoặc điểm yếu mà bạn sửa trong code FE đều phải được ghi vào file này trước khi mở PR.**
> PR sửa kiểu lỗi đã nêu mà không cập nhật mục [Nhật ký quy tắc](#nhật-ký-quy-tắc) → **không được merge**.

Làm thế nào (3 bước, dưới 5 phút):

1. Sửa lỗi trong code.
2. Hỏi: "lỗi này có thể gặp ở trang khác không?" Nếu có → viết một dòng vào **Nhật ký quy tắc** (lỗi gì · quy tắc mới · đã sửa ở đâu).
3. Quy tắc đủ tổng quát (áp dụng ≥ 2 trang) → thêm vào bảng **Bộ quy tắc** ngay bên dưới, kèm ví dụ sai/đúng nếu cần.

Mục đích: lỗi đã gặp một lần thì không bao giờ gặp lại, và người sau không phải đoán.

---

## Bộ quy tắc (R1–R11)

| # | Quy tắc | Kiểm tra nhanh |
|---|---|---|
| **R1** | **Component chỉ trả lời "hiển thị cái gì".** Việc "tính ra cái gì" là của hàm thuần ở `helpers/` hoặc hook ở `hooks/`. | JSX có ternary lồng? Thân component có > 1 tầng `if/? :` để dựng dữ liệu? → tách |
| **R2** | **Một quy tắc nghiệp vụ = một nơi duy nhất.** Cấm chép nhánh logic, bản đồ màu, nhãn trạng thái sang chỗ khác. Lặp ở ≥ 2 chỗ → gom ngay. | Tìm `daysLeft === null`, `TONE_`, `STATUS_LABEL`… xuất hiện ở nhiều file? |
| **R3** | **Không giá trị cứng rải rác.** Nhãn dùng ≥ 2 nơi, route, bản đồ đổi tên (`international → 'abroad'`), số ma thuật (`SIMILAR_LIMIT`) → `constants/`. Chuỗi chỉ dùng một lần trong JSX thì được viết thẳng. | `grep` thấy cùng một chuỗi ≥ 2 nơi? |
| **R4** | **Không `[Npx]` và không mã màu trong `className` / JS.** Chỉ dùng token Tailwind trong `tailwind.config.js` + `src/index.css`. Cần cỡ mới → thêm token rồi dùng tên. | `grep -rnE "\[[0-9.]+px\]" pages layouts components` (trừ `components/ui/`, `legacy/`) phải ra **0** |
| **R5** | **Component không biết padding của layout cha.** Cấm lề âm bù layout (`-mx-4 -mt-4 sm:-mx-6…`). Dùng component do layout sở hữu (`PageBand`). | `grep -rnE -- "-m[xt]-[0-9]" pages` |
| **R6** | **Điều hướng qua `ROUTES`.** Cấm `navigate('/applications')`, `to="/"` gõ tay. | `grep -rnE "navigate\('\|to=\"/" pages layouts` |
| **R7** | **Không `try/catch` rỗng trong component.** Lỗi gọi API xử lý trong hook (`onSuccess` / `onError`); component chỉ gọi `mutate`. | `catch {}` hoặc `catch { // comment }` trong `.jsx` |
| **R8** | **"Bây giờ là lúc nào" tính một lần** (ở trang hoặc hook) rồi truyền xuống, không để mỗi component tự `new Date()`. | Nhiều component cùng gọi `getDeadlineInfo(...)` cho cùng một học bổng |
| **R9** | **Hàm thuần bắt buộc có test** (`helpers/`). Hàm không cần render thì test không được cần render. | Có file test cho mỗi hàm mới |
| **R10** | **Trang mới dùng đúng khung** `index.jsx + components/ hooks/ helpers/ constants/` (mỗi thư mục có `index.js`, tên file = tên chức năng). Không tạo `helper.js` "tạm". | Xem `CLAUDE.md` → "Tách file phụ của trang" |
| **R11** | **Chỉ chuyển ra thư mục chung khi dùng chung.** Hook / hàm / hằng số **một trang dùng** → ở lại `pages/<trang>/hooks/ helpers/ constants/`. Chỉ khi **≥ 2 trang** dùng mới chuyển sang `src/hooks/` (hook) hoặc `src/utils/` (hàm, hằng số). Không chuyển trước "phòng khi cần"; hai hàm trùng tên nhưng khác hành vi thì không phải dùng chung. | Mỗi thứ nằm trong `utils/` / `hooks/` gốc có ≥ 2 nơi import? Thứ nào chỉ 1 trang dùng mà nằm ngoài trang? |

### Nơi đặt chuẩn (chưa có thì tạo ở lần sửa đầu tiên, không tạo chỗ khác)

| Cần | Đặt ở |
|---|---|
| Màu theo mức gấp (`urgent/soon/open/neutral` → class chữ, nền, chấm) | `src/utils/palette.js` → `TONE_CLASS` |
| Chữ + ghi chú của hạn nộp (chưa công bố / hôm nay / còn N ngày) | `src/utils/scholarship.js` → `getDeadlineLabel(deadline)` trả `{ tone, short, note }` |
| Đường dẫn trang | `src/utils/routes.js` → `ROUTES` |
| Dải đầu trang tự bù padding layout | `src/components/common/pageBand/index.jsx` |
| Liên kết mở tab mới (có `rel` + chữ `sr-only`) | `src/components/common/externalLink/index.jsx` |
| Bảng trang quản trị (lỗi, tiêu đề cột, dòng chờ, dòng rỗng, phân trang) + tiêu đề trang | `src/components/admin/adminTable`, `src/components/admin/adminPageTitle` |
| Mutation admin (làm mới danh sách + toast) | `src/hooks/useAdmin.js` → `useAdminMutation` |

### Ví dụ R1 + R2 (sai → đúng)

```jsx
// ❌ Sai: logic nằm trong component, chép ở nhiều nơi
const value = daysLeft === null ? 'Chưa công bố'
            : daysLeft === 0 ? 'Hết hạn hôm nay'
            : `còn ${daysLeft} ngày`;
```

```js
// ✅ Đúng: một hàm thuần, mọi nơi cùng gọi
export function getDeadlineLabel(deadline) {
  const { daysLeft, tone } = getDeadlineInfo(deadline);
  if (daysLeft === null) return { tone, short: 'Chưa công bố', note: 'Theo dõi bài đăng gốc' };
  if (daysLeft === 0)    return { tone, short: 'Hết hạn hôm nay', note: formatDate(deadline) };
  return { tone, short: `còn ${daysLeft} ngày`, note: formatDate(deadline) };
}
// component: const { short, note, tone } = getDeadlineLabel(deadline);
```

### Ví dụ R4 + R5 (sai → đúng)

```jsx
// ❌ px lẻ + lề âm biết padding của layout
<section className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 pb-[26px] pt-[22px]">
// ✅ token + component do layout sở hữu
<PageBand>
```

---

## Dành cho AI agent (Antigravity, Claude…)

1. **Đọc trước khi sửa:** `CLAUDE.md` và file này. Chưa đọc thì không bắt đầu.
2. **Mỗi lần một việc.** Không gộp nhiều quy tắc vào một lượt sửa; không "tiện tay" sửa thứ không nằm trong yêu cầu.
3. **Giữ nguyên hành vi và giao diện.** Đây là refactor: không đổi chữ hiển thị, màu, bố cục, API.
4. **Tự kiểm chứng bằng lệnh**, không tự tin suông: chạy cột "Kiểm tra nhanh" của quy tắc liên quan, `npm run lint`, `npm run build`. Chỉ báo xong khi kết quả đúng; ghi rõ nếu một bước không chạy được.
5. **Không bịa đường dẫn hay hàm.** Dùng `grep` kiểm tra trước khi import; chỗ đặt hàm mới theo bảng "Nơi đặt chuẩn".
6. **Cập nhật Nhật ký quy tắc** (QUY TẮC VÀNG) trước khi báo xong.

---

## Checklist trước khi mở PR FE

```
□ R1  Không ternary lồng / logic dựng dữ liệu trong JSX
□ R2  Không chép nhánh logic, bản đồ màu, nhãn sang chỗ khác
□ R3  Nhãn dùng ≥ 2 nơi, route, số ma thuật nằm trong constants/
□ R4  grep "[Npx]" và mã màu: 0 kết quả trong file vừa sửa
□ R5  Không margin âm bù layout
□ R6  Không navigate('/…') / to="/…" gõ tay
□ R7  Không try/catch rỗng trong component
□ R8  "Hôm nay" tính một lần rồi truyền xuống
□ R9  Hàm mới ở helpers/ có test
□ R10 Đúng khung index.jsx + components/ hooks/ helpers/ constants/
□ R11 Chỉ chuyển ra utils/ hooks/ gốc khi ≥ 2 trang dùng
□ npm run lint = 0 lỗi · npm run build qua
□ Đã ghi lỗi vừa sửa vào "Nhật ký quy tắc" (QUY TẮC VÀNG)
```

---

## Nhật ký quy tắc

Thêm dòng mới **lên đầu bảng**. Cột "Đã sửa ở" ghi trang/file để người khác biết trang nào đã sạch.

| Ngày | Lỗi / điểm yếu đã gặp | Quy tắc rút ra | Đã sửa ở |
|---|---|---|---|
| 2026-11-28 | Form sửa học bổng của admin lấy giá trị từ dòng danh sách (thiếu cột nên ô trống) và gửi lại cả form; ô "Mô tả" gửi trường server không có; số tiền / hạn nộp sai kiểu nên bị 400 | Form sửa tải bản đầy đủ trước khi hiện, chỉ gửi trường đã đổi, xóa số / ngày gửi `null`; tên trường trùng cột server. Sửa / xóa thì làm mới cả cache trang chi tiết, đã lưu, đơn | `pages/admin/scholarships`, `hooks/useAdmin.js` |
| 2026-11-28 | Trang chat bỏ qua lỗi tải lịch sử bằng `.catch(() => {})` ngay trong component; hai trang admin chép y nguyên dòng chờ tải, chân phân trang, class tiêu đề cột, khối lỗi; 6 hook mutation admin chép cùng khung làm mới + toast; dashboard dùng màu Tailwind mặc định (`border-l-red-500`, `border-l-amber-500`) và ternary lồng chọn màu icon | Gọi API và xử lý lỗi (kể cả lỗi cố ý bỏ qua) nằm trong hook của trang, ghi lý do bằng comment và đặt trạng thái dự phòng rõ ràng, không `catch` rỗng. Bảng quản trị dùng `components/admin/adminTable` + `adminPageTitle`; mutation admin mới viết qua `useAdminMutation`. Màu theo mức gấp dùng token `danger` / `warning` qua bản đồ trong `constants/`, chọn mức bằng hàm thuần ở `helpers/` | `pages/{chat, dashboard, admin/users, admin/scholarships}`, `components/admin`, `hooks/useAdmin.js` |
| 2026-11-27 | `ErrorBoundary` chỉ `console.error` (không tới Sentry); nút "Về trang chủ" dùng `window.location.href = '/'` nên bản GitHub Pages (`/SchoolarsGo/`) ra 404; lỗi một lần là kẹt màn hình lỗi kể cả khi chuyển trang; layout admin không có lưới chặn | Điều hướng trong app dùng `<Link>` / `navigate()` (giữ `basename`); chỉ chỗ bắt buộc tải lại trang mới dùng `window.location`, và phải ghép `import.meta.env.BASE_URL`. Mỗi layout bọc `<Outlet />` bằng `components/common/errorBoundary` với `resetKey={pathname}`; không reset trong `onClick` của link rời trang (render lại trang hỏng, Sentry nhận trùng); lỗi tải chunk trang (`isChunkLoadError`) thì "Thử lại" tải lại cả trang vì `React.lazy` giữ kết quả reject; message lỗi gửi Sentry đi qua `scrubText` (`utils/sentry.js`) để che email, số điện thoại | `components/common/errorBoundary`, `layouts/userLayout`, `layouts/adminLayout`, `utils/sentry.js` |
| 2026-11-27 | `?redirect=/\evil.com` qua được kiểm tra "bắt đầu bằng `/`, không phải `//`": trình duyệt coi `\` như `/` nên sau đăng nhập bị đưa sang trang ngoài (open redirect, cùng dạng CVE của react-router) | Đường dẫn lấy từ URL / dữ liệu để `navigate()` hay `<Link>` phải qua `safeRedirectPath()` (`utils/session.js`): chặn `//`, `\`, ký tự điều khiển. Giữ react-router ≥ 7.18 | `hooks/useAuth.js`, `utils/session.js` |
| 2026-11-27 | 16 hàm `helpers/` không có test (R9) và `scholarshipDetail/helpers` import `../../../utils/…` vì `node --test` không hiểu `~/`, import không đuôi, `import.meta.env`; CI cũ không chạy test FE nên không ai thấy | Test FE chạy bằng `npm test` (nạp `testRegister.js` → `testAliasLoader.js` hiểu `~/`, import không đuôi/theo thư mục, `import.meta.env`). Helper luôn import `~/`; không đổi import để chiều công cụ test. CI job Frontend chạy `npm test`, job Harness chặn helper mới thiếu test | 16 file `*.test.js` ở `layouts/userLayout`, `pages/{applicationDetail, applications, deadlines, profile, scholarshipDetail}` |
| 2026-11-24 | Chunk vào trang đầu 629kB: `userLayout` import tĩnh `ChatFAB` nên `framer-motion` (~450kB mã nguồn) tải ở mọi trang; dữ liệu demo nằm trong bản thật | Layout / `main.jsx` / `apiClient` không import tĩnh component hay module chỉ phục vụ một tính năng phụ hoặc bản demo: dùng `lazy()` / `await import()`. Thư viện vendor tách chunk qua `manualChunks` (`vite.config.js`). Đo lại bằng sourcemap trước khi thêm import nặng vào layout | `layouts/userLayout`, `main.jsx`, `utils/apiClient.js`, `vite.config.js` |
| 2026-11-24 | Trang chat đọc `err.response?.status` nhưng `apiClient` reject bằng `Error` kèm `status` (không có `response`) → nhánh 429/401/503 không bao giờ chạy, mọi lỗi hiện "sự cố kết nối" | Lỗi từ service/hook đọc `err.status` (có thể `?? err.response?.status`); không giả định lỗi axios thô sau interceptor | `pages/chat` |
| 2026-11-24 | Đăng xuất rồi đăng nhập tài khoản khác trong cùng tab vẫn thấy đơn / đã lưu / thông báo của người trước (cache TanStack Query không bị xóa); hết phiên trên bản `/SchoolarsGo/` chuyển tới `/login` (404) và `redirect` lặp base | Mọi chỗ đổi người dùng (đăng nhập, đăng ký, đăng xuất) gọi `queryClient.clear()`; URL dựng bằng tay ngoài router phải tính `import.meta.env.BASE_URL` (dùng `buildLoginUrl` ở `utils/session.js`) | `hooks/useAuth.js`, `utils/apiClient.js`, `utils/session.js` |
| 2026-11-24 | Sentry ghi URL đầy đủ (trang, Referer, breadcrumb điều hướng/fetch) nên token trong link `/resetPassword?token=…` bị gửi lên bên thứ ba | Mọi dữ liệu gửi dịch vụ ngoài (Sentry, analytics) đi qua `scrubSentryEvent` / `scrubBreadcrumb` (`utils/sentry.js`); route mới nhận token qua URL phải được che bởi `scrubUrl` | `main.jsx`, `utils/sentry.js` |
| 2026-11-21 | Kích thước pixel cứng `[Npx]` xuất hiện rải rác tại 41 file ở pages, layouts, components; gây phân mảnh thiết kế, khó bảo trì và vi phạm quy ước token chuẩn Design System v2 | Chuẩn hóa toàn bộ kích thước về token cấu hình trong `frontend/tailwind.config.js` (`fontSize`: `ui`, `ui-lg`, `label`, `micro`, `stat`, `hero-title`; `width`: `menu`, `action-panel`, `detail-panel`, `user-menu`; `height`: `calendar`, `nav`, `control`; `spacing`: `sticky`, `filter`, `4.5`, `21`) hoặc bội số của 4; triệt tiêu hoàn toàn `[Npx]` (R4) | `frontend/tailwind.config.js`, 25 file trong `pages/`, 6 file trong `layouts/`, 10 file trong `components/` |
| 2026-11-21 | Lề âm `-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8` tự bù trừ padding layout bị lặp ở `detailHeader` và `detailSkeleton`, vi phạm tính độc lập layout của component | Tạo component dùng chung `PageBand` tự quản lý cặp lề âm + padding bù trừ cho layout, component con không tự dùng lề âm bù layout cha (R5) | `components/common/pageBand`, `pages/scholarshipDetail/components/{detailHeader, detailSkeleton}` |
| 2026-11-21 | ActionPanel chứa try/catch rỗng, gọi safeUrl lặp hai lần, nhánh đếm ngược lặp cấu trúc, nút bấm vượt chuẩn 44px; chứa comment roadmap trong JSX | Tách hook useCreateApplicationAction, helper getPrimaryLink, component deadlineCountdown, tạo externalLink dùng chung, chuẩn hóa nút h-10 (R1, R3, R7, R8) | components/common/externalLink, scholarshipDetail/components/{actionPanel, deadlineCountdown}, hooks/useCreateApplicationAction, helpers/getPrimaryLink |
| 2026-11-21 | DetailHeader tự dựng mảng tiles có ternary lồng, hardcode nhãn/fallback, ternary đổi variant badge; badge coverage trùng lặp trên tiêu đề | Tách hàm thuần buildHeaderTiles, tách constants headerLabels/scopeVariant, bỏ badge coverage trùng, thu gọn layout ô hiển thị (R1, R3) | pages/scholarshipDetail/components/detailHeader, helpers/buildHeaderTiles, constants/{headerLabels, scopeVariant} |
| 2026-11-21 | Đường dẫn và điều hướng bị gõ tay rải rác (`to="/..."`, `navigate('/...')`) ở >20 file; menu người dùng chứa liên kết chết tới `/settings` và `/settings/notifications` chưa có trong router | Chuẩn hóa toàn bộ điều hướng qua hằng số đóng băng `ROUTES` trong `src/utils/routes.js`; vô hiệu hóa liên kết chưa có trong menu tài khoản (R6) | `utils/routes.js`, 21 file trang/layout và các hook liên quan |
| 2026-11-21 | Nhánh `daysLeft === null / 0 / n` và câu chữ hạn nộp bị chép lặp ở 4 file (`deadlineBadge`, `notificationItem`, `actionPanel`, `detailHeader`) với 3 cách gọi khác nhau ("Chưa rõ hạn nộp", "Chưa công bố hạn nộp", "Chưa công bố") | Tập trung logic trạng thái hạn nộp vào một hàm thuần `getDeadlineLabel(deadline, today)` trong `src/utils/scholarship.js`, chuẩn hóa nhãn chưa có hạn thành "Chưa công bố" (R2, R11) | `utils/scholarship.js`, `components/scholarship/deadlineBadge`, `notificationMenu`, `scholarshipDetail` |
| 2026-11-21 | Bản đồ màu mức gấp (`tone → class`) bị chép lặp ở 4 nơi (`detailHeader`, `actionPanel`, `notificationItem`, `toneDot`); tên biến phân tán (`TONE_TEXT`, `TONE_BOX`, `TONE_DOT`, `TONE_CLASS`) | Gom toàn bộ bản đồ màu mức gấp về một hằng số duy nhất `TONE_CLASS` (`{ urgent, soon, open, neutral, brand }` -> `{ text, box, dot }`) trong `src/utils/palette.js` (R2) | `utils/palette.js`, `scholarshipDetail`, `notificationMenu`, `deadlines` |
| 2026-11-21 | File phụ (`helper*.js`, `constants.js`, `navConfig.js`, `use*.js`) đặt lẻ cạnh `index.jsx`; hàm và hằng số bị gộp lẫn lộn (`statusLabel` trong `constants.js`, `FOLLOW_UP_DAYS` trong `helper.js`); tồn tại code thừa (`formatFileSize` trong profile) | Bắt buộc cấu trúc thư mục trang/layout theo `components/ hooks/ helpers/ constants/` (mỗi thư mục có `index.js` re-export). Mỗi file một hàm/hằng số duy nhất <= 200 dòng. Không để file lẻ ở cấp gốc trang (R10, R11) | `pages/{applications, applicationDetail, scholarshipDetail, profile, deadlines}`, `layouts/{userLayout, adminLayout}` |
| 2026-11-20 | Cookie `accessToken` hết hạn (server báo `ACCESS_TOKEN_MISSING`) nhưng FE chỉ refresh khi `EXPIRED` → bị đăng xuất | Interceptor refresh với **cả hai** mã `ACCESS_TOKEN_EXPIRED` và `ACCESS_TOKEN_MISSING` (`REFRESHABLE_CODES`) | `utils/apiClient.js` |
