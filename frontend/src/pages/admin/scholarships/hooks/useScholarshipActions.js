import { useState } from 'react';
import {
  useAdminCreateScholarship, useAdminUpdateScholarship,
  useAdminToggleFeatured, useAdminDeleteScholarship,
} from '~/hooks/useAdmin';

// Thêm / sửa (qua hộp thoại), đặt nổi bật, xóa học bổng
export function useScholarshipActions() {
  const [modal, setModal] = useState(null);
  const createScholarship = useAdminCreateScholarship();
  const updateScholarship = useAdminUpdateScholarship();
  const toggleFeatured = useAdminToggleFeatured();
  const deleteScholarship = useAdminDeleteScholarship();

  const save = (payload) => {
    const mutation = payload.id ? updateScholarship : createScholarship;
    mutation.mutate(payload, { onSuccess: () => setModal(null) });
  };

  const remove = (s) => {
    if (!window.confirm(`Xóa học bổng "${s.title}"? Hành động này không thể hoàn tác.`)) return;
    deleteScholarship.mutate(s.id);
  };

  const toggle = (s) => toggleFeatured.mutate({ id: s.id, isFeatured: !s.is_featured });

  return {
    modal,
    openCreate: () => setModal({ mode: 'create' }),
    openEdit: (scholarship) => setModal({ mode: 'edit', scholarship }),
    closeModal: () => setModal(null),
    save,
    isSaving: createScholarship.isPending || updateScholarship.isPending,
    remove,
    isDeleting: deleteScholarship.isPending,
    toggle,
    isToggling: toggleFeatured.isPending,
  };
}
