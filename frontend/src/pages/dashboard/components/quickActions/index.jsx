import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/legacy';
import { ROUTES } from '~/utils/routes';

export default function QuickActions({ onOpenProfile }) {
  const navigate = useNavigate();
  return (
    <section>
      <h2 className="heading-3 mb-4">Hành động nhanh</h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Button fullWidth onClick={() => navigate(ROUTES.home)} className="justify-center">
          Tìm học bổng mới
        </Button>
        <Button fullWidth variant="secondary" onClick={onOpenProfile} className="justify-center">
          Tải tài liệu lên
        </Button>
        <Button fullWidth variant="secondary" onClick={onOpenProfile} className="justify-center">
          Hoàn thiện profile
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate(ROUTES.applications)} className="justify-center">
          Xem tất cả ứng tuyển
        </Button>
      </div>
    </section>
  );
}
