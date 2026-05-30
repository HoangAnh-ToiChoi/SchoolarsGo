# Tăng Độ Ổn Định AI Và Nâng Chiều Sâu Recommend

Ngày: 2026-05-31
Nhánh: `feat/ai-recommend-ui-improvements`
Bối cảnh: phiên làm việc tiếp nối sau khi triển khai AI recommend, chatbot rules và homepage news

## Mục tiêu phiên làm việc

Phiên này tập trung vào 2 bước tiếp theo đã được duyệt:

1. Tăng độ chắc chắn của test cho `news`, `chat` và `recommend` để các thay đổi AI và content gần đây ít bị regression hơn.
2. Nâng chất lượng recommendation bằng tín hiệu hồ sơ phong phú hơn, nhưng không ép thêm một migration schema rủi ro trong cùng phiên.

## Spec đã được duyệt

### Bước 1: Củng cố test

Mục tiêu:
- Bổ sung contract test ở tầng backend cho `news`, `chat` và `recommend`
- Bổ sung smoke/E2E cho các trạng thái fallback quan trọng mà user nhìn thấy trực tiếp

Tiêu chí hoàn thành:
- Auth, validation, success contract và operational-error behavior đều có test
- Các trạng thái fallback của news và chat được cover ở E2E
- Test chạy được với setup hiện tại của repo

Ngoài phạm vi:
- Load test toàn diện
- Thiết kế lại toàn bộ CI
- Viết lại toàn bộ Playwright test hiện có

### Bước 2: Nâng chiều sâu recommendation

Mục tiêu:
- Cải thiện chất lượng recommendation bằng cách tận dụng nhiều hơn dữ liệu profile và document hiện có
- Giữ deterministic ranking và guardrail
- Tránh tạo migration schema mới nếu chưa thật sự cần

Tiêu chí hoàn thành:
- Output của recommendation phản ánh tốt hơn readiness và profile-gap
- Semantic scoring dùng nhiều tín hiệu hơn bộ major/degree/country ban đầu
- UI cho user biết cần bổ sung gì để matching tốt hơn

Ngoài phạm vi:
- Vector database đầy đủ hoặc external retrieval stack
- Migration schema lớn trong phiên này
- Thay hoàn toàn rule-based ranking bằng AI ranking thuần túy

## Kế hoạch triển khai đã dùng

### Phase A: Thêm contract test cho backend

- Tạo test harness nhẹ bằng `node:test` quanh các Express route độc lập
- Cover `GET /api/news`
- Cover `POST /api/recommend`
- Cover `GET /api/chat/history` và `POST /api/chat`

### Phase B: Thêm coverage cho fallback ở frontend

- Mở rộng `news.spec.js` để cover fallback khi homepage gọi API news thất bại
- Thêm `chat.spec.js` để cover render history và fallback khi chat API unavailable

### Phase C: Làm sâu hơn recommendation input model

- Mở rộng repository của recommend để lấy thêm tín hiệu document nhẹ
- Chuẩn hóa profile trước khi tính điểm
- Tách profile readiness thành `core` và `supporting`
- Bổ sung semantic signal từ `bio`, `target_intake` và sự hiện diện của document

### Phase D: Hiển thị readiness cho người dùng

- Hiển thị tín hiệu hoàn thiện hồ sơ AI chi tiết hơn trên `ProfilePage`
- Hiển thị readiness và enrichment gaps trên `RecommendPage`
- Cập nhật API docs để phản ánh contract mới

### Phase E: Xác minh

- Chạy backend contract tests
- Chạy lint cho frontend/backend
- Chạy frontend build
- Chạy Playwright có chọn lọc cho các flow vừa thay đổi
- Chạy `git diff --check`

## Các thay đổi đã thực hiện

### Coverage test ở backend

Đã thêm:
- `backend/tests/contracts/helpers/http.js`
- `backend/tests/contracts/news.contract.test.js`
- `backend/tests/contracts/recommend.contract.test.js`
- `backend/tests/contracts/chat.contract.test.js`

Đã cập nhật:
- `backend/package.json`

Ghi chú:
- Test dùng route-level Express app, không kéo thêm framework test mới
- Coverage gồm auth error, validation error, success path và operational service failure

### Coverage E2E ở frontend

Đã thêm:
- `tests/e2e/chat.spec.js`

Đã cập nhật:
- `tests/e2e/news.spec.js`
- `tests/e2e/recommend.spec.js`

Ghi chú:
- News hiện có coverage cho fallback khi `/api/news` lỗi
- Chat hiện có coverage cho render history và graceful fallback khi chat API unavailable

### Nâng chất lượng recommendation

Đã cập nhật:
- `backend/src/repositories/recommend.repository.js`
- `backend/src/services/recommend.service.js`
- `backend/src/services/gemini.service.js`
- `backend/src/utils/swagger.js`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/RecommendPage.jsx`

Hành vi recommendation mới:
- Lấy thêm `document_count` và `document_types` vào recommendation input model
- Tách readiness thành:
  - `profile_gaps`
  - `profile_enrichment_gaps`
  - `profile_readiness.overall`
  - `profile_readiness.core`
  - `profile_readiness.supporting`
- Dùng semantic signal phong phú hơn từ:
  - ngành mục tiêu
  - `bio`
  - kỳ nhập học mục tiêu
  - sự hiện diện/loại document
  - `requirements` và `eligibility` của học bổng
- Vẫn giữ rule scoring làm guardrail chính

### Các thay đổi đã có trong commit của phiên này

Các phần sau thuộc phạm vi triển khai rộng hơn đã được duyệt trước đó và cũng nằm trong commit:
- `backend/src/app.js`
- `backend/src/controllers/chat.controller.js`
- `backend/src/services/chat.service.js`
- `backend/src/services/profile.service.js`
- `backend/src/services/chat.policy.js`
- `frontend/src/components/LatestNewsSection.jsx`
- `frontend/src/pages/HomePage.jsx`

Những thay đổi đó bao phủ:
- Mount news route
- Tích hợp latest news vào homepage
- Wiring balanced chatbot policy
- Đồng bộ validation `english_level` với dữ liệu nhập thực tế

## Kết quả verification

Đã chạy thành công:
- `cd backend && npm run test:contract`
- `cd backend && npm run lint`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `npx playwright test tests/e2e/news.spec.js tests/e2e/recommend.spec.js tests/e2e/chat.spec.js --project=chromium`
- `git diff --check`
- `npm test -- --list`

Trạng thái ghi nhận:
- Backend contract tests: `12/12` passed
- Playwright có chọn lọc: `6/6` passed
- Tổng inventory Playwright hiện liệt kê: `18 tests trong 6 files`
- Backend lint: pass, chỉ còn warning cũ
- Frontend lint: pass, chỉ còn warning cũ
- Frontend build: pass

## Các file cố ý không đưa vào commit

Các thay đổi local sau được giữ nguyên vì là phần riêng của user hoặc file sinh tự động ngoài phạm vi task:
- `database.sql`
- `Quy_Uoc_Chung.md`
- `claude-mem/`
- `playwright-report/`
- `test-results/`

## Đề xuất bước tiếp theo

1. Chạy toàn bộ Playwright suite một lượt trước release, không chỉ batch đã thay đổi.
2. Xem xét một migration profile riêng ở phiên sau cho các field như budget, scholarship type preference và experience level nếu product muốn tăng cá nhân hóa.
3. Giảm dần warning lint lâu năm và tối ưu chunk size của frontend sau khi các hạng mục product-critical được merge.
