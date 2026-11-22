// Đoán loại tài liệu (cv, transcript…) từ tên mục checklist để lưu đúng nhóm trong hồ sơ
export const DOC_TYPE_PATTERNS = [
  ['cv', /^\s*cv\s*$|curriculum/i],
  ['sop', /^\s*sop\s*$|statement|bài\s*luận|essay/i],
  ['transcript', /bảng\s*điểm|transcript/i],
  ['recommendation_letter', /thư\s*giới\s*thiệu|recommendation/i],
];
