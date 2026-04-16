import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

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
      className={cn('modal-overlay', className)}
      onClick={() => {
        if (closeOnOverlay) onClose?.();
      }}
      role="presentation"
    >
      <div
        className={cn('modal-content', contentClassName)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
      >
        {(title || description || showCloseButton) && (
          <div className="modal-header">
            <div>
              {title && <h2 className="modal-title">{title}</h2>}
              {description && <p className="modal-description">{description}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="btn-ghost btn-sm p-2"
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