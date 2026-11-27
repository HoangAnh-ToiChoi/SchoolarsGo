import { EMPTY_FORM } from '../constants';

// Giá trị ban đầu của form: thêm mới thì để trống, sửa thì lấy từ học bổng (ô ngày chỉ nhận yyyy-MM-dd)
export function toScholarshipForm(scholarship) {
  if (!scholarship?.id) return { ...EMPTY_FORM };
  return {
    title: scholarship.title || '',
    provider: scholarship.provider || '',
    country: scholarship.country || '',
    degree: scholarship.degree || '',
    language: scholarship.language || '',
    coverage: scholarship.coverage || '',
    amount: scholarship.amount ?? '',
    deadline: scholarship.deadline ? scholarship.deadline.split('T')[0] : '',
    description: scholarship.description || '',
    requirements: scholarship.requirements || '',
  };
}
