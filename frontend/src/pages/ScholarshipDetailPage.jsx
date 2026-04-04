import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, GraduationCap, Globe, BookOpen, ExternalLink } from 'lucide-react';
import { useScholarship } from '../hooks/useScholarship';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Badge } from '../components/ui';

const ScholarshipDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useScholarship(id);

  if (isLoading) return <LoadingSpinner />;

  if (error || !data?.data) {
    return (
      <div className="container-narrow py-16 text-center">
        <h2 className="text-heading-1 text-gray-900 mb-4">Không tìm thấy học bổng</h2>
        <Link to="/scholarships" className="text-primary-600 hover:text-primary-700 font-medium">← Quay lại danh sách</Link>
      </div>
    );
  }

  const s = data.data;

  return (
    <div className="container-narrow py-8">
      <Link to="/scholarships" className="text-gray-500 hover:text-gray-700 font-medium mb-6 inline-flex items-center gap-1">
        ← Quay lại
      </Link>

      {/* Header */}
      <div className="card card-body mb-6">
        {s.is_featured && <Badge color="yellow" className="mb-4">Nổi bật</Badge>}
        <h1 className="text-heading-1 text-gray-900 mb-4">{s.title}</h1>
        <p className="text-body-lg text-gray-600 mb-6">{s.provider}</p>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-5 h-5" />{s.country}</div>
          <div className="flex items-center gap-2 text-gray-600"><GraduationCap className="w-5 h-5" />{s.degree}</div>
          <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-5 h-5" />Hạn: {formatDate(s.deadline, 'dd/MM/yyyy')}</div>
          {s.amount && <div className="flex items-center gap-2 text-success-600 font-semibold"><DollarSign className="w-5 h-5" />{formatCurrency(s.amount, s.currency)}</div>}
        </div>
        {s.application_url && (
          <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-lg">
            <ExternalLink className="w-5 h-5" />Nộp Đơn Ngay
          </a>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {s.eligibility && <div className="card p-6"><h2 className="text-heading-3 text-gray-900 mb-3">Điều kiện ứng tuyển</h2><p className="text-body text-gray-600 whitespace-pre-line">{s.eligibility}</p></div>}
          {s.requirements && <div className="card p-6"><h2 className="text-heading-3 text-gray-900 mb-3">Hồ sơ yêu cầu</h2><p className="text-body text-gray-600 whitespace-pre-line">{s.requirements}</p></div>}
          {s.benefits && <div className="card p-6"><h2 className="text-heading-3 text-gray-900 mb-3">Quyền lợi</h2><p className="text-body text-gray-600 whitespace-pre-line">{s.benefits}</p></div>}
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-heading-3 text-gray-900 mb-4">Thông tin chi tiết</h3>
            <dl className="space-y-3 text-body-sm">
              {s.language && <><dt className="text-gray-500">Ngôn ngữ</dt><dd className="font-medium text-gray-900 flex items-center gap-1"><Globe className="w-4 h-4" />{s.language}</dd></>}
              {s.field_of_study && <><dt className="text-gray-500">Ngành học</dt><dd className="font-medium text-gray-900 flex items-center gap-1"><BookOpen className="w-4 h-4" />{s.field_of_study}</dd></>}
              {s.min_gpa && <><dt className="text-gray-500">GPA tối thiểu</dt><dd className="font-medium text-gray-900">{s.min_gpa}/4.0</dd></>}
              {s.min_ielts && <><dt className="text-gray-500">IELTS tối thiểu</dt><dd className="font-medium text-gray-900">{s.min_ielts}</dd></>}
              {s.coverage && <><dt className="text-gray-500">Phạm vi</dt><dd className="font-medium text-gray-900">{s.coverage}</dd></>}
              {s.intake && <><dt className="text-gray-500">Kỳ nhập học</dt><dd className="font-medium text-gray-900">{s.intake}</dd></>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetailPage;
