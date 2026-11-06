import { configureStore } from '@reduxjs/toolkit';
import authReducer from '~/store/slices/authSlice';
import comparisonReducer from '~/store/slices/comparisonSlice';
import uiReducer from '~/store/slices/uiSlice';

const AUTH_STORAGE_KEY = 'scholarsgo.auth';

// Khôi phục phiên đăng nhập sau khi tải lại trang (chỉ thông tin user, không có token)
function loadAuth() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    if (saved?.user && saved.isAuthenticated) return saved;
  } catch {
    // dữ liệu hỏng thì bỏ qua, coi như chưa đăng nhập
  }
  return undefined;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    comparison: comparisonReducer,
    ui: uiReducer,
  },
  preloadedState: { auth: loadAuth() },
});

let lastAuth = store.getState().auth;
store.subscribe(() => {
  const { auth } = store.getState();
  if (auth === lastAuth) return;
  lastAuth = auth;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // trình duyệt chặn localStorage thì chỉ giữ phiên trong bộ nhớ
  }
});
