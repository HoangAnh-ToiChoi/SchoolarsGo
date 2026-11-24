---
name: ship-dev
description: Đưa nhánh hiện tại vào dev theo quy trình bắt buộc của ScholarsGo — verify, push nhánh, checkout dev, merge --no-ff từ nhánh, push dev. Chỉ chạy khi người dùng gõ /ship-dev.
disable-model-invocation: true
---

# Ship vào dev — ScholarsGo

Quy trình (CLAUDE.md mục "Quy trình", bước 5): commit trên nhánh riêng → push nhánh → **từ nhánh đó** `git merge --no-ff` vào `dev` → push `dev`. Cấm commit thẳng trên dev, cấm force-push dev (hook `guardBash` chặn).

Team thường đi qua Pull Request vào dev (bước 4). Hỏi người dùng muốn **mở PR** (mặc định) hay **merge trực tiếp** trước khi làm bước 4 dưới đây.

## 1. Kiểm tra trước
```bash
git branch --show-current       # phải là feat/… fix/… refactor/… docs/… chore/…, không phải main/dev
git status --short              # phải sạch; còn thay đổi → hỏi người dùng commit gì
git fetch origin
git rev-parse --verify origin/dev
```
Không có `origin/dev` → dừng, hỏi người dùng (remote có thể là fork; nhánh dev có thể ở upstream).

## 2. Verify
Chạy skill `/verify` cho phạm vi `origin/dev..HEAD`. FAIL → dừng, báo lỗi.

## 3. Push nhánh
```bash
git push -u origin <nhánh>
```

## 4a. Mở PR (mặc định)
`gh pr create --base dev --head <nhánh>` với tiêu đề `type: mô tả ngắn` và mô tả: tóm tắt, cách test, kết quả verify. Kết thúc bằng dòng attribution theo hướng dẫn hệ thống.

## 4b. Merge trực tiếp (khi người dùng chọn)
```bash
git checkout dev
git pull --ff-only origin dev
git merge --no-ff <nhánh>
git push origin dev
git checkout <nhánh>
```
Xung đột → dừng, liệt kê file xung đột, hỏi người dùng; không tự chọn phía.

## 5. Báo lại
Link PR hoặc commit merge trên dev, kết quả verify.
