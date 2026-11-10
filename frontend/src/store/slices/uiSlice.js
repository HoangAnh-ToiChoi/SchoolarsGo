import { createSlice } from '@reduxjs/toolkit';

// Trạng thái giao diện toàn cục.
// - theme: chế độ tối chưa làm nên cố định 'light'
// - isFilterOpen: bảng bộ lọc dưới thanh tìm kiếm trên header đang mở hay đóng
const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'light', isFilterOpen: false },
  reducers: {
    filterOpened(state) {
      state.isFilterOpen = true;
    },
    filterClosed(state) {
      state.isFilterOpen = false;
    },
  },
});

export const { filterOpened, filterClosed } = uiSlice.actions;
export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
export const selectIsFilterOpen = (state) => state.ui.isFilterOpen;
