import { useProfile } from '~/hooks/useProfile';
import { useApplications } from '~/hooks/useApplication';
import { useSavedScholarships, useScholarships } from '~/hooks/useScholarship';
import {
  countByStatus, getProfileCompletion, getRecentApplications, getUpcomingDeadlines,
} from '~/pages/dashboard/helpers';

// Bốn nguồn dữ liệu tải song song; "bây giờ" tính một lần cho cả trang
export function useDashboardData() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: appData, isLoading: appsLoading } = useApplications();
  const { data: saved, isLoading: savedLoading } = useSavedScholarships();
  const { data: scholarshipsData, isLoading: scholarshipsLoading } = useScholarships();

  const now = new Date();
  const applications = appData?.data || [];
  const scholarships = scholarshipsData?.data || [];
  const upcomingDeadlines = getUpcomingDeadlines(scholarships, now);

  return {
    isLoading: profileLoading || appsLoading || savedLoading || scholarshipsLoading,
    now,
    applications,
    statusCounts: countByStatus(applications),
    recentApplications: getRecentApplications(applications),
    upcomingDeadlines,
    stats: {
      totalApps: applications.length,
      savedCount: saved?.data?.length ?? 0,
      completion: `${getProfileCompletion(profile)}%`,
      upcomingCount: upcomingDeadlines.length,
    },
  };
}
