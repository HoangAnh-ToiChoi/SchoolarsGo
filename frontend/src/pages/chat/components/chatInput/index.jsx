import { Send, Loader2 } from 'lucide-react';
import { CHAT_COUNTER_FROM, CHAT_MAX_LENGTH, CHAT_WARN_LENGTH } from '~/pages/chat/constants';
import { cn } from '~/utils/cn';

// Enter gửi, Shift + Enter không gửi
export default function ChatInput({ input, setInput, onSend, isLoading, inputRef }) {
  const charCount = input.length;
  const charOver = charCount > CHAT_WARN_LENGTH;
  const canSend = Boolean(input.trim()) && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(input);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  return (
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
            maxLength={CHAT_MAX_LENGTH}
            className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none disabled:opacity-50 py-1.5 resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 pb-1.5">
            {charCount > CHAT_COUNTER_FROM && (
              <span className={cn('text-xs tabular-nums', charOver ? 'text-danger-400' : 'text-ink-600')}>
                {charCount}/{CHAT_MAX_LENGTH}
              </span>
            )}
            <button
              type="submit"
              disabled={!canSend}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                canSend
                  ? 'bg-primary-400 text-ink-950 hover:bg-primary-300 hover:shadow-glow-sm'
                  : 'bg-ink-800 text-ink-600 cursor-not-allowed'
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-xs text-ink-700">Enter để gửi · ScholarsBot có thể mắc lỗi</p>
      </form>
    </div>
  );
}
