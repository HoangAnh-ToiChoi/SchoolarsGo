import AdminPagination from '~/components/admin/adminPagination';
import AdminSkeletonRow from '~/components/admin/adminSkeletonRow';

// Khung bảng của trang quản trị: lỗi, tiêu đề cột, dòng chờ tải, dòng rỗng, phân trang.
// columns: [{ label, align: 'text-left' | 'text-right' }]; children là các <tr> dữ liệu.
export default function AdminTable({
  columns, isLoading, error, errorText, skeletonCount, isEmpty, emptyText, meta, setPage, children,
}) {
  let body = children;
  if (isEmpty) {
    body = (
      <tr>
        <td colSpan={columns.length} className="px-4 py-16 text-center text-ink-500 italic">
          {emptyText}
        </td>
      </tr>
    );
  }
  if (isLoading) {
    body = Array.from({ length: skeletonCount }).map((_, i) => <AdminSkeletonRow key={i} cells={columns.length} />);
  }

  return (
    <div className="card overflow-hidden">
      {error ? (
        <div className="p-12 text-center text-danger-400">{errorText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800">
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 ${col.align} text-caption font-semibold uppercase tracking-wider text-ink-500`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">{body}</tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && meta.totalPages > 1 && <AdminPagination meta={meta} setPage={setPage} />}
    </div>
  );
}
