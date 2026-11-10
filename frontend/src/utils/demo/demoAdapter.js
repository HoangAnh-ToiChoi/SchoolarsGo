import { DEMO_PROFILE, DEMO_SCHOLARSHIPS } from '~/utils/demo/demoData';
import { getScope } from '~/utils/scholarship';

// Axios adapter giả lập API cho bản demo tĩnh. Chỉ dùng khi VITE_DEMO_MODE=true.
const savedIds = new Set(['d1', 'd3', 'd5']);

// Giả lập độ trễ mạng. Thêm ?demoDelay=7000 vào URL để xem trạng thái tải chậm (> 5 giây).
const DELAY_MS = Number(new URLSearchParams(window.location.search).get('demoDelay')) || 600;
const wait = () => new Promise((resolve) => setTimeout(resolve, DELAY_MS));

const ok = (config, data) => wait().then(() => ({ data, status: 200, statusText: 'OK', headers: {}, config }));
const fail = (config, message, status = 503) =>
  Promise.reject(Object.assign(new Error(message), { config, response: { status, data: { message } } }));

export function demoAdapter(config) {
  const method = config.method.toUpperCase();
  const url = config.url.replace(/^\/+/, '/');
  const params = config.params ?? {};

  if (method === 'GET' && url === '/scholarships') {
    let items = DEMO_SCHOLARSHIPS;
    if (params.degree) items = items.filter((s) => s.degree === params.degree);
    if (params.country) items = items.filter((s) => s.country === params.country);
    if (params.scope) items = items.filter((s) => getScope(s) === params.scope);
    if (params.coverage === 'Full') items = items.filter((s) => s.coverage === 'Toàn phần');
    if (params.coverage === 'Partial') items = items.filter((s) => s.coverage === 'Một phần');
    if (params.search) {
      const q = String(params.search).toLowerCase();
      items = items.filter((s) => `${s.title} ${s.provider}`.toLowerCase().includes(q));
    }
    // Học bổng chưa công bố hạn nộp xếp cuối
    const time = (s) => (s.deadline ? new Date(s.deadline).getTime() : Infinity);
    items = [...items].sort((a, b) => time(a) - time(b) || 0);
    // Phân trang giống backend: page bắt đầu từ 1, limit mặc định 20
    const limit = Number(params.limit) || 20;
    const totalPages = Math.max(1, Math.ceil(items.length / limit));
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
    const data = items.slice((page - 1) * limit, page * limit);
    return ok(config, { success: true, data, meta: { page, limit, total: items.length, totalPages } });
  }
  if (method === 'GET' && url === '/scholarships/countries') {
    const countries = [...new Set(DEMO_SCHOLARSHIPS.map((s) => s.country))].sort();
    return ok(config, { success: true, data: countries });
  }
  const detail = url.match(/^\/scholarships\/([\w-]+)$/);
  if (method === 'GET' && detail) {
    const item = DEMO_SCHOLARSHIPS.find((s) => s.slug === detail[1] || s.id === detail[1]);
    return item ? ok(config, { success: true, data: item }) : fail(config, 'Không tìm thấy học bổng', 404);
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
  if (method === 'GET' && url === '/applications') {
    const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
    const find = (id) => DEMO_SCHOLARSHIPS.find((s) => s.id === id);
    const data = [
      { id: 'a1', status: 'submitted', applied_at: daysAgo(4), scholarship: find('d2') },
      { id: 'a2', status: 'draft', applied_at: null, scholarship: find('d9') },
    ];
    return ok(config, { success: true, data, meta: { page: 1, limit: 50, total: data.length } });
  }
  if (method === 'GET' && url === '/profile') return ok(config, { success: true, data: DEMO_PROFILE });
  if (method === 'POST' && url === '/auth/logout') return ok(config, { success: true });

  return fail(config, 'Bản demo chưa kết nối máy chủ, tính năng này tạm chưa dùng được');
}
