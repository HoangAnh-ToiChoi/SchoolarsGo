const SearchIcon = () => (
  <svg className="h-7 w-7 text-purple-500 dark:text-purple-400 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FolderIcon = () => (
  <svg className="h-7 w-7 text-purple-500 dark:text-purple-400 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SparklesIcon = () => (
  <svg className="h-7 w-7 text-purple-500 dark:text-purple-400 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const features = [
  {
    icon: <SearchIcon />,
    title: "Tìm kiếm thông minh",
    description: "Lọc học bổng theo quốc gia, ngành học, GPA và mức hỗ trợ tài chính phù hợp với bạn.",
  },
  {
    icon: <FolderIcon />,
    title: "Quản lý hồ sơ",
    description: "Theo dõi tiến độ ứng tuyển, deadline và các giấy tờ quan trọng một cách trực quan.",
  },
  {
    icon: <SparklesIcon />,
    title: "Gợi ý từ AI",
    description: "Nhận gợi ý học bổng cá nhân hóa dựa trên profile học thuật và mục tiêu của bạn.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 px-4 z-10">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Tính năng nổi bật
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600 dark:text-white/60">
            Tất cả những gì bạn cần để chinh phục học bổng mơ ước
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 backdrop-blur-xl shadow-sm dark:shadow-none transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-cyan-600/5 dark:from-purple-600/10 dark:to-cyan-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Icon */}
              <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-cyan-500/20 ring-1 ring-purple-200 dark:ring-white/10 transition-all group-hover:ring-purple-400 dark:group-hover:ring-purple-500/50">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="relative mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="relative text-gray-600 dark:text-white/60 leading-relaxed">
                {feature.description}
              </p>

              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
