import { createSlice } from '@reduxjs/toolkit';

// Phiên đăng nhập. Token nằm trong cookie httpOnly do server quản lý,
// store chỉ giữ thông tin hiển thị của user — KHÔNG lưu token ở đây.
const initialState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    loggedOut() {
      return initialState;
    },
    userUpdated(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { loggedIn, loggedOut, userUpdated } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
