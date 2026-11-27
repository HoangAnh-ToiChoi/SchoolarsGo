import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { QUICK_REPLIES } from '~/pages/chat/constants';

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28, delay: 0.3 + i * 0.08 },
  }),
};

export default function WelcomeScreen({ onQuickReply }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center h-full py-12 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary-400/15 border border-primary-400/25 flex items-center justify-center animate-pulse-glow">
          <Bot className="w-10 h-10 text-primary-400" />
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.4 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success-400 border-2 border-ink-950 block"
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="text-2xl font-bold text-ink-100 mb-2"
      >
        Xin chào! Mình là ScholarsBot
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="text-ink-400 max-w-sm mb-8 text-sm leading-relaxed"
      >
        Trợ lý AI chuyên về học bổng & du học. Hỏi mình bất cứ điều gì về cơ hội học bổng của bạn.
      </motion.p>

      <div className="w-full max-w-md grid grid-cols-2 gap-2 mb-6">
        {QUICK_REPLIES.map(({ text, icon: Icon }, i) => (
          <motion.button
            key={text}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onQuickReply(text)}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-800 bg-ink-900 text-left text-sm text-ink-300 hover:border-primary-400/40 hover:text-primary-300 hover:bg-ink-800 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary-400/10 flex items-center justify-center shrink-0 group-hover:bg-primary-400/20 transition-colors">
              <Icon className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <span className="line-clamp-2 leading-snug">{text}</span>
          </motion.button>
        ))}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs text-ink-600">
        Powered by Gemini AI · ScholarsGo
      </motion.p>
    </motion.div>
  );
}
