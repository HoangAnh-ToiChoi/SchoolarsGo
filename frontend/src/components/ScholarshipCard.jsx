import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap } from 'lucide-react';
import { useToggleSaveScholarship, useSavedScholarships } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const ScholarshipCard = ({ scholarship }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: savedData } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();

  // Guard: return null nếu scholarship undefined (sau hooks để không lỗi React)
  if (!scholarship || !scholarship.id) return null;
  const { id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured } = scholarship;
  
  const savedScholarships = savedData?.data || [];
  const isSaved = savedScholarships.some((item) => item.scholarship_id === id);

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu học bổng');
      return;
    }
    toggleSave.mutate({ scholarshipId: id, isSaved });
  };

  return (
    <Link to={`/scholarships/${id}`} className="block card-hover overflow-hidden group">
      {image_url && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img src={image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {is_featured && <span className="badge bg-warning-50 text-warning-700 mb-1 inline-flex whitespace-nowrap"><Star className="w-3 h-3 fill-warning-500" />Nổi bật</span>}
            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 text-sm sm:text-base">{title}</h3>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={toggleSave.isPending}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 p-1 text-gray-400 hover:text-danger-500 transition-colors disabled:opacity-50"
          >
            <Heart className={cn('w-5 h-5', isSaved && 'fill-danger-500 text-danger-500')} />
          </button>
        </div>
        <p className="text-body-sm text-gray-500 mb-4 line-clamp-1">{provider}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="tag text-xs sm:text-sm"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{country}</span></span>
          <span className="tag text-xs sm:text-sm"><GraduationCap className="w-3 h-3 flex-shrink-0" /><span className="truncate">{degree}</span></span>
          <span className="tag text-xs sm:text-sm"><Calendar className="w-3 h-3 flex-shrink-0" /><span className="truncate">{formatDate(deadline, 'dd/MM/yyyy')}</span></span>
        </div>
        {amount && <div className="flex items-center gap-1 text-success-600 font-bold text-sm"><DollarSign className="w-4 h-4 flex-shrink-0" />{formatCurrency(amount, currency)}</div>}
      </div>
    </Link>
  );
};

export default ScholarshipCard;
