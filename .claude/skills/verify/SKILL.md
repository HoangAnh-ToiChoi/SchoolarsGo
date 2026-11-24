---
name: verify
description: Chạy cổng kiểm tra trước khi báo xong hoặc tạo PR ở ScholarsGo — lint, build, test theo phần đã đổi (backend/frontend), quét quy ước, đối chiếu checklist CLAUDE.md, rồi in báo cáo PASS/FAIL. Dùng sau khi hoàn thành một phần việc, trước commit/PR, hoặc khi người dùng gõ /verify.
---

# Verify — cổng kiểm tra ScholarsGo

Chuyển thể từ ECC `verification-loop`, rút gọn theo dự án (JS thuần, không typecheck). **Bằng chứng trước khẳng định:** chỉ ghi PASS khi đã chạy lệnh và thấy kết quả.

## 1. Xác định phạm vi

```bash
git status --short
git diff --name-only HEAD
```
Ghi lại: có đổi `backend/`? `frontend/`? migration? `.claude/hooks/`?

Thiếu `node_modules` ở phần nào cần chạy → `npm ci` trong thư mục đó trước.

## 2. Chạy theo phần đã đổi (chạy song song khi độc lập)

| Đổi ở | Lệnh (trong thư mục tương ứng) |
|---|---|
| `backend/src`, `backend/tests` | `npm run lint` · `npm run test:contract` |
| `backend/src/ingestion` | thêm `npm run test:ingestion` |
| `frontend/src` | `npm run lint` · `npm run build` |
| `frontend/src/utils/demo`, chế độ pages | thêm `npm run build:pages` |
| `.claude/hooks` | `node --test .claude/hooks/tests/*.test.mjs` (ở gốc repo) |

Lỗi → sửa nguyên nhân rồi chạy lại. **Không** sửa cấu hình lint, không `--no-verify`, không xóa test để cho qua.

## 3. Quét quy ước toàn bộ file đã đổi

Hook Stop `stopGate` sẽ quét khi kết thúc, nhưng chạy chủ động để thấy sớm:
```bash
git diff --name-only HEAD | grep -E '^(backend|frontend)/src/'
```
Với mỗi file, đối chiếu `.claude/hooks/lib/conventions.mjs` (hook PostToolUse đã báo khi sửa — xác nhận không còn tồn).

## 4. Checklist CLAUDE.md (tự trả lời, có dẫn chứng)

- [ ] Số dòng: file vừa sửa/tạo không vượt ngưỡng (controller 100 · service BE 200 · model 250 · component 200 · hook 150 · service FE 200)
- [ ] BE route mới có `auth`/`requireRole`; dữ liệu người dùng lọc `user_id`
- [ ] BE query: không SELECT * · không N+1 · đọc song song `Promise.all`
- [ ] BE service mới có test trong `backend/tests/`
- [ ] FE màn hình đủ 4 trạng thái: skeleton · rỗng · lỗi có "Thử lại" · có dữ liệu
- [ ] FE không cuộn ngang ở 360 / 768 / 1024 / 1280px (chưa kiểm bằng mắt → ghi "chưa kiểm", gợi ý người dùng xem hoặc dùng Playwright MCP nếu đã bật)
- [ ] Không console.log, import thừa, code bị comment

## 5. Báo cáo

```
## Verify — PASS | FAIL
| Bước | Kết quả |
|---|---|
| BE lint | ✅ 0 lỗi / ❌ n lỗi / — không đổi |
| BE test:contract | ✅ 42/42 / ❌ … |
| FE lint | … |
| FE build | … |
| Quy ước | ✅ / ❌ (liệt kê) |
| Checklist | ✅ / ⚠️ mục chưa kiểm được |
Việc còn lại: …
```
FAIL hoặc mục chưa kiểm phải nói thẳng, không làm tròn thành PASS.
