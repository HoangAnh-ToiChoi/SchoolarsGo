// Danh sách trường tín hiệu dùng để tính độ hoàn thiện hồ sơ AI Recommend
export const PROFILE_COMPLETION_FIELDS = Object.freeze([
  { key: 'current_degree', label: 'Bậc học hiện tại' },
  { key: 'major', label: 'Ngành học hiện tại' },
  { key: 'nationality', label: 'Quốc tịch' },
  { key: 'birth_year', label: 'Năm sinh' },
  { key: 'gpa', label: 'GPA (thang 4.0)' },
  { key: 'english_level', label: 'Trình độ tiếng Anh' },
  { key: 'experience', label: 'Kinh nghiệm' },
  { key: 'certificates', label: 'Chứng chỉ' },
  { key: 'target_country', label: 'Quốc gia muốn đến' },
  { key: 'target_degree', label: 'Bậc học mong muốn' },
  { key: 'target_intake', label: 'Kỳ nhập học dự kiến' },
  { key: 'target_major', label: 'Ngành học mong muốn' },
  { key: 'bio', label: 'Giới thiệu bản thân' },
]);

export const PROFILE_FIELD_LABELS = Object.freeze(
  Object.fromEntries(PROFILE_COMPLETION_FIELDS.map((field) => [field.key, field.label])),
);
