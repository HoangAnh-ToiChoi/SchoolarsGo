import { GPA_TARGET_SCALE, GPA_DECIMALS } from '~/constants/cv.js';

// GPA lưu và so khớp theo thang 4 (cột profiles.gpa có CHECK 0–4, min_gpa của học bổng cũng thang 4).
// Dùng cho GPA đọc từ CV (cvExtract.service) và GPA người dùng nhập theo thang 5 / 10 (profile.service).
// Lớn hơn thang đã khai là sai nên trả undefined.
function toGpa4(gpa, scale = GPA_TARGET_SCALE) {
  if (gpa === undefined || gpa > scale) return undefined;
  const converted = (gpa / scale) * GPA_TARGET_SCALE;
  return Number(converted.toFixed(GPA_DECIMALS));
}

export { toGpa4 };
