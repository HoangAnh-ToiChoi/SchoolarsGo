'use strict';

/** scholarshiproar.com — nhỏ, gọn, nhiều học bổng UK. */
module.exports = {
  name: 'scholarshipRoar',
  priority: 5, // số nhỏ = ưu tiên hơn khi hai nguồn có cùng một học bổng
  baseUrl: 'https://www.scholarshiproar.com',
  maxAgeDays: 365, // chỉ lấy bài đăng trong khoảng này
  maxPages: 2,
  delayMs: 700,
  queries: [
    { search: 'vietnam' },
    { search: 'southeast asia' },
    { search: 'asian students' },
  ],
};
