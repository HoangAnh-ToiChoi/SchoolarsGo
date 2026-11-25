import { DEGREES, COMMON_MAJORS } from '~/utils/constants';
import {
  CURRENT_DEGREE_OPTIONS,
  NATIONALITY_SUGGESTIONS,
  PROFILE_LIMITS,
} from './profileLimits.js';
import { PROFILE_FIELD_LABELS } from './profileCompletionFields.js';

// Nhóm 1: Thông tin học thuật và cá nhân hiện tại
export const CURRENT_PROFILE_FIELDS = [
  {
    key: 'current_degree',
    label: PROFILE_FIELD_LABELS.current_degree,
    type: 'select',
    placeholder: 'Chọn bậc học hiện tại',
    options: CURRENT_DEGREE_OPTIONS,
    colSpan: 1,
  },
  {
    key: 'major',
    label: PROFILE_FIELD_LABELS.major,
    type: 'text',
    placeholder: 'VD: Computer Science',
    datalist: COMMON_MAJORS,
    hint: `Tối đa ${PROFILE_LIMITS.MAJOR_MAX} ký tự`,
    colSpan: 1,
  },
  {
    key: 'birth_year',
    label: PROFILE_FIELD_LABELS.birth_year,
    type: 'number',
    step: '1',
    min: PROFILE_LIMITS.BIRTH_YEAR_MIN,
    placeholder: 'VD: 2002',
    colSpan: 1,
  },
  {
    key: 'nationality',
    label: PROFILE_FIELD_LABELS.nationality,
    type: 'text',
    placeholder: 'VD: VN, JP, US...',
    datalist: NATIONALITY_SUGGESTIONS,
    hint: 'Mã quốc gia 2 chữ cái (ISO), VD: VN',
    colSpan: 1,
  },
  {
    key: 'gpa',
    label: PROFILE_FIELD_LABELS.gpa,
    type: 'number',
    placeholder: '3.5',
    step: '0.01',
    min: PROFILE_LIMITS.GPA_MIN,
    max: PROFILE_LIMITS.GPA_MAX,
    colSpan: 1,
  },
  {
    key: 'english_level',
    label: PROFILE_FIELD_LABELS.english_level,
    type: 'text',
    placeholder: 'IELTS 7.0',
    colSpan: 1,
  },
  {
    key: 'experience',
    label: PROFILE_FIELD_LABELS.experience,
    type: 'textarea',
    placeholder: 'Mô tả kinh nghiệm làm việc, nghiên cứu, dự án nổi bật...',
    rows: 4,
    hint: `Tối đa ${PROFILE_LIMITS.EXPERIENCE_MAX} ký tự`,
    colSpan: 2,
  },
];

// Nhóm 3: Mục tiêu du học
export const TARGET_PROFILE_FIELDS = [
  {
    key: 'target_country',
    label: PROFILE_FIELD_LABELS.target_country,
    type: 'text',
    placeholder: 'UK, USA, Australia...',
    colSpan: 1,
  },
  {
    key: 'target_degree',
    label: PROFILE_FIELD_LABELS.target_degree,
    type: 'select',
    placeholder: 'Chọn bậc học',
    options: DEGREES,
    colSpan: 1,
  },
  {
    key: 'target_intake',
    label: PROFILE_FIELD_LABELS.target_intake,
    type: 'text',
    placeholder: 'Fall 2027, Spring 2028...',
    colSpan: 1,
  },
  {
    key: 'target_major',
    label: PROFILE_FIELD_LABELS.target_major,
    type: 'text',
    placeholder: 'Computer Science',
    datalist: COMMON_MAJORS,
    colSpan: 1,
  },
  {
    key: 'bio',
    label: PROFILE_FIELD_LABELS.bio,
    type: 'textarea',
    placeholder: 'Viết vài dòng về bản thân, mục tiêu du học, thế mạnh học tập...',
    rows: 4,
    colSpan: 2,
  },
];

export const PROFILE_SIGNAL_FIELDS = [...CURRENT_PROFILE_FIELDS, ...TARGET_PROFILE_FIELDS];
