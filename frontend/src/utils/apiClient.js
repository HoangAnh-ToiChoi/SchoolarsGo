import axios from 'axios';
import { API_BASE_URL } from '~/utils/constants';
import { store } from '~/store';
import { demoAdapter } from '~/utils/demo/demoAdapter';
import { loggedOut } from '~/store/slices/authSlice';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise;
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const refreshOnce = () => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const canRefresh = url => !NO_REFRESH.some(path => url?.includes(path));

const sessionEnded = code => {
  store.dispatch(loggedOut());
  localStorage.removeItem('scholarsgo.session');
  const redirect = `${window.location.pathname}${window.location.search}`;
  const reason = code === 'SESSION_REVOKED' ? '&reason=SESSION_REVOKED' : '';
  window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}${reason}`);
};

api.interceptors.response.use(response => response, async function(error) {
  const { response, config } = error;
  if (!response) return Promise.reject(new Error('Không thể kết nối máy chủ, vui lòng kiểm tra kết nối internet'));
  const { status, data } = response;

  if (status === 401 && data?.code === 'ACCESS_TOKEN_EXPIRED' && config && !config._authRetried && canRefresh(config.url)) {
    config._authRetried = true;
    try {
      await refreshOnce();
      return api(config);
    } catch (refreshError) {
      if (refreshError.response?.data?.code === 'REFRESH_RACE' && !config._raceRetried) {
        config._raceRetried = true;
        await new Promise(resolve => setTimeout(resolve, 250));
        config._authRetried = false;
        return api(config);
      }
      sessionEnded(refreshError.response?.data?.code);
      return Promise.reject(error);
    }
  }

  if (status === 401 && data?.code === 'SESSION_REVOKED') sessionEnded(data.code);
  if (status === 429) return Promise.reject(Object.assign(new Error('Quá nhiều yêu cầu, vui lòng thử lại sau'), { status, code: data?.code }));
  if (data?.message) return Promise.reject(Object.assign(new Error(data.message), { status, code: data.code }));
  return Promise.reject(error);
});

if (import.meta.env.VITE_DEMO_MODE === 'true') api.defaults.adapter = demoAdapter;

export default api;
