import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { chatService } from '../services';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/helpers';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Xin chào! Mình là **ScholarsBot** 👋

Mình có thể giúp bạn:
• 🎓 Tìm học bổng phù hợp với profile của bạn
• 📋 Tư vấn điều kiện & quy trình ứng tuyển
• 📝 Hướng dẫn chuẩn bị hồ sơ (SOP, CV học thuật)
• 🌍 Thông tin du học theo quốc gia

Bạn đang tìm học bổng cho bậc học nào? 😊`,
};

const QUICK_REPLIES = [
  'Tìm học bổng Thạc sĩ tại Úc',
  'Học bổng toàn phần cho GPA 3.5',
  'Chevening scholarship là gì?',
  'Deadline học bổng sắp tới',
];

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  const formatContent = (text) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^• /gm, '&bull; ')
      .replace(/\n/g, '<br/>');
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['strong', 'br'], ALLOWED_ATTR: [] });
  };

  return (
    <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isUser ? 'bg-primary-600' : 'bg-slate-800')}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn('max-w-[75%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed', isUser ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-card text-gray-800 rounded-tl-sm')}
        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
      />
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-3 mb-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-white border border-gray-100 shadow-card rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const HistorySeparator = () => (
  <div className="flex items-center gap-3 my-4 px-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400 shrink-0">Cuộc trò chuyện trước</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
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

  // Load lịch sử chat khi mount (chỉ khi đã đăng nhập)
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
      .catch(() => { /* history unavailable — table chưa migrate */ })
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
      const apiMessages = newMessages.filter((m) => m.role !== 'assistant' || m !== WELCOME_MESSAGE).map((m) => ({ role: m.role, content: m.content }));
      const res = await chatService.send(apiMessages);
      const reply = res.data?.data?.reply || 'Mình gặp sự cố, bạn thử lại nhé.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const status = err.response?.status;
      const friendlyMsg =
        status === 429 ? 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút rồi thử lại.' :
        status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' :
        status === 503 ? 'Dịch vụ AI đang bảo trì. Vui lòng thử lại sau.' :
        'Mình gặp sự cố kết nối. Bạn thử lại nhé.';
      setMessages((prev) => [...prev, { role: 'assistant', content: friendlyMsg }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-primary-900 text-white px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <Bot className="w-5 h-5 text-sky-200" />
        </div>
        <div>
          <h1 className="font-bold text-white">ScholarsBot</h1>
          <p className="text-caption text-sky-200/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Trợ lý AI học bổng · Powered by Gemini
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-0">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i}>
              {/* Separator giữa welcome message và lịch sử cũ */}
              {hasHistory && i === 1 && <HistorySeparator />}
              <MessageBubble message={msg} />
            </div>
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick replies — chỉ hiện khi chưa có conversation (kể cả history) */}
      {historyLoaded && messages.length === 1 && !isLoading && (
        <div className="px-4 pb-2 shrink-0">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {QUICK_REPLIES.map((qr) => (
              <button key={qr} onClick={() => handleQuickReply(qr)} className="text-body-sm bg-white border border-gray-200 rounded-tag px-4 py-2 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors shadow-sm">
                {qr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi về học bổng..."
            disabled={isLoading}
            className="flex-1 border border-gray-200 rounded-input px-4 py-2.5 text-body placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="max-w-3xl mx-auto mt-2 text-caption text-gray-400 text-center">
          ScholarsBot có thể mắc lỗi. Luôn kiểm tra thông tin tại website chính thức của học bổng.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
