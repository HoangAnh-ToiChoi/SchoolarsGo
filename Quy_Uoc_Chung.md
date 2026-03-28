# ============================================================
# SCHOLARSGO — QUY ƯỚC CHUNG & TIÊU CHUẨN KỸ THUẬT
# Dự án: ScholarsGo (Fullstack Web Project)
# Cập nhật: 26/3/2026
# ============================================================

# ─────────────────────────────────────────────
# 1. BỐI CẢNH DỰ ÁN (PROJECT CONTEXT)
# ─────────────────────────────────────────────
ScholarsGo là nền tảng tìm kiếm học bổng và quản lý hồ sơ du học dành cho học sinh/sinh viên Việt Nam.

## Core Features P0 (Hoàn thành trước 6/5/2026):
1. Scholarship Search: Filter theo quốc gia, ngành, GPA, ngôn ngữ, deadline.
2. Profile Manager: Upload & quản lý CV, SOP, bảng điểm, thư giới thiệu.
3. Application Tracker: Checklist, deadline tracker, trạng thái đơn ứng tuyển.
- **Database target:** Seed tối thiểu 500+ học bổng trước tuần 6.

## Optional Feature P1 (Chỉ làm khi P0 hoàn chỉnh):
4. AI Recommender: Gợi ý học bổng theo profile (OpenAI/Gemini API). 

# ─────────────────────────────────────────────
# 2. TIÊU CHUẨN LẬP TRÌNH (TECHNICAL & CODING STANDARDS)
# ─────────────────────────────────────────────

## 2.1 General Rules
- Tuân thủ nghiêm ngặt nguyên tắc DRY (Don't Repeat Yourself) và Single Responsibility.
- Naming conventions BẮT BUỘC bằng tiếng Anh:
  - `camelCase`: variables, functions, hooks
  - `PascalCase`: React components, classes
  - `kebab-case`: file names, folder names
  - `UPPER_SNAKE`: environment variable names
- Viết comment tiếng Việt cho logic phức tạp hoặc business rule quan trọng.
- KHÔNG để dead code hoặc commented-out blocks trong codebase.

## 2.2 Tech Stack Lock (BẤT KHẢ XÂM PHẠM)
KHÔNG thêm framework, library, hoặc ngôn ngữ mới nếu chưa được cả team đồng ý.
- **Frontend:** React.js + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Supabase
- **AI (Optional):** OpenAI API hoặc Gemini API
- **Deployment:** Vercel (FE) + Railway (BE)

## 2.3 Tiêu chuẩn Frontend (/frontend)
- **Cấu trúc thư mục:** `/components`, `/pages`, `/hooks`, `/services` (API calls), `/stores` (Zustand), `/utils`.
- **Component Rules:** Tách UI khỏi business logic. Max ~150 dòng/file.
- **State Management:** - Dùng React Query (TanStack Query) cho server state.
  - Dùng Zustand cho global client state.
  - Tránh prop drilling > 2 cấp.
- **UI/UX:** Mobile-first responsive (Tailwind). Mọi async action PHẢI có loading, error, empty state và toast notification.
- **Error Handling:** Wrap API calls trong try/catch. Lỗi 4xx hiện thông báo cụ thể, 5xx hiện lỗi máy chủ chung.

## 2.4 Tiêu chuẩn Backend (/backend)
- **Cấu trúc thư mục:** `/controllers`, `/routes`, `/middlewares`, `/services`, `/utils`.
- **API Design (RESTful):** - GET (danh sách/chi tiết), POST (tạo mới), PUT (cập nhật toàn bộ), PATCH (cập nhật 1 phần), DELETE (xóa).
- **JSON Format trả về:** - Thành công: `{ success: true, data: <payload> }`
  - Lỗi: `{ success: false, message: "...", code: <HTTP status> }`
- **Validation:** Validate TẤT CẢ request body bằng `express-validator` hoặc `Zod` trước khi query DB.

## 2.5 Tiêu chuẩn Database
- Dùng Supabase SDK hoặc parameterized queries.
- KHÔNG dùng string interpolation trong SQL (chống SQL Injection).
- KHÔNG chạy DROP, TRUNCATE, DELETE không có WHERE.
- Thêm indexes cho cột dùng trong WHERE/JOIN thường xuyên.

# ─────────────────────────────────────────────
# 3. BẢO MẬT & HIỆU NĂNG (SECURITY & PERFORMANCE)
# ─────────────────────────────────────────────

## 3.1 Security (Non-Negotiable)
- TẤT CẢ secrets phải để trong file `.env` (file này phải nằm trong `.gitignore`). KHÔNG hardcode API keys.
- JWT tokens lưu trong `httpOnly cookies` — KHÔNG lưu trong localStorage.
- Validate và sanitize TẤT CẢ user input.
- Rate limit các endpoint nhạy cảm (`/login`, `/register`).
- KHÔNG trả stack trace chi tiết cho client trên production.

## 3.2 Performance
- Target Lighthouse score: Performance > 90, các mục khác > 80. Page load < 2s.
- Paginate tất cả list endpoints (default: 20 items/page).
- Lazy loading cho images.
- Tránh N+1 query (dùng JOIN hoặc batch queries).
- Cache data ít thay đổi với React Query (staleTime: 5 phút).

# ─────────────────────────────────────────────
# 4. QUẢN LÝ MÔI TRƯỜNG & GIT CONVENTIONS
# ─────────────────────────────────────────────

## 4.1 Environment
- **Development:** localhost (dùng `.env`).
- **Staging:** Vercel/Railway preview branch.
- **Production:** deploy từ `main` sau khi team review.
- Luôn duy trì file `.env.example` với các biến cần thiết (giá trị để trống).

## 4.2 Git Branching & Commits
- **Branches:** `main` (cấm commit thẳng), `develop` (tích hợp), `feature/<tên>`, `fix/<tên>`, `docs/<tên>`.
- **Commit prefixes:** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`.
- **Quy trình:** Tạo PR từ nhánh feature/fix vào nhánh develop, bắt buộc phải có ít nhất 1 review trước khi merge. Chạy `git pull origin develop` trước khi tạo nhánh mới.

# ─────────────────────────────────────────────
# 5. TÀI LIỆU DỰ ÁN (DOCS & README)
# ─────────────────────────────────────────────
- Team duy trì cấu trúc tài liệu thống nhất trong thư mục `docs/` (chứa Database Schema, API Contracts, Features luồng nghiệp vụ).
- Mỗi thư mục `/frontend` và `/backend` phải có file `README.md` hướng dẫn Quick Start (cách chạy dự án, cài đặt môi trường, scripts...).