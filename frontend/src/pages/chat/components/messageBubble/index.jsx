import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import CopyButton from '~/pages/chat/components/copyButton';
import { CHAT_ALLOWED_TAGS } from '~/pages/chat/constants';
import { toChatHtml } from '~/pages/chat/helpers';
import { cn } from '~/utils/cn';
import { sanitizeHtml } from '~/utils/security';

export default function MessageBubble({ message, showAvatar = true }) {
  const isUser = message.role === 'user';
  const html = sanitizeHtml(toChatHtml(message.content), CHAT_ALLOWED_TAGS);

  return (
    <div className={cn('flex gap-3 mb-3 group items-end', isUser && 'flex-row-reverse')}>
      {showAvatar ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 26, delay: 0.06 }}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2',
            isUser ? 'bg-primary-400 ring-primary-400/30' : 'bg-ink-800 ring-ink-700'
          )}
        >
          {isUser ? <User className="w-4 h-4 text-ink-950" /> : <Bot className="w-4 h-4 text-primary-300" />}
        </motion.div>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
        <motion.div
          initial={{ opacity: 0, x: isUser ? 28 : -28, scale: 0.86 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
          className={cn(
            'max-w-[75%] sm:max-w-[68%] rounded-2xl px-4 py-3 text-sm leading-relaxed cursor-default',
            isUser
              ? 'bg-primary-400 text-ink-950 rounded-tr-sm font-medium shadow-md'
              : 'bg-ink-900 border border-ink-800 text-ink-100 rounded-tl-sm'
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!isUser && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.18 }}
            className="flex items-center gap-1 px-1"
          >
            <CopyButton text={message.content} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
