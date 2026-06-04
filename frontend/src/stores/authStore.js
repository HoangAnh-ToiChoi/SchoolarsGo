import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthResolved: false,

  login: (user) => {
    set({ user, isAuthenticated: true, isAuthResolved: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, isAuthResolved: true });
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isAuthResolved: true,
    });
  },

  setAuthResolved: (value = true) => {
    set({ isAuthResolved: value });
  },
}));
