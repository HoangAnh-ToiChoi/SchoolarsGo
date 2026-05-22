import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Globe, GraduationCap, Users, Star } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { useCounter } from '../../hooks/useCounter';

const StatItem = ({ value, suffix = '', label, delay, icon: _Icon }) => {
  const [ref, inView] = useInView();
  const count = useCounter(inView ? value : 0, 1400);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex items-center gap-1.5 text-3xl sm:text-4xl font-extrabold text-primary-400 tabular-nums glow-text">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-ink-500 font-medium tracking-wide uppercase">{label}</div>
    </motion.div>
  );
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero({ totalScholarships }) {
  return (
    <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800 py-24 sm:py-32">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Ambient orbs */}
      <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-400/[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="container-page relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-400/25 bg-primary-400/8 px-4 py-1.5 text-sm font-medium text-primary-300">
              <Sparkles className="w-3.5 h-3.5" />
              Nền tảng tìm học bổng #1 cho sinh viên Việt Nam
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-ink-100 leading-[1.05] tracking-tight mb-6"
          >
            Chạm tay đến<br />
            <span className="text-gradient-cyan glow-text">học bổng mơ ước</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-ink-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Khám phá hàng nghìn học bổng toàn cầu, nhận gợi ý AI cá nhân hóa và
            quản lý toàn bộ hồ sơ ứng tuyển — tất cả trong một nền tảng.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              to="/scholarships"
              className="btn-primary btn-lg group"
            >
              Khám phá học bổng
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/recommend"
              className="btn-secondary btn-lg"
            >
              <Sparkles className="w-4 h-4 text-primary-400" />
              Gợi ý AI cho tôi
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="inline-grid grid-cols-3 gap-8 sm:gap-12 border border-ink-800 rounded-2xl bg-ink-900/80 backdrop-blur-sm px-8 sm:px-12 py-6 w-full max-w-lg mx-auto"
          >
            <StatItem value={totalScholarships || 500} suffix="+" label="Học bổng" delay={0.4} icon={GraduationCap} />
            <StatItem value={50} suffix="+" label="Quốc gia" delay={0.5} icon={Globe} />
            <StatItem value={10000} suffix="+" label="Sinh viên" delay={0.6} icon={Users} />
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-ink-500"
          >
            <div className="flex -space-x-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-ink-800 border-2 border-ink-950 flex items-center justify-center text-xs font-bold text-ink-300">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning-400 text-warning-400" />)}
            </div>
            <span>Được tin dùng bởi <strong className="text-ink-300">10,000+</strong> sinh viên</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
