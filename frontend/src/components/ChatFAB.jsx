import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles } from 'lucide-react';

const ChatFAB = () => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Ẩn khi đang ở trang chat
  if (pathname === '/chat') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip label */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-xl px-3.5 py-2 shadow-card-hover pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            <span className="text-sm font-medium text-ink-100 whitespace-nowrap">Chat với ScholarsBot</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => navigate('/chat')}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.6 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        className="relative w-14 h-14 rounded-2xl bg-primary-400 text-ink-950 flex items-center justify-center shadow-glow-lg"
        style={{ boxShadow: hovered ? '0 0 32px rgba(34,211,238,0.5)' : '0 0 20px rgba(34,211,238,0.25)' }}
      >
        {/* Ping ring */}
        <span className="absolute inset-0 rounded-2xl bg-primary-400/40 animate-ping" style={{ animationDuration: '2.4s' }} />

        <Bot className="w-6 h-6 relative z-10" />

        {/* AI badge */}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 1 }}
          className="absolute -top-1.5 -right-1.5 bg-ink-950 border border-primary-400/50 text-primary-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none z-10"
        >
          AI
        </motion.span>
      </motion.button>
    </div>
  );
};

export default ChatFAB;
