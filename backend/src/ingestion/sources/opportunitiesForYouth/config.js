'use strict';

/** opportunitiesforyouth.org — nhiều bài Đông Nam Á nhất nhưng lẫn việc làm, hội nghị (bộ lọc chung R1 sẽ loại). */
module.exports = {
  name: 'opportunitiesForYouth',
  priority: 3, // số nhỏ = ưu tiên hơn khi hai nguồn có cùng một học bổng
  baseUrl: 'https://opportunitiesforyouth.org',
  maxAgeDays: 365, // chỉ lấy bài đăng trong khoảng này
  maxPages: 3,
  delayMs: 700,
  queries: [
    { search: 'vietnam' },
    { search: 'southeast asia' },
    { search: 'asean' },
  ],
};
