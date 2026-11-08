# ScholarsGo

Nền tảng tìm học bổng (du học và trong nước) và quản lý hồ sơ ứng tuyển cho sinh viên Việt Nam.

- **Quy ước code, cấu trúc thư mục, thiết kế:** xem [`CLAUDE.md`](CLAUDE.md)
- **Bản demo giao diện:** https://hoanganh-toichoi.github.io/SchoolarsGo/
- **API và cơ sở dữ liệu:** [`docs/api.md`](docs/api.md), [`docs/database.md`](docs/database.md)
- **Nhật ký thay đổi:** [`CHANGELOG.md`](CHANGELOG.md)

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, Redux Toolkit, TanStack Query |
| Backend | Node.js, Express |
| Cơ sở dữ liệu | PostgreSQL (Supabase) |
| AI | Gemini (dự phòng Groq) |

## Chạy trên máy

Yêu cầu Node.js 18 trở lên.

```bash
# Backend
cd backend
cp .env.example .env      # điền SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET...
npm install
npm run dev

# Frontend (cửa sổ terminal khác)
cd frontend
cp .env.example .env.local   # VITE_API_BASE_URL trỏ tới backend vừa chạy
npm install
npm run dev
```

## Cấu trúc repo

```
backend/     API Express (routes → controllers → services → repositories)
frontend/    Ứng dụng React (xem CLAUDE.md)
docs/        api.md, database.md; docs/archive/ là tài liệu cũ giữ để tham khảo
database.sql Lược đồ cơ sở dữ liệu
tests/       Kiểm thử end-to-end (Playwright)
```
