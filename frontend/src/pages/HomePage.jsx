import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Brain, Compass, Search, Sparkles, Star, Trophy } from 'lucide-react';
import LatestNewsSection from '../components/LatestNewsSection';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '../components/ui';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();
    navigate(query ? `/scholarships?search=${encodeURIComponent(query)}` : '/scholarships');
  };

  const highlights = [
    { label: 'Học bổng & Chương trình', value: '1000+', icon: Star },
    { label: 'Quốc gia & Vùng lãnh thổ', value: '50+', icon: Compass },
    { label: 'AI Gợi ý cá nhân hóa', value: 'AI', icon: Brain },
  ];

  const processSteps = [
    {
      title: 'Khám phá cơ hội',
      description: 'Bắt đầu từ bộ lọc theo quốc gia, ngành, bậc học và mức hỗ trợ tài chính.',
      icon: Search,
    },
    {
      title: 'Chuẩn bị hồ sơ',
      description: 'Tập trung CV, SOP, bảng điểm và các giấy tờ quan trọng trong một luồng rõ ràng.',
      icon: BookOpen,
    },
    {
      title: 'Theo dõi tiến độ',
      description: 'Quản lý deadline và trạng thái ứng tuyển để không bỏ sót từng mốc quan trọng.',
      icon: Trophy,
    },
  ];

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-sky-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.22),_transparent_24%)]" />
        <div className="container-page relative py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-tag border border-white/15 bg-white/10 px-4 py-2 text-body-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Nền tảng tìm học bổng thông minh
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-display">
                Cánh cửa đến học bổng quốc tế của bạn
              </h1>
              <p className="mt-6 max-w-2xl text-body-lg text-sky-50/88">
                ScholarsGo giúp sinh viên Việt Nam tìm và ứng tuyển học bổng quốc tế — từ tìm kiếm đến theo dõi hồ sơ, tất cả trong một nơi.
              </p>
              <form onSubmit={handleSearch} className="mt-8 grid gap-3 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:grid-cols-[1fr_auto]">
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Thử nhập: Chevening, Australia Awards, Data Science..."
                  icon={Search}
                  className="border-white/15 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-sky-300"
                  wrapperClassName="sm:min-w-0"
                />
                <Button type="submit" size="lg" leftIcon={Search} className="bg-slate-950 text-white hover:bg-slate-800">
                  Tìm học bổng
                </Button>
              </form>
              <div className="mt-8 flex flex-wrap gap-3 text-body-sm text-sky-100/90">
                <span className="tag bg-white/10 text-white">Tìm theo quốc gia</span>
                <span className="tag bg-white/10 text-white">Lưu shortlist học bổng</span>
                <span className="tag bg-white/10 text-white">Theo dõi deadline</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {highlights.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="border-white/10 bg-white/10 text-white shadow-none backdrop-blur-md">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                        <Icon className="w-5 h-5 text-sky-100" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-body-sm text-sky-100/80">{label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-section bg-surface">
        <div className="container-page">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Cách hoạt động</p>
              <h2 className="section-title mt-2">Từ tìm kiếm đến ứng tuyển thành công</h2>
            </div>
            <p className="max-w-2xl text-body text-gray-600">
              Ba bước đơn giản giúp bạn từ việc khám phá cơ hội đến nộp hồ sơ hoàn chỉnh một cách có tổ chức.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {processSteps.map(({ title, description, icon: Icon }) => (
              <Card key={title} hover>
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="mt-5">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-section bg-surface">
        <div className="container-page">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-500">AI Recommend</p>
              <h2 className="section-title mt-2">Học bổng gợi ý dành riêng cho bạn</h2>
            </div>
            <p className="max-w-xl text-body text-gray-600">Điền profile một lần, hệ thống AI phân tích và gợi ý học bổng phù hợp nhất với GPA, IELTS và ngành học của bạn.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Brain, title: 'Phân tích profile', desc: 'Hệ thống đọc GPA, IELTS, ngành học và mục tiêu quốc gia của bạn.' },
              { icon: Sparkles, title: 'AI tìm học bổng phù hợp', desc: 'Gemini AI so sánh profile với hàng trăm học bổng, tính điểm phù hợp và giải thích lý do.' },
              { icon: Trophy, title: 'Tập trung vào ứng tuyển', desc: 'Chỉ xem những học bổng thực sự phù hợp, tiết kiệm thời gian nghiên cứu.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} hover>
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="mt-5">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/recommend" className="btn-primary btn-lg">
              <Sparkles className="w-5 h-5" />Xem gợi ý học bổng của tôi
            </Link>
          </div>
        </div>
      </section>

      <LatestNewsSection />

      <section className="py-section bg-surface-muted">
        <div className="container-page">
          <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-950 via-primary-900 to-sky-800 text-white shadow-card-hover">
            <CardContent className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-sky-200">Bắt đầu ngay hôm nay</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight">Hàng nghìn sinh viên đã tìm được học bổng phù hợp — đến lượt bạn.</h2>
                <p className="mt-4 max-w-2xl text-body text-sky-100/85">
                  Tạo tài khoản miễn phí, điền profile và để AI ScholarsGo gợi ý những học bổng phù hợp nhất với bạn.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/register" className="btn btn-lg bg-white text-primary-700 hover:bg-sky-50">
                  Tạo tài khoản miễn phí
                </Link>
                <Link to="/scholarships" className="btn btn-lg border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Khám phá học bổng
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
