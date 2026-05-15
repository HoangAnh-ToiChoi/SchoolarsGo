import { Heart, Sparkles } from 'lucide-react';
import { useSavedScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import AnimatedPage from '../components/ui/AnimatedPage';

const SavedPage = () => {
  const { data, isLoading } = useSavedScholarships();

  const saved = data?.data || [];

  return (
    <AnimatedPage className="landing-theme min-h-screen relative overflow-hidden bg-[#050510] text-white pb-24">
      <AuroraBackground />
      
      <div className="container-page relative z-10 pt-24 md:pt-32 mb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Heart className="w-4 h-4 text-purple-400" />
            <span className="text-purple-100">Danh sách theo dõi</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Học Bổng Đã Lưu
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Các cơ hội học bổng bạn đã bookmark để tiện theo dõi và lên kế hoạch ứng tuyển.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center"><LoadingSpinner /></div>
        ) : saved.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-[0_0_40px_rgba(168,85,247,0.1)]">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Chưa có học bổng nào</h2>
            <p className="text-white/60 text-lg mb-8">
              Khám phá danh sách hàng ngàn học bổng toàn cầu và thả tim để lưu vào danh sách của bạn.
            </p>
            <Link to="/scholarships" className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              Tìm học bổng ngay
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((item) => (
              <ScholarshipCard key={item.id} scholarship={item.scholarship} isDark={true} />
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default SavedPage;
