import axios from 'axios';
import { API_BASE_URL } from '~/utils/constants';
import { store } from '~/store';
import { demoAdapter } from '~/utils/demo/demoAdapter';
import { loggedOut } from '~/store/slices/authSlice';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — xử lý lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Xử lý 401 — token hết hạn hoặc không hợp lệ
      if (status === 401) {
        const onAuthPage = ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
        if (!onAuthPage) {
          store.dispatch(loggedOut());
          window.location.href = '/login';
        }
        return Promise.reject(new Error(data.message || 'Phiên đăng nhập đã hết hạn'));
      }

      // Xử lý 429 — rate limit
      if (status === 429) {
        return Promise.reject(new Error('Quá nhiều yêu cầu, vui lòng thử lại sau'));
      }

      // Trả về message từ server nếu có
      if (data.message) {
        return Promise.reject(new Error(data.message));
      }
    }

    // Lỗi mạng
    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối máy chủ, vui lòng kiểm tra kết nối internet'));
    }

    return Promise.reject(error);
  }
);

// Bản demo trên GitHub Pages không có backend: trả dữ liệu minh họa thay cho API thật
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  api.defaults.adapter = demoAdapter;
}

export default api;
