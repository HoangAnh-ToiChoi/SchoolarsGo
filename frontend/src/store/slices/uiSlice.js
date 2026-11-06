import { createSlice } from '@reduxjs/toolkit';

// Trạng thái giao diện toàn cục. Chế độ tối chưa làm nên theme cố định 'light'.
const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'light' },
  reducers: {},
});

export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
