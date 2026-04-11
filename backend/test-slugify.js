// Test slugifyFileName function
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { slugifyFileName } = require('./src/services/storage.service');

const testCases = [
  '[CMP376] Giáo trình HP Thực hành Lập trình web (1).pdf',
  'Hồ sơ ứng tuyển - Scholarship Application (2024).docx',
  'Thư giới thiệu_ĐH Bách Khoa Hà Nội.pdf',
  'Nguyễn Văn A - Bảng điểm Tiếng Anh.xlsx',
  'file khong co duoi',           // không có extension
  '   nhiều khoảng trắng   ',     // khoảng trắng thừa
  'áéíóúàèìòùăêôơưấầ',            // toàn tiếng Việt
];

console.log('=== slugifyFileName Test ===\n');
for (const name of testCases) {
  const result = slugifyFileName(name);
  console.log(`INPUT : "${name}"`);
  console.log(`OUTPUT: "${result}"`);
  console.log('');
}
process.exit(0);