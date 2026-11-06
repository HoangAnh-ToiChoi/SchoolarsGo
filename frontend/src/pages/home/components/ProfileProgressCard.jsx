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

  return (
    <Card className="flex flex-col gap-3.5 rounded-tile border-line p-5 shadow-tile">
      <div>
        <h2 className="text-block-title">{isAuthenticated ? 'Hoàn thiện hồ sơ' : 'Nhận gợi ý học bổng'}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          {isAuthenticated
            ? 'Hồ sơ đủ thông tin thì gợi ý học bổng chính xác hơn.'
            : 'Đăng nhập và điền hồ sơ để hệ thống gợi ý học bổng hợp với bạn.'}
        </p>
      </div>

      {isAuthenticated && (
        <>
          <div className="flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFEFF2]"
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
          {missing.length > 0 && (
            <p className="text-[13px] text-fg-secondary">
              Còn thiếu: <strong className="font-semibold text-fg">{missing.map((f) => f.label).join(', ')}</strong>
            </p>
          )}
        </>
      )}

      <Button asChild variant="outline" className="h-[38px] rounded-inner border-line font-semibold shadow-none hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600">
        <Link to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? 'Cập nhật hồ sơ' : 'Đăng nhập'}</Link>
      </Button>
    </Card>
  );
}
