import { createSlice } from '@reduxjs/toolkit';

// So sánh tối đa 3 học bổng cùng lúc
export const MAX_COMPARE = 3;

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState: { items: [] },
  reducers: {
    compareToggled(state, action) {
      const scholarship = action.payload;
      const index = state.items.findIndex((s) => s.id === scholarship.id);
      if (index >= 0) state.items.splice(index, 1);
      else if (state.items.length < MAX_COMPARE) state.items.push(scholarship);
    },
    compareRemoved(state, action) {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    compareCleared(state) {
      state.items = [];
    },
  },
});

export const { compareToggled, compareRemoved, compareCleared } = comparisonSlice.actions;
export default comparisonSlice.reducer;

export const selectCompareItems = (state) => state.comparison.items;
export const selectIsCompared = (id) => (state) => state.comparison.items.some((s) => s.id === id);
