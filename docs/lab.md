# LAB: dựng ScholarsGo trên máy bằng Supabase local

Môi trường thử cô lập: DB trống dựng từ repo, không đụng DB hay `.env` thật. Dùng để thử migration, chạy test tích hợp, tái hiện lỗi. CI job **Integration** chạy đúng các bước này.

## Cần có

- Docker Desktop đang chạy.
- Supabase CLI: `npx supabase` (repo dùng bản 3.4.0, cấu hình ở `supabase/config.jsonc`).

## 1. Khởi động

Ở gốc repo:

```bash
npx supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,mailpit,postgres-meta
npx supabase status -o env      # lấy API_URL, ANON_KEY, SERVICE_ROLE_KEY
```

Bỏ `realtime` khỏi `-x` nếu cần thử chuông thông báo realtime (migration 010).

## 2. File env riêng cho LAB

Tạo file **ngoài repo** (ví dụ `~/scholarsgo-lab.env`), không dùng `backend/.env`:

```bash
NODE_ENV=test
PORT=3011
PG_HOST=127.0.0.1
PG_PORT=54322
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=postgres
PG_SSL=false
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên ≥ 32 ký tự>
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác, ≥ 32 ký tự>
CORS_ORIGINS=http://localhost:5173
```

Để **trống** khóa AI và SMTP: link đặt lại mật khẩu sẽ in ra log thay vì gửi mail thật.

## 3. Dựng DB và chạy test

Trong `backend/`:

```bash
export DOTENV_CONFIG_PATH=~/scholarsgo-lab.env   # chặn app nạp backend/.env thật
set -a; . "$DOTENV_CONFIG_PATH"; set +a

npm run migrate -- --env="$DOTENV_CONFIG_PATH"   # 000 → mới nhất; chạy lại phải báo "0 migration chưa áp"
npm run test:integration                          # app thật qua HTTP: auth, IDOR, admin, upload, đầu vào, nghiệp vụ, RLS
```

`test:integration` tự bỏ qua khi thiếu biến Supabase, khi DB không phải localhost, hoặc khi có `backend/.env` mà chưa đặt `DOTENV_CONFIG_PATH`.

Test gắn `todo: 'R## …'` là **lỗi đã biết** (danh sách ở `docs/pendingWork.md`): vẫn chạy, in kết quả, nhưng không làm lệnh thất bại. Sửa xong lỗi nào thì gỡ `todo` của test đó để nó thành test bắt buộc.

## 4. Chạy app trên LAB

```bash
cd backend && npm run dev              # cùng shell đã export DOTENV_CONFIG_PATH ở bước 3
cd frontend && npm run dev             # Vite chuyển /api tới http://localhost:3001 — đổi PORT=3001 trong file env nếu muốn dùng proxy mặc định
node scripts/seedAdmin.js              # tạo admin (trong backend/). Script này tự nạp backend/.env nhưng không ghi đè biến đã export, nên BẮT BUỘC chạy trong shell đã export ở bước 3
```

## 5. Dọn

```bash
npx supabase db reset --local    # về DB trống (chạy lại bước 3)
npx supabase stop --no-backup    # tắt hẳn, xóa dữ liệu
```
