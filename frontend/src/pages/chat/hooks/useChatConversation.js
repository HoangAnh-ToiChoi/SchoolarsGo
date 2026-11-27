import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { chatService } from '~/services/chat.service';
import { selectIsAuthenticated } from '~/store/slices/authSlice';
import {
  CHAT_HISTORY_SENT, CHAT_MAX_LENGTH, FALLBACK_REPLY, MESSAGE_TOO_LONG, QUICK_CHIPS_MAX_MESSAGES, WELCOME_MESSAGE,
} from '../constants';
import { buildApiMessages, getChatErrorMessage } from '../helpers';

// Hội thoại với ScholarsBot: nạp lịch sử (khi đã đăng nhập), gửi tin, cuộn xuống tin mới nhất
export function useChatConversation() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [hasHistory, setHasHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryLoaded(true);
      return;
    }
    chatService.getHistory()
      .then((res) => {
        const history = res.data?.data?.messages || [];
        if (history.length === 0) return;
        setMessages([WELCOME_MESSAGE, ...history]);
        setHasHistory(true);
      })
      // Lịch sử chỉ để xem lại: tải lỗi thì vẫn chat từ đầu với lời chào, không chặn người dùng
      .catch(() => setHasHistory(false))
      .finally(() => setHistoryLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const appendReply = (content) => setMessages((prev) => [...prev, { role: 'assistant', content }]);

  async function sendMessage(text) {
    const content = text.trim();
    if (!content || isLoading) return;
    if (content.length > CHAT_MAX_LENGTH) {
      appendReply(MESSAGE_TOO_LONG);
      setInput('');
      return;
    }
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const apiMessages = buildApiMessages(newMessages, { skip: WELCOME_MESSAGE, limit: CHAT_HISTORY_SENT });
      const res = await chatService.send(apiMessages);
      appendReply(res.data?.data?.reply || FALLBACK_REPLY);
    } catch (err) {
      appendReply(getChatErrorMessage(err));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  const isIdle = historyLoaded && !isLoading;
  return {
    messages,
    hasHistory,
    isLoading,
    input,
    setInput,
    sendMessage,
    bottomRef,
    inputRef,
    isEmptyChat: isIdle && messages.length === 1,
    showQuickChips: isIdle && messages.length > 1 && messages.length <= QUICK_CHIPS_MAX_MESSAGES,
  };
}
