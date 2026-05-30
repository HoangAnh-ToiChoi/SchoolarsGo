# Changelog — Từ commit `20bf4ad` đến hiện tại

> Branch: `feat/ai-recommend-ui-improvements`  
> Tổng thay đổi: **63 files**, +3532 / −3031 dòng  
> Ngày: 2026-05-20

---

## 1. Design System — Toàn bộ chuyển sang Obsidian + Cyan Glow

### `tailwind.config.js` — Viết lại hoàn toàn

Bộ màu cũ (trắng/slate/purple gradient) bị thay thế bởi **GitHub Dark–inspired dark palette**:

| Token | Giá trị | Dùng cho |
|---|---|---|
| `ink-950` | `#0D1117` | Background trang chính |
| `ink-900` | `#161B22` | Card, sidebar |
| `ink-800` | `#21262D` | Border, input bg |
| `ink-700` | `#30363D` | Border hover |
| `ink-500` | `#6E7681` | Placeholder, muted |
| `ink-300` | `#B1BAC4` | Secondary text |
| `ink-100` | `#E6EDF3` | Primary text |
| `primary-400` | `#22D3EE` | Accent chính (cyan) |
| `primary-300` | `#67E8F9` | Accent hover |

**Box shadows mới:**
```
shadow-glow      → 0 0 20px rgba(34,211,238,0.25)
shadow-glow-lg   → 0 0 40px rgba(34,211,238,0.35)
shadow-glow-sm   → 0 0 10px rgba(34,211,238,0.15)
shadow-card-hover → 0 8px 24px rgba(0,0,0,0.5)
```

**Keyframe animations mới:**
- `pulseGlow` — box-shadow cyan nhịp 3s
- `shimmer` — background-position sweep
- `float` — translateY -8px / 6s
- `fade-in-up`, `fade-in-up-1/2/3` — stagger entrance

---

### `src/index.css` — Viết lại hoàn toàn

**Trước:** body `color: #111827`, `background: #f1f5f9` (light)  
**Sau:** body `color: #E6EDF3`, `background: #0D1117` (dark)

Các class component đã đổi sang hex trực tiếp (không dùng `@apply` với custom token vì Tailwind v3 không hỗ trợ trong `@layer components`):

| Class | Thay đổi chính |
|---|---|
| `.card` | `bg: #161B22`, `border: #21262D` |
| `.card-hover` | hover: `border-primary-400/40`, lift `translateY(-4px)` |
| `.card-glow` | hover: `box-shadow: 0 0 30px rgba(34,211,238,0.2)` |
| `.btn-primary` | `bg: #22D3EE`, `color: #0D1117`, hover glow |
| `.btn-secondary` | `bg: #21262D`, `border: #30363D` |
| `.btn-ghost` | `color: #8B949E`, hover `bg: #21262D` |
| `.btn-danger` | `bg: rgba(239,68,68,0.1)`, `color: #f87171` |
| `.input` | `bg: #0D1117`, `border: #30363D`, focus cyan ring |
| `.badge-*` | opacity-10 dark backgrounds + border |
| `.tag` | `bg: #21262D`, `color: #8B949E` |
| `.modal-overlay` | `backdrop-filter: blur(4px)` |
| `.bg-grid` | Subtle cyan grid pattern 64×64px |

**Thêm mới:**
- `.text-gradient-cyan` — gradient text 135deg cyan
- `.glow-text` — `text-shadow: 0 0 30px rgba(34,211,238,0.5)`
- Custom scrollbar dark (6px, `#30363D` thumb)
- `::selection` — cyan highlight
- React Calendar dark overrides (toàn bộ)

---

## 2. Hooks mới

### `src/hooks/useInView.js` *(mới)*
Intersection Observer hook để trigger animation khi element vào viewport:
```js
const [ref, inView] = useInView({ threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
// Disconnect sau lần đầu → chỉ animate 1 lần
```

### `src/hooks/useCounter.js` *(mới)*
Animated counter dùng `requestAnimationFrame` với easing ease-out cubic:
```js
const count = useCounter(500, 1600); // animate từ 0 → 500 trong 1.6s
```

---

## 3. Components mới & cập nhật

### `src/components/ChatFAB.jsx` *(mới)*
Floating Action Button xuất hiện ở **góc dưới phải** trên mọi trang (ẩn tự động trên `/chat`):
- Ping ring animation cyan mỗi 2.4s
- Glow shadow tăng khi hover (`0 0 32px rgba(cyan,0.5)`)
- Badge "AI" pop-in sau 1s
- Tooltip slide-in từ phải khi hover
- Spring animations: scale 0→1 khi mount, `whileHover: 1.1`, `whileTap: 0.93`

### `src/components/Layout.jsx`
- Thêm `<ChatFAB />` vào layout

### `src/components/Header.jsx`
- Background: `bg-ink-950/90 backdrop-blur-md border-b border-ink-800`
- Logo: `bg-primary-400` (cyan solid) thay vì purple gradient
- Active link: `text-primary-400 bg-primary-400/10`
- Hover link: `hover:text-ink-100 hover:bg-ink-800`
- Mobile menu: dark styled

### `src/components/Footer.jsx`
- Bỏ conditional background theo route
- Thống nhất: `border-t border-ink-800 bg-ink-950`
- Logo: `bg-primary-400` + `text-ink-950`
- Links: `text-ink-500` → hover `text-ink-100`

### `src/components/ScholarshipCard.jsx`
- Wrap `motion.div` với `useInView` + stagger theo `index % 6`
- Card: `bg-ink-900 border-ink-800 hover:border-primary-400/40 hover:-translate-y-1`
- Image: `group-hover:scale-105`
- Title: `group-hover:text-primary-300`
- Save button: `text-danger-400 bg-danger-400/10`

### `src/components/ComparisonBar.jsx`
- `bg-ink-950/95 backdrop-blur-md border-t border-ink-800`
- Chips: `bg-ink-900 border-ink-800`
- Compare button: `btn-primary btn-sm`

### `src/components/LoadingSpinner.jsx`
- Spinner: `border-ink-800 border-t-primary-400` (cyan)

### `src/components/LatestNewsSection.jsx` — Viết lại
- `bg-ink-950` section background
- Featured card: `bg-ink-900 border-ink-800 hover:border-primary-400/40 hover:-translate-y-1`
- Side list: `bg-ink-900 divide-ink-800 hover:bg-ink-800`
- Title hover: `group-hover:text-primary-300`
- TAG_STYLE → dark opacity variants

### `src/components/landing/Hero.jsx` — Viết lại
- Framer Motion `containerVariants` + `itemVariants` stagger toàn bộ
- `bg-grid` pattern + ambient orbs (blurred divs)
- Heading: `text-gradient-cyan glow-text` cho accent
- `StatItem`: `useInView` + `useCounter` → animated numbers (500+, 50+, 10000+)
- Social proof: avatar circles + star rating
- CTAs: `btn-primary btn-lg` + `btn-secondary btn-lg`

### `src/components/landing/Features.jsx` — Viết lại
- 6 features (tăng từ 3)
- `useInView` + `cardVariants` với delay theo index
- Hover: border cyan + lift + radial gradient glow overlay
- Icon boxes color-coded

### `src/components/landing/ScholarshipPreview.jsx`
- Dark card tokens

### `src/components/ui/Badge.jsx`
- `colorMap` → dark opacity-10 backgrounds với border

### `src/components/ui/Input.jsx`
- Icon: `text-ink-500`, error: `text-danger-400`

### `src/components/ui/FileUpload.jsx`
- Drag area: `border-ink-700` dashed, hover `border-primary-400/60`
- Active drag: `border-primary-400 bg-primary-400/10`

### `src/components/ui/PageHeader.jsx`
- Nhận prop `icon`, render eyebrow badge
- `bg-ink-950 border-b border-ink-800`

### `src/components/ui/AnimatedPage.jsx` *(mới)*
- Wrapper Framer Motion cho page transition

### ~~`src/components/landing/AuroraBackground.jsx`~~ *(đã xóa)*

---

## 4. Pages — Toàn bộ migrate sang dark theme

### `src/pages/LoginPage.jsx` / `RegisterPage.jsx` / `ForgotPasswordPage.jsx` / `ResetPasswordPage.jsx`
- Container: `bg-ink-950`
- Card: `bg-ink-900 border-ink-800`
- Submit button: `bg-primary-400 text-ink-950`
- `motion.div` page fade-in

### `src/pages/ForgotPasswordPage.jsx` *(mới)*
### `src/pages/ResetPasswordPage.jsx` *(mới)*
- Flow quên/đặt lại mật khẩu, full dark theme

### `src/pages/HomePage.jsx`
- `bg-ink-950`, `motion.div` wrapper

### `src/pages/ScholarshipsPage.jsx`
- Search bar: `bg-ink-900 border-ink-800`
- Filters: dark select
- Pagination: active page `bg-primary-400 text-ink-950`

### `src/pages/ScholarshipDetailPage.jsx` — Viết lại hoàn toàn
- Hero: `bg-ink-900 border-ink-800`, fact pills `bg-ink-800 text-ink-300`
- Sticky bar: `bg-ink-950/95 backdrop-blur-md` slide-up với Framer Motion
- CTA primary: `bg-primary-400 text-ink-950 hover:shadow-glow`
- Save button: `border-danger-400/50 text-danger-400` khi đã lưu
- Deadline panel: `bg-ink-950`, amount `text-success-400`
- DetailSection: `bg-ink-900 border-ink-800`, `whileInView` scroll animation
- InfoRow: `bg-ink-950 border-ink-800`, cyan icon boxes `bg-primary-400/10`
- Action plan: `bg-primary-400/5 border-primary-400/20`
- `motion.div` fade-in toàn trang

### `src/pages/DashboardPage.jsx`
- Stat values: `text-primary-400`
- Cards: dark tokens

### `src/pages/ApplicationsPage.jsx` / `ApplicationDetailPage.jsx`
- `bg-ink-950`, dark cards
- Status badges: dark opacity variants

### `src/pages/SavedPage.jsx`
- `bg-ink-950`

### `src/pages/ProfilePage.jsx`
- Full dark, avatar upload area dark

### `src/pages/ChatPage.jsx` — Viết lại + nâng cấp animation

**Layout mới — 2 cột:**
- **Sidebar (desktop, 288px):** Bot info card, 5 capabilities với icon, disclaimer note
- **Main area:** header + messages + input

**MessageBubble — animation nâng cấp:**
- User message: spring slide từ phải `x: 28 → 0` (`stiffness: 360, damping: 26`)
- Bot message: spring slide từ trái `x: -28 → 0`
- Avatar: `scale: 0 → 1` spring riêng biệt (`stiffness: 520`), delay 60ms
- `whileHover: scale(1.015)` trên bubble
- Copy button fade-up sau 280ms

**TypingIndicator — nâng cấp:**
- Cùng directional spring animation như bot message
- 3 dots: `motion.span` animate `y: 0 → -7 → 0` + màu `ink-500 → cyan → ink-500`, stagger 170ms

**WelcomeScreen *(mới)*:**
- Hiển thị khi chưa chat: bot avatar lớn `animate-pulse-glow`, online dot
- 4 quick-reply cards dạng grid 2×2 với icon riêng
- `cardVariants` stagger, `whileHover/whileTap` spring
- Heading/subtitle/footer fade-in tuần tự

**Input area:**
- Border focus: `border-primary-400/50 shadow-glow-sm`
- Character counter hiện sau 500 ký tự, đỏ khi > 900
- Send button chỉ sáng khi có nội dung

**Header:**
- Hiển thị "Đang soạn phản hồi..." với spinner khi loading

### `src/pages/RecommendPage.jsx`
- Hero: `bg-ink-950 border-b border-ink-800`
- Brain icon: `bg-primary-400/15 text-primary-300`
- Label: `text-primary-400`

### `src/pages/NewsPage.jsx`
- `PageHeader` component
- Filter tabs: active `bg-primary-400 text-ink-950`
- Cards: `bg-ink-900 border-ink-800`

### `src/pages/ComparisonPage.jsx`
- Full dark tokens

### `src/pages/DeadlineTrackerPage.jsx`
- Calendar: React Calendar dark overrides (full CSS)
- Sidebar cards: `bg-ink-900 border-ink-800`

### `src/pages/NotFoundPage.jsx`
- `bg-ink-950 text-ink-100`

### `src/pages/admin/AdminUsersPage.jsx`
- Table: `bg-ink-900 border-ink-800`
- Role badge: dark opacity variant

---

## 5. Framer Motion — Patterns sử dụng

```js
// Page transition
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />

// Scroll-triggered card (useInView)
<motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} />

// Spring directional (chat messages)
initial={{ opacity: 0, x: isUser ? 28 : -28, scale: 0.86 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
transition={{ type: 'spring', stiffness: 360, damping: 26 }}

// Avatar pop
initial={{ scale: 0 }} animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 520, damping: 26, delay: 0.06 }}

// Stagger children
const containerVariants = { visible: { transition: { staggerChildren: 0.08 } } }
```

---

## 6. Backend (các thay đổi liên quan)

| File | Thay đổi |
|---|---|
| `src/controllers/auth.controller.js` | Bổ sung forgot/reset password endpoints |
| `src/controllers/chat.controller.js` | Cải thiện error handling |
| `src/services/auth.service.js` | Reset token logic |
| `src/utils/mailer.js` *(mới)* | Nodemailer setup gửi email reset |
| `migrations/002_add_password_reset.sql` *(mới)* | Thêm bảng/cột cho password reset |
| `src/middlewares/rateLimiter.js` | Điều chỉnh limits |
| `src/services/chat.service.js` | Groq + Zhipu fallback chain |

---

## 7. Files mới tạo (untracked)

| File | Mô tả |
|---|---|
| `src/components/ChatFAB.jsx` | Floating chatbot button |
| `src/components/ui/AnimatedPage.jsx` | Page transition wrapper |
| `src/hooks/useInView.js` | Intersection Observer hook |
| `src/hooks/useCounter.js` | RAF-based animated counter |
| `src/pages/ForgotPasswordPage.jsx` | Quên mật khẩu |
| `src/pages/ResetPasswordPage.jsx` | Đặt lại mật khẩu |
| `backend/src/utils/mailer.js` | Email service |
| `backend/scripts/migrations/002_add_password_reset.sql` | DB migration |
| `DEVLOG.md` | Dev log tổng hợp |
| `tests/` | Playwright test suite |
| `playwright.config.js` | Playwright config |

---

## 8. Tóm tắt impact

| Hạng mục | Trước | Sau |
|---|---|---|
| Theme | Light (slate/white) | Dark (Obsidian + Cyan Glow) |
| Animation | Không có | Framer Motion toàn bộ |
| Chat UI | 1 cột đơn giản | 2 cột, sidebar, animated bubbles |
| Floating CTA | Không có | ChatFAB với ping + glow |
| Landing Hero | Static | Animated counter + stagger |
| Scroll animations | Không có | useInView trên mọi section |
| CSS design tokens | `--color-primary: #2563eb` (blue) | `--color-ink-*` + `--color-primary-400: #22D3EE` |
