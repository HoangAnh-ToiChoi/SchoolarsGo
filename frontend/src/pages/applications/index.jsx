import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import PageHeader from '~/components/common/pageHeader';
import SlowLoading from '~/components/common/slowLoading';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useApplications } from '~/hooks/useApplication';
import { useSlowLoading } from '~/hooks/useSlowLoading';
import { MAX_LIMIT } from '~/utils/constants';
import { sortByDeadline } from '~/utils/scholarship';
import ApplicationRow from '~/pages/applications/components/applicationRow';
import ApplicationRowSkeleton from '~/pages/applications/components/applicationRowSkeleton';
import { inStage, STAGES } from '~/pages/applications/helper';

// Đơn ứng tuyển: dạng danh sách (khác lưới thẻ của trang chủ/đã lưu) vì việc chính ở đây là
// theo dõi tiến độ từng đơn. Lọc theo chặng ở máy khách để số đếm trên tab luôn đúng.
export default function ApplicationsPage() {
  const [stageValue, setStageValue] = useState('all');
  const { data, isLoading, isError, refetch } = useApplications({ limit: MAX_LIMIT });
  const isSlow = useSlowLoading(isLoading);

  const all = (data?.data ?? []).filter((app) => app.scholarship);
  // Đơn nháp (còn phải làm) lên đầu, hạn gần trước; đơn đã nộp giữ thứ tự mới tạo trước
  const drafts = sortByDeadline(all.filter((app) => app.status === 'draft'), (app) => app.scholarship.deadline);
  const ordered = [...drafts, ...all.filter((app) => app.status !== 'draft')];
  const stage = STAGES.find((s) => s.value === stageValue);
  const visible = ordered.filter((app) => inStage(stage, app));

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-labelledby="applications-title">
      <PageHeader
        title={<span id="applications-title">Đơn ứng tuyển</span>}
        description="Theo dõi tiến độ hồ sơ và kết quả từng đơn"
        actions={
          <Tabs value={stageValue} onValueChange={setStageValue} className="max-w-full">
            <TabsList className="max-w-full justify-start overflow-x-auto">
              {STAGES.map((s) => (
                <TabsTrigger key={s.value} value={s.value} className="gap-1.5 px-3">
                  {s.label}
                  {!isLoading && (
                    <span className="text-xs font-semibold text-fg-muted">{all.filter((app) => inStage(s, app)).length}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      {isSlow && <SlowLoading />}

      {isError ? (
        <Card className="p-8 text-center">
          <p className="font-semibold">Không tải được đơn ứng tuyển</p>
          <Button variant="link" onClick={() => refetch()} className="mt-1">
            Thử lại
          </Button>
        </Card>
      ) : !isLoading && visible.length === 0 ? (
        <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <DocumentTextIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-block-title text-heading">
            {all.length === 0 ? 'Chưa có đơn ứng tuyển nào' : 'Không có đơn nào ở mục này'}
          </p>
          <p className="mt-1 max-w-sm text-sm text-fg-muted">
            {all.length === 0
              ? 'Mở một học bổng và bấm "Ứng tuyển" để tạo đơn, kèm danh sách giấy tờ cần chuẩn bị.'
              : 'Chọn mục khác để xem các đơn còn lại.'}
          </p>
          {all.length === 0 && (
            <Button asChild className="mt-5">
              <Link to="/">Tìm học bổng</Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Tiêu đề cột chỉ hiện khi đủ rộng để các dòng xếp thành 3 cột */}
          <div className="hidden items-center gap-6 border-b border-line bg-canvas px-5 py-2.5 text-xs font-medium text-fg-muted md:flex">
            <span className="flex-1">Học bổng</span>
            <span className="flex w-[340px] shrink-0 justify-between">
              <span className="w-[160px]">Giấy tờ</span>
              <span className="pr-7">Trạng thái</span>
            </span>
          </div>
          <ul className="divide-y divide-line-soft">
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => <ApplicationRowSkeleton key={i} />)
              : visible.map((app) => <ApplicationRow key={app.id} application={app} />)}
          </ul>
        </Card>
      )}
    </section>
  );
}
