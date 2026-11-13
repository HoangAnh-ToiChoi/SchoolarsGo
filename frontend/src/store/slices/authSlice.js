import { createSlice } from '@reduxjs/toolkit';

// Phiên đăng nhập. Token nằm trong cookie httpOnly do server quản lý,
// store chỉ giữ thông tin hiển thị của user — KHÔNG lưu token ở đây.
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    loggedOut() {
      return initialState;
    },
    userUpdated(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    sessionLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { loggedIn, loggedOut, userUpdated, sessionLoading } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectAuthLoading = (state) => state.auth.isLoading;
