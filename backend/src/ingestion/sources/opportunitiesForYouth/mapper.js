'use strict';

const { toRawPost } = require('../../shared/wordpressMapper');

/** Đổi bài WordPress của opportunitiesForYouth sang dạng chung. Điểm riêng của trang này (nếu có) thêm ở đây. */
module.exports = function map(post, config) {
  return toRawPost(post, config);
};
