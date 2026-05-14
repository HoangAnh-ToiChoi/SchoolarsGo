import { Link } from 'react-router-dom';

// Inline SVG Icons
const CalendarIcon = () => (
  <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ArrowRightIcon = ({ className }) => (
  <svg className={className || "h-4 w-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

// This component will accept dynamic data from HomePage
export function ScholarshipPreview({ scholarships = [] }) {
  // Use dummy data if none provided (for preview)
  const displayScholarships = scholarships.length > 0 ? scholarships : [
    {
      id: "chevening",
      title: "Chevening Scholarship",
      country: "UK",
      degreeLevel: "Master",
      deadline: "2026-11-01T00:00:00.000Z",
      description: "Học bổng toàn phần từ Chính phủ Anh dành cho các nhà lãnh đạo tương lai.",
      flag: "🇬🇧",
    },
    {
      id: "fulbright",
      title: "Fulbright Program",
      country: "USA",
      degreeLevel: "Master/PhD",
      deadline: "2026-10-15T00:00:00.000Z",
      description: "Chương trình trao đổi giáo dục hàng đầu thế giới từ Hoa Kỳ.",
      flag: "🇺🇸",
    },
    {
      id: "mext",
      title: "MEXT Scholarship",
      country: "Japan",
      degreeLevel: "Bachelor/Master",
      deadline: "2026-04-30T00:00:00.000Z",
      description: "Học bổng Chính phủ Nhật Bản với mức hỗ trợ sinh hoạt phí hàng tháng.",
      flag: "🇯🇵",
    },
  ];

  return (
    <section id="scholarships" className="relative py-24 px-4 z-10">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Học bổng nổi bật
          </h2>
          <p className="mx-auto max-w-2xl text-white/60">
            Khám phá các học bổng hàng đầu thế giới đang chờ đón bạn
          </p>
        </div>

        {/* Scholarship Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {displayScholarships.slice(0, 3).map((scholarship) => (
            <div
              key={scholarship.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="relative border-b border-white/10 p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                    {scholarship.flag || "🎓"}
                  </div>
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 ring-1 ring-purple-500/30">
                    {scholarship.degreeLevel || scholarship.degree}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                  {scholarship.title || scholarship.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-white/50">
                  <MapPinIcon />
                  {scholarship.country}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="mb-4 text-sm text-white/60 leading-relaxed line-clamp-3">
                  {scholarship.description}
                </p>

                {/* Deadline */}
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <CalendarIcon />
                  <span className="text-sm text-white/70">
                    Deadline: <span className="font-medium text-cyan-400">
                      {new Date(scholarship.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  </span>
                </div>

                {/* CTA Button */}
                <Link to={`/scholarships/${scholarship.id}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-cyan-600/80 px-4 py-3 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-purple-500/20">
                  Xem chi tiết
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link to="/scholarships" className="group inline-flex items-center gap-2 text-purple-400 transition-colors hover:text-purple-300">
            Xem tất cả học bổng
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
