import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { color } from '~/utils/palette';

const DOTS = [0, 1, 2];

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -28, scale: 0.86 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="flex gap-3 mb-3 items-end"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 26, delay: 0.06 }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800 ring-2 ring-ink-700"
      >
        <Bot className="w-4 h-4 text-primary-300" />
      </motion.div>
      <div className="bg-ink-900 border border-ink-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
        {DOTS.map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full block"
            animate={{
              y: [0, -7, 0],
              backgroundColor: [color('neutral', { mix: 62 }), color('primary'), color('neutral', { mix: 62 })],
            }}
            transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
