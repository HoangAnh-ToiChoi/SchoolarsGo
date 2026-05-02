import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Calendar, DollarSign, GraduationCap } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../utils/helpers';

const ScholarshipCard = ({ scholarship }) => {
  const { id, title, provider, country, degree, amount, currency, deadline, image_url, is_featured } = scholarship;

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
          <button onClick={(e) => { e.preventDefault(); }} className="shrink-0 p-2 -m-1 text-gray-400 hover:text-danger-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Heart className="w-5 h-5" />
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
