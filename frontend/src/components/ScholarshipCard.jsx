import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap, GitCompare, BookOpen } from 'lucide-react';
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
  critical: { cls: 'bg-red-100 text-red-700 font-bold dark:bg-red-900/50 dark:text-red-300 border border-red-300/50 dark:border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse' },
  urgent:   { cls: 'bg-amber-100 text-amber-800 font-semibold dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300/50 dark:border-amber-500/30' },
  soon:     { cls: 'bg-yellow-100 text-yellow-800 font-semibold dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-500/30' },
  expired:  { cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
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
        className="flex flex-col h-full card overflow-hidden group hover:-translate-y-1.5 hover:shadow-purple-glow dark:hover:shadow-purple-glow-dark transition-shadow duration-300 ease-out"
      >
        {/* Cover image */}
        {image_url && (
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Icon box + Title */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-400 group-hover:from-purple-500 group-hover:to-pink-400 transition-colors duration-300 shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {is_featured && (
                <span className="badge bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 mb-1">
                  <Star className="w-3 h-3 fill-warning-500" />Nổi bật
                </span>
              )}
              <h3 className="font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-200">
                {title}
              </h3>
              <p className="text-caption text-gray-400 dark:text-gray-500 mt-0.5 truncate">{provider}</p>
            </div>
          </div>

          {/* Location + Degree tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className="tag border border-transparent dark:border-white/10 dark:bg-white/5 dark:text-gray-300"><MapPin className="w-3 h-3" />{country}</span>
            <span className="tag border border-transparent dark:border-white/10 dark:bg-white/5 dark:text-gray-300"><GraduationCap className="w-3 h-3" />{degree}</span>
          </div>

          {/* Deadline row */}
          <div className={cn(
            'flex items-center gap-2 text-caption',
            urgency === 'critical' ? 'text-red-600 dark:text-red-400' :
            urgency === 'urgent' ? 'text-amber-600 dark:text-amber-400' :
            'text-gray-400 dark:text-gray-500'
          )}>
            <Calendar className={cn('w-3.5 h-3.5 shrink-0', urgency === 'critical' && 'text-red-500 dark:text-red-400')} />
            <span>{formatDate(deadline, 'dd/MM/yyyy')}</span>
            {badge && (
              <span className={cn('ml-auto px-2 py-0.5 rounded-badge text-caption font-semibold shrink-0', badge.cls)}>
                {badgeText}
              </span>
            )}
          </div>

          {/* Amount — decorative underline style */}
          {amount && (
            <div className="mt-auto pt-3 relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
              <div className="flex items-center gap-1.5 pt-3 text-success-600 dark:text-success-400 font-bold">
                <span className="relative">
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-success-400 dark:bg-success-500 opacity-60" />
                  <DollarSign className="w-4 h-4 shrink-0" />
                </span>
                <span className="relative">
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-success-400 dark:bg-success-500 opacity-60" />
                  <span>{formatCurrency(amount, currency)}</span>
                </span>
              </div>
            </div>
          )}

          {/* Action buttons — di chuyển xuống dưới cùng */}
          <div className="flex items-center justify-end gap-0.5 -mb-1">
            <button
              onClick={(e) => { e.preventDefault(); toggle(scholarship); }}
              disabled={!isSelected && itemCount >= 3}
              title={isSelected ? 'Bỏ so sánh' : itemCount >= 3 ? 'Tối đa 3 học bổng' : 'So sánh'}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
                isSelected
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                  : 'text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:text-gray-500 dark:hover:text-primary-400 dark:hover:bg-primary-900/20',
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
                  ? 'text-danger-500 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/30 dark:hover:bg-danger-900/50'
                  : 'text-gray-300 hover:text-danger-500 hover:bg-danger-50 dark:text-gray-500 dark:hover:text-danger-400 dark:hover:bg-danger-900/20'
              )}
            >
              <Heart className={cn('w-4 h-4', isSaved && 'fill-danger-500')} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ScholarshipCard;
