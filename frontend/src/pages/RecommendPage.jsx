import { Link } from 'react-router-dom';
import { Sparkles, MapPin, GraduationCap, ChevronRight, Brain, AlertCircle } from 'lucide-react';
import { useRecommend } from '../hooks/useRecommend';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { EmptyState } from '../components/ui';

const MatchBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'bg-success-500' : pct >= 40 ? 'bg-warning-500' : 'bg-danger-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-ink-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-body-sm font-bold text-ink-200 w-10 text-right">{pct}%</span>
    </div>
  );
};

const RecommendPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error } = useRecommend(10, !!user);

  const recommendations = data?.data || [];

  return (
    <div className="bg-ink-950 min-h-screen">
      <div className="bg-ink-950 border-b border-ink-800 py-14">
        <div className="container-page">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-400/15">
              <Brain className="w-5 h-5 text-primary-300" />
            </div>
            <span className="text-body-sm font-semibold uppercase tracking-widest text-primary-400">AI Recommend</span>
          </div>
          <h1 className="text-heading-1 md:text-display font-extrabold leading-tight mb-3 text-ink-100">
            Học bổng dành riêng cho bạn
          </h1>
          <p className="text-body-lg text-ink-400 max-w-2xl">
            Hệ thống phân tích profile của bạn và gợi ý những học bổng phù hợp nhất — có lý do cụ thể vì sao.
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        {!user ? (
          <EmptyState icon={AlertCircle} title="Vui lòng đăng nhập" description="Bạn cần đăng nhập để nhận gợi ý học bổng cá nhân hóa" actionLabel="Đăng nhập" actionTo="/login" />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState icon={AlertCircle} title="Cần cập nhật profile" description={error.message || 'Hãy điền GPA, IELTS và ngành học trong profile để nhận gợi ý'} actionLabel="Cập nhật Profile" actionTo="/dashboard" />
        ) : recommendations.length === 0 ? (
          <EmptyState icon={Brain} title="Chưa tìm được học bổng phù hợp" description="Hãy cập nhật đầy đủ GPA, IELTS, ngành học và quốc gia mục tiêu trong profile của bạn" actionLabel="Cập nhật Profile" actionTo="/dashboard" />
        ) : (
          <>
            <p className="text-body text-ink-400 mb-6">Tìm thấy <strong className="text-ink-100">{recommendations.length}</strong> học bổng phù hợp với profile của bạn</p>
            <div className="grid gap-6 md:grid-cols-2">
              {recommendations.map(({ scholarship, match_score, reasons, ai_reason }) => (
                <div key={scholarship.id} className="card card-body flex flex-col gap-4 bg-ink-900 border border-ink-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-heading-3 text-ink-100 leading-snug line-clamp-2">{scholarship.title}</h3>
                      <p className="text-body-sm text-ink-400 mt-1">{scholarship.provider}</p>
                    </div>
                    <Link to={`/scholarships/${scholarship.id}`} className="shrink-0 btn-primary btn-sm">
                      Xem <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="tag"><MapPin className="w-3 h-3" />{scholarship.country}</span>
                    <span className="tag"><GraduationCap className="w-3 h-3" />{scholarship.degree}</span>
                  </div>

                  <div>
                    <p className="text-body-sm font-medium text-ink-300 mb-2">Độ phù hợp</p>
                    <MatchBar score={match_score} />
                  </div>

                  {reasons?.length > 0 && (
                    <ul className="space-y-1">
                      {reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-body-sm text-ink-300">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}

                  {ai_reason && (
                    <div className="flex items-start gap-2 rounded-xl bg-primary-400/10 px-4 py-3 border border-primary-400/20">
                      <Sparkles className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                      <p className="text-body-sm italic text-primary-300">{ai_reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecommendPage;
