import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Copy, Check, GraduationCap, FileText, Globe, Clock, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { chatService } from '../services';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/helpers';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Xin chào! Mình là **ScholarsBot** 👋\n\nMình có thể giúp bạn:\n• 🎓 Tìm học bổng phù hợp với profile của bạn\n• 📋 Tư vấn điều kiện & quy trình ứng tuyển\n• 📝 Hướng dẫn chuẩn bị hồ sơ (SOP, CV học thuật)\n• 🌍 Thông tin du học theo quốc gia\n\nBạn đang tìm học bổng cho bậc học nào? 😊`,
};

const QUICK_REPLIES = [
  { text: 'Học bổng Thạc sĩ tại Úc', icon: GraduationCap },
  { text: 'Học bổng toàn phần GPA 3.5', icon: Sparkles },
  { text: 'Chevening scholarship', icon: Globe },
  { text: 'Deadline sắp tới', icon: Clock },
];

const CAPABILITIES = [
  { icon: GraduationCap, label: 'Tìm học bổng', desc: 'Phù hợp với profile của bạn' },
  { icon: FileText, label: 'Tư vấn hồ sơ', desc: 'SOP, CV, thư giới thiệu' },
  { icon: Globe, label: 'Thông tin du học', desc: 'Theo quốc gia & trường' },
  { icon: Zap, label: 'Cập nhật deadline', desc: 'Nhắc lịch nộp đơn' },
  { icon: BookOpen, label: 'Quy trình ứng tuyển', desc: 'Từng bước chi tiết' },
];

const formatContent = (text) => {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• /gm, '&bull;&nbsp;')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['strong', 'br'], ALLOWED_ATTR: [] });
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800"
      title="Sao chép"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const MessageBubble = ({ message, showAvatar = true }) => {
  const isUser = message.role === 'user';

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
          {isUser
            ? <User className="w-4 h-4 text-ink-950" />
            : <Bot className="w-4 h-4 text-primary-300" />}
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
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
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
};

const TypingIndicator = () => (
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
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full block"
          animate={{
            y: [0, -7, 0],
            backgroundColor: ['#6E7681', '#22d3ee', '#6E7681'],
          }}
          transition={{
            duration: 0.85,
            repeat: Infinity,
            delay: i * 0.17,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  </motion.div>
);

const HistorySeparator = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-ink-800" />
    <span className="text-xs text-ink-600 shrink-0 px-2 py-0.5 rounded-full border border-ink-800">
      Cuộc trò chuyện trước
    </span>
    <div className="flex-1 h-px bg-ink-800" />
  </div>
);

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28, delay: 0.3 + i * 0.08 },
  }),
};

const WelcomeScreen = ({ onQuickReply }) => (
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

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="text-xs text-ink-600"
    >
      Powered by Gemini AI · ScholarsGo
    </motion.p>
  </motion.div>
);

const ChatPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [hasHistory, setHasHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { setHistoryLoaded(true); return; }
    chatService.getHistory()
      .then((res) => {
        const history = res.data?.data?.messages || [];
        if (history.length > 0) {
          setMessages([WELCOME_MESSAGE, ...history]);
          setHasHistory(true);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || isLoading) return;
    if (content.length > 1000) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Tin nhắn quá dài. Vui lòng giới hạn dưới 1000 ký tự.' }]);
      setInput('');
      return;
    }
    const userMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const apiMessages = newMessages
        .filter((m) => m.role !== 'assistant' || m !== WELCOME_MESSAGE)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await chatService.send(apiMessages);
      const reply = res.data?.data?.reply || 'Mình gặp sự cố, bạn thử lại nhé.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 429 ? 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút rồi thử lại.' :
        status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' :
        status === 503 ? 'Dịch vụ AI đang bảo trì. Vui lòng thử lại sau.' :
        'Mình gặp sự cố kết nối. Bạn thử lại nhé.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmptyChat = historyLoaded && messages.length === 1 && !isLoading;
  const charCount = input.length;
  const charOver = charCount > 900;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-ink-950 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-ink-800 bg-ink-900">
        {/* Bot identity */}
        <div className="p-6 border-b border-ink-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary-400/15 border border-primary-400/25 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success-400 border-2 border-ink-900" />
            </div>
            <div>
              <p className="font-bold text-ink-100">ScholarsBot</p>
              <p className="text-xs text-success-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 inline-block animate-pulse" />
                Đang hoạt động
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-500 leading-relaxed">
            Trợ lý AI chuyên về học bổng & du học quốc tế. Powered by Gemini.
          </p>
        </div>

        {/* Capabilities */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-600 mb-3 px-2">Tôi có thể giúp bạn</p>
          <div className="space-y-1">
            {CAPABILITIES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-800 transition-colors cursor-default group">
                <div className="w-8 h-8 rounded-lg bg-ink-800 group-hover:bg-primary-400/15 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-4 h-4 text-ink-400 group-hover:text-primary-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-200">{label}</p>
                  <p className="text-xs text-ink-500 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="p-4 border-t border-ink-800">
          <div className="rounded-xl bg-primary-400/5 border border-primary-400/15 p-3">
            <p className="text-xs text-ink-400 leading-relaxed">
              💡 ScholarsBot có thể mắc lỗi. Luôn kiểm tra thông tin tại website chính thức.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="bg-ink-900 border-b border-ink-800 px-5 py-3.5 flex items-center gap-3 shrink-0">
          <div className="relative lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-400/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-400 border-2 border-ink-900" />
          </div>
          <div>
            <h1 className="font-bold text-ink-100 text-sm sm:text-base">ScholarsBot</h1>
            <p className="text-xs text-ink-500 flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary-400" />
                  <span className="text-primary-400">Đang soạn phản hồi...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 inline-block" />
                  Trợ lý AI học bổng · Powered by Gemini
                </>
              )}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-500 bg-ink-800 border border-ink-700 rounded-full px-3 py-1">
              <Sparkles className="w-3 h-3 text-primary-400" />
              <span>AI</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyChat ? (
            <WelcomeScreen onQuickReply={sendMessage} />
          ) : (
            <div className="px-4 py-6 max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    {hasHistory && i === 1 && <HistorySeparator />}
                    <MessageBubble
                      message={msg}
                      showAvatar={i === 0 || messages[i - 1]?.role !== msg.role}
                    />
                  </div>
                ))}
                {isLoading && <TypingIndicator key="typing" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Quick reply chips — shown mid-chat if few messages */}
        {historyLoaded && messages.length > 1 && messages.length <= 3 && !isLoading && (
          <div className="px-4 pb-2 shrink-0">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {QUICK_REPLIES.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-1.5 text-xs bg-ink-900 border border-ink-800 text-ink-400 rounded-full px-3 py-1.5 hover:border-primary-400/50 hover:text-primary-300 transition-colors"
                >
                  <Icon className="w-3 h-3" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-ink-800 bg-ink-900 px-4 py-3 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className={cn(
              'flex items-end gap-2 rounded-xl border bg-ink-950 transition-all duration-200 px-4 py-2',
              'focus-within:border-primary-400/50 focus-within:shadow-glow-sm',
              charOver ? 'border-danger-500/50' : 'border-ink-700'
            )}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về học bổng, hồ sơ, deadline..."
                disabled={isLoading}
                maxLength={1000}
                className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none disabled:opacity-50 py-1.5 resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2 pb-1.5">
                {charCount > 500 && (
                  <span className={cn('text-xs tabular-nums', charOver ? 'text-danger-400' : 'text-ink-600')}>
                    {charCount}/1000
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                    input.trim() && !isLoading
                      ? 'bg-primary-400 text-ink-950 hover:bg-primary-300 hover:shadow-glow-sm'
                      : 'bg-ink-800 text-ink-600 cursor-not-allowed'
                  )}
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-xs text-ink-700">
              Enter để gửi · ScholarsBot có thể mắc lỗi
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
