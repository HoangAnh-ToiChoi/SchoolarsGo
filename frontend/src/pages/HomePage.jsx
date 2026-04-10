import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Compass, Search, Sparkles, Star, Trophy } from 'lucide-react';
import { useScholarships } from '../hooks/useScholarship';
import ScholarshipCard from '../components/ScholarshipCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
} from '../components/ui';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const { data: featured, isLoading } = useScholarships({ featured: 'true', limit: 6 });
  const featuredScholarships = featured?.data || [];

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();
    navigate(query ? `/scholarships?search=${encodeURIComponent(query)}` : '/scholarships');
  };

  const highlights = [
    { label: 'Học bổng nổi bật', value: `${featuredScholarships.length || 6}+`, icon: Star },
    { label: 'Luồng theo dõi hồ sơ', value: '4 bước', icon: Compass },
    { label: 'Gợi ý theo profile', value: 'AI-ready', icon: Brain },
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
                Sprint tuần này: dựng UI foundation cho ScholarsGo
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-display">
                Một home page đủ lực để dẫn người dùng từ khám phá đến ứng tuyển.
              </h1>
              <p className="mt-6 max-w-2xl text-body-lg text-sky-50/88">
                Bản layout đầu tiên tập trung vào thông điệp rõ ràng, lối vào tìm kiếm nhanh và các khối nội dung có thể mở rộng tiếp trong các sprint sau.
              </p>
              <form onSubmit={handleSearch} className="mt-8 grid gap-3 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:grid-cols-[1fr_auto_auto]">
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
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setIsRoadmapOpen(true)}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  Xem lộ trình
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

      <section className="py-section bg-white">
        <div className="container-page">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Component-first home</p>
              <h2 className="section-title mt-2">Các block nền để mở rộng landing page</h2>
            </div>
            <p className="max-w-2xl text-body text-gray-600">
              Card, button, input và modal được đưa vào đúng ngữ cảnh sử dụng thay vì dựng rời rạc. Mục tiêu là sprint sau có thể nối tiếp section mới mà không phải đập đi làm lại.
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
                <CardContent className="pt-2 text-body-sm text-gray-500">
                  Thiết kế block theo dạng component giúp section này có thể tái dùng ở onboarding hoặc trang giới thiệu tính năng.
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-section bg-slate-50">
        <div className="container-page">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Featured scholarships</p>
              <h2 className="section-title mt-2">Khối nội dung thật cho trang Home</h2>
            </div>
            <Link to="/scholarships" className="btn-ghost self-start md:self-auto">
              Xem tất cả học bổng
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredScholarships.slice(0, 3).map((scholarship) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
              ))}
            </div>
          )}

          {!isLoading && featuredScholarships.length === 0 && (
            <Card>
              <CardContent className="flex min-h-48 items-center justify-center text-center text-body text-gray-500">
                Chưa có dữ liệu học bổng nổi bật để hiển thị trong block Home.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-section bg-white">
        <div className="container-page">
          <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-950 via-primary-900 to-sky-800 text-white shadow-card-hover">
            <CardContent className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-sky-200">Next up</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight">Home layout đã có khung. Sprint tiếp theo có thể nối sang testimonial, FAQ và recommendation.</h2>
                <p className="mt-4 max-w-2xl text-body text-sky-100/85">
                  Phần này dùng chính Card + Button để giữ mạch UI đồng nhất, hạn chế việc section mới mỗi nơi một kiểu trong các tuần sau.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/register" className="btn btn-lg bg-white text-primary-700 hover:bg-sky-50">
                  Tạo tài khoản miễn phí
                </Link>
                <Button size="lg" variant="secondary" onClick={() => setIsRoadmapOpen(true)} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  Mở roadmap UI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Modal
        open={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        title="Roadmap cho Home UI"
        description="Modal này dùng như một phần của component library mới, đồng thời đóng vai trò preview các bước triển khai tiếp theo."
      >
        <div className="space-y-4">
          {[
            'Chốt visual direction và refine spacing/typography cho toàn bộ landing page.',
            'Bổ sung testimonial, FAQ và recommendation section để nội dung Home đầy hơn.',
            'Nối search query từ hero xuống danh sách học bổng để CTA đầu trang có tác dụng tức thời.',
          ].map((item, index) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              <p className="text-body text-slate-700">{item}</p>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsRoadmapOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
