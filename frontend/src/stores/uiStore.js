import { create } from 'zustand';

const THEME_KEY = 'scholarsgo-theme';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Search filters
  searchFilters: {},
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  clearSearchFilters: () => set({ searchFilters: {} }),

  // Theme — persisted to localStorage, applied as 'dark' class on <html>
  theme: localStorage.getItem(THEME_KEY) || 'light',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(THEME_KEY, next);
      return { theme: next };
    }),
}));
