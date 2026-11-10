// Dữ liệu minh họa cho bản demo trên GitHub Pages (không có backend).
// Hạn nộp tính tương đối theo ngày hiện tại để nhãn màu luôn đủ 3 mức.
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString();

export const DEMO_USER = {
  id: 'demo-user',
  full_name: 'Hoàng Anh',
  email: 'demo@scholarsgo.vn',
  role: 'user',
};

export const DEMO_PROFILE = {
  gpa: 3.4,
  english_level: 'IELTS 6.5',
  target_country: 'Nhật Bản',
  target_major: null,
  target_degree: 'Master',
};

export const DEMO_SCHOLARSHIPS = [
  { id: 'd1', slug: 'chevening-scholarship', title: 'Chevening Scholarship', provider: 'Chính phủ Vương quốc Anh', country: 'UK', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(5) },
  { id: 'd2', slug: 'hoc-bong-vallet', title: 'Học bổng Vallet', provider: 'Quỹ Rencontres du Vietnam', country: 'Vietnam', degree: 'Bachelor', coverage: 'Một phần', deadline: inDays(9) },
  { id: 'd3', slug: 'daad-epos', title: 'DAAD EPOS', provider: 'Cơ quan Trao đổi Hàn lâm Đức', country: 'Germany', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(24) },
  { id: 'd4', slug: 'toshiba-foundation', title: 'Toshiba Foundation', provider: 'Quỹ Toshiba', country: 'Vietnam', degree: 'Bachelor', coverage: 'Một phần', deadline: inDays(29) },
  { id: 'd5', slug: 'mext-research-student', title: 'MEXT Research Student', provider: 'Bộ Giáo dục Nhật Bản', country: 'Japan', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(44) },
  { id: 'd6', slug: 'australia-awards', title: 'Australia Awards', provider: 'Chính phủ Úc', country: 'Australia', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(87) },
  { id: 'd7', slug: 'global-korea-scholarship', title: 'Global Korea Scholarship', provider: 'Chính phủ Hàn Quốc', country: 'South Korea', degree: 'Bachelor', coverage: 'Toàn phần', deadline: inDays(114) },
  { id: 'd8', slug: 'fulbright-vietnam', title: 'Fulbright Vietnam', provider: 'Chính phủ Hoa Kỳ', country: 'USA', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(62) },
  { id: 'd9', slug: 'eiffel-excellence', title: 'Eiffel Excellence', provider: 'Bộ Ngoại giao Pháp', country: 'France', degree: 'PhD', coverage: 'Toàn phần', deadline: inDays(18) },
];
