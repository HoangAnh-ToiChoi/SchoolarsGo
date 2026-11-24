---
name: review-diff
description: Review thay đổi hiện tại (hoặc một nhánh so với dev) bằng các agent chuyên trách của ScholarsGo chạy song song — be-reviewer, fe-reviewer, security-reviewer — rồi gộp, khử trùng, xác minh và xếp hạng phát hiện. Dùng trước khi mở PR vào dev hoặc khi người dùng gõ /review-diff [base].
argument-hint: "[base, mặc định HEAD]"
---

# Review diff — ScholarsGo

Chuyển thể từ ECC `review-pr`: chia theo vùng code thay vì một reviewer ôm hết.

## 1. Phạm vi

- Base = `$ARGUMENTS` nếu có (vd. `dev`, `origin/dev`), không thì so với `HEAD` + file chưa track.
- `git diff --name-only <base>` (thêm `git ls-files --others --exclude-standard` khi base là HEAD).
- Không có thay đổi → báo và dừng.

## 2. Chọn reviewer

| Điều kiện | Agent |
|---|---|
| Có file `backend/` | `be-reviewer` |
| Có file `frontend/` | `fe-reviewer` |
| Chạm auth/session/token, route mới, upload, chat/LLM, ingestion, `app.js`, `configs/`, `utils/security`, hoặc diff > 300 dòng | `security-reviewer` |
| Thêm hàm service mà thiếu test | gợi ý chạy `be-test-writer` sau review |

Gọi các agent đã chọn **trong cùng một lượt** (song song). Brief cho mỗi agent: base, danh sách file thuộc vùng của nó, mục đích thay đổi (lấy từ lời người dùng / commit message). Không đưa kết luận của bạn vào brief.

## 3. Gộp và xác minh

- Khử trùng phát hiện trùng vị trí/nội dung.
- Với mỗi phát hiện "Nghiêm trọng"/"Cao": tự mở file kiểm lại kịch bản. Không tái hiện được → hạ mức hoặc bỏ, ghi lý do.
- Phát hiện mâu thuẫn CLAUDE.md → CLAUDE.md thắng.

## 4. Báo cáo cho người dùng

```
## Review — <base>..working tree · <n> file
### Nghiêm trọng (phải sửa trước merge)
### Nên sửa
### Gợi ý
### Cần người kiểm bằng mắt
Reviewer đã chạy: be / fe / security
```
Hỏi người dùng có muốn sửa luôn không; **không tự sửa** khi chưa được đồng ý.
