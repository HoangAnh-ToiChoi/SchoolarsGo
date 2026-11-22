import { DEGREES, COMMON_MAJORS } from '~/utils/constants';

// 7 trường tín hiệu học thuật cốt lõi cho AI Recommend (OCP Schema)
export const PROFILE_SIGNAL_FIELDS = [
  { key: 'gpa', label: 'GPA (thang 4.0)', type: 'number', placeholder: '3.5', step: '0.01', min: '0', max: '4', colSpan: 1 },
  { key: 'english_level', label: 'Trình độ tiếng Anh', type: 'text', placeholder: 'IELTS 7.0', colSpan: 1 },
  { key: 'target_country', label: 'Quốc gia muốn đến', type: 'text', placeholder: 'UK, USA, Australia...', colSpan: 1 },
  { key: 'target_degree', label: 'Bậc học mong muốn', type: 'select', placeholder: 'Chọn bậc học', options: DEGREES, colSpan: 1 },
  { key: 'target_intake', label: 'Kỳ nhập học dự kiến', type: 'text', placeholder: 'Fall 2027, Spring 2028...', colSpan: 1 },
  { key: 'target_major', label: 'Ngành học mong muốn', type: 'text', placeholder: 'Computer Science', datalist: COMMON_MAJORS, colSpan: 2 },
  { key: 'bio', label: 'Giới thiệu bản thân', type: 'textarea', placeholder: 'Viết vài dòng về bản thân, mục tiêu du học, thế mạnh học tập...', rows: 4, colSpan: 2 },
];
