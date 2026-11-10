import { Skeleton } from '~/components/ui/skeleton';

export default function ApplicationRowSkeleton() {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:flex-row md:items-center md:gap-6" aria-hidden="true">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5 bg-track" />
        <Skeleton className="h-3.5 w-2/5 bg-track" />
      </div>
      <div className="flex items-center justify-between gap-4 md:w-[340px]">
        <Skeleton className="h-6 w-[160px] bg-track" />
        <Skeleton className="h-6 w-20 bg-track" />
      </div>
    </li>
  );
}
