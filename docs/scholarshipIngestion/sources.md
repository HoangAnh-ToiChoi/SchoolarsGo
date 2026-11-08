# Nguồn dữ liệu học bổng

Cập nhật: 2026-11-08. Số liệu lấy bằng cách gọi thật `/wp-json/wp/v2/posts` từng nguồn.

## Nguyên tắc chọn nguồn

1. Có API JSON công khai (không phải cào HTML) để dữ liệu ổn định.
2. Mỗi bài có link bài đăng gốc (`link`) để hiện trên giao diện.
3. Còn cập nhật trong 60 ngày gần nhất.
4. Có học bổng mở cho người Việt Nam / Đông Nam Á.

## 5 nguồn đang dùng

| Ưu tiên | Nguồn | Tổng bài | Bài nhắc "Vietnam" | Bài mới nhất | Ghi chú |
|---|---|---|---|---|---|
| 1 | scholars4dev.com | 585 | 36 | 2026-09-24 | Chọn lọc. Có chuyên mục theo khu vực: Southeast Asians (ID 94), East Asians (63), South Asians (93), Asians (55) |
| 2 | scholarshipscorner.website | 1420 | 66 | 2026-11-06 | Cập nhật hằng ngày, nhiều học bổng Nhật, Thuỵ Điển |
| 3 | opportunitiesforyouth.org | 5669 | 98 | 2026-11-06 | Nhiều bài Đông Nam Á nhất, nhưng lẫn việc làm, hội nghị (cần lọc mạnh) |
| 4 | scholarshipregion.com | 7230 | 45 | 2026-10-21 | Kho lớn, nhiều học bổng châu Âu |
| 5 | scholarshiproar.com | 414 | 19 | 2026-09-08 | Nhỏ, gọn, nhiều học bổng UK |

"Ưu tiên" dùng khi hai nguồn có cùng một học bổng: giữ bản của nguồn có số nhỏ hơn.

## Làm sau cùng (chưa làm)

- **DAAD** (học bổng Đức, trang chính thống): cần cào HTML riêng, làm sau khi 5 nguồn trên chạy ổn.

## Đã loại

| Nguồn | Lý do |
|---|---|
| scholarship-positions.com | Domain chết, chuyển hướng sang `cloudflare.vc` |
| scholarshipsads.com, scholarships.com, mastersportal.com | Trả 403 (chặn) |
| afterschoolafrica.com, opportunitiesforafricans.com | Thiên về châu Phi |
| opportunitydesk.org, scholarshipdb.net, youthop.com, studyqa.com | Đã thử trước đây: quảng cáo, 403, hoặc cần JavaScript |

## Cách gọi API (ví dụ)

```
GET https://www.scholars4dev.com/wp-json/wp/v2/posts?categories=94&per_page=100&page=1
    &_fields=id,date,link,title,excerpt,categories
```

Header phản hồi `X-WP-TotalPages` cho biết tổng số trang. Các nguồn còn lại không có ID khu vực,
nên dùng `search=vietnam` và `search=southeast asia` rồi để bộ lọc quyết định.
