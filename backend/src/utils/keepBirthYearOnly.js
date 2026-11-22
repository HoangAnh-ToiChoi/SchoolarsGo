import { CV_BIRTH_DATE_PATTERN } from '~/constants/cv.js';

/** Đổi "Ngày sinh 28/12/2005" thành "Ngày sinh 2005" trước khi gửi chữ CV cho AI: chỉ cần năm sinh, không cần cả ngày tháng. */
function keepBirthYearOnly(text) {
  return text.replace(CV_BIRTH_DATE_PATTERN, '$1$2');
}

export default keepBirthYearOnly;
