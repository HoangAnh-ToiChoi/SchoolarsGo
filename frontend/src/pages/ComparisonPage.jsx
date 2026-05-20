import { useSearchParams, Link } from 'react-router-dom';
import { Check, X, MapPin, Calendar, GraduationCap, DollarSign, ArrowLeft } from 'lucide-react';
import { useScholarship } from '../hooks/useScholarship';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const useScholarships = (ids) => {
  const q1 = useScholarship(ids[0]);
  const q2 = useScholarship(ids[1]);
  const q3 = useScholarship(ids[2]);
  return [q1, q2, q3].slice(0, ids.length);
};

const Cell = ({ children, highlight }) => (
  <td className={`px-4 py-4 text-body-sm text-ink-300 text-center align-top ${highlight ? 'bg-primary-400/8' : ''}`}>
    {children ?? <span className="text-ink-700">—</span>}
  </td>
);

const BoolCell = ({ value, highlight }) => (
  <Cell highlight={highlight}>
    {value
      ? <Check className="w-4 h-4 text-success-500 mx-auto" />
      : <X className="w-4 h-4 text-ink-700 mx-auto" />}
  </Cell>
);

const ROWS = [
  { label: 'Nhà cung cấp', key: 'provider' },
  { label: 'Quốc gia', key: 'country', icon: MapPin },
  { label: 'Bậc học', key: 'degree', icon: GraduationCap },
  { label: 'Hạn nộp', key: 'deadline', format: (v) => formatDate(v, 'dd/MM/yyyy'), icon: Calendar },
  { label: 'Học phí', key: 'amount', format: (v, s) => v ? formatCurrency(v, s.currency) : null, icon: DollarSign },
  { label: 'GPA tối thiểu', key: 'min_gpa', format: (v) => v ? `${v}/4.0` : null },
  { label: 'IELTS tối thiểu', key: 'min_ielts' },
  { label: 'Ngành học', key: 'field_of_study' },
  { label: 'Ngôn ngữ', key: 'language' },
  { label: 'Phạm vi', key: 'coverage' },
];

const ComparisonPage = () => {
  const [params] = useSearchParams();
  const ids = (params.get('ids') || '').split(',').filter(Boolean).slice(0, 3);
  const queries = useScholarships(ids);

  if (queries.some((q) => q.isLoading)) return <LoadingSpinner />;

  const scholarships = queries.map((q) => q.data?.data).filter(Boolean);

  if (scholarships.length < 2) {
    return (
      <div className="container-page py-16 text-center bg-ink-950 min-h-screen">
        <p className="text-body text-ink-400 mb-4">Cần ít nhất 2 học bổng để so sánh</p>
        <Link to="/scholarships" className="btn-primary">Chọn học bổng</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 bg-ink-950 min-h-screen">
      <Link to="/scholarships" className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-100 font-medium mb-6">
        <ArrowLeft className="w-4 h-4" />Quay lại
      </Link>

      <h1 className="text-heading-1 text-ink-100 mb-8">So sánh học bổng</h1>

      <div className="bg-ink-900 border border-ink-800 rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="px-4 py-4 text-left text-body-sm font-semibold text-ink-400 w-36">Tiêu chí</th>
                {scholarships.map((s, i) => (
                  <th key={s.id} className={`px-4 py-4 text-center ${i === 0 ? 'bg-primary-400/8' : ''}`}>
                    <Link to={`/scholarships/${s.id}`} className="text-body-sm font-bold text-ink-100 hover:text-primary-400 line-clamp-2">
                      {s.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {ROWS.map(({ label, key, format, icon: Icon }) => (
                <tr key={key} className="hover:bg-ink-800/50">
                  <td className="px-4 py-4 text-body-sm font-medium text-ink-300">
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-ink-500" />}
                      {label}
                    </div>
                  </td>
                  {scholarships.map((s, i) => (
                    <Cell key={s.id} highlight={i === 0}>
                      {format ? format(s[key], s) : s[key]}
                    </Cell>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-ink-800">
                <td className="px-4 py-4 text-body-sm font-medium text-ink-300">Nộp đơn</td>
                {scholarships.map((s, i) => (
                  <td key={s.id} className={`px-4 py-4 text-center ${i === 0 ? 'bg-primary-400/8' : ''}`}>
                    {s.application_url
                      ? <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">Nộp đơn</a>
                      : <span className="text-ink-700 text-body-sm">—</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
