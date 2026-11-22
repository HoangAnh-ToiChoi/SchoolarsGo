import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

// Các ngày hiển thị trên lưới lịch tháng (bắt đầu từ thứ Hai, gồm cả ngày tràn của tháng trước/sau)
export function getMonthDays(month) {
  const days = [];
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  for (let d = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }); d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}
