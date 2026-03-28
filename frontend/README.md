# ScholarsGo — Frontend Application

React.js SPA cho ScholarsGo — nền tảng tìm kiếm học bổng và quản lý hồ sơ du học cho sinh viên Việt Nam.

## Quick Start

```bash
# 1. Copy và cấu hình .env
cp .env.example .env.local

# 2. Cài đặt dependencies
npm install

# 3. Chạy dev server
npm run dev

# Frontend sẽ chạy tại http://localhost:5173
```

## Yêu cầu môi trường

- Node.js >= 18.0.0
- npm >= 9.0.0

## Cấu hình .env

Tạo file `.env.local` từ `.env.example` và điền các giá trị sau:

| Variable | Mô tả |
|----------|-------|
| `VITE_API_BASE_URL` | Backend API URL (mặc định: http://localhost:5000/api) |
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

## Cấu trúc thư mục

```
src/
├── components/         # UI components tái sử dụng
│   ├── Layout.jsx      # Layout chính (Header + Footer + Outlet)
│   ├── Header.jsx      # Navigation header
│   ├── Footer.jsx      # Footer
│   ├── ProtectedRoute.jsx
│   ├── ScholarshipCard.jsx
│   ├── LoadingSpinner.jsx
│   └── LoadingButton.jsx
├── pages/             # Page-level components
│   ├── HomePage.jsx
│   ├── ScholarshipsPage.jsx
│   ├── ScholarshipDetailPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ProfilePage.jsx
│   ├── ApplicationsPage.jsx
│   ├── SavedPage.jsx
│   └── NotFoundPage.jsx
├── hooks/             # Custom React hooks (React Query + mutations)
│   ├── useAuth.js      # login, register, logout
│   ├── useScholarship.js
│   ├── useProfile.js
│   └── useApplication.js
├── services/          # API call functions (axios)
│   ├── api.js          # Axios instance + interceptors
│   └── index.js        # Export all services
├── stores/            # Zustand global state
│   ├── authStore.js    # User session, token
│   └── uiStore.js      # UI preferences
├── utils/
│   ├── helpers.js      # formatCurrency, formatDate, getStatusLabel...
│   └── constants.js    # DOCUMENT_TYPES, DEGREES, LANGUAGES...
├── App.jsx             # Routes setup
└── main.jsx           # React root + providers
```

## Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | Chạy ESLint |
| `npm run lint:fix` | Auto-fix ESLint errors |

## Routing

| Route | Component | Auth |
|-------|-----------|------|
| `/` | HomePage | — |
| `/scholarships` | ScholarshipsPage | — |
| `/scholarships/:id` | ScholarshipDetailPage | — |
| `/login` | LoginPage | — |
| `/register` | RegisterPage | — |
| `/saved` | SavedPage | — |
| `/profile` | ProfilePage | Required |
| `/applications` | ApplicationsPage | Required |
| `/*` | NotFoundPage | — |

## Tech Stack

- **React 18** — UI library
- **React Router 6** — Routing
- **TanStack Query (React Query) v5** — Server state, caching
- **Zustand** — Global client state (auth, UI)
- **TailwindCSS 3** — Styling (mobile-first)
- **Axios** — HTTP client
- **React Hot Toast** — Notifications
- **Lucide React** — Icons
- **date-fns** — Date formatting
- **Vite** — Build tool

## Lỗi thường gặp

### 1. `VITE_API_BASE_URL is not defined`
Chưa cấu hình `.env.local`. Copy `.env.example` → `.env.local`.

### 2. API calls fail với `401 Unauthorized`
Token đã hết hạn hoặc không có trong store. Đăng nhập lại để refresh token.

### 3. `Cannot find module '@/components/...'`
Vite alias `@` chỉ được cấu hình trong `vite.config.js`. Import phải dùng `@/` thay vì relative paths khi có thể.

### 4. Tailwind classes không hoạt động
Chạy `npm run build` để regenerate Tailwind output. Kiểm tra `tailwind.config.js` có `content` đúng.
