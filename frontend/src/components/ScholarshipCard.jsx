import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap, GitCompare } from 'lucide-react';
import { useToggleSaveScholarship, useSavedScholarships } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate } from '../utils/helpers';
import { useComparisonStore } from '../stores/comparisonStore';
import toast from 'react-hot-toast';

const ScholarshipCard = ({ scholarship, isDark = false }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: savedData } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();

  const [optimisticSaved, setOptimisticSaved] = useState(null);
  
  // Guard: return null nếu scholarship undefined
  if (!scholarship || !scholarship.id) return null;
  const { id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured } = scholarship;
  
  const savedScholarships = savedData?.data || [];
  const serverIsSaved = savedScholarships.some(
    (item) => item.scholarship?.id === id || item.scholarship_id === id
  );
  const isSaved = optimisticSaved !== null ? optimisticSaved : serverIsSaved;

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu học bổng');
      return;
    }
    
    const nextSavedState = !isSaved;
    setOptimisticSaved(nextSavedState);
    
    toggleSave.mutate({ scholarshipId: id, isSaved: !nextSavedState }, {
      onError: () => {
        setOptimisticSaved(serverIsSaved);
      }
    });
  };

  const toggle = useComparisonStore((s) => s.toggle);
  const isSelected = useComparisonStore((s) => s.isSelected(id));
  const itemCount = useComparisonStore((s) => s.items.length);

  return (
    <Link 
      to={`/scholarships/${id}`} 
      className={cn(
        "block overflow-hidden group transition-all duration-300",
        isDark 
          ? "rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1" 
          : "card-hover"
      )}
    >
      {image_url && (
        <div className={cn("aspect-video overflow-hidden", isDark ? "bg-white/5" : "bg-gray-100")}>
          <img src={image_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {is_featured && (
              <span className={cn(
                "mb-1 inline-flex whitespace-nowrap text-xs font-medium px-2.5 py-0.5 rounded-full items-center gap-1",
                isDark ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-warning-50 text-warning-700"
              )}>
                <Star className={cn("w-3 h-3", isDark ? "fill-amber-300" : "fill-warning-500")} />
                Nổi bật
              </span>
            )}
            <h3 className={cn("font-bold leading-tight line-clamp-2 text-sm sm:text-base", isDark ? "text-white group-hover:text-primary-300 transition-colors" : "text-gray-900")}>
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); toggle(scholarship); }}
              disabled={!isSelected && itemCount >= 3}
              title={isSelected ? 'Bỏ so sánh' : itemCount >= 3 ? 'Tối đa 3 học bổng' : 'So sánh'}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isSelected ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50',
                !isSelected && itemCount >= 3 && 'opacity-30 cursor-not-allowed'
              )}
            >
              <GitCompare className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveClick}
              disabled={toggleSave.isPending}
              className={cn(
                "min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 p-2 rounded-full transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-90",
                isSaved 
                  ? (isDark ? "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-danger-50 text-danger-500") 
                  : (isDark ? "bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400" : "bg-gray-50 text-gray-400 hover:bg-danger-50 hover:text-danger-500")
              )}
            >
              <Heart 
                className={cn("w-5 h-5 transition-transform duration-300", isSaved && "scale-110")} 
                fill={isSaved ? "currentColor" : "none"} 
              />
            </button>
          </div>
        </div>
        <p className={cn("text-body-sm mb-4 line-clamp-1", isDark ? "text-white/60" : "text-gray-500")}>
          {provider}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn("inline-flex items-center gap-1 text-xs sm:text-sm px-2.5 py-1 rounded-md", isDark ? "bg-white/10 text-white/80" : "tag")}>
            <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{country}</span>
          </span>
          <span className={cn("inline-flex items-center gap-1 text-xs sm:text-sm px-2.5 py-1 rounded-md", isDark ? "bg-white/10 text-white/80" : "tag")}>
            <GraduationCap className="w-3 h-3 flex-shrink-0" /><span className="truncate">{degree}</span>
          </span>
          <span className={cn("inline-flex items-center gap-1 text-xs sm:text-sm px-2.5 py-1 rounded-md", isDark ? "bg-white/10 text-white/80" : "tag")}>
            <Calendar className="w-3 h-3 flex-shrink-0" /><span className="truncate">{formatDate(deadline, 'dd/MM/yyyy')}</span>
          </span>
        </div>
        {amount && (
          <div className={cn("flex items-center gap-1 font-bold text-sm", isDark ? "text-emerald-400" : "text-success-600")}>
            <DollarSign className="w-4 h-4 flex-shrink-0" />{formatCurrency(amount, currency)}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ScholarshipCard;
