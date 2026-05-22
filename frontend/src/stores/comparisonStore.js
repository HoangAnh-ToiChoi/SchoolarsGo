import { create } from 'zustand';

export const useComparisonStore = create((set, get) => ({
  items: [],

  toggle: (scholarship) => {
    const { items } = get();
    const exists = items.find((s) => s.id === scholarship.id);
    if (exists) {
      set({ items: items.filter((s) => s.id !== scholarship.id) });
    } else if (items.length < 3) {
      set({ items: [...items, scholarship] });
    }
  },

  remove: (id) => set((state) => ({ items: state.items.filter((s) => s.id !== id) })),

  clear: () => set({ items: [] }),

  isSelected: (id) => get().items.some((s) => s.id === id),
}));
