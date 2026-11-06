import { DEMO_PROFILE, DEMO_SCHOLARSHIPS } from '~/lib/demo/demoData';

// Axios adapter giả lập API cho bản demo tĩnh. Chỉ dùng khi VITE_DEMO_MODE=true.
const savedIds = new Set(['d3']);

const ok = (config, data) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
const fail = (config, message) =>
  Promise.reject(Object.assign(new Error(message), { config, response: { status: 503, data: { message } } }));

export function demoAdapter(config) {
  const method = config.method.toUpperCase();
  const url = config.url.replace(/^\/+/, '/');
  const params = config.params ?? {};

  if (method === 'GET' && url === '/scholarships') {
    let items = DEMO_SCHOLARSHIPS;
    if (params.degree) items = items.filter((s) => s.degree === params.degree);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      items = items.filter((s) => `${s.title} ${s.provider}`.toLowerCase().includes(q));
    }
    items = [...items].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return ok(config, { success: true, data: items, meta: { page: 1, limit: items.length, total: items.length, totalPages: 1 } });
  }
  const detail = url.match(/^\/scholarships\/([\w-]+)$/);
  if (method === 'GET' && detail) {
    const item = DEMO_SCHOLARSHIPS.find((s) => s.id === detail[1]);
    return item ? ok(config, { success: true, data: item }) : fail(config, 'Không tìm thấy học bổng');
  }
  if (method === 'GET' && url === '/saved') {
    const data = DEMO_SCHOLARSHIPS.filter((s) => savedIds.has(s.id)).map((s) => ({ id: `saved-${s.id}`, scholarship_id: s.id, scholarship: s }));
    return ok(config, { success: true, data });
  }
  const saved = url.match(/^\/saved\/([\w-]+)$/);
  if (saved && (method === 'POST' || method === 'DELETE')) {
    if (method === 'POST') savedIds.add(saved[1]);
    else savedIds.delete(saved[1]);
    return ok(config, { success: true });
  }
  if (method === 'GET' && url === '/profile') return ok(config, { success: true, data: DEMO_PROFILE });
  if (method === 'POST' && url === '/auth/logout') return ok(config, { success: true });

  return fail(config, 'Bản demo chưa kết nối máy chủ, tính năng này tạm chưa dùng được');
}
