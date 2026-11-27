import { Bot } from 'lucide-react';
import { CAPABILITIES } from '~/pages/chat/constants';

export default function ChatSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-ink-800 bg-ink-900">
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

      <div className="p-4 border-t border-ink-800">
        <div className="rounded-xl bg-primary-400/5 border border-primary-400/15 p-3">
          <p className="text-xs text-ink-400 leading-relaxed">
            💡 ScholarsBot có thể mắc lỗi. Luôn kiểm tra thông tin tại website chính thức.
          </p>
        </div>
      </div>
    </aside>
  );
}
