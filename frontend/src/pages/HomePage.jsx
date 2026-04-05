import { Link } from 'react-router-dom';
import { GraduationCap, Search, Star, ArrowRight } from 'lucide-react';
import { useScholarships } from '../hooks/useScholarship';

const HomePage = () => {
  const { data: featured, isLoading } = useScholarships({ featured: 'true', limit: 6 });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 text-white">
        <div className="container-page py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-tag px-4 py-2 mb-8">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-body-sm font-medium">500+ Học bổng đang chờ bạn</span>
            </div>
            <h1 className="text-4xl md:text-display font-extrabold mb-6 leading-tight">
              Tìm Học Bổng Du Học<br />
              <span className="text-yellow-300">Phù Hợp Nhất</span>
            </h1>
            <p className="text-body-lg text-primary-100 mb-10 max-w-2xl mx-auto">
              ScholarsGo giúp sinh viên Việt Nam tìm kiếm và ứng tuyển học bổng du học
              với công nghệ AI thông minh, quản lý hồ sơ chuyên nghiệp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/scholarships"
                className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 shadow-lg"
              >
                <Search className="w-5 h-5" />
                Tìm Học Bổng Ngay
              </Link>
              <Link
                to="/register"
                className="btn btn-lg bg-primary-500/20 backdrop-blur-sm border border-white/30 text-white hover:bg-primary-500/30"
              >
                Đăng Ký Miễn Phí
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-section bg-white">
        <div className="container-page">
          <div className="text-center mb-16">
            <h2 className="section-title">Tại sao chọn ScholarsGo?</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Nền tảng toàn diện giúp bạn từ tìm kiếm đến khi nhận học bổng
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-heading-3 text-gray-900 mb-3">Tìm Kiếm Thông Minh</h3>
              <p className="text-body text-gray-600">Filter theo quốc gia, ngành học, GPA, deadline — tìm học bổng phù hợp trong giây lát</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-heading-3 text-gray-900 mb-3">Quản Lý Hồ Sơ</h3>
              <p className="text-body text-gray-600">Upload và quản lý CV, SOP, bảng điểm, thư giới thiệu — mọi thứ ở một nơi</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-heading-3 text-gray-900 mb-3">Gợi Ý AI</h3>
              <p className="text-body text-gray-600">Công nghệ AI phân tích profile và gợi ý học bổng phù hợp nhất với bạn</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
