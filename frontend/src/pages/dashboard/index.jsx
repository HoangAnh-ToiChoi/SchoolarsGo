import { useState } from 'react';
import ProfilePage from '~/pages/profile';
import LoadingSpinner from '~/components/common/LoadingSpinner';
import OverviewTab from '~/pages/dashboard/components/overviewTab';
import TabButton from '~/pages/dashboard/components/tabButton';
import { DASHBOARD_TABS } from '~/pages/dashboard/constants';
import { useDashboardData } from '~/pages/dashboard/hooks';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const data = useDashboardData();

  if (data.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-ink-950 pb-24">
      <div className="containerPage pt-8">
        <div className="flex border-b border-ink-800 mb-6">
          {DASHBOARD_TABS.map((tab) => (
            <TabButton key={tab.id} id={tab.id} label={tab.label} active={activeTab === tab.id} onClick={setActiveTab} />
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab data={data} onOpenProfile={() => setActiveTab('profile')} />}
      </div>

      {/* Tab hồ sơ rộng hết trang, tự có containerNarrow bên trong */}
      {activeTab === 'profile' && <ProfilePage embedded />}
    </div>
  );
}
