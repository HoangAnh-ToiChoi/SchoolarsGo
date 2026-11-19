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
  // d1 đủ mọi trường để demo trang chi tiết đầy đủ; d2 và d12 thiếu dữ liệu để demo phần bị ẩn
  {
    id: 'd1',
    slug: 'chevening-scholarship',
    title: 'Chevening Scholarship',
    provider: 'Chính phủ Vương quốc Anh',
    country: 'UK',
    degree: 'Master',
    coverage: 'Toàn phần',
    deadline: inDays(5),
    intake: '09/2027',
    language: 'Tiếng Anh',
    min_gpa: 3.0,
    min_ielts: 6.5,
    description:
      'Chevening là chương trình học bổng toàn cầu của Chính phủ Anh, dành cho người có tiềm năng lãnh đạo, học một năm thạc sĩ tại Anh. Ứng viên chọn 3 khóa học khác nhau và nộp hồ sơ trực tuyến trên trang chính thức.',
    benefits:
      '- Toàn bộ học phí chương trình thạc sĩ\n- Trợ cấp sinh hoạt hằng tháng\n- Vé máy bay khứ hồi hạng phổ thông\n- Trợ cấp visa và chi phí khi đến Anh',
    eligibility:
      '- Quốc tịch Việt Nam, cam kết về nước ít nhất 2 năm\n- Đã tốt nghiệp đại học\n- Tối thiểu 2 năm kinh nghiệm làm việc',
    requirements: '- CV\n- Bài luận (4 bài)\n- Bảng điểm đại học\n- 2 thư giới thiệu\n- Chứng chỉ IELTS\n- Hộ chiếu',
    application_url: 'https://www.chevening.org/scholarships/',
    source: 'chevening.org',
    source_url: 'https://www.chevening.org/scholarship/vietnam/',
  },
  { id: 'd2', slug: 'hoc-bong-vallet', title: 'Học bổng Vallet', provider: 'Quỹ Rencontres du Vietnam', country: 'Vietnam', degree: 'Bachelor', coverage: 'Một phần', deadline: inDays(9) },
  { id: 'd3', slug: 'daad-epos', title: 'DAAD EPOS', provider: 'Cơ quan Trao đổi Hàn lâm Đức', country: 'Germany', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(24) },
  { id: 'd4', slug: 'toshiba-foundation', title: 'Toshiba Foundation', provider: 'Quỹ Toshiba', country: 'Vietnam', degree: 'Bachelor', coverage: 'Một phần', deadline: inDays(29) },
  { id: 'd5', slug: 'mext-research-student', title: 'MEXT Research Student', provider: 'Bộ Giáo dục Nhật Bản', country: 'Japan', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(44) },
  { id: 'd6', slug: 'australia-awards', title: 'Australia Awards', provider: 'Chính phủ Úc', country: 'Australia', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(87) },
  { id: 'd7', slug: 'global-korea-scholarship', title: 'Global Korea Scholarship', provider: 'Chính phủ Hàn Quốc', country: 'South Korea', degree: 'Bachelor', coverage: 'Toàn phần', deadline: inDays(114) },
  { id: 'd8', slug: 'fulbright-vietnam', title: 'Fulbright Vietnam', provider: 'Chính phủ Hoa Kỳ', country: 'USA', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(62) },
  { id: 'd9', slug: 'eiffel-excellence', title: 'Eiffel Excellence', provider: 'Bộ Ngoại giao Pháp', country: 'France', degree: 'PhD', coverage: 'Toàn phần', deadline: inDays(18) },
  { id: 'd10', slug: 'commonwealth-scholarship', title: 'Commonwealth Scholarship', provider: 'Ủy ban Học bổng Khối Thịnh vượng chung', country: 'UK', degree: 'Master', coverage: 'Toàn phần', deadline: inDays(21) },
  { id: 'd11', slug: 'great-scholarships', title: 'GREAT Scholarships', provider: 'British Council', country: 'UK', degree: 'Master', coverage: 'Một phần', deadline: inDays(48) },
  {
    id: 'd12',
    slug: 'hoc-bong-thap-sang-uoc-mo',
    title: 'Học bổng Thắp sáng ước mơ',
    provider: 'Quỹ Khuyến học Việt Nam',
    country: 'Vietnam',
    degree: 'Bachelor',
    coverage: 'Một phần',
    deadline: null,
    summary: 'Học bổng dành cho sinh viên năm nhất có hoàn cảnh khó khăn, thành tích học tập tốt. Hạn nộp sẽ được công bố trên bài đăng gốc.',
    source: 'khuyenhoc.vn',
    source_url: 'https://example.org/hoc-bong-thap-sang-uoc-mo',
  },
];

// Đơn ứng tuyển minh họa đủ 3 chặng (chuẩn bị, chờ kết quả, đã có kết quả).
// Học bổng đi kèm ở khóa `scholarships` giống hệt backend (tên bảng Supabase).
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
const findScholarship = (id) => DEMO_SCHOLARSHIPS.find((s) => s.id === id);
const checklist = (names, doneCount) => names.map((item, i) => ({ item, done: i < doneCount }));
const DOCS = ['CV', 'Bảng điểm', 'Thư giới thiệu', 'Bài luận', 'Chứng chỉ IELTS'];

// Tệp minh họa trong hồ sơ; đơn a1 gắn sẵn CV và bảng điểm vào dòng giấy tờ tương ứng
export const DEMO_DOCUMENTS = [
  { id: 'doc1', type: 'cv', file_name: 'CV_NguyenVanA.pdf', file_url: null, file_size: 182_000, created_at: daysAgo(5) },
  { id: 'doc2', type: 'transcript', file_name: 'BangDiem_HK1-HK6.pdf', file_url: null, file_size: 1_450_000, created_at: daysAgo(4) },
];
const withFiles = (items, files) => items.map((item, i) => (files[i] ? { ...item, document_id: files[i] } : item));

export const DEMO_APPLICATIONS = [
  { id: 'a1', status: 'draft', applied_at: null, checklist: withFiles(checklist(DOCS, 3), ['doc1', 'doc2']), documents_used: ['doc1', 'doc2'], scholarships: findScholarship('d1') },
  { id: 'a2', status: 'draft', applied_at: null, checklist: checklist(DOCS.slice(0, 4), 1), scholarships: findScholarship('d9') },
  { id: 'a3', status: 'under_review', applied_at: daysAgo(12), checklist: checklist(DOCS, 5), scholarships: findScholarship('d2') },
  { id: 'a4', status: 'interview', applied_at: daysAgo(30), checklist: checklist(DOCS.slice(0, 3), 3), scholarships: findScholarship('d6') },
  { id: 'a5', status: 'submitted', applied_at: daysAgo(3), checklist: checklist(DOCS, 5), scholarships: findScholarship('d8') },
  { id: 'a6', status: 'rejected', applied_at: daysAgo(80), checklist: checklist(DOCS.slice(0, 3), 3), scholarships: findScholarship('d7') },
].map((a) => ({ documents_used: [], ...a, notes: null, created_at: a.applied_at ?? daysAgo(2), updated_at: daysAgo(1) }));
