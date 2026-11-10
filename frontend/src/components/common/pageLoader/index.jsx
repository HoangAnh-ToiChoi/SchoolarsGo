// Vòng xoay khi file của trang chưa tải xong (chỉ thấy ở lần mở đầu tiên)
export default function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Đang tải">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-brand-600 motion-reduce:animate-none" />
    </div>
  );
}
