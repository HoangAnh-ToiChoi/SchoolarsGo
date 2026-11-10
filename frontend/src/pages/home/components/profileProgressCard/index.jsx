import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useProfile } from '~/hooks/useProfile';
import { selectIsAuthenticated } from '~/store/slices/authSlice';

// Các trường hồ sơ mà thuật toán gợi ý cần
const REQUIRED_FIELDS = [
  { key: 'gpa', label: 'GPA' },
  { key: 'english_level', label: 'trình độ tiếng Anh' },
  { key: 'target_country', label: 'quốc gia mục tiêu' },
  { key: 'target_major', label: 'ngành mục tiêu' },
  { key: 'target_degree', label: 'bậc học mục tiêu' },
];

export default function ProfileProgressCard() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data } = useProfile({ enabled: isAuthenticated });
  const profile = data?.data ?? {};
  const missing = REQUIRED_FIELDS.filter((f) => !profile[f.key]);
  const percent = Math.round(((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100);

  // Dải ngang gọn ở đầu trang chủ: không chiếm cột riêng để lưới học bổng đủ 3 thẻ một hàng
  return (
    <Card className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5">
      <div className="min-w-0 flex-[1_1_240px]">
        <h2 className="text-block-title">{isAuthenticated ? 'Hoàn thiện hồ sơ' : 'Nhận gợi ý học bổng'}</h2>
        <p className="mt-0.5 truncate text-[13px] text-fg-muted">
          {!isAuthenticated
            ? 'Đăng nhập và điền hồ sơ để hệ thống gợi ý học bổng hợp với bạn.'
            : missing.length > 0
              ? `Còn thiếu: ${missing.map((f) => f.label).join(', ')}`
              : 'Hồ sơ đã đủ thông tin để gợi ý học bổng.'}
        </p>
      </div>

      {isAuthenticated && (
        <div className="flex flex-[0_1_200px] items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Mức hoàn thiện hồ sơ"
          >
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[13px] font-bold text-brand-700">{percent}%</span>
        </div>
      )}

      <Button asChild variant="outline" className="h-9 shrink-0">
        <Link to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? 'Cập nhật hồ sơ' : 'Đăng nhập'}</Link>
      </Button>
    </Card>
  );
}
