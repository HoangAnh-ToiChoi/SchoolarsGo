import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Compass, Search, Sparkles, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
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
      question: 'ScholarsGo hỗ trợ tiếng Việt không?',
      answer: 'Đúng vậy, giao diện và hỗ trợ hoàn toàn bằng tiếng Việt để phục vụ cộng đồng người Việt Nam tốt nhất.',
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
                Khám phá học bổng quốc tế dễ dàng với ScholarsGo
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-display">
                Nền tảng thông minh giúp bạn tìm và giành học bổng mơ ước
              </h1>
              <p className="mt-6 max-w-2xl text-body-lg text-sky-50/88">
                Từ việc khám phá hàng nghìn học bổng quốc tế đến theo dõi hồ sơ ứng tuyển cá nhân hóa, ScholarsGo đồng hành cùng bạn trên mọi bước đi để biến giấc mơ du học thành hiện thực.
              </p>
              <form onSubmit={handleSearch} className="mt-8 grid gap-2 rounded-[1.5rem] border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:gap-3 sm:p-4 md:grid-cols-[1fr_auto_auto]">
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Thử nhập: Chevening, Australia Awards, Data Science..."
                  icon={Search}
                  className="border-white/15 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-sky-300 text-sm md:text-base"
                  wrapperClassName="min-w-0"
                />
                <Button type="submit" size="lg" leftIcon={Search} className="bg-slate-950 text-white hover:bg-slate-800 text-sm md:text-base">
                  Tìm học bổng
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setIsRoadmapOpen(true)}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white text-sm md:text-base"
                >
                  Xem lộ trình
                </Button>
              </form>
              <div className="mt-8 flex flex-wrap gap-3 text-body-sm text-sky-100/90">
                <span className="tag bg-white/10 text-white">Tìm kiếm theo ngành học</span>
                <span className="tag bg-white/10 text-white">Lưu danh sách yêu thích</span>
                <span className="tag bg-white/10 text-white">Theo dõi deadline tự động</span>
                <span className="tag bg-white/10 text-white">Gợi ý cá nhân hóa</span>
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
          <div className="mb-16 text-center">
            <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">FAQ</p>
            <h2 className="section-title mt-2">Câu hỏi thường gặp</h2>
            <p className="mt-4 max-w-2xl mx-auto text-body text-gray-600">
              Tìm hiểu nhanh về cách ScholarsGo hoạt động và hỗ trợ bạn trong hành trình giành học bổng.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map(({ question, answer }, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body text-gray-700">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-section bg-slate-50">
        <div className="container-page">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Cách thức hoạt động</p>
              <h2 className="section-title mt-2">3 bước để bắt đầu hành trình du học</h2>
            </div>
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
                  Quy trình được thiết kế đơn giản và trực quan để bạn dễ dàng quản lý toàn bộ hành trình ứng tuyển học bổng.
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
              <h2 className="section-title mt-2">Học bổng nổi bật tuần này</h2>
            </div>
            <Link to="/scholarships" className="btn-ghost self-start md:self-auto">
              Xem tất cả học bổng
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

      <section className="py-section bg-slate-50">
        <div className="container-page">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Personalized recommendations</p>
              <h2 className="section-title mt-2">Học bổng gợi ý cho bạn</h2>
            </div>
            <Link to="/scholarships" className="btn-ghost self-start md:self-auto">
              Xem thêm gợi ý
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recommendedScholarships.slice(0, 3).map((scholarship) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
              ))}
            </div>
          )}

          {!recLoading && recommendedScholarships.length === 0 && (
            <Card>
              <CardContent className="flex min-h-48 items-center justify-center text-center text-body text-gray-500">
                Chưa có gợi ý học bổng cá nhân hóa. Hãy hoàn thiện profile để nhận đề xuất phù hợp.
              </CardContent>
            </Card>
          )}
        </div>
      </section>   
    </div>
  );
};

export default HomePage;
