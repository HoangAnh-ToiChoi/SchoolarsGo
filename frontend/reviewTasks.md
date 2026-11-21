# Việc cần sửa ở nhánh FE (kết quả rà soát)

> ## ⛔ ĐỌC TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ
> 1. Đọc **[`docs/frontendRules/frontendRules.md`](../docs/frontendRules/frontendRules.md)**: bộ quy tắc R1–R10, "Nơi đặt chuẩn", mục "Dành cho AI agent" và **QUY TẮC VÀNG** (sửa lỗi xong phải ghi vào Nhật ký quy tắc).
> 2. Đọc **[`CLAUDE.md`](../CLAUDE.md)**: cấu trúc thư mục, màu, kích thước, quy ước đặt tên.
> 3. Chưa đọc cả hai thì **không bắt đầu sửa**. Mọi việc dưới đây chỉ là áp dụng các quy tắc đó vào code hiện có.

File này chỉ liệt kê **vi phạm của nhánh hiện tại** và **việc cần làm**. Luật nằm ở file quy tắc, không lặp lại ở đây. Khi một việc xong, tick vào ô và ghi vào Nhật ký quy tắc.

Nguồn: rà soát 2026-11-20 bằng `grep` trên `pages/ layouts/ components/` (bỏ `components/ui/` và `legacy/`). Số liệu là **số dòng** khớp mẫu; chạy lại lệnh ở từng việc để có số mới nhất.

---

## Cách làm việc (bắt buộc)

- Tạo nhánh từ `dev`: `refactor/feRulesCleanup` (theo quy trình trong `CLAUDE.md`).
- **Làm tuần tự T0 → T7, mỗi việc một commit** (`refactor(fe): …`). Không gộp nhiều việc vào một commit, không sửa thứ nằm ngoài việc đang làm.
- **Đây là refactor: giữ nguyên hành vi và giao diện.** Không đổi bố cục, màu, API. Chỗ nào buộc phải đổi chữ hoặc kích thước thì ghi rõ trong mô tả commit và hỏi lại ở mục [Cần hỏi lại](#cần-hỏi-lại-trước-khi-làm).
- Mỗi việc xong phải chạy **đúng lệnh ở mục "Xong khi"**, cộng `npm run lint` (0 lỗi) và `npm run build` (qua). Báo kết quả thật; lệnh nào không chạy được thì nói rõ.
- **Không đụng tới** trang legacy (`chat`, `dashboard`, `admin/*`) và `components/ui/`, trừ khi việc đó ghi rõ.
- Không bịa đường dẫn/hàm: `grep` trước khi import. Chỗ đặt hàm mới theo bảng "Nơi đặt chuẩn" trong file quy tắc.

---

## Danh sách việc

### ☑ T0. Tách file lẻ theo khung thư mục trang (R10)  ← làm đầu tiên
Mỗi trang/layout phải theo khung `components/ hooks/ helpers/ constants/` (mỗi thư mục có `index.js`), không còn file lẻ cạnh `index.jsx`. Các việc T1–T6 phía dưới đều đặt file mới vào khung này, nên T0 phải xong trước.

- **Kiểm tra:** `find src/pages src/layouts -maxdepth 3 \( -name "helper*.js" -o -name "constants.js" -o -name "navConfig.js" -o -name "use*.js" \) -not -path "*/hooks/*"` phải ra **rỗng**. Hiện đang ra các file sau, cần tách:

| File lẻ hiện tại | Tách thành (mỗi hàm / nhóm hằng số một file, tên = chức năng) |
|---|---|
| `pages/applications/helper.js` | `constants/stages.js` (`STAGES`) · `helpers/inStage.js` |
| `pages/applicationDetail/helper.js` | `constants/` : `steps`, `nextActions`, `canWithdraw`, `docTypePatterns`, `fileLimits` · `helpers/` : `getStepIndex`, `parseChecklist`, `guessDocType`, `validateFile`, `formatFileSize` |
| `pages/scholarshipDetail/helper.js` | `constants/bulletPattern.js` · `helpers/toListItems.js`, `helpers/buildSections.js` |
| `pages/profile/helper.js` | `constants/` : `profileSignalFields`, `futureSignalFields`, `fastFillSlot` · `helpers/` : `validateGPA`, `calculateCompletionScore`, `autoClassifyDocument`, `validateDocumentFile`. Hàm `formatFileSize` trong file này **không ai dùng**: xóa |
| `pages/deadlines/helper.js` + `constants.js` + `useDeadlineEvents.js` | `constants/` : `followUpDays`, `activeStatuses`, `toneDot`, `legend` · `helpers/` : `buildDeadlineEvents`, `getMonthDays`, `getStatusLabel` (đổi tên từ `statusLabel`) · `hooks/useDeadlineEvents.js` |
| `layouts/userLayout/helper.js` | `helpers/getInitials.js` |
| `layouts/userLayout/components/sidebarNav/navConfig.js` | `layouts/userLayout/constants/navSections.js` |
| `layouts/adminLayout/constants.js` | `layouts/adminLayout/constants/adminNav.js` |

- Mỗi thư mục có `index.js` chỉ re-export; nơi dùng import qua thư mục (`~/pages/deadlines/helpers`), không import sâu vào từng file, không dùng `../`. Cập nhật mọi nơi import cũ.
- **Chỉ tách trong phạm vi trang (R11):** hàm / hằng số / hook chỉ một trang dùng thì ở lại `pages/<trang>/…`. **Không** đưa sang `utils/` hay `hooks/` gốc nếu chưa có ≥ 2 trang dùng. `formatFileSize` của `applicationDetail` và của `profile` là hai hàm **khác nhau** (khác kết quả), không phải dùng chung: để riêng.
- **Xong khi:** lệnh `find` trên rỗng; `npm run lint` + `npm run build` qua; mở thử các trang `deadlines`, `applications`, `applications/:id`, `profile`, `scholarships/:slug` thấy giao diện y như cũ.

### ☑ T1. Gom bản đồ màu theo mức gấp (R2)
**Vi phạm:** cùng một bản đồ `tone → class` bị chép ở 4 nơi:

| File | Bản đồ |
|---|---|
| `pages/scholarshipDetail/components/detailHeader/index.jsx` | `TONE_TEXT` (chữ) |
| `pages/scholarshipDetail/components/actionPanel/index.jsx` | `TONE_BOX` (nền + chữ) |
| `layouts/userLayout/components/notificationMenu/notificationItem/index.jsx` | `TONE_CLASS` cục bộ (nền + chữ, có `neutral`) |
| `pages/deadlines/constants.js` (sau T0: `constants/toneDot.js`) | `TONE_DOT` (chấm), dùng bởi `colorLegend`, `eventList`, `monthCalendar` |

**Cách làm:** tạo `src/utils/palette.js` → export `TONE_CLASS`:

```js
export const TONE_CLASS = {
  urgent:  { text: 'text-urgent-fg', box: 'bg-urgent-bg text-urgent-fg', dot: 'bg-urgent-fg' },
  soon:    { text: 'text-soon-fg',   box: 'bg-soon-bg text-soon-fg',     dot: 'bg-soon-fg' },
  open:    { text: 'text-open-fg',   box: 'bg-open-bg text-open-fg',     dot: 'bg-open-fg' },
  neutral: { text: 'text-heading',   box: 'bg-hover text-fg-muted',      dot: 'bg-line-strong' },
};
```

(Giữ đúng giá trị đang dùng ở từng nơi. `palette.js` đã tồn tại với hàm `color()`: **thêm vào**, không ghi đè.) Thay các chỗ dùng bằng `TONE_CLASS[tone].text|box|dot`, xóa các bản chép, bỏ `TONE_DOT` khỏi `pages/deadlines` (constants). Chuỗi class phải viết **nguyên văn** trong file (Tailwind chỉ quét chuỗi nguyên văn; `src/**/*.{js,jsx}` đã nằm trong `content`).

**Xong khi:** `grep -rnE "TONE_(TEXT|BOX|DOT)" src` ra **0**; `grep -rn "bg-urgent-bg text-urgent-fg" src` chỉ còn trong `utils/palette.js` (và `components/ui/`).

### ☑ T2. Một hàm duy nhất cho chữ hạn nộp (R2)
**Vi phạm:** nhánh `daysLeft === null / 0 / n` lặp ở 4 file, 3 cách nói cho cùng trạng thái "chưa có hạn":

| File | Dòng (tham khảo) | Chữ hiện tại |
|---|---|---|
| `components/scholarship/deadlineBadge/index.jsx` | 12 | "Chưa rõ hạn nộp" |
| `layouts/userLayout/.../notificationItem/index.jsx` | 16 | "hết hạn hôm nay" / "còn N ngày là hết hạn" |
| `pages/scholarshipDetail/components/actionPanel/index.jsx` | 59, 78 | "Chưa công bố hạn nộp" / "Hôm nay là ngày cuối cùng" |
| `pages/scholarshipDetail/components/detailHeader/index.jsx` | 23, 24 | "Chưa công bố" / "Hết hạn hôm nay" / "Theo dõi bài đăng gốc" |

**Cách làm:** thêm vào `src/utils/scholarship.js`:

```js
export function getDeadlineLabel(deadline) {
  const { daysLeft, tone } = getDeadlineInfo(deadline);
  if (daysLeft === null) return { tone, daysLeft, short: 'Chưa công bố', note: 'Theo dõi bài đăng gốc' };
  if (daysLeft === 0)    return { tone, daysLeft, short: 'Hết hạn hôm nay', note: formatDate(deadline) };
  return { tone, daysLeft, short: `còn ${daysLeft} ngày`, note: formatDate(deadline) };
}
```

Bốn nơi trên gọi hàm này, không tự rẽ nhánh `daysLeft` nữa. Nếu một nơi cần câu dài hơn (vd. `ActionPanel`) thì thêm **trường mới** vào kết quả của hàm, đừng viết lại nhánh ở component.
**Giữ giao diện:** chỗ nào buộc phải thống nhất câu chữ (3 cách nói "chưa có hạn") thì chọn một kiểu, liệt kê câu đã đổi trong commit. Xem [Cần hỏi lại](#cần-hỏi-lại-trước-khi-làm).

**Xong khi:** `grep -rnE "daysLeft === (null|0)" src` chỉ còn trong `utils/scholarship.js`. Viết test cho `getDeadlineLabel` (3 nhánh: `null`, `0`, `n`) theo R9.

### ☑ T3. Tách logic khỏi `DetailHeader` (R1, R3)
**Vi phạm:** `pages/scholarshipDetail/components/detailHeader/index.jsx` dựng mảng `tiles` ngay trong component, có ternary lồng và `.filter(Boolean).join`. Nhãn "Quốc gia / Bậc học / Tài trợ / Hạn nộp" và "Chưa rõ" viết cứng; `scope === 'domestic' ? 'domestic' : 'abroad'` là phép đổi tên nằm trong JSX.

**Cách làm:**
- `pages/scholarshipDetail/helpers/buildHeaderTiles.js`: nhận `scholarship`, trả `[{ label, value, note, tone }]` (dùng `getDeadlineLabel` từ T2).
- `pages/scholarshipDetail/constants/headerLabels.js`: các nhãn ô; `constants/scopeVariant.js`: `{ domestic: 'domestic', international: 'abroad' }`.
- `DetailHeader` chỉ `.map` mảng tile ra thẻ, không còn ternary lồng, không tự dựng dữ liệu.

**Xong khi:** `DetailHeader` không còn toán tử `? :` lồng nhau; `buildHeaderTiles` có test (đủ các trường hợp thiếu `city`, `language`, `intake`, `amount`, `deadline = null`).

### ☑ T4. Tách logic khỏi `ActionPanel` (R1, R3, R7, R8)
**Vi phạm:** `pages/scholarshipDetail/components/actionPanel/index.jsx` có ≥ 9 điều kiện trong JSX; hai nhánh đếm ngược gần giống nhau; `safeUrl(source_url)` gọi hai lần; `try/catch` rỗng ở `handleCreateApplication`; `navigate('/applications')` gõ tay; chuỗi "Xem bài đăng gốc" và "(mở trong tab mới)" lặp hai lần.

**Cách làm:**
- `components/deadlineCountdown/index.jsx`: gộp hai nhánh `daysLeft` (dùng `getDeadlineLabel` + `TONE_CLASS`).
- `helpers/getPrimaryLink.js`: chuyển hàm `getPrimaryLink` ra ngoài; tính `safeUrl` một lần.
- `hooks/useCreateApplicationAction.js`: gói kiểm tra đăng nhập, toast, gọi `useCreateApplication`, điều hướng. Component chỉ `onClick={createApplication}`; **bỏ `try/catch` rỗng** (xử lý lỗi/thành công ở `onError`/`onSuccess` của hook).
- `src/components/common/externalLink/index.jsx`: liên kết mở tab mới có `rel="noopener noreferrer"` và chữ `sr-only`; dùng cho hai chỗ lặp.
- Xóa comment "Cột này sẽ thêm khối…" (dòng ~109): chuyển ý đó vào `docs/roadmap.md`.

**Xong khi:** `ActionPanel` không còn `catch`; `grep -n "safeUrl" actionPanel/index.jsx` không còn gọi hai lần; lint + build qua.

### ☑ T5. Đường dẫn qua `ROUTES` (R6)
**Vi phạm:** đường dẫn gõ tay ở **30 chỗ trong 21 file**:

`applicationDetail/index.jsx`, `applicationDetail/components/detailHeader`, `applications/index.jsx`, `compare/index.jsx`, `dashboard/index.jsx`, `deadlines/index.jsx`, `forgotPassword/index.jsx`, `login/index.jsx`, `notFound/index.jsx`, `register/index.jsx`, `resetPassword/index.jsx`, `saved/index.jsx`, `scholarshipDetail/components/actionPanel`, `scholarshipDetail/components/detailHeader`, `scholarshipDetail/components/detailMessage`, `layouts/adminLayout/components/{adminMobileNav,adminSidebar}`, `layouts/userLayout/components/{notificationMenu,userHeader,userMenu}`, `components/common/ChatFAB.jsx`.

**Cách làm:** tạo `src/utils/routes.js` với **toàn bộ** đường dẫn đang khai báo trong `App.jsx` (`home`, `login`, `register`, `forgotPassword`, `resetPassword`, `saved`, `compare`, `news`, `dashboard`, `applications`, `applicationDetail(id)`, `deadlines`, `recommend`, `chat`, các trang admin). Giữ `scholarshipPath()` hiện có trong `utils/scholarship.js`. Thay mọi `to="/…"` và `navigate('/…')`.
**Lưu ý:** **không** tự thêm route mới. `userMenu` đang link tới `/settings` và `/settings/notifications` nhưng `App.jsx` **không có** route này (rơi vào trang 404): xem [Cần hỏi lại](#cần-hỏi-lại-trước-khi-làm), đừng bịa route.

**Xong khi:** `grep -rnE "navigate\('|to=\"/" src/pages src/layouts src/components` ra **0** (trừ khai báo `<Route path>` trong `App.jsx` và các trang legacy).

### ☑ T6. Dải đầu trang không biết padding layout (R5)
**Vi phạm:** lề âm `-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8` bù padding `p-4 sm:p-6 lg:p-8` của layout, lặp ở:
- `pages/scholarshipDetail/components/detailHeader/index.jsx`
- `pages/scholarshipDetail/components/detailSkeleton/index.jsx`

**Cách làm:** tạo `src/components/common/pageBand/index.jsx` (nhận `className`, `children`, tự giữ cặp lề âm + padding); hai file trên bọc bằng `<PageBand>`. Layout đổi padding thì chỉ sửa trong `PageBand`.
**Xong khi:** `grep -rnE -- "-m[xt]-[0-9]" src/pages` không còn dòng nào bù padding layout (dòng `deadlines/components/eventList` là khớp nhầm trong chuỗi, bỏ qua; lề âm khác có lý do riêng thì ghi chú).

### ☐ T7. Bỏ `[Npx]` trong className (R4)  ⚠️ cần duyệt trước khi sửa
**Vi phạm:** `[Npx]` ở **41 file**. Nhiều nhất: `applicationDetail/components/checklistRow` (8), `components/scholarship/scholarshipCard` (7), `scholarshipDetail/components/detailHeader` (6), `scholarshipDetail/components/actionPanel` (6), `layouts/userLayout/components/notificationMenu` (5), `scholarshipDetail/components/detailSkeleton` (4), `applications/components/applicationRow` (4). Lấy danh sách đầy đủ bằng:
`grep -rcE "\[[0-9.]+px\]" src/pages src/layouts src/components | grep -v ":0$"` (bỏ `components/ui/`, `legacy/`).

Các giá trị đang dùng (số lần), và **đề xuất** thay thế. Bảng này là gợi ý, **lead duyệt rồi mới làm**, vì làm tròn sẽ lệch giao diện vài px:

| Giá trị hiện tại | Đề xuất |
|---|---|
| `text-[13px]` (21) | token mới `text-ui` = 13px (nằm trong thang 13–14 của `CLAUDE.md`) |
| `text-[13.5px]` (7), `text-[14.5px]` (3) | gộp về `text-ui-lg` = 14px |
| `text-[12.5px]` (5), `text-[12px]` (3), `text-[11.5px]` (3) | gộp về `text-label` = 12px (hoặc 11.5px) |
| `text-[11px]` (5), `text-[10px]` (4), `text-[10.5px]` (1) | nhỏ hơn thang → hỏi lead (nâng lên `text-label` hay giữ) |
| `text-[15px]` (1), `text-[17px]` (2) | dùng sẵn `text-block-title`, `text-card-title` |
| `text-[22px]`, `text-[30px]` + `leading-[38px]` | ngoài thang → hỏi lead (dùng `text-page-title` 24px?) |
| `rounded-[6px]` (8), `[7px]`, `[9px]`, `[4px]` | dùng sẵn `rounded-control` (8px) hoặc `rounded-inner` (10px) |
| `size-[18px]` (5), `size-[22px]` (2), `size-[18px]` min-/h- | `size-4` (16) hoặc `size-5` (20) / `size-6` (24) |
| `mt-[18px]`, `px-[18px]`, `pt-[18px]`, `pt-[22px]`, `pb-[26px]`, `ml-[34px]` | bội số 4: 16/20, 20/24, 24/28, 32 (`CLAUDE.md`: khoảng cách bội số 4) |
| `h-[42px]` (2), `h-[46px]` | `h-10` (điều khiển 40px); `h-[38px]` (2) = mục sidebar 38px → token `h-nav` |
| `w-[340px]`, `w-[160px]`, `w-[360px]`, `w-[280px]`, `w-[248px]`, `max-w-[520px]`, `top-[88px]`, `top-[72px]`, `h-[460px]`… | kích thước cố định của từng khối → **đặt tên token** trong `tailwind.config.js` (ví dụ `w-menu`, `top-sticky`) |

**Cách làm sau khi được duyệt:** thêm token vào `tailwind.config.js` rồi thay trong từng file. Mỗi trang một commit. Không dùng `[Npx]` mới.
**Xong khi:** `grep -rnE "\[[0-9.]+px\]" src/pages src/layouts src/components` (trừ `components/ui/`, `legacy/`) ra **0**.

---

## Cần hỏi lại trước khi làm

1. **T2:** thống nhất câu chữ "chưa có hạn nộp" về một kiểu nào ("Chưa công bố" hay "Chưa rõ hạn nộp")? Mặc định đề xuất "Chưa công bố".
2. **T4 / ô "Tài trợ":** `coverage` đang hiện **hai lần** ở `DetailHeader` (Badge và ô "Tài trợ"). Bỏ Badge? (đổi giao diện, cần xác nhận).
3. **T5:** `userMenu` link tới `/settings` và `/settings/notifications` nhưng router không có route này. Là link chết cần bỏ, hay là trang sắp làm?
4. **T7:** duyệt bảng làm tròn px ở trên (đặc biệt các giá trị ngoài thang: 10–11px, 22px, 30px).
5. `truncate` ở các ô thông tin của `DetailHeader` cắt mất "Quốc gia · Ngôn ngữ" trên màn 360px: đổi sang `line-clamp-2` + `title`? (đổi hành vi hiển thị).

## Quan sát khác (không bắt buộc sửa ngay)

- Ternary lồng thật sự (R1) còn ở `pages/recommend/index.jsx:12` (chọn màu theo %), `components/scholarship/saveButton/index.jsx:37`; `pages/admin/scholarships` là trang legacy nên để khi chạm tới. `home/components/profileProgressCard` lặp điều kiện `isAuthenticated` hai lần trong một dòng, nên gom thành biến.
- `catch` ở `news/index.jsx` và `profile/components/accountCard/index.jsx` **hợp lệ** (trả giá trị dự phòng khi định dạng ngày lỗi), không phải `try/catch` rỗng.
- Đã đạt: không component nào gọi `axios`/`apiClient` trực tiếp.
- `getDeadlineInfo(...)` còn được gọi lại ở nhiều component cho cùng một học bổng (R8): giải quyết dần khi làm T2–T4 (tính một lần ở `pages/scholarshipDetail/index.jsx` rồi truyền xuống nếu cần).

## Khi xong cả danh sách

- Tick hết ô, cập nhật **Nhật ký quy tắc** trong `docs/frontendRules/frontendRules.md` (mỗi việc một dòng: lỗi · quy tắc · đã sửa ở đâu).
- Mở PR vào `dev`, đính kèm kết quả các lệnh "Xong khi", `npm run lint`, `npm run build`.
- Báo lại những việc **chưa làm được** và lý do, đừng ghi "xong" nếu chưa chạy lệnh kiểm tra.
