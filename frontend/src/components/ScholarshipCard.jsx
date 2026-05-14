import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap, GitCompare } from 'lucide-react';
import { cn, formatCurrency, formatDate, getDaysUntilDeadline, getDeadlineUrgency } from '../utils/helpers';
import { useComparisonStore } from '../stores/comparisonStore';

const ScholarshipCard = ({ scholarship }) => {
  const { id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured } = scholarship;
  const toggle = useComparisonStore((s) => s.toggle);
  const isSelected = useComparisonStore((s) => s.isSelected(id));
  const itemCount = useComparisonStore((s) => s.items.length);

  return (
    <Link to={`/scholarships/${id}`} className="block card-hover overflow-hidden group">
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
            <button onClick={(e) => { e.preventDefault(); }} className="p-1 text-gray-400 hover:text-danger-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-body-sm text-gray-500 mb-4">{provider}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="tag"><MapPin className="w-3 h-3" />{country}</span>
          <span className="tag"><GraduationCap className="w-3 h-3" />{degree}</span>
          <span className="tag"><Calendar className="w-3 h-3" />{formatDate(deadline, 'dd/MM/yyyy')}</span>
          {(() => {
            const urgency = getDeadlineUrgency(deadline);
            const days = getDaysUntilDeadline(deadline);
            if (!urgency) return null;
            const config = {
              expired: { text: 'Đã hết hạn', cls: 'bg-gray-100 text-gray-500' },
              critical: { text: `Còn ${days} ngày!`, cls: 'bg-danger-50 text-danger-700 font-bold animate-pulse' },
              urgent: { text: `Còn ${days} ngày`, cls: 'bg-warning-50 text-warning-700 font-semibold' },
              soon: { text: `Còn ${days} ngày`, cls: 'bg-yellow-50 text-yellow-700' },
            }[urgency];
            return <div className={`w-full flex items-center gap-1.5 text-caption px-2.5 py-1 rounded-badge ${config.cls}`}>⏰ {config.text}</div>;
          })()}
        </div>
        {amount && <div className="flex items-center gap-1 text-success-600 font-bold"><DollarSign className="w-4 h-4" />{formatCurrency(amount, currency)}</div>}
      </div>
    </Link>
  );
};

export default ScholarshipCard;
