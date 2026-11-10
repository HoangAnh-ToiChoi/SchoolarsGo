import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import DeadlineBadge from '~/components/scholarship/deadlineBadge';
import StatusBadge from '~/pages/applications/components/statusBadge';
import { formatDate } from '~/utils/format';
import { COUNTRY_LABELS, labelOf } from '~/utils/scholarship';
import { getChecklistProgress } from '~/pages/applications/helper';

// Một dòng trong danh sách đơn: học bổng | tiến độ hồ sơ | trạng thái. Cả dòng là link tới trang chi tiết đơn.
// Từ md là 3 cột thẳng hàng với tiêu đề cột; nhỏ hơn thì tiến độ + trạng thái xuống dòng dưới.
export default function ApplicationRow({ application }) {
  const { id, status, applied_at: appliedAt, checklist, scholarship } = application;
  const { done, total } = getChecklistProgress(checklist);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <li>
      <Link
        to={`/applications/${id}`}
        className="group flex flex-col gap-3 px-4 py-4 outline-none transition-colors duration-200 hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 sm:px-5 md:flex-row md:items-center md:gap-6"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-heading transition-colors duration-200 group-hover:text-brand-600">
            {scholarship.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-fg-muted">
            <span className="min-w-0 truncate">
              {[scholarship.provider, labelOf(COUNTRY_LABELS, scholarship.country)].filter(Boolean).join(' · ')}
            </span>
            {/* Đơn nháp cần biết còn bao lâu để nộp; đơn đã nộp thì hạn không còn quan trọng */}
            {status === 'draft' ? (
              <DeadlineBadge deadline={scholarship.deadline} />
            ) : (
              appliedAt && <span>Nộp ngày {formatDate(appliedAt)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:w-[340px] md:shrink-0">
          <div className="w-[160px]">
            {/* Từ md đã có tiêu đề cột "Giấy tờ" nên ẩn nhãn lặp lại ở từng dòng */}
            <div className="flex justify-between text-xs">
              <span className="text-fg-muted md:hidden">Giấy tờ</span>
              <span className="ml-auto font-semibold text-fg">{total ? `${done}/${total} đã xong` : 'Chưa có danh sách'}</span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track"
              role="progressbar"
              aria-label="Tiến độ chuẩn bị hồ sơ"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={percent === 100 ? 'h-full rounded-full bg-open-fg' : 'h-full rounded-full bg-brand-600'}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ChevronRightIcon
              className="hidden size-5 text-fg-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600 md:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
