import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — tự động gắn token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — xử lý lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Xử lý 401 — token hết hạn hoặc không hợp lệ
      if (status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
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

export default api;
