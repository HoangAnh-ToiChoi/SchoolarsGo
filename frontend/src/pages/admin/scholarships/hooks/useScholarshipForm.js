import { useState } from 'react';
import { toScholarshipForm, toScholarshipPayload } from '~/pages/admin/scholarships/helpers';

// Form thêm / sửa học bổng; giá trị đầu lấy một lần khi mở hộp thoại
export function useScholarshipForm(scholarship, { onSave, onClose }) {
  const isEdit = !!scholarship?.id;
  const [initial] = useState(() => toScholarshipForm(scholarship));
  const [form, setForm] = useState(initial);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const target = isEdit ? { id: scholarship.id, initial } : undefined;
    const payload = toScholarshipPayload(form, target);
    // Không đổi gì thì server trả 400 ("cần ít nhất một trường"): đóng hộp thoại là đủ
    const unchanged = isEdit && Object.keys(payload).length === 1;
    if (unchanged) onClose();
    else onSave(payload);
  };

  return { isEdit, initial, form, set, handleSubmit };
}
