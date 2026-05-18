import { create } from 'zustand';

const THEME_KEY = 'scholarsgo-theme';

const getInitialTheme = () => {
  const raw = localStorage.getItem(THEME_KEY);
  if (!raw) return 'light';
  if (raw === 'dark' || raw === 'light') return raw;
  // Handle legacy zustand-persist JSON format: {"state":{"theme":"dark"},...}
  try {
    const theme = JSON.parse(raw)?.state?.theme;
    const resolved = theme === 'dark' || theme === 'light' ? theme : 'light';
    localStorage.setItem(THEME_KEY, resolved); // normalize to plain string
    return resolved;
  } catch {
    return 'light';
  }
};

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Search filters
  searchFilters: {},
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  clearSearchFilters: () => set({ searchFilters: {} }),

  // Theme — persisted to localStorage as plain string, applied as 'dark' class on <html>
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem(THEME_KEY, next);
      return { theme: next };
    }),
}));
