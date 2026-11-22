const HIDDEN = '[ẩn]';

// Mỗi mẫu chỉ dùng lượng từ đơn giản, không lồng nhau, để chuỗi dài không làm regex chạy mãi
const PATTERNS = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  /(?:https?:\/\/|www\.)\S+/gi,
  /\b(?:linkedin|facebook|github|twitter|instagram|zalo)\.\S+/gi,
  /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}/g,
  /^.*(?:địa chỉ|address)\s*:.*$/gim,
];

/** Xóa email, số điện thoại, link mạng xã hội và dòng địa chỉ trước khi gửi chữ CV cho AI bên ngoài. */
function removeContactInfo(text) {
  let result = text;
  for (const pattern of PATTERNS) {
    result = result.replace(pattern, HIDDEN);
  }
  return result;
}

export default removeContactInfo;
