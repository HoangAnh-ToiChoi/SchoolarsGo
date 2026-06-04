# ScholarsGo OAuth Setup

Tài liệu này hướng dẫn bật đăng nhập bằng `Facebook` và `Apple ID` cho ScholarsGo.

## Tổng quan kiến trúc

Project đang dùng mô hình:

- Frontend chuyển hướng người dùng đến backend
- Backend điều hướng sang provider OAuth
- Provider callback về backend
- Backend xác thực, link/tạo user local, phát JWT cookie `token`
- Backend redirect lại frontend tại `/oauth/complete`

Điểm mạnh của cách này:

- Giữ nguyên auth hiện tại của project
- Không phải phát access token của provider cho frontend
- Dễ link tài khoản social với tài khoản local theo email

## Endpoint mới

- `GET /api/auth/oauth/facebook/start`
- `GET /api/auth/oauth/facebook/callback`
- `GET /api/auth/oauth/apple/start`
- `GET /api/auth/oauth/apple/callback`
- `POST /api/auth/oauth/apple/callback`

## Route frontend mới

- `/oauth/complete`

## Migration cần chạy

Chạy file:

- `backend/scripts/migrations/003_add_oauth_identities.sql`

Mục đích:

- Tạo bảng `user_oauth_identities`
- Lưu mapping giữa `provider + provider_user_id` và `user` local

## Biến môi trường cần cấu hình

### Backend

```env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

APPLE_CLIENT_ID=your_apple_services_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Ghi chú:

- `BACKEND_URL` phải là URL public/backend thực tế mà provider callback vào
- `APPLE_PRIVATE_KEY` cần giữ nguyên format PEM, khi lưu `.env` phải escape newline bằng `\n`

## Facebook Login Setup

## 1. Tạo app trên Meta for Developers

- Vào Meta for Developers
- Tạo app mới
- Add product `Facebook Login`

## 2. Bật cấu hình web login

Trong phần Facebook Login settings, cấu hình:

- `Valid OAuth Redirect URI`
  - Dev: `http://localhost:3001/api/auth/oauth/facebook/callback`
  - Prod: `https://your-backend-domain/api/auth/oauth/facebook/callback`
- `Login with JavaScript SDK`
  - Không dùng trực tiếp ở frontend trong project này, nhưng vẫn nên đọc cấu hình web login cẩn thận

## 3. Lấy App ID và App Secret

- Copy `App ID` -> `FACEBOOK_APP_ID`
- Copy `App Secret` -> `FACEBOOK_APP_SECRET`

## 4. Quyền đang dùng

Project hiện yêu cầu:

- `email`
- `public_profile`

Nếu tài khoản Facebook không chia sẻ email, hệ thống sẽ từ chối tạo user social mới vì bảng `users` hiện yêu cầu email hợp lệ.

## Apple ID Setup

## 1. Chuẩn bị Apple Developer account

Bạn cần:

- Apple Developer account hợp lệ
- Một `Services ID` cho web sign-in
- Một `Sign in with Apple private key`

## 2. Tạo Services ID

Trong Apple Developer:

- Tạo `Services ID`
- Bật `Sign in with Apple`
- Gắn website/callback URL cho web

Callback URL cần nhập:

- Dev: `http://localhost:3001/api/auth/oauth/apple/callback`
- Prod: `https://your-backend-domain/api/auth/oauth/apple/callback`

Giá trị `Services ID` này sẽ được dùng làm:

- `APPLE_CLIENT_ID`

## 3. Tạo private key cho Sign in with Apple

Lấy các thông tin sau:

- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

## 4. Flow hiện tại của project

Project dùng:

- authorization `code`
- callback query mode
- server-side token exchange với Apple
- server-side verify `id_token`

Điều này giúp local dev ổn định hơn so với `form_post` trong một số trường hợp cookie `SameSite=Lax`.

## Luồng link tài khoản

Khi user social login:

1. Nếu đã có record trong `user_oauth_identities`
   - login vào user local đã link
2. Nếu chưa có identity nhưng email đã tồn tại trong `users`
   - link social identity vào account local hiện có
3. Nếu chưa có gì
   - tạo user mới
   - tạo identity mới

## Hành vi hiện tại của hệ thống

- Social login mới vẫn dùng JWT cookie `token` giống login email/password
- `GET /api/auth/me` vẫn là nguồn dữ liệu chuẩn cho frontend sau khi hoàn tất OAuth
- Frontend có trang `/oauth/complete` để đồng bộ store sau redirect

## Những giới hạn hiện tại

- Chưa có UI link/unlink provider trong trang profile
- Chưa có login bằng Google
- Chưa có test E2E dùng provider thật vì còn phụ thuộc credentials thật
- Apple có thể không luôn trả lại đầy đủ tên người dùng ở các lần đăng nhập sau

## Checklist bật tính năng

1. Chạy migration `003_add_oauth_identities.sql`
2. Cấu hình env vars backend
3. Khai báo redirect URLs đúng ở Meta và Apple
4. Restart backend/frontend
5. Test thủ công:
   - `/login`
   - `Tiếp tục với Facebook`
   - `Tiếp tục với Apple ID`
   - xác nhận `/oauth/complete`
   - xác nhận `GET /api/auth/me` trả user hợp lệ
