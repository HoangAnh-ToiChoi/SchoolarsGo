import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

export function ScholarshipPreview({ scholarships = [] }) {
  const displayScholarships = scholarships.length > 0 ? scholarships : [
    { id: 'chevening', title: 'Chevening Scholarship', country: 'UK', degree: 'Master', deadline: '2026-11-01T00:00:00.000Z', description: 'Học bổng toàn phần từ Chính phủ Anh dành cho các nhà lãnh đạo tương lai.' },
    { id: 'fulbright', title: 'Fulbright Program', country: 'USA', degree: 'Master/PhD', deadline: '2026-10-15T00:00:00.000Z', description: 'Chương trình trao đổi giáo dục hàng đầu thế giới từ Hoa Kỳ.' },
    { id: 'mext', title: 'MEXT Scholarship', country: 'Japan', degree: 'Bachelor/Master', deadline: '2026-04-30T00:00:00.000Z', description: 'Học bổng Chính phủ Nhật Bản với mức hỗ trợ sinh hoạt phí hàng tháng.' },
  ];

  return (
    <section className="border-b border-ink-800 bg-ink-950 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-ink-100">Học bổng nổi bật</h2>
            <p className="mt-2 text-ink-400">Khám phá các học bổng hàng đầu đang chờ đón bạn</p>
          </div>
          <Link to="/scholarships" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-400 transition-colors">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {displayScholarships.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              to={`/scholarships/${s.id}`}
              className="block rounded-card border border-ink-800 bg-ink-900 hover:border-primary-400/50 transition-colors overflow-hidden"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <span className="inline-flex items-center rounded bg-ink-800 px-2.5 py-1 text-xs font-medium text-ink-300">
                    {s.degree || s.degreeLevel}
                  </span>
                </div>
                <h3 className="mb-1 font-semibold text-ink-100 line-clamp-2">{s.title}</h3>
                <p className="mb-4 flex items-center gap-1 text-sm text-ink-400">
                  <MapPin className="h-3.5 w-3.5" />{s.country}
                </p>
                <p className="mb-5 text-sm text-ink-400 leading-relaxed line-clamp-2">{s.description}</p>
                <div className="flex items-center gap-2 text-sm text-ink-400 border-t border-ink-800 pt-4">
                  <Calendar className="h-4 w-4 text-primary-400" />
                  <span>Deadline: <span className="font-medium text-ink-200">{new Date(s.deadline).toLocaleDateString('vi-VN')}</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/scholarships" className="inline-flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-400">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
