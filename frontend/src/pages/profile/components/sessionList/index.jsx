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
    <section className="mb-6 rounded-card border border-ink-800 bg-ink-900 p-6 sm:p-8">
      <h2 className="mb-2 border-b border-ink-800 pb-3 text-lg font-semibold text-ink-100">Thiết bị đăng nhập</h2>
      <p className="mb-5 text-sm text-ink-400">Tài khoản được đăng nhập trên tối đa 3 thiết bị.</p>
      {isLoading && <p className="text-sm text-ink-400">Đang tải danh sách thiết bị…</p>}
      {isError && <div className="flex items-center gap-3 text-sm text-danger-400"><span>Không tải được danh sách thiết bị.</span><button onClick={() => refetch()} className="underline">Thử lại</button></div>}
      {!isLoading && !isError && sessions?.length === 0 && <p className="text-sm text-ink-400">Chưa có thiết bị đăng nhập nào.</p>}
      <ul className="space-y-3">
        {sessions?.map(session => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-800 p-4">
            <div>
              <p className="font-medium text-ink-100">{session.device_name || 'Thiết bị không xác định'}{session.is_current && <span className="ml-2 text-xs text-primary-300">Thiết bị này</span>}</p>
              <p className="mt-1 text-xs text-ink-500">Hoạt động gần nhất: {new Date(session.last_used_at).toLocaleString('vi-VN')}</p>
            </div>
            <button
              onClick={() => handleEnd(session)}
              disabled={endSession.isPending || logout.isPending}
              className="rounded-control px-3 py-2 text-sm text-danger-400 hover:bg-ink-800 disabled:opacity-50"
            >Đăng xuất</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
