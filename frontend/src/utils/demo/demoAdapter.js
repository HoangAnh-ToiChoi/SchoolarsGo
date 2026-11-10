import { DEMO_APPLICATIONS, DEMO_DOCUMENTS, DEMO_PROFILE, DEMO_SCHOLARSHIPS } from '~/utils/demo/demoData';
import { getDeadlineInfo, getScope, sortByDeadline } from '~/utils/scholarship';

// Axios adapter giả lập API cho bản demo tĩnh. Chỉ dùng khi VITE_DEMO_MODE=true.
// Dữ liệu sửa tại chỗ nên luôn trả bản sao: trả lại cùng một đối tượng thì React Query coi như không đổi.
const savedIds = new Set(['d1', 'd2', 'd3', 'd5']);
const readNotificationIds = new Set();

// Giả lập GET /notifications của backend: nhắc hạn ≤ 14 ngày cho học bổng đã lưu và đơn nháp
function demoNotifications() {
  const drafts = DEMO_APPLICATIONS.filter((a) => a.status === 'draft').map((a) => ({ scholarship: a.scholarships, application_id: a.id }));
  const draftIds = new Set(drafts.map((d) => d.scholarship.id));
  const saved = DEMO_SCHOLARSHIPS.filter((s) => savedIds.has(s.id) && !draftIds.has(s.id)).map((s) => ({ scholarship: s, application_id: null }));
  const items = [...drafts, ...saved]
    .map((item) => ({ ...item, days_left: getDeadlineInfo(item.scholarship.deadline).daysLeft }))
    .filter((item) => item.days_left !== null && item.days_left >= 0 && item.days_left <= 14)
    .map((item) => {
      const id = `n-${item.scholarship.id}`;
      return { id, type: 'deadline', ...item, read_at: readNotificationIds.has(id) ? new Date().toISOString() : null };
    });
  return sortByDeadline(items, (n) => n.scholarship.deadline);
}

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
    return ok(config, { success: true, data: DEMO_APPLICATIONS.map((a) => ({ ...a })), meta: { page: 1, limit: 50, total: DEMO_APPLICATIONS.length } });
  }
  const application = url.match(/^\/applications\/([\w-]+)$/);
  if (method === 'GET' && application) {
    const item = DEMO_APPLICATIONS.find((a) => a.id === application[1]);
    return item ? ok(config, { success: true, data: { ...item } }) : fail(config, 'Không tìm thấy đơn', 404);
  }
  if (method === 'PATCH' && application) {
    const item = DEMO_APPLICATIONS.find((a) => a.id === application[1]);
    if (!item) return fail(config, 'Không tìm thấy đơn', 404);
    const body = JSON.parse(config.data || '{}');
    // Giống backend: nộp đơn thì ghi ngày nộp
    if (item.status === 'draft' && body.status === 'submitted') item.applied_at = new Date().toISOString();
    ['status', 'notes', 'checklist', 'documents_used'].forEach((key) => {
      if (body[key] !== undefined) item[key] = body[key];
    });
    return ok(config, { success: true, data: { ...item } });
  }
  if (method === 'DELETE' && application) {
    const index = DEMO_APPLICATIONS.findIndex((a) => a.id === application[1]);
    if (index >= 0) DEMO_APPLICATIONS.splice(index, 1);
    return ok(config, { success: true, data: { deleted: true } });
  }
  if (method === 'GET' && url === '/documents') return ok(config, { success: true, data: [...DEMO_DOCUMENTS] });
  if (method === 'POST' && url === '/documents/upload') {
    // Bản demo không có nơi lưu tệp: chỉ ghi lại tên và dung lượng
    const file = config.data.get('file');
    const doc = { id: `doc${Date.now()}`, type: config.data.get('type'), file_name: file.name, file_url: null, file_size: file.size, created_at: new Date().toISOString() };
    DEMO_DOCUMENTS.unshift(doc);
    return ok(config, { success: true, data: doc });
  }
  if (method === 'GET' && url === '/notifications') {
    const data = demoNotifications();
    return ok(config, { success: true, data, meta: { unread: data.filter((n) => !n.read_at).length } });
  }
  if (method === 'PATCH' && url === '/notifications/readAll') {
    demoNotifications().forEach((n) => readNotificationIds.add(n.id));
    return ok(config, { success: true });
  }
  const notification = url.match(/^\/notifications\/([\w-]+)\/read$/);
  if (method === 'PATCH' && notification) {
    readNotificationIds.add(notification[1]);
    return ok(config, { success: true });
  }
  if (method === 'GET' && url === '/profile') return ok(config, { success: true, data: DEMO_PROFILE });
  if (method === 'POST' && url === '/auth/logout') return ok(config, { success: true });

  return fail(config, 'Bản demo chưa kết nối máy chủ, tính năng này tạm chưa dùng được');
}
