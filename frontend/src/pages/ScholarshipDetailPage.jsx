import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ExternalLink, Globe, GraduationCap, Heart, Landmark, MapPin, Sparkles, Timer, Wallet } from 'lucide-react';
import { useCreateApplication } from '../hooks/useApplication';
import { useScholarship, useToggleSaveScholarship } from '../hooks/useScholarship';
import { useAuthStore } from '../stores/authStore';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

const DetailSection = ({ title, content, fallback, delay = 0 }) => {
  if (!content && !fallback) return null;
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      custom={delay}
      className="rounded-card border border-ink-800 bg-ink-900 p-6 sm:p-7"
    >
      <h2 className="text-xl font-bold text-ink-100">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-400">{content || fallback}</p>
    </motion.section>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 rounded-xl border border-ink-800 bg-ink-950 p-4 hover:border-primary-400/40 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-400/10 text-primary-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-ink-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink-100">{value}</p>
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
  const heroRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [data]);

  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen bg-ink-950 py-16 text-center text-ink-100">
        <h2 className="mb-4 text-3xl font-bold">ID học bổng không hợp lệ</h2>
        <Link to="/scholarships" className="text-primary-400 hover:text-primary-300 font-medium">← Quay lại danh sách</Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-ink-950 py-16 text-center text-ink-100">
        <h2 className="mb-4 text-3xl font-bold">Không tìm thấy học bổng</h2>
        <Link to="/scholarships" className="text-primary-400 hover:text-primary-300 font-medium">← Quay lại danh sách</Link>
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
    } catch { /* Toast is handled inside the mutation hook. */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-ink-950 pb-24"
    >
      {/* Sticky action bar */}
      {showStickyBar && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink-800 bg-ink-950/95 backdrop-blur-md px-4 py-3"
        >
          <div className="container-page flex items-center justify-between gap-4">
            <div className="hidden sm:block min-w-0">
              <p className="truncate text-sm font-semibold text-ink-100">{s.title}</p>
              <p className="text-xs text-ink-500">{s.provider}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleCreateApplication}
                disabled={createApplication.isPending}
                className="flex-1 sm:flex-none bg-primary-400 text-ink-950 hover:bg-primary-300 transition-all rounded-button px-6 py-2.5 font-semibold text-sm disabled:opacity-50 hover:shadow-glow"
              >
                {createApplication.isPending ? 'Đang tạo...' : 'Tạo hồ sơ ứng tuyển'}
              </button>
              <button
                onClick={handleToggleSave}
                disabled={toggleSave.isPending}
                className={cn(
                  "border transition-colors rounded-button px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 disabled:opacity-50",
                  s.is_saved
                    ? "border-danger-400/50 text-danger-400 bg-danger-400/10 hover:bg-danger-400/20"
                    : "border-ink-700 text-ink-300 bg-ink-800 hover:bg-ink-700"
                )}
              >
                <Heart className="w-4 h-4" fill={s.is_saved ? "currentColor" : "none"} />
                {s.is_saved ? 'Đã lưu' : 'Lưu'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container-page pt-8">
        {/* Back link */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <Link
            to="/scholarships"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition hover:text-ink-100 bg-ink-900 px-4 py-2 rounded-full border border-ink-800 w-fit hover:border-ink-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </motion.div>

        {/* Hero card */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900"
        >
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            {/* Left: title + CTAs */}
            <div className="p-6 sm:p-8 lg:p-12 border-b border-ink-800 lg:border-b-0 lg:border-r">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  {s.is_featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warning-400/10 text-warning-400 border border-warning-400/20">
                      <Sparkles className="w-3 h-3" /> Nổi bật
                    </span>
                  )}
                  {s.coverage && <span className="tag">{s.coverage}</span>}
                  {s.language && <span className="tag">{s.language}</span>}
                </div>

                <h1 className="mt-6 text-3xl font-bold leading-tight text-ink-100 sm:text-4xl">{s.title}</h1>
                <p className="mt-3 max-w-2xl text-lg text-ink-400">{s.provider}</p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm">
                  {heroFacts.map(({ icon: Icon, label }) => (
                    <span
                      key={`${Icon.displayName || Icon.name}-${label}`}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-4 py-2 text-ink-300 transition hover:border-primary-400/40 hover:text-primary-300"
                    >
                      <Icon className="h-4 w-4 text-primary-400" />
                      {label}
                    </span>
                  ))}
                </div>

                <div ref={heroRef} className="mt-10 flex flex-wrap gap-4">
                  <button
                    onClick={handleCreateApplication}
                    disabled={createApplication.isPending}
                    className="bg-primary-400 text-ink-950 px-8 py-3.5 rounded-button font-semibold hover:bg-primary-300 transition-all hover:shadow-glow disabled:opacity-50"
                  >
                    {createApplication.isPending ? 'Đang tạo draft...' : 'Tạo hồ sơ ứng tuyển'}
                  </button>
                  <button
                    onClick={handleToggleSave}
                    disabled={toggleSave.isPending}
                    className={cn(
                      "px-8 py-3.5 rounded-button font-semibold transition-colors flex items-center gap-2 border disabled:opacity-50",
                      s.is_saved
                        ? "border-danger-400/50 text-danger-400 bg-danger-400/10 hover:bg-danger-400/20"
                        : "border-ink-700 text-ink-300 bg-ink-800 hover:bg-ink-700"
                    )}
                  >
                    <Heart className="w-5 h-5" fill={s.is_saved ? "currentColor" : "none"} />
                    {s.is_saved ? 'Đã lưu học bổng' : 'Lưu vào shortlist'}
                  </button>
                  {s.application_url && (
                    <a
                      href={s.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3.5 rounded-button font-semibold border border-ink-700 text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Mở link nộp đơn
                    </a>
                  )}
                </div>

                <div className="mt-8 text-sm text-ink-400 bg-primary-400/5 border border-primary-400/20 rounded-xl p-4">
                  {isAuthenticated
                    ? '💡 Bạn có thể lưu học bổng hoặc tạo draft application để theo dõi tiến độ ngay trong hệ thống.'
                    : '💡 Đăng nhập để lưu học bổng và tạo draft application theo dõi tiến độ.'}
                </div>
              </div>
            </div>

            {/* Right: deadline panel */}
            <div className="bg-ink-950 border-t border-ink-800 p-6 sm:p-8 lg:p-12 lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-400">Nhịp deadline</p>
              <p className="mt-4 text-4xl font-black text-ink-100">
                {s.deadline ? formatRelativeTime(s.deadline) : 'Chưa công bố'}
              </p>
              <p className="mt-3 text-sm text-ink-500">
                {s.deadline
                  ? `Hạn chính thức: ${formatDate(s.deadline, 'dd/MM/yyyy')}`
                  : 'Theo dõi nhà cung cấp để cập nhật mốc thời gian chính thức.'}
              </p>

              <div className="mt-8 space-y-3 rounded-xl border border-ink-800 bg-ink-900 p-5">
                <div className="flex items-center justify-between gap-4 border-b border-ink-800 pb-3 text-sm text-ink-500">
                  <span>Mức hỗ trợ</span>
                  <span className="text-right text-base font-bold text-success-400">
                    {s.amount ? formatCurrency(s.amount, s.currency) : 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-ink-800 pb-3 text-sm text-ink-500">
                  <span>Bậc học</span>
                  <span className="text-right text-sm font-semibold text-ink-100">{s.degree || 'Mở'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-ink-500">
                  <span>Trạng thái</span>
                  <span className="text-right text-sm font-semibold">
                    {s.is_featured
                      ? <span className="text-warning-400">Ưu tiên hiển thị</span>
                      : <span className="text-success-400">Đang mở tuyển</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Body */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <DetailSection title="Điều kiện ứng tuyển" content={s.eligibility} delay={0}
              fallback="Chưa có mô tả chi tiết về điều kiện. Bạn nên mở link gốc hoặc liên hệ đơn vị cấp học bổng để xác nhận tiêu chí mới nhất."
            />
            <DetailSection title="Hồ sơ cần chuẩn bị" content={s.requirements} delay={1}
              fallback="Hệ thống chưa nhận được checklist hồ sơ chi tiết. Bạn vẫn có thể tạo draft application để tự theo dõi CV, SOP, bảng điểm và thư giới thiệu."
            />
            <DetailSection title="Quyền lợi và phạm vi hỗ trợ" content={s.benefits} delay={2}
              fallback="Thông tin quyền lợi chưa được điền cụ thể. Hãy xem thêm ở nguồn gốc của học bổng để kiểm tra học phí, sinh hoạt phí và các hỗ trợ đi kèm."
            />
          </div>

          <aside className="space-y-6">
            {/* Quick info */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="rounded-card border border-ink-800 bg-ink-900 p-6 sm:p-8"
            >
              <h2 className="text-lg font-bold text-ink-100 mb-5">Thông tin nhanh</h2>
              <div className="space-y-3">
                {sidebarFacts.map(({ icon, label, value }) => (
                  <InfoRow key={label} icon={icon} label={label} value={value} />
                ))}
              </div>
            </motion.section>

            {/* Action plan */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={1}
              className="rounded-card border border-primary-400/20 bg-primary-400/5 p-6 sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-400">Action plan</p>
              <h3 className="mt-3 text-xl font-black leading-tight text-ink-100">
                Chốt cơ hội này trước khi deadline tới gần.
              </h3>
              <p className="mt-3 text-sm text-ink-400 leading-relaxed">
                Lưu shortlist nếu còn phân vân. Nếu đã sẵn sàng, tạo draft application để theo dõi checklist hồ sơ ngay từ bây giờ.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleCreateApplication}
                  disabled={createApplication.isPending}
                  className="w-full bg-primary-400 text-ink-950 font-semibold py-3 rounded-button hover:bg-primary-300 transition-all hover:shadow-glow disabled:opacity-50"
                >
                  Tạo draft
                </button>
                <button
                  onClick={handleToggleSave}
                  disabled={toggleSave.isPending}
                  className={cn(
                    "w-full font-semibold py-3 rounded-button border transition-colors disabled:opacity-50",
                    s.is_saved
                      ? "border-danger-400/50 text-danger-400 bg-danger-400/10 hover:bg-danger-400/20"
                      : "border-ink-700 text-ink-300 bg-ink-800 hover:bg-ink-700"
                  )}
                >
                  {s.is_saved ? 'Bỏ khỏi shortlist' : 'Lưu shortlist'}
                </button>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </motion.div>
  );
};

export default ScholarshipDetailPage;
