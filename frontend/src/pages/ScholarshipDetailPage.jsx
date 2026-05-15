import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ExternalLink, Globe, GraduationCap, Heart, Landmark, MapPin, Sparkles, Timer, Wallet } from 'lucide-react';
import { useCreateApplication } from '../hooks/useApplication';
import { useScholarship, useToggleSaveScholarship } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { Badge, Button } from '../components/ui';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import AnimatedPage from '../components/ui/AnimatedPage';

const DetailSection = ({ title, content, fallback }) => {
  if (!content && !fallback) return null;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md p-6 sm:p-7 transition-all hover:bg-gray-50 dark:hover:bg-white/10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-gray-600 dark:text-white/70">{content || fallback}</p>
    </section>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/30">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-white/50">{label}</p>
        <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">{value}</p>
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

  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050510] py-16 text-center text-gray-900 dark:text-white">
        <h2 className="mb-4 text-3xl font-bold">ID học bổng không hợp lệ</h2>
        <Link to="/scholarships" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">← Quay lại danh sách</Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050510] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050510] py-16 text-center text-gray-900 dark:text-white">
        <h2 className="mb-4 text-3xl font-bold">Không tìm thấy học bổng</h2>
        <Link to="/scholarships" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">← Quay lại danh sách</Link>
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

  const handleRequireAuth = () => navigate('/login');

  const handleToggleSave = () => {
    if (!isAuthenticated) { handleRequireAuth(); return; }
    toggleSave.mutate({ scholarshipId: s.id, isSaved: s.is_saved });
  };

  const handleCreateApplication = async () => {
    if (!isAuthenticated) { handleRequireAuth(); return; }
    try {
      await createApplication.mutateAsync({ scholarship_id: s.id });
      navigate('/applications');
    } catch {
      // Toast is handled inside the mutation hook.
    }
  };

  return (
    <AnimatedPage className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white pb-24">
      <AuroraBackground />
      <div className="container-page relative z-10 pt-8">
        <Link to="/scholarships" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-white/60 transition hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-xl shadow-sm dark:shadow-[0_0_50px_rgba(168,85,247,0.15)]">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/50 to-transparent dark:bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.15),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.02)_0%,_transparent_100%)] p-6 sm:p-8 lg:p-12">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 blur-[100px] pointer-events-none" />
              <div className="relative max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  {s.is_featured && <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-500/30">Nổi bật</span>}
                  {s.coverage && <span className="rounded-full bg-blue-100 dark:bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-500/30">{s.coverage}</span>}
                  {s.language && <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/30">{s.language}</span>}
                </div>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-5xl">{s.title}</h1>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-white/70 font-light">{s.provider}</p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-white/80">
                  {heroFacts.map(({ icon: Icon, label }) => (
                    <span key={`${Icon.displayName || Icon.name}-${label}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 backdrop-blur-sm px-4 py-2.5 transition hover:bg-gray-100 dark:hover:bg-white/10">
                      <Icon className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    onClick={handleCreateApplication}
                    disabled={createApplication.isPending}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50"
                  >
                    {createApplication.isPending ? 'Đang tạo draft...' : 'Tạo hồ sơ ứng tuyển'}
                  </button>
                  <button
                    onClick={handleToggleSave}
                    disabled={toggleSave.isPending}
                    className={cn(
                      "px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50",
                      s.is_saved
                        ? "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/30"
                        : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10"
                    )}
                  >
                    <Heart className="w-5 h-5" fill={s.is_saved ? "currentColor" : "none"} />
                    {s.is_saved ? 'Đã lưu học bổng' : 'Lưu vào shortlist'}
                  </button>
                  {s.application_url && (
                    <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Mở link nộp đơn
                    </a>
                  )}
                </div>

                <div className="mt-8 text-sm text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                  {isAuthenticated
                    ? '💡 Bạn có thể lưu học bổng hoặc tạo draft application để theo dõi tiến độ ngay trong hệ thống.'
                    : '💡 Đăng nhập để lưu học bổng và tạo draft application theo dõi tiến độ.'}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a1a]/80 p-6 sm:p-8 lg:p-12 lg:border-l lg:border-t-0 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">Nhịp deadline</p>
              <p className="mt-4 text-4xl font-black text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70">
                {s.deadline ? formatRelativeTime(s.deadline) : 'Chưa công bố'}
              </p>
              <p className="mt-3 text-base text-gray-500 dark:text-white/60">
                {s.deadline
                  ? `Hạn chính thức: ${formatDate(s.deadline, 'dd/MM/yyyy')}`
                  : 'Theo dõi nhà cung cấp để cập nhật mốc thời gian chính thức.'}
              </p>

              <div className="mt-10 space-y-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4 text-sm text-gray-500 dark:text-white/60">
                  <span>Mức hỗ trợ</span>
                  <span className="text-right text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {s.amount ? formatCurrency(s.amount, s.currency) : 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4 text-sm text-gray-500 dark:text-white/60">
                  <span>Bậc học</span>
                  <span className="text-right text-base font-semibold text-gray-900 dark:text-white">{s.degree || 'Mở'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-gray-500 dark:text-white/60">
                  <span>Trạng thái</span>
                  <span className="text-right text-base font-semibold text-gray-900 dark:text-white">
                    {s.is_featured ? <span className="text-amber-500 dark:text-amber-400">Ưu tiên hiển thị</span> : 'Đang mở tuyển'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <div className="space-y-8">
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

          <aside className="space-y-8">
            <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Thông tin nhanh</h2>
              <div className="space-y-4">
                {sidebarFacts.map(({ icon, label, value }) => (
                  <InfoRow key={label} icon={icon} label={label} value={value} />
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-900/20 backdrop-blur-md p-6 sm:p-8 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/20 blur-[50px] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Action plan</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-gray-900 dark:text-white">Chốt cơ hội này trước khi deadline tới gần.</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                  Lưu shortlist nếu còn phân vân. Nếu đã sẵn sàng, tạo draft application để theo dõi checklist hồ sơ ngay từ bây giờ.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={handleCreateApplication}
                    disabled={createApplication.isPending}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-[#050510] font-bold py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-white/90 transition-colors"
                  >
                    Tạo draft
                  </button>
                  <button
                    onClick={handleToggleSave}
                    disabled={toggleSave.isPending}
                    className="w-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 border border-gray-300 dark:border-white/10 transition-colors"
                  >
                    {s.is_saved ? 'Bỏ khỏi shortlist' : 'Lưu shortlist'}
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ScholarshipDetailPage;
