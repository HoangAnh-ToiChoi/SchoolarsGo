import { CV_HIDDEN_MARK, CV_CONTACT_PATTERNS } from '~/constants/cv.js';

/** Xóa email, số điện thoại, link mạng xã hội và dòng địa chỉ trước khi gửi chữ CV cho AI bên ngoài. */
function removeContactInfo(text) {
  let result = text;
  for (const pattern of CV_CONTACT_PATTERNS) {
    result = result.replace(pattern, CV_HIDDEN_MARK);
  }
  return result;
}

export default removeContactInfo;
