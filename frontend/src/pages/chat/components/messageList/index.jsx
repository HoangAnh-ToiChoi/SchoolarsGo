import { AnimatePresence } from 'framer-motion';
import HistorySeparator from '~/pages/chat/components/historySeparator';
import MessageBubble from '~/pages/chat/components/messageBubble';
import TypingIndicator from '~/pages/chat/components/typingIndicator';

// Tin [0] là lời chào; có lịch sử thì vạch ngăn "Cuộc trò chuyện trước" đặt trước tin [1]
export default function MessageList({ messages, hasHistory, isLoading, bottomRef }) {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <div key={i}>
            {hasHistory && i === 1 && <HistorySeparator />}
            <MessageBubble message={msg} showAvatar={i === 0 || messages[i - 1]?.role !== msg.role} />
          </div>
        ))}
        {isLoading && <TypingIndicator key="typing" />}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
