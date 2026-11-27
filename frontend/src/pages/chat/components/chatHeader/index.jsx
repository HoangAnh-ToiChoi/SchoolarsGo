import { Bot, Loader2, Sparkles } from 'lucide-react';

export default function ChatHeader({ isLoading }) {
  return (
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
  );
}
