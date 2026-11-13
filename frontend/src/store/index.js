import { configureStore } from '@reduxjs/toolkit';
import authReducer from '~/store/slices/authSlice';
import comparisonReducer from '~/store/slices/comparisonSlice';
import uiReducer from '~/store/slices/uiSlice';

const AUTH_STORAGE_KEY = 'scholarsgo.session';

function loadAuth() {
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    if (user?.full_name || user?.avatar_url) return { user, isAuthenticated: false, isLoading: true };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return { user: null, isAuthenticated: false, isLoading: false };
}

export const store = configureStore({
  reducer: { auth: authReducer, comparison: comparisonReducer, ui: uiReducer },
  preloadedState: { auth: loadAuth() },
});

let lastAuth = store.getState().auth;
store.subscribe(() => {
  const { auth } = store.getState();
  if (auth === lastAuth) return;
  lastAuth = auth;
  try {
    const summary = auth.user && { full_name: auth.user.full_name, avatar_url: auth.user.avatar_url };
    if (summary) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(summary));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // localStorage không khả dụng thì phiên vẫn nằm trong Redux.
  }
});
