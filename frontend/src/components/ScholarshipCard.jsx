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
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            {is_featured && <span className="badge bg-warning-50 text-warning-700 mb-1"><Star className="w-3 h-3 fill-warning-500" />Nổi bật</span>}
            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{title}</h3>
          </div>
          <button onClick={(e) => { e.preventDefault(); }} className="shrink-0 p-1 text-gray-400 hover:text-danger-500 transition-colors">
            <Heart className="w-5 h-5" />
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
