import { Link } from 'react-router-dom';

// Inline SVG Icons
const SparklesIcon = () => (
  <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const ArrowRightIcon = ({ className }) => (
  <svg className={className || "h-5 w-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center px-4 pt-20 z-10">
      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
          <SparklesIcon />
          <span className="text-sm text-purple-300">
            Nền tảng AI hỗ trợ săn học bổng #1 Việt Nam
          </span>
        </div>

        {/* Main Heading with Animated Gradient */}
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-white">ScholarsGo — </span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Chạm tay đến học bổng mơ ước.
          </span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 sm:text-xl">
          Nền tảng AI hỗ trợ săn học bổng và quản lý lộ trình du học toàn diện
          cho sinh viên Việt Nam.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/scholarships" className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50">
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50" />
            <span className="relative flex items-center gap-2">
              Khám phá học bổng ngay
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <a href="#features" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10">
            Tìm hiểu thêm
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: "500+", label: "Học bổng" },
            { value: "50+", label: "Quốc gia" },
            { value: "10K+", label: "Người dùng" },
            { value: "95%", label: "Hài lòng" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
