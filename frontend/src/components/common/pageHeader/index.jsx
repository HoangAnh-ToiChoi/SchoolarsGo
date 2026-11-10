// Tiêu đề trang: tên + mô tả bên trái, hành động bên phải
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-page-title text-fg">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
