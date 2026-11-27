import { QUICK_REPLIES } from '~/pages/chat/constants';

// Gợi ý nhanh dạng chip, hiện giữa cuộc trò chuyện khi còn ít tin
export default function QuickReplyChips({ onSelect }) {
  return (
    <div className="px-4 pb-2 shrink-0">
      <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
        {QUICK_REPLIES.map(({ text, icon: Icon }) => (
          <button
            key={text}
            onClick={() => onSelect(text)}
            className="flex items-center gap-1.5 text-xs bg-ink-900 border border-ink-800 text-ink-400 rounded-full px-3 py-1.5 hover:border-primary-400/50 hover:text-primary-300 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
