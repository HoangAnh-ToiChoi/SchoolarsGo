import { ArrowTopRightOnSquareIcon, DocumentPlusIcon } from '@heroicons/react/16/solid';
import ExternalLink from '~/components/common/externalLink';
import SaveButton from '~/components/scholarship/saveButton';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { cn } from '~/utils/cn';
import DeadlineCountdown from '~/pages/scholarshipDetail/components/deadlineCountdown';
import { getPrimaryLink } from '~/pages/scholarshipDetail/helpers';
import { useCreateApplicationAction } from '~/pages/scholarshipDetail/hooks';

// Khung hành động dính bên phải: đếm ngược hạn nộp, nút nộp đơn, tạo đơn ứng tuyển, lưu.
export default function ActionPanel({ scholarship }) {
  const { primary, sourceUrl, showSourceLink } = getPrimaryLink(scholarship);
  const { handleCreateApplication, isPending } = useCreateApplicationAction(scholarship?.id);

  return (
    <div className="flex flex-col gap-3.5">
      <Card role="region" aria-label="Nộp hồ sơ" className="p-5">
        <DeadlineCountdown deadline={scholarship?.deadline} />

        {primary?.isExternal && primary?.href && (
          <Button asChild className="mt-4 h-10 w-full rounded-inner text-sm">
            <ExternalLink href={primary.href}>
              {primary.label}
              <ArrowTopRightOnSquareIcon aria-hidden="true" />
            </ExternalLink>
          </Button>
        )}

        <div className={cn('flex flex-wrap gap-2', primary?.isExternal ? 'mt-2.5' : 'mt-4')}>
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateApplication}
            disabled={isPending}
            className="h-10 flex-1 gap-1.5 px-3 text-sm"
          >
            <DocumentPlusIcon aria-hidden="true" />
            {isPending ? 'Đang tạo…' : 'Tạo đơn ứng tuyển'}
          </Button>
          <SaveButton scholarshipId={scholarship?.id} withLabel className="h-10 flex-1" />
        </div>
      </Card>

      {(scholarship?.source || showSourceLink) && (
        <p className="text-center text-xs text-fg-muted">
          {scholarship?.source && <>Nguồn: {scholarship.source}</>}
          {scholarship?.source && showSourceLink && ' · '}
          {showSourceLink && (
            <ExternalLink
              href={sourceUrl}
              className="rounded-control font-semibold text-brand-600 outline-none hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Xem bài đăng gốc
            </ExternalLink>
          )}
        </p>
      )}
    </div>
  );
}
