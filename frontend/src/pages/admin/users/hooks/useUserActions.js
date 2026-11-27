import { useState } from 'react';
import { useUpdateUserRole, useUpdateUserStatus } from '~/hooks/useAdmin';

const CLOSED = { open: false, user: null };

// Đổi role (hỏi bằng confirm của trình duyệt) và khóa / mở tài khoản (hỏi bằng hộp xác nhận)
export function useUserActions() {
  const [confirmModal, setConfirmModal] = useState(CLOSED);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const changeRole = (userId, newRole) => {
    if (!window.confirm(`Đổi role thành "${newRole}"?`)) return;
    updateRole.mutate({ id: userId, role: newRole });
  };

  const askToggleStatus = (user) => setConfirmModal({ open: true, user });
  const closeConfirm = () => setConfirmModal(CLOSED);

  const confirmStatus = () => {
    const { user } = confirmModal;
    // Giữ hành vi cũ: đảo thẳng is_active (thiếu trường thì gửi isActive = true)
    updateStatus.mutate({ id: user.id, isActive: !user.is_active });
    setConfirmModal(CLOSED);
  };

  return {
    changeRole,
    isRolePending: updateRole.isPending,
    askToggleStatus,
    isStatusPending: updateStatus.isPending,
    confirmModal,
    closeConfirm,
    confirmStatus,
  };
}
