'use strict';

/** scholars4dev.com — chọn lọc, có chuyên mục theo khu vực (94 = Southeast Asians, 55 = Asians, 54 = Asia). */
module.exports = {
  name: 'scholars4dev',
  priority: 1, // số nhỏ = ưu tiên hơn khi hai nguồn có cùng một học bổng
  baseUrl: 'https://www.scholars4dev.com',
  maxAgeDays: 540, // chỉ lấy bài đăng trong khoảng này
  maxPages: 3,
  delayMs: 700,
  queries: [
    { categories: [94, 55, 54], maxPages: 5 }, // Southeast Asians, Asians, Asia
    { search: 'vietnam', maxPages: 2 },
  ],
};
