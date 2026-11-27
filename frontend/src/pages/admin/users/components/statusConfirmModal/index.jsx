import Modal from '~/components/legacy/Modal';
import { getStatusConfirmText } from '~/pages/admin/users/helpers';
import { cn } from '~/utils/cn';

// Hộp xác nhận khóa / mở tài khoản
export default function StatusConfirmModal({ confirmModal, onClose, onConfirm, isPending }) {
  const { title, description, confirmLabel, confirmClass } = getStatusConfirmText(confirmModal.user);
  return (
    <Modal open={confirmModal.open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3 mt-6 pb-2">
        <button onClick={onClose} className="btnSecondary btnSm">
          Hủy
        </button>
        <button onClick={onConfirm} disabled={isPending} className={cn('btnSm disabled:opacity-40', confirmClass)}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
