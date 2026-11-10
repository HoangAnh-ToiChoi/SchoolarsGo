'use strict';

/** scholarshipscorner.website — cập nhật hằng ngày, nhiều học bổng Nhật và Thuỵ Điển. */
module.exports = {
  name: 'scholarshipsCorner',
  priority: 2, // số nhỏ = ưu tiên hơn khi hai nguồn có cùng một học bổng
  baseUrl: 'https://scholarshipscorner.website',
  maxAgeDays: 365, // chỉ lấy bài đăng trong khoảng này
  maxPages: 2,
  delayMs: 700,
  queries: [
    { search: 'vietnam' },
    { search: 'southeast asia' },
    { search: 'asean' },
  ],
};
