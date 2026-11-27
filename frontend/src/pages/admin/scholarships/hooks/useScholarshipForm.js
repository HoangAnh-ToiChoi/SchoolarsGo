import { useState } from 'react';
import { toScholarshipForm, toScholarshipPayload } from '~/pages/admin/scholarships/helpers';

// Form thêm / sửa học bổng; giá trị đầu lấy một lần khi mở hộp thoại
export function useScholarshipForm(scholarship, onSave) {
  const isEdit = !!scholarship?.id;
  const [form, setForm] = useState(() => toScholarshipForm(scholarship));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(toScholarshipPayload(form, isEdit ? scholarship.id : undefined));
  };

  return { isEdit, form, set, handleSubmit };
}
