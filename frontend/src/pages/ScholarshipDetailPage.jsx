import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ExternalLink, Globe, GraduationCap, Heart, Landmark, MapPin, Sparkles, Timer, Wallet } from 'lucide-react';
import { useCreateApplication } from '../hooks/useApplication';
import { useScholarship, useToggleSaveScholarship } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Badge, Button } from '../components/ui';

const DetailSection = ({ title, content, fallback }) => {
  if (!content && !fallback) return null;

  return (
    <section className="card p-6 sm:p-7">
      <h2 className="text-heading-3 text-slate-900">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-body leading-7 text-slate-600">{content || fallback}</p>
    </section>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-body-sm text-slate-500">{label}</p>
        <p className="mt-1 text-body font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const ScholarshipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, error } = useScholarship(id);
  const toggleSave = useToggleSaveScholarship();
  const createApplication = useCreateApplication();

  if (isLoading) return <LoadingSpinner />;

  if (error || !data?.data) {
    return (
      <div className="container-narrow py-16 text-center">
        <h2 className="mb-4 text-heading-1 text-gray-900">Không tìm thấy học bổng</h2>
        <Link to="/scholarships" className="text-primary-600 hover:text-primary-700 font-medium">← Quay lại danh sách</Link>
      </div>
    );
  }

  const s = data.data;
  const heroFacts = [
    { icon: MapPin, label: s.country },
    { icon: GraduationCap, label: s.degree },
    { icon: Calendar, label: s.deadline ? `Hạn nộp ${formatDate(s.deadline, 'dd/MM/yyyy')}` : null },
    { icon: Wallet, label: s.amount ? formatCurrency(s.amount, s.currency) : 'Liên hệ để biết giá trị học bổng' },
  ].filter((item) => item.label);
  const sidebarFacts = [
    { icon: Landmark, label: 'Nhà cung cấp', value: s.provider },
    { icon: BookOpen, label: 'Trường / tổ chức', value: s.university || s.provider },
    { icon: MapPin, label: 'Địa điểm', value: [s.city, s.country].filter(Boolean).join(', ') },
    { icon: Globe, label: 'Ngôn ngữ', value: s.language },
    { icon: GraduationCap, label: 'Ngành học', value: s.field_of_study },
    { icon: CheckCircle2, label: 'Phạm vi hỗ trợ', value: s.coverage },
    { icon: Sparkles, label: 'Kỳ nhập học', value: s.intake },
    { icon: Timer, label: 'Mức GPA tối thiểu', value: s.min_gpa ? `${s.min_gpa}/4.0` : null },
    { icon: Timer, label: 'IELTS tối thiểu', value: s.min_ielts || null },
  ];

  const handleRequireAuth = () => {
    navigate('/login');
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    toggleSave.mutate({ scholarshipId: s.id, isSaved: s.is_saved });
  };

  const handleCreateApplication = async () => {
    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    try {
      await createApplication.mutateAsync({ scholarship_id: s.id });
      navigate('/applications');
    } catch {
      // Toast is handled inside the mutation hook.
    }
  };

  return (
    <div className="bg-slate-50 py-8">
      <div className="container-page">
        <Link to="/scholarships" className="mb-6 inline-flex items-center gap-2 text-body-sm font-semibold text-slate-500 transition hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_36%),linear-gradient(135deg,_#eff6ff_0%,_#ffffff_46%,_#f8fafc_100%)] p-6 sm:p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-primary-100/60 blur-3xl" />
              <div className="relative max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  {s.is_featured && <Badge color="yellow">Nổi bật</Badge>}
                  {s.coverage && <Badge color="blue">{s.coverage}</Badge>}
                  {s.language && <Badge color="green">{s.language}</Badge>}
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{s.title}</h1>
                <p className="mt-3 max-w-2xl text-body-lg text-slate-600">{s.provider}</p>

                <div className="mt-6 flex flex-wrap gap-3 text-body-sm text-slate-600">
                  {heroFacts.map(({ icon: Icon, label }) => (
                    <span key={`${Icon.displayName || Icon.name}-${label}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 shadow-sm">
                      <Icon className="h-4 w-4 text-primary-600" />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={handleCreateApplication}
                    isLoading={createApplication.isPending}
                    loadingText="Đang tạo draft..."
                  >
                    Tạo hồ sơ ứng tuyển
                  </Button>
                  <Button
                    size="lg"
                    variant={s.is_saved ? 'secondary' : 'ghost'}
                    onClick={handleToggleSave}
                    isLoading={toggleSave.isPending}
                    loadingText={s.is_saved ? 'Đang bỏ lưu...' : 'Đang lưu...'}
                    leftIcon={Heart}
                    className={cn(s.is_saved && 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100')}
                  >
                    {s.is_saved ? 'Đã lưu học bổng' : 'Lưu vào shortlist'}
                  </Button>
                  {s.application_url && (
                    <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-lg">
                      <ExternalLink className="w-5 h-5" />
                      Mở link nộp đơn
                    </a>
                  )}
                </div>

                <div className="mt-6 text-body-sm text-slate-500">
                  {isAuthenticated
                    ? 'Bạn có thể lưu học bổng hoặc tạo draft application để theo dõi tiến độ ngay trong hệ thống.'
                    : 'Đăng nhập để lưu học bổng và tạo draft application theo dõi tiến độ.'}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-sky-200/90">Nhịp deadline</p>
              <p className="mt-3 text-3xl font-black">
                {s.deadline ? formatRelativeTime(s.deadline) : 'Chưa công bố'}
              </p>
              <p className="mt-3 text-body text-slate-300">
                {s.deadline
                  ? `Hạn chính thức: ${formatDate(s.deadline, 'dd/MM/yyyy')}`
                  : 'Theo dõi nhà cung cấp để cập nhật mốc thời gian chính thức.'}
              </p>

              <div className="mt-8 space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-body-sm text-slate-300">
                  <span>Mức hỗ trợ</span>
                  <span className="text-right text-base font-semibold text-white">
                    {s.amount ? formatCurrency(s.amount, s.currency) : 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-body-sm text-slate-300">
                  <span>Bậc học</span>
                  <span className="text-right text-base font-semibold text-white">{s.degree || 'Mở'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-body-sm text-slate-300">
                  <span>Trạng thái</span>
                  <span className="text-right text-base font-semibold text-white">{s.is_featured ? 'Ưu tiên hiển thị' : 'Đang mở tuyển'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <DetailSection
              title="Điều kiện ứng tuyển"
              content={s.eligibility}
              fallback="Chưa có mô tả chi tiết về điều kiện. Bạn nên mở link gốc hoặc liên hệ đơn vị cấp học bổng để xác nhận tiêu chí mới nhất."
            />
            <DetailSection
              title="Hồ sơ cần chuẩn bị"
              content={s.requirements}
              fallback="Hệ thống chưa nhận được checklist hồ sơ chi tiết. Bạn vẫn có thể tạo draft application để tự theo dõi CV, SOP, bảng điểm và thư giới thiệu."
            />
            <DetailSection
              title="Quyền lợi và phạm vi hỗ trợ"
              content={s.benefits}
              fallback="Thông tin quyền lợi chưa được điền cụ thể. Hãy xem thêm ở nguồn gốc của học bổng để kiểm tra học phí, sinh hoạt phí và các hỗ trợ đi kèm."
            />
          </div>

          <aside className="space-y-6">
            <section className="card p-6 sm:p-7">
              <h2 className="text-heading-3 text-slate-900">Thông tin nhanh</h2>
              <div className="mt-5 space-y-3">
                {sidebarFacts.map(({ icon, label, value }) => (
                  <InfoRow key={label} icon={icon} label={label} value={value} />
                ))}
              </div>
            </section>

            <section className="card overflow-hidden border-slate-900/5 bg-slate-900 text-white">
              <div className="p-6 sm:p-7">
                <p className="text-body-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Action plan</p>
                <h3 className="mt-3 text-2xl font-black leading-tight">Chốt cơ hội này trước khi deadline tới gần.</h3>
                <p className="mt-3 text-body text-slate-300">
                  Lưu shortlist nếu còn phân vân. Nếu đã sẵn sàng, tạo draft application để theo dõi checklist hồ sơ ngay từ bây giờ.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleToggleSave}
                    isLoading={toggleSave.isPending}
                    loadingText="Đang cập nhật..."
                    className="border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    {s.is_saved ? 'Bỏ khỏi shortlist' : 'Lưu shortlist'}
                  </Button>
                  <Button
                    onClick={handleCreateApplication}
                    isLoading={createApplication.isPending}
                    loadingText="Đang tạo..."
                  >
                    Tạo draft
                  </Button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetailPage;
