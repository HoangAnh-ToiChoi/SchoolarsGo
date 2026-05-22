import { motion } from 'framer-motion';
import { Search, FolderOpen, Sparkles, Calendar, MessageSquare, Globe } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const features = [
  {
    icon: Search,
    title: 'Tìm kiếm thông minh',
    description: 'Lọc theo quốc gia, ngành, GPA, IELTS và mức tài trợ — ra shortlist trong vài giây.',
    color: 'text-primary-400',
    bg: 'bg-primary-400/10 border-primary-400/20',
  },
  {
    icon: Sparkles,
    title: 'Gợi ý từ AI',
    description: 'Hệ thống phân tích profile và đề xuất học bổng phù hợp nhất với điểm số và mục tiêu của bạn.',
    color: 'text-warning-400',
    bg: 'bg-warning-400/10 border-warning-400/20',
  },
  {
    icon: FolderOpen,
    title: 'Quản lý hồ sơ',
    description: 'Theo dõi tiến độ từng đơn ứng tuyển, trạng thái và tài liệu đính kèm một cách trực quan.',
    color: 'text-success-400',
    bg: 'bg-success-400/10 border-success-400/20',
  },
  {
    icon: Calendar,
    title: 'Theo dõi deadline',
    description: 'Lịch hạn nộp trực quan, không bao giờ bỏ lỡ cột mốc quan trọng trong hành trình du học.',
    color: 'text-danger-400',
    bg: 'bg-danger-400/10 border-danger-400/20',
  },
  {
    icon: MessageSquare,
    title: 'Chat với AI',
    description: 'Hỏi đáp về học bổng, quy trình và hồ sơ với trợ lý AI được hỗ trợ bởi Gemini 24/7.',
    color: 'text-primary-300',
    bg: 'bg-primary-300/10 border-primary-300/20',
  },
  {
    icon: Globe,
    title: 'So sánh học bổng',
    description: 'So sánh song song tối đa 3 học bổng để đưa ra quyết định tốt nhất cho tương lai của bạn.',
    color: 'text-warning-300',
    bg: 'bg-warning-300/10 border-warning-300/20',
  },
];

const cardVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }),
};

export function Features() {
  const [ref, inView] = useInView({ threshold: 0.05 });

  return (
    <section className="border-b border-ink-800 bg-ink-950 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-1.5 text-sm text-ink-400 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            Tại sao chọn ScholarsGo?
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">
            Mọi thứ bạn cần để{' '}
            <span className="text-gradient-cyan">chinh phục học bổng</span>
          </h2>
          <p className="text-ink-400 max-w-xl mx-auto">
            Từ tìm kiếm đến ứng tuyển — chúng tôi đồng hành cùng bạn trong toàn bộ hành trình.
          </p>
        </div>

        {/* Feature grid */}
        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="group relative rounded-card border border-ink-800 bg-ink-900 p-7
                         transition-all duration-300
                         hover:border-primary-400/30 hover:-translate-y-1 hover:bg-ink-900/80"
            >
              {/* Icon */}
              <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${f.bg} ${f.color} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-base font-semibold text-ink-100">{f.title}</h3>
              <p className="text-sm text-ink-400 leading-relaxed">{f.description}</p>

              {/* Hover glow accent */}
              <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 70%)' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
