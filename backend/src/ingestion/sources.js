'use strict';

/**
 * 5 trang web lấy học bổng. Cả 5 đều chạy WordPress nên dùng chung một cách lấy (wordpress.js).
 *
 * Thêm trang mới: thêm một object vào mảng. Tắt tạm một trang: xoá object của nó.
 *   priority   số nhỏ = ưu tiên hơn khi hai trang đăng cùng một học bổng (trang ưu tiên thắng)
 *   maxAgeDays chỉ lấy bài đăng trong khoảng này
 *   maxPages   số trang kết quả tối đa cho mỗi truy vấn (mỗi trang 50 bài)
 *   delayMs    nghỉ giữa hai lần gọi để không bị trang web chặn
 *   queries    các truy vấn gửi tới trang: theo chuyên mục hoặc theo từ khoá
 */
const SOURCES = [
  {
    // Chọn lọc, có chuyên mục theo khu vực (94 = Southeast Asians, 55 = Asians, 54 = Asia)
    name: 'scholars4dev',
    priority: 1,
    baseUrl: 'https://www.scholars4dev.com',
    maxAgeDays: 540,
    maxPages: 3,
    delayMs: 700,
    queries: [{ categories: [94, 55, 54], maxPages: 5 }, { search: 'vietnam', maxPages: 2 }],
  },
  {
    // Cập nhật hằng ngày, nhiều học bổng Nhật và Thuỵ Điển
    name: 'scholarshipsCorner',
    priority: 2,
    baseUrl: 'https://scholarshipscorner.website',
    maxAgeDays: 365,
    maxPages: 2,
    delayMs: 700,
    queries: [{ search: 'vietnam' }, { search: 'southeast asia' }, { search: 'asean' }],
  },
  {
    // Nhiều bài Đông Nam Á nhất nhưng lẫn việc làm, hội nghị (luật R1 trong filter.js sẽ loại)
    name: 'opportunitiesForYouth',
    priority: 3,
    baseUrl: 'https://opportunitiesforyouth.org',
    maxAgeDays: 365,
    maxPages: 3,
    delayMs: 700,
    queries: [{ search: 'vietnam' }, { search: 'southeast asia' }, { search: 'asean' }],
  },
  {
    // Kho lớn, nhiều học bổng châu Âu
    name: 'scholarshipRegion',
    priority: 4,
    baseUrl: 'https://www.scholarshipregion.com',
    maxAgeDays: 365,
    maxPages: 3,
    delayMs: 700,
    queries: [{ search: 'vietnam' }, { search: 'southeast asia' }, { search: 'asean' }],
  },
  {
    // Nhỏ, gọn, nhiều học bổng UK
    name: 'scholarshipRoar',
    priority: 5,
    baseUrl: 'https://www.scholarshiproar.com',
    maxAgeDays: 365,
    maxPages: 2,
    delayMs: 700,
    queries: [{ search: 'vietnam' }, { search: 'southeast asia' }, { search: 'asian students' }],
  },
];

const sourceNames = () => SOURCES.map((s) => s.name);

/** Chọn các trang cần chạy (mặc định tất cả), xếp theo ưu tiên. Gõ sai tên trang thì báo lỗi ngay. */
function pickSources(only = []) {
  const unknown = only.filter((name) => !sourceNames().includes(name));
  if (unknown.length) throw new Error(`Không có nguồn: ${unknown.join(', ')}. Hiện có: ${sourceNames().join(', ')}`);
  return SOURCES.filter((s) => only.length === 0 || only.includes(s.name)).sort((a, b) => a.priority - b.priority);
}

module.exports = { SOURCES, sourceNames, pickSources };
