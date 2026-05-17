import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap, GitCompare } from 'lucide-react';
import { cn, formatCurrency, formatDate, getDaysUntilDeadline, getDeadlineUrgency } from '../utils/helpers';
import { useComparisonStore } from '../stores/comparisonStore';
import { useToggleSaveScholarship, useSavedScholarships } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';

const ACCENT = {
  critical: 'from-danger-500 to-danger-400',
  urgent:   'from-warning-500 to-warning-400',
  soon:     'from-yellow-400 to-yellow-300',
  expired:  'from-gray-300 to-gray-200',
  default:  'from-primary-500 to-secondary-400',
};

const DEADLINE_BADGE = {
  critical: { cls: 'bg-danger-50 text-danger-700 animate-pulse' },
  urgent:   { cls: 'bg-warning-50 text-warning-700' },
  soon:     { cls: 'bg-yellow-50 text-yellow-700' },
  expired:  { cls: 'bg-gray-100 text-gray-400' },
};

const ScholarshipCard = ({ scholarship, index = 0 }) => {
  const { id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured } = scholarship;
  const toggle = useComparisonStore((s) => s.toggle);
  const isSelected = useComparisonStore((s) => s.isSelected(id));
  const itemCount = useComparisonStore((s) => s.items.length);
  const { isAuthenticated } = useAuthStore();
  const { data: savedData } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();
  const navigate = useNavigate();

  const isSaved = savedData?.data?.some((item) => item.scholarship?.id === id);

  const handleSave = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleSave.mutate({ scholarshipId: id, isSaved });
  };

  const urgency = getDeadlineUrgency(deadline);
  const days = getDaysUntilDeadline(deadline);
  const accentGradient = ACCENT[urgency] || ACCENT.default;
  const badge = urgency && DEADLINE_BADGE[urgency];
  const badgeText = urgency === 'expired' ? 'Hết hạn' : `Còn ${days} ngày${urgency === 'critical' ? '!' : ''}`;

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
    >
      <Link
        to={`/scholarships/${id}`}
        className="flex flex-col h-full card overflow-hidden group hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300"
      >
        {/* Gradient accent bar — màu theo deadline urgency */}
        <div className={`h-1 shrink-0 bg-gradient-to-r ${accentGradient}`} />

        {/* Cover image */}
        {image_url && (
          <div className="aspect-video bg-gray-100 overflow-hidden shrink-0">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Title + action buttons */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {is_featured && (
                <span className="badge bg-warning-50 text-warning-700 mb-1.5">
                  <Star className="w-3 h-3 fill-warning-500" />Nổi bật
                </span>
              )}
              <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors duration-200">
                {title}
              </h3>
              <p className="text-caption text-gray-400 mt-0.5 truncate">{provider}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); toggle(scholarship); }}
                disabled={!isSelected && itemCount >= 3}
                title={isSelected ? 'Bỏ so sánh' : itemCount >= 3 ? 'Tối đa 3 học bổng' : 'So sánh'}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
                  isSelected
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-300 hover:text-primary-500 hover:bg-primary-50',
                  !isSelected && itemCount >= 3 && 'opacity-30 cursor-not-allowed'
                )}
              >
                <GitCompare className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                title={!isAuthenticated ? 'Đăng nhập để lưu' : isSaved ? 'Bỏ lưu' : 'Lưu học bổng'}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
                  isSaved
                    ? 'text-danger-500 bg-danger-50 hover:bg-danger-100'
                    : 'text-gray-300 hover:text-danger-500 hover:bg-danger-50'
                )}
              >
                <Heart className={cn('w-4 h-4', isSaved && 'fill-danger-500')} />
              </button>
            </div>
          </div>

          {/* Location + Degree tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className="tag"><MapPin className="w-3 h-3" />{country}</span>
            <span className="tag"><GraduationCap className="w-3 h-3" />{degree}</span>
          </div>

          {/* Deadline row */}
          <div className="flex items-center gap-2 text-caption text-gray-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(deadline, 'dd/MM/yyyy')}</span>
            {badge && (
              <span className={cn('ml-auto px-2 py-0.5 rounded-badge text-caption font-semibold shrink-0', badge.cls)}>
                {badgeText}
              </span>
            )}
          </div>

          {/* Amount */}
          {amount && (
            <div className="mt-auto pt-3 border-t border-gray-50 flex items-center gap-1.5 text-success-600 font-bold">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>{formatCurrency(amount, currency)}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ScholarshipCard;
