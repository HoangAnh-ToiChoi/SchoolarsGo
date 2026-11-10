import { useMemo } from 'react';
import { useApplications } from '~/hooks/useApplication';
import { useSavedScholarships } from '~/hooks/useScholarship';
import { buildDeadlineEvents } from '~/pages/deadlines/helper';

// Mốc thời gian của riêng người dùng cho trang Lịch deadline
export function useDeadlineEvents() {
  const saved = useSavedScholarships();
  const applications = useApplications({ limit: 50 });

  const events = useMemo(
    () => buildDeadlineEvents(saved.data?.data ?? [], applications.data?.data ?? []),
    [saved.data, applications.data]
  );

  return {
    events,
    isLoading: saved.isLoading || applications.isLoading,
    isError: saved.isError || applications.isError,
    refetch: () => {
      saved.refetch();
      applications.refetch();
    },
  };
}
