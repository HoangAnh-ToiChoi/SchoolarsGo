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
| 2026-11-21 | File phụ (`helper*.js`, `constants.js`, `navConfig.js`, `use*.js`) đặt lẻ cạnh `index.jsx`; hàm và hằng số bị gộp lẫn lộn (`statusLabel` trong `constants.js`, `FOLLOW_UP_DAYS` trong `helper.js`); tồn tại code thừa (`formatFileSize` trong profile) | Bắt buộc cấu trúc thư mục trang/layout theo `components/ hooks/ helpers/ constants/` (mỗi thư mục có `index.js` re-export). Mỗi file một hàm/hằng số duy nhất <= 200 dòng. Không để file lẻ ở cấp gốc trang (R10, R11) | `pages/{applications, applicationDetail, scholarshipDetail, profile, deadlines}`, `layouts/{userLayout, adminLayout}` |
| 2026-11-20 | Cookie `accessToken` hết hạn (server báo `ACCESS_TOKEN_MISSING`) nhưng FE chỉ refresh khi `EXPIRED` → bị đăng xuất | Interceptor refresh với **cả hai** mã `ACCESS_TOKEN_EXPIRED` và `ACCESS_TOKEN_MISSING` (`REFRESHABLE_CODES`) | `utils/apiClient.js` |
