import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '~/utils/cn';

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  className,
  contentClassName,
  closeOnOverlay = true,
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn('modalOverlay', className)}
      onClick={() => {
        if (closeOnOverlay) onClose?.();
      }}
      role="presentation"
    >
      <div
        className={cn('modalContent', contentClassName)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
      >
        {(title || description || showCloseButton) && (
          <div className="modalHeader">
            <div>
              {title && <h2 className="modalTitle">{title}</h2>}
              {description && <p className="modalDescription">{description}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="btnGhost btnSm p-2"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;