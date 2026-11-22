import { forwardRef } from 'react';
import { cn } from '~/utils/cn';

/**
 * Liên kết mở ra ngoài trong tab mới.
 * - Luôn có rel="noopener noreferrer" và target="_blank"
 * - Luôn có văn bản sr-only "(mở trong tab mới)" cho a11y
 * - forwardRef hỗ trợ Radix UI Slot (Button asChild)
 */
const ExternalLink = forwardRef(function ExternalLink(
  { href, children, className, ...props },
  ref
) {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className)}
      {...props}
    >
      {children}
      <span className="sr-only"> (mở trong tab mới)</span>
    </a>
  );
});

export { ExternalLink };
export default ExternalLink;
