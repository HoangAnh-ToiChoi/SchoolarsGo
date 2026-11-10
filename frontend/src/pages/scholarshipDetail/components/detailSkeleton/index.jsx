import { Skeleton } from '~/components/ui/skeleton';

// Khung chờ cùng bố cục với trang thật (dải đầu + 4 ô + 2 cột) để trang không nhảy khi tải xong.
// notice: thông báo tải chậm, đặt ngay dưới dải đầu cho dễ thấy.
export default function DetailSkeleton({ notice }) {
  return (
    <div>
      <div aria-hidden="true" className="-mx-8 -mt-8 border-b border-line bg-brand-50 px-8 pb-[26px] pt-[22px]">
        <Skeleton className="h-4 w-56" />
        <div className="mt-[18px] flex gap-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-2 h-5 w-1/3" />
        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[86px] rounded-inner bg-surface" />
          ))}
        </div>
      </div>
      {notice && <div className="mt-6">{notice}</div>}
      <div aria-hidden="true" className="mt-6 grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[46px] w-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="order-first h-[190px] rounded-tile lg:order-none" />
      </div>
    </div>
  );
}
