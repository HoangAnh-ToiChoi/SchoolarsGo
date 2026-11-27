import { CV_HIDDEN_MARK, CV_CONTACT_PATTERNS } from '~/constants/cv.js';

/** Xóa email, số điện thoại (VN và quốc tế), link mạng xã hội, số giấy tờ tùy thân và dòng địa chỉ trước khi gửi chữ CV cho AI bên ngoài. */
// NFKC gom ký tự full-width (＠, ０９０…) về dạng thường để regex nhận ra
function removeContactInfo(text) {
  let result = text.normalize('NFKC');
  for (const pattern of CV_CONTACT_PATTERNS) {
    result = result.replace(pattern, CV_HIDDEN_MARK);
  }
  return result;
}

export default removeContactInfo;
