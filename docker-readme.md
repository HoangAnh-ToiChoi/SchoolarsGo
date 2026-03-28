# ============================================================

# SCHOLARSGO — Docker Startup Script

# Chạy Supabase stack + database migration

# ============================================================

# Hướng dẫn:

# 1. Mở terminal trong thư mục gốc d:\WorkSpace\Schoolars_Ship

# 2. Chạy: docker-compose up -d

# 3. Đợi container healthy (~10-20s)

# 4. Mở trình duyệt xem DB

# ============================================================

# ─────────────────────────────────────────

# Cách xem database:

#

# CÁCH 1 — pgAdmin4 (giao diện web SQL):

# Mở trình duyệt → http://localhost:5050

# Email: admin@scholarsgo.com

# Password: scholarsgo_admin

#

# Khi thêm server mới:

# - Host: scholarsgo_postgres

# - Port: 5432

# - Database: postgres

# - User: postgres

# - Password: scholarsgo_password

#

# CÁCH 2 — Supabase Studio (giao diện Supabase):

# Mở trình duyệt → http://localhost:3000

# (Chỉ xem tables, không có đầy đủ tính năng local)

#

# CÁCH 3 — Terminal (psql trong container):

# docker exec -it scholarsgo_postgres psql -U postgres

# \dt → xem danh sách tables

# \d users → xem cấu trúc bảng users

# SELECT \* FROM users; → xem dữ liệu

#

# CÁCH 4 — DBeaver / DataGrip (IDE SQL):

# Host: localhost

# Port: 5432

# Database: postgres

# User: postgres

# Password: scholarsgo_password

# ─────────────────────────────────────────

# ─────────────────────────────────────────

# Ports mặc định:

# 5432 → PostgreSQL

# 3000 → Supabase Studio (local)

# 5050 → pgAdmin4

# 8000 → Kong API Gateway (Supabase)

# 8080 → PostgreSQL Meta

# 9999 → GoTrue Auth

# 5000 → Storage API

# ─────────────────────────────────────────
