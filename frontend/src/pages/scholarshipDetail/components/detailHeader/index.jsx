import BackLink from '~/components/common/backLink';
import { Badge } from '~/components/ui/badge';
import DeadlineBadge from '~/components/scholarship/deadlineBadge';
import { cn } from '~/utils/cn';
import { ROUTES } from '~/utils/routes';
import { getScope, SCOPE_LABELS } from '~/utils/scholarship';
import { SCOPE_VARIANT } from '~/pages/scholarshipDetail/constants';
import { buildHeaderTiles } from '~/pages/scholarshipDetail/helpers';

// Dải đầu trang chi tiết: nút quay lại → nhãn → tên + nhà tài trợ → 4 ô thông tin chính.
// Nền tím rất nhạt (không gradient), tràn hết bề ngang vùng nội dung.
export default function DetailHeader({ scholarship }) {
  const { title, provider, deadline } = scholarship || {};
  const scope = getScope(scholarship || {});
  const tiles = buildHeaderTiles(scholarship);

  return (
    <section className="-mx-4 -mt-4 border-b border-line bg-brand-50 px-4 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 pb-[26px] pt-[22px]" aria-labelledby="scholarship-title">
      <BackLink to={ROUTES.home}>Trang chủ</BackLink>

      <div className="mt-4 flex flex-wrap gap-2">
        <DeadlineBadge deadline={deadline} />
        <Badge variant={SCOPE_VARIANT[scope] || 'abroad'}>{SCOPE_LABELS[scope]}</Badge>
      </div>

      <h1 id="scholarship-title" className="mt-3 break-words text-page-title text-heading sm:text-[30px] sm:leading-[38px]">
        {title}
      </h1>
      {provider && <p className="mt-1.5 text-sm text-fg-secondary">{provider}</p>}

      <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-2.5 sm:gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="min-w-0 rounded-inner border border-line bg-surface px-4 py-3 sm:px-4 sm:py-3.5">
            <dt className="text-xs font-medium text-fg-muted">{tile.label}</dt>
            <dd className={cn('mt-1 truncate text-base font-semibold leading-5 text-heading', tile.valueClass)} title={tile.value}>
              {tile.value}
            </dd>
            {tile.note && (
              <dd className="mt-0.5 truncate text-xs text-fg-muted" title={tile.note}>
                {tile.note}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
