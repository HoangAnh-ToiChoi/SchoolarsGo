import { Link } from 'react-router-dom';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import StatusBadge from '~/components/application/statusBadge';
import BackLink from '~/components/common/backLink';
import DeadlineBadge from '~/components/scholarship/deadlineBadge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdownMenu';
import { DELETABLE_STATUSES } from '~/utils/application';
import { formatDate } from '~/utils/format';
import { COUNTRY_LABELS, labelOf, scholarshipPath } from '~/utils/scholarship';
import { CAN_WITHDRAW, NEXT_ACTIONS } from '~/pages/applicationDetail/helper';

// Đầu trang: tên học bổng + trạng thái + hạn nộp bên trái, việc cần làm tiếp bên phải.
// Mọi thông tin chính nằm trên một dải để không phải lia mắt xuống cột bên.
export default function DetailHeader({ application, busy, onStatusChange, onDelete }) {
  const { status, scholarship, applied_at: appliedAt } = application;
  const next = NEXT_ACTIONS[status];
  const canWithdraw = CAN_WITHDRAW.includes(status);
  const canDelete = DELETABLE_STATUSES.includes(status);
  // Trên desktop menu chỉ chứa thao tác đổi trạng thái/xóa; trên điện thoại có thêm "Xem học bổng" cho đủ chỗ
  const hasStatusItems = (next?.more.length ?? 0) > 0 || canWithdraw || canDelete;

  return (
    <header className="flex flex-col gap-4">
      <BackLink to="/applications">Đơn ứng tuyển</BackLink>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-page-title text-fg">{scholarship.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-fg-muted">
            <StatusBadge status={status} />
            {/* Đơn nháp cần biết còn bao lâu; đơn đã nộp thì ngày nộp có ích hơn */}
            {status === 'draft' ? (
              <DeadlineBadge deadline={scholarship.deadline} />
            ) : (
              appliedAt && <span>Nộp ngày {formatDate(appliedAt)}</span>
            )}
            <span className="min-w-0 break-words">
              {[scholarship.provider, labelOf(COUNTRY_LABELS, scholarship.country)].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to={scholarshipPath(scholarship)}>Xem học bổng</Link>
          </Button>
          {next && (
            <Button disabled={busy} onClick={() => onStatusChange(next.primary.status)} className="flex-1 sm:flex-none">
              {next.primary.label}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Thao tác khác"
                disabled={busy}
                className={hasStatusItems ? 'shrink-0' : 'shrink-0 sm:hidden'}
              >
                <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem asChild className="sm:hidden">
                <Link to={scholarshipPath(scholarship)}>Xem học bổng</Link>
              </DropdownMenuItem>
              {hasStatusItems && <DropdownMenuSeparator className="sm:hidden" />}
              {next?.more.map((action) => (
                <DropdownMenuItem key={action.status} onSelect={() => onStatusChange(action.status)}>
                  {action.label}
                </DropdownMenuItem>
              ))}
              {canWithdraw && <DropdownMenuItem onSelect={() => onStatusChange('withdrawn')}>Rút đơn</DropdownMenuItem>}
              {canDelete && (
                <>
                  {(next?.more.length > 0 || canWithdraw) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={onDelete} className="text-urgent-fg focus:bg-urgent-bg focus:text-urgent-fg">
                    Xóa đơn
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
