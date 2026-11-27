// Tiêu đề trang quản trị: tên trang + tổng số bản ghi (chưa có thì ghi "Danh sách …")
export default function AdminPageTitle({ title, total, unit, className }) {
  return (
    <div className={className}>
      <h1 className="text-heading-1 text-ink-100">{title}</h1>
      <p className="text-body-sm text-ink-400 mt-1">
        {total > 0 ? `${total} ${unit}` : `Danh sách ${unit}`}
      </p>
    </div>
  );
}
