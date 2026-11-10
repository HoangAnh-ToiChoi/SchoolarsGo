import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline';
import { Button } from '~/components/ui/button';
import { useSavedScholarships, useToggleSaveScholarship } from '~/hooks/useScholarship';
import { selectIsAuthenticated } from '~/store/slices/authSlice';
import { cn } from '~/utils/cn';

// Nút lưu/bỏ lưu học bổng. Chưa đăng nhập thì nhắc đăng nhập.
// withLabel: hiện cả chữ (trang chi tiết); mặc định chỉ có icon (thẻ học bổng).
export default function SaveButton({ scholarshipId, withLabel = false, className }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data: saved } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();
  const isSaved = (saved?.data ?? []).some(
    (item) => item.scholarship?.id === scholarshipId || item.scholarship_id === scholarshipId
  );

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu học bổng');
      return;
    }
    toggleSave.mutate({ scholarshipId, isSaved });
  };

  const Icon = isSaved ? BookmarkIcon : BookmarkOutlineIcon;
  return (
    <Button
      type="button"
      variant="outline"
      size={withLabel ? 'default' : 'icon'}
      onClick={handleClick}
      disabled={toggleSave.isPending}
      // Có chữ thì chữ đã là tên nút; chỉ có icon thì cần aria-label
      aria-label={withLabel ? undefined : isSaved ? 'Bỏ lưu học bổng' : 'Lưu học bổng'}
      aria-pressed={isSaved}
      className={cn(
        'rounded-control border-line text-fg-secondary shadow-none hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600',
        withLabel ? 'h-[42px] gap-1.5 px-3 text-[13.5px] font-semibold' : 'size-8',
        isSaved && 'border-brand-200 bg-brand-50 text-brand-600',
        className
      )}
    >
      <Icon aria-hidden="true" />
      {withLabel && (isSaved ? 'Đã lưu' : 'Lưu học bổng')}
    </Button>
  );
}
