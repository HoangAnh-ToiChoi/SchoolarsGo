// Hiện khi dữ liệu tải quá lâu (quá 5 giây) để người dùng biết hệ thống vẫn đang chạy
export default function SlowLoading({ message = 'Máy chủ phản hồi chậm hơn bình thường, vui lòng đợi thêm chút…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-tile border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden="true" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
