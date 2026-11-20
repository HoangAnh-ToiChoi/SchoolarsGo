import { useProfile } from '~/hooks/useProfile';
import PageHeader from '~/components/common/pageHeader';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { AlertCircle, UserX } from 'lucide-react';
import ProfileSkeleton from './components/profileSkeleton';
import AccountCard from './components/accountCard';
import SessionList from './components/sessionList';
import ProfileForm from './components/profileForm';
import DocumentSection from './components/documentSection';

export default function ProfilePage({ embedded = false }) {
  const { data, isLoading, isError, refetch } = useProfile();

  // 1. Loading State Guard
  if (isLoading) {
    return <ProfileSkeleton embedded={embedded} />;
  }

  // 2. Error State Guard
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card className="flex flex-col items-center p-8 text-center">
          <AlertCircle className="size-10 text-urgent-fg" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-heading">Không tải được thông tin hồ sơ</h2>
          <p className="mt-1 text-sm text-fg-muted">Đã xảy ra lỗi trong quá trình kết nối máy chủ.</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  const profile = data?.data;

  // 3. Empty / Unauthenticated State Guard
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card className="flex flex-col items-center p-8 text-center">
          <UserX className="size-10 text-fg-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-heading">Vui lòng đăng nhập</h2>
          <p className="mt-1 text-sm text-fg-muted">Bạn cần đăng nhập vào tài khoản để xem và quản lý hồ sơ cá nhân.</p>
        </Card>
      </div>
    );
  }

  // 4. Data State
  const content = (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      {!embedded && (
        <PageHeader
          title="Hồ sơ cá nhân"
          description="Quản lý thông tin học thuật và hồ sơ du học"
        />
      )}
      <AccountCard />
      <SessionList />
      <ProfileForm profile={profile} />
      <DocumentSection />
    </div>
  );

  if (embedded) {
    return content;
  }

  return <div className="min-h-screen bg-canvas pb-16">{content}</div>;
}
