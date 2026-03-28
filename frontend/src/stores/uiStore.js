import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Search filters
  searchFilters: {},
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  clearSearchFilters: () => set({ searchFilters: {} }),

  // Theme (future)
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
