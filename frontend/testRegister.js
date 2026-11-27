import { register } from 'node:module';

// Chạy: node --import ./testRegister.js --test 'src/**/*.test.js'  (script `npm test` đã có sẵn)
// Ngày giờ hiển thị và "hôm nay" tính theo giờ Việt Nam: cố định để test không đổi kết quả theo múi giờ máy chạy
process.env.TZ = 'Asia/Ho_Chi_Minh';
register('./testAliasLoader.js', import.meta.url);
