import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, GraduationCap, Globe, BookOpen, ExternalLink, Heart, Bell } from 'lucide-react';
import { useScholarship, useSavedScholarships, useToggleSaveScholarship } from '../hooks/useScholarship';
import { useCreateApplication } from '../hooks/useApplication';
import { cn, formatCurrency, formatDate, getDaysUntilDeadline, getDeadlineUrgency } from '../utils/helpers';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { Badge, Button } from '../components/ui';

const ScholarshipDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useScholarship(id);
  const user = useAuthStore((state) => state.user);
  const { data: savedData } = useSavedScholarships();
  const toggleSave = useToggleSaveScholarship();
  const createApp = useCreateApplication();

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

  const isSaved = savedData?.data?.some((item) => item.scholarship?.id === s.id) ?? false;

  return (
    <div className="container-narrow py-8">
      <Link to="/scholarships" className="text-gray-500 hover:text-gray-700 font-medium mb-6 inline-flex items-center gap-1">
        ← Quay lại
      </Link>

      {/* Header */}
      <div className="card card-body mb-6">
        {s.is_featured && <Badge color="yellow" className="mb-4">Nổi bật</Badge>}
        <h1 className="text-heading-1 text-gray-900 mb-4">{s.title}</h1>
        {(() => {
          const urgency = getDeadlineUrgency(s.deadline);
          const days = getDaysUntilDeadline(s.deadline);
          if (!urgency) return null;
          const config = {
            expired: { text: 'Học bổng đã hết hạn nộp', cls: 'bg-gray-100 text-gray-600' },
            critical: { text: `Chỉ còn ${days} ngày để nộp hồ sơ!`, cls: 'bg-danger-50 text-danger-700 border border-danger-200' },
            urgent: { text: `Còn ${days} ngày để nộp hồ sơ`, cls: 'bg-warning-50 text-warning-700 border border-warning-200' },
            soon: { text: `Còn ${days} ngày`, cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
          }[urgency];
          return <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-body-sm font-medium ${config.cls}`}>⏰ {config.text}</div>;
        })()}
        <p className="text-body-lg text-gray-600 mb-6">{s.provider}</p>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-5 h-5" />{s.country}</div>
          <div className="flex items-center gap-2 text-gray-600"><GraduationCap className="w-5 h-5" />{s.degree}</div>
          <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-5 h-5" />Hạn: {formatDate(s.deadline, 'dd/MM/yyyy')}</div>
          {s.amount && <div className="flex items-center gap-2 text-success-600 font-semibold"><DollarSign className="w-5 h-5" />{formatCurrency(s.amount, s.currency)}</div>}
        </div>
        <div className="flex flex-wrap gap-3">
          {s.application_url && (
            <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-lg">
              <ExternalLink className="w-5 h-5" />Nộp Đơn Ngay
            </a>
          )}
          {user && (
            <>
              <Button
                variant="secondary"
                size="lg"
                isLoading={toggleSave.isPending}
                onClick={() => toggleSave.mutate({ scholarshipId: s.id, isSaved })}
                className={isSaved ? 'text-danger-600 border-danger-200 hover:bg-danger-50' : ''}
              >
                <Heart className={cn('w-5 h-5', isSaved && 'fill-danger-500 text-danger-500')} />
                {isSaved ? 'Đã lưu' : 'Lưu học bổng'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                isLoading={createApp.isPending}
                onClick={() => createApp.mutate({ scholarship_id: s.id })}
              >
                <Bell className="w-5 h-5" />Theo dõi ứng tuyển
              </Button>
            </>
          )}
        </div>
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
