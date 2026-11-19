import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowTopRightOnSquareIcon, DocumentPlusIcon } from '@heroicons/react/16/solid';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import SaveButton from '~/components/scholarship/saveButton';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useCreateApplication } from '~/hooks/useApplication';
import { cn } from '~/utils/cn';
import { formatDate } from '~/utils/format';
import { getDeadlineInfo } from '~/utils/scholarship';
import { safeUrl } from '~/utils/security';
import { selectIsAuthenticated } from '~/store/slices/authSlice';

const TONE_BOX = {
  urgent: 'bg-urgent-bg text-urgent-fg',
  soon: 'bg-soon-bg text-soon-fg',
  open: 'bg-open-bg text-open-fg',
};

// Nút chính: ưu tiên link nộp đơn chính thức; chưa có thì mở bài đăng gốc (nơi cào dữ liệu về).
// URL đến từ web ngoài nên luôn qua safeUrl(); không hợp lệ thì coi như không có.
function getPrimaryLink({ application_url: applicationUrl, source_url: sourceUrl }) {
  const apply = safeUrl(applicationUrl);
  if (apply) return { href: apply, label: 'Nộp đơn trên trang chính thức' };
  const source = safeUrl(sourceUrl);
  if (source) return { href: source, label: 'Xem bài đăng gốc' };
  return null;
}

// Khung hành động dính bên phải: đếm ngược hạn nộp, nút nộp đơn, tạo đơn ứng tuyển, lưu.
export default function ActionPanel({ scholarship }) {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const createApplication = useCreateApplication();
  const { daysLeft, tone } = getDeadlineInfo(scholarship.deadline);
  const primary = getPrimaryLink(scholarship);
  // Bài đăng gốc chỉ hiện thành liên kết phụ khi nút chính đang dùng link nộp đơn
  const sourceUrl = safeUrl(scholarship.source_url);
  const showSourceLink = sourceUrl && primary?.href !== sourceUrl;

  async function handleCreateApplication() {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tạo đơn ứng tuyển');
      return;
    }
    try {
      await createApplication.mutateAsync({ scholarship_id: scholarship.id });
      navigate('/applications');
    } catch {
      // Thông báo lỗi đã hiện trong useCreateApplication
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Card role="region" aria-label="Nộp hồ sơ" className="p-5">
        {daysLeft === null ? (
          <div className="flex items-center gap-3.5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-tile bg-hover text-fg-muted">
              <CalendarDaysIcon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-block-title text-heading">Chưa công bố hạn nộp</p>
              <p className="mt-0.5 text-[12.5px] text-fg-muted">Nhà tài trợ chưa đăng mốc thời gian chính thức.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            <span className={cn('flex size-14 shrink-0 flex-col items-center justify-center rounded-tile', TONE_BOX[tone])}>
              <span className="text-[22px] font-bold leading-none">{daysLeft}</span>
              <span className="text-[11px] font-semibold">ngày</span>
            </span>
            <div>
              <p className="text-block-title text-heading">Hạn nộp {formatDate(scholarship.deadline)}</p>
              <p className="mt-0.5 text-[12.5px] text-fg-muted">
                {daysLeft === 0 ? 'Hôm nay là ngày cuối cùng' : `Còn ${daysLeft} ngày để chuẩn bị hồ sơ`}
              </p>
            </div>
          </div>
        )}

        {primary && (
          <Button asChild size="lg" className="mt-4 w-full rounded-inner">
            <a href={primary.href} target="_blank" rel="noopener noreferrer">
              {primary.label}
              <ArrowTopRightOnSquareIcon aria-hidden="true" />
              <span className="sr-only">(mở trong tab mới)</span>
            </a>
          </Button>
        )}

        <div className={cn('flex flex-wrap gap-2', primary ? 'mt-2.5' : 'mt-4')}>
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateApplication}
            disabled={createApplication.isPending}
            className="h-[42px] flex-1 gap-1.5 px-3 text-[13.5px]"
          >
            <DocumentPlusIcon aria-hidden="true" />
            {createApplication.isPending ? 'Đang tạo…' : 'Tạo đơn ứng tuyển'}
          </Button>
          <SaveButton scholarshipId={scholarship.id} withLabel className="flex-1" />
        </div>
      </Card>

      {/* Cột này sẽ thêm khối "so điều kiện với hồ sơ của bạn" và "nhắc hạn nộp"; chưa hiện vì backend chưa hỗ trợ hai tính năng đó */}
      {(scholarship.source || showSourceLink) && (
        <p className="text-center text-xs text-fg-muted">
          {scholarship.source && <>Nguồn: {scholarship.source}</>}
          {scholarship.source && showSourceLink && ' · '}
          {showSourceLink && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[4px] font-semibold text-brand-600 outline-none hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Xem bài đăng gốc
              <span className="sr-only"> (mở trong tab mới)</span>
            </a>
          )}
        </p>
      )}
    </div>
  );
}
