import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { Badge } from '~/components/ui/badge';
import DeadlineBadge from '~/components/scholarship/deadlineBadge';
import { cn } from '~/utils/cn';
import { formatCurrency, formatDate } from '~/utils/format';
import { COUNTRY_LABELS, DEGREE_LABELS, getDeadlineInfo, getScope, labelOf, SCOPE_LABELS } from '~/utils/scholarship';

const TONE_TEXT = { urgent: 'text-urgent-fg', soon: 'text-soon-fg', open: 'text-open-fg', neutral: 'text-heading' };

// Dải đầu trang chi tiết: đường dẫn → nhãn → tên + nhà tài trợ → 4 ô thông tin chính.
// Nền tím rất nhạt (không gradient), tràn hết bề ngang vùng nội dung.
export default function DetailHeader({ scholarship }) {
  const { title, provider, country, city, language, degree, intake, field_of_study: field, coverage, amount, currency, deadline } = scholarship;
  const scope = getScope(scholarship);
  const { daysLeft, tone } = getDeadlineInfo(deadline);

  const tiles = [
    { label: 'Quốc gia', value: labelOf(COUNTRY_LABELS, country), note: [city, language && `Ngôn ngữ: ${language}`].filter(Boolean).join(' · ') },
    { label: 'Bậc học', value: labelOf(DEGREE_LABELS, degree), note: intake ? `Nhập học ${intake}` : field },
    { label: 'Tài trợ', value: coverage || 'Chưa rõ', note: amount ? formatCurrency(amount, currency) : null },
    {
      label: 'Hạn nộp',
      value: daysLeft === null ? 'Chưa công bố' : daysLeft === 0 ? 'Hết hạn hôm nay' : `còn ${daysLeft} ngày`,
      note: daysLeft === null ? 'Theo dõi bài đăng gốc' : formatDate(deadline),
      valueClass: TONE_TEXT[tone],
    },
  ];

  return (
    <section className="-mx-4 -mt-4 border-b border-line bg-brand-50 px-4 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 pb-[26px] pt-[22px]" aria-labelledby="scholarship-title">
      <nav aria-label="Đường dẫn" className="flex min-w-0 items-center gap-2 text-[13px] text-fg-muted">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-control font-semibold text-fg-secondary outline-none transition-colors duration-150 hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/40"
        >
          <ArrowLeftIcon className="size-[15px]" aria-hidden="true" />
          Trang chủ
        </Link>
        <ChevronRightIcon className="size-4 shrink-0" aria-hidden="true" />
        <span aria-current="page" className="truncate text-fg">
          {title}
        </span>
      </nav>

      <div className="mt-[18px] flex flex-wrap gap-1.5">
        <DeadlineBadge deadline={deadline} />
        <Badge variant={scope === 'domestic' ? 'domestic' : 'abroad'}>{SCOPE_LABELS[scope]}</Badge>
        {coverage && <Badge variant="neutral">{coverage}</Badge>}
      </div>
      <h1 id="scholarship-title" className="mt-3 break-words text-page-title text-heading sm:text-[30px] sm:leading-[38px]">
        {title}
      </h1>
      {provider && <p className="mt-2 text-[15px] text-fg-secondary">{provider}</p>}

      <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="min-w-0 rounded-inner border border-line bg-surface px-[18px] py-4">
            <dt className="text-xs text-fg-muted">{tile.label}</dt>
            <dd className={cn('mt-1 truncate text-lg font-bold leading-6 text-heading', tile.valueClass)}>{tile.value}</dd>
            {tile.note && <dd className="mt-0.5 truncate text-[12.5px] text-fg-muted">{tile.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
