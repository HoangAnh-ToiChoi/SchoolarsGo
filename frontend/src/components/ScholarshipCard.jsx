import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap } from 'lucide-react';
import { useToggleSaveScholarship } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate } from '../utils/helpers';

const ScholarshipCard = ({ scholarship }) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toggleSave = useToggleSaveScholarship();
  const {
    id,
    scholarship_id,
    title,
    provider,
    country,
    degree,
    amount,
    currency,
    deadline,
    image_url,
    is_featured,
    is_saved,
  } = scholarship;
  const scholarshipId = id || scholarship_id;
  const savedState = Boolean(is_saved);

  const handleToggleSave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!scholarshipId) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    toggleSave.mutate({ scholarshipId, isSaved: savedState });
  };

  return (
    <Link to={`/scholarships/${scholarshipId}`} className="block card-hover overflow-hidden group">
      {image_url && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img src={image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            {is_featured && <span className="badge bg-warning-50 text-warning-700 mb-1"><Star className="w-3 h-3 fill-warning-500" />Nổi bật</span>}
            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={toggleSave.isPending}
            className={cn(
              'shrink-0 rounded-full p-1.5 transition-colors',
              savedState ? 'bg-rose-50 text-rose-500 hover:text-rose-600' : 'text-gray-400 hover:text-danger-500'
            )}
            aria-label={savedState ? 'Bỏ lưu học bổng' : 'Lưu học bổng'}
          >
            <Heart className={cn('w-5 h-5', savedState && 'fill-current')} />
          </button>
        </div>
        <p className="text-body-sm text-gray-500 mb-4">{provider}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="tag"><MapPin className="w-3 h-3" />{country}</span>
          <span className="tag"><GraduationCap className="w-3 h-3" />{degree}</span>
          <span className="tag"><Calendar className="w-3 h-3" />{formatDate(deadline, 'dd/MM/yyyy')}</span>
        </div>
        {amount && <div className="flex items-center gap-1 text-success-600 font-bold"><DollarSign className="w-4 h-4" />{formatCurrency(amount, currency)}</div>}
      </div>
    </Link>
  );
};

export default ScholarshipCard;
