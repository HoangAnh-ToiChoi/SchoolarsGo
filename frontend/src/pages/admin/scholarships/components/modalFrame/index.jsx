import { X } from 'lucide-react';

export default function ModalFrame({ title, onClose, children }) {
  return (
    <div className="modalOverlay">
      <div className="modalContent max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button type="button" onClick={onClose} className="btnGhost p-1.5" aria-label="Đóng">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
