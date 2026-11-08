'use strict';

/** scholarshipregion.com — kho lớn, nhiều học bổng châu Âu. */
module.exports = {
  name: 'scholarshipRegion',
  priority: 4, // số nhỏ = ưu tiên hơn khi hai nguồn có cùng một học bổng
  baseUrl: 'https://www.scholarshipregion.com',
  maxAgeDays: 365, // chỉ lấy bài đăng trong khoảng này
  maxPages: 3,
  delayMs: 700,
  queries: [
    { search: 'vietnam' },
    { search: 'southeast asia' },
    { search: 'asean' },
  ],
};
