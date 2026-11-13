import { useEndSession, useLogout, useSessions } from '~/hooks/useAuth';

export default function SessionList() {
  const { data: sessions, isLoading, isError, refetch } = useSessions();
  const endSession = useEndSession();
  const logout = useLogout();

  const handleEnd = session => {
    if (session.is_current) return logout.mutate();
    endSession.mutate(session.id);
  };

  return (
    <section className="mb-6 rounded-card border border-line bg-surface p-6 sm:p-8">
      <h2 className="mb-2 border-b border-line pb-3 text-lg font-semibold text-fg">Thiết bị đăng nhập</h2>
      <p className="mb-5 text-sm text-fg-muted">Tài khoản được đăng nhập trên tối đa 3 thiết bị.</p>
      {isLoading && <p className="text-sm text-fg-muted">Đang tải danh sách thiết bị…</p>}
      {isError && <div className="flex items-center gap-3 text-sm text-urgent-fg"><span>Không tải được danh sách thiết bị.</span><button onClick={() => refetch()} className="underline">Thử lại</button></div>}
      {!isLoading && !isError && sessions?.length === 0 && <p className="text-sm text-fg-muted">Chưa có thiết bị đăng nhập nào.</p>}
      <ul className="space-y-3">
        {sessions?.map(session => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4">
            <div>
              <p className="font-medium text-fg">{session.device_name || 'Thiết bị không xác định'}{session.is_current && <span className="ml-2 text-xs text-brand-600">Thiết bị này</span>}</p>
              <p className="mt-1 text-xs text-fg-muted">Hoạt động gần nhất: {new Date(session.last_used_at).toLocaleString('vi-VN')}</p>
            </div>
            <button
              onClick={() => handleEnd(session)}
              disabled={endSession.isPending || logout.isPending}
              aria-label={`Đăng xuất thiết bị ${session.device_name || 'không xác định'}`}
              className="rounded-control px-3 py-2 text-sm text-urgent-fg hover:bg-urgent-bg disabled:opacity-50"
            >Đăng xuất</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
