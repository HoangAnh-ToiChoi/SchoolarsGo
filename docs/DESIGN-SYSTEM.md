# ScholarsGo — Design System v1.0

> Tài liệu này định nghĩa hệ thống thiết kế thống nhất cho toàn bộ frontend ScholarsGo.  
> Mọi component và page **bắt buộc** tuân theo các quy ước bên dưới.

---

## 1. Bảng Màu (Color Palette)

| Token | Hex | Sử dụng |
|-------|-----|---------|
| **Primary-600** | `#2563eb` | CTA buttons, links, active states |
| **Primary-700** | `#1d4ed8` | Hover states cho primary |
| **Primary-50** | `#eff6ff` | Background nhẹ cho primary |
| **Secondary-600** | `#7c3aed` | Accent / feature cards |
| **Success-600** | `#16a34a` | Trạng thái thành công, giá tiền |
| **Warning-600** | `#d97706` | Cảnh báo, badge "Nổi bật" |
| **Danger-600** | `#dc2626` | Lỗi, xóa, từ chối |
| **Gray-900** | `#111827` | Heading text |
| **Gray-600** | `#4b5563` | Body text |
| **Gray-400** | `#9ca3af` | Placeholder, icon mờ |
| **Gray-50** | `#f9fafb` | Page background |

### Quy tắc sử dụng
- **KHÔNG** dùng Tailwind color trực tiếp (VD: `text-red-500`). Dùng semantic token: `text-danger-500`.
- Mọi status color lấy từ `getStatusColor()` trong `helpers.js`.

---

## 2. Typography

**Font:** Inter (Google Fonts) — weights: 400, 500, 600, 700, 800

| Token | Size | Weight | Dùng cho |
|-------|------|--------|----------|
| `text-display` | 3.5rem | 800 | Hero heading |
| `text-heading-1` | 2rem | 700 | Page title |
| `text-heading-2` | 1.5rem | 700 | Section title |
| `text-heading-3` | 1.25rem | 600 | Card/subsection title |
| `text-body-lg` | 1.125rem | - | Section subtitle, intro text |
| `text-body` | 1rem | - | Paragraph, default |
| `text-body-sm` | 0.875rem | - | Labels, secondary info |
| `text-caption` | 0.75rem | - | Badge, tag |

---

## 3. Spacing & Layout

### Container
```
.container-page   → max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  (cho list pages)
.container-narrow → max-w-4xl mx-auto px-4 sm:px-6 lg:px-8  (cho detail/form pages)
```

### Section spacing
- `py-section` (5rem) — khoảng cách giữa các section lớn
- `py-8` — padding page content
- `gap-6` — khoảng cách giữa card trong grid
- `space-y-5` — khoảng cách giữa form fields

---

## 4. Border Radius

| Token | Value | Dùng cho |
|-------|-------|----------|
| `rounded-card` | 1rem | Card, panel |
| `rounded-button` | 0.75rem | Button |
| `rounded-input` | 0.75rem | Input, select |
| `rounded-badge` | 0.5rem | Badge |
| `rounded-tag` | 9999px | Tag pill |

---

## 5. Shadow

| Token | Dùng cho |
|-------|----------|
| `shadow-card` | Card mặc định |
| `shadow-card-hover` | Card khi hover |
| `shadow-button` | Button |

---

## 6. Component Classes (CSS Layer)

### Buttons
```
.btn-primary    — CTA chính (xanh dương)
.btn-secondary  — Hành động phụ (viền trắng)
.btn-ghost      — Text button, không viền
.btn-danger     — Hành động nguy hiểm (đỏ)
.btn-sm / .btn-lg — Kích thước
```

### Card
```
.card           — Container trắng, viền, shadow
.card-hover     — Card có hiệu ứng hover
.card-body      — Padding nội dung (p-6 sm:p-8)
```

### Form
```
.input          — Input chuẩn
.input-with-icon — Input có icon bên trái
.input-label    — Label cho input
```

### Badge & Tag
```
.badge          — Status badge (nhỏ, vuông hơn)
.tag            — Info tag pill (tròn, nhẹ)
```

### Empty State
```
.empty-state    — Container trống
.empty-state-icon — Icon 16x16 mờ
```

### Page Header
```
.page-header    — Title + description block
```

---

## 7. Reusable UI Components

Tất cả nằm trong `src/components/ui/`:

| Component | Import | Props |
|-----------|--------|-------|
| `Button` | `{ Button }` | `variant`, `size`, `isLoading` |
| `Input` | `{ Input }` | `label`, `icon`, `error` |
| `Select` | `{ Select }` | `label`, `options`, `placeholder` |
| `Badge` | `{ Badge }` | `color` (gray/blue/green/yellow/red/purple) |
| `EmptyState` | `{ EmptyState }` | `icon`, `title`, `description`, `actionLabel`, `actionTo` |
| `PageHeader` | `{ PageHeader }` | `title`, `description`, `actions` |

**Import chuẩn:**
```jsx
import { Button, Input, Badge } from '../components/ui';
```

---

## 8. Animation

| Class | Effect |
|-------|--------|
| `animate-fade-in` | Fade in 0.3s |
| `animate-slide-up` | Slide up + fade 0.3s |
| `animate-slide-down` | Slide down + fade 0.3s |

---

## 9. Icon Library

Sử dụng **lucide-react**. Kích thước chuẩn:
- Inline icon: `w-4 h-4`
- Button icon: `w-5 h-5`
- Feature icon: `w-8 h-8`
- Empty state: `w-16 h-16`
