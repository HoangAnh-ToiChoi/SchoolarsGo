export default function HistorySeparator() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-ink-800" />
      <span className="text-xs text-ink-600 shrink-0 px-2 py-0.5 rounded-full border border-ink-800">
        Cuộc trò chuyện trước
      </span>
      <div className="flex-1 h-px bg-ink-800" />
    </div>
  );
}
