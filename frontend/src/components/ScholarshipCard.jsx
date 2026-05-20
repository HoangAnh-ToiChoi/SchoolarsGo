import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToggleSaveScholarship, useSavedScholarships } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate } from '../utils/helpers';
import { useComparisonStore } from '../stores/comparisonStore';
import { useInView } from '../hooks/useInView';
import toast from 'react-hot-toast';

const ScholarshipCard = ({ scholarship, index = 0 }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: savedData } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();
  const [optimisticSaved, setOptimisticSaved] = useState(null);
  const [ref, inView] = useInView();

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
      onError: () => setOptimisticSaved(serverIsSaved),
    });
  };

  const toggle = useComparisonStore((s) => s.toggle);
  const isSelected = useComparisonStore((s) => s.isSelected(id));
  const itemCount = useComparisonStore((s) => s.items.length);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: (index % 6) * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/scholarships/${id}`}
        className={cn(
          'block overflow-hidden bg-ink-900 border rounded-card transition-all duration-300 group',
          isSelected
            ? 'border-primary-400/60 shadow-glow-sm'
            : 'border-ink-800 hover:border-primary-400/40 hover:-translate-y-1 hover:shadow-card-hover'
        )}
      >
        {image_url && (
          <div className="aspect-video overflow-hidden bg-ink-800">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {is_featured && (
                <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-warning-400/10 text-warning-400 border border-warning-400/20">
                  <Star className="w-3 h-3 fill-warning-400" />
                  Nổi bật
                </span>
              )}
              <h3 className="font-semibold leading-snug line-clamp-2 text-sm sm:text-base text-ink-100 group-hover:text-primary-300 transition-colors">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); toggle(scholarship); }}
                disabled={!isSelected && itemCount >= 3}
                title={isSelected ? 'Bỏ so sánh' : itemCount >= 3 ? 'Tối đa 3 học bổng' : 'So sánh'}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  isSelected
                    ? 'bg-primary-400/15 text-primary-400'
                    : 'text-ink-600 hover:text-primary-400 hover:bg-primary-400/10',
                  !isSelected && itemCount >= 3 && 'opacity-30 cursor-not-allowed'
                )}
              >
                <GitCompare className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveClick}
                disabled={toggleSave.isPending}
                className={cn(
                  'min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded transition-colors disabled:opacity-50',
                  isSaved
                    ? 'text-danger-400 bg-danger-400/10 hover:bg-danger-400/20'
                    : 'text-ink-600 hover:text-danger-400 hover:bg-danger-400/10'
                )}
              >
                <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <p className="text-body-sm text-ink-500 mb-3 line-clamp-1">{provider}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="tag"><MapPin className="w-3 h-3" />{country}</span>
            <span className="tag"><GraduationCap className="w-3 h-3" />{degree}</span>
            <span className="tag"><Calendar className="w-3 h-3" />{formatDate(deadline, 'dd/MM/yyyy')}</span>
          </div>

          {amount && (
            <div className="flex items-center gap-1 font-semibold text-sm text-success-400">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(amount, currency)}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ScholarshipCard;
