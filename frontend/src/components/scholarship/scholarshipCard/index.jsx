import { Link } from 'react-router-dom';
import { Badge } from '~/components/ui/badge';
import DeadlineBadge from '~/components/scholarship/deadlineBadge';
import SaveButton from '~/components/scholarship/saveButton';
import { cn } from '~/utils/cn';
import { COUNTRY_LABELS, DEGREE_LABELS, getScope, labelOf, scholarshipPath, SCOPE_LABELS } from '~/utils/scholarship';

// Thẻ học bổng — mắt đọc từ trên xuống:
// 1. nhãn hạn nộp + phạm vi (+ nút lưu ở góc phải)
// 2. tiêu đề + nhà tài trợ
// 3. 3 ô: Quốc gia | Bậc học | Tài trợ
// 4. "Xem chi tiết" căn giữa ở đáy (chỉ là chữ gợi ý, không phải nút)
// Cả thẻ là một <Link> tới /scholarships/<slug>. Nút lưu nằm NGOÀI link (đặt chồng lên góc thẻ)
// vì HTML không cho đặt nút bên trong thẻ <a>.
export default function ScholarshipCard({ scholarship }) {
  const { id, title, provider, country, degree, coverage, deadline } = scholarship;
  const scope = getScope(scholarship);

  return (
    <div className="group relative flex w-full transition-transform duration-200 hover:-translate-y-[3px]">
      <Link
        to={scholarshipPath(scholarship)}
        className="flex w-full flex-col overflow-hidden rounded-tile border border-line bg-card shadow-tile outline-none transition-[box-shadow,border-color] duration-200 group-hover:border-brand-200 group-hover:shadow-tile-hover focus-visible:ring-2 focus-visible:ring-brand-600/40"
      >
        {/* pr-14 chừa chỗ cho nút lưu đặt chồng ở góc phải */}
        <div className="flex flex-wrap items-center gap-1.5 pl-5 pr-14 pt-[18px]">
          <DeadlineBadge deadline={deadline} />
          <Badge variant={scope === 'domestic' ? 'domestic' : 'abroad'}>{SCOPE_LABELS[scope]}</Badge>
        </div>

        <div className="px-5 pt-3.5">
          <h2 className="text-card-title text-heading transition-colors duration-200 group-hover:text-brand-600">{title}</h2>
          <p className="mt-1 text-[13px] text-fg-muted">{provider}</p>
        </div>

        <dl className="mx-5 mt-4 grid grid-cols-3 rounded-inner border border-line-soft bg-canvas">
          <Fact label="Quốc gia" value={labelOf(COUNTRY_LABELS, country)} />
          <Fact label="Bậc học" value={labelOf(DEGREE_LABELS, degree)} className="border-l border-line-soft" />
          <Fact label="Tài trợ" value={coverage} className="border-l border-line-soft" />
        </dl>

        {/* đẩy dòng "Xem chi tiết" xuống đáy để các thẻ cùng hàng thẳng nhau */}
        <div className="min-h-[18px] flex-1" />
        <span className="flex h-[46px] items-center justify-center gap-1.5 border-t border-line-soft text-[13.5px] font-semibold text-fg-secondary transition-colors duration-200 group-hover:bg-brand-50 group-hover:text-brand-600">
          Xem chi tiết
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </span>
      </Link>

      <SaveButton scholarshipId={id} className="absolute right-5 top-4 z-10" />
    </div>
  );
}

function Fact({ label, value, className }) {
  return (
    <div className={cn('min-w-0 px-3 py-2.5', className)}>
      <dt className="text-[11.5px] text-fg-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[13.5px] font-semibold text-fg">{value || '—'}</dd>
    </div>
  );
}
